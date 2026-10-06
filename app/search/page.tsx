import Link from "next/link";
import { EventCard } from "@/components/event-card";
import { PageHeader } from "@/components/page-header";
import { PlaceCard } from "@/components/place-card";
import { SearchForm } from "@/components/search-form";
import { getViewer, recordSearch, searchAll } from "@/lib/server/content";
import { readStore } from "@/lib/server/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Search" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kind?: string }>;
}) {
  const { q = "", kind = "all" } = await searchParams;
  if (q.trim()) await recordSearch(q);
  const viewer = await getViewer();
  const results = q.trim() ? searchAll(q) : { places: [], events: [], areas: [] };
  const searches = Object.entries(readStore().searches)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <div className="pb-16">
      <PageHeader eyebrow="Search" title="Find it in Accra" lede="Places, events, neighbourhoods. Try date night, jollof, Kokrobite, or a gallery." />
      <div className="mx-auto max-w-3xl px-5">
        <SearchForm key={q} initial={q} variant="compact" />
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {[
            ["all", "All"],
            ["places", "Places"],
            ["events", "Events"],
            ["areas", "Areas"],
          ].map(([value, label]) => (
            <Link
              key={value}
              href={`/search?q=${encodeURIComponent(q)}&kind=${value}`}
              className={`rounded-full px-3 py-1.5 font-semibold ${kind === value ? "bg-ink text-paper" : "bg-card border border-line"}`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
      {!q.trim() ? (
        <div className="mx-auto mt-8 max-w-3xl px-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">People are searching</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {searches.map(([query]) => (
              <Link key={query} href={`/search?q=${encodeURIComponent(query)}`} className="rounded-full bg-paper-deep px-3 py-1.5 text-sm">
                {query}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="mx-auto mt-10 max-w-7xl space-y-10 px-5">
          {(kind === "all" || kind === "areas") && results.areas.length > 0 ? (
            <section>
              <h2 className="font-display text-3xl">Areas</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {results.areas.map((area) => (
                  <Link key={area.slug} href={`/areas/${area.slug}`} className="rounded-full bg-card px-4 py-2 text-sm font-semibold border border-line">
                    {area.name}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
          {(kind === "all" || kind === "places") && results.places.length > 0 ? (
            <section>
              <h2 className="font-display text-3xl">Places</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.places.map((place) => (
                  <PlaceCard key={place.slug} place={place} saved={viewer.savedPlaces.has(place.slug)} />
                ))}
              </div>
            </section>
          ) : null}
          {(kind === "all" || kind === "events") && results.events.length > 0 ? (
            <section>
              <h2 className="font-display text-3xl">Events</h2>
              <div className="mt-4 grid gap-4">
                {results.events.map((event) => (
                  <EventCard key={event.slug} event={event} saved={viewer.savedEvents.has(event.slug)} />
                ))}
              </div>
            </section>
          ) : null}
          {results.places.length + results.events.length + results.areas.length === 0 ? (
            <p className="text-ink-soft">Nothing for “{q}” yet. Try beach, jazz, Osu, or brunch.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
