import { bayCount, baySpot, garageBox, motorsOf } from "@/lib/game/garage";
import { circleSolid, type Bounds, type Solid } from "@/lib/game/nav";
import { DIVIDERS, FIXTURES, fixtureAt, roomReach, SHOP, type Life } from "@/lib/game/world";

/** Player capsule radius in metres. Smaller than the figure so corners do not snag. */
export const BODY = 0.28;

const PASS_KIND = new Set(["floor", "rug", "curtain", "painting", "ac", "lamp", "food", "guitar", "bird", "cat"]);
const PASS_ID = new Set(["pillow", "net", "pan", "book", "speaker", "transistor", "kente", "bulb", "bowl-set", "bucket"]);

/** Half-width, half-depth. Kept inside the visible mesh. */
const FOOT: Record<string, [number, number]> = {
  bed: [0.62, 0.38],
  sofa: [0.72, 0.26],
  chair: [0.26, 0.24],
  table: [0.5, 0.36],
  fridge: [0.36, 0.32],
  stove: [0.34, 0.3],
  sink: [0.42, 0.3],
  toilet: [0.24, 0.28],
  shower: [0.38, 0.36],
  tv: [0.42, 0.18],
  desk: [0.62, 0.4],
  fan: [0.2, 0.2],
  plant: [0.2, 0.2],
  tank: [0.38, 0.26],
  statue: [0.32, 0.32],
  throne: [0.36, 0.34],
  vault: [0.42, 0.36],
  wall: [1.45, 0.09],
  weights: [0.36, 0.26],
  jet: [1.15, 0.7],
  dog: [0.22, 0.16],
  box: [0.28, 0.26],
};

const FIXTURE_FOOT: Record<string, [number, number]> = {
  "fix-bed": [0.62, 0.38],
  "fix-sofa": [0.7, 0.26],
  "fix-fridge": [0.36, 0.32],
  "fix-stove": [0.34, 0.3],
  "fix-toilet": [0.24, 0.28],
  "fix-shower": [0.38, 0.36],
};

export function homeBounds(life: Life): Bounds {
  const span = life.span ?? 0;
  const room = roomReach(span);
  const bay = garageBox(span, bayCount(life));
  return {
    minX: Math.min(-room.halfW + 0.35, bay.x0 - 1.4),
    maxX: Math.max(room.halfW - 0.35, bay.x1 + 3.2),
    minZ: bay.z0 - 2.05,
    maxZ: room.halfD - 0.35,
  };
}

/** A bathroom entrance stays open so every home can reach the toilet and shower. */
function addDivider(add: (solid: Solid) => void, id: string, x: number, z: number, along: "x" | "z", length: number, gap: number) {
  const thick = 0.1;
  const half = length / 2;
  const stub = gap > 0.4 && gap < length - 0.4 ? (length - gap) / 2 : 0;
  if (along === "x") {
    if (!stub) {
      add({ id, minX: x - half, maxX: x + half, minZ: z - thick, maxZ: z + thick });
      return;
    }
    add({ id: `${id}-a`, minX: x - half, maxX: x - half + stub, minZ: z - thick, maxZ: z + thick });
    add({ id: `${id}-b`, minX: x + half - stub, maxX: x + half, minZ: z - thick, maxZ: z + thick });
    return;
  }
  if (!stub) {
    add({ id, minX: x - thick, maxX: x + thick, minZ: z - half, maxZ: z + half });
    return;
  }
  add({ id: `${id}-a`, minX: x - thick, maxX: x + thick, minZ: z - half, maxZ: z - half + stub });
  add({ id: `${id}-b`, minX: x - thick, maxX: x + thick, minZ: z + half - stub, maxZ: z + half });
}

function box(id: string, x: number, z: number, hx: number, hz: number, rot = 0): Solid {
  const swap = rot % 2 === 1;
  const halfX = swap ? hz : hx;
  const halfZ = swap ? hx : hz;
  return { id, minX: x - halfX, maxX: x + halfX, minZ: z - halfZ, maxZ: z + halfZ };
}

function footprint(kind: string, size: string, id: string): [number, number] | null {
  if (PASS_KIND.has(kind) || PASS_ID.has(id)) return null;
  const base = FOOT[kind];
  if (!base) return kind === "box" ? null : [0.28, 0.24];
  const match = size.match(/(\d+)\s*[×x]\s*(\d+)/i);
  if (!match || kind === "wall") return id === "king" || id === "family" ? [base[0] * 1.2, base[1]] : base;
  return [Math.max(base[0], Number(match[1]) * 0.38), Math.max(base[1], Number(match[2]) * 0.32)];
}

export function guestStand(index: number, doing?: string) {
  if (doing === "door") return { x: -4.35, z: 0.15 };
  if (doing === "eat" || doing === "cook") return { x: 3.7, z: 1.15 };
  return { x: -1.35 + index * 0.5, z: 0.35 };
}

