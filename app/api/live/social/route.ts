import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { BondStage, NetRef } from "@/lib/game/net";
import type { Life } from "@/lib/game/world";
import {
  answerBond,
  askBond,
  blockPlayer,
  claimReferral,
  createGroup,
  createSusu,
  endBond,
  hostHome,
  invitePlayer,
  leaveGroup,
  leaveSusu,
  paySusu,
  readGroup,
  referralView,
  reportPlayer,
  sendGroup,
  socialView,
} from "@/lib/server/net";
import { CLOUD_COOKIE, readSessionToken } from "@/lib/server/session";

const HANDLE = /^[a-z0-9_]{3,16}$/;

async function me() {
  return readSessionToken((await cookies()).get(CLOUD_COOKIE)?.value)?.uid ?? null;
}

function handle(value: unknown) {
  return String(value ?? "").trim().toLowerCase().replace(/^@/, "");
}

function refOf(body: Record<string, unknown> | null): NetRef | null {
  const owner = handle(body?.owner);
  const id = String(body?.id ?? "").trim();
  if (!HANDLE.test(owner) || !/^[a-z0-9]{4,20}$/.test(id)) return null;
  return { owner, id };
}

function lifeOf(body: Record<string, unknown> | null) {
  const life = body?.life as Life | undefined;
  return life && typeof life === "object" && typeof life.cash === "number" ? life : null;
}

function reply(error: string | null, extra: Record<string, unknown> = {}) {
  if (error) return NextResponse.json({ error }, { status: 400 });
  return NextResponse.json({ ok: true, ...extra });
}

export async function GET(request: Request) {
  const username = await me();
  if (!username) return NextResponse.json({ error: "Log in again." }, { status: 401 });
  const url = new URL(request.url);
  const group = url.searchParams.get("group");
  if (group) {
    const [owner, id] = group.split(":");
    const ref = refOf({ owner, id });
    const found = ref ? await readGroup(username, ref) : null;
    if (!found) return NextResponse.json({ error: "You are not in that group." }, { status: 404 });
    return NextResponse.json({ group: { name: found.name, members: found.members, messages: found.messages.map((mail) => ({ who: mail.from === username ? "me" : "them", from: mail.from, text: mail.text, time: mail.time })) } });
  }
  if (url.searchParams.get("view") === "refer") {
    const refer = await referralView(username);
    return refer ? NextResponse.json(refer) : NextResponse.json({ error: "Log in again." }, { status: 401 });
  }
  const host = url.searchParams.get("home");
  if (host) {
    const home = await hostHome(username, handle(host));
    if (!home) return NextResponse.json({ error: "You need an invite to visit." }, { status: 403 });
    return NextResponse.json({ home });
  }
  const view = await socialView(username);
  if (!view) return NextResponse.json({ error: "Log in again." }, { status: 401 });
  return NextResponse.json(view);
}

export async function POST(request: Request) {
  const username = await me();
  if (!username) return NextResponse.json({ error: "Log in again." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const action = String(body?.action ?? "");
  const ref = refOf(body);
  const life = lifeOf(body);
  switch (action) {
    case "susu-create":
      return reply(await createSusu(username, String(body?.name ?? ""), Number(body?.amount), body?.members));
    case "susu-pay": {
      if (!ref || !life) return reply("Nothing to pay.");
      const result = await paySusu(username, ref, life);
      return "error" in result ? reply(result.error) : reply(null, { life: result.life, note: result.note });
    }
    case "susu-leave":
      return reply(ref ? await leaveSusu(username, ref) : "That susu is gone.");
    case "group-create": {
      const result = await createGroup(username, String(body?.name ?? ""), body?.members);
      return "error" in result ? reply(result.error) : reply(null, { ref: result.ref });
    }
    case "group-send":
      return reply(ref ? await sendGroup(username, ref, String(body?.text ?? "")) : "You are not in that group.");
    case "group-leave":
      return reply(ref ? await leaveGroup(username, ref) : "You are not in that group.");
    case "bond-ask": {
      const kind = String(body?.kind ?? "") as BondStage;
      if (!["dating", "engaged", "married"].includes(kind) || !life) return reply("Pick what to ask.");
      const result = await askBond(username, handle(body?.to), kind, life);
      return "error" in result ? reply(result.error ?? "The request did not send.") : reply(null, { life: result.life, note: result.note });
    }
    case "bond-answer": {
      if (!life) return reply("Log in again.");
      const result = await answerBond(username, handle(body?.from), Boolean(body?.yes), life);
      return "error" in result ? reply(result.error ?? "That request is gone.") : reply(null, { life: result.life, note: result.note });
    }
    case "bond-end":
      return reply(await endBond(username));
    case "invite":
      return reply(await invitePlayer(username, handle(body?.to)));
    case "block":
      return reply(await blockPlayer(username, handle(body?.to), true));
    case "unblock":
      return reply(await blockPlayer(username, handle(body?.to), false));
    case "report":
      return reply(await reportPlayer(username, handle(body?.to), String(body?.reason ?? ""), String(body?.quote ?? "")));
    case "refer-claim":
      return reply(await claimReferral(username, handle(body?.to)));
    default:
      return reply("Unknown action.");
  }
}
