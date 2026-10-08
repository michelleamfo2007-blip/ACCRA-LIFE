import { cedis, clampNeed, cloneLife, logLine, type Life, type StepResult } from "@/lib/game/world";

/** In-game cedis only. A spray is a night out, not a payout. */

export const SPRAYS = [
  { id: "small", label: "Small spray", cost: 80, notes: 8 },
  { id: "medium", label: "Medium", cost: 250, notes: 14 },
  { id: "rain", label: "Make it rain", cost: 600, notes: 22 },
] as const;

export type SprayId = (typeof SPRAYS)[number]["id"];

const NOTE_VALUES = [1, 5, 5, 10, 10, 20, 20, 50];

export function sprayPack(id: string) {
  return SPRAYS.find((pack) => pack.id === id) ?? null;
}

export function sprayCash(life: Life, id: SprayId, name: string): StepResult {
  const pack = sprayPack(id);
  if (!pack) return { life, notes: [], error: "That spray is not on the menu." };
  if (life.cash < pack.cost) return { life, notes: [], error: `You need ${cedis(pack.cost)} to spray.` };
  const next = cloneLife(life);
  next.cash -= pack.cost;
  next.stats = {
    ...(next.stats ?? {}),
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

/** A tapped note lands in the wallet. No nightly cap. */
export function catchCash(life: Life, value: number): StepResult {
  const take = Math.max(0, Math.round(value));
  if (take <= 0) return { life, notes: [], error: "Empty note." };
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
