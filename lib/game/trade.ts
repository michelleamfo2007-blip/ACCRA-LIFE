import { BUSINESSES, MAX_BIZ_LEVEL, TILL_HOURS, bizKind, bizRate } from "@/lib/game/biz-table";
import { cedis, spotById, type Life, type StepResult } from "@/lib/game/world";

function copy(life: Life): Life {
  return {
    ...life,
    log: [...life.log],
    inbox: [...life.inbox],
    businesses: (life.businesses ?? []).map((shop) => ({ ...shop })),
    bag: Object.fromEntries(Object.entries(life.bag ?? {}).map(([id, lot]) => [id, { ...lot }])),
    soldToday: life.soldToday ? { day: life.soldToday.day, spots: { ...life.soldToday.spots } } : undefined,
  };
}

function note(life: Life, line: string) {
  life.log = [line, ...life.log].slice(0, 14);
}

export function tillOf(life: Life, shopId: string) {
  const shop = (life.businesses ?? []).find((item) => item.id === shopId);
  if (!shop) return 0;
  const hours = Math.min(TILL_HOURS, Math.max(0, life.minutes - shop.lastCollect) / 60);
  return Math.floor(hours * bizRate(shop.kind, shop.level));
}

export function buyBusiness(life: Life, kind: string): StepResult {
  const plan = BUSINESSES.find((item) => item.id === kind);
  if (!plan) return { life, notes: [], error: "That business is not for sale." };
  if ((life.businesses ?? []).some((shop) => shop.kind === kind)) return { life, notes: [], error: `You already run a ${plan.label.toLowerCase()}.` };
  if (life.cash < plan.price) return { life, notes: [], error: `You need ${cedis(plan.price)} to open a ${plan.label.toLowerCase()}.` };
  const next = copy(life);
  next.cash -= plan.price;
  next.businesses = [...(next.businesses ?? []), { id: `${kind}-${life.minutes}`, kind, openedAt: life.minutes, lastCollect: life.minutes, level: 1 }];
  const line = `You opened a ${plan.label.toLowerCase()} in ${plan.area}. Staff start today.`;
  note(next, line);
  return { life: next, notes: [line] };
}

export function collectTill(life: Life, shopId: string): StepResult {
  const shop = (life.businesses ?? []).find((item) => item.id === shopId);
  if (!shop) return { life, notes: [], error: "That shop is gone." };
  const earned = tillOf(life, shopId);
  if (earned < 1) return { life, notes: [], error: "The till is still empty. Come back later." };
  const next = copy(life);
  next.cash += earned;
  next.businesses = (next.businesses ?? []).map((item) => (item.id === shopId ? { ...item, lastCollect: life.minutes } : item));
  const line = `You collected ${cedis(earned)} from the ${bizKind(shop.kind).label.toLowerCase()}.`;
  note(next, line);
  return { life: next, notes: [line] };
}

export function upgradeCost(kind: string, level: number) {
  return Math.round(bizKind(kind).price * 0.8 * level);
}

export function upgradeBusiness(life: Life, shopId: string): StepResult {
  const shop = (life.businesses ?? []).find((item) => item.id === shopId);
  if (!shop) return { life, notes: [], error: "That shop is gone." };
  if (shop.level >= MAX_BIZ_LEVEL) return { life, notes: [], error: "It is already the best on the street." };
  const cost = upgradeCost(shop.kind, shop.level);
  if (life.cash < cost) return { life, notes: [], error: `The upgrade costs ${cedis(cost)}.` };
  const settled = tillOf(life, shopId) > 0 ? collectTill(life, shopId).life : life;
  const next = copy(settled);
  next.cash -= cost;
  next.businesses = (next.businesses ?? []).map((item) => (item.id === shopId ? { ...item, level: item.level + 1 } : item));
  const line = `The ${bizKind(shop.kind).label.toLowerCase()} is bigger now. More customers, more staff.`;
  note(next, line);
  return { life: next, notes: [line] };
}

export function sellBusiness(life: Life, shopId: string): StepResult {
  const shop = (life.businesses ?? []).find((item) => item.id === shopId);
  if (!shop) return { life, notes: [], error: "That shop is gone." };
  const settled = tillOf(life, shopId) > 0 ? collectTill(life, shopId).life : life;
  const next = copy(settled);
  const value = Math.round(bizKind(shop.kind).price * 0.6);
  next.cash += value;
  next.businesses = (next.businesses ?? []).filter((item) => item.id !== shopId);
  const line = `You sold the ${bizKind(shop.kind).label.toLowerCase()} for ${cedis(value)}.`;
  note(next, line);
  return { life: next, notes: [line] };
}

export type Good = { id: string; label: string; emoji: string; base: number; food?: boolean; farm?: boolean };

