import { BUSINESSES, bizKind, bizRate } from "@/lib/game/biz-table";
import { cedis, cloneLife, type Business, type Life, type Staffer, type StepResult } from "@/lib/game/world";

export const SITES = [
  { id: "market", label: "Market stall", blurb: "Foot traffic is the rent.", cost: 0.75, traffic: 1.25 },
  { id: "street", label: "Street shop", blurb: "Your own shutter on a known road.", cost: 1, traffic: 1 },
  { id: "mall", label: "Mall unit", blurb: "Cold air and a higher rent.", cost: 1.55, traffic: 1.3 },
  { id: "home", label: "From home", blurb: "No shutter. The phone is the door.", cost: 0.35, traffic: 0.55 },
] as const;

export type SiteId = (typeof SITES)[number]["id"];

export const BRANDS = ["#006B3F", "#CE1126", "#121212", "#FCD116", "#1d4ed8", "#7c3aed"];

export const STAFF_POOL: Staffer[] = [
  { id: "ama", name: "Ama", role: "cashier", skill: 2, pay: 45, morale: 72, reliable: 0.85, trait: "Smiles at regulars." },
  { id: "kofi", name: "Kofi", role: "cook", skill: 3, pay: 60, morale: 64, reliable: 0.75, trait: "The pot is his." },
  { id: "akos", name: "Akosua", role: "waiter", skill: 2, pay: 40, morale: 70, reliable: 0.8, trait: "Remembers the order." },
  { id: "yaw", name: "Yaw", role: "manager", skill: 4, pay: 90, morale: 60, reliable: 0.9, trait: "Writes the numbers down." },
  { id: "esi", name: "Esi", role: "cleaner", skill: 2, pay: 35, morale: 80, reliable: 0.88, trait: "The floor is her reputation." },
  { id: "kojo", name: "Kojo", role: "security", skill: 3, pay: 55, morale: 58, reliable: 0.7, trait: "Watches the door, not the phone." },
  { id: "fiifi", name: "Fiifi", role: "stock", skill: 2, pay: 42, morale: 66, reliable: 0.78, trait: "Knows when the shelf is lying." },
  { id: "abena", name: "Abena", role: "cashier", skill: 3, pay: 50, morale: 74, reliable: 0.82, trait: "MoMo before you finish asking." },
];

const DRAMA: { id: string; line: string; cost: number; stars: number }[] = [
  { id: "sick", line: "A staff member called in sick.", cost: 30, stars: 0 },
  { id: "break", line: "A machine broke.", cost: 80, stars: -0.1 },
  { id: "complain", line: "A customer is complaining at the counter.", cost: 15, stars: -0.2 },
  { id: "supplier", line: "The supplier raised the price.", cost: 40, stars: 0 },
  { id: "thief", line: "Someone had a hand in the till.", cost: 50, stars: -0.3 },
  { id: "inspector", line: "A health inspector is at the door.", cost: 60, stars: -0.2 },
  { id: "star", line: "A known face walked in. People filmed it.", cost: 0, stars: 0.4 },
  { id: "rival", line: "A rival opened nearby.", cost: 40, stars: -0.2 },
  { id: "viral", line: "A post about the place is moving.", cost: 0, stars: 0.3 },
  { id: "dumsor", line: "Dumsor. The fridges went quiet.", cost: 25, stars: -0.1 },
  { id: "landlord", line: "The landlord wants more rent.", cost: 70, stars: 0 },
  { id: "award", line: "You are on a shortlist for a small-business award.", cost: 20, stars: 0.3 },
  { id: "protection", line: "Someone asked for protection money. You can refuse.", cost: 0, stars: -0.1 },
  { id: "scam", line: "A supplier took the deposit and vanished.", cost: 0, stars: -0.15 },
];

export type ShopSetup = {
  kind: string;
  name: string;
  color: string;
  tagline: string;
  site: SiteId;
  staffIds: string[];
  markup: number;
  opening: boolean;
  permit?: number;
};

function dayOf(minutes: number) {
  return Math.floor(minutes / 1440);
}

function clampStar(value: number) {
  return Math.max(1, Math.min(5, Math.round(value * 10) / 10));
}

export function shopSpot(shop: Business) {
  return shop.spot || bizKind(shop.kind).spot || "buka";
}

export function shopTitle(shop: Business) {
  return shop.name?.trim() || bizKind(shop.kind).label;
}

function push(life: Life, line: string) {
  life.log = [line, ...life.log].slice(0, 14);
  life.inbox = [line, ...life.inbox].slice(0, 20);
}