export function homeSolids(life: Life, opts: { doorOpen?: boolean; garageShut?: boolean; skip?: string[] } = {}): Solid[] {
  const skip = new Set(opts.skip ?? []);
  const span = life.span ?? 0;
  const room = roomReach(span);
  const bays = bayCount(life);
  const bay = garageBox(span, bays);
  const thick = 0.14;
  const hw = room.halfW;
  const hd = room.halfD;
  const solids: Solid[] = [];
  const add = (solid: Solid) => {
    if (solid.id && skip.has(solid.id)) return;
    solids.push(solid);
  };

  add({ id: "wall-back-l", minX: -hw, maxX: bay.doorX0, minZ: -hd - thick, maxZ: -hd + thick });
  add({ id: "wall-back-r", minX: bay.doorX1, maxX: hw, minZ: -hd - thick, maxZ: -hd + thick });
  add({ id: "wall-front", minX: -hw, maxX: hw, minZ: hd - thick, maxZ: hd + thick });
  add({ id: "wall-right", minX: hw - thick, maxX: hw + thick, minZ: -hd, maxZ: hd });
  add({ id: "wall-left-back", minX: -hw - thick, maxX: -hw + thick, minZ: -hd, maxZ: -0.55 });
  add({ id: "wall-left-front", minX: -hw - thick, maxX: -hw + thick, minZ: 0.85, maxZ: hd });
  if (!opts.doorOpen) add({ id: "front-door", minX: -hw - thick, maxX: -hw + 0.22, minZ: -0.5, maxZ: 0.8 });

  add({ id: "garage-left", minX: bay.x0 - 0.08, maxX: bay.x0 + 0.08, minZ: bay.z0, maxZ: bay.z1 });
  add({ id: "garage-right", minX: bay.x1 - 0.08, maxX: bay.x1 + 0.08, minZ: bay.z0, maxZ: bay.z1 });
  if (opts.garageShut) add({ id: "garage-door", minX: bay.x0 + 0.2, maxX: bay.x1 - 0.2, minZ: bay.z0 - 0.1, maxZ: bay.z0 + 0.12 });
  add(box("post-l", bay.x0 - 0.15, bay.z0 - 2.15, 0.1, 0.55));
  add(box("post-r", bay.x1 + 0.55, bay.z0 - 2.15, 0.1, 0.55));

  for (const wall of DIVIDERS) {
    const piece = fixtureAt(life, wall.id);
    const along = piece.rot % 2 === 1 ? (wall.along === "x" ? "z" : "x") : wall.along;
    addDivider(add, wall.id, piece.x, piece.z, along, wall.length, wall.id === "fix-wall-side" ? 1.05 : 0);
  }

  for (const fixture of FIXTURES) {
    const foot = FIXTURE_FOOT[fixture.id];
    if (!foot) continue;
    const piece = fixtureAt(life, fixture.id);
    const wide = fixture.id === "fix-bed" && life.inventory.includes("king") ? 1.22 : 1;
    add(box(fixture.id, piece.x, piece.z, foot[0] * wide, foot[1], piece.rot));
  }

  for (const piece of life.furniture ?? []) {
    const item = SHOP.find((entry) => entry.id === piece.id);
    if (!item || item.consume) continue;
    const foot = footprint(item.kind, item.size, item.id);
    if (!foot) continue;
    add(box(piece.id, piece.x, piece.z, foot[0], foot[1], piece.rot));
  }

  motorsOf(life).forEach((motor, index) => {
    const inside = index < bay.count;
    const spot = inside ? baySpot(span, bays, index) : { x: bay.x1 + 1.6 + (index - bay.count) * 2.3, z: bay.z0 + 1.2 };
    add(box(motor.key ?? `car-${index}`, spot.x, spot.z, inside ? 0.5 : 0.55, inside ? 0.95 : 1.05));
  });
  if ((life.guests ?? []).some((guest) => guest.doing !== "leave")) add(box("guest-car", bay.x0 - 2.1, bay.z0 + 1.3, 0.55, 1.05));
  if (life.errand) add(box("errand-car", bay.x1 + 1.8, bay.z0 + 0.4, 0.4, 0.7));
  if (life.yard?.driver) add(circleSolid("driver", bay.x0 + 0.7, bay.z0 + 1.15, 0.26));
  if (life.yard?.guard) add(circleSolid("guard", bay.gate.x - 0.7, bay.gate.z - 0.2, 0.26));

  (life.guests ?? [])
    .filter((guest) => guest.doing !== "leave" && guest.doing !== "coming")
    .slice(0, 3)
    .forEach((guest, index) => {
      const stand = guestStand(index, guest.doing);
      add(circleSolid(`guest:${guest.name}`, stand.x, stand.z, 0.26));
    });

  return solids;
}
