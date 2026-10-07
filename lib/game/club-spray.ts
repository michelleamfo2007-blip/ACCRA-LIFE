import { cedis, clampNeed, cloneLife, logLine, type Life, type StepResult } from "@/lib/game/world";

/** In-game cedis only. A spray is a night out, not a payout. */

export const SPRAYS = [
  { id: "small", label: "Small spray", cost: 80, notes: 8 },
  { id: "medium", label: "Medium", cost: 250, notes: 14 },
  { id: "rain", label: "Make it rain", cost: 600, notes: 22 },
] as const;

export type SprayId = (typeof SPRAYS)[number]["id"];

const DAY_CAP = 4;
const CATCH_CAP = 400;
const NOTE_VALUES = [1, 5, 5, 10, 10, 20, 20, 50];

export function sprayPack(id: string) {
  return SPRAYS.find((pack) => pack.id === id) ?? null;
}

export function spraysLeft(life: Life) {
  const day = Math.floor(life.minutes / 1440);
  const used = life.stats?.sprayDay === day ? (life.stats?.spraysToday ?? 0) : 0;
  return Math.max(0, DAY_CAP - used);
}

export function caughtTonight(life: Life) {
  const day = Math.floor(life.minutes / 1440);
  return life.stats?.catchDay === day ? (life.stats?.caughtToday ?? 0) : 0;
}

export function sprayCash(life: Life, id: SprayId, name: string): StepResult {
  const pack = sprayPack(id);
  if (!pack) return { life, notes: [], error: "That spray is not on the menu." };
  if (spraysLeft(life) <= 0) return { life, notes: [], error: "Enough spray for tonight. Let somebody else rain." };
  if ((life.cool?.spray ?? 0) > life.minutes) return { life, notes: [], error: "The floor is still wet with the last one. Wait a minute." };
  if (life.cash < pack.cost) return { life, notes: [], error: `You need ${cedis(pack.cost)} to spray.` };
  const next = cloneLife(life);
  const day = Math.floor(next.minutes / 1440);
  next.cash -= pack.cost;
  next.cool = { ...(next.cool ?? {}), spray: next.minutes + 2 };
  next.stats = {
    ...(next.stats ?? {}),
    sprayDay: day,
    spraysToday: (next.stats?.sprayDay === day ? (next.stats?.spraysToday ?? 0) : 0) + 1,
    sprayed: (next.stats?.sprayed ?? 0) + pack.cost,
  };
  if (!next.community) next.community = { standing: 8, projects: [] };
  next.community.standing = Math.min(100, (next.community.standing ?? 0) + (pack.cost >= 600 ? 8 : 4));
  next.needs.fun = clampNeed(next.needs.fun + 10);
  next.needs.social = clampNeed(next.needs.social + 8);
  const line = `${name} just sprayed ${cedis(pack.cost)}!`;
  logLine(next, line);
  return { life: next, notes: [line] };
}

/** Notes from someone else's spray. Your own rain does not pay you back. */
export function catchCash(life: Life, value: number): StepResult {
  const gain = Math.max(0, Math.round(value));
  if (gain <= 0) return { life, notes: [], error: "Empty note." };
  const room = CATCH_CAP - caughtTonight(life);
  if (room <= 0) return { life, notes: [], error: "Your hands are full for tonight." };
  const take = Math.min(gain, room);
  const next = cloneLife(life);
  const day = Math.floor(next.minutes / 1440);
  next.cash += take;
  next.stats = {
    ...(next.stats ?? {}),
    catchDay: day,
    caughtToday: (next.stats?.catchDay === day ? (next.stats?.caughtToday ?? 0) : 0) + take,
    caught: (next.stats?.caught ?? 0) + take,
  };
  next.needs.fun = clampNeed(next.needs.fun + 2);
  return { life: next, notes: [`+${cedis(take)}`] };
}

export function buildNotes(cost: number, gold = false) {
  const bag: number[] = [];
  let left = cost;
  const pool = gold ? [20, 50, 50, 100] : NOTE_VALUES;
  while (left > 0 && bag.length < 24) {
    const pick = pool[bag.length % pool.length];
    const value = Math.min(pick, left);
    bag.push(value);
    left -= value;
  }
  return bag;
}

export function hypeLine(kind: "idle" | "spray" | "tap" | "miss" | "combo" | "max", who = "Somebody", amount = 0) {
  const money = cedis(amount);
  if (kind === "spray") return [`Eiiii, ${who} dey spray!`, `${money}! ${money}! Make it rain!`, `Chale, ${who}! Big man!`];
  if (kind === "tap") return ["Tap am! Tap am! Don't sleep!", "Yes! Catch am!", "Fast hands! Again!"];
  if (kind === "miss") return ["Ah, you miss am! Next time!", "Money no dey wait!", "Eii, that one land on the floor."];
  if (kind === "combo") return ["Combo! The floor is awake!", "You dey see am? Fast hands!"];
  if (kind === "max") return ["HYPE MOMENT! Everybody mad!", "Make it rain! The whole club!", "Bass drop! Who else dey spray?"];
  return ["Chale, who dey spray tonight?", "Who be the richest tonight? Show yourself!", "Spray am! The DJ is waiting."];
}
