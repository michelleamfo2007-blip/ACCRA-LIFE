import { ACCRA_SPOTS, CLUB_IDS } from "@/lib/game/accra-spots";
import { MORE_SPOTS, TRIP_IDS } from "@/lib/game/more-spots";
import { tickPhone } from "@/lib/game/phone-shell";
import { arrivalFor, crossedTownNote, type TownId } from "@/lib/game/towns";
import type { Net, SpotPos } from "@/lib/game/net";
import { bizWages } from "@/lib/game/biz-table";
import { isNightlife, sessionAfterVerb, sessionOf } from "@/lib/game/club-night";
import { weatherAt, weatherStress } from "@/lib/game/sky";

export type NeedKey = "hunger" | "energy" | "fun" | "social" | "hygiene" | "bladder";

export type Needs = Record<NeedKey, number>;

export type Look = {
  body: "woman" | "man";
  hair: string;
  outfit: string;
  pattern: string;
  skin: string;
  cloth: string;
  accent: string;
};

export type Skills = {
  hustle: number;
  cooking: number;
  music: number;
  fitness: number;
  charm: number;
  coding: number;
  career: number;
};

export type Life = {
  look: Look;
  traits: string[];
  dream: string;
  birthId: string;
  homeId: string;
  needs: Needs;
  cash: number;
  loan: number;
  weeklyLoan: number;
  learn: number;
  minutes: number;
  skills: Skills;
  where: string;
  /** Which city map the player is standing in. Missing means Accra. */
  town?: string;
  /** Starred place ids. */
  stars?: string[];
  inventory: string[];
  log: string[];
  inbox: string[];
  relations: { name: string; score: number; visits?: number }[];
  /** Friends currently at your place (home loop) or seated at your restaurant table. */
  guests?: {
    name: string;
    username?: string;
    arrivedAt: number;
    until: number;
    doing: string;
    sleepover?: boolean;
    gift?: string;
    spot?: string;
    seatId?: string;
    eta?: number;
    ride?: string;
    purpose?: string;
    from?: string;
  }[];
  /** Nightlife session — bar → table → bottle → dance → leave. */
  club?: { spot: string; state: string; bottles: number; spend: number; danced: boolean; startedAt: number; posted?: boolean };
  /** Soft next-morning penalty after a heavy club night. */
  hangover?: { until: number } | null;
  /** Seat you claimed at an eatery (for inviting friends to the table). */
  table?: { spot: string; seatId: string } | null;
  funded: boolean;
  lastRentAt: number;
  outageCheckedDay: number;
  dumsor: boolean;
  gemDay: number;
  furniture?: Placed[];
  /** Built-in pieces (bed, stove, and the rest) after you move them. */
  layout?: Placed[];
  /** How many times the room has been paid to grow. 0, 1, or 2. */
  span?: number;
  stored?: string[];
  floor?: string;
  transfers?: PurseNote[];
  seenTransfers?: string[];
  chats?: unknown;
  net?: Net;
  spot?: SpotPos;
  businesses?: Business[];
  bag?: Record<string, { qty: number; paid: number }>;
  soldToday?: { day: number; spots: Record<string, number> };
  pantry?: number;
  cool?: Record<string, number>;
  plots?: Plot[];
  kids?: Kid[];
  expecting?: number | null;
  music?: Music;
  school?: Schooling;
  car?: CarState | null;
  farm?: (FarmBed | null)[];
  health?: Health;
  tailor?: Tailor;
  badges?: string[];
  streak?: { day: number; count: number };
  stats?: Record<string, number>;
  generation?: number;
  playDay?: { day: number; bets: number };
  story?: Record<string, number>;
  bank?: Bank;
  fleet?: Vehicle[];
  team?: Team | null;
  pets?: Pet[];
  community?: Community;
  guide?: string[];
  seenParcels?: string[];
  stamps?: string[];
  flewAt?: number;
  phone?: {
    wallpaper: string;
    airtime: number;
    battery: number;
    model: "basic" | "smart" | "pro";
    ringtone: string;
    hidden: string[];
    lostUntil?: number;
    snatchedDay?: number;
  };
  checkins?: string[];
  weekly?: { week: number; streak: number; count: number };
  chop?: ChopBar | null;
  ranks?: Record<string, { rank: number; shifts: number; lastAsk?: number }>;
  movedAt?: number;
  tour?: boolean;
  turf?: { area: string; week: number; points: number; last?: { week: number; points: number; area: string } };
};

export type ChopBar = {
  name: string;
  spot: string;
  openedAt: number;
  menu: { dish: string; price: number }[];
  stock: Record<string, number>;
  cooks: { id: string; name: string; hired: number }[];
  lastServe: number;
  lastWages: number;
  rating: number;
  served: number;
};

export type Bank = { savings: number; lastInterest: number; loan: number; loanDue: number; score: number };
export type Vehicle = { id: string; kind: string; route: string; driver: string | null; condition: number; lastCollect: number; broken: boolean; papersUntil: number };
export type Footballer = { id: string; name: string; pos: "GK" | "DEF" | "MID" | "FWD"; skill: number };
export type Team = { name: string; color: string; players: Footballer[]; morale: number; wins: number; draws: number; losses: number; lastTrain?: number; lastGala?: number; trophies: number };
export type Pet = { id: string; kind: string; name: string; fedAt: number; boughtAt: number; lastYield: number; lastPlay?: number };
export type Community = { faith?: "church" | "mosque" | null; standing: number; lastService?: number; givenDay?: { day: number; amount: number }; projects: string[]; chief?: { stool: string; since: number } | null; lastCourt?: number };

export type Tenant = { id: string; name: string; note: string; pays: "steady" | "late" | "trouble"; since: number };
export type Plot = { id: string; area: string; stage: number; stageAt: number; spent: number; guard?: "waiting" | "court" | null; guardUntil?: number; tenants: number; lastRent: number; lastAdvert?: number; readyAt?: number; house?: string; rentAsk?: number; people?: Tenant[] };
export type Kid = { id: string; name: string; dayName: string; girl: boolean; born: number; outdoored: boolean; school: boolean; care: number };
export type Song = { id: string; title: string; at: number; quality: number; paid: number; video?: boolean };
export type Music = { songs: Song[]; fans: number; lastRecord?: number; lastGig?: number; lastShow?: number; shows?: number };
export type Schooling = { certs: string[]; course?: string | null; done?: number; lastClass?: number };
export type CarState = { id: string; fuel: number; insuredUntil: number; lastHail?: number; color?: string; condition?: number; broken?: boolean; name?: string; plate?: string };
export type FarmBed = { crop: string; plantedAt: number; waters: number; lastWater: number };
export type SickKind = "malaria" | "flu" | "tummy" | "burnout";
export type Health = { sick?: { kind: SickKind; since: number } | null; nhisUntil?: number; day?: number };
export type Outfit = { style: string; color: string };
export type Tailor = { orders: { id: string; style: string; color: string; readyAt: number }[]; wardrobe: Outfit[] };

export const SICK_LABEL: Record<SickKind, string> = { malaria: "Malaria", flu: "Flu", tummy: "Running stomach", burnout: "Burnout" };

const CERT_PAY: Record<string, number> = { wassce: 0.15, catering: 0.1, electrical: 0.1, bootcamp: 0.15, degree: 0.3, masters: 0.2 };

export function jobBoost(life: Life) {
  return 1 + (life.school?.certs ?? []).reduce((sum, cert) => sum + (CERT_PAY[cert] ?? 0), 0);
}

export const PANTRY_MAX = 12;

export type Business = { id: string; kind: string; openedAt: number; lastCollect: number; level: number };

export type PurseNote = { id: string; delta: number; note: string };

export type HomeGrade = "low" | "hall" | "mid" | "high";

export type Placed = {
  id: string;
  x: number;
  z: number;
  rot: number;
};

export const FIXTURES = [
  { id: "fix-bed", name: "Bed", x: 2.15, z: -2.35, color: "#6e5344" },
  { id: "fix-sofa", name: "Sofa", x: -1.55, z: -0.15, color: "#2f8f6b" },
  { id: "fix-fridge", name: "Fridge", x: 4.55, z: 1.7, color: "#f4f7fa" },
  { id: "fix-stove", name: "Stove", x: 4.4, z: 3.05, color: "#c4552a" },
  { id: "fix-toilet", name: "Toilet", x: -4.7, z: 3.3, color: "#f7f7f7" },
  { id: "fix-shower", name: "Shower", x: -5.15, z: 1.9, color: "#d5e4f2" },
  { id: "fix-radio", name: "Radio", x: 0.35, z: 1.35, color: "#c4894f" },
  { id: "fix-wall-bed", name: "Bedroom wall", x: 3.4, z: -1.35, color: "#f3ead8" },
  { id: "fix-wall-bath", name: "Bathroom wall", x: -3.15, z: 2.85, color: "#e7d8c4" },
  { id: "fix-wall-side", name: "Side wall", x: -4.6, z: 1.25, color: "#f3ead8" },
] as const;

export const DIVIDERS = [
  { id: "fix-wall-bed", along: "x" as const, length: 3.2 },
  { id: "fix-wall-bath", along: "z" as const, length: 3.1 },
  { id: "fix-wall-side", along: "x" as const, length: 2.6 },
] as const;

export const WIDEN_COST = [800, 2000] as const;

export function fixtureAt(life: Life, id: string): Placed {
  const base = FIXTURES.find((item) => item.id === id);
  const moved = (life.layout ?? []).find((piece) => piece.id === id);
  if (moved) return moved;
  return { id, x: base?.x ?? 0, z: base?.z ?? 0, rot: 0 };
}

export function roomReach(span = 0) {
  const step = Math.min(2, Math.max(0, span));
  const extra = step * 1.15;
  return {
    minX: -4.6 - extra,
    maxX: 4.6 + extra,
    minZ: -3.4 - extra * 0.7,
    maxZ: 3.6 + extra * 0.7,
    placeMinX: -4.2 - extra,
    placeMaxX: 4.2 + extra,
    placeMinZ: -3.2 - extra * 0.7,
    placeMaxZ: 3.4 + extra * 0.7,
    halfW: 6 + step * 1.2,
    halfD: 4.5 + step * 0.9,
  };
}

/** Air conditioner, curtains, and the kente cloth stay on a wall. */
export function hangSpot(id: string, x: number, z: number, span = 0) {
  const room = roomReach(span);
  if (id === "curtains") return { x: -1.1, z: -room.halfD + 0.28, rot: 0, y: 0 };
  if (id === "ac") {
    const along = Math.min(1.5, Math.max(0.35, x > 0.2 && x < 1.8 ? x : 0.9));
    return { x: along, z: -room.halfD + 0.24, rot: 0, y: 1.38 };
  }
  if (id === "kente") {
    const along = Math.min(room.placeMaxX - 0.8, Math.max(0.2, x || 1.8));
    return { x: along, z: -room.halfD + 0.24, rot: 0, y: 0.95 };
  }
  return null;
}

export type Verb = {
  id: string;
  label: string;
  detail: string;
  minutes: number;
  cost: number;
  earn: number;
  effects: Partial<Needs>;
  skill?: keyof Skills;
  social?: boolean;
  special?: "pitch" | "gem";
  tag?: "food" | "party" | "gym" | "church";
  job?: boolean;
  emoji?: string;
  sleep?: boolean;
  needs?: string[];
  power?: boolean;
  pantry?: number;
  stock?: number;
  cool?: boolean;
  perSkill?: number;
};

export type Spot = {
  id: string;
  name: string;
  emoji: string;
  x: number;
  y: number;
  group: "home" | "hang" | "sea" | "civic" | "work" | "trip" | "soon";
  /** City map this pin belongs to. Missing means Accra. */
  town?: string;
  blurb: string;
  soon?: boolean;
  far?: number;
  actions: Verb[];
};

export const HAIRS = ["Braids", "Afro", "Bun", "Ponytail", "Long", "Locs", "Low cut", "Headwrap"];
export const OUTFITS = ["Classic", "Casual", "Office", "All-white", "Site work"];
export const PATTERNS = ["Plain", "Kente", "Ankara", "Tie-dye"];
export const SKINS = ["#c68a62", "#a86f4c", "#8d5a3b", "#7a4a2c", "#653c24", "#51301d", "#3d2416", "#2a1a12"];
export const CLOTHS = ["#e7c85a", "#2f7de1", "#22b573", "#e5484d", "#f59e42", "#8b5cf6", "#ec4899", "#1d2433", "#f4efe6", "#c9a227"];
export const ACCENTS = ["#1d2433", "#f4efe6", "#c9a227", "#2f7de1", "#e5484d", "#14b8a6"];

export const TRAITS = [
  { id: "hustler", emoji: "💼", name: "Hustler", detail: "Sees money in a queue. Shifts pay more and hustle grows faster." },
  { id: "foodie", emoji: "🍲", name: "Foodie", detail: "Lives for waakye. Cooking comes easier and a good plate lifts you higher." },
  { id: "outout", emoji: "🎉", name: "Out Out", detail: "Always dressed for an all-white. Parties hit harder, and quiet time gets boring faster." },
  { id: "gym", emoji: "💪", name: "Gym Rat", detail: "Leg day is a personality. Workouts feel good and fitness climbs fast." },
  { id: "smooth", emoji: "😏", name: "Smooth Talker", detail: "Mouth sweet. People warm up faster when you hang around." },
  { id: "lazy", emoji: "😴", name: "Lazy Bone", detail: "Why stand when the stool is right there? Energy lasts longer. Work pays a little less." },
  { id: "fresh", emoji: "🧼", name: "Always Fresh", detail: "You stay neat longer than everybody else in this heat." },
  { id: "night", emoji: "🌙", name: "Night Owl", detail: "Accra no dey sleep, and neither do you. Nightlife treats you well." },
  { id: "tech", emoji: "💻", name: "Tech Person", detail: "Three startup ideas before breakfast. Coding at the hub sticks." },
  { id: "musical", emoji: "🎶", name: "Musical", detail: "Hums in the trotro. Music skill grows whenever a speaker is on." },
] as const;

export const DREAMS = [
  { id: "oga", emoji: "👔", name: "Oga at the Top", detail: "Reach the top level of a career." },
  { id: "landlord", emoji: "🏡", name: "East Legon Landlord", detail: "Build a net worth of ₵25,000." },
  { id: "star", emoji: "🎤", name: "Afrobeats Star", detail: "Max out Music (level 10)." },
  { id: "padi", emoji: "🤝", name: "Everybody's Padi", detail: "Become close with 4 people." },
  { id: "unicorn", emoji: "🦄", name: "Legon Unicorn", detail: "Get a startup funded at Impact Hub." },
] as const;

