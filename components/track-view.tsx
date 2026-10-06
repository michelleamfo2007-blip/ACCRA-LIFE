"use client";

import { useEffect } from "react";

export function TrackView({ name }: { name: string }) {
  useEffect(() => {
    const key = `accralife-view:${name}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: name }),
    });
  }, [name]);
  return null;
}
