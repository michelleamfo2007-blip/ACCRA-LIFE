import { BAG_LIMIT, bagCount } from "@/lib/game/trade";
import { cedis, cloneLife, logLine, type Life, type Pet, type StepResult } from "@/lib/game/world";

export const PETS = [
  { id: "dog", label: "Dog", emoji: "🐕", price: 400, feed: 10, max: 2, blurb: "Guards the gate and drags you on walks." },
  { id: "cat", label: "Cat", emoji: "🐈", price: 200, feed: 6, max: 2, blurb: "Keeps the mice out of the kitchen." },
  { id: "chicken", label: "Chicken", emoji: "🐔", price: 60, feed: 3, max: 12, blurb: "A tray of eggs every few days." },
  { id: "goat", label: "Goat", emoji: "🐐", price: 700, feed: 8, max: 6, blurb: "Two or more and you get kids to sell." },
] as const;

export const FEED_GAP = 480;
export const STARVE = 2880;
const EGG_DAYS = 3;
const KID_GAP = 72 * 60;
const NAMES: Record<string, string[]> = {
  dog: ["Rex", "Bingo", "Simba", "Tiger", "Bobby", "Scooby"],
  cat: ["Pusscat", "Mimi", "Tom", "Snowy", "Kitty"],
  chicken: ["Akos", "Brownie", "Mama Hen", "Speckle", "Kokɔ", "Dodo", "Pepper", "Shito", "Kenkey", "Waakye", "Gari", "Fufu"],
  goat: ["Billy", "Abrewa", "Kakra", "Panyin", "Sumsum", "Bra Kwame"],
};

const id = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function petOf(kind: string) {
  return PETS.find((item) => item.id === kind) ?? PETS[0];
}

export function hungry(life: Life, pet: Pet) {
  return life.minutes - pet.fedAt >= FEED_GAP;
}

export function starving(life: Life, pet: Pet) {
  return life.minutes - pet.fedAt >= STARVE - 720;
}

export function eggsDue(life: Life) {
  const hens = (life.pets ?? []).filter((pet) => pet.kind === "chicken");
  return hens.reduce((sum, hen) => sum + Math.min(2, Math.floor((life.minutes - hen.lastYield) / (EGG_DAYS * 1440))), 0);
}

export function adoptPet(life: Life, kind: string): StepResult {
  const plan = PETS.find((item) => item.id === kind);
  if (!plan) return { life, notes: [], error: "Nobody is selling that." };
  const pets = life.pets ?? [];
  const same = pets.filter((pet) => pet.kind === kind);
  if (same.length >= plan.max) return { life, notes: [], error: `${plan.max} is enough ${plan.label.toLowerCase()}s for one compound.` };
  if (life.cash < plan.price) return { life, notes: [], error: `${plan.label} costs ${cedis(plan.price)}.` };
  const next = cloneLife(life);
  const pool = NAMES[kind] ?? ["Buddy"];
  const name = pool.find((item) => !pets.some((pet) => pet.name === item)) ?? `${plan.label} ${same.length + 1}`;
  next.cash -= plan.price;
  next.pets = [...pets, { id: id(), kind, name, fedAt: life.minutes, boughtAt: life.minutes, lastYield: life.minutes }];
  logLine(next, `Brought home ${name} the ${plan.label.toLowerCase()}.`);
  return { life: next, notes: [`Meet ${name} the ${plan.label.toLowerCase()}. Feed them at least every two days.`] };
}

export function feedPets(life: Life): StepResult {
  const due = (life.pets ?? []).filter((pet) => hungry(life, pet));
  if (!due.length) return { life, notes: [], error: "Everyone is full. Come back later." };
  const cost = due.reduce((sum, pet) => sum + petOf(pet.kind).feed, 0);
  if (life.cash < cost) return { life, notes: [], error: `Feed costs ${cedis(cost)}.` };
  const next = cloneLife(life);
  next.cash -= cost;
  next.pets = (next.pets ?? []).map((pet) => (hungry(life, pet) ? { ...pet, fedAt: life.minutes } : pet));
  return { life: next, notes: [`Fed ${due.length} ${due.length === 1 ? "animal" : "animals"} for ${cedis(cost)}.`] };
}

