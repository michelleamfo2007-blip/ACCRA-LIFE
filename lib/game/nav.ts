/** Floor collision and A* for the house (metres) and venues (iso world units). */

export type Pt = { x: number; z: number };

export type Bounds = { minX: number; maxX: number; minZ: number; maxZ: number };

/** Axis-aligned box. `round` makes it a circle inscribed in that box (characters). */
export type Solid = {
  id?: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  round?: boolean;
};

export type SolidIndex = {
  cell: number;
  buckets: Map<string, Solid[]>;
};

const NEIGHBORS: [number, number, number][] = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, Math.SQRT2],
  [1, -1, Math.SQRT2],
  [-1, 1, Math.SQRT2],
  [-1, -1, Math.SQRT2],
];

export function circleSolid(id: string, x: number, z: number, radius: number): Solid {
  return { id, round: true, minX: x - radius, maxX: x + radius, minZ: z - radius, maxZ: z + radius };
}

export function indexSolids(solids: Solid[], cell: number): SolidIndex {
  const buckets = new Map<string, Solid[]>();
  for (const box of solids) {
    const x0 = Math.floor(box.minX / cell);
    const x1 = Math.floor(box.maxX / cell);
    const z0 = Math.floor(box.minZ / cell);
    const z1 = Math.floor(box.maxZ / cell);
    for (let ix = x0; ix <= x1; ix++) {
      for (let iz = z0; iz <= z1; iz++) {
        const key = `${ix},${iz}`;
        const list = buckets.get(key);
        if (list) list.push(box);
        else buckets.set(key, [box]);
      }
    }
  }
  return { cell, buckets };
}

function nearby(index: SolidIndex, x: number, z: number, radius: number) {
  const { cell, buckets } = index;
  const x0 = Math.floor((x - radius) / cell);
  const x1 = Math.floor((x + radius) / cell);
  const z0 = Math.floor((z - radius) / cell);
  const z1 = Math.floor((z + radius) / cell);
  const seen = new Set<Solid>();
  const out: Solid[] = [];
  for (let ix = x0; ix <= x1; ix++) {
    for (let iz = z0; iz <= z1; iz++) {
      const list = buckets.get(`${ix},${iz}`);
      if (!list) continue;
      for (const box of list) {
        if (seen.has(box)) continue;
        seen.add(box);
        out.push(box);
      }
    }
  }
  return out;
}

function hits(x: number, z: number, box: Solid, radius: number) {
  if (box.round) {
    const cx = (box.minX + box.maxX) / 2;
    const cz = (box.minZ + box.maxZ) / 2;
    const reach = (box.maxX - box.minX) / 2 + radius;
    const dx = x - cx;
    const dz = z - cz;
    return dx * dx + dz * dz < reach * reach;
  }
  const cx = Math.max(box.minX, Math.min(x, box.maxX));
  const cz = Math.max(box.minZ, Math.min(z, box.maxZ));
  const dx = x - cx;
  const dz = z - cz;
  return dx * dx + dz * dz < radius * radius;
}

export function blocked(x: number, z: number, index: SolidIndex, radius: number) {
  for (const box of nearby(index, x, z, radius)) {
    if (hits(x, z, box, radius)) return true;
  }
  return false;
}

function inside(x: number, z: number, bounds: Bounds) {
  return x >= bounds.minX && x <= bounds.maxX && z >= bounds.minZ && z <= bounds.maxZ;
}

/** Move toward `to`. If the point is inside a solid, slide along one axis. */
export function slide(from: Pt, to: Pt, index: SolidIndex, radius: number, bounds: Bounds): Pt & { bumped: boolean } {
  const x = Math.min(bounds.maxX, Math.max(bounds.minX, to.x));
  const z = Math.min(bounds.maxZ, Math.max(bounds.minZ, to.z));
  if (!blocked(x, z, index, radius)) return { x, z, bumped: false };
  const xOnly = Math.min(bounds.maxX, Math.max(bounds.minX, to.x));
  if (!blocked(xOnly, from.z, index, radius)) return { x: xOnly, z: from.z, bumped: true };
  const zOnly = Math.min(bounds.maxZ, Math.max(bounds.minZ, to.z));
  if (!blocked(from.x, zOnly, index, radius)) return { x: from.x, z: zOnly, bumped: true };
  return { x: from.x, z: from.z, bumped: true };
}

function nearestFree(x: number, z: number, index: SolidIndex, radius: number, bounds: Bounds) {
  if (inside(x, z, bounds) && !blocked(x, z, index, radius)) return { x, z };
  const step = index.cell;
  let best: Pt | null = null;
  let bestDist = Infinity;
  for (let ring = 1; ring <= 8; ring++) {
    for (let ix = -ring; ix <= ring; ix++) {
      for (let iz = -ring; iz <= ring; iz++) {
        if (Math.max(Math.abs(ix), Math.abs(iz)) !== ring) continue;
        const px = x + ix * step;
        const pz = z + iz * step;
        if (!inside(px, pz, bounds) || blocked(px, pz, index, radius)) continue;
        const dist = (px - x) ** 2 + (pz - z) ** 2;
        if (dist < bestDist) {
          bestDist = dist;
          best = { x: px, z: pz };
        }
      }
    }
    if (best) return best;
  }
  return null;
}

