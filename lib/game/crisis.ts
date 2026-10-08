import { noteRep } from "@/lib/game/spine";
import { cedis, cloneLife, homeById, hourOf, passTime, seasonFlags, type Crisis, type Life, type StepResult } from "@/lib/game/world";

const ROUGH = /market|jamestown|circle|kaneshie|makola|nima|agbogbloshie|kejetia|madina|spintex/i;

export function strain(life: Life, walking: boolean) {
  const need = life.needs;
  let score = 0;
  if (need.hunger < 30) score += 18;
  if (need.hunger < 15) score += 16;
  if (need.energy < 25) score += 18;
  if (need.energy < 12) score += 14;
  if (life.health?.sick) score += 20;
  if ((life.health?.weakUntil ?? 0) > life.minutes) score += 18;
  if (life.hangover && life.hangover.until > life.minutes) score += 14;
  const hour = hourOf(life.minutes);
  const sky = seasonFlags(life.minutes);
  if (walking && hour >= 11 && hour <= 15) score += sky.harmattan ? 8 : 12;
  if (sky.harmattan) score += 8;
  const home = homeById(life.homeId);
  if ((home.grade === "low" || home.grade === "hall") && life.cash < 80) score += 12;
  if ((life.pantry ?? 0) <= 0 && need.hunger < 40) score += 8;
  const hasWater = Object.entries(life.cupboard ?? {}).some(([id, qty]) => qty > 0 && /water|bottle/.test(id));
  if (!hasWater && need.hunger < 35) score += 8;
  if (life.health?.warn) score += 12;
  if (life.cash > 2500 && home.grade === "high") score = Math.round(score * 0.4);
  else if (life.cash > 800) score = Math.round(score * 0.72);
  if (!walking) score = Math.round(score * 0.35);
  return Math.min(100, score);
}

function causeOf(life: Life) {
  if (life.health?.sick) return `the ${life.health.sick.kind} and the walk`;
  if (life.needs.hunger < 15) return "an empty stomach";
  if (life.needs.energy < 12) return "no sleep in you";
  if (life.hangover && life.hangover.until > life.minutes) return "last night still in your blood";
  if (seasonFlags(life.minutes).harmattan) return "the dust and the sun";
  if (hourOf(life.minutes) >= 11 && hourOf(life.minutes) <= 15) return "the heat on a long walk";
  return "going too long without food or rest";
}

function log(life: Life, line: string) {
  life.log = [line, ...life.log].slice(0, 14);
  life.inbox = [line, ...life.inbox].slice(0, 20);
}

export function afterWalk(life: Life, notes: string[]): StepResult | null {
  if (life.health?.crisis) return null;
  const score = strain(life, true);
  const warned = Boolean(life.health?.warn);
  if ((warned && score >= 58) || score >= 86) {
    return collapse(life, notes);
  }
  if (score >= 48) {
    const line = "You feel weak. Sit down or eat something.";
    life.health = { ...(life.health ?? {}), warn: line };
    notes.push(line);
  }
  return null;
}

