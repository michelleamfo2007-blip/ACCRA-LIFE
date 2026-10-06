import { NextResponse } from "next/server";
import { areaSlugs, categorySlugs, type AreaSlug, type CategorySlug, type PriceRange } from "@/lib/types";
import { clean, currentUser } from "@/lib/server/guard";
import { uid, updateStore } from "@/lib/server/store";

function isArea(value: string): value is AreaSlug {
  return (areaSlugs as readonly string[]).includes(value);
}

function isCategory(value: string): value is CategorySlug {
  return (categorySlugs as readonly string[]).includes(value) && value !== "events";
}

export async function POST(request: Request) {
  const user = await currentUser();
  const body = await request.json().catch(() => null);
  const type = body?.type;
  const payload = body?.payload ?? {};

  if (type === "place") {
    const name = clean(payload.name, 80);
    const category = clean(payload.category, 40);
    const area = clean(payload.area, 40);
    const address = clean(payload.address, 160);
    const description = clean(payload.description, 800);
    const phone = clean(payload.phone, 30);
    const instagram = clean(payload.instagram, 40).replace("@", "");
    const priceRange = Number(payload.priceRange) as PriceRange;
    if (!name || !isCategory(category) || !isArea(area) || address.length < 4 || description.length < 40 || ![1, 2, 3, 4].includes(priceRange)) {
      return NextResponse.json({ error: "Complete the place details." }, { status: 400 });
    }
    await updateStore((store) => {
      store.submissions.unshift({
        id: uid("sub"),
        type: "place",
        status: "pending",
        createdAt: new Date().toISOString(),
        submittedBy: user?.id ?? null,
        payload: { name, category, area, address, description, phone, instagram, priceRange },
      });
    });
    return NextResponse.json({ ok: true });
  }

  if (type === "event") {
    const name = clean(payload.name, 80);
    const category = clean(payload.category, 40);
    const date = clean(payload.date, 10);
    const startTime = clean(payload.startTime, 5);
    const endTime = clean(payload.endTime, 5);
    const area = clean(payload.area, 40);
    const venue = clean(payload.venue, 80);
    const description = clean(payload.description, 800);
    const price = Number(payload.price);
    if (!name || !category || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(startTime) || !isArea(area) || !venue || description.length < 30 || Number.isNaN(price) || price < 0) {
      return NextResponse.json({ error: "Complete the event details." }, { status: 400 });
    }
    await updateStore((store) => {
      store.submissions.unshift({
        id: uid("sub"),
        type: "event",
        status: "pending",
        createdAt: new Date().toISOString(),
        submittedBy: user?.id ?? null,
        payload: { name, category, date, startTime, endTime: endTime || startTime, area, venue, price, description },
      });
    });
    return NextResponse.json({ ok: true });
  }

  if (type === "claim") {
    const placeSlug = clean(payload.placeSlug, 80);
    const placeName = clean(payload.placeName, 80);
    const name = clean(payload.name, 80);
    const email = clean(payload.email, 120);
    const phone = clean(payload.phone, 30);
    const role = clean(payload.role, 40);
    const note = clean(payload.note, 500);
    if (!placeSlug || name.length < 2 || !email.includes("@") || note.length < 12) {
      return NextResponse.json({ error: "Tell us who you are and how to confirm the claim." }, { status: 400 });
    }
    await updateStore((store) => {
      store.submissions.unshift({
        id: uid("sub"),
        type: "claim",
        status: "pending",
        createdAt: new Date().toISOString(),
        submittedBy: user?.id ?? null,
        payload: { placeSlug, placeName, name, email, phone, role, note },
      });
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown submission." }, { status: 400 });
}
