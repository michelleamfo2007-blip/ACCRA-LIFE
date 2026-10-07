"use client";

import { Figure } from "@/components/game/low-poly-human";
import { carOf } from "@/lib/game/garage";
import {
  ASPHALT,
  BUMPS,
  LANES,
  LIGHTS,
  PLAYER_LANE,
  PLAYER_START,
  POTHOLES,
  RAIL_LAT,
  ROAD_LENGTH,
  blankFrame,
  frameAt,
  roadBend,
  roadSamples,
  surfaceLift,
  type Sample,
} from "@/lib/game/road-path";
import type { Look, RideId } from "@/lib/game/world";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Fog,
  Group,
  InstancedMesh,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  RepeatWrapping,
  SphereGeometry,
  SpotLight,
  SRGBColorSpace,
  TorusGeometry,
  Vector3,
  BoxGeometry,
  type Material,
  type Texture,
} from "three";

type Kind = "taxi" | "trotro" | "private" | "suv" | "okada" | "keke" | "bus" | "truck" | "coach";
export type RoadSky = { rain: boolean; flood: boolean; harmattan: boolean };
type Phase = "go" | "slow" | "stop" | "cross";

type Bins = { geo: Set<BufferGeometry>; mat: Set<Material>; tex: Set<Texture> };

type Actor = {
  group: Group;
  kind: Kind;
  lane: number;
  dist: number;
  speed: number;
  cruise: number;
  length: number;
  width: number;
  dir: 1 | -1;
  hold: number;
  wheels: Group[];
  wheelR: number;
  paint: Mesh[];
  stripes: Mesh[];
  brake: MeshStandardMaterial;
  head: MeshStandardMaterial;
  blinkL: MeshStandardMaterial;
  blinkR: MeshStandardMaterial;
  detail: Group;
  mate: Group | null;
  live: boolean;
};

type Signal = { red: MeshStandardMaterial; amber: MeshStandardMaterial; green: MeshStandardMaterial; dist: number };
type Person = { group: Group; job: "hawker" | "cross" | "pickup" };

type World = {
  root: Group;
  actors: Actor[];
  hero: Actor | null;
  signals: Signal[];
  people: Person[];
  lampMat: MeshStandardMaterial;
  glowMat: MeshBasicMaterial;
  spot: SpotLight | null;
  bins: Bins;
  camReady: boolean;
  playerDist: number;
  playerSpeed: number;
  time: number;
  nextPickup: number;
  pickup: Actor | null;
  wet: Group;
  frame: Sample;
  dispose: () => void;
};

const MIX: Kind[] = ["trotro", "taxi", "private", "okada", "suv", "keke", "taxi", "trotro", "bus", "truck", "private", "okada"];
const PAINTS = ["#c4513a", "#1e3a5f", "#006B3F", "#8a8f98", "#2a3344", "#b45309", "#6b3a6a", "#e7e2d8", "#4a5568"];
const TAXIS = ["#f0c014", "#e6b800", "#f7f4ef"];
const STRIPES = ["#006B3F", "#CE1126", "#1d4e89", "#FCD116"];
const SLOGANS = ["NO CONDITION IS PERMANENT", "GOD IS ABLE", "NO RUSH", "STILL GOD", "ENYAN DEN", "ACCRA BOY"];
const SIGNS = [
  { d: 48, text: "LIBERATION ROAD" },
  { d: 118, text: "OXFORD STREET" },
  { d: 178, text: "INDEPENDENCE AVE" },
  { d: 248, text: "SPINTEX ROAD" },
];

function useBudget() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(max-width: 760px), (pointer: coarse)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => {
      const mobile = window.matchMedia("(max-width: 760px), (pointer: coarse)").matches;
      const cores = navigator.hardwareConcurrency || 4;
      if (mobile) return cores <= 4 ? 6 : 8;
      return 12;
    },
    () => 8,
  );
}

function useReduce() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

function kmh(min: number, span: number) {
  return (min + Math.random() * span) / 3.6;
}

function cruiseFor(kind: Kind) {
  if (kind === "okada") return kmh(34, 26);
  if (kind === "keke") return kmh(22, 16);
  if (kind === "bus" || kind === "coach" || kind === "truck") return kmh(22, 16);
  if (kind === "trotro") return kmh(28, 18);
  return kmh(30, 26);
}

function phaseAt(time: number, index: number): Phase {
  const t = (time + index * 10) % 20;
  if (t < 7) return "go";
  if (t < 8.2) return "slow";
  if (t < 10.2) return "cross";
  if (t < 17.2) return "stop";
  if (t < 18.4) return "slow";
  return "cross";
}

function ourRed(phase: Phase) {
  return phase !== "go";
}

function theirRed(phase: Phase) {
  return phase === "go" || phase === "cross" || phase === "slow";
}

function approachLimit(dist: number, dir: 1 | -1, time: number, cruise: number) {
  let limit = cruise;
  for (let i = 0; i < LIGHTS.length; i += 1) {
    const light = LIGHTS[i];
    const phase = phaseAt(time, i);
    const red = dir > 0 ? ourRed(phase) : theirRed(phase);
    if (!red) continue;
    if (dir > 0) {
      const gate = light - 3.2;
      if (dist < gate && dist > gate - 28) limit = Math.min(limit, Math.max(0, (gate - dist) * 1.05));
    } else {
      const gate = light + 3.2;
      if (dist > gate && dist < gate + 28) limit = Math.min(limit, Math.max(0, (dist - gate) * 1.05));
    }
  }
  const bend = Math.abs(roadBend(dist));
  if (bend > 0.006) limit *= 0.68;
  else if (bend > 0.004) limit *= 0.84;
  for (const bump of BUMPS) {
    const gap = Math.abs(dist - bump);
    if (gap < 8 && gap > 0.3) limit = Math.min(limit, cruise * 0.55 + gap * 0.35);
  }
  return limit;
}

function labelTexture(bins: Bins, text: string, bg: string, fg: string, w = 512, h = 96) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const pen = canvas.getContext("2d");
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  bins.tex.add(tex);
  if (!pen) return tex;
  pen.fillStyle = bg;
  pen.fillRect(0, 0, w, h);
  pen.fillStyle = fg;
  pen.font = `800 ${Math.floor(h * 0.42)}px ui-sans-serif, sans-serif`;
  pen.textAlign = "center";
  pen.textBaseline = "middle";
  pen.fillText(text, w / 2, h / 2 + 2);
  return tex;
}

function asphaltTexture(bins: Bins) {
  const w = 512;
  const h = 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const pen = canvas.getContext("2d");
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  bins.tex.add(tex);
  if (!pen) return tex;
  const img = pen.createImageData(w, h);
  let seed = 91;
  const rand = () => {
    seed = (seed * 16807 + 11) % 2147483647;
    return seed / 2147483647;
  };
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4;
      const n = rand();
      const u = x / w;
      const edge = Math.min(u, 1 - u);
      let r = 38 + n * 22;
      let g = 40 + n * 18;
      let b = 44 + n * 14;
      if (edge < 0.07) {
        const k = 1 - edge / 0.07;
        r = r * (1 - k) + 96 * k;
        g = g * (1 - k) + 82 * k;
        b = b * (1 - k) + 62 * k;
      }
      img.data[i] = r;
      img.data[i + 1] = g;
      img.data[i + 2] = b;
      img.data[i + 3] = 255;
    }
  }
  pen.putImageData(img, 0, 0);
  pen.strokeStyle = "rgba(16,14,12,0.55)";
  pen.lineWidth = 1;
  for (let n = 0; n < 22; n += 1) {
    pen.beginPath();
    let x = rand() * w;
    let y = rand() * h;
    pen.moveTo(x, y);
    for (let k = 0; k < 5; k += 1) {
      x += (rand() - 0.5) * 46;
      y += (rand() - 0.25) * 54;
      pen.lineTo(x, y);
    }
    pen.stroke();
  }
  pen.fillStyle = "rgba(74,78,86,0.42)";
  for (let n = 0; n < 8; n += 1) pen.fillRect(rand() * 460, rand() * 470, 28 + rand() * 70, 14 + rand() * 22);
  pen.fillStyle = "rgba(16,12,8,0.38)";
  for (let n = 0; n < 6; n += 1) {
    pen.beginPath();
    pen.ellipse(rand() * w, rand() * h, 18 + rand() * 30, 8 + rand() * 10, rand(), 0, Math.PI * 2);
    pen.fill();
  }
  const laneX = (lat: number) => ((lat + ASPHALT) / (ASPHALT * 2)) * w;
  const dash = (lat: number, color: string, width: number, paint: number, gap: number) => {
    pen.fillStyle = color;
    const x = laneX(lat) - width / 2;
    for (let y = 0; y < h; y += paint + gap) pen.fillRect(x, y, width, paint);
  };
  pen.fillStyle = "rgba(232,226,210,0.78)";
  pen.fillRect(laneX(-6.05), 0, 5, h);
  pen.fillRect(laneX(6.05) - 5, 0, 5, h);
  dash(-3.2, "rgba(230,224,208,0.72)", 4, 150, 120);
  dash(3.2, "rgba(230,224,208,0.72)", 4, 150, 120);
  dash(0, "rgba(196,168,78,0.8)", 5, 170, 110);
  tex.needsUpdate = true;
  return tex;
}