export function quoteShop(setup: ShopSetup) {
  const plan = bizKind(setup.kind);
  const site = SITES.find((item) => item.id === setup.site) ?? SITES[1];
  const staff = STAFF_POOL.filter((person) => setup.staffIds.includes(person.id));
  const wages = staff.reduce((sum, person) => sum + person.pay, 0);
  const party = setup.opening ? Math.round(plan.price * 0.12) : 0;
  const base = Math.round(plan.price * site.cost);
  const permit = setup.permit ?? 0;
  return { plan, site, staff, wages, party, base, permit, total: base + wages + party + permit };
}

/** Rolled once on the price step so the Open button is the amount that leaves the wallet. */
export function rollPermit(kind: string) {
  const plan = bizKind(kind);
  return Math.random() < 0.3 ? Math.round(plan.price * 0.1) : 0;
}

export function openShop(life: Life, setup: ShopSetup): StepResult {
  const plan = BUSINESSES.find((item) => item.id === setup.kind);
  if (!plan) return { life, notes: [], error: "That business is not for sale." };
  if ((life.businesses ?? []).some((shop) => shop.kind === setup.kind)) return { life, notes: [], error: `You already run a ${plan.label.toLowerCase()}.` };
  if ((life.businesses ?? []).length >= 4) return { life, notes: [], error: "Four businesses is the book you can carry. Sell one first." };
  const site = SITES.find((item) => item.id === setup.site) ?? SITES[1];
  if (site.id === "home" && !plan.homeOk) return { life, notes: [], error: "That one needs a street, not the house." };
  const name = setup.name.trim().slice(0, 28);
  if (name.length < 2) return { life, notes: [], error: "Give the place a name." };
  const quoted = quoteShop({ ...setup, name, permit: setup.permit ?? 0 });
  const permit = quoted.permit;
  const total = quoted.total;
  if (life.cash < total) return { life, notes: [], error: `Opening costs ${cedis(total)}. You have ${cedis(life.cash)}.` };
  const next = cloneLife(life);
  next.cash -= total;
  const spot = site.id === "home" ? "home" : site.id === "mall" ? "mall" : site.id === "market" ? (plan.town === "kumasi" ? "kejetia" : "makola") : plan.spot ?? "buka";
  const shop: Business = {
    id: `${setup.kind}-${life.minutes}`,
    kind: setup.kind,
    openedAt: life.minutes,
    lastCollect: life.minutes,
    level: 1,
    name,
    color: setup.color,
    tagline: setup.tagline.trim().slice(0, 60),
    town: plan.town ?? "accra",
    spot,
    site: site.id,
    staff: quoted.staff.map((person) => ({ ...person })),
    markup: setup.markup,
    stock: 80,
    stars: setup.opening ? 3.6 : 3,
    notice: null,
    branches: 0,
  };
  next.businesses = [...(next.businesses ?? []), shop];
  next.stats = { ...(next.stats ?? {}), clout: (next.stats?.clout ?? 0) + 2 };
  const drama = permit ? ` The clerk wanted a drink. The permit cost an extra ${cedis(permit)}.` : " The permit is in your name.";
  const party = setup.opening ? " You paid for a grand opening. The first regulars already have a photo." : "";
  const line = `${name} is open in ${plan.area}.${drama}${party}`;
  push(next, line);
  return { life: next, notes: [line] };
}

export function shopsHere(life: Life) {
  return (life.businesses ?? []).filter((shop) => shopSpot(shop) === life.where);
}

export function booksOf(life: Life, shop: Business) {
  const plan = bizKind(shop.kind);
  const site = SITES.find((item) => item.id === shop.site) ?? SITES[1];
  const stars = shop.stars ?? 3;
  const stock = shop.stock ?? 100;
  const markup = shop.markup ?? 1;
  const customers = Math.round(18 * site.traffic * (0.65 + stars * 0.12) * (stock < 25 ? 0.45 : 1) * (1 + (shop.branches ?? 0) * 0.35));
  const spend = Math.round(plan.perHour * 1.6 * markup);
  const revenue = customers * spend;
  const wages = shop.staff?.reduce((sum, person) => sum + person.pay, 0) ?? Math.round(plan.wages / 7);
  const rent = Math.round((plan.price * site.cost) / 400);
  const stockCost = Math.round(customers * 0.35 * (plan.perHour / 4));
  const profit = revenue - wages - rent - stockCost;
  return { customers, spend, revenue, wages, rent, stockCost, profit, stars, stock, markup };
}

