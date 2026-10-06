import nextDynamic from "next/dynamic";
import { PageHeader } from "@/components/page-header";
import type { MapPoint } from "@/components/accra-map";
import { areaBySlug, categoryBySlug } from "@/lib/data/taxonomy";
import { allEvents, allPlaces } from "@/lib/server/content";

export const dynamic = "force-dynamic";
export const metadata = { title: "Map", description: "Places and events across Accra." };

const AccraMap = nextDynamic(() => import("@/components/accra-map"), {
  loading: () => <div className="h-[70vh] rounded-[28px] bg-paper-deep" />,
});

export default function MapPage() {
  const points: MapPoint[] = [
    ...allPlaces().map((place) => ({
      id: place.slug,
      kind: "place" as const,
      name: place.name,
      lat: place.lat,
      lng: place.lng,
      href: `/places/${place.slug}`,
      subtitle: `${areaBySlug(place.area)?.name ?? ""} · ${categoryBySlug(place.categories[0])?.name ?? ""}`,
      image: place.images[0],
      category: categoryBySlug(place.categories[0])?.name ?? "Place",
    })),
    ...allEvents().map((event) => ({
      id: `event-${event.slug}`,
      kind: "event" as const,
      name: event.name,
      lat: event.lat,
      lng: event.lng,
      href: `/events/${event.slug}`,
      subtitle: `${areaBySlug(event.area)?.name ?? ""} · ${event.category}`,
      image: event.image,
      category: event.category,
    })),
  ];

  return (
    <div className="pb-16">
      <PageHeader eyebrow="Map" title="Accra, laid out" lede="Places and events across the city. Filter the pins, then open a card." />
      <div className="mx-auto max-w-7xl px-5">
        <AccraMap points={points} />
      </div>
    </div>
  );
}
