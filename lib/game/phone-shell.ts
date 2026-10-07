import type { Weather } from "@/lib/game/sky";
import { alertsFor, type Alert } from "@/lib/game/alerts";
import { cloneLife, homeById, hourOf, moodOf, type Life, type StepResult } from "@/lib/game/world";

export type PhoneModel = "basic" | "smart" | "pro";

export type PhoneState = {
  /** "auto" follows time, weather, and where you are. */
  wallpaper: string;
  airtime: number;
  battery: number;
  model: PhoneModel;
  ringtone: string;
  hidden: string[];
  lostUntil?: number;
  snatchedDay?: number;
};

export type Wallpaper = {
  id: string;
  name: string;
  lucide: string;
  from: string;
  via: string;
  to: string;
  unlock: (life: Life) => boolean;
  hint: string;
};

export type TodayCard = {
  id: string;
  app: string;
  kicker: string;
  title: string;
  detail: string;
};

export type PhoneAppDef = {
  id: string;
  name: string;
  lucide: string;
  tint: string;
};

export const PHONE_APPS: PhoneAppDef[] = [
  { id: "alerts", name: "Alerts", lucide: "bell", tint: "#243044" },
  { id: "messages", name: "Messages", lucide: "message-circle", tint: "#5b8def" },
  { id: "calls", name: "Calls", lucide: "phone", tint: "#25d366" },
  { id: "memories", name: "Memories", lucide: "book-open", tint: "#7a3b0c" },
  { id: "work", name: "Jobs", lucide: "briefcase", tint: "#006B3F" },
  { id: "momo", name: "MoMo", lucide: "wallet", tint: "#f5c542" },
  { id: "bank", name: "Bank", lucide: "landmark", tint: "#0b3d6b" },
  { id: "trade", name: "Buy", lucide: "shopping-bag", tint: "#0f766e" },
  { id: "map", name: "Map", lucide: "map", tint: "#1f7a4d" },
  { id: "feed", name: "Social", lucide: "camera", tint: "#c2185b" },
  { id: "radio", name: "Music", lucide: "disc-3", tint: "#1c1c1c" },
  { id: "photos", name: "Photos", lucide: "image", tint: "#c45c9a" },
  { id: "biz", name: "Business", lucide: "store", tint: "#121212" },
  { id: "contacts", name: "Contacts", lucide: "contact", tint: "#7a5af5" },
  { id: "settings", name: "Settings", lucide: "settings", tint: "#e7edf5" },
  { id: "house", name: "Home", lucide: "home", tint: "#0b3d6b" },
  { id: "stories", name: "Stories", lucide: "book", tint: "#5c2a86" },
  { id: "goals", name: "Dream", lucide: "star", tint: "#f08a3c" },
  { id: "family", name: "Family", lucide: "users", tint: "#e88bbf" },
  { id: "pets", name: "Pets", lucide: "paw-print", tint: "#8a5a2b" },
  { id: "health", name: "Health", lucide: "heart-pulse", tint: "#0e7c6b" },
  { id: "school", name: "School", lucide: "graduation-cap", tint: "#1f4e8c" },
  { id: "garage", name: "Car", lucide: "car", tint: "#243044" },
  { id: "trips", name: "Travel", lucide: "luggage", tint: "#8a4b1c" },
  { id: "delivery", name: "Delivery", lucide: "bike", tint: "#CE1126" },
  { id: "boutique", name: "Fashion", lucide: "shirt", tint: "#c45c9a" },
];

