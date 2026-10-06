import { NextResponse } from "next/server";
import { crowdCounts } from "@/lib/server/live";

export async function GET() {
  const crowd = await crowdCounts();
  return NextResponse.json(crowd);
}
