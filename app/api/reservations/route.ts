import { NextResponse } from "next/server";
import { clean, currentUser } from "@/lib/server/guard";
import { eventBySlug } from "@/lib/server/content";
import { uid, updateStore } from "@/lib/server/store";

export async function POST(request: Request) {
  const user = await currentUser();
  const body = await request.json().catch(() => null);
  const eventSlug = clean(body?.eventSlug, 80);
  const name = clean(body?.name, 80);
  const email = clean(body?.email, 120);
  const quantity = Number(body?.quantity);
  const event = eventBySlug(eventSlug);
  if (!event || event.price <= 0) return NextResponse.json({ error: "That event is not ticketed." }, { status: 400 });
  if (name.length < 2 || !email.includes("@") || quantity < 1 || quantity > 8) {
    return NextResponse.json({ error: "Add a name, email, and how many people are coming." }, { status: 400 });
  }
  const code = `AL-${Math.floor(1000 + Math.random() * 9000)}`;
  await updateStore((store) => {
    store.reservations.unshift({
      id: uid("rsv"),
      code,
      userId: user?.id ?? null,
      name,
      email,
      eventSlug,
      quantity,
      createdAt: new Date().toISOString(),
    });
  });
  return NextResponse.json({ ok: true, code });
}
