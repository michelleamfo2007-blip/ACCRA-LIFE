import { NextResponse } from "next/server";
import { currentUser } from "@/lib/server/guard";
import { toPublicUser } from "@/lib/server/store";

export async function GET() {
  const user = await currentUser();
  return NextResponse.json({ user: user ? toPublicUser(user) : null });
}
