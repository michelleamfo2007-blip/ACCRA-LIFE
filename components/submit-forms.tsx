"use client";

import { useState } from "react";
import { areas, categories } from "@/lib/data/taxonomy";

export function SubmitPlaceForm() {
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
        type: "place",
        payload: {
          name: form.get("name"),
          category: form.get("category"),
          area: form.get("area"),
          address: form.get("address"),
          description: form.get("description"),
          phone: form.get("phone"),
          instagram: form.get("instagram"),
          priceRange: Number(form.get("priceRange")),
        },
      }),
    });
    setPending(false);
    if (!response.ok) {
      setMessage("Check the form and try again.");
      return;
    }
    event.currentTarget.reset();
    setMessage("Submitted. It will appear on AccraLife after an editor approves it.");
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-[28px] border border-line bg-card p-5 sm:grid-cols-2">
      <Field name="name" label="Place name" />
      <Select name="category" label="Category" options={categories.filter((item) => item.slug !== "events").map((item) => ({ value: item.slug, label: item.name }))} />
      <Select name="area" label="Area" options={areas.map((item) => ({ value: item.slug, label: item.name }))} />
      <Select
        name="priceRange"
        label="Price range"
        options={[
          { value: "1", label: "$ Budget" },
          { value: "2", label: "$$ Moderate" },
          { value: "3", label: "$$$ Upscale" },
          { value: "4", label: "$$$$ Luxury" },
        ]}
      />
      <Field name="address" label="Address" className="sm:col-span-2" />
      <Field name="phone" label="Phone" />
      <Field name="instagram" label="Instagram" />
      <label className="text-sm font-medium sm:col-span-2">
        Description
        <textarea name="description" required minLength={40} className="mt-2 min-h-32 w-full rounded-2xl border border-line bg-paper px-3 py-3" />
      </label>
      <button type="submit" disabled={pending} className="rounded-full bg-clay px-5 py-3 text-sm font-semibold text-white sm:col-span-2">
        {pending ? "Sending…" : "Submit place"}
      </button>
      {message ? <p className="text-sm text-ink-soft sm:col-span-2">{message}</p> : null}
    </form>
  );
}

export function SubmitEventForm() {
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
        type: "event",
        payload: {
          name: form.get("name"),
          category: form.get("category"),
          date: form.get("date"),
          startTime: form.get("startTime"),
          endTime: form.get("endTime"),
          area: form.get("area"),
          venue: form.get("venue"),
          price: Number(form.get("price")),
          description: form.get("description"),
        },
      }),
    });
    setPending(false);
    if (!response.ok) {
      setMessage("Check the form and try again.");
      return;
    }
    event.currentTarget.reset();
    setMessage("Submitted. The event goes live after approval.");
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-[28px] border border-line bg-card p-5 sm:grid-cols-2">
      <Field name="name" label="Event name" />
      <Field name="category" label="Category" placeholder="Music, Food, Art…" />
      <Field name="date" label="Date" type="date" />
      <Field name="startTime" label="Start" type="time" />
      <Field name="endTime" label="End" type="time" />
      <Select name="area" label="Area" options={areas.map((item) => ({ value: item.slug, label: item.name }))} />
      <Field name="venue" label="Venue" />
      <Field name="price" label="Price in GHS (0 if free)" type="number" />
      <label className="text-sm font-medium sm:col-span-2">
        Description
        <textarea name="description" required minLength={30} className="mt-2 min-h-32 w-full rounded-2xl border border-line bg-paper px-3 py-3" />
      </label>
      <button type="submit" disabled={pending} className="rounded-full bg-clay px-5 py-3 text-sm font-semibold text-white sm:col-span-2">
        {pending ? "Sending…" : "Submit event"}
      </button>
      {message ? <p className="text-sm text-ink-soft sm:col-span-2">{message}</p> : null}
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  className = "",
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  className?: string;
  placeholder?: string;
}) {
  return (
    <label className={`text-sm font-medium ${className}`}>
      {label}
      <input name={name} type={type} required placeholder={placeholder} className="mt-2 w-full rounded-2xl border border-line bg-paper px-3 py-3" />
    </label>
  );
}

function Select({ name, label, options }: { name: string; label: string; options: { value: string; label: string }[] }) {
  return (
    <label className="text-sm font-medium">
      {label}
      <select name={name} className="mt-2 w-full rounded-2xl border border-line bg-paper px-3 py-3">
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
