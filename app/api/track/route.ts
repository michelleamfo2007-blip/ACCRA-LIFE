import { NextResponse } from "next/server";
import { clean } from "@/lib/server/guard";
import { updateStore } from "@/lib/server/store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const key = clean(body?.key, 80);
  if (!/^(place|event|category|area):[a-z0-9-]+$/.test(key)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  await updateStore((store) => {
    store.views[key] = (store.views[key] ?? 0) + 1;
  });
  return NextResponse.json({ ok: true });
}
