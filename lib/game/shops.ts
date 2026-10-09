import { bizKind, bizRate } from "@/lib/game/biz-table";
import { STAFF_POOL, booksOf, shopTitle } from "@/lib/game/shop-run";
import {
  accraHour,
  cedis,
  cloneLife,
  dayIndex,
  logLine,
  spotById,
  type Business,
  type Life,
  type Needs,
  type ShopBook,
  type StepResult,
} from "@/lib/game/world";

export const SHOP_CITIES = [
  { id: "accra", name: "Accra", icon: "🏙️" },
  { id: "kumasi", name: "Kumasi", icon: "🌳" },
  { id: "takoradi", name: "Takoradi", icon: "⚓" },
  { id: "tamale", name: "Tamale", icon: "🕌" },
  { id: "cape-coast", name: "Cape Coast", icon: "🏰" },
  { id: "ho", name: "Ho", icon: "⛰️" },
] as const;

export type ShopCity = (typeof SHOP_CITIES)[number]["id"];

export const SHOP_TYPES = [
  { id: "all", label: "All types", icon: "" },
  { id: "food", label: "Food spot", icon: "🍲" },
  { id: "salon", label: "Salon", icon: "💇" },
  { id: "provisions", label: "Provisions", icon: "🛒" },
  { id: "boutique", label: "Boutique", icon: "👗" },
  { id: "electronics", label: "Electronics", icon: "📱" },
  { id: "service", label: "Service", icon: "🛠️" },
  { id: "bar", label: "Bar", icon: "🍺" },
  { id: "pharmacy", label: "Pharmacy", icon: "💊" },
  { id: "cosmetics", label: "Cosmetics", icon: "💄" },
] as const;

export type ShopType = Exclude<(typeof SHOP_TYPES)[number]["id"], "all">;

export const SHOP_VIEWS = [
  { id: "top", label: "Top", icon: "⭐" },
  { id: "new", label: "New", icon: "🆕" },
  { id: "near", label: "Near me", icon: "📍" },
] as const;

export type ShopView = (typeof SHOP_VIEWS)[number]["id"];

const AREAS: Record<ShopCity, string[]> = {
  accra: ["Osu", "East Legon", "Labone", "Cantonments", "Airport Residential", "Madina", "Achimota", "Dansoman", "Spintex", "Nima", "Tema"],
  kumasi: ["Adum", "Kejetia", "Bantama", "Asokwa", "Ahodwo"],
  takoradi: ["Market Circle", "Chapel Hill", "Beach Road"],
  tamale: ["Central", "Lamashegu", "Nyohini"],
  "cape-coast": ["Kotokuraba", "Pedu", "Abura"],
  ho: ["Ho Central", "Bankoe", "Civic Centre"],
};

const CITY_PRICE: Record<ShopCity, number> = {
  accra: 1,
  kumasi: 0.92,
  takoradi: 0.88,
  tamale: 0.84,
  "cape-coast": 0.9,
  ho: 0.86,
};

const NAMES: Record<ShopType, string[]> = {
  food: ["Auntie Esi's Pot", "Waakye House", "Light Soup Spot", "Jollof Corner", "Banku & Tilapia"],
  salon: ["Ama's Hands", "Crown Braids", "Fade Room", "Weave & Gist", "Saturday Chair"],
  provisions: ["Corner Provisions", "Sachet & Milo", "Mama's Shelf", "Night Kiosk", "Rice & Oil"],
  boutique: ["Ankara Room", "Kente Rail", "Osu Fits", "Second Look", "Sunday Best"],
  electronics: ["Circle Phones", "Glass Counter", "Charge Point", "Earphone Desk", "Screen House"],
  service: ["Same-Day Tailor", "Okada Errands", "Key & Lock", "Home Clean", "Passport Photos"],
  bar: ["Cold Club", "After Hours", "Speaker Spot", "Shisha Corner", "One More Round"],
  pharmacy: ["Night Pharmacy", "Linda's Counter", "Malaria Desk", "First Aid Shelf", "Open Late"],
  cosmetics: ["Glow Shelf", "Shea & Oil", "Tester Bar", "Scent Desk", "Face First"],
};

const OWNERS = ["ghostboy01", "amaeats", "kwesi_cuts", "efi_styles", "nana_stock", "yoofi", "serwaa_sews", "kofi_phones", "adwoa_glow", "mensah_bar"];

type GoodSeed = {
  name: string;
  category: string;
  emoji: string;
  price: number;
  effect: string;
  effects: Partial<Needs>;
  stock: number;
  condition: "new" | "used" | "second-hand";
};

