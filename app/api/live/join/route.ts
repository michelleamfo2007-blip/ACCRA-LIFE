import { NextResponse } from "next/server";
import { rollBirth } from "@/lib/game/world";
import { digestPassword } from "@/lib/game/save";
import { createPlayer, readPlayer, updateLife } from "@/lib/server/live";
import { withNet } from "@/lib/server/net";
import { CLOUD_COOKIE, createSessionToken, sessionCookie } from "@/lib/server/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const username = String(body?.username ?? "")
    .trim()
    .toLowerCase()
    .replace(/^@/, "");
  const password = String(body?.password ?? "");
  const name = String(body?.name ?? "").trim();
  const email = String(body?.email ?? "").trim();
  if (!/^[a-z0-9_]{3,16}$/.test(username)) {
    return NextResponse.json({ error: "Username is 3–16 letters, numbers, or underscores." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password needs at least 6 characters." }, { status: 400 });
  }
  if (name.length < 2) {
    return NextResponse.json({ error: "Tell us the name people call you." }, { status: 400 });
  }
  if (body?.adult !== true) {
    return NextResponse.json({ error: "Accra Life is for players 18 and older." }, { status: 400 });
  }
  if (await readPlayer(username)) {
    return NextResponse.json({ error: "That username is already living in Accra." }, { status: 409 });
  }
  const birthId = typeof body?.birthId === "string" && body.birthId ? body.birthId : rollBirth().id;
  const player = {
    username,
    name,
    email,
    passwordHash: await digestPassword(username, password),
    birthId,
    life: null,
    createdAt: new Date().toISOString(),
  };
  const error = await createPlayer(player);
  if (error) return NextResponse.json({ error }, { status: error.includes("already") ? 409 : 503 });
  const ref = String(body?.ref ?? "").trim().toLowerCase().replace(/^@/, "");
  if (/^[a-z0-9_]{3,16}$/.test(ref) && ref !== username && (await readPlayer(ref))?.life) {
    await updateLife(ref, (life) => withNet(life, (net) => ({ ...net, referrals: [...(net.referrals ?? []).filter((item) => item.username !== username), { username, at: new Date().toISOString() }].slice(-50) })));
  }
  const response = NextResponse.json({ account: { ...player, cloud: true } });
  response.cookies.set(CLOUD_COOKIE, createSessionToken({ id: username, role: "user" }), sessionCookie);
  return response;
}
