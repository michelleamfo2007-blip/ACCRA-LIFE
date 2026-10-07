import { BAG_LIMIT, GOODS, bagCount } from "@/lib/game/trade";
import { cedis, cloneLife, logLine, passTime, seasonFlags, type FarmBed, type Life, type Plot, type StepResult } from "@/lib/game/world";

export const LAND = [
  { id: "kasoa", label: "Kasoa", price: 8000, rooms: 4, rent: 40, blurb: "Far, dusty, and growing fast." },
  { id: "ashaiman", label: "Ashaiman", price: 12000, rooms: 4, rent: 55, blurb: "Close to Tema. Workers need rooms." },
  { id: "madina", label: "Madina", price: 20000, rooms: 5, rent: 80, blurb: "Market town energy. Students and traders." },
  { id: "spintex", label: "Spintex", price: 35000, rooms: 6, rent: 130, blurb: "Gated estates and young families." },
  { id: "east-legon", label: "East Legon", price: 90000, rooms: 6, rent: 300, blurb: "Embassy row. Rent paid in advance." },
] as const;

export const STAGES = ["Bare plot", "Foundation", "Blocks and walls", "Roofing", "Plaster and paint", "Finished house"];
const STAGE_COST = [0.3, 0.45, 0.3, 0.25, 0.2];
export const STAGE_SECONDS = 8;
export const MAX_PLOTS = 3;
const RENT_DAYS_CAP = 14;

const id = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function landOf(area: string) {
  return LAND.find((item) => item.id === area) ?? LAND[0];
}

export function stageCost(plot: Plot) {
  if (plot.stage >= STAGES.length - 1) return 0;
  return Math.round(landOf(plot.area).price * STAGE_COST[plot.stage]);
}

/** Seconds left before the next stage can start. Wall clock, so a stage is a few seconds. */
export function buildWait(plot: Plot, now = Date.now()) {
  if (plot.stage <= 0 || plot.stage >= STAGES.length - 1) return 0;
  if (!plot.readyAt) return 0;
  return Math.max(0, Math.ceil((plot.readyAt - now) / 1000));
}

function settleGuard(life: Life, plot: Plot): Plot {
  if (plot.guard === "court" && (plot.guardUntil ?? 0) <= life.minutes) return { ...plot, guard: null, guardUntil: undefined };
  return plot;
}

export function plotsOf(life: Life) {
  return (life.plots ?? []).map((plot) => settleGuard(life, plot));
}

export function rentDue(life: Life, plot: Plot) {
  if (plot.stage < STAGES.length - 1 || plot.tenants < 1) return 0;
  const days = Math.min(RENT_DAYS_CAP, (life.minutes - plot.lastRent) / 1440);
  const returnees = seasonFlags(life.minutes).detty ? 1.5 : 1;
  return Math.max(0, Math.floor(days * plot.tenants * landOf(plot.area).rent * returnees));
}

function withPlot(life: Life, plotId: string, change: (plot: Plot) => Plot) {
  const next = cloneLife(life);
  next.plots = plotsOf(next).map((plot) => (plot.id === plotId ? change(plot) : plot));
  return next;
}

export function buyLand(life: Life, area: string): StepResult {
  const land = LAND.find((item) => item.id === area);
  if (!land) return { life, notes: [], error: "That land is not for sale." };
  if ((life.plots ?? []).length >= MAX_PLOTS) return { life, notes: [], error: `You can hold ${MAX_PLOTS} plots at a time.` };
  if (life.cash < land.price) return { life, notes: [], error: `The plot costs ${cedis(land.price)}.` };
  const next = cloneLife(life);
  const plotId = id();
  const guarded = Math.random() < 0.35;
  next.cash -= land.price;
  next.plots = [...plotsOf(next), { id: plotId, area: land.id, stage: 0, stageAt: next.minutes, spent: land.price, guard: guarded ? "waiting" : null, tenants: 0, lastRent: next.minutes }];
  const line = guarded ? `You bought a plot in ${land.label}. Land guards are standing on it, asking for "drink money".` : `You bought a plot in ${land.label}. The indenture is in your name.`;
  logLine(next, line);
  return { life: next, notes: [line] };
}

export function payGuards(life: Life, plotId: string): StepResult {
  const plot = plotsOf(life).find((item) => item.id === plotId);
  if (!plot || plot.guard !== "waiting") return { life, notes: [], error: "Nobody is guarding that plot." };
  const fee = Math.round(landOf(plot.area).price * 0.1);
  if (life.cash < fee) return { life, notes: [], error: `They want ${cedis(fee)}.` };
  const next = withPlot(life, plotId, (item) => ({ ...item, guard: null, spent: item.spent + fee }));
  next.cash -= fee;
  return { life: next, notes: [`You paid the land guards ${cedis(fee)}. They wished you well and left.`] };
}

