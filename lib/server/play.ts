import "server-only";
import { earnedBadges } from "@/lib/game/badges";
import { bizKind } from "@/lib/game/biz-table";
import { applyMove, rollDie, startBoard, type GameKind, type Move } from "@/lib/game/boards";
import { vehicleOf } from "@/lib/game/fleet";
import { carOf } from "@/lib/game/garage";
import { CODE_LABEL, EVENT_INFO, crewGoal, crewWeek, type Crew, type EventKind, type LifeEvent, type Match, type NetRef } from "@/lib/game/net";
import { SPOTS, cedis, type Life } from "@/lib/game/world";
import { chargePlayer, creditPlayer, readPlayer, sendChat, updateLife } from "@/lib/server/live";
import { accraTime, netOf, newId, withNet } from "@/lib/server/net";
import { supabase } from "@/lib/server/supabase";

const HANDLE = /^[a-z0-9_]{3,16}$/;
const GAMES: GameKind[] = ["oware", "draughts", "ludo"];

type Done = { error: string } | { life?: Life; note: string };
type Row = { username: string; name: string; life: Life | null };

let crowd: { at: number; rows: Row[] } | null = null;

export async function everyone(fresh = false): Promise<Row[]> {
  if (!fresh && crowd && Date.now() - crowd.at < 30000) return crowd.rows;
  const client = supabase();
  if (!client) return [];
  const { data } = await client.from("players").select("username, name, life").limit(2000);
  const rows = (data ?? []) as Row[];
  crowd = { at: Date.now(), rows };
  return rows;
}

export function forget() {
  crowd = null;
}

async function myCrewRef(username: string): Promise<NetRef | null> {
  const me = await readPlayer(username);
  const net = netOf(me?.life);
  if (net.crew) return { owner: username, id: net.crew.id };
  return net.crewIn ?? null;
}

async function loadCrew(ref: NetRef) {
  const owner = await readPlayer(ref.owner);
  const crew = netOf(owner?.life).crew;
  return crew && crew.id === ref.id ? crew : null;
}

function rolled(crew: Crew): Crew {
  const week = crewWeek();
  return crew.week === week ? crew : { ...crew, week, raised: 0 };
}

async function myCrew(username: string) {
  const ref = await myCrewRef(username);
  const crew = ref ? await loadCrew(ref) : null;
  return crew && crew.members.includes(username) ? { ref: ref!, crew } : null;
}

export async function crewView(username: string) {
  const me = await readPlayer(username);
  if (!me?.life) return null;
  const found = await myCrew(username);
  const crew = found ? rolled(found.crew) : null;
  return {
    crew: crew
      ? {
          id: crew.id,
          owner: crew.owner,
          name: crew.name,
          tag: crew.tag,
          members: crew.members,
          bank: crew.bank,
          raised: crew.raised,
          goal: crewGoal(crew),
          level: crew.level,
          won: crew.wonWeek === crew.week,
          mine: crew.owner === username,
          messages: crew.messages.slice(-60).map((mail) => ({ who: mail.from === username ? "me" : "them", from: mail.from, text: mail.text, time: mail.time })),
        }
      : null,
    asks: netOf(me.life).crewAsks ?? [],
  };
}

export async function createCrew(username: string, name: string, tag: string) {
  const title = name.trim().replace(/\s+/g, " ").slice(0, 24);
  const mark = tag.trim().toUpperCase();
  if (title.length < 3) return "Name the crew (3 letters or more).";
  if (!/^[A-Z0-9]{2,4}$/.test(mark)) return "The tag is 2 to 4 letters or numbers.";
  if (await myCrew(username)) return "Leave your current crew first.";
  const crew: Crew = { id: newId(), name: title, tag: mark, owner: username, members: [username], bank: 0, week: crewWeek(), raised: 0, level: 1, messages: [] };
  const saved = await updateLife(username, (life) => withNet(life, (net) => ({ ...net, crew, crewIn: null })));
  return saved ? null : "The crew did not save.";
}

export async function inviteCrew(username: string, to: string) {
  const me = await readPlayer(username);
  const crew = netOf(me?.life).crew;
  if (!crew) return "Only the crew owner can invite.";
  if (!HANDLE.test(to) || to === username) return "Pick a real username.";
  if (crew.members.includes(to)) return `@${to} is already in the crew.`;
  if (crew.members.length >= 12) return "A crew holds 12.";
  const them = await readPlayer(to);
  if (!them?.life) return "Nobody in Accra goes by that name.";
  const saved = await updateLife(to, (life) => withNet(life, (net) => ({ ...net, crewAsks: [...(net.crewAsks ?? []).filter((ask) => ask.id !== crew.id), { owner: username, id: crew.id, name: crew.name, at: new Date().toISOString() }].slice(-8) })));
  if (!saved) return "The invite did not send.";
  await sendChat(username, to, `🛡️ Join my crew [${crew.tag}] ${crew.name}. Open Crews on your phone.`);
  return null;
}

