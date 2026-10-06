import { NextResponse } from "next/server";
import { searchAll } from "@/lib/server/content";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  const { places, events, areas } = searchAll(query);
  return NextResponse.json({
    suggestions: [
      ...places.slice(0, 4).map((place) => ({ href: `/places/${place.slug}`, label: place.name, meta: "Place" })),
      ...events.slice(0, 3).map((event) => ({ href: `/events/${event.slug}`, label: event.name, meta: "Event" })),
      ...areas.slice(0, 2).map((area) => ({ href: `/areas/${area.slug}`, label: area.name, meta: "Area" })),
    ],
  });
}
