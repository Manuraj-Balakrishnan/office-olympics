import { NextResponse } from "next/server";
import { getSessionByCode, joinSession, publicSession } from "@/lib/sessionStore";
import type { JoinSessionInput } from "@/types/tournament";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as JoinSessionInput;
    if (!body.code || !body.name) {
      return NextResponse.json({ error: "code and name required" }, { status: 400 });
    }
    const { session, player } = joinSession(body);
    return NextResponse.json({
      session: publicSession(session),
      player,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Join failed";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "code required" }, { status: 400 });
  }
  const session = getSessionByCode(code);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  return NextResponse.json({ session: publicSession(session) });
}
