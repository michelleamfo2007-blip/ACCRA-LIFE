import { roomReach } from "@/lib/game/world";

/** Local room frame is about 5m wide. The open house uses openHouseDress(). */
export type RoomKind =
  | "single"
  | "double"
  | "master"
  | "kids"
  | "hall"
  | "kitchen"
  | "dining"
  | "bath"
  | "study"
  | "prayer"
  | "store"
  | "laundry"
  | "garage"
  | "veranda"
  | "bq";

export type RoomPiece = {
  id: string;
  file?: string;
  span?: number;
  tall?: number;
  x: number;
  z: number;
  rot: number;
};

export type RoomLayout = {
  wall: string;
  side: string;
  floor: "wood" | "tile" | "checker";
  rug: string;
  pieces: RoomPiece[];
};

const wood = "furniture/table.glb";
const chair = "furniture/chair.glb";
const side = "furniture/sideTable.glb";

export const ROOM_LAYOUTS: Record<RoomKind, RoomLayout> = {
  single: {
    wall: "#d7e3ee",
    side: "#f6f1e6",
    floor: "wood",
    rug: "#e7b7b0",
    pieces: [
      { id: "bed", file: "furniture/bedSingle.glb", span: 1.7, x: 0.7, z: -0.4, rot: 0 },
      { id: "side", file: side, tall: 0.46, x: 1.55, z: -1.15, rot: 0 },
      { id: "chair", file: chair, tall: 0.7, x: -0.2, z: 0.85, rot: 0.5 },
    ],
  },
  double: {
    wall: "#c9d7cc",
    side: "#f6f1e6",
    floor: "wood",
    rug: "#d4a24a",
    pieces: [
      { id: "bed", file: "furniture/bedDouble.glb", span: 2, x: 0.4, z: -0.35, rot: 0 },
      { id: "side", file: side, tall: 0.46, x: -1.15, z: -1.1, rot: 0 },
      { id: "chair", file: chair, tall: 0.7, x: 1.2, z: 0.7, rot: 0.8 },
    ],
  },
  master: {
    wall: "#f7f4ee",
    side: "#e4eaf2",
    floor: "wood",
    rug: "#e7c36a",
    pieces: [
      { id: "bed", file: "furniture/bedDouble.glb", span: 2.1, x: 0.2, z: -0.2, rot: 0 },
      { id: "side", file: side, tall: 0.46, x: -1.35, z: -1.05, rot: 0 },
      { id: "bench", file: "furniture/loungeChair.glb", tall: 0.72, x: 1.35, z: 0.85, rot: -0.4 },
    ],
  },
  kids: {
    wall: "#f6f1e6",
    side: "#d5e3ef",
    floor: "checker",
    rug: "#7eb6d6",
    pieces: [
      { id: "bunk", file: "furniture/bedBunk.glb", tall: 1.45, x: 0.8, z: -0.45, rot: 0 },
      { id: "desk", file: "furniture/desk.glb", span: 1.05, x: -1.15, z: 0.7, rot: 0.2 },
      { id: "chair", file: chair, tall: 0.62, x: -1.05, z: 1.25, rot: 0.15 },
    ],
  },
  hall: {
    wall: "#c9d7cc",
    side: "#f6f1e6",
    floor: "wood",
    rug: "#d4a24a",
    pieces: [
      { id: "sofa", file: "furniture/loungeSofa.glb", span: 1.7, x: -0.7, z: 0.15, rot: 0.1 },
      { id: "chair", file: "furniture/loungeChair.glb", tall: 0.78, x: 0.85, z: 0.55, rot: -0.6 },
      { id: "table", file: "furniture/tableCoffee.glb", span: 0.85, x: -0.15, z: 0.7, rot: 0.2 },
    ],
  },
  kitchen: {
    wall: "#f6f1e6",
    side: "#d7e3ee",
    floor: "checker",
    rug: "#e7d7c0",
    pieces: [
      { id: "fridge", file: "furniture/kitchenFridgeLarge.glb", tall: 1.4, x: 1.35, z: -0.8, rot: 0 },
      { id: "stove", file: "furniture/kitchenStove.glb", tall: 0.9, x: 1.35, z: 0.35, rot: 0 },
      { id: "sink", file: "furniture/kitchenSink.glb", tall: 0.85, x: 0.2, z: -1.15, rot: 0 },
    ],
  },
  dining: {
    wall: "#f7f4ee",
    side: "#e4eaf2",
    floor: "wood",
    rug: "#e7b7b0",
    pieces: [
      { id: "table", file: wood, tall: 0.72, x: 0, z: 0.1, rot: 0.15 },
      { id: "chair-a", file: chair, tall: 0.72, x: -0.7, z: -0.45, rot: 0.4 },
      { id: "chair-b", file: chair, tall: 0.72, x: 0.75, z: 0.6, rot: -0.7 },
    ],
  },
  bath: {
    wall: "#d5e3ef",
    side: "#f6f1e6",
    floor: "tile",
    rug: "#f7f4ee",
    pieces: [
      { id: "toilet", file: "furniture/toilet.glb", tall: 0.7, x: -0.85, z: 0.7, rot: 0 },
      { id: "sink", file: "furniture/bathroomSink.glb", tall: 0.8, x: 0.7, z: -0.85, rot: 0 },
      { id: "shower", file: "furniture/shower.glb", tall: 1.4, x: 0.9, z: 0.7, rot: 0 },
    ],
  },
  study: {
    wall: "#c9d7cc",
    side: "#f6f1e6",
    floor: "wood",
    rug: "#d7c4a4",
    pieces: [
      { id: "desk", file: "furniture/desk.glb", span: 1.2, x: 0.3, z: -0.55, rot: 0.08 },
      { id: "laptop", file: "furniture/laptop.glb", span: 0.42, x: 0.15, z: -0.4, rot: 0.1 },
      { id: "chair", file: "furniture/loungeChair.glb", tall: 0.75, x: 0.15, z: 0.35, rot: 0.15 },
      { id: "books", file: "furniture/bookcaseOpen.glb", tall: 1.3, x: -1.35, z: -0.7, rot: 0 },
    ],
  },
  prayer: {
    wall: "#f6f1e6",
    side: "#e7e2d4",
    floor: "tile",
    rug: "#1f4d3a",
    pieces: [
      { id: "shelf", file: "furniture/bookcaseOpen.glb", tall: 1.1, x: 0, z: -1.15, rot: 0 },
      { id: "stool", file: side, tall: 0.4, x: 1.2, z: 0.4, rot: 0.3 },
    ],
  },
  store: {
    wall: "#e7d4b8",
    side: "#f0e2cc",
    floor: "tile",
    rug: "#cbb892",
    pieces: [
      { id: "shelf", file: "furniture/bookcaseOpen.glb", tall: 1.35, x: -0.9, z: -0.6, rot: 0 },
      { id: "crate", file: "furniture/cabinetTelevision.glb", tall: 0.55, x: 0.9, z: 0.5, rot: 0.2 },
    ],
  },
  laundry: {
    wall: "#d5e3ef",
    side: "#f6f1e6",
    floor: "tile",
    rug: "#e7e2d8",
    pieces: [
      { id: "washer", file: "furniture/washer.glb", tall: 0.9, x: 0.9, z: -0.55, rot: 0 },
      { id: "basket", file: side, tall: 0.4, x: -0.7, z: 0.6, rot: 0.4 },
    ],
  },
  garage: {
    wall: "#e7e0d2",
    side: "#d9d2c4",
    floor: "tile",
    rug: "#b7b3aa",
    pieces: [
      { id: "bench", file: "furniture/table.glb", tall: 0.7, x: -1.2, z: 0.8, rot: 0 },
      { id: "shelf", file: "furniture/bookcaseOpen.glb", tall: 1.2, x: 1.2, z: -0.7, rot: 0 },
    ],
  },
  veranda: {
    wall: "#f6f1e6",
    side: "#c9d7cc",
    floor: "tile",
    rug: "#8ea35a",
    pieces: [
      { id: "chair", file: "furniture/loungeChair.glb", tall: 0.75, x: -0.6, z: 0.2, rot: 0.4 },
      { id: "plant", file: "furniture/pottedPlant.glb", tall: 0.6, x: 1.1, z: -0.6, rot: 0 },
    ],
  },
  bq: {
    wall: "#f0e2cc",
    side: "#e7d4b8",
    floor: "checker",
    rug: "#c47a4a",
    pieces: [
      { id: "bed", file: "furniture/bedSingle.glb", span: 1.6, x: 0.6, z: -0.4, rot: 0 },
      { id: "chair", file: chair, tall: 0.68, x: -0.9, z: 0.7, rot: 0.5 },
      { id: "radio", file: "furniture/radio.glb", span: 0.28, x: -0.55, z: -1.05, rot: 0 },
    ],
  },
};

