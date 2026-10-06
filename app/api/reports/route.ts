import { NextResponse } from "next/server";
import { clean, currentUser } from "@/lib/server/guard";
import { uid, updateStore } from "@/lib/server/store";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in to report a review." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const reviewId = clean(body?.reviewId, 40);
  const reason = clean(body?.reason, 400);
  if (!reviewId || reason.length < 8) return NextResponse.json({ error: "Add a short reason." }, { status: 400 });
  await updateStore((store) => {
    store.reports.unshift({
      id: uid("rpt"),
      reviewId,
      userId: user.id,
      reason,
      createdAt: new Date().toISOString(),
      status: "open",
    });
  });
  return NextResponse.json({ ok: true });
}
