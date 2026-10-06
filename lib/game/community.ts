import { bump, cedis, cloneLife, logLine, type Community, type Life, type StepResult } from "@/lib/game/world";

export const PROJECTS = [
  { id: "books", label: "Books for the basic school", emoji: "📚", cost: 1500, standing: 30 },
  { id: "borehole", label: "Borehole for the neighbourhood", emoji: "🚰", cost: 2000, standing: 40 },
  { id: "streetlights", label: "Solar streetlights", emoji: "💡", cost: 3500, standing: 60 },
  { id: "pitch", label: "Community pitch", emoji: "⚽", cost: 4000, standing: 70 },
  { id: "clinic", label: "Beds for the polyclinic", emoji: "🏥", cost: 5000, standing: 90 },
] as const;

export const CHIEF_STANDING = 250;
export const DURBAR = 15000;
export const SERVICE_GAP = 720;
export const GIVE_CAP = 500;
export const COURT_GAP = 1440;

export const STOOLS = ["Nkosuohene of Osu", "Nkosuohene of La", "Nkosuohene of Teshie", "Nkosuohene of Jamestown", "Nkosuohene of Nungua"];

export const PLACE_OF = { church: "church", mosque: "mosque" } as const;

export function communityOf(life: Life): Community {
  return life.community ?? { standing: 0, projects: [] };
}

export function rankOf(standing: number) {
  if (standing >= CHIEF_STANDING) return "Elder of the community";
  if (standing >= 150) return "Respected voice";
  if (standing >= 60) return "Known in the area";
  if (standing >= 20) return "Familiar face";
  return "New in the area";
}

function grow(life: Life, change: (community: Community) => Community) {
  const next = cloneLife(life);
  next.community = change(communityOf(life));
  return next;
}

export function chooseFaith(life: Life, faith: "church" | "mosque" | null): StepResult {
  const current = communityOf(life);
  if (current.faith === faith) return { life, notes: [], error: "You are already there." };
  const next = grow(life, (community) => ({ ...community, faith, standing: current.faith ? Math.max(0, community.standing - 10) : community.standing }));
  return { life: next, notes: [faith === "church" ? "You joined the fellowship at Ridge Church." : faith === "mosque" ? "You joined the jama'a at the Central Mosque." : "You stepped back from your congregation."] };
}

export function attendService(life: Life): StepResult {
  const current = communityOf(life);
  if (!current.faith) return { life, notes: [], error: "Pick a church or mosque first." };
  if (life.where !== PLACE_OF[current.faith]) return { life, notes: [], error: current.faith === "church" ? "Go to Ridge Church first." : "Go to the Central Mosque first." };
  const wait = (current.lastService ?? -Infinity) + SERVICE_GAP - life.minutes;
  if (wait > 0) return { life, notes: [], error: `Next service in ${Math.ceil(wait / 60)}h.` };
  const next = grow(life, (community) => ({ ...community, standing: community.standing + 5, lastService: life.minutes }));
  next.needs.social = Math.min(100, next.needs.social + 15);
  next.needs.fun = Math.min(100, next.needs.fun + 6);
  bump(next, "services");
  return { life: next, notes: [current.faith === "church" ? "Sang in the choir and greeted the elders after service." : "Prayed with the jama'a and shared tea after."] };
}

export function giveOffering(life: Life, amount: number): StepResult {
  const current = communityOf(life);
  if (!current.faith) return { life, notes: [], error: "Pick a church or mosque first." };
  const value = Math.floor(amount);
  const day = Math.floor(life.minutes / 1440);
  const given = current.givenDay?.day === day ? current.givenDay.amount : 0;
  if (!Number.isFinite(value) || value < 5) return { life, notes: [], error: "Give at least ₵5." };
  if (given + value > GIVE_CAP) return { life, notes: [], error: `You have given ${cedis(given)} today. The daily limit is ${cedis(GIVE_CAP)}.` };
  if (life.cash < value) return { life, notes: [], error: "Not enough cash." };
  const next = grow(life, (community) => ({ ...community, standing: community.standing + Math.floor(value / 50), givenDay: { day, amount: given + value } }));
  next.cash -= value;
  return { life: next, notes: [`Gave ${cedis(value)}. ${current.faith === "church" ? "The pastor mentioned you by name." : "The imam offered a prayer for you."}`] };
}

export function fundProject(life: Life, projectId: string): StepResult {
  const project = PROJECTS.find((item) => item.id === projectId);
  const current = communityOf(life);
  if (!project) return { life, notes: [], error: "Pick a project." };
  if (current.projects.includes(project.id)) return { life, notes: [], error: "You already funded that one." };
  if (life.cash < project.cost) return { life, notes: [], error: `${project.label} needs ${cedis(project.cost)}.` };
  const next = grow(life, (community) => ({ ...community, standing: community.standing + project.standing, projects: [...community.projects, project.id] }));
  next.cash -= project.cost;
  logLine(next, `Funded ${project.label.toLowerCase()}. Your name is on the plaque.`);
  return { life: next, notes: [`${project.label}: funded. The whole area is talking about it.`] };
}

export function holdDurbar(life: Life): StepResult {
  const current = communityOf(life);
  if (current.chief) return { life, notes: [], error: `You are already ${current.chief.stool}.` };
  if (current.standing < CHIEF_STANDING) return { life, notes: [], error: `The elders want ${CHIEF_STANDING} standing. You have ${current.standing}.` };
  if (life.cash < DURBAR) return { life, notes: [], error: `Drummers, schnapps, cloth and food for the durbar cost ${cedis(DURBAR)}.` };
  const stool = STOOLS[Math.abs(life.birthId.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)) % STOOLS.length];
  const next = grow(life, (community) => ({ ...community, chief: { stool, since: life.minutes } }));
  next.cash -= DURBAR;
  logLine(next, `Enstooled as ${stool}. Fontomfrom drums, kente and the whole area out in white.`);
  return { life: next, notes: [`The durbar was massive. You are now ${stool}.`] };
}

export function settleDispute(life: Life): StepResult {
  const current = communityOf(life);
  if (!current.chief) return { life, notes: [], error: "Only a chief sits in judgement." };
  const wait = (current.lastCourt ?? -Infinity) + COURT_GAP - life.minutes;
  if (wait > 0) return { life, notes: [], error: `The palace is quiet. Next sitting in ${Math.ceil(wait / 60)}h.` };
  const cases = ["two families arguing over a plot boundary", "a landlord and a tenant over six months' rent", "a bride price that was never finished", "goats eating a neighbour's garden"];
  const pick = cases[Math.floor(Math.random() * cases.length)];
  const fee = 150;
  const next = grow(life, (community) => ({ ...community, standing: community.standing + 3, lastCourt: life.minutes }));
  next.cash += fee;
  return { life: next, notes: [`You settled ${pick}. Both sides brought schnapps and ${cedis(fee)}.`] };
}