export type Birth = {
  id: string;
  emoji: string;
  name: string;
  line: string;
  perks: string[];
  cash: number;
  loan: number;
  weeklyLoan: number;
  learn: number;
  hustle: number;
  cooking: number;
  charm: number;
  socialBonus: number;
  blockedHomes: string[];
};

export const BIRTHS: Birth[] = [
  {
    id: "susu",
    emoji: "🏦",
    name: "Susu Baby!",
    line: "Self-made hits different.",
    perks: [
      "₵50,000 to start — repay ₵120 every Saturday on the susu loan",
      "Hustle skill starts at 2",
      "You learn every skill a little faster",
      "East Legon is a dream until the money is real",
    ],
    cash: 50000,
    loan: 600,
    weeklyLoan: 120,
    learn: 1.25,
    hustle: 2,
    cooking: 0,
    charm: 0,
    socialBonus: 0,
    blockedHomes: ["east-legon"],
  },
  {
    id: "family",
    emoji: "🏡",
    name: "Cantonments Compound",
    line: "The gate already knows your name.",
    perks: ["Start with ₵50,000", "Every home is open if you can make rent", "The compound already likes you"],
    cash: 50000,
    loan: 0,
    weeklyLoan: 0,
    learn: 1,
    hustle: 0,
    cooking: 0,
    charm: 1,
    socialBonus: 15,
    blockedHomes: [],
  },
  {
    id: "market",
    emoji: "🧺",
    name: "Makola Child",
    line: "You can price a tomato from across the lane.",
    perks: ["Start with ₵50,000", "Cooking starts at 2", "Chop bars and Makola food cost less", "East Legon rent can wait"],
    cash: 50000,
    loan: 0,
    weeklyLoan: 0,
    learn: 1,
    hustle: 1,
    cooking: 2,
    charm: 0,
    socialBonus: 0,
    blockedHomes: ["east-legon"],
  },
  {
    id: "pastor",
    emoji: "⛪",
    name: "Pastor's Child",
    line: "Half of Ridge already knows your surname.",
    perks: ["Start with ₵50,000", "Charm starts at 2", "Church lifts you higher than a normal Sunday"],
    cash: 50000,
    loan: 0,
    weeklyLoan: 0,
    learn: 1,
    hustle: 0,
    cooking: 0,
    charm: 2,
    socialBonus: 10,
    blockedHomes: [],
  },
  {
    id: "returnee",
    emoji: "✈️",
    name: "Just Landed",
    line: "The accent arrives before the suitcase.",
    perks: ["Start with ₵50,000", "People assume the wallet is heavier than it is", "East Legon is open, and the rent still bites"],
    cash: 50000,
    loan: 0,
    weeklyLoan: 0,
    learn: 1,
    hustle: 0,
    cooking: 0,
    charm: 1,
    socialBonus: 5,
    blockedHomes: [],
  },
];

export const HOMES = [
  {
    id: "legon-hall",
    emoji: "🎓",
    name: "UG hall bunk",
    area: "Legon",
    tag: "Student life",
    detail: "Lectures, a hot plate, and somebody's speaker at midnight. A bunk in a hall at the University of Ghana.",
    rent: 25,
    grade: "hall" as const,
    comfort: 4,
    neighbor: "Ama from the next bunk",
  },
  {
    id: "jamestown",
    emoji: "🏘️",
    name: "Chamber and hall",
    area: "Jamestown",
    tag: "Hard start",
    detail: "One room, a shared yard, and the sea air when the wind is kind. Cheap rent, loud dreams.",
    rent: 40,
    grade: "low" as const,
    comfort: 0,
    neighbor: "Auntie Esi downstairs",
  },
  {
    id: "adabraka",
    emoji: "🚪",
    name: "Self-contain",
    area: "Adabraka",
    tag: "Balanced",
    detail: "Your own door, a small kitchen corner, and a balcony that sees the street. Balanced.",
    rent: 120,
    grade: "mid" as const,
    comfort: 8,
    neighbor: "Auntie Akua next door",
  },
  {
    id: "east-legon",
    emoji: "✨",
    name: "Mini-flat",
    area: "East Legon",
    tag: "Big spender",
    detail: "Bedroom, sitting room, kitchen, your own bathroom. The light bill will introduce itself.",
    rent: 450,
    grade: "high" as const,
    comfort: 14,
    neighbor: "Kojo from upstairs",
  },
] as const;

export const BIG_HOMES = [
  {
    id: "cantonments",
    emoji: "🏡",
    name: "Townhouse",
    area: "Cantonments",
    tag: "Moving up",
    detail: "Two floors, a gate with a watchman, and mango trees over the wall.",
    rent: 900,
    grade: "high" as const,
    comfort: 20,
    neighbor: "Mrs Asante next door",
  },
  {
    id: "trasacco",
    emoji: "🏰",
    name: "Trasacco villa",
    area: "East Legon",
    tag: "Made it",
    detail: "A pool, a generator that never blinks, and security who salute your car.",
    rent: 2500,
    grade: "high" as const,
    comfort: 28,
    neighbor: "Nana Kwame across the road",
  },
  {
    id: "own-house",
    emoji: "🔑",
    name: "Your own house",
    area: "Your plot",
    tag: "No landlord",
    detail: "The house you built. Nobody knocks on Saturday for rent.",
    rent: 0,
    grade: "high" as const,
    comfort: 22,
    neighbor: "the tenant in the boys' quarters",
  },
] as const;

export type Home = (typeof HOMES)[number] | (typeof BIG_HOMES)[number];

export const JOB_RANKS = ["Trainee", "Staff", "Senior", "Supervisor", "Manager"] as const;
export const RANK_PAY = [1, 1.12, 1.25, 1.4, 1.6];
export const RANK_SHIFTS = [0, 4, 10, 20, 35];
export const RANK_CAREER = [0, 1, 3, 5, 7];

export const TURF_CAP = 100;

export function turfWeekOf(at = Date.now()) {
  return Math.floor((at / 86400000 + 3) / 7);
}

export function turfPoint(life: Life, points: number) {
  const turf = life.turf;
  if (!turf || points <= 0) return;
  const week = turfWeekOf();
  const current = turf.week === week ? turf.points : 0;
  const last = turf.week === week ? turf.last : turf.week === week - 1 ? { week: turf.week, points: turf.points, area: turf.area } : turf.last;
  life.turf = { area: turf.area, week, points: Math.min(TURF_CAP, current + points), last };
}

export function jobOfVerb(verbId: string) {
  return JOBS.find((job) => job.verb.id === verbId) ?? null;
}

export function rankOf(life: Life, jobId: string) {
  return life.ranks?.[jobId] ?? { rank: 0, shifts: 0 };
}

const eat = (partial: Partial<Verb> & Pick<Verb, "id" | "label" | "detail">): Verb => ({
  minutes: 30,
  cost: 0,
  earn: 0,
  effects: {},
  ...partial,
});

export const HOME_VERBS: Verb[] = [
  eat({ id: "sleep", label: "Sleep", detail: "Seven hours. Tomorrow can argue with you later.", minutes: 420, effects: { energy: 46, hunger: -8 } }),
  eat({ id: "cooler", label: "Eat from the cooler", detail: "Rice and stew. Not fancy. It works.", minutes: 20, cost: 12, effects: { hunger: 32, bladder: -8 }, tag: "food" }),
  eat({ id: "cook", label: "Cook jollof", detail: "One pot, too much pepper, the whole corridor smells it.", minutes: 50, cost: 22, effects: { hunger: 48, fun: 8 }, skill: "cooking", tag: "food" }),
  eat({ id: "shower", label: "Shower", detail: "Cold water still counts as a personality reset.", minutes: 20, effects: { hygiene: 46, energy: -2 } }),
  eat({ id: "toilet", label: "Use the toilet", detail: "Handle your business.", minutes: 8, effects: { bladder: 60 } }),
  eat({ id: "radio", label: "Play the radio", detail: "Joy FM, a gospel hour, or somebody's new single.", minutes: 25, effects: { fun: 16 }, skill: "music" }),
  eat({ id: "gist", label: "Gist with the neighbour", detail: "Five minutes that become forty.", minutes: 30, effects: { social: 16, fun: 6 }, social: true }),
  eat({ id: "sing", label: "Sing highlife", detail: "One chorus, then the neighbour joins whether you asked or not.", minutes: 15, effects: { fun: 14 }, skill: "music" }),
  eat({ id: "skit", label: "Record a skit", detail: "Phone up. One take. The corridor is the audience.", minutes: 18, effects: { fun: 12, social: 4 } }),
  eat({ id: "hustle-chat", label: "Chat hustle", detail: "A voice note, a price, and somebody who actually pays.", minutes: 20, earn: 15, effects: { social: 10 }, skill: "hustle", social: true }),
  eat({ id: "call-home", label: "Call mummy", detail: "She asks if you have eaten. You lie, then you don't.", minutes: 12, effects: { social: 14 }, social: true }),
  eat({ id: "daydream", label: "Daydream about abroad", detail: "A quiet minute where the ticket is already booked.", minutes: 10, effects: { fun: 8 } }),
  eat({ id: "dance", label: "Dance in the room", detail: "Highlife, then azonto, then you remember the neighbours.", minutes: 12, effects: { fun: 16, energy: -4 } }),
];

export const JOBS: { id: string; place: string; title: string; verb: Verb }[] = [
  {
    id: "buka-floor",
    place: "buka",
    title: "Floor at Buka",
    verb: eat({ id: "job-buka", label: "Work the floor", detail: "Plates, orders, and auntie watching your attitude.", minutes: 240, earn: 70, effects: { energy: -24, hunger: -12, fun: -4 }, skill: "career", job: true }),
  },
  {
    id: "ridge-intern",
    place: "office",
    title: "Ridge office intern",
    verb: eat({ id: "job-office", label: "Intern shift", detail: "Emails, water runs, and one meeting that could have been a text.", minutes: 360, earn: 140, effects: { energy: -28, fun: -8, social: 6 }, skill: "career", job: true }),
  },
  {
    id: "makola-hand",
    place: "makola",
    title: "Makola hand",
    verb: eat({ id: "job-makola", label: "Help the stall", detail: "Carry, call customers, don't drop the tomatoes.", minutes: 300, earn: 55, effects: { energy: -22, hunger: -10 }, skill: "hustle", job: true }),
  },
  {
    id: "labadi-usher",
    place: "beach",
    title: "Labadi usher",
    verb: eat({ id: "job-beach", label: "Usher the beach", detail: "Chairs, shade, and telling people the sea is not a bin.", minutes: 240, earn: 80, effects: { energy: -18, fun: 6, hygiene: -8 }, skill: "career", job: true }),
  },
  {
    id: "joy-runner",
    place: "joy",
    title: "Joy FM runner",
    verb: eat({ id: "job-joy", label: "Studio runner", detail: "Cues, water, and standing very still while the mics are hot.", minutes: 240, earn: 90, effects: { energy: -16, fun: 8 }, skill: "music", job: true }),
  },
  {
    id: "kotoka-crew",
    place: "kotoka",
    title: "Kotoka ground crew",
    verb: eat({ id: "job-kotoka", label: "Ground crew shift", detail: "Hi-vis vest, ear defenders, and suitcases that weigh more than they should.", minutes: 300, earn: 110, effects: { energy: -26, hunger: -12, hygiene: -10 }, skill: "career", job: true }),
  },
  {
    id: "tema-dock",
    place: "tema",
    title: "Tema dockhand",
    verb: eat({ id: "job-tema", label: "Dock shift", detail: "Lashing containers while the cranes swing overhead.", minutes: 300, earn: 95, effects: { energy: -30, hunger: -14, hygiene: -14 }, skill: "fitness", job: true }),
  },
  {
    id: "kejetia-hand",
    place: "kejetia",
    title: "Kejetia hand",
    verb: eat({ id: "job-kejetia", label: "Carry at Kejetia", detail: "Boxes, cloth, and a lane that does not move aside.", minutes: 280, earn: 60, effects: { energy: -24, hunger: -12, hygiene: -10 }, skill: "hustle", job: true }),
  },
  {
    id: "palace-guide",
    place: "manhyia",
    title: "Palace museum guide",
    verb: eat({ id: "job-manhyia", label: "Guide the museum", detail: "Stools, gold weights, and the same question every hour.", minutes: 240, earn: 85, effects: { energy: -14, social: 10 }, skill: "charm", job: true }),
  },
];

