import { NextResponse } from "next/server";
import { createSession, publicSession } from "@/lib/sessionStore";
import type { CreateSessionInput } from "@/types/tournament";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateSessionInput;
    if (!body.mode || !body.pacing) {
      return NextResponse.json({ error: "mode and pacing required" }, { status: 400 });
    }
    const session = await createSession(body);
    return NextResponse.json({
      session: publicSession(session),
      hostToken: session.hostToken,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create" },
      { status: 500 },
    );
  }
}