function collapse(life: Life, notes: string[]): StepResult {
  const next = cloneLife(life);
  const kin = [...next.relations].sort((a, b) => b.score - a.score)[0];
  const rough = ROUGH.test(next.where) || homeById(next.homeId).grade === "low";
  const roll = Math.random();
  const help: Crisis["help"] = kin && kin.score >= 50 && roll < 0.4 ? "friend" : roll < (rough ? 0.55 : 0.7) ? "stranger" : roll < 0.85 ? "film" : "none";
  let robbed = 0;
  if (help === "none" && rough && next.cash > 25) robbed = Math.min(40, Math.round(next.cash * 0.25));
  next.cash = Math.max(0, next.cash - robbed);
  const already = (next.health?.weakUntil ?? 0) > next.minutes;
  const cause = causeOf(next);
  const note =
    help === "friend"
      ? `${kin?.name ?? "A friend"} finds you on the ground. ${cause}.`
      : help === "stranger"
        ? `A stranger calls for help. You went down from ${cause}.`
        : help === "film"
          ? `You go down from ${cause}. Somebody's phone is up.`
          : `You come around on the ground. ${cause}.${robbed ? ` ${cedis(robbed)} is gone from your pocket.` : ""}`;
  next.health = {
    ...(next.health ?? {}),
    warn: undefined,
    weakUntil: next.minutes + (already ? 2880 : 1440),
    crisis: { cause, help, ward: "ground", bill: 0, paid: 0, until: next.minutes, robbed, note, place: next.where },
    sick: already && !next.health?.sick ? { kind: "flu", since: next.minutes } : next.health?.sick,
  };
  next.needs.energy = Math.min(next.needs.energy, 8);
  next.needs.fun = Math.max(0, next.needs.fun - 12);
  if (kin && help === "friend") kin.score = Math.min(100, kin.score + 8);
  else if (kin && help === "none") kin.score = Math.max(0, kin.score - 4);
  log(next, note);
  if (help === "film") noteRep(next, Math.random() < 0.5 ? -3 : 4, "A clip of you on the ground is moving through phones.");
  if (Object.keys(next.ranks ?? {}).length) log(next, "Work marks you absent. Don't expect the day to be paid.");
  if ((next.businesses ?? []).length) log(next, "The shop opened without you.");
  notes.push(note);
  return { life: next, notes };
}

const WAIT: Record<Exclude<Crisis["ward"], "ground">, number> = { public: 150, private: 35, healer: 70, chemist: 20 };

function price(life: Life, ward: Exclude<Crisis["ward"], "ground">) {
  const covered = (life.health?.nhisUntil ?? 0) > life.minutes;
  if (ward === "public") return covered ? 25 : 110;
  if (ward === "private") return covered ? 260 : 420;
  if (ward === "healer") return 35;
  return 45;
}

export function chooseCare(life: Life, ward: Exclude<Crisis["ward"], "ground">): StepResult {
  const crisis = life.health?.crisis;
  if (!crisis || crisis.ward !== "ground") return { life, notes: [], error: "You are not on the ground." };
  if (ward === "chemist" && life.health?.sick?.kind === "malaria") return { life, notes: [], error: "The chemist will not take malaria. You need a ward." };
  if (ward === "private" && life.cash < price(life, ward) && !life.relations.some((person) => person.score >= 50)) {
    return { life, notes: [], error: "The private clinic wants the money before a bed." };
  }
  const next = cloneLife(life);
  const bill = price(next, ward);
  const names = { public: "Korle Bu", private: "a private clinic", healer: "the herbalist", chemist: "the pharmacy" };
  next.health = {
    ...(next.health ?? {}),
    crisis: { ...crisis, ward, bill, until: next.minutes + WAIT[ward], note: `You are at ${names[ward]}. The bill is ${cedis(bill)}.` },
  };
  const line = next.health.crisis?.note ?? "You are in care.";
  log(next, line);
  return { life: next, notes: [line] };
}

export function callDoctor(life: Life): StepResult {
  const crisis = life.health?.crisis;
  if (!crisis) return { life, notes: [], error: "You are on your feet." };
  if (life.cash < 800) return { life, notes: [], error: "A private doctor does not come out for this wallet." };
  if (life.cash < 200) return { life, notes: [], error: "The doctor wants ₵200." };
  const next = cloneLife(life);
  next.cash -= 200;
  next.health = { ...(next.health ?? {}), crisis: null, sick: null, warn: undefined, weakUntil: next.minutes + 480 };
  next.needs.energy = Math.min(100, next.needs.energy + 20);
  const line = "Your doctor meets you. ₵200. Home by evening, still weak.";
  log(next, line);
  return { life: next, notes: [line] };
}

