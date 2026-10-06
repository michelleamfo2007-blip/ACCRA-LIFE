import "server-only";
import { timingSafeEqual } from "crypto";
import { SPOTS, type Life, type Spot } from "@/lib/game/world";
import { supabase } from "@/lib/server/supabase";

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
  const { error } = await client.from("players").update({ life: player.life, name: player.name, email: player.email }).eq("username", player.username);
  return !error;
}

export async function loginPlayer(username: string, passwordHash: string) {
  const player = await readPlayer(username);
  if (!player || !same(player.passwordHash, passwordHash)) return null;
  return player;
}
