import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/server/password";
import { SESSION_COOKIE, createSessionToken, sessionCookie } from "@/lib/server/session";
import { readStore, toPublicUser } from "@/lib/server/store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  const user = readStore().users.find((item) => item.email === email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Those details don't match an AccraLife account." }, { status: 401 });
  }
  const response = NextResponse.json({ user: toPublicUser(user) });
  response.cookies.set(SESSION_COOKIE, createSessionToken(user), sessionCookie);
  return response;
}
