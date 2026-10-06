"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Color, Group, MathUtils } from "three";

export type FlightPhase = "boarding" | "taxi" | "climb" | "cruise" | "descent" | "land";

export function FlightOutside({ phase, progress }: { phase: FlightPhase; progress: number }) {
  return (
    <div className="absolute inset-0 bg-[#7eb6de]">
      <Canvas camera={{ position: [0, 8, 18], fov: 42 }} dpr={[1, 1.6]}>
        <color attach="background" args={["#8ec5e8"]} />
        <fog attach="fog" args={["#9ec8e8", 40, 120]} />
        <ambientLight intensity={0.85} />
        <directionalLight position={[12, 22, 8]} intensity={1.35} />
        <hemisphereLight args={["#dff1ff", "#6f9a3a", 0.55]} />
        <FlightWorld phase={phase} progress={progress} />
      </Canvas>
    </div>
  );
}

function FlightWorld({ phase, progress }: { phase: FlightPhase; progress: number }) {
  const plane = useRef<Group>(null);
  const ground = useRef<Group>(null);
  const air = phase === "climb" || phase === "cruise" || phase === "descent";

  const pose = useMemo(() => {
    if (phase === "boarding") return { x: -2, y: 1.2, z: 0, pitch: 0, yaw: 0.15, camY: 7, camZ: 16 };
    if (phase === "taxi") return { x: 2 + progress * 4, y: 1.2, z: 0, pitch: 0, yaw: 0.05, camY: 7, camZ: 15 };
    if (phase === "climb") return { x: 4, y: 4 + progress * 8, z: -6, pitch: -0.28, yaw: -0.1, camY: 10, camZ: 20 };
    if (phase === "cruise") return { x: 2, y: 14, z: -10, pitch: -0.05, yaw: 0.08, camY: 16, camZ: 22 };
    if (phase === "descent") return { x: 0, y: 8, z: -4, pitch: 0.18, yaw: 0.05, camY: 12, camZ: 18 };
    return { x: 3, y: 1.4, z: 2, pitch: 0, yaw: 0, camY: 7, camZ: 15 };
  }, [phase, progress]);

  useFrame(({ camera }, dt) => {
    if (!plane.current || !ground.current) return;
    const g = plane.current;
    g.position.x = MathUtils.damp(g.position.x, pose.x, 2.2, dt);
    g.position.y = MathUtils.damp(g.position.y, pose.y, 2.2, dt);
    g.position.z = MathUtils.damp(g.position.z, pose.z, 2.2, dt);
    g.rotation.z = MathUtils.damp(g.rotation.z, pose.pitch, 2.4, dt);
    g.rotation.y = MathUtils.damp(g.rotation.y, pose.yaw, 2.4, dt);
    if (phase === "taxi") g.position.x += Math.sin(performance.now() / 280) * 0.015;
    if (phase === "cruise") g.position.y += Math.sin(performance.now() / 900) * 0.04;

    ground.current.position.x = air ? -((performance.now() / 1000) * (phase === "cruise" ? 14 : 9)) % 40 : 0;
    camera.position.x = MathUtils.damp(camera.position.x, g.position.x - 2, 1.6, dt);
    camera.position.y = MathUtils.damp(camera.position.y, pose.camY, 1.6, dt);
    camera.position.z = MathUtils.damp(camera.position.z, g.position.z + pose.camZ, 1.6, dt);
    camera.lookAt(g.position.x + 4, g.position.y + 0.5, g.position.z);
  });

  return (
    <group>
      <group ref={ground}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[220, 220]} />
          <meshStandardMaterial color={air ? "#7aa84a" : "#8b93a1"} />
        </mesh>
        {air ? <Fields /> : <Tarmac />}
      </group>
      <group ref={plane} position={[-2, 1.2, 0]}>
        <AirlinerMesh />
      </group>
      {phase === "boarding" || phase === "taxi" ? (
        <mesh position={[8, 2.2, 3]}>
          <boxGeometry args={[10, 2.2, 3]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
      ) : null}
    </group>
  );
}

function Tarmac() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[80, 18]} />
        <meshStandardMaterial color="#6b7280" />
      </mesh>
      {[-24, -8, 8, 24].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.04, 0]}>
          <planeGeometry args={[8, 0.7]} />
          <meshStandardMaterial color="#FCD116" />
        </mesh>
      ))}
    </group>
  );
}

function Fields() {
  const patches = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        x: (i % 9) * 14 - 56,
        z: Math.floor(i / 9) * 16 - 28,
        c: i % 3 === 0 ? "#8fbc5a" : i % 3 === 1 ? "#6f9a3a" : "#9ec46a",
        w: 10 + (i % 4),
        d: 10 + ((i * 3) % 5),
      })),
    [],
  );
  return (
    <group>
      {patches.map((p, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[p.x, 0.03, p.z]}>
          <planeGeometry args={[p.w, p.d]} />
          <meshStandardMaterial color={p.c} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[8, 0.05, -6]}>
        <planeGeometry args={[4, 70]} />
        <meshStandardMaterial color="#4aa3d8" />
      </mesh>
      {Array.from({ length: 18 }, (_, i) => (
        <mesh key={`t${i}`} position={[(i % 6) * 16 - 40, 0.8, Math.floor(i / 6) * 18 - 16]}>
          <cylinderGeometry args={[1.4, 1.4, 1.6, 8]} />
          <meshStandardMaterial color="#2f6b2f" />
        </mesh>
      ))}
    </group>
  );
}

function AirlinerMesh() {
  const white = useMemo(() => new Color("#f8fafc"), []);
  const green = useMemo(() => new Color("#006B3F"), []);
  const yellow = useMemo(() => new Color("#FCD116"), []);
  const glass = useMemo(() => new Color("#7ec8ea"), []);
  return (
    <group rotation={[0, Math.PI / 2, 0]} scale={1.15}>
      {/* fuselage */}
      <mesh position={[0, 0, 0]}>
        <capsuleGeometry args={[0.9, 7.2, 6, 12]} />
        <meshStandardMaterial color={white} />
      </mesh>
      {/* green stripe */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.2, 0.35, 5.2]} />
        <meshStandardMaterial color={green} />
      </mesh>
      {/* wings */}
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[9.5, 0.14, 1.9]} />
        <meshStandardMaterial color={white} />
      </mesh>
      {/* tail fin */}
      <mesh position={[0, 1.0, -3.4]}>
        <boxGeometry args={[0.18, 2.0, 1.5]} />
        <meshStandardMaterial color={green} />
      </mesh>
      {/* AL badge */}
      <mesh position={[0, 1.55, -3.5]}>
        <sphereGeometry args={[0.38, 12, 12]} />
        <meshStandardMaterial color={yellow} />
      </mesh>
      {/* cockpit */}
      <mesh position={[0, 0.35, 3.2]}>
        <boxGeometry args={[1.1, 0.55, 0.9]} />
        <meshStandardMaterial color={glass} transparent opacity={0.85} />
      </mesh>
      {/* gear */}
      <mesh position={[-1.1, -0.7, 1.6]}>
        <boxGeometry args={[0.18, 0.7, 0.35]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[1.1, -0.7, 1.6]}>
        <boxGeometry args={[0.18, 0.7, 0.35]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[-1.1, -0.7, -1.2]}>
        <boxGeometry args={[0.18, 0.7, 0.35]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[1.1, -0.7, -1.2]}>
        <boxGeometry args={[0.18, 0.7, 0.35]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
    </group>
  );
}