const GOODS: Record<ShopType, GoodSeed[]> = {
  food: [
    { name: "Waakye", category: "Food", emoji: "🫘", price: 25, effect: "Hunger +75", effects: { hunger: 75 }, stock: 12, condition: "new" },
    { name: "Jollof and chicken", category: "Food", emoji: "🍗", price: 45, effect: "Hunger +80", effects: { hunger: 80, fun: 6 }, stock: 8, condition: "new" },
    { name: "Chapman", category: "Drink", emoji: "🥤", price: 18, effect: "Fun +12", effects: { fun: 12, hunger: 8 }, stock: 20, condition: "new" },
    { name: "Ice cream", category: "Food", emoji: "🍦", price: 12, effect: "Fun +10", effects: { fun: 10 }, stock: 10, condition: "new" },
    { name: "Soft drink", category: "Drink", emoji: "🧃", price: 8, effect: "Fun +4", effects: { fun: 4 }, stock: 24, condition: "new" },
    { name: "Kelewele", category: "Food", emoji: "🍌", price: 15, effect: "Hunger +30", effects: { hunger: 30, fun: 4 }, stock: 14, condition: "new" },
  ],
  salon: [
    { name: "Haircut", category: "Service", emoji: "💇", price: 30, effect: "Hygiene +25", effects: { hygiene: 25, fun: 8 }, stock: 8, condition: "new" },
    { name: "Braids", category: "Service", emoji: "✨", price: 80, effect: "Fun +16", effects: { fun: 16, social: 6 }, stock: 4, condition: "new" },
    { name: "Wig install", category: "Wig", emoji: "💇‍♀️", price: 150, effect: "Social +10", effects: { social: 10, fun: 8 }, stock: 3, condition: "new" },
    { name: "Weave", category: "Hair", emoji: "🎀", price: 120, effect: "Fun +8", effects: { fun: 8 }, stock: 5, condition: "new" },
    { name: "Hair oil", category: "Hair", emoji: "🧴", price: 35, effect: "Hygiene +8", effects: { hygiene: 8 }, stock: 10, condition: "new" },
    { name: "Beard line", category: "Service", emoji: "🪒", price: 20, effect: "Hygiene +12", effects: { hygiene: 12 }, stock: 8, condition: "new" },
  ],
  provisions: [
    { name: "Key soap", category: "Provisions", emoji: "🧼", price: 12, effect: "Hygiene +10", effects: { hygiene: 10 }, stock: 16, condition: "new" },
    { name: "Milk tin", category: "Provisions", emoji: "🥛", price: 28, effect: "Hunger +15", effects: { hunger: 15 }, stock: 10, condition: "new" },
    { name: "Sugar", category: "Provisions", emoji: "🧂", price: 15, effect: "", effects: {}, stock: 18, condition: "new" },
    { name: "Rice (5kg)", category: "Provisions", emoji: "🍚", price: 85, effect: "Hunger +20", effects: { hunger: 20 }, stock: 8, condition: "new" },
    { name: "Palm oil", category: "Provisions", emoji: "🫙", price: 40, effect: "", effects: {}, stock: 9, condition: "new" },
    { name: "Sachet water", category: "Provisions", emoji: "💧", price: 2, effect: "Hunger +4", effects: { hunger: 4 }, stock: 40, condition: "new" },
  ],
  boutique: [
    { name: "Ankara dress", category: "Clothes", emoji: "👗", price: 180, effect: "Fun +12", effects: { fun: 12, social: 6 }, stock: 4, condition: "new" },
    { name: "Kente cloth", category: "Clothes", emoji: "🧣", price: 420, effect: "Social +14", effects: { social: 14, fun: 8 }, stock: 2, condition: "new" },
    { name: "Plain tee", category: "Clothes", emoji: "👕", price: 60, effect: "Fun +4", effects: { fun: 4 }, stock: 8, condition: "new" },
    { name: "Jeans", category: "Clothes", emoji: "👖", price: 140, effect: "Fun +6", effects: { fun: 6 }, stock: 5, condition: "second-hand" },
    { name: "Sandals", category: "Shoes", emoji: "👡", price: 70, effect: "Fun +4", effects: { fun: 4 }, stock: 6, condition: "new" },
    { name: "Sneakers", category: "Shoes", emoji: "👟", price: 220, effect: "Fun +10", effects: { fun: 10 }, stock: 3, condition: "used" },
  ],
  electronics: [
    { name: "Earphones", category: "Electronics", emoji: "🎧", price: 45, effect: "Fun +8", effects: { fun: 8 }, stock: 10, condition: "new" },
    { name: "Charger", category: "Electronics", emoji: "🔌", price: 35, effect: "", effects: {}, stock: 12, condition: "new" },
    { name: "Phone case", category: "Electronics", emoji: "📱", price: 25, effect: "Fun +2", effects: { fun: 2 }, stock: 14, condition: "new" },
    { name: "Used handset", category: "Electronics", emoji: "📞", price: 380, effect: "Social +6", effects: { social: 6 }, stock: 2, condition: "used" },
    { name: "Power bank", category: "Electronics", emoji: "🔋", price: 90, effect: "", effects: {}, stock: 6, condition: "new" },
    { name: "Screen guard", category: "Electronics", emoji: "🛡️", price: 15, effect: "", effects: {}, stock: 20, condition: "new" },
  ],
  service: [
    { name: "Trouser sew", category: "Service", emoji: "🧵", price: 70, effect: "Fun +8", effects: { fun: 8 }, stock: 5, condition: "new" },
    { name: "Phone repair", category: "Service", emoji: "🛠️", price: 80, effect: "Fun +6", effects: { fun: 6 }, stock: 6, condition: "new" },
    { name: "Delivery run", category: "Service", emoji: "🏍️", price: 25, effect: "Social +4", effects: { social: 4 }, stock: 10, condition: "new" },
    { name: "Room cleaning", category: "Service", emoji: "🧹", price: 60, effect: "Hygiene +20", effects: { hygiene: 20 }, stock: 4, condition: "new" },
    { name: "Passport photo", category: "Service", emoji: "📸", price: 20, effect: "", effects: {}, stock: 12, condition: "new" },
    { name: "Shoe mend", category: "Service", emoji: "👞", price: 30, effect: "Fun +4", effects: { fun: 4 }, stock: 6, condition: "new" },
  ],
  bar: [
    { name: "Club beer", category: "Drink", emoji: "🍺", price: 20, effect: "Fun +14", effects: { fun: 14, social: 4 }, stock: 24, condition: "new" },
    { name: "Chapman pitcher", category: "Drink", emoji: "🍹", price: 40, effect: "Fun +16", effects: { fun: 16, social: 6 }, stock: 8, condition: "new" },
    { name: "Small chops", category: "Food", emoji: "🍢", price: 35, effect: "Hunger +25", effects: { hunger: 25, fun: 6 }, stock: 10, condition: "new" },
    { name: "Shisha bowl", category: "Bar", emoji: "💨", price: 50, effect: "Fun +12", effects: { fun: 12, social: 6 }, stock: 6, condition: "new" },
    { name: "Table for two", category: "Service", emoji: "🪑", price: 80, effect: "Social +12", effects: { social: 12, fun: 8 }, stock: 4, condition: "new" },
    { name: "Water", category: "Drink", emoji: "💧", price: 5, effect: "Hunger +2", effects: { hunger: 2 }, stock: 30, condition: "new" },
  ],
  pharmacy: [
    { name: "Malaria tabs", category: "Pharmacy", emoji: "💊", price: 25, effect: "Energy +12", effects: { energy: 12 }, stock: 14, condition: "new" },
    { name: "ORS", category: "Pharmacy", emoji: "🧂", price: 8, effect: "Hunger +6", effects: { hunger: 6 }, stock: 20, condition: "new" },
    { name: "Plasters", category: "Pharmacy", emoji: "🩹", price: 6, effect: "", effects: {}, stock: 18, condition: "new" },
    { name: "Cough syrup", category: "Pharmacy", emoji: "🍯", price: 18, effect: "Energy +6", effects: { energy: 6 }, stock: 10, condition: "new" },
    { name: "Hand sanitiser", category: "Pharmacy", emoji: "🧴", price: 15, effect: "Hygiene +8", effects: { hygiene: 8 }, stock: 12, condition: "new" },
    { name: "Advice at the counter", category: "Service", emoji: "🗣️", price: 0, effect: "Social +4", effects: { social: 4 }, stock: 8, condition: "new" },
  ],
  cosmetics: [
    { name: "Shea butter", category: "Cosmetics", emoji: "🧴", price: 30, effect: "Hygiene +8", effects: { hygiene: 8 }, stock: 10, condition: "new" },
    { name: "Lip gloss", category: "Cosmetics", emoji: "💄", price: 25, effect: "Fun +6", effects: { fun: 6 }, stock: 8, condition: "new" },
    { name: "Perfume", category: "Cosmetics", emoji: "🌸", price: 90, effect: "Social +8", effects: { social: 8, fun: 4 }, stock: 5, condition: "new" },
    { name: "Face powder", category: "Cosmetics", emoji: "🪞", price: 55, effect: "Fun +6", effects: { fun: 6 }, stock: 6, condition: "new" },
    { name: "Sunscreen", category: "Cosmetics", emoji: "☀️", price: 40, effect: "Hygiene +4", effects: { hygiene: 4 }, stock: 7, condition: "new" },
    { name: "Sample set", category: "Cosmetics", emoji: "🎁", price: 20, effect: "Fun +4", effects: { fun: 4 }, stock: 9, condition: "new" },
  ],
};

