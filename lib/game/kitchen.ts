import { bump, cedis, cloneLife, logLine, passTime, spotById, type ChopBar, type Life, type StepResult } from "@/lib/game/world";

export type Dish = { id: string; label: string; emoji: string; cost: number; fair: number; hunger: number };

export const DISHES: Dish[] = [
  { id: "waakye", label: "Waakye", emoji: "🍛", cost: 5, fair: 15, hunger: 36 },
  { id: "jollof", label: "Jollof and chicken", emoji: "🍗", cost: 8, fair: 22, hunger: 40 },
  { id: "banku", label: "Banku and tilapia", emoji: "🐟", cost: 12, fair: 35, hunger: 46 },
  { id: "fufu", label: "Fufu and light soup", emoji: "🍲", cost: 10, fair: 30, hunger: 48 },
  { id: "redred", label: "Red-red", emoji: "🫘", cost: 5, fair: 14, hunger: 34 },
  { id: "kenkey", label: "Kenkey and fish", emoji: "🌽", cost: 6, fair: 16, hunger: 38 },
  { id: "kelewele", label: "Kelewele", emoji: "🍌", cost: 3, fair: 10, hunger: 18 },
];

export const CHOP_OPEN = 3500;
export const MENU_MAX = 4;
export const COOK_MAX = 3;
export const COOK_FEE = 200;
export const COOK_WAGE = 80;
export const STOCK_MAX = 120;
export const SERVE_HOURS = 24;
const COOK_NAMES = ["Auntie Akos", "Maame Dede", "Brother Kwesi", "Sister Afi", "Auntie Mansa", "Uncle Teye", "Naa Adjeley", "Yaa Pokua"];

export function dishOf(id: string) {
  return DISHES.find((dish) => dish.id === id) ?? null;
}

export function priceRange(dish: Dish) {
  return { min: Math.ceil(dish.fair * 0.5), max: dish.fair * 3 };
}

export function batchSize(chop: ChopBar) {
  return 20 + 10 * chop.cooks.length;
}

export function batchCost(chop: ChopBar, dish: Dish) {
  return dish.cost * batchSize(chop);
}

export function stars(chop: ChopBar) {
  return Math.max(0, Math.min(5, chop.rating / 10));
}

function demand(price: number, dish: Dish) {
  return Math.max(0.15, Math.min(1.1, 1.5 - price / dish.fair));
}

export type Sales = { sold: Record<string, number>; revenue: number; wages: number; hours: number; empty: string[] };

export function salesOf(life: Life): Sales {
  const chop = life.chop;
  const out: Sales = { sold: {}, revenue: 0, wages: 0, hours: 0, empty: [] };
  if (!chop) return out;
  const hours = Math.min(SERVE_HOURS, Math.max(0, life.minutes - chop.lastServe) / 60);
  out.hours = hours;
  out.wages = Math.round((chop.cooks.length * COOK_WAGE * Math.min(3 * 1440, Math.max(0, life.minutes - chop.lastWages))) / 1440);
  if (!chop.menu.length) return out;
  const rate = 0.6 + 0.8 * chop.cooks.length + chop.rating / 50;
  for (const item of chop.menu) {
    const dish = dishOf(item.dish);
    if (!dish) continue;
    const stock = chop.stock[item.dish] ?? 0;
    const wanted = Math.floor((hours * rate * demand(item.price, dish)) / Math.max(1, chop.menu.length));
    const sold = Math.min(stock, wanted);
    if (sold > 0) out.sold[item.dish] = sold;
    if (wanted > stock) out.empty.push(dish.label);
    out.revenue += sold * item.price;
  }
  return out;
}

function withChop(life: Life, change: (chop: ChopBar) => ChopBar): Life {
  const next = cloneLife(life);
  next.chop = change({ ...life.chop!, menu: life.chop!.menu.map((item) => ({ ...item })), stock: { ...life.chop!.stock }, cooks: life.chop!.cooks.map((cook) => ({ ...cook })) });
  return next;
}

