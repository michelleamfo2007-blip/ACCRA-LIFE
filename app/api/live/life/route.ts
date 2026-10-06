import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readPlayer, savePlayer } from "@/lib/server/live";
import { CLOUD_COOKIE, readSessionToken } from "@/lib/server/session";
import type { Life } from "@/lib/game/world";

export async function POST(request: Request) {
  const token = (await cookies()).get(CLOUD_COOKIE)?.value;
  const session = readSessionToken(token);
  if (!session) return NextResponse.json({ error: "Log in again." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const life = body?.life as Life | null;
  if (!life || typeof life !== "object") return NextResponse.json({ error: "Nothing to save." }, { status: 400 });
  const player = await readPlayer(session.uid);
  if (!player) return NextResponse.json({ error: "That username is not in Accra." }, { status: 404 });
  const kept = (player.life as { chats?: unknown } | null)?.chats;
  const saved = await savePlayer({ ...player, life: { ...life, ...(kept ? { chats: kept } : {}) } });
  if (!saved) return NextResponse.json({ error: "The city could not save this life." }, { status: 503 });
  return NextResponse.json({ ok: true });
}
