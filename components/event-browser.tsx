"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EventCard } from "@/components/event-card";
import { areas } from "@/lib/data/taxonomy";
import { cx } from "@/lib/format";
import type { EventItem, WindowKey } from "@/lib/types";

const windows: { id: WindowKey | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "weekend", label: "This weekend" },
  { id: "week", label: "This week" },
  { id: "upcoming", label: "Upcoming" },
];

export function EventBrowser({
  events,
  saved,
  initial,
}: {
  events: EventItem[];
  saved: string[];
  initial: { when?: string; area?: string; category?: string; price?: string };
}) {
  const router = useRouter();
  const [when, setWhen] = useState(initial.when || "all");
  const [area, setArea] = useState(initial.area || "all");
  const [category, setCategory] = useState(initial.category || "all");
  const [price, setPrice] = useState(initial.price || "all");
  const categories = useMemo(() => Array.from(new Set(events.map((event) => event.category))), [events]);

  const visible = events.filter((event) => {
    if (when !== "all" && !event.windows.includes(when as WindowKey)) return false;
    if (area !== "all" && event.area !== area) return false;
    if (category !== "all" && event.category !== category) return false;
    if (price === "free" && event.price > 0) return false;
    if (price === "paid" && event.price <= 0) return false;
    if (price === "under-100" && (event.price <= 0 || event.price >= 100)) return false;
    if (price === "100-plus" && event.price < 100) return false;
    return true;
  });

  function sync(next: { when?: string; area?: string; category?: string; price?: string }) {
    const params = new URLSearchParams();
    const state = { when, area, category, price, ...next };
    if (state.when && state.when !== "all") params.set("when", state.when);
    if (state.area && state.area !== "all") params.set("area", state.area);
    if (state.category && state.category !== "all") params.set("category", state.category);
    if (state.price && state.price !== "all") params.set("price", state.price);
    const query = params.toString();
    router.replace(query ? `/events?${query}` : "/events", { scroll: false });
  }

  return (
    <div className="mx-auto max-w-7xl px-5 pb-16">
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
        {windows.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setWhen(item.id);
              sync({ when: item.id });
            }}
            className={cx(
              "shrink-0 rounded-full px-4 py-2 text-sm font-semibold",
              when === item.id ? "bg-ink text-paper" : "bg-card text-ink-soft border border-line",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <Select
          label="Location"
          value={area}
          onChange={(value) => {
            setArea(value);
            sync({ area: value });
          }}
          options={[{ value: "all", label: "All areas" }, ...areas.map((item) => ({ value: item.slug, label: item.name }))]}
        />
        <Select
          label="Category"
          value={category}
          onChange={(value) => {
            setCategory(value);
            sync({ category: value });
          }}
          options={[{ value: "all", label: "All categories" }, ...categories.map((item) => ({ value: item, label: item }))]}
        />
        <Select
          label="Price"
          value={price}
          onChange={(value) => {
            setPrice(value);
            sync({ price: value });
          }}
          options={[
            { value: "all", label: "Any price" },
            { value: "free", label: "Free" },
            { value: "paid", label: "Paid" },
            { value: "under-100", label: "Under GHS 100" },
            { value: "100-plus", label: "GHS 100 and above" },
          ]}
        />
      </div>
      {visible.length === 0 ? (
        <p className="rounded-[28px] border border-dashed border-line bg-card px-6 py-16 text-center text-ink-soft">
          Nothing matches those filters. Widen the date or the area and Accra will show up.
        </p>
      ) : (
        <div className="grid gap-4">
          {visible.map((event) => (
            <EventCard key={event.slug} event={event} saved={saved.includes(event.slug)} />
          ))}
        </div>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-line bg-card px-3 py-3 text-sm font-medium normal-case tracking-normal text-ink"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