export async function joinCrew(username: string, ref: NetRef) {
  const me = await readPlayer(username);
  const ask = (netOf(me?.life).crewAsks ?? []).find((item) => item.id === ref.id && item.owner === ref.owner);
  if (!ask) return "That invite is gone.";
  if (await myCrew(username)) return "Leave your current crew first.";
  const crew = await loadCrew(ref);
  if (!crew) return "That crew is gone.";
  if (crew.members.length >= 12) return "The crew is full.";
  const saved = await updateLife(ref.owner, (life) => withNet(life, (net) => (net.crew?.id === ref.id ? { ...net, crew: { ...net.crew, members: [...new Set([...net.crew.members, username])] } } : net)));
  if (!saved) return "Joining did not save.";
  await updateLife(username, (life) => withNet(life, (net) => ({ ...net, crewIn: ref, crewAsks: (net.crewAsks ?? []).filter((item) => item.id !== ref.id) })));
  return null;
}

export async function declineCrew(username: string, ref: NetRef) {
  await updateLife(username, (life) => withNet(life, (net) => ({ ...net, crewAsks: (net.crewAsks ?? []).filter((item) => item.id !== ref.id) })));
  return null;
}

export async function leaveCrew(username: string) {
  const found = await myCrew(username);
  if (!found) return "You are not in a crew.";
  const { crew, ref } = found;
  if (crew.owner === username) {
    const share = crew.members.length ? Math.floor(crew.bank / crew.members.length) : 0;
    for (const member of crew.members) {
      if (share > 0) await creditPlayer(member, share, `[${crew.tag}] ${crew.name} closed. Your share of the bank: ${cedis(share)}.`, "crew");
      if (member !== username) await updateLife(member, (life) => withNet(life, (net) => (net.crewIn?.id === crew.id ? { ...net, crewIn: null } : net)));
    }
    await updateLife(username, (life) => withNet(life, (net) => ({ ...net, crew: null })));
    return null;
  }
  await updateLife(ref.owner, (life) => withNet(life, (net) => (net.crew?.id === crew.id ? { ...net, crew: { ...net.crew, members: net.crew.members.filter((name) => name !== username) } } : net)));
  await updateLife(username, (life) => withNet(life, (net) => ({ ...net, crewIn: null })));
  return null;
}

function crewNote(crew: Crew, text: string): Crew {
  return { ...crew, messages: [...crew.messages, { from: "crew", text, time: accraTime(), at: new Date().toISOString() }].slice(-120) };
}

export async function chipCrew(username: string, amount: number, latest: Life): Promise<Done> {
  const found = await myCrew(username);
  if (!found) return { error: "You are not in a crew." };
  const value = Math.round(amount);
  if (!Number.isFinite(value) || value < 10 || value > 5000) return { error: "Chip in between ₵10 and ₵5,000." };
  const charged = await chargePlayer(username, value, latest, `You chipped ${cedis(value)} into [${found.crew.tag}] ${found.crew.name}.`, "crew");
  if ("error" in charged) return { error: charged.error ?? "The payment did not go through." };
  let levelled = false;
  const saved = await updateLife(found.ref.owner, (life) =>
    withNet(life, (net) => {
      if (net.crew?.id !== found.ref.id) return net;
      let crew = rolled(net.crew);
      crew = { ...crew, bank: crew.bank + value, raised: crew.raised + value };
      crew = crewNote(crew, `@${username} chipped in ${cedis(value)}.`);
      if (crew.raised >= crewGoal(crew) && crew.wonWeek !== crew.week) {
        crew = crewNote({ ...crew, level: crew.level + 1, wonWeek: crew.week }, `🏆 Weekly challenge done. The crew is level ${crew.level + 1}.`);
        levelled = true;
      }
      return { ...net, crew };
    }),
  );
  if (!saved) {
    await creditPlayer(username, value, `Refund: the crew bank did not record ${cedis(value)}.`, "refund");
    return { error: "The crew bank did not update. Your money is coming back." };
  }
  return { life: charged.life, note: levelled ? "Weekly challenge done! Your crew levelled up." : `Chipped in ${cedis(value)}.` };
}

