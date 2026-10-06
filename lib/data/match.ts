import type { CategorySlug, EventItem, Place, VibeSlug, WindowKey } from "@/lib/types";

export function matchesCategory(place: Place, slug: CategorySlug) {
  if (slug === "events") return false;
  if (place.categories.includes(slug)) return true;
  if (slug === "date-ideas") return place.vibes.includes("date-night");
  if (slug === "work-study") return place.vibes.includes("work-mode");
  if (slug === "family-kids") return place.vibes.includes("family");
  return false;
}

export function matchesVibe(place: Place, slug: VibeSlug) {
  return place.vibes.includes(slug);
}

const expansions: Record<string, string[]> = {
  coffee: ["cafe", "café"],
  cafe: ["café", "coffee"],
  café: ["cafe", "coffee"],
  club: ["nightlife", "dj"],
  cheap: ["budget"],
  romantic: ["date", "date night"],
  beach: ["labadi", "kokrobite", "bojo"],
  party: ["nightlife", "afrobeats"],
  art: ["gallery"],
  kids: ["family"],
  hotel: ["stay"],
  work: ["cowork", "cafe", "wifi"],
};

export function searchText(query: string, ...parts: Array<string | undefined>) {
  const cleaned = query.trim().toLowerCase();
  if (!cleaned) return 0;
  const hay = parts.filter(Boolean).join(" ").toLowerCase();
  if (hay.includes(cleaned)) return 8;
  const tokens = cleaned.split(/\s+/).flatMap((token) => [token, ...(expansions[token] ?? [])]);
  let score = 0;
  for (const token of tokens) {
    if (token.length < 2) continue;
    if (hay.includes(token)) score += 2;
  }
  return score;
}

export function eventInWindow(event: EventItem, windowKey: WindowKey | "all") {
  if (windowKey === "all") return true;
  return event.windows.includes(windowKey);
}
