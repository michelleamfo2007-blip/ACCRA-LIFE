import type { MediaAsset, MediaKind } from "@/lib/types";

export type Frame = {
  id: string;
  src: string;
  alt: string;
  featured: boolean;
  seed: boolean;
};

export function framesFor(kind: MediaKind, slug: string, fallback: string[], edits: MediaAsset[], alt = ""): Frame[] {
  const mine = edits.filter((item) => item.kind === kind && item.slug === slug);
  const removed = new Set(mine.filter((item) => item.removed).map((item) => item.src));
  const seen = new Set<string>();
  const frames: Frame[] = [];

  for (const item of mine) {
    if (item.removed || !item.src || seen.has(item.src)) continue;
    seen.add(item.src);
    frames.push({ id: item.id, src: item.src, alt: item.alt || alt, featured: item.featured, seed: false });
  }

  fallback.forEach((src, index) => {
    if (!src || removed.has(src) || seen.has(src)) return;
    seen.add(src);
    frames.push({
      id: `seed_${kind}_${slug}_${index}`,
      src,
      alt,
      featured: false,
      seed: true,
    });
  });

  const featured = frames.find((frame) => frame.featured) ?? frames[0];
  if (!featured) return [];
  return [featured, ...frames.filter((frame) => frame.src !== featured.src)].map((frame, index) => ({
    ...frame,
    featured: index === 0,
  }));
}

export function shotList(kind: MediaKind, slug: string, fallback: string[], edits: MediaAsset[]) {
  return framesFor(kind, slug, fallback, edits).map((frame) => frame.src);
}