export function goToCourt(life: Life, plotId: string): StepResult {
  const plot = plotsOf(life).find((item) => item.id === plotId);
  if (!plot || plot.guard !== "waiting") return { life, notes: [], error: "Nobody is guarding that plot." };
  const next = withPlot(life, plotId, (item) => ({ ...item, guard: "court", guardUntil: life.minutes + 1440 }));
  return { life: next, notes: ["You filed at the Lands Commission. The police will clear the plot within a day."] };
}

export function buildNext(life: Life, plotId: string): StepResult {
  const plot = plotsOf(life).find((item) => item.id === plotId);
  if (!plot) return { life, notes: [], error: "That plot is gone." };
  if (plot.guard) return { life, notes: [], error: plot.guard === "court" ? "Wait for the court to clear the land guards." : "Deal with the land guards first." };
  if (plot.stage >= STAGES.length - 1) return { life, notes: [], error: "The house is finished." };
  const wait = buildWait(plot);
  if (wait > 0) return { life, notes: [], error: `The builders are still on ${STAGES[plot.stage].toLowerCase()}. ${wait}s left.` };
  const cost = stageCost(plot);
  if (life.cash < cost) return { life, notes: [], error: `${STAGES[plot.stage + 1]} costs ${cedis(cost)}.` };
  const done = plot.stage + 1 === STAGES.length - 1;
  const next = withPlot(life, plotId, (item) => ({
    ...item,
    stage: item.stage + 1,
    stageAt: life.minutes,
    readyAt: done ? undefined : Date.now() + STAGE_SECONDS * 1000,
    spent: item.spent + cost,
    lastRent: life.minutes,
  }));
  next.cash -= cost;
  const line = done ? `Your house in ${landOf(plot.area).label} is finished. Find tenants.` : `Builders started ${STAGES[plot.stage + 1].toLowerCase()} in ${landOf(plot.area).label}.`;
  logLine(next, line);
  return { life: next, notes: [line] };
}

export function advertRooms(life: Life, plotId: string): StepResult {
  const plot = plotsOf(life).find((item) => item.id === plotId);
  if (!plot || plot.stage < STAGES.length - 1) return { life, notes: [], error: "Finish the house first." };
  const land = landOf(plot.area);
  if (plot.tenants >= land.rooms) return { life, notes: [], error: "Every room is taken." };
  const wait = (plot.lastAdvert ?? -1e9) + 360 - life.minutes;
  if (wait > 0) return { life, notes: [], error: `The agent is still showing rooms. Back in ${Math.ceil(wait / 60)}h.` };
  if (life.cash < 50) return { life, notes: [], error: "The agent wants ₵50." };
  const due = rentDue(life, plot);
  const moved = Math.min(land.rooms - plot.tenants, 1 + Math.floor(Math.random() * 2));
  const next = withPlot(life, plotId, (item) => ({ ...item, tenants: item.tenants + moved, lastAdvert: life.minutes, lastRent: due > 0 ? item.lastRent : life.minutes }));
  next.cash -= 50;
  return { life: next, notes: [`${moved} new tenant${moved > 1 ? "s" : ""} moved into ${land.label}.`] };
}

export function collectRent(life: Life, plotId: string): StepResult {
  const plot = plotsOf(life).find((item) => item.id === plotId);
  if (!plot) return { life, notes: [], error: "That plot is gone." };
  const due = rentDue(life, plot);
  if (due < 1) return { life, notes: [], error: "No rent due yet." };
  const next = withPlot(life, plotId, (item) => ({ ...item, lastRent: life.minutes }));
  next.cash += due;
  const line = `Tenants in ${landOf(plot.area).label} paid ${cedis(due)} rent.`;
  logLine(next, line);
  return { life: next, notes: [line] };
}

export function sellPlot(life: Life, plotId: string): StepResult {
  const plot = plotsOf(life).find((item) => item.id === plotId);
  if (!plot) return { life, notes: [], error: "That plot is gone." };
  const finished = plotsOf(life).filter((item) => item.stage >= STAGES.length - 1);
  if (life.homeId === "own-house" && plot.stage >= STAGES.length - 1 && finished.length === 1) return { life, notes: [], error: "You live in that house. Move out in the Home app first." };
  const value = Math.round(plot.spent * 0.7) + rentDue(life, plot);
  const next = cloneLife(life);
  next.plots = plotsOf(next).filter((item) => item.id !== plotId);
  next.cash += value;
  return { life: next, notes: [`Sold the ${landOf(plot.area).label} property for ${cedis(value)}.`] };
}

