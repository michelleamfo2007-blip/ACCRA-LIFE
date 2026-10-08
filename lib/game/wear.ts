import { SHOP, cedis, clone, dayIndex, type Life, type ShopItem, type StepResult } from "@/lib/game/world";

export type Cond = "new" | "like" | "good" | "fair" | "poor" | "broken";
export type Stall = "new" | "thrift" | "second" | "estate" | "repair";
export type Mend = "clean" | "polish" | "cloth" | "repair" | "collect" | "friend";

export type Goods = {
  cond: Cond;
  dust: number;
  since: number;
  back?: number;
  fix?: Cond;
  warranty?: number;
};

export const CONDS: { id: Cond; label: string; price: number; comfort: number }[] = [
  { id: "new", label: "New", price: 1, comfort: 1 },
  { id: "like", label: "Like new", price: 0.86, comfort: 0.95 },
  { id: "good", label: "Good", price: 0.64, comfort: 0.82 },
  { id: "fair", label: "Fair", price: 0.42, comfort: 0.62 },
  { id: "poor", label: "Poor", price: 0.24, comfort: 0.38 },
  { id: "broken", label: "Broken", price: 0.1, comfort: 0.12 },
];

export const STALLS: { id: Stall; label: string; note: string }[] = [
  { id: "new", label: "New", note: "Showroom price. No wear." },
  { id: "thrift", label: "Obroni wawu", note: "Very cheap. Mixed, and some of it is tired." },
  { id: "second", label: "Second-hand", note: "A furniture yard. Mostly fair." },
  { id: "estate", label: "Estate sale", note: "Somebody moved. You take what is left." },
  { id: "repair", label: "Repaired", note: "Fixed already, with a short warranty." },
];

const ORDER: Cond[] = ["new", "like", "good", "fair", "poor", "broken"];

export function condOf(id: Cond) {
  return CONDS.find((row) => row.id === id) ?? CONDS[0];
}

export function canWear(item: ShopItem) {
  return !item.consume && !item.stock && item.kind !== "floor" && item.kind !== "food" && item.kind !== "wall" && item.kind !== "jet" && item.kind !== "dog" && item.kind !== "cat" && item.kind !== "bird";
}

export function materialOf(kind: string, id: string) {
  if (kind === "plant" || /plant|flower/.test(id)) return "plant";
  if (kind === "rug" || kind === "curtain" || /kente|ankara|cloth|net|pillow/.test(id)) return "textile";
  if (kind === "sofa" || kind === "throne") return "fabric";
  if (kind === "tv" || /speaker|radio|transistor|laptop|fan|ac/.test(id) || kind === "fan" || kind === "ac") return "electric";
  if (kind === "tank" || /mirror|glass/.test(id)) return "glass";
  if (kind === "sink" || kind === "toilet" || /vase|pot|bowl/.test(id)) return "ceramic";
  if (kind === "fridge" || kind === "stove" || kind === "lamp" || kind === "weights" || kind === "vault") return "metal";
  if (kind === "table" || kind === "chair" || kind === "bed" || kind === "desk") return "wood";
  return "general";
}

export function wearLine(kind: string, id: string, cond: Cond) {
  const step = ORDER.indexOf(cond);
  if (step <= 0) return "";
  const mat = materialOf(kind, id);
  const lines: Record<string, string[]> = {
    wood: ["A faint scratch.", "The colour has faded.", "A water ring on the top.", "A chipped corner.", "A crack, and one leg wobbles."],
    fabric: ["The colour is a shade quieter.", "A worn patch.", "A stain that did not come out.", "The edge is fraying.", "A tear you can put a hand through."],
    textile: ["The print is softer.", "A loose thread.", "A sun-bleached strip.", "A small hole.", "The cloth is giving up."],
    metal: ["The shine is gone.", "A scratch.", "A dent.", "Paint peeling.", "Rust, and a missing cap."],
    glass: ["A smudge.", "A cloudy spot.", "A small crack.", "A chipped edge.", "A break that will not polish out."],
    ceramic: ["The glaze is dull.", "A stain inside.", "A chip on the lip.", "A crack.", "A piece is missing."],
    electric: ["A scratched case.", "Faded buttons.", "A dent.", "A missing knob.", "The screen is cracked."],
    plant: ["One yellow leaf.", "Dry soil.", "Brown leaves.", "A cracked pot.", "The stem is broken."],
    general: ["A little dust.", "Scuffed.", "Faded.", "Knocked about.", "Held together."],
  };
  return lines[mat][Math.min(step - 1, 4)] ?? "";
}

function hash(id: string) {
  let n = 0;
  for (const char of id) n = (n * 33 + char.charCodeAt(0)) % 997;
  return n;
}

export function shelfCond(stall: Stall, itemId: string): Cond {
  const n = hash(itemId);
  if (stall === "new") return "new";
  if (stall === "thrift") return (["fair", "poor", "broken", "fair", "poor"] as Cond[])[n % 5];
  if (stall === "second") return (["good", "fair", "fair", "good", "poor"] as Cond[])[n % 5];
  if (stall === "estate") return (["like", "good", "fair", "poor", "new"] as Cond[])[n % 5];
  return "good";
}