export const SPOTS: Spot[] = [
  { id: "home", name: "Home", emoji: "🏠", x: 980, y: 500, group: "home", blurb: "Your room. A bed, a cooler, and a window on the street.", actions: [] },
  {
    id: "viewing",
    name: "Viewing Centre",
    emoji: "⚽",
    x: 560,
    y: 280,
    group: "hang",
    blurb: "Circle. Plastic chairs, a big screen, and everybody is the coach.",
    actions: [
      eat({ id: "match", label: "Watch the match", detail: "Pay for a chair and lose your voice.", minutes: 100, cost: 10, effects: { fun: 30, social: 16, bladder: -14, hunger: -8 }, social: true }),
      eat({ id: "fan-ice", label: "Buy fan ice", detail: "Cold, sweet, gone in a minute.", minutes: 10, cost: 5, effects: { hunger: 8, fun: 6 }, tag: "food" }),
    ],
  },
  {
    id: "buka",
    name: "Buka",
    emoji: "🍲",
    x: 390,
    y: 460,
    group: "hang",
    blurb: "Osu. Waakye in the morning, jollof when the sun drops, gist all day.",
    actions: [
      eat({ id: "waakye", label: "Chop waakye", detail: "Egg, spaghetti, extra shito.", minutes: 35, cost: 18, effects: { hunger: 46, social: 6, bladder: -6 }, tag: "food", skill: "cooking" }),
      eat({ id: "buka-gist", label: "Hear the gossip", detail: "Sit long enough and the whole street passes through.", minutes: 30, cost: 8, effects: { social: 18, fun: 8 }, social: true }),
    ],
  },
  {
    id: "hub",
    name: "Impact Hub",
    emoji: "💡",
    x: 1280,
    y: 300,
    group: "work",
    blurb: "Osu. Laptops, pitch decks, and somebody always on a call with 'the investor'.",
    actions: [
      eat({ id: "cowork", label: "Cowork an hour", detail: "Bad coffee, good wifi, one real idea.", minutes: 60, cost: 20, effects: { energy: -8, fun: -2 }, skill: "coding" }),
      eat({ id: "pitch", label: "Pitch the startup", detail: "Five minutes. Don't say 'Uber for trotros' unless you mean it.", minutes: 40, effects: { energy: -12, social: 8 }, special: "pitch", skill: "charm" }),
    ],
  },
  {
    id: "makola",
    name: "Makola Market",
    emoji: "🧺",
    x: 300,
    y: 780,
    group: "hang",
    blurb: "Makola. Cloth, spices, and the city's commerce in one loud set of lanes.",
    actions: [
      eat({ id: "market-walk", label: "Walk the lanes", detail: "Cloth, tomatoes, speakers, and three people calling you.", minutes: 40, effects: { fun: 12, social: 10, hunger: -6 }, social: true }),
      eat({ id: "foodstuffs", label: "Buy foodstuffs", detail: "Rice, oil, and a sachet of pepper.", minutes: 25, cost: 16, effects: { hunger: 22 }, tag: "food" }),
    ],
  },
  {
    id: "theatre",
    name: "National Theatre",
    emoji: "🎭",
    x: 760,
    y: 860,
    group: "hang",
    blurb: "Victoriaborg. The steps are a hangout even when the stage is dark.",
    actions: [
      eat({ id: "play", label: "Catch a show", detail: "Lights down. Accra on the stage for once.", minutes: 120, cost: 40, effects: { fun: 32, social: 8 }, skill: "music" }),
      eat({ id: "steps", label: "Sit on the steps", detail: "Watch the traffic and the couples.", minutes: 25, effects: { fun: 12, energy: 4 } }),
    ],
  },
  {
    id: "gym",
    name: "Pulse Gym",
    emoji: "🏋️",
    x: 860,
    y: 680,
    group: "work",
    blurb: "East Legon side. Mirrors, afrobeats, and somebody filming a set.",
    actions: [
      eat({ id: "train", label: "Train", detail: "Sweat honestly.", minutes: 60, cost: 25, effects: { energy: -18, hygiene: -16, fun: 6 }, skill: "fitness", tag: "gym" }),
      eat({ id: "stretch", label: "Stretch and leave", detail: "You showed your face. That counts a little.", minutes: 15, cost: 10, effects: { energy: 4, fun: 4 }, tag: "gym" }),
    ],
  },
  {
    id: "office",
    name: "Office",
    emoji: "🏢",
    x: 690,
    y: 600,
    group: "work",
    blurb: "Ridge. Glass, badges, and a canteen that closes too early.",
    actions: [
      eat({ id: "cv", label: "Drop a CV", detail: "The front desk smiles like they have a drawer for this.", minutes: 20, effects: { social: 6 }, skill: "career" }),
      eat({ id: "coffee", label: "Canteen coffee", detail: "Sweet, milky, and strong enough to restart a Monday.", minutes: 15, cost: 12, effects: { hunger: 8, energy: 10 }, tag: "food" }),
    ],
  },
  {
    id: "plus233",
    name: "+233 Jazz Bar",
    emoji: "🎷",
    x: 1120,
    y: 980,
    group: "hang",
    blurb: "Osu. Jazz, a grill, and a room that would rather you listen than shout.",
    actions: [
      eat({ id: "jazz-set", label: "Stay for the set", detail: "Horns, a low light, and a table you do not give up.", minutes: 70, cost: 30, effects: { fun: 24, social: 10 }, skill: "music", social: true }),
      eat({ id: "jazz-plate", label: "Eat at the grill", detail: "Something hot while the next song finds itself.", minutes: 40, cost: 28, effects: { hunger: 30, fun: 8 }, tag: "food" }),
    ],
  },
  {
    id: "aburi",
    name: "Aburi Gardens",
    emoji: "🌿",
    x: 1560,
    y: 640,
    group: "sea",
    blurb: "Up the hills. Cooler air, tall trees, and a walk that makes the city feel far.",
    actions: [
      eat({ id: "gardens", label: "Walk the gardens", detail: "Take the climb slow. The view pays you back.", minutes: 80, cost: 20, effects: { fun: 28, energy: -10, hygiene: -4 } }),
      eat({ id: "picnic", label: "Picnic", detail: "Bread, egg, and a bottle of something cold.", minutes: 40, cost: 25, effects: { hunger: 20, fun: 12 }, tag: "food" }),
    ],
  },
  {
    id: "mall",
    name: "Accra Mall",
    emoji: "🛍️",
    x: 1620,
    y: 820,
    group: "hang",
    blurb: "Teshie. A cinema, a supermarket, a food court, and air-con for the afternoon.",
    actions: [
      eat({ id: "mall-grocery", emoji: "🛒", label: "Grocery run", detail: "Rice, oil, and the thing you forgot last week.", minutes: 40, cost: 80, effects: { fun: 4 } }),
      eat({ id: "mall-cinema", emoji: "🎬", label: "Cinema", detail: "A ticket, a cold drink, and the lights going down.", minutes: 120, cost: 45, effects: { fun: 28, energy: -6 } }),
      eat({ id: "mall-meal", emoji: "🍗", label: "Food court", detail: "A tray number and something hot.", minutes: 35, cost: 40, effects: { hunger: 32, fun: 6 }, tag: "food" }),
      eat({ id: "mall-icecream", emoji: "🍦", label: "Ice cream", detail: "One scoop. Then the second one.", minutes: 15, cost: 18, effects: { hunger: 8, fun: 10 }, tag: "food" }),
      eat({ id: "mall-outfit", emoji: "👗", label: "Try on an outfit", detail: "The mirror is honest. You still walk out with a bag.", minutes: 30, cost: 120, effects: { fun: 14, hygiene: 4 } }),
      eat({ id: "window", emoji: "🛍️", label: "Window shop", detail: "Look at the price. Put it back. Repeat.", minutes: 40, effects: { fun: 12, social: 6 } }),
    ],
  },
  {
    id: "beach",
    name: "Labadi Beach",
    emoji: "🏖️",
    x: 1720,
    y: 1040,
    group: "sea",
    blurb: "Labadi. Weekend drums, acrobats, horses, and a grill every few steps.",
    actions: [
      eat({ id: "shore", label: "Feet in the water", detail: "Drums behind you. The Gulf in front.", minutes: 40, effects: { fun: 26, energy: 6, hygiene: -8 } }),
      eat({ id: "kelewele", label: "Buy kelewele", detail: "Hot plantain, ginger, a napkin that gives up.", minutes: 15, cost: 15, effects: { hunger: 22, fun: 6 }, tag: "food" }),
    ],
  },
  {
    id: "korlebu",
    name: "Korle Bu",
    emoji: "🏥",
    x: 1500,
    y: 250,
    group: "civic",
    blurb: "The big hospital. You come for a person, or before a small thing becomes a big thing.",
    actions: [
      eat({ id: "nurse", label: "See a nurse", detail: "Vitals, advice, and a receipt.", minutes: 50, cost: 30, effects: { energy: 18, hygiene: 6 } }),
      eat({ id: "visit-ward", label: "Visit somebody", detail: "You brought malt. That is the love language.", minutes: 40, effects: { social: 18, fun: 4 }, social: true }),
    ],
  },
  {
    id: "salon",
    name: "Auntie Esi's Salon",
    emoji: "💇",
    x: 1680,
    y: 460,
    group: "hang",
    blurb: "Osu. Dryers, Nollywood, and a braid that lasts through the humidity.",
    actions: [
      eat({ id: "braids", label: "Wash and braid", detail: "You leave shining. Your neck knows the work.", minutes: 90, cost: 60, effects: { hygiene: 40, fun: 10, social: 8 }, social: true }),
      eat({ id: "salon-gist", label: "Sit and gist", detail: "You did not come for hair. You came for the story.", minutes: 30, effects: { social: 18, fun: 8 }, social: true }),
    ],
  },
  {
    id: "republic",
    name: "Republic Bar & Grill",
    emoji: "🕯️",
    x: 1240,
    y: 900,
    group: "hang",
    blurb: "Osu. Live highlife, a proudly Ghanaian room, and a Kokroko if you are staying.",
    actions: [
      eat({ id: "sunset", label: "Order a Kokroko", detail: "The house drink. The band is already warming up.", minutes: 60, cost: 28, effects: { fun: 22, social: 14 }, tag: "party", social: true }),
      eat({ id: "liveset", label: "Stay for highlife", detail: "Afropop, a live set, and a floor that fills without a speech.", minutes: 70, cost: 20, effects: { fun: 26, social: 12 }, tag: "party", skill: "music", social: true }),
    ],
  },
  {
    id: "police",
    name: "Police Station",
    emoji: "🚓",
    x: 250,
    y: 980,
    group: "civic",
    blurb: "Ministries. Fans, forms, and a bench that has heard everything.",
    actions: [
      eat({ id: "form", label: "Collect a form", detail: "Stamp number 4 is out. Come back... they do not say when.", minutes: 25, effects: { fun: -4, energy: -4 } }),
      eat({ id: "directions", label: "Ask for directions", detail: "You leave with three routes and a warning about the traffic.", minutes: 10, effects: { social: 4 } }),
    ],
  },
  {
    id: "church",
    name: "Ridge Church",
    emoji: "⛪",
    x: 240,
    y: 640,
    group: "civic",
    blurb: "Sunday best on Sunday. A quiet pew if you need one on a Wednesday.",
    actions: [
      eat({ id: "service", label: "Sit through service", detail: "Songs, a word, and somebody saving you a seat.", minutes: 70, effects: { social: 16, fun: 10, energy: -4 }, tag: "church", social: true }),
      eat({ id: "choir", label: "Choir practice", detail: "You are not the solo. You still leave lighter.", minutes: 40, effects: { fun: 12, social: 8 }, skill: "music", tag: "church" }),
    ],
  },
  {
    id: "mosque",
    name: "Central Mosque",
    emoji: "🕌",
    x: 220,
    y: 820,
    group: "civic",
    blurb: "The call cuts through the traffic. Shoes off, shoulders down.",
    actions: [
      eat({ id: "pray", label: "Pray", detail: "A still pocket in a loud city.", minutes: 25, effects: { social: 8, fun: 8, hygiene: 4 } }),
      eat({ id: "yard", label: "Talk in the yard", detail: "After prayers the yard becomes a parlour.", minutes: 20, effects: { social: 14 }, social: true }),
    ],
  },
  {
    id: "joy",
    name: "Joy FM",
    emoji: "📻",
    x: 500,
    y: 180,
    group: "work",
    blurb: "The station the trotros argue with. You can hear it from the car park.",
    actions: [
      eat({ id: "tour", label: "Studio tour", detail: "Glass, mics, and a producer who has heard every excuse.", minutes: 30, effects: { fun: 16 }, skill: "music" }),
      eat({ id: "callin", label: "Call in", detail: "You get on air for twenty seconds and text everybody.", minutes: 15, effects: { fun: 10, social: 12 }, social: true, skill: "charm" }),
    ],
  },
  {
    id: "polls",
    name: "Polling Unit",
    emoji: "🗳️",
    x: 900,
    y: 1120,
    group: "civic",
    blurb: "A classroom that becomes the country for one day, and a notice board the rest of the year.",
    actions: [
      eat({ id: "register", label: "Check your name", detail: "Your name is there. One line, still yours.", minutes: 15, effects: { fun: 4, social: 4 } }),
      eat({ id: "help-queue", label: "Help the queue", detail: "An older man needed the form read out. You stayed.", minutes: 25, effects: { social: 16 }, social: true, skill: "charm" }),
    ],
  },
  {
    id: "hotel",
    name: "Labadi Beach Hotel",
    emoji: "🏨",
    x: 1420,
    y: 1000,
    group: "sea",
    blurb: "The lobby is cold on purpose. You can hear the sea behind the glass.",
    actions: [
      eat({ id: "lobby", label: "Borrow the AC", detail: "You are not a guest. The air conditioner does not check.", minutes: 30, cost: 20, effects: { energy: 10, fun: 8, hygiene: 4 } }),
      eat({ id: "lunch", label: "Seaside lunch", detail: "A proper plate. You sit up straighter.", minutes: 55, cost: 70, effects: { hunger: 36, fun: 10, social: 6 }, tag: "food" }),
    ],
  },
  {
    id: "motors",
    name: "Japan Motors",
    emoji: "🚘",
    x: 480,
    y: 920,
    group: "work",
    blurb: "Airport road energy. New cars, and a lot of people just looking.",
    actions: [
      eat({ id: "look-car", label: "Look at a car", detail: "One day. You touch the steering wheel anyway.", minutes: 20, effects: { fun: 10 } }),
      eat({ id: "prices", label: "Talk prices", detail: "You learn what a dream costs this month.", minutes: 25, effects: { social: 6 }, skill: "hustle" }),
    ],
  },
  {
    id: "fitting",
    name: "Fitting shop",
    emoji: "🔧",
    x: 540,
    y: 980,
    group: "work",
    blurb: "Abossey Okai. Oil on the floor, a radio on the workbench, and three fitters who know every knock a car can make.",
    actions: [
      eat({ id: "fix-kojo", label: "Kojo gets it running", detail: "The apprentice. He will make it start. It will not be perfect.", minutes: 15, cost: 80, effects: { fun: 4 } }),
      eat({ id: "fix-esi", label: "Esi does the full job", detail: "She listens to the engine before she picks up a spanner.", minutes: 20, cost: 180, effects: { fun: 8 } }),
      eat({ id: "fix-kwame", label: "Kwame, the master", detail: "The car leaves quieter than the day you bought it.", minutes: 25, cost: 320, effects: { fun: 12, social: 4 }, social: true }),
    ],
  },
  {
    id: "bojo",
    name: "Bojo Beach",
    emoji: "⛵",
    x: 1180,
    y: 760,
    group: "sea",
    blurb: "Bojo. A short canoe across the channel, then a quieter beach.",
    actions: [
      eat({ id: "cruise", label: "Take the boat", detail: "The city shrinks. Somebody starts a song.", minutes: 90, cost: 40, effects: { fun: 30, energy: -8, social: 10 }, social: true }),
      eat({ id: "lagoon", label: "Watch the lagoon", detail: "Sit by the jetty and let the hour go.", minutes: 25, effects: { fun: 14, energy: 4 } }),
    ],
  },
  {
    id: "golf",
    name: "Achimota Golf",
    emoji: "⛳",
    x: 1760,
    y: 560,
    group: "sea",
    blurb: "Wide grass inside the city. You can walk it even if you do not own a club.",
    actions: [
      eat({ id: "fairway", label: "Walk the course", detail: "You did not golf. The grass still did its job.", minutes: 60, cost: 30, effects: { fun: 16, energy: -8 } }),
      eat({ id: "clubhouse", label: "Clubhouse water", detail: "Cold water and a chair in the shade.", minutes: 15, cost: 10, effects: { energy: 6, hygiene: 4 } }),
    ],
  },
  {
    id: "court",
    name: "High Court",
    emoji: "⚖️",
    x: 640,
    y: 760,
    group: "civic",
    blurb: "Black gowns, a slow ceiling fan, and cases that started before some of the lawyers.",
    actions: [
      eat({ id: "case", label: "Watch a case", detail: "You follow half of it. The other half is Latin and patience.", minutes: 40, effects: { fun: 6, social: 4, energy: -4 } }),
      eat({ id: "court-steps", label: "Sit on the steps", detail: "Lawyers eat lunch here like everybody else.", minutes: 20, effects: { energy: 4, social: 6 }, social: true }),
    ],
  },
  {
    id: "legon",
    name: "University of Ghana",
    emoji: "🎓",
    x: 1360,
    y: 200,
    group: "work",
    blurb: "Legon. Balme Library, campus jollof, and a hill that keeps you honest.",
    actions: [
      eat({ id: "balme", label: "Read in Balme", detail: "Silence, air conditioning, and a chapter you actually finish.", minutes: 60, effects: { energy: -6, fun: -2 }, skill: "coding" }),
      eat({ id: "campus-jollof", label: "Campus jollof", detail: "The plate is full. The price still feels like student life.", minutes: 25, cost: 12, effects: { hunger: 28, social: 6 }, tag: "food", social: true }),
    ],
  },
  {
    id: "still",
    name: "Still Space",
    emoji: "🫶🏾",
    x: 1080,
    y: 250,
    group: "hang",
    blurb: "Labone. A quiet room when the group chat is too loud.",
    actions: [
      eat({ id: "breathe", label: "Sit and breathe", detail: "Twenty quiet minutes. Accra can wait outside.", minutes: 30, cost: 20, effects: { fun: 18, energy: 10 } }),
      eat({ id: "journal", label: "Write it down", detail: "You put the week on paper so it stops spinning.", minutes: 20, effects: { fun: 10, social: 4 } }),
    ],
  },
  {
    id: "stadium",
    name: "Accra Stadium",
    emoji: "🏟️",
    x: 860,
    y: 160,
    group: "hang",
    blurb: "Ohene Djan. The stands know every anthem and every argument.",
    actions: [
      eat({ id: "jog", label: "Jog the stands", detail: "Empty seats, your own pace.", minutes: 30, effects: { energy: -12, hygiene: -10, fun: 6 }, skill: "fitness", tag: "gym" }),
      eat({ id: "matchday", label: "Match day", detail: "Flags, horns, and a goal that lifts the whole bowl.", minutes: 110, cost: 20, effects: { fun: 32, social: 18, hunger: -10, bladder: -12 }, social: true }),
    ],
  },
  ...ACCRA_SPOTS,
  ...MORE_SPOTS,
];

