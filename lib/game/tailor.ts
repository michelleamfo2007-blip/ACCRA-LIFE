import { OUTFITS, cedis, cloneLife, logLine, type Life, type Outfit, type StepResult } from "@/lib/game/world";

export type Style = { id: string; label: string; emoji: string; price: number; days: number; outfit: (typeof OUTFITS)[number]; pattern: string; rare: number; code?: "black-red" | "white" | "kente"; fixed?: string };

export const STYLES: Style[] = [
  { id: "ankara-shirt", label: "Ankara shirt", emoji: "👕", price: 180, days: 1, outfit: "Casual", pattern: "Ankara", rare: 1 },
  { id: "batik", label: "Batik shirt", emoji: "🎽", price: 220, days: 1, outfit: "Casual", pattern: "Tie-dye", rare: 1 },
  { id: "smock", label: "Fugu smock", emoji: "🧥", price: 320, days: 2, outfit: "Casual", pattern: "Kente", rare: 2 },
  { id: "kaba", label: "Kaba and slit", emoji: "👗", price: 380, days: 2, outfit: "Classic", pattern: "Ankara", rare: 2 },
  { id: "funeral-cloth", label: "Black and red funeral cloth", emoji: "🖤", price: 400, days: 2, outfit: "Classic", pattern: "Plain", rare: 2, code: "black-red", fixed: "#121212" },
  { id: "kaftan", label: "White kaftan", emoji: "🤍", price: 450, days: 2, outfit: "All-white", pattern: "Plain", rare: 2, code: "white", fixed: "#f7f4ef" },
  { id: "kente-stole", label: "Kente stole set", emoji: "🎓", price: 1200, days: 3, outfit: "Office", pattern: "Kente", rare: 3, code: "kente" },
  { id: "wedding-kente", label: "Wedding kente", emoji: "👑", price: 6000, days: 5, outfit: "Classic", pattern: "Kente", rare: 5, code: "kente" },
];

export const TAILOR_COLORS = ["#CE1126", "#FCD116", "#006B3F", "#121212", "#2f7de1", "#8b5cf6", "#ec4899", "#f59e42", "#f4efe6"];
export const MAX_ORDERS = 3;

const id = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function styleOf(styleId: string) {
  return STYLES.find((style) => style.id === styleId) ?? null;
}

function tailorOf(life: Life) {
  return life.tailor ?? { orders: [], wardrobe: [] };
}

export function orderStyle(life: Life, styleId: string, color: string): StepResult {
  const style = styleOf(styleId);
  if (!style) return { life, notes: [], error: "The seamstress does not sew that." };
  const tailor = tailorOf(life);
  if (tailor.orders.length >= MAX_ORDERS) return { life, notes: [], error: `She is already sewing ${MAX_ORDERS} pieces for you.` };
  if (life.cash < style.price) return { life, notes: [], error: `${style.label} costs ${cedis(style.price)}.` };
  const next = cloneLife(life);
  next.cash -= style.price;
  const shade = style.fixed ?? (TAILOR_COLORS.includes(color) ? color : TAILOR_COLORS[0]);
  next.tailor = { ...tailor, orders: [...tailor.orders, { id: id(), style: style.id, color: shade, readyAt: next.minutes + style.days * 1440 }] };
  return { life: next, notes: [`Measurements taken. ${style.label} ready in ${style.days} day${style.days > 1 ? "s" : ""}.`] };
}

export function collectOrder(life: Life, orderId: string): StepResult {
  const tailor = tailorOf(life);
  const order = tailor.orders.find((item) => item.id === orderId);
  if (!order) return { life, notes: [], error: "No order like that." };
  if (order.readyAt > life.minutes) return { life, notes: [], error: `Still on the machine. ${Math.ceil((order.readyAt - life.minutes) / 60)}h left.` };
  const style = styleOf(order.style);
  const next = cloneLife(life);
  const fit: Outfit = { style: order.style, color: order.color };
  const wardrobe = tailor.wardrobe.some((item) => item.style === fit.style && item.color === fit.color) ? tailor.wardrobe : [...tailor.wardrobe, fit];
  next.tailor = { orders: tailor.orders.filter((item) => item.id !== orderId), wardrobe };
  const line = `Collected your ${style?.label.toLowerCase() ?? "outfit"}. It fits like it was made for you, because it was.`;
  logLine(next, line);
  return { life: next, notes: [line] };
}

export function wearFit(life: Life, fit: Outfit): StepResult {
  const style = styleOf(fit.style);
  if (!style || !tailorOf(life).wardrobe.some((item) => item.style === fit.style && item.color === fit.color)) return { life, notes: [], error: "That is not in your wardrobe." };
  const next = cloneLife(life);
  next.look = { ...next.look, outfit: style.outfit, pattern: style.pattern, cloth: fit.color };
  next.needs.fun = Math.min(100, next.needs.fun + 4);
  return { life: next, notes: [`Wearing your ${style.label.toLowerCase()}.`] };
}

export function wardrobeValue(life: Life) {
  return tailorOf(life).wardrobe.reduce((sum, fit) => sum + (styleOf(fit.style)?.price ?? 0), 0);
}

export function dressedFor(life: Life, code: "black-red" | "white" | "kente" | "any") {
  if (code === "any") return true;
  const look = life.look;
  if (code === "white") return look.outfit === "All-white" || look.cloth === "#f7f4ef" || look.cloth === "#f4efe6";
  if (code === "kente") return look.pattern === "Kente";
  return look.cloth === "#121212" || look.cloth === "#CE1126" || look.cloth === "#1d2433" || look.cloth === "#e5484d";
}
