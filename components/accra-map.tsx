"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import { cx } from "@/lib/format";
import "leaflet/dist/leaflet.css";

export type MapPoint = {
  id: string;
  kind: "place" | "event";
  name: string;
  lat: number;
  lng: number;
  href: string;
  subtitle: string;
  image: string;
  category: string;
};

export default function AccraMap({ points }: { points: MapPoint[] }) {
  const categories = useMemo(() => ["All", ...Array.from(new Set(points.map((point) => point.category)))], [points]);
  const [category, setCategory] = useState("All");
  const [kind, setKind] = useState<"all" | "place" | "event">("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);

  const filtered = useMemo(
    () =>
      points.filter((point) => {
        if (kind !== "all" && point.kind !== kind) return false;
        if (category !== "All" && point.category !== category) return false;
        return true;
      }),
    [points, kind, category],
  );
  const current = filtered.find((point) => point.id === selected) ?? null;

  useEffect(() => {
    let cancelled = false;
    async function start() {
      const L = await import("leaflet");
      if (cancelled || !nodeRef.current || mapRef.current) return;
      const map = L.map(nodeRef.current, { scrollWheelZoom: false }).setView([5.59, -0.18], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setReady(true);
    }
    void start();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    async function draw() {
      const L = await import("leaflet");
      const layer = layerRef.current;
      if (cancelled || !layer) return;
      layer.clearLayers();
      for (const point of filtered) {
        const color = point.kind === "event" ? "#1b2e27" : "#c24d2c";
        const icon = L.divIcon({
          className: "",
          html: `<span style="display:block;width:16px;height:16px;border-radius:999px;background:${color};border:2px solid white;box-shadow:0 6px 14px rgba(0,0,0,.28)"></span>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        L.marker([point.lat, point.lng], { icon })
          .addTo(layer)
          .on("click", () => setSelected(point.id));
      }
    }
    void draw();
    return () => {
      cancelled = true;
    };
  }, [filtered, ready]);

  return (
    <div>
      <div className="mb-4 flex gap-2 overflow-x-auto no-scrollbar">
        {(["all", "place", "event"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setKind(item)}
            className={cx("shrink-0 rounded-full px-4 py-2 text-sm font-semibold", kind === item ? "bg-ink text-paper" : "border border-line bg-card")}
          >
            {item === "all" ? "Everything" : item === "place" ? "Places" : "Events"}
          </button>
        ))}
      </div>
      <div className="mb-4 flex gap-2 overflow-x-auto no-scrollbar">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={cx("shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold", category === item ? "bg-clay text-white" : "bg-paper-deep text-ink-soft")}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="accralife-map relative h-[70vh] min-h-[520px] overflow-hidden rounded-[28px] border border-line bg-paper-deep">
        <div ref={nodeRef} className="h-full w-full" />
        {current ? (
          <Link href={current.href} className="absolute bottom-4 left-4 right-4 z-[3] grid grid-cols-[96px_1fr] overflow-hidden rounded-3xl border border-line bg-card shadow-xl sm:left-auto sm:w-96">
            <div className="relative h-24">
              {current.image ? <Image src={current.image} alt={current.name} fill className="object-cover" sizes="96px" /> : null}
            </div>
            <div className="p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-clay">{current.kind}</p>
              <p className="font-display text-xl leading-tight">{current.name}</p>
              <p className="text-xs text-muted">{current.subtitle}</p>
            </div>
          </Link>
        ) : null}
      </div>
      <p className="mt-3 text-xs text-muted">Clay pins are places. Forest pins are events. Click a pin for a preview.</p>
    </div>
  );
}