export const GOODS: Good[] = [
  { id: "tomatoes", label: "Crate of tomatoes", emoji: "🍅", base: 60, food: true },
  { id: "shito", label: "Jars of shito", emoji: "🫙", base: 25, food: true },
  { id: "shea", label: "Shea butter", emoji: "🧴", base: 35, food: true },
  { id: "cases", label: "Phone cases", emoji: "📱", base: 40 },
  { id: "ankara", label: "Ankara bundle", emoji: "🧵", base: 120 },
  { id: "kente", label: "Kente strip", emoji: "🟨", base: 300 },
  { id: "pepper", label: "Basket of pepper", emoji: "🌶️", base: 30, food: true, farm: true },
  { id: "okro", label: "Bag of okro", emoji: "🌿", base: 22, food: true, farm: true },
  { id: "garden-eggs", label: "Garden eggs", emoji: "🍆", base: 26, food: true, farm: true },
  { id: "plantain", label: "Bunch of plantain", emoji: "🍌", base: 45, food: true, farm: true },
];

export const BAG_LIMIT = 10;

const SUPPLY = new Set(["makola", "osu-night-market"]);
const RICH = new Set(["mall", "hotel", "kempinski", "movenpick", "polo-club", "golf", "skybar25", "mad-club"]);

function seed(text: string) {
  let hash = 2166136261;
  for (const char of text) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b);
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35);
  hash ^= hash >>> 16;
  return (hash >>> 0) / 4294967295;
}

function today(life: Life) {
  return Math.floor(life.minutes / 1440);
}

export function isSupply(spotId: string) {
  return SUPPLY.has(spotId);
}

export function buyPrice(good: Good, spotId: string, day: number) {
  if (good.farm || !SUPPLY.has(spotId) || (spotId !== "makola" && !good.food)) return null;
  const factor = (spotId === "makola" ? 0.68 : 0.82) + seed(`buy-${good.id}-${spotId}-${day}`) * 0.14;
  return Math.max(1, Math.round(good.base * factor));
}

export function sellPrice(life: Life, good: Good, spotId: string) {
  if (spotId === "home" || SUPPLY.has(spotId)) return null;
  const day = today(life);
  const factor = 0.86 + seed(`sell-${good.id}-${spotId}-${day}`) * 0.32 + (RICH.has(spotId) && !good.food ? 0.08 : 0);
  const sold = life.soldToday?.day === day ? (life.soldToday.spots[spotId] ?? 0) : 0;
  const crowd = Math.max(0.8, 1 - sold * 0.04);
  return Math.max(1, Math.round(good.base * factor * crowd));
}

export function bagCount(life: Life) {
  return Object.values(life.bag ?? {}).reduce((sum, lot) => sum + lot.qty, 0);
}

export function buyGood(life: Life, goodId: string): StepResult {
  const good = GOODS.find((item) => item.id === goodId);
  const price = good ? buyPrice(good, life.where, today(life)) : null;
  if (!good || price == null) return { life, notes: [], error: "Nobody sells that here. Try Makola." };
  if (bagCount(life) >= BAG_LIMIT) return { life, notes: [], error: `Your bag holds ${BAG_LIMIT}. Sell something first.` };
  if (life.cash < price) return { life, notes: [], error: `You need ${cedis(price)}.` };
  const next = copy(life);
  const lot = next.bag?.[goodId] ?? { qty: 0, paid: 0 };
  next.cash -= price;
  next.bag = { ...next.bag, [goodId]: { qty: lot.qty + 1, paid: lot.paid + price } };
  return { life: next, notes: [`Bought ${good.label.toLowerCase()} for ${cedis(price)}.`] };
}

export function sellGood(life: Life, goodId: string): StepResult {
  const good = GOODS.find((item) => item.id === goodId);
  const lot = life.bag?.[goodId];
  if (!good || !lot || lot.qty < 1) return { life, notes: [], error: "Nothing like that in your bag." };
  const price = sellPrice(life, good, life.where);
  if (price == null) return { life, notes: [], error: life.where === "home" ? "Nobody is buying in your room." : "Traders here are selling, not buying. Take it across town." };
  const next = copy(life);
  const day = today(life);
  const average = lot.paid / lot.qty;
  next.cash += price;
  const rest = lot.qty - 1;
  const bag = { ...next.bag };
  if (rest > 0) bag[goodId] = { qty: rest, paid: Math.round(lot.paid - average) };
  else delete bag[goodId];
  next.bag = bag;
  const spots = next.soldToday?.day === day ? { ...next.soldToday.spots } : {};
  spots[life.where] = (spots[life.where] ?? 0) + 1;
  next.soldToday = { day, spots };
  const gain = Math.round(price - average);
  const line = `Sold ${good.label.toLowerCase()} at ${spotById(life.where).name} for ${cedis(price)} (${gain >= 0 ? "+" : ""}${cedis(gain)}).`;
  if (Math.abs(gain) >= 40) note(next, line);
  return { life: next, notes: [line] };
}
