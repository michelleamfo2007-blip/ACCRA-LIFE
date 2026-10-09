import { accraHour, cedis, cloneLife, hourOf, logLine, passTime, type Docket, type Life, type StepResult } from "@/lib/game/world";

/**
 * City crime is a roll against a security level, then a custody chain.
 * Targets are people and places in the city, plus the rival. It does not
 * take money from another player's wallet.
 */

export const SECURITY = [
  { level: 0, label: "No security", detail: "An easy target." },
  { level: 1, label: "Locks and a low wall", detail: "Easy, and the attempt still fails." },
  { level: 2, label: "Bars, lights, a medium wall", detail: "A guard can hear it." },
  { level: 3, label: "Electric fence, alarm, a gate", detail: "Hard. The alarm is the arrest." },
  { level: 4, label: "CCTV, a guard, a gatehouse", detail: "Very hard. They already have your face." },
  { level: 5, label: "Armed response, dogs, more guards", detail: "Near impossible alone." },
  { level: 6, label: "Estate security", detail: "The gate does not let this happen." },
] as const;

const HOME_COST = [0, 200, 800, 2500, 7000, 18000, 0];

export const APPROACHES = [
  { id: "night", label: "Break in at night", heat: 1, loot: 1, line: "Quiet, and the street is watching the dark." },
  { id: "street", label: "Rob on the street", heat: 1.25, loot: 0.7, line: "Fast. Bystanders are the risk." },
  { id: "pocket", label: "Pickpocket", heat: 0.55, loot: 0.22, line: "Small money. Easier to walk away." },
  { id: "carjack", label: "Carjack", heat: 1.7, loot: 1.5, line: "A car is loud. The city remembers." },
  { id: "armed", label: "Armed robbery", heat: 2.3, loot: 2, line: "The sentence is the long one." },
] as const;

export const MARKS = [
  { id: "pocket-market", kind: "person", label: "A trader at Makola", security: 0, wealth: 90, crime: 0.72, spot: "makola" },
  { id: "street-osu", kind: "person", label: "Someone on Oxford Street", security: 0, wealth: 140, crime: 0.5, spot: "mall" },
  { id: "car-mall", kind: "car", label: "A parked car at the mall", security: 1, wealth: 420, crime: 0.28, spot: "mall" },
  { id: "kiosk", kind: "business", label: "A locked kiosk", security: 1, wealth: 260, crime: 0.64, spot: "makola" },
  { id: "spintex-house", kind: "home", label: "A house in Spintex", security: 2, wealth: 700, crime: 0.35, spot: "mall" },
  { id: "east-house", kind: "home", label: "A house in East Legon", security: 4, wealth: 2800, crime: 0.16, spot: "trasacco-gate" },
  { id: "trasacco", kind: "home", label: "A Trasacco mansion", security: 6, wealth: 8000, crime: 0.05, spot: "trasacco-gate" },
  { id: "rival", kind: "person", label: "Kojo Mensah", security: 0, wealth: 0, crime: 0.4, spot: "" },
] as const;

export type ApproachId = (typeof APPROACHES)[number]["id"];

const DAY = 1440;

function clock(life: Life) {
  return life.minutes >= 1_000_000 ? accraHour() : hourOf(life.minutes);
}

function markOf(id: string) {
  return MARKS.find((item) => item.id === id) ?? null;
}

function approachOf(id: string) {
  return APPROACHES.find((item) => item.id === id) ?? null;
}

export function openCase(life: Life) {
  const docket = life.docket;
  if (!docket) return null;
  if (docket.status === "fine" && docket.fine <= 0) return null;
  return docket;
}

export function custodyBlock(life: Life, placeId?: string) {
  const docket = openCase(life);
  if (!docket) return null;
  if (docket.status === "held" || docket.status === "booked" || docket.status === "jail") {
    if (!placeId || placeId === life.where || placeId === "police") return null;
    return "You are in custody. The cell does not open from your side.";
  }
  if (docket.curfew && placeId && placeId !== "home") {
    const hour = clock(life);
    if (hour >= docket.curfew || hour < 5) return `Curfew is ${docket.curfew}:00. Go home.`;
  }
  return null;
}