export const WALLPAPERS: Wallpaper[] = [
  { id: "auto", name: "Live", lucide: "sun-moon", from: "#5b4bdb", via: "#c45c9a", to: "#f6c15a", unlock: () => true, hint: "Follows the hour, the sky, and the city." },
  { id: "morning", name: "Morning", lucide: "sunrise", from: "#f6d7a8", via: "#f08a3c", to: "#c45c26", unlock: () => true, hint: "Always open." },
  { id: "day", name: "Day", lucide: "sun", from: "#5b4bdb", via: "#7a6cf0", to: "#f6c15a", unlock: () => true, hint: "Always open." },
  { id: "evening", name: "Evening", lucide: "sunset", from: "#c45c9a", via: "#7a3b6b", to: "#2a1a4a", unlock: () => true, hint: "Always open." },
  { id: "night", name: "Night", lucide: "moon", from: "#0c1220", via: "#1a2744", to: "#243044", unlock: () => true, hint: "Always open." },
  { id: "rain", name: "Rain", lucide: "cloud-rain", from: "#3d4c5c", via: "#1a2744", to: "#0e7490", unlock: () => true, hint: "Always open." },
  { id: "harmattan", name: "Harmattan", lucide: "wind", from: "#e6d3a8", via: "#c4a574", to: "#8a6a3b", unlock: () => true, hint: "Always open." },
  { id: "beach", name: "Labadi", lucide: "waves", from: "#0e7490", via: "#1a6b8a", to: "#f4e3c4", unlock: (life) => life.where === "beach" || life.where === "bojo" || (life.stamps ?? []).length > 0, hint: "Stand on a beach, or take a trip." },
  { id: "club", name: "Night out", lucide: "music", from: "#3b0764", via: "#c2185b", to: "#121212", unlock: (life) => (life.stats?.posts ?? 0) > 0 || Boolean(life.club), hint: "Post a night, or stay out." },
  { id: "kumasi", name: "Garden city", lucide: "trees", from: "#1f7a4d", via: "#3f7d20", to: "#c9e2a8", unlock: (life) => life.town === "kumasi" || (life.stamps ?? []).includes("kumasi"), hint: "Go to Kumasi." },
  { id: "home", name: "Room", lucide: "home", from: "#f6e7c1", via: "#e7c9a0", to: "#8d5a3b", unlock: () => true, hint: "Always open." },
];

const DEAD_ZONES = new Set(["kakum", "bosomtwe", "shai"]);

export function phoneOf(life: Life): PhoneState {
  const saved = life.phone;
  return {
    wallpaper: saved?.wallpaper ?? "auto",
    airtime: saved?.airtime ?? 20,
    battery: saved?.battery ?? 80,
    model: saved?.model ?? "smart",
    ringtone: saved?.ringtone ?? "highlife",
    hidden: [...(saved?.hidden ?? [])],
    lostUntil: saved?.lostUntil,
    snatchedDay: saved?.snatchedDay,
  };
}

export function hasSignal(where: string) {
  return !DEAD_ZONES.has(where);
}

export function wallpaperOf(life: Life, sky: Weather, hour: number) {
  const chosen = phoneOf(life).wallpaper;
  const manual = WALLPAPERS.find((paper) => paper.id === chosen && paper.id !== "auto" && paper.unlock(life));
  if (manual) return manual;
  if (sky.harmattan) return WALLPAPERS.find((paper) => paper.id === "harmattan")!;
  if (sky.rain || sky.flood) return WALLPAPERS.find((paper) => paper.id === "rain")!;
  if (life.town === "kumasi") return WALLPAPERS.find((paper) => paper.id === "kumasi")!;
  if (life.where === "home") return WALLPAPERS.find((paper) => paper.id === "home")!;
  if (life.where === "beach" || life.where === "bojo" || life.where === "kokrobite") return WALLPAPERS.find((paper) => paper.id === "beach")!;
  if (life.club) return WALLPAPERS.find((paper) => paper.id === "club")!;
  if (hour >= 19 || hour < 5) return WALLPAPERS.find((paper) => paper.id === "night")!;
  if (hour < 10) return WALLPAPERS.find((paper) => paper.id === "morning")!;
  if (hour >= 16) return WALLPAPERS.find((paper) => paper.id === "evening")!;
  return WALLPAPERS.find((paper) => paper.id === "day")!;
}

