"use client";

import { useState } from "react";
import { bayCount, carOf, carPaint, motorsOf, setPrimary } from "@/lib/game/garage";
import type { Life, StepResult } from "@/lib/game/world";

export function GarageYard({ life, onApply }: { life: Life; onApply: (result: StepResult) => void }) {
  const [open, setOpen] = useState(false);
  const cars = motorsOf(life);
  const bays = bayCount(life);
  const primary = life.car?.key;
  const guests = (life.guests ?? []).filter((guest) => guest.doing !== "leave").length;
  return (
    <div className="pointer-events-auto absolute bottom-24 left-2 right-2 z-30 sm:left-auto sm:w-80">
      <button type="button" onClick={() => setOpen((value) => !value)} className="rounded-full bg-[#243044] px-3 py-1.5 text-xs font-bold text-white shadow-lg">
        Garage · {cars.length}/{bays}
        {life.car ? ` · out in ${life.car.name || carOf(life.car.id)?.short || "the car"}` : ""}
      </button>
      {open ? (
        <div className="mt-2 rounded-2xl bg-[#f6f1ea] p-3 text-[#121212] shadow-xl">
          <p className="text-xs text-[#5c6b82]">Pick the car before you leave. Empty bays stay empty. Guests park on the street.</p>
          <svg viewBox="0 0 320 150" className="mt-2 h-28 w-full rounded-xl bg-[#d7d1c6]">
            <rect x="8" y="18" width="304" height="116" rx="8" fill="#cfc6b8" />
            <rect x="16" y="28" width="288" height="78" fill="#b7b1a6" />
            {Array.from({ length: bays }, (_, index) => {
              const motor = cars[index];
              const x = 24 + (index % 3) * 96;
              const y = 36 + Math.floor(index / 3) * 40;
              const paint = motor ? motor.color || carOf(motor.id)?.paint || "#2a3344" : "transparent";
              return (
                <g key={motor?.key ?? `bay-${index}`}>
                  <rect x={x} y={y} width="84" height="28" rx="4" fill="#e7e1d6" stroke="#8d867c" />
                  {motor ? (
                    <>
                      <rect x={x + 8} y={y + 8} width="68" height="14" rx="4" fill={paint} stroke="#121212" />
                      <circle cx={x + 18} cy={y + 22} r="3" fill="#121212" />
                      <circle cx={x + 62} cy={y + 22} r="3" fill="#121212" />
                    </>
                  ) : (
                    <text x={x + 42} y={y + 18} textAnchor="middle" fontSize="8" fill="#8d867c">
                      empty
                    </text>
                  )}
                </g>
              );
            })}
            {guests ? (
              <g>
                <rect x="250" y="112" width="48" height="12" rx="3" fill="#9aa3ad" />
                <text x="274" y="128" textAnchor="middle" fontSize="7" fill="#243044">
                  guest
                </text>
              </g>
            ) : null}
          </svg>
          <ul className="mt-2 space-y-1">
            {cars.map((motor) => {
              const plan = carOf(motor.id);
              const mine = motor.key === primary || (!primary && motor.id === life.car?.id);
              return (
                <li key={motor.key} className="flex items-center gap-2 rounded-xl bg-white px-2 py-1.5 text-xs">
                  <span className="h-4 w-6 rounded" style={{ background: motor.color || carPaint(life) }} />
                  <span className="min-w-0 flex-1 truncate font-semibold">
                    {motor.name || plan?.short || "Car"}
                    {mine ? " · you drive this" : ""}
                    {motor.driver ? ` · ${motor.driver}` : ""}
                  </span>
                  {mine ? null : (
                    <button type="button" className="font-bold text-[#006B3F]" onClick={() => motor.key && onApply(setPrimary(life, motor.key))}>
                      Take this
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-[11px] text-[#5c6b82]">
            {life.yard?.guard ? `${life.yard.guard} is at the gate.` : "No guard on the gate."} {life.yard?.driver ? `${life.yard.driver} drives.` : "No driver yet."}
          </p>
        </div>
      ) : null}
    </div>
  );
}