function recordCount(life: Life) {
  return life.spine?.record.length ?? 0;
}

function stain(life: Life, line: string) {
  if (!life.spine) return;
  life.spine.record = [{ line, at: life.minutes }, ...life.spine.record].slice(0, 12);
  if (!life.spine.barred.includes("record")) life.spine.barred.push("record");
  life.spine.rep -= 6;
  life.spine.journal = [...life.spine.journal, { year: new Date().getFullYear(), line }].slice(-24);
}

function wealthOf(life: Life, id: string) {
  const mark = markOf(id);
  if (!mark) return 0;
  if (mark.id === "rival") return Math.min(800, Math.round((life.spine?.rival.cash ?? 400) * 0.12));
  return mark.wealth;
}

function securityOf(life: Life, id: string) {
  const mark = markOf(id);
  if (!mark) return 0;
  if (mark.id !== "rival") return mark.security;
  const rival = life.spine?.rival;
  if (rival?.house) return 4;
  if (rival?.car) return 2;
  return 1;
}

export function assess(life: Life, targetId: string, approachId: string) {
  const mark = markOf(targetId);
  const approach = approachOf(approachId);
  if (!mark || !approach) return null;
  const security = securityOf(life, targetId);
  const level = SECURITY[security] ?? SECURITY[0];
  const hour = clock(life);
  const night = hour >= 20 || hour < 5;
  const skill = life.skills.fitness + life.skills.hustle;
  return {
    mark,
    approach,
    security,
    level: level.label,
    detail: level.detail,
    hour,
    night,
    crime: mark.crime,
    wealth: wealthOf(life, targetId),
    skill,
    blocked: security > 0,
    line: security > 0 ? `${level.label}. An attempt here fails, and security holds you.` : night ? "The street is quiet enough to try." : "Daylight. More eyes.",
  };
}

function book(life: Life, patch: Partial<Docket> & Pick<Docket, "crime" | "approach" | "security" | "caughtBy" | "note">): Docket {
  return {
    status: "held",
    station: "Accra Central",
    bail: 0,
    bailable: true,
    lawyer: false,
    evidence: 40,
    until: life.minutes,
    fine: 0,
    serviceLeft: 0,
    skips: life.docket?.skips ?? 0,
    ...patch,
  };
}

function takeCash(life: Life, amount: number) {
  const due = Math.max(0, Math.round(amount));
  const paid = Math.min(life.cash, due);
  life.cash -= paid;
  return due - paid;
}

