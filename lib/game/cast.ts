/** One clip map for every place. Clips live on the Quaternius GLBs in public/models/cast. */

export type CastPose = "idle" | "walk" | "run" | "act" | "sit" | "drive" | "dance" | "sleep" | "faint" | "drink";

export type CastBody = "woman" | "man";

const WOMEN = ["woman-casual.glb", "woman.glb", "woman-tank.glb", "woman-dress.glb"];
const MEN = ["man-suit.glb", "man.glb", "man-casual.glb", "man-sleeves.glb"];

export function hashCast(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Eight rigs, reused. Skin, cloth, height, and build make each person look different. */
export function castUrl(body: CastBody, seed: string) {
  const list = body === "man" ? MEN : WOMEN;
  return `/models/cast/${list[hashCast(seed) % list.length]}`;
}

export function castStature(seed: string, height?: string, build?: string) {
  const h = hashCast(seed);
  const y = height === "short" ? 0.9 : height === "tall" ? 1.08 : 0.96 + (h % 9) / 100;
  const xz = build === "slim" ? 0.9 : build === "heavy" ? 1.12 : build === "athletic" ? 1.04 : 0.96 + ((h >> 6) % 8) / 100;
  return { y, xz };
}

/** Walk and run always win. A role only picks the clip while the person is standing still. */
export function clipFor(pose: string, role?: string): { name: string; once: boolean } {
  if (pose === "run") return { name: "Run", once: false };
  if (pose === "walk") return { name: "Walk", once: false };
  if (pose === "dance" || role === "dj" || role === "dancer" || role === "hype") return { name: "Clapping", once: false };
  if (pose === "faint" || role === "faint") return { name: "Death", once: true };
  if (pose === "sit" || pose === "sleep" || pose === "drive" || pose === "drink") return { name: "Sitting", once: false };
  if (role === "fight") return { name: "Punch", once: true };
  return { name: "Idle", once: false };
}