function slabTexture(bins: Bins) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 256;
  const pen = canvas.getContext("2d");
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  bins.tex.add(tex);
  if (!pen) return tex;
  pen.fillStyle = "#cbbba6";
  pen.fillRect(0, 0, 128, 256);
  pen.strokeStyle = "rgba(90,78,64,0.45)";
  pen.lineWidth = 2;
  for (let y = 0; y < 256; y += 64) {
    pen.beginPath();
    pen.moveTo(0, y);
    pen.lineTo(128, y);
    pen.stroke();
  }
  pen.beginPath();
  pen.moveTo(64, 0);
  pen.lineTo(64, 256);
  pen.stroke();
  pen.fillStyle = "rgba(120,100,70,0.18)";
  pen.fillRect(8, 20, 40, 18);
  pen.fillRect(70, 140, 36, 16);
  return tex;
}

function trackGeo(bins: Bins, geo: BufferGeometry) {
  bins.geo.add(geo);
  return geo;
}

function trackMat<T extends Material>(bins: Bins, mat: T) {
  bins.mat.add(mat);
  return mat;
}

function stripGeometry(latA: number, yA: number, latB: number, yB: number, tile = 8) {
  const samples = roadSamples();
  const rows = samples.length;
  const pos = new Float32Array(rows * 6);
  const uv = new Float32Array(rows * 4);
  const index = new Uint32Array((rows - 1) * 6);
  for (let i = 0; i < rows; i += 1) {
    const s = samples[i];
    for (let k = 0; k < 2; k += 1) {
      const lat = k === 0 ? latA : latB;
      const y = k === 0 ? yA : yB;
      const vi = (i * 2 + k) * 3;
      pos[vi] = s.x + s.rx * lat;
      pos[vi + 1] = y;
      pos[vi + 2] = s.z + s.rz * lat;
      uv[(i * 2 + k) * 2] = k;
      uv[(i * 2 + k) * 2 + 1] = s.d / tile;
    }
    if (i < rows - 1) {
      const a = i * 2;
      const ii = i * 6;
      index[ii] = a;
      index[ii + 1] = a + 2;
      index[ii + 2] = a + 1;
      index[ii + 3] = a + 1;
      index[ii + 4] = a + 2;
      index[ii + 5] = a + 3;
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute("position", new BufferAttribute(pos, 3));
  geo.setAttribute("uv", new BufferAttribute(uv, 2));
  geo.setIndex(new BufferAttribute(index, 1));
  geo.computeVertexNormals();
  return geo;
}

function asphaltGeometry() {
  const samples = roadSamples();
  const cols = 12;
  const rows = samples.length;
  const count = rows * (cols + 1);
  const pos = new Float32Array(count * 3);
  const uv = new Float32Array(count * 2);
  const col = new Float32Array(count * 3);
  const index = new Uint32Array((rows - 1) * cols * 6);
  for (let i = 0; i < rows; i += 1) {
    const s = samples[i];
    for (let c = 0; c <= cols; c += 1) {
      const u = c / cols;
      const lat = -ASPHALT + u * ASPHALT * 2;
      let y = 0;
      let shade = 1;
      for (const hole of POTHOLES) {
        const n = Math.hypot(s.d - hole.d, lat - hole.x) / hole.r;
        if (n < 1) {
          const fall = (1 - n) ** 2;
          y -= hole.depth * fall;
          shade = Math.min(shade, 0.28 + 0.55 * n);
        }
      }
      const vi = (i * (cols + 1) + c) * 3;
      pos[vi] = s.x + s.rx * lat;
      pos[vi + 1] = y;
      pos[vi + 2] = s.z + s.rz * lat;
      uv[(i * (cols + 1) + c) * 2] = u;
      uv[(i * (cols + 1) + c) * 2 + 1] = s.d / 8;
      col[vi] = shade;
      col[vi + 1] = shade;
      col[vi + 2] = shade;
    }
    if (i < rows - 1) {
      for (let c = 0; c < cols; c += 1) {
        const a = i * (cols + 1) + c;
        const ii = (i * cols + c) * 6;
        index[ii] = a;
        index[ii + 1] = a + cols + 1;
        index[ii + 2] = a + 1;
        index[ii + 3] = a + 1;
        index[ii + 4] = a + cols + 1;
        index[ii + 5] = a + cols + 2;
      }
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute("position", new BufferAttribute(pos, 3));
  geo.setAttribute("uv", new BufferAttribute(uv, 2));
  geo.setAttribute("color", new BufferAttribute(col, 3));
  geo.setIndex(new BufferAttribute(index, 1));
  geo.computeVertexNormals();
  return geo;
}

function addMesh(parent: Group, geo: BufferGeometry, mat: Material, shadows: boolean) {
  const mesh = new Mesh(geo, mat);
  mesh.receiveShadow = shadows;
  parent.add(mesh);
  return mesh;
}

function makeWheel(bins: Bins, radius: number, width: number, rubber: MeshStandardMaterial, steel: MeshStandardMaterial) {
  const group = new Group();
  const tire = new Mesh(trackGeo(bins, new CylinderGeometry(radius, radius, width, 10)), rubber);
  tire.rotation.z = Math.PI / 2;
  tire.castShadow = true;
  const hub = new Mesh(trackGeo(bins, new CylinderGeometry(radius * 0.38, radius * 0.38, width + 0.02, 8)), steel);
  hub.rotation.z = Math.PI / 2;
  group.add(tire, hub);
  return group;
}

function makePerson(bins: Bins, shirt: string, skin: string) {
  const group = new Group();
  const cloth = trackMat(bins, new MeshStandardMaterial({ color: shirt, roughness: 0.8 }));
  const flesh = trackMat(bins, new MeshStandardMaterial({ color: skin, roughness: 0.72 }));
  const legL = new Mesh(trackGeo(bins, new BoxGeometry(0.12, 0.7, 0.12)), cloth);
  legL.position.set(-0.08, 0.35, 0);
  const legR = legL.clone();
  legR.position.x = 0.08;
  const torso = new Mesh(trackGeo(bins, new BoxGeometry(0.36, 0.48, 0.2)), cloth);
  torso.position.y = 0.95;
  const head = new Mesh(trackGeo(bins, new SphereGeometry(0.13, 8, 8)), flesh);
  head.position.y = 1.38;
  const bowl = new Mesh(trackGeo(bins, new BoxGeometry(0.28, 0.08, 0.2)), trackMat(bins, new MeshStandardMaterial({ color: "#1f7a4d" })));
  bowl.position.set(0.22, 1.05, 0.12);
  const brolly = new Mesh(trackGeo(bins, new CylinderGeometry(0.42, 0.46, 0.08, 8)), trackMat(bins, new MeshStandardMaterial({ color: "#121820", roughness: 0.7 })));
  brolly.position.y = 1.62;
  brolly.name = "brolly";
  brolly.visible = false;
  group.add(legL, legR, torso, head, bowl, brolly);
  return group;
}

function makeVehicle(bins: Bins, kind: Kind, color: string, shadows: boolean, slogan: string, rubber: MeshStandardMaterial, glass: MeshStandardMaterial, steel: MeshStandardMaterial, shadowMat: MeshBasicMaterial): Actor {
  const group = new Group();
  const detail = new Group();
  group.add(detail);
  const paintMat = trackMat(bins, new MeshStandardMaterial({ color, roughness: kind === "truck" ? 0.86 : 0.62, metalness: 0.06 }));
  const brake = trackMat(bins, new MeshStandardMaterial({ color: "#3a1010", emissive: "#ff2a2a", emissiveIntensity: 0.2, roughness: 0.4 }));
  const head = trackMat(bins, new MeshStandardMaterial({ color: "#fff4d2", emissive: "#fff1c4", emissiveIntensity: 0.2, roughness: 0.3 }));
  const blinkL = trackMat(bins, new MeshStandardMaterial({ color: "#5a3a10", emissive: "#ff9a1f", emissiveIntensity: 0, roughness: 0.4 }));
  const blinkR = blinkL.clone();
  bins.mat.add(blinkR);
  const paint: Mesh[] = [];
  const stripes: Mesh[] = [];
  const wheels: Group[] = [];
  let length = 4.4;
  let width = 1.72;
  let wheelR = 0.33;
  let mate: Group | null = null;

  const body = (w: number, h: number, d: number, x: number, y: number, z: number, mat: Material = paintMat) => {
    const mesh = new Mesh(trackGeo(bins, new BoxGeometry(w, h, d)), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = shadows;
    if (mat === paintMat) paint.push(mesh);
    group.add(mesh);
    return mesh;
  };
  const lamp = (x: number, y: number, z: number, mat: Material, sx = 0.18, sy = 0.1, sz = 0.08) => {
    const mesh = new Mesh(trackGeo(bins, new BoxGeometry(sx, sy, sz)), mat);
    mesh.position.set(x, y, z);
    group.add(mesh);
    return mesh;
  };
  const wheel = (x: number, z: number, radius = wheelR, wide = 0.18) => {
    const w = makeWheel(bins, radius, wide, rubber, steel);
    w.position.set(x, radius, z);
    group.add(w);
    wheels.push(w);
  };

  if (kind === "okada") {
    length = 2.05;
    width = 0.7;
    wheelR = 0.32;
    wheel(0, 0.7, wheelR, 0.12);
    wheel(0, -0.7, wheelR, 0.12);
    body(0.16, 0.14, 1.5, 0, 0.52, 0);
    body(0.42, 0.1, 0.46, 0, 0.62, -0.15);
    const rider = makePerson(bins, "#1c1917", "#8d5a3b");
    rider.position.set(0, 0.45, -0.1);
    rider.scale.setScalar(0.72);
    detail.add(rider);
    lamp(0, 0.58, 0.78, head, 0.12, 0.08, 0.08);
    lamp(0, 0.5, -0.78, brake, 0.1, 0.08, 0.06);
  } else if (kind === "keke") {
    length = 2.7;
    width = 1.35;
    wheelR = 0.28;
    wheel(0, 1.05, wheelR, 0.12);
    wheel(-0.5, -0.85, wheelR, 0.14);
    wheel(0.5, -0.85, wheelR, 0.14);
    body(1.2, 1.15, 1.5, 0, 1.05, -0.15);
    const cabin = new Mesh(trackGeo(bins, new BoxGeometry(1.05, 0.55, 0.9)), glass);
    cabin.position.set(0, 1.35, 0.05);
    detail.add(cabin);
    body(1.15, 0.12, 1.7, 0, 1.68, -0.1);
    lamp(0.4, 0.55, 1.2, head, 0.16, 0.1, 0.08);
    lamp(-0.4, 0.55, 1.2, head, 0.16, 0.1, 0.08);
    lamp(0.45, 0.5, -1.15, brake);
    lamp(-0.45, 0.5, -1.15, brake);
  } else if (kind === "trotro") {
    length = 5.6;
    width = 1.95;
    wheelR = 0.36;
    wheel(-0.78, 1.7);
    wheel(0.78, 1.7);
    wheel(-0.78, -1.7);
    wheel(0.78, -1.7);
    body(1.9, 1.55, 5.3, 0, 1.25, 0);
    const stripe = body(1.92, 0.16, 5.32, 0, 1.15, 0, trackMat(bins, new MeshStandardMaterial({ color: STRIPES[0], roughness: 0.55 })));
    stripes.push(stripe);
    const win = new Mesh(trackGeo(bins, new BoxGeometry(1.7, 0.48, 3.1)), glass);
    win.position.set(0, 1.55, -0.15);
    detail.add(win);
    const board = new Mesh(
      trackGeo(bins, new PlaneGeometry(2.4, 0.36)),
      trackMat(bins, new MeshStandardMaterial({ map: labelTexture(bins, slogan || SLOGANS[0], "#f7f1e4", "#121212"), roughness: 0.7 })),
    );
    board.position.set(0, 0.72, -2.66);
    detail.add(board);
    mate = makePerson(bins, "#FCD116", "#6b3e2a");
    mate.scale.setScalar(0.82);
    mate.position.set(0.92, 0.35, 0.2);
    mate.rotation.z = -0.5;
    detail.add(mate);
    lamp(0.62, 0.7, 2.55, head);
    lamp(-0.62, 0.7, 2.55, head);
    lamp(0.7, 0.62, -2.6, brake);
    lamp(-0.7, 0.62, -2.6, brake);
    lamp(0.85, 0.7, 2.35, blinkL, 0.1, 0.08, 0.06);
    lamp(-0.85, 0.7, 2.35, blinkR, 0.1, 0.08, 0.06);
  } else if (kind === "bus" || kind === "coach") {
    length = kind === "coach" ? 11.2 : 9.6;
    width = kind === "coach" ? 2.7 : 2.45;
    wheelR = kind === "coach" ? 0.46 : 0.42;
    const zAxles = kind === "coach" ? [3.6, -0.2, -3.8] : [2.8, -2.6];
    for (const z of zAxles) {
      wheel(-width * 0.42, z, wheelR, 0.24);
      wheel(width * 0.42, z, wheelR, 0.24);
    }
    const paintColor = kind === "coach" ? "#f4efe6" : "#0e7a45";
    paintMat.color.set(paintColor);
    body(width, kind === "coach" ? 2.5 : 2.35, length - 0.4, 0, 1.7, 0);
    if (kind === "bus") {
      const stripe = body(width + 0.02, 0.28, length - 0.3, 0, 1.55, 0, trackMat(bins, new MeshStandardMaterial({ color: "#FCD116", roughness: 0.5 })));
      stripes.push(stripe);
    } else {
      body(width + 0.02, 0.22, length - 0.2, 0, 2.85, 0, trackMat(bins, new MeshStandardMaterial({ color: "#CE1126", roughness: 0.5 })));
    }
    const win = new Mesh(trackGeo(bins, new BoxGeometry(width - 0.12, 0.7, length * 0.62)), glass);
    win.position.set(0, 2.15, -0.2);
    detail.add(win);
    lamp(width * 0.32, 0.85, length * 0.48, head, 0.28, 0.16, 0.08);
    lamp(-width * 0.32, 0.85, length * 0.48, head, 0.28, 0.16, 0.08);
    lamp(width * 0.32, 0.8, -length * 0.48, brake, 0.28, 0.14, 0.08);
    lamp(-width * 0.32, 0.8, -length * 0.48, brake, 0.28, 0.14, 0.08);
  } else if (kind === "truck") {
    length = 8.2;
    width = 2.35;
    wheelR = 0.42;
    wheel(-0.9, 2.5, wheelR, 0.24);
    wheel(0.9, 2.5, wheelR, 0.24);
    wheel(-0.9, -2.15, wheelR, 0.26);
    wheel(0.9, -2.15, wheelR, 0.26);
    body(2.1, 1.7, 2.2, 0, 1.35, 2.3);
    const glassCab = new Mesh(trackGeo(bins, new BoxGeometry(1.9, 0.7, 0.9)), glass);
    glassCab.position.set(0, 1.7, 2.55);
    detail.add(glassCab);
    body(2.3, 1.15, 4.6, 0, 1.55, -1.15);
    const load = body(2.1, 1.1, 3.2, 0.05, 2.35, -1.2, trackMat(bins, new MeshStandardMaterial({ color: "#8d5a3b", roughness: 0.9 })));
    load.rotation.z = 0.04;
    lamp(0.7, 0.85, 3.3, head, 0.24, 0.14, 0.08);
    lamp(-0.7, 0.85, 3.3, head, 0.24, 0.14, 0.08);
    lamp(0.8, 0.7, -3.4, brake);
    lamp(-0.8, 0.7, -3.4, brake);
  } else {
    const suv = kind === "suv";
    length = suv ? 4.7 : 4.35;
    width = suv ? 1.9 : 1.72;
    wheelR = suv ? 0.38 : 0.33;
    const nose = length * 0.36;
    wheel(-width * 0.42, nose * 0.7);
    wheel(width * 0.42, nose * 0.7);
    wheel(-width * 0.42, -nose * 0.85);
    wheel(width * 0.42, -nose * 0.85);
    body(width, suv ? 0.62 : 0.5, length * 0.92, 0, suv ? 0.72 : 0.62, 0);
    body(width * 0.86, suv ? 0.62 : 0.5, length * 0.42, 0, suv ? 1.22 : 1.05, -length * 0.06);
    const win = new Mesh(trackGeo(bins, new BoxGeometry(width * 0.78, suv ? 0.4 : 0.34, length * 0.32)), glass);
    win.position.set(0, suv ? 1.22 : 1.05, -length * 0.02);
    detail.add(win);
    if (kind === "taxi") {
      const sign = new Mesh(
        trackGeo(bins, new BoxGeometry(0.46, 0.16, 0.28)),
        trackMat(bins, new MeshStandardMaterial({ color: "#121212", roughness: 0.5 })),
      );
      sign.position.set(0, suv ? 1.62 : 1.42, -0.05);
      const face = new Mesh(trackGeo(bins, new PlaneGeometry(0.4, 0.12)), trackMat(bins, new MeshStandardMaterial({ map: labelTexture(bins, "TAXI", "#121212", "#FCD116", 256, 64), roughness: 0.5 })));
      face.position.set(0, suv ? 1.62 : 1.42, 0.15);
      detail.add(sign, face);
      const fender = trackMat(bins, new MeshStandardMaterial({ color: "#f0c014", roughness: 0.55 }));
      body(0.12, 0.28, 0.7, width * 0.5, 0.55, length * 0.2, fender);
      body(0.12, 0.28, 0.7, -width * 0.5, 0.55, length * 0.2, fender);
    }
    lamp(width * 0.36, 0.58, length * 0.46, head);
    lamp(-width * 0.36, 0.58, length * 0.46, head);
    lamp(width * 0.38, 0.52, -length * 0.46, brake);
    lamp(-width * 0.38, 0.52, -length * 0.46, brake);
    lamp(width * 0.46, 0.58, length * 0.4, blinkL, 0.08, 0.08, 0.06);
    lamp(-width * 0.46, 0.58, length * 0.4, blinkR, 0.08, 0.08, 0.06);
  }

  const shadow = new Mesh(trackGeo(bins, new PlaneGeometry(1, 1)), shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.03;
  shadow.scale.set(width * 0.7, length * 0.42, 1);
  shadow.renderOrder = 1;
  group.add(shadow);

  return {
    group,
    kind,
    lane: 0,
    dist: PLAYER_START,
    speed: 0,
    cruise: cruiseFor(kind),
    length,
    width,
    dir: 1,
    hold: -1,
    wheels,
    wheelR,
    paint,
    stripes,
    brake,
    head,
    blinkL,
    blinkR,
    detail,
    mate,
    live: true,
  };
}

function place(group: Group, dist: number, lat: number, y: number, face: 1 | -1, frame: Sample) {
  frameAt(dist, frame);
  group.position.set(frame.x + frame.rx * lat, y, frame.z + frame.rz * lat);
  group.rotation.set(0, Math.atan2(frame.tx * face, frame.tz * face), 0);
}

const _seat = new Vector3();

function heroKind(ride: RideId): Kind | null {
  if (ride === "trek") return null;
  if (ride === "train") return "coach";
  if (ride === "car") return "private";
  if (ride === "trotro") return "trotro";
  if (ride === "okada") return "okada";
  return "taxi";
}

function heroLat(ride: RideId) {
  if (ride === "train") return RAIL_LAT;
  if (ride === "trek") return 8.7;
  return LANES[PLAYER_LANE].lat;
}

function buildWorld(budget: number, ride: RideId, slogan: string, shadows: boolean, carId?: string | null): World {
  const bins: Bins = { geo: new Set(), mat: new Set(), tex: new Set() };
  const root = new Group();
  root.name = "accra-road";
  const rubber = trackMat(bins, new MeshStandardMaterial({ color: "#1a1c20", roughness: 0.92 }));
  const glass = trackMat(bins, new MeshStandardMaterial({ color: "#9fd4f2", roughness: 0.12, metalness: 0.05, transparent: true, opacity: 0.72 }));
  const steel = trackMat(bins, new MeshStandardMaterial({ color: "#c5ccd4", roughness: 0.35, metalness: 0.6 }));
  const shadowMat = trackMat(bins, new MeshBasicMaterial({ color: "#000", transparent: true, opacity: shadows ? 0.28 : 0.42, depthWrite: false }));
  const asphalt = trackMat(
    bins,
    new MeshStandardMaterial({
      map: asphaltTexture(bins),
      roughness: 0.94,
      metalness: 0.02,
      vertexColors: true,
      side: DoubleSide,
    }),
  );
  addMesh(root, trackGeo(bins, asphaltGeometry()), asphalt, shadows);

  const curbMat = trackMat(bins, new MeshStandardMaterial({ color: "#d9cbb8", roughness: 0.88, side: DoubleSide }));
  const gutterMat = trackMat(bins, new MeshStandardMaterial({ color: "#14110e", roughness: 0.96, side: DoubleSide }));
  const walkMat = trackMat(bins, new MeshStandardMaterial({ map: slabTexture(bins), color: "#cfc3b0", roughness: 0.9, side: DoubleSide }));
  const dirtMat = trackMat(bins, new MeshStandardMaterial({ color: "#c4a36a", roughness: 1, side: DoubleSide }));
  const side = (sign: number) => {
    addMesh(root, trackGeo(bins, stripGeometry(sign * 6.42, -0.22, sign * 6.42, 0)), gutterMat, shadows);
    addMesh(root, trackGeo(bins, stripGeometry(sign * 6.42, -0.22, sign * 7.25, -0.22)), gutterMat, shadows);
    addMesh(root, trackGeo(bins, stripGeometry(sign * 7.25, -0.22, sign * 7.25, 0.2)), curbMat, shadows);
    addMesh(root, trackGeo(bins, stripGeometry(sign * 7.25, 0.2, sign * 7.6, 0.2)), curbMat, shadows);
    addMesh(root, trackGeo(bins, stripGeometry(sign * 7.6, 0.2, sign * 10.5, 0.2, 4)), walkMat, shadows);
    addMesh(root, trackGeo(bins, stripGeometry(sign * 10.5, 0.02, sign * 18, 0.02, 12)), dirtMat, shadows);
  };
  side(1);
  side(-1);

  const frame = blankFrame();
  const yellow = trackMat(bins, new MeshStandardMaterial({ color: "#e2b423", roughness: 0.6 }));
  const black = trackMat(bins, new MeshStandardMaterial({ color: "#161616", roughness: 0.7 }));
  for (const bump of BUMPS) {
    frameAt(bump, frame);
    const pile = new Group();
    pile.position.set(frame.x, 0, frame.z);
    pile.rotation.y = Math.atan2(frame.tx, frame.tz);
    const base = new Mesh(trackGeo(bins, new BoxGeometry(11.2, 0.08, 0.72)), black);
    base.position.y = 0.05;
    base.castShadow = shadows;
    base.receiveShadow = shadows;
    pile.add(base);
    for (let i = 0; i < 8; i += 1) {
      const band = new Mesh(trackGeo(bins, new BoxGeometry(11.15, 0.025, 0.07)), i % 2 ? yellow : black);
      band.position.set(0, 0.1, -0.28 + i * 0.08);
      pile.add(band);
    }
    root.add(pile);
  }

  const white = trackMat(bins, new MeshStandardMaterial({ color: "#efeae0", roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2 }));
  for (const light of LIGHTS) {
    for (let s = 0; s < 6; s += 1) {
      frameAt(light - 1.1 + s * 0.42, frame);
      const stripe = new Mesh(trackGeo(bins, new BoxGeometry(11, 0.02, 0.2)), white);
      stripe.position.set(frame.x, 0.03, frame.z);
      stripe.rotation.y = Math.atan2(frame.tx, frame.tz);
      stripe.receiveShadow = shadows;
      root.add(stripe);
    }
  }

  if (ride === "train") {
    const gravel = trackMat(bins, new MeshStandardMaterial({ color: "#6d675e", roughness: 1, side: DoubleSide }));
    const rail = trackMat(bins, new MeshStandardMaterial({ color: "#9aa3ad", roughness: 0.35, metalness: 0.7, side: DoubleSide }));
    addMesh(root, trackGeo(bins, stripGeometry(RAIL_LAT - 1.6, 0.05, RAIL_LAT + 1.6, 0.05)), gravel, shadows);
    addMesh(root, trackGeo(bins, stripGeometry(RAIL_LAT - 0.75, 0.12, RAIL_LAT - 0.68, 0.2)), rail, shadows);
    addMesh(root, trackGeo(bins, stripGeometry(RAIL_LAT + 0.68, 0.12, RAIL_LAT + 0.75, 0.2)), rail, shadows);
  }

  const signals: Signal[] = [];
  const metal = trackMat(bins, new MeshStandardMaterial({ color: "#3a4148", roughness: 0.5, metalness: 0.4 }));
  for (const dist of LIGHTS) {
    const red = trackMat(bins, new MeshStandardMaterial({ color: "#3a1010", emissive: "#ff2a2a", emissiveIntensity: 0 }));
    const amber = trackMat(bins, new MeshStandardMaterial({ color: "#3a2a10", emissive: "#ffb020", emissiveIntensity: 0 }));
    const green = trackMat(bins, new MeshStandardMaterial({ color: "#102818", emissive: "#37d67a", emissiveIntensity: 0 }));
    for (const lat of [8.15, -8.15]) {
      frameAt(dist, frame);
      const pole = new Group();
      pole.position.set(frame.x + frame.rx * lat, 0, frame.z + frame.rz * lat);
      pole.rotation.y = Math.atan2(frame.tx, frame.tz);
      const stick = new Mesh(trackGeo(bins, new CylinderGeometry(0.07, 0.09, 3.3, 6)), metal);
      stick.position.y = 1.65;
      const box = new Mesh(trackGeo(bins, new BoxGeometry(0.32, 0.78, 0.28)), black);
      box.position.set(lat > 0 ? -0.2 : 0.2, 3.15, 0);
      const bulb = (mat: MeshStandardMaterial, y: number) => {
        const mesh = new Mesh(trackGeo(bins, new SphereGeometry(0.08, 8, 8)), mat);
        mesh.position.set(lat > 0 ? -0.2 : 0.2, y, 0.12);
        pole.add(mesh);
      };
      pole.add(stick, box);
      bulb(red, 3.38);
      bulb(amber, 3.15);
      bulb(green, 2.92);
      root.add(pole);
    }
    signals.push({ red, amber, green, dist });
  }

  const lampMat = trackMat(bins, new MeshStandardMaterial({ color: "#ffd27a", emissive: "#ffd27a", emissiveIntensity: 0.15, roughness: 0.4 }));
  const glowMat = trackMat(bins, new MeshBasicMaterial({ color: "#ffd27a", transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending }));
  const lampCount = 20;
  const poles = new InstancedMesh(trackGeo(bins, new CylinderGeometry(0.06, 0.08, 4.2, 6)), metal, lampCount);
  const bulbs = new InstancedMesh(trackGeo(bins, new SphereGeometry(0.16, 8, 8)), lampMat, lampCount);
  const glows = new InstancedMesh(trackGeo(bins, new SphereGeometry(0.55, 8, 8)), glowMat, lampCount);
  const dummy = new Object3D();
  let lamp = 0;
  for (let d = 24; d < ROAD_LENGTH && lamp < lampCount; d += 28) {
    if (LIGHTS.some((light) => Math.abs(light - d) < 8)) continue;
    frameAt(d, frame);
    dummy.position.set(frame.x + frame.rx * 8.3, 2.1, frame.z + frame.rz * 8.3);
    dummy.scale.set(1, 1, 1);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    poles.setMatrixAt(lamp, dummy.matrix);
    dummy.position.y = 4.25;
    dummy.updateMatrix();
    bulbs.setMatrixAt(lamp, dummy.matrix);
    dummy.scale.setScalar(1);
    glows.setMatrixAt(lamp, dummy.matrix);
    lamp += 1;
  }
  poles.count = lamp;
  bulbs.count = lamp;
  glows.count = lamp;
  root.add(poles, bulbs, glows);

  const blockMat = trackMat(bins, new MeshStandardMaterial({ color: "#ffffff", roughness: 0.86 }));
  const blocks = new InstancedMesh(trackGeo(bins, new BoxGeometry(1, 1, 1)), blockMat, 40);
  const palette = [new Color("#efe6d4"), new Color("#d7e2ea"), new Color("#e7c2a8"), new Color("#c4784a"), new Color("#8eabc4")];
  let b = 0;
  for (let d = 20; d < ROAD_LENGTH && b < 40; d += 16) {
    if (LIGHTS.some((light) => Math.abs(light - d) < 10)) continue;
    frameAt(d, frame);
    const sideLat = b % 2 === 0 ? 15.5 : -15.5;
    const h = 6 + (b % 5) * 4.5;
    dummy.position.set(frame.x + frame.rx * sideLat, h / 2, frame.z + frame.rz * sideLat);
    dummy.scale.set(7, h, 8);
    dummy.rotation.set(0, Math.atan2(frame.tx, frame.tz), 0);
    dummy.updateMatrix();
    blocks.setMatrixAt(b, dummy.matrix);
    blocks.setColorAt(b, palette[b % palette.length]);
    b += 1;
  }
  blocks.count = b;
  if (blocks.instanceColor) blocks.instanceColor.needsUpdate = true;
  root.add(blocks);

  const trunkMat = trackMat(bins, new MeshStandardMaterial({ color: "#6b4a32", roughness: 0.9 }));
  const leafMat = trackMat(bins, new MeshStandardMaterial({ color: "#2f6b2a", roughness: 0.8 }));
  for (let d = 30; d < ROAD_LENGTH; d += 34) {
    frameAt(d, frame);
    const palm = new Group();
    palm.position.set(frame.x + frame.rx * 9.3, 0.2, frame.z + frame.rz * 9.3);
    const trunk = new Mesh(trackGeo(bins, new CylinderGeometry(0.12, 0.16, 3.2, 6)), trunkMat);
    trunk.position.y = 1.6;
    palm.add(trunk);
    for (let leaf = 0; leaf < 5; leaf += 1) {
      const frond = new Mesh(trackGeo(bins, new ConeGeometry(0.55, 1.6, 5)), leafMat);
      frond.position.y = 3.3;
      frond.rotation.z = 0.9;
      frond.rotation.y = (leaf / 5) * Math.PI * 2;
      palm.add(frond);
    }
    root.add(palm);
  }

  for (const sign of SIGNS) {
    frameAt(sign.d, frame);
    const board = new Group();
    board.position.set(frame.x + frame.rx * 8.5, 0, frame.z + frame.rz * 8.5);
    board.rotation.y = Math.atan2(frame.tx, frame.tz);
    const post = new Mesh(trackGeo(bins, new CylinderGeometry(0.06, 0.07, 2.6, 6)), metal);
    post.position.y = 1.3;
    const face = new Mesh(
      trackGeo(bins, new PlaneGeometry(2.6, 0.7)),
      trackMat(bins, new MeshStandardMaterial({ map: labelTexture(bins, sign.text, "#006B3F", "#ffffff", 512, 128), roughness: 0.6 })),
    );
    face.position.set(-0.15, 2.45, 0);
    face.rotation.y = -Math.PI / 2;
    board.add(post, face);
    root.add(board);
  }

  const stall = (d: number, color: string, lat: number) => {
    frameAt(d, frame);
    const box = new Mesh(trackGeo(bins, new BoxGeometry(1.6, 1.5, 1.3)), trackMat(bins, new MeshStandardMaterial({ color, roughness: 0.75 })));
    box.position.set(frame.x + frame.rx * lat, 0.95, frame.z + frame.rz * lat);
    box.rotation.y = Math.atan2(frame.tx, frame.tz);
    root.add(box);
  };
  stall(60, "#CE1126", 9.1);
  stall(150, "#FCD116", 9.2);
  stall(220, "#006B3F", -9.1);

  const actors: Actor[] = [];
  for (let i = 0; i < budget; i += 1) {
    const kind = MIX[i % MIX.length];
    let lane = i % 4;
    if ((kind === "bus" || kind === "truck") && lane !== 0 && lane !== 3) lane = i % 2 === 0 ? 0 : 3;
    const color = kind === "taxi" ? TAXIS[i % TAXIS.length] : kind === "trotro" ? "#f7f4ef" : kind === "keke" ? "#f0c014" : PAINTS[i % PAINTS.length];
    const actor = makeVehicle(bins, kind, color, shadows, SLOGANS[i % SLOGANS.length], rubber, glass, steel, shadowMat);
    actor.lane = lane;
    actor.dir = LANES[lane].dir;
    actor.dist = 62 + Math.floor(i / 4) * 26 + (lane % 2) * 9;
    actor.speed = actor.cruise * 0.8;
    actor.live = true;
    if (kind === "trotro" && actor.stripes[0]) actor.stripes[0].material = trackMat(bins, new MeshStandardMaterial({ color: STRIPES[i % STRIPES.length], roughness: 0.55 }));
    root.add(actor.group);
    actors.push(actor);
  }

  const owned = ride === "car" ? carOf(carId) : null;
  const kind = owned?.suv ? "suv" : heroKind(ride);
  let hero: Actor | null = null;
  let spot: SpotLight | null = null;
  if (kind) {
    const color = owned ? owned.paint : kind === "taxi" ? "#f0c014" : kind === "trotro" ? "#f7f4ef" : kind === "coach" ? "#f4efe6" : "#2a3344";
    hero = makeVehicle(bins, kind, color, shadows, slogan, rubber, glass, steel, shadowMat);
    hero.lane = PLAYER_LANE;
    hero.dir = 1;
    hero.dist = PLAYER_START;
    hero.cruise = ride === "train" ? 14 : ride === "okada" ? 13 : 11.6;
    hero.speed = 0;
    if (owned) {
      hero.group.scale.setScalar(owned.scale);
      hero.group.userData.seatY = owned.suv ? 0.4 : 0.18;
      for (const mesh of hero.paint) {
        if (mesh.position.y > 0.9) {
          mesh.scale.y = 0.22;
          mesh.position.y += owned.suv ? 0.28 : 0.22;
        }
      }
      hero.detail.traverse((obj) => {
        if (obj instanceof Mesh && obj.material === glass) {
          const pane = glass.clone();
          pane.opacity = 0.18;
          pane.depthWrite = false;
          obj.material = trackMat(bins, pane);
        }
      });
      const wheel = new Mesh(
        trackGeo(bins, new TorusGeometry(0.15, 0.02, 6, 12)),
        trackMat(bins, new MeshStandardMaterial({ color: "#141414", roughness: 0.4, metalness: 0.25 })),
      );
      wheel.position.set(-0.3, owned.suv ? 1.08 : 0.9, 0.22);
      wheel.rotation.x = 0.7;
      hero.detail.add(wheel);
    }
    root.add(hero.group);
    spot = new SpotLight("#ffe2b0", 0, 28, 0.5, 0.5, 1);
    spot.position.set(0, 0.95, kind === "coach" ? 4 : 1.6);
    const target = new Object3D();
    target.position.set(0, 0.4, 12);
    hero.group.add(spot, target);
    spot.target = target;
  }

  const wet = new Group();
  wet.name = "puddles";
  const puddleMat = trackMat(bins, new MeshStandardMaterial({ color: "#7f97a8", roughness: 0.08, metalness: 0.45, transparent: true, opacity: 0.62, depthWrite: false }));
  const puddleGeo = trackGeo(bins, new PlaneGeometry(2.4, 1.5));
  for (const spot of [
    { d: 54, lat: 2.1 },
    { d: 88, lat: -1.4 },
    { d: 124, lat: 3.2 },
    { d: 168, lat: -2.2 },
    { d: 214, lat: 1.6 },
    { d: 258, lat: -3.1 },
  ]) {
    const pad = new Group();
    const mesh = new Mesh(puddleGeo, puddleMat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.03;
    pad.add(mesh);
    place(pad, spot.d, spot.lat, 0.02, 1, frame);
    wet.add(pad);
  }
  wet.visible = false;
  root.add(wet);

  const people: Person[] = [];
  const shirts = ["#c45c9a", "#FCD116", "#006B3F", "#1d4e89", "#f4efe6"];
  const skins = ["#8d5a3b", "#6b3e2a", "#c48a62", "#4a2c22"];
  (["hawker", "hawker", "cross", "cross", "pickup"] as const).forEach((job, index) => {
    const group = makePerson(bins, shirts[index], skins[index % skins.length]);
    group.visible = false;
    root.add(group);
    people.push({ group, job });
  });

  return {
    root,
    actors,
    hero,
    signals,
    people,
    lampMat,
    glowMat,
    spot,
    bins,
    camReady: false,
    playerDist: PLAYER_START,
    playerSpeed: 0,
    time: 0,
    nextPickup: 6,
    pickup: null,
    wet,
    frame,
    dispose: () => {
      bins.geo.forEach((geo) => geo.dispose());
      bins.mat.forEach((mat) => mat.dispose());
      bins.tex.forEach((tex) => tex.dispose());
    },
  };
}

function weatherPace(sky?: RoadSky) {
  if (!sky) return 1;
  if (sky.flood) return 0.46;
  if (sky.rain) return 0.66;
  if (sky.harmattan) return 0.92;
  return 1;
}

function skyTone(night: boolean, sky?: RoadSky) {
  if (sky?.harmattan && !sky.rain) {
    return night
      ? { bg: "#2a241c", fog: "#3a3228", near: 16, far: 72 }
      : { bg: "#d8c7a4", fog: "#e4d2ae", near: 18, far: 80 };
  }
  if (sky?.rain) {
    return night
      ? { bg: "#0c121c", fog: "#1a2433", near: sky.flood ? 12 : 18, far: sky.flood ? 58 : 82 }
      : { bg: "#6d8496", fog: "#8aa0b0", near: sky.flood ? 14 : 20, far: sky.flood ? 64 : 92 };
  }
  return night
    ? { bg: "#12182c", fog: "#1c2638", near: 28, far: 120 }
    : { bg: "#8ec6ea", fog: "#d5c6aa", near: 34, far: 128 };
}

function gapAhead(car: Actor, actors: Actor[]) {
  let best = Infinity;
  let speed = car.cruise;
  let otherLen = 0;
  for (const other of actors) {
    if (!other.live || other === car || other.lane !== car.lane) continue;
    const delta = (other.dist - car.dist) * car.dir;
    if (delta > 0.3 && delta < best) {
      best = delta;
      speed = other.speed;
      otherLen = other.length;
    }
  }
  return { clear: best - (car.length + otherLen) * 0.5, speed };
}

function recycle(car: Actor, playerDist: number, actors: Actor[]) {
  const span = 22 + Math.random() * 68;
  let dist = playerDist + span;
  for (let n = 0; n < 6; n += 1) {
    const blocked =
      Math.abs(dist - playerDist) < 14 ||
      actors.some((other) => other !== car && other.live && other.lane === car.lane && Math.abs(other.dist - dist) < 14);
    if (!blocked && dist > 12 && dist < ROAD_LENGTH - 12) break;
    dist += 12;
  }
  car.dist = Math.min(ROAD_LENGTH - 12, dist);
  car.speed = car.cruise * 0.55;
  car.hold = -1;
  if (car.kind !== "taxi" && car.kind !== "bus" && car.kind !== "coach" && car.kind !== "trotro" && car.kind !== "keke") {
    const next = PAINTS[Math.floor(Math.random() * PAINTS.length)];
    for (const mesh of car.paint) {
      const mat = mesh.material;
      if (mat instanceof MeshStandardMaterial) mat.color.set(next);
    }
  }
}

function RoadSim({
  worldRef,
  walkerRef,
  nightRef,
  boardingRef,
  slowingRef,
  reduceRef,
  skyRef,
  ride,
  sunRef,
  driverRef,
}: {
  worldRef: { current: World | null };
  walkerRef: { current: Group | null };
  nightRef: { current: boolean };
  boardingRef: { current: boolean };
  slowingRef: { current: boolean };
  reduceRef: { current: boolean };
  skyRef: { current: RoadSky | undefined };
  ride: RideId;
  sunRef: { current: DirectionalLight | null };
  driverRef: { current: Group | null };
}) {
  const { camera, scene } = useThree();
  const boardT = useRef(0);
  const wasBoarding = useRef(false);

  useFrame((_, dt) => {
    const world = worldRef.current;
    if (!world) return;
    const step = reduceRef.current ? 0 : Math.min(0.05, dt);
    const night = nightRef.current;
    const sky = skyRef.current;
    const pace = weatherPace(sky);
    world.wet.visible = Boolean(sky?.rain);
    world.time += step;
    const time = world.time;
    const frame = world.frame;

    world.lampMat.emissiveIntensity = night ? 2.6 : 0.12;
    world.glowMat.opacity = night ? 0.35 : 0;
    if (world.spot) world.spot.intensity = night ? 6 : 0;

    for (let i = 0; i < world.signals.length; i += 1) {
      const phase = phaseAt(time, i);
      const signal = world.signals[i];
      signal.red.emissiveIntensity = phase === "go" ? 0.05 : 2.4;
      signal.green.emissiveIntensity = phase === "go" ? 2.2 : 0.04;
      signal.amber.emissiveIntensity = phase === "slow" ? 2.2 : 0.04;
    }

    const playerLane = LANES[PLAYER_LANE].lat;
    for (const car of world.actors) {
      if (!car.live) continue;
      let limit = approachLimit(car.dist, car.dir, time, car.cruise) * pace;
      if (time < car.hold) limit = 0;
      const ahead = gapAhead(car, world.actors);
      const jam = sky?.flood ? 1.4 : sky?.rain ? 1.2 : 1;
      const minGap = (car.kind === "okada" || car.kind === "keke" ? 3.2 : 6.5) * jam;
      if (ahead.clear < minGap) limit = 0;
      else if (ahead.clear < 16) limit = Math.min(limit, ahead.speed * (ahead.clear / 16));
      const rate = limit < car.speed ? 2.8 : 1.5;
      car.speed += (limit - car.speed) * (1 - Math.exp(-rate * step));
      car.dist += car.speed * step * car.dir;
      const aheadOfPlayer = car.dist - world.playerDist;
      const gone = car.dir > 0 ? aheadOfPlayer > 108 || aheadOfPlayer < -16 : aheadOfPlayer > 112 || aheadOfPlayer < -18;
      if (gone || car.dist < 8 || car.dist > ROAD_LENGTH - 8) recycle(car, world.playerDist, world.actors);
    }

    if (time > world.nextPickup) {
      const car = world.actors.find(
        (item) => item.live && item.dir === 1 && (item.kind === "trotro" || item.kind === "taxi") && item.dist > world.playerDist + 12 && item.dist < world.playerDist + 46,
      );
      if (car) {
        car.hold = time + 2.8;
        world.pickup = car;
        world.nextPickup = time + 14;
      } else world.nextPickup = time + 2;
    }

    const camPos = camera.position;
    for (const car of world.actors) {
      const lat = LANES[car.lane].lat + (car.kind === "okada" ? Math.sin(time * 1.6 + car.dist) * 0.22 : 0);
      const y = surfaceLift(car.dist, lat);
      place(car.group, car.dist, lat, y, car.dir, frame);
      const far = camPos.distanceToSquared(car.group.position) > 45 * 45;
      car.detail.visible = !far;
      if (!far) {
        for (const wheel of car.wheels) wheel.rotation.x -= (car.speed * step) / car.wheelR;
        if (car.mate) car.mate.rotation.y = Math.sin(time * 4 + car.dist) * (car.speed < 3 ? 0.35 : 0.08);
      }
      const braking = car.speed < car.cruise * 0.45;
      car.brake.emissiveIntensity = braking ? 2.8 : night ? 0.7 : 0.2;
      car.head.emissiveIntensity = night ? 2.4 : 0.18;
      const bend = roadBend(car.dist);
      const blink = Math.abs(bend) > 0.005 && Math.sin(time * 8) > 0;
      car.blinkL.emissiveIntensity = blink && bend > 0 ? 2.6 : 0;
      car.blinkR.emissiveIntensity = blink && bend < 0 ? 2.6 : 0;
    }

    const boarding = boardingRef.current && ride !== "trek";
    if (boarding && !wasBoarding.current) boardT.current = 0;
    wasBoarding.current = boarding;
    if (boarding) boardT.current += step;

    let target = 0;
    if (ride === "trek") target = 1.45;
    else if (boarding) target = 0;
    else if (slowingRef.current) target = ride === "train" ? 4 : 2.2;
    else target = (world.hero?.cruise ?? 11.6) * pace;
    if (ride !== "train" && ride !== "trek") {
      target = Math.min(target, approachLimit(world.playerDist, 1, time, target));
      let nearest = Infinity;
      let lead = target;
      const heroLen = world.hero?.length ?? 4;
      for (const car of world.actors) {
        if (car.lane !== PLAYER_LANE || car.dist <= world.playerDist) continue;
        const clear = car.dist - world.playerDist - (heroLen + car.length) * 0.5;
        if (clear < nearest) {
          nearest = clear;
          lead = car.speed;
        }
      }
      if (nearest < 7) target = Math.min(target, Math.max(0, lead * (nearest / 7)));
    }
    const accel = target < world.playerSpeed ? 2.6 : 1.4;
    world.playerSpeed += (target - world.playerSpeed) * (1 - Math.exp(-accel * step));
    world.playerDist = Math.min(ROAD_LENGTH - 40, world.playerDist + world.playerSpeed * step);

    const lat = heroLat(ride) + (ride === "okada" ? Math.sin(time * 1.5) * 0.2 : 0);
    const y = ride === "trek" ? 0.2 : ride === "train" ? 0.16 : surfaceLift(world.playerDist, lat);
    if (world.hero) {
      place(world.hero.group, world.playerDist, lat, y, 1, frame);
      const braking = target + 0.4 < world.playerSpeed || slowingRef.current;
      world.hero.brake.emissiveIntensity = braking ? 3 : night ? 0.75 : 0.2;
      world.hero.head.emissiveIntensity = night ? 2.8 : 0.2;
      const bend = roadBend(world.playerDist);
      const blink = Math.abs(bend) > 0.005 && Math.sin(time * 8) > 0;
      world.hero.blinkL.emissiveIntensity = blink && bend > 0 ? 2.6 : 0;
      world.hero.blinkR.emissiveIntensity = blink && bend < 0 ? 2.6 : 0;
      if (!reduceRef.current) {
        for (const wheel of world.hero.wheels) wheel.rotation.x -= (world.playerSpeed * step) / world.hero.wheelR;
      }
      if (world.hero.mate) world.hero.mate.rotation.y = Math.sin(time * 3.4) * 0.3;
    }

    const walker = walkerRef.current;
    const driver = driverRef.current;
    const driving = ride === "car" && !boarding && Boolean(world.hero);
    if (driver) {
      driver.visible = driving;
      if (driving && world.hero) {
        world.hero.group.updateMatrixWorld();
        const seatY = typeof world.hero.group.userData.seatY === "number" ? world.hero.group.userData.seatY : 0.18;
        _seat.set(-0.28, seatY, -0.04);
        _seat.applyMatrix4(world.hero.group.matrixWorld);
        driver.position.copy(_seat);
        driver.quaternion.copy(world.hero.group.quaternion);
        driver.scale.setScalar(0.46);
      }
    }
    if (walker) {
      const show = ride === "trek" || boarding;
      walker.visible = show;
      if (show) {
        frameAt(world.playerDist, frame);
        const curb = ride === "train" ? -9.4 : 8.7;
        const door = ride === "train" ? RAIL_LAT + 1.3 : lat + 1.05;
        const t = ride === "trek" ? 1 : Math.min(1, boardT.current / 1.15);
        const eased = t * t * (3 - 2 * t);
        const walkLat = curb + (door - curb) * eased;
        walker.position.set(frame.x + frame.rx * walkLat, 0.2 * (1 - eased), frame.z + frame.rz * walkLat);
        walker.rotation.y = Math.atan2(frame.tx, frame.tz);
      }
    }

    const stopped = world.actors.find((car) => car.speed < 1.3 && (time < car.hold || LIGHTS.some((light) => Math.abs(car.dist - light) < 12)));
    for (const person of world.people) {
      if (person.job === "hawker") {
        if (!stopped) {
          person.group.visible = false;
          continue;
        }
        person.group.visible = true;
        const wobble = Math.sin(time * 1.5 + person.group.id) * 2.2;
        const latHawker = MathUtils.clamp(LANES[stopped.lane].lat + wobble, -5.2, 5.2);
        place(person.group, stopped.dist + Math.sin(time * 0.8) * 1.2, latHawker, Math.abs(Math.sin(time * 6)) * 0.04, 1, frame);
      } else if (person.job === "cross") {
        const index = sky?.flood ? -1 : LIGHTS.findIndex((_, i) => phaseAt(time, i) === "cross");
        person.group.visible = index >= 0;
        if (index >= 0) {
          const u = ((time * 0.22) + (person.group.id % 2) * 0.45) % 1;
          place(person.group, LIGHTS[index] + (person.group.id % 2) * 0.7, -5.6 + u * 11.2, Math.abs(Math.sin(time * 6)) * 0.04, 1, frame);
          person.group.rotation.y += Math.PI / 2;
        }
      } else if (world.pickup && time < world.pickup.hold && !sky?.flood) {
        person.group.visible = true;
        world.pickup.group.updateMatrixWorld(true);
        person.group.position.set(world.pickup.width * 0.5 + 0.45, 0, 0.3);
        person.group.position.applyMatrix4(world.pickup.group.matrixWorld);
        person.group.position.y = 0;
        person.group.rotation.y = world.pickup.group.rotation.y;
      } else person.group.visible = false;
      const brolly = person.group.getObjectByName("brolly");
      if (brolly) brolly.visible = Boolean(sky?.rain) && person.group.visible;
    }

    frameAt(world.playerDist, frame);
    const back = ride === "okada" || ride === "trek" ? 9.5 : ride === "train" ? 22 : 18;
    const height = ride === "okada" || ride === "trek" ? 4.4 : ride === "train" ? 8.2 : 7.4;
    const ahead = ride === "trek" ? 10 : ride === "train" ? 30 : 26;
    const shoulder = ride === "trek" ? 0.4 : 3.2;
    const desiredX = frame.x + frame.rx * lat - frame.tx * back + frame.rx * shoulder;
    const desiredZ = frame.z + frame.rz * lat - frame.tz * back + frame.rz * shoulder;
    if (!world.camReady) {
      camera.position.set(desiredX, height, desiredZ);
      world.camReady = true;
    } else {
      const blend = 1 - Math.exp(-3.4 * (reduceRef.current ? 0.016 : dt));
      camera.position.x += (desiredX - camera.position.x) * blend;
      camera.position.y += (height - camera.position.y) * blend;
      camera.position.z += (desiredZ - camera.position.z) * blend;
    }
    const roll = MathUtils.clamp(-roadBend(world.playerDist) * 7, -0.08, 0.08);
    camera.up.set(Math.sin(roll), Math.cos(roll), 0);
    camera.lookAt(frame.x + frame.rx * lat + frame.tx * ahead, 1.25, frame.z + frame.rz * lat + frame.tz * ahead);

    const sun = sunRef.current;
    if (sun) {
      sun.position.set(frame.x + 18, night ? 18 : 26, frame.z + 12);
      sun.target.position.set(frame.x, 0, frame.z);
      if (!sun.target.parent) scene.add(sun.target);
      const tone = skyTone(night, sky);
      sun.intensity = night ? 0.62 : sky?.rain ? 0.55 : sky?.harmattan ? 0.85 : 1.25;
      sun.color.set(sky?.harmattan && !sky.rain ? "#e7d3a4" : night ? "#9bb4d6" : "#fff5e8");
      if (scene.background instanceof Color) scene.background.set(tone.bg);
      if (scene.fog instanceof Fog) {
        scene.fog.color.set(tone.fog);
        scene.fog.near = tone.near;
        scene.fog.far = tone.far;
      }
    }
  });

  return null;
}

export function AccraRoad({
  ride,
  night,
  boarding,
  slowing,
  slogan,
  look,
  sky,
  carId,
}: {
  ride: RideId;
  night: boolean;
  boarding: boolean;
  slowing: boolean;
  slogan: string;
  look: Look;
  sky?: RoadSky;
  carId?: string | null;
}) {
  const budget = useBudget();
  const reduce = useReduce();
  const mobile = budget < 12;
  const worldRef = useRef<World | null>(null);
  const walkerRef = useRef<Group>(null);
  const driverRef = useRef<Group>(null);
  const sunRef = useRef<DirectionalLight>(null);
  const nightRef = useRef(night);
  const boardingRef = useRef(boarding);
  const slowingRef = useRef(slowing);
  const reduceRef = useRef(reduce);
  const skyRef = useRef(sky);
  const [gen, setGen] = useState(0);
  nightRef.current = night;
  boardingRef.current = boarding;
  slowingRef.current = slowing;
  reduceRef.current = reduce;
  skyRef.current = sky;

  useLayoutEffect(() => {
    const world = buildWorld(budget, ride, slogan, !mobile, carId);
    worldRef.current = world;
    setGen((n) => n + 1);
    return () => {
      world.dispose();
      if (worldRef.current === world) worldRef.current = null;
    };
  }, [budget, ride, slogan, mobile, carId]);

  const start = blankFrame();
  frameAt(PLAYER_START, start);

  return (
    <div className="absolute inset-0">
      <Canvas
        shadows={!mobile}
        dpr={mobile ? [1, 1.25] : [1, 1.6]}
        camera={{ position: [start.x, 4.8, start.z + 12], fov: 50, near: 0.2, far: 180 }}
        gl={{ antialias: !mobile, powerPreference: "high-performance", stencil: false }}
        style={{ width: "100%", height: "100%" }}
      >
        <color attach="background" args={[skyTone(night, sky).bg]} />
        <fog attach="fog" args={[skyTone(night, sky).fog, skyTone(night, sky).near, skyTone(night, sky).far]} />
        <hemisphereLight args={[night ? "#243656" : "#d7ecff", night ? "#1a140e" : "#c4a36a", night ? 0.55 : 0.62]} />
        <ambientLight intensity={night ? 0.28 : 0.38} />
        <directionalLight
          ref={sunRef}
          position={[18, 26, 12]}
          intensity={night ? 0.22 : 1.25}
          color={night ? "#9bb4d6" : "#fff5e8"}
          castShadow={!mobile}
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0004}
          shadow-camera-near={1}
          shadow-camera-far={70}
          shadow-camera-left={-22}
          shadow-camera-right={22}
          shadow-camera-top={22}
          shadow-camera-bottom={-22}
        />
        {worldRef.current ? <primitive key={gen} object={worldRef.current.root} /> : null}
        <group ref={walkerRef} visible={false}>
          <Figure
            skin={look.skin}
            shirt={look.cloth}
            pants="#243044"
            hair={look.hair}
            cloth={look.cloth}
            pattern={look.pattern}
            outfit={look.outfit}
            body={look.body}
            pose={ride === "trek" || boarding ? "walk" : "idle"}
            turn={0}
          />
        </group>
        <group ref={driverRef} visible={false}>
          <Figure
            skin={look.skin}
            shirt={look.cloth}
            pants="#243044"
            hair={look.hair}
            cloth={look.cloth}
            pattern={look.pattern}
            outfit={look.outfit}
            body={look.body}
            pose="drive"
            turn={0}
          />
        </group>
        <RoadSim
          worldRef={worldRef}
          walkerRef={walkerRef}
          driverRef={driverRef}
          nightRef={nightRef}
          boardingRef={boardingRef}
          slowingRef={slowingRef}
          reduceRef={reduceRef}
          skyRef={skyRef}
          ride={ride}
          sunRef={sunRef}
        />
        <Tone night={night} sky={sky} />
      </Canvas>
    </div>
  );
}

function Tone({ night, sky }: { night: boolean; sky?: RoadSky }) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  useLayoutEffect(() => {
    const tone = skyTone(night, sky);
    gl.toneMapping = ACESFilmicToneMapping;
    gl.toneMappingExposure = sky?.rain ? 0.92 : sky?.harmattan ? 0.98 : 1.05;
    scene.background = new Color(tone.bg);
    scene.fog = new Fog(tone.fog, tone.near, tone.far);
  }, [gl, scene, night, sky?.rain, sky?.flood, sky?.harmattan]);
  return null;
}