export function rob(life: Life, targetId: string, approachId: string): StepResult {
  const held = custodyBlock(life);
  if (held) return { life, notes: [], error: held };
  const card = assess(life, targetId, approachId);
  if (!card) return { life, notes: [], error: "That is not a target." };
  if (card.mark.id !== "rival" && life.where !== "police" && card.mark.spot && life.where !== card.mark.spot) {
    return { life, notes: [], error: `Get closer. This one is around ${card.mark.label}.` };
  }
  if (card.mark.id === "rival") {
    if (!life.spine) return { life, notes: [], error: "Meet Kojo from the Rival app before you look for him." };
    if (life.spine.rival.where !== life.where) return { life, notes: [], error: `${life.spine.rival.name} is not in this room.` };
  }
  const timed = passTime(cloneLife(life), 20).life;
  const repeat = (timed.docket?.suspended ? 1 : 0) + (timed.docket?.status === "probation" ? 1 : 0);
  const skill = Math.min(0.22, card.skill * 0.018);
  const dark = card.night && card.approach.id === "night" ? 0.1 : !card.night && card.approach.id === "street" ? -0.08 : 0;
  const chance = Math.max(0.08, Math.min(0.72, 0.4 + skill + dark - card.mark.crime * 0.15));
  const caught = card.blocked || Math.random() > chance / card.approach.heat;
  if (!caught) {
    const haul = Math.max(8, Math.round(card.wealth * card.approach.loot));
    timed.cash += haul;
    if (card.mark.id === "rival" && timed.spine) timed.spine.rival.cash = Math.max(0, timed.spine.rival.cash - haul);
    timed.stats = { ...(timed.stats ?? {}), heat: (timed.stats?.heat ?? 0) + 1 };
    stain(timed, `A ${card.approach.label.toLowerCase()} in the city. People are not sure it was you.`);
    let line = `You came away with ${cedis(haul)}. The street is already telling a version of it.`;
    if (!timed.docket && Math.random() < 0.4) {
      timed.docket = book(timed, {
        status: "bail",
        bail: 0,
        until: timed.minutes + DAY,
        hearingAt: timed.minutes + DAY,
        crime: card.mark.label,
        approach: card.approach.label,
        security: card.security,
        caughtBy: "a report",
        evidence: 55,
        note: "A report was filed. Your name is on the cause list. Appear, or the charge grows.",
      });
      line = `${line} A report was filed. The cause list has your name.`;
    }
    logLine(timed, line);
    if (repeat) {
      timed.docket = book(timed, {
        status: "jail",
        crime: card.mark.label,
        approach: card.approach.label,
        security: card.security,
        caughtBy: "police",
        note: "You were on a suspended sentence. This one sends you straight to the cells.",
        bailable: false,
        until: timed.minutes + 3 * DAY,
        evidence: 80,
      });
      timed.where = "police";
    }
    return { life: timed, notes: [line] };
  }
  const by = card.security >= 5 ? "security company" : card.security >= 1 ? "security" : card.approach.id === "pocket" ? "bystanders" : card.approach.id === "street" ? "the person" : "police";
  const response = card.security * 50;
  const damage = card.approach.id === "night" || card.approach.id === "armed" ? card.security * 40 : 0;
  const unpaid = takeCash(timed, response + damage);
  const armed = card.approach.id === "armed" || card.security >= 5;
  const prior = recordCount(timed);
  const bailable = !armed && card.security < 6 && prior < 3 && !timed.docket?.suspended;
  const bail = Math.round(180 + card.security * 160 + prior * 120 + (card.approach.id === "carjack" ? 200 : 0));
  timed.where = "police";
  timed.docket = book(timed, {
    status: card.security > 0 ? "held" : prior === 0 && card.approach.id === "pocket" ? "booked" : "booked",
    crime: card.mark.label,
    approach: card.approach.label,
    security: card.security,
    caughtBy: by,
    bail,
    bailable,
    evidence: Math.min(95, Math.round(35 + card.security * 10 + (armed ? 20 : 0) + prior * 8)),
    fine: unpaid,
    note:
      card.security > 0
        ? `${by} stopped it. Security does not let a robbery finish. You are held for the police.`
        : `${by} stopped it. You are at the station to be booked.`,
  });
  stain(timed, `Caught. ${card.mark.label}. ${card.approach.label}.`);
  const bits = [timed.docket.note];
  if (response + damage > 0) bits.push(`Response and damage: ${cedis(response + damage)}.`);
  logLine(timed, bits[0]);
  return { life: timed, notes: bits };
}

export function robPerson(life: Life, name: string): StepResult {
  const held = custodyBlock(life);
  if (held) return { life, notes: [], error: held };
  if (!name) return { life, notes: [], error: "There is nobody there to try." };
  const timed = passTime(cloneLife(life), 15).life;
  const skill = Math.min(0.2, (timed.skills.fitness + timed.skills.hustle) * 0.015);
  const caught = Math.random() > 0.46 + skill;
  if (!caught) {
    const haul = 20 + Math.round(Math.random() * 60);
    timed.cash += haul;
    timed.stats = { ...(timed.stats ?? {}), heat: (timed.stats?.heat ?? 0) + 1 };
    stain(timed, `A try on ${name}. People are not sure it was you.`);
    let line = `You came away with ${cedis(haul)}. ${name} has not got it back.`;
    if (!timed.docket && Math.random() < 0.45) {
      timed.docket = book(timed, {
        status: "bail",
        bail: 0,
        until: timed.minutes + DAY,
        hearingAt: timed.minutes + DAY,
        crime: name,
        approach: "Rob on the street",
        security: 0,
        caughtBy: name,
        evidence: 60,
        note: `${name} reported it. Your name is on the cause list.`,
      });
      line = `${line} They reported it. Court has the file.`;
    }
    logLine(timed, line);
    return { life: timed, notes: [line] };
  }
  timed.where = "police";
  timed.docket = book(timed, {
    status: "booked",
    crime: name,
    approach: "Rob on the street",
    security: 0,
    caughtBy: name,
    bail: 220,
    evidence: 70,
    note: `${name} held on and called it in. You are booked.`,
  });
  stain(timed, `Caught trying ${name}.`);
  logLine(timed, timed.docket.note);
  return { life: timed, notes: [timed.docket.note] };
}

