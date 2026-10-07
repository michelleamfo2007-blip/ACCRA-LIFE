"use client";

import { useMemo } from "react";
import { CanvasTexture, DoubleSide, ExtrudeGeometry, MeshStandardMaterial, RepeatWrapping, Shape } from "three";
import { PlacedModel } from "@/components/game/kit-mesh";

function mat(color: string, rough = 0.72) {
  return <meshStandardMaterial color={color} roughness={rough} />;
}

export function StandingFan() {
  return (
    <group>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.18, 0.04, 16]} />
        {mat("#d5dde6")}
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.025, 0.03, 1.02, 10]} />
        {mat("#b7c3ce", 0.45)}
      </mesh>
      <group position={[0, 1.02, 0.02]}>
        <PlacedModel file="furniture/ceilingFan.glb" span={0.62} />
      </group>
    </group>
  );
}

export function BathBucket({ color = "#3d7ea6" }: { color?: string }) {
  return (
    <group>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.16, 0.12, 0.24, 18]} />
        {mat(color)}
      </mesh>
      <mesh position={[0, 0.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.11, 0.012, 8, 18, Math.PI]} />
        {mat("#d7e2ea", 0.4)}
      </mesh>
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.2, 16]} />
        <meshBasicMaterial color="#1a1814" transparent opacity={0.16} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function BowlAndPitcher() {
  return (
    <group>
      <BathBucket />
      <mesh position={[0.22, 0.1, 0.08]}>
        <cylinderGeometry args={[0.07, 0.05, 0.08, 14]} />
        {mat("#c4563a")}
      </mesh>
    </group>
  );
}

function CurtainPanel({ color, flip }: { color: string; flip?: boolean }) {
  const geometry = useMemo(() => {
    const shape = new Shape();
    shape.moveTo(0, 0);
    shape.lineTo(0.28, 0);
    for (let step = 1; step <= 10; step += 1) {
      const y = (step / 10) * 1.15;
      const x = 0.26 + Math.sin(step * 1.4) * 0.045;
      shape.lineTo(x, y);
    }
    shape.lineTo(0.04, 1.18);
    shape.lineTo(0, 1.08);
    return new ExtrudeGeometry(shape, { depth: 0.025, bevelEnabled: false, curveSegments: 2 });
  }, []);
  return (
    <mesh geometry={geometry} position={[flip ? 0.02 : -0.3, 0.06, 0]} scale={[flip ? -1 : 1, 1, 1]}>
      <meshStandardMaterial color={color} roughness={0.8} side={DoubleSide} />
    </mesh>
  );
}

export function SilkCurtains({ color = "#e7c85a" }: { color?: string }) {
  return (
    <group position={[0, 0.28, 0]} scale={[1.85, 1, 1]}>
      <mesh position={[0, 1.26, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.015, 0.95, 8]} />
        {mat("#8a623c", 0.5)}
      </mesh>
      <CurtainPanel color={color} />
      <CurtainPanel color="#f3e2b0" flip />
    </group>
  );
}

export function Aquarium() {
  return (
    <group>
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[0.72, 0.08, 0.4]} />
        {mat("#1c1c1c")}
      </mesh>
      <mesh position={[0, 0.48, 0]}>
        <boxGeometry args={[0.66, 0.52, 0.34]} />
        <meshStandardMaterial color="#d7eef8" transparent opacity={0.28} roughness={0.05} />
      </mesh>
      <mesh position={[0, 0.38, 0]}>
        <boxGeometry args={[0.58, 0.28, 0.26]} />
        <meshStandardMaterial color="#2f6f9a" transparent opacity={0.55} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.26, 0]}>
        <boxGeometry args={[0.58, 0.04, 0.26]} />
        {mat("#c4a46a")}
      </mesh>
      <mesh position={[-0.12, 0.4, 0.02]} scale={[1.4, 0.55, 0.4]}>
        <sphereGeometry args={[0.06, 10, 8]} />
        {mat("#e07a3d")}
      </mesh>
      <mesh position={[0.14, 0.46, -0.02]} scale={[1.2, 0.5, 0.35]}>
        <sphereGeometry args={[0.045, 10, 8]} />
        {mat("#FCD116")}
      </mesh>
      <mesh position={[0, 0.76, 0]}>
        <boxGeometry args={[0.68, 0.04, 0.36]} />
        {mat("#243044")}
      </mesh>
    </group>
  );
}

