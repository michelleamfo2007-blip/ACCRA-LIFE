import { NextResponse } from "next/server";
import { areas, categories } from "@/lib/data/taxonomy";
import { allEvents, allPlaces, approveSubmission, reservationCounts, savedCounts } from "@/lib/server/content";
import { currentUser } from "@/lib/server/guard";
import { readStore, toPublicUser, updateStore } from "@/lib/server/store";
import type { ClaimSubmission, EventSubmission, PlaceSubmission, Review } from "@/lib/types";

async function editor() {
  const user = await currentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

function reviewPlaceName(review: Review) {
  return allPlaces().find((place) => place.slug === review.placeSlug)?.name ?? review.placeSlug;
}

export async function GET() {
  const user = await editor();
  if (!user) return NextResponse.json({ error: "Editors only." }, { status: 403 });
  const store = readStore();
  const places = allPlaces();
  const events = allEvents();
  const saves = savedCounts();
  const reservations = reservationCounts();

  const mostViewed = Object.entries(store.views)
    .filter(([key]) => key.startsWith("place:"))
    .map(([key, views]) => {
      const slug = key.slice("place:".length);
      return { slug, name: places.find((place) => place.slug === slug)?.name ?? slug, views };
    })
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  const mostSaved = places
    .map((place) => ({ slug: place.slug, name: place.name, saves: saves.get(place.slug) ?? 0 }))
    .sort((a, b) => b.saves - a.saves)
    .slice(0, 5);

  const topSearches = Object.entries(store.searches)
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const topCategories = categories
    .map((category) => ({ name: category.name, views: store.views[`category:${category.slug}`] ?? 0 }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 6);

  const popularAreas = areas
    .map((area) => ({ name: area.name, count: places.filter((place) => place.area === area.slug).length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const eventEngagement = events
    .map((event) => ({
      name: event.name,
      views: store.views[`event:${event.slug}`] ?? event.views,
      reservations: reservations.get(event.slug) ?? 0,
    }))
    .sort((a, b) => b.views + b.reservations * 10 - (a.views + a.reservations * 10))
    .slice(0, 8);

  return NextResponse.json({
    stats: {
      users: store.users.length,
      places: places.length,
      events: events.length,
      reviews: store.reviews.filter((review) => review.status !== "hidden").length,
      pendingSubmissions: store.submissions.filter((item) => item.status === "pending").length,
      openReports: store.reports.filter((item) => item.status === "open").length,
    },
    mostViewed,
    mostSaved,
    topSearches,
    topCategories,
    popularAreas,
    eventEngagement,
    users: store.users.map(toPublicUser),
    reviews: store.reviews.map((review) => ({
      id: review.id,
      placeName: reviewPlaceName(review),
      userName: review.userName,
      rating: review.rating,
      body: review.body,
      status: review.status,
      createdAt: review.createdAt,
    })),
    submissions: store.submissions.map((submission) => {
      if (submission.type === "place") {
        const payload = submission.payload as PlaceSubmission;
        return { id: submission.id, type: submission.type, status: submission.status, createdAt: submission.createdAt, title: payload.name, detail: `${payload.area} · ${payload.description}` };
      }
      if (submission.type === "event") {
        const payload = submission.payload as EventSubmission;
        return { id: submission.id, type: submission.type, status: submission.status, createdAt: submission.createdAt, title: payload.name, detail: `${payload.date} at ${payload.venue}. ${payload.description}` };
      }
      const payload = submission.payload as ClaimSubmission;
      return { id: submission.id, type: submission.type, status: submission.status, createdAt: submission.createdAt, title: `Claim · ${payload.placeName}`, detail: `${payload.name}, ${payload.role}. ${payload.note}` };
    }),
    reports: store.reports.map((report) => ({
      id: report.id,
      reason: report.reason,
      status: report.status,
      createdAt: report.createdAt,
      review: store.reviews.find((review) => review.id === report.reviewId)?.body ?? "Review removed",
    })),
    places: places.map((place) => ({ slug: place.slug, name: place.name, area: place.area, featured: Boolean(place.featured) })),
  });
}

export async function PATCH(request: Request) {
  const user = await editor();
  if (!user) return NextResponse.json({ error: "Editors only." }, { status: 403 });
  const body = await request.json().catch(() => null);
  const action = body?.action;

  if (action === "feature") {
    const slug = String(body.slug ?? "");
    await updateStore((store) => {
      if (body.featured) {
        if (!store.featured.includes(slug)) store.featured.push(slug);
      } else {
        store.featured = store.featured.filter((item) => item !== slug);
      }
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "review") {
    const status = body.status === "hidden" ? "hidden" : "published";
    await updateStore((store) => {
      const review = store.reviews.find((item) => item.id === body.id);
      if (review) review.status = status;
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "submission") {
    if (body.status === "approved") {
      await approveSubmission(String(body.id));
      return NextResponse.json({ ok: true });
    }
    await updateStore((store) => {
      const submission = store.submissions.find((item) => item.id === body.id);
      if (submission && submission.status === "pending") submission.status = "rejected";
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "report") {
    await updateStore((store) => {
      const report = store.reports.find((item) => item.id === body.id);
      if (report) report.status = "resolved";
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "role") {
    const role = body.role === "admin" ? "admin" : "user";
    await updateStore((store) => {
      const target = store.users.find((item) => item.id === body.id);
      if (!target) return;
      const admins = store.users.filter((item) => item.role === "admin");
      if (target.role === "admin" && role === "user" && admins.length <= 1) return;
      target.role = role;
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
