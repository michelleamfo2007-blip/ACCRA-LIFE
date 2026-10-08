import { BAG_LIMIT, GOODS, bagCount } from "@/lib/game/trade";
import { cedis, cloneLife, logLine, passTime, seasonFlags, type FarmBed, type HousePlan, type Life, type Plot, type StepResult, type Tenant } from "@/lib/game/world";

export const LAND = [
  { id: "nima", label: "Nima", price: 4500, rooms: 3, rent: 22, size: "40×80 ft", rule: "Residential only", blurb: "Tight streets, cheap land, everybody knows everybody." },
  { id: "kasoa", label: "Kasoa", price: 8000, rooms: 4, rent: 40, size: "50×100 ft", rule: "Residential only", blurb: "Far, dusty, and growing fast." },
  { id: "ashaiman", label: "Ashaiman", price: 12000, rooms: 4, rent: 55, size: "50×100 ft", rule: "A small shop is allowed", blurb: "Close to Tema. Workers need rooms." },
  { id: "madina", label: "Madina", price: 20000, rooms: 5, rent: 80, size: "60×100 ft", rule: "Residential only", blurb: "Market town energy. Students and traders." },
  { id: "spintex", label: "Spintex", price: 35000, rooms: 6, rent: 130, size: "80×100 ft", rule: "Residential, gated", blurb: "Gated estates and young families." },
  { id: "east-legon", label: "East Legon", price: 90000, rooms: 6, rent: 300, size: "100×100 ft", rule: "Residential only", blurb: "Embassy row. Rent paid in advance." },
  { id: "airport", label: "Airport Residential", price: 160000, rooms: 8, rent: 480, size: "100×200 ft", rule: "Residential only", blurb: "The expensive side. Quiet roads, heavy gates." },
  { id: "trasacco", label: "Trasacco", price: 420000, rooms: 8, rent: 900, size: "120×150 ft", rule: "Gated. Mansions only.", blurb: "East Legon hills. Security at the gate, pools behind the walls, and a street that knows your car." },
] as const;

export const HOUSES = [
  { id: "single", label: "Single room", rooms: 1, cost: 0.7, rent: 0.6, line: "One room. Yours." },
  { id: "chamber", label: "Chamber and hall", rooms: 2, cost: 0.85, rent: 0.8, line: "A hall to sit, a room to sleep." },
  { id: "two", label: "2-bedroom", rooms: 3, cost: 1, rent: 1, line: "Two rooms and a hall." },
  { id: "three", label: "3-bedroom", rooms: 4, cost: 1.25, rent: 1.2, line: "Space for a family." },
  { id: "four", label: "4-bedroom", rooms: 5, cost: 1.4, rent: 1.35, line: "Room for children and a guest." },
  { id: "duplex", label: "Duplex", rooms: 6, cost: 1.6, rent: 1.5, line: "Upstairs and downstairs." },
  { id: "mansion", label: "Mansion", rooms: 8, cost: 2.2, rent: 2, line: "The compound talks about you." },
] as const;

const TENANT_BOOK: { name: string; note: string; pays: Tenant["pays"] }[] = [
  { name: "Auntie Adwoa", note: "Pays on the first. Cooks for the compound.", pays: "steady" },
  { name: "Kwesi the driver", note: "Out before dawn. Quiet.", pays: "steady" },
  { name: "Ama from Legon", note: "Student. Sometimes late, always sorry.", pays: "late" },
  { name: "Uncle Yaw", note: "Knows everybody on the street.", pays: "steady" },
  { name: "Efua and her baby", note: "Needs the room more than she needs a lecture.", pays: "late" },
  { name: "Kojo the DJ", note: "Speakers after midnight. The neighbours have opinions.", pays: "trouble" },
  { name: "Sister Akos", note: "Church on Sunday. Rent before church.", pays: "steady" },
  { name: "Mr Mensah", note: "Says he works in imports. The visitors are odd.", pays: "trouble" },
];

export const STAGES = ["Bare plot", "Foundation", "Blocks and walls", "Roofing", "Plaster and paint", "Finished house"];
export const STAGE_LINES = [
  "Permit is in the first payment. The crew clears the plot and pours the foundation.",
  "Blocks rise, course by course. You can stand in the doorway.",
  "Roof frame, then the sheets or tiles. Rain stops being your problem.",
  "Plaster, paint, windows, and the colour you picked.",
  "Gate, compound, and the last sweep. Then you furnish and move in.",
];