export function workShift(life: Life, shopId: string): StepResult {
  const shop = (life.businesses ?? []).find((item) => item.id === shopId);
  if (!shop) return { life, notes: [], error: "That shop is gone." };
  if (life.where !== shopSpot(shop)) return { life, notes: [], error: "Walk into the shop before you take a shift." };
  if (life.needs.energy < 15) return { life, notes: [], error: "You are too tired to stand behind the counter." };
  const next = cloneLife(life);
  const pay = 25 + Math.round(bizRate(shop.kind, shop.level));
  next.cash += pay;
  next.needs.energy = Math.max(0, next.needs.energy - 12);
  next.needs.fun = Math.min(100, next.needs.fun + 6);
  next.businesses = (next.businesses ?? []).map((item) =>
    item.id === shopId
      ? {
          ...item,
          stars: clampStar((item.stars ?? 3) + 0.1),
          staff: item.staff?.map((person) => ({ ...person, morale: Math.min(100, person.morale + 4) })),
        }
      : item,
  );
  next.stats = { ...(next.stats ?? {}), clout: (next.stats?.clout ?? 0) + 1 };
  const line = `You worked a shift at ${shopTitle(shop)}. The till gained ${cedis(pay)}, and the room saw the boss.`;
  push(next, line);
  return { life: next, notes: [line] };
}

export function setMarkup(life: Life, shopId: string, markup: number): StepResult {
  const shop = (life.businesses ?? []).find((item) => item.id === shopId);
  if (!shop) return { life, notes: [], error: "That shop is gone." };
  const next = cloneLife(life);
  const price = Math.max(0.8, Math.min(1.3, markup));
  next.businesses = (next.businesses ?? []).map((item) => (item.id === shopId ? { ...item, markup: price } : item));
  const line = price > 1.05 ? `${shopTitle(shop)} got dearer. Fewer people, more on each plate.` : price < 0.95 ? `${shopTitle(shop)} got cheaper. The queue should notice.` : `${shopTitle(shop)} is priced fair.`;
  push(next, line);
  return { life: next, notes: [line] };
}

export function restock(life: Life, shopId: string): StepResult {
  const shop = (life.businesses ?? []).find((item) => item.id === shopId);
  if (!shop) return { life, notes: [], error: "That shop is gone." };
  const cost = Math.max(20, Math.round(bizKind(shop.kind).price * 0.04));
  if (life.cash < cost) return { life, notes: [], error: `Restock costs ${cedis(cost)}.` };
  const next = cloneLife(life);
  next.cash -= cost;
  next.businesses = (next.businesses ?? []).map((item) => (item.id === shopId ? { ...item, stock: 100, notice: item.noticeId === "stock" ? null : item.notice, noticeId: item.noticeId === "stock" ? null : item.noticeId } : item));
  const line = `You restocked ${shopTitle(shop)} for ${cedis(cost)}.`;
  push(next, line);
  return { life: next, notes: [line] };
}

export function hireStaff(life: Life, shopId: string, personId: string): StepResult {
  const shop = (life.businesses ?? []).find((item) => item.id === shopId);
  const person = STAFF_POOL.find((item) => item.id === personId);
  if (!shop || !person) return { life, notes: [], error: "That hire is not available." };
  if ((shop.staff ?? []).some((item) => item.id === personId)) return { life, notes: [], error: `${person.name} already works there.` };
  if ((shop.staff ?? []).length >= 4) return { life, notes: [], error: "Four people is a full crew for this room." };
  if (life.cash < person.pay) return { life, notes: [], error: `${person.name} wants ${cedis(person.pay)} to start.` };
  const next = cloneLife(life);
  next.cash -= person.pay;
  next.businesses = (next.businesses ?? []).map((item) => (item.id === shopId ? { ...item, staff: [...(item.staff ?? []), { ...person }] } : item));
  const line = `${person.name} started as ${person.role} at ${shopTitle(shop)}.`;
  push(next, line);
  return { life: next, notes: [line] };
}

export function fireStaff(life: Life, shopId: string, personId: string): StepResult {
  const shop = (life.businesses ?? []).find((item) => item.id === shopId);
  const person = shop?.staff?.find((item) => item.id === personId);
  if (!shop || !person) return { life, notes: [], error: "That person is not on the roster." };
  const next = cloneLife(life);
  next.businesses = (next.businesses ?? []).map((item) => (item.id === shopId ? { ...item, staff: (item.staff ?? []).filter((row) => row.id !== personId), stars: clampStar((item.stars ?? 3) - 0.1) } : item));
  const line = `You let ${person.name} go. The room is quieter.`;
  push(next, line);
  return { life: next, notes: [line] };
}