export function GoldLion() {
  return (
    <group>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.18, 0.2, 0.14, 8]} />
        {mat("#8a623c", 0.55)}
      </mesh>
      <mesh position={[0, 0.28, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.1, 0.28, 4, 10]} />
        {mat("#e0b04a", 0.4)}
      </mesh>
      {[-0.1, 0.1].map((x) =>
        [-0.1, 0.12].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.16, z]}>
            <cylinderGeometry args={[0.03, 0.035, 0.16, 8]} />
            {mat("#e0b04a", 0.4)}
          </mesh>
        )),
      )}
      <mesh position={[0.22, 0.4, 0]}>
        <sphereGeometry args={[0.12, 14, 12]} />
        {mat("#c4a46a", 0.35)}
      </mesh>
      <mesh position={[0.22, 0.4, 0]}>
        <sphereGeometry args={[0.16, 12, 10]} />
        <meshStandardMaterial color="#f0c14b" roughness={0.45} transparent opacity={0.55} />
      </mesh>
      <mesh position={[0.32, 0.38, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.04, 0.1, 8]} />
        {mat("#8a623c", 0.4)}
      </mesh>
      <mesh position={[-0.22, 0.32, 0]} rotation={[0, 0, 0.6]}>
        <cylinderGeometry args={[0.015, 0.02, 0.28, 6]} />
        {mat("#e0b04a", 0.4)}
      </mesh>
    </group>
  );
}

export function CompoundDog() {
  return (
    <group>
      <mesh position={[0, 0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.1, 0.28, 4, 10]} />
        {mat("#c4894f")}
      </mesh>
      {[-0.12, 0.12].map((x) =>
        [-0.08, 0.1].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.1, z]}>
            <cylinderGeometry args={[0.03, 0.035, 0.16, 8]} />
            {mat("#a86b32")}
          </mesh>
        )),
      )}
      <mesh position={[0.24, 0.32, 0]}>
        <sphereGeometry args={[0.1, 14, 12]} />
        {mat("#c4894f")}
      </mesh>
      <mesh position={[0.32, 0.3, 0]} scale={[1.3, 0.7, 0.7]}>
        <sphereGeometry args={[0.05, 10, 8]} />
        {mat("#e7c9a0")}
      </mesh>
      <mesh position={[0.2, 0.4, 0.06]} rotation={[0, 0, 0.4]}>
        <sphereGeometry args={[0.045, 8, 6]} />
        {mat("#8a623c")}
      </mesh>
      <mesh position={[0.2, 0.4, -0.06]} rotation={[0, 0, 0.4]}>
        <sphereGeometry args={[0.045, 8, 6]} />
        {mat("#8a623c")}
      </mesh>
      <mesh position={[-0.24, 0.28, 0]} rotation={[0, 0, 0.8]}>
        <capsuleGeometry args={[0.025, 0.12, 3, 6]} />
        {mat("#a86b32")}
      </mesh>
      <mesh position={[0.34, 0.32, 0.03]}>
        <sphereGeometry args={[0.012, 6, 6]} />
        <meshStandardMaterial color="#121212" />
      </mesh>
    </group>
  );
}

