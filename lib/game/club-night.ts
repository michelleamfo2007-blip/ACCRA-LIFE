import type { Verb } from "@/lib/game/world";

/** Normal nightlife only — dance floor, bottle service, no sexualized content. */

export type ClubState = "enter" | "bar" | "table" | "dance" | "watch" | "leave";

export type Bottle = {
  id: string;
  label: string;
  detail: string;
  cost: number;
  emoji: string;
  vibe: "vip" | "mid" | "local";
};

export const BOTTLES: Bottle[] = [
  {
    id: "club-henny",
    label: "Hennessy bottle",
    detail: "Sparklers up. The table becomes the room.",
    cost: 850,
    emoji: "🥂",
    vibe: "vip",
  },
  {
    id: "club-moet",
    label: "Moët on ice",
    detail: "Cold bottle, warm crowd, DJ noticing.",
    cost: 720,
    emoji: "🍾",
    vibe: "vip",
  },
  {
    id: "club-ciroc",
    label: "Cîroc bottle",
    detail: "Waiter walks it in. Everybody looks once.",
    cost: 640,
    emoji: "🧊",
    vibe: "vip",
  },
  {
    id: "club-star",
    label: "Star beer bucket",
    detail: "Not VIP. Still Accra. Still a night.",
    cost: 120,
    emoji: "🍺",
    vibe: "local",
  },
  {
    id: "club-alomo",
    label: "Alomo bitters round",
    detail: "Shared glasses. The gist gets louder.",
    cost: 90,
    emoji: "🥃",
    vibe: "local",
  },
];

const act = (partial: Partial<Verb> & Pick<Verb, "id" | "label" | "detail">): Verb => ({
  minutes: 40,
  cost: 0,
  earn: 0,
  effects: {},
  ...partial,
});

export function isNightlife(spotId: string, clubIds: Set<string>) {
  return clubIds.has(spotId) || NIGHT_LOUNGES.has(spotId);
}

/** Lounges/bars that run the club system even if not in the hard club list. */
export const NIGHT_LOUNGES = new Set(["bloom", "monsoon", "republic", "still", "plus233", "lizzys", "duncans"]);

export function clubVerbs(spotId: string): Verb[] {
  const vip = spotId === "twist" || spotId === "duplex" || spotId === "one-percent" || spotId === "ace-tantra";
  const bottles = BOTTLES.filter((item) => (vip ? true : item.vibe !== "vip" || item.id === "club-ciroc"));
  return [
    act({
      id: `club-dance-${spotId}`,
      label: "Hit the floor",
      detail: "Afrobeats and highlife. Find your pocket.",
      minutes: 90,
      cost: vip ? 40 : 20,
      effects: { fun: 32, energy: -14, social: 14, hygiene: -8 },
      tag: "party",
      skill: "music",
      social: true,
      emoji: "🪩",
    }),
    act({
      id: `club-bar-${spotId}`,
      label: "Order at the bar",
      detail: "One drink. Hold the rail. Watch the room.",
      minutes: 35,
      cost: vip ? 45 : 22,
      effects: { fun: 16, social: 10, bladder: 4 },
      tag: "party",
      social: true,
      emoji: "🍹",
    }),
    act({
      id: `club-vip-${spotId}`,
      label: vip ? "Take a VIP table" : "Take a table",
      detail: vip ? "Booth, view of the floor, waiter on call." : "A table near the speakers. Good enough.",
      minutes: 50,
      cost: vip ? 180 : 60,
      effects: { fun: 14, social: 12 },
      tag: "party",
      social: true,
      emoji: "🪑",
    }),
    ...bottles.map((bottle) =>
      act({
        id: bottle.id,
        label: bottle.label,
        detail: bottle.detail,
        minutes: 70,
        cost: bottle.cost,
        effects: { fun: bottle.vibe === "vip" ? 40 : 22, social: bottle.vibe === "vip" ? 28 : 14, energy: -6 },
        tag: "party",
        social: true,
        emoji: bottle.emoji,
      }),
    ),
  ];
}

export function isBottleVerb(verb: Verb) {
  return BOTTLES.some((bottle) => bottle.id === verb.id) || /bottle|moët|moet|hennessy|cîroc|ciroc|sparkler/i.test(`${verb.id} ${verb.label}`);
}

export function bottleOf(verb: Verb): Bottle | null {
  return BOTTLES.find((bottle) => bottle.id === verb.id) ?? null;
}

export type ClubNpc = {
  id: string;
  name: string;
  state: ClubState;
  left: number;
  top: number;
  skin: string;
  shirt: string;
  hair: string;
  face: 1 | -1;
};

const NAMES = ["Kofi", "Ama", "Nana", "Efua", "Joe", "Abena", "Kwesi", "Serwa"];
const SKINS = ["#c68a62", "#a86f4c", "#8d5a3b", "#7a4a2c", "#653c24"];
const SHIRTS = ["#CE1126", "#FCD116", "#ec4899", "#3b82f6", "#22c55e", "#f4efe6", "#7c3aed"];
const HAIR = ["Afro", "Bob", "Bun", "Locs", "Braids"];

const ZONES: Record<ClubState, { left: number; top: number }[]> = {
  enter: [
    { left: 42, top: 72 },
    { left: 48, top: 70 },
  ],
  bar: [
    { left: 22, top: 48 },
    { left: 28, top: 52 },
    { left: 18, top: 54 },
  ],
  table: [
    { left: 72, top: 56 },
    { left: 68, top: 60 },
    { left: 78, top: 50 },
  ],
  dance: [
    { left: 48, top: 50 },
    { left: 54, top: 46 },
    { left: 42, top: 54 },
    { left: 56, top: 52 },
    { left: 46, top: 44 },
  ],
  watch: [
    { left: 36, top: 58 },
    { left: 60, top: 62 },
    { left: 32, top: 42 },
  ],
  leave: [
    { left: 40, top: 76 },
    { left: 50, top: 78 },
  ],
};

const CYCLE: ClubState[] = ["enter", "bar", "watch", "dance", "table", "dance", "watch", "leave"];

/** Deterministic club crowd that advances state over wall time. */
export function clubCrowdAt(spotId: string, at = Date.now(), count = 8): ClubNpc[] {
  const beat = Math.floor(at / 4000);
  return Array.from({ length: count }, (_, index) => {
    const seed = hash(`${spotId}:${index}`);
    const phase = CYCLE[(beat + seed) % CYCLE.length];
    const spots = ZONES[phase];
    const slot = spots[(seed + beat) % spots.length];
    const jitter = ((seed + beat * 3) % 7) - 3;
    return {
      id: `${spotId}-club-${index}`,
      name: NAMES[(seed + index) % NAMES.length],
      state: phase,
      left: slot.left + jitter,
      top: slot.top + (((seed * 3) % 5) - 2),
      skin: SKINS[seed % SKINS.length],
      shirt: SHIRTS[(seed + index) % SHIRTS.length],
      hair: HAIR[seed % HAIR.length],
      face: ((seed + beat) % 2 === 0 ? 1 : -1) as 1 | -1,
    };
  }).filter((npc) => npc.state !== "leave" || (beat + hash(npc.id)) % 5 === 0);
}

export function clubStateLabel(state: ClubState) {
  if (state === "enter") return "Just in";
  if (state === "bar") return "At the bar";
  if (state === "table") return "At a table";
  if (state === "dance") return "On the floor";
  if (state === "watch") return "Watching";
  return "Heading out";
}

function hash(text: string) {
  let n = 0;
  for (let i = 0; i < text.length; i += 1) n = (n * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(n);
}
