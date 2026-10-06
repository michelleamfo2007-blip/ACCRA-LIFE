import { NextResponse } from "next/server";
import { allPlaces } from "@/lib/server/content";

export async function GET() {
  return NextResponse.json({ places: allPlaces() });
}