export function offerCut(life: Life): StepResult {
  const docket = openCase(life);
  if (!docket || (docket.status !== "held" && docket.status !== "booked")) return { life, notes: [], error: "Nobody here is taking a conversation." };
  const price = Math.max(80, Math.round(docket.bail * 0.35));
  if (life.cash < price) return { life, notes: [], error: `They want ${cedis(price)} before they even listen.` };
  const timed = passTime(cloneLife(life), 15).life;
  timed.cash -= price;
  if (Math.random() < 0.42 && docket.security < 5) {
    timed.docket = null;
    timed.where = "home";
    const line = `The money changed hands. You are outside. It can still come back as a worse charge.`;
    logLine(timed, line);
    return { life: timed, notes: [line] };
  }
  timed.docket = { ...docket, status: "booked", bailable: false, evidence: Math.min(99, docket.evidence + 18), fine: docket.fine + price, note: "The offer was reported. Bail is off the table." };
  const line = "They wrote the offer down. The charge is heavier, and bail is gone.";
  logLine(timed, line);
  return { life: timed, notes: [line] };
}

export function callPolice(life: Life): StepResult {
  const docket = openCase(life);
  if (!docket || docket.status !== "held") return { life, notes: [], error: "You are not waiting on a security post." };
  const next = cloneLife(life);
  const warning = docket.approach === "Pickpocket" && docket.evidence < 45 && recordCount(next) <= 1 && docket.security === 0;
  if (warning) {
    next.docket = null;
    next.where = "home";
    const line = "The station took your name and let you go with a warning. The record is still there.";
    logLine(next, line);
    return { life: next, notes: [line] };
  }
  next.docket = { ...docket, status: "booked", note: docket.bailable ? `Booked at ${docket.station}. Bail is ${cedis(docket.bail)}, or you wait for court.` : "Booked. This one is not bailable. Court is next." };
  const line = next.docket.note;
  logLine(next, line);
  return { life: next, notes: [line] };
}

function friend(life: Life) {
  const close = [...life.relations].sort((a, b) => b.score - a.score)[0];
  if (close && close.score >= 45) return close;
  const kin = life.spine?.kin[0];
  if (kin) return { name: kin.name, score: 50 };
  return null;
}

export function postBail(life: Life, who: "self" | "family"): StepResult {
  const docket = openCase(life);
  if (!docket || docket.status !== "booked") return { life, notes: [], error: "Bail is not on the table yet." };
  if (!docket.bailable) return { life, notes: [], error: "The charge is not bailable. You wait for court." };
  const next = cloneLife(life);
  if (who === "family") {
    const person = friend(next);
    if (!person) return { life, notes: [], error: "Nobody close enough will stand at the counter for you." };
    const found = next.relations.find((item) => item.name === person.name);
    if (found) found.score = Math.max(0, found.score - 6);
    next.docket = { ...docket, status: "bail", until: next.minutes + 2 * DAY, help: person.name, note: `${person.name} posted ${cedis(docket.bail)}. Court is in two days. Miss it and the charge grows.` };
    const line = next.docket.note;
    logLine(next, line);
    return { life: next, notes: [line] };
  }
  if (next.cash < docket.bail) return { life, notes: [], error: `Bail is ${cedis(docket.bail)}. Cash or MoMo, same wallet.` };
  next.cash -= docket.bail;
  next.docket = { ...docket, status: "bail", until: next.minutes + 2 * DAY, note: `You paid ${cedis(docket.bail)} bail. Be in court in two days.` };
  next.where = "home";
  const line = next.docket.note;
  logLine(next, line);
  return { life: next, notes: [line] };
}

