"use client";

import { useState, type ReactNode } from "react";
import { BADGES, earnedBadges, claimDaily, streakState } from "@/lib/game/badges";
import { COURSES, SHOW_CUT, STUDIO_FEE, TICKETS, VENUES, VIDEO_FEE, attendClass, classWait, collectRoyalties, courseOf, crowdFor, enrolCourse, gigWait, holdShow, playGig, recordSong, recordWait, royaltiesDue, shootVideo, showWait, streamsOf, tierOf } from "@/lib/game/career";
import { CROPS, LAND, MAX_PLOTS, STAGES, advertRooms, bedState, buildNext, buildWait, buyLand, collectRent, cropOf, farmSize, goToCourt, harvestBed, landOf, payGuards, plantCrop, plotsOf, rentDue, sellPlot, stageCost, waterBeds } from "@/lib/game/estate";
import { ANTENATAL, GROWN_AGE, MAX_KIDS, OUTDOORING, SCHOOL_AGE, careForKid, careWait, dayNameFor, enrolKid, expectBaby, holdOutdooring, inheritWorth, kidAge, passOn, welcomeBaby } from "@/lib/game/family";
import { CARS, INSURANCE, buyCar, carOf, driveHail, fillCost, fillUp, hailWait, insureCar, sellCar, tradeIn } from "@/lib/game/garage";
import { CLINIC_FEE, CLINIC_NHIS, MEDS_FEE, NHIS_FEE, buyNhis, hasNhis, restSick, seeClinic, selfMedicate, sickness } from "@/lib/game/health";
import { MAX_ORDERS, STYLES, TAILOR_COLORS, collectOrder, orderStyle, styleOf, wearFit } from "@/lib/game/tailor";
import { cedis, type Life, type StepResult } from "@/lib/game/world";

type Apply = (result: StepResult) => void;

export function wait(minutes: number) {
  if (minutes >= 1440) return `${Math.ceil(minutes / 1440)}d`;
  if (minutes >= 60) return `${Math.ceil(minutes / 60)}h`;
  return `${Math.max(1, Math.ceil(minutes))}m`;
}

export function Screen({ title, life, color = "#121212", onBack, children }: { title: string; life: Life; color?: string; onBack: () => void; children: ReactNode }) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#f6f1ea] text-[#121212]">
      <div className="flex items-center gap-2 px-2 py-2 text-white" style={{ background: color }}>
        <button type="button" onClick={onBack} className="grid h-9 w-9 place-items-center rounded-full text-lg" aria-label="Back">
          ‹
        </button>
        <p className="font-semibold">{title}</p>
        <span className="ml-auto pr-2 text-sm font-semibold text-[#FCD116]">{cedis(life.cash)}</span>
      </div>
      <div className="min-h-0 min-w-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden px-4 py-4">{children}</div>
    </div>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-bold tracking-wide text-[#8b97ab]">{children}</p>;
}

export function Card({ children, tone }: { children: ReactNode; tone?: "warn" | "good" }) {
  const ring = tone === "warn" ? "ring-2 ring-[#CE1126]/40" : tone === "good" ? "ring-2 ring-[#006B3F]/40" : "";
  return <div className={`rounded-2xl bg-white p-3 shadow-sm ${ring}`}>{children}</div>;
}

export function Btn({ children, onClick, disabled, kind = "dark" }: { children: ReactNode; onClick: () => void; disabled?: boolean; kind?: "dark" | "green" | "light" | "red" | "gold" }) {
  const look = {
    dark: "bg-[#121212] text-white",
    green: "bg-[#006B3F] text-white",
    light: "bg-[#f4f7fb] text-[#121212]",
    red: "bg-[#f4f7fb] text-[#CE1126]",
    gold: "bg-[#FCD116] text-[#121212]",
  }[kind];
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`rounded-full px-3 py-2 text-xs font-bold disabled:opacity-40 ${look}`}>
      {children}
    </button>
  );
}

export function Bar({ value, color = "#006B3F" }: { value: number; color?: string }) {
  return (
    <div className="mt-2 h-2 rounded-full bg-[#e7edf5]">
      <div className="h-2 rounded-full" style={{ width: `${Math.max(0, Math.min(100, value * 100))}%`, background: color }} />
    </div>
  );
}