export async function shareCrewBank(username: string) {
  const found = await myCrew(username);
  if (!found || found.crew.owner !== username) return "Only the crew owner can share the bank.";
  const crew = found.crew;
  const share = Math.floor(crew.bank / crew.members.length);
  if (share < 1) return "The bank is empty.";
  const saved = await updateLife(username, (life) => withNet(life, (net) => (net.crew?.id === crew.id ? { ...net, crew: crewNote({ ...net.crew, bank: net.crew.bank - share * crew.members.length }, `The bank paid ${cedis(share)} to each member.`) } : net)));
  if (!saved) return "The bank did not update.";
  for (const member of crew.members) await creditPlayer(member, share, `[${crew.tag}] crew bank paid you ${cedis(share)}.`, "crew");
  return null;
}

export async function sendCrew(username: string, text: string) {
  const body = text.trim().slice(0, 500);
  if (!body) return "Write something first.";
  const found = await myCrew(username);
  if (!found) return "You are not in a crew.";
  const saved = await updateLife(found.ref.owner, (life) =>
    withNet(life, (net) => (net.crew?.id === found.ref.id ? { ...net, crew: { ...net.crew, messages: [...net.crew.messages, { from: username, text: body, time: accraTime(), at: new Date().toISOString() }].slice(-120) } } : net)),
  );
  return saved ? null : "The message did not save.";
}

export async function hostEvent(username: string, kind: string, title: string, spot: string, startsIn: number, latest: Life): Promise<Done> {
  const info = EVENT_INFO[kind as EventKind];
  if (!info) return { error: "Pick what kind of event." };
  const place = SPOTS.find((item) => item.id === spot && !item.soon && item.id !== "home");
  if (!place) return { error: "Pick a real place in town." };
  const hours = Math.round(startsIn);
  if (!Number.isFinite(hours) || hours < 0 || hours > 48) return { error: "Start it within the next two days." };
  const me = await readPlayer(username);
  const now = Date.now();
  const live = (netOf(me?.life).events ?? []).filter((item) => Date.parse(item.endsAt) > now);
  if (live.length >= 2) return { error: "You already have two events coming up." };
  const charged = await chargePlayer(username, info.cost, latest, `You paid ${cedis(info.cost)} to host a ${info.label.toLowerCase()} at ${place.name}.`, "event");
  if ("error" in charged) return { error: charged.error ?? "The payment did not go through." };
  const start = now + hours * 3600000;
  const event: LifeEvent = {
    id: newId(),
    host: username,
    kind: kind as EventKind,
    title: title.trim().slice(0, 40) || `${info.label} at ${place.name}`,
    spot: place.id,
    startsAt: new Date(start).toISOString(),
    endsAt: new Date(start + 4 * 3600000).toISOString(),
    code: info.code,
    attendees: [],
    gifts: 0,
  };
  const saved = await updateLife(username, (life) => withNet(life, (net) => ({ ...net, events: [...(net.events ?? []).filter((item) => Date.parse(item.endsAt) > now), event].slice(-5) })));
  if (!saved) {
    await creditPlayer(username, info.cost, "Refund: your event did not save.", "refund");
    return { error: "The event did not save. Your money is coming back." };
  }
  forget();
  return { life: charged.life, note: `${info.emoji} ${event.title}. Dress code: ${CODE_LABEL[event.code]}.` };
}

export async function listEvents() {
  const now = Date.now();
  const rows = await everyone();
  return rows
    .flatMap((row) => netOf(row.life).events ?? [])
    .filter((event) => Date.parse(event.endsAt) > now)
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
    .slice(0, 30);
}

async function loadEvent(ref: NetRef) {
  const host = await readPlayer(ref.owner);
  return (netOf(host?.life).events ?? []).find((item) => item.id === ref.id) ?? null;
}

export async function attendEvent(username: string, ref: NetRef): Promise<{ error: string } | { event: LifeEvent }> {
  const event = await loadEvent(ref);
  if (!event) return { error: "That event is over." };
  const now = Date.now();
  if (now < Date.parse(event.startsAt)) return { error: "It has not started yet." };
  if (now > Date.parse(event.endsAt)) return { error: "That event is over." };
  if (!event.attendees.includes(username)) {
    await updateLife(ref.owner, (life) => withNet(life, (net) => ({ ...net, events: (net.events ?? []).map((item) => (item.id === ref.id ? { ...item, attendees: [...new Set([...item.attendees, username])].slice(-200) } : item)) })));
    forget();
  }
  return { event };
}

