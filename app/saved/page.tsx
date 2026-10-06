import Link from "next/link";
import { EventCard } from "@/components/event-card";
import { PageHeader } from "@/components/page-header";
import { PlaceCard } from "@/components/place-card";
import { allEvents, allPlaces, getViewer } from "@/lib/server/content";

export const dynamic = "force-dynamic";
export const metadata = { title: "Saved" };

export default async function SavedPage() {
  const viewer = await getViewer();
  if (!viewer.user) {
    return (
      <div className="mx-auto max-w-xl px-5 py-20 text-center">
        <h1 className="font-display text-5xl">Your Accra list</h1>
        <p className="mt-4 text-ink-soft">Sign in to save places, events, and the plans you are not ready to forget.</p>
        <Link href="/login?next=/saved" className="mt-6 inline-flex rounded-full bg-clay px-5 py-3 text-sm font-semibold text-white">
          Sign in
        </Link>
      </div>
    );
  }
  const places = allPlaces().filter((place) => viewer.savedPlaces.has(place.slug));
  const events = allEvents().filter((event) => viewer.savedEvents.has(event.slug));

  return (
    <div className="pb-16">
      <PageHeader eyebrow="Saved" title="Your list" lede="Places and events you wanted to keep. They stay on this account." />
      <div className="mx-auto max-w-7xl space-y-10 px-5">
        <section>
          <h2 className="font-display text-3xl">Places</h2>
          {places.length === 0 ? <p className="mt-3 text-sm text-muted">No places saved yet.</p> : null}
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {places.map((place) => (
              <PlaceCard key={place.slug} place={place} saved />
            ))}
          </div>
        </section>
        <section>
          <h2 className="font-display text-3xl">Events</h2>
          {events.length === 0 ? <p className="mt-3 text-sm text-muted">No events saved yet.</p> : null}
          <div className="mt-4 grid gap-4">
            {events.map((event) => (
              <EventCard key={event.slug} event={event} saved />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
