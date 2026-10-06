import { pathLength, pointOnPath, roadPath, trafficFactor, type Point } from "@/lib/game/roads";
import { weatherAt, type Weather } from "@/lib/game/sky";
import { spotById } from "@/lib/game/world";

export type NpcTrait = "hustler" | "laid-back" | "social" | "homebody" | "night-owl" | "early-riser";
export type NpcPhase = "sleep" | "home" | "commute_work" | "work" | "commute_home" | "night_out";
export type NpcMood = "tired" | "ok" | "stressed" | "excited" | "broke";

export type NpcDef = {
  id: string;
  name: string;
  trait: NpcTrait;
  jobTitle: string;
  workId: string;
  home: Point;
  sideHustle: string;
  skin: string;
  shirt: string;
  /** Prefer night out Fri/Sat; night-owls also midweek. */
  nightsOut: boolean;
};

export type NpcLive = {
  id: string;
  name: string;
  phase: NpcPhase;
  label: string;
  mood: NpcMood;
  x: number;
  y: number;
  moving: boolean;
  face: 1 | -1;
  skin: string;
  shirt: string;
  jobTitle: string;
  sideHustle: string;
  trait: NpcTrait;
};

/** Home anchors by Accra area (near map districts, not the single player "home" pin). */
const HOMES = {
  adabraka: { x: 640, y: 980 },
  jamestown: { x: 220, y: 1120 },
  eastLegon: { x: 1620, y: 230 },
  cantonments: { x: 900, y: 470 },
  labadi: { x: 980, y: 1040 },
  madina: { x: 1050, y: 160 },
} as const;

export const NPCS: NpcDef[] = [
  {
    id: "ama",
    name: "Ama",
    trait: "hustler",
    jobTitle: "Floor at Buka",
    workId: "buka",
    home: HOMES.adabraka,
    sideHustle: "Sells credit after close",
    skin: "#8d5a3b",
    shirt: "#CE1126",
    nightsOut: false,
  },
  {
    id: "kojo",
    name: "Kojo",
    trait: "early-riser",
    jobTitle: "Ridge intern",
    workId: "office",
    home: HOMES.eastLegon,
    sideHustle: "Freelance slides at night",
    skin: "#6b4423",
    shirt: "#3b82f6",
    nightsOut: false,
  },
  {
    id: "efua",
    name: "Efua",
    trait: "social",
    jobTitle: "Makola hand",
    workId: "makola",
    home: HOMES.jamestown,
    sideHustle: "Hawks cloth on weekends",
    skin: "#a06a45",
    shirt: "#FCD116",
    nightsOut: true,
  },
  {
    id: "yaw",
    name: "Yaw",
    trait: "night-owl",
    jobTitle: "Joy FM runner",
    workId: "joy",
    home: HOMES.cantonments,
    sideHustle: "Uber after the show",
    skin: "#5c3a22",
    shirt: "#22c55e",
    nightsOut: true,
  },
  {
    id: "abena",
    name: "Abena",
    trait: "homebody",
    jobTitle: "Labadi usher",
    workId: "beach",
    home: HOMES.labadi,
    sideHustle: "Beach chairs on Sunday",
    skin: "#c68a62",
    shirt: "#ec4899",
    nightsOut: false,
  },
];

type Window = { phase: NpcPhase; start: number; end: number };

function dayWindows(npc: NpcDef, weekday: number): Window[] {
  const early = npc.trait === "early-riser" || npc.trait === "hustler";
  const late = npc.trait === "night-owl";
  const wake = early ? 5.5 : late ? 7 : 6;
  const leave = early ? 6.25 : late ? 7.75 : 6.75;
  const workEnd = late ? 17.5 : 17;
  const homeArrive = workEnd + 1.5;
  const night = npc.nightsOut && (weekday === 5 || weekday === 6 || npc.trait === "night-owl" || npc.trait === "social");
  const windows: Window[] = [
    { phase: "sleep", start: 0, end: wake },
    { phase: "home", start: wake, end: leave },
    { phase: "commute_work", start: leave, end: leave + 1.5 },
    { phase: "work", start: leave + 1.5, end: workEnd },
    { phase: "commute_home", start: workEnd, end: homeArrive },
  ];
  if (night) {
    windows.push(
      { phase: "home", start: homeArrive, end: 21 },
      { phase: "night_out", start: 21, end: 26 },
      { phase: "sleep", start: 26, end: 30 },
    );
  } else {
    windows.push(
      { phase: "home", start: homeArrive, end: 22.5 },
      { phase: "sleep", start: 22.5, end: 30 },
    );
  }
  return windows;
}

