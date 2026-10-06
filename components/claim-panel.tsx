"use client";

import { useState } from "react";

export function ClaimPanel({ placeSlug, placeName }: { placeSlug: string; placeName: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    const response = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "claim",
        payload: {
          placeSlug,
          placeName,
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
          role: form.get("role"),
          note: form.get("note"),
        },
      }),
    });
    setPending(false);
    if (!response.ok) {
      setMessage("We could not send that claim. Check the fields and try again.");
      return;
    }
    setMessage("Claim received. An editor will confirm it before the listing is marked as yours.");
    setOpen(false);
  }

  return (
    <section className="mt-10 rounded-[28px] border border-line bg-forest px-5 py-6 text-paper">
      <p className="font-display text-2xl">Own this business?</p>
      <p className="mt-2 max-w-xl text-sm leading-6 text-paper/75">Claim this listing to manage the profile, photos, and hours. Claims are reviewed before anything changes.</p>
      <button type="button" onClick={() => setOpen((value) => !value)} className="mt-4 rounded-full bg-paper px-4 py-2 text-sm font-semibold text-ink">
        Claim this listing
      </button>
      {open ? (
        <form onSubmit={submit} className="mt-5 grid gap-3 sm:grid-cols-2">
          <Field name="name" label="Your name" />
          <Field name="email" label="Work email" type="email" />
          <Field name="phone" label="Phone" />
          <label className="text-sm">
            Role
            <select name="role" className="mt-1 w-full rounded-2xl border border-white/20 bg-forest-2 px-3 py-3 text-paper">
              <option>Owner</option>
              <option>Manager</option>
              <option>Marketing</option>
            </select>
          </label>
          <label className="text-sm sm:col-span-2">
            How can we confirm this?
            <textarea name="note" required minLength={12} className="mt-1 min-h-24 w-full rounded-2xl border border-white/20 bg-forest-2 px-3 py-3" />
          </label>
          <button type="submit" disabled={pending} className="rounded-full bg-clay px-4 py-3 text-sm font-semibold text-white sm:col-span-2">
            {pending ? "Sending…" : "Submit claim"}
          </button>
        </form>
      ) : null}
      {message ? <p className="mt-4 text-sm text-sand">{message}</p> : null}
    </section>
  );
}

function Field({ name, label, type = "text" }: { name: string; label: string; type?: string }) {
  return (
    <label className="text-sm">
      {label}
      <input name={name} type={type} required className="mt-1 w-full rounded-2xl border border-white/20 bg-forest-2 px-3 py-3 text-paper" />
    </label>
  );
}
