import Image from "next/image";
import { notFound } from "next/navigation";
import { EventCard } from "@/components/event-card";
import { PlaceCard } from "@/components/place-card";
import { TrackView } from "@/components/track-view";
import { areaBySlug } from "@/lib/data/taxonomy";
import { coverOf, eventsForArea, getViewer, placesForArea } from "@/lib/server/content";
import { areaSlugs, type AreaSlug, type CategorySlug } from "@/lib/types";

export const dynamic = "force-dynamic";

const groups: { title: string; category: CategorySlug }[] = [
  { title: "Restaurants", category: "food-dining" },
  { title: "Nightlife", category: "nightlife" },
  { title: "Cafés", category: "cafes" },
  { title: "Shopping", category: "shopping" },
  { title: "Things to do", category: "things-to-do" },
];

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const area = areaBySlug(slug);
  return { title: area ? `Explore ${area.name}` : "Area", description: area?.description };
}

export default async function AreaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!areaSlugs.includes(slug as AreaSlug)) notFound();
  const area = areaBySlug(slug);
  if (!area) notFound();
  const viewer = await getViewer();
  const places = placesForArea(slug);
  const events = eventsForArea(slug);
  const image = coverOf("area", area.slug, area.image);

  return (
    <div className="pb-16">
      <TrackView name={`area:${slug}`} />
      <section className="relative min-h-[420px] overflow-hidden bg-forest">
        {image ? <Image src={image} alt={area.name} fill priority className="object-cover opacity-60" sizes="100vw" /> : null}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        <div className="relative mx-auto flex min-h-[420px] max-w-7xl flex-col justify-end px-5 py-12 text-paper">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sand">Explore</p>
          <h1 className="mt-2 font-display text-6xl tracking-tight">{area.name}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-paper/85">{area.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {area.knownFor.map((item) => (
              <span key={item} className="rounded-full border border-white/20 px-3 py-1 text-sm">{item}</span>
            ))}
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-7xl space-y-12 px-5 py-12">
        {groups.map((group) => {
          const items = places.filter((place) => place.categories.includes(group.category));
          if (items.length === 0) return null;
          return (
            <section key={group.title}>
              <h2 className="font-display text-3xl">{group.title}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((place) => (
                  <PlaceCard key={place.slug} place={place} saved={viewer.savedPlaces.has(place.slug)} />
                ))}
              </div>
            </section>
          );
        })}
        <section>
          <h2 className="font-display text-3xl">Events</h2>
          {events.length === 0 ? <p className="mt-3 text-sm text-muted">No listed events in {area.name} right now.</p> : null}
          <div className="mt-4 grid gap-4">
            {events.map((event) => (
              <EventCard key={event.slug} event={event} saved={viewer.savedEvents.has(event.slug)} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
