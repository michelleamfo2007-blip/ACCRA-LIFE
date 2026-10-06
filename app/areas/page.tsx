import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { areas } from "@/lib/data/taxonomy";
import { coverOf, placesForArea } from "@/lib/server/content";

export const metadata = { title: "Areas", description: "Explore Accra neighbourhood by neighbourhood." };

export default function AreasPage() {
  return (
    <div className="pb-16">
      <PageHeader eyebrow="Neighbourhoods" title="Explore Accra by area" lede="Osu after dark, Cantonments at lunch, Labadi when you need the sea. Start with the part of the city you are actually in." />
      <div className="mx-auto grid max-w-7xl gap-4 px-5 sm:grid-cols-2 lg:grid-cols-3">
        {areas.map((area) => {
          const count = placesForArea(area.slug).length;
          const image = coverOf("area", area.slug, area.image);
          return (
            <Link key={area.slug} href={`/areas/${area.slug}`} className="group overflow-hidden rounded-[28px] border border-line bg-card">
              <div className="relative aspect-[16/10] bg-paper-deep">
                {image ? (
                  <Image src={image} alt={area.name} fill className="object-cover transition duration-700 group-hover:scale-105" sizes="(min-width: 1024px) 30vw, 100vw" />
                ) : null}
              </div>
              <div className="p-5">
                <h2 className="font-display text-3xl">{area.name}</h2>
                <p className="mt-1 text-sm text-muted">{area.tagline}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-clay">{count} places</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
