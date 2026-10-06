"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cx } from "@/lib/format";

export function SaveButton({
  kind,
  slug,
  saved = false,
  label = false,
}: {
  kind: "place" | "event";
  slug: string;
  saved?: boolean;
  label?: boolean;
}) {
  const [on, setOn] = useState(saved);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function toggle() {
    if (pending) return;
    setPending(true);
    const response = await fetch("/api/me/saves", {
      method: on ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, slug }),
    });
    setPending(false);
    if (response.status === 401) {
      const next = `${window.location.pathname}${window.location.search}`;
      router.push(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    if (response.ok) setOn(!on);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Remove from saved" : "Save"}
      className={cx(
        "inline-flex items-center gap-2 rounded-full border border-white/40 bg-paper/90 text-ink shadow-sm backdrop-blur transition hover:bg-card",
        label ? "px-4 py-2 text-sm font-medium" : "h-10 w-10 justify-center",
      )}
    >
      <Heart filled={on} />
      {label ? (on ? "Saved" : "Save") : null}
    </button>
  );
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className={filled ? "fill-clay text-clay" : "fill-none text-ink"}>
      <path
        d="M12 20s-7-4.4-7-9.1C5 8 6.8 6.2 9.1 6.2c1.3 0 2.4.6 2.9 1.6.5-1 1.6-1.6 2.9-1.6C17.2 6.2 19 8 19 10.9 19 15.6 12 20 12 20z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}