function clearLine(a: Pt, b: Pt, index: SolidIndex, radius: number, bounds: Bounds) {
  const dist = Math.hypot(b.x - a.x, b.z - a.z);
  const steps = Math.max(1, Math.ceil(dist / (index.cell * 0.45)));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = a.x + (b.x - a.x) * t;
    const z = a.z + (b.z - a.z) * t;
    if (!inside(x, z, bounds) || blocked(x, z, index, radius)) return false;
  }
  return true;
}

function pull(points: Pt[], index: SolidIndex, radius: number, bounds: Bounds) {
  if (points.length < 3) return points;
  const out: Pt[] = [points[0]];
  let anchor = 0;
  while (anchor < points.length - 1) {
    let far = anchor + 1;
    for (let i = points.length - 1; i > anchor + 1; i--) {
      if (clearLine(points[anchor], points[i], index, radius, bounds)) {
        far = i;
        break;
      }
    }
    out.push(points[far]);
    anchor = far;
  }
  return out;
}

/**
 * Waypoints from `from` to `to` that stay off solids.
 * Empty when no route exists — the caller stops instead of cutting through.
 */
export function route(from: Pt, to: Pt, index: SolidIndex, radius: number, bounds: Bounds): Pt[] {
  const start = nearestFree(from.x, from.z, index, radius, bounds);
  const goal = nearestFree(to.x, to.z, index, radius, bounds);
  if (!start || !goal) return [];
  if (clearLine(start, goal, index, radius, bounds)) return [goal];

  const cell = index.cell;
  const key = (ix: number, iz: number) => `${ix},${iz}`;
  const parse = (id: string): [number, number] => {
    const cut = id.indexOf(",");
    return [Number(id.slice(0, cut)), Number(id.slice(cut + 1))];
  };
  const cellFree = (ix: number, iz: number) => {
    const x = ix * cell;
    const z = iz * cell;
    return inside(x, z, bounds) && !blocked(x, z, index, radius);
  };
  const snap = (point: Pt): [number, number] | null => {
    const ix = Math.round(point.x / cell);
    const iz = Math.round(point.z / cell);
    if (cellFree(ix, iz)) return [ix, iz];
    for (let ring = 1; ring <= 4; ring++) {
      for (let ox = -ring; ox <= ring; ox++) {
        for (let oz = -ring; oz <= ring; oz++) {
          if (Math.max(Math.abs(ox), Math.abs(oz)) !== ring) continue;
          if (cellFree(ix + ox, iz + oz)) return [ix + ox, iz + oz];
        }
      }
    }
    return null;
  };
  const startCell = snap(start);
  const goalCell = snap(goal);
  if (!startCell || !goalCell) return [];
  const [sx, sz] = startCell;
  const [gx, gz] = goalCell;
  const open: string[] = [key(sx, sz)];
  const gScore = new Map<string, number>([[key(sx, sz), 0]]);
  const came = new Map<string, string>();
  const seen = new Set<string>();

  let guard = 0;
  while (open.length && guard < 2800) {
    guard += 1;
    let bestI = 0;
    let bestF = Infinity;
    for (let i = 0; i < open.length; i++) {
      const [ix, iz] = parse(open[i]);
      const dx = Math.abs(ix - gx);
      const dz = Math.abs(iz - gz);
      const h = Math.min(dx, dz) * Math.SQRT2 + Math.abs(dx - dz);
      const f = (gScore.get(open[i]) ?? Infinity) + h;
      if (f < bestF) {
        bestF = f;
        bestI = i;
      }
    }
    const current = open.splice(bestI, 1)[0];
    if (seen.has(current)) continue;
    seen.add(current);
    const [cx, cz] = parse(current);
    if (cx === gx && cz === gz) {
      const cells: Pt[] = [];
      let walk: string | undefined = current;
      while (walk) {
        const [ix, iz] = parse(walk);
        cells.push({ x: ix * cell, z: iz * cell });
        walk = came.get(walk);
      }
      cells.reverse();
      cells[0] = start;
      cells[cells.length - 1] = goal;
      const slim = pull(cells, index, radius, bounds);
      return slim.slice(1);
    }
    const base = gScore.get(current) ?? Infinity;
    for (const [ox, oz, cost] of NEIGHBORS) {
      const nx = cx + ox;
      const nz = cz + oz;
      if (!cellFree(nx, nz)) continue;
      if (ox !== 0 && oz !== 0 && (!cellFree(cx + ox, cz) || !cellFree(cx, cz + oz))) continue;
      const id = key(nx, nz);
      const next = base + cost;
      if (next >= (gScore.get(id) ?? Infinity)) continue;
      gScore.set(id, next);
      came.set(id, current);
      open.push(id);
    }
  }
  return [];
}

/** True when `who` is standing too close to someone already counted. */
export function crowded(point: Pt, others: Pt[], gap: number) {
  return others.some((other) => {
    const dx = other.x - point.x;
    const dz = other.z - point.z;
    return dx * dx + dz * dz < gap * gap;
  });
}
