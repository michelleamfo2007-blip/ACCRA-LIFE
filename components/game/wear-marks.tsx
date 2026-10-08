"use client";

import { materialOf, type Cond } from "@/lib/game/wear";

const RANK: Record<Cond, number> = { new: 0, like: 1, good: 2, fair: 3, poor: 4, broken: 5 };

/** Scratches, stains, rust, cracks, and dust laid over a piece. */
export function WearMarks({ cond, dust, kind, id }: { cond: Cond; dust: number; kind: string; id: string }) {
  const step = RANK[cond];
  if (step === 0 && dust < 2) return null;
  const mat = materialOf(kind, id);
  const stain = mat === "fabric" || mat === "textile" ? "#8a5a3a" : mat === "metal" || mat === "electric" ? "#8a4b28" : mat === "plant" ? "#6b4a22" : "#5c4030";
  return (
    <group>
      {step > 0
        ? Array.from({ length: Math.min(4, step) }, (_, index) => (
            <mesh key={index} position={[(index - 1) * 0.12, 0.42 + index * 0.02, 0.08]} rotation={[0.4, index * 0.6, 0.4]}>
              <boxGeometry args={[0.22, 0.012, 0.02]} />
              <meshStandardMaterial color={stain} roughness={0.85} transparent opacity={0.35 + step * 0.08} />
            </mesh>
          ))
        : null}
      {step >= 3 ? (
        <mesh position={[0.16, 0.36, 0.12]} rotation={[-0.6, 0.2, 0]}>
          <boxGeometry args={[0.16, 0.01, 0.1]} />
          <meshStandardMaterial color={mat === "glass" ? "#d5dde6" : "#c4a46a"} transparent opacity={0.55} />
        </mesh>
      ) : null}
      {step >= 4 && mat === "plant" ? (
        <mesh position={[0.1, 0.55, 0]}>
          <sphereGeometry args={[0.06, 8, 6]} />
          <meshStandardMaterial color="#8a5a2a" />
        </mesh>
      ) : null}
      {step >= 5 ? (
        <mesh position={[-0.12, 0.5, 0.05]} rotation={[0, 0, 0.5]}>
          <boxGeometry args={[0.28, 0.015, 0.015]} />
          <meshStandardMaterial color="#2a241c" />
        </mesh>
      ) : null}
      {dust >= 2 ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <circleGeometry args={[0.34 + dust * 0.02, 16]} />
          <meshBasicMaterial color="#c8c2b4" transparent opacity={0.08 + dust * 0.03} depthWrite={false} />
        </mesh>
      ) : null}
      {dust >= 6 ? (
        <mesh position={[0.2, 0.7, 0]} rotation={[0.2, 0.4, 0.8]}>
          <boxGeometry args={[0.18, 0.004, 0.004]} />
          <meshBasicMaterial color="#f4f1ea" transparent opacity={0.7} />
        </mesh>
      ) : null}
    </group>
  );
}
