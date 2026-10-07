import { crossedTownNote, type TownId } from "@/lib/game/towns";
import { bump, cedis, cloneLife, collectStamp, logLine, passTime, spotById, type Life, type StepResult } from "@/lib/game/world";

export type Cabin = "economy" | "business" | "first";

export const CABINS: Record<
  Cabin,
  {
    id: Cabin;
    label: string;
    emoji: string;
    cost: number;
    minutes: number;
    fun: number;
    energy: number;
    hygiene: number;
    bag: number;
    detail: string;
  }
> = {
  economy: {
    id: "economy",
    label: "Economy",
    emoji: "💺",
    cost: 320,
    minutes: 55,
    fun: 10,
    energy: -6,
    hygiene: -4,
    bag: 1,
    detail: "Window if you are lucky, a small soft drink, and the Ashanti hills under the wing.",
  },
  business: {
    id: "business",
    label: "Business",
    emoji: "🥂",
    cost: 780,
    minutes: 50,
    fun: 22,
    energy: 4,
    hygiene: 2,
    bag: 2,
    detail: "Extra legroom, a hot meal, and priority boarding before the queue gets loud.",
  },
  first: {
    id: "first",
    label: "First class",
    emoji: "👑",
    cost: 1450,
    minutes: 45,
    fun: 34,
    energy: 12,
    hygiene: 8,
    bag: 3,
    detail: "Lounge access, a wide seat, champagne before takeoff, and someone takes your bag.",
  },
};

export const FLIGHT_GAP = 40;

export function boardingWaitLabel(wait: number) {
  if (wait >= 60) {
    const hours = Math.floor(wait / 60);
    const mins = wait % 60;
    return mins ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${Math.max(1, wait)} min`;
}

export const ROUTES = [
  { id: "accra-kumasi", from: "kotoka", to: "kumasi", label: "Accra → Kumasi", minutes: 50 },
  { id: "kumasi-accra", from: "kumasi", to: "kotoka", label: "Kumasi → Accra", minutes: 50 },
] as const;

export type RouteId = (typeof ROUTES)[number]["id"];

export function routeOf(id: string) {
  return ROUTES.find((route) => route.id === id) ?? null;
}

export function cabinOf(id: string) {
  return CABINS[id as Cabin] ?? null;
}

export function flightWait(life: Life) {
  return Math.max(0, (life.flewAt ?? -1e9) + FLIGHT_GAP - life.minutes);
}

export function boardHint(life: Life, routeId: string) {
  const route = routeOf(routeId);
  if (!route) return "That flight is not on the board.";
  if (life.where === route.from) return null;
  if (route.from === "kumasi" && (life.town ?? "accra") === "kumasi" && life.where === "kumasi-airport") return null;
  const gate = route.from === "kumasi" ? "kumasi-airport" : route.from;
  return `Check in at ${spotById(gate).name} to board.`;
}

export function canBoard(life: Life, routeId: string, cabinId: string) {
  const route = routeOf(routeId);
  const cabin = cabinOf(cabinId);
  if (!route || !cabin) return "Pick a flight and a cabin.";
  const board = boardHint(life, routeId);
  if (board) return board;
  const wait = flightWait(life);
  if (wait > 0) return `The plane is turning around. Next boarding in ${boardingWaitLabel(wait)}.`;
  if (life.cash < cabin.cost) return `You need ${cedis(cabin.cost)} for ${cabin.label.toLowerCase()}.`;
  if (life.needs.energy < 15) return "Too tired to fly. Rest first.";
  return null;
}

export function bookFlight(life: Life, routeId: string, cabinId: string): StepResult {
  const blocked = canBoard(life, routeId, cabinId);
  if (blocked) return { life, notes: [], error: blocked };
  const route = routeOf(routeId)!;
  const cabin = cabinOf(cabinId)!;

  const checkIn = 25 + (cabin.id === "economy" ? 20 : cabin.id === "business" ? 10 : 5);
  const timed = passTime(cloneLife(life), checkIn + cabin.minutes).life;
  timed.cash -= cabin.cost;
  const fromTown = (life.town ?? "accra") as TownId;
  const landed = route.to === "kumasi" ? { where: "kejetia", town: "kumasi" as const } : { where: route.to, town: "accra" as const };
  timed.where = landed.where;
  timed.town = landed.town;
  timed.flewAt = timed.minutes;
  timed.needs.fun = Math.max(0, Math.min(100, timed.needs.fun + cabin.fun));
  timed.needs.energy = Math.max(0, Math.min(100, timed.needs.energy + cabin.energy));
  timed.needs.hygiene = Math.max(0, Math.min(100, timed.needs.hygiene + cabin.hygiene));
  bump(timed, "trips");
  bump(timed, "flights");
  const dest = spotById(landed.where).name;
  const notes = [`${cabin.emoji} ${cabin.label} to ${dest}. ${cabin.detail} Fare ${cedis(cabin.cost)}.`];
  const away = crossedTownNote(fromTown, landed.town, false, Boolean(life.car));
  if (away) notes.push(away);
  collectStamp(timed, route.to, notes);
  for (const note of notes) logLine(timed, note);
  return { life: timed, notes };
}