export function skipBail(life: Life): StepResult {
  const docket = openCase(life);
  if (!docket || docket.status !== "bail") return { life, notes: [], error: "You are not out on bail." };
  const next = cloneLife(life);
  next.where = "police";
  next.docket = { ...docket, status: "jail", skips: docket.skips + 1, bailable: false, until: next.minutes + (5 + docket.skips) * DAY, note: "You missed bail. The next charge is the bigger one, and the cell is locked." };
  stain(next, "Skipped bail.");
  const line = next.docket.note;
  logLine(next, line);
  return { life: next, notes: [line] };
}

export function toCourt(life: Life): StepResult {
  const docket = openCase(life);
  if (!docket || (docket.status !== "booked" && docket.status !== "bail")) return { life, notes: [], error: "Court is not sitting for you yet." };
  const next = cloneLife(life);
  next.where = "court";
  next.docket = { ...docket, status: "court", hearingAt: next.minutes, note: "You are in the dock. Guilty is faster. A trial can free you, or add years to the story." };
  return { life: next, notes: [next.docket.note] };
}

export function hireLawyer(life: Life): StepResult {
  const docket = openCase(life);
  if (!docket || docket.status !== "court") return { life, notes: [], error: "Hire a lawyer when you are actually in court." };
  const person = friend(life);
  const cost = person && person.score >= 60 ? 180 : 320;
  if (life.cash < cost) return { life, notes: [], error: `A lawyer wants ${cedis(cost)}.` };
  const next = cloneLife(life);
  next.cash -= cost;
  next.docket = { ...docket, lawyer: true, evidence: Math.max(10, docket.evidence - (person && person.score >= 70 ? 22 : 12)), help: person && person.score >= 70 ? person.name : docket.help, note: person && person.score >= 70 ? `${person.name} spoke, and the lawyer cut the story down.` : `Lawyer retained for ${cedis(cost)}.` };
  return { life: next, notes: [next.docket.note] };
}

function sentence(life: Life, docket: Docket, kind: "fine" | "service" | "probation" | "jail" | "free", days: number, fine: number) {
  if (kind === "free") {
    life.docket = null;
    life.where = "home";
    return "The court let you go. The record of the arrest stays.";
  }
  if (kind === "fine") {
    life.docket = { ...docket, status: "fine", fine: fine + docket.fine, note: `Fined ${cedis(fine + docket.fine)}. Pay it and you walk. The record stays.` };
    return life.docket.note;
  }
  if (kind === "service") {
    life.docket = { ...docket, status: "service", serviceLeft: Math.max(4, days * 3), curfew: 21, note: "Community service. Streets, then the clinic yard. Report until the hours are done." };
    life.where = "home";
    return life.docket.note;
  }
  if (kind === "probation") {
    life.docket = { ...docket, status: "probation", until: life.minutes + days * DAY, curfew: 22, suspended: true, note: `Probation for ${days} days. Home by 22:00. A new case sends you to the cells.` };
    life.where = "home";
    return life.docket.note;
  }
  life.where = "police";
  life.docket = { ...docket, status: "jail", until: life.minutes + days * DAY, bailable: false, note: `${days} days in the cells. A long sentence is the road to Nsawam. Work, appeal, or wait it out.` };
  return life.docket.note;
}

