import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { listChats, readChat, sendChat } from "@/lib/server/live";
import { CLOUD_COOKIE, readSessionToken } from "@/lib/server/session";

async function me() {
  const token = (await cookies()).get(CLOUD_COOKIE)?.value;
  return readSessionToken(token)?.uid ?? null;
}

export async function GET(request: Request) {
  const username = await me();
  if (!username) return NextResponse.json({ error: "Log in again." }, { status: 401 });
  const withUser = new URL(request.url).searchParams.get("with")?.trim().toLowerCase().replace(/^@/, "") ?? "";
  if (!withUser) {
    const threads = await listChats(username);
    return NextResponse.json({ threads });
  }
  const messages = await readChat(username, withUser);
  return NextResponse.json({ messages });
}

export async function POST(request: Request) {
  const username = await me();
  if (!username) return NextResponse.json({ error: "Log in again." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const to = String(body?.to ?? "").trim().toLowerCase().replace(/^@/, "");
  const text = String(body?.text ?? "");
  if (!/^[a-z0-9_]{3,16}$/.test(to)) return NextResponse.json({ error: "That username is not in Accra." }, { status: 400 });
  const error = await sendChat(username, to, text);
  if (error) return NextResponse.json({ error }, { status: error === "Log in again." ? 401 : 404 });
  const messages = await readChat(username, to);
  return NextResponse.json({ messages });
}