export function LandApp({ life, onBack, onApply }: { life: Life; onBack: () => void; onApply: Apply }) {
  const plots = plotsOf(life);
  const [selling, setSelling] = useState<string | null>(null);
  return (
    <Screen title="Land and houses" life={life} color="#6b4423" onBack={onBack}>
      {plots.length ? <Label>YOUR PLOTS · {plots.length}/{MAX_PLOTS}</Label> : null}
      {plots.map((plot) => {
        const land = landOf(plot.area);
        const finished = plot.stage >= STAGES.length - 1;
        const left = buildWait(life, plot);
        const due = rentDue(life, plot);
        return (
          <Card key={plot.id} tone={plot.guard === "waiting" ? "warn" : finished ? "good" : undefined}>
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-[#f3e6d4] text-xl">{finished ? "🏠" : plot.stage === 0 ? "📜" : "🧱"}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{land.label}</span>
                <span className="block text-xs text-[#5c6b82]">
                  {STAGES[plot.stage]}
                  {left > 0 && !finished ? ` · builders back in ${wait(left)}` : ""}
                </span>
              </span>
            </div>
            <Bar value={plot.stage / (STAGES.length - 1)} color="#6b4423" />
            {plot.guard === "waiting" ? (
              <div className="mt-3 space-y-2">
                <p className="text-sm text-[#CE1126]">Land guards are camped on the plot. Pay them off, or file at the Lands Commission and wait a day.</p>
                <div className="grid grid-cols-2 gap-2">
                  <Btn kind="dark" onClick={() => onApply(payGuards(life, plot.id))}>
                    Pay {cedis(Math.round(land.price * 0.1))}
                  </Btn>
                  <Btn kind="light" onClick={() => onApply(goToCourt(life, plot.id))}>
                    Go to court
                  </Btn>
                </div>
              </div>
            ) : plot.guard === "court" ? (
              <p className="mt-3 text-sm text-[#5c6b82]">The court is clearing the land guards. Back in {wait((plot.guardUntil ?? life.minutes) - life.minutes)}.</p>
            ) : finished ? (
              <div className="mt-3 space-y-2">
                <p className="text-sm">
                  {plot.tenants}/{land.rooms} rooms let · {cedis(land.rent)} a room a day
                </p>
                <p className={`text-sm font-semibold ${due > 0 ? "text-[#006B3F]" : "text-[#5c6b82]"}`}>{due > 0 ? `Rent due: ${cedis(due)}` : "No rent due yet."}</p>
                <div className="grid grid-cols-2 gap-2">
                  <Btn kind="green" disabled={due < 1} onClick={() => onApply(collectRent(life, plot.id))}>
                    Collect rent
                  </Btn>
                  <Btn kind="light" disabled={plot.tenants >= land.rooms} onClick={() => onApply(advertRooms(life, plot.id))}>
                    Find tenants ₵50
                  </Btn>
                </div>
              </div>
            ) : (
              <div className="mt-3">
                <Btn kind="dark" disabled={left > 0} onClick={() => onApply(buildNext(life, plot.id))}>
                  {left > 0 ? `Building… ${wait(left)}` : `Start ${STAGES[plot.stage + 1].toLowerCase()} · ${cedis(stageCost(plot))}`}
                </Btn>
              </div>
            )}
            <div className="mt-2 text-right">
              {selling === plot.id ? (
                <span className="inline-flex gap-2">
                  <Btn kind="red" onClick={() => onApply(sellPlot(life, plot.id))}>
                    Sell for {cedis(Math.round(plot.spent * 0.7) + due)}
                  </Btn>
                  <Btn kind="light" onClick={() => setSelling(null)}>
                    Keep
                  </Btn>
                </span>
              ) : (
                <button type="button" onClick={() => setSelling(plot.id)} className="text-xs font-semibold text-[#8b97ab]">
                  Sell property
                </button>
              )}
            </div>
          </Card>
        );
      })}
      <Label>LAND FOR SALE</Label>
      <p className="-mt-1 text-xs text-[#5c6b82]">Buy a plot, build in five stages, then let the rooms. Tenants pay daily rent, held for up to two weeks. Some plots come with land guards.</p>
      {LAND.map((land) => (
        <div key={land.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#f3e6d4] text-xl">📍</span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{land.label}</span>
            <span className="block text-xs text-[#5c6b82]">{land.blurb}</span>
            <span className="block text-xs font-semibold text-[#006B3F]">
              {land.rooms} rooms · up to {cedis(land.rooms * land.rent)} a day
            </span>
          </span>
          <Btn kind="dark" disabled={life.cash < land.price || plots.length >= MAX_PLOTS} onClick={() => onApply(buyLand(life, land.id))}>
            {cedis(land.price)}
          </Btn>
        </div>
      ))}
    </Screen>
  );
}

export function FamilyApp({ life, married, onBack, onApply }: { life: Life; married: boolean; onBack: () => void; onApply: Apply }) {
  const kids = life.kids ?? [];
  const [girl, setGirl] = useState(true);
  const [name, setName] = useState("");
  const [heir, setHeir] = useState<string | null>(null);
  const due = life.expecting ? Math.max(0, life.expecting - life.minutes) : 0;
  const dayName = dayNameFor(new Date(), girl);
  return (
    <Screen title="Family" life={life} color="#c45c9a" onBack={onBack}>
      <p className="text-xs text-[#5c6b82]">Generation {life.generation ?? 1}. In Accra Life a child grows a year every real day.</p>
      {life.expecting ? (
        <Card tone="good">
          <p className="font-semibold">🤰 A baby is on the way</p>
          {due > 0 ? (
            <p className="mt-1 text-sm text-[#5c6b82]">Due in {wait(due)}.</p>
          ) : (
            <div className="mt-2 space-y-2">
              <p className="text-sm">The baby is here. Born today, so the day name is {dayName}.</p>
              <div className="flex gap-2">
                <Btn kind={girl ? "dark" : "light"} onClick={() => setGirl(true)}>
                  Girl
                </Btn>
                <Btn kind={!girl ? "dark" : "light"} onClick={() => setGirl(false)}>
                  Boy
                </Btn>
              </div>
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder={dayName} maxLength={20} className="h-10 w-full rounded-full bg-[#f4f7fb] px-4 text-sm outline-none" />
              <Btn kind="green" onClick={() => onApply(welcomeBaby(life, girl, name))}>
                Welcome {name.trim() || dayName}
              </Btn>
            </div>
          )}
        </Card>
      ) : kids.length < MAX_KIDS ? (
        <Card>
          <p className="font-semibold">Start a family</p>
          <p className="mt-1 text-sm text-[#5c6b82]">{married ? `Antenatal care is ${cedis(ANTENATAL)}. The baby arrives in a day.` : "Get married first. Ask your partner in the People app."}</p>
          <div className="mt-2">
            <Btn kind="dark" disabled={!married || life.cash < ANTENATAL} onClick={() => onApply(expectBaby(life, married))}>
              Try for a baby · {cedis(ANTENATAL)}
            </Btn>
          </div>
        </Card>
      ) : null}
      {kids.length ? <Label>YOUR CHILDREN</Label> : null}
      {kids.map((kid) => {
        const age = kidAge(life, kid);
        const care = careWait(life, kid);
        return (
          <Card key={kid.id}>
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-[#fde7f3] text-xl">{age < 3 ? "👶" : age < 13 ? (kid.girl ? "👧🏾" : "👦🏾") : kid.girl ? "👩🏾" : "👨🏾"}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">
                  {kid.name}
                  {kid.name !== kid.dayName ? ` (${kid.dayName})` : ""}
                </span>
                <span className="block text-xs text-[#5c6b82]">
                  {age} {age === 1 ? "year" : "years"} old · {kid.school ? "in school" : age >= SCHOOL_AGE ? "ready for school" : "at home"}
                </span>
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {!kid.outdoored ? (
                <Btn kind="gold" onClick={() => onApply(holdOutdooring(life, kid.id))}>
                  Outdooring · {cedis(OUTDOORING)}
                </Btn>
              ) : null}
              <Btn kind="green" disabled={care > 0} onClick={() => onApply(careForKid(life, kid.id))}>
                {care > 0 ? `Spend time · ${wait(care)}` : "Spend time"}
              </Btn>
              {!kid.school && age >= SCHOOL_AGE ? (
                <Btn kind="light" onClick={() => onApply(enrolKid(life, kid.id))}>
                  Enrol in school ₵150
                </Btn>
              ) : null}
              {age >= GROWN_AGE ? (
                heir === kid.id ? (
                  <>
                    <Btn kind="red" onClick={() => onApply(passOn(life, kid.id))}>
                      Yes, live as {kid.name}
                    </Btn>
                    <Btn kind="light" onClick={() => setHeir(null)}>
                      Not yet
                    </Btn>
                  </>
                ) : (
                  <Btn kind="dark" onClick={() => setHeir(kid.id)}>
                    Pass it on
                  </Btn>
                )
              ) : null}
            </div>
            {heir === kid.id ? <p className="mt-2 text-xs text-[#5c6b82]">{kid.name} takes over with {cedis(inheritWorth(life))}, your plots, shops and home. Skills start at half.</p> : null}
          </Card>
        );
      })}
    </Screen>
  );
}

export function StudioApp({ life, onBack, onApply, onGo }: { life: Life; onBack: () => void; onApply: Apply; onGo?: (spot: string) => void }) {
  const music = life.music ?? { songs: [], fans: 0 };
  const [title, setTitle] = useState("");
  const [ticket, setTicket] = useState(TICKETS[1]);
  const showGap = showWait(life);
  const studio = recordWait(life);
  const voice = gigWait(life);
  const due = royaltiesDue(life);
  return (
    <Screen title="Studio" life={life} color="#3b1f5c" onBack={onBack}>
      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#8b97ab]">{tierOf(music.fans)}</p>
        <p className="font-display text-3xl">{music.fans.toLocaleString("en-GH")} fans</p>
        <p className="text-xs text-[#5c6b82]">Music skill {life.skills.music}/10 · {music.songs.length} songs out</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Btn kind="green" disabled={due < 1} onClick={() => onApply(collectRoyalties(life))}>
            Royalties {cedis(due)}
          </Btn>
          <Btn kind="gold" disabled={voice > 0 || life.where === "home" || !music.songs.length} onClick={() => onApply(playGig(life))}>
            {voice > 0 ? `Gig · ${wait(voice)}` : life.where === "home" ? "Gig: go out" : "Play a gig"}
          </Btn>
        </div>
      </Card>
      <Card>
        <p className="font-semibold">🎙️ Book studio time · {cedis(STUDIO_FEE)}</p>
        <p className="mt-1 text-xs text-[#5c6b82]">Two hours with an engineer in Osu. Better music skill makes better songs, and better songs stream longer.</p>
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Song title" maxLength={40} className="mt-2 h-10 w-full rounded-full bg-[#f4f7fb] px-4 text-sm outline-none" />
        <div className="mt-2">
          <Btn
            kind="dark"
            disabled={studio > 0 || !title.trim() || life.cash < STUDIO_FEE}
            onClick={() => {
              onApply(recordSong(life, title));
              setTitle("");
            }}
          >
            {studio > 0 ? `Studio booked · ${wait(studio)}` : "Record"}
          </Btn>
        </div>
      </Card>
      <Card>
        <p className="font-semibold">🎤 Headline a show</p>
        <p className="mt-1 text-xs text-[#5c6b82]">
          Hire a venue, set the ticket price and play your setlist. You keep {Math.round(SHOW_CUT * 100)}% of the door after the promoter. Be at the venue to start. {showGap > 0 ? `The band rests for ${wait(showGap)}.` : `${music.shows ?? 0} shows so far.`}
        </p>
        <div className="mt-2 flex gap-1.5">
          {TICKETS.map((price) => (
            <button key={price} type="button" onClick={() => setTicket(price)} className={`flex-1 rounded-full px-2 py-1.5 text-xs font-bold ${ticket === price ? "bg-[#3b1f5c] text-white" : "bg-[#f4f7fb]"}`}>
              {cedis(price)} ticket
            </button>
          ))}
        </div>
        <div className="mt-2 space-y-1.5">
          {VENUES.map((venue) => {
            const locked = music.fans < venue.minFans;
            const here = life.where === venue.id;
            const crowd = crowdFor(life, venue, ticket);
            return (
              <div key={venue.id} className="flex items-center gap-2 rounded-2xl bg-[#f6f1fb] px-3 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{venue.label}</span>
                  <span className="block text-[11px] text-[#5c6b82]">
                    {locked ? `Needs ${venue.minFans.toLocaleString("en-GH")} fans` : `Hire ${cedis(venue.hire)} · about ${crowd.toLocaleString("en-GH")} of ${venue.capacity.toLocaleString("en-GH")}`}
                  </span>
                </span>
                {here ? (
                  <Btn kind="gold" disabled={locked || showGap > 0 || !music.songs.length || life.cash < venue.hire} onClick={() => onApply(holdShow(life, venue.id, ticket))}>
                    Play
                  </Btn>
                ) : onGo ? (
                  <Btn kind="light" disabled={locked} onClick={() => onGo(venue.id)}>
                    Go
                  </Btn>
                ) : null}
              </div>
            );
          })}
        </div>
      </Card>
      {music.songs.length ? <Label>YOUR SONGS</Label> : null}
      {music.songs.map((song) => (
        <div key={song.id} className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm shadow-sm">
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">
              {song.video ? "🎬 " : ""}
              {song.title}
            </span>
            <span className="block text-xs text-[#5c6b82]">
              {streamsOf(song, life.minutes, music.fans).toLocaleString("en-GH")} streams · {song.quality}/100
            </span>
          </span>
          {song.video ? null : (
            <Btn kind="light" disabled={life.cash < VIDEO_FEE} onClick={() => onApply(shootVideo(life, song.id))}>
              🎬 Video {cedis(VIDEO_FEE)}
            </Btn>
          )}
        </div>
      ))}
    </Screen>
  );
}

export function SchoolApp({ life, onBack, onApply }: { life: Life; onBack: () => void; onApply: Apply }) {
  const school = life.school ?? { certs: [] };
  const current = courseOf(school.course);
  const next = classWait(life);
  return (
    <Screen title="School" life={life} color="#1f4e8c" onBack={onBack}>
      {school.certs.length ? (
        <Card tone="good">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8b97ab]">Certificates</p>
          <p className="mt-1 text-sm font-semibold">{school.certs.map((cert) => courseOf(cert)?.label ?? cert).join(" · ")}</p>
        </Card>
      ) : null}
      {current ? (
        <Card>
          <p className="font-semibold">📚 {current.label}</p>
          <p className="text-xs text-[#5c6b82]">
            Class {school.done ?? 0} of {current.sessions} · three hours each
          </p>
          <Bar value={(school.done ?? 0) / current.sessions} color="#1f4e8c" />
          <div className="mt-3">
            <Btn kind="dark" disabled={next > 0} onClick={() => onApply(attendClass(life))}>
              {next > 0 ? `Next class in ${wait(next)}` : "Go to class"}
            </Btn>
          </div>
        </Card>
      ) : null}
      <Label>COURSES</Label>
      <p className="-mt-1 text-xs text-[#5c6b82]">Every certificate raises the pay on every job.</p>
      {COURSES.map((course) => {
        const has = school.certs.includes(course.id);
        const locked = Boolean(course.needs && !school.certs.includes(course.needs));
        return (
          <div key={course.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#e3ecf8] text-xl">{has ? "🎓" : locked ? "🔒" : "📖"}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{course.label}</span>
              <span className="block text-xs text-[#5c6b82]">
                {course.sessions} classes · {course.perk}
                {locked ? ` · needs ${courseOf(course.needs)?.label}` : ""}
              </span>
            </span>
            {has ? (
              <span className="text-xs font-bold text-[#006B3F]">Passed</span>
            ) : (
              <Btn kind="dark" disabled={locked || Boolean(current) || life.cash < course.fee} onClick={() => onApply(enrolCourse(life, course.id))}>
                {cedis(course.fee)}
              </Btn>
            )}
          </div>
        );
      })}
    </Screen>
  );
}

export function GarageApp({ life, onBack, onApply }: { life: Life; onBack: () => void; onApply: Apply }) {
  const car = carOf(life.car?.id);
  const credit = tradeIn(life);
  const hail = hailWait(life);
  const insured = (life.car?.insuredUntil ?? 0) > life.minutes;
  const [selling, setSelling] = useState(false);
  return (
    <Screen title="Garage" life={life} color="#243044" onBack={onBack}>
      {car && life.car ? (
        <Card tone={insured ? "good" : "warn"}>
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-[#e7edf5] text-2xl">{car.emoji}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{car.label}</span>
              <span className={`block text-xs ${insured ? "text-[#006B3F]" : "text-[#CE1126]"}`}>{insured ? `Insured · ${wait(life.car.insuredUntil - life.minutes)} left` : "No insurance. Checkpoints will fine you."}</span>
            </span>
          </div>
          <p className="mt-2 text-xs text-[#5c6b82]">Fuel {Math.round(life.car.fuel)}%</p>
          <Bar value={life.car.fuel / 100} color={life.car.fuel < 20 ? "#CE1126" : "#f0b429"} />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Btn kind="gold" disabled={fillCost(life) < 1} onClick={() => onApply(fillUp(life))}>
              Fill up {cedis(fillCost(life))}
            </Btn>
            <Btn kind="light" onClick={() => onApply(insureCar(life))}>
              Insure 7 days {cedis(INSURANCE)}
            </Btn>
            <Btn kind="green" disabled={hail > 0} onClick={() => onApply(driveHail(life))}>
              {hail > 0 ? `Ride-app · ${wait(hail)}` : "Drive for the ride app"}
            </Btn>
            {selling ? (
              <Btn kind="red" onClick={() => onApply(sellCar(life))}>
                Sell for {cedis(credit)}
              </Btn>
            ) : (
              <Btn kind="red" onClick={() => setSelling(true)}>
                Sell car
              </Btn>
            )}
          </div>
          <p className="mt-2 text-xs text-[#5c6b82]">Pick Drive on any ride menu. No fare, just fuel, and you skip the trotro wait.</p>
        </Card>
      ) : null}
      <Label>ABOSSEY OKAI CAR LOT</Label>
      {CARS.map((item) => {
        const due = item.price - credit;
        const mine = item.id === life.car?.id;
        return (
          <div key={item.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#e7edf5] text-xl">{item.emoji}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{item.label}</span>
              <span className="block text-xs text-[#5c6b82]">
                {item.minutes} min across town · ride-app trips pay ~{cedis(item.hail)}
              </span>
              {credit && !mine ? <span className="block text-xs text-[#006B3F]">{cedis(due)} after trade-in</span> : null}
            </span>
            {mine ? (
              <span className="text-xs font-bold text-[#006B3F]">Yours</span>
            ) : (
              <Btn kind="dark" disabled={life.cash < due} onClick={() => onApply(buyCar(life, item.id))}>
                {cedis(item.price)}
              </Btn>
            )}
          </div>
        );
      })}
    </Screen>
  );
}

export function FarmApp({ life, raining, onBack, onApply }: { life: Life; raining: boolean; onBack: () => void; onApply: Apply }) {
  const size = farmSize(life);
  const beds = Array.from({ length: size }, (_, index) => life.farm?.[index] ?? null);
  const [slot, setSlot] = useState<number | null>(null);
  const dry = beds.some((bed) => bed && bedState(life, bed) === "dry");
  return (
    <Screen title="Backyard farm" life={life} color="#3f7d20" onBack={onBack}>
      <p className="text-xs text-[#5c6b82]">Plant, water every few hours, then harvest into your trader&apos;s bag and sell across town. A bed left dry for two days wilts. Finished houses give you more beds.</p>
      <Btn kind={raining ? "gold" : "green"} disabled={!dry} onClick={() => onApply(waterBeds(life, raining))}>
        {raining ? "🌧️ Let the rain water them" : "💧 Water the dry beds"}
      </Btn>
      <div className="grid grid-cols-2 gap-2">
        {beds.map((bed, index) => {
          if (!bed)
            return (
              <button key={index} type="button" onClick={() => setSlot(slot === index ? null : index)} className={`h-28 rounded-2xl border-2 border-dashed bg-[#efe3cf] text-sm font-semibold text-[#6b4423] ${slot === index ? "border-[#006B3F]" : "border-[#c9b08a]"}`}>
                + Plant
              </button>
            );
          const crop = cropOf(bed);
          const state = bedState(life, bed);
          const grown = Math.min(1, (life.minutes - bed.plantedAt) / (crop.hours * 60));
          return (
            <div key={index} className={`flex h-28 flex-col rounded-2xl p-2 text-center shadow-sm ${state === "dead" ? "bg-[#d9cbb5]" : state === "ready" ? "bg-[#dff3d0]" : "bg-[#efe3cf]"}`}>
              <span className="text-3xl">{state === "dead" ? "🥀" : grown < 0.35 ? "🌱" : crop.emoji}</span>
              <span className="text-xs font-semibold">{crop.label}</span>
              <span className="text-[11px] text-[#5c6b82]">
                {state === "ready" ? "Ready" : state === "dead" ? "Wilted" : state === "wet" ? `Watered ${bed.waters}/${crop.waters}` : `Thirsty ${bed.waters}/${crop.waters}`}
              </span>
              {state === "ready" || state === "dead" ? (
                <button type="button" onClick={() => onApply(harvestBed(life, index))} className="mt-auto rounded-full bg-[#006B3F] py-1 text-[11px] font-bold text-white">
                  {state === "ready" ? "Harvest" : "Clear"}
                </button>
              ) : (
                <div className="mt-auto h-1.5 rounded-full bg-white/70">
                  <div className="h-1.5 rounded-full bg-[#3f7d20]" style={{ width: `${grown * 100}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {slot !== null ? (
        <Card>
          <p className="font-semibold">Seeds for bed {slot + 1}</p>
          <div className="mt-2 space-y-2">
            {CROPS.map((crop) => (
              <button
                key={crop.id}
                type="button"
                disabled={life.cash < crop.seed}
                onClick={() => {
                  onApply(plantCrop(life, slot, crop.id));
                  setSlot(null);
                }}
                className="flex w-full items-center gap-3 rounded-xl bg-[#f4f7fb] px-3 py-2 text-left text-sm disabled:opacity-40"
              >
                <span className="text-xl">{crop.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{crop.label}</span>
                  <span className="block text-xs text-[#5c6b82]">
                    {crop.hours}h · water {crop.waters}× · yields {crop.yield}
                  </span>
                </span>
                <span className="font-bold text-[#006B3F]">{cedis(crop.seed)}</span>
              </button>
            ))}
          </div>
        </Card>
      ) : null}
    </Screen>
  );
}

export function HealthApp({ life, onBack, onApply }: { life: Life; onBack: () => void; onApply: Apply }) {
  const sick = sickness(life);
  const nhis = hasNhis(life);
  const netUp = life.inventory.includes("net");
  return (
    <Screen title="Health" life={life} color="#0e7c6b" onBack={onBack}>
      <Card tone={sick ? "warn" : "good"}>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#8b97ab]">Today</p>
        <p className="font-display text-2xl">{sick ? `🤒 ${sick.label}` : "💚 Feeling fine"}</p>
        <p className="mt-1 text-sm text-[#5c6b82]">{sick ? `Energy and fun drain faster and work pays half. It clears on its own in about ${sick.hoursLeft}h.` : "Sleep well, eat, stay clean, and keep the mosquitoes away."}</p>
      </Card>
      <Card>
        <p className="font-semibold">🏥 Polyclinic</p>
        <p className="mt-1 text-xs text-[#5c6b82]">A doctor sorts out anything, malaria included. {nhis ? `With NHIS it is ${cedis(CLINIC_NHIS)}.` : `${cedis(CLINIC_FEE)} without NHIS.`}</p>
        <div className="mt-2">
          <Btn kind="green" onClick={() => onApply(seeClinic(life))}>
            {sick ? "See the doctor" : "Check-up"} · {cedis(nhis ? CLINIC_NHIS : CLINIC_FEE)}
          </Btn>
        </div>
      </Card>
      {sick ? (
        <Card>
          <p className="font-semibold">💊 Other ways</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Btn kind="light" onClick={() => onApply(selfMedicate(life))}>
              Chemist · {cedis(MEDS_FEE)}
            </Btn>
            <Btn kind="light" onClick={() => onApply(restSick(life))}>
              Sleep it off
            </Btn>
          </div>
        </Card>
      ) : null}
      <Card tone={nhis ? "good" : undefined}>
        <p className="font-semibold">🪪 NHIS card</p>
        <p className="mt-1 text-xs text-[#5c6b82]">{nhis ? `Valid for ${wait((life.health?.nhisUntil ?? 0) - life.minutes)}.` : "Expired or never registered."} 30 days for {cedis(NHIS_FEE)}.</p>
        <div className="mt-2">
          <Btn kind="dark" onClick={() => onApply(buyNhis(life))}>
            {nhis ? "Renew" : "Register"} · {cedis(NHIS_FEE)}
          </Btn>
        </div>
      </Card>
      <p className="text-xs text-[#5c6b82]">{netUp ? "🦟 Your mosquito net is up. Rainy season bites far less." : "🦟 April to July and September to October are malaria months. A mosquito net from the catalogue cuts the risk."}</p>
    </Screen>
  );
}

export function TailorApp({ life, onBack, onApply }: { life: Life; onBack: () => void; onApply: Apply }) {
  const tailor = life.tailor ?? { orders: [], wardrobe: [] };
  const [pick, setPick] = useState<string | null>(null);
  const [color, setColor] = useState(TAILOR_COLORS[0]);
  return (
    <Screen title="Seamstress" life={life} color="#8a2f6a" onBack={onBack}>
      <p className="text-xs text-[#5c6b82]">Auntie Esi in Kantamanto sews to measure. Pick a style and a colour, then come back when it is ready.</p>
      {tailor.orders.length ? <Label>ON THE MACHINE</Label> : null}
      {tailor.orders.map((order) => {
        const style = styleOf(order.style);
        const left = order.readyAt - life.minutes;
        return (
          <div key={order.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
            <span className="h-9 w-9 shrink-0 rounded-full border border-black/10" style={{ background: order.color }} />
            <span className="min-w-0 flex-1 text-sm font-semibold">
              {style?.emoji} {style?.label}
            </span>
            <Btn kind="green" disabled={left > 0} onClick={() => onApply(collectOrder(life, order.id))}>
              {left > 0 ? wait(left) : "Collect"}
            </Btn>
          </div>
        );
      })}
      {tailor.wardrobe.length ? <Label>YOUR WARDROBE</Label> : null}
      <div className="grid grid-cols-2 gap-2">
        {tailor.wardrobe.map((fit) => {
          const style = styleOf(fit.style);
          return (
            <button key={`${fit.style}${fit.color}`} type="button" onClick={() => onApply(wearFit(life, fit))} className="flex items-center gap-2 rounded-2xl bg-white p-2 text-left text-xs font-semibold shadow-sm">
              <span className="h-7 w-7 shrink-0 rounded-full border border-black/10" style={{ background: fit.color }} />
              <span className="min-w-0 truncate">
                {style?.emoji} {style?.label}
              </span>
            </button>
          );
        })}
      </div>
      <Label>
        STYLES · {tailor.orders.length}/{MAX_ORDERS} ORDERS
      </Label>
      {STYLES.map((style) => (
        <Card key={style.id}>
          <button type="button" onClick={() => setPick(pick === style.id ? null : style.id)} className="flex w-full items-center gap-3 text-left">
            <span className="text-2xl">{style.emoji}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{style.label}</span>
              <span className="block text-xs text-[#5c6b82]">
                Ready in {style.days} day{style.days > 1 ? "s" : ""}
                {style.code === "black-red" ? " · funerals" : style.code === "white" ? " · outdoorings" : style.code === "kente" ? " · weddings" : ""}
              </span>
            </span>
            <span className="font-bold text-[#006B3F]">{cedis(style.price)}</span>
          </button>
          {pick === style.id ? (
            <div className="mt-3 space-y-2">
              {style.fixed ? null : (
                <div className="flex flex-wrap gap-2">
                  {TAILOR_COLORS.map((shade) => (
                    <button key={shade} type="button" aria-label="Colour" onClick={() => setColor(shade)} className={`h-8 w-8 rounded-full border-2 ${color === shade ? "border-[#121212]" : "border-white"}`} style={{ background: shade }} />
                  ))}
                </div>
              )}
              <Btn
                kind="dark"
                disabled={life.cash < style.price || tailor.orders.length >= MAX_ORDERS}
                onClick={() => {
                  onApply(orderStyle(life, style.id, color));
                  setPick(null);
                }}
              >
                Order · {cedis(style.price)}
              </Btn>
            </div>
          ) : null}
        </Card>
      ))}
    </Screen>
  );
}

export function BadgesApp({ life, onBack, onApply }: { life: Life; onBack: () => void; onApply: Apply }) {
  const earned = new Set(earnedBadges(life));
  const streak = streakState(life);
  return (
    <Screen title="Badges" life={life} color="#b8860b" onBack={onBack}>
      <Card tone={streak.claimed ? undefined : "good"}>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#8b97ab]">Daily streak</p>
        <p className="font-display text-3xl">🔥 {streak.claimed ? streak.count : streak.next - 1} day{(streak.claimed ? streak.count : streak.next - 1) === 1 ? "" : "s"}</p>
        <p className="mt-1 text-xs text-[#5c6b82]">{streak.claimed ? "Claimed today. Come back tomorrow to keep it going." : `Claim today for ${cedis(streak.reward)}. Miss a day and it resets.`}</p>
        <div className="mt-2">
          <Btn kind="gold" disabled={streak.claimed} onClick={() => onApply(claimDaily(life))}>
            {streak.claimed ? "Claimed" : `Claim ${cedis(streak.reward)}`}
          </Btn>
        </div>
      </Card>
      <Label>
        BADGES · {earned.size}/{BADGES.length}
      </Label>
      <div className="grid grid-cols-3 gap-2">
        {BADGES.map((badge) => {
          const has = earned.has(badge.id);
          return (
            <div key={badge.id} className={`flex flex-col items-center rounded-2xl p-2 text-center shadow-sm ${has ? "bg-white" : "bg-white/50"}`}>
              <span className={`text-3xl ${has ? "" : "opacity-30 grayscale"}`}>{badge.emoji}</span>
              <span className="mt-1 text-[11px] font-bold leading-tight">{badge.label}</span>
              <span className="mt-0.5 text-[10px] leading-tight text-[#5c6b82]">{badge.detail}</span>
            </div>
          );
        })}
      </div>
    </Screen>
  );
}
