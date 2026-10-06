import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { categories } from "@/lib/data/taxonomy";
import { coverOf } from "@/lib/server/content";

export const metadata = { title: "Explore" };

export default function ExplorePage() {
  return (
    <div className="pb-16">
      <PageHeader eyebrow="Discover" title="Explore Accra" lede="Twelve ways into the city. Pick a mood, a meal, a neighbourhood, or whatever tonight is supposed to be." />
      <div className="mx-auto grid max-w-7xl gap-4 px-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const image = coverOf("category", category.slug, category.image);
          return (
          <Link key={category.slug} href={category.slug === "events" ? "/events" : `/category/${category.slug}`} className="group relative min-h-64 overflow-hidden rounded-[28px]">
            {image ? (
              <Image src={image} alt={category.name} fill className="object-cover transition duration-700 group-hover:scale-105" sizes="(min-width: 1024px) 30vw, 100vw" />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
            <div className="absolute bottom-0 p-5 text-paper">
              <p className="text-sm">{category.emoji}</p>
              <h2 className="font-display text-3xl">{category.name}</h2>
              <p className="mt-1 max-w-xs text-sm text-paper/80">{category.lede}</p>
            </div>
          </Link>
          );
        })}
      </div>
    </div>
  );
}
