import { phoneOf, spendAirtime } from "@/lib/game/phone-shell";
import { seasonOf, type Weather } from "@/lib/game/sky";
import { trafficFactor } from "@/lib/game/roads";
import { askOver, type InvitePurpose } from "@/lib/game/home-life";
import { cloneLife, moodOf, type Life, type StepResult } from "@/lib/game/world";

/** Soft Accra clout — one number for the phone home screen. */
export function cloutOf(life: Life) {
  const friends = life.relations.filter((person) => person.score >= 25).length;
  const close = life.relations.filter((person) => person.score >= 50).length;
  const fans = life.music?.fans ?? 0;
  const standing = life.community?.standing ?? 0;
  const credit = life.bank?.score ?? 50;
  const badges = life.badges?.length ?? 0;
  const cash = Math.min(40, Math.floor(life.cash / 500));
  const houses = (life.plots ?? []).filter((plot) => plot.stage >= 5).length;
  const cars = life.car ? 6 : 0;
  return Math.min(
    99,
    Math.round(friends * 2 + close * 4 + Math.min(25, fans / 40) + standing / 4 + credit / 5 + badges * 3 + cash + houses * 8 + cars + (life.stats?.cooked ?? 0) / 5 + (life.stats?.sleepovers ?? 0) * 2),
  );
}

export function cloutLabel(score: number) {
  if (score >= 80) return "City known";
  if (score >= 55) return "Respected";
  if (score >= 30) return "Getting known";
  if (score >= 12) return "Around town";
  return "Unknown";
}

export function weatherBrief(sky: Weather, hour: number) {
  const season = seasonOf();
  const rush = trafficFactor(hour) > 1.4;
  const bits = [sky.label];
  if (rush) bits.push("Rush hour — roads are thick");
  if (sky.flood) bits.push("Circle is flooding. Okada parked.");
  else if (sky.rain) bits.push("Carry an umbrella. Fares go up.");
  if (sky.harmattan) bits.push("Harmattan — dust and dry lips");
  bits.push(`${season.emoji} ${season.label}`);
  return bits.join(" · ");
}

export type CallKind = "gist" | "plan" | "come-home" | "check" | "work";

export function callPerson(life: Life, name: string, kind: CallKind = "gist", purpose: InvitePurpose = "gist"): StepResult {
  const blocked = spendAirtime(life, 1);
  if (blocked) return { life, notes: [], error: blocked };
  if (kind === "come-home") {
    const asked = askOver(life, name, purpose);
    if (asked.error) return asked;
    const linePhone = phoneOf(life);
    asked.life.phone = { ...linePhone, airtime: Math.max(0, linePhone.airtime - 1), battery: Math.max(0, linePhone.battery - 1) };
    return asked;
  }
  const next = cloneLife(life);
  const linePhone = phoneOf(life);
  next.phone = { ...linePhone, airtime: Math.max(0, linePhone.airtime - 1), battery: Math.max(0, linePhone.battery - 1) };
  const known = next.relations.find((person) => person.name === name);
  const score = known?.score ?? 0;
  if (score < 5 && kind !== "check") {
    return { life, notes: [], error: `${name} no pick. Call again when you know them better.` };
  }
  next.minutes += kind === "gist" ? 12 : kind === "plan" ? 8 : 6;
  next.needs.social = Math.min(100, next.needs.social + (kind === "gist" ? 10 : 6));
  next.needs.energy = Math.max(0, next.needs.energy - 2);
  if (known) known.score = Math.min(100, known.score + (kind === "gist" ? 5 : 3));
  else next.relations.push({ name, score: 8 });

  let line = `You called ${name}.`;
  if (kind === "gist") line = `Phone gist with ${name}. Story long.`;
  if (kind === "plan") line = `You and ${name} made a plan. See them outside.`;
  if (kind === "check") line = `You checked on ${name}. They are fine.`;
  if (kind === "work") {
    next.needs.fun = Math.min(100, next.needs.fun + 2);
    line = `Work call with ${name}. Something might come.`;
  }

  next.log = [line, ...next.log].slice(0, 14);
  next.inbox = [line, ...next.inbox].slice(0, 20);
  next.stats = { ...(next.stats ?? {}), calls: ((next.stats ?? {}).calls ?? 0) + 1 };
  if (moodOf(next.needs).label === "Drained" || moodOf(next.needs).label === "Stressed") {
    next.needs.fun = Math.min(100, next.needs.fun + 4);
  }
  return { life: next, notes: [line] };
}

export function textPerson(life: Life, name: string, kind: "hi" | "plan" | "come" | "thanks" = "hi"): StepResult {
  const blocked = spendAirtime(life, 1);
  if (blocked) return { life, notes: [], error: blocked };
  if (kind === "come") return askOver(life, name, "pass");
  const next = cloneLife(life);
  const linePhone = phoneOf(life);
  next.phone = { ...linePhone, airtime: Math.max(0, linePhone.airtime - 1), battery: Math.max(0, linePhone.battery - 1) };
  next.minutes += 2;
  next.needs.social = Math.min(100, next.needs.social + 4);
  const known = next.relations.find((person) => person.name === name);
  if (known) known.score = Math.min(100, known.score + 2);
  else next.relations.push({ name, score: 6 });

  const line =
    kind === "plan"
      ? `You texted ${name} a plan.`
      : kind === "thanks"
        ? `You texted ${name} thanks.`
        : `You texted ${name}: "Chale, how far?"`;
  next.log = [line, ...next.log].slice(0, 14);
  next.stats = { ...(next.stats ?? {}), texts: ((next.stats ?? {}).texts ?? 0) + 1 };
  return { life: next, notes: [line] };
}

export function postClout(life: Life, place: string): StepResult {
  const blocked = spendAirtime(life, 1);
  if (blocked) return { life, notes: [], error: blocked };
  const next = cloneLife(life);
  const phone = phoneOf(life);
  next.phone = { ...phone, airtime: Math.max(0, phone.airtime - 1), battery: Math.max(0, phone.battery - 2) };
  next.minutes += 5;
  next.needs.fun = Math.min(100, next.needs.fun + 6);
  next.needs.social = Math.min(100, next.needs.social + 4);
  if (!next.community) next.community = { standing: 8, projects: [] };
  next.community.standing = Math.min(100, (next.community.standing ?? 0) + 2);
  const likes = 8 + Math.floor(Math.random() * 40) + Math.floor(cloutOf(life) / 3);
  const line = `Posted from ${place}. ${likes} likes. Accra dey notice.`;
  next.log = [line, ...next.log].slice(0, 14);
  next.stats = { ...(next.stats ?? {}), posts: ((next.stats ?? {}).posts ?? 0) + 1 };
  return { life: next, notes: [line] };
}
