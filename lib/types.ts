export const categorySlugs = [
  "food-dining",
  "cafes",
  "nightlife",
  "events",
  "date-ideas",
  "things-to-do",
  "shopping",
  "beauty-wellness",
  "beaches-outdoors",
  "stay",
  "work-study",
  "family-kids",
] as const;

export type CategorySlug = (typeof categorySlugs)[number];

export const areaSlugs = [
  "osu",
  "east-legon",
  "airport",
  "cantonments",
  "labone",
  "labadi",
  "spintex",
  "dzorwulu",
  "adabraka",
  "ridge",
  "dansoman",
  "teshie",
  "nungua",
  "tema",
  "jamestown",
  "kokrobite",
] as const;

export type AreaSlug = (typeof areaSlugs)[number];

export const vibeSlugs = [
  "chill",
  "date-night",
  "outside",
  "foodie",
  "work-mode",
  "explore",
  "budget",
  "luxury",
  "friends",
  "family",
] as const;

export type VibeSlug = (typeof vibeSlugs)[number];

export type PriceRange = 1 | 2 | 3 | 4;

export type Schedule = {
  summary: string;
  open: string;
  close: string;
  closed: string[];
  weekendOpen?: string;
  weekendClose?: string;
};

export type Place = {
  slug: string;
  name: string;
  categories: CategorySlug[];
  area: AreaSlug;
  rating: number;
  reviewCount: number;
  priceRange: PriceRange;
  summary: string;
  description: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  whatsapp: string;
  instagram: string;
  website?: string;
  images: string[];
  tags: string[];
  vibes: VibeSlug[];
  schedule: Schedule;
  highlights?: string[];
  trending?: boolean;
  popular?: boolean;
  featured?: boolean;
  verified?: boolean;
  views: number;
  baseSaves: number;
};

export type EventSlot =
  | "today"
  | "today-late"
  | "tomorrow"
  | "tomorrow-late"
  | "plus2"
  | "plus3"
  | "plus4"
  | "sat"
  | "sun"
  | "plus10"
  | "plus12"
  | "plus14"
  | "plus20";

export type WindowKey = "today" | "tomorrow" | "weekend" | "week" | "upcoming";

export type SeedEvent = {
  slug: string;
  name: string;
  category: string;
  slot: EventSlot;
  startTime: string;
  endTime: string;
  area: AreaSlug;
  venue: string;
  placeSlug?: string;
  price: number;
  summary: string;
  description: string;
  image: string;
  lat: number;
  lng: number;
  vibes: VibeSlug[];
  featured?: boolean;
  views: number;
};

export type EventItem = Omit<SeedEvent, "slot"> & {
  date: string;
  windows: WindowKey[];
  images: string[];
};

export type StoredEvent = Omit<EventItem, "windows" | "images"> & {
  images?: string[];
};

export type Category = {
  slug: CategorySlug;
  name: string;
  emoji: string;
  lede: string;
  image: string;
};

export type Area = {
  slug: AreaSlug;
  name: string;
  tagline: string;
  description: string;
  image: string;
  lat: number;
  lng: number;
  knownFor: string[];
};

export type Vibe = {
  slug: VibeSlug;
  name: string;
  emoji: string;
  lede: string;
  examples: string[];
};

export type Review = {
  id: string;
  placeSlug: string;
  userId: string;
  userName: string;
  rating: number;
  body: string;
  createdAt: string;
  status: "published" | "pending" | "hidden";
  photo?: string;
};

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  createdAt: string;
};

export type Reservation = {
  id: string;
  code: string;
  userId: string | null;
  name: string;
  email: string;
  eventSlug: string;
  quantity: number;
  createdAt: string;
};

export type PlaceSubmission = {
  name: string;
  category: CategorySlug;
  area: AreaSlug;
  address: string;
  description: string;
  phone: string;
  instagram: string;
  priceRange: PriceRange;
};

export type EventSubmission = {
  name: string;
  category: string;
  date: string;
  startTime: string;
  endTime: string;
  area: AreaSlug;
  venue: string;
  price: number;
  description: string;
};

export type ClaimSubmission = {
  placeSlug: string;
  placeName: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  note: string;
};

export type Submission = {
  id: string;
  type: "place" | "event" | "claim";
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  submittedBy: string | null;
  payload: PlaceSubmission | EventSubmission | ClaimSubmission;
};

export type Report = {
  id: string;
  reviewId: string;
  userId: string;
  reason: string;
  createdAt: string;
  status: "open" | "resolved";
};

export type Save = {
  id: string;
  userId: string;
  kind: "place" | "event";
  slug: string;
  createdAt: string;
};

export type MediaKind = "place" | "event" | "category" | "area" | "collection";

export type MediaAsset = {
  id: string;
  kind: MediaKind;
  slug: string;
  src: string;
  alt: string;
  featured: boolean;
  removed: boolean;
  createdAt: string;
};