const REVIEWS = [
  "The queue moved. The thing I asked for was there.",
  "Price was fair. I will send my cousin.",
  "They were still setting up. I came back and it was fine.",
  "Sold me the last one and did not argue.",
  "Too slow, and the change was short.",
  "Clean counter. I stayed for the gist.",
  "Dear, but the thing lasted.",
  "I asked twice. The second answer was the true one.",
];

export type ShelfItem = GoodSeed & { id: string; popular: boolean };

export type ShopReview = { id: string; buyer: string; stars: number; text: string; day: number };

export type ShopListing = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  owner: string;
  city: ShopCity;
  area: string;
  type: ShopType;
  stars: number;
  openedDay: number;
  openFrom: number;
  openTo: number;
  hours: string;
  service: boolean;
  items: ShelfItem[];
  reviews: ShopReview[];
  yours: boolean;
  spot?: string;
};

export type ShopStatus = "open" | "closed" | "service" | "sold";

const COLORS = ["#5b21b6", "#1d4ed8", "#006B3F", "#9f1239", "#0f766e", "#7c3aed", "#b45309", "#121212"];
const TYPE_ORDER: ShopType[] = ["food", "salon", "provisions", "boutique", "electronics", "service", "bar", "pharmacy", "cosmetics"];

function hash(text: string) {
  let n = 2166136261;
  for (let i = 0; i < text.length; i += 1) n = Math.imul(n ^ text.charCodeAt(i), 16777619);
  return n >>> 0;
}

