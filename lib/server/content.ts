import "server-only";
import { dateForSlot, windowsFor } from "@/lib/data/dates";
import { seedEvents } from "@/lib/data/events";
import { matchesCategory, matchesVibe, searchText } from "@/lib/data/match";
import { seedPlaces } from "@/lib/data/places";
import { areaBySlug, areas, categories } from "@/lib/data/taxonomy";
import { photo, slugify } from "@/lib/format";
import { shotList } from "@/lib/media";
import { getSession } from "@/lib/server/session";
import { readStore, toPublicUser, uid, updateStore } from "@/lib/server/store";
import type {
  CategorySlug,
  EventItem,
  EventSubmission,
  MediaKind,
  Place,
  PlaceSubmission,
  StoredEvent,
  VibeSlug,
  WindowKey,
} from "@/lib/types";

export function allPlaces(): Place[] {
  const store = readStore();
  return [...seedPlaces, ...store.customPlaces].map((place) => ({
    ...place,
    images: shotList("place", place.slug, place.images, store.library),
    featured: store.featured.includes(place.slug),
    verified: place.verified || store.claimed.includes(place.slug),
  }));
}

export function shotsOf(kind: MediaKind, slug: string, fallback: string[]) {
  return shotList(kind, slug, fallback, readStore().library);
}

export function coverOf(kind: MediaKind, slug: string, fallback: string) {
  return shotsOf(kind, slug, fallback ? [fallback] : [])[0] ?? "";
}

