import { FUEL_PER_TRIP, cedis, cloneLife, logLine, passTime, type Life, type Ride, type StepResult } from "@/lib/game/world";

export const CARS = [
  { id: "vitz", label: "Used Toyota Vitz", short: "Vitz", emoji: "🚗", price: 18000, minutes: 12, hail: 25, paint: "#f2f5f8", suv: false, scale: 0.86 },
  { id: "corolla", label: "Toyota Corolla", short: "Corolla", emoji: "🚙", price: 38000, minutes: 11, hail: 40, paint: "#b7c3ce", suv: false, scale: 1 },
  { id: "rav4", label: "Toyota RAV4", short: "RAV4", emoji: "🚙", price: 85000, minutes: 10, hail: 60, paint: "#2c4638", suv: true, scale: 1 },
  { id: "benz", label: "Mercedes C-Class", short: "Benz", emoji: "🚘", price: 170000, minutes: 9, hail: 90, paint: "#16181c", suv: false, scale: 1.04 },
  { id: "cruiser", label: "Land Cruiser V8", short: "Cruiser", emoji: "🛻", price: 420000, minutes: 9, hail: 140, paint: "#efe6d4", suv: true, scale: 1.14 },
] as const;

export const INSURANCE = 150;
export const FUEL_PRICE = 0.6;
const HAIL_GAP = 90;
const WEEK = 10080;

export function carOf(id?: string | null) {
  return CARS.find((car) => car.id === id) ?? null;
}

export function carRide(life: Life): Ride | null {
  const car = carOf(life.car?.id);
  if (!car) return null;
  return { id: "car", label: "Drive", cost: 0, minutes: car.minutes };
}

export function fillCost(life: Life) {
  return Math.ceil((100 - (life.car?.fuel ?? 100)) * FUEL_PRICE);
}

export function hailWait(life: Life) {
  return Math.max(0, (life.car?.lastHail ?? -1e9) + HAIL_GAP - life.minutes);
}

export function tradeIn(life: Life) {
  const car = carOf(life.car?.id);
  return car ? Math.round(car.price * 0.6) : 0;
}

export function buyCar(life: Life, carId: string): StepResult {
  const car = carOf(carId);
  if (!car) return { life, notes: [], error: "That car is gone." };
  if (life.car?.id === car.id) return { life, notes: [], error: "You already drive that." };
  const credit = tradeIn(life);
  const due = car.price - credit;
  if (life.cash < due) return { life, notes: [], error: `You need ${cedis(due)}${credit ? ` after the trade-in` : ""}.` };
  const next = cloneLife(life);
  next.cash -= due;
  next.car = { id: car.id, fuel: 60, insuredUntil: life.car?.insuredUntil ?? 0 };
  const line = `You drove a ${car.label} off the lot at Abossey Okai.`;
  logLine(next, line);
  return { life: next, notes: [line] };
}

export function sellCar(life: Life): StepResult {
  const value = tradeIn(life);
  if (!value) return { life, notes: [], error: "No car to sell." };
  const next = cloneLife(life);
  next.cash += value;
  next.car = null;
  return { life: next, notes: [`Sold the car for ${cedis(value)}.`] };
}

export function fillUp(life: Life): StepResult {
  if (!life.car) return { life, notes: [], error: "No car to fill." };
  const cost = fillCost(life);
  if (cost < 1) return { life, notes: [], error: "The tank is full." };
  if (life.cash < cost) return { life, notes: [], error: `A full tank costs ${cedis(cost)}.` };
  const next = passTime(cloneLife(life), 10).life;
  next.cash -= cost;
  next.car = { ...life.car, fuel: 100 };
  return { life: next, notes: [`Full tank at the filling station on the corner: ${cedis(cost)}.`] };
}

export function insureCar(life: Life): StepResult {
  if (!life.car) return { life, notes: [], error: "No car to insure." };
  if (life.cash < INSURANCE) return { life, notes: [], error: `Insurance costs ${cedis(INSURANCE)} a week.` };
  const next = cloneLife(life);
  next.cash -= INSURANCE;
  next.car = { ...life.car, insuredUntil: Math.max(life.car.insuredUntil, life.minutes) + WEEK };
  return { life: next, notes: ["Insured for 7 days. The sticker is on the windscreen."] };
}

export function driveHail(life: Life): StepResult {
  const car = carOf(life.car?.id);
  if (!car || !life.car) return { life, notes: [], error: "Buy a car first." };
  const wait = hailWait(life);
  if (wait > 0) return { life, notes: [], error: `Rest your back. Next trips in ${wait}m.` };
  if (life.car.fuel < FUEL_PER_TRIP * 2) return { life, notes: [], error: "Not enough fuel for passengers. Fill up." };
  if (life.needs.energy < 15) return { life, notes: [], error: "Too tired to drive safely." };
  const timed = passTime(cloneLife(life), 60).life;
  const pay = Math.round(car.hail * (1 + timed.skills.charm * 0.04) * (timed.health?.sick ? 0.5 : 1));
  timed.cash += pay;
  timed.car = { ...life.car, fuel: life.car.fuel - FUEL_PER_TRIP * 2, lastHail: timed.minutes };
  timed.needs.energy = Math.max(0, timed.needs.energy - 10);
  timed.needs.social = Math.min(100, timed.needs.social + 6);
  const notes = [`Three ride-app trips across town. ${cedis(pay)} after commission.`];
  if (Math.random() < 0.2) {
    if (life.car.insuredUntil > timed.minutes) notes.push("Police checkpoint. Papers in order.");
    else {
      timed.cash -= 80;
      notes.push("Police checkpoint. No insurance: ₵80 fine.");
    }
  }
  return { life: timed, notes };
}
