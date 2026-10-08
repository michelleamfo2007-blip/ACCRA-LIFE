"use client";

import { useState } from "react";
import { Bar, Btn, Card, Label, Screen, wait } from "@/components/game/life-apps";
import { Offline, post, useClock, usePoll, when } from "@/components/game/play-apps";
import type { NetAction } from "@/components/game/social-apps";
import { alertsFor } from "@/lib/game/alerts";
import { DAILY_CAP, DAILY_RATE, LOAN_DAYS, LOAN_MARKUP, collectInterest, deposit, interestDue, loanLimit, repayBank, scoreLabel, takeLoan, withdraw } from "@/lib/game/bank";
import { seasonOf, upcomingEvents } from "@/lib/game/city";
import { CHIEF_STANDING, DURBAR, GIVE_CAP, PROJECTS, attendService, chooseFaith, communityOf, fundProject, giveOffering, holdDurbar, rankOf, settleDispute } from "@/lib/game/community";
import { MAX_FLEET, PAPERS, ROUTES, VEHICLES, buyVehicle, collectSales, fireDriver, hireDriver, renewPapers, salesDue, sellVehicle, serviceCost, serviceVehicle, setRoute, vehicleOf } from "@/lib/game/fleet";
import { COLORS, FOUND, GALAS, SQUAD_MAX, SQUAD_MIN, TRAIN_COST, foundTeam, playGala, releasePlayer, scoutPool, signFee, signPlayer, teamPower, trainTeam } from "@/lib/game/football";
import { GUIDE, GUIDE_REWARD, claimGuide } from "@/lib/game/guide";
import { sellables } from "@/lib/game/market";
import { POST_LABEL, RUN_FEE, RUN_STANDING, STIPEND, type FcMatch, type Listing, type PostKind } from "@/lib/game/net";
import { FEED_GAP, PETS, adoptPet, checkGoats, eggsDue, feedPets, gatherEggs, hungry, kidReady, petOf, playCat, sellPet, starving, walkDog } from "@/lib/game/pets";
import { STORIES, advanceStory, chapterOf, goalMet, goalText } from "@/lib/game/story";
import { CHECKIN_BASE, CHECKIN_STEP, CHECKIN_STREAK_MAX, weeklyNext } from "@/lib/game/weekly";
import { FLEET_WAGES, cedis, spotById, type Life, type StepResult } from "@/lib/game/world";

type Apply = (result: StepResult) => void;

