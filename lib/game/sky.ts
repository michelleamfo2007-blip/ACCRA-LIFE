import type { Ride } from "@/lib/game/world";

export type SeasonId = "harmattan" | "detty" | "major-rains" | "minor-rains" | "dry";

export type Season = { id: SeasonId; label: string; emoji: string; detail: string };

export type Weather = {
  rain: boolean;
  flood: boolean;
  harmattan: boolean;
  label: string;
  season: SeasonId;
};

export function seasonOf(at = new Date()): Season {
  const month = at.getUTCMonth();
  const day = at.getUTCDate();
  if ((month === 11 && day >= 15) || (month === 0 && day <= 2)) {
    return { id: "detty", label: "Detty December", emoji: "🎆", detail: "Returnees are home. Parties cost 30% more, rooms let for more, and the beaches never close." };
  }
  if (month === 11 || month === 0 || month === 1) {
    return { id: "harmattan", label: "Harmattan", emoji: "🌫️", detail: "Dusty haze from the Sahara. You get dirty faster, colds go round, and the mornings are cool." };
  }
  if (month >= 3 && month <= 6) {
    return { id: "major-rains", label: "Major rains", emoji: "🌧️", detail: "Afternoon storms and flooded roads around Circle. Malaria season, so sleep under a net." };
  }
  if (month === 8 || month === 9) {
    return { id: "minor-rains", label: "Minor rains", emoji: "🌦️", detail: "Shorter showers, still enough for the farm and the mosquitoes." };
  }
  return { id: "dry", label: "Dry season", emoji: "☀️", detail: "Hot, bright and busy. Good days for the beach and the farm needs watering." };
}

function seed(text: string) {
  let hash = 2166136261;
  for (const char of text) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b);
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35);
  hash ^= hash >>> 16;
  return (hash >>> 0) / 4294967295;
}

export function weatherAt(at = new Date()): Weather {
  const month = at.getUTCMonth();
  const hour = at.getUTCHours();
  const key = `${at.getUTCFullYear()}-${month}-${at.getUTCDate()}`;
  const season = seasonOf(at);
  const major = month >= 3 && month <= 6;
  const minor = month === 8 || month === 9;
  const harmattan = season.id === "harmattan";
  const chance = major ? 0.45 : minor ? 0.3 : harmattan ? 0.02 : 0.06;
  if (seed(`rain-${key}`) >= chance) {
    return {
      rain: false,
      flood: false,
      harmattan,
      season: season.id,
      label: harmattan ? "Harmattan haze. Dusty and cool." : season.id === "detty" ? "Hot Detty night air." : "Dry and bright",
    };
  }
  const start = 12 + Math.floor(seed(`start-${key}`) * 7);
  const length = 2 + Math.floor(seed(`length-${key}`) * 4);
  if (hour < start || hour >= start + length) {
    return {
      rain: false,
      flood: false,
      harmattan,
      season: season.id,
      label: `Rain due around ${start > 12 ? start - 12 : start}${start >= 12 ? "pm" : "am"}`,
    };
  }
  const flood = major && seed(`flood-${key}`) < 0.35;
  return {
    rain: true,
    flood,
    harmattan,
    season: season.id,
    label: flood ? "Heavy rain. Roads around Circle are flooding." : "Rain in Accra. Umbrellas up.",
  };
}

/** Combine Accra rush hour with rain/flood for travel time. */
export function travelFactor(hour: number, sky: Weather) {
  let factor = 1;
  if ((hour >= 6 && hour < 9) || (hour >= 17 && hour < 20)) factor = 1.55;
  else if (hour >= 12 && hour < 14) factor = 1.2;
  if (sky.rain) factor *= sky.flood ? 1.4 : 1.2;
  if (sky.harmattan) factor *= 1.05;
  return factor;
}

/** Need hits from sitting in Accra weather / traffic. */
export function weatherStress(sky: Weather, hour: number) {
  const rush = travelFactor(hour, sky) > 1.35;
  return {
    fun: (sky.flood ? -5 : sky.rain ? -2 : 0) + (rush ? -3 : 0) + (sky.harmattan && hour < 10 ? 1 : 0),
    energy: (sky.flood ? -4 : sky.rain ? -2 : 0) + (rush ? -3 : 0) + (sky.harmattan ? -1 : 0),
    hygiene: sky.harmattan ? -2 : sky.rain ? -1 : 0,
    social: 0,
    hunger: 0,
    bladder: 0,
  };
}

export function rideIn(ride: Ride, sky: Weather, hour = new Date().getHours()): Ride & { blocked?: string; note?: string } {
  const rush = travelFactor(hour, sky);
  let next: Ride & { blocked?: string; note?: string } = { ...ride };
  if (sky.flood && ride.id === "okada") return { ...ride, blocked: "Okada riders have parked for the flood." };
  if (sky.rain && ride.id === "trek") {
    next = { ...next, minutes: ride.minutes + (sky.flood ? 25 : 15), note: "Wet walk" };
  } else if (sky.rain && ride.id !== "train") {
    const slow = sky.flood ? 2 : 1.5;
    const extra = ride.id === "car" ? 0 : ride.id === "taxi" ? (sky.flood ? 15 : 8) : sky.flood ? 4 : 2;
    next = { ...next, minutes: Math.round(ride.minutes * slow), cost: ride.cost + extra, note: sky.flood ? "Flood fare" : "Rain fare" };
  }
  if (rush > 1.25 && ride.id !== "train") {
    next = {
      ...next,
      minutes: Math.round(next.minutes * Math.min(1.35, rush / 1.15)),
      note: next.note ? `${next.note} · rush` : "Rush hour",
    };
  }
  return next;
}
