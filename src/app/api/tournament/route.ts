interface D1PreparedStatement {
  bind: (...values: unknown[]) => D1PreparedStatement;
  run: () => Promise<unknown>;
}

interface D1DatabaseLike {
  prepare: (query: string) => D1PreparedStatement;
}

/**
 * Tournament sync API.
 * When deployed with OpenNext + Cloudflare D1, set env.DB.
 * Locally (no binding), requests succeed as no-ops so localStorage remains source of truth.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id =
      typeof body === "object" && body && "id" in body && typeof body.id === "string"
        ? body.id
        : "local-session";

    // Cloudflare D1 binding via OpenNext cloudflare context (optional)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cloudflare = (globalThis as any)[Symbol.for("cloudflare.context")] as
      | { env?: { DB?: D1DatabaseLike } }
      | undefined;
    const db = cloudflare?.env?.DB;

    if (db) {
      await db
        .prepare(
          `INSERT INTO tournaments (id, payload, updated_at)
           VALUES (?, ?, datetime('now'))
           ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = datetime('now')`,
        )
        .bind(id, JSON.stringify(body))
        .run();
      return Response.json({ ok: true, stored: "d1" });
    }

    return Response.json({ ok: true, stored: "skipped-no-d1" });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return Response.json({
    ok: true,
    message: "POST tournament JSON to sync to Cloudflare D1 when configured.",
  });
}
