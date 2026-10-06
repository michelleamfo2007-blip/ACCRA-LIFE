import type { MetadataRoute } from "next";
import { seedEvents } from "@/lib/data/events";
import { seedPlaces } from "@/lib/data/places";
import { areas, categories, vibes } from "@/lib/data/taxonomy";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://accralife.app";
  const staticRoutes = ["", "/explore", "/events", "/areas", "/map", "/vibe", "/search", "/submit/place", "/submit/event"].map((path) => ({
    url: `${base}${path}`,
  }));
  return [
    ...staticRoutes,
    ...categories.map((category) => ({ url: `${base}/category/${category.slug}` })),
    ...areas.map((area) => ({ url: `${base}/areas/${area.slug}` })),
    ...vibes.map((vibe) => ({ url: `${base}/vibe/${vibe.slug}` })),
    ...seedPlaces.map((place) => ({ url: `${base}/places/${place.slug}` })),
    ...seedEvents.map((event) => ({ url: `${base}/events/${event.slug}` })),
  ];
}