export const SHOP_CATEGORIES = [
  { id: "design", label: "Design" },
  { id: "sleep", label: "Sleep" },
  { id: "kitchen", label: "Kitchen" },
  { id: "bath", label: "Bath" },
  { id: "comfort", label: "Comfort" },
  { id: "fun", label: "Fun" },
  { id: "skills", label: "Skills" },
  { id: "light", label: "Light" },
  { id: "decor", label: "Decor" },
  { id: "pets", label: "Pets" },
  { id: "luxury", label: "Luxury" },
] as const;

export type ShopCategory = (typeof SHOP_CATEGORIES)[number]["id"];
export type ShopKind = "chair" | "sofa" | "bed" | "table" | "fan" | "ac" | "box" | "food" | "lamp" | "floor" | "fridge" | "stove" | "sink" | "toilet" | "shower" | "tv" | "desk" | "guitar" | "weights" | "plant" | "rug" | "curtain" | "tank" | "statue" | "dog" | "cat" | "bird" | "throne" | "painting" | "vault" | "jet" | "wall";

export type ShopItem = {
  id: string;
  name: string;
  price: number;
  detail: string;
  consume?: boolean;
  category: ShopCategory;
  size: string;
  stars: number;
  color: string;
  accent?: string;
  upkeep?: number;
  kind: ShopKind;
};

export function hasCurrent(inventory: string[]) {
  return inventory.some((id) => id === "generator" || id === "yellow-gen" || id === "solar");
}

export const SHOP: ShopItem[] = [
  { id: "cement", name: "Cement floor", price: 40, detail: "Bare screed. Clean, and it shows every grain of dust.", category: "design", size: "floor", stars: 1, color: "#c8c2b6", accent: "#b0a89c", kind: "floor" },
  { id: "lino", name: "Linoleum", price: 90, detail: "The hall floor, rolled out in your own room.", category: "design", size: "floor", stars: 1, color: "#6f9a90", accent: "#5e877e", kind: "floor" },
  { id: "terrazzo", name: "Terrazzo", price: 240, detail: "Chips in the cement. Cool underfoot in the afternoon.", category: "design", size: "floor", stars: 2, color: "#ece7df", accent: "#d5cfc4", kind: "floor" },
  { id: "kente-floor", name: "Kente tiles", price: 360, detail: "Red and gold under the whole room.", category: "design", size: "floor", stars: 3, color: "#CE1126", accent: "#FCD116", kind: "floor" },
  { id: "parquet", name: "Wood floor", price: 520, detail: "Boards instead of tile. The room sounds different.", category: "design", size: "floor", stars: 3, color: "#c4894f", accent: "#8d5a32", kind: "floor" },
  { id: "marble", name: "Marble floor", price: 1600, detail: "Pale stone. The mini-flat look, bought by the metre.", category: "design", size: "floor", stars: 4, color: "#f6f3ec", accent: "#ddd6c8", kind: "floor" },
  { id: "kente", name: "Kente cloth", price: 80, detail: "Red and gold cloth, hung on the wall.", category: "design", size: "wall", stars: 2, color: "#c4563a", kind: "box" },
  { id: "partition", name: "Bedroom wall", price: 420, detail: "Drag it across the room to split off another bedroom. Rotate it to run the other way.", category: "design", size: "3×1", stars: 2, color: "#f4efe6", kind: "wall" },
  { id: "partition-b", name: "Second bedroom wall", price: 420, detail: "One more wall, for a third room.", category: "design", size: "3×1", stars: 2, color: "#efe4d4", kind: "wall" },
  { id: "mattress", name: "Thicker mattress", price: 480, detail: "A second bed you can drag into another room. Sleep gives more of you back.", category: "sleep", size: "2×1", stars: 3, color: "#6d4aff", kind: "bed" },
  { id: "pillow", name: "Extra pillow", price: 40, detail: "One more place to put your head.", category: "sleep", size: "1×1", stars: 1, color: "#f4efe6", kind: "box" },
  { id: "net", name: "Mosquito net", price: 35, detail: "Hangs over the bed. Tuck it in before you sleep. Malaria season hits you far less.", category: "sleep", size: "1×1", stars: 1, color: "#e8f1ea", kind: "box" },
  { id: "pan", name: "Good cooking pot", price: 150, detail: "Home jollof fills the plate properly.", category: "kitchen", size: "1×1", stars: 2, color: "#8d5a32", kind: "box" },
  { id: "kenkey", name: "Kenkey and fish", price: 20, detail: "Eat it now. Pepper included.", consume: true, category: "kitchen", size: "1×1", stars: 2, color: "#e7c85a", kind: "food" },
  { id: "bucket", name: "Bath bucket", price: 35, detail: "For the mornings the shower is a rumour.", category: "bath", size: "1×1", stars: 1, color: "#3d7ea6", kind: "box" },
  { id: "chair", name: "Plastic chair", price: 40, detail: "The red one. Every compound has one.", category: "comfort", size: "1×1", stars: 1, color: "#d64545", kind: "chair" },
  { id: "sofa", name: "Velvet sofa", price: 180, detail: "Guests stop standing in the doorway.", category: "comfort", size: "2×1", stars: 2, color: "#1f8a70", kind: "sofa" },
  { id: "family", name: "Family sofa", price: 420, detail: "Three people, one remote, no argument about the seat.", category: "comfort", size: "3×1", stars: 3, color: "#c4844a", kind: "sofa" },
  { id: "leather", name: "Black leather sofa", price: 680, detail: "Looks like a promotion even when the lights are off.", category: "comfort", size: "2×1", stars: 3, color: "#1c1c1c", kind: "sofa" },
  { id: "gold", name: "Royal sofa", price: 1100, detail: "Too much sofa for the room. That is the point.", category: "comfort", size: "2×1", stars: 4, color: "#8b1e3f", kind: "sofa" },
  { id: "armchair", name: "Lounge armchair", price: 240, detail: "The corner where the day ends.", category: "comfort", size: "1×1", stars: 2, color: "#f3e2b0", kind: "chair" },
  { id: "fan", name: "Standing fan", price: 180, detail: "The heat leaves the room before you do.", category: "comfort", size: "1×1", stars: 2, color: "#d7e7f4", kind: "fan" },
  { id: "dining", name: "Dining table", price: 320, detail: "A place for jollof that is not the bed.", category: "comfort", size: "2×2", stars: 2, color: "#e7c9a0", kind: "table" },
  { id: "ac", name: "Split air conditioner", price: 1200, detail: "Fixed high on the wall. Cold air, if the current stays.", category: "comfort", size: "wall", stars: 4, color: "#f7f7f7", kind: "ac" },
  { id: "speaker", name: "Bluetooth speaker", price: 220, detail: "The radio gets sweeter, and the corridor will know.", category: "fun", size: "1×1", stars: 2, color: "#1d2433", kind: "box" },
  { id: "book", name: "Exam past questions", price: 60, detail: "A stack that makes the coding and the hustle less guesswork.", category: "skills", size: "1×1", stars: 2, color: "#2f6fed", kind: "box" },
  { id: "bulb", name: "Rechargeable bulb", price: 25, detail: "A small sun for when ECG takes the evening.", category: "light", size: "wall", stars: 1, color: "#fff4c2", kind: "lamp" },
  { id: "generator", name: "Small generator", price: 900, detail: "Dumsor becomes a story instead of a blackout.", category: "light", size: "1×1", stars: 3, color: "#355f86", kind: "box" },
  { id: "foam", name: "Foam mattress", price: 120, detail: "A thin blue bed you can put in a second room.", category: "sleep", size: "1×2", stars: 1, color: "#4f86d6", kind: "bed" },
  { id: "spring", name: "Spring bed", price: 520, detail: "A proper frame and an orange cover. Drag it into its own bedroom.", category: "sleep", size: "1×2", stars: 2, color: "#e07a3d", kind: "bed" },
  { id: "king", name: "King bed", price: 1800, detail: "Wide enough that nobody is hanging off the edge. It stands in the room as its own bed.", category: "sleep", size: "2×2", stars: 3, color: "#5b3cc4", kind: "bed" },
  { id: "cooler-box", name: "Cooler box", price: 45, detail: "Ice and drinks when the fridge is a rumour.", category: "kitchen", size: "1×1", stars: 1, color: "#2f6fed", kind: "fridge" },
  { id: "kerosene", name: "Kerosene stove", price: 70, detail: "One burner, a green stand, and a careful match.", category: "kitchen", size: "1×1", stars: 1, color: "#3d4a3a", kind: "stove" },
  { id: "gas-cooker", name: "Gas cooker", price: 560, detail: "Four rings. Jollof no longer depends on charcoal.", category: "kitchen", size: "1×1", stars: 3, color: "#f4f7fa", accent: "#c4894f", kind: "stove" },
  { id: "double-fridge", name: "Double-door fridge", price: 880, detail: "The tall white one. Water stays cold.", category: "kitchen", size: "1×1", stars: 3, color: "#f7f7f7", kind: "fridge" },
  { id: "counter", name: "Kitchen counter", price: 280, detail: "A top to chop on, instead of the bed.", category: "kitchen", size: "1×1", stars: 2, color: "#e7c9a0", kind: "sink" },
  { id: "sink", name: "Kitchen sink", price: 320, detail: "Plates leave the bucket.", category: "kitchen", size: "1×1", stars: 2, color: "#d5dde3", kind: "sink" },
  { id: "wc", name: "WC toilet", price: 200, detail: "A seat with a cistern. The compound bucket can rest.", category: "bath", size: "1×1", stars: 2, color: "#f7f7f7", kind: "toilet" },
  { id: "bowl-set", name: "Bucket and bowl", price: 25, detail: "Bath water, and the red bowl that goes with it.", category: "bath", size: "1×1", stars: 1, color: "#3d7ea6", accent: "#c4563a", kind: "box" },
  { id: "rain", name: "Rain shower", price: 760, detail: "A real stall. The bucket stays for washing clothes.", category: "bath", size: "1×1", stars: 3, color: "#e7eef3", kind: "shower" },
  { id: "transistor", name: "Transistor radio", price: 65, detail: "Joy FM, even when the phone is flat.", category: "fun", size: "1×1", stars: 1, color: "#c4894f", kind: "box" },
  { id: "tv32", name: "32\" flat TV", price: 720, detail: "Match day without going to the viewing centre.", category: "fun", size: "1×1", stars: 2, color: "#2c3338", kind: "tv" },
  { id: "tv65", name: "65\" smart TV", price: 2560, detail: "Wider, on a gold stand. The room's luxury.", category: "fun", size: "2×1", stars: 3, color: "#1c1c1c", kind: "tv" },
  { id: "desk", name: "Laptop desk", price: 1200, detail: "A chair, a top, and somewhere for the laptop that is not your lap.", category: "skills", size: "2×2", stars: 3, color: "#e7c9a0", kind: "desk" },
  { id: "guitar", name: "Acoustic guitar", price: 280, detail: "Highlife practice when the corridor is quiet.", category: "skills", size: "1×1", stars: 2, color: "#e7c85a", kind: "guitar" },
  { id: "weights", name: "Dumbbell rack", price: 220, detail: "A short bar and two ends. The gym can wait.", category: "skills", size: "1×1", stars: 2, color: "#1c1c1c", kind: "weights" },
  { id: "yellow-gen", name: "Yellow gen", price: 960, detail: "The small yellow one. It coughs, then the bulbs stay on.", category: "light", size: "yard", stars: 3, color: "#e7c85a", kind: "box" },
  { id: "solar", name: "Solar and inverter", price: 4200, detail: "Panels on the roof, a white box in the room. Dumsor loses.", category: "light", size: "1×1", stars: 4, color: "#f4f7fa", kind: "box" },
  { id: "lamp-stand", name: "Rechargeable lamp", price: 70, detail: "A shade you can carry from the bed to the kitchen.", category: "light", size: "1×1", stars: 1, color: "#f4efe6", kind: "lamp" },
  { id: "coffee", name: "Glass coffee table", price: 430, detail: "A low table in front of the sofa.", category: "decor", size: "1×1", stars: 2, color: "#e7e2d8", kind: "table" },
  { id: "plant", name: "Potted plant", price: 45, detail: "One green thing that does not ask for rent.", category: "decor", size: "1×1", stars: 1, color: "#3c8f4e", kind: "plant" },
  { id: "rug", name: "Kente rug", price: 170, detail: "A round cloth for the middle of the floor.", category: "decor", size: "2×2", stars: 2, color: "#c4563a", accent: "#1f8a70", kind: "rug" },
  { id: "mirror", name: "Standing mirror", price: 180, detail: "Check the outfit before you hit Osu.", category: "decor", size: "1×1", stars: 2, color: "#d5e7f2", kind: "curtain" },
  { id: "curtains", name: "Silk curtains", price: 6400, detail: "Fixed across the window, rod and all.", category: "decor", size: "wall", stars: 3, color: "#e7c85a", kind: "curtain" },
  { id: "aquarium", name: "Aquarium", price: 48000, detail: "Fish, a light, and a story for every guest.", category: "decor", size: "1×1", stars: 4, color: "#7eb6e8", kind: "tank" },
  { id: "lion", name: "Gold lion", price: 2800000, detail: "A statue with nothing to prove except the price.", category: "decor", size: "1×1", stars: 5, color: "#c4a46a", kind: "statue" },
  { id: "bingo", name: "Bingo the dog", price: 1600, detail: "A compound dog who has decided this room is home.", category: "pets", size: "1×1", stars: 1, color: "#c4894f", kind: "dog" },
  { id: "mimi", name: "Mimi the cat", price: 980, detail: "She sleeps on the good chair and ignores the rest.", category: "pets", size: "1×1", stars: 1, color: "#5c6570", kind: "cat" },
  { id: "parrot", name: "African grey", price: 2800, detail: "A parrot on a stand. She repeats the rent reminder.", category: "pets", size: "1×1", stars: 2, color: "#c4563a", kind: "bird" },
  { id: "throne", name: "Studded throne", price: 180000, detail: "A chair that makes the plastic one look shy.", category: "luxury", size: "1×1", stars: 5, color: "#8b1e3f", kind: "throne" },
  { id: "painting", name: "Old painting", price: 260000, detail: "A heavy frame. Nobody asks if you painted it.", category: "luxury", size: "wall", stars: 5, color: "#8a623c", kind: "painting" },
  { id: "vault", name: "Bullion vault", price: 320000, detail: "A grey door with a gold handle. The cedis stay in the wallet.", category: "luxury", size: "1×1", stars: 5, color: "#4a4e55", kind: "vault" },
  { id: "jet", name: "Private jet", price: 2400000, detail: "Parked in the yard. The weekly bill still comes.", category: "luxury", size: "yard", stars: 5, color: "#f7f7f7", upkeep: 2400, kind: "jet" },
  { id: "heavy-jet", name: "Heavy jet", price: 7200000, detail: "Bigger wings, bigger Saturday bill.", category: "luxury", size: "yard", stars: 5, color: "#2c3338", upkeep: 7200, kind: "jet" },
];