export function askPrice(item: ShopItem, cond: Cond, stall: Stall = "new") {
  const base = Math.max(5, Math.round(item.price * condOf(cond).price));
  return stall === "repair" ? Math.max(base, Math.round(item.price * 0.7)) : base;
}

export function goodsOf(life: Life, id: string): Goods {
  const row = life.goods?.[id];
  if (row) return row;
  if (id.startsWith("fix-")) return { cond: "good", dust: 2, since: life.minutes };
  return { cond: "new", dust: 0, since: life.minutes };
}

export function comfortOf(cond: Cond) {
  return condOf(cond).comfort;
}

function stepUp(cond: Cond, stops: Cond): Cond {
  const from = ORDER.indexOf(cond);
  const to = ORDER.indexOf(stops);
  return ORDER[Math.max(to, from - 1)] ?? cond;
}

function stepDown(cond: Cond): Cond {
  return ORDER[Math.min(ORDER.length - 1, ORDER.indexOf(cond) + 1)] ?? cond;
}

export function repairCap(item: ShopItem, cond: Cond): Cond {
  if (cond !== "broken") return "like";
  if (item.kind === "tv" || item.kind === "tank" || /mirror|glass/.test(item.id)) return "poor";
  return "good";
}

function ownedPiece(life: Life, id: string) {
  const item = SHOP.find((entry) => entry.id === id);
  if (!item || !canWear(item) || !life.inventory.includes(id)) return null;
  return item;
}

export function buyUsed(life: Life, itemId: string, stall: Stall): StepResult {
  if (stall === "new") return { life, notes: [], error: "That shelf sells it new." };
  const item = SHOP.find((entry) => entry.id === itemId);
  if (!item || !canWear(item)) return { life, notes: [], error: "That is not on this stall." };
  if (life.inventory.includes(item.id)) return { life, notes: [], error: "You already own that." };
  const cond = shelfCond(stall, item.id);
  const price = askPrice(item, cond, stall);
  if (life.cash < price) return { life, notes: [], error: "Not enough cedis." };
  const next = clone(life);
  next.cash -= price;
  next.inventory = [...next.inventory, item.id];
  next.goods = {
    ...(next.goods ?? {}),
    [item.id]: {
      cond,
      dust: cond === "new" ? 0 : 2,
      since: life.minutes,
      warranty: stall === "repair" ? life.minutes + 1440 * 10 : undefined,
    },
  };
  if (item.size !== "yard") {
    const n = (next.furniture ?? []).length;
    next.furniture = [...(next.furniture ?? []), { id: item.id, x: -1.4 + (n % 4) * 0.75, z: 0.35 + (n % 3) * 0.45, rot: 0 }];
  }
  const tag = cond === "broken" ? " Needs repair." : cond === "poor" ? " Sold as-is." : "";
  return { life: next, notes: [`${item.name}, ${condOf(cond).label.toLowerCase()}, for ${cedis(price)}.${tag}`] };
}

