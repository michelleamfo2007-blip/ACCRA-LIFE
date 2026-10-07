/** Ground path for the Accra chase camera. Distances are metres. Ghana drives on the right. */

export const ROAD_LENGTH = 300;
export const PLAYER_START = 36;
export const ASPHALT = 6.4;
export const RAIL_LAT = -12.6;

export const LANES = [
  { lat: -4.8, dir: -1 as const },
  { lat: -1.6, dir: -1 as const },
  { lat: 1.6, dir: 1 as const },
  { lat: 4.8, dir: 1 as const },
];

export const PLAYER_LANE = 2;
export const LIGHTS = [92, 188];
export const BUMPS = [70, 146, 230];

export const POTHOLES = [
  { d: 54, x: 2.1, r: 0.95, depth: 0.16 },
  { d: 108, x: -3.4, r: 1.15, depth: 0.2 },
  { d: 163, x: 4.4, r: 0.8, depth: 0.14 },
  { d: 214, x: 1.4, r: 1.25, depth: 0.22 },
  { d: 256, x: -1.8, r: 0.85, depth: 0.15 },
];

export type Sample = {
  d: number;
  x: number;
  z: number;
  tx: number;
  tz: number;
  rx: number;
  rz: number;
  h: number;
};

export function blankFrame(): Sample {
  return { d: 0, x: 0, z: 0, tx: 0, tz: 1, rx: 1, rz: 0, h: 0 };
}

export function roadHeading(dist: number) {
  return Math.sin(dist * 0.0075) * 0.7 + Math.sin(dist * 0.018 + 0.6) * 0.28;
}

export function roadBend(dist: number) {
  return (roadHeading(dist + 4) - roadHeading(dist - 4)) / 8;
}

let cache: Sample[] | null = null;

export function roadSamples() {
  if (cache) return cache;
  const samples: Sample[] = [];
  let x = 0;
  let z = 0;
  for (let d = 0; d <= ROAD_LENGTH; d += 1) {
    const h = roadHeading(d);
    const tx = Math.sin(h);
    const tz = Math.cos(h);
    samples.push({ d, x, z, tx, tz, rx: tz, rz: -tx, h });
    x += tx;
    z += tz;
  }
  cache = samples;
  return samples;
}

export function frameAt(dist: number, out: Sample) {
  const samples = roadSamples();
  const clamped = Math.max(0, Math.min(ROAD_LENGTH - 0.001, dist));
  const i = Math.floor(clamped);
  const t = clamped - i;
  const a = samples[i];
  const b = samples[Math.min(samples.length - 1, i + 1)];
  out.d = clamped;
  out.x = a.x + (b.x - a.x) * t;
  out.z = a.z + (b.z - a.z) * t;
  out.h = roadHeading(clamped);
  out.tx = Math.sin(out.h);
  out.tz = Math.cos(out.h);
  out.rx = out.tz;
  out.rz = -out.tx;
  return out;
}

/** Rise over a speed bump, dip into a pothole. Zero on clear asphalt. */
export function surfaceLift(dist: number, lat: number) {
  let y = 0;
  for (const bump of BUMPS) {
    const dd = Math.abs(dist - bump);
    if (dd < 0.55 && Math.abs(lat) < 5.8) y = Math.max(y, 0.1 * Math.cos((dd / 0.55) * Math.PI * 0.5));
  }
  for (const hole of POTHOLES) {
    const n = Math.hypot(dist - hole.d, lat - hole.x) / hole.r;
    if (n < 1) y -= hole.depth * 0.5 * (1 - n) ** 2;
  }
  return y;
}
