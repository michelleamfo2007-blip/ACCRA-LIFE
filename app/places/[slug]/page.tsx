import Link from "next/link";
import { notFound } from "next/navigation";
import { ClaimPanel } from "@/components/claim-panel";
import { Gallery } from "@/components/gallery";
import { PlaceCard } from "@/components/place-card";
import { ReviewSection } from "@/components/review-section";
import { SaveButton } from "@/components/save-button";
import { TrackView } from "@/components/track-view";
import { areaBySlug, categoryBySlug } from "@/lib/data/taxonomy";
import { mapsUrl, priceSymbols, priceWord, weeklyHours, whatsappUrl } from "@/lib/format";
import { getViewer, placeBySlug, relatedPlaces, reviewsForPlace } from "@/lib/server/content";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const place = placeBySlug(slug);
  return { title: place?.name ?? "Place", description: place?.summary };
}

export default async function PlacePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const place = placeBySlug(slug);
  if (!place) notFound();
  const viewer = await getViewer();
  const area = areaBySlug(place.area);
  const category = categoryBySlug(place.categories[0]);
  const reviews = reviewsForPlace(place.slug, viewer.user?.id);
  const related = relatedPlaces(place);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: place.name,
    description: place.summary,
    address: place.address,
    telephone: place.phone,
    url: place.website,
    image: place.images,
    aggregateRating: place.rating
      ? { "@type": "AggregateRating", ratingValue: place.rating, reviewCount: place.reviewCount }
      : undefined,
  };

  return (
    <article className="mx-auto max-w-6xl px-5 py-8">
      <TrackView name={`place:${place.slug}`} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Gallery images={place.images} name={place.name} />
      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">
            {category?.emoji} {category?.name}
            {place.verified ? " · Verified" : ""}
            {place.featured ? " · Featured" : ""}
          </p>
          <h1 className="mt-1 font-display text-5xl tracking-tight">{place.name}</h1>
          <p className="mt-2 text-ink-soft">
            📍 {area?.name} · {place.rating > 0 ? `★ ${place.rating.toFixed(1)}` : "New"} · {priceSymbols(place.priceRange)} {priceWord(place.priceRange)}
          </p>
        </div>
        <SaveButton kind="place" slug={place.slug} saved={viewer.savedPlaces.has(place.slug)} label />
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
        <div>
          <p className="text-lg leading-8 text-ink-soft">{place.description}</p>
          {place.highlights ? (
            <ul className="mt-6 flex flex-wrap gap-2">
              {place.highlights.map((item) => (
                <li key={item} className="rounded-full bg-paper-deep px-3 py-1.5 text-sm">{item}</li>
              ))}
            </ul>
          ) : null}
          <ReviewSection placeSlug={place.slug} reviews={reviews} user={viewer.user} />
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[28px] border border-line bg-card p-5">
            <h2 className="font-display text-2xl">Visit</h2>
            <p className="mt-3 text-sm leading-6">{place.address}</p>
            <p className="mt-2 text-sm text-muted">{place.schedule.summary}</p>
            <ul className="mt-4 space-y-1 text-sm">
              {weeklyHours(place.schedule).map((row) => (
                <li key={row.day} className="flex justify-between gap-4">
                  <span>{row.day}</span>
                  <span className="text-muted">{row.hours}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-col gap-2 text-sm font-semibold">
              <a href={`tel:${place.phone.replace(/\s/g, "")}`}>Call {place.phone}</a>
              <a href={whatsappUrl(place.whatsapp, `Hi, I found ${place.name} on AccraLife.`)} target="_blank" rel="noreferrer">WhatsApp</a>
              <a href={`https://instagram.com/${place.instagram}`} target="_blank" rel="noreferrer">@{place.instagram}</a>
              {place.website ? <a href={place.website} target="_blank" rel="noreferrer">Website</a> : null}
              <a href={mapsUrl(place.lat, place.lng)} target="_blank" rel="noreferrer">Google Maps directions</a>
              <Link href={`/areas/${place.area}`}>More in {area?.name}</Link>
            </div>
          </div>
        </aside>
      </div>
      <ClaimPanel placeSlug={place.slug} placeName={place.name} />
      {related.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-display text-3xl">You might also like</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <PlaceCard key={item.slug} place={item} saved={viewer.savedPlaces.has(item.slug)} />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
