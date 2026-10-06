import "server-only";
import { timingSafeEqual } from "crypto";
import { cedis, joinCash, mergeMoney, SPOTS, type Life, type Spot } from "@/lib/game/world";
import { supabase } from "@/lib/server/supabase";
import type { SpotPos } from "@/lib/game/net";

export type CloudPlayer = {
  username: string;
  name: string;
  email: string;
  passwordHash: string;
  birthId: string;
  life: Life | null;
  createdAt: string;
};

type PlaceRow = {
  id: string;
  name: string;
  emoji: string;
  x: number;
  y: number;
  area_group: Spot["group"];
  blurb: string;
  soon: boolean;
  actions: Spot["actions"];
};

type PlayerRow = {
  username: string;
  name: string;
  email: string;
  password_hash: string;
  birth_id: string;
  life: Life | null;
  created_at: string;
};

function db() {
  return supabase();
}

const SHARED_KEYS = ["chats", "net", "spot"] as const;

export function shared(life: Life | null | undefined): Partial<Life> {
  const out: Partial<Life> = {};
  if (!life) return out;
  for (const key of SHARED_KEYS) {
    if (life[key] !== undefined) Object.assign(out, { [key]: life[key] });
  }
  return out;
}

function same(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function toSpot(row: PlaceRow): Spot {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    x: row.x,
    y: row.y,
    group: row.area_group,
    blurb: row.blurb,
    soon: row.soon || undefined,
    actions: row.actions ?? [],
  };
}

function toPlayer(row: PlayerRow): CloudPlayer {
  return {
    username: row.username,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    birthId: row.birth_id,
    life: row.life,
    createdAt: row.created_at,
  };
}

export async function publishPlaces() {
  const client = db();
  if (!client) return 0;
  const rows: PlaceRow[] = SPOTS.map((spot) => ({
    id: spot.id,
    name: spot.name,
    emoji: spot.emoji,
    x: spot.x,
    y: spot.y,
    area_group: spot.group,
    blurb: spot.blurb,
    soon: Boolean(spot.soon),
    actions: spot.actions,
  }));
  for (let index = 0; index < rows.length; index += 20) {
    const { error } = await client.from("places").upsert(rows.slice(index, index + 20));
    if (error) return 0;
  }
  return rows.length;
}

export async function loadPlaces() {
  const client = db();
  if (!client) return SPOTS;
  const { data, error } = await client.from("places").select("*");
  if (error || !data?.length) {
    const count = await publishPlaces();
    return count ? SPOTS : [];
  }
  return (data as PlaceRow[]).map(toSpot);
}

export async function readPlayer(username: string) {
  const client = db();
  if (!client) return null;
  const { data, error } = await client.from("players").select("*").eq("username", username).maybeSingle();
  if (error || !data) return null;
  return toPlayer(data as PlayerRow);
}

export async function createPlayer(player: CloudPlayer) {
  const client = db();
  if (!client) return "The city cannot register anyone right now.";
  const { error } = await client.from("players").insert({
    username: player.username,
    name: player.name,
    email: player.email,
    password_hash: player.passwordHash,
    birth_id: player.birthId,
    life: player.life,
  });
  if (!error) return null;
  if (error.code === "23505" || error.message.toLowerCase().includes("duplicate")) {
    return "That username is already living in Accra.";
  }
  return "The city could not save that username.";
}

export async function savePlayer(player: CloudPlayer) {
  const client = db();
  if (!client) return false;
  const life = { ...player.life, seen: new Date().toISOString() };
  const { error } = await client.from("players").update({ life, name: player.name, email: player.email }).eq("username", player.username);
  return !error;
}

let lastWalletTopUp = 0;

export async function topUpJoinWallets() {
  const client = db();
  if (!client) return { updated: 0, checked: 0 };
  const { data, error } = await client.from("players").select("username, name, email, password_hash, birth_id, life, created_at");
  if (error || !data) return { updated: 0, checked: 0 };
  let updated = 0;
  for (const row of data as PlayerRow[]) {
    const player = toPlayer(row);
    if (!player.life || typeof player.life.cash !== "number") continue;
    const target = joinCash(player.username);
    if (player.life.cash >= target) continue;
    const life: Life = {
      ...player.life,
      cash: target,
      log: [`City top-up: wallet filled to ${cedis(target)}.`, ...(player.life.log ?? [])].slice(0, 14),
      inbox: [`Your wallet was topped up to ${cedis(target)}. Accra is open.`, ...(player.life.inbox ?? [])].slice(0, 20),
    };
    const saved = await savePlayer({ ...player, life });
    if (saved) updated += 1;
  }
  return { updated, checked: data.length };
}

