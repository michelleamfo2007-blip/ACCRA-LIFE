import { deliverableFoods } from "@/lib/game/foods";
import { cedis, cloneLife, type Life, type StepResult } from "@/lib/game/world";

const GOODS = [
  { id: "provisions", label: "Provisions", kind: "groceries", price: 40 },
  { id: "chair", label: "Plastic chair", kind: "furniture", price: 80 },
  { id: "shirt", label: "Shirt", kind: "clothes", price: 45 },
  { id: "phone", label: "Earphones", kind: "electronics", price: 60 },
  { id: "para", label: "Paracetamol", kind: "medicine", price: 12 },
] as const;

export const MENU = [
  ...GOODS,
  ...deliverableFoods().map((item) => ({ id: item.id, label: item.name, kind: "food" as const, price: item.price })),
];

export const RIDERS = [
  { id: "okada", name: "Kwame", vehicle: "Okada", rating: 4.2, fee: 8, risk: 0.16 },
  { id: "bolt", name: "Abena", vehicle: "Bolt", rating: 4.7, fee: 15, risk: 0.05 },
  { id: "trotro", name: "Uncle Joe", vehicle: "Trotro", rating: 3.8, fee: 5, risk: 0.08 },
  { id: "van", name: "Fiifi", vehicle: "Van", rating: 4.5, fee: 25, risk: 0.02 },
] as const;

export const ADDRESSES = ["Home", "Friend's place", "Work", "Club"] as const;

const WAIT: Record<string, number> = { standard: 22000, express: 14000, same: 8000 };
const SPEED: Record<string, number> = { standard: 1, express: 1.6, same: 2.2 };

function need(value: number) {
  return Math.max(0, Math.min(100, value));
}

export function placeErrand(life: Life, itemId: string, riderId: string, speed: string, address: string, friend = ""): StepResult {
  if (life.errand && life.errand.readyAt > Date.now()) {
    return { life, notes: [], error: "You already have an order on the road." };
  }
  const item = MENU.find((row) => row.id === itemId);
  const rider = RIDERS.find((row) => row.id === riderId);
  if (!item || !rider) return { life, notes: [], error: "That order is not on the menu." };
  if (item.kind === "furniture" && rider.id !== "van") {
    return { life, notes: [], error: "A chair needs the van." };
  }
  const handle = friend.trim().toLowerCase().replace(/^@/, "");
  const toFriend = address === "Friend's place";
  if (toFriend && !/^[a-z0-9_]{3,16}$/.test(handle)) {
    return { life, notes: [], error: "Type their @handle so the rider knows which house." };
  }
  const where = toFriend ? `Friend's place · @${handle}` : address;
  const fee = Math.round(item.price + rider.fee * (SPEED[speed] ?? 1));
  if (life.cash < fee) return { life, notes: [], error: `MoMo cannot cover ${cedis(fee)}. You have ${cedis(life.cash)}.` };
  const next = cloneLife(life);
  next.cash -= fee;
  next.errand = {
    id: `errand-${Date.now().toString(36)}`,
    label: item.label,
    kind: item.kind,
    rider: rider.name,
    riderId: rider.id,
    vehicle: rider.vehicle,
    address: where,
    paid: fee,
    readyAt: Date.now() + (WAIT[speed] ?? WAIT.standard),
    line: toFriend ? `${rider.name} is taking it to @${handle}.` : `${rider.name} is on the way.`,
  };
  next.log = [`${rider.name} (${rider.vehicle}) has your ${item.label}.`, ...next.log].slice(0, 14);
  return { life: next, notes: [toFriend ? `${rider.name} is heading to @${handle}'s house.` : `${rider.name} is on the ${rider.vehicle.toLowerCase()}. ${where}.`] };
}

export function errandLine(life: Life) {
  const job = life.errand;
  if (!job) return "";
  const left = job.readyAt - Date.now();
  if (left > 8000) return `${job.rider} is on the way with ${job.label}.`;
  if (left > 0) return `${job.rider} is arriving. About ${Math.ceil(left / 1000)}s.`;
  return `${job.rider} is at your gate.`;
}

export function collectErrand(life: Life): StepResult {
  const job = life.errand;
  if (!job) return { life, notes: [], error: "Nothing is on the road." };
  if (job.readyAt > Date.now()) return { life, notes: [], error: errandLine(life) };
  const rider = RIDERS.find((row) => row.id === job.riderId);
  const next = cloneLife(life);
  next.errand = null;
  const street = next.traits.includes("streetwise") ? 0.5 : 1;
  const risk = (rider?.risk ?? 0.08) * street;
  const roll = Math.random();
  if (roll < risk * 0.15) {
    next.needs.fun = need(next.needs.fun - 12);
    next.drop = null;
    next.log = [`${job.rider} never arrived. The ${job.label} is gone.`, ...next.log].slice(0, 14);
    return { life: next, notes: [`${job.rider} and the ${job.label} vanished.`] };
  }
  if (roll < risk) {
    const back = Math.round(job.paid * 0.5);
    next.cash += back;
    next.needs.fun = need(next.needs.fun - 6);
    next.drop = { riderId: job.riderId, rider: job.rider, vehicle: job.vehicle, label: job.label };
    next.log = [`${job.rider} dented the ${job.label}. ${cedis(back)} came back.`, ...next.log].slice(0, 14);
    return { life: next, notes: [`The ${job.label} arrived damaged. ${cedis(back)} refunded.`] };
  }
  if (job.address.startsWith("Friend's place")) {
    next.drop = { riderId: job.riderId, rider: job.rider, vehicle: job.vehicle, label: job.label };
    next.log = [`${job.label} reached ${job.address}.`, ...next.log].slice(0, 14);
    return { life: next, notes: [`${job.rider} left the ${job.label} at ${job.address}.`] };
  }
  if (job.kind === "food") next.needs.hunger = need(next.needs.hunger + 28);
  if (job.kind === "medicine") next.needs.energy = need(next.needs.energy + 8);
  next.needs.fun = need(next.needs.fun + 4);
  next.drop = { riderId: job.riderId, rider: job.rider, vehicle: job.vehicle, label: job.label };
  next.log = [`${job.label} landed at ${job.address}.`, ...next.log].slice(0, 14);
  return { life: next, notes: [`${job.rider} handed over the ${job.label}.`] };
}

export function rateDrop(life: Life, stars: number): StepResult {
  const drop = life.drop;
  if (!drop) return { life, notes: [], error: "Nothing to rate." };
  const score = Math.max(1, Math.min(5, Math.round(stars)));
  const next = cloneLife(life);
  next.drop = null;
  const key = `rider-${drop.riderId}`;
  const prev = next.stats?.[key] ?? 0;
  next.stats = { ...(next.stats ?? {}), [key]: prev + score };
  const note = score <= 2 ? `${drop.rider} heard about the ${score} stars.` : `You gave ${drop.rider} ${score} stars.`;
  next.log = [note, ...next.log].slice(0, 14);
  return { life: next, notes: [note] };
}