export function openChop(life: Life, name: string): StepResult {
  if (life.chop) return { life, notes: [], error: "You already run a chop bar." };
  const title = name.trim().replace(/\s+/g, " ").slice(0, 28);
  if (title.length < 3) return { life, notes: [], error: "Give the chop bar a name." };
  const spot = spotById(life.where);
  if (life.where === "home" || spot.id !== life.where || spot.far || spot.soon) return { life, notes: [], error: "Go to the spot in Accra where you want to open." };
  if (life.cash < CHOP_OPEN) return { life, notes: [], error: `Pots, benches and a licence cost ${cedis(CHOP_OPEN)}.` };
  const next = cloneLife(life);
  next.cash -= CHOP_OPEN;
  next.chop = { name: title, spot: spot.id, openedAt: life.minutes, menu: [], stock: {}, cooks: [], lastServe: life.minutes, lastWages: life.minutes, rating: 30, served: 0 };
  const line = `${title} is open at ${spot.name}. Put something on the menu and start cooking.`;
  logLine(next, line);
  return { life: next, notes: [line] };
}

export function setDish(life: Life, dishId: string, price: number | null): StepResult {
  const chop = life.chop;
  const dish = dishOf(dishId);
  if (!chop || !dish) return { life, notes: [], error: "Open a chop bar first." };
  const settled = collectFirst(life);
  const on = chop.menu.some((item) => item.dish === dishId);
  if (price == null) {
    if (!on) return { life, notes: [], error: "That dish is not on the menu." };
    return { life: withChop(settled, (bar) => ({ ...bar, menu: bar.menu.filter((item) => item.dish !== dishId) })), notes: [`${dish.label} is off the menu.`] };
  }
  const range = priceRange(dish);
  const value = Math.round(price);
  if (!Number.isFinite(value) || value < range.min || value > range.max) return { life, notes: [], error: `Price ${dish.label.toLowerCase()} between ${cedis(range.min)} and ${cedis(range.max)}.` };
  if (!on && chop.menu.length >= MENU_MAX) return { life, notes: [], error: `The menu board fits ${MENU_MAX} dishes.` };
  return {
    life: withChop(settled, (bar) => ({ ...bar, menu: on ? bar.menu.map((item) => (item.dish === dishId ? { ...item, price: value } : item)) : [...bar.menu, { dish: dishId, price: value }] })),
    notes: [`${dish.label}: ${cedis(value)} a plate.`],
  };
}

export function cookBatch(life: Life, dishId: string): StepResult {
  const chop = life.chop;
  const dish = dishOf(dishId);
  if (!chop || !dish) return { life, notes: [], error: "Open a chop bar first." };
  if (!chop.menu.some((item) => item.dish === dishId)) return { life, notes: [], error: "Put it on the menu first." };
  const here = life.where === chop.spot;
  if (!here && !chop.cooks.length) return { life, notes: [], error: `Go to ${spotById(chop.spot).name} to cook, or hire a cook.` };
  const size = batchSize(chop);
  const stock = chop.stock[dishId] ?? 0;
  if (stock + size > STOCK_MAX) return { life, notes: [], error: `The pots are full. ${stock} plates are still waiting.` };
  const cost = batchCost(chop, dish);
  const settled = collectFirst(life);
  if (settled.cash < cost) return { life, notes: [], error: `Ingredients for ${size} plates cost ${cedis(cost)}.` };
  const base = here ? passTime(cloneLife(settled), 60).life : cloneLife(settled);
  base.cash -= cost;
  const skill = base.skills.cooking;
  const lift = here ? (Math.random() < 0.3 + skill * 0.05 ? 2 : 0) : Math.random() < 0.2 ? 1 : 0;
  const next = withChop(base, (bar) => ({ ...bar, stock: { ...bar.stock, [dishId]: (bar.stock[dishId] ?? 0) + size }, rating: Math.min(50, bar.rating + lift) }));
  if (here) {
    next.skills.cooking = Math.min(10, next.skills.cooking + (Math.random() < 0.3 ? 1 : 0));
    next.needs.energy = Math.max(0, next.needs.energy - 10);
    next.needs.hygiene = Math.max(0, next.needs.hygiene - 8);
    bump(next, "cooked");
  }
  return { life: next, notes: [`${size} plates of ${dish.label.toLowerCase()} ready${here ? "" : `. ${chop.cooks[0].name} did the cooking`}.`] };
}