export const ROOM_CHOICES = [
  { id: "hall", label: "Hall", locked: true },
  { id: "kitchen", label: "Kitchen", locked: true },
  { id: "dining", label: "Dining room" },
  { id: "master", label: "Master bedroom" },
  { id: "ensuite", label: "Ensuite bath" },
  { id: "guest", label: "Guest bedroom" },
  { id: "children", label: "Children's room" },
  { id: "study", label: "Study" },
  { id: "prayer", label: "Prayer room" },
  { id: "store", label: "Store" },
  { id: "laundry", label: "Laundry" },
  { id: "garage", label: "Garage" },
  { id: "veranda", label: "Veranda" },
  { id: "bq", label: "Boys' quarters" },
  { id: "pool", label: "Pool" },
  { id: "garden", label: "Garden" },
  { id: "terrace", label: "Roof terrace" },
] as const;

export const STYLES = [
  { id: "modern", label: "Modern", roof: "flat" },
  { id: "ghanaian", label: "Traditional Ghanaian", roof: "pitch" },
  { id: "colonial", label: "Colonial", roof: "pitch" },
  { id: "minimal", label: "Minimalist", roof: "flat" },
  { id: "luxury", label: "Luxury", roof: "pitch" },
  { id: "compound", label: "Compound", roof: "pitch" },
] as const;

export const WALL_MATS = [
  { id: "block", label: "Block", factor: 1 },
  { id: "concrete", label: "Concrete", factor: 1.15 },
  { id: "brick", label: "Brick", factor: 1.25 },
  { id: "wood", label: "Wood", factor: 0.9 },
] as const;
export const ROOF_MATS = [
  { id: "aluminium", label: "Aluminium sheets", factor: 1 },
  { id: "tiles", label: "Tiles", factor: 1.2 },
  { id: "concrete", label: "Concrete", factor: 1.35 },
  { id: "thatch", label: "Thatch", factor: 0.75 },
] as const;
export const WINDOW_MATS = [
  { id: "sliding", label: "Sliding" },
  { id: "casement", label: "Casement" },
  { id: "louvre", label: "Louvre" },
] as const;
export const FLOOR_MATS = [
  { id: "tile", label: "Tiles", factor: 1 },
  { id: "wood", label: "Wood", factor: 1.1 },
  { id: "polish", label: "Polished concrete", factor: 1.05 },
  { id: "marble", label: "Marble", factor: 1.4 },
] as const;
export const COMPOUNDS = [
  { id: "none", label: "No wall" },
  { id: "low", label: "Low wall" },
  { id: "high", label: "High wall" },
  { id: "electric", label: "High wall, electric" },
] as const;
export const GATES = [
  { id: "manual", label: "Manual gate" },
  { id: "sliding", label: "Sliding gate" },
  { id: "auto", label: "Automatic gate" },
] as const;
export const PAINTS = ["#f4efe6", "#f3d7b5", "#e7e2d8", "#c4552a", "#1f4d3a", "#243044", "#6b1f3a", "#c9a227"];

function matFactor(id: string, table: readonly { id: string; factor: number }[]) {
  return table.find((item) => item.id === id)?.factor ?? 1;
}

export function planFactor(plot: Plot) {
  const house = houseOf(plot)?.cost ?? 1;
  const plan = plot.plan;
  if (!plan) return house;
  const extras = plan.rooms.filter((room) => room !== "hall" && room !== "kitchen").length;
  const pool = plan.rooms.includes("pool") ? 0.18 : 0;
  const fence = plan.compound === "electric" ? 0.08 : plan.compound === "high" ? 0.04 : 0;
  const mix = (matFactor(plan.wall, WALL_MATS) + matFactor(plan.roofMat, ROOF_MATS) + matFactor(plan.floor, FLOOR_MATS)) / 3;
  return house * mix * (1 + extras * 0.03 + pool + fence);
}

export function designQuote(area: string, plan: HousePlan) {
  const fake: Plot = { id: "quote", area, stage: 0, stageAt: 0, spent: 0, tenants: 0, lastRent: 0, house: plan.house, plan };
  let build = 0;
  for (let stage = 0; stage < STAGES.length - 1; stage += 1) build += stageCost({ ...fake, stage });
  const upkeep = Math.max(15, Math.round(build * 0.002));
  return { build, permit: Math.round(landOf(area).price * 0.04), upkeep, days: 6 + Math.min(8, plan.bedrooms) };
}

