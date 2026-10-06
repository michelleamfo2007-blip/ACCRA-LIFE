import { NextResponse } from "next/server";
import { placeBySlug, reviewsForPlace } from "@/lib/server/content";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const place = placeBySlug(slug);
  if (!place) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ place, reviews: reviewsForPlace(slug) });
}
