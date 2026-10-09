import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Move } from "@/lib/game/boards";
import type { NetRef } from "@/lib/game/net";
import type { Life } from "@/lib/game/world";
import {
  answerChallenge,
  attendEvent,
  challenge,
  chipCrew,
  claimIdle,
  claimTurf,
  createCrew,
  crewView,
  declineCrew,
  gamesView,
  giftEvent,
  hostEvent,
  inviteCrew,
  joinCrew,
  leaderboard,
  leaveCrew,
  listEvents,
  playMove,
  sendCrew,
  shareCrewBank,
  turfView,
} from "@/lib/server/play";
import { CLOUD_COOKIE, readSessionToken } from "@/lib/server/session";
import { deliverHome, listPlayerShops } from "@/lib/server/live";
import { chartView, chopsAt, claimChart, eatAtChop, publishChop, weeklyView } from "@/lib/server/city";
import {
  buyListing,
  cancelListing,
  castVote,
  claimStipend,
  deletePost,
  electionView,
  fcAnswer,
  fcChallenge,
  fcView,
  feedView,
  followPlayer,
  likePost,
  listItem,
  makePost,
  replyToPost,
  marketView,
  runForOffice,
} from "@/lib/server/town";

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

function idOf(body: Record<string, unknown> | null) {
  const id = String(body?.id ?? "").trim();
  return /^[a-z0-9]{4,20}$/.test(id) ? id : "";
}

function lifeOf(body: Record<string, unknown> | null) {
  const life = body?.life as Life | undefined;
  return life && typeof life === "object" && typeof life.cash === "number" ? life : null;
}

function moveOf(value: unknown): Move {
  const raw = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const move: Move = {};
  for (const key of ["pit", "from", "to", "token", "roll"] as const) {
    const n = Number(raw[key]);
    if (raw[key] !== undefined && Number.isInteger(n)) move[key] = n;
  }
  return move;
}

function reply(error: string | null, extra: Record<string, unknown> = {}) {
  if (error) return NextResponse.json({ error }, { status: 400 });
  return NextResponse.json({ ok: true, ...extra });
}

function done(result: { error: string } | { life?: Life; note: string }) {
  return "error" in result ? reply(result.error) : reply(null, { life: result.life, note: result.note });
}

export async function GET(request: Request) {
  const username = await me();
  if (!username) return NextResponse.json({ error: "Log in again." }, { status: 401 });
  const view = new URL(request.url).searchParams.get("view");
  if (view === "crew") {
    const crew = await crewView(username);
    return crew ? NextResponse.json(crew) : NextResponse.json({ error: "Log in again." }, { status: 401 });
  }
  if (view === "events") return NextResponse.json({ events: await listEvents() });
  if (view === "games") return NextResponse.json({ games: (await gamesView(username)) ?? [] });
  if (view === "board") return NextResponse.json(await leaderboard());
  if (view === "feed") return NextResponse.json(await feedView(username, new URL(request.url).searchParams.get("tab") ?? "all"));
  if (view === "market") return NextResponse.json(await marketView(username));
  if (view === "fc") return NextResponse.json({ matches: await fcView(username) });
  if (view === "election") return NextResponse.json(await electionView(username));
  if (view === "chart") return NextResponse.json(await chartView(username));
  if (view === "weekly") return NextResponse.json(await weeklyView());
  if (view === "turf") return NextResponse.json(await turfView(username));
  if (view === "chops") {
    const spot = String(new URL(request.url).searchParams.get("spot") ?? "").slice(0, 40);
    return NextResponse.json({ spot, chops: await chopsAt(username, spot) });
  }
  if (view === "shops") return NextResponse.json({ shops: await listPlayerShops() });
  return reply("Unknown view.");
}

