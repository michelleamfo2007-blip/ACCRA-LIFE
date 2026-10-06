/** Accra city-board road grid (world coords match CityBoard 2000×1400). */

export const ROADS_X = [120, 440, 780, 1120, 1460, 1840];
export const ROADS_Y = [140, 380, 620, 880, 1160];

export type Point = { x: number; y: number };

export function nearestRoadX(x: number) {
  return ROADS_X.reduce((best, road) => (Math.abs(road - x) < Math.abs(best - x) ? road : best), ROADS_X[0]);
}

export function nearestRoadY(y: number) {
  return ROADS_Y.reduce((best, road) => (Math.abs(road - y) < Math.abs(best - y) ? road : best), ROADS_Y[0]);
}

/** Snap a place pin onto the nearest intersection. */
export function snapToRoad(point: Point): Point {
  return { x: nearestRoadX(point.x), y: nearestRoadY(point.y) };
}

/**
 * Manhattan path along the road grid: go to nearest V road, travel to target Y
 * on a shared corridor, then to destination X — always on asphalt.
 */
export function roadPath(from: Point, to: Point): Point[] {
  const a = snapToRoad(from);
  const b = snapToRoad(to);
  if (a.x === b.x && a.y === b.y) return [a];
  const midY = nearestRoadY((a.y + b.y) / 2);
  const via: Point[] = [a];
  if (a.y !== midY) via.push({ x: a.x, y: midY });
  if (a.x !== b.x) via.push({ x: b.x, y: midY });
  if (midY !== b.y) via.push({ x: b.x, y: b.y });
  if (via[via.length - 1].x !== b.x || via[via.length - 1].y !== b.y) via.push(b);
  return dedupe(via);
}

function dedupe(points: Point[]) {
  const out: Point[] = [];
  for (const point of points) {
    const last = out[out.length - 1];
    if (last && last.x === point.x && last.y === point.y) continue;
    out.push(point);
  }
  return out;
}

export function pathLength(path: Point[]) {
  let total = 0;
  for (let i = 1; i < path.length; i += 1) {
    total += Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
  }
  return total;
}

/** Position along a polyline at progress 0–1. */
export function pointOnPath(path: Point[], progress: number): Point {
  if (path.length === 0) return { x: 0, y: 0 };
  if (path.length === 1 || progress <= 0) return path[0];
  if (progress >= 1) return path[path.length - 1];
  const total = pathLength(path) || 1;
  let left = total * progress;
  for (let i = 1; i < path.length; i += 1) {
    const seg = Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
    if (left <= seg || i === path.length - 1) {
      const t = seg ? left / seg : 1;
      return {
        x: path[i - 1].x + (path[i].x - path[i - 1].x) * t,
        y: path[i - 1].y + (path[i].y - path[i - 1].y) * t,
      };
    }
    left -= seg;
  }
  return path[path.length - 1];
}

/** Rush-hour factor: longer travel during Accra peaks. */
export function trafficFactor(hour: number) {
  if ((hour >= 6 && hour < 9) || (hour >= 17 && hour < 20)) return 1.55;
  if (hour >= 12 && hour < 14) return 1.2;
  return 1;
}