export async function maybeTopUpJoinWallets() {
  if (Date.now() - lastWalletTopUp < 45_000) return null;
  lastWalletTopUp = Date.now();
  return topUpJoinWallets();
}

export async function crowdCounts() {
  const client = db();
  if (!client) return { players: 0, online: 0 };
  void maybeTopUpJoinWallets();
  const { count: players } = await client.from("players").select("*", { count: "exact", head: true });
  const since = new Date(Date.now() - 3 * 60 * 1000).toISOString();
  const filtered = await client.from("players").select("*", { count: "exact", head: true }).filter("life->>seen", "gte", since);
  if (!filtered.error) return { players: players ?? 0, online: filtered.count ?? 0 };
  const { data } = await client.from("players").select("life");
  const online = (data ?? []).filter((row) => {
    const seen = (row as { life?: { seen?: string } }).life?.seen;
    return typeof seen === "string" && seen >= since;
  }).length;
  return { players: players ?? 0, online };
}

export type AdminPlayer = {
  username: string;
  name: string;
  email: string;
  createdAt: string;
  hasLife: boolean;
  home: string | null;
  homeArea: string | null;
  where: string | null;
  cash: number | null;
  dream: string | null;
  seen: string | null;
  online: boolean;
};

export async function listPlayersForAdmin(limit = 200): Promise<AdminPlayer[]> {
  const client = db();
  if (!client) return [];
  const { data, error } = await client.from("players").select("username, name, email, birth_id, life, created_at").order("created_at", { ascending: false }).limit(limit);
  if (error || !data) return [];
  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { homeById, spotById } = await import("@/lib/game/world");
  return (data as PlayerRow[]).map((row) => {
    const life = row.life as (Life & { seen?: string }) | null;
    const home = life?.homeId ? homeById(life.homeId) : null;
    const whereId = life?.where ?? null;
    const where = whereId === "home" ? home?.name ?? "Home" : whereId ? spotById(whereId)?.name ?? whereId : null;
    const seen = typeof life?.seen === "string" ? life.seen : null;
    return {
      username: row.username,
      name: row.name,
      email: row.email,
      createdAt: row.created_at,
      hasLife: Boolean(life),
      home: home?.name ?? null,
      homeArea: home?.area ?? null,
      where,
      cash: typeof life?.cash === "number" ? Math.round(life.cash) : null,
      dream: life?.dream ?? null,
      seen,
      online: Boolean(seen && seen >= since),
    };
  });
}

export type FoundPlayer = { username: string; name: string; where: string | null; look?: Life["look"]; spot?: SpotPos | null };

