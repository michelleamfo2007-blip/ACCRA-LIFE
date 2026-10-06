import { NextResponse } from "next/server";
import { allEvents } from "@/lib/server/content";

export async function GET() {
  return NextResponse.json({ events: allEvents() });
}