export function layoutOf(kind: RoomKind) {
  return ROOM_LAYOUTS[kind];
}

/** Lights, blinds, and the small lived-in bits on the house you walk through. */
export function openHouseDress(span = 0) {
  const room = roomReach(span);
  const hall = layoutOf("hall");
  const kitchen = layoutOf("kitchen");
  return {
    wall: hall.wall,
    side: hall.side,
    floor: hall.floor,
    lights: [
      { x: -5.2, z: -room.halfD + 0.16, yaw: 0 },
      { x: 1.6, z: -room.halfD + 0.16, yaw: 0 },
      { x: room.halfW - 0.16, z: 0.55, yaw: -Math.PI / 2 },
    ],
    window: { x: -4.35, z: -room.halfD + 0.14 },
    clock: { x: room.halfW - 0.14, z: -1.35, yaw: -Math.PI / 2 },
    outlet: { x: 0.85, z: -room.halfD + 0.14 },
    accents: [
      { ...hall.pieces[1], x: 0.9, z: 0.95 },
      { id: "side", file: "furniture/sideTable.glb", tall: 0.46, x: -2.7, z: -1.7, rot: 0.05 },
    ],
    box: { x: 1.45, z: 2.35 },
    bucket: { x: 5.15, z: kitchen.pieces[0].z + 3.15 },
    lamp: { x: -0.35, z: 1.15 },
  };
}
