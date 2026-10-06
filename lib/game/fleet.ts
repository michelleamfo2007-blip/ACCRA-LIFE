import { FLEET_WAGES, cedis, cloneLife, logLine, type Life, type StepResult, type Vehicle } from "@/lib/game/world";

export const VEHICLES = [
  { id: "okada", label: "Okada", emoji: "🏍️", price: 6000, perHour: 7 },
  { id: "taxi", label: "Taxi", emoji: "🚕", price: 30000, perHour: 26 },
  { id: "trotro", label: "Trotro", emoji: "🚐", price: 55000, perHour: 45 },
] as const;

export const ROUTES = [
  { id: "circle-madina", label: "Circle – Madina", boost: 1, wear: 6, blurb: "Busy all day. Steady money." },
  { id: "kaneshie-kasoa", label: "Kaneshie – Kasoa", boost: 1.2, wear: 10, blurb: "Packed every hour, rough road." },
  { id: "tema-spintex", label: "Tema Station – Spintex", boost: 1.08, wear: 7, blurb: "Office workers morning and evening." },
  { id: "lapaz-achimota", label: "Lapaz – Achimota", boost: 0.92, wear: 4, blurb: "Short hops, easy on the engine." },
] as const;

export const MAX_FLEET = 6;
export const PAPERS = 250;
const TILL = 24;
const DRIVERS = ["Kwesi", "Yaw", "Kojo", "Ebo", "Fiifi", "Nii", "Kpakpo", "Selorm", "Mawuli", "Issah", "Abdul", "Kwaku", "Atta", "Paa Kwesi"];

const id = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function vehicleOf(kind: string) {
  return VEHICLES.find((item) => item.id === kind) ?? VEHICLES[0];
}

export function routeOf(route: string) {
  return ROUTES.find((item) => item.id === route) ?? ROUTES[0];
}

export function salesDue(life: Life, car: Vehicle) {
  if (!car.driver || car.broken) return 0;
  const hours = Math.min(TILL, Math.max(0, (life.minutes - car.lastCollect) / 60));
  const shape = 0.5 + car.condition / 200;
  return Math.floor(vehicleOf(car.kind).perHour * routeOf(car.route).boost * hours * shape);
}

export function serviceCost(car: Vehicle) {
  return Math.round(vehicleOf(car.kind).price * (car.broken ? 0.06 : 0.0006 * (100 - car.condition)));
}

function withCar(life: Life, carId: string, change: (car: Vehicle) => Vehicle) {
  const next = cloneLife(life);
  next.fleet = (next.fleet ?? []).map((car) => (car.id === carId ? change(car) : car));
  return next;
}

export function buyVehicle(life: Life, kind: string): StepResult {
  const plan = VEHICLES.find((item) => item.id === kind);
  if (!plan) return { life, notes: [], error: "Nobody is selling that." };
  if ((life.fleet ?? []).length >= MAX_FLEET) return { life, notes: [], error: `A fleet of ${MAX_FLEET} is the most you can manage.` };
  if (life.cash < plan.price) return { life, notes: [], error: `${plan.label} costs ${cedis(plan.price)}.` };
  const next = cloneLife(life);
  next.cash -= plan.price;
  next.fleet = [...(next.fleet ?? []), { id: id(), kind: plan.id, route: ROUTES[0].id, driver: null, condition: 100, lastCollect: life.minutes, broken: false, papersUntil: life.minutes + 30 * 1440 }];
  logLine(next, `Bought a ${plan.label.toLowerCase()}. Hire a driver to put it on the road.`);
  return { life: next, notes: [`Bought a ${plan.label.toLowerCase()}. Hire a driver to put it on the road.`] };
}

export function hireDriver(life: Life, carId: string): StepResult {
  const car = life.fleet?.find((item) => item.id === carId);
  if (!car) return { life, notes: [], error: "That vehicle is gone." };
  if (car.driver) return { life, notes: [], error: `${car.driver} is already driving it.` };
  const taken = new Set((life.fleet ?? []).map((item) => item.driver));
  const name = DRIVERS.find((driver) => !taken.has(driver)) ?? `Driver ${(life.fleet ?? []).length}`;
  const next = withCar(life, carId, (item) => ({ ...item, driver: name, lastCollect: life.minutes }));
  return { life: next, notes: [`${name} is driving now. Wages: ${cedis(FLEET_WAGES[car.kind] ?? 0)} every Saturday.`] };
}