export function allEvents(): EventItem[] {
  const store = readStore();
  const seeded: EventItem[] = seedEvents.map((event) => {
    const { slot, ...rest } = event;
    const date = dateForSlot(slot);
    return { ...rest, date, windows: windowsFor(date), images: rest.image ? [rest.image] : [] };
  });
  const custom: EventItem[] = store.customEvents.map((event) => ({
    ...event,
    windows: windowsFor(event.date),
    images: event.images?.length ? event.images : event.image ? [event.image] : [],
  }));
  return [...seeded, ...custom]
    .map((event) => {
      const images = shotList(
        "event",
        event.slug,
        event.images.length ? event.images : event.image ? [event.image] : [],
        store.library,
      );
      return { ...event, images, image: images[0] ?? "" };
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
}

export function placeBySlug(slug: string) {
  return allPlaces().find((place) => place.slug === slug);
}

export function eventBySlug(slug: string) {
  return allEvents().find((event) => event.slug === slug);
}

export function placesForCategory(slug: CategorySlug) {
  return allPlaces().filter((place) => matchesCategory(place, slug));
}

export function placesForVibe(slug: VibeSlug) {
  return allPlaces().filter((place) => matchesVibe(place, slug));
}

export function eventsForVibe(slug: VibeSlug) {
  return allEvents().filter((event) => event.vibes.includes(slug));
}

export function placesForArea(slug: string) {
  return allPlaces().filter((place) => place.area === slug);
}

export function eventsForArea(slug: string) {
  return allEvents().filter((event) => event.area === slug);
}

export function eventsInWindow(windowKey: WindowKey) {
  return allEvents().filter((event) => event.windows.includes(windowKey));
}

export function relatedPlaces(place: Place, limit = 3) {
  return allPlaces()
    .filter((candidate) => candidate.slug !== place.slug)
    .map((candidate) => {
      let score = 0;
      if (candidate.area === place.area) score += 2;
      if (candidate.categories.some((category) => place.categories.includes(category))) score += 3;
      if (candidate.vibes.some((vibe) => place.vibes.includes(vibe))) score += 1;
      return { candidate, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.candidate.rating - a.candidate.rating)
    .slice(0, limit)
    .map((item) => item.candidate);
}

export function reviewsForPlace(slug: string, viewerId?: string | null) {
  return readStore()
    .reviews.filter((review) => {
      if (review.placeSlug !== slug) return false;
      if (review.status === "published") return true;
      if (review.status === "pending" && viewerId && review.userId === viewerId) return true;
      return false;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function searchAll(query: string) {
  const places = allPlaces()
    .map((place) => ({
      place,
      score: searchText(
        query,
        place.name,
        place.summary,
        place.description,
        place.tags.join(" "),
        place.area,
        place.categories.join(" "),
        place.vibes.join(" "),
      ),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.place);

  const events = allEvents()
    .map((event) => ({
      event,
      score: searchText(query, event.name, event.summary, event.description, event.category, event.venue, event.area, event.vibes.join(" ")),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.event);

  const matchedAreas = areas.filter((area) => searchText(query, area.name, area.tagline, area.description, area.knownFor.join(" ")) > 0);
  return { places, events, areas: matchedAreas };
}

export async function getViewer() {
  const session = await getSession();
  if (!session) return { user: null, savedPlaces: new Set<string>(), savedEvents: new Set<string>() };
  const store = readStore();
  const user = store.users.find((item) => item.id === session.uid);
  if (!user) return { user: null, savedPlaces: new Set<string>(), savedEvents: new Set<string>() };
  const saves = store.saves.filter((save) => save.userId === user.id);
  return {
    user: toPublicUser(user),
    savedPlaces: new Set(saves.filter((save) => save.kind === "place").map((save) => save.slug)),
    savedEvents: new Set(saves.filter((save) => save.kind === "event").map((save) => save.slug)),
  };
}

export async function recordView(key: string) {
  await updateStore((store) => {
    store.views[key] = (store.views[key] ?? 0) + 1;
  });
}

export async function recordSearch(query: string) {
  const cleaned = query.trim().toLowerCase();
  if (cleaned.length < 2) return;
  await updateStore((store) => {
    store.searches[cleaned] = (store.searches[cleaned] ?? 0) + 1;
  });
}

function categoryImage(slug: CategorySlug) {
  return categories.find((category) => category.slug === slug)?.image ?? photo("1504674900247-0877df9cc836");
}

export function publishPlace(payload: PlaceSubmission) {
  const area = areaBySlug(payload.area);
  const base = slugify(payload.name) || "place";
  const existing = new Set(allPlaces().map((place) => place.slug));
  let slug = base;
  let n = 2;
  while (existing.has(slug)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  const place: Place = {
    slug,
    name: payload.name,
    categories: [payload.category],
    area: payload.area,
    rating: 0,
    reviewCount: 0,
    priceRange: payload.priceRange,
    summary: payload.description.slice(0, 140),
    description: payload.description,
    address: payload.address,
    lat: (area?.lat ?? 5.56) + 0.002,
    lng: (area?.lng ?? -0.19) + 0.002,
    phone: payload.phone,
    whatsapp: payload.phone,
    instagram: payload.instagram.replace("@", ""),
    images: [categoryImage(payload.category)],
    tags: [payload.area, payload.category, "new"],
    vibes: [],
    schedule: { summary: "Hours shared after listing", open: "09:00", close: "21:00", closed: [] },
    views: 0,
    baseSaves: 0,
  };
  return place;
}

export function publishEvent(payload: EventSubmission): StoredEvent {
  const area = areaBySlug(payload.area);
  const base = slugify(payload.name) || "event";
  const existing = new Set(allEvents().map((event) => event.slug));
  let slug = base;
  let n = 2;
  while (existing.has(slug)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return {
    slug,
    name: payload.name,
    category: payload.category,
    date: payload.date,
    startTime: payload.startTime,
    endTime: payload.endTime,
    area: payload.area,
    venue: payload.venue,
    price: payload.price,
    summary: payload.description.slice(0, 140),
    description: payload.description,
    image: photo("1492684223066-81342ee5ff30"),
    lat: area?.lat ?? 5.56,
    lng: area?.lng ?? -0.19,
    vibes: [],
    views: 0,
  };
}

export async function approveSubmission(id: string) {
  return updateStore((store) => {
    const submission = store.submissions.find((item) => item.id === id);
    if (!submission || submission.status !== "pending") return null;
    if (submission.type === "place") {
      store.customPlaces.push(publishPlace(submission.payload as PlaceSubmission));
    } else if (submission.type === "event") {
      store.customEvents.push(publishEvent(submission.payload as EventSubmission));
    } else if (submission.type === "claim") {
      const payload = submission.payload as { placeSlug: string };
      if (!store.claimed.includes(payload.placeSlug)) store.claimed.push(payload.placeSlug);
    }
    submission.status = "approved";
    return submission;
  });
}

export function savedCounts() {
  const counts = new Map<string, number>();
  for (const place of seedPlaces) counts.set(place.slug, place.baseSaves);
  for (const save of readStore().saves) {
    if (save.kind !== "place") continue;
    counts.set(save.slug, (counts.get(save.slug) ?? 0) + 1);
  }
  return counts;
}

export function reservationCounts() {
  const counts = new Map<string, number>();
  for (const reservation of readStore().reservations) {
    counts.set(reservation.eventSlug, (counts.get(reservation.eventSlug) ?? 0) + reservation.quantity);
  }
  return counts;
}

export { uid };