function dayLabel(date: Date) {
  return date.toLocaleDateString("en-GH", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

function Notice({ text }: { text: string }) {
  return text ? <p className="rounded-2xl bg-[#fff4c2] px-3 py-2 text-xs font-semibold">{text}</p> : null;
}

function Money({ value, onChange, placeholder = "Amount" }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <input value={value} onChange={(event) => onChange(event.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder={placeholder} className="h-9 w-28 rounded-full bg-[#f4f7fb] px-3 text-sm outline-none" />;
}

export function CalendarApp({ life, onBack, onGo }: { life: Life; onBack: () => void; onGo: (spot: string) => void }) {
  const today = new Date(life.minutes * 60000);
  const season = seasonOf(today);
  const coming = upcomingEvents(today, 200).slice(0, 12);
  const clock = useClock();
  const weekly = clock ? weeklyNext(new Date(clock)) : [];
  return (
    <Screen title="Accra calendar" life={life} color="#7a3b0c" onBack={onBack}>
      <Card tone="good">
        <p className="text-3xl">{season.emoji}</p>
        <p className="mt-1 font-display text-2xl">{season.label}</p>
        <p className="mt-1 text-sm text-[#5c6b82]">{season.detail}</p>
      </Card>
      {weekly.length ? <Label>EVERY WEEK</Label> : null}
      {weekly.length ? <p className="-mt-1 text-xs text-[#5c6b82]">Check in while it is on for {cedis(CHECKIN_BASE)}. Come back every week and the streak pays up to {cedis(CHECKIN_BASE + CHECKIN_STEP * (CHECKIN_STREAK_MAX - 1))}.</p> : null}
      {weekly.map(({ event, start, live }) => (
        <Card key={event.id} tone={live ? "good" : undefined}>
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#fff4c2] text-xl">{event.emoji}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{event.title}</span>
              <span className="block text-[11px] font-bold text-[#7a3b0c]">
                {live ? "On now" : `${dayLabel(new Date(start))} · ${String(event.start).padStart(2, "0")}:00`} · {spotById(event.spot).name}
              </span>
            </span>
            <Btn kind={live ? "green" : "light"} onClick={() => onGo(event.spot)}>
              Go
            </Btn>
          </div>
        </Card>
      ))}
      <Label>COMING UP</Label>
      {coming.map((event) => (
        <Card key={event.id}>
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#fff4c2] text-xl">{event.emoji}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{event.title}</span>
              <span className="block text-[11px] font-bold text-[#7a3b0c]">{dayLabel(event.date)}</span>
              <span className="mt-1 block text-xs text-[#5c6b82]">{event.detail}</span>
            </span>
          </div>
          {event.spots.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {event.spots.slice(0, 3).map((spot) => (
                <Btn key={spot} kind="light" onClick={() => onGo(spot)}>
                  📍 {spotById(spot).name}
                </Btn>
              ))}
            </div>
          ) : null}
        </Card>
      ))}
    </Screen>
  );
}

export function StoriesApp({ life, onBack, onApply, onGo }: { life: Life; onBack: () => void; onApply: Apply; onGo: (spot: string) => void }) {
  return (
    <Screen title="Stories" life={life} color="#5c2a86" onBack={onBack}>
      {STORIES.map((story) => {
        const { step, chapter } = chapterOf(life, story);
        const ready = chapter ? chapter.goals.every((goal) => goalMet(life, goal)) : false;
        return (
          <Card key={story.id} tone={ready ? "good" : undefined}>
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-[#efe4f7] text-xl">{story.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{story.title}</span>
                <span className="block text-xs text-[#5c6b82]">{chapter ? `Chapter ${step + 1} of ${story.chapters.length}` : "Complete ✓"}</span>
              </span>
            </div>
            <Bar value={step / story.chapters.length} color="#5c2a86" />
            {chapter ? (
              <>
                <p className="mt-3 rounded-2xl bg-[#f6f1ea] px-3 py-2 text-sm italic">
                  <span className="not-italic font-semibold">{story.who}: </span>“{chapter.line}”
                </p>
                <ul className="mt-2 space-y-1">
                  {chapter.goals.map((goal, index) => (
                    <li key={index} className="flex items-center gap-2 text-xs">
                      <span>{goalMet(life, goal) ? "✅" : "⬜"}</span>
                      <span className="flex-1">{goalText(life, goal)}</span>
                      {goal.kind === "where" && !goalMet(life, goal) ? (
                        <button type="button" onClick={() => onGo(goal.spot)} className="rounded-full bg-[#f4f7fb] px-2 py-0.5 text-[10px] font-bold">
                          Go
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
                <div className="mt-3">
                  <Btn kind={ready ? "green" : "light"} disabled={!ready} onClick={() => onApply(advanceStory(life, story.id))}>
                    {ready ? `Finish chapter · +${cedis(chapter.reward)}` : `Reward ${cedis(chapter.reward)}`}
                  </Btn>
                </div>
              </>
            ) : (
              <p className="mt-2 text-xs text-[#5c6b82]">{story.blurb}</p>
            )}
          </Card>
        );
      })}
    </Screen>
  );
}

export function BankApp({ life, onBack, onApply }: { life: Life; onBack: () => void; onApply: Apply }) {
  const bank = life.bank ?? { savings: 0, lastInterest: life.minutes, loan: 0, loanDue: 0, score: 600 };
  const [save, setSave] = useState("");
  const [loan, setLoan] = useState("");
  const due = interestDue(life);
  const limit = loanLimit(life);
  const late = bank.loan > 0 && life.minutes > bank.loanDue;
  return (
    <Screen title="Bank" life={life} color="#0b3d6b" onBack={onBack}>
      <Card>
        <Label>SAVINGS</Label>
        <p className="font-display text-3xl">{cedis(bank.savings)}</p>
        <p className="text-xs text-[#5c6b82]">
          {(DAILY_RATE * 100).toFixed(1)}% a day, up to {cedis(DAILY_CAP)} a day. {due > 0 ? `${cedis(due)} interest waiting.` : ""}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Money value={save} onChange={setSave} />
          <Btn kind="green" onClick={() => (onApply(deposit(life, Number(save))), setSave(""))}>
            Save
          </Btn>
          <Btn kind="light" onClick={() => (onApply(withdraw(life, Number(save))), setSave(""))}>
            Withdraw
          </Btn>
          <Btn kind="gold" disabled={due < 1} onClick={() => onApply(collectInterest(life))}>
            Add interest
          </Btn>
        </div>
      </Card>
      <Card tone={late ? "warn" : undefined}>
        <Label>CREDIT SCORE</Label>
        <div className="flex items-baseline gap-2">
          <p className="font-display text-3xl">{bank.score}</p>
          <p className="text-sm font-semibold text-[#0b3d6b]">{scoreLabel(bank.score)}</p>
        </div>
        <Bar value={(bank.score - 300) / 550} color="#0b3d6b" />
        <p className="mt-1 text-xs text-[#5c6b82]">Repay on time to raise it. Late loans cost 5% a week and knock it down.</p>
      </Card>
      <Card>
        <Label>LOAN</Label>
        {bank.loan > 0 ? (
          <>
            <p className="font-display text-2xl">{cedis(bank.loan)} owed</p>
            <p className={`text-xs ${late ? "font-bold text-[#CE1126]" : "text-[#5c6b82]"}`}>{late ? "Overdue. Pay it now." : `Due in ${wait(bank.loanDue - life.minutes)}.`}</p>
            <div className="mt-2 flex gap-2">
              <Money value={loan} onChange={setLoan} />
              <Btn kind="dark" onClick={() => (onApply(repayBank(life, Number(loan) || bank.loan)), setLoan(""))}>
                {loan ? "Repay" : "Repay all"}
              </Btn>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm">
              You can borrow up to <b>{cedis(limit)}</b>. {Math.round(LOAN_MARKUP * 100)}% flat, due in {LOAN_DAYS} days.
            </p>
            <div className="mt-2 flex gap-2">
              <Money value={loan} onChange={setLoan} />
              <Btn kind="dark" onClick={() => (onApply(takeLoan(life, Number(loan))), setLoan(""))}>
                Borrow
              </Btn>
            </div>
          </>
        )}
      </Card>
      <p className="text-center text-[11px] text-[#8b97ab]">Want a MoMo agent stand? Open the Business app.</p>
    </Screen>
  );
}

export function FleetApp({ life, onBack, onApply }: { life: Life; onBack: () => void; onApply: Apply }) {
  const fleet = life.fleet ?? [];
  const [selling, setSelling] = useState<string | null>(null);
  return (
    <Screen title="Transport fleet" life={life} color="#b45309" onBack={onBack}>
      {fleet.length ? <Label>YOUR FLEET · {fleet.length}/{MAX_FLEET}</Label> : <p className="text-sm text-[#5c6b82]">Buy an okada, taxi or trotro, hire a driver, and they bring sales every day. Wages go out on Saturday.</p>}
      {fleet.map((car) => {
        const plan = vehicleOf(car.kind);
        const due = salesDue(life, car);
        const fix = serviceCost(car);
        const expired = life.minutes > car.papersUntil;
        return (
          <Card key={car.id} tone={car.broken ? "warn" : undefined}>
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-[#fdebd3] text-xl">{plan.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">
                  {plan.label} · {car.driver ?? "No driver"}
                </span>
                <span className="block text-xs text-[#5c6b82]">{car.broken ? "Broken down" : `Condition ${car.condition}%`} · {expired ? "Papers expired" : `Papers ${wait(car.papersUntil - life.minutes)}`}</span>
              </span>
            </div>
            <Bar value={car.condition / 100} color={car.condition < 40 ? "#CE1126" : "#b45309"} />
            <select value={car.route} onChange={(event) => onApply(setRoute(life, car.id, event.target.value))} className="mt-2 h-9 w-full rounded-full bg-[#f4f7fb] px-3 text-xs outline-none">
              {ROUTES.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.label} · {route.blurb}
                </option>
              ))}
            </select>
            <div className="mt-2 flex flex-wrap gap-2">
              {car.driver ? (
                <Btn kind="green" disabled={due < 1 || car.broken} onClick={() => onApply(collectSales(life, car.id))}>
                  Collect {cedis(due)}
                </Btn>
              ) : (
                <Btn kind="dark" onClick={() => onApply(hireDriver(life, car.id))}>
                  Hire driver · {cedis(FLEET_WAGES[car.kind] ?? 0)}/wk
                </Btn>
              )}
              {fix > 0 ? (
                <Btn kind={car.broken ? "dark" : "light"} onClick={() => onApply(serviceVehicle(life, car.id))}>
                  Fitter {cedis(fix)}
                </Btn>
              ) : null}
              <Btn kind={expired ? "gold" : "light"} onClick={() => onApply(renewPapers(life, car.id))}>
                Papers {cedis(PAPERS)}
              </Btn>
              {car.driver ? (
                <Btn kind="light" onClick={() => onApply(fireDriver(life, car.id))}>
                  Let go
                </Btn>
              ) : null}
            </div>
            <div className="mt-2 text-right">
              {selling === car.id ? (
                <span className="inline-flex gap-2">
                  <Btn kind="red" onClick={() => (onApply(sellVehicle(life, car.id)), setSelling(null))}>
                    Sell it
                  </Btn>
                  <Btn kind="light" onClick={() => setSelling(null)}>
                    Keep
                  </Btn>
                </span>
              ) : (
                <button type="button" onClick={() => setSelling(car.id)} className="text-xs font-semibold text-[#8b97ab]">
                  Sell vehicle
                </button>
              )}
            </div>
          </Card>
        );
      })}
      <Label>BUY</Label>
      {VEHICLES.map((plan) => (
        <Card key={plan.id}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{plan.emoji}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{plan.label}</span>
              <span className="block text-xs text-[#5c6b82]">
                About {cedis(plan.perHour * 24)} a day on the road · driver {cedis(FLEET_WAGES[plan.id])}/wk
              </span>
            </span>
            <Btn kind="dark" disabled={life.cash < plan.price || fleet.length >= MAX_FLEET} onClick={() => onApply(buyVehicle(life, plan.id))}>
              {cedis(plan.price)}
            </Btn>
          </div>
        </Card>
      ))}
      <p className="text-center text-[11px] text-[#8b97ab]">Sales stop piling up after a day, so collect daily. Rough routes pay more and wear the engine.</p>
    </Screen>
  );
}

export function FootballApp({ me, life, cloud, onBack, onApply, onNet }: { me: string; life: Life; cloud: boolean; onBack: () => void; onApply: Apply; onNet: NetAction }) {
  const team = life.team ?? null;
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [rival, setRival] = useState("");
  const [stake, setStake] = useState("0");
  const [notice, setNotice] = useState("");
  const [data, refresh] = usePoll<{ matches: FcMatch[] }>(cloud && team ? "/api/live/play?view=fc" : null, 8000);
  const now = useClock();
  if (!team) {
    return (
      <Screen title="Sunday league" life={life} color="#14532d" onBack={onBack}>
        <Card>
          <p className="font-semibold">⚽ Found a team</p>
          <p className="mt-1 text-xs text-[#5c6b82]">Kits, balls and registration: {cedis(FOUND)}. Seven players from the area sign up straight away.</p>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Team name, e.g. Osu Stars" maxLength={28} className="mt-2 h-10 w-full rounded-full bg-[#f4f7fb] px-4 text-sm outline-none" />
          <div className="mt-2 flex gap-2">
            {COLORS.map((shade) => (
              <button key={shade} type="button" onClick={() => setColor(shade)} aria-label={`Kit colour ${shade}`} className={`h-8 w-8 rounded-full ${color === shade ? "ring-2 ring-offset-2 ring-[#121212]" : ""}`} style={{ background: shade }} />
            ))}
          </div>
          <div className="mt-3">
            <Btn kind="green" disabled={life.cash < FOUND} onClick={() => onApply(foundTeam(life, name, color))}>
              Found team · {cedis(FOUND)}
            </Btn>
          </div>
        </Card>
      </Screen>
    );
  }
  const power = teamPower(team);
  const trainLeft = (team.lastTrain ?? -Infinity) + 360 - life.minutes;
  const galaLeft = (team.lastGala ?? -Infinity) + 240 - life.minutes;
  const pool = scoutPool(life);
  const matches = data?.matches ?? [];
  return (
    <Screen title={team.name} life={life} color="#14532d" onBack={onBack}>
      <Notice text={notice} />
      <Card>
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-full text-2xl" style={{ background: team.color }}>
            ⚽
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-xl">{team.name}</span>
            <span className="block text-xs text-[#5c6b82]">
              {team.wins}W {team.draws}D {team.losses}L · {team.trophies} 🏆 · strength {power.toFixed(1)}
            </span>
          </span>
        </div>
        <p className="mt-2 text-[11px] font-bold text-[#8b97ab]">MORALE</p>
        <Bar value={team.morale / 100} color="#14532d" />
        <div className="mt-3">
          <Btn kind="dark" disabled={trainLeft > 0} onClick={() => onApply(trainTeam(life))}>
            {trainLeft > 0 ? `Training again in ${wait(trainLeft)}` : `Train · ${cedis(TRAIN_COST)}`}
          </Btn>
        </div>
      </Card>
      <Label>GALAS {galaLeft > 0 ? `· next in ${wait(galaLeft)}` : ""}</Label>
      {GALAS.map((gala) => (
        <Card key={gala.id}>
          <div className="flex items-center gap-3">
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{gala.label}</span>
              <span className="block text-xs text-[#5c6b82]">
                Entry {cedis(gala.fee)} · prize {cedis(gala.prize)} · opponents {gala.strength}/10
              </span>
            </span>
            <Btn kind="green" disabled={galaLeft > 0 || team.players.length < SQUAD_MIN || life.cash < gala.fee} onClick={() => onApply(playGala(life, gala.id))}>
              Play
            </Btn>
          </div>
        </Card>
      ))}
      <Label>
        SQUAD · {team.players.length}/{SQUAD_MAX}
      </Label>
      <div className="grid grid-cols-2 gap-2">
        {team.players.map((player) => (
          <div key={player.id} className="rounded-2xl bg-white px-3 py-2 shadow-sm">
            <p className="truncate text-sm font-semibold">{player.name}</p>
            <p className="text-[11px] text-[#5c6b82]">
              {player.pos} · skill {player.skill}
              <button type="button" onClick={() => onApply(releasePlayer(life, player.id))} className="ml-2 font-semibold text-[#CE1126]">
                Release
              </button>
            </p>
          </div>
        ))}
      </div>
      <Label>SCOUTING TODAY</Label>
      {pool.map((player) => (
        <div key={player.id} className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-sm">
          <span className="min-w-0 flex-1 text-sm">
            <span className="font-semibold">{player.name}</span> · {player.pos} · skill {player.skill}
          </span>
          <Btn kind="dark" disabled={team.players.length >= SQUAD_MAX || life.cash < signFee(player)} onClick={() => onApply(signPlayer(life, player.id))}>
            {cedis(signFee(player))}
          </Btn>
        </div>
      ))}
      {cloud ? (
        <>
          <Label>CHALLENGE ANOTHER TEAM</Label>
          <div className="flex flex-wrap gap-2">
            <input value={rival} onChange={(event) => setRival(event.target.value)} placeholder="@username" className="h-9 min-w-0 flex-1 rounded-full bg-white px-3 text-sm outline-none" />
            <Money value={stake} onChange={setStake} placeholder="Stake" />
            <Btn kind="gold" onClick={() => void onNet({ api: "play", action: "fc-challenge", to: rival, stake: Number(stake) }).then((error) => (setNotice(error ?? ""), refresh()))}>
              Challenge
            </Btn>
          </div>
          {matches.map((match) => {
            const incoming = match.b === me && match.status === "waiting";
            const mineFirst = match.a === me;
            return (
              <Card key={match.id}>
                <p className="text-sm font-semibold">
                  {match.aTeam} {match.score ? `${match.score[0]}–${match.score[1]}` : "vs"} {match.bTeam}
                </p>
                <p className="text-[11px] text-[#5c6b82]">
                  @{match.a} vs @{match.b} · {match.stake ? cedis(match.stake) : "friendly"} · {match.status === "waiting" ? (incoming ? "waiting for you" : "waiting for them") : match.status} · {now ? when(match.at, now) : ""}
                </p>
                {match.score ? <p className="mt-1 text-xs font-bold">{match.score[0] === match.score[1] ? "Draw" : (match.score[0] > match.score[1]) === mineFirst ? "You won" : "You lost"}</p> : null}
                {incoming ? (
                  <div className="mt-2 flex gap-2">
                    <Btn kind="green" onClick={() => void onNet({ api: "play", action: "fc-answer", owner: match.a, id: match.id, yes: true }).then((error) => (setNotice(error ?? ""), refresh()))}>
                      Play{match.stake ? ` · ${cedis(match.stake)}` : ""}
                    </Btn>
                    <Btn kind="light" onClick={() => void onNet({ api: "play", action: "fc-answer", owner: match.a, id: match.id, yes: false }).then((error) => (setNotice(error ?? ""), refresh()))}>
                      Decline
                    </Btn>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </>
      ) : null}
    </Screen>
  );
}

export function PetsApp({ life, onBack, onApply }: { life: Life; onBack: () => void; onApply: Apply }) {
  const pets = life.pets ?? [];
  const hungryCount = pets.filter((pet) => hungry(life, pet)).length;
  const feedCost = pets.filter((pet) => hungry(life, pet)).reduce((sum, pet) => sum + petOf(pet.kind).feed, 0);
  const eggs = eggsDue(life);
  return (
    <Screen title="Pets and animals" life={life} color="#8a5a2b" onBack={onBack}>
      {pets.length ? (
        <Card tone={pets.some((pet) => starving(life, pet)) ? "warn" : undefined}>
          <div className="flex flex-wrap gap-2">
            <Btn kind="green" disabled={!hungryCount} onClick={() => onApply(feedPets(life))}>
              {hungryCount ? `Feed ${hungryCount} · ${cedis(feedCost)}` : "Everyone is fed"}
            </Btn>
            {pets.some((pet) => pet.kind === "chicken") ? (
              <Btn kind="gold" disabled={eggs < 1} onClick={() => onApply(gatherEggs(life))}>
                🥚 Gather {eggs || ""}
              </Btn>
            ) : null}
            {pets.filter((pet) => pet.kind === "goat").length >= 2 ? (
              <Btn kind="light" disabled={!kidReady(life)} onClick={() => onApply(checkGoats(life))}>
                🐐 Check the pen
              </Btn>
            ) : null}
          </div>
          <p className="mt-2 text-[11px] text-[#5c6b82]">Feed every {FEED_GAP / 60}h or so. Two days without food and they wander off.</p>
        </Card>
      ) : (
        <p className="text-sm text-[#5c6b82]">A dog at the gate, a cat in the kitchen, hens for eggs, goats for the yard.</p>
      )}
      {pets.map((pet) => {
        const plan = petOf(pet.kind);
        const fed = life.minutes - pet.fedAt;
        return (
          <div key={pet.id} className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2 shadow-sm">
            <span className="text-2xl">{plan.emoji}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{pet.name}</span>
              <span className={`block text-[11px] ${starving(life, pet) ? "font-bold text-[#CE1126]" : "text-[#5c6b82]"}`}>{hungry(life, pet) ? `Hungry · fed ${wait(fed)} ago` : "Full"}</span>
            </span>
            {pet.kind === "dog" ? (
              <Btn kind="light" onClick={() => onApply(walkDog(life, pet.id))}>
                Walk
              </Btn>
            ) : null}
            {pet.kind === "cat" ? (
              <Btn kind="light" onClick={() => onApply(playCat(life, pet.id))}>
                Play
              </Btn>
            ) : null}
            <Btn kind="red" onClick={() => onApply(sellPet(life, pet.id))}>
              Sell
            </Btn>
          </div>
        );
      })}
      <Label>BRING ONE HOME</Label>
      {PETS.map((plan) => (
        <Card key={plan.id}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{plan.emoji}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{plan.label}</span>
              <span className="block text-xs text-[#5c6b82]">
                {plan.blurb} Feed {cedis(plan.feed)}.
              </span>
            </span>
            <Btn kind="dark" disabled={life.cash < plan.price} onClick={() => onApply(adoptPet(life, plan.id))}>
              {cedis(plan.price)}
            </Btn>
          </div>
        </Card>
      ))}
    </Screen>
  );
}

type Election = { week: number; candidates: { username: string; name: string; pitch: string; votes: number }[]; myVote: string | null; running: boolean; winner: { username: string; name: string; votes: number } | null; canClaim: boolean };

export function CommunityApp({ me, life, cloud, onBack, onApply, onNet, onGo }: { me: string; life: Life; cloud: boolean; onBack: () => void; onApply: Apply; onNet: NetAction; onGo: (spot: string) => void }) {
  const community = communityOf(life);
  const [gift, setGift] = useState("20");
  const [pitch, setPitch] = useState("");
  const [notice, setNotice] = useState("");
  const [vote, refresh] = usePoll<Election>(cloud ? "/api/live/play?view=election" : null, 15000);
  const place = community.faith === "mosque" ? "mosque" : "church";
  const serviceLeft = (community.lastService ?? -Infinity) + 720 - life.minutes;
  const courtLeft = (community.lastCourt ?? -Infinity) + 1440 - life.minutes;
  async function act(body: Record<string, unknown>, done: string) {
    const { error } = await post(body);
    setNotice(error ?? done);
    refresh();
  }
  return (
    <Screen title="Community" life={life} color="#1e3a5f" onBack={onBack}>
      <Notice text={notice} />
      <Card>
        <Label>STANDING</Label>
        <p className="font-display text-3xl">{community.standing}</p>
        <p className="text-sm font-semibold text-[#1e3a5f]">{community.chief ? `👑 ${community.chief.stool}` : rankOf(community.standing)}</p>
        {!community.chief ? <Bar value={community.standing / CHIEF_STANDING} color="#1e3a5f" /> : null}
      </Card>
      <Label>CONGREGATION</Label>
      <Card>
        <div className="flex gap-2">
          <Btn kind={community.faith === "church" ? "dark" : "light"} onClick={() => onApply(chooseFaith(life, "church"))}>
            ⛪ Ridge Church
          </Btn>
          <Btn kind={community.faith === "mosque" ? "dark" : "light"} onClick={() => onApply(chooseFaith(life, "mosque"))}>
            🕌 Central Mosque
          </Btn>
        </div>
        {community.faith ? (
          <div className="mt-3 space-y-2">
            <div className="flex flex-wrap gap-2">
              {life.where === place ? (
                <Btn kind="green" disabled={serviceLeft > 0} onClick={() => onApply(attendService(life))}>
                  {serviceLeft > 0 ? `Next service in ${wait(serviceLeft)}` : community.faith === "church" ? "Attend service" : "Join prayers"}
                </Btn>
              ) : (
                <Btn kind="light" onClick={() => onGo(place)}>
                  📍 Go to {spotById(place).name}
                </Btn>
              )}
            </div>
            <div className="flex gap-2">
              <Money value={gift} onChange={setGift} />
              <Btn kind="gold" onClick={() => onApply(giveOffering(life, Number(gift)))}>
                {community.faith === "church" ? "Give offering" : "Give sadaqah"}
              </Btn>
            </div>
            <p className="text-[11px] text-[#5c6b82]">Every ₵50 given adds 1 standing. Up to {cedis(GIVE_CAP)} a day.</p>
          </div>
        ) : null}
      </Card>
      <Label>PROJECTS FOR THE AREA</Label>
      {PROJECTS.map((project) => {
        const done = community.projects.includes(project.id);
        return (
          <div key={project.id} className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2 shadow-sm">
            <span className="text-2xl">{project.emoji}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{project.label}</span>
              <span className="block text-[11px] text-[#5c6b82]">+{project.standing} standing</span>
            </span>
            <Btn kind={done ? "light" : "dark"} disabled={done || life.cash < project.cost} onClick={() => onApply(fundProject(life, project.id))}>
              {done ? "Funded ✓" : cedis(project.cost)}
            </Btn>
          </div>
        );
      })}
      <Label>CHIEFTAINCY</Label>
      <Card tone={community.chief ? "good" : undefined}>
        {community.chief ? (
          <>
            <p className="text-sm">You sit as {community.chief.stool}. People bring their disputes to you.</p>
            <div className="mt-2">
              <Btn kind="dark" disabled={courtLeft > 0} onClick={() => onApply(settleDispute(life))}>
                {courtLeft > 0 ? `Next sitting in ${wait(courtLeft)}` : "Settle a dispute"}
              </Btn>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm">
              The elders will enstool someone with {CHIEF_STANDING} standing who can host a durbar for {cedis(DURBAR)}.
            </p>
            <div className="mt-2">
              <Btn kind="gold" disabled={community.standing < CHIEF_STANDING || life.cash < DURBAR} onClick={() => onApply(holdDurbar(life))}>
                Hold the durbar
              </Btn>
            </div>
          </>
        )}
      </Card>
      {cloud ? (
        <>
          <Label>ASSEMBLY ELECTION · THIS WEEK</Label>
          {vote?.winner ? (
            <Card tone="good">
              <p className="text-sm">
                Last week&apos;s assembly member: <b>{vote.winner.name}</b> (@{vote.winner.username}) with {vote.winner.votes} {vote.winner.votes === 1 ? "vote" : "votes"}.
              </p>
              {vote.canClaim ? (
                <div className="mt-2">
                  <Btn kind="green" onClick={() => void act({ action: "vote-stipend" }, `Stipend of ${cedis(STIPEND)} is on its way.`)}>
                    Claim {cedis(STIPEND)} stipend
                  </Btn>
                </div>
              ) : null}
            </Card>
          ) : null}
          {vote && !vote.candidates.length ? <p className="text-sm text-[#5c6b82]">Nobody is on the ballot yet.</p> : null}
          {vote?.candidates.map((person) => (
            <div key={person.username} className={`rounded-2xl px-3 py-2 shadow-sm ${vote.myVote === person.username ? "bg-[#e6f4ec]" : "bg-white"}`}>
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    {person.name} <span className="text-[11px] text-[#5c6b82]">@{person.username}</span>
                  </span>
                  <span className="block text-xs italic text-[#5c6b82]">“{person.pitch}”</span>
                </span>
                <span className="text-sm font-bold">{person.votes}</span>
              </div>
              {!vote.myVote && person.username !== me ? (
                <div className="mt-1">
                  <Btn kind="dark" onClick={() => void act({ action: "vote-cast", to: person.username }, `You voted for ${person.name}.`)}>
                    Vote
                  </Btn>
                </div>
              ) : null}
            </div>
          ))}
          {vote && !vote.running ? (
            <Card>
              <p className="text-sm font-semibold">Run for assembly member</p>
              <p className="text-[11px] text-[#5c6b82]">
                Needs {RUN_STANDING} standing and a {cedis(RUN_FEE)} filing fee. The winner each week claims {cedis(STIPEND)}.
              </p>
              <input value={pitch} onChange={(event) => setPitch(event.target.value)} placeholder="Your promise to the area" maxLength={140} className="mt-2 h-10 w-full rounded-full bg-[#f4f7fb] px-4 text-sm outline-none" />
              <div className="mt-2">
                <Btn kind="gold" disabled={community.standing < RUN_STANDING} onClick={() => void onNet({ api: "play", action: "vote-run", pitch }).then((error) => (setNotice(error ?? "You are on the ballot."), refresh()))}>
                  File · {cedis(RUN_FEE)}
                </Btn>
              </div>
            </Card>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

export function GuideApp({ life, onBack, onApply, onOpen }: { life: Life; onBack: () => void; onApply: Apply; onOpen: (app: string) => void }) {
  const claimed = new Set(life.guide ?? []);
  const left = GUIDE.filter((step) => !claimed.has(step.id)).length;
  return (
    <Screen title="Getting started" life={life} color="#006B3F" onBack={onBack}>
      <Card tone="good">
        <p className="font-display text-2xl">Welcome to Accra</p>
        <p className="mt-1 text-sm text-[#5c6b82]">{left ? `${left} steps left. Each one pays ${cedis(GUIDE_REWARD)}.` : "You know your way around now. Enjoy the city."}</p>
        <button type="button" onClick={() => onOpen("work")} className="mt-3 rounded-full bg-[#121212] px-3 py-1.5 text-xs font-bold text-white">
          How to make money
        </button>
        <Bar value={(GUIDE.length - left) / GUIDE.length} />
      </Card>
      {GUIDE.map((step) => {
        const done = step.done(life);
        const got = claimed.has(step.id);
        return (
          <div key={step.id} className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2 shadow-sm">
            <span className="text-lg">{got ? "✅" : done ? "🎁" : "⬜"}</span>
            <span className="min-w-0 flex-1">
              <span className={`block text-sm font-semibold ${got ? "text-[#8b97ab] line-through" : ""}`}>{step.title}</span>
              {!got ? <span className="block text-[11px] text-[#5c6b82]">{step.hint}</span> : null}
            </span>
            {!got && done ? (
              <Btn kind="green" onClick={() => onApply(claimGuide(life, step.id))}>
                +{cedis(GUIDE_REWARD)}
              </Btn>
            ) : !got && step.app ? (
              <Btn kind="light" onClick={() => onOpen(step.app!)}>
                Open
              </Btn>
            ) : null}
          </div>
        );
      })}
    </Screen>
  );
}

export function AlertsApp({ life, onBack, onOpen }: { life: Life; onBack: () => void; onOpen: (app: string) => void }) {
  const list = alertsFor(life);
  return (
    <Screen title="Notifications" life={life} color="#243044" onBack={onBack}>
      {list.length ? null : <p className="text-sm text-[#5c6b82]">All quiet. Nothing needs you right now.</p>}
      {list.map((alert) => (
        <button key={alert.id} type="button" onClick={() => onOpen(alert.app)} className={`flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-2.5 text-left shadow-sm ${alert.urgent ? "ring-2 ring-[#CE1126]/40" : ""}`}>
          <span className="text-2xl">{alert.emoji}</span>
          <span className="min-w-0 flex-1 text-sm">{alert.text}</span>
          <span className="text-[#8b97ab]">›</span>
        </button>
      ))}
    </Screen>
  );
}

type FeedReply = { id: string; who: string; name: string; text: string; at: string };
type FeedPost = { id: string; kind: PostKind; text: string; snap: string; at: string; likes: number; liked: boolean; replies?: FeedReply[]; author: string; name: string; handle: string; mine: boolean; followed: boolean };

export function FeedApp({ life, cloud, onBack, onNet }: { life: Life; cloud: boolean; onBack: () => void; onNet: NetAction }) {
  const [tab, setTab] = useState("all");
  const [kind, setKind] = useState<PostKind>("status");
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [wall, setWall] = useState<string | null>(null);
  const [wallText, setWallText] = useState("");
  const [notice, setNotice] = useState("");
  const [data, refresh] = usePoll<{ posts: FeedPost[]; following: number; followers: number }>(cloud ? `/api/live/play?view=feed&tab=${tab}` : null, 12000);
  const now = useClock();
  if (!cloud) return <Offline title="Feed" color="#c2185b" life={life} onBack={onBack} />;
  async function act(body: Record<string, unknown>) {
    const { error } = await post(body);
    if (error) setNotice(error);
    refresh();
  }
  return (
    <Screen title="Feed" life={life} color="#c2185b" onBack={onBack}>
      <Notice text={notice} />
      <p className="text-center text-xs text-[#5c6b82]">
        <b>{data?.followers ?? 0}</b> followers · <b>{data?.following ?? 0}</b> following
      </p>
      <Card>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(POST_LABEL) as PostKind[]).map((item) => (
            <button key={item} type="button" onClick={() => setKind(item)} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${kind === item ? "bg-[#121212] text-white" : "bg-[#f4f7fb]"}`}>
              {POST_LABEL[item].emoji} {POST_LABEL[item].label}
            </button>
          ))}
        </div>
        <textarea value={text} onChange={(event) => setText(event.target.value)} maxLength={200} rows={2} placeholder={kind === "status" ? "What's happening?" : "Add a caption (optional)"} className="mt-2 w-full resize-none rounded-2xl bg-[#f4f7fb] px-3 py-2 text-sm outline-none" />
        <div className="mt-1 flex justify-end">
          <Btn
            kind="dark"
            onClick={() =>
              void onNet({ api: "play", action: "feed-post", kind, text }).then((error) => {
                setNotice(error ?? "");
                if (!error) setText("");
                refresh();
              })
            }
          >
            Post
          </Btn>
        </div>
      </Card>
      <div className="flex gap-1.5">
        {[
          ["all", "Latest"],
          ["following", "Following"],
          ["trending", "Trending"],
          ["me", "Mine"],
        ].map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${tab === id ? "bg-[#c2185b] text-white" : "bg-white"}`}>
            {label}
          </button>
        ))}
      </div>
      {!data ? <p className="text-sm text-[#5c6b82]">Loading…</p> : null}
      {data && !data.posts.length ? <p className="text-sm text-[#5c6b82]">Nothing here yet. Post something.</p> : null}
      {data?.posts.map((item) => (
        <Card key={`${item.author}-${item.id}`}>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#fde4ef] text-sm font-bold text-[#c2185b]">{item.name.slice(0, 1).toUpperCase()}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{item.name}</span>
              <span className="block text-[11px] text-[#5c6b82]">
                @{item.handle}
                {item.handle !== item.author ? ` on @${item.author}` : ""} · {now ? when(item.at, now) : ""}
              </span>
            </span>
            {!item.mine ? (
              <button type="button" onClick={() => void act({ action: "feed-follow", to: item.handle })} className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${item.followed ? "bg-[#f4f7fb]" : "bg-[#c2185b] text-white"}`}>
                {item.followed ? "Following" : "Follow"}
              </button>
            ) : null}
          </div>
          {item.snap ? <p className="mt-2 rounded-xl bg-[#f6f1ea] px-3 py-2 text-xs font-semibold">{item.snap}</p> : null}
          {item.text ? <p className="mt-2 text-sm">{item.text}</p> : null}
          {(item.replies ?? []).map((note) => (
            <p key={note.id} className="mt-2 rounded-xl bg-[#f4f7fb] px-3 py-2 text-xs leading-5">
              <span className="font-semibold">{note.name}</span> {note.text}
            </p>
          ))}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
            <button type="button" onClick={() => void act({ action: "feed-like", owner: item.author, id: item.id })} className={`font-semibold ${item.liked ? "text-[#c2185b]" : "text-[#5c6b82]"}`}>
              {item.liked ? "❤️" : "🤍"} {item.likes}
            </button>
            <button
              type="button"
              onClick={() => {
                setReplyTo(replyTo === item.id ? null : item.id);
                setReply("");
              }}
              className="font-semibold text-[#5c6b82]"
            >
              Reply
            </button>
            {item.mine && item.handle === item.author ? null : (
              <button
                type="button"
                onClick={() => {
                  setWall(wall === item.id ? null : item.id);
                  setWallText("");
                }}
                className="font-semibold text-[#5c6b82]"
              >
                Post on @{item.author}
              </button>
            )}
            {item.mine ? (
              <button type="button" onClick={() => void act({ action: "feed-delete", owner: item.author, id: item.id })} className="ml-auto text-[#8b97ab]">
                Delete
              </button>
            ) : null}
          </div>
          {replyTo === item.id ? (
            <div className="mt-2 flex gap-2">
              <input
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                maxLength={160}
                placeholder={`Reply to ${item.name}`}
                className="min-w-0 flex-1 rounded-full bg-[#f4f7fb] px-3 py-2 text-sm outline-none"
              />
              <button
                type="button"
                onClick={() =>
                  void act({ action: "feed-reply", owner: item.author, id: item.id, text: reply }).then(() => {
                    setReply("");
                    setReplyTo(null);
                  })
                }
                className="rounded-full bg-[#121212] px-3 py-2 text-xs font-bold text-white"
              >
                Send
              </button>
            </div>
          ) : null}
          {wall === item.id ? (
            <div className="mt-2 flex gap-2">
              <input
                value={wallText}
                onChange={(event) => setWallText(event.target.value)}
                maxLength={200}
                placeholder={`Post on @${item.author}'s feed`}
                className="min-w-0 flex-1 rounded-full bg-[#f4f7fb] px-3 py-2 text-sm outline-none"
              />
              <button
                type="button"
                onClick={() =>
                  void onNet({ api: "play", action: "feed-post", kind: "status", text: wallText, wall: item.author }).then((error) => {
                    setNotice(error ?? "");
                    if (!error) {
                      setWallText("");
                      setWall(null);
                    }
                    refresh();
                  })
                }
                className="rounded-full bg-[#c2185b] px-3 py-2 text-xs font-bold text-white"
              >
                Post
              </button>
            </div>
          ) : null}
        </Card>
      ))}
    </Screen>
  );
}

type MarketView = { listings: (Listing & { seller: string; name: string })[]; mine: Listing[] };

export function MarketApp({ life, cloud, onBack, onNet }: { life: Life; cloud: boolean; onBack: () => void; onNet: NetAction }) {
  const [tab, setTab] = useState<"buy" | "sell" | "mine">("buy");
  const [notice, setNotice] = useState("");
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [buying, setBuying] = useState<string | null>(null);
  const [data, refresh] = usePoll<MarketView>(cloud ? "/api/live/play?view=market" : null, 15000);
  if (!cloud) return <Offline title="Player market" color="#0f766e" life={life} onBack={onBack} />;
  const stock = sellables(life);
  function run(body: Record<string, unknown>) {
    void onNet({ api: "play", ...body }).then((error) => {
      setNotice(error ?? "");
      setBuying(null);
      refresh();
    });
  }
  return (
    <Screen title="Player market" life={life} color="#0f766e" onBack={onBack}>
      <Notice text={notice} />
      <div className="flex gap-1.5">
        {(
          [
            ["buy", "Buy"],
            ["sell", "Sell"],
            ["mine", `My listings${data?.mine.length ? ` · ${data.mine.length}` : ""}`],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${tab === id ? "bg-[#0f766e] text-white" : "bg-white"}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === "buy" ? (
        <>
          {!data ? <p className="text-sm text-[#5c6b82]">Loading…</p> : null}
          {data && !data.listings.length ? <p className="text-sm text-[#5c6b82]">No listings yet. Be the first to sell.</p> : null}
          {data?.listings.map((item) => (
            <div key={`${item.seller}-${item.id}`} className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2 shadow-sm">
              <span className="text-2xl">{item.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">
                  {item.qty > 1 ? `${item.qty}× ` : ""}
                  {item.label}
                </span>
                <span className="block text-[11px] text-[#5c6b82]">
                  {item.name} · @{item.seller}
                </span>
              </span>
              {buying === item.id ? (
                <span className="flex gap-1">
                  <Btn kind="green" disabled={life.cash < item.price} onClick={() => run({ action: "market-buy", owner: item.seller, id: item.id })}>
                    Pay {cedis(item.price)}
                  </Btn>
                  <Btn kind="light" onClick={() => setBuying(null)}>
                    ✕
                  </Btn>
                </span>
              ) : (
                <Btn kind="dark" onClick={() => setBuying(item.id)}>
                  {cedis(item.price)}
                </Btn>
              )}
            </div>
          ))}
        </>
      ) : null}
      {tab === "sell" ? (
        <>
          <p className="text-xs text-[#5c6b82]">Furniture from storage, goods in your trader&apos;s bag, and tailored fits. The market keeps 5% when it sells. Placed furniture comes out of your room.</p>
          {stock.length ? null : <p className="text-sm text-[#5c6b82]">Nothing to sell yet.</p>}
          {stock.map((item) => {
            const key = `${item.kind}:${item.ref}`;
            const price = prices[key] ?? String(item.hint);
            return (
              <div key={key} className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-sm">
                <span className="text-xl">{item.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{item.label}</span>
                  <span className="block text-[11px] text-[#5c6b82]">{item.max > 1 ? `${item.max} in bag · ` : ""}suggested {cedis(item.hint)}</span>
                </span>
                <Money value={price} onChange={(value) => setPrices((current) => ({ ...current, [key]: value }))} placeholder="₵" />
                <Btn kind="dark" onClick={() => run({ action: "market-list", kind: item.kind, ref: item.ref, qty: 1, price: Number(price) })}>
                  List
                </Btn>
              </div>
            );
          })}
        </>
      ) : null}
      {tab === "mine" ? (
        <>
          {data && !data.mine.length ? <p className="text-sm text-[#5c6b82]">You have nothing listed.</p> : null}
          {data?.mine.map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2 shadow-sm">
              <span className="text-2xl">{item.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{item.label}</span>
                <span className="block text-[11px] text-[#5c6b82]">Listed at {cedis(item.price)}</span>
              </span>
              <Btn kind="light" onClick={() => run({ action: "market-cancel", id: item.id })}>
                Take back
              </Btn>
            </div>
          ))}
        </>
      ) : null}
    </Screen>
  );
}