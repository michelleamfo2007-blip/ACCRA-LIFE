import { interestDue } from "@/lib/game/bank";
import { bedState, rentDue } from "@/lib/game/estate";
import { salesDue } from "@/lib/game/fleet";
import { eggsDue, hungry, kidReady, starving } from "@/lib/game/pets";
import { storyReady } from "@/lib/game/story";
import { tillOf } from "@/lib/game/trade";
import { TILL_HOURS } from "@/lib/game/biz-table";
import { SERVE_HOURS, salesOf } from "@/lib/game/kitchen";
import { checkInReward, checkedIn, weeklyNow } from "@/lib/game/weekly";
import { cedis, spotById, type Life } from "@/lib/game/world";

export type Alert = { id: string; emoji: string; text: string; app: string; urgent?: boolean };

export function alertsFor(life: Life): Alert[] {
  const list: Alert[] = [];
  const at = new Date(life.minutes * 60000);
  const live = weeklyNow(at);
  if (live && !checkedIn(life, live.key)) list.push({ id: `weekly-${live.key}`, emoji: live.event.emoji, text: `${live.event.title} is on at ${spotById(live.event.spot).name}. Check in for ${cedis(checkInReward(life, at))}.`, app: "calendar", urgent: true });
  if (life.chop) {
    const sales = salesOf(life);
    if (life.chop.menu.length && life.chop.menu.every((item) => (life.chop!.stock[item.dish] ?? 0) <= (sales.sold[item.dish] ?? 0))) list.push({ id: "chop-empty", emoji: "🍲", text: `${life.chop.name} has run out of food. Cook a batch.`, app: "chop", urgent: true });
    if (life.minutes - life.chop.lastServe >= SERVE_HOURS * 60) list.push({ id: "chop-full", emoji: "🍲", text: `${life.chop.name} has a full day of takings. Collect before customers stop counting.`, app: "chop" });
    else if (sales.revenue >= 150) list.push({ id: "chop-cash", emoji: "🍲", text: `${life.chop.name} has ${cedis(sales.revenue)} in the tin.`, app: "chop" });
  }
  const pets = life.pets ?? [];
  const starved = pets.filter((pet) => starving(life, pet));
  if (starved.length) list.push({ id: "pets-starving", emoji: "🐾", text: `${starved.map((pet) => pet.name).join(", ")} will wander off soon. Feed them.`, app: "pets", urgent: true });
  else if (pets.some((pet) => hungry(life, pet))) list.push({ id: "pets-hungry", emoji: "🐾", text: "Your animals are hungry.", app: "pets" });
  if (eggsDue(life) > 0) list.push({ id: "eggs", emoji: "🥚", text: "Eggs ready to gather.", app: "pets" });
  if (kidReady(life)) list.push({ id: "goat-kid", emoji: "🐐", text: "A goat kid has been born. Check the pen.", app: "pets" });

  const beds = (life.farm ?? []).filter((bed): bed is NonNullable<typeof bed> => Boolean(bed));
  if (beds.some((bed) => bedState(life, bed) === "dry")) list.push({ id: "farm-dry", emoji: "🌱", text: "Your crops are dry. Water them before they wilt.", app: "farm", urgent: true });
  if (beds.some((bed) => bedState(life, bed) === "ready")) list.push({ id: "farm-ready", emoji: "🧺", text: "A harvest is ready.", app: "farm" });

  const rent = (life.plots ?? []).reduce((sum, plot) => sum + rentDue(life, plot), 0);
  if (rent >= 100) list.push({ id: "rent", emoji: "🏘️", text: `Tenants owe ${cedis(rent)}. Collect the rent.`, app: "land" });

  const full = (life.businesses ?? []).filter((shop) => life.minutes - shop.lastCollect >= TILL_HOURS * 60);
  if (full.length) list.push({ id: "till-full", emoji: "💼", text: "A business till is full. Collect it or lose sales.", app: "biz" });
  else if ((life.businesses ?? []).some((shop) => tillOf(life, shop.id) >= 300)) list.push({ id: "till", emoji: "💼", text: "Your businesses have cash waiting.", app: "biz" });

  const fleet = life.fleet ?? [];
  if (fleet.some((car) => car.broken)) list.push({ id: "fleet-broken", emoji: "🔧", text: "A vehicle broke down. Send it to the fitter.", app: "fleet", urgent: true });
  if (fleet.some((car) => car.driver && life.minutes - car.lastCollect >= 1440)) list.push({ id: "fleet-full", emoji: "🚐", text: "Drivers have a full day of sales for you.", app: "fleet" });
  else if (fleet.reduce((sum, car) => sum + salesDue(life, car), 0) >= 300) list.push({ id: "fleet", emoji: "🚐", text: "Drivers have sales to hand over.", app: "fleet" });
  if (fleet.some((car) => life.minutes > car.papersUntil)) list.push({ id: "papers", emoji: "📄", text: "Roadworthy sticker expired. Police are checking.", app: "fleet" });

  if (life.expecting && life.minutes >= life.expecting) list.push({ id: "baby", emoji: "👶🏾", text: "The baby is here! Open Family to welcome them.", app: "family", urgent: true });

  const bank = life.bank;
  if (bank && bank.loan > 0) {
    const left = bank.loanDue - life.minutes;
    if (left < 0) list.push({ id: "loan-late", emoji: "🏦", text: `Bank loan overdue. ${cedis(bank.loan)} owed and the fine is growing.`, app: "bank", urgent: true });
    else if (left < 2880) list.push({ id: "loan-soon", emoji: "🏦", text: `Bank loan due in ${Math.ceil(left / 60)}h.`, app: "bank" });
  }
  if (interestDue(life) >= 20) list.push({ id: "interest", emoji: "🏦", text: "Interest is waiting on your savings.", app: "bank" });

  if (storyReady(life)) list.push({ id: "story", emoji: "📖", text: "A story chapter is ready to finish.", app: "stories" });
  if (life.health?.sick) list.push({ id: "sick", emoji: "🤒", text: "You are sick. See the clinic.", app: "health", urgent: true });
  return list;
}