function collectFirst(life: Life) {
  const sales = salesOf(life);
  return sales.revenue > 0 || sales.wages > 0 ? collectChop(life).life : life;
}

export function collectChop(life: Life): StepResult {
  const chop = life.chop;
  if (!chop) return { life, notes: [], error: "Open a chop bar first." };
  const sales = salesOf(life);
  if (sales.revenue < 1 && sales.wages < 1 && sales.hours < 1) return { life, notes: [], error: "Customers are still coming in. Check back later." };
  const sold = Object.values(sales.sold).reduce((sum, n) => sum + n, 0);
  const fair = chop.menu.length ? chop.menu.reduce((sum, item) => sum + item.price / (dishOf(item.dish)?.fair ?? item.price), 0) / chop.menu.length : 1;
  const change = (fair <= 1 ? 2 : fair >= 1.4 ? -3 : 0) - (sales.empty.length ? 1 : 0);
  const next = withChop(life, (bar) => {
    const stock = { ...bar.stock };
    for (const [dish, n] of Object.entries(sales.sold)) stock[dish] = Math.max(0, (stock[dish] ?? 0) - n);
    return { ...bar, stock, lastServe: life.minutes, lastWages: life.minutes, served: bar.served + sold, rating: Math.max(0, Math.min(50, bar.rating + (sold ? change : 0))) };
  });
  next.cash += sales.revenue - sales.wages;
  const parts = [`${sold} plates sold for ${cedis(sales.revenue)}`];
  if (sales.wages) parts.push(`cooks paid ${cedis(sales.wages)}`);
  if (sales.empty.length) parts.push(`ran out of ${sales.empty.join(", ").toLowerCase()}`);
  const line = `${chop.name}: ${parts.join(", ")}.`;
  if (sales.revenue >= 200) logLine(next, line);
  return { life: next, notes: [line] };
}

export function hireCook(life: Life): StepResult {
  const chop = life.chop;
  if (!chop) return { life, notes: [], error: "Open a chop bar first." };
  if (chop.cooks.length >= COOK_MAX) return { life, notes: [], error: `The kitchen fits ${COOK_MAX} cooks.` };
  const settled = collectFirst(life);
  if (settled.cash < COOK_FEE) return { life, notes: [], error: `Bringing a cook on costs ${cedis(COOK_FEE)}.` };
  const taken = new Set(chop.cooks.map((cook) => cook.name));
  const name = COOK_NAMES.find((item) => !taken.has(item)) ?? `Cook ${chop.cooks.length + 1}`;
  const next = withChop(settled, (bar) => ({ ...bar, cooks: [...bar.cooks, { id: `${life.minutes}-${bar.cooks.length}`, name, hired: life.minutes }] }));
  next.cash -= COOK_FEE;
  return { life: next, notes: [`${name} joins the kitchen. ${cedis(COOK_WAGE)} a day.`] };
}

export function fireCook(life: Life, cookId: string): StepResult {
  const chop = life.chop;
  const cook = chop?.cooks.find((item) => item.id === cookId);
  if (!chop || !cook) return { life, notes: [], error: "That cook has already gone." };
  const settled = collectFirst(life);
  return { life: withChop(settled, (bar) => ({ ...bar, cooks: bar.cooks.filter((item) => item.id !== cookId) })), notes: [`${cook.name} has left the kitchen.`] };
}

export function closeChop(life: Life): StepResult {
  if (!life.chop) return { life, notes: [], error: "You do not run a chop bar." };
  const settled = collectFirst(life);
  const next = cloneLife(settled);
  const value = Math.round(CHOP_OPEN * 0.5);
  const name = life.chop.name;
  next.cash += value;
  next.chop = null;
  const line = `You sold ${name} and the pots for ${cedis(value)}.`;
  logLine(next, line);
  return { life: next, notes: [line] };
}

export function chopSign(life: Life) {
  const chop = life.chop;
  if (!chop) return null;
  return { name: chop.name, spot: chop.spot, menu: chop.menu.filter((item) => (chop.stock[item.dish] ?? 0) > 0).map((item) => ({ dish: item.dish, price: item.price })) };
}