export function plead(life: Life, plea: "guilty" | "trial" | "self" | "bribe"): StepResult {
  const docket = openCase(life);
  if (!docket || docket.status !== "court") return { life, notes: [], error: "You are not in front of the court." };
  const next = cloneLife(life);
  const prior = recordCount(next) + docket.skips;
  if (plea === "bribe") {
    const cost = 400 + docket.security * 80;
    if (next.cash < cost) return { life, notes: [], error: `That conversation starts at ${cedis(cost)}.` };
    next.cash -= cost;
    if (Math.random() < 0.28 && docket.security < 4) {
      const line = sentence(next, docket, "free", 0, 0);
      logLine(next, line);
      return { life: next, notes: ["The case stalled. You are out. Do not tell it twice."] };
    }
    const line = sentence(next, { ...docket, evidence: 90 }, "jail", 4 + prior, cost);
    stain(next, "Tried to buy a verdict.");
    logLine(next, line);
    return { life: next, notes: [line] };
  }
  if (plea === "guilty") {
    const light = docket.evidence < 50 && prior < 2;
    const line = light ? sentence(next, docket, prior ? "service" : "fine", 2, 150 + docket.security * 40) : sentence(next, docket, "jail", 2 + prior, 0);
    logLine(next, line);
    return { life: next, notes: [line] };
  }
  const lawyer = plea === "trial" && docket.lawyer;
  const odds = lawyer ? 0.62 : plea === "self" ? 0.28 : 0.4;
  const won = Math.random() < odds - docket.evidence / 400;
  const line = won ? sentence(next, docket, "free", 0, 0) : sentence(next, docket, prior > 1 ? "jail" : "probation", 3 + prior, 200);
  logLine(next, line);
  return { life: next, notes: [won ? "Acquitted. The arrest is still a story people know." : line] };
}

export function payFine(life: Life): StepResult {
  const docket = openCase(life);
  if (!docket || docket.status !== "fine") return { life, notes: [], error: "No fine on the file." };
  if (life.cash < docket.fine) return { life, notes: [], error: `The fine is ${cedis(docket.fine)}.` };
  const next = cloneLife(life);
  next.cash -= docket.fine;
  next.docket = null;
  next.where = next.where === "police" || next.where === "court" ? "home" : next.where;
  const line = `Fine paid, ${cedis(docket.fine)}. The record does not leave with the receipt.`;
  logLine(next, line);
  return { life: next, notes: [line] };
}

export function doService(life: Life): StepResult {
  const docket = openCase(life);
  if (!docket || docket.status !== "service") return { life, notes: [], error: "You are not on community service." };
  const timed = passTime(cloneLife(life), 120).life;
  const left = Math.max(0, docket.serviceLeft - 2);
  timed.needs.energy = Math.max(0, timed.needs.energy - 8);
  if (left <= 0) {
    timed.docket = null;
    const line = "The hours are done. The officer signed you off. The record stays.";
    logLine(timed, line);
    return { life: timed, notes: [line] };
  }
  timed.docket = { ...docket, serviceLeft: left, note: `${left} hours of service left.` };
  return { life: timed, notes: [`You worked a shift on the street. ${left} hours left.`] };
}

export function checkProbation(life: Life): StepResult {
  const docket = openCase(life);
  if (!docket || docket.status !== "probation") return { life, notes: [], error: "You are not on probation." };
  const timed = passTime(cloneLife(life), 30).life;
  if (!timed.docket || timed.docket.status !== "probation") return { life: timed, notes: ["Probation ended while you were reporting."] };
  return { life: timed, notes: ["You reported in. Keep the curfew and stay out of a new case."] };
}

export function jailWork(life: Life): StepResult {
  const docket = openCase(life);
  if (!docket || docket.status !== "jail") return { life, notes: [], error: "You are not in the cells." };
  const timed = passTime(cloneLife(life), 180).life;
  timed.cash += 12;
  timed.needs.energy = Math.max(0, timed.needs.energy - 10);
  const line = "A shift inside. ₵12, and the day still counts.";
  logLine(timed, line);
  return { life: timed, notes: [line] };
}

