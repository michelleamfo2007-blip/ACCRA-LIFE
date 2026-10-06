import { SICK_LABEL, cedis, cloneLife, passTime, type Life, type StepResult } from "@/lib/game/world";

export const CLINIC_FEE = 180;
export const CLINIC_NHIS = 20;
export const NHIS_FEE = 60;
export const MEDS_FEE = 45;
const NHIS_DAYS = 30;

export function hasNhis(life: Life) {
  return (life.health?.nhisUntil ?? 0) > life.minutes;
}

export function sickness(life: Life) {
  const sick = life.health?.sick;
  if (!sick) return null;
  const hoursLeft = Math.max(0, Math.ceil((sick.since + 4320 - life.minutes) / 60));
  return { ...sick, label: SICK_LABEL[sick.kind], hoursLeft };
}

export function seeClinic(life: Life): StepResult {
  const fee = hasNhis(life) ? CLINIC_NHIS : CLINIC_FEE;
  if (life.cash < fee) return { life, notes: [], error: `The clinic charges ${cedis(fee)}${hasNhis(life) ? " with NHIS" : ". NHIS brings it down"}.` };
  const sick = life.health?.sick;
  const timed = passTime(cloneLife(life), 90).life;
  timed.cash -= fee;
  timed.health = { ...timed.health, sick: null };
  timed.needs.energy = Math.min(100, timed.needs.energy + 10);
  return { life: timed, notes: [sick ? `The doctor treated your ${SICK_LABEL[sick.kind].toLowerCase()}. ${cedis(fee)}.` : `Check-up done. Clean bill of health. ${cedis(fee)}.`] };
}

export function selfMedicate(life: Life): StepResult {
  const sick = life.health?.sick;
  if (!sick) return { life, notes: [], error: "You are not sick." };
  if (life.cash < MEDS_FEE) return { life, notes: [], error: `The chemist wants ${cedis(MEDS_FEE)}.` };
  const timed = passTime(cloneLife(life), 20).life;
  timed.cash -= MEDS_FEE;
  if (sick.kind === "malaria") return { life: timed, notes: ["Painkillers took the edge off. Malaria needs the clinic."] };
  if (Math.random() < 0.6) {
    timed.health = { ...timed.health, sick: null };
    return { life: timed, notes: ["The chemist's mix worked. You feel better."] };
  }
  return { life: timed, notes: ["Not yet. Rest, or see the clinic."] };
}

export function buyNhis(life: Life): StepResult {
  if (life.cash < NHIS_FEE) return { life, notes: [], error: `NHIS costs ${cedis(NHIS_FEE)}.` };
  const next = cloneLife(life);
  next.cash -= NHIS_FEE;
  next.health = { ...next.health, nhisUntil: Math.max(next.health?.nhisUntil ?? 0, next.minutes) + NHIS_DAYS * 1440 };
  return { life: next, notes: [`NHIS card renewed for ${NHIS_DAYS} days. Clinic visits are ${cedis(CLINIC_NHIS)} now.`] };
}

export function restSick(life: Life): StepResult {
  if (!life.health?.sick) return { life, notes: [], error: "You are not sick." };
  const timed = passTime(cloneLife(life), 240, "sleep").life;
  timed.needs.energy = Math.min(100, timed.needs.energy + 24);
  const sick = timed.health?.sick;
  if (sick) timed.health = { ...timed.health, sick: { ...sick, since: sick.since - 600 } };
  return { life: timed, notes: ["You slept it off for a few hours. Recovery is faster."] };
}
