"use client";

import { useEffect, useState } from "react";
import { cedis, offersFor, type Offer, type Verb } from "@/lib/game/world";

export function ActionDeck({
  verbs,
  here,
  onPay,
  focus = null,
  busy = false,
}: {
  verbs: Verb[];
  here: boolean;
  onPay: (verb: Verb, offer: Offer) => void;
  focus?: string | null;
  busy?: boolean;
}) {
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    if (focus) setOpen(focus);
  }, [focus]);
  return (
    <div className="mt-3 space-y-2">
      {verbs.map((verb) => {
        const offers = offersFor(verb);
        const shown = open === verb.id;
        return (
          <div key={verb.id} className="overflow-hidden rounded-2xl bg-[#f4f7fb]">
            <button type="button" onClick={() => setOpen(shown ? null : verb.id)} className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left" aria-expanded={shown}>
              <span className="min-w-0 font-semibold">
                {verb.emoji ? `${verb.emoji} ` : ""}
                {verb.label}
              </span>
              <span className="shrink-0 text-xs font-semibold text-[#5c6b82]">{shown ? "Hide" : verb.cost ? cedis(verb.cost) : "Open"}</span>
            </button>
            {shown ? (
              <div className="space-y-2 px-2 pb-2">
                {offers.map((offer) => (
                  <div key={offer.id} className="rounded-2xl bg-white p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-2">
                        {offer.cloth ? <span className="mt-0.5 h-9 w-7 shrink-0 rounded-md border border-black/10" style={{ background: offer.cloth }} /> : null}
                        <div className="min-w-0">
                          <p className="font-semibold">{offer.label}</p>
                          <p className="mt-0.5 text-xs leading-5 text-[#5c6b82]">{offer.detail}</p>
                        </div>
                      </div>
                      <p className="shrink-0 text-sm font-bold text-[#006B3F]">{offer.cost ? cedis(offer.cost) : "Free"}</p>
                    </div>
                    <p className="mt-1 text-[11px] text-[#8b97ab]">{offer.minutes} min</p>
                    <button
                      type="button"
                      disabled={!here || busy}
                      onClick={() => onPay(verb, offer)}
                      className="mt-2 w-full rounded-full bg-[#006B3F] py-2.5 text-sm font-bold text-white disabled:opacity-40"
                    >
                      {!here ? "Get there first" : busy ? "Doing it…" : offer.cost ? `Pay ${cedis(offer.cost)} · go` : "Do it"}
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
