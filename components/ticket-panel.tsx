"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";

export function TicketPanel({
  eventSlug,
  price,
  defaultName = "",
  defaultEmail = "",
}: {
  eventSlug: string;
  price: number;
  defaultName?: string;
  defaultEmail?: string;
}) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    const response = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventSlug,
        name: form.get("name"),
        email: form.get("email"),
        quantity: Number(form.get("quantity")),
      }),
    });
    setPending(false);
    const data = (await response.json()) as { code?: string; error?: string };
    if (!response.ok) {
      setMessage(data.error || "Could not reserve those tickets.");
      return;
    }
    setMessage(`Reserved. Reference ${data.code}. Show it at the door. Card payments are not live yet, so this holds your name and you pay at the venue.`);
  }

  if (price <= 0) {
    return (
      <section id="tickets" className="rounded-[28px] border border-line bg-card p-5">
        <h2 className="font-display text-3xl">Free entry</h2>
        <p className="mt-2 text-sm leading-6 text-ink-soft">No ticket needed. Arrive a little early if the venue is small, and pay only for what you eat or drink.</p>
      </section>
    );
  }

  return (
    <section id="tickets" className="rounded-[28px] border border-line bg-card p-5">
      <h2 className="font-display text-3xl">Get tickets</h2>
      <p className="mt-2 text-sm text-ink-soft">{formatPrice(price)} per person. Reserve now and pay at the door.</p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <input name="name" required defaultValue={defaultName} placeholder="Name" className="w-full rounded-2xl border border-line bg-paper px-3 py-3" />
        <input name="email" type="email" required defaultValue={defaultEmail} placeholder="Email" className="w-full rounded-2xl border border-line bg-paper px-3 py-3" />
        <input name="quantity" type="number" min={1} max={8} defaultValue={2} className="w-full rounded-2xl border border-line bg-paper px-3 py-3" />
        <button type="submit" disabled={pending} className="rounded-full bg-clay px-5 py-3 text-sm font-semibold text-white">
          {pending ? "Reserving…" : "Get Tickets"}
        </button>
      </form>
      {message ? <p className="mt-4 text-sm leading-6 text-ink-soft">{message}</p> : null}
    </section>
  );
}
