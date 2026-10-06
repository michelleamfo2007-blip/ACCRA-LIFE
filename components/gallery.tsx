"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export function Gallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState<number | null>(null);
  const shots = images.slice(0, 3);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setActive(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (shots.length === 0) return null;

  return (
    <>
      <div className={shots.length > 1 ? "grid gap-3 md:grid-cols-[1.6fr_0.8fr]" : ""}>
        <button type="button" className="relative aspect-[16/10] overflow-hidden rounded-[28px] bg-paper-deep" onClick={() => setActive(0)}>
          <Image src={shots[0]} alt={`${name} cover`} fill className="object-cover" priority sizes="(min-width: 768px) 60vw, 100vw" />
        </button>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
          {shots.slice(1).map((image, index) => (
            <button key={image} type="button" className="relative aspect-[16/10] overflow-hidden rounded-[28px] bg-paper-deep md:aspect-auto md:h-full" onClick={() => setActive(index + 1)}>
              <Image src={image} alt="" fill className="object-cover" sizes="30vw" />
            </button>
          ))}
        </div>
      </div>
      {active !== null ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-4" role="dialog" aria-modal="true" aria-label={`${name} photos`}>
          <button type="button" className="absolute right-5 top-5 rounded-full bg-paper px-4 py-2 text-sm font-semibold" onClick={() => setActive(null)}>
            Close
          </button>
          <div className="relative h-[75vh] w-full max-w-5xl">
            <Image src={shots[active]} alt="" fill className="object-contain" sizes="90vw" />
          </div>
        </div>
      ) : null}
    </>
  );
}