export function shortenQueue(life: Life): StepResult {
  const crisis = life.health?.crisis;
  if (!crisis || crisis.ward === "ground") return { life, notes: [], error: "You are not in a queue." };
  if (life.cash < 40) return { life, notes: [], error: "₵40 would move you up the queue." };
  const next = cloneLife(life);
  next.cash -= 40;
  next.health = { ...(next.health ?? {}), crisis: { ...crisis, until: next.minutes + 15, note: "The queue moves. You are seen sooner." } };
  return { life: next, notes: ["The queue moves. You are seen sooner."] };
}

export function waitCare(life: Life): StepResult {
  const crisis = life.health?.crisis;
  if (!crisis || crisis.ward === "ground") return { life, notes: [], error: "Choose where they should take you." };
  const left = Math.max(10, crisis.until - life.minutes);
  const timed = passTime(life, left);
  const next = timed.life;
  if (next.health?.crisis) next.health = { ...next.health, crisis: { ...next.health.crisis, until: next.minutes, note: "They have seen you. The bill is still on the counter." } };
  return { life: next, notes: ["They have seen you. The bill is still on the counter.", ...timed.notes] };
}

function ready(life: Life) {
  const crisis = life.health?.crisis;
  if (!crisis) return "You are on your feet.";
  if (crisis.ward === "ground") return "Choose care, or get up.";
  if (crisis.until > life.minutes) return "They have not seen you yet.";
  return null;
}

export function payCare(life: Life, part: boolean): StepResult {
  const blocked = ready(life);
  if (blocked) return { life, notes: [], error: blocked };
  const crisis = life.health!.crisis!;
  const due = Math.max(0, crisis.bill - crisis.paid);
  const slice = part ? Math.max(10, Math.ceil(due / 2)) : due;
  if (life.cash < slice) return { life, notes: [], error: `You need ${cedis(slice)} at the counter.` };
  const next = cloneLife(life);
  next.cash -= slice;
  const paid = crisis.paid + slice;
  const left = crisis.bill - paid;
  if (left > 0) {
    next.stats = { ...(next.stats ?? {}), clinicDebt: (next.stats?.clinicDebt ?? 0) + left };
  }
  next.health = { ...(next.health ?? {}), crisis: null, sick: crisis.ward === "healer" && Math.random() < 0.45 ? next.health?.sick : null, warn: undefined };
  next.needs.energy = Math.min(100, next.needs.energy + (crisis.ward === "private" ? 24 : 12));
  const line = left > 0 ? `You pay ${cedis(slice)}. ${cedis(left)} waits for Saturday.` : `Bill settled. ${cedis(slice)}. You leave weak, not finished.`;
  log(next, line);
  return { life: next, notes: [line] };
}

export function askKin(life: Life): StepResult {
  const blocked = ready(life);
  if (blocked) return { life, notes: [], error: blocked };
  const crisis = life.health!.crisis!;
  const kin = [...life.relations].sort((a, b) => b.score - a.score)[0];
  if (!kin || kin.score < 45) return { life, notes: [], error: "Nobody picks up." };
  const next = cloneLife(life);
  const person = next.relations.find((item) => item.name === kin.name);
  if (person) person.score = Math.max(0, person.score - 3);
  next.health = { ...(next.health ?? {}), crisis: null, sick: null, warn: undefined };
  next.needs.energy = Math.min(100, next.needs.energy + 10);
  const line = `${kin.name} settles ${cedis(Math.max(0, crisis.bill - crisis.paid))}. They are quiet about it.`;
  log(next, line);
  return { life: next, notes: [line] };
}