function hoursFor(type: ShopType): { openFrom: number; openTo: number; hours: string } {
  if (type === "bar") return { openFrom: 16, openTo: 2, hours: "4:00 pm – 2:00 am" };
  if (type === "food") return { openFrom: 6, openTo: 21, hours: "6:00 – 21:00" };
  if (type === "pharmacy") return { openFrom: 7, openTo: 22, hours: "7:00 – 22:00" };
  if (type === "salon") return { openFrom: 8, openTo: 19, hours: "8:00 – 19:00" };
  return { openFrom: 8, openTo: 20, hours: "8:00 – 20:00" };
}

function buildCatalog(): ShopListing[] {
  const rows: ShopListing[] = [];
  for (const city of SHOP_CITIES) {
    const areas = AREAS[city.id];
    areas.forEach((area, areaIndex) => {
      const count = city.id === "accra" ? 4 : city.id === "kumasi" ? 3 : 2;
      for (let n = 0; n < count; n += 1) {
        const type = TYPE_ORDER[(areaIndex + n) % TYPE_ORDER.length];
        const id = `${city.id}-${areaIndex}-${n}`;
        const seed = hash(id);
        const name = NAMES[type][seed % NAMES[type].length];
        const owner = OWNERS[seed % OWNERS.length];
        const clock = hoursFor(type);
        const goods = GOODS[type].map((good, index) => {
          const local = city.id === "kumasi" && type === "boutique" && index === 1 ? { ...good, name: "Bonwire kente", price: 480 } : good;
          return { ...local, id: `${id}:${index}`, popular: index === 0 || index === 1 };
        });
        const reviews: ShopReview[] = [0, 1, 2].map((index) => {
          const pick = hash(`${id}-r${index}`);
          return {
            id: `${id}-r${index}`,
            buyer: OWNERS[(pick + index) % OWNERS.length],
            stars: 3 + (pick % 3),
            text: REVIEWS[pick % REVIEWS.length],
            day: 10 + (pick % 40),
          };
        });
        const stars = Math.round((reviews.reduce((sum, review) => sum + review.stars, 0) / reviews.length) * 10) / 10;
        rows.push({
          id,
          name: n % 3 === 0 ? `${name} ${area.split(" ")[0]}` : name,
          emoji: SHOP_TYPES.find((item) => item.id === type)?.icon || "🏪",
          color: COLORS[seed % COLORS.length],
          owner,
          city: city.id,
          area,
          type,
          stars,
          openedDay: 400 + (seed % 800),
          openFrom: clock.openFrom,
          openTo: clock.openTo,
          hours: clock.hours,
          service: type === "service" || type === "salon",
          items: goods,
          reviews,
          yours: false,
        });
      }
    });
  }
  return rows;
}

const CATALOG = buildCatalog();

export function shopCities() {
  return SHOP_CITIES;
}

export function areasFor(city: ShopCity) {
  return AREAS[city] ?? AREAS.accra;
}

export function cityOf(id: string) {
  return SHOP_CITIES.find((city) => city.id === id) ?? SHOP_CITIES[0];
}

export function typeOf(id: string) {
  return SHOP_TYPES.find((type) => type.id === id) ?? SHOP_TYPES[0];
}

