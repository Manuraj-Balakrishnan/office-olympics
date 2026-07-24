import { getCloudflareContext } from "@opennextjs/cloudflare";

/** Minimal D1 surface used by the session store (avoids hard dep on workers-types at build). */
export type D1DatabaseLike = {
  prepare: (query: string) => {
    bind: (...values: unknown[]) => {
      first: <T = unknown>() => Promise<T | null>;
      run: () => Promise<unknown>;
      all: <T = unknown>() => Promise<{ results: T[] }>;
    };
  };
};

type HttpQueryResult = {
  results?: unknown[];
  success?: boolean;
};

type CloudflareQueryResponse = {
  success: boolean;
  errors?: Array<{ message?: string }>;
  result?: HttpQueryResult[];
};

function httpConfig() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
  if (!accountId || !apiToken || !databaseId) return null;
  return { accountId, apiToken, databaseId };
}

/** D1 via Cloudflare REST API — used on Vercel / Node when Worker bindings are absent. */
function createHttpDB(cfg: NonNullable<ReturnType<typeof httpConfig>>): D1DatabaseLike {
  async function query(sql: string, params: unknown[]): Promise<HttpQueryResult> {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${cfg.accountId}/d1/database/${cfg.databaseId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cfg.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sql, params }),
      },
    );
    const json = (await res.json()) as CloudflareQueryResponse;
    if (!res.ok || !json.success) {
      const msg = json.errors?.[0]?.message || `D1 HTTP ${res.status}`;
      throw new Error(msg);
    }
    return json.result?.[0] ?? { results: [] };
  }

  return {
    prepare(sql: string) {
      return {
        bind(...values: unknown[]) {
          return {
            async first<T>() {
              const result = await query(sql, values);
              const row = result.results?.[0];
              return (row as T) ?? null;
            },
            async run() {
              return query(sql, values);
            },
            async all<T>() {
              const result = await query(sql, values);
              return { results: (result.results ?? []) as T[] };
            },
          };
        },
      };
    },
  };
}

/**
 * Prefer Workers D1 binding (Cloudflare deploy).
 * Fall back to D1 HTTP API when `CLOUDFLARE_*` env vars are set (Vercel).
 */
export async function getDB(): Promise<D1DatabaseLike | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const db = (env as { DB?: D1DatabaseLike }).DB;
    if (db) return db;
  } catch {
    // Not running inside OpenNext / Workers
  }

  const cfg = httpConfig();
  if (cfg) return createHttpDB(cfg);

  return null;
}

export async function requireDB(): Promise<D1DatabaseLike> {
  const db = await getDB();
  if (!db) {
    if (process.env.VERCEL) {
      throw new Error(
        "Cloudflare D1 is required on Vercel. Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, and CLOUDFLARE_D1_DATABASE_ID in the Vercel project env.",
      );
    }
    throw new Error(
      "Cloudflare D1 is not available. Run `npm run cf:migrate:local` for local Workers-backed next dev, or set CLOUDFLARE_* env vars.",
    );
  }
  return db;
}
