import { getDB } from "@/lib/d1";

/**
 * Optional sync of classic (localStorage) tournament snapshots.
 * Uses Cloudflare D1 when the DB binding is available; otherwise no-ops.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id =
      typeof body === "object" && body && "id" in body && typeof body.id === "string"
        ? body.id
        : "local-session";

    const db = await getDB();
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
