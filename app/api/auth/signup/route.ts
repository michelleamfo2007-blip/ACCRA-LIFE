import { NextResponse } from "next/server";
import { clean } from "@/lib/server/guard";
import { hashPassword } from "@/lib/server/password";
import { SESSION_COOKIE, createSessionToken, sessionCookie } from "@/lib/server/session";
import { toPublicUser, uid, updateStore } from "@/lib/server/store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = clean(body?.name, 80);
  const email = clean(body?.email, 120).toLowerCase();
  const password = String(body?.password ?? "");
  if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
    return NextResponse.json({ error: "Use your name, a real email, and a password of at least 8 characters." }, { status: 400 });
  }
  const created = await updateStore((store) => {
    if (store.users.some((user) => user.email === email)) return null;
    const user = {
      id: uid("usr"),
      name,
      email,
      passwordHash: hashPassword(password),
      role: "user" as const,
      createdAt: new Date().toISOString(),
    };
    store.users.push(user);
    return user;
  });
  if (!created) return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  const response = NextResponse.json({ user: toPublicUser(created) });
  response.cookies.set(SESSION_COOKIE, createSessionToken(created), sessionCookie);
  return response;
}
