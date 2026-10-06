"use client";

import { useEffect, useState } from "react";
import { cx } from "@/lib/format";
import type { MediaKind } from "@/lib/types";

type Owner = { kind: MediaKind; slug: string; name: string; cover: string; count: number };
type Frame = { id: string; src: string; alt: string; featured: boolean; seed: boolean };

const kinds: { id: MediaKind; label: string }[] = [
  { id: "place", label: "Places" },
  { id: "event", label: "Events" },
  { id: "category", label: "Categories" },
  { id: "area", label: "Areas" },
  { id: "collection", label: "Collections" },
];

export function MediaDesk() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [kind, setKind] = useState<MediaKind>("place");
  const [slug, setSlug] = useState("");
  const [frames, setFrames] = useState<Frame[]>([]);
  const [name, setName] = useState("");
  const [alt, setAlt] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/media")
      .then(async (response) => {
        if (!response.ok || cancelled) return;
        const body = (await response.json()) as { owners: Owner[] };
        setOwners(body.owners);
        setSlug((current) => current || body.owners.find((item) => item.kind === "place")?.slug || "");
      })
      .catch(() => {
        if (!cancelled) setNote("The photo desk could not be opened.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    fetch(`/api/admin/media?kind=${kind}&slug=${encodeURIComponent(slug)}`)
      .then(async (response) => {
        if (cancelled) return;
        const body = await response.json();
        if (!response.ok) {
          setFrames([]);
          setName("");
          setNote(body.error ?? "No photos for that listing.");
          return;
        }
        setFrames(body.frames);
        setName(body.name);
        setNote("");
      })
      .catch(() => {
        if (!cancelled) setNote("The photo desk could not be opened.");
      });
    return () => {
      cancelled = true;
    };
  }, [kind, slug]);

  const choices = owners.filter((item) => item.kind === kind);

  async function send(path: string, init: RequestInit) {
    setBusy(true);
    setNote("");
    const response = await fetch(path, init);
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setNote(body.error ?? "That photo could not be saved.");
      return;
    }
    setFrames(body.frames ?? []);
    setUrl("");
    setAlt("");
  }

  async function add(file: File | null, replace = "") {
    const form = new FormData();
    form.set("kind", kind);
    form.set("slug", slug);
    form.set("alt", alt || name);
    if (replace) form.set("replace", replace);
    if (file) form.set("file", file);
    else form.set("url", url);
    await send("/api/admin/media", { method: "POST", body: form });
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {kinds.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setKind(item.id);
              const next = owners.find((owner) => owner.kind === item.id);
              setSlug(next?.slug ?? "");
              setFrames([]);
              setName(next?.name ?? "");
            }}
            className={cx("shrink-0 rounded-full px-4 py-2 text-sm font-semibold", kind === item.id ? "bg-ink text-paper" : "bg-card text-ink-soft")}
          >
            {item.label}
          </button>
        ))}
      </div>

      {choices.length === 0 ? (
        <p className="rounded-3xl border border-line bg-card px-4 py-6 text-sm text-muted">
          Collections do not have listings yet. The photo desk is ready for them when they do.
        </p>
      ) : (
        <>
          <label className="block text-sm font-medium">
            Listing
            <select
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-line bg-card px-3 py-3"
            >
              {choices.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name} · {item.count} {item.count === 1 ? "photo" : "photos"}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {frames.map((frame) => (
              <figure key={frame.id} className="overflow-hidden rounded-3xl border border-line bg-card">
                {/* Admin thumbs are local or Unsplash URLs already allowed by next/image. A plain img keeps the desk from waiting on the optimizer. */}
                <img src={frame.src} alt={frame.alt || name} className="aspect-[4/3] w-full object-cover" />
                <figcaption className="space-y-2 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-clay">
                    {frame.featured ? "Cover" : "Gallery"}
                    {frame.seed ? " · placeholder" : ""}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {frame.featured ? null : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => send("/api/admin/media", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, slug, src: frame.src }) })}
                        className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold"
                      >
                        Set cover
                      </button>
                    )}
                    <label className="cursor-pointer rounded-full border border-line px-3 py-1.5 text-xs font-semibold">
                      Replace
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void add(file, frame.src);
                          event.target.value = "";
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => send("/api/admin/media", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, slug, src: frame.src }) })}
                      className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>

          <form
            className="grid gap-3 rounded-3xl border border-line bg-card p-4"
            onSubmit={(event) => {
              event.preventDefault();
              const file = (event.currentTarget.elements.namedItem("file") as HTMLInputElement).files?.[0] ?? null;
              void add(file);
            }}
          >
            <p className="font-medium">Add a photo to {name}</p>
            <input value={alt} onChange={(event) => setAlt(event.target.value)} placeholder="What is in the photo" className="rounded-2xl border border-line px-3 py-3" />
            <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://images.unsplash.com/..." className="rounded-2xl border border-line px-3 py-3" />
            <input name="file" type="file" accept="image/jpeg,image/png,image/webp" className="text-sm" />
            <button type="submit" disabled={busy || !slug} className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper">
              Upload
            </button>
            <p className="text-xs leading-5 text-muted">JPEG, PNG, or WebP under 4 MB. The site resizes and compresses photos for phones. Use a different photo for every listing.</p>
          </form>
        </>
      )}
      {note ? <p className="text-sm text-clay">{note}</p> : null}
    </div>
  );
}
