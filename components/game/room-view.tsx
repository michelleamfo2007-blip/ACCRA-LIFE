"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { hourOf, type Life } from "@/lib/game/world";

const Apartment = dynamic(() => import("@/components/game/apartment").then((mod) => mod.Apartment), { ssr: false });

const SPOTS = {
  door: { x: -4.7, z: 0.15, action: "map" },
  bed: { x: 1.15, z: -1.85, action: "sleep" },
  chair: { x: -0.7, z: 0.45, action: "gist" },
  radio: { x: 0.35, z: 0.7, action: "radio" },
  cooler: { x: 3.7, z: 1.7, action: "cooler" },
  stove: { x: 3.5, z: 2.6, action: "cook" },
  toilet: { x: -3.9, z: 2.7, action: "toilet" },
  shower: { x: -4.6, z: 1.85, action: "shower" },
  roamA: { x: -0.2, z: 1.2, action: null },
  roamB: { x: 0.8, z: 0.2, action: null },
  roamC: { x: -1.1, z: 1.6, action: null },
};

export function RoomView({ life, onAct, onMap, onAsk }: { life: Life; onAct: (id: string) => void; onMap: () => void; onAsk: () => void }) {
  const night = hourOf(life.minutes) >= 19 || hourOf(life.minutes) < 5;
  const dark = life.dumsor && !life.inventory.includes("generator");
  const mattress = life.inventory.includes("mattress");
  const [pos, setPos] = useState({ x: 0.2, z: 1.1 });
  const [pose, setPose] = useState<"idle" | "walk" | "act">("idle");
  const [heading, setHeading] = useState(0);
  const posRef = useRef(pos);
  const busy = useRef(false);
  const frame = useRef(0);
  const onActRef = useRef(onAct);
  const onMapRef = useRef(onMap);

  useEffect(() => {
    onActRef.current = onAct;
    onMapRef.current = onMap;
  }, [onAct, onMap]);

  function walkTo(target: { x: number; z: number }, action: string | null) {
    if (busy.current) return;
    busy.current = true;
    const start = { ...posRef.current };
    const dx = target.x - start.x;
    const dz = target.z - start.z;
    setHeading(Math.atan2(dx, dz));
    setPose("walk");
    const duration = Math.max(900, Math.hypot(dx, dz) * 420);
    const started = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - started) / duration);
      const eased = 1 - (1 - t) ** 3;
      const next = { x: start.x + dx * eased, y: 0, z: start.z + dz * eased };
      const point = { x: next.x, z: next.z };
      posRef.current = point;
      setPos(point);
      if (t < 1) {
        frame.current = requestAnimationFrame(step);
        return;
      }
      if (action === "map") {
        setPose("idle");
        busy.current = false;
        onMapRef.current();
        return;
      }
      if (action) {
        setPose("act");
        onActRef.current(action);
        window.setTimeout(() => {
          setPose("idle");
          busy.current = false;
        }, 800);
        return;
      }
      setPose("idle");
      busy.current = false;
    };
    frame.current = requestAnimationFrame(step);
  }

  useEffect(() => {
    const id = window.setInterval(() => {
      if (busy.current) return;
      if (localStorage.getItem("accralife-freewill") === "0") return;
      const roam = ["roamA", "roamB", "roamC"][Math.floor(Math.random() * 3)] as keyof typeof SPOTS;
      walkTo(SPOTS[roam], null);
    }, 8000);
    return () => {
      window.clearInterval(id);
      cancelAnimationFrame(frame.current);
    };
  }, []);

  const owns = (id: string) => life.inventory.includes(id);
  const sofaColor = owns("gold") ? "#8b1e3f" : owns("leather") ? "#1c1c1c" : owns("family") ? "#c4844a" : "#2f8f6b";

  return (
    <div className="absolute inset-0 touch-none" style={{ background: dark ? "#10131a" : night ? "#1b2744" : "#c5d7ea" }}>
      <Apartment
        life={life}
        pos={pos}
        pose={pose}
        heading={heading}
        dark={dark}
        bedColor={mattress ? "#3f4f86" : "#243056"}
        sofaColor={sofaColor}
        onAsk={onAsk}
        onGo={(id) => walkTo(SPOTS[id as keyof typeof SPOTS], SPOTS[id as keyof typeof SPOTS].action)}
      />
    </div>
  );
}
