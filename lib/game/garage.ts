import { FUEL_PER_TRIP, cedis, cloneLife, logLine, passTime, roomReach, type CarState, type Life, type Ride, type StepResult } from "@/lib/game/world";

export const CARS = [
  { id: "vitz", label: "Used Toyota Vitz", short: "Vitz", emoji: "🚗", price: 18000, minutes: 12, hail: 25, paint: "#f2f5f8", suv: false, scale: 0.86, speed: 1, seats: 4, cargo: 1, style: 1 },
  { id: "corolla", label: "Toyota Corolla", short: "Corolla", emoji: "🚙", price: 38000, minutes: 11, hail: 40, paint: "#b7c3ce", suv: false, scale: 1, speed: 2, seats: 5, cargo: 2, style: 2 },
  { id: "rav4", label: "Toyota RAV4", short: "RAV4", emoji: "🚙", price: 85000, minutes: 10, hail: 60, paint: "#2c4638", suv: true, scale: 1, speed: 2, seats: 5, cargo: 3, style: 3 },
  { id: "benz", label: "Mercedes C-Class", short: "Benz", emoji: "🚘", price: 170000, minutes: 9, hail: 90, paint: "#16181c", suv: false, scale: 1.04, speed: 3, seats: 5, cargo: 2, style: 4 },
  { id: "cruiser", label: "Land Cruiser V8", short: "Cruiser", emoji: "🛻", price: 420000, minutes: 9, hail: 140, paint: "#efe6d4", suv: true, scale: 1.14, speed: 3, seats: 7, cargo: 4, style: 5 },
] as const;

export const INSURANCE = 150;
export const FUEL_PRICE = 0.6;
export const RESPRAY = 40;
export const PLATE_FEE = 120;
const HAIL_GAP = 90;
const WEEK = 10080;

export const CAR_PAINTS = [
  { id: "pearl", label: "Pearl", hex: "#f2f5f8" },
  { id: "silver", label: "Silver", hex: "#b7c3ce" },
  { id: "black", label: "Black", hex: "#16181c" },
  { id: "red", label: "Red", hex: "#c8102e" },
  { id: "green", label: "Green", hex: "#0d6b3c" },
  { id: "gold", label: "Gold", hex: "#e0b04a" },
  { id: "blue", label: "Blue", hex: "#1d4e89" },
  { id: "white", label: "White", hex: "#f7f4ef" },
] as const;

export const MECHANICS = [
  { id: "kojo", name: "Kojo", cost: 80, to: 65 },
  { id: "esi", name: "Esi", cost: 180, to: 100 },
  { id: "kwame", name: "Kwame", cost: 320, to: 100 },
] as const;

export function carOf(id?: string | null) {
  return CARS.find((car) => car.id === id) ?? null;
}

export function carPaint(life: Life) {
  return life.car?.color || carOf(life.car?.id)?.paint || "#2a3344";
}

export function carSpoilt(life: Life) {
  return Boolean(life.car && (life.car.broken || (life.car.condition ?? 100) <= 0));
}