export function fireDriver(life: Life, carId: string): StepResult {
  const car = life.fleet?.find((item) => item.id === carId);
  if (!car?.driver) return { life, notes: [], error: "No driver on that one." };
  const due = salesDue(life, car);
  const next = withCar(life, carId, (item) => ({ ...item, driver: null, lastCollect: life.minutes }));
  next.cash += due;
  return { life: next, notes: [`${car.driver} handed back the keys${due ? ` and ${cedis(due)} in sales` : ""}.`] };
}

export function setRoute(life: Life, carId: string, route: string): StepResult {
  const car = life.fleet?.find((item) => item.id === carId);
  const plan = ROUTES.find((item) => item.id === route);
  if (!car || !plan) return { life, notes: [], error: "Pick a route." };
  const due = salesDue(life, car);
  const next = withCar(life, carId, (item) => ({ ...item, route: plan.id, lastCollect: life.minutes }));
  next.cash += due;
  return { life: next, notes: [`Now running ${plan.label}.`] };
}

export function collectSales(life: Life, carId: string): StepResult {
  const car = life.fleet?.find((item) => item.id === carId);
  if (!car) return { life, notes: [], error: "That vehicle is gone." };
  if (car.broken) return { life, notes: [], error: "It is broken down. Send it to the fitter." };
  let due = salesDue(life, car);
  if (due < 1) return { life, notes: [], error: car.driver ? "Nothing to collect yet." : "Hire a driver first." };
  const route = routeOf(car.route);
  const hours = Math.min(TILL, (life.minutes - car.lastCollect) / 60);
  const condition = Math.max(0, car.condition - (route.wear * hours) / 24);
  const notes: string[] = [];
  const broken = Math.random() < (100 - condition) / 220;
  if (life.minutes > car.papersUntil && Math.random() < 0.3) {
    due = Math.max(0, due - 150);
    notes.push("Police caught the expired roadworthy sticker. ₵150 came out of the sales.");
  }
  const next = withCar(life, carId, (item) => ({ ...item, condition: Math.round(condition), broken, lastCollect: life.minutes }));
  next.cash += due;
  const plan = vehicleOf(car.kind);
  notes.unshift(`${car.driver} brought ${cedis(due)} from the ${plan.label.toLowerCase()}.`);
  if (broken) notes.push(`The ${plan.label.toLowerCase()} broke down on ${route.label}. Send it to the fitter.`);
  return { life: next, notes };
}

export function serviceVehicle(life: Life, carId: string): StepResult {
  const car = life.fleet?.find((item) => item.id === carId);
  if (!car) return { life, notes: [], error: "That vehicle is gone." };
  const cost = serviceCost(car);
  if (cost < 1) return { life, notes: [], error: "It is running like new." };
  if (life.cash < cost) return { life, notes: [], error: `The fitter wants ${cedis(cost)}.` };
  const next = withCar(life, carId, (item) => ({ ...item, condition: 100, broken: false, lastCollect: car.broken ? life.minutes : item.lastCollect }));
  next.cash -= cost;
  return { life: next, notes: [`Fitter at Abossey Okai: ${cedis(cost)}. Running like new.`] };
}

export function renewPapers(life: Life, carId: string): StepResult {
  const car = life.fleet?.find((item) => item.id === carId);
  if (!car) return { life, notes: [], error: "That vehicle is gone." };
  if (life.cash < PAPERS) return { life, notes: [], error: `Roadworthy and insurance cost ${cedis(PAPERS)}.` };
  const next = withCar(life, carId, (item) => ({ ...item, papersUntil: Math.max(item.papersUntil, life.minutes) + 30 * 1440 }));
  next.cash -= PAPERS;
  return { life: next, notes: ["Roadworthy and insurance renewed for 30 days."] };
}

export function sellVehicle(life: Life, carId: string): StepResult {
  const car = life.fleet?.find((item) => item.id === carId);
  if (!car) return { life, notes: [], error: "That vehicle is gone." };
  const value = Math.round(vehicleOf(car.kind).price * 0.55 * (car.broken ? 0.7 : 0.5 + car.condition / 200)) + salesDue(life, car);
  const next = cloneLife(life);
  next.fleet = (next.fleet ?? []).filter((item) => item.id !== carId);
  next.cash += value;
  return { life: next, notes: [`Sold the ${vehicleOf(car.kind).label.toLowerCase()} for ${cedis(value)}.`] };
}