const PEOPLE = ["Kojo", "Abena", "Efua", "Yaw", "Selorm", "Maame", "Akua", "Nana", "Esi", "Kweku", "Adjoa", "Fiifi"];

export function peopleAt(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 33 + char.charCodeAt(0)) % 997;
  return [0, 1, 2].map((step) => PEOPLE[(hash + step * 4) % PEOPLE.length]);
}

export function birthById(id: string) {
  return BIRTHS.find((birth) => birth.id === id) ?? BIRTHS[0];
}

export function homeById(id: string): Home {
  return HOMES.find((home) => home.id === id) ?? BIG_HOMES.find((home) => home.id === id) ?? HOMES[2];
}

const ROOM_LOOKS: Record<HomeGrade, { label: string; wall: string; side: string; tileA: string; tileB: string; woodA: string; woodB: string; bed: string; sofa: string; frame: string; sheet: string; door: string; yard: string; sky: string }> = {
  low: { label: "Worn plaster, stained floor", wall: "#e7d3b4", side: "#d2b48c", tileA: "#e2cba8", tileB: "#d2b48a", woodA: "#8d6b45", woodB: "#6f5234", bed: "#6e5344", sofa: "#c47a4a", frame: "#5c4030", sheet: "#f3e6d0", door: "#5c4030", yard: "#6d7848", sky: "#c4b89a" },
  hall: { label: "Bunk, linoleum, strip light", wall: "#f6f0e4", side: "#e6d9c6", tileA: "#d5ebe4", tileB: "#c3ddd4", woodA: "#c9ddd4", woodB: "#b7cfc6", bed: "#243056", sofa: "#2f8f6b", frame: "#8b9094", sheet: "#f7f4ef", door: "#6e767c", yard: "#8ea35a", sky: "#d5dde6" },
  mid: { label: "Painted self-contain", wall: "#3e8f84", side: "#357a70", tileA: "#ead7b6", tileB: "#dcc6a2", woodA: "#e7d2a4", woodB: "#dcc497", bed: "#243056", sofa: "#2f8f6b", frame: "#6b4428", sheet: "#f7f4ef", door: "#7a4a2c", yard: "#8ea35a", sky: "#d7e7f2" },
  high: { label: "Marble, gold, air-conditioned", wall: "#f6f1e7", side: "#e4d8c4", tileA: "#f7f4ee", tileB: "#e7e2d8", woodA: "#f3ead6", woodB: "#e6d7b4", bed: "#f4efe6", sofa: "#c4a46a", frame: "#c4a46a", sheet: "#fffdf8", door: "#8c6239", yard: "#9db56a", sky: "#d7e7f2" },
};

export function homeLook(id: string) {
  const grade = homeById(id).grade;
  return { grade, ...ROOM_LOOKS[grade] };
}

export function takePurse(current: Life, posted: Life, server: Life): Life {
  const seen = new Set(current.seenTransfers ?? []);
  const postedSeen = new Set(posted.seenTransfers ?? []);
  const fresh = (server.seenTransfers ?? []).filter((id) => !postedSeen.has(id) && !seen.has(id));
  const book = server.transfers ?? [];
  const notes = book.filter((note) => fresh.includes(note.id));
  if (!notes.length) return current;
  const delta = notes.reduce((sum, note) => sum + note.delta, 0);
  const lines = notes.map((note) => note.note).filter(Boolean);
  const transfers = [...(current.transfers ?? [])];
  for (const note of book) {
    if (!transfers.some((item) => item.id === note.id)) transfers.push({ ...note });
  }
  return {
    ...current,
    cash: Math.round(current.cash + delta),
    transfers,
    seenTransfers: [...seen, ...notes.map((note) => note.id)],
    log: [...lines, ...current.log].slice(0, 14),
    inbox: [...lines, ...current.inbox].slice(0, 20),
  };
}

export function spotById(id: string) {
  return SPOTS.find((spot) => spot.id === id) ?? SPOTS[0];
}

export function rollBirth() {
  const bag = ["susu", "susu", "family", "market", "pastor", "returnee"];
  return birthById(bag[Math.floor(Math.random() * bag.length)]);
}

export function cedis(value: number) {
  const sign = value < 0 ? "-" : "";
  return `${sign}₵${Math.abs(Math.round(value)).toLocaleString("en-GH")}`;
}

export const JOIN_CASH = 50_000;
export const VIP_JOIN_CASH: Record<string, number> = {
  idbee: 70_000,
};

export function joinCash(username = "") {
  const key = username.trim().toLowerCase().replace(/^@/, "");
  return VIP_JOIN_CASH[key] ?? JOIN_CASH;
}

export function dayIndex(minutes: number) {
  return Math.floor(minutes / 1440);
}

export function realMinutes(at = Date.now()) {
  return Math.floor(at / 60000);
}

export function accraHour(at = new Date()) {
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Accra",
    hour: "2-digit",
    hourCycle: "h23",
  }).format(at);
  return Number(hour);
}