export function defaultPlan(houseId = "two"): HousePlan {
  const house = HOUSES.find((item) => item.id === houseId) ?? HOUSES[2];
  const bedrooms = Math.max(1, house.rooms - 1);
  const rooms = ["hall", "kitchen", "master"];
  if (bedrooms > 1) rooms.push("guest");
  if (bedrooms > 2) rooms.push("children");
  if (house.id === "duplex" || house.id === "mansion") rooms.push("dining", "veranda", "garage");
  if (house.id === "mansion") rooms.push("pool", "bq");
  return {
    house: house.id,
    bedrooms,
    rooms,
    style: house.id === "mansion" ? "luxury" : "ghanaian",
    wall: "block",
    roofMat: "aluminium",
    windows: "louvre",
    floor: "tile",
    wallColor: "#f4efe6",
    roofColor: "#8d5a32",
    accent: "#1f4d3a",
    compound: "low",
    gate: "manual",
  };
}
const STAGE_COST = [0.3, 0.45, 0.3, 0.25, 0.2];
export const STAGE_SECONDS = 8;

export const CREWS = [
  { id: "self", name: "You, on the weekends", rating: 3, price: 0.45, pace: 1.8, scam: 0, line: "Slower and cheaper. Your back does the carrying." },
  { id: "ebo", name: "Cousin Ebo", rating: 2, price: 0.62, pace: 1.35, scam: 0.34, line: "A family price. The street already has a story." },
  { id: "kofi", name: "Kofi Blocks", rating: 3, price: 0.85, pace: 1, scam: 0.12, line: "Known at the timber market." },
  { id: "ama", name: "Ama and Sons", rating: 4, price: 1, pace: 0.85, scam: 0.04, line: "A referral. They finish what they start." },
  { id: "mensah", name: "Mensah Estates", rating: 5, price: 1.5, pace: 0.7, scam: 0, line: "Expensive. The compound matches the drawing." },
] as const;

export const SPECS = [
  { id: "electrician", label: "Electrician", cost: 0.06 },
  { id: "plumber", label: "Plumber", cost: 0.06 },
  { id: "carpenter", label: "Carpenter", cost: 0.05 },
  { id: "tiler", label: "Tiler", cost: 0.05 },
  { id: "painter", label: "Painter", cost: 0.04 },
] as const;

export const GARAGE_KINDS = [
  { id: "attached", label: "Attached" },
  { id: "detached", label: "Detached" },
  { id: "carport", label: "Carport" },
  { id: "under", label: "Under the house" },
] as const;

export function crewOf(id?: string | null) {
  return CREWS.find((item) => item.id === id) ?? null;
}

export function layoutOf(plan: HousePlan) {
  return plan.rooms.map((id, index) => plan.layout?.find((cell) => cell.id === id) ?? { id, x: index % 4, y: Math.floor(index / 4) });
}

export function materialsOf(area: string, plan: HousePlan) {
  const quote = designQuote(area, plan);
  const metres = 36 + plan.bedrooms * 16 + plan.rooms.length * 5 + (plan.rooms.includes("garage") ? (plan.garageBay ?? 1) * 12 : 0);
  const labor = Math.round(quote.build * 0.34);
  const blocks = Math.round(quote.build * 0.22);
  const cement = Math.round(quote.build * 0.1);
  const roof = Math.round(quote.build * 0.12);
  const finish = Math.max(0, quote.build - labor - blocks - cement - roof);
  return {
    ...quote,
    metres,
    lines: [
      { label: "Blocks and sand", cost: blocks },
      { label: "Cement", cost: cement },
      { label: "Roofing", cost: roof },
      { label: "Tiles, paint, wiring, plumbing", cost: finish },
      { label: "Labour", cost: labor },
      { label: "Permit", cost: quote.permit },
    ],
  };
}

export function siteLeft(life: Life, plot: Plot) {
  if (!plot.busyUntil) return 0;
  if (plot.stage >= STAGES.length - 1 && !plot.pendingRoom) return 0;
  if (plot.paused) return plot.hold ?? Math.max(0, plot.busyUntil - life.minutes);
  return Math.max(0, plot.busyUntil - life.minutes);
}

export function stageMinutes(plot: Plot) {
  const crew = crewOf(plot.crew);
  const plan = plot.plan ?? defaultPlan(plot.house);
  const days = designQuote(plot.area, plan).days;
  const share = days / (STAGES.length - 1);
  return Math.max(480, Math.round(share * 1440 * (crew?.pace ?? 1)));
}
export const MAX_PLOTS = 3;
const RENT_DAYS_CAP = 14;

const id = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function landOf(area: string) {
  return LAND.find((item) => item.id === area) ?? LAND[0];
}

