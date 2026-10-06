import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Life } from "@/lib/game/world";
import { sendMoney } from "@/lib/server/live";
import { CLOUD_COOKIE, readSessionToken } from "@/lib/server/session";

export async function POST(request: Request) {
  const token = (await cookies()).get(CLOUD_COOKIE)?.value;
  const session = readSessionToken(token);
  if (!session) return NextResponse.json({ error: "Log in again." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const to = String(body?.to ?? "").trim().toLowerCase().replace(/^@/, "");
  const amount = Number(body?.amount);
  const life = body?.life as Life | null;
  if (!life || typeof life !== "object" || typeof life.cash !== "number") {
    return NextResponse.json({ error: "Nothing to send." }, { status: 400 });
  }
  const result = await sendMoney(session.uid, to, amount, life);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.error === "Log in again." ? 401 : 400 });
  return NextResponse.json(result);
}
