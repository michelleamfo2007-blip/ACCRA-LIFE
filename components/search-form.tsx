"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Suggestion = { href: string; label: string; meta: string };

export function SearchForm({
  initial = "",
  variant = "hero",
  placeholder = "What are you looking for?",
}: {
  initial?: string;
  variant?: "hero" | "compact";
  placeholder?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initial);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    const handle = setTimeout(async () => {
      const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
      if (!response.ok) return;
      const data = (await response.json()) as { suggestions: Suggestion[] };
      setSuggestions(data.suggestions ?? []);
    }, 180);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", onPointer);
    return () => window.removeEventListener("mousedown", onPointer);
  }, []);

  return (
    <div ref={box} className="relative">
      <form
        action="/search"
        method="get"
        className={variant === "hero" ? "flex items-center rounded-full bg-card p-1.5 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.6)]" : "flex items-center rounded-full border border-line bg-card p-1"}
      >
        <label className="sr-only" htmlFor={variant === "hero" ? "home-search" : "compact-search"}>
          Search Accra
        </label>
        <input
          id={variant === "hero" ? "home-search" : "compact-search"}
          name="q"
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(event) => {
            const value = event.target.value;
            setQuery(value);
            setOpen(true);
            if (value.trim().length < 2) setSuggestions([]);
          }}
          onFocus={() => setOpen(true)}
          className={variant === "hero" ? "h-12 flex-1 bg-transparent px-4 text-base text-ink outline-none placeholder:text-muted sm:h-14 sm:text-lg" : "h-10 flex-1 bg-transparent px-3 text-sm outline-none"}
        />
        <button type="submit" className="rounded-full bg-clay px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-clay-deep">
          Search
        </button>
      </form>
      {open && suggestions.length > 0 ? (
        <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-3xl border border-line bg-card py-2 shadow-xl">
          {suggestions.map((item) => (
            <li key={item.href}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-paper"
                onClick={() => {
                  setOpen(false);
                  router.push(item.href);
                }}
              >
                <span className="font-medium">{item.label}</span>
                <span className="text-xs uppercase tracking-[0.14em] text-muted">{item.meta}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