export async function POST(request: Request) {
  const username = await me();
  if (!username) return NextResponse.json({ error: "Log in again." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const action = String(body?.action ?? "");
  const ref = refOf(body);
  const life = lifeOf(body);
  switch (action) {
    case "crew-create":
      return reply(await createCrew(username, String(body?.name ?? ""), String(body?.tag ?? "")));
    case "crew-invite":
      return reply(await inviteCrew(username, handle(body?.to)));
    case "crew-join":
      return reply(ref ? await joinCrew(username, ref) : "That invite is gone.");
    case "crew-decline":
      return reply(ref ? await declineCrew(username, ref) : null);
    case "crew-leave":
      return reply(await leaveCrew(username));
    case "crew-chip":
      return life ? done(await chipCrew(username, Number(body?.amount), life)) : reply("Log in again.");
    case "crew-share":
      return reply(await shareCrewBank(username));
    case "crew-send":
      return reply(await sendCrew(username, String(body?.text ?? "")));
    case "event-host":
      return life ? done(await hostEvent(username, String(body?.kind ?? ""), String(body?.title ?? ""), String(body?.spot ?? ""), Number(body?.hours), life, Number(body?.door ?? 0))) : reply("Log in again.");
    case "event-attend": {
      if (!ref) return reply("That event is over.");
      const result = await attendEvent(username, ref, life);
      return "error" in result ? reply(result.error) : reply(null, { event: result.event, life: result.life });
    }
    case "turf-claim":
      return reply(await claimTurf(username));
    case "event-gift":
      return ref && life ? done(await giftEvent(username, ref, Number(body?.amount), life)) : reply("That event is over.");
    case "game-challenge":
      return life ? done(await challenge(username, handle(body?.to), String(body?.game ?? ""), Number(body?.stake), life)) : reply("Log in again.");
    case "game-answer":
      return ref && life ? done(await answerChallenge(username, ref, Boolean(body?.yes), life)) : reply("That challenge is gone.");
    case "game-move": {
      if (!ref) return reply("That game is not running.");
      const result = await playMove(username, ref, moveOf(body?.move));
      return "error" in result ? reply(result.error) : reply(null, { match: result.match });
    }
    case "game-claim":
      return reply(ref ? await claimIdle(username, ref) : "That game is not running.");
    case "feed-post":
      return life ? done(await makePost(username, String(body?.kind ?? ""), String(body?.text ?? ""), life, handle(body?.wall))) : reply("Log in again.");
    case "feed-like":
      return reply(ref ? await likePost(username, ref.owner, ref.id) : "That post is gone.");
    case "feed-reply":
      return reply(ref ? await replyToPost(username, ref.owner, ref.id, String(body?.text ?? "")) : "That post is gone.");
    case "feed-delete":
      return reply(ref ? await deletePost(username, ref.owner, ref.id) : idOf(body) ? await deletePost(username, username, idOf(body)) : "That post is gone.");
    case "feed-follow":
      return reply(await followPlayer(username, handle(body?.to)));
    case "market-list":
      return life ? done(await listItem(username, String(body?.kind ?? ""), String(body?.ref ?? ""), Number(body?.qty ?? 1), Number(body?.price), life)) : reply("Log in again.");
    case "market-cancel":
      return life && idOf(body) ? done(await cancelListing(username, idOf(body), life)) : reply("That listing is gone.");
    case "market-buy":
      return ref && life ? done(await buyListing(username, ref.owner, ref.id, life)) : reply("That listing is gone.");
    case "fc-challenge":
      return life ? done(await fcChallenge(username, handle(body?.to), Number(body?.stake), life)) : reply("Log in again.");
    case "fc-answer":
      return ref && life ? done(await fcAnswer(username, ref, Boolean(body?.yes), life)) : reply("That challenge is gone.");
    case "vote-run":
      return life ? done(await runForOffice(username, String(body?.pitch ?? ""), life)) : reply("Log in again.");
    case "vote-cast":
      return reply(await castVote(username, handle(body?.to)));
    case "vote-stipend":
      return reply(await claimStipend(username));
    case "chart-claim":
      return reply(await claimChart(username));
    case "chop-publish":
      return life ? reply(await publishChop(username, life)) : reply("Log in again.");
    case "chop-eat":
      return life && HANDLE.test(handle(body?.owner)) ? done(await eatAtChop(username, handle(body?.owner), String(body?.dish ?? "").slice(0, 20), life)) : reply("That chop bar is closed.");
    case "deliver-home":
      return reply(await deliverHome(username, handle(body?.to), String(body?.label ?? ""), String(body?.rider ?? "")));
    default:
      return reply("Unknown action.");
  }
}
