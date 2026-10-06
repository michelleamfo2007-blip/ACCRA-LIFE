import { cedis, cloneLife, type Life, type StepResult } from "@/lib/game/world";

export const GUIDE_REWARD = 25;

export const GUIDE = [
  { id: "eat", title: "Eat something", hint: "Tap food in your room or buy chop at a spot.", app: null, done: (life: Life) => (life.stats?.meals ?? 0) > 0 },
  { id: "trip", title: "Go somewhere", hint: "Open the map and pick a place. Trek is free.", app: null, done: (life: Life) => (life.stats?.trips ?? 0) > 0 },
  { id: "work", title: "Work a shift", hint: "The Work app lists jobs. Shifts pay cash.", app: "work", done: (life: Life) => (life.stats?.shifts ?? 0) > 0 },
  { id: "friend", title: "Make a friend", hint: "Talk to people at any spot.", app: "people", done: (life: Life) => life.relations.some((person) => person.score >= 10) },
  { id: "party", title: "Go out", hint: "Bars, beach and clubs on the map.", app: null, done: (life: Life) => (life.stats?.parties ?? 0) > 0 },
  { id: "save", title: "Open a savings account", hint: "Bank app. Savings earn interest every day.", app: "bank", done: (life: Life) => (life.bank?.savings ?? 0) > 0 },
  { id: "story", title: "Finish a story chapter", hint: "Stories app. Auntie Adjoa is waiting at Makola.", app: "stories", done: (life: Life) => Object.values(life.story ?? {}).some((step) => step > 0) },
  { id: "faith", title: "Join a congregation", hint: "Community app. Church or mosque.", app: "community", done: (life: Life) => Boolean(life.community?.faith) },
] as const;

export type GuideStep = (typeof GUIDE)[number];

export function guideLeft(life: Life) {
  const claimed = new Set(life.guide ?? []);
  return GUIDE.filter((step) => !claimed.has(step.id));
}

export function guideNext(life: Life) {
  return guideLeft(life)[0] ?? null;
}

export function claimGuide(life: Life, stepId: string): StepResult {
  const step = GUIDE.find((item) => item.id === stepId);
  if (!step) return { life, notes: [], error: "No such step." };
  if (life.guide?.includes(step.id)) return { life, notes: [], error: "Already claimed." };
  if (!step.done(life)) return { life, notes: [], error: step.hint };
  const next = cloneLife(life);
  next.guide = [...(next.guide ?? []), step.id];
  next.cash += GUIDE_REWARD;
  return { life: next, notes: [`${step.title}: done. +${cedis(GUIDE_REWARD)}.`] };
}