export function houseOf(plot: Plot) {
  return HOUSES.find((item) => item.id === plot.house) ?? null;
}

export function roomsOf(plot: Plot) {
  return houseOf(plot)?.rooms ?? landOf(plot.area).rooms;
}

export function rentRate(plot: Plot) {
  const house = houseOf(plot);
  const base = landOf(plot.area).rent * (house?.rent ?? 1) * (plot.rentAsk ?? 1);
  return Math.max(1, Math.round(base));
}

export function stageCost(plot: Plot) {
  if (plot.stage >= STAGES.length - 1) return 0;
  return Math.round(landOf(plot.area).price * STAGE_COST[plot.stage] * planFactor(plot));
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

function roster(plot: Plot): Tenant[] {
  if (plot.people?.length) return plot.people;
  return Array.from({ length: plot.tenants }, (_, index) => ({
    id: `old-${plot.id}-${index}`,
    name: `Tenant ${index + 1}`,
    note: "Been in the room a while.",
    pays: "steady" as const,
    since: plot.lastRent,
  }));
}

function payShare(person: Tenant) {
  if (person.pays === "late") return 0.55;
  if (person.pays === "trouble") return 0;
  return 1;
}

export function rentDue(life: Life, plot: Plot) {
  if (plot.stage < STAGES.length - 1 || plot.tenants < 1) return 0;
  const days = Math.min(RENT_DAYS_CAP, (life.minutes - plot.lastRent) / 1440);
  const returnees = seasonFlags(life.minutes).detty ? 1.5 : 1;
  const share = roster(plot).reduce((sum, person) => sum + payShare(person), 0);
  return Math.max(0, Math.floor(days * share * rentRate(plot) * returnees));
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
  const guarded = land.id === "trasacco" ? false : Math.random() < 0.35;
  next.cash -= land.price;
  next.plots = [...plotsOf(next), { id: plotId, area: land.id, stage: 0, stageAt: next.minutes, spent: land.price, guard: guarded ? "waiting" : null, tenants: 0, lastRent: next.minutes }];
  if (land.id === "trasacco") next.stats = { ...(next.stats ?? {}), clout: (next.stats?.clout ?? 0) + 12 };
  const line = land.id === "trasacco"
    ? `The Trasacco gate logged your name. The plot is ${cedis(land.price)}. Build a mansion, then the street will show it.`
    : guarded
      ? `You bought a plot in ${land.label}. Land guards are standing on it, asking for "drink money".`
      : `You bought a plot in ${land.label}. The indenture is in your name.`;
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

export function chooseHouse(life: Life, plotId: string, houseId: string): StepResult {
  const plot = plotsOf(life).find((item) => item.id === plotId);
  const house = HOUSES.find((item) => item.id === houseId);
  if (!plot || !house) return { life, notes: [], error: "That house is not on the plan." };
  if (plot.stage > 0) return { life, notes: [], error: "The foundation is already down. This is the house you are building." };
  const next = withPlot(life, plotId, (item) => ({ ...item, house: house.id, plan: item.plan?.house === house.id ? item.plan : defaultPlan(house.id) }));
  return { life: next, notes: [`You are building a ${house.label.toLowerCase()} in ${landOf(plot.area).label}. ${house.line}`] };
}

export function saveDesign(life: Life, plotId: string, plan: HousePlan): StepResult {
  const plot = plotsOf(life).find((item) => item.id === plotId);
  const house = HOUSES.find((item) => item.id === plan.house);
  if (!plot || !house) return { life, notes: [], error: "That plan does not fit a plot you own." };
  if (plot.stage > 0) return { life, notes: [], error: "The foundation is already down." };
  if (plot.guard) return { life, notes: [], error: "Clear the land guards before you file a plan." };
  const rooms = Array.from(new Set(["hall", "kitchen", ...plan.rooms]));
  const next = withPlot(life, plotId, (item) => ({ ...item, house: house.id, plan: { ...plan, house: house.id, rooms, bedrooms: Math.max(1, Math.min(6, plan.bedrooms)) } }));
  const quote = designQuote(plot.area, { ...plan, rooms });
  const line = `Plan filed in ${landOf(plot.area).label}. A ${house.label.toLowerCase()}, ${cedis(quote.build)} all in. The permit is inside the first payment.`;
  logLine(next, line);
  return { life: next, notes: [line] };
}

export function setRentAsk(life: Life, plotId: string, ask: number): StepResult {
  const plot = plotsOf(life).find((item) => item.id === plotId);
  if (!plot || plot.stage < STAGES.length - 1) return { life, notes: [], error: "Finish the house before you set rent." };
  if (ask < 0.8 || ask > 1.4) return { life, notes: [], error: "That rent will empty the street or the rooms." };
  const people = roster(plot);
  let staying = people;
  const notes: string[] = [];
  if (ask > (plot.rentAsk ?? 1) && people.length) {
    const walker = people.find((person) => person.pays !== "steady");
    if (walker) {
      staying = people.filter((person) => person.id !== walker.id);
      notes.push(`${walker.name} heard the new rent and left.`);
    }
  }
  const next = withPlot(life, plotId, (item) => ({ ...item, rentAsk: ask, people: staying, tenants: staying.length }));
  const line = `Rent in ${landOf(plot.area).label} is now ${cedis(rentRate({ ...plot, rentAsk: ask }))} a room a day.`;
  notes.unshift(line);
  return { life: next, notes };
}

export function evictTenant(life: Life, plotId: string, tenantId: string): StepResult {
  const plot = plotsOf(life).find((item) => item.id === plotId);
  if (!plot) return { life, notes: [], error: "That plot is gone." };
  const people = roster(plot);
  const person = people.find((item) => item.id === tenantId);
  if (!person) return { life, notes: [], error: "That tenant already left." };
  const staying = people.filter((item) => item.id !== tenantId);
  const next = withPlot(life, plotId, (item) => ({ ...item, people: staying, tenants: staying.length }));
  const trashed = person.pays === "trouble";
  if (trashed) next.cash = Math.max(0, next.cash - 80);
  const line = trashed
    ? `${person.name} refused to leave quietly. The room needs ${cedis(80)} of repairs.`
    : `${person.name} packed and left ${landOf(plot.area).label}.`;
  logLine(next, line);
  return { life: next, notes: [line] };
}

export function hireCrew(life: Life, plotId: string, crewId: string): StepResult {
  const plot = plotsOf(life).find((item) => item.id === plotId);
  const crew = crewOf(crewId);
  if (!plot || !crew) return { life, notes: [], error: "Pick a crew that is still taking work." };
  if (plot.stage >= STAGES.length - 1) return { life, notes: [], error: "The house is already handed over." };
  if (plot.guard) return { life, notes: [], error: "Clear the land guards before a crew will stand on the plot." };
  const next = withPlot(life, plotId, (item) => ({ ...item, crew: crew.id }));
  const line = `${crew.name} will build in ${landOf(plot.area).label}. ${crew.line}`;
  logLine(next, line);
  return { life: next, notes: [line] };
}

export function hireSpec(life: Life, plotId: string, specId: string): StepResult {
  const plot = plotsOf(life).find((item) => item.id === plotId);
  const spec = SPECS.find((item) => item.id === specId);
  if (!plot || !spec) return { life, notes: [], error: "That trade is not on the list." };
  if ((plot.specs ?? []).includes(spec.id)) return { life, notes: [], error: `${spec.label} is already on the job.` };
  const next = withPlot(life, plotId, (item) => ({ ...item, specs: [...(item.specs ?? []), spec.id] }));
  return { life: next, notes: [`${spec.label} is booked. Their fee sits inside the next stage payment.`] };
}

export function buildNext(life: Life, plotId: string): StepResult {
  const plot = plotsOf(life).find((item) => item.id === plotId);
  if (!plot) return { life, notes: [], error: "That plot is gone." };
  if (plot.guard) return { life, notes: [], error: plot.guard === "court" ? "Wait for the court to clear the land guards." : "Deal with the land guards first." };
  if (plot.stage >= STAGES.length - 1 && !plot.pendingRoom) return { life, notes: [], error: "The house is finished. Add a room if you want the crew back." };
  if (plot.stage === 0 && !plot.house) return { life, notes: [], error: "Choose the house first. Single room, chamber and hall, or something bigger." };
  if (!plot.crew) return { life, notes: [], error: "Hire a crew first. Cheap, recommended, or yourself." };
  const legacy = (plot.readyAt ?? 0) > 1e11 ? buildWait(plot) : 0;
  if (legacy > 0) return { life, notes: [], error: `The last crew is still on site. ${legacy}s left on the old clock.` };
  if (siteLeft(life, plot) > 0) return { life, notes: [], error: "The crew is already on the plot. Visit them, or pay overtime." };
  const crew = crewOf(plot.crew);
  const spec = (plot.specs ?? []).reduce((sum, id) => sum + (SPECS.find((item) => item.id === id)?.cost ?? 0), 0);
  const cost = Math.round(stageCost(plot) * (crew?.price ?? 1) * (1 + spec));
  if (life.cash < cost) return { life, notes: [], error: `${STAGES[Math.min(plot.stage + 1, STAGES.length - 1)]} costs ${cedis(cost)} with this crew.` };
  const minutes = stageMinutes(plot);
  const next = withPlot(life, plotId, (item) => ({
    ...item,
    busyUntil: life.minutes + minutes,
    paused: false,
    hold: undefined,
    stageAt: life.minutes,
    readyAt: undefined,
    spent: item.spent + cost,
    siteLog: [`Paid for ${STAGES[Math.min(item.stage + 1, STAGES.length - 1)].toLowerCase()}. The crew starts in the morning.`, ...(item.siteLog ?? [])].slice(0, 12),
  }));
  next.cash -= cost;
  const line = `${crew?.name ?? "The crew"} started ${STAGES[Math.min(plot.stage + 1, STAGES.length - 1)].toLowerCase()} in ${landOf(plot.area).label}. About ${Math.ceil(minutes / 60)} hours of city time. Go and look.`;
  logLine(next, line);
  return { life: next, notes: [line] };
}

export function visitSite(life: Life, plotId: string): StepResult {
  const plot = plotsOf(life).find((item) => item.id === plotId);
  if (!plot) return { life, notes: [], error: "That plot is gone." };
  if (!plot.busyUntil && plot.stage >= STAGES.length - 1) return { life, notes: [], error: "Nothing is being built. The house is standing." };
  if (!plot.busyUntil) return { life, notes: [], error: "Pay a stage before there is anything to inspect." };
  const timed = passTime(cloneLife(life), 30).life;
  const current = plotsOf(timed).find((item) => item.id === plotId) ?? plot;
  const left = siteLeft(timed, current);
  const crew = crewOf(current.crew);
  let line = left > 0 ? `${crew?.name ?? "The crew"} is on ${STAGES[Math.min(current.stage + 1, STAGES.length - 1)].toLowerCase()}. About ${Math.ceil(left / 60)}h left.` : `${STAGES[current.stage]} is standing. Pay the next stage when you are ready.`;
  if (current.crew === "self" && left > 0) {
    const bumped = withPlot(timed, plotId, (item) => ({ ...item, busyUntil: Math.max(timed.minutes, (item.busyUntil ?? timed.minutes) - 90) }));
    bumped.needs.energy = Math.max(0, bumped.needs.energy - 8);
    line = "You worked a stretch yourself. The stage moved, and your back knows it.";
    logLine(bumped, line);
    return { life: bumped, notes: [line] };
  }
  logLine(timed, line);
  return { life: timed, notes: [line] };
}

export function rushSite(life: Life, plotId: string): StepResult {
  const plot = plotsOf(life).find((item) => item.id === plotId);
  if (!plot?.busyUntil) return { life, notes: [], error: "Nothing is in progress." };
  const cost = Math.max(40, Math.round(stageCost(plot) * 0.08));
  if (life.cash < cost) return { life, notes: [], error: `Overtime is ${cedis(cost)}.` };
  const next = withPlot(life, plotId, (item) => ({ ...item, paused: false, busyUntil: Math.max(life.minutes, (item.busyUntil ?? life.minutes) - 360) }));
  next.cash -= cost;
  const line = `Overtime paid, ${cedis(cost)}. The crew stays late.`;
  logLine(next, line);
  return { life: next, notes: [line] };
}

export function pauseSite(life: Life, plotId: string): StepResult {
  const plot = plotsOf(life).find((item) => item.id === plotId);
  if (!plot?.busyUntil) return { life, notes: [], error: "Nothing is in progress." };
  if (plot.paused) {
    const next = withPlot(life, plotId, (item) => ({ ...item, paused: false, busyUntil: life.minutes + (item.hold ?? 0), hold: undefined }));
    return { life: next, notes: ["The crew is back in the morning."] };
  }
  const next = withPlot(life, plotId, (item) => ({ ...item, paused: true, hold: Math.max(0, (item.busyUntil ?? life.minutes) - life.minutes) }));
  return { life: next, notes: ["Work is paused. The days do not count until you call them back."] };
}

export function answerSite(life: Life, plotId: string, yes: boolean): StepResult {
  const plot = plotsOf(life).find((item) => item.id === plotId);
  if (!plot?.siteNote) return { life, notes: [], error: "Nothing is waiting on you at the site." };
  const next = withPlot(life, plotId, (item) => ({ ...item, siteNote: undefined }));
  if (plot.siteNote === "inspector" && yes) {
    const cost = 80;
    if (life.cash < cost) return { life, notes: [], error: "The inspector's drink is ₵80." };
    next.cash -= cost;
    const line = "You paid the inspector. The visit ended.";
    logLine(next, line);
    return { life: next, notes: [line] };
  }
  if (plot.siteNote === "cement" && yes) {
    const cost = 60;
    if (life.cash < cost) return { life, notes: [], error: "Another bag run is ₵60." };
    next.cash -= cost;
    return { life: next, notes: ["Cement is on the way again."] };
  }
  if (plot.siteNote === "gone") return { life: next, notes: ["The crew is already gone. Hire someone else."] };
  const line = yes ? "You dealt with it on the plot." : "You left it. The crew will talk about that.";
  return { life: next, notes: [line] };
}

export function addRoom(life: Life, plotId: string, roomId: string): StepResult {
  const plot = plotsOf(life).find((item) => item.id === plotId);
  if (!plot || plot.stage < STAGES.length - 1) return { life, notes: [], error: "Finish the house before you add to it." };
  if (!plot.plan) return { life, notes: [], error: "File a plan first." };
  if (plot.plan.rooms.includes(roomId)) return { life, notes: [], error: "That room is already on the plan." };
  if (plot.busyUntil && siteLeft(life, plot) > 0) return { life, notes: [], error: "The crew is still on the last job." };
  const cost = Math.max(80, Math.round(landOf(plot.area).price * 0.04));
  if (life.cash < cost) return { life, notes: [], error: `Adding that costs ${cedis(cost)}.` };
  const next = withPlot(life, plotId, (item) => ({ ...item, pendingRoom: roomId, busyUntil: life.minutes + 720, spent: item.spent + cost }));
  next.cash -= cost;
  const line = `The crew is adding a ${roomId.replace("-", " ")}. Half a day, then it is yours.`;
  logLine(next, line);
  return { life: next, notes: [line] };
}

export function rateCrew(life: Life, plotId: string, stars: number): StepResult {
  const plot = plotsOf(life).find((item) => item.id === plotId);
  if (!plot || plot.stage < STAGES.length - 1) return { life, notes: [], error: "Rate them after handover." };
  if (plot.rated) return { life, notes: [], error: "You already left a rating." };
  const next = withPlot(life, plotId, (item) => ({ ...item, rated: true, quality: stars }));
  return { life: next, notes: [`You gave the crew ${stars} star${stars === 1 ? "" : "s"}.`] };
}

export function keepPrint(life: Life, name: string, plan: HousePlan): StepResult {
  const title = name.trim().slice(0, 24);
  if (title.length < 2) return { life, notes: [], error: "Name the drawing." };
  const next = cloneLife(life);
  next.prints = [...(next.prints ?? []), { id: id(), name: title, plan: { ...plan, rooms: [...plan.rooms], layout: plan.layout?.map((cell) => ({ ...cell })) } }].slice(-8);
  return { life: next, notes: [`${title} is saved with your drawings.`] };
}

const SITE_EVENTS = [
  { id: "cement", line: "The crew is out of cement." },
  { id: "rain", line: "Rain stopped the blocks. The day is lost." },
  { id: "injury", line: "A worker is hurt. The site is quiet." },
  { id: "theft", line: "Materials walked off the plot overnight." },
  { id: "neighbours", line: "The neighbours say the work starts too early." },
  { id: "inspector", line: "An inspector is at the gate and wants a drink." },
  { id: "late", line: "The delivery is late. The crew is standing around." },
  { id: "quality", line: "A wall is out of true. They will redo it." },
  { id: "gossip", line: "The compound is talking about your house." },
] as const;

export function pulseSites(life: Life, notes: string[]) {
  const day = Math.floor(life.minutes / 1440);
  life.plots = plotsOf(life).map((plot) => {
    if (plot.pendingRoom && plot.busyUntil && !plot.paused && life.minutes >= plot.busyUntil && plot.plan) {
      const rooms = plot.plan.rooms.includes(plot.pendingRoom) ? plot.plan.rooms : [...plot.plan.rooms, plot.pendingRoom];
      notes.push(`The new ${plot.pendingRoom.replace("-", " ")} is done.`);
      return { ...plot, plan: { ...plot.plan, rooms }, pendingRoom: undefined, busyUntil: undefined };
    }
    if (!plot.busyUntil || plot.paused || plot.stage >= STAGES.length - 1) return plot;
    if (life.minutes >= plot.busyUntil) {
      const stage = plot.stage + 1;
      const done = stage >= STAGES.length - 1;
      notes.push(done ? `Handover in ${landOf(plot.area).label}. The house is empty and yours. Rate the crew, move in, or let the rooms.` : `${STAGES[stage]} is done in ${landOf(plot.area).label}. Pay the next stage when you want them back.`);
      return { ...plot, stage, busyUntil: undefined, stageAt: life.minutes, lastRent: done ? life.minutes : plot.lastRent, siteLog: [`${STAGES[stage]} standing.`, ...(plot.siteLog ?? [])].slice(0, 12) };
    }
    if (plot.siteDay === day) return plot;
    const crew = crewOf(plot.crew);
    if (crew && crew.scam > 0 && Math.random() < crew.scam * 0.15) {
      notes.push(`${crew.name} has not been seen. The money for this stage is gone. Hire again.`);
      return { ...plot, crew: null, busyUntil: undefined, siteDay: day, siteNote: "gone", siteLog: [`${crew.name} disappeared.`, ...(plot.siteLog ?? [])].slice(0, 12) };
    }
    const event = Math.random() < 0.35 ? SITE_EVENTS[Math.floor(Math.random() * SITE_EVENTS.length)] : null;
    let busyUntil = plot.busyUntil;
    if (event?.id === "rain" || event?.id === "injury" || event?.id === "late" || event?.id === "quality") busyUntil += 180;
    if (event) notes.push(event.line);
    else notes.push(`${STAGES[Math.min(plot.stage + 1, STAGES.length - 1)]} is underway in ${landOf(plot.area).label}.`);
    return { ...plot, busyUntil, siteDay: day, siteNote: event?.id ?? plot.siteNote, siteLog: [event?.line ?? "A normal day on the plot.", ...(plot.siteLog ?? [])].slice(0, 12) };
  });
}

export function advertRooms(life: Life, plotId: string): StepResult {
  const plot = plotsOf(life).find((item) => item.id === plotId);
  if (!plot || plot.stage < STAGES.length - 1) return { life, notes: [], error: "Finish the house first." };
  const land = landOf(plot.area);
  const cap = roomsOf(plot);
  if (plot.tenants >= cap) return { life, notes: [], error: "Every room is taken." };
  const wait = (plot.lastAdvert ?? -1e9) + 360 - life.minutes;
  if (wait > 0) return { life, notes: [], error: `The agent is still showing rooms. Back in ${Math.ceil(wait / 60)}h.` };
  if (life.cash < 50) return { life, notes: [], error: "The agent wants ₵50." };
  const due = rentDue(life, plot);
  const have = new Set(roster(plot).map((person) => person.name));
  const fresh = TENANT_BOOK.filter((person) => !have.has(person.name));
  const pick = fresh[Math.floor(Math.random() * Math.max(1, fresh.length))] ?? TENANT_BOOK[0];
  const person: Tenant = { id: id(), name: pick.name, note: pick.note, pays: pick.pays, since: life.minutes };
  const people = [...roster(plot), person];
  const next = withPlot(life, plotId, (item) => ({ ...item, people, tenants: people.length, lastAdvert: life.minutes, lastRent: due > 0 ? item.lastRent : life.minutes }));
  next.cash -= 50;
  return { life: next, notes: [`${person.name} took a room in ${land.label}. ${person.note}`] };
}

export function collectRent(life: Life, plotId: string): StepResult {
  const plot = plotsOf(life).find((item) => item.id === plotId);
  if (!plot) return { life, notes: [], error: "That plot is gone." };
  const due = rentDue(life, plot);
  if (due < 1) return { life, notes: [], error: "No rent due yet." };
  const next = withPlot(life, plotId, (item) => ({ ...item, people: roster(plot), lastRent: life.minutes }));
  next.cash += due;
  const skipped = roster(plot).filter((person) => person.pays === "trouble");
  const late = roster(plot).filter((person) => person.pays === "late");
  const line = `Tenants in ${landOf(plot.area).label} paid ${cedis(due)} rent.`;
  const notes = [line];
  if (late.length) notes.push(`${late.map((person) => person.name).join(" and ")} paid short.`);
  if (skipped.length) notes.push(`${skipped.map((person) => person.name).join(" and ")} did not pay. You can warn them, or evict.`);
  logLine(next, line);
  return { life: next, notes };
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
