import { notFound } from "next/navigation";
import { EventCard } from "@/components/event-card";
import { PageHeader } from "@/components/page-header";
import { PlaceCard } from "@/components/place-card";
import { TrackView } from "@/components/track-view";
import { categoryBySlug } from "@/lib/data/taxonomy";
import { allEvents, getViewer, placesForCategory } from "@/lib/server/content";
import { categorySlugs, type CategorySlug } from "@/lib/types";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return params.then(({ slug }) => {
    const category = categoryBySlug(slug);
    return { title: category?.name ?? "Category", description: category?.lede };
  });
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!categorySlugs.includes(slug as CategorySlug)) notFound();
  const category = categoryBySlug(slug);
  if (!category) notFound();
  const viewer = await getViewer();
  const places = placesForCategory(slug as CategorySlug);
  const events = slug === "events" || slug === "date-ideas" ? allEvents().filter((event) => (slug === "events" ? true : event.vibes.includes("date-night"))) : [];

  return (
    <div className="pb-16">
      <TrackView name={`category:${slug}`} />
      <PageHeader eyebrow="Category" title={`${category.emoji} ${category.name}`} lede={category.lede} />
      {events.length > 0 ? (
        <div className="mx-auto mb-10 grid max-w-7xl gap-4 px-5">
          {events.slice(0, 4).map((event) => (
            <EventCard key={event.slug} event={event} saved={viewer.savedEvents.has(event.slug)} />
          ))}
        </div>
      ) : null}
      <div className="mx-auto grid max-w-7xl gap-4 px-5 sm:grid-cols-2 lg:grid-cols-3">
        {places.map((place) => (
          <PlaceCard key={place.slug} place={place} saved={viewer.savedPlaces.has(place.slug)} />
        ))}
      </div>
      {places.length === 0 && events.length === 0 ? <p className="px-5 text-center text-muted">Nothing in this category yet.</p> : null}
    </div>
  );
}