function kindType(kind: string): ShopType {
  const plan = bizKind(kind);
  if (["drinks", "lounge", "nightclub", "karaoke"].includes(kind)) return "bar";
  if (["salon", "barber", "nails", "spa"].includes(kind)) return "salon";
  if (["boutique", "shoes"].includes(kind)) return "boutique";
  if (["phones", "electronics"].includes(kind)) return "electronics";
  if (["cosmetics"].includes(kind)) return "cosmetics";
  if (["kiosk", "mini-mart", "supermarket", "kejetia-stall"].includes(kind)) return "provisions";
  if (plan.group === "Food") return "food";
  if (plan.group === "Services") return "service";
  if (plan.group === "Retail") return "provisions";
  return "service";
}

function playerCity(town?: string): ShopCity {
  const id = (town ?? "accra") as ShopCity;
  return AREAS[id] ? id : "accra";
}

export function bookOf(life: Life): ShopBook {
  return {
    follows: [...(life.shopBook?.follows ?? [])],
    bought: { ...(life.shopBook?.bought ?? {}) },
    wrote: (life.shopBook?.wrote ?? []).map((note) => ({ ...note })),
    replies: { ...(life.shopBook?.replies ?? {}) },
    price: { ...(life.shopBook?.price ?? {}) },
    added: { ...(life.shopBook?.added ?? {}) },
    refunded: [...(life.shopBook?.refunded ?? [])],
  };
}

function blankBook(life: Life) {
  const next = cloneLife(life);
  next.shopBook = bookOf(life);
  return next;
}

export function mineShops(life: Life, username: string): ShopListing[] {
  return (life.businesses ?? []).map((shop) => shopFromBusiness(life, shop, username));
}

function shopFromBusiness(life: Life, shop: Business, username: string): ShopListing {
  const type = kindType(shop.kind);
  const plan = bizKind(shop.kind);
  const city = playerCity(shop.town);
  const clock = hoursFor(type);
  const markup = shop.markup ?? 1;
  const items = GOODS[type].map((good, index) => {
    const id = `${shop.id}:${index}`;
    const price = life.shopBook?.price[id] ?? Math.max(1, Math.round(good.price * markup));
    const local = city === "kumasi" && type === "boutique" && index === 1 ? { ...good, name: "Bonwire kente" } : good;
    return { ...local, id, price, popular: index < 2 };
  });
  return {
    id: shop.id,
    name: shopTitle(shop),
    emoji: shop.icon || plan.emoji,
    color: shop.color || "#5b21b6",
    owner: username.replace(/^@/, "") || "you",
    city,
    area: shop.area || plan.area,
    type,
    stars: shop.stars ?? 3,
    openedDay: dayIndex(shop.openedAt),
    openFrom: clock.openFrom,
    openTo: clock.openTo,
    hours: shop.hours || clock.hours,
    service: type === "service" || type === "salon",
    items,
    reviews: [0, 1].map((index) => {
      const pick = hash(`${shop.id}-r${index}`);
      return {
        id: `${shop.id}-r${index}`,
        buyer: OWNERS[pick % OWNERS.length],
        stars: 3 + (pick % 3),
        text: REVIEWS[pick % REVIEWS.length],
        day: dayIndex(shop.openedAt),
      };
    }),
    yours: true,
    spot: shop.spot,
  };
}

export function listingById(life: Life, username: string, id: string) {
  return mineShops(life, username).find((shop) => shop.id === id) ?? CATALOG.find((shop) => shop.id === id) ?? null;
}

export function allListings(life: Life, username: string) {
  return [...mineShops(life, username), ...CATALOG];
}

export function shopOpen(shop: ShopListing, hour = accraHour()) {
  if (shop.openFrom === shop.openTo) return true;
  if (shop.openFrom < shop.openTo) return hour >= shop.openFrom && hour < shop.openTo;
  return hour >= shop.openFrom || hour < shop.openTo;
}

export function stockLeft(life: Life, item: ShelfItem, day = dayIndex(life.minutes)) {
  const swing = hash(`${item.id}:${day}`) % (item.popular ? item.stock + 1 : Math.max(2, Math.floor(item.stock / 2)));
  const bought = life.shopBook?.bought[item.id] ?? 0;
  const added = life.shopBook?.added[item.id] ?? 0;
  return Math.max(0, item.stock - swing - bought + added);
}

export function askPrice(life: Life, shop: ShopListing, item: ShelfItem) {
  const base = life.shopBook?.price[item.id] ?? item.price;
  const promo = shop.yours ? (life.businesses ?? []).find((row) => row.id === shop.id)?.promo ?? 0 : 0;
  return Math.max(item.price === 0 ? 0 : 1, Math.round(base * CITY_PRICE[shop.city] * (1 - Math.min(30, promo) / 100)));
}

export function shopStatus(life: Life, shop: ShopListing): ShopStatus {
  const left = shop.items.reduce((sum, item) => sum + stockLeft(life, item), 0);
  if (left <= 0) return "sold";
  if (!shopOpen(shop)) return "closed";
  if (shop.service) return "service";
  return "open";
}

