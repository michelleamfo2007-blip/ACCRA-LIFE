"use client";

import { useState } from "react";
import { seasonOf } from "@/lib/game/sky";
import {
  AIMS,
  CITY_VOICE,
  aimProgress,
  answerMoment,
  arcOf,
  chooseAim,
  circleLabel,
  circlesOf,
  dismissRare,
  faceRival,
  helpKin,
  openBook,
  repLabel,
  serveRecord,
} from "@/lib/game/spine";
import { cedis, spotById, type Life, type StepResult } from "@/lib/game/world";

const TABS = ["Name", "Rival", "Season", "Moment", "Family", "Dreams", "Cities", "Journal"] as const;

export function SpineApp({ life, onBack, onApply }: { life: Life; onBack: () => void; onApply: (result: StepResult) => void }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Rival");
  const spine = life.spine;
  const season = seasonOf();
  const arc = arcOf();

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f6f1ea] text-[#121212]">
      <div className="flex items-center gap-2 bg-[#121212] px-2 py-2 text-white">
        <button type="button" onClick={onBack} className="grid h-9 w-9 place-items-center rounded-full text-lg" aria-label="Back">
          ‹
        </button>
        <p className="font-semibold">Rival</p>
      </div>
      <div className="flex gap-2 overflow-auto px-3 py-2">
        {TABS.map((item) => (
          <button key={item} type="button" onClick={() => setTab(item)} className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${tab === item ? "bg-[#121212] text-white" : "bg-white"}`}>
            {item}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-auto px-3 pb-4">
        {!spine ? (
          <button type="button" onClick={() => onApply(openBook(life))} className="w-full rounded-2xl bg-[#121212] px-4 py-4 text-left text-white">
            <span className="block font-semibold">Meet Kojo Mensah</span>
            <span className="mt-1 block text-xs text-white/70">He starts level with you. The city starts keeping score.</span>
          </button>
        ) : null}
        {spine && tab === "Name" ? (
          <>
            <p className="rounded-2xl bg-white px-3 py-3 text-sm shadow-sm">
              <span className="block font-semibold">{repLabel(spine.rep)}</span>
              <span className="text-xs text-[#5c6b82]">City score {spine.rep}. Help travels. A cheat travels faster.</span>
            </p>
            {(
              [
                ["friends", "Friends"],
                ["family", "Family"],
                ["work", "Work"],
                ["church", "Church"],
                ["club", "Club"],
              ] as const
            ).map(([id, label]) => {
              const score = circlesOf(spine)[id];
              return (
                <p key={id} className="rounded-2xl bg-white px-3 py-2 text-sm shadow-sm">
                  <span className="font-semibold">{label}</span>
                  <span className="mt-0.5 block text-xs text-[#5c6b82]">
                    {circleLabel(score)} · {score}
                  </span>
                </p>
              );
            })}
            {spine.marks.map((mark) => (
              <p key={`${mark.at}-${mark.line}`} className="rounded-2xl bg-white px-3 py-2 text-sm shadow-sm">
                {mark.line}
              </p>
            ))}
            {spine.record.map((mark) => (
              <p key={`rec-${mark.at}`} className="rounded-2xl bg-[#fff4f4] px-3 py-2 text-sm shadow-sm">
                {mark.line}
              </p>
            ))}
            {spine.barred.includes("office") ? <p className="text-xs text-[#7a1f1f]">The bank’s late list is still on you. Ridge will not promote you.</p> : null}
            {spine.barred.includes("record") ? (
              <button type="button" onClick={() => onApply(serveRecord(life))} className="w-full rounded-full bg-[#121212] py-3 text-sm font-bold text-white">
                Sit with the record · 2 hours
              </button>
            ) : null}
            {!spine.marks.length && !spine.record.length ? <p className="text-sm text-[#5c6b82]">Nothing filed yet. Live a day and the city will talk.</p> : null}
          </>
        ) : null}
        {spine && tab === "Rival" ? (
          <>
            <p className="rounded-2xl bg-white px-3 py-3 text-sm shadow-sm">
              <span className="block text-lg font-semibold">{spine.rival.name}</span>
              <span className="block text-xs text-[#5c6b82]">{spine.rival.line}</span>
              <span className="mt-2 block text-xs font-semibold">
                {cedis(spine.rival.cash)} · {spine.rival.biz} · {spine.rival.car ? "Has a car" : "No car"} · {spine.rival.house ? "Has a house" : "Still renting"} · {spotById(spine.rival.where).name}
              </span>
              {spine.rival.crush ? <span className="mt-1 block text-xs">He is around {spine.rival.crush}.</span> : null}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => onApply(faceRival(life, "beat"))} className="rounded-full bg-[#121212] py-2 text-xs font-bold text-white">
                Beat him
              </button>
              <button type="button" onClick={() => onApply(faceRival(life, "friend"))} className="rounded-full bg-[#006B3F] py-2 text-xs font-bold text-white">
                Make peace
              </button>
              <button type="button" onClick={() => onApply(faceRival(life, "cut"))} className="rounded-full bg-white py-2 text-xs font-bold">
                End it
              </button>
            </div>
          </>
        ) : null}
        {spine && tab === "Season" ? (
          <>
            <p className="rounded-2xl bg-white px-3 py-3 text-sm shadow-sm">
              <span className="block font-semibold">
                {season.emoji} {season.label}
              </span>
              <span className="text-xs text-[#5c6b82]">{season.detail}</span>
            </p>
            {arc ? (
              <p className="rounded-2xl bg-white px-3 py-3 text-sm shadow-sm">
                <span className="block font-semibold">{arc.label}</span>
                <span className="block text-xs">{arc.line}</span>
                <span className="mt-1 block text-xs text-[#5c6b82]">
                  {arc.food}. {arc.cloth}. {arc.problem}
                </span>
              </p>
            ) : (
              <p className="text-sm text-[#5c6b82]">No festival on the calendar. The weather is still doing its job.</p>
            )}
            {spine.rare ? (
              <button type="button" onClick={() => onApply(dismissRare(life))} className="w-full rounded-2xl bg-[#fff4c2] px-3 py-3 text-left text-sm shadow-sm">
                {spine.rare}
              </button>
            ) : null}
          </>
        ) : null}
        {spine && tab === "Moment" ? (
          spine.moment ? (
            <div className="rounded-2xl bg-white p-3 shadow-sm">
              <p className="text-sm">{spine.moment.line}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => onApply(answerMoment(life, "a"))} className="rounded-full bg-[#006B3F] py-2 text-xs font-bold text-white">
                  {spine.moment.a}
                </button>
                <button type="button" onClick={() => onApply(answerMoment(life, "b"))} className="rounded-full bg-white py-2 text-xs font-bold ring-1 ring-[#121212]">
                  {spine.moment.b}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#5c6b82]">Quiet hour. A stranger, a call, or the landlord will find you.</p>
          )
        ) : null}
        {spine && tab === "Family" ? (
          spine.kin.map((person) => (
            <div key={person.id} className="rounded-2xl bg-white px-3 py-3 text-sm shadow-sm">
              <p className="font-semibold">
                {person.name} · {person.role}
              </p>
              <p className="text-xs text-[#5c6b82]">{person.need || "Quiet for now."}</p>
              {person.need ? (
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => onApply(helpKin(life, person.id, true))} className="rounded-full bg-[#006B3F] px-3 py-1.5 text-xs font-bold text-white">
                    Send ₵80
                  </button>
                  <button type="button" onClick={() => onApply(helpKin(life, person.id, false))} className="rounded-full bg-white px-3 py-1.5 text-xs font-bold ring-1 ring-[#121212]">
                    Not now
                  </button>
                </div>
              ) : null}
            </div>
          ))
        ) : null}
        {spine && tab === "Dreams" ? (
          <>
            {spine.aims.map((aim) => {
              const progress = aimProgress(life, aim.id);
              return (
                <p key={aim.id} className="rounded-2xl bg-white px-3 py-3 text-sm shadow-sm">
                  <span className="block font-semibold">{aim.label}</span>
                  <span className="text-xs text-[#5c6b82]">
                    {progress.current} / {progress.max}
                  </span>
                </p>
              );
            })}
            {AIMS.filter((aim) => !spine.aims.some((held) => held.id === aim.id)).map((aim) => (
              <button key={aim.id} type="button" onClick={() => onApply(chooseAim(life, aim.id))} className="w-full rounded-2xl bg-white px-3 py-3 text-left text-sm shadow-sm">
                <span className="block font-semibold">{aim.label}</span>
                <span className="text-xs text-[#5c6b82]">{aim.detail}</span>
              </button>
            ))}
          </>
        ) : null}
        {tab === "Cities" ? (
          Object.entries(CITY_VOICE).map(([id, city]) => (
            <p key={id} className="rounded-2xl bg-white px-3 py-3 text-sm shadow-sm">
              <span className="block font-semibold capitalize">{id.replace("-", " ")}</span>
              <span className="block text-xs">{city.voice}</span>
              <span className="mt-1 block text-xs text-[#5c6b82]">
                {city.food}. {city.music}. {city.slang}
              </span>
              <span className="mt-1 block text-xs text-[#5c6b82]">{city.outsider}</span>
            </p>
          ))
        ) : null}
        {spine && tab === "Journal" ? (
          spine.journal.map((memory) => (
            <p key={`${memory.year}-${memory.line}`} className="rounded-2xl bg-white px-3 py-3 text-sm shadow-sm">
              <span className="block text-xs font-bold text-[#8b97ab]">{memory.year}</span>
              {memory.line}
            </p>
          ))
        ) : null}
      </div>
    </div>
  );
}