function cleanQuery(query: string) {
  return query.trim().replace(/^@/, "").replace(/[%_,.()"'\\]/g, "").slice(0, 32);
}

export async function findPlayers(query: string, where?: string, except?: string): Promise<FoundPlayer[]> {
  const client = db();
  if (!client) return [];
  const q = cleanQuery(query);
  let request = client.from("players").select("username, name, life");
  if (q) request = request.or(`username.ilike.%${q}%,name.ilike.%${q}%`);
  else if (where) request = request.filter("life->>where", "eq", where);
  else return [];
  const { data } = await request.limit(30);
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const people = ((data ?? []) as { username: string; name: string; life?: { where?: string; seen?: string; look?: Life["look"]; spot?: SpotPos } | null }[])
    .filter((row) => row.username !== except)
    .filter((row) => q || (typeof row.life?.seen === "string" && row.life.seen >= since))
    .map((row) => ({
      username: row.username,
      name: row.name,
      where: row.life?.where ?? null,
      look: where && !q ? row.life?.look : undefined,
      spot: where && !q && row.life?.spot?.where === where ? row.life.spot : null,
    }));
  people.sort((a, b) => Number(b.username === q) - Number(a.username === q));
  return people;
}

type Mail = { who: "me" | "them"; text: string; time: string; at: string };

function mailBag(life: Life | null): Record<string, Mail[]> {
  const chats = (life as (Life & { chats?: Record<string, Mail[]> }) | null)?.chats;
  if (!chats || typeof chats !== "object") return {};
  return chats;
}

function accraTime() {
  return new Intl.DateTimeFormat("en-GH", { timeZone: "Africa/Accra", hour: "numeric", minute: "2-digit", hour12: true }).format(new Date());
}

async function keepChats(username: string, chats: Record<string, Mail[]>) {
  const player = await readPlayer(username);
  if (!player) return false;
  const life = { ...(player.life ?? {}), chats } as Life;
  return savePlayer({ ...player, life });
}

export async function listChats(username: string) {
  const player = await readPlayer(username);
  if (!player) return [];
  const bag = mailBag(player.life);
  const threads = await Promise.all(
    Object.keys(bag).map(async (id) => {
      const other = await readPlayer(id);
      const last = bag[id]?.[bag[id].length - 1];
      const incoming = (bag[id] ?? [])
        .filter((mail) => mail.who === "them" && mail.at)
        .slice(-30)
        .map((mail) => ({ at: mail.at, text: mail.text }));
      return { username: id, name: other?.name ?? id, last: last?.text ?? "", time: last?.time ?? "", mine: last?.who === "me", incoming };
    }),
  );
  return threads;
}

export async function readChat(username: string, withUser: string) {
  const player = await readPlayer(username);
  if (!player) return [];
  return (mailBag(player.life)[withUser] ?? []).map(({ who, text, time }) => ({ who, text, time }));
}

export function mutedNote(life: Life | null | undefined) {
  const until = Date.parse(life?.net?.mutedUntil ?? "");
  if (!Number.isFinite(until) || until <= Date.now()) return null;
  const hours = Math.ceil((until - Date.now()) / 3600000);
  return `The moderators paused your messages for ${hours} more hour${hours === 1 ? "" : "s"}.`;
}

export async function sendChat(from: string, to: string, text: string) {
  const body = text.trim().slice(0, 500);
  if (!body) return "Write something first.";
  if (from === to) return "That is your own username.";
  const sender = await readPlayer(from);
  const recipient = await readPlayer(to);
  if (!sender) return "Log in again.";
  if (!recipient) return "Nobody in Accra goes by that name.";
  const muted = mutedNote(sender.life);
  if (muted) return muted;
  if (recipient.life?.net?.blocked?.includes(from)) return `@${to} is not taking messages from you.`;
  const note = { text: body, time: accraTime(), at: new Date().toISOString() };
  const senderBag = mailBag(sender.life);
  const recipientBag = mailBag(recipient.life);
  const mine: Mail = { ...note, who: "me" };
  const theirs: Mail = { ...note, who: "them" };
  senderBag[to] = [...(senderBag[to] ?? []), mine].slice(-80);
  recipientBag[from] = [...(recipientBag[from] ?? []), theirs].slice(-80);
  const sent = await keepChats(from, senderBag);
  const delivered = await keepChats(to, recipientBag);
  if (!sent || !delivered) return "The message did not save.";
  return null;
}

export async function loginPlayer(username: string, passwordHash: string) {
  const player = await readPlayer(username);
  if (!player || !same(player.passwordHash, passwordHash)) return null;
  if (!player.life) return player;
  const settled = mergeMoney(player.life, player.life);
  if (settled.cash === player.life.cash && (settled.seenTransfers?.length ?? 0) === (player.life.seenTransfers?.length ?? 0)) return player;
  const life = { ...settled, ...shared(player.life) };
  const saved = await savePlayer({ ...player, life });
  return saved ? { ...player, life } : player;
}

export async function saveMergedLife(username: string, incoming: Life) {
  const player = await readPlayer(username);
  if (!player) return null;
  if (!player.life) {
    const saved = await savePlayer({ ...player, life: incoming });
    return saved ? incoming : null;
  }
  let merged = mergeMoney(player.life, incoming);
  const latest = await readPlayer(username);
  const known = new Set((merged.transfers ?? []).map((note) => note.id));
  const extra = (latest?.life?.transfers ?? []).filter((note) => note.id && !known.has(note.id));
  if (extra.length && latest?.life) merged = mergeMoney({ ...latest.life, transfers: [...(merged.transfers ?? []), ...extra] }, merged);
  const life = { ...merged, ...shared(player.life), ...shared(latest?.life) };
  const saved = await savePlayer({ ...player, life });
  return saved ? life : null;
}

function noteId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function chargePlayer(username: string, amount: number, latest: Life, note: string, prefix = "pay") {
  const value = Math.round(amount);
  if (!Number.isFinite(value) || value < 1) return { error: "Enter an amount in cedis." } as const;
  const player = await readPlayer(username);
  if (!player?.life) return { error: "Log in again." } as const;
  const current = mergeMoney(player.life, latest);
  if (value > current.cash) return { error: `You need ${cedis(value)}. You have ${cedis(current.cash)}.` } as const;
  const id = noteId(prefix);
  const life: Life = {
    ...current,
    cash: current.cash - value,
    transfers: [...(current.transfers ?? []), { id, delta: -value, note }].slice(-80),
    seenTransfers: [...new Set([...(current.seenTransfers ?? []), id])].slice(-80),
    log: [note, ...(current.log ?? [])].slice(0, 14),
  };
  const fresh = await readPlayer(username);
  const saved = await savePlayer({ ...player, life: { ...life, ...shared(fresh?.life ?? player.life) } });
  if (!saved) return { error: "The payment did not go through." } as const;
  return { life, id } as const;
}

export async function creditPlayer(username: string, amount: number, note: string, prefix = "in") {
  const value = Math.round(amount);
  if (!Number.isFinite(value) || value < 1) return false;
  const player = await readPlayer(username);
  if (!player?.life) return false;
  const life: Life = { ...player.life, transfers: [...(player.life.transfers ?? []), { id: noteId(prefix), delta: value, note }].slice(-80) };
  return savePlayer({ ...player, life });
}

export async function updateLife(username: string, change: (life: Life) => Life | null) {
  const player = await readPlayer(username);
  if (!player?.life) return null;
  const next = change(player.life);
  if (!next) return null;
  const saved = await savePlayer({ ...player, life: next });
  return saved ? next : null;
}

export async function sendMoney(from: string, to: string, amount: number, latest: Life) {
  const value = Math.round(amount);
  if (!/^[a-z0-9_]{3,16}$/.test(to)) return { error: "That username is not in Accra." };
  if (to === from) return { error: "You cannot send money to yourself." };
  if (!Number.isFinite(value) || value < 1) return { error: "Enter an amount in cedis." };
  const sender = await readPlayer(from);
  if (!sender?.life) return { error: "Log in again." };
  const current = mergeMoney(sender.life, latest);
  if (value > current.cash) return { error: `MoMo cannot cover ${cedis(value)}. You have ${cedis(current.cash)}.` };
  const recipient = await readPlayer(to);
  if (!recipient?.life) return { error: "That username is not in Accra." };
  const id = `momo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const noteOut = `You sent ${cedis(value)} to @${to}.`;
  const noteIn = `@${from} sent you ${cedis(value)}.`;
  const sent: Life = {
    ...current,
    cash: current.cash - value,
    transfers: [...(current.transfers ?? []), { id, delta: -value, note: noteOut }].slice(-80),
    seenTransfers: [...new Set([...(current.seenTransfers ?? []), id])].slice(-80),
    log: [noteOut, ...(current.log ?? [])].slice(0, 14),
  };
  const keep = shared(sender.life);
  const senderSaved = await savePlayer({ ...sender, life: { ...sent, ...keep } });
  if (!senderSaved) return { error: "MoMo did not go through." };
  const fresh = await readPlayer(to);
  if (!fresh?.life) {
    await savePlayer({ ...sender, life: { ...current, ...keep } });
    return { error: "That username is not in Accra." };
  }
  const waiting: Life = {
    ...fresh.life,
    transfers: [...(fresh.life.transfers ?? []), { id, delta: value, note: noteIn }].slice(-80),
  };
  const recipientSaved = await savePlayer({ ...fresh, life: waiting });
  if (!recipientSaved) {
    await savePlayer({ ...sender, life: { ...current, ...keep } });
    return { error: "MoMo did not go through." };
  }
  await postMoneyChat(from, to, value);
  return { life: sent, note: `@${to} has ${cedis(value)} in their wallet.` };
}

async function postMoneyChat(from: string, to: string, amount: number) {
  const time = accraTime();
  const at = new Date().toISOString();
  const sender = await readPlayer(from);
  const recipient = await readPlayer(to);
  if (!sender || !recipient) return;
  const senderBag = mailBag(sender.life);
  const recipientBag = mailBag(recipient.life);
  const outText = `💸 You sent ${cedis(amount)}`;
  const inText = `💸 @${from} sent you ${cedis(amount)}`;
  senderBag[to] = [...(senderBag[to] ?? []), { who: "me" as const, text: outText, time, at }].slice(-80);
  recipientBag[from] = [...(recipientBag[from] ?? []), { who: "them" as const, text: inText, time, at }].slice(-80);
  await keepChats(from, senderBag);
  await keepChats(to, recipientBag);
}
