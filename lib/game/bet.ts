import { cedis, cloneLife, passTime, type Life, type StepResult } from "@/lib/game/world";

export const BET_CAP = 500;
export const BET_MIN = 5;

export type VenueId = "street" | "bar" | "casino" | "online" | "friend" | "sports";

export const VENUES: { id: VenueId; name: string; max: number; cap: number; dealer: string; line: string }[] = [
  { id: "street", name: "Circle corner", max: 50, cap: 200, dealer: "Yaw", line: "A crate, a lamp, and too many people watching." },
  { id: "bar", name: "Republic rail", max: 200, cap: 500, dealer: "Abena", line: "The rail is sticky. Friends are loud." },
  { id: "casino", name: "The felt room", max: 1000, cap: 2000, dealer: "Kojo", line: "Quiet felt. The lamp stays on the cards." },
  { id: "online", name: "Phone table", max: 200, cap: 500, dealer: "", line: "No dealer. Just the screen and your MoMo." },
  { id: "friend", name: "Kofi's parlour", max: 100, cap: 300, dealer: "Kofi", line: "Plastic chairs. The group chat is in the room." },
  { id: "sports", name: "Viewing centre", max: 200, cap: 500, dealer: "Esi", line: "The match is on. The side bet is louder." },
];

const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

export type BetRoll = NonNullable<StepResult["bet"]>;

export function venueOf(id: string) {
  return VENUES.find((venue) => venue.id === id) ?? VENUES[1];
}

function dayIndex() {
  return Math.floor(Date.now() / 86_400_000);
}

function nextMidnight() {
  return (dayIndex() + 1) * 86_400_000;
}

export function lostToday(life: Life) {
  const stats = life.stats ?? {};
  if ((stats.betDay ?? 0) !== dayIndex()) return 0;
  return stats.betLost ?? 0;
}

export function tableClock(life: Life, venueId: string) {
  const venue = venueOf(venueId);
  const lost = lostToday(life);
  const stamped = life.stats?.betLock ?? 0;
  const until = lost >= venue.cap ? Math.max(stamped, nextMidnight()) : stamped > Date.now() ? stamped : 0;
  const left = Math.max(0, until - Date.now());
  return { lost, cap: venue.cap, max: venue.max, until, left, closed: left > 0 || lost >= venue.cap };
}