export function wallpaperCss(paper: Wallpaper) {
  return `linear-gradient(180deg, ${paper.from} 0%, ${paper.via} 46%, ${paper.to} 100%)`;
}

export function followersOf(life: Life) {
  const posts = life.stats?.posts ?? 0;
  const fans = life.music?.fans ?? 0;
  return Math.round((life.relations.filter((person) => person.score >= 20).length + posts) * 12 + fans);
}

export function cloutTier(score: number) {
  if (score >= 85) return "Legend";
  if (score >= 60) return "Famous";
  if (score >= 35) return "Respected";
  if (score >= 15) return "Known";
  return "Around town";
}

export function lastPost(life: Life) {
  return life.log.find((line) => line.startsWith("Posted")) ?? "No post yet. The city has not seen you today.";
}

export function todayCards(life: Life, sky: Weather, hour: number, weather: string): TodayCard[] {
  const cards: TodayCard[] = [{ id: "weather", app: "news", kicker: "Today", title: sky.label, detail: weather }];
  const rent = homeById(life.homeId).rent;
  const weekday = new Date().getUTCDay();
  const days = (6 - weekday + 7) % 7;
  cards.push({
    id: "rent",
    app: "house",
    kicker: "Home",
    title: days === 0 ? "Rent is due today" : `Rent in ${days} day${days === 1 ? "" : "s"}`,
    detail: `${homeById(life.homeId).name} · ${rent ? `₵${rent} on Saturday` : "No rent on this house"}`,
  });
  const close = [...life.relations].sort((a, b) => b.score - a.score)[0];
  if (close && close.score >= 20) {
    cards.push({ id: "friend", app: "calls", kicker: "People", title: `${close.name} would pick up`, detail: "A call or a text still counts." });
  }
  const alert = alertsFor(life)[0];
  if (alert) cards.push({ id: alert.id, app: alert.app, kicker: alert.urgent ? "Now" : "Waiting", title: alert.text, detail: "Open it from the shade." });
  if (hour >= 18) cards.push({ id: "night", app: "events", kicker: "Tonight", title: life.town === "kumasi" ? "Adum is waking up" : "Osu is waking up", detail: moodOf(life.needs).label });
  return cards;
}

export function phoneNotices(life: Life): Alert[] {
  const list = alertsFor(life);
  const phone = phoneOf(life);
  if (phone.battery <= 15) list.unshift({ id: "battery", emoji: "🔋", text: phone.battery <= 0 ? "Phone is dead. Charge it at home." : `Battery at ${phone.battery}%.`, app: "papers", urgent: phone.battery <= 0 });
  if (phone.airtime < 3) list.unshift({ id: "airtime", emoji: "📶", text: "Airtime is low. Top up from the phone settings.", app: "papers" });
  if (phone.lostUntil && life.minutes < phone.lostUntil) list.unshift({ id: "stolen", emoji: "📱", text: "This phone was snatched. Replace it or wait.", app: "papers", urgent: true });
  if (!hasSignal(life.where)) list.unshift({ id: "signal", emoji: "📡", text: "No network here.", app: "map" });
  return list;
}

export function setWallpaper(life: Life, id: string): StepResult {
  const paper = WALLPAPERS.find((item) => item.id === id);
  if (!paper) return { life, notes: [], error: "That wallpaper is not on this phone." };
  if (!paper.unlock(life)) return { life, notes: [], error: paper.hint };
  const next = cloneLife(life);
  next.phone = { ...phoneOf(life), wallpaper: id };
  return { life: next, notes: [`Wallpaper set to ${paper.name}.`] };
}

