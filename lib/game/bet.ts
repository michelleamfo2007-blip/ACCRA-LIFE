import { cedis, cloneLife, type Life, type StepResult } from "@/lib/game/world";

export const BET_CAP = 500;
export const BET_MIN = 5;
export const BET_MAX = 200;

function dayIndex() {
  return Math.floor(Date.now() / 86_400_000);
}

export function lostToday(life: Life) {
  const stats = life.stats ?? {};
  if ((stats.betDay ?? 0) !== dayIndex()) return 0;
  return stats.betLost ?? 0;
}

function need(value: number) {
  return Math.max(0, Math.min(100, value));
}

function openTable(life: Life, stake: number): StepResult | null {
  const amount = Math.round(stake);
  if (!Number.isFinite(amount) || amount < BET_MIN) return { life, notes: [], error: `The table starts at ${cedis(BET_MIN)}.` };
  if (amount > BET_MAX) return { life, notes: [], error: `This table stops at ${cedis(BET_MAX)}.` };
  if (life.cash < amount) return { life, notes: [], error: `MoMo cannot cover ${cedis(amount)}.` };
  const lost = lostToday(life);
  if (lost >= BET_CAP) return { life, notes: [], error: `You already lost ${cedis(BET_CAP)} today. The table is closed.` };
  if (lost + amount > BET_CAP) return { life, notes: [], error: `${cedis(BET_CAP - lost)} is all this table will still take today.` };
  return null;
}

function settle(life: Life, stake: number, win: boolean, payout: number, line: string): StepResult {
  const next = cloneLife(life);
  const day = dayIndex();
  const lost = (next.stats?.betDay ?? 0) === day ? (next.stats?.betLost ?? 0) : 0;
  next.stats = { ...(next.stats ?? {}), betDay: day, betLost: win ? lost : lost + stake };
  if (win) {
    next.cash += payout;
    next.needs.fun = need(next.needs.fun + 8);
  } else {
    next.cash -= stake;
    next.needs.fun = need(next.needs.fun - (lost + stake > 250 ? 14 : 8));
  }
  next.log = [line, ...next.log].slice(0, 14);
  const streak = win ? "" : lost + stake > 250 ? " The night is getting expensive." : "";
  return { life: next, notes: [`${line}${streak}`] };
}

export function betColour(life: Life, stake: number, pick: "red" | "black"): StepResult {
  const blocked = openTable(life, stake);
  if (blocked) return blocked;
  const amount = Math.round(stake);
  const lucky = life.traits.includes("lucky") ? 0.04 : 0;
  const red = Math.random() < 0.5 + (pick === "red" ? lucky : -lucky);
  const colour = red ? "red" : "black";
  const win = colour === pick;
  const line = win ? `${colour} card. You take ${cedis(amount)}.` : `${colour} card. The ${cedis(amount)} stays on the table.`;
  return settle(life, amount, win, amount, line);
}

export function betCard(life: Life, stake: number, pick: "higher" | "lower"): StepResult {
  const blocked = openTable(life, stake);
  if (blocked) return blocked;
  const amount = Math.round(stake);
  const shown = 1 + Math.floor(Math.random() * 13);
  let next = 1 + Math.floor(Math.random() * 13);
  if (life.traits.includes("lucky") && Math.random() < 0.2) {
    next = pick === "higher" ? Math.min(13, shown + 1 + Math.floor(Math.random() * 3)) : Math.max(1, shown - 1 - Math.floor(Math.random() * 3));
  }
  const win = pick === "higher" ? next > shown : next < shown;
  const tie = next === shown;
  const line = tie
    ? `Both cards are ${shown}. The stake comes back.`
    : win
      ? `${shown} then ${next}. You take ${cedis(amount)}.`
      : `${shown} then ${next}. The ${cedis(amount)} is gone.`;
  if (tie) {
    const kept = cloneLife(life);
    kept.log = [line, ...kept.log].slice(0, 14);
    return { life: kept, notes: [line] };
  }
  return settle(life, amount, win, amount, line);
}

export function betDice(life: Life, stake: number, pick: "over" | "under" | "seven"): StepResult {
  const blocked = openTable(life, stake);
  if (blocked) return blocked;
  const amount = Math.round(stake);
  const a = 1 + Math.floor(Math.random() * 6);
  const b = 1 + Math.floor(Math.random() * 6);
  const total = a + b;
  const win = pick === "seven" ? total === 7 : pick === "over" ? total > 7 : total < 7;
  const pay = pick === "seven" ? amount * 4 : amount;
  const line = win ? `${a} and ${b}. You take ${cedis(pay)}.` : `${a} and ${b}. The ${cedis(amount)} stays down.`;
  return settle(life, amount, win, pay, line);
}
