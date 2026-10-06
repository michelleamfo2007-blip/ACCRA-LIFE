import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { saveMergedLife } from "@/lib/server/live";
import { CLOUD_COOKIE, readSessionToken } from "@/lib/server/session";
import type { Life } from "@/lib/game/world";

export async function POST(request: Request) {
  const token = (await cookies()).get(CLOUD_COOKIE)?.value;
  const session = readSessionToken(token);
  if (!session) return NextResponse.json({ error: "Log in again." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const life = body?.life as Life | null;
  if (!life || typeof life !== "object" || typeof life.cash !== "number") return NextResponse.json({ error: "Nothing to save." }, { status: 400 });
  const saved = await saveMergedLife(session.uid, life);
  if (!saved) return NextResponse.json({ error: "The city could not save this life." }, { status: 503 });
  return NextResponse.json({ ok: true, life: saved });
}
