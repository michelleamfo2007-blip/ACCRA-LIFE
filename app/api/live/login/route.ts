import { NextResponse } from "next/server";
import { digestPassword } from "@/lib/game/save";
import { loginPlayer } from "@/lib/server/live";
import { CLOUD_COOKIE, createSessionToken, sessionCookie } from "@/lib/server/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const username = String(body?.username ?? "")
    .trim()
    .toLowerCase()
    .replace(/^@/, "");
  const password = String(body?.password ?? "");
  if (!/^[a-z0-9_]{3,16}$/.test(username) || password.length < 6) {
    return NextResponse.json({ error: "That username and password do not match." }, { status: 401 });
  }
  const player = await loginPlayer(username, await digestPassword(username, password));
  if (!player) return NextResponse.json({ error: "That username and password do not match." }, { status: 401 });
  const response = NextResponse.json({ account: { ...player, cloud: true } });
  response.cookies.set(CLOUD_COOKIE, createSessionToken({ id: username, role: "user" }), sessionCookie);
  return response;
}
