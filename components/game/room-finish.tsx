"use client";

import { useMemo } from "react";
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";
import { PlacedModel } from "@/components/game/kit-mesh";
import { openHouseDress } from "@/lib/game/room-sets";

export function plasterMap(hex: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const pen = canvas.getContext("2d");
  if (!pen) return null;
  pen.fillStyle = hex;
  pen.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 160; i += 1) {
    pen.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.045)" : "rgba(90,70,40,0.05)";
    pen.fillRect((i * 17) % 64, (i * 29) % 64, 2, 2);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  return texture;
}

export function plankMap(light: string, dark: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const pen = canvas.getContext("2d");
  if (!pen) return null;
  for (let row = 0; row < 8; row += 1) {
    pen.fillStyle = row % 2 === 0 ? light : dark;
    pen.fillRect(0, row * 16, 128, 15);
    pen.fillStyle = "rgba(90,60,30,0.18)";
    pen.fillRect(0, row * 16 + 15, 128, 1);
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(2, 3);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function tileMap(light: string, dark: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const pen = canvas.getContext("2d");
  if (!pen) return null;
  pen.fillStyle = "#cbb892";
  pen.fillRect(0, 0, 128, 128);
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      pen.fillStyle = (col + row) % 2 === 0 ? light : dark;
      pen.fillRect(col * 32 + 1, row * 32 + 1, 30, 30);
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(4, 3);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function PlasterBox({ color, position, size }: { color: string; position: [number, number, number]; size: [number, number, number] }) {
  const map = useMemo(() => plasterMap(color), [color]);
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial map={map} color={map ? "#ffffff" : color} roughness={0.9} metalness={0} />
    </mesh>
  );
}

export function WallLamp({ x, z, yaw, on, night = false }: { x: number; z: number; yaw: number; on: boolean; night?: boolean }) {
  const glow = on ? (night ? 1.2 : 0.42) : 0;
  return (
    <group position={[x, 1.38, z]} rotation={[0, yaw, 0]}>
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[0.1, 0.045, 0.1]} />
        <meshStandardMaterial color="#c4b39a" roughness={0.4} metalness={0.35} />
      </mesh>
      <mesh position={[0, -0.07, 0.12]}>
        <sphereGeometry args={[0.065, 16, 12]} />
        <meshStandardMaterial color={on ? "#fff6d4" : "#efe6d4"} emissive={on ? "#ffd27a" : "#000000"} emissiveIntensity={on ? (night ? 0.9 : 0.35) : 0} roughness={0.35} />
      </mesh>
      <mesh position={[0, -0.28, 0.02]}>
        <circleGeometry args={[0.2, 18]} />
        <meshBasicMaterial color="#ffe6b8" transparent opacity={on ? (night ? 0.4 : 0.16) : 0.06} depthWrite={false} />
      </mesh>
      {glow > 0 ? <pointLight position={[0, -0.12, 0.4]} color="#ffd7a1" intensity={glow} distance={6.2} decay={2} /> : null}
    </group>
  );
}

export function BlindWindow({ x, z, night }: { x: number; z: number; night: boolean }) {
  return (
    <group position={[x, 1.05, z]}>
      <mesh>
        <boxGeometry args={[1.72, 1.08, 0.06]} />
        <meshStandardMaterial color="#f7f3ea" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.02, 0.025]}>
        <boxGeometry args={[1.4, 0.78, 0.02]} />
        <meshBasicMaterial color={night ? "#243656" : "#d7eef8"} />
      </mesh>
      {Array.from({ length: 7 }, (_, index) => (
        <mesh key={index} position={[0, 0.34 - index * 0.1, 0.045]} rotation={[0.4, 0, 0]}>
          <boxGeometry args={[1.34, 0.02, 0.035]} />
          <meshStandardMaterial color="#f4f1ea" roughness={0.7} />
        </mesh>
      ))}
      {!night ? <pointLight position={[0, 0, 0.7]} color="#fff4e0" intensity={0.55} distance={7} decay={2} /> : null}
    </group>
  );
}

function FloorBit({ kind, x, z }: { kind: "box" | "bucket"; x: number; z: number }) {
  if (kind === "bucket") {
    return (
      <group position={[x, 0, z]}>
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.1, 0.12, 0.2, 12]} />
          <meshStandardMaterial color="#d9dde2" roughness={0.45} metalness={0.2} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <circleGeometry args={[0.16, 14]} />
          <meshBasicMaterial color="#1a1814" transparent opacity={0.14} depthWrite={false} />
        </mesh>
      </group>
    );
  }
  return (
    <group position={[x, 0, z]} rotation={[0, 0.4, 0]}>
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[0.28, 0.16, 0.22]} />
        <meshStandardMaterial color="#e7c9a0" roughness={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.2, 14]} />
        <meshBasicMaterial color="#1a1814" transparent opacity={0.14} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function DumsorLamp({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.12, 12]} />
        <meshStandardMaterial color="#c4a46a" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.24, 0]}>
        <sphereGeometry args={[0.07, 14, 10]} />
        <meshStandardMaterial color="#fff1c2" emissive="#ffb347" emissiveIntensity={1.1} />
      </mesh>
      <pointLight position={[0, 0.35, 0]} color="#ffb060" intensity={2.4} distance={7.5} decay={2} />
    </group>
  );
}

export function InteriorFinish({ span, night, dark }: { span: number; night: boolean; dark: boolean }) {
  const dress = openHouseDress(span);
  const lampsOn = !dark;
  return (
    <group>
      {dress.lights.map((lamp) => (
        <WallLamp key={`${lamp.x}-${lamp.z}`} x={lamp.x} z={lamp.z} yaw={lamp.yaw} on={lampsOn} night={night || dark} />
      ))}
      <BlindWindow x={dress.window.x} z={dress.window.z} night={night || dark} />
      <group position={[dress.clock.x, 1.15, dress.clock.z]} rotation={[0, dress.clock.yaw, 0]}>
        <mesh>
          <circleGeometry args={[0.12, 18]} />
          <meshStandardMaterial color="#f7f4ee" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <circleGeometry args={[0.09, 18]} />
          <meshStandardMaterial color="#f6f1e6" />
        </mesh>
        <mesh position={[0, 0.03, 0.02]}>
          <boxGeometry args={[0.012, 0.05, 0.01]} />
          <meshStandardMaterial color="#3a342c" />
        </mesh>
      </group>
      <mesh position={[dress.outlet.x, 0.32, dress.outlet.z]}>
        <boxGeometry args={[0.08, 0.1, 0.02]} />
        <meshStandardMaterial color="#f4f1ea" roughness={0.7} />
      </mesh>
      {dress.accents.map((piece) => (
        <group key={piece.id} position={[piece.x, 0, piece.z]} rotation={[0, piece.rot, 0]}>
          {piece.file ? <PlacedModel file={piece.file} span={piece.span} tall={piece.tall} /> : null}
        </group>
      ))}
      <FloorBit kind="box" x={dress.box.x} z={dress.box.z} />
      <FloorBit kind="bucket" x={dress.bucket.x} z={dress.bucket.z} />
      {dark ? <DumsorLamp x={dress.lamp.x} z={dress.lamp.z} /> : null}
    </group>
  );
}
