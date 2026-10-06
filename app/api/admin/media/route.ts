import { mkdirSync, writeFileSync, existsSync, unlinkSync } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { areas, categories } from "@/lib/data/taxonomy";
import { framesFor, type Frame } from "@/lib/media";
import { allEvents, allPlaces } from "@/lib/server/content";
import { currentUser } from "@/lib/server/guard";
import { readStore, uid, updateStore } from "@/lib/server/store";
import type { MediaAsset, MediaKind } from "@/lib/types";

export const dynamic = "force-dynamic";

const kinds: MediaKind[] = ["place", "event", "category", "area", "collection"];
const maxShots = 12;
const maxBytes = 4_000_000;

const fileTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

async function editor() {
  const user = await currentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

type Owner = { kind: MediaKind; slug: string; name: string; fallback: string[] };

function owners(): Owner[] {
  return [
    ...allPlaces().map((place) => ({ kind: "place" as const, slug: place.slug, name: place.name, fallback: place.images })),
    ...allEvents().map((event) => ({ kind: "event" as const, slug: event.slug, name: event.name, fallback: event.images })),
    ...categories.map((category) => ({ kind: "category" as const, slug: category.slug, name: category.name, fallback: [category.image] })),
    ...areas.map((area) => ({ kind: "area" as const, slug: area.slug, name: area.name, fallback: [area.image] })),
  ];
}

function ownerOf(kind: string, slug: string) {
  return owners().find((item) => item.kind === kind && item.slug === slug) ?? null;
}

function isKind(value: string): value is MediaKind {
  return kinds.includes(value as MediaKind);
}

function frames(owner: Owner) {
  return framesFor(owner.kind, owner.slug, owner.fallback, readStore().library, owner.name);
}

function usedElsewhere(src: string, kind: MediaKind, slug: string) {
  const library = readStore().library;
  for (const owner of owners()) {
    if (owner.kind === kind && owner.slug === slug) continue;
    const shots = framesFor(owner.kind, owner.slug, owner.fallback, library);
    if (shots.some((shot) => shot.src === src)) return owner.name;
  }
  return null;
}

function safeName(src: string) {
  if (!src.startsWith("/media/")) return null;
  const name = src.slice("/media/".length);
  if (!/^img_[a-f0-9]+\.(jpg|png|webp)$/.test(name)) return null;
  return name;
}

function dropFile(src: string) {
  const name = safeName(src);
  if (!name) return;
  const stillUsed = readStore().library.some((item) => item.src === src && !item.removed);
  if (stillUsed) return;
  const full = path.join(process.cwd(), "public", "media", name);
  if (existsSync(full)) unlinkSync(full);
}

function upsert(storeLibrary: MediaAsset[], asset: Omit<MediaAsset, "id" | "createdAt"> & { id?: string }) {
  const current = storeLibrary.find((item) => item.kind === asset.kind && item.slug === asset.slug && item.src === asset.src);
  if (current) {
    current.alt = asset.alt || current.alt;
    current.featured = asset.featured;
    current.removed = asset.removed;
    return current;
  }
  const created: MediaAsset = {
    id: asset.id ?? uid("img"),
    kind: asset.kind,
    slug: asset.slug,
    src: asset.src,
    alt: asset.alt,
    featured: asset.featured,
    removed: asset.removed,
    createdAt: new Date().toISOString(),
  };
  storeLibrary.push(created);
  return created;
}

export async function GET(request: Request) {
  const user = await editor();
  if (!user) return NextResponse.json({ error: "Editors only." }, { status: 403 });
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind") ?? "";
  const slug = url.searchParams.get("slug") ?? "";

  if (!kind && !slug) {
    const library = readStore().library;
    return NextResponse.json({
      owners: owners().map((owner) => {
        const shots = framesFor(owner.kind, owner.slug, owner.fallback, library, owner.name);
        return { kind: owner.kind, slug: owner.slug, name: owner.name, cover: shots[0]?.src ?? "", count: shots.length };
      }),
    });
  }

  if (!isKind(kind)) return NextResponse.json({ error: "Unknown image owner." }, { status: 400 });
  const owner = ownerOf(kind, slug);
  if (!owner) return NextResponse.json({ error: "That place or event is not on AccraLife yet." }, { status: 404 });
  return NextResponse.json({ kind, slug, name: owner.name, frames: frames(owner) });
}

export async function POST(request: Request) {
  const user = await editor();
  if (!user) return NextResponse.json({ error: "Editors only." }, { status: 403 });
  const form = await request.formData();
  const kind = String(form.get("kind") ?? "");
  const slug = String(form.get("slug") ?? "");
  const alt = String(form.get("alt") ?? "").trim();
  const replace = String(form.get("replace") ?? "");
  if (!isKind(kind)) return NextResponse.json({ error: "Unknown image owner." }, { status: 400 });
  const owner = ownerOf(kind, slug);
  if (!owner) return NextResponse.json({ error: "That place or event is not on AccraLife yet." }, { status: 404 });

  const file = form.get("file");
  let src = String(form.get("url") ?? "").trim();
  if (file instanceof File && file.size > 0) {
    if (file.size > maxBytes) return NextResponse.json({ error: "Keep each photo under 4 MB so phones can load it." }, { status: 400 });
    const ext = fileTypes.get(file.type);
    if (!ext) return NextResponse.json({ error: "Use a JPEG, PNG, or WebP photo." }, { status: 400 });
    const id = uid("img");
    const filename = `${id}.${ext}`;
    const dir = path.join(process.cwd(), "public", "media");
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
    src = `/media/${filename}`;
  } else if (!src.startsWith("https://images.unsplash.com/")) {
    return NextResponse.json({ error: "Upload a photo, or paste an Unsplash image link already used on AccraLife." }, { status: 400 });
  }

  const clash = usedElsewhere(src, kind, slug);
  const existing = frames(owner);
  if (clash || (!replace && existing.length >= maxShots)) {
    dropFile(src);
    if (clash) return NextResponse.json({ error: `That photo is already on ${clash}. Each listing needs its own image.` }, { status: 409 });
    return NextResponse.json({ error: "Twelve photos is the gallery limit. Delete one before adding another." }, { status: 400 });
  }

  await updateStore((store) => {
    if (replace) {
      upsert(store.library, { kind, slug, src: replace, alt, featured: false, removed: true });
      const fileSrc = safeName(replace);
      if (fileSrc) {
        const full = path.join(process.cwd(), "public", "media", fileSrc);
        if (existsSync(full)) unlinkSync(full);
      }
    }
    const featured = existing.length === 0 || Boolean(replace && existing[0]?.src === replace);
    if (featured) {
      for (const item of store.library) {
        if (item.kind === kind && item.slug === slug) item.featured = false;
      }
    }
    upsert(store.library, { kind, slug, src, alt: alt || owner.name, featured, removed: false });
  });

  return NextResponse.json({ ok: true, frames: frames(ownerOf(kind, slug)!) });
}

export async function PATCH(request: Request) {
  const user = await editor();
  if (!user) return NextResponse.json({ error: "Editors only." }, { status: 403 });
  const body = await request.json().catch(() => null);
  const kind = String(body?.kind ?? "");
  const slug = String(body?.slug ?? "");
  const src = String(body?.src ?? "");
  if (!isKind(kind) || !src) return NextResponse.json({ error: "Choose a photo first." }, { status: 400 });
  const owner = ownerOf(kind, slug);
  if (!owner) return NextResponse.json({ error: "That place or event is not on AccraLife yet." }, { status: 404 });
  const shot = frames(owner).find((frame) => frame.src === src);
  if (!shot) return NextResponse.json({ error: "That photo is not on this listing." }, { status: 404 });

  await updateStore((store) => {
    for (const item of store.library) {
      if (item.kind === kind && item.slug === slug) item.featured = false;
    }
    upsert(store.library, { kind, slug, src, alt: shot.alt || owner.name, featured: true, removed: false });
  });

  return NextResponse.json({ ok: true, frames: frames(owner) });
}

export async function DELETE(request: Request) {
  const user = await editor();
  if (!user) return NextResponse.json({ error: "Editors only." }, { status: 403 });
  const body = await request.json().catch(() => null);
  const kind = String(body?.kind ?? "");
  const slug = String(body?.slug ?? "");
  const src = String(body?.src ?? "");
  if (!isKind(kind) || !src) return NextResponse.json({ error: "Choose a photo first." }, { status: 400 });
  const owner = ownerOf(kind, slug);
  if (!owner) return NextResponse.json({ error: "That place or event is not on AccraLife yet." }, { status: 404 });

  await updateStore((store) => {
    upsert(store.library, { kind, slug, src, alt: owner.name, featured: false, removed: true });
  });
  dropFile(src);
  return NextResponse.json({ ok: true, frames: frames(owner) });
}