export function mendItem(life: Life, id: string, how: Mend): StepResult {
  const item = id.startsWith("fix-") ? null : ownedPiece(life, id);
  if (!id.startsWith("fix-") && !item) return { life, notes: [], error: "That is not yours." };
  const name = item?.name ?? (id === "fix-bed" ? "Bed" : id === "fix-sofa" ? "Sofa" : "That piece");
  const row = { ...goodsOf(life, id) };
  const price = item?.price ?? 180;
  const next = clone(life);
  const save = (note: string) => {
    next.goods = { ...(next.goods ?? {}), [id]: row };
    return { life: next, notes: [note] };
  };
  if (how === "collect") {
    if (!row.back) return { life, notes: [], error: "It is not at the shop." };
    if (life.minutes < row.back) return { life, notes: [], error: "Still with the carpenter." };
    row.cond = row.fix ?? "good";
    row.dust = 0;
    row.since = life.minutes;
    row.warranty = life.minutes + 1440 * 4;
    row.back = undefined;
    row.fix = undefined;
    return save(`${name} is back. ${condOf(row.cond).label}.`);
  }
  if (row.back && life.minutes < row.back) return { life, notes: [], error: "It is already at the shop." };
  if (how === "clean") {
    if (row.dust < 1) return { life, notes: [], error: "It is already clean." };
    if (life.cash < 5) return { life, notes: [], error: "Dusting cloth is ₵5." };
    next.cash -= 5;
    row.dust = 0;
    return save(`${name} is wiped down.`);
  }
  if (how === "friend") {
    const guest = (life.guests ?? []).find((person) => person.doing !== "leave" && person.doing !== "coming");
    if (!guest) return { life, notes: [], error: "Nobody is here to help." };
    if (ORDER.indexOf(row.cond) < ORDER.indexOf("fair")) return { life, notes: [], error: "Nothing here needs a friend." };
    row.cond = stepUp(row.cond, "good");
    row.dust = 0;
    next.relations = life.relations.map((person) => (person.name === guest.name ? { ...person, score: person.score + 6 } : person));
    return save(`${guest.name} helped with the ${name.toLowerCase()}.`);
  }
  if (how === "polish" || how === "cloth") {
    if (row.cond === "broken") return { life, notes: [], error: "That one needs the shop." };
    if (row.cond === "new" || row.cond === "like") return { life, notes: [], error: "It does not need that." };
    const fee = Math.max(how === "cloth" ? 15 : 10, Math.round(price * (how === "cloth" ? 0.18 : 0.08)));
    if (life.cash < fee) return { life, notes: [], error: `${cedis(fee)} for that.` };
    next.cash -= fee;
    row.cond = how === "cloth" ? (ORDER.indexOf(row.cond) >= ORDER.indexOf("poor") ? "good" : "like") : stepUp(row.cond, "like");
    row.dust = 0;
    return save(how === "cloth" ? `${name} is reupholstered.` : `${name} is refinished.`);
  }
  if (row.cond === "new" || row.cond === "like") return { life, notes: [], error: "Nothing to repair." };
  const sample = item ?? SHOP.find((entry) => entry.kind === "sofa") ?? SHOP[0];
  const cap = repairCap(sample, row.cond);
  const fee = Math.max(8, Math.round(price * ({ good: 0.08, fair: 0.16, poor: 0.28, broken: 0.45 }[row.cond as "good"] ?? 0.2)));
  if (life.cash < fee) return { life, notes: [], error: `The shop wants ${cedis(fee)}.` };
  const wait = row.cond === "broken" ? 4320 : row.cond === "poor" ? 2880 : 1440;
  next.cash -= fee;
  row.back = life.minutes + wait;
  row.fix = cap;
  const days = Math.max(1, Math.round(wait / 1440));
  return save(`${name} goes to the shop. Back in ${days} day${days === 1 ? "" : "s"}.`);
}

export function ageHome(life: Life, notes: string[]) {
  const ids = [...new Set([...(life.inventory ?? []), "fix-bed", "fix-sofa", "fix-fridge"])];
  const goods = { ...(life.goods ?? {}) };
  let changed = false;
  for (const id of ids) {
    const item = SHOP.find((entry) => entry.id === id);
    if (item && !canWear(item)) continue;
    if (!item && !id.startsWith("fix-")) continue;
    const row = { ...goodsOf(life, id) };
    const before = row.cond;
    row.dust = Math.min(8, row.dust + (dayIndex(life.minutes) % 7 === 0 ? 2 : 1));
    const held = life.minutes - row.since;
    const covered = row.warranty != null && life.minutes < row.warranty;
    if (!covered && !row.back && held > 1440 * 12 && ORDER.indexOf(row.cond) < ORDER.indexOf("fair") && dayIndex(life.minutes) % 12 === hash(id) % 12) {
      row.cond = stepDown(row.cond);
    }
    const mat = materialOf(item?.kind ?? "sofa", id);
    if (!covered && !row.back && (mat === "electric" || mat === "metal") && row.cond === "poor" && hash(id + String(dayIndex(life.minutes))) % 17 === 0) {
      row.cond = "broken";
    }
    if (row.cond !== before && row.cond === "broken" && item) notes.push(`${item.name} gave up.`);
    if (row.dust === 6 && item) notes.push(`${item.name} is gathering dust.`);
    goods[id] = row;
    changed = true;
  }
  if (changed) life.goods = goods;
}

export function homeWearTalk(life: Life, name: string) {
  const ids = life.inventory.filter((id) => {
    const item = SHOP.find((entry) => entry.id === id);
    return item && canWear(item);
  });
  const rows = ["fix-sofa", "fix-bed", ...ids].map((id) => ({ id, ...goodsOf(life, id) }));
  const dusty = rows.some((row) => row.dust >= 6);
  const worst = rows.slice().sort((a, b) => ORDER.indexOf(b.cond) - ORDER.indexOf(a.cond))[0];
  if (!worst) return null;
  const item = SHOP.find((entry) => entry.id === worst.id);
  const label = item?.name.toLowerCase() ?? (worst.id === "fix-sofa" ? "sofa" : "bed");
  if (worst.cond === "broken" || worst.cond === "poor") return `${name}: "Chale, your ${label} don tear. I know a carpenter."`;
  if (dusty) return `${name}: "This place look like nobody dey live here."`;
  if (worst.cond === "fair") return `${name}: "You need to fix that ${label}."`;
  if (rows.every((row) => row.cond === "new" || row.cond === "like") && rows.every((row) => row.dust < 2)) return `${name}: "Your place dey look nice — you take care of it."`;
  return null;
}

export function stallTag(cond: Cond) {
  if (cond === "broken") return "Needs repair";
  if (cond === "poor") return "Sold as-is";
  return "";
}
