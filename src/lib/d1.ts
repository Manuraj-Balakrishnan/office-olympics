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

export async function getDB(): Promise<D1DatabaseLike | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const db = (env as { DB?: D1DatabaseLike }).DB;
    return db ?? null;
  } catch {
    // next build / plain node scripts without Workers bindings
    return null;
  }
}
