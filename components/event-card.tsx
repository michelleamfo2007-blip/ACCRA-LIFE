import Image from "next/image";
import Link from "next/link";
import { SaveButton } from "@/components/save-button";
import { areaBySlug } from "@/lib/data/taxonomy";
import { formatEventDate, formatPrice, formatTime } from "@/lib/format";
import type { EventItem } from "@/lib/types";

export function EventCard({ event, saved = false }: { event: EventItem; saved?: boolean }) {
  const area = areaBySlug(event.area);
  return (
    <article className="group relative grid overflow-hidden rounded-[28px] border border-line bg-card shadow-[0_24px_50px_-36px_rgba(23,20,17,0.5)] sm:grid-cols-[220px_1fr]">
      <Link href={`/events/${event.slug}`} className="relative block min-h-48 overflow-hidden bg-paper-deep sm:min-h-full">
        {event.image ? <Image src={event.image} alt={event.name} fill className="object-cover transition duration-700 group-hover:scale-[1.04]" sizes="220px" /> : null}
      </Link>
      <div className="absolute right-3 top-3 z-10">
        <SaveButton kind="event" slug={event.slug} saved={saved} />
      </div>
      <div className="flex flex-col justify-between gap-4 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-clay">{event.category}</p>
          <h3 className="mt-2 font-display text-3xl tracking-tight">
            <Link href={`/events/${event.slug}`}>{event.name}</Link>
          </h3>
          <dl className="mt-3 space-y-1 text-sm text-ink-soft">
            <div>📅 {formatEventDate(event.date)}</div>
            <div>🕘 {formatTime(event.startTime)}</div>
            <div>
              📍 {area?.name} · {event.venue}
            </div>
            <div className="font-medium text-ink">{formatPrice(event.price)}</div>
          </dl>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">{event.summary}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/events/${event.slug}`} className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper">
            View Event
          </Link>
          {event.price > 0 ? (
            <Link href={`/events/${event.slug}#tickets`} className="rounded-full border border-line px-4 py-2 text-sm font-semibold">
              Get Tickets
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function EventRailCard({ event }: { event: EventItem }) {
  const area = areaBySlug(event.area);
  return (
    <Link href={`/events/${event.slug}`} className="group w-[280px] shrink-0 snap-start overflow-hidden rounded-[28px] border border-line bg-card">
      <div className="relative aspect-[4/3] bg-paper-deep">
        {event.image ? <Image src={event.image} alt={event.name} fill className="object-cover transition duration-700 group-hover:scale-105" sizes="280px" /> : null}
      </div>
      <div className="p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-clay">{formatEventDate(event.date)}</p>
        <h3 className="mt-1 font-display text-2xl tracking-tight">{event.name}</h3>
        <p className="mt-1 text-sm text-muted">
          {formatTime(event.startTime)} · {area?.name} · {formatPrice(event.price)}
        </p>
      </div>
    </Link>
  );
}