export function statusLabel(status: ShopStatus) {
  if (status === "sold") return "Sold out";
  if (status === "closed") return "Not open";
  if (status === "service") return "Service";
  return "Open";
}

export function ratingOf(life: Life, shop: ShopListing) {
  if (shop.yours) return shop.stars;
  const mine = (life.shopBook?.wrote ?? []).filter((note) => note.shopId === shop.id);
  const seeded = shop.reviews;
  const pool = [...seeded.map((review) => review.stars), ...mine.map((note) => note.stars)];
  if (!pool.length) return shop.stars;
  return Math.round((pool.reduce((sum, stars) => sum + stars, 0) / pool.length) * 10) / 10;
}

export function reviewsOf(life: Life, shop: ShopListing): (ShopReview & { reply?: string })[] {
  const seeded = shop.reviews.map((review) => ({ ...review, reply: life.shopBook?.replies[review.id] }));
  const mine = (life.shopBook?.wrote ?? [])
    .filter((note) => note.shopId === shop.id)
    .map((note) => ({ id: note.id, buyer: "you", stars: note.stars, text: note.text, day: note.day, reply: life.shopBook?.replies[note.id] }));
  return [...mine, ...seeded];
}

function nearRank(life: Life, shop: ShopListing) {
  const here = playerCity(life.town);
  if (shop.city !== here) return 0;
  const spot = spotById(life.where);
  const blob = `${spot.name} ${spot.blurb}`.toLowerCase();
  if (blob.includes(shop.area.toLowerCase())) return 2;
  return 1;
}

export function filterShops(
  life: Life,
  username: string,
  query: { city: ShopCity; view: ShopView; type: string; area: string; text: string },
) {
  const needle = query.text.trim().toLowerCase();
  let rows = allListings(life, username).filter((shop) => {
    if (shop.city !== query.city) return false;
    if (query.type !== "all" && shop.type !== query.type) return false;
    if (query.area !== "all" && shop.area !== query.area) return false;
    if (!needle) return true;
    const blob = `${shop.name} ${shop.owner} ${shop.area} ${shop.items.map((item) => item.name).join(" ")}`.toLowerCase();
    return blob.includes(needle);
  });
  if (query.view === "top") rows = rows.sort((a, b) => ratingOf(life, b) - ratingOf(life, a) || a.name.localeCompare(b.name));
  else if (query.view === "new") rows = rows.sort((a, b) => b.openedDay - a.openedDay);
  else rows = rows.sort((a, b) => nearRank(life, b) - nearRank(life, a) || ratingOf(life, b) - ratingOf(life, a));
  return rows;
}

export function countLine(count: number, city: ShopCity) {
  const name = cityOf(city).name;
  if (count >= 1000) return `1000+ in ${name}`;
  if (count === 1) return `1 in ${name}`;
  return `${count} in ${name}`;
}

function push(life: Life, line: string) {
  logLine(life, line);
  life.inbox = [line, ...life.inbox].slice(0, 20);
}

export function followShop(life: Life, shopId: string): StepResult {
  const next = blankBook(life);
  const book = next.shopBook!;
  book.follows = book.follows.includes(shopId) ? book.follows.filter((id) => id !== shopId) : [...book.follows, shopId].slice(0, 40);
  const on = book.follows.includes(shopId);
  const line = on ? "You followed the shop. New stock will show on your phone." : "You unfollowed the shop.";
  push(next, line);
  return { life: next, notes: [line] };
}

export function messageOwner(life: Life, shop: ShopListing): StepResult {
  const next = cloneLife(life);
  const line = `You wrote to @${shop.owner} about ${shop.name}. They answer when they open the phone.`;
  push(next, line);
  return { life: next, notes: [line] };
}

export function buyShelf(life: Life, username: string, shopId: string, itemId: string): StepResult {
  const shop = listingById(life, username, shopId);
  const item = shop?.items.find((row) => row.id === itemId);
  if (!shop || !item) return { life, notes: [], error: "That item is not on the shelf." };
  if (shop.yours) return { life, notes: [], error: "That till is yours. Change the price from the desk." };
  if (!shopOpen(shop)) return { life, notes: [], error: `${shop.name} is not open.` };
  if (stockLeft(life, item) <= 0) return { life, notes: [], error: `${item.name} is sold out.` };
  const price = askPrice(life, shop, item);
  if (life.cash < price) return { life, notes: [], error: `${item.name} is ${cedis(price)}. You have ${cedis(life.cash)}.` };
  const next = blankBook(life);
  next.cash -= price;
  next.shopBook!.bought[itemId] = (next.shopBook!.bought[itemId] ?? 0) + 1;
  for (const [key, gain] of Object.entries(item.effects) as [keyof Needs, number][]) {
    next.needs[key] = Math.max(0, Math.min(100, next.needs[key] + gain));
  }
  const line = `You bought ${item.name} at ${shop.name} for ${cedis(price)}.${item.effect ? ` ${item.effect}.` : ""}`;
  push(next, line);
  return { life: next, notes: [line] };
}