export function HouseCat() {
  return (
    <group>
      <mesh position={[0, 0.16, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.07, 0.2, 4, 10]} />
        {mat("#5c6570")}
      </mesh>
      {[-0.08, 0.08].map((x) =>
        [-0.05, 0.07].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.07, z]}>
            <cylinderGeometry args={[0.018, 0.02, 0.1, 6]} />
            {mat("#4a525c")}
          </mesh>
        )),
      )}
      <mesh position={[0.16, 0.24, 0]}>
        <sphereGeometry args={[0.075, 12, 10]} />
        {mat("#5c6570")}
      </mesh>
      <mesh position={[0.16, 0.31, 0.035]} rotation={[0, 0, 0.2]}>
        <coneGeometry args={[0.025, 0.07, 6]} />
        {mat("#3d4450")}
      </mesh>
      <mesh position={[0.16, 0.31, -0.035]} rotation={[0, 0, 0.2]}>
        <coneGeometry args={[0.025, 0.07, 6]} />
        {mat("#3d4450")}
      </mesh>
      <mesh position={[-0.16, 0.28, 0]} rotation={[0.4, 0, 1.2]}>
        <capsuleGeometry args={[0.015, 0.16, 3, 6]} />
        {mat("#5c6570")}
      </mesh>
      <mesh position={[0.21, 0.24, 0]}>
        <sphereGeometry args={[0.012, 6, 6]} />
        {mat("#e7a0b0")}
      </mesh>
    </group>
  );
}

export function AfricanGrey() {
  return (
    <group>
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.02, 0.025, 0.7, 8]} />
        {mat("#6b4428", 0.6)}
      </mesh>
      <mesh position={[0, 0.72, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.015, 0.28, 8]} />
        {mat("#6b4428", 0.6)}
      </mesh>
      <mesh position={[0.02, 0.84, 0]}>
        <sphereGeometry args={[0.09, 12, 10]} />
        {mat("#c5ced6")}
      </mesh>
      <mesh position={[0.08, 0.92, 0]}>
        <sphereGeometry args={[0.055, 10, 8]} />
        {mat("#f4f7fa")}
      </mesh>
      <mesh position={[0.13, 0.9, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.02, 0.07, 6]} />
        {mat("#1c1c1c")}
      </mesh>
      <mesh position={[-0.02, 0.82, 0.06]} rotation={[0.2, 0, 0.4]}>
        <sphereGeometry args={[0.05, 8, 6]} />
        {mat("#9aa3ad")}
      </mesh>
      <mesh position={[-0.04, 0.78, -0.02]} rotation={[0.6, 0, -0.4]}>
        <boxGeometry args={[0.04, 0.16, 0.08]} />
        {mat("#c4563a")}
      </mesh>
    </group>
  );
}

export function StuddedThrone() {
  return (
    <group>
      <PlacedModel file="furniture/loungeChair.glb" tall={0.95} />
      <mesh position={[0, 1.05, -0.05]}>
        <boxGeometry args={[0.16, 0.08, 0.08]} />
        {mat("#e0b04a", 0.35)}
      </mesh>
    </group>
  );
}

export function OldPainting() {
  return (
    <group position={[0, 0.85, 0]}>
      <mesh>
        <boxGeometry args={[0.85, 0.68, 0.05]} />
        {mat("#f4efe6")}
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[0.68, 0.5, 0.02]} />
        {mat("#8a623c")}
      </mesh>
      <mesh position={[-0.1, 0.05, 0.045]}>
        <boxGeometry args={[0.22, 0.16, 0.01]} />
        {mat("#FCD116")}
      </mesh>
      <mesh position={[0.12, -0.06, 0.045]}>
        <boxGeometry args={[0.18, 0.22, 0.01]} />
        {mat("#1f8a70")}
      </mesh>
    </group>
  );
}

export function BullionVault() {
  return (
    <group>
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[0.7, 1.05, 0.45]} />
        {mat("#4a4e55", 0.45)}
      </mesh>
      <mesh position={[0, 0.58, 0.24]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.04, 20]} />
        {mat("#2c3138", 0.35)}
      </mesh>
      <mesh position={[0, 0.58, 0.27]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.1, 0.018, 8, 16]} />
        {mat("#e0b04a", 0.35)}
      </mesh>
    </group>
  );
}

