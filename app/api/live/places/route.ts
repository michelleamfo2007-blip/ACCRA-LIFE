import { NextResponse } from "next/server";
import { loadPlaces } from "@/lib/server/live";

export async function GET() {
  const places = await loadPlaces();
  return NextResponse.json({ count: places.length, places });
}