export function reviewShop(life: Life, username: string, shopId: string, stars: number, text: string): StepResult {
  const shop = listingById(life, username, shopId);
  if (!shop) return { life, notes: [], error: "That shop is gone." };
  if (shop.yours) return { life, notes: [], error: "You cannot review your own till." };
  const bought = shop.items.some((item) => (life.shopBook?.bought[item.id] ?? 0) > 0);
  if (!bought) return { life, notes: [], error: "Buy something there before you review it." };
  if ((life.shopBook?.wrote ?? []).some((note) => note.shopId === shopId)) return { life, notes: [], error: "You already left a review." };
  const body = text.trim().slice(0, 140);
  if (body.length < 2) return { life, notes: [], error: "Write a line they can read." };
  const next = blankBook(life);
  const score = Math.max(1, Math.min(5, Math.round(stars)));
  next.shopBook!.wrote = [{ id: `me-${shopId}-${life.minutes}`, shopId, stars: score, text: body, day: dayIndex(life.minutes) }, ...next.shopBook!.wrote].slice(0, 30);
  const line = `You gave ${shop.name} ${score} star${score === 1 ? "" : "s"}.`;
  push(next, line);
  return { life: next, notes: [line] };
}

export function refundItem(life: Life, username: string, shopId: string, itemId: string): StepResult {
  const shop = listingById(life, username, shopId);
  const item = shop?.items.find((row) => row.id === itemId);
  if (!shop || !item) return { life, notes: [], error: "That sale is not on the book." };
  if ((life.shopBook?.bought[itemId] ?? 0) <= 0) return { life, notes: [], error: "You have not paid for that." };
  if ((life.shopBook?.refunded ?? []).includes(itemId)) return { life, notes: [], error: "That sale was already refunded." };
  const next = blankBook(life);
  const back = Math.round(askPrice(life, shop, item) * 0.8);
  next.cash += back;
  next.shopBook!.bought[itemId] = Math.max(0, (next.shopBook!.bought[itemId] ?? 1) - 1);
  next.shopBook!.refunded = [...(next.shopBook!.refunded ?? []), itemId];
  const line = `${shop.name} refunded ${cedis(back)} on ${item.name}. The rest was their trouble.`;
  push(next, line);
  return { life: next, notes: [line] };
}

function own(life: Life, shopId: string) {
  return (life.businesses ?? []).find((shop) => shop.id === shopId) ?? null;
}

export function renameShop(life: Life, shopId: string, name: string): StepResult {
  const shop = own(life, shopId);
  if (!shop) return { life, notes: [], error: "That shop is not yours." };
  const title = name.trim().slice(0, 28);
  if (title.length < 2) return { life, notes: [], error: "Give the place a name." };
  const next = cloneLife(life);
  next.businesses = (next.businesses ?? []).map((item) => (item.id === shopId ? { ...item, name: title } : item));
  const line = `The sign now says ${title}.`;
  push(next, line);
  return { life: next, notes: [line] };
}

export function paintShop(life: Life, shopId: string, color: string, icon: string): StepResult {
  const shop = own(life, shopId);
  if (!shop) return { life, notes: [], error: "That shop is not yours." };
  const next = cloneLife(life);
  next.businesses = (next.businesses ?? []).map((item) => (item.id === shopId ? { ...item, color, icon: icon.slice(0, 4) } : item));
  const line = `${shopTitle(shop)} has a new face on the directory.`;
  push(next, line);
  return { life: next, notes: [line] };
}

export function setShopHours(life: Life, shopId: string, hours: string): StepResult {
  const shop = own(life, shopId);
  if (!shop) return { life, notes: [], error: "That shop is not yours." };
  const next = cloneLife(life);
  next.businesses = (next.businesses ?? []).map((item) => (item.id === shopId ? { ...item, hours: hours.slice(0, 32) } : item));
  const line = `${shopTitle(shop)} posted hours: ${hours}.`;
  push(next, line);
  return { life: next, notes: [line] };
}

export function setPromo(life: Life, shopId: string, percent: number): StepResult {
  const shop = own(life, shopId);
  if (!shop) return { life, notes: [], error: "That shop is not yours." };
  const promo = Math.max(0, Math.min(30, Math.round(percent)));
  const next = cloneLife(life);
  next.businesses = (next.businesses ?? []).map((item) => (item.id === shopId ? { ...item, promo } : item));
  const line = promo ? `${shopTitle(shop)} is ${promo}% off today.` : `${shopTitle(shop)} is back to full price.`;
  push(next, line);
  return { life: next, notes: [line] };
}

