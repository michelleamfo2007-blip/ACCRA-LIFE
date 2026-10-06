import { cloneLife, logLine, turfWeekOf, type Life, type StepResult } from "@/lib/game/world";

export const TURFS = [
  { id: "osu", name: "Osu", emoji: "🎶", color: "#CE1126" },
  { id: "labadi", name: "La & Labadi", emoji: "🏖️", color: "#0E7490" },
  { id: "jamestown", name: "Jamestown", emoji: "🥊", color: "#7C2D12" },
  { id: "east-legon", name: "East Legon", emoji: "🏡", color: "#006B3F" },
  { id: "madina", name: "Madina", emoji: "🛒", color: "#A16207" },
  { id: "kaneshie", name: "Kaneshie", emoji: "🧺", color: "#6D28D9" },
  { id: "teshie", name: "Teshie & Nungua", emoji: "🛶", color: "#1D4ED8" },
  { id: "spintex", name: "Spintex & Tema", emoji: "🏭", color: "#121212" },
] as const;

export type TurfId = (typeof TURFS)[number]["id"];

export const TURF_PRIZE = 200;
export const TURF_MIN = 20;

export function turfById(id: string | undefined) {
  return TURFS.find((turf) => turf.id === id) ?? null;
}

export function turfPoints(life: Life) {
  const turf = life.turf;
  if (!turf) return 0;
  return turf.week === turfWeekOf(life.minutes) ? turf.points : 0;
}

export function joinTurf(life: Life, area: string): StepResult {
  const turf = turfById(area);
  if (!turf) return { life, notes: [], error: "Pick a neighbourhood." };
  if (life.turf?.area === area) return { life, notes: [], error: `You already rep ${turf.name}.` };
  const next = cloneLife(life);
  const week = turfWeekOf(life.minutes);
  const old = life.turf;
  const last = old ? (old.week === week ? old.last : old.week === week - 1 ? { week: old.week, points: old.points, area: old.area } : old.last) : undefined;
  next.turf = { area, week, points: 0, last };
  const line = `You now rep ${turf.emoji} ${turf.name}. Shifts, nights out, hangouts and weekly check-ins earn points for the area.`;
  logLine(next, line);
  return { life: next, notes: [line] };
}