export function clearNotice(life: Life, shopId: string): StepResult {
  const shop = (life.businesses ?? []).find((item) => item.id === shopId);
  if (!shop?.notice) return { life, notes: [], error: "Nothing is waiting on you." };
  const drama = DRAMA.find((item) => item.id === shop.noticeId);
  const cost = drama?.cost ?? 0;
  if (life.cash < cost) return { life, notes: [], error: `Handling it costs ${cedis(cost)}.` };
  const next = cloneLife(life);
  next.cash -= cost;
  next.businesses = (next.businesses ?? []).map((item) =>
    item.id === shopId ? { ...item, notice: null, noticeId: null, stars: clampStar((item.stars ?? 3) + (drama?.stars ?? 0)), stock: shop.noticeId === "dumsor" ? Math.max(item.stock ?? 50, 40) : item.stock } : item,
  );
  const line = cost ? `You handled it at ${shopTitle(shop)}. ${cedis(cost)} left the wallet.` : `You answered ${shopTitle(shop)}. The day moves on.`;
  push(next, line);
  return { life: next, notes: [line] };
}

export function postShop(life: Life, shopId: string): StepResult {
  const shop = (life.businesses ?? []).find((item) => item.id === shopId);
  if (!shop) return { life, notes: [], error: "That shop is gone." };
  const next = cloneLife(life);
  next.needs.fun = Math.min(100, next.needs.fun + 4);
  next.businesses = (next.businesses ?? []).map((item) => (item.id === shopId ? { ...item, stars: clampStar((item.stars ?? 3) + 0.15) } : item));
  next.stats = { ...(next.stats ?? {}), clout: (next.stats?.clout ?? 0) + 1, posts: (next.stats?.posts ?? 0) + 1 };
  const line = `You posted ${shopTitle(shop)}. A few more people know the name.`;
  push(next, line);
  return { life: next, notes: [line] };
}

export function franchiseShop(life: Life, shopId: string): StepResult {
  const shop = (life.businesses ?? []).find((item) => item.id === shopId);
  if (!shop) return { life, notes: [], error: "That shop is gone." };
  if ((shop.stars ?? 3) < 4) return { life, notes: [], error: "The name needs 4 stars before someone else will run a branch." };
  if ((shop.branches ?? 0) >= 2) return { life, notes: [], error: "Two branches is enough until the books are boring." };
  const cost = Math.round(bizKind(shop.kind).price * 0.7);
  if (life.cash < cost) return { life, notes: [], error: `A branch costs ${cedis(cost)}.` };
  const next = cloneLife(life);
  next.cash -= cost;
  const city = shop.town === "kumasi" ? "Accra" : "Kumasi";
  next.businesses = (next.businesses ?? []).map((item) => (item.id === shopId ? { ...item, branches: (item.branches ?? 0) + 1 } : item));
  const line = `${shopTitle(shop)} has a branch in ${city}. Someone else runs the shift. The till still knows you.`;
  push(next, line);
  return { life: next, notes: [line] };
}

export function passShop(life: Life, shopId: string): StepResult {
  const shop = (life.businesses ?? []).find((item) => item.id === shopId);
  const child = life.kids?.[0];
  if (!shop) return { life, notes: [], error: "That shop is gone." };
  if (!child) return { life, notes: [], error: "There is no child in the house to put on the papers." };
  const next = cloneLife(life);
  next.businesses = (next.businesses ?? []).map((item) => (item.id === shopId ? { ...item, heir: child.name } : item));
  const line = `${shopTitle(shop)} will pass to ${child.name} when you say so. The papers have the name.`;
  push(next, line);
  return { life: next, notes: [line] };
}

export function pulseShops(life: Life, notes: string[]) {
  const day = dayOf(life.minutes);
  for (const shop of life.businesses ?? []) {
    if (shop.pulsedDay === day) continue;
    shop.pulsedDay = day;
    shop.stock = Math.max(0, (shop.stock ?? 80) - 8);
    if ((shop.stock ?? 0) < 25 && !shop.notice) {
      shop.notice = "Stock is running low.";
      shop.noticeId = "stock";
      notes.push(`${shopTitle(shop)}: stock is running low.`);
      continue;
    }
    if (shop.notice) continue;
    if (Math.random() > 0.22) continue;
    const event = DRAMA[day % DRAMA.length];
    shop.notice = event.line;
    shop.noticeId = event.id;
    shop.stars = clampStar((shop.stars ?? 3) + Math.min(0, event.stars));
    notes.push(`${shopTitle(shop)}: ${event.line}`);
  }
}