export function SolarKit() {
  return (
    <group>
      <mesh position={[-0.15, 0.45, 0]} rotation={[0.5, 0, 0]}>
        <boxGeometry args={[0.7, 0.02, 0.42]} />
        {mat("#1d4e89", 0.35)}
      </mesh>
      <mesh position={[0.28, 0.22, 0]}>
        <boxGeometry args={[0.22, 0.36, 0.18]} />
        {mat("#f4f7fa")}
      </mesh>
    </group>
  );
}

export function GuitarProp({ color = "#e7c85a" }: { color?: string }) {
  return (
    <group rotation={[0, 0, 0.15]}>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.02, 0.025, 0.7, 8]} />
        {mat("#5c4030", 0.55)}
      </mesh>
      <mesh position={[0, 0.22, 0]} scale={[1, 1.15, 0.35]}>
        <sphereGeometry args={[0.14, 14, 10]} />
        {mat(color, 0.5)}
      </mesh>
      <mesh position={[0, 0.22, 0.04]}>
        <circleGeometry args={[0.04, 10]} />
        {mat("#5c4030")}
      </mesh>
    </group>
  );
}

export function WallAircon() {
  return (
    <group>
      <mesh>
        <boxGeometry args={[1.25, 0.34, 0.22]} />
        {mat("#f4f7fa", 0.4)}
      </mesh>
      <mesh position={[0, -0.04, 0.08]}>
        <boxGeometry args={[1.05, 0.08, 0.08]} />
        {mat("#2c3338", 0.45)}
      </mesh>
      <mesh position={[0.42, 0.06, 0.1]}>
        <boxGeometry args={[0.1, 0.08, 0.03]} />
        {mat("#7eb6e8", 0.3)}
      </mesh>
    </group>
  );
}

export function KenteCloth() {
  const stripes = ["#CE1126", "#FCD116", "#006B3F", "#FCD116", "#CE1126", "#006B3F"];
  return (
    <group>
      <mesh position={[0, 0.42, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.015, 0.85, 8]} />
        {mat("#5c4030", 0.55)}
      </mesh>
      {stripes.map((color, index) => (
        <mesh key={color + index} position={[-0.32 + index * 0.13, 0, 0.02]}>
          <boxGeometry args={[0.12, 0.78, 0.02]} />
          {mat(color, 0.8)}
        </mesh>
      ))}
    </group>
  );
}

function useNetCloth() {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (!ctx) return new MeshStandardMaterial({ color: "#e7f2ea", transparent: true, opacity: 0.35 });
    ctx.clearRect(0, 0, 64, 64);
    ctx.strokeStyle = "rgba(236, 246, 240, 0.95)";
    ctx.lineWidth = 2;
    for (let line = 0; line <= 64; line += 8) {
      ctx.beginPath();
      ctx.moveTo(line, 0);
      ctx.lineTo(line, 64);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, line);
      ctx.lineTo(64, line);
      ctx.stroke();
    }
    const map = new CanvasTexture(canvas);
    map.wrapS = RepeatWrapping;
    map.wrapT = RepeatWrapping;
    map.repeat.set(6, 4);
    return new MeshStandardMaterial({ map, transparent: true, opacity: 0.95, side: DoubleSide, depthWrite: false, roughness: 1 });
  }, []);
}