export async function giftEvent(username: string, ref: NetRef, amount: number, latest: Life): Promise<Done> {
  const event = await loadEvent(ref);
  if (!event || Date.now() > Date.parse(event.endsAt)) return { error: "That event is over." };
  if (event.host === username) return { error: "You cannot gift your own event." };
  const value = Math.round(amount);
  if (!Number.isFinite(value) || value < 5 || value > 5000) return { error: "Gift between ₵5 and ₵5,000." };
  const label = EVENT_INFO[event.kind].label.toLowerCase();
  const charged = await chargePlayer(username, value, latest, `You gave ${cedis(value)} at @${event.host}'s ${label}.`, "gift");
  if ("error" in charged) return { error: charged.error ?? "The gift did not go through." };
  await creditPlayer(event.host, value, `@${username} gave ${cedis(value)} at your ${label}.`, "gift");
  await updateLife(ref.owner, (life) => withNet(life, (net) => ({ ...net, events: (net.events ?? []).map((item) => (item.id === ref.id ? { ...item, gifts: item.gifts + value } : item)) })));
  forget();
  return { life: charged.life, note: `You gave ${cedis(value)}. The family will remember.` };
}

async function loadMatch(ref: NetRef) {
  const owner = await readPlayer(ref.owner);
  return (netOf(owner?.life).games ?? []).find((item) => item.id === ref.id) ?? null;
}

async function saveMatch(ref: NetRef, change: (match: Match) => Match) {
  let result: Match | null = null;
  const saved = await updateLife(ref.owner, (life) =>
    withNet(life, (net) => ({
      ...net,
      games: (net.games ?? []).map((item) => {
        if (item.id !== ref.id) return item;
        result = change(item);
        return result;
      }),
    })),
  );
  return saved ? (result as Match | null) : null;
}

export async function gamesView(username: string) {
  const me = await readPlayer(username);
  if (!me?.life) return null;
  const net = netOf(me.life);
  const joined = await Promise.all((net.gamesIn ?? []).map(loadMatch));
  const all = [...(net.games ?? []), ...joined.filter((item): item is Match => Boolean(item && item.b === username))];
  return all.sort((a, b) => Date.parse(b.moved) - Date.parse(a.moved)).slice(0, 20);
}

export async function challenge(username: string, to: string, game: string, stake: number, latest: Life): Promise<Done> {
  if (!GAMES.includes(game as GameKind)) return { error: "Pick a game." };
  if (!HANDLE.test(to) || to === username) return { error: "Pick a real username." };
  const value = Math.round(stake);
  if (!Number.isFinite(value) || value < 0 || value > 500) return { error: "Stake between ₵0 and ₵500." };
  const them = await readPlayer(to);
  if (!them?.life) return { error: "Nobody in Accra goes by that name." };
  let life: Life | undefined;
  if (value > 0) {
    const charged = await chargePlayer(username, value, latest, `You staked ${cedis(value)} on a ${game} game with @${to}.`, "stake");
    if ("error" in charged) return { error: charged.error ?? "The stake did not go through." };
    life = charged.life;
  }
  const now = new Date().toISOString();
  const match: Match = { id: newId(), game: game as GameKind, a: username, b: to, stake: value, status: "waiting", board: startBoard(game as GameKind), at: now, moved: now };
  const saved = await updateLife(username, (current) => withNet(current, (net) => ({ ...net, games: [...(net.games ?? []).filter((item) => item.status === "waiting" || item.status === "playing").slice(-9), match] })));
  if (!saved) {
    if (value) await creditPlayer(username, value, "Refund: your challenge did not send.", "refund");
    return { error: "The challenge did not send." };
  }
  await updateLife(to, (current) => withNet(current, (net) => ({ ...net, gamesIn: [...(net.gamesIn ?? []).filter((ref) => ref.id !== match.id), { owner: username, id: match.id }].slice(-20) })));
  await sendChat(username, to, `🎲 I challenge you to ${game}${value ? ` for ${cedis(value)}` : ""}. Open Games on your phone.`);
  return { life, note: `Challenge sent to @${to}.` };
}

