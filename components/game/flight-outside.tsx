"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import { BackSide, CanvasTexture, DoubleSide, ExtrudeGeometry, LatheGeometry, MathUtils, Shape, SRGBColorSpace, Vector2, type Group } from "three";

export type FlightPhase = "boarding" | "taxi" | "climb" | "cruise" | "descent" | "land";

export function FlightOutside({ phase, progress, night }: { phase: FlightPhase; progress: number; night?: boolean }) {
  const air = phase === "climb" || phase === "cruise" || phase === "descent";
  const sky = night && air ? "#102848" : night ? "#1a3358" : "#8ec5e8";
  return (
    <div className="absolute inset-0" style={{ background: sky }}>
      <Canvas camera={{ position: [-10, 8, 16], fov: 34 }} dpr={[1, 1.6]}>
        <color attach="background" args={[sky]} />
        <fog attach="fog" args={[night && air ? "#1a4068" : night ? "#243044" : "#9ec8e8", 50, 150]} />
        <ambientLight intensity={0.85} />
        <directionalLight position={[12, 22, 8]} intensity={1.35} />
        <hemisphereLight args={["#dff1ff", "#6f9a3a", 0.55]} />
        <FlightWorld phase={phase} progress={progress} night={!!night} />
      </Canvas>
    </div>
  );
}

function FlightWorld({ phase, progress, night }: { phase: FlightPhase; progress: number; night: boolean }) {
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
    if (phase === "taxi") g.position.x += Math.sin(performance.now() / 280) * 0.012;
    if (phase === "cruise") g.position.y += Math.sin(performance.now() / 900) * 0.06;
    const bank = phase === "climb" ? 0.22 : phase === "descent" ? -0.16 : Math.sin(performance.now() / 1600) * 0.04;
    g.rotation.x = MathUtils.damp(g.rotation.x, bank, 1.5, dt);

    ground.current.position.x = air ? -((performance.now() / 1000) * (phase === "cruise" ? 16 : 10)) % 48 : 0;
    camera.position.x = MathUtils.damp(camera.position.x, g.position.x - 7, 2.2, dt);
    camera.position.y = MathUtils.damp(camera.position.y, g.position.y + 4.2, 2.2, dt);
    camera.position.z = MathUtils.damp(camera.position.z, g.position.z + 15, 2.2, dt);
    camera.lookAt(g.position.x + 0.4, g.position.y + 0.3, g.position.z);
  });

  return (
    <group>
      <SkyDome night={night} />
      {night ? <Stars /> : <Sun />}
      <CloudField night={night} moving={air} />
      <group ref={ground}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[220, 220]} />
          <meshStandardMaterial color={air ? (night ? "#0c1420" : "#7aa84a") : night ? "#3a414c" : "#8b93a1"} />
        </mesh>
        {air ? night ? <CityLights /> : <Fields /> : <Tarmac night={night} />}
      </group>
      <group ref={plane} position={[-2, 1.2, 0]}>
        <AirlinerMesh phase={phase} />
      </group>
      {phase === "boarding" ? (
        <mesh position={[-0.2, 1.5, 2.4]}>
          <boxGeometry args={[1.4, 1.1, 2.2]} />
          <meshStandardMaterial color="#d7dee8" />
        </mesh>
      ) : null}
    </group>
  );
}

function SkyDome({ night }: { night: boolean }) {
  const map = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 4;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const wash = ctx.createLinearGradient(0, 0, 0, 256);
      if (night) {
        wash.addColorStop(0, "#071428");
        wash.addColorStop(0.4, "#16386a");
        wash.addColorStop(0.78, "#3d6ea8");
        wash.addColorStop(1, "#6ea0c8");
      } else {
        wash.addColorStop(0, "#1a4f92");
        wash.addColorStop(0.42, "#79b7ea");
        wash.addColorStop(0.78, "#f2c29a");
        wash.addColorStop(1, "#f8e4c8");
      }
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, 4, 256);
    }
    const tex = new CanvasTexture(canvas);
    tex.colorSpace = SRGBColorSpace;
    return tex;
  }, [night]);
  return (
    <mesh>
      <sphereGeometry args={[80, 20, 16]} />
      <meshBasicMaterial map={map} side={BackSide} />
    </mesh>
  );
}