export function clockLabel(ms: number) {
  const mins = Math.ceil(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

function need(value: number) {
  return Math.max(0, Math.min(100, value));
}

function rankOf(n: number) {
  return RANKS[Math.max(0, Math.min(12, n - 1))];
}

function openTable(life: Life, stake: number, venueId: string): StepResult | null {
  const venue = venueOf(venueId);
  const clock = tableClock(life, venueId);
  const amount = Math.round(stake);
  if (clock.closed) return { life, notes: [], error: `The table is closed. Back in ${clockLabel(clock.left || nextMidnight() - Date.now())}.` };
  if (!Number.isFinite(amount) || amount < BET_MIN) return { life, notes: [], error: `The table starts at ${cedis(BET_MIN)}.` };
  if (amount > venue.max) return { life, notes: [], error: `${venue.name} stops at ${cedis(venue.max)}.` };
  if (life.cash < amount) return { life, notes: [], error: `MoMo cannot cover ${cedis(amount)}.` };
  if (clock.lost + amount > venue.cap) return { life, notes: [], error: `${cedis(venue.cap - clock.lost)} is all this table will still take today.` };
  return null;
}

function drama(urge: number, win: boolean, streak: number) {
  if (streak >= 5 && win) return " Win x5. The room is saying your name.";
  if (streak >= 3 && win) return ` Win x${streak}.`;
  if (urge >= 85 && !win) return " A friend grabs your sleeve. You dey gamble too much.";
  if (urge >= 60 && !win) return " You want the money back on the next hand.";
  return "";
}

function settle(life: Life, stake: number, win: boolean, payout: number, line: string, roll: Omit<BetRoll, "streak" | "stake" | "payout" | "win">, venueId: string): StepResult {
  const next = cloneLife(life);
  const day = dayIndex();
  const stats = next.stats ?? {};
  const lost = (stats.betDay ?? 0) === day ? (stats.betLost ?? 0) : 0;
  const streak = win ? ((stats.betStreak ?? 0) > 0 ? (stats.betStreak ?? 0) + 1 : 1) : 0;
  const urge = need((stats.betUrge ?? 0) + (win ? -4 : 9) + (stake >= 100 ? 3 : 1));
  const venue = venueOf(venueId);
  const betLost = win ? lost : lost + stake;
  next.stats = {
    ...stats,
    betDay: day,
    betLost,
    betStreak: streak,
    betBest: Math.max(stats.betBest ?? 0, streak),
    betWins: (stats.betWins ?? 0) + (win ? 1 : 0),
    betPlayed: (stats.betPlayed ?? 0) + 1,
    betBiggest: Math.max(stats.betBiggest ?? 0, win ? payout : 0),
    betUrge: urge,
    betLock: betLost >= venue.cap ? nextMidnight() : 0,
  };
  if (win) {
    next.cash += payout;
    next.needs.fun = need(next.needs.fun + 8);
  } else {
    next.cash -= stake;
    next.needs.fun = need(next.needs.fun - (urge > 60 ? 14 : 8));
  }
  const extra = drama(urge, win, streak);
  const full = `${line}${extra}`;
  next.log = [full, ...next.log].slice(0, 14);
  return { life: next, notes: [full], bet: { ...roll, win, stake, payout: win ? payout : 0, streak } };
}

export function betColour(life: Life, stake: number, pick: "red" | "black", venueId = "bar"): StepResult {
  const blocked = openTable(life, stake, venueId);
  if (blocked) return blocked;
  const amount = Math.round(stake);
  const lucky = life.traits.includes("lucky") ? 0.04 : 0;
  const red = Math.random() < 0.5 + (pick === "red" ? lucky : -lucky);
  const colour = red ? "red" : "black";
  const win = colour === pick;
  const rank = rankOf(1 + Math.floor(Math.random() * 13));
  const line = win ? `${colour} ${rank}. You take ${cedis(amount)}.` : `${colour} ${rank}. The ${cedis(amount)} stays on the table.`;
  return settle(life, amount, win, amount, line, { kind: "colour", colour, rank }, venueId);
}

export function betCard(life: Life, stake: number, pick: "higher" | "lower", venueId = "bar"): StepResult {
  const blocked = openTable(life, stake, venueId);
  if (blocked) return blocked;
  const amount = Math.round(stake);
  const shown = 1 + Math.floor(Math.random() * 13);
  let next = 1 + Math.floor(Math.random() * 13);
  if (life.traits.includes("lucky") && Math.random() < 0.2) {
    next = pick === "higher" ? Math.min(13, shown + 1 + Math.floor(Math.random() * 3)) : Math.max(1, shown - 1 - Math.floor(Math.random() * 3));
  }
  const tie = next === shown;
  const win = pick === "higher" ? next > shown : next < shown;
  const line = tie ? `Both cards are ${rankOf(shown)}. The stake comes back.` : win ? `${rankOf(shown)} then ${rankOf(next)}. You take ${cedis(amount)}.` : `${rankOf(shown)} then ${rankOf(next)}. The ${cedis(amount)} is gone.`;
  if (tie) {
    const kept = cloneLife(life);
    kept.log = [line, ...kept.log].slice(0, 14);
    return { life: kept, notes: [line], bet: { kind: "card", win: false, tie: true, stake: amount, payout: 0, shown, nextRank: rankOf(next), rank: rankOf(shown), streak: life.stats?.betStreak ?? 0 } };
  }
  return settle(life, amount, win, amount, line, { kind: "card", shown, rank: rankOf(shown), nextRank: rankOf(next), colour: Math.random() < 0.5 ? "red" : "black" }, venueId);
}

export function betDice(life: Life, stake: number, pick: "over" | "under" | "seven", venueId = "bar"): StepResult {
  const blocked = openTable(life, stake, venueId);
  if (blocked) return blocked;
  const amount = Math.round(stake);
  const a = 1 + Math.floor(Math.random() * 6);
  const b = 1 + Math.floor(Math.random() * 6);
  const total = a + b;
  const win = pick === "seven" ? total === 7 : pick === "over" ? total > 7 : total < 7;
  const pay = pick === "seven" ? amount * 4 : amount;
  const line = win ? `${a} and ${b}, ${total}. You take ${cedis(pay)}.` : `${a} and ${b}, ${total}. The ${cedis(amount)} stays down.`;
  return settle(life, amount, win, pay, line, { kind: "dice", dice: [a, b] }, venueId);
}

export function stepAway(life: Life): StepResult {
  const timed = passTime(life, 60);
  const next = timed.life;
  next.stats = { ...(next.stats ?? {}), betUrge: Math.max(0, (next.stats?.betUrge ?? 0) - 22) };
  const line = "You left the table. The urge drops a little.";
  next.log = [line, ...next.log].slice(0, 14);
  return { life: next, notes: [line, ...timed.notes] };
}

export function borrowTable(life: Life): StepResult {
  if ((life.stats?.betDebt ?? 0) > 0) return { life, notes: [], error: "Kojo is still waiting on the last loan." };
  if ((life.stats?.betUrge ?? 0) < 50) return { life, notes: [], error: "Nobody is offering. Play a little longer and they might." };
  const next = cloneLife(life);
  next.cash += 80;
  next.stats = { ...(next.stats ?? {}), betDebt: 160, betUrge: Math.min(100, (next.stats?.betUrge ?? 0) + 6) };
  const line = "Kojo slides you ₵80. Saturday he wants ₵160.";
  next.log = [line, ...next.log].slice(0, 14);
  return { life: next, notes: [line] };
}

export function bragBet(life: Life, line: string): StepResult {
  const next = cloneLife(life);
  next.inbox = [line, ...next.inbox].slice(0, 12);
  next.needs.social = need(next.needs.social + 6);
  next.log = [line, ...next.log].slice(0, 14);
  return { life: next, notes: [line] };
}

export function tableTitle(life: Life) {
  const streak = life.stats?.betBest ?? 0;
  const big = life.stats?.betBiggest ?? 0;
  if (streak >= 10) return "Table King";
  if (streak >= 5) return "Hot streak";
  if (big >= 500) return "High Roller";
  if ((life.stats?.betWins ?? 0) >= 1) return "Lucky";
  if ((life.stats?.betPlayed ?? 0) >= 1) return "Risk Taker";
  return "";
}