export const CROPS = [
  { id: "okro", label: "Okro", emoji: "🌿", seed: 8, hours: 18, waters: 2, yield: 4 },
  { id: "pepper", label: "Pepper", emoji: "🌶️", seed: 10, hours: 24, waters: 3, yield: 4 },
  { id: "garden-eggs", label: "Garden eggs", emoji: "🍆", seed: 10, hours: 30, waters: 3, yield: 4 },
  { id: "tomatoes", label: "Tomatoes", emoji: "🍅", seed: 14, hours: 36, waters: 4, yield: 3 },
  { id: "plantain", label: "Plantain", emoji: "🍌", seed: 20, hours: 72, waters: 6, yield: 3 },
] as const;

const WATER_GAP = 360;
const WILT = 2880;

export function farmSize(life: Life) {
  return Math.min(8, 4 + plotsOf(life).filter((plot) => plot.stage >= STAGES.length - 1).length * 2);
}

export function cropOf(bed: FarmBed) {
  return CROPS.find((crop) => crop.id === bed.crop) ?? CROPS[0];
}

export function bedState(life: Life, bed: FarmBed) {
  const crop = cropOf(bed);
  const grown = life.minutes - bed.plantedAt >= crop.hours * 60;
  if (bed.waters >= crop.waters && grown) return "ready" as const;
  if (life.minutes - bed.lastWater > WILT) return "dead" as const;
  if (life.minutes - bed.lastWater < WATER_GAP) return "wet" as const;
  return "dry" as const;
}

export function plantCrop(life: Life, slot: number, cropId: string): StepResult {
  const crop = CROPS.find((item) => item.id === cropId);
  if (!crop) return { life, notes: [], error: "No seeds like that." };
  if (slot < 0 || slot >= farmSize(life)) return { life, notes: [], error: "That bed is not dug yet." };
  const beds = [...(life.farm ?? [])];
  if (beds[slot] && bedState(life, beds[slot]) !== "dead") return { life, notes: [], error: "Something is already growing there." };
  if (life.cash < crop.seed) return { life, notes: [], error: `Seeds cost ${cedis(crop.seed)}.` };
  const next = passTime(cloneLife(life), 15).life;
  beds[slot] = { crop: crop.id, plantedAt: next.minutes, waters: 0, lastWater: next.minutes - WATER_GAP };
  next.farm = beds;
  next.cash -= crop.seed;
  next.needs.hygiene = Math.max(0, next.needs.hygiene - 4);
  return { life: next, notes: [`Planted ${crop.label.toLowerCase()}. Water it every few hours.`] };
}

export function waterBeds(life: Life, raining: boolean): StepResult {
  const beds = life.farm ?? [];
  const thirsty = beds.filter((bed): bed is FarmBed => Boolean(bed) && bedState(life, bed as FarmBed) === "dry");
  if (!thirsty.length) return { life, notes: [], error: beds.some(Boolean) ? "The soil is still wet." : "Plant something first." };
  const next = passTime(cloneLife(life), raining ? 2 : 10).life;
  next.farm = beds.map((bed) => (bed && bedState(life, bed) === "dry" ? { ...bed, waters: bed.waters + 1, lastWater: next.minutes } : bed));
  if (!raining) next.needs.energy = Math.max(0, next.needs.energy - 3);
  return { life: next, notes: [raining ? `The rain watered ${thirsty.length} bed${thirsty.length > 1 ? "s" : ""} for you.` : `Watered ${thirsty.length} bed${thirsty.length > 1 ? "s" : ""}.`] };
}

export function harvestBed(life: Life, slot: number): StepResult {
  const bed = life.farm?.[slot];
  if (!bed) return { life, notes: [], error: "Nothing planted there." };
  const state = bedState(life, bed);
  if (state === "dead") {
    const next = cloneLife(life);
    next.farm = (next.farm ?? []).map((item, index) => (index === slot ? null : item));
    return { life: next, notes: ["You cleared the wilted bed."] };
  }
  if (state !== "ready") return { life, notes: [], error: "Not ready yet." };
  const crop = cropOf(bed);
  const room = BAG_LIMIT - bagCount(life);
  if (room < 1) return { life, notes: [], error: `Your trader's bag is full (${BAG_LIMIT}). Sell first.` };
  const amount = Math.min(room, crop.yield);
  const good = GOODS.find((item) => item.id === crop.id);
  const next = passTime(cloneLife(life), 20).life;
  const lot = next.bag?.[crop.id] ?? { qty: 0, paid: 0 };
  next.bag = { ...next.bag, [crop.id]: { qty: lot.qty + amount, paid: lot.paid } };
  next.farm = (next.farm ?? []).map((item, index) => (index === slot ? null : item));
  next.stats = { ...next.stats, harvests: (next.stats?.harvests ?? 0) + 1 };
  next.needs.fun = Math.min(100, next.needs.fun + 8);
  return { life: next, notes: [`Harvested ${amount} × ${good?.label.toLowerCase() ?? crop.label}. Sell them at spots across town.`] };
}
