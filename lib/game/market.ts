import { STAGES } from "@/lib/game/estate";
import { carOf } from "@/lib/game/garage";
import type { ListingKind, PostKind } from "@/lib/game/net";
import { styleOf } from "@/lib/game/tailor";
import { BAG_LIMIT, GOODS, bagCount } from "@/lib/game/trade";
import { SHOP, homeById, type Life } from "@/lib/game/world";

export type Sellable = { kind: ListingKind; ref: string; label: string; emoji: string; max: number; hint: number };

const ITEM_EMOJI: Record<string, string> = { sleep: "🛏️", kitchen: "🍳", bath: "🛁", comfort: "🛋️", fun: "🎮", skills: "📚", light: "💡", decor: "🖼️", pets: "🐾", luxury: "💎", design: "🧵" };

function itemOf(id: string) {
  const item = SHOP.find((entry) => entry.id === id);
  return item && !item.consume && item.kind !== "floor" ? item : null;
}

export function sellables(life: Life): Sellable[] {
  const items = life.inventory.flatMap((id) => {
    const item = itemOf(id);
    return item ? [{ kind: "item" as const, ref: id, label: item.name, emoji: ITEM_EMOJI[item.category] ?? "📦", max: 1, hint: Math.round(item.price * 0.75) }] : [];
  });
  const goods = Object.entries(life.bag ?? {}).flatMap(([id, lot]) => {
    const good = GOODS.find((entry) => entry.id === id);
    return good && lot.qty > 0 ? [{ kind: "good" as const, ref: id, label: good.label, emoji: good.emoji, max: lot.qty, hint: good.base }] : [];
  });
  const fits = (life.tailor?.wardrobe ?? []).flatMap((fit) => {
    const style = styleOf(fit.style);
    return style ? [{ kind: "fit" as const, ref: `${fit.style}|${fit.color}`, label: style.label, emoji: style.emoji, max: 1, hint: Math.round(style.price * 0.8) }] : [];
  });
  return [...items, ...goods, ...fits];
}

export function takeOut(life: Life, kind: ListingKind, ref: string, qty: number): Life | string {
  if (kind === "item") {
    if (!itemOf(ref) || !life.inventory.includes(ref)) return "You do not own that.";
    return { ...life, inventory: life.inventory.filter((id) => id !== ref), furniture: (life.furniture ?? []).filter((piece) => piece.id !== ref), stored: (life.stored ?? []).filter((id) => id !== ref) };
  }
  if (kind === "good") {
    const lot = life.bag?.[ref];
    if (!lot || lot.qty < qty) return "Not enough of that in your bag.";
    const bag = { ...life.bag };
    const rest = lot.qty - qty;
    if (rest > 0) bag[ref] = { qty: rest, paid: Math.round((lot.paid / lot.qty) * rest) };
    else delete bag[ref];
    return { ...life, bag };
  }
  const [style, color] = ref.split("|");
  const wardrobe = life.tailor?.wardrobe ?? [];
  if (!wardrobe.some((fit) => fit.style === style && fit.color === color)) return "That is not in your wardrobe.";
  return { ...life, tailor: { orders: life.tailor?.orders ?? [], wardrobe: wardrobe.filter((fit) => !(fit.style === style && fit.color === color)) } };
}

export function putIn(life: Life, kind: ListingKind, ref: string, qty: number, paid: number): Life | string {
  if (kind === "item") {
    if (!itemOf(ref)) return "That item no longer exists.";
    if (life.inventory.includes(ref)) return "You already own one of those.";
    return { ...life, inventory: [...life.inventory, ref], stored: [...new Set([...(life.stored ?? []), ref])] };
  }
  if (kind === "good") {
    if (!GOODS.some((good) => good.id === ref)) return "That good no longer exists.";
    if (bagCount(life) + qty > BAG_LIMIT) return `Your bag holds ${BAG_LIMIT}. Make room first.`;
    const lot = life.bag?.[ref] ?? { qty: 0, paid: 0 };
    return { ...life, bag: { ...life.bag, [ref]: { qty: lot.qty + qty, paid: lot.paid + paid } } };
  }
  const [style, color] = ref.split("|");
  if (!styleOf(style)) return "That style no longer exists.";
  const wardrobe = life.tailor?.wardrobe ?? [];
  if (wardrobe.some((fit) => fit.style === style && fit.color === color)) return "You already have that exact fit.";
  return { ...life, tailor: { orders: life.tailor?.orders ?? [], wardrobe: [...wardrobe, { style, color }] } };
}

export function postSnap(life: Life, kind: PostKind) {
  switch (kind) {
    case "house": {
      const placed = (life.furniture ?? []).length;
      const houses = (life.plots ?? []).filter((plot) => plot.stage >= STAGES.length - 1).length;
      return `🏠 ${homeById(life.homeId).name} · ${placed} ${placed === 1 ? "piece" : "pieces"} placed${houses ? ` · ${houses} finished ${houses === 1 ? "house" : "houses"}` : ""}`;
    }
    case "outfit": {
      const fits = life.tailor?.wardrobe.length ?? 0;
      return `👗 ${life.look.outfit} · ${life.look.pattern}${fits ? ` · ${fits} tailored ${fits === 1 ? "fit" : "fits"}` : ""}`;
    }
    case "car": {
      const car = carOf(life.car?.id);
      const fleet = (life.fleet ?? []).length;
      return car ? `${car.emoji} ${car.label}${fleet ? ` · fleet of ${fleet}` : ""}` : fleet ? `🚐 Fleet of ${fleet}` : "🚶 On foot for now";
    }
    case "team": {
      const team = life.team;
      return team ? `⚽ ${team.name} · ${team.wins}W ${team.draws}D ${team.losses}L · ${team.trophies} 🏆` : "⚽ Looking for a team";
    }
    case "harvest": {
      const farm = ["pepper", "okro", "garden-eggs", "plantain", "eggs"].reduce((sum, id) => sum + (life.bag?.[id]?.qty ?? 0), 0);
      const hens = (life.pets ?? []).filter((pet) => pet.kind === "chicken").length;
      return `🧺 ${farm} ${farm === 1 ? "basket" : "baskets"} from the farm${hens ? ` · ${hens} laying hens` : ""}`;
    }
    default:
      return "";
  }
}
