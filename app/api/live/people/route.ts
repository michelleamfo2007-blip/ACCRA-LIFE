import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { findPlayers, listSitePeople } from "@/lib/server/live";
import { CLOUD_COOKIE, readSessionToken } from "@/lib/server/session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = (await cookies()).get(CLOUD_COOKIE)?.value;
  const session = readSessionToken(token);
  if (url.searchParams.get("list") === "1") {
    const people = await listSitePeople();
    return NextResponse.json({ people });
  }
  const people = await findPlayers(url.searchParams.get("q") ?? "", url.searchParams.get("where") ?? "", session?.uid);
  return NextResponse.json({ people });
}