function Stars() {
  const positions = useMemo(() => {
    const list = new Float32Array(180 * 3);
    for (let i = 0; i < 180; i += 1) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.7 + 0.3);
      const r = 60;
      list[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      list[i * 3 + 1] = r * Math.cos(phi);
      list[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return list;
  }, []);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#f8fafc" size={0.18} sizeAttenuation />
    </points>
  );
}

function Sun() {
  return (
    <mesh position={[30, 28, -20]}>
      <sphereGeometry args={[2.2, 16, 16]} />
      <meshBasicMaterial color="#ffe08a" />
    </mesh>
  );
}

function CloudField({ night, moving }: { night: boolean; moving: boolean }) {
  const puff = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const wash = ctx.createRadialGradient(64, 64, 6, 64, 64, 60);
      wash.addColorStop(0, "rgba(255,255,255,0.92)");
      wash.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, 128, 128);
    }
    const tex = new CanvasTexture(canvas);
    tex.colorSpace = SRGBColorSpace;
    return tex;
  }, []);
  const spots = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        x: (i % 8) * 14 - 48,
        y: 4 + (i % 5) * 2.4,
        z: (i % 4) * 6 - 9,
        s: 4.5 + (i % 3) * 1.8,
      })),
    [],
  );
  const drift = useRef<Group>(null);
  useFrame(() => {
    if (!drift.current || !moving) return;
    drift.current.position.x = -((performance.now() / 1000) * 6) % 40;
  });
  return (
    <group ref={drift}>
      {spots.map((spot, i) => (
        <mesh key={i} position={[spot.x, spot.y, spot.z]}>
          <planeGeometry args={[spot.s * 2.2, spot.s]} />
          <meshBasicMaterial map={puff} transparent depthWrite={false} opacity={night ? 0.8 : 0.9} />
        </mesh>
      ))}
    </group>
  );
}