export function priceItem(life: Life, shopId: string, itemId: string, price: number): StepResult {
  const shop = own(life, shopId);
  if (!shop) return { life, notes: [], error: "That shop is not yours." };
  const next = blankBook(life);
  const ask = Math.max(0, Math.min(5000, Math.round(price)));
  next.shopBook!.price[itemId] = ask;
  const line = `${shopTitle(shop)} now asks ${cedis(ask)} for that line.`;
  push(next, line);
  return { life: next, notes: [line] };
}

export function restockItem(life: Life, username: string, shopId: string, itemId: string): StepResult {
  const shop = own(life, shopId);
  const card = listingById(life, username, shopId);
  const item = card?.items.find((row) => row.id === itemId);
  if (!shop || !item) return { life, notes: [], error: "That line is not on your shelf." };
  const cost = Math.max(1, Math.round(item.price * 0.45));
  if (life.cash < cost) return { life, notes: [], error: `A restock of ${item.name} costs ${cedis(cost)}.` };
  const next = blankBook(life);
  next.cash -= cost;
  next.shopBook!.added[itemId] = (next.shopBook!.added[itemId] ?? 0) + 4;
  const line = `You put four more ${item.name} on the shelf for ${cedis(cost)}.`;
  push(next, line);
  return { life: next, notes: [line] };
}

export function replyReview(life: Life, shopId: string, reviewId: string, text: string): StepResult {
  const shop = own(life, shopId);
  if (!shop) return { life, notes: [], error: "That shop is not yours." };
  const body = text.trim().slice(0, 140);
  if (body.length < 2) return { life, notes: [], error: "Write a reply." };
  const next = blankBook(life);
  next.shopBook!.replies[reviewId] = body;
  const line = `You replied on ${shopTitle(shop)}.`;
  push(next, line);
  return { life: next, notes: [line] };
}

export function openInCity(life: Life, shopId: string, city: ShopCity): StepResult {
  const shop = own(life, shopId);
  if (!shop) return { life, notes: [], error: "Open the first shop before a second city." };
  if (playerCity(shop.town) === city) return { life, notes: [], error: "That shop is already in this city." };
  if ((life.businesses ?? []).length >= 4) return { life, notes: [], error: "Four businesses is the book you can carry." };
  const plan = bizKind(shop.kind);
  const cost = Math.round(plan.price * 0.7);
  if (life.cash < cost) return { life, notes: [], error: `A ${cityOf(city).name} shop costs ${cedis(cost)}.` };
  const next = cloneLife(life);
  next.cash -= cost;
  const branch: Business = {
    ...shop,
    id: `${shop.kind}-${city}-${life.minutes}`,
    openedAt: life.minutes,
    lastCollect: life.minutes,
    town: city,
    name: `${shopTitle(shop)} · ${cityOf(city).name}`,
    area: areasFor(city)[0],
    spot: city === "kumasi" ? "kejetia" : city === "accra" ? plan.spot ?? "buka" : "home",
    stock: 80,
    branches: 0,
    staff: shop.staff?.map((person) => ({ ...person })),
  };
  next.businesses = [...(next.businesses ?? []), branch];
  const line =
    city === "accra" || city === "kumasi"
      ? `${shopTitle(shop)} now has a door in ${cityOf(city).name}.`
      : `${cityOf(city).name} is on the books. The directory lists the shop. The city map itself is still ahead.`;
  push(next, line);
  return { life: next, notes: [line] };
}

export function shopStats(life: Life, username: string, shopId: string) {
  const shop = own(life, shopId);
  const card = listingById(life, username, shopId);
  if (!shop || !card) return null;
  const books = booksOf(life, shop);
  const cityRows = allListings(life, username)
    .filter((row) => row.city === card.city)
    .sort((a, b) => ratingOf(life, b) - ratingOf(life, a));
  const rank = Math.max(1, cityRows.findIndex((row) => row.id === shopId) + 1);
  const low = card.items.filter((item) => stockLeft(life, item) <= 2).map((item) => item.name);
  return {
    revenue: books.revenue,
    customers: books.customers,
    stars: ratingOf(life, card),
    rank,
    of: cityRows.length,
    low,
    staff: shop.staff ?? [],
    pool: STAFF_POOL,
    promo: shop.promo ?? 0,
    cash: life.cash,
    rate: bizRate(shop.kind, shop.level),
  };
}

export function shelfLine(kind: string, town?: string) {
  const type = kindType(kind);
  const goods = GOODS[type];
  const extra = town === "kumasi" && type === "boutique" ? "Bonwire kente" : goods[0]?.name;
  return [extra, goods[1]?.name, goods[2]?.name].filter(Boolean).join(", ");
}
