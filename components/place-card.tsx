import Image from "next/image";
import Link from "next/link";
import { SaveButton } from "@/components/save-button";
import { areaBySlug, categoryBySlug } from "@/lib/data/taxonomy";
import { priceSymbols, priceWord } from "@/lib/format";
import type { Place } from "@/lib/types";

export function PlaceCard({ place, saved = false, large = false }: { place: Place; saved?: boolean; large?: boolean }) {
  const area = areaBySlug(place.area);
  const category = categoryBySlug(place.categories[0]);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[28px] border border-line bg-card shadow-[0_24px_50px_-36px_rgba(23,20,17,0.55)]">
      <Link href={`/places/${place.slug}`} className={`relative block overflow-hidden bg-paper-deep ${large ? "aspect-[16/10] sm:aspect-[16/9]" : "aspect-[5/4]"}`}>
        {place.images[0] ? (
          <Image
            src={place.images[0]}
            alt={place.name}
            fill
            className="object-cover transition duration-700 group-hover:scale-[1.04]"
            sizes={large ? "100vw" : "(min-width: 1024px) 30vw, 100vw"}
          />
        ) : null}
        {place.featured ? (
          <span className="absolute left-3 top-3 rounded-full bg-paper/92 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink">
            Featured
          </span>
        ) : null}
      </Link>
      <div className="absolute right-3 top-3 z-10">
        <SaveButton kind="place" slug={place.slug} saved={saved} />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 text-xs text-muted">
          <span>
            {category?.emoji} {category?.name}
          </span>
          <span className="font-medium text-ink">{place.rating > 0 ? `★ ${place.rating.toFixed(1)}` : "New"}</span>
        </div>
        <h3 className={`font-display tracking-tight text-ink ${large ? "text-3xl sm:text-4xl" : "text-[1.45rem] leading-tight"}`}>
          <Link href={`/places/${place.slug}`}>{place.name}</Link>
        </h3>
        <p className="text-sm text-ink-soft">
          {area?.name} · <span title={priceWord(place.priceRange)}>{priceSymbols(place.priceRange)}</span>
          {place.verified ? <span className="ml-2 text-forest">Verified</span> : null}
        </p>
        <p className="line-clamp-2 text-sm leading-6 text-muted">{place.summary}</p>
      </div>
    </article>
  );
}
