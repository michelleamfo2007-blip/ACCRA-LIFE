import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { vibes } from "@/lib/data/taxonomy";

export const metadata = { title: "What’s your vibe?" };

export default function VibePage() {
  return (
    <div className="pb-16">
      <PageHeader eyebrow="Mood" title="What’s your vibe?" lede="Tell AccraLife the kind of day you want. We’ll point you at the rooms, beaches, and plans that fit." />
      <div className="mx-auto grid max-w-7xl gap-4 px-5 sm:grid-cols-2 lg:grid-cols-3">
        {vibes.map((vibe) => (
          <Link key={vibe.slug} href={`/vibe/${vibe.slug}`} className="rounded-[28px] border border-line bg-card p-6 transition hover:-translate-y-0.5">
            <span className="text-3xl">{vibe.emoji}</span>
            <h2 className="mt-4 font-display text-4xl tracking-tight">{vibe.name}</h2>
            <p className="mt-2 text-sm leading-7 text-ink-soft">{vibe.lede}</p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-clay">{vibe.examples.join(" · ")}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
