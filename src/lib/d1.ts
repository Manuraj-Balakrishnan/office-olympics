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

/**
 * Returns the D1 binding when running under OpenNext / Wrangler.
 * Returns null only for plain Node scripts (`npm run build` typecheck paths).
 */
export async function getDB(): Promise<D1DatabaseLike | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const db = (env as { DB?: D1DatabaseLike }).DB;
    return db ?? null;
  } catch {
    return null;
  }
}

/** Prefer failing loudly over silent in-memory sessions (those vanish across isolates). */
export async function requireDB(): Promise<D1DatabaseLike> {
  const db = await getDB();
  if (!db) {
    throw new Error(
      "Cloudflare D1 is not available. Run `npm run cf:migrate:local` for local dev, or bind DB in wrangler.jsonc before deploying.",
    );
  }
  return db;
}
