"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { formatShortDate } from "@/lib/format";
import type { PublicUser, Review } from "@/lib/types";

export function ReviewSection({
  placeSlug,
  reviews,
  user,
}: {
  placeSlug: string;
  reviews: Review[];
  user: PublicUser | null;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeSlug, rating, body }),
    });
    setPending(false);
    if (response.status === 401) {
      router.push(`/login?next=/places/${placeSlug}`);
      return;
    }
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setMessage(data.error || "Could not post that review.");
      return;
    }
    setBody("");
    setMessage("Thanks. Your review is live, and our editors can still moderate it.");
    router.refresh();
  }

  async function report(reviewId: string) {
    const reason = window.prompt("What should we look at?");
    if (!reason) return;
    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId, reason }),
    });
    if (response.status === 401) {
      router.push(`/login?next=/places/${placeSlug}`);
      return;
    }
    if (response.ok) setMessage("Report sent to the AccraLife editors.");
  }

  return (
    <section className="mt-12">
      <h2 className="font-display text-3xl tracking-tight">Reviews</h2>
      <div className="mt-5 space-y-4">
        {reviews.length === 0 ? <p className="text-sm text-muted">No reviews yet. Be the first person to say what the room is actually like.</p> : null}
        {reviews.map((review) => (
          <article key={review.id} className="rounded-[28px] border border-line bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{review.userName}</p>
                <p className="text-xs text-muted">{formatShortDate(review.createdAt)}</p>
              </div>
              <p className="text-clay">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
            </div>
            <p className="mt-3 text-sm leading-7 text-ink-soft">{review.body}</p>
            {review.status === "pending" ? <p className="mt-2 text-xs font-medium text-clay">Waiting for a quick check.</p> : null}
            {user && user.id !== review.userId ? (
              <button type="button" onClick={() => report(review.id)} className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Report
              </button>
            ) : null}
          </article>
        ))}
      </div>
      <div className="mt-6 rounded-[28px] border border-line bg-card p-5">
        {user ? (
          <form onSubmit={submit} className="space-y-4">
            <h3 className="font-display text-2xl">Write a review</h3>
            <label className="block text-sm font-medium">
              Stars
              <select value={rating} onChange={(event) => setRating(Number(event.target.value))} className="mt-2 w-full rounded-2xl border border-line bg-paper px-3 py-3">
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value} star{value === 1 ? "" : "s"}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Your review
              <textarea
                required
                minLength={20}
                maxLength={800}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                className="mt-2 min-h-32 w-full rounded-2xl border border-line bg-paper px-3 py-3"
                placeholder="What was the room, the food, the wait, the feeling?"
              />
            </label>
            <button type="submit" disabled={pending} className="rounded-full bg-clay px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
              {pending ? "Posting…" : "Post review"}
            </button>
          </form>
        ) : (
          <p className="text-sm text-ink-soft">
            <Link href={`/login?next=/places/${placeSlug}`} className="font-semibold text-clay">
              Sign in
            </Link>{" "}
            to review this place.
          </p>
        )}
        {message ? <p className="mt-4 text-sm text-ink-soft">{message}</p> : null}
      </div>
    </section>
  );
}