export function topUpAirtime(life: Life, bundle: 5 | 15): StepResult {
  if (life.cash < bundle) return { life, notes: [], error: `You need ₵${bundle} in MoMo for that bundle.` };
  const units = bundle === 5 ? 20 : 80;
  const next = cloneLife(life);
  next.cash -= bundle;
  next.phone = { ...phoneOf(life), airtime: phoneOf(life).airtime + units };
  const line = `Airtime top up ₵${bundle}. ${units} units on the line.`;
  next.log = [line, ...next.log].slice(0, 14);
  next.inbox = [line, ...next.inbox].slice(0, 20);
  return { life: next, notes: [line] };
}

export function chargePhone(life: Life): StepResult {
  if (life.where !== "home") return { life, notes: [], error: "Plug in at home." };
  if (life.dumsor && !life.inventory.includes("gen") && !life.inventory.includes("solar") && !life.inventory.includes("inverter")) {
    return { life, notes: [], error: "Dumsor. The socket is quiet." };
  }
  const next = cloneLife(life);
  next.minutes += 15;
  next.phone = { ...phoneOf(life), battery: 100 };
  return { life: next, notes: ["Phone charged."] };
}

export function replacePhone(life: Life): StepResult {
  const phone = phoneOf(life);
  if (!phone.lostUntil || life.minutes >= phone.lostUntil) return { life, notes: [], error: "This phone is still in your hand." };
  if (life.cash < 150) return { life, notes: [], error: "A replacement is ₵150." };
  const next = cloneLife(life);
  next.cash -= 150;
  next.phone = { ...phone, battery: 45, airtime: 10, lostUntil: undefined, model: "smart" };
  const line = "New phone. The old one is gone. Contacts came back with the cloud of your head.";
  next.log = [line, ...next.log].slice(0, 14);
  return { life: next, notes: [line] };
}

export function hideApp(life: Life, id: string): StepResult {
  const phone = phoneOf(life);
  const hidden = new Set(phone.hidden);
  if (hidden.has(id)) hidden.delete(id);
  else hidden.add(id);
  const next = cloneLife(life);
  next.phone = { ...phone, hidden: [...hidden] };
  return { life: next, notes: [] };
}

export function useAirtime(life: Life, units = 1): StepResult {
  const blocked = spendAirtime(life, units);
  if (blocked) return { life, notes: [], error: blocked };
  const next = cloneLife(life);
  const phone = phoneOf(life);
  next.phone = { ...phone, airtime: Math.max(0, phone.airtime - units), battery: Math.max(0, phone.battery - 1) };
  return { life: next, notes: [] };
}

export function spendAirtime(life: Life, units = 1): string | null {
  const phone = phoneOf(life);
  if (phone.lostUntil && life.minutes < phone.lostUntil) return "The phone is gone.";
  if (phone.battery <= 0) return "Phone dead. Charge it at home.";
  if (!hasSignal(life.where)) return "No network here.";
  if (phone.airtime < units) return "Airtime finished. Top up in phone settings.";
  return null;
}

export function tickPhone(life: Life, minutes: number, notes: string[]) {
  const phone = phoneOf(life);
  if (phone.lostUntil && life.minutes >= phone.lostUntil) phone.lostUntil = undefined;
  const atHome = life.where === "home" && !life.dumsor;
  const battery = atHome ? Math.min(100, phone.battery + Math.round(minutes / 12)) : Math.max(0, phone.battery - Math.max(0, Math.round(minutes / 30)));
  const day = Math.floor(life.minutes / 1440);
  const hour = hourOf(life.minutes);
  let lostUntil = phone.lostUntil;
  let snatchedDay = phone.snatchedDay;
  if (!lostUntil && snatchedDay !== day && hour >= 22 && life.where !== "home" && life.cash >= 800 && (day + life.where.length) % 23 === 0) {
    lostUntil = life.minutes + 240;
    snatchedDay = day;
    notes.push("Your phone was snatched in the crowd. Replace it, or wait four hours.");
  }
  life.phone = { ...phone, battery, lostUntil, snatchedDay };
}
