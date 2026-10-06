import Link from "next/link";
import { notFound } from "next/navigation";
import { Gallery } from "@/components/gallery";
import { SaveButton } from "@/components/save-button";
import { TicketPanel } from "@/components/ticket-panel";
import { TrackView } from "@/components/track-view";
import { areaBySlug } from "@/lib/data/taxonomy";
import { formatEventDate, formatPrice, formatTime, mapsUrl } from "@/lib/format";
import { eventBySlug, getViewer } from "@/lib/server/content";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = eventBySlug(slug);
  return { title: event?.name ?? "Event", description: event?.summary };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = eventBySlug(slug);
  if (!event) notFound();
  const viewer = await getViewer();
  const area = areaBySlug(event.area);

  return (
    <article className="mx-auto max-w-5xl px-5 py-8">
      <TrackView name={`event:${event.slug}`} />
      {event.images.length ? (
        <Gallery images={event.images} name={event.name} />
      ) : (
        <div className="aspect-[16/8] rounded-[32px] bg-paper-deep" />
      )}
      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-clay">{event.category}</p>
          <h1 className="mt-2 font-display text-5xl tracking-tight">{event.name}</h1>
        </div>
        <SaveButton kind="event" slug={event.slug} saved={viewer.savedEvents.has(event.slug)} label />
      </div>
      <dl className="mt-6 grid gap-3 text-ink-soft sm:grid-cols-2">
        <div className="rounded-3xl bg-card p-4">📅 {formatEventDate(event.date)}</div>
        <div className="rounded-3xl bg-card p-4">🕘 {formatTime(event.startTime)} – {formatTime(event.endTime)}</div>
        <div className="rounded-3xl bg-card p-4">📍 {area?.name} · {event.venue}</div>
        <div className="rounded-3xl bg-card p-4">{formatPrice(event.price)}</div>
      </dl>
      <p className="mt-8 max-w-3xl text-lg leading-8 text-ink-soft">{event.description}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        {event.placeSlug ? (
          <Link href={`/places/${event.placeSlug}`} className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper">
            View venue
          </Link>
        ) : null}
        <a href={mapsUrl(event.lat, event.lng)} target="_blank" rel="noreferrer" className="rounded-full border border-line px-4 py-2 text-sm font-semibold">
          Directions
        </a>
        <Link href={`/areas/${event.area}`} className="rounded-full border border-line px-4 py-2 text-sm font-semibold">
          More in {area?.name}
        </Link>
      </div>
      <div className="mt-10 max-w-xl">
        <TicketPanel eventSlug={event.slug} price={event.price} defaultName={viewer.user?.name} defaultEmail={viewer.user?.email} />
      </div>
    </article>
  );
}