export function MosquitoNet() {
  const cloth = useNetCloth();
  const posts: [number, number][] = [
    [-0.86, -1.02],
    [0.86, -1.02],
    [-0.86, 1.02],
    [0.86, 1.02],
  ];
  return (
    <group>
      {posts.map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.78, z]}>
          <cylinderGeometry args={[0.012, 0.012, 1.5, 6]} />
          {mat("#f7f4ef", 0.7)}
        </mesh>
      ))}
      <mesh position={[0, 1.52, 0]} material={cloth} raycast={() => null}>
        <boxGeometry args={[1.72, 0.01, 2.04]} />
      </mesh>
      <mesh position={[0, 0.8, 1.02]} material={cloth} raycast={() => null}>
        <boxGeometry args={[1.72, 1.4, 0.01]} />
      </mesh>
      <mesh position={[0, 0.8, -1.02]} material={cloth} raycast={() => null}>
        <boxGeometry args={[1.72, 1.4, 0.01]} />
      </mesh>
      <mesh position={[-0.86, 0.8, 0]} material={cloth} raycast={() => null}>
        <boxGeometry args={[0.01, 1.4, 2.04]} />
      </mesh>
      <mesh position={[0.86, 0.8, 0]} material={cloth} raycast={() => null}>
        <boxGeometry args={[0.01, 1.4, 2.04]} />
      </mesh>
    </group>
  );
}

export function BedPillow() {
  return (
    <group>
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[0.5, 0.1, 0.3]} />
        {mat("#f7f4ef", 0.9)}
      </mesh>
      <mesh position={[0, 0.105, 0]}>
        <boxGeometry args={[0.42, 0.02, 0.02]} />
        {mat("#e4d8c8", 0.8)}
      </mesh>
    </group>
  );
}

export function CookingPot() {
  return (
    <group>
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.16, 0.14, 0.16, 16]} />
        {mat("#8d5a32", 0.45)}
      </mesh>
      <mesh position={[0, 0.23, 0]}>
        <cylinderGeometry args={[0.17, 0.17, 0.03, 16]} />
        {mat("#c4a46a", 0.4)}
      </mesh>
      <mesh position={[0, 0.27, 0]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        {mat("#5c4030")}
      </mesh>
      <mesh position={[-0.2, 0.16, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.05, 0.012, 6, 10, Math.PI]} />
        {mat("#5c4030", 0.4)}
      </mesh>
      <mesh position={[0.2, 0.16, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.05, 0.012, 6, 10, Math.PI]} />
        {mat("#5c4030", 0.4)}
      </mesh>
    </group>
  );
}

export function GasCooker({ simple }: { simple?: boolean }) {
  const rings: [number, number][] = simple ? [[0, 0]] : [[-0.12, -0.08], [0.12, -0.08], [-0.12, 0.08], [0.12, 0.08]];
  return (
    <group>
      <mesh position={[0, 0.28, 0]}>
        <boxGeometry args={[simple ? 0.42 : 0.62, 0.5, simple ? 0.42 : 0.55]} />
        {mat(simple ? "#3d4a3a" : "#f4f7fa", 0.5)}
      </mesh>
      <mesh position={[0, 0.54, 0]}>
        <boxGeometry args={[simple ? 0.38 : 0.56, 0.03, simple ? 0.36 : 0.48]} />
        {mat("#1c1c1c", 0.4)}
      </mesh>
      {rings.map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.57, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[simple ? 0.08 : 0.06, 0.012, 6, 12]} />
          {mat("#2c3138", 0.35)}
        </mesh>
      ))}
    </group>
  );
}

export function KitchenSink() {
  return (
    <group>
      <mesh position={[0, 0.32, 0]}>
        <boxGeometry args={[0.7, 0.58, 0.48]} />
        {mat("#e7c9a0", 0.7)}
      </mesh>
      <mesh position={[0, 0.64, 0]}>
        <cylinderGeometry args={[0.16, 0.14, 0.08, 16]} />
        {mat("#d5dde3", 0.35)}
      </mesh>
      <mesh position={[0, 0.78, -0.08]}>
        <cylinderGeometry args={[0.015, 0.015, 0.22, 8]} />
        {mat("#9aa7b5", 0.35)}
      </mesh>
      <mesh position={[0.06, 0.86, -0.02]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, 0.12, 8]} />
        {mat("#9aa7b5", 0.35)}
      </mesh>
    </group>
  );
}

