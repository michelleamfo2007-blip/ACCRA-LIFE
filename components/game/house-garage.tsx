"use client";

import { useState } from "react";
import { baySpot, garageBox, motorsOf } from "@/lib/game/garage";
import { MotorMesh } from "@/components/game/motor-mesh";
import { WallLamp } from "@/components/game/room-finish";
import { Figure } from "@/components/game/low-poly-human";
import { hasCurrent, type Life } from "@/lib/game/world";

function Slab({ color, position, size }: { color: string; position: [number, number, number]; size: [number, number, number] }) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshLambertMaterial color={color} />
    </mesh>
  );
}

export function HouseGarage({
  life,
  span = 0,
  bays,
  onWalk,
  onCar,
}: {
  life: Life;
  span?: number;
  bays: number;
  onWalk?: (x: number, z: number) => void;
  onCar?: (key: string, x: number, z: number) => void;
}) {
  const [shut, setShut] = useState(false);
  const box = garageBox(span, bays);
  const cars = motorsOf(life);
  const inside = cars.slice(0, box.count);
  const outside = cars.slice(box.count);
  const width = box.x1 - box.x0;
  const depth = box.z1 - box.z0;
  const midX = (box.x0 + box.x1) / 2;
  const midZ = (box.z0 + box.z1) / 2;
  const wall = "#e7e0d2";
  const concrete = "#b7b3aa";
  const hasGen = life.inventory.some((id) => id === "generator" || id === "yellow-gen");
  const hasSolar = life.inventory.includes("solar");
  const lit = !life.dumsor || hasCurrent(life.inventory);
  const lift = bays >= 3;
  const guests = (life.guests ?? []).filter((guest) => guest.doing !== "leave");
  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[midX, 0.03, midZ]}
        onClick={(event) => {
          event.stopPropagation();
          onWalk?.(event.point.x, event.point.z);
        }}
      >
        <planeGeometry args={[width - 0.5, depth - 0.7]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[(box.doorX0 + box.doorX1) / 2, 0.035, box.z1 + 0.55]}
        onClick={(event) => {
          event.stopPropagation();
          onWalk?.(event.point.x, event.point.z);
        }}
      >
        <planeGeometry args={[box.doorX1 - box.doorX0, 1.3]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <Slab color={concrete} position={[midX, 0.025, midZ]} size={[width, 0.05, depth]} />
      <Slab color="#8d887e" position={[midX, 0.04, midZ]} size={[width - 0.9, 0.01, 0.08]} />
      {inside.map((_, index) => (
        <Slab key={`line-${index}`} color="#e7e2d6" position={[box.x0 + 1.65 + index * box.pitch, 0.045, midZ]} size={[0.06, 0.01, depth - 1.2]} />
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[box.x0 + 1.7, 0.05, midZ]}>
        <circleGeometry args={[0.55, 16]} />
        <meshBasicMaterial color="#3a342c" transparent opacity={0.35} />
      </mesh>
      <WallLamp x={box.x0 + 0.12} z={midZ} yaw={Math.PI / 2} on={lit} />
      <Slab color={wall} position={[box.x0, 0.9, midZ]} size={[0.14, 1.7, depth]} />
      <Slab color={wall} position={[box.x1, 0.9, midZ]} size={[0.14, 1.7, depth]} />
      <Slab color="#c8c3b8" position={[box.x0 + 0.35, 1.72, midZ]} size={[0.12, 0.08, depth]} />
      <Slab color="#c8c3b8" position={[box.x1 - 0.35, 1.72, midZ]} size={[0.12, 0.08, depth]} />
      <mesh position={[midX, 1.62, midZ]}>
        <boxGeometry args={[0.7, 0.06, 0.28]} />
        <meshStandardMaterial color="#f7f3df" emissive="#f4e7b0" emissiveIntensity={lit ? 0.7 : 0} />
      </mesh>
      {shut ? (
        <Slab color="#8e99a6" position={[midX, 0.85, box.z0]} size={[width - 0.3, 1.5, 0.08]} />
      ) : (
        <group position={[midX, 1.45, box.z0]} onClick={(event) => { event.stopPropagation(); setShut(true); }}>
          {[0, 1, 2].map((band) => (
            <mesh key={band} position={[0, -band * 0.08, 0]}>
              <boxGeometry args={[width - 0.35, 0.07, 0.06]} />
              <meshLambertMaterial color={band % 2 ? "#9aa3ae" : "#d5dbe2"} />
            </mesh>
          ))}
        </group>
      )}
      {shut ? (
        <mesh position={[box.x1 - 0.35, 0.9, box.z0 - 0.08]} onClick={(event) => { event.stopPropagation(); setShut(false); }}>
          <boxGeometry args={[0.12, 0.28, 0.06]} />
          <meshLambertMaterial color="#c4563a" />
        </mesh>
      ) : null}
      <Slab color="#6b5344" position={[box.x0 + 0.45, 0.42, box.z0 + 0.55]} size={[0.7, 0.72, 0.4]} />
      <Slab color="#3d4a3a" position={[box.x0 + 0.45, 0.82, box.z0 + 0.48]} size={[0.18, 0.12, 0.12]} />
      <Slab color="#c4a46a" position={[box.x0 + 0.55, 0.84, box.z0 + 0.62]} size={[0.1, 0.14, 0.1]} />
      {[0, 1, 2].map((stack) => (
        <mesh key={stack} position={[box.x1 - 0.4, 0.18 + stack * 0.16, box.z0 + 0.55]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.16, 0.06, 8, 14]} />
          <meshLambertMaterial color="#1c1c1c" />
        </mesh>
      ))}
      <mesh position={[box.x1 - 0.55, 0.35, box.z1 - 0.45]}>
        <cylinderGeometry args={[0.04, 0.05, 0.55, 8]} />
        <meshLambertMaterial color="#8d98a4" />
      </mesh>
      <Slab color="#f4f7fa" position={[box.x0 + 0.4, 0.38, box.z1 - 0.45]} size={[0.38, 0.5, 0.34]} />
      {lift ? (
        <>
          <Slab color="#3a4450" position={[box.x0 + 1.2, 0.9, midZ]} size={[0.08, 1.7, 0.08]} />
          <Slab color="#3a4450" position={[box.x0 + 2.1, 0.9, midZ]} size={[0.08, 1.7, 0.08]} />
          <Slab color="#c4563a" position={[box.x0 + 1.65, 1.55, midZ]} size={[1.1, 0.08, 0.08]} />
        </>
      ) : null}
      {(life.security ?? 0) > 0 ? (
        <mesh position={[box.x1 - 0.2, 1.5, box.z1 - 0.15]}>
          <boxGeometry args={[0.12, 0.08, 0.1]} />
          <meshLambertMaterial color="#1c1c1c" />
        </mesh>
      ) : null}
      {hasGen ? <Slab color={life.inventory.includes("yellow-gen") ? "#e7c85a" : "#355f86"} position={[box.x1 + 0.45, 0.28, box.z0 + 0.4]} size={[0.55, 0.42, 0.4]} /> : null}
      {hasSolar ? <Slab color="#1d4e89" position={[midX, 1.8, midZ]} size={[1.1, 0.04, 0.7]} /> : null}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[midX, 0.02, box.z0 - 1.15]} onClick={(event) => { event.stopPropagation(); onWalk?.(event.point.x, event.point.z); }}>
        <planeGeometry args={[width + 1.2, 2.2]} />
        <meshLambertMaterial color="#c8c2b6" />
      </mesh>
      <Slab color="#e7e1d4" position={[box.x0 - 0.15, 0.45, box.z0 - 2.15]} size={[0.12, 0.9, 1.2]} />
      <Slab color="#e7e1d4" position={[box.x1 + 0.55, 0.45, box.z0 - 2.15]} size={[0.12, 0.9, 1.2]} />
      <mesh position={[box.gate.x, 1.15, box.gate.z]}>
        <cylinderGeometry args={[0.05, 0.06, 2.2, 8]} />
        <meshLambertMaterial color="#d9d4c8" />
      </mesh>
      <mesh position={[box.gate.x, 2.15, box.gate.z]}>
        <sphereGeometry args={[0.1, 10, 8]} />
        <meshStandardMaterial color="#f7f3df" emissive="#f4e7b0" emissiveIntensity={0.4} />
      </mesh>
      {inside.map((motor, index) => {
        const spot = baySpot(span, bays, index);
        const key = motor.key ?? `bay-${index}`;
        return (
          <group
            key={key}
            position={[spot.x, 0, spot.z]}
            onClick={(event) => {
              event.stopPropagation();
              onCar?.(key, spot.x, spot.z + 1.15);
            }}
          >
            <group rotation={[0, Math.PI, 0]}>
              <MotorMesh motor={motor} minutes={life.minutes} indoors />
            </group>
          </group>
        );
      })}
      {outside.map((motor, index) => {
        const key = motor.key ?? `yard-${index}`;
        const x = box.x1 + 1.6 + index * 2.3;
        const z = box.z0 + 1.2;
        return (
          <group key={key} position={[x, 0, z]} onClick={(event) => { event.stopPropagation(); onCar?.(key, x - 1.1, z); }}>
            <MotorMesh motor={motor} minutes={life.minutes} indoors={false} />
          </group>
        );
      })}
      {guests.length ? (
        <group position={[box.x0 - 2.1, 0, box.z0 + 1.3]}>
          <MotorMesh motor={{ id: "corolla", fuel: 40, insuredUntil: 0, color: "#9aa3ad", condition: 70 }} minutes={life.minutes} indoors={false} />
        </group>
      ) : null}
      {life.yard?.driver ? (
        <group position={[box.x0 + 0.7, 0, box.z0 + 1.15]}>
          <Figure skin="#8d5a3b" shirt="#243044" pants="#1c2744" hair="Low cut" cloth="#243044" pattern="Plain" outfit="Casual" body="man" pose="idle" turn={40} />
        </group>
      ) : null}
      {life.yard?.guard ? (
        <group position={[box.gate.x - 0.7, 0, box.gate.z - 0.2]}>
          <Figure skin="#6b4423" shirt="#3d4a3a" pants="#1c1c1c" hair="Low cut" cloth="#3d4a3a" pattern="Plain" outfit="Casual" body="man" pose="idle" turn={160} />
        </group>
      ) : null}
      {life.errand ? (
        <group position={[box.x1 + 1.8, 0, box.z0 + 0.4]} scale={0.65}>
          <MotorMesh motor={{ id: "vitz", fuel: 50, insuredUntil: 0, color: "#f2f5f8" }} minutes={life.minutes} indoors={false} />
        </group>
      ) : null}
    </group>
  );
}