export function appealCase(life: Life): StepResult {
  const docket = openCase(life);
  if (!docket || docket.status !== "jail") return { life, notes: [], error: "Appeal from the cells, not the street." };
  if (docket.appealed) return { life, notes: [], error: "You already appealed this sentence." };
  if (life.cash < 150) return { life, notes: [], error: "The filing fee is ₵150." };
  const next = cloneLife(life);
  next.cash -= 150;
  if (Math.random() < 0.4) {
    const cut = Math.max(next.minutes + 12 * 60, Math.round((docket.until + next.minutes) / 2));
    next.docket = { ...docket, appealed: true, until: cut, note: "The appeal shortened the sentence." };
  } else {
    next.docket = { ...docket, appealed: true, note: "The appeal was refused. The days stay." };
  }
  logLine(next, next.docket!.note);
  return { life: next, notes: [next.docket!.note] };
}

export function visitCell(life: Life): StepResult {
  const docket = openCase(life);
  if (!docket || docket.status !== "jail") return { life, notes: [], error: "Visiting hour is for people in the cells." };
  const person = friend(life);
  if (!person || person.score < 40) return { life, notes: [], error: "The people who would visit are not speaking to you." };
  const timed = passTime(cloneLife(life), 40).life;
  timed.needs.fun = Math.min(100, timed.needs.fun + 8);
  timed.needs.hunger = Math.min(100, timed.needs.hunger + 6);
  const line = `${person.name} came with food. They cannot take the days away.`;
  logLine(timed, line);
  return { life: timed, notes: [line] };
}

export function buySecurity(life: Life, level: number): StepResult {
  if (level < 1 || level > 5) return { life, notes: [], error: "Pick a security level." };
  const have = life.security ?? 0;
  if (level <= have) return { life, notes: [], error: "The house already has that, or better." };
  const cost = HOME_COST[level] - HOME_COST[have];
  if (life.cash < cost) return { life, notes: [], error: `${SECURITY[level].label} costs ${cedis(cost)}.` };
  const next = cloneLife(life);
  next.cash -= cost;
  next.security = level;
  const line = `${SECURITY[level].label} is on the house. ${cedis(cost)}. A try on this place fails.`;
  logLine(next, line);
  return { life: next, notes: [line] };
}

export function secureShop(life: Life, shopId: string, level: number): StepResult {
  const shop = life.businesses?.find((item) => item.id === shopId);
  if (!shop) return { life, notes: [], error: "That shop is not yours." };
  if (level < 1 || level > 5) return { life, notes: [], error: "Pick a level." };
  const have = shop.security ?? 0;
  if (level <= have) return { life, notes: [], error: "The shop is already covered." };
  const cost = Math.round((HOME_COST[level] - HOME_COST[have]) * 0.7);
  if (life.cash < cost) return { life, notes: [], error: `Shop security costs ${cedis(cost)}.` };
  const next = cloneLife(life);
  next.cash -= cost;
  next.businesses = (next.businesses ?? []).map((item) => (item.id === shopId ? { ...item, security: level } : item));
  return { life: next, notes: [`${shop.name ?? "The shop"} is at ${SECURITY[level].label.toLowerCase()}. ${cedis(cost)}.`] };
}

export function pulseJustice(life: Life, notes: string[]) {
  const docket = life.docket;
  if (!docket) {
    const day = Math.floor(life.minutes / DAY);
    if ((life.security ?? 0) > 0) return;
    if (life.cash < 200) return;
    if (day % 17 !== 3) return;
    const loss = Math.min(40, Math.round(life.cash * 0.04));
    life.cash -= loss;
    notes.push(`Someone tried the door. No security. ${cedis(loss)} is gone from the house.`);
    return;
  }
  if (docket.status === "bail" && life.minutes >= docket.until) {
    life.where = "police";
    life.docket = { ...docket, status: "jail", skips: docket.skips + 1, bailable: false, until: life.minutes + (4 + docket.skips) * DAY, note: "You missed court. Bail is revoked." };
    notes.push(life.docket.note);
    return;
  }
  if (docket.status === "probation" && life.minutes >= docket.until) {
    life.docket = null;
    notes.push("Probation is over. The record is still on file.");
    return;
  }
  if (docket.status === "jail" && life.minutes >= docket.until) {
    life.docket = null;
    life.where = "home";
    notes.push("The sentence is done. You are out. Jobs, travel, and some doors will still see the record.");
  }
}
