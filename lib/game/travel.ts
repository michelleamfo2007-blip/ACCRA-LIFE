import { canBoard, flightWait, boardingWaitLabel } from "@/lib/game/flights";
import { townOf, type TownId } from "@/lib/game/towns";
import { carFuelBlock, cedis, farRide, RIDES, type Life, type Ride } from "@/lib/game/world";

export type TravelMode = "trotro" | "taxi" | "car" | "flight";

export type TravelQuote = {
  townId: TownId;
  mode: TravelMode;
  label: string;
  placeId: string;
  ride: Ride;
  routeId?: string;
  error?: string;
};

export function travelModes(from: TownId, to: TownId, hasCar: boolean): TravelMode[] {
  if (from === to) return [];
  const air = (from === "accra" && to === "kumasi") || (from === "kumasi" && to === "accra");
  const modes: TravelMode[] = ["trotro", "taxi"];
  if (hasCar) modes.push("car");
  if (air) modes.push("flight");
  return modes;
}

export function quoteTravel(life: Life, townId: TownId, mode: TravelMode): TravelQuote {
  const from = townOf(life.town);
  const to = townOf(townId);
  const fail = (error: string): TravelQuote => ({
    townId,
    mode,
    label: to.name,
    placeId: to.gate,
    ride: RIDES[1],
    error,
  });
  if (!to.open) return fail(`${to.name} is not on the board yet.`);
  if (from.id === to.id) return fail(`You are already in ${to.name}.`);
  if (mode !== "flight" && (life.where === to.gate || life.where === to.arrival)) {
    return {
      townId,
      mode,
      label: `Step into ${to.name}`,
      placeId: to.gate === "home" ? "home" : to.gate,
      ride: { id: "trek", label: "Step in", cost: 0, minutes: 0 },
    };
  }
  if (mode === "flight") {
    const routeId = from.id === "accra" ? "accra-kumasi" : "kumasi-accra";
    const blocked = canBoard(life, routeId, "economy");
    if (blocked) return fail(blocked);
    const wait = flightWait(life);
    if (wait > 0) return fail(`Next boarding in ${boardingWaitLabel(wait)}.`);
    return {
      townId,
      mode,
      label: `Passion Airways to ${to.name}`,
      placeId: to.arrival,
      ride: { id: "taxi", label: "Flight", cost: 320, minutes: 55 },
      routeId,
    };
  }
  const base = mode === "taxi" ? RIDES[4] : mode === "car" ? { id: "car" as const, label: "Your car", cost: 0, minutes: 40 } : RIDES[1];
  const ride = farRide(base, life.where, to.gate === "home" ? "home" : to.gate);
  if (ride.blocked) return fail(ride.blocked);
  if (mode === "car") {
    const fuel = carFuelBlock(life, ride.fuel ?? 6);
    if (fuel) return fail(fuel);
  } else if (life.cash < ride.cost) return fail(`You need ${cedis(ride.cost)} for the ${ride.label.toLowerCase()}.`);
  const placeId = to.id === "accra" ? "home" : to.gate;
  return { townId, mode, label: `${ride.label} to ${to.name}`, placeId, ride };
}