export function walkDog(life: Life, petId: string): StepResult {
  const pet = life.pets?.find((item) => item.id === petId && item.kind === "dog");
  if (!pet) return { life, notes: [], error: "No dog to walk." };
  const wait = (pet.lastPlay ?? -Infinity) + 360 - life.minutes;
  if (wait > 0) return { life, notes: [], error: `${pet.name} is napping. Walk again in ${Math.ceil(wait / 60)}h.` };
  const next = cloneLife(life);
  next.pets = (next.pets ?? []).map((item) => (item.id === petId ? { ...item, lastPlay: life.minutes } : item));
  next.needs.fun = Math.min(100, next.needs.fun + 12);
  next.needs.energy = Math.max(0, next.needs.energy - 6);
  if (Math.random() < 0.3) next.skills.fitness = Math.min(10, next.skills.fitness + 1);
  return { life: next, notes: [`Walked ${pet.name} round the block. The neighbours' kids came to pet him.`] };
}

export function playCat(life: Life, petId: string): StepResult {
  const pet = life.pets?.find((item) => item.id === petId && item.kind === "cat");
  if (!pet) return { life, notes: [], error: "No cat here." };
  const wait = (pet.lastPlay ?? -Infinity) + 360 - life.minutes;
  if (wait > 0) return { life, notes: [], error: `${pet.name} is ignoring you. Try in ${Math.ceil(wait / 60)}h.` };
  const next = cloneLife(life);
  next.pets = (next.pets ?? []).map((item) => (item.id === petId ? { ...item, lastPlay: life.minutes } : item));
  next.needs.fun = Math.min(100, next.needs.fun + 8);
  next.needs.social = Math.min(100, next.needs.social + 4);
  return { life: next, notes: [`${pet.name} purred on your lap for an hour.`] };
}

export function gatherEggs(life: Life): StepResult {
  const due = eggsDue(life);
  if (due < 1) return { life, notes: [], error: "The hens have not laid enough for a tray yet." };
  const room = BAG_LIMIT - bagCount(life);
  if (room < 1) return { life, notes: [], error: `Your trader's bag is full (${BAG_LIMIT}). Sell first.` };
  const trays = Math.min(due, room);
  const next = cloneLife(life);
  let left = trays;
  next.pets = (next.pets ?? []).map((pet) => {
    if (pet.kind !== "chicken" || left < 1) return pet;
    const ready = Math.min(2, Math.floor((life.minutes - pet.lastYield) / (EGG_DAYS * 1440)));
    if (ready < 1) return pet;
    const used = Math.min(ready, left);
    left -= used;
    return { ...pet, lastYield: life.minutes };
  });
  const lot = next.bag?.eggs ?? { qty: 0, paid: 0 };
  next.bag = { ...next.bag, eggs: { qty: lot.qty + trays, paid: lot.paid } };
  return { life: next, notes: [`Gathered ${trays} ${trays === 1 ? "tray" : "trays"} of eggs. Sell them across town.`] };
}

export function kidReady(life: Life) {
  const goats = (life.pets ?? []).filter((pet) => pet.kind === "goat");
  if (goats.length < 2 || goats.length >= petOf("goat").max) return false;
  const last = Math.max(...goats.map((goat) => goat.lastYield));
  return life.minutes - last >= KID_GAP;
}

export function checkGoats(life: Life): StepResult {
  if (!kidReady(life)) return { life, notes: [], error: "No new kids yet. Two goats, a few days and some patience." };
  const next = cloneLife(life);
  const goats = next.pets!.filter((pet) => pet.kind === "goat");
  const pool = NAMES.goat;
  const name = pool.find((item) => !next.pets!.some((pet) => pet.name === item)) ?? `Kid ${goats.length + 1}`;
  next.pets = [...next.pets!.map((pet) => (pet.kind === "goat" ? { ...pet, lastYield: life.minutes } : pet)), { id: id(), kind: "goat", name, fedAt: life.minutes, boughtAt: life.minutes, lastYield: life.minutes }];
  return { life: next, notes: [`A goat kid was born. Say hello to ${name}.`] };
}

export function sellPet(life: Life, petId: string): StepResult {
  const pet = life.pets?.find((item) => item.id === petId);
  if (!pet) return { life, notes: [], error: "That animal is gone." };
  const value = Math.round(petOf(pet.kind).price * (pet.kind === "goat" || pet.kind === "chicken" ? 0.75 : 0.4));
  const next = cloneLife(life);
  next.pets = (next.pets ?? []).filter((item) => item.id !== petId);
  next.cash += value;
  return { life: next, notes: [`Sold ${pet.name} for ${cedis(value)}.`] };
}