export function KitchenCounter() {
  return (
    <group>
      <mesh position={[0, 0.32, 0]}>
        <boxGeometry args={[0.85, 0.58, 0.48]} />
        {mat("#c4894f", 0.7)}
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <boxGeometry args={[0.9, 0.06, 0.52]} />
        {mat("#e7c9a0", 0.6)}
      </mesh>
      <mesh position={[-0.18, 0.32, 0.25]}>
        <boxGeometry args={[0.28, 0.4, 0.02]} />
        {mat("#f4efe6", 0.75)}
      </mesh>
      <mesh position={[0.18, 0.32, 0.25]}>
        <boxGeometry args={[0.28, 0.4, 0.02]} />
        {mat("#f4efe6", 0.75)}
      </mesh>
    </group>
  );
}

export function LuxuryTv({ wide }: { wide?: boolean }) {
  const w = wide ? 1.55 : 1.05;
  const h = wide ? 0.9 : 0.64;
  return (
    <group>
      <mesh position={[0, 0.16, 0]}>
        <boxGeometry args={[w * 0.45, 0.08, 0.28]} />
        {mat("#1c1c1c", 0.5)}
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <boxGeometry args={[0.08, 0.22, 0.08]} />
        {mat("#c4a46a", 0.4)}
      </mesh>
      <mesh position={[0, 0.28 + h / 2, 0]}>
        <boxGeometry args={[w + 0.08, h + 0.08, 0.06]} />
        {mat(wide ? "#c4a46a" : "#2c3338", 0.4)}
      </mesh>
      <mesh position={[0, 0.28 + h / 2, 0.04]}>
        <boxGeometry args={[w - 0.06, h - 0.06, 0.02]} />
        <meshStandardMaterial color="#16324f" emissive="#1d4e89" emissiveIntensity={0.35} roughness={0.25} />
      </mesh>
    </group>
  );
}

export function TransistorRadio() {
  return (
    <group>
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[0.56, 0.2, 0.2]} />
        {mat("#c4894f", 0.65)}
      </mesh>
      <mesh position={[0, 0.12, 0.08]}>
        <boxGeometry args={[0.48, 0.14, 0.03]} />
        {mat("#f3e2b0", 0.75)}
      </mesh>
      <mesh position={[-0.1, 0.24, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.04, 16]} />
        {mat("#1c2430")}
      </mesh>
      <mesh position={[-0.1, 0.26, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.02, 12]} />
        {mat("#4d5b70")}
      </mesh>
      <mesh position={[0.12, 0.24, 0.02]}>
        <cylinderGeometry args={[0.022, 0.022, 0.04, 10]} />
        {mat("#e7c85a", 0.35)}
      </mesh>
      <mesh position={[0.2, 0.42, 0]} rotation={[0, 0, 0.2]}>
        <cylinderGeometry args={[0.012, 0.012, 0.42, 6]} />
        {mat("#d7dde4", 0.4)}
      </mesh>
      <mesh position={[0, 0.24, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.07, 0.01, 6, 10, Math.PI]} />
        {mat("#5c4030", 0.5)}
      </mesh>
    </group>
  );
}

export function WeightRack() {
  return (
    <group>
      <mesh position={[0, 0.28, 0]}>
        <boxGeometry args={[0.55, 0.04, 0.28]} />
        {mat("#1c1c1c")}
      </mesh>
      {[-0.16, 0.16].map((x) => (
        <group key={x} position={[x, 0.36, 0]} rotation={[0, 0, Math.PI / 2]}>
          <mesh>
            <cylinderGeometry args={[0.02, 0.02, 0.28, 8]} />
            {mat("#9aa3ad", 0.4)}
          </mesh>
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.04, 12]} />
            {mat("#c4563a")}
          </mesh>
          <mesh position={[0, -0.12, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.04, 12]} />
            {mat("#c4563a")}
          </mesh>
        </group>
      ))}
    </group>
  );
}
