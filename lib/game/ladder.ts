import { BIG_HOMES, HOMES, JOBS, JOB_RANKS, RANK_CAREER, RANK_SHIFTS, cedis, cloneLife, homeById, logLine, passTime, rankOf, spotById, type Home, type Life, type StepResult } from "@/lib/game/world";
import { STAGES } from "@/lib/game/estate";

export const ASK_GAP = 1440;
export const MOVE_GAP = 4320;
export const MOVER_FEE = 60;
export const ADVANCE_WEEKS = 8;

export function nextRank(life: Life, jobId: string) {
  const held = rankOf(life, jobId);
  const rank = held.rank + 1;
  if (rank >= JOB_RANKS.length) return null;
  return { rank, title: JOB_RANKS[rank], shifts: RANK_SHIFTS[rank], career: RANK_CAREER[rank], held };
}

export function askWait(life: Life, jobId: string) {
  return Math.max(0, (rankOf(life, jobId).lastAsk ?? -1e9) + ASK_GAP - life.minutes);
}

export function promoteOdds(life: Life) {
  return Math.min(0.9, 0.45 + life.skills.charm * 0.05 + life.skills.career * 0.03);
}

export function askPromotion(life: Life, jobId: string): StepResult {
  const job = JOBS.find((item) => item.id === jobId);
  if (!job) return { life, notes: [], error: "That job is gone." };
  const next = nextRank(life, jobId);
  if (!next) return { life, notes: [], error: `You already run the place at ${spotById(job.place).name}.` };
  if (next.held.shifts < next.shifts) return { life, notes: [], error: `Work ${next.shifts - next.held.shifts} more shifts here first.` };
  if (life.skills.career < next.career) return { life, notes: [], error: `${next.title} needs career skill ${next.career}. School courses and shifts build it.` };
  if (life.where !== job.place) return { life, notes: [], error: `The boss is at ${spotById(job.place).name}. Go there to ask.` };
  const wait = askWait(life, jobId);
  if (wait > 0) return { life, notes: [], error: `Give the boss time. Ask again in ${Math.ceil(wait / 60)}h.` };
  if (life.needs.hygiene < 30) return { life, notes: [], error: "Shower first. Nobody gets promoted smelling like that." };
  const timed = passTime(cloneLife(life), 45).life;
  const won = Math.random() < promoteOdds(life);
  timed.ranks = { ...timed.ranks, [jobId]: { ...next.held, rank: won ? next.rank : next.held.rank, lastAsk: timed.minutes } };
  const line = won ? `Promoted to ${next.title} at ${spotById(job.place).name}. The pay goes up from your next shift.` : `The boss said "not yet". Keep working and ask again tomorrow.`;
  if (won) logLine(timed, line);
  timed.needs.fun = Math.max(0, Math.min(100, timed.needs.fun + (won ? 20 : -8)));
  return { life: timed, notes: [line] };
}

export function ownsHouse(life: Life) {
  return (life.plots ?? []).some((plot) => plot.stage >= STAGES.length - 1);
}

export function movingHomes(life: Life): Home[] {
  return [...HOMES, ...BIG_HOMES].filter((home) => home.id !== "own-house" || ownsHouse(life));
}

export function moveCost(life: Life, homeId: string) {
  const home = homeById(homeId);
  return MOVER_FEE + (home.rent > homeById(life.homeId).rent ? home.rent * ADVANCE_WEEKS : 0);
}

export function moveWait(life: Life) {
  return Math.max(0, (life.movedAt ?? -1e9) + MOVE_GAP - life.minutes);
}

export function moveHome(life: Life, homeId: string): StepResult {
  const home = movingHomes(life).find((item) => item.id === homeId);
  if (!home) return { life, notes: [], error: homeId === "own-house" ? "Finish building a house on your land first." : "That place is not available." };
  if (home.id === life.homeId) return { life, notes: [], error: "You already live there." };
  const wait = moveWait(life);
  if (wait > 0) return { life, notes: [], error: `You just moved. Unpack first. Ready in ${Math.ceil(wait / 60)}h.` };
  const cost = moveCost(life, home.id);
  if (life.cash < cost) return { life, notes: [], error: `Moving costs ${cedis(cost)}${home.rent > homeById(life.homeId).rent ? ` with ${ADVANCE_WEEKS} weeks of rent in advance` : ""}.` };
  const timed = passTime(cloneLife(life), 120).life;
  timed.cash -= cost;
  timed.homeId = home.id;
  timed.movedAt = timed.minutes;
  timed.needs.energy = Math.max(0, timed.needs.energy - 20);
  const line = `Moved into the ${home.name.toLowerCase()} in ${home.area}. ${home.rent ? `Rent is ${cedis(home.rent)} every Saturday.` : "No more rent."}`;
  logLine(timed, line);
  return { life: timed, notes: [line] };
}
