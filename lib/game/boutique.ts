import { townOf } from "@/lib/game/towns";
import { cedis, cloneLife, type Life, type StepResult } from "@/lib/game/world";

export type Tier = "street" | "mid" | "high" | "print" | "thrift";

export type RackItem = {
  id: string;
  label: string;
  brand: string;
  category: string;
  tier: Tier;
  price: number;
  outfit: string;
  cloth: string;
  pattern?: string;
  status: number;
  comfort: number;
  city?: string;
};

export const TIERS: Record<Tier, { label: string; spot: string; note: string }> = {
  street: { label: "Street boutique", spot: "osu-rails", note: "Oxford Street. Local cuts, small prices." },
  mid: { label: "Mall boutique", spot: "mall-rails", note: "Accra Mall. New clothes and imported basics." },
  high: { label: "Designer room", spot: "legon-rails", note: "East Legon. The tag is part of the outfit." },
  print: { label: "Print house", spot: "adum-print", note: "Adum. Kente, ankara, and a tailor in the back." },
  thrift: { label: "Obroni wawu", spot: "kantamanto", note: "Kantamanto. Dig, and sometimes you win." },
};

export const RACK: RackItem[] = [
  { id: "osu-tee", label: "Oxford Street tee", brand: "Circle Cut", category: "Tops", tier: "street", price: 40, outfit: "Casual", cloth: "#2f7de1", status: 1, comfort: 3 },
  { id: "osu-jeans", label: "Market jeans", brand: "Lane", category: "Bottoms", tier: "street", price: 70, outfit: "Casual", cloth: "#1d2433", status: 1, comfort: 2 },
  { id: "mall-shirt", label: "Pressed shirt", brand: "Ridge", category: "Tops", tier: "mid", price: 140, outfit: "Office", cloth: "#f4efe6", status: 2, comfort: 2 },
  { id: "mall-dress", label: "Saturday dress", brand: "Osu Line", category: "Dresses", tier: "mid", price: 180, outfit: "Classic", cloth: "#e5484d", status: 2, comfort: 2 },
  { id: "legon-suit", label: "Evening suit", brand: "Mensah", category: "Formal", tier: "high", price: 640, outfit: "Office", cloth: "#1d2433", status: 4, comfort: 1 },
  { id: "legon-white", label: "All-white set", brand: "Night", category: "Formal", tier: "high", price: 420, outfit: "All-white", cloth: "#f7f4ef", status: 4, comfort: 2 },
  { id: "adum-kente", label: "Kente cloth", brand: "Bonwire", category: "Print", tier: "print", price: 260, outfit: "Classic", cloth: "#c9a227", pattern: "Kente", status: 3, comfort: 2, city: "kumasi" },
  { id: "adum-ankara", label: "Ankara set", brand: "Adum", category: "Print", tier: "print", price: 190, outfit: "Classic", cloth: "#e5484d", pattern: "Ankara", status: 3, comfort: 3, city: "kumasi" },
  { id: "kanta-jacket", label: "Found jacket", brand: "Bale", category: "Tops", tier: "thrift", price: 25, outfit: "Casual", cloth: "#8b5cf6", status: 2, comfort: 2 },
  { id: "kanta-boots", label: "One-pair boots", brand: "Bale", category: "Shoes", tier: "thrift", price: 35, outfit: "Site work", cloth: "#5c3420", status: 1, comfort: 1 },
];

export const PRESET_SLOTS = ["work", "casual", "club", "church", "beach", "date", "traditional"] as const;

const CAP = 12;

export function tierOf(spotId: string): Tier | null {
  const found = (Object.keys(TIERS) as Tier[]).find((tier) => TIERS[tier].spot === spotId);
  return found ?? null;
}

export function rackFor(spotId: string, town = "accra") {
  const tier = tierOf(spotId);
  return RACK.filter((item) => {
    if (tier && item.tier !== tier) return false;
    if (item.city && item.city !== town) return false;
    return true;
  });
}

export function askPrice(life: Life, item: RackItem) {
  const index = townOf(life.town).priceIndex;
  return Math.max(5, Math.round(item.price * index));
}

function need(value: number) {
  return Math.max(0, Math.min(100, value));
}