export function accraDateLabel(at = new Date()) {
  return new Intl.DateTimeFormat("en-GH", {
    timeZone: "Africa/Accra",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(at);
}

export function clockLabel(_minutes?: number, at = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GH", {
    timeZone: "Africa/Accra",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(at);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("weekday")} ${part("day")} ${part("month")} · ${part("hour")}:${part("minute")} ${part("dayPeriod").toUpperCase()}`;
}

export function hourOf(minutes: number) {
  return Math.floor((minutes % 1440) / 60);
}

export function moodOf(needs: Needs) {
  const average = (needs.hunger + needs.energy + needs.fun + needs.social + needs.hygiene + needs.bladder) / 6;
  if (average >= 75) return { emoji: "🙂", label: "Happy" };
  if (average >= 55) return { emoji: "😐", label: "Okay" };
  if (average >= 35) return { emoji: "😣", label: "Stressed" };
  return { emoji: "😩", label: "Drained" };
}

/** Food, rest, and mood change how a shift pays. Sickness is applied separately. */
export function workMoodFactor(life: Life) {
  const mood = moodOf(life.needs);
  let factor = mood.label === "Happy" ? 1.12 : mood.label === "Okay" ? 1 : mood.label === "Stressed" ? 0.88 : 0.78;
  if (life.needs.hunger < 30) factor *= 0.85;
  else if (life.needs.hunger >= 70) factor *= 1.06;
  if (life.needs.energy < 25) factor *= 0.82;
  return factor;
}

export function shiftPerformance(life: Life) {
  const base = Math.min(96, 40 + Math.round(life.skills.career * 4));
  const sick = life.health?.sick ? 0.5 : 1;
  return Math.max(12, Math.min(96, Math.round(base * workMoodFactor(life) * sick)));
}

export function shiftNote(life: Life) {
  if (life.health?.sick) return "Working sick. The day is slow.";
  if (life.needs.hunger < 30) return "You are hungry. The work is dragging.";
  if (life.needs.energy < 25) return "You slept late. Everything feels heavy.";
  const mood = moodOf(life.needs);
  if (mood.label === "Happy") return "Good mood. The work moves.";
  if (mood.label === "Stressed" || mood.label === "Drained") return `${mood.label}. The shift feels longer.`;
  return "Steady shift.";
}

export function clampNeed(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function clone(life: Life): Life {
  return {
    ...life,
    look: { ...life.look },
    traits: [...life.traits],
    needs: { ...life.needs },
    skills: { ...life.skills },
    inventory: [...life.inventory],
    log: [...life.log],
    inbox: [...life.inbox],
    relations: life.relations.map((person) => ({ ...person })),
    guests: (life.guests ?? []).map((guest) => ({ ...guest })),
    furniture: (life.furniture ?? []).map((piece) => ({ ...piece })),
    layout: (life.layout ?? []).map((piece) => ({ ...piece })),
    stored: [...(life.stored ?? [])],
    transfers: (life.transfers ?? []).map((note) => ({ ...note })),
    seenTransfers: [...(life.seenTransfers ?? [])],
    chats: life.chats,
    businesses: (life.businesses ?? []).map((shop) => ({ ...shop })),
    bag: Object.fromEntries(Object.entries(life.bag ?? {}).map(([id, lot]) => [id, { ...lot }])),
    soldToday: life.soldToday ? { day: life.soldToday.day, spots: { ...life.soldToday.spots } } : undefined,
    cool: { ...(life.cool ?? {}) },
    plots: (life.plots ?? []).map((plot) => ({ ...plot, people: plot.people?.map((person) => ({ ...person })) })),
    kids: (life.kids ?? []).map((kid) => ({ ...kid })),
    music: life.music ? { ...life.music, songs: life.music.songs.map((song) => ({ ...song })) } : undefined,
    school: life.school ? { ...life.school, certs: [...life.school.certs] } : undefined,
    car: life.car ? { ...life.car } : life.car,
    farm: (life.farm ?? []).map((bed) => (bed ? { ...bed } : null)),
    health: life.health ? { ...life.health, sick: life.health.sick ? { ...life.health.sick } : life.health.sick } : undefined,
    tailor: life.tailor ? { orders: life.tailor.orders.map((order) => ({ ...order })), wardrobe: life.tailor.wardrobe.map((fit) => ({ ...fit })) } : undefined,
    badges: [...(life.badges ?? [])],
    streak: life.streak ? { ...life.streak } : undefined,
    stats: { ...(life.stats ?? {}) },
    playDay: life.playDay ? { ...life.playDay } : undefined,
    story: { ...(life.story ?? {}) },
    bank: life.bank ? { ...life.bank } : undefined,
    fleet: (life.fleet ?? []).map((car) => ({ ...car })),
    team: life.team ? { ...life.team, players: life.team.players.map((player) => ({ ...player })) } : life.team,
    pets: (life.pets ?? []).map((pet) => ({ ...pet })),
    community: life.community ? { ...life.community, projects: [...life.community.projects], givenDay: life.community.givenDay ? { ...life.community.givenDay } : undefined, chief: life.community.chief ? { ...life.community.chief } : life.community.chief } : undefined,
    guide: [...(life.guide ?? [])],
    seenParcels: [...(life.seenParcels ?? [])],
    phone: life.phone ? { ...life.phone, hidden: [...(life.phone.hidden ?? [])] } : life.phone,
  };
}

export function seasonFlags(minutes: number) {
  const at = new Date(minutes * 60000);
  const month = at.getUTCMonth();
  const day = at.getUTCDate();
  return {
    harmattan: month === 11 || month === 0 || month === 1,
    detty: (month === 11 && day >= 15) || (month === 0 && day <= 2),
    rainy: (month >= 3 && month <= 6) || month === 8 || month === 9,
  };
}

export const FLEET_WAGES: Record<string, number> = { okada: 70, taxi: 200, trotro: 320 };

export function bump(life: Life, stat: string, by = 1) {
  life.stats = { ...life.stats, [stat]: (life.stats?.[stat] ?? 0) + by };
}

export function cloneLife(life: Life) {
  return clone(life);
}

export function toggleStar(life: Life, id: string) {
  const next = clone(life);
  const stars = new Set(next.stars ?? []);
  if (stars.has(id)) stars.delete(id);
  else stars.add(id);
  next.stars = [...stars];
  return next;
}

export function logLine(life: Life, line: string) {
  pushLog(life, line);
}

export function mergeMoney(stored: Life, incoming: Life): Life {
  const book = stored.transfers ?? [];
  const seen = new Set(incoming.seenTransfers ?? []);
  const pending = book.filter((note) => note.id && !seen.has(note.id));
  const delta = pending.reduce((sum, note) => sum + note.delta, 0);
  const lines = pending.map((note) => note.note).filter(Boolean);
  return {
    ...incoming,
    cash: Math.round(incoming.cash + delta),
    transfers: book.map((note) => ({ ...note })),
    seenTransfers: [...seen, ...pending.map((note) => note.id)],
    log: [...lines, ...(incoming.log ?? [])].slice(0, 14),
    inbox: [...lines, ...(incoming.inbox ?? [])].slice(0, 20),
  };
}

function pushLog(life: Life, line: string) {
  life.log = [line, ...life.log].slice(0, 14);
  life.inbox = [line, ...life.inbox].slice(0, 20);
}

export function freshLife(input: { look: Look; traits: string[]; dream: string; birthId: string; homeId: string; username?: string }): Life {
  const birth = birthById(input.birthId);
  const home = homeById(input.homeId);
  const wallet = joinCash(input.username);
  const life: Life = {
    look: input.look,
    traits: input.traits,
    dream: input.dream,
    birthId: birth.id,
    homeId: home.id,
    needs: {
      hunger: 72,
      energy: 82,
      fun: 68,
      social: clampNeed(58 + birth.socialBonus),
      hygiene: 76,
      bladder: 80,
    },
    cash: wallet,
    loan: birth.loan,
    weeklyLoan: birth.weeklyLoan,
    learn: birth.learn,
    minutes: realMinutes(),
    skills: {
      hustle: birth.hustle,
      cooking: birth.cooking,
      music: 0,
      fitness: 0,
      charm: birth.charm,
      coding: input.traits.includes("tech") ? 1 : 0,
      career: 0,
    },
    where: "home",
    town: "accra",
    stars: [],
    inventory: ["bed", "cooler", "stove"],
    log: [`You have the key to ${home.name} in ${home.area}.`, `Your wallet opens with ${cedis(wallet)}.`],
    inbox: ["Welcome to Accra. The city is already moving — keep your needs up and your name clean."],
    relations: [{ name: home.neighbor, score: 16 }],
    funded: false,
    lastRentAt: -1,
    outageCheckedDay: -1,
    dumsor: false,
    gemDay: -1,
    furniture: [],
    stored: [],
    tour: false,
  };
  return life;
}

export type StepResult = { life: Life; notes: string[]; error?: string };

export function passTime(life: Life, minutes: number, mode: "awake" | "sleep" = "awake"): StepResult {
  const next = clone(life);
  const from = next.minutes;
  const to = from + minutes;
  const hours = minutes / 60;
  if (mode === "awake") {
    const hung = next.hangover && next.hangover.until > next.minutes ? 1.35 : 1;
    next.needs.hunger = clampNeed(next.needs.hunger - 5 * hours);
    next.needs.energy = clampNeed(next.needs.energy - (next.traits.includes("lazy") ? 2.2 : 3.4) * hours * hung);
    const bored = next.traits.includes("outout") || next.traits.includes("night") ? 4.6 : 2.6;
    next.needs.fun = clampNeed(next.needs.fun - bored * hours * (hung > 1 ? 1.2 : 1));
    next.needs.social = clampNeed(next.needs.social - 2 * hours);
    const dusty = seasonFlags(next.minutes).harmattan ? 1 : 0;
    next.needs.hygiene = clampNeed(next.needs.hygiene - ((next.traits.includes("fresh") ? 1.4 : 3) + dusty) * hours);
    next.needs.bladder = clampNeed(next.needs.bladder - 6.5 * hours);
    if (next.health?.sick) {
      next.needs.energy = clampNeed(next.needs.energy - 2 * hours);
      next.needs.fun = clampNeed(next.needs.fun - 1 * hours);
    }
  } else {
    next.needs.hunger = clampNeed(next.needs.hunger - 2.4 * hours);
    next.needs.hygiene = clampNeed(next.needs.hygiene - 1.1 * hours);
    next.needs.bladder = clampNeed(next.needs.bladder - 2.2 * hours);
    if (next.hangover) next.hangover = null;
  }
  const real = from >= 1_000_000;
  const clockTo = real ? realMinutes() : to;
  next.minutes = clockTo;
  const notes = settleBills(next, real ? Math.min(from, clockTo) : from, clockTo);
  const hour = real ? accraHour() : hourOf(clockTo);
  const day = dayIndex(clockTo);
  if (hour >= 5 && hour < 19) next.dumsor = false;
  if ((hour >= 19 || hour < 5) && next.outageCheckedDay !== day) {
    next.outageCheckedDay = day;
    next.dumsor = !hasCurrent(next.inventory) && day % 2 === 1;
    if (next.dumsor) notes.push("Dumsor. The meter just sighed.");
  }
  checkHealth(next, clockTo, notes);
  checkPets(next, clockTo, notes);
  tickPhone(next, minutes, notes);
  return { life: next, notes };
}

function checkPets(life: Life, now: number, notes: string[]) {
  if (!life.pets?.length) return;
  const gone = life.pets.filter((pet) => now - pet.fedAt > 2880);
  if (!gone.length) return;
  life.pets = life.pets.filter((pet) => now - pet.fedAt <= 2880);
  notes.push(`${gone.map((pet) => pet.name).join(", ")} went two days without food and wandered off.`);
}

function checkHealth(life: Life, now: number, notes: string[]) {
  const health: Health = { ...(life.health ?? {}) };
  if (health.sick && now - health.sick.since >= 4320) {
    health.sick = null;
    notes.push("You feel like yourself again.");
  }
  const day = dayIndex(now);
  if (health.day === undefined) health.day = day;
  else if (health.day !== day) {
    health.day = day;
    if (!health.sick) {
      const { rainy, harmattan } = seasonFlags(now);
      const netted = life.inventory.includes("net");
      const chance = 0.03 + (life.needs.hygiene < 25 ? 0.1 : 0) + (life.needs.energy < 15 ? 0.08 : 0) + (life.needs.hunger < 20 ? 0.06 : 0) + (rainy && !netted ? 0.12 : 0) + (harmattan ? 0.04 : 0) - life.skills.fitness * 0.006;
      if (Math.random() < chance) {
        const kind: SickKind = rainy && !netted && Math.random() < 0.6 ? "malaria" : life.needs.hunger < 20 ? "tummy" : life.needs.energy < 15 ? "burnout" : "flu";
        health.sick = { kind, since: now };
        notes.push(kind === "malaria" ? "Malaria. Your head is pounding. See the clinic." : `${SICK_LABEL[kind]}. Rest, or see the clinic.`);
      }
    }
  }
  life.health = health;
}

function settleBills(life: Life, from: number, to: number) {
  const notes: string[] = [];
  const start = dayIndex(from);
  const end = dayIndex(to);
  for (let day = start + 1; day <= end; day += 1) {
    if (new Date(day * 86400000).getUTCDay() !== 6 || life.lastRentAt === day) continue;
    life.lastRentAt = day;
    const rent = homeById(life.homeId).rent;
    const loanPay = Math.min(life.loan, life.weeklyLoan);
    const upkeep = SHOP.reduce((sum, item) => sum + (item.upkeep && life.inventory.includes(item.id) ? item.upkeep : 0), 0);
    const wages = (life.businesses ?? []).reduce((sum, shop) => sum + bizWages(shop.kind, shop.level), 0);
    const fees = (life.kids ?? []).filter((kid) => kid.school).length * 40;
    const drivers = (life.fleet ?? []).reduce((sum, car) => sum + (car.driver ? (FLEET_WAGES[car.kind] ?? 0) : 0), 0);
    life.cash -= rent + loanPay + upkeep + wages + fees + drivers;
    life.loan -= loanPay;
    if (life.loan <= 0) {
      life.loan = 0;
      life.weeklyLoan = 0;
    }
    notes.push(`Saturday bill: rent ${cedis(rent)}${loanPay ? ` and susu ${cedis(loanPay)}` : ""}${upkeep ? ` and upkeep ${cedis(upkeep)}` : ""}${wages ? ` and staff wages ${cedis(wages)}` : ""}${drivers ? ` and drivers ${cedis(drivers)}` : ""}${fees ? ` and school fees ${cedis(fees)}` : ""}.`);
    const bank = life.bank;
    if (bank && bank.loan > 0 && day * 1440 > bank.loanDue) {
      const fine = Math.round(bank.loan * 0.05);
      life.bank = { ...bank, loan: bank.loan + fine, score: Math.max(300, bank.score - 35) };
      notes.push(`Bank loan overdue. ${cedis(fine)} late fee and your credit score dropped.`);
    }
    if (life.cash < 0) notes.push("The wallet is in the red. Rent still left.");
  }
  return notes;
}

function gainSkill(life: Life, skill: keyof Skills, verb: Verb) {
  let amount = 1;
  if (life.traits.includes("musical") && skill === "music") amount += 1;
  if (life.traits.includes("foodie") && skill === "cooking") amount += 1;
  if (life.traits.includes("gym") && skill === "fitness") amount += 1;
  if (life.traits.includes("tech") && skill === "coding") amount += 1;
  if (life.traits.includes("hustler") && (skill === "hustle" || skill === "career")) amount += 1;
  if (life.traits.includes("smooth") && skill === "charm") amount += 1;
  if (life.learn > 1 && Math.random() < life.learn - 1) amount += 1;
  life.skills[skill] = Math.min(10, life.skills[skill] + amount);
  if (verb.job && skill !== "career") life.skills.career = Math.min(10, life.skills.career + 1);
}

export function careerLevel(life: Life) {
  return Math.min(5, 1 + Math.floor(life.skills.career / 3));
}

export type RideId = "trek" | "trotro" | "train" | "okada" | "taxi" | "car";

export const FUEL_PER_TRIP = 6;

export type Ride = { id: RideId; label: string; cost: number; minutes: number };

export const RIDES: Ride[] = [
  { id: "trek", label: "Trek", cost: 0, minutes: 40 },
  { id: "trotro", label: "Trotro", cost: 5, minutes: 25 },
  { id: "train", label: "Train", cost: 8, minutes: 20 },
  { id: "okada", label: "Okada", cost: 12, minutes: 14 },
  { id: "taxi", label: "Taxi", cost: 28, minutes: 12 },
];

export const STAMP_BONUS = 300;

function mapTown(id: string) {
  if (id === "home") return "accra";
  return spotById(id).town ?? "accra";
}

export function distanceOf(from: string, to: string) {
  const hop = mapTown(from) !== mapTown(to) ? 270 : 0;
  return Math.max(spotById(from).far ?? 0, spotById(to).far ?? 0, hop);
}

export function farRide<T extends Ride>(ride: T, from: string, to: string): T & { blocked?: string; fuel?: number } {
  const far = from === to ? 0 : distanceOf(from, to);
  if (!far) return ride;
  if (ride.id === "trek") return { ...ride, blocked: "Too far to walk. Take a trotro or a taxi." };
  if (ride.id === "okada") return { ...ride, blocked: "Okada riders do not go out of town." };
  if (ride.id === "train") return { ...ride, blocked: "No train runs that way yet." };
  if (ride.id === "taxi") return { ...ride, label: "Taxi", cost: Math.round(far * 1.6), minutes: Math.round(far * 0.75) };
  if (ride.id === "car") return { ...ride, cost: 0, minutes: Math.round(far * 0.8), fuel: FUEL_PER_TRIP * Math.ceil(far / 45) };
  return { ...ride, label: "Intercity bus", cost: Math.round(far / 3), minutes: far };
}

export function collectStamp(life: Life, placeId: string, notes: string[]) {
  if (!TRIP_IDS.includes(placeId) || (life.stamps ?? []).includes(placeId)) return;
  life.stamps = [...(life.stamps ?? []), placeId];
  const got = TRIP_IDS.filter((id) => life.stamps!.includes(id)).length;
  notes.push(`New stamp in your travel book: ${spotById(placeId).name} (${got}/${TRIP_IDS.length}).`);
  if (got === TRIP_IDS.length) {
    life.cash += STAMP_BONUS;
    const line = `Travel book complete. You have seen Ghana beyond Accra. +${cedis(STAMP_BONUS)}.`;
    notes.push(line);
    pushLog(life, line);
  }
}

export function carFuelBlock(life: Life, fuel: number) {
  if (!life.car) return "You do not have a car yet.";
  if (life.car.broken || (life.car.condition ?? 100) <= 0) return "The car is spoilt. Take a trotro to the fitting shop at Abossey Okai.";
  if (life.car.fuel < fuel) return fuel > FUEL_PER_TRIP ? `A trip that far needs ${fuel} litres. Fill up in the Garage app.` : "The tank is nearly empty. Fill up in the Garage app.";
  return null;
}

export function goTo(life: Life, placeId: string, base: Ride = RIDES[1]): StepResult {
  const fromTown = (life.town ?? "accra") as TownId;
  const landed = arrivalFor(placeId, spotById(placeId).town);
  if (life.where === landed.where && fromTown === landed.town) return { life, notes: [] };
  if (life.where === placeId && fromTown !== landed.town) {
    const next = clone(life);
    next.where = landed.where;
    next.town = landed.town;
    const away = crossedTownNote(fromTown, landed.town, false, Boolean(life.car));
    const notes = away ? [away] : [`You are in ${spotById(landed.where).name}.`];
    for (const line of notes) pushLog(next, line);
    return { life: next, notes };
  }
  const ride = farRide(base, life.where, placeId);
  if (ride.blocked) return { life, notes: [], error: ride.blocked };
  const fuel = ride.fuel ?? FUEL_PER_TRIP;
  if (ride.cost > 0 && life.cash < ride.cost) return { life, notes: [], error: `You need ${cedis(ride.cost)} for ${ride.label.toLowerCase()}.` };
  if (ride.id === "car") {
    const blocked = carFuelBlock(life, fuel);
    if (blocked) return { life, notes: [], error: blocked };
  }
  const timed = passTime({ ...clone(life), cash: life.cash - ride.cost }, ride.minutes);
  timed.life.where = landed.where;
  timed.life.town = landed.town;
  bump(timed.life, "trips");
  const fare = ride.cost ? ` ${cedis(ride.cost)}.` : ".";
  const noteExtra = "note" in ride && typeof (ride as { note?: string }).note === "string" ? ` (${(ride as { note?: string }).note})` : "";
  const heading = ride.id === "car" ? "Drove your car" : ride.label;
  timed.notes.unshift(`${heading} to ${spotById(landed.where).name}${fare}${noteExtra}`);
  const away = crossedTownNote(fromTown, landed.town, ride.id === "car", Boolean(life.car));
  if (away) {
    timed.notes.push(away);
    timed.life.inbox = [away, ...timed.life.inbox].slice(0, 20);
  }
  collectStamp(timed.life, placeId, timed.notes);
  if (ride.id === "car" && timed.life.car) {
    const wear = 6 + Math.floor(fuel / 2);
    const condition = Math.max(0, (timed.life.car.condition ?? 100) - wear);
    timed.life.car = { ...timed.life.car, fuel: timed.life.car.fuel - fuel, condition, broken: condition <= 0 };
    if (condition <= 0) timed.notes.push("The car is spoilt. It will not start again until a fitter sees it.");
    else if (condition < 30) timed.notes.push("The engine is knocking. The fitting shop is at Abossey Okai.");
    if (Math.random() < 0.15) {
      if (timed.life.car.insuredUntil > timed.life.minutes) timed.notes.push("Police checkpoint. Papers in order, waved through.");
      else {
        timed.life.cash -= 80;
        timed.notes.push("Police checkpoint. No insurance sticker: ₵80 fine.");
      }
    }
  }
  // Traffic / rain / harmattan hits mood after the ride.
  const hour = hourOf(timed.life.minutes);
  const hit = weatherStress(weatherAt(new Date(), timed.life.town), hour);
  timed.life.needs.fun = clampNeed(timed.life.needs.fun + hit.fun);
  timed.life.needs.energy = clampNeed(timed.life.needs.energy + hit.energy);
  timed.life.needs.hygiene = clampNeed(timed.life.needs.hygiene + hit.hygiene);
  if (hit.fun <= -3 || hit.energy <= -3) timed.notes.push("The road wore you out.");
  else if (hit.hygiene <= -2) timed.notes.push("Dust on your lips. Harmattan is in.");
  return timed;
}

export function runVerb(life: Life, verb: Verb, placeId = life.where, withName?: string): StepResult {
  const moved = goTo(life, placeId);
  if (moved.error) return moved;
  const next = clone(moved.life);
  const notes = [...moved.notes];
  if (verb.id === "radio" && next.dumsor && !hasCurrent(next.inventory)) {
    return { life: next, notes, error: "The radio is quiet. Dumsor took the socket." };
  }
  const locked = lockReason(next, verb);
  if (locked) return { life: next, notes, error: locked };
  if (verb.special === "gem" && next.gemDay === dayIndex(next.minutes)) {
    return { life: next, notes, error: "You already found today's gem." };
  }
  if (verb.id.startsWith("club-need-table")) {
    return { life, notes: [], error: "Take a table first. Then bottle service can land." };
  }
  let cost = verb.cost;
  if (verb.tag === "food" && next.birthId === "market") cost = Math.round(cost * 0.7);
  if (verb.tag === "party" && seasonFlags(next.minutes).detty) cost = Math.round(cost * 1.3);
  if (cost > 0 && next.cash < cost) return { life: next, notes, error: "Wallet light. Make some money first." };
  const timed = passTime(next, verb.minutes, verb.id === "sleep" || verb.sleep ? "sleep" : "awake");
  const after = timed.life;
  notes.push(...timed.notes);
  after.cash -= cost;
  let earn = verb.earn + (verb.perSkill && verb.skill ? verb.perSkill * after.skills[verb.skill] : 0);
  if (verb.pantry) after.pantry = Math.max(0, (after.pantry ?? 0) - verb.pantry);
  if (verb.stock) after.pantry = Math.min(PANTRY_MAX, (after.pantry ?? 0) + verb.stock);
  if (verb.cool) after.cool = { ...(after.cool ?? {}), [verb.id]: after.minutes + Math.max(30, verb.minutes) };
  if (verb.job) {
    earn *= careerLevel(after);
    const job = jobOfVerb(verb.id);
    if (job) {
      const held = rankOf(after, job.id);
      earn *= RANK_PAY[held.rank] ?? 1;
      after.ranks = { ...after.ranks, [job.id]: { ...held, shifts: held.shifts + 1 } };
    }
    if (after.traits.includes("hustler")) earn = Math.round(earn * 1.15);
    if (after.traits.includes("lazy")) earn = Math.round(earn * 0.85);
    earn = Math.round(earn * jobBoost(after) * workMoodFactor(after));
  }
  if (earn > 0 && after.health?.sick) {
    earn = Math.round(earn * 0.5);
    notes.push("Working sick. Half the pay.");
  }
  after.cash += earn;
  const boost = actionBoost(after, verb);
  (Object.keys(verb.effects) as NeedKey[]).forEach((key) => {
    const delta = verb.effects[key] ?? 0;
    const shaped = delta > 0 ? delta * boost : delta;
    after.needs[key] = clampNeed(after.needs[key] + shaped);
  });
  if (verb.id === "sleep") {
    const bonus = (after.inventory.includes("mattress") ? 14 : 0) + homeById(after.homeId).comfort;
    after.needs.energy = clampNeed(after.needs.energy + bonus);
    if (after.hangover) {
      after.hangover = null;
      notes.push("Sleep clears the club night. Head quieter.");
    }
  }
  if (isNightlife(placeId, CLUB_IDS) && (verb.tag === "party" || verb.id.startsWith("club-")) && verb.id !== "club-leave") {
    after.club = sessionAfterVerb(sessionOf(after), verb, placeId, after.minutes);
  } else if (after.club && !isNightlife(placeId, CLUB_IDS)) {
    after.club = undefined;
  }
  if (verb.id === "cook" && after.inventory.includes("pan")) after.needs.hunger = clampNeed(after.needs.hunger + 12);
  if (verb.id === "radio" && after.inventory.includes("speaker")) after.needs.fun = clampNeed(after.needs.fun + 12);
  if (verb.id === "kenkey") after.needs.hunger = clampNeed(after.needs.hunger + 34);
  if (verb.skill) gainSkill(after, verb.skill, verb);
  if (verb.job) bump(after, "shifts");
  if (verb.id.startsWith("hustle-")) bump(after, "hustles");
  turfPoint(after, verb.job ? 3 : verb.tag === "party" ? 2 : verb.social ? 1 : 0);
  if (verb.tag === "food") bump(after, "meals");
  if (verb.tag === "food" && placeId === "home" && verb.skill === "cooking") bump(after, "cooked");
  if (verb.tag === "party") bump(after, "parties");
  if (verb.tag === "church") bump(after, "church");
  if (verb.tag === "gym" || verb.skill === "fitness") bump(after, "workouts");
  if (verb.social) {
    const name = withName || (placeId === "home" ? homeById(after.homeId).neighbor : peopleAt(placeId)[0]);
    const bump = after.traits.includes("smooth") ? 16 : 12;
    const known = after.relations.find((person) => person.name === name);
    if (known) known.score = Math.min(100, known.score + bump);
    else after.relations.push({ name, score: bump });
  }
  if (verb.special === "pitch") {
    if (after.funded) notes.push("You already have a term sheet. Go build the thing.");
    else if (after.skills.coding < 4) notes.push("They liked the story. They want a prototype. Build the skill at the hub.");
    else {
      after.funded = true;
      after.cash += 8000;
      notes.push("Funded. ₵8,000 lands. Legon unicorn, loading.");
    }
  }
  if (verb.special === "gem") {
    after.gemDay = dayIndex(after.minutes);
    after.cash += 40;
    notes.push("A gem in the gutter. ₵40.");
  }
  pushLog(after, verb.detail);
  return { life: after, notes: [verb.label, ...notes.filter(Boolean)] };
}

export function coolLeft(life: Life, verb: Verb) {
  if (!verb.cool) return 0;
  return Math.max(0, Math.ceil((life.cool?.[verb.id] ?? 0) - life.minutes));
}

export function lockReason(life: Life, verb: Verb): string | null {
  const missing = (verb.needs ?? []).filter((id) => !life.inventory.includes(id));
  if (missing.length) return `Need ${missing.map((id) => SHOP.find((item) => item.id === id)?.name ?? id).join(", ")}`;
  if (verb.power && life.dumsor && !hasCurrent(life.inventory)) return "Dumsor. No current for that.";
  if (verb.pantry && (life.pantry ?? 0) < verb.pantry) return "Need groceries. Restock at the fridge.";
  if (verb.stock && (life.pantry ?? 0) >= PANTRY_MAX) return "The fridge is already full.";
  const wait = coolLeft(life, verb);
  if (wait > 0) return `Ready again in ${wait >= 60 ? `${Math.floor(wait / 60)}h ${wait % 60}m` : `${wait}m`}`;
  return null;
}

export type Offer = {
  id: string;
  label: string;
  detail: string;
  minutes: number;
  cost: number;
  effects: Partial<Needs>;
  outfit?: string;
  cloth?: string;
};

export function offersFor(verb: Verb): Offer[] {
  const name = `${verb.id} ${verb.label}`.toLowerCase();
  if (name.includes("outfit") || name.includes("cloth") || name.includes("kente")) return CLOTHES;
  if (name.includes("cinema") || name.includes("show") || name.includes("film")) return FILMS;
  if (verb.tag === "food" || name.includes("food") || name.includes("eat") || name.includes("jollof") || name.includes("waakye") || name.includes("kelewele") || name.includes("ice")) return plates(verb);
  return [
    {
      id: verb.id,
      label: verb.label,
      detail: verb.detail,
      minutes: verb.minutes,
      cost: verb.cost,
      effects: verb.effects,
    },
  ];
}

const FILMS: Offer[] = [
  { id: "film-ghana", label: "Ghanaian feature", detail: "Lights down. A story from here.", minutes: 120, cost: 35, effects: { fun: 26, energy: -6 } },
  { id: "film-highlife", label: "Highlife concert film", detail: "A live set, filmed close.", minutes: 90, cost: 40, effects: { fun: 30, energy: -4 } },
  { id: "film-late", label: "Late show", detail: "The cheap seat. The long one.", minutes: 130, cost: 25, effects: { fun: 22, energy: -8 } },
];

export const CLOTHES: Offer[] = [
  { id: "fit-casual", label: "Casual", detail: "The everyday set.", minutes: 15, cost: 80, effects: { fun: 8 }, outfit: "Casual", cloth: "#2f7de1" },
  { id: "fit-office", label: "Office", detail: "Sharp enough for Ridge.", minutes: 15, cost: 140, effects: { fun: 6 }, outfit: "Office", cloth: "#f4efe6" },
  { id: "fit-white", label: "All-white", detail: "Friday white, pressed.", minutes: 15, cost: 160, effects: { fun: 10 }, outfit: "All-white", cloth: "#f7f4ef" },
  { id: "fit-classic", label: "Classic", detail: "The cut you already know.", minutes: 15, cost: 90, effects: { fun: 6 }, outfit: "Classic", cloth: "#e7c85a" },
  { id: "fit-site", label: "Site work", detail: "For a day that gets dusty.", minutes: 15, cost: 70, effects: { fun: 4 }, outfit: "Site work", cloth: "#f59e42" },
];

function plates(verb: Verb): Offer[] {
  const base = Math.max(verb.cost, 12);
  return [
    { id: `${verb.id}-plate`, label: verb.label, detail: verb.detail, minutes: verb.minutes, cost: base, effects: verb.effects },
    { id: `${verb.id}-small`, label: "Small plate", detail: "Enough to hold you.", minutes: Math.max(10, verb.minutes - 10), cost: Math.max(8, Math.round(base * 0.6)), effects: { hunger: 18, fun: 4 } },
    { id: `${verb.id}-full`, label: "Full plate", detail: "The one you finish slowly.", minutes: verb.minutes + 5, cost: Math.round(base * 1.4), effects: { hunger: 40, fun: 8 } },
  ];
}

export function payOffer(life: Life, verb: Verb, offer: Offer, placeId = life.where): StepResult {
  if (offer.outfit || offer.cloth) {
    if (life.cash < offer.cost) return { life, notes: [], error: "Wallet light. Make some money first." };
    const next = clone(life);
    next.look = { ...next.look, outfit: offer.outfit ?? next.look.outfit, cloth: offer.cloth ?? next.look.cloth };
    const timed = passTime(next, offer.minutes);
    timed.life.cash -= offer.cost;
    pushLog(timed.life, `Bought ${offer.label}.`);
    return { life: timed.life, notes: [`${offer.label} is what you are wearing.`] };
  }
  return runVerb(
    life,
    { ...verb, id: offer.id, label: offer.label, detail: offer.detail, minutes: offer.minutes, cost: offer.cost, effects: offer.effects, earn: verb.earn },
    placeId,
  );
}

function actionBoost(life: Life, verb: Verb) {
  let boost = 1;
  if (verb.tag === "food" && life.traits.includes("foodie")) boost += 0.25;
  if (verb.tag === "party" && (life.traits.includes("outout") || life.traits.includes("night"))) boost += 0.35;
  if (verb.tag === "gym" && life.traits.includes("gym")) boost += 0.35;
  if (verb.social && life.traits.includes("smooth")) boost += 0.2;
  if (verb.tag === "church" && life.birthId === "pastor") boost += 0.25;
  return boost;
}

const FLOOR_SPOTS = [
  { x: -0.15, z: 0.85 },
  { x: 1.55, z: 0.45 },
  { x: -2.35, z: 1.45 },
  { x: 0.35, z: -1.15 },
  { x: 2.55, z: -0.35 },
  { x: -1.15, z: 2.15 },
  { x: 3.05, z: 0.15 },
  { x: -3.05, z: -0.55 },
];

function openSpot(life: Life) {
  const taken = life.furniture ?? [];
  return FLOOR_SPOTS.find((slot) => !taken.some((piece) => Math.hypot(piece.x - slot.x, piece.z - slot.z) < 0.75)) ?? { x: 0.2, z: 0.4 };
}

export function sellValue(price: number) {
  return Math.max(5, Math.round(price * 0.45));
}

export function buyItem(life: Life, itemId: string): StepResult {
  const item = SHOP.find((entry) => entry.id === itemId);
  if (!item) return { life, notes: [], error: "That item is gone." };
  if (!item.consume && life.inventory.includes(item.id)) {
    if (item.kind === "floor") {
      if (life.floor === item.id) return { life, notes: [], error: "That floor is already down." };
      const next = clone(life);
      next.floor = item.id;
      pushLog(next, `Laid ${item.name}.`);
      return { life: next, notes: [`${item.name} is down.`] };
    }
    if ((life.stored ?? []).includes(item.id)) {
      const next = clone(life);
      const hung = hangSpot(item.id, 1.8, 1.2, next.span ?? 0);
      const spot = hung ?? openSpot(next);
      next.furniture = [...(next.furniture ?? []), { id: item.id, x: spot.x, z: spot.z, rot: hung?.rot ?? 0 }];
      next.stored = (next.stored ?? []).filter((id) => id !== item.id);
      pushLog(next, `Put ${item.name} back out.`);
      return { life: next, notes: [`${item.name} is back in the room.`] };
    }
    return { life, notes: [], error: "You already own that." };
  }
  if (life.cash < item.price) return { life, notes: [], error: "Not enough cedis." };
  if (item.consume) {
    return runVerb({ ...clone(life) }, eat({ id: "kenkey", label: "Kenkey and fish", detail: item.detail, minutes: 15, cost: item.price, effects: { hunger: 34, fun: 4 }, tag: "food" }), life.where);
  }
  const next = clone(life);
  next.cash -= item.price;
  next.inventory = [...next.inventory, item.id];
  if (item.kind === "floor") next.floor = item.id;
  else {
    const hung = hangSpot(item.id, 1.8, 1.2, next.span ?? 0);
    const spot = hung ?? openSpot(next);
    next.furniture = [...(next.furniture ?? []), { id: item.id, x: spot.x, z: spot.z, rot: hung?.rot ?? 0 }];
  }
  if (hasCurrent(next.inventory)) next.dumsor = false;
  pushLog(next, `Bought ${item.name}.`);
  return { life: next, notes: [item.kind === "floor" ? `${item.name} is down.` : `Bought ${item.name}.`] };
}

export function widenRoom(life: Life): StepResult {
  const span = life.span ?? 0;
  if (span >= WIDEN_COST.length) return { life, notes: [], error: "The walls are as far out as they can go." };
  const cost = WIDEN_COST[span];
  if (life.cash < cost) return { life, notes: [], error: `The mason wants ${cedis(cost)}.` };
  const next = clone(life);
  next.cash -= cost;
  next.span = span + 1;
  pushLog(next, "You paid to push the walls out.");
  return { life: next, notes: ["The room is bigger. Shift the bed, the stove, whatever you like."] };
}

export function layPiece(life: Life, id: string, x: number, z: number, rot: number): StepResult {
  const hung = id.startsWith("fix-") ? null : hangSpot(id, x, z, life.span ?? 0);
  const piece = {
    id,
    x: Math.round((hung?.x ?? x) * 10) / 10,
    z: Math.round((hung?.z ?? z) * 10) / 10,
    rot: hung ? hung.rot : ((rot % 4) + 4) % 4,
  };
  if (id.startsWith("fix-")) {
    if (!FIXTURES.some((item) => item.id === id)) return { life, notes: [], error: "That is not in this room." };
    const next = clone(life);
    next.layout = [...(next.layout ?? []).filter((item) => item.id !== id), piece];
    return { life: next, notes: [] };
  }
  if (!life.inventory.includes(id)) return { life, notes: [], error: "That is not yours." };
  const next = clone(life);
  next.furniture = [...(next.furniture ?? []).filter((item) => item.id !== id), piece];
  next.stored = (next.stored ?? []).filter((item) => item !== id);
  return { life: next, notes: [] };
}

export function storePiece(life: Life, id: string): StepResult {
  const item = SHOP.find((entry) => entry.id === id);
  if (!item || !life.inventory.includes(id)) return { life, notes: [], error: "Nothing there to store." };
  const next = clone(life);
  next.furniture = (next.furniture ?? []).filter((piece) => piece.id !== id);
  next.stored = [...new Set([...(next.stored ?? []), id])];
  pushLog(next, `Stored ${item.name}.`);
  return { life: next, notes: [`${item.name} is stored.`] };
}

export function sellPiece(life: Life, id: string): StepResult {
  const item = SHOP.find((entry) => entry.id === id);
  if (!item || item.consume || !life.inventory.includes(id)) return { life, notes: [], error: "Nothing there to sell." };
  const back = sellValue(item.price);
  const next = clone(life);
  next.cash += back;
  next.inventory = next.inventory.filter((owned) => owned !== id);
  next.furniture = (next.furniture ?? []).filter((piece) => piece.id !== id);
  next.stored = (next.stored ?? []).filter((owned) => owned !== id);
  pushLog(next, `Sold ${item.name} for ${cedis(back)}.`);
  return { life: next, notes: [`Sold ${item.name} for ${cedis(back)}.`] };
}

export function repayLoan(life: Life): StepResult {
  if (life.loan <= 0) return { life, notes: [], error: "No susu hanging over you." };
  const amount = Math.min(life.loan, Math.max(life.weeklyLoan, 120), life.cash);
  if (amount <= 0) return { life, notes: [], error: "The wallet cannot cover a payment." };
  const next = clone(life);
  next.cash -= amount;
  next.loan -= amount;
  if (next.loan <= 0) {
    next.loan = 0;
    next.weeklyLoan = 0;
  }
  pushLog(next, `Paid ${cedis(amount)} off the susu.`);
  return { life: next, notes: [`Susu payment ${cedis(amount)}.`] };
}

export function gemSpotId(minutes: number) {
  const pool = SPOTS.filter((spot) => !spot.soon && spot.id !== "home");
  return pool[dayIndex(minutes) % pool.length]?.id ?? "beach";
}

export function questFor(life: Life) {
  if (life.needs.hunger < 55) return { title: "Eat something", detail: "Tap the cooler or the stove" };
  if (life.needs.bladder < 35) return { title: "Find a toilet", detail: "Your bladder is filing a complaint" };
  if (life.needs.energy < 40) return { title: "Rest your body", detail: "The bed is right there" };
  if (life.gemDay !== dayIndex(life.minutes)) {
    const spot = spotById(gemSpotId(life.minutes));
    return { title: "Daily gem hunt", detail: `Look around ${spot.name}` };
  }
  return { title: "Step outside", detail: "Accra is moving. Go meet it." };
}

export function dreamStatus(life: Life) {
  if (life.dream === "oga") return { label: "Career level", current: careerLevel(life), max: 5 };
  if (life.dream === "landlord") return { label: "Net worth", current: Math.max(0, Math.min(25000, life.cash - life.loan)), max: 25000 };
  if (life.dream === "star") return { label: "Music", current: life.skills.music, max: 10 };
  if (life.dream === "padi") return { label: "Close friends", current: Math.min(4, life.relations.filter((person) => person.score >= 70).length), max: 4 };
  return { label: life.funded ? "Funded" : "Coding", current: life.funded ? 1 : Math.min(4, life.skills.coding), max: life.funded ? 1 : 4 };
}

export const KENKEY_VERB = eat({
  id: "kenkey",
  label: "Kenkey and fish",
  detail: "Pepper included.",
  minutes: 15,
  cost: 20,
  effects: { hunger: 34, fun: 4 },
  tag: "food",
});

export function handleOf(name: string) {
  const words = name
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  const first = words[0] ?? "accra";
  const last = words.length > 1 ? words[words.length - 1] : "";
  const handle = last && last !== first ? `${first}_${last}` : first;
  return `@${handle.slice(0, 16)}`;
}

export function meetPerson(life: Life, name: string): StepResult {
  const next = clone(life);
  if (!next.relations.some((person) => person.name === name)) next.relations.push({ name, score: 8 });
  return { life: next, notes: [] };
}

function bumpRelation(life: Life, name: string, amount: number) {
  const known = life.relations.find((person) => person.name === name);
  if (known) known.score = Math.min(100, known.score + amount);
  else life.relations.push({ name, score: Math.min(100, amount) });
}

export function giftCash(life: Life, name: string, amount: number): StepResult {
  const value = Math.round(amount);
  if (!Number.isFinite(value) || value < 1) return { life, notes: [], error: "Enter an amount in cedis." };
  if (value > life.cash) return { life, notes: [], error: `MoMo cannot cover ${cedis(value)}. You have ${cedis(life.cash)}.` };
  const next = clone(life);
  next.cash -= value;
  next.needs.social = clampNeed(next.needs.social + 4);
  bumpRelation(next, name, 6);
  const handle = handleOf(name);
  const id = `momo-local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  next.transfers = [...(next.transfers ?? []), { id, delta: -value, note: `You sent ${cedis(value)} to ${handle}.` }].slice(-80);
  next.seenTransfers = [...new Set([...(next.seenTransfers ?? []), id])].slice(-80);
  pushLog(next, `You sent ${cedis(value)} to ${handle}.`);
  return { life: next, notes: [`${handle} has the ${cedis(value)}.`] };
}

export function receiveCash(life: Life, from: string, amount: number) {
  const next = clone(life);
  const value = Math.round(amount);
  next.cash += value;
  const id = `momo-local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  next.transfers = [...(next.transfers ?? []), { id, delta: value, note: `${from} sent you ${cedis(value)}.` }].slice(-80);
  pushLog(next, `${from} sent you ${cedis(value)}.`);
  return next;
}

export function spareChange(life: Life, name: string): StepResult {
  const handle = handleOf(name);
  if (life.inbox.some((line) => line.includes(`${handle} sent you`))) {
    return { life, notes: [], error: "I already sent you something. Go and work small." };
  }
  const person = life.relations.find((entry) => entry.name === name);
  if (!person || person.score < 40) return { life, notes: [], error: "My MoMo is dry. I no get am." };
  const gift = 15;
  const next = clone(life);
  next.cash += gift;
  pushLog(next, `${handle} sent you ${cedis(gift)}.`);
  return { life: next, notes: [`${handle} sent you ${cedis(gift)}.`] };
}

export function treatPerson(life: Life, name: string): StepResult {
  const cost = 18;
  if (life.cash < cost) return { life, notes: [], error: "Food money no dey." };
  const next = clone(life);
  next.cash -= cost;
  next.needs.hunger = clampNeed(next.needs.hunger + 8);
  next.needs.social = clampNeed(next.needs.social + 10);
  bumpRelation(next, name, 8);
  pushLog(next, `You bought food for ${handleOf(name)}.`);
  return { life: next, notes: [`Waakye is on the way to ${name}.`] };
}

export function invitePerson(life: Life, name: string, username?: string): StepResult {
  const known = life.relations.find((person) => person.name === name || person.name === username || person.name === `@${username}`);
  if (known && known.score < 8 && !username) return { life, notes: [], error: "They barely know you yet. Gist more first." };
  const next = clone(life);
  next.needs.social = clampNeed(next.needs.social + 12);
  bumpRelation(next, name, 10);
  const stay = life.where === "home" ? 120 : 200;
  const label = username ? `@${username}` : name;
  next.guests = [
    ...(next.guests ?? []).filter((guest) => guest.name !== name && guest.username !== username),
    {
      name,
      username,
      arrivedAt: next.minutes,
      until: next.minutes + stay,
      doing: "arrive",
      gift: Math.random() > 0.4 ? "Sugar bread" : undefined,
    },
  ];
  pushLog(next, life.where === "home" ? `${label} is invited over.` : `You invited ${label} over.`);
  return {
    life: next,
    notes: [life.where === "home" ? `Invite sent to ${label}. They Visit from People.` : `${label} can Visit from People for the next day.`],
  };
}

/** Invite someone to sit with you at a restaurant table. */
export function inviteToTable(life: Life, name: string, opts: { username?: string; seatId: string } ): StepResult {
  if (life.where === "home") return { life, notes: [], error: "You are home. Invite them over from the sofa." };
  if (!life.table || life.table.spot !== life.where || life.table.seatId !== opts.seatId) {
    return { life, notes: [], error: "Sit at a table first, then invite them over." };
  }
  const known = life.relations.find((person) => person.name === name || person.name === opts.username || person.name === `@${opts.username}`);
  if (known && known.score < 6 && !opts.username) return { life, notes: [], error: "They barely know you yet. Gist more first." };
  const next = clone(life);
  const label = opts.username ? `@${opts.username}` : name;
  const place = spotById(life.where).name;
  next.needs.social = clampNeed(next.needs.social + 10);
  bumpRelation(next, name, 8);
  next.guests = [
    ...(next.guests ?? []).filter((guest) => guest.name !== name && guest.username !== opts.username),
    {
      name,
      username: opts.username,
      arrivedAt: next.minutes,
      until: next.minutes + 90,
      doing: "dine",
      spot: life.where,
      seatId: opts.seatId,
    },
  ];
  pushLog(next, `You invited ${label} to your table at ${place}.`);
  return { life: next, notes: [`Invite sent — ${label} can join your table at ${place}.`] };
}

export function claimTable(life: Life, seatId: string): Life {
  const next = clone(life);
  next.table = { spot: life.where, seatId };
  return next;
}

export function clearTable(life: Life): Life {
  if (!life.table) return life;
  const next = clone(life);
  next.table = null;
  next.guests = (next.guests ?? []).filter((guest) => guest.doing !== "dine" || guest.spot !== life.where);
  return next;
}

export function visitPerson(life: Life, name: string): StepResult {
  if (life.cash < 5) return { life, notes: [], error: "Trotro fare is ₵5." };
  const next = clone(life);
  next.cash -= 5;
  next.minutes += 25;
  next.needs.social = clampNeed(next.needs.social + 14);
  next.needs.fun = clampNeed(next.needs.fun + 6);
  next.needs.energy = clampNeed(next.needs.energy - 4);
  bumpRelation(next, name, 8);
  pushLog(next, `You visited ${name}.`);
  return { life: next, notes: [`You sat with ${name}. Trotro was ₵5.`] };
}

export function huntGem(life: Life): StepResult {
  const spot = gemSpotId(life.minutes);
  if (life.where !== spot) return { life, notes: [], error: `Today's gem is at ${spotById(spot).name}.` };
  return runVerb(life, eat({ id: "gem", label: "Search for the gem", detail: "Eyes down.", minutes: 15, effects: { fun: 4 }, special: "gem" }), spot);
}