export async function answerChallenge(username: string, ref: NetRef, yes: boolean, latest: Life): Promise<Done> {
  const match = await loadMatch(ref);
  if (!match || match.b !== username || match.status !== "waiting") return { error: "That challenge is gone." };
  if (!yes) {
    await saveMatch(ref, (item) => ({ ...item, status: "declined", moved: new Date().toISOString() }));
    if (match.stake) await creditPlayer(match.a, match.stake, `@${username} declined your ${match.game} game. Stake returned.`, "refund");
    return { note: "Declined." };
  }
  let life: Life | undefined;
  if (match.stake) {
    const charged = await chargePlayer(username, match.stake, latest, `You staked ${cedis(match.stake)} on a ${match.game} game with @${match.a}.`, "stake");
    if ("error" in charged) return { error: charged.error ?? "The stake did not go through." };
    life = charged.life;
  }
  const saved = await saveMatch(ref, (item) => (item.status === "waiting" ? { ...item, status: "playing", moved: new Date().toISOString() } : item));
  if (!saved || saved.status !== "playing") {
    if (match.stake) await creditPlayer(username, match.stake, "Refund: the game did not start.", "refund");
    return { error: "The game did not start." };
  }
  return { life, note: `Game on. @${match.a} moves first.` };
}

async function settle(match: Match) {
  if (match.status !== "done" || !match.stake) return;
  if (match.winner) await creditPlayer(match.winner, match.stake * 2, `You won ${cedis(match.stake * 2)} at ${match.game}.`, "win");
  else {
    await creditPlayer(match.a, match.stake, `${match.game} ended in a draw. Stake returned.`, "draw");
    await creditPlayer(match.b, match.stake, `${match.game} ended in a draw. Stake returned.`, "draw");
  }
}

export async function playMove(username: string, ref: NetRef, move: Move): Promise<{ error: string } | { match: Match }> {
  const match = await loadMatch(ref);
  if (!match || match.status !== "playing") return { error: "That game is not running." };
  const side = match.a === username ? 0 : match.b === username ? 1 : -1;
  if (side === -1) return { error: "You are not in that game." };
  if (match.board.turn !== side) return { error: "Wait for your turn." };
  const clean: Move = match.board.kind === "ludo" && typeof move.roll === "number" ? { roll: rollDie() } : move;
  const next = applyMove(match.board, clean);
  if (!next) return { error: "That move is not allowed." };
  const done = next.winner !== null;
  const winner = done ? (next.winner === "draw" ? null : next.winner === 0 ? match.a : match.b) : undefined;
  const saved = await saveMatch(ref, (item) => (item.status === "playing" && item.board.turn === side ? { ...item, board: next, moved: new Date().toISOString(), status: done ? "done" : "playing", winner } : item));
  if (!saved || saved.board !== next) return { error: "The move did not save. Try again." };
  await settle(saved);
  return { match: saved };
}

export async function claimIdle(username: string, ref: NetRef) {
  const match = await loadMatch(ref);
  if (!match || match.status !== "playing") return "That game is not running.";
  const side = match.a === username ? 0 : match.b === username ? 1 : -1;
  if (side === -1) return "You are not in that game.";
  if (match.board.turn === side) return "It is your turn.";
  if (Date.now() - Date.parse(match.moved) < 86400000) return "Give them a day to move.";
  const saved = await saveMatch(ref, (item) => ({ ...item, status: "done", winner: username, moved: new Date().toISOString() }));
  if (!saved) return "That did not save.";
  await settle(saved);
  return null;
}

function worthOf(life: Life) {
  const plots = (life.plots ?? []).reduce((sum, plot) => sum + plot.spent * 0.7, 0);
  const shops = (life.businesses ?? []).reduce((sum, shop) => sum + bizKind(shop.kind).price * 0.6 * shop.level, 0);
  const car = (carOf(life.car?.id)?.price ?? 0) * 0.6;
  const fleet = (life.fleet ?? []).reduce((sum, item) => sum + vehicleOf(item.kind).price * 0.5, 0);
  const bank = (life.bank?.savings ?? 0) - (life.bank?.loan ?? 0);
  return Math.round(life.cash + plots + shops + car + fleet + bank);
}

export type BoardRow = { username: string; name: string; value: number };

export async function leaderboard() {
  const rows = (await everyone()).filter((row) => row.life && typeof row.life.cash === "number");
  const top = (score: (life: Life) => number): BoardRow[] =>
    rows
      .map((row) => ({ username: row.username, name: row.name, value: score(row.life as Life) }))
      .filter((row) => row.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  return {
    worth: top(worthOf),
    social: top((life) => (life.relations ?? []).map((person) => person.score).sort((a, b) => b - a).slice(0, 20).reduce((sum, score) => sum + score, 0)),
    chef: top((life) => life.skills?.cooking ?? 0),
    fans: top((life) => life.music?.fans ?? 0),
    badges: top((life) => earnedBadges(life).length),
    football: top((life) => life.team?.trophies ?? 0),
    elders: top((life) => life.community?.standing ?? 0),
  };
}