export function getUp(life: Life): StepResult {
  const crisis = life.health?.crisis;
  if (!crisis) return { life, notes: [], error: "You are on your feet." };
  if (crisis.ward !== "ground" && crisis.until > life.minutes) return { life, notes: [], error: "You are still on the bench." };
  if (crisis.ward === "private" && crisis.paid < crisis.bill) {
    return { life, notes: [], error: "The private clinic will not open the door until the bill is paid." };
  }
  const next = cloneLife(life);
  const owed = crisis.ward !== "ground" && crisis.until <= life.minutes ? Math.max(0, crisis.bill - crisis.paid) : 0;
  if (owed > 0 && crisis.ward !== "private") next.stats = { ...(next.stats ?? {}), clinicDebt: (next.stats?.clinicDebt ?? 0) + owed };
  next.health = {
    ...(next.health ?? {}),
    crisis: null,
    warn: undefined,
    weakUntil: Math.max(next.health?.weakUntil ?? 0, next.minutes + (crisis.ward === "ground" ? 2000 : 720)),
  };
  next.needs.energy = Math.min(next.needs.energy, crisis.ward === "ground" ? 6 : 14);
  const line = crisis.ward === "ground" ? "You get up. The day is not over, and neither is the weakness." : owed ? `You leave owing ${cedis(owed)}. Saturday will ask.` : "You leave before they wanted you to.";
  log(next, line);
  return { life: next, notes: [line] };
}

export function sitDown(life: Life): StepResult {
  if (!life.health?.warn) return { life, notes: [], error: "You do not need to stop." };
  const timed = passTime(life, 20);
  const next = timed.life;
  next.health = { ...(next.health ?? {}), warn: undefined };
  next.needs.energy = Math.min(100, next.needs.energy + 10);
  const line = "You sit. The dark at the edge of your eyes eases.";
  log(next, line);
  return { life: next, notes: [line] };
}

export function drinkNow(life: Life): StepResult {
  const hit = Object.entries(life.cupboard ?? {}).find(([id, qty]) => qty > 0 && /water|bottle/.test(id));
  if (!hit) return { life, notes: [], error: "No water on you." };
  const next = cloneLife(life);
  next.cupboard = { ...(next.cupboard ?? {}), [hit[0]]: hit[1] - 1 };
  next.health = { ...(next.health ?? {}), warn: undefined };
  next.needs.energy = Math.min(100, next.needs.energy + 8);
  const line = "Water. The walk can wait a minute.";
  log(next, line);
  return { life: next, notes: [line] };
}

export function eatNow(life: Life): StepResult {
  const next = cloneLife(life);
  if ((next.pantry ?? 0) > 0) next.pantry = (next.pantry ?? 0) - 1;
  else {
    const hit = Object.entries(next.cupboard ?? {}).find(([id, qty]) => qty > 0 && /rice|gari|beans|plantain|yam|kenkey|bread|cereal|banku/.test(id));
    if (!hit) return { life, notes: [], error: "Nothing to eat." };
    next.cupboard = { ...(next.cupboard ?? {}), [hit[0]]: hit[1] - 1 };
  }
  next.health = { ...(next.health ?? {}), warn: undefined };
  next.needs.hunger = Math.min(100, next.needs.hunger + 22);
  next.needs.energy = Math.min(100, next.needs.energy + 6);
  const line = "You eat. The weakness backs off.";
  log(next, line);
  return { life: next, notes: [line] };
}

export function callFriend(life: Life): StepResult {
  const kin = [...life.relations].sort((a, b) => b.score - a.score)[0];
  if (!kin || kin.score < 40) return { life, notes: [], error: "Nobody is close enough to turn the car around." };
  const timed = passTime(life, 25);
  const next = timed.life;
  next.health = { ...(next.health ?? {}), warn: undefined };
  next.needs.energy = Math.min(100, next.needs.energy + 8);
  next.needs.social = Math.min(100, next.needs.social + 6);
  const line = `${kin.name} comes for you.`;
  log(next, line);
  return { life: next, notes: [line] };
}

export function callRide(life: Life): StepResult {
  if (life.cash < 18) return { life, notes: [], error: "A taxi wants ₵18. The walk is still yours." };
  const next = cloneLife(life);
  next.cash -= 18;
  next.health = { ...(next.health ?? {}), warn: undefined };
  next.needs.energy = Math.min(100, next.needs.energy + 6);
  const line = "The taxi finishes the trip. ₵18.";
  log(next, line);
  return { life: next, notes: [line] };
}

