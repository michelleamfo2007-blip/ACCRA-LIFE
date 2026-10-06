import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { movePlayer } from "@/lib/server/net";
import { CLOUD_COOKIE, readSessionToken } from "@/lib/server/session";

export async function POST(request: Request) {
  const session = readSessionToken((await cookies()).get(CLOUD_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Log in again." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const ok = await movePlayer(session.uid, String(body?.where ?? ""), Number(body?.x), Number(body?.y));
  return NextResponse.json({ ok });
}
