import { NextResponse } from "next/server";
import { currentUser } from "@/lib/server/guard";
import { readStore, uid, updateStore } from "@/lib/server/store";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ places: [], events: [] });
  const saves = readStore().saves.filter((save) => save.userId === user.id);
  return NextResponse.json({
    places: saves.filter((save) => save.kind === "place").map((save) => save.slug),
    events: saves.filter((save) => save.kind === "event").map((save) => save.slug),
  });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in to save." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const kind = body?.kind === "event" ? "event" : body?.kind === "place" ? "place" : null;
  const slug = String(body?.slug ?? "");
  if (!kind || slug.length < 2) return NextResponse.json({ error: "Missing save." }, { status: 400 });
  await updateStore((store) => {
    const exists = store.saves.some((save) => save.userId === user.id && save.kind === kind && save.slug === slug);
    if (!exists) {
      store.saves.push({ id: uid("sav"), userId: user.id, kind, slug, createdAt: new Date().toISOString() });
    }
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in to save." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const kind = body?.kind;
  const slug = String(body?.slug ?? "");
  await updateStore((store) => {
    store.saves = store.saves.filter((save) => !(save.userId === user.id && save.kind === kind && save.slug === slug));
  });
  return NextResponse.json({ ok: true });
}
