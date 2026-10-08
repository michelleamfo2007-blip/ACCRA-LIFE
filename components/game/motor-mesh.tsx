"use client";

import { useMemo } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import { carDust, carOf } from "@/lib/game/garage";
import type { CarState } from "@/lib/game/world";

function plateMap(text: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 72;
  const pen = canvas.getContext("2d");
  if (!pen) return null;
  pen.fillStyle = "#e7b423";
  pen.fillRect(0, 0, 256, 72);
  pen.strokeStyle = "#121212";
  pen.lineWidth = 6;
  pen.strokeRect(4, 4, 248, 64);
  pen.fillStyle = "#121212";
  pen.font = "700 36px sans-serif";
  pen.textAlign = "center";
  pen.textBaseline = "middle";
  pen.fillText((text || "GR").slice(0, 8), 128, 38);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function MotorMesh({ motor, minutes, indoors }: { motor: CarState; minutes: number; indoors: boolean }) {
  const plan = carOf(motor.id);
  const suv = Boolean(plan?.suv);
  const scale = plan?.scale ?? 1;
  const paint = motor.color || plan?.paint || "#2a3344";
  const dust = carDust(motor, minutes, indoors);
  const hurt = (motor.condition ?? 100) < 45 || motor.broken;
  const plate = useMemo(() => plateMap(motor.plate || plan?.short || "GR"), [motor.plate, plan?.short]);
  const glass = motor.style && motor.style >= 4 ? "#1a2430" : "#9ec4d6";
  const length = (suv ? 2.15 : 1.9) * scale;
  const width = (suv ? 0.92 : 0.82) * scale;
  const bodyH = suv ? 0.42 : 0.32;
  const y = 0.28;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[length * 0.55, 20]} />
        <meshBasicMaterial color="#1a1814" transparent opacity={0.28} depthWrite={false} />
      </mesh>
      <mesh position={[0, y, 0]} castShadow>
        <boxGeometry args={[width, bodyH, length]} />
        <meshPhysicalMaterial color={paint} metalness={0.45} roughness={0.32 + dust * 0.45} clearcoat={dust > 0.45 ? 0.05 : 0.65} clearcoatRoughness={0.28} />
      </mesh>
      <mesh position={[0, y + bodyH * 0.72, -length * 0.06]}>
        <boxGeometry args={[width * 0.86, suv ? 0.38 : 0.3, length * 0.48]} />
        <meshPhysicalMaterial color={paint} metalness={0.4} roughness={0.34 + dust * 0.4} clearcoat={dust > 0.45 ? 0 : 0.4} />
      </mesh>
      <mesh position={[0, y + bodyH * 0.78, length * 0.16]}>
        <boxGeometry args={[width * 0.78, suv ? 0.22 : 0.18, length * 0.28]} />
        <meshStandardMaterial color={glass} metalness={0.6} roughness={0.12} transparent opacity={0.92} />
      </mesh>
      <mesh position={[0, y + 0.02, length * 0.5]}>
        <boxGeometry args={[width * 0.72, 0.08, 0.06]} />
        <meshStandardMaterial color={hurt ? "#4a4038" : "#d9dde2"} metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[-width * 0.28, y + 0.04, length * 0.47]}>
        <boxGeometry args={[0.16, 0.08, 0.05]} />
        <meshStandardMaterial color="#f4f1c8" emissive="#f4f1c8" emissiveIntensity={hurt ? 0 : 0.35} />
      </mesh>
      <mesh position={[width * 0.28, y + 0.04, length * 0.47]}>
        <boxGeometry args={[0.16, 0.08, 0.05]} />
        <meshStandardMaterial color={hurt ? "#6a3030" : "#f4f1c8"} emissive={hurt ? "#3a1010" : "#f4f1c8"} emissiveIntensity={0.25} />
      </mesh>
      {plate ? (
        <mesh position={[0, y - 0.02, length * 0.52]}>
          <planeGeometry args={[0.36, 0.1]} />
          <meshBasicMaterial map={plate} />
        </mesh>
      ) : null}
      {[-1, 1].map((side) =>
        [-1, 1].map((end) => (
          <group key={`${side}${end}`} position={[side * width * 0.48, 0.16, end * length * 0.32]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.16, 0.16, 0.12, 12]} />
              <meshStandardMaterial color="#1c1c1c" roughness={0.7} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.08, 0.08, 0.14, 10]} />
              <meshStandardMaterial color={(motor.style ?? 1) >= 4 ? "#e0b04a" : "#c5ccd4"} metalness={0.8} roughness={0.25} />
            </mesh>
          </group>
        )),
      )}
      {dust > 0.08 ? (
        <mesh position={[0, y + 0.02, 0]}>
          <boxGeometry args={[width + 0.02, bodyH + 0.04, length + 0.02]} />
          <meshBasicMaterial color="#6b5c48" transparent opacity={dust * 0.45} depthWrite={false} />
        </mesh>
      ) : null}
    </group>
  );
}
