import { cedis, cloneLife, spotById, turfPoint, type Life, type StepResult, type Verb } from "@/lib/game/world";

export type Weekly = { id: string; title: string; emoji: string; detail: string; weekday: number; start: number; end: number; spot: string; verbs: Verb[] };

function verb(partial: Partial<Verb> & Pick<Verb, "id" | "label" | "detail">): Verb {
  return { minutes: 60, cost: 0, earn: 0, effects: {}, social: true, ...partial };
}

export const WEEKLY: Weekly[] = [
  {
    id: "highlife-wed",
    title: "Wednesday Highlife Night",
    emoji: "🎺",
    detail: "A live band at Republic. Highlife classics, Kokroko on the table, aunties dancing first.",
    weekday: 3,
    start: 19,
    end: 23,
    spot: "republic",
    verbs: [verb({ id: "wk-highlife", label: "Dance to the band", detail: "The guitarist plays the old ones and the whole room sings.", minutes: 80, cost: 20, effects: { fun: 32, social: 20, energy: -10 }, tag: "party", skill: "music", emoji: "🎺" })],
  },
  {
    id: "oxford-jam",
    title: "Friday Oxford Street Jam",
    emoji: "🎉",
    detail: "Oxford Street fills up. DJs on the terraces and the whole of Osu outside.",
    weekday: 5,
    start: 20,
    end: 26,
    spot: "monsoon",
    verbs: [
      verb({ id: "wk-oxford", label: "Jam on Oxford Street", detail: "Speakers on every balcony. You lose your friends and find new ones.", minutes: 120, cost: 30, effects: { fun: 40, social: 26, energy: -16, hygiene: -8 }, tag: "party", emoji: "🎉" }),
      verb({ id: "wk-oxford-khebab", label: "Khebab from the street grill", detail: "Spicy beef on a stick, eaten while you dance.", minutes: 20, cost: 12, effects: { hunger: 22, fun: 6 }, tag: "food", emoji: "🍢" }),
    ],
  },
  {
    id: "night-market",
    title: "Saturday Night Market",
    emoji: "🔥",
    detail: "Charcoal grills, kelewele, a DJ by the gutter, and everybody's cousin.",
    weekday: 6,
    start: 18,
    end: 23,
    spot: "osu-night-market",
    verbs: [verb({ id: "wk-night-market", label: "Eat your way down the lanes", detail: "Kelewele, guinea fowl, coconut, then kelewele again.", minutes: 70, cost: 25, effects: { hunger: 40, fun: 22, social: 16 }, tag: "food", emoji: "🔥" })],
  },
  {
    id: "beach-day",
    title: "Sunday Labadi Beach Day",
    emoji: "🏖️",
    detail: "Drums, horse rides, football on the sand and a grill every few steps.",
    weekday: 0,
    start: 12,
    end: 18,
    spot: "beach",
    verbs: [
      verb({ id: "wk-beach", label: "Beach day with the city", detail: "Sand football, a horse ride you did not plan, and the sea at the end of it.", minutes: 120, cost: 15, effects: { fun: 38, social: 24, energy: -10, hygiene: -10 }, emoji: "🏖️" }),
      verb({ id: "wk-beach-coconut", label: "Fresh coconut", detail: "The seller chops the top off in three strokes.", minutes: 15, cost: 8, effects: { hunger: 10, fun: 8, energy: 6 }, tag: "food", emoji: "🥥" }),
    ],
  },
];

export const CHECKIN_BASE = 40;
export const CHECKIN_STEP = 10;
export const CHECKIN_STREAK_MAX = 6;

const DAY = 86400000;

function startOf(event: Weekly, day: Date) {
  return Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), event.start);
}

export function weekOf(at: number) {
  return Math.floor((at / DAY + 3) / 7);
}

export function weeklyKey(event: Weekly, start: number) {
  return `${event.id}-${new Date(start).toISOString().slice(0, 10)}`;
}

export type LiveWeekly = { event: Weekly; key: string; start: number; end: number };

export function weeklyNow(at = new Date()): LiveWeekly | null {
  const now = at.getTime();
  for (const event of WEEKLY) {
    for (const back of [0, 1]) {
      const day = new Date(now - back * DAY);
      if (day.getUTCDay() !== event.weekday) continue;
      const start = startOf(event, day);
      const end = start + (event.end - event.start) * 3600000;
      if (now >= start && now < end) return { event, key: weeklyKey(event, start), start, end };
    }
  }
  return null;
}

export function weeklyAt(spotId: string, at = new Date()) {
  const live = weeklyNow(at);
  return live && live.event.spot === spotId ? live : null;
}

export function weeklyNext(at = new Date()) {
  const now = at.getTime();
  return WEEKLY.map((event) => {
    for (let ahead = 0; ahead <= 7; ahead += 1) {
      const day = new Date(now + ahead * DAY);
      if (day.getUTCDay() !== event.weekday) continue;
      const start = startOf(event, day);
      const end = start + (event.end - event.start) * 3600000;
      if (end > now) return { event, start, live: now >= start };
    }
    return { event, start: now + 7 * DAY, live: false };
  }).sort((a, b) => a.start - b.start);
}

export function streakFor(life: Life, at = new Date()) {
  const week = weekOf(at.getTime());
  const last = life.weekly;
  if (!last) return 1;
  if (last.week === week) return last.streak;
  return last.week === week - 1 ? last.streak + 1 : 1;
}

export function checkInReward(life: Life, at = new Date()) {
  return CHECKIN_BASE + CHECKIN_STEP * (Math.min(CHECKIN_STREAK_MAX, streakFor(life, at)) - 1);
}

export function checkedIn(life: Life, key: string) {
  return (life.checkins ?? []).includes(key);
}

export function checkIn(life: Life, at = new Date()): StepResult {
  const live = weeklyNow(at);
  if (!live) return { life, notes: [], error: "No weekly event is on right now." };
  if (life.where !== live.event.spot) return { life, notes: [], error: `${live.event.title} is at ${spotById(live.event.spot).name}. Go there to check in.` };
  if (checkedIn(life, live.key)) return { life, notes: [], error: "You already checked in tonight." };
  const reward = checkInReward(life, at);
  const streak = streakFor(life, at);
  const next = cloneLife(life);
  next.cash += reward;
  next.checkins = [...(life.checkins ?? []), live.key].slice(-24);
  next.weekly = { week: weekOf(at.getTime()), streak, count: (life.weekly?.count ?? 0) + 1 };
  next.needs.fun = Math.min(100, next.needs.fun + 10);
  next.needs.social = Math.min(100, next.needs.social + 10);
  turfPoint(next, 10);
  const line = `Checked in at ${live.event.title}. +${cedis(reward)}${streak > 1 ? ` · ${streak}-week streak` : ""}.`;
  next.log = [line, ...next.log].slice(0, 14);
  return { life: next, notes: [line] };
}