export function carCondition(life: Life) {
  return life.car ? Math.max(0, Math.round(life.car.condition ?? 100)) : 0;
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

const motorKey = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/** Garage on the back of the house, opening into the compound. Cars face the roller door. */
export function garageBox(span = 0, bays = 1) {
  const room = roomReach(span);
  const count = Math.max(1, Math.min(4, bays));
  const pitch = 3.2;
  const x0 = -2.7;
  const x1 = x0 + 3.35 + (count - 1) * pitch;
  const z1 = -room.halfD - 0.04;
  const z0 = z1 - 3.7;
  return {
    x0,
    x1,
    z0,
    z1,
    count,
    pitch,
    doorX0: x0 + 0.3,
    doorX1: x0 + 1.75,
    gate: { x: x0 + 1.6, z: z0 - 1.7 },
  };
}

export function baySpot(span: number, bays: number, index: number) {
  const box = garageBox(span, bays);
  return { x: box.x0 + 1.65 + index * box.pitch, z: (box.z0 + box.z1) / 2 };
}

export function carDust(motor: CarState, minutes: number, indoors: boolean) {
  const age = motor.washedAt == null ? (indoors ? 700 : 2200) : Math.max(0, minutes - motor.washedAt);
  return Math.max(0, Math.min(0.82, age / (indoors ? 2600 : 900)));
}

export function yardTalk(life: Life) {
  const cars = motorsOf(life);
  if (!cars.length) return null;
  const guest = (life.guests ?? []).find((person) => person.doing !== "leave");
  const showy = cars.some((motor) => motor.id === "benz" || motor.id === "cruiser");
  if (guest && showy) return `${guest.name}: Chale, you buy new Benz!`;
  if (guest && cars.length >= 3) return `${guest.name}: Three cars? You dey chop money o.`;
  if (guest) return `${guest.name} is walking around ${cars[0].name || carOf(cars[0].id)?.short || "the car"}.`;
  if (showy) return "Kojo Mensah would have something to say about this one.";
  return null;
}

/** A click on the room floor stays in the room. A click in the garage, the doorway, or the drive is allowed through. */
export function footHere(x: number, z: number, span: number, bays: number) {
  const room = roomReach(span);
  const box = garageBox(span, bays);
  const inRoom = x >= room.minX && x <= room.maxX && z >= room.minZ && z <= room.maxZ;
  const inBay = x >= box.x0 + 0.25 && x <= box.x1 - 0.25 && z >= box.z0 + 0.35 && z <= box.z1 - 0.15;
  const inDoor = x >= box.doorX0 - 0.1 && x <= box.doorX1 + 0.1 && z <= room.minZ + 0.15 && z >= box.z1 - 0.2;
  const inDrive = x >= box.x0 - 0.4 && x <= box.x1 + 2.6 && z <= box.z0 + 0.25 && z >= box.z0 - 2.3;
  if (inRoom || inBay || inDoor || inDrive) return { x, z };
  return null;
}

export function bayCount(life: Life) {
  const finished = (life.plots ?? []).find((plot) => plot.stage >= 5 && plot.plan?.rooms.includes("garage"));
  const bays = finished?.plan?.garageBay ?? (finished ? 2 : 1);
  return Math.max(1, Math.min(6, bays));
}

export function motorsOf(life: Life): CarState[] {
  if (life.motors?.length) return life.motors;
  if (!life.car) return [];
  return [{ ...life.car, key: life.car.key ?? "primary" }];
}

function stick(life: Life) {
  if (!life.car) {
    life.motors = life.motors ?? [];
    return;
  }
  const key = life.car.key ?? "primary";
  const car = { ...life.car, key };
  life.car = car;
  const others = (life.motors ?? []).filter((item) => item.key !== key);
  life.motors = [...others, car];
}

export function buyCar(life: Life, carId: string, finance = false): StepResult {
  const car = carOf(carId);
  if (!car) return { life, notes: [], error: "That car is gone." };
  const owned = motorsOf(life);
  if (owned.length >= bayCount(life)) return { life, notes: [], error: `The garage holds ${bayCount(life)}. Sell one, or add bays when you design the house.` };
  const due = finance ? Math.round(car.price * 0.4) : car.price;
  if (life.cash < due) return { life, notes: [], error: finance ? `The deposit is ${cedis(due)}.` : `You need ${cedis(due)}.` };
  const motor: CarState = {
    id: car.id,
    key: motorKey(),
    fuel: 60,
    insuredUntil: 0,
    condition: 100,
    broken: false,
    color: car.paint,
    speed: car.speed,
    seats: car.seats,
    cargo: car.cargo,
    style: car.style,
    tires: 100,
    registeredUntil: life.minutes + 30 * 1440,
    driver: null,
    hire: "parked",
    financeLeft: finance ? car.price - due : 0,
    financePay: finance ? Math.max(1, Math.round((car.price - due) / 8)) : 0,
    security: 0,
  };
  const next = cloneLife(life);
  next.cash -= due;
  next.motors = [...owned.map((item) => ({ ...item, key: item.key ?? motorKey() })), motor];
  next.car = motor;
  const line = finance
    ? `${car.label} is yours. Deposit ${cedis(due)}. ${cedis(motor.financePay ?? 0)} comes off the wallet each week until ${cedis(motor.financeLeft ?? 0)} is cleared.`
    : `You drove a ${car.label} off the lot at Abossey Okai. It is the car you leave in.`;
  logLine(next, line);
  return { life: next, notes: [line] };
}

export function sellCar(life: Life, key?: string): StepResult {
  const owned = motorsOf(life);
  const motor = owned.find((item) => item.key === (key ?? life.car?.key)) ?? owned.find((item) => !key && item.id === life.car?.id) ?? (key ? null : owned[0]);
  if (!motor) return { life, notes: [], error: "No car to sell." };
  const plan = carOf(motor.id);
  const gross = Math.round((plan?.price ?? 0) * 0.55 * (motor.broken ? 0.65 : 0.55 + (motor.condition ?? 100) / 250));
  const value = Math.max(0, gross - (motor.financeLeft ?? 0));
  const rest = owned.filter((item) => item.key !== motor.key);
  const next = cloneLife(life);
  next.cash += value;
  next.motors = rest;
  next.car = rest[0] ? { ...rest[0] } : null;
  return { life: next, notes: [`Sold the ${plan?.short ?? "car"} for ${cedis(value)}${motor.financeLeft ? " after the finance" : ""}.`] };
}

export function setPrimary(life: Life, key: string): StepResult {
  const motor = motorsOf(life).find((item) => item.key === key);
  if (!motor) return { life, notes: [], error: "That car is not in the garage." };
  if (motor.broken || (motor.condition ?? 100) <= 0) return { life, notes: [], error: "That one is spoilt. Fix it before you drive it out." };
  const next = cloneLife(life);
  next.motors = motorsOf(life).map((item) => ({ ...item }));
  next.car = { ...motor };
  return { life: next, notes: [`You leave home in ${motor.name || carOf(motor.id)?.short || "that car"}.`] };
}

export function fillUp(life: Life): StepResult {
  if (!life.car) return { life, notes: [], error: "No car to fill." };
  const cost = fillCost(life);
  if (cost < 1) return { life, notes: [], error: "The tank is full." };
  if (life.cash < cost) return { life, notes: [], error: `A full tank costs ${cedis(cost)}.` };
  const next = passTime(cloneLife(life), 10).life;
  next.cash -= cost;
  next.car = { ...life.car, fuel: 100 };
  stick(next);
  return { life: next, notes: [`Full tank at the filling station on the corner: ${cedis(cost)}.`] };
}

export function insureCar(life: Life): StepResult {
  if (!life.car) return { life, notes: [], error: "No car to insure." };
  if (life.cash < INSURANCE) return { life, notes: [], error: `Insurance costs ${cedis(INSURANCE)} a week.` };
  const next = cloneLife(life);
  next.cash -= INSURANCE;
  next.car = { ...life.car, insuredUntil: Math.max(life.car.insuredUntil, life.minutes) + WEEK };
  stick(next);
  return { life: next, notes: ["Insured for 7 days. The sticker is on the windscreen."] };
}

export function nameCar(life: Life, raw: string): StepResult {
  if (!life.car) return { life, notes: [], error: "Buy a car first." };
  const name = raw.trim().slice(0, 16);
  if (name.length < 2) return { life, notes: [], error: "Give the car a real name." };
  const next = cloneLife(life);
  next.car = { ...life.car, name };
  stick(next);
  return { life: next, notes: [`The car answers to ${name} now.`] };
}

export function plateCar(life: Life, raw: string): StepResult {
  if (!life.car) return { life, notes: [], error: "Buy a car first." };
  const plate = raw.trim().toUpperCase().replace(/\s+/g, " ").slice(0, 8);
  if (!/^[A-Z0-9][A-Z0-9 -]{1,7}$/.test(plate)) return { life, notes: [], error: "Plates are letters and numbers, up to 8 characters." };
  if (life.car.plate === plate) return { life, notes: [], error: "That plate is already on the car." };
  if (life.cash < PLATE_FEE) return { life, notes: [], error: `A custom plate costs ${cedis(PLATE_FEE)}.` };
  const next = cloneLife(life);
  next.cash -= PLATE_FEE;
  next.car = { ...life.car, plate };
  stick(next);
  return { life: next, notes: [`DVLA plate ${plate} is on the car. ${cedis(PLATE_FEE)}.` ] };
}

export function repaintCar(life: Life, hex: string): StepResult {
  const car = carOf(life.car?.id);
  if (!car || !life.car) return { life, notes: [], error: "Buy a car first." };
  if (carSpoilt(life)) return { life, notes: [], error: "Fix the car at the fitting shop before a new colour." };
  if (!CAR_PAINTS.some((paint) => paint.hex === hex)) return { life, notes: [], error: "That colour is not in the book." };
  if (carPaint(life) === hex) return { life, notes: [], error: "That is already the colour." };
  if (life.cash < RESPRAY) return { life, notes: [], error: `A respray costs ${cedis(RESPRAY)}.` };
  const next = cloneLife(life);
  next.cash -= RESPRAY;
  next.car = { ...life.car, color: hex };
  stick(next);
  const name = CAR_PAINTS.find((paint) => paint.hex === hex)?.label.toLowerCase() ?? "new";
  return { life: next, notes: [`Resprayed the ${car.short} ${name}. ${cedis(RESPRAY)}.`] };
}

export function repairCar(life: Life, mechanicId: string): StepResult {
  const mechanic = MECHANICS.find((item) => item.id === mechanicId);
  if (!mechanic) return { life, notes: [], error: "That fitter is not in the shop." };
  if (!life.car) return { life, notes: [], error: "You have no car to fix." };
  if (life.where !== "fitting") return { life, notes: [], error: "The fitters are at the shop in Abossey Okai. Go there." };
  const condition = carCondition(life);
  if (!life.car.broken && condition >= mechanic.to) return { life, notes: [], error: "Nothing for them to do. The car is already sound." };
  if (life.cash < mechanic.cost) return { life, notes: [], error: `${mechanic.name} charges ${cedis(mechanic.cost)}.` };
  const timed = passTime(cloneLife(life), 15).life;
  timed.cash -= mechanic.cost;
  timed.car = { ...life.car, condition: mechanic.to, broken: false };
  stick(timed);
  const line = `${mechanic.name} finished the job. The car is back to ${mechanic.to}%. ${cedis(mechanic.cost)}.`;
  logLine(timed, line);
  return { life: timed, notes: [line] };
}

export function driveHail(life: Life): StepResult {
  const car = carOf(life.car?.id);
  if (!car || !life.car) return { life, notes: [], error: "Buy a car first." };
  if (carSpoilt(life)) return { life, notes: [], error: "The car is spoilt. The fitting shop at Abossey Okai can bring it back." };
  const wait = hailWait(life);
  if (wait > 0) return { life, notes: [], error: `Rest your back. Next trips in ${wait}m.` };
  if (life.car.fuel < FUEL_PER_TRIP * 2) return { life, notes: [], error: "Not enough fuel for passengers. Fill up." };
  if (life.needs.energy < 15) return { life, notes: [], error: "Too tired to drive safely." };
  const timed = passTime(cloneLife(life), 60).life;
  const pay = Math.round(car.hail * (1 + timed.skills.charm * 0.04) * (timed.health?.sick ? 0.5 : 1));
  timed.cash += pay;
  const condition = Math.max(0, (life.car.condition ?? 100) - 12);
  timed.car = { ...life.car, fuel: life.car.fuel - FUEL_PER_TRIP * 2, lastHail: timed.minutes, condition, broken: condition <= 0 };
  stick(timed);
  timed.needs.energy = Math.max(0, timed.needs.energy - 10);
  timed.needs.social = Math.min(100, timed.needs.social + 6);
  const notes = [`Three ride-app trips across town. ${cedis(pay)} after commission.`];
  if (condition <= 0) notes.push("The car died on the last drop-off. Take it to the fitting shop.");
  if (Math.random() < 0.2) {
    if (life.car.insuredUntil > timed.minutes) notes.push("Police checkpoint. Papers in order.");
    else {
      timed.cash -= 80;
      notes.push("Police checkpoint. No insurance: ₵80 fine.");
    }
  }
  return { life: timed, notes };
}

const YARD_NAMES = ["Kwesi", "Abena", "Kojo", "Esi"];

export function assignDriver(life: Life, key: string): StepResult {
  const owned = motorsOf(life);
  const motor = owned.find((item) => item.key === key);
  if (!motor) return { life, notes: [], error: "That car is not in the garage." };
  const taken = new Set(owned.map((item) => item.driver).filter(Boolean));
  const name = life.yard?.driver && !taken.has(life.yard.driver) ? life.yard.driver : YARD_NAMES.find((person) => !taken.has(person)) ?? "Kwame";
  const next = cloneLife(life);
  next.motors = owned.map((item) => (item.key === key ? { ...item, driver: name } : { ...item }));
  if (next.car?.key === key) next.car = { ...next.car, driver: name };
  next.yard = { driver: name, guard: next.yard?.guard ?? null };
  return { life: next, notes: [`${name} has the keys to ${motor.name || carOf(motor.id)?.short || "the car"}.`] };
}

export function rentMotor(life: Life, key: string, hire: "parked" | "taxi" | "private"): StepResult {
  const owned = motorsOf(life);
  if (!owned.some((item) => item.key === key)) return { life, notes: [], error: "That car is not in the garage." };
  const next = cloneLife(life);
  next.motors = owned.map((item) => (item.key === key ? { ...item, hire } : { ...item }));
  if (next.car?.key === key) next.car = { ...next.car, hire };
  const line = hire === "parked" ? "The car stays in the bay." : hire === "taxi" ? "It is out as a taxi when the driver is on it." : "Private hire. The driver waits for a call.";
  return { life: next, notes: [line] };
}

export function washCar(life: Life, key: string): StepResult {
  const owned = motorsOf(life);
  const motor = owned.find((item) => item.key === key);
  if (!motor) return { life, notes: [], error: "That car is not in the garage." };
  const timed = passTime(cloneLife(life), 20).life;
  timed.motors = motorsOf(life).map((item) => (item.key === key ? { ...item, condition: Math.min(100, (item.condition ?? 100) + 2), washedAt: timed.minutes } : { ...item }));
  if (timed.car?.key === key && timed.motors) {
    const fresh = timed.motors.find((item) => item.key === key);
    if (fresh) timed.car = { ...fresh };
  }
  const who = life.yard?.guard ?? life.yard?.driver ?? "You";
  return { life: timed, notes: [`${who} washed ${motor.name || carOf(motor.id)?.short || "the car"}.`] };
}

export function hireGuard(life: Life): StepResult {
  if (life.yard?.guard) return { life, notes: [], error: `${life.yard.guard} is already at the gate.` };
  if ((life.cash ?? 0) < 100) return { life, notes: [], error: "A guard wants ₵100 to start." };
  const next = cloneLife(life);
  next.cash -= 100;
  next.yard = { driver: next.yard?.driver ?? null, guard: "Uncle Yaw" };
  next.security = Math.max(next.security ?? 0, 2);
  return { life: next, notes: ["Uncle Yaw is at the gate. The house is harder to walk into."] };
}

export function pulseMotors(life: Life, notes: string[]) {
  const owned = life.motors ?? [];
  if (!owned.length) return;
  const day = Math.floor(life.minutes / 1440);
  let pay = 0;
  life.motors = owned.map((motor) => {
    if (motor.financeDay === day) return motor;
    const week = day % 7 === 5;
    let financeLeft = motor.financeLeft ?? 0;
    if (week && financeLeft > 0) {
      const cut = Math.min(financeLeft, motor.financePay ?? 0, Math.max(0, life.cash));
      life.cash -= cut;
      financeLeft -= cut;
      if (cut > 0) notes.push(`Car finance: ${cedis(cut)} left the wallet.`);
      else notes.push("Car finance was due and the wallet was short.");
    }
    let earned = 0;
    if ((motor.hire === "taxi" || motor.hire === "private") && motor.driver && !motor.broken && (motor.fuel ?? 0) > 10) {
      earned = motor.hire === "taxi" ? 35 + (motor.style ?? 1) * 8 : 55 + (motor.style ?? 1) * 10;
      pay += earned;
    }
    return { ...motor, financeLeft, financeDay: day, fuel: Math.max(0, (motor.fuel ?? 0) - (earned ? 4 : 0)) };
  });
  if (pay > 0) {
    life.cash += pay;
    notes.push(`Drivers brought ${cedis(pay)} in from the cars.`);
  }
  if (life.car?.key) {
    const fresh = life.motors.find((item) => item.key === life.car?.key);
    if (fresh) life.car = { ...life.car, ...fresh };
  }
}
