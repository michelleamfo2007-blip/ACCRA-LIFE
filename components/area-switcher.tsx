"use client";

import { useMemo, useState } from "react";
import { PlaceCard } from "@/components/place-card";
import { cx } from "@/lib/format";
import type { Area, Place } from "@/lib/types";

export function AreaSwitcher({
  places,
  areas,
  saved,
}: {
  places: Place[];
  areas: Area[];
  saved: string[];
}) {
  const [slug, setSlug] = useState("osu");
  const [status, setStatus] = useState("");
  const visible = useMemo(() => places.filter((place) => place.area === slug).slice(0, 4), [places, slug]);
  const current = areas.find((area) => area.slug === slug);

  function locate() {
    if (!navigator.geolocation) {
      setStatus("Location is not available in this browser.");
      return;
    }
    setStatus("Finding the nearest Accra neighbourhood…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nearest = areas.reduce((best, area) => {
          const distance = (area.lat - position.coords.latitude) ** 2 + (area.lng - position.coords.longitude) ** 2;
          return distance < best.distance ? { slug: area.slug, distance } : best;
        }, { slug: areas[0].slug, distance: Infinity });
        setSlug(nearest.slug);
        setStatus("");
      },
      () => setStatus("We could not read your location. Pick a neighbourhood instead."),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {areas.slice(0, 8).map((area) => (
            <button
              key={area.slug}
              type="button"
              onClick={() => setSlug(area.slug)}
              className={cx(
                "shrink-0 rounded-full px-4 py-2 text-sm font-semibold",
                slug === area.slug ? "bg-ink text-paper" : "border border-line bg-card",
              )}
            >
              {area.name}
            </button>
          ))}
        </div>
        <button type="button" onClick={locate} className="rounded-full border border-clay px-4 py-2 text-sm font-semibold text-clay">
          Use my location
        </button>
      </div>
      {status ? <p className="mb-4 text-sm text-muted">{status}</p> : null}
      <p className="mb-4 text-sm text-ink-soft">{current?.tagline}</p>
      {visible.length === 0 ? (
        <p className="text-sm text-muted">We are still mapping this neighbourhood. Try Osu, Labadi, or East Legon.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((place) => (
            <PlaceCard key={place.slug} place={place} saved={saved.includes(place.slug)} />
          ))}
        </div>
      )}
    </div>
  );
}
