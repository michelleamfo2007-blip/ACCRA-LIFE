"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Group } from "three";
import { PlacedModel } from "@/components/game/kit-mesh";
import { openHouseDress } from "@/lib/game/room-sets";
import { roomReach } from "@/lib/game/world";

function mixHex(hex: string, toward: number, amount: number) {
  const n = hex.replace("#", "");
  if (n.length < 6) return hex;
  const parts = [0, 2, 4].map((index) => {
    const channel = parseInt(n.slice(index, index + 2), 16);
    return Math.max(0, Math.min(255, Math.round(channel + (toward - channel) * amount)));
  });
  return `#${parts.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

export function plasterMap(hex: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const pen = canvas.getContext("2d");
  if (!pen) return null;
  pen.fillStyle = mixHex(hex, 246, 0.28);
  pen.fillRect(0, 0, 64, 64);
  pen.fillStyle = "rgba(247,241,232,0.34)";
  pen.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 48; i += 1) {
    pen.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.03)" : "rgba(120,96,64,0.035)";
    pen.fillRect((i * 17) % 64, (i * 29) % 64, 2, 1);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  return texture;
}

export function plankMap(light: string, dark: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const pen = canvas.getContext("2d");
  if (!pen) return null;
  const plank = 28;
  pen.fillStyle = dark;
  pen.fillRect(0, 0, 256, 256);
  for (let row = 0; row < 256 / plank; row += 1) {
    const shift = row % 2 === 0 ? 0 : 46;
    for (let x = -shift; x < 256; x += 92) {
      pen.fillStyle = row % 2 === 0 ? light : mixHex(light, parseInt(dark.slice(1, 3), 16), 0.45);
      pen.fillRect(x + 1, row * plank + 1, 88, plank - 3);
      pen.fillStyle = "rgba(255,244,220,0.16)";
      pen.fillRect(x + 2, row * plank + 2, 86, 3);
    }
  }
  for (let line = 0; line < 70; line += 1) {
    pen.strokeStyle = `rgba(92,62,32,${0.05 + (line % 4) * 0.03})`;
    pen.lineWidth = line % 6 === 0 ? 1.4 : 0.6;
    pen.beginPath();
    const y = (line * 19) % 256;
    pen.moveTo(0, y);
    pen.bezierCurveTo(80, y + ((line % 5) - 2), 160, y - ((line % 3) - 1), 256, y + (line % 2));
    pen.stroke();
  }
  for (let knot = 0; knot < 5; knot += 1) {
    pen.fillStyle = "rgba(90,58,28,0.28)";
    pen.beginPath();
    pen.ellipse(30 + knot * 47, 18 + ((knot * 53) % 220), 4, 2.2, 0.4, 0, Math.PI * 2);
    pen.fill();
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(2, 2.4);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function tileMap(light: string, dark: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const pen = canvas.getContext("2d");
  if (!pen) return null;
  const grout = mixHex(light, 168, 0.18);
  pen.fillStyle = grout;
  pen.fillRect(0, 0, 256, 256);
  const cells = 4;
  const gap = 4;
  const cell = (256 - gap) / cells;
  for (let row = 0; row < cells; row += 1) {
    for (let col = 0; col < cells; col += 1) {
      const varied = (col + row) % 5 === 0;
      const tile = varied ? mixHex(light, 210, 0.12) : light;
      const x = gap / 2 + col * cell;
      const y = gap / 2 + row * cell;
      const side = cell - gap;
      pen.fillStyle = tile;
      pen.fillRect(x, y, side, side);
      const sheen = pen.createLinearGradient(x, y, x + side, y + side);
      sheen.addColorStop(0, "rgba(255,252,245,0.22)");
      sheen.addColorStop(0.5, "rgba(255,252,245,0)");
      sheen.addColorStop(1, "rgba(140,110,70,0.06)");
      pen.fillStyle = sheen;
      pen.fillRect(x, y, side, side);
      pen.strokeStyle = "rgba(255,255,255,0.35)";
      pen.lineWidth = 1;
      pen.strokeRect(x + 1.5, y + 1.5, side - 3, side - 3);
      for (let speck = 0; speck < 6; speck += 1) {
        pen.fillStyle = "rgba(160,130,90,0.18)";
        pen.fillRect(x + ((col + 1) * (speck + 3) * 7) % side, y + ((row + 2) * (speck + 5) * 5) % side, 1.5, 1.5);
      }
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(5, 3.6);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function PlasterBox({ color, position, size }: { color: string; position: [number, number, number]; size: [number, number, number] }) {
  const map = useMemo(() => plasterMap(color), [color]);
  const board = Math.min(0.14, size[1] * 0.12);
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={size} />
        <meshStandardMaterial map={map} color={map ? "#ffffff" : color} roughness={0.92} metalness={0} />
      </mesh>
      <mesh position={[0, -size[1] / 2 + board / 2, 0]}>
        <boxGeometry args={[size[0] + 0.02, board, size[2] + 0.04]} />
        <meshStandardMaterial color="#f6f1e6" roughness={0.72} />
      </mesh>
    </group>
  );
}

export function WallLamp({ x, z, yaw, on, night = false }: { x: number; z: number; yaw: number; on: boolean; night?: boolean }) {
  const glow = on ? (night ? 2.8 : 0.22) : 0;
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
      <pointLight position={[0, 0.1, 0.85]} color={night ? "#b7c6dc" : "#fff1d2"} intensity={night ? 0.45 : 1.8} distance={8} decay={2} />
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
      <pointLight position={[0, 0.4, 0]} color="#ffb060" intensity={5.5} distance={7.2} decay={2} />
    </group>
  );
}

function CeilingFan({ x, z, on }: { x: number; z: number; on: boolean }) {
  const spin = useRef<Group>(null);
  useFrame((_, dt) => {
    if (spin.current && on) spin.current.rotation.y += dt * 1.1;
  });
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.05, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.5, 8]} />
        <meshStandardMaterial color="#d9d0c2" metalness={0.25} roughness={0.4} />
      </mesh>
      <group ref={spin}>
        <PlacedModel file="furniture/ceilingFan.glb" span={1.15} lift={1.28} quiet silent />
      </group>
    </group>
  );
}

export function InteriorFinish({ span, night, dark }: { span: number; night: boolean; dark: boolean }) {
  const dress = openHouseDress(span);
  const room = roomReach(span);
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
      <group position={[-1.55, 0.012, 0.12]}>
        <PlacedModel file="furniture/rugRectangle.glb" span={2.3} quiet silent />
      </group>
      <group position={[-3.45, 0, -3.55]}>
        <PlacedModel file="furniture/pottedPlant.glb" tall={0.72} quiet silent />
      </group>
      <CeilingFan x={-0.35} z={0.45} on={lampsOn} />
      <group position={[0.85, 0, -room.halfD + 0.72]}>
        <PlacedModel file="furniture/televisionModern.glb" tall={0.68} quiet silent />
      </group>
      <group position={[-3.95, 0, 4.05]} rotation={[0, Math.PI / 2, 0]}>
        <PlacedModel file="furniture/bathroomSink.glb" tall={0.78} quiet silent />
      </group>
      <group position={[-3.42, 0, 3.55]} rotation={[0, Math.PI / 2, 0]}>
        <PlacedModel file="furniture/bathroomMirror.glb" tall={1.15} quiet silent />
      </group>
      {dark ? <DumsorLamp x={dress.lamp.x} z={dress.lamp.z} /> : null}
    </group>
  );
}