export function buyGarment(life: Life, itemId: string): StepResult {
  const item = RACK.find((row) => row.id === itemId);
  if (!item) return { life, notes: [], error: "That piece is not on the rail." };
  const owned = life.wardrobe ?? [];
  if (owned.some((row) => row.id === item.id)) return { life, notes: [], error: "You already own that." };
  if (owned.length >= CAP) return { life, notes: [], error: "The wardrobe is full. Sell something first." };
  const price = askPrice(life, item);
  if (life.cash < price) return { life, notes: [], error: `MoMo cannot cover ${cedis(price)}.` };
  const next = cloneLife(life);
  next.cash -= price;
  next.wardrobe = [...owned, { id: item.id, label: item.label, outfit: item.outfit, cloth: item.cloth, pattern: item.pattern }];
  next.look = { ...next.look, outfit: item.outfit, cloth: item.cloth, pattern: item.pattern ?? next.look.pattern };
  next.needs.fun = need(next.needs.fun + item.comfort * 2);
  next.log = [`Bought ${item.label} for ${cedis(price)}.`, ...next.log].slice(0, 14);
  return { life: next, notes: [`${item.label} is in the bag. You are wearing it.`] };
}

export function wearGarment(life: Life, itemId: string): StepResult {
  const item = (life.wardrobe ?? []).find((row) => row.id === itemId);
  if (!item) return { life, notes: [], error: "That is not in the wardrobe." };
  const next = cloneLife(life);
  const repeat = next.look.outfit === item.outfit && next.look.cloth === item.cloth;
  next.look = { ...next.look, outfit: item.outfit, cloth: item.cloth, pattern: item.pattern ?? next.look.pattern };
  const note = repeat ? `You wore ${item.label} again. People notice.` : `${item.label} is on.`;
  next.log = [note, ...next.log].slice(0, 14);
  return { life: next, notes: [note] };
}

export function sellGarment(life: Life, itemId: string): StepResult {
  const item = RACK.find((row) => row.id === itemId);
  const owned = life.wardrobe ?? [];
  if (!owned.some((row) => row.id === itemId) || !item) return { life, notes: [], error: "Nothing to sell." };
  const back = Math.max(5, Math.round(askPrice(life, item) * 0.4));
  const next = cloneLife(life);
  next.cash += back;
  next.wardrobe = owned.filter((row) => row.id !== itemId);
  next.log = [`Sold ${item.label} for ${cedis(back)}.`, ...next.log].slice(0, 14);
  return { life: next, notes: [`The stall gave you ${cedis(back)} for ${item.label}.`] };
}

export function savePreset(life: Life, slot: string, itemId: string): StepResult {
  if (!(PRESET_SLOTS as readonly string[]).includes(slot)) return { life, notes: [], error: "That look has no name." };
  if (!(life.wardrobe ?? []).some((row) => row.id === itemId)) return { life, notes: [], error: "Buy it before you save it." };
  const next = cloneLife(life);
  next.outfits = { ...(next.outfits ?? {}), [slot]: itemId };
  return { life: next, notes: [`Saved for ${slot}.`] };
}

export function wearPreset(life: Life, slot: string): StepResult {
  const id = life.outfits?.[slot];
  if (!id) return { life, notes: [], error: `No ${slot} look saved yet.` };
  return wearGarment(life, id);
}

export function giftGarment(life: Life, itemId: string, name: string): StepResult {
  const owned = life.wardrobe ?? [];
  const item = owned.find((row) => row.id === itemId);
  if (!item) return { life, notes: [], error: "That is not yours to give." };
  const next = cloneLife(life);
  next.wardrobe = owned.filter((row) => row.id !== itemId);
  next.needs.social = need(next.needs.social + 10);
  const person = next.relations.find((row) => row.name === name);
  if (person) person.score = Math.min(100, person.score + 8);
  const note = `You gave ${item.label} to ${name}.`;
  next.log = [note, ...next.log].slice(0, 14);
  return { life: next, notes: [note] };
}

export function suggestSlot(kind: string) {
  if (kind === "club" || kind === "bar") return "club";
  if (kind === "worship") return "church";
  if (kind === "beach") return "beach";
  if (kind === "office" || kind === "court" || kind === "bank") return "work";
  if (kind === "chop") return "date";
  return "casual";
}