function hourStamp(at: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Accra",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    weekday: "short",
    hour12: false,
  }).formatToParts(at);
  const num = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  const weekdayName = parts.find((part) => part.type === "weekday")?.value ?? "Mon";
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekdayName);
  const rawHour = num("hour") % 24;
  const hour = rawHour + num("minute") / 60 + num("second") / 3600;
  // Fold post-midnight night_out (21→26) into 0–2 as 24–26
  const stamp = hour < 3 ? hour + 24 : hour;
  return { hour, stamp, weekday: weekday < 0 ? at.getDay() : weekday };
}

function workPoint(workId: string): Point {
  const spot = spotById(workId);
  return { x: spot.x, y: spot.y };
}

function nightPoint(npc: NpcDef): Point {
  if (npc.trait === "social" || npc.id === "efua") return { x: spotById("bloom").x, y: spotById("bloom").y };
  if (npc.trait === "night-owl") return { x: spotById("twist").x, y: spotById("twist").y };
  return { x: spotById("buka").x, y: spotById("buka").y };
}

function windowOf(npc: NpcDef, at: Date) {
  const { stamp, weekday } = hourStamp(at);
  const windows = dayWindows(npc, weekday);
  return windows.find((item) => stamp >= item.start && stamp < item.end) ?? windows[0];
}

function progressIn(win: Window, stamp: number) {
  const span = Math.max(0.15, win.end - win.start);
  return Math.min(1, Math.max(0, (stamp - win.start) / span));
}

function moodFor(npc: NpcDef, phase: NpcPhase, hour: number, sky: Weather): NpcMood {
  if (phase === "commute_work" || phase === "commute_home") {
    if (sky.flood || (sky.rain && trafficFactor(hour) > 1.2)) return "stressed";
    if (trafficFactor(hour) > 1.4) return "stressed";
    return "ok";
  }
  if (phase === "night_out") {
    if (sky.flood) return "tired";
    if (sky.rain) return "ok";
    return "excited";
  }
  if (phase === "sleep" || (phase === "home" && hour < 8)) return "tired";
  if (sky.harmattan && phase === "home" && hour < 10) return "tired";
  if (npc.trait === "hustler" && phase === "work") return "ok";
  if (phase === "work" && hour >= 15) return "tired";
  return "ok";
}

function labelFor(npc: NpcDef, phase: NpcPhase, mood: NpcMood, sky: Weather): string {
  if (phase === "sleep") return "Sleeping";
  if (phase === "commute_work") {
    if (sky.flood) return "Flood · to work";
    if (sky.rain) return mood === "stressed" ? "Rain traffic · work" : "Wet commute · work";
    return mood === "stressed" ? "Traffic · to work" : "Heading to work";
  }
  if (phase === "work") return npc.jobTitle;
  if (phase === "commute_home") {
    if (sky.flood) return "Flood · home";
    if (sky.rain) return mood === "stressed" ? "Rain traffic · home" : "Wet commute · home";
    return mood === "stressed" ? "Traffic · home" : "Heading home";
  }
  if (phase === "night_out") {
    if (sky.flood) return "Stayed in · flood";
    if (sky.rain) return "Under a shed · rain";
    return "Out tonight";
  }
  if (phase === "home" && mood === "tired") return sky.harmattan ? "Home · harmattan" : "Home · recovering";
  return npc.sideHustle.includes("credit") ? "Home · side hustle" : "Home";
}

