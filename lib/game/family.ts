import { SKINS, cedis, cloneLife, logLine, passTime, type Kid, type Life, type StepResult } from "@/lib/game/world";

export const MAX_KIDS = 4;
export const BIRTH_HOURS = 24;
export const ANTENATAL = 400;
export const OUTDOORING = 300;
export const SCHOOL_AGE = 3;
export const GROWN_AGE = 18;

const DAY_NAMES: [string, string][] = [
  ["Kwasi", "Akosua"],
  ["Kwadwo", "Adwoa"],
  ["Kwabena", "Abena"],
  ["Kwaku", "Akua"],
  ["Yaw", "Yaa"],
  ["Kofi", "Afua"],
  ["Kwame", "Ama"],
];

const id = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function kidAge(life: Life, kid: Kid) {
  return Math.max(0, Math.floor((life.minutes - kid.born) / 1440));
}

export function careWait(life: Life, kid: Kid) {
  return Math.max(0, kid.care + 360 - life.minutes);
}

export function dayNameFor(at: Date, girl: boolean) {
  return DAY_NAMES[at.getUTCDay()][girl ? 1 : 0];
}

export function expectBaby(life: Life, married: boolean): StepResult {
  if (!married) return { life, notes: [], error: "Get married first. Ask your partner in the People app." };
  if (life.expecting) return { life, notes: [], error: "A baby is already on the way." };
  if ((life.kids ?? []).length >= MAX_KIDS) return { life, notes: [], error: "Four is a full house." };
  if (life.cash < ANTENATAL) return { life, notes: [], error: `Antenatal care costs ${cedis(ANTENATAL)}.` };
  const next = cloneLife(life);
  next.cash -= ANTENATAL;
  next.expecting = next.minutes + BIRTH_HOURS * 60;
  logLine(next, "A baby is on the way. Antenatal booked at the clinic.");
  return { life: next, notes: ["A baby is on the way! Come back in a day."] };
}

export function welcomeBaby(life: Life, girl: boolean, chosen: string, at = new Date()): StepResult {
  if (!life.expecting) return { life, notes: [], error: "No baby on the way." };
  if (life.minutes < life.expecting) return { life, notes: [], error: `Not yet. ${Math.ceil((life.expecting - life.minutes) / 60)}h to go.` };
  const dayName = dayNameFor(at, girl);
  const name = chosen.trim().replace(/\s+/g, " ").slice(0, 20) || dayName;
  const next = cloneLife(life);
  next.expecting = null;
  next.kids = [...(next.kids ?? []), { id: id(), name, dayName, girl, born: next.minutes, outdoored: false, school: false, care: next.minutes }];
  next.needs.fun = Math.min(100, next.needs.fun + 30);
  next.needs.energy = Math.max(0, next.needs.energy - 20);
  const line = `${name} is born. Day name: ${dayName}.`;
  logLine(next, line);
  return { life: next, notes: [`${line} Plan the outdooring.`] };
}

function withKid(life: Life, kidId: string, change: (kid: Kid) => Kid) {
  const next = cloneLife(life);
  next.kids = (next.kids ?? []).map((kid) => (kid.id === kidId ? change(kid) : kid));
  return next;
}

export function holdOutdooring(life: Life, kidId: string): StepResult {
  const kid = life.kids?.find((item) => item.id === kidId);
  if (!kid) return { life, notes: [], error: "No child by that name." };
  if (kid.outdoored) return { life, notes: [], error: `${kid.name} was already outdoored.` };
  if (life.cash < OUTDOORING) return { life, notes: [], error: `The outdooring costs ${cedis(OUTDOORING)}: drinks, food, and the elders.` };
  const timed = passTime(withKid(life, kidId, (item) => ({ ...item, outdoored: true })), 180).life;
  timed.cash -= OUTDOORING;
  timed.needs.social = Math.min(100, timed.needs.social + 30);
  timed.needs.fun = Math.min(100, timed.needs.fun + 16);
  const line = `Dawn outdooring for ${kid.name}. Water, then schnapps, so they know truth from falsehood.`;
  logLine(timed, line);
  return { life: timed, notes: [line] };
}

export function careForKid(life: Life, kidId: string): StepResult {
  const kid = life.kids?.find((item) => item.id === kidId);
  if (!kid) return { life, notes: [], error: "No child by that name." };
  const wait = careWait(life, kid);
  if (wait > 0) return { life, notes: [], error: `${kid.name} is fine for now. Back in ${Math.ceil(wait / 60)}h.` };
  const age = kidAge(life, kid);
  const timed = passTime(withKid(life, kidId, (item) => ({ ...item, care: life.minutes })), 40).life;
  timed.needs.fun = Math.min(100, timed.needs.fun + 10);
  timed.needs.social = Math.min(100, timed.needs.social + 8);
  timed.needs.energy = Math.max(0, timed.needs.energy - 6);
  const line = age < 3 ? `You fed and bathed ${kid.name}.` : age < 12 ? `Homework and a story with ${kid.name}.` : `A long talk with ${kid.name} about life.`;
  return { life: timed, notes: [line] };
}

export function enrolKid(life: Life, kidId: string): StepResult {
  const kid = life.kids?.find((item) => item.id === kidId);
  if (!kid) return { life, notes: [], error: "No child by that name." };
  if (kid.school) return { life, notes: [], error: `${kid.name} is already in school.` };
  if (kidAge(life, kid) < SCHOOL_AGE) return { life, notes: [], error: `${kid.name} can start school at ${SCHOOL_AGE}.` };
  if (life.cash < 150) return { life, notes: [], error: "Uniform, books and admission cost ₵150." };
  const next = withKid(life, kidId, (item) => ({ ...item, school: true }));
  next.cash -= 150;
  return { life: next, notes: [`${kid.name} starts school. Fees are ₵40 every Saturday.`] };
}

export function inheritWorth(life: Life) {
  return Math.round(Math.max(0, life.cash) * 0.8);
}

export function passOn(life: Life, kidId: string): StepResult {
  const kid = life.kids?.find((item) => item.id === kidId);
  if (!kid) return { life, notes: [], error: "No child by that name." };
  if (kidAge(life, kid) < GROWN_AGE) return { life, notes: [], error: `${kid.name} is not grown yet.` };
  const next = cloneLife(life);
  const skin = SKINS[Math.min(SKINS.length - 1, Math.max(0, SKINS.indexOf(life.look.skin) + (Math.random() < 0.5 ? -1 : 1)))] ?? life.look.skin;
  next.look = { ...life.look, body: kid.girl ? "woman" : "man", hair: kid.girl ? "Braids" : "Low cut", skin };
  next.cash = inheritWorth(life);
  next.needs = { hunger: 80, energy: 90, fun: 70, social: 70, hygiene: 80, bladder: 80 };
  next.skills = Object.fromEntries(Object.entries(life.skills).map(([key, value]) => [key, Math.floor(value / 2) + (kid.school ? 1 : 0)])) as Life["skills"];
  next.kids = (life.kids ?? []).filter((item) => item.id !== kidId);
  next.expecting = null;
  next.relations = [];
  next.health = {};
  next.generation = (life.generation ?? 1) + 1;
  next.school = { certs: kid.school ? ["wassce"] : [] };
  const line = `You now live as ${kid.name}, generation ${next.generation}. The house, the plots and ${cedis(next.cash)} came with you.`;
  logLine(next, line);
  return { life: next, notes: [line] };
}
