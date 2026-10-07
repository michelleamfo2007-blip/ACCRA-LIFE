import { cedis, lockReason, runVerb, type Life, type StepResult, type Verb } from "@/lib/game/world";

export const MONEY_LINE = "You hustle. Small work first, then stack up, then build bigger income streams.";

const hustle = (partial: Pick<Verb, "id" | "label" | "detail" | "minutes" | "earn"> & Partial<Verb>): Verb => ({
  cost: 0,
  effects: { energy: -8, fun: 4 },
  skill: "hustle",
  perSkill: 4,
  cool: true,
  ...partial,
});

export const HUSTLES: Verb[] = [
  hustle({ id: "hustle-hawk", label: "Hawk at the lights", detail: "Sachet water and plantain chips between the cars.", minutes: 25, earn: 18, perSkill: 4 }),
  hustle({ id: "hustle-stall", label: "Sell from a stall", detail: "Call the customers. Don't drop the tomatoes.", minutes: 40, earn: 28, perSkill: 5, effects: { energy: -10, fun: 2, social: 4 } }),
  hustle({ id: "hustle-errand", label: "Run an errand", detail: "Somebody needs a thing from across town. You bring it.", minutes: 20, earn: 15, perSkill: 3 }),
  hustle({ id: "hustle-wash", label: "Wash a car", detail: "Bucket, soap, and a tip if the rims shine.", minutes: 35, earn: 32, perSkill: 4, effects: { energy: -10, hygiene: -8, fun: 2 } }),
  hustle({ id: "hustle-delivery", label: "Bike delivery", detail: "One order, one address, cash when you hand it over.", minutes: 30, earn: 36, perSkill: 6, effects: { energy: -12, fun: 4 } }),
];

export function hustlePay(life: Life, verb: Verb) {
  return verb.earn + (verb.perSkill ?? 0) * life.skills.hustle;
}

export function doHustle(life: Life, id: string): StepResult {
  const verb = HUSTLES.find((item) => item.id === id);
  if (!verb) return { life, notes: [], error: "That hustle is gone." };
  return runVerb(life, verb);
}

export type MoneyStep = {
  id: string;
  title: string;
  detail: string;
  app: "school" | "bank" | "biz" | "fleet" | "land" | null;
  done: (life: Life) => boolean;
};

export const MONEY_STEPS: MoneyStep[] = [
  { id: "hustle", title: "Start small", detail: "Hawk, run an errand, wash a car. Quick cash, and hustle skill grows.", app: null, done: (life) => (life.stats?.hustles ?? 0) > 0 },
  { id: "job", title: "Get a job", detail: "A shift is steadier than a hustle. Show up, then ask for a promotion.", app: null, done: (life) => (life.stats?.shifts ?? 0) > 0 },
  { id: "skill", title: "Learn a skill", detail: "Cooking, driving, coding, career. Practice and school raise what you can earn.", app: "school", done: (life) => Object.values(life.skills).some((level) => level >= 2) },
  { id: "side", title: "Keep a side hustle", detail: "Use the hours the job does not take. Skill makes the same gig pay more.", app: null, done: (life) => (life.stats?.hustles ?? 0) >= 3 || life.skills.hustle >= 2 },
  { id: "save", title: "Save up", detail: "Don't spend everything. Savings in the Bank earn interest.", app: "bank", done: (life) => (life.bank?.savings ?? 0) > 0 },
  { id: "asset", title: "Buy something that earns", detail: "A shop, a taxi, or land. It pays you while you sleep.", app: "biz", done: (life) => (life.businesses?.length ?? 0) > 0 || (life.fleet?.length ?? 0) > 0 || (life.plots?.length ?? 0) > 0 },
  { id: "hire", title: "Hire people", detail: "Staff run the shop. A driver runs the car. You collect.", app: "fleet", done: (life) => (life.businesses?.length ?? 0) > 0 || (life.fleet ?? []).some((car) => Boolean(car.driver)) },
  { id: "invest", title: "Let money sit and grow", detail: "Leave savings alone, or put cash into land and a second shop.", app: "land", done: (life) => (life.bank?.savings ?? 0) >= 500 || (life.plots?.length ?? 0) > 0 || (life.businesses?.length ?? 0) >= 2 },
  { id: "expand", title: "Expand", detail: "Upgrade the shop, open another, or add a car to the fleet.", app: "biz", done: (life) => (life.businesses ?? []).some((shop) => shop.level >= 2) || (life.businesses?.length ?? 0) >= 2 || (life.fleet?.length ?? 0) >= 2 },
  { id: "compound", title: "Repeat", detail: "Work, save, buy, upgrade. That is how the money compounds.", app: "bank", done: (life) => (life.businesses?.length ?? 0) > 0 && ((life.fleet?.length ?? 0) > 0 || (life.plots?.length ?? 0) > 0 || (life.bank?.savings ?? 0) >= 2000) },
];

export function nextMoneyStep(life: Life) {
  return MONEY_STEPS.find((step) => !step.done(life)) ?? null;
}

export function hustleLock(life: Life, verb: Verb) {
  return lockReason(life, verb);
}

export function hustleLabel(life: Life, verb: Verb) {
  const wait = hustleLock(life, verb);
  if (wait) return wait;
  return `About ${cedis(hustlePay(life, verb))}`;
}
