import { notFound } from "next/navigation";
import { EventCard } from "@/components/event-card";
import { PageHeader } from "@/components/page-header";
import { PlaceCard } from "@/components/place-card";
import { vibeBySlug } from "@/lib/data/taxonomy";
import { eventsForVibe, getViewer, placesForVibe } from "@/lib/server/content";
import { vibeSlugs, type VibeSlug } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const vibe = vibeBySlug(slug);
  return { title: vibe?.name ?? "Vibe", description: vibe?.lede };
}

export default async function VibeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!vibeSlugs.includes(slug as VibeSlug)) notFound();
  const vibe = vibeBySlug(slug);
  if (!vibe) notFound();
  const viewer = await getViewer();
  const places = placesForVibe(slug as VibeSlug);
  const events = eventsForVibe(slug as VibeSlug);

  return (
    <div className="pb-16">
      <PageHeader eyebrow="What’s your vibe?" title={`${vibe.emoji} ${vibe.name}`} lede={vibe.lede} />
      {events.length > 0 ? (
        <section className="mx-auto mb-10 grid max-w-7xl gap-4 px-5">
          <h2 className="font-display text-3xl">Happening</h2>
          {events.slice(0, 3).map((event) => (
            <EventCard key={event.slug} event={event} saved={viewer.savedEvents.has(event.slug)} />
          ))}
        </section>
      ) : null}
      <section className="mx-auto grid max-w-7xl gap-4 px-5 sm:grid-cols-2 lg:grid-cols-3">
        {places.map((place) => (
          <PlaceCard key={place.slug} place={place} saved={viewer.savedPlaces.has(place.slug)} />
        ))}
      </section>
    </div>
  );
}
