import { NextResponse } from "next/server";
import { currentUser, clean } from "@/lib/server/guard";
import { uid, updateStore } from "@/lib/server/store";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in to review." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const placeSlug = clean(body?.placeSlug, 80);
  const text = clean(body?.body, 800);
  const rating = Number(body?.rating);
  const photo = clean(body?.photo, 300);
  if (!placeSlug || text.length < 20 || ![1, 2, 3, 4, 5].includes(rating)) {
    return NextResponse.json({ error: "Add a star rating and at least a few sentences." }, { status: 400 });
  }
  if (photo && !photo.startsWith("https://")) {
    return NextResponse.json({ error: "Photo links need to start with https." }, { status: 400 });
  }
  await updateStore((store) => {
    store.reviews.unshift({
      id: uid("rev"),
      placeSlug,
      userId: user.id,
      userName: user.name,
      rating,
      body: text,
      createdAt: new Date().toISOString(),
      status: "published",
      photo: photo || undefined,
    });
  });
  return NextResponse.json({ ok: true });
}