export function keepWalking(life: Life): StepResult {
  if (!life.health?.warn) return { life, notes: [], error: "You are steady enough." };
  const next = cloneLife(life);
  next.health = { ...(next.health ?? {}), warn: "You feel weak. Sit down or eat something." };
  return { life: next, notes: ["You keep walking."] };
}

export function personDown(life: Life, spotId: string) {
  if (life.where !== spotId || life.health?.crisis) return null;
  const day = Math.floor(life.minutes / 1440);
  const key = `${spotId}:${day}`;
  let hash = 0;
  for (const char of key) hash = (hash * 33 + char.charCodeAt(0)) % 997;
  const rough = ROUGH.test(spotId);
  if (hash % (rough ? 6 : 19) !== 0) return null;
  if (life.stats?.downId === hash) return null;
  const names = ["Adwoa", "Uncle Yaw", "A young man", "An older woman", "Kwesi"];
  const reasons = ["has not eaten", "has been walking since morning", "is feverish", "has been drinking", "is out in the sun too long"];
  return { id: hash, name: names[hash % names.length], reason: reasons[hash % reasons.length] };
}

function markDown(life: Life, id: number) {
  life.stats = { ...(life.stats ?? {}), downId: id };
}

export function helpPerson(life: Life, spotId: string): StepResult {
  const person = personDown(life, spotId);
  if (!person) return { life, notes: [], error: "Nobody is down." };
  const timed = passTime(life, 20);
  const next = timed.life;
  markDown(next, person.id);
  next.needs.fun = Math.min(100, next.needs.fun + 6);
  const known = next.relations.find((item) => item.name === person.name);
  if (known) known.score = Math.min(100, known.score + 10);
  else next.relations.push({ name: person.name, score: 12 });
  const line = `You stay with ${person.name} until a car comes.`;
  log(next, line);
  return { life: next, notes: [line] };
}

export function callForPerson(life: Life, spotId: string): StepResult {
  const person = personDown(life, spotId);
  if (!person) return { life, notes: [], error: "Nobody is down." };
  const timed = passTime(life, 15);
  const next = timed.life;
  markDown(next, person.id);
  next.needs.social = Math.min(100, next.needs.social + 4);
  const line = `You call for help. ${person.name} is not left there.`;
  log(next, line);
  return { life: next, notes: [line] };
}

export function leavePerson(life: Life, spotId: string): StepResult {
  const person = personDown(life, spotId);
  if (!person) return { life, notes: [], error: "Nobody is down." };
  const next = cloneLife(life);
  markDown(next, person.id);
  next.needs.fun = Math.max(0, next.needs.fun - 8);
  const line = `You walk past ${person.name}. It stays with you.`;
  log(next, line);
  return { life: next, notes: [line] };
}

export function robPerson(life: Life, spotId: string): StepResult {
  const person = personDown(life, spotId);
  if (!person) return { life, notes: [], error: "Nobody is down." };
  if (life.docket) return { life, notes: [], error: "You are already in trouble with the law." };
  const next = cloneLife(life);
  markDown(next, person.id);
  const caught = Math.random() < 0.55;
  if (caught) {
    next.needs.fun = Math.max(0, next.needs.fun - 14);
    noteRep(next, -8, `People saw you over ${person.name}. The story will not stay kind.`);
    const line = `Someone shouts. You get nothing, and the story sticks.`;
    log(next, line);
    return { life: next, notes: [line] };
  }
  const take = 15 + Math.floor(Math.random() * 20);
  next.cash += take;
  next.needs.fun = Math.max(0, next.needs.fun - 10);
  noteRep(next, -6, `A bad story is moving about ${person.name}.`);
  const line = `${cedis(take)} from ${person.name}. It does not feel like a win.`;
  log(next, line);
  return { life: next, notes: [line] };
}