function Tarmac({ night }: { night: boolean }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[90, 16]} />
        <meshStandardMaterial color={night ? "#4b5563" : "#6b7280"} />
      </mesh>
      {[-30, -14, 2, 18, 34].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.04, 0]}>
          <planeGeometry args={[7, 0.55]} />
          <meshBasicMaterial color="#FCD116" />
        </mesh>
      ))}
      {[-28, -12, 4, 20, 36].map((x) => (
        <group key={`edge${x}`}>
          <mesh position={[x, 0.15, 6.2]}>
            <boxGeometry args={[0.35, 0.18, 0.35]} />
            <meshBasicMaterial color="#dbeafe" />
          </mesh>
          <mesh position={[x, 0.15, -6.2]}>
            <boxGeometry args={[0.35, 0.18, 0.35]} />
            <meshBasicMaterial color="#dbeafe" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function CityLights() {
  const lights = useMemo(
    () =>
      Array.from({ length: 220 }, (_, i) => ({
        x: ((i * 47) % 96) - 48,
        z: ((i * 29) % 80) - 40,
        s: 0.12 + (i % 5) * 0.07,
        c: i % 8 === 0 ? "#fff6d0" : i % 5 === 0 ? "#ffcf70" : "#ffe7a3",
      })),
    [],
  );
  return (
    <group>
      {lights.map((light, i) => (
        <mesh key={i} position={[light.x, 0.2, light.z]}>
          <boxGeometry args={[light.s, 0.08, light.s]} />
          <meshBasicMaterial color={light.c} />
        </mesh>
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={`road${i}`} rotation={[-Math.PI / 2, 0, 0.4]} position={[i * 12 - 42, 0.08, (i % 2) * 10 - 8]}>
          <planeGeometry args={[8, 0.15]} />
          <meshBasicMaterial color="#f8fafc" />
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

function paintSkin() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new CanvasTexture(canvas);
  ctx.fillStyle = "#f3f4f6";
  ctx.fillRect(0, 0, 1024, 512);
  ctx.strokeStyle = "rgba(80,90,105,0.28)";
  ctx.lineWidth = 1;
  for (let x = 80; x < 1024; x += 128) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  const side = (u: number) => {
    ctx.save();
    ctx.translate(u * 1024, 270);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = "#c8102e";
    ctx.fillRect(-210, 6, 430, 11);
    ctx.font = "700 40px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("PASSION AIR", 30, -6);
    ctx.font = "600 15px sans-serif";
    ctx.fillStyle = "#8e1424";
    ctx.fillText("GHANA", 30, 16);
    ctx.fillStyle = "#1e293b";
    ctx.font = "700 13px ui-monospace, monospace";
    ctx.fillText("9G-PAD", -150, 16);
    ctx.fillStyle = "#10283a";
    for (let i = -4; i <= 5; i += 1) ctx.fillRect(i * 34 - 6, 22, 14, 9);
    ctx.restore();
  };
  side(0.02);
  side(0.52);
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

function paintMark() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, 256, 256);
    ctx.fillStyle = "#f5c518";
    ctx.beginPath();
    ctx.arc(128, 128, 112, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#c8102e";
    ctx.font = "700 140px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("P", 128, 140);
  }
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

function buildFuselage() {
  const pts = [
    new Vector2(0.02, -4.35),
    new Vector2(0.18, -4.05),
    new Vector2(0.48, -3.45),
    new Vector2(0.78, -2.6),
    new Vector2(0.94, -1.2),
    new Vector2(0.98, 0.4),
    new Vector2(0.96, 1.8),
    new Vector2(0.78, 2.9),
    new Vector2(0.46, 3.6),
    new Vector2(0.16, 4.05),
    new Vector2(0.02, 4.3),
  ];
  const geo = new LatheGeometry(pts, 28);
  geo.rotateZ(Math.PI / 2);
  return geo;
}

function buildWing(flip: boolean) {
  const shape = new Shape();
  shape.moveTo(1.15, 0.35);
  shape.lineTo(-1.05, 0.5);
  shape.lineTo(-1.75, 5.15);
  shape.lineTo(-0.2, 4.9);
  shape.closePath();
  const geo = new ExtrudeGeometry(shape, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 1 });
  geo.rotateX(-Math.PI / 2);
  if (flip) geo.scale(1, 1, -1);
  return geo;
}

function buildFin() {
  const shape = new Shape();
  shape.moveTo(-2.55, 0.55);
  shape.lineTo(-4.2, 0.4);
  shape.lineTo(-3.55, 2.25);
  shape.lineTo(-2.7, 2.1);
  shape.closePath();
  return new ExtrudeGeometry(shape, { depth: 0.07, bevelEnabled: false });
}

function AirlinerMesh({ phase }: { phase: FlightPhase }) {
  const air = phase === "climb" || phase === "cruise" || phase === "descent";
  const skin = useMemo(() => paintSkin(), []);
  const mark = useMemo(() => paintMark(), []);
  const fuse = useMemo(() => buildFuselage(), []);
  const wing = useMemo(() => buildWing(false), []);
  const wingL = useMemo(() => buildWing(true), []);
  const fin = useMemo(() => buildFin(), []);
  const fanL = useRef<Group>(null);
  const fanR = useRef<Group>(null);

  useFrame(() => {
    const spin = performance.now() / 40;
    if (fanL.current) fanL.current.rotation.x = spin;
    if (fanR.current) fanR.current.rotation.x = spin;
  });

  return (
    <group>
      <mesh geometry={fuse} castShadow>
        <meshStandardMaterial map={skin} color="#f7f7f8" roughness={0.62} metalness={0.06} />
      </mesh>
      <mesh geometry={wing} position={[0.15, -0.22, 0.2]}>
        <meshStandardMaterial color="#f4f5f7" roughness={0.7} side={DoubleSide} />
      </mesh>
      <mesh geometry={wingL} position={[0.15, -0.22, -0.2]}>
        <meshStandardMaterial color="#f4f5f7" roughness={0.7} side={DoubleSide} />
      </mesh>
      <mesh position={[-0.7, 0.02, 5.15]}>
        <boxGeometry args={[0.42, 0.55, 0.06]} />
        <meshStandardMaterial color="#c8102e" />
      </mesh>
      <mesh position={[-0.7, 0.02, -5.15]}>
        <boxGeometry args={[0.42, 0.55, 0.06]} />
        <meshStandardMaterial color="#c8102e" />
      </mesh>
      <Engine fan={fanL} side={1} />
      <Engine fan={fanR} side={-1} />
      <mesh geometry={fin} position={[0, 0, -0.035]}>
        <meshStandardMaterial color="#c8102e" roughness={0.55} />
      </mesh>
      <mesh position={[-3.25, 1.45, 0.06]}>
        <planeGeometry args={[0.72, 0.72]} />
        <meshBasicMaterial map={mark} transparent />
      </mesh>
      <mesh position={[-3.55, 0.42, 0]} rotation={[0, 0, 0.15]}>
        <boxGeometry args={[1.15, 0.06, 2.5]} />
        <meshStandardMaterial color="#f4f5f7" />
      </mesh>
      <mesh position={[3.55, 0.42, 0]}>
        <sphereGeometry args={[0.42, 16, 12]} />
        <meshStandardMaterial color="#8ecae6" transparent opacity={0.82} roughness={0.05} metalness={0.2} />
      </mesh>
      {air ? (
        <group>
          <mesh position={[-2.4, -0.78, 1.85]}>
            <boxGeometry args={[2.8, 0.04, 0.08]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
          </mesh>
          <mesh position={[-2.4, -0.78, -1.85]}>
            <boxGeometry args={[2.8, 0.04, 0.08]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
          </mesh>
        </group>
      ) : null}
      {!air ? <Gear /> : null}
      <NavLights />
    </group>
  );
}

function Engine({ fan, side }: { fan: RefObject<Group | null>; side: 1 | -1 }) {
  const z = 1.85 * side;
  return (
    <group position={[0.35, -0.78, z]}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.42, 0.5, 1.7, 18]} />
        <meshStandardMaterial color="#e6e8ee" roughness={0.45} metalness={0.25} />
      </mesh>
      <mesh position={[0.78, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.3, 0.3, 0.08, 16]} />
        <meshStandardMaterial color="#1c2430" />
      </mesh>
      <group ref={fan} position={[0.84, 0, 0]}>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[0.02, 0.5, 0.06]} />
          <meshStandardMaterial color="#cbd5e1" />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, Math.PI / 2]}>
          <boxGeometry args={[0.02, 0.5, 0.06]} />
          <meshStandardMaterial color="#cbd5e1" />
        </mesh>
      </group>
    </group>
  );
}

function Gear() {
  return (
    <group>
      {[
        [1.3, 1.05],
        [1.3, -1.05],
        [-1.3, 0],
      ].map(([x, z]) => (
        <mesh key={`${x}-${z}`} position={[x, -1.05, z]}>
          <boxGeometry args={[0.12, 0.7, 0.12]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
      ))}
    </group>
  );
}

function NavLights() {
  return (
    <group>
      <mesh position={[0.2, 0.05, 5.2]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <mesh position={[0.2, 0.05, -5.2]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial color="#22c55e" />
      </mesh>
      <mesh position={[-3.4, 2.2, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}