function placeForPhase(npc: NpcDef, phase: NpcPhase): Point {
  if (phase === "work") return workPoint(npc.workId);
  if (phase === "night_out") return nightPoint(npc);
  return npc.home;
}

function commutePath(npc: NpcDef, phase: NpcPhase) {
  if (phase === "commute_work") return roadPath(npc.home, workPoint(npc.workId));
  if (phase === "commute_home") return roadPath(workPoint(npc.workId), npc.home);
  if (phase === "night_out") return roadPath(npc.home, nightPoint(npc));
  return [placeForPhase(npc, phase)];
}

/** Live positions for all hustle NPCs at Accra wall time `at`. */
export function npcsAt(at: Date = new Date()): NpcLive[] {
  const { hour, stamp } = hourStamp(at);
  const sky = weatherAt(at);
  const rush = trafficFactor(Math.floor(hour % 24)) * (sky.flood ? 1.35 : sky.rain ? 1.2 : 1);
  return NPCS.map((npc) => {
    const win = windowOf(npc, at);
    let phase = win.phase;
    let progress = progressIn(win, stamp);
    // Rain / flood: fewer people out; cancel night_out for homebodies & flood
    if (phase === "night_out" && (sky.flood || (sky.rain && (npc.trait === "homebody" || npc.trait === "early-riser")))) {
      phase = "home";
      progress = 1;
    }
    // Stretch commute in rush / rain so they stay on the road longer
    if ((phase === "commute_work" || phase === "commute_home") && rush > 1) {
      progress = Math.min(1, progress / (rush * 0.85));
    }
    const moving = phase === "commute_work" || phase === "commute_home" || (phase === "night_out" && progress < 0.35);
    let x: number;
    let y: number;
    let face: 1 | -1 = 1;
    if (moving) {
      const path = commutePath(npc, phase === "night_out" ? "night_out" : phase);
      // night_out: first 35% is travel, rest at venue
      const t = phase === "night_out" ? Math.min(1, progress / 0.35) : progress;
      const point = pointOnPath(path, t);
      x = point.x;
      y = point.y;
      const next = pointOnPath(path, Math.min(1, t + 0.02));
      face = next.x < point.x ? -1 : 1;
      if (phase === "night_out" && progress >= 0.35) {
        const venue = nightPoint(npc);
        x = venue.x;
        y = venue.y;
      }
    } else {
      const place = placeForPhase(npc, phase);
      x = place.x;
      y = place.y;
    }
    // Tiny idle drift so work/home don't stack perfectly
    const wobble = hash(npc.id) % 18;
    if (!moving && phase !== "sleep") {
      x += (wobble % 9) - 4;
      y += (Math.floor(wobble / 3) % 7) - 3;
    }
    const mood = moodFor(npc, phase, Math.floor(hour % 24), sky);
    // Hide deep sleepers slightly (still show at home as a soft pin)
    return {
      id: npc.id,
      name: npc.name,
      phase,
      label: labelFor(npc, phase, mood, sky),
      mood,
      x,
      y,
      moving: moving && !(phase === "night_out" && progress >= 0.35),
      face,
      skin: npc.skin,
      shirt: npc.shirt,
      jobTitle: npc.jobTitle,
      sideHustle: npc.sideHustle,
      trait: npc.trait,
    };
  });
}

function hash(text: string) {
  let n = 0;
  for (let i = 0; i < text.length; i += 1) n = (n * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(n);
}

export function phaseEmoji(phase: NpcPhase) {
  if (phase === "sleep") return "💤";
  if (phase === "commute_work" || phase === "commute_home") return "🚌";
  if (phase === "work") return "💼";
  if (phase === "night_out") return "🌙";
  return "🏠";
}

/** Approximate commute metres for UI/debug. */
export function npcCommuteKm(npc: NpcDef) {
  return Math.round((pathLength(roadPath(npc.home, workPoint(npc.workId))) / 80) * 10) / 10;
}
