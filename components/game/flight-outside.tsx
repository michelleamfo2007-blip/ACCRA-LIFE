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
      <Canvas camera={{ position: [-4, 4.2, 12], fov: 30 }} dpr={[1, 1.6]}>
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
  const shadow = useRef<Group>(null);
  const air = phase === "climb" || phase === "cruise" || phase === "descent";

  const pose = useMemo(() => {
    if (phase === "boarding") return { x: -1.2, y: 1.34, z: 0, pitch: 0, yaw: -0.38, camY: 7, camZ: 16 };
    if (phase === "taxi") return { x: 2 + progress * 4, y: 1.34, z: 0, pitch: 0, yaw: -0.22, camY: 7, camZ: 15 };
    if (phase === "climb") return { x: 4, y: 4 + progress * 8, z: -6, pitch: -0.28, yaw: -0.1, camY: 10, camZ: 20 };
    if (phase === "cruise") return { x: 2, y: 14, z: -10, pitch: -0.05, yaw: 0.08, camY: 16, camZ: 22 };
    if (phase === "descent") return { x: 0, y: 8, z: -4, pitch: 0.18, yaw: 0.05, camY: 12, camZ: 18 };
    return { x: 3, y: 1.34, z: 2, pitch: 0, yaw: -0.2, camY: 7, camZ: 15 };
  }, [phase, progress]);

  useFrame(({ camera }, dt) => {
    if (!plane.current || !ground.current || !shadow.current) return;
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
    const parked = !air;
    camera.position.x = MathUtils.damp(camera.position.x, g.position.x + (parked ? -2.2 : -7), 2.2, dt);
    camera.position.y = MathUtils.damp(camera.position.y, g.position.y + (parked ? 2.35 : 4.2), 2.2, dt);
    camera.position.z = MathUtils.damp(camera.position.z, g.position.z + (parked ? 10.2 : 15), 2.2, dt);
    camera.lookAt(g.position.x + 0.15, g.position.y + 0.15, g.position.z);
    shadow.current.position.x = g.position.x;
    shadow.current.position.z = g.position.z;
    shadow.current.scale.set(air ? 0.55 : 1, 1, air ? 0.55 : 1);
    const shade = shadow.current.children[0] as { material?: { opacity: number } };
    if (shade.material) shade.material.opacity = air ? 0.12 : 0.38;
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
      <group ref={shadow} position={[-1.2, 0.03, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[3.4, 1.15, 1]}>
          <circleGeometry args={[1, 28]} />
          <meshBasicMaterial color="#1a2030" transparent opacity={0.38} depthWrite={false} />
        </mesh>
      </group>
      <group ref={plane} position={[-1.2, 1.34, 0]}>
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
        wash.addColorStop(0, "#2a62a8");
        wash.addColorStop(0.46, "#7eb4e4");
        wash.addColorStop(0.78, "#d5e8f6");
        wash.addColorStop(1, "#eef5f8");
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
  const asphalt = night ? "#3e4652" : "#6a727c";
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 8]}>
        <planeGeometry args={[160, 28]} />
        <meshStandardMaterial color={night ? "#2f5a32" : "#7ea24a"} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -10]}>
        <planeGeometry args={[160, 28]} />
        <meshStandardMaterial color={night ? "#2f5a32" : "#8aaf52"} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <planeGeometry args={[150, 18]} />
        <meshStandardMaterial color={asphalt} roughness={0.92} />
      </mesh>
      {[-6.6, 6.6].map((z) => (
        <mesh key={z} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, z]}>
          <planeGeometry args={[150, 0.12]} />
          <meshBasicMaterial color="#f8fafc" />
        </mesh>
      ))}
      {Array.from({ length: 14 }, (_, i) => -62 + i * 9).map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.055, 0]}>
          <planeGeometry args={[4.2, 0.28]} />
          <meshBasicMaterial color="#FCD116" />
        </mesh>
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

const RED = "#c8102e";
const GOLD = "#f5c518";

function paintSkin() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new CanvasTexture(canvas);
  ctx.fillStyle = "#f7f8fa";
  ctx.fillRect(0, 0, 1024, 512);
  const side = (around: number, flip: boolean) => {
    const y = (1 - around) * 512;
    ctx.save();
    ctx.translate(470, y);
    if (flip) ctx.scale(-1, 1);
    ctx.fillStyle = RED;
    ctx.fillRect(-340, -6, 620, 14);
    ctx.font = "700 34px Georgia, 'Times New Roman', serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("PASSION AIRWAYS", 10, -26);
    ctx.fillStyle = "#1e293b";
    ctx.font = "700 15px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText("9G-PAD", -300, 20);
    ctx.fillStyle = "#16324a";
    for (let i = 0; i < 12; i += 1) ctx.fillRect(-150 + i * 28, 8, 14, 10);
    ctx.restore();
  };
  side(0.75, false);
  side(0.25, true);
  ctx.fillStyle = "#10283a";
  ctx.beginPath();
  ctx.ellipse(900, 256, 42, 28, 0, 0, Math.PI * 2);
  ctx.fill();
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
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.arc(128, 128, 112, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = RED;
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
    new Vector2(0.02, 0),
    new Vector2(0.2, 0.28),
    new Vector2(0.48, 0.75),
    new Vector2(0.78, 1.45),
    new Vector2(0.94, 2.3),
    new Vector2(0.99, 3.5),
    new Vector2(0.99, 5.6),
    new Vector2(0.9, 6.7),
    new Vector2(0.58, 7.55),
    new Vector2(0.26, 8.15),
    new Vector2(0.04, 8.5),
  ];
  const geo = new LatheGeometry(pts, 32, Math.PI / 2);
  geo.translate(0, -4.25, 0);
  geo.rotateZ(-Math.PI / 2);
  const uv = geo.getAttribute("uv");
  for (let i = 0; i < uv.count; i += 1) {
    const around = uv.getX(i);
    const along = uv.getY(i);
    uv.setXY(i, along, around);
  }
  uv.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

function buildWing(flip: boolean) {
  const shape = new Shape();
  shape.moveTo(1.45, 0.42);
  shape.lineTo(-1.05, 0.55);
  shape.lineTo(-2.35, 5.05);
  shape.lineTo(-0.35, 4.85);
  shape.closePath();
  const geo = new ExtrudeGeometry(shape, { depth: 0.09, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.03, bevelSegments: 1 });
  geo.rotateX(-Math.PI / 2);
  if (flip) geo.scale(1, 1, -1);
  return geo;
}

function buildFin() {
  const shape = new Shape();
  shape.moveTo(0.15, 0.2);
  shape.lineTo(-1.45, 0.05);
  shape.lineTo(-1.15, 1.85);
  shape.lineTo(-0.05, 1.65);
  shape.closePath();
  return new ExtrudeGeometry(shape, { depth: 0.08, bevelEnabled: false });
}

function buildTailplane(flip: boolean) {
  const shape = new Shape();
  shape.moveTo(0.15, 0.12);
  shape.lineTo(-1.05, 0.18);
  shape.lineTo(-1.25, 1.35);
  shape.lineTo(-0.15, 1.2);
  shape.closePath();
  const geo = new ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  if (flip) geo.scale(1, 1, -1);
  return geo;
}

function AirlinerMesh({ phase }: { phase: FlightPhase }) {
  const air = phase === "climb" || phase === "cruise" || phase === "descent";
  const skin = useMemo(() => paintSkin(), []);
  const mark = useMemo(() => paintMark(), []);
  const fuse = useMemo(() => buildFuselage(), []);
  const wing = useMemo(() => buildWing(false), []);
  const wingL = useMemo(() => buildWing(true), []);
  const fin = useMemo(() => buildFin(), []);
  const tailL = useMemo(() => buildTailplane(false), []);
  const tailR = useMemo(() => buildTailplane(true), []);
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
      <mesh geometry={wing} position={[0.2, -0.15, 0.15]} rotation={[0.08, 0, 0]}>
        <meshStandardMaterial color="#f4f5f7" roughness={0.7} side={DoubleSide} />
      </mesh>
      <mesh geometry={wingL} position={[0.2, -0.15, -0.15]} rotation={[-0.08, 0, 0]}>
        <meshStandardMaterial color="#f4f5f7" roughness={0.7} side={DoubleSide} />
      </mesh>
      <mesh position={[-0.85, 0.08, 4.95]}>
        <boxGeometry args={[0.7, 0.22, 0.08]} />
        <meshStandardMaterial color={RED} />
      </mesh>
      <mesh position={[-0.85, 0.08, -4.95]}>
        <boxGeometry args={[0.7, 0.22, 0.08]} />
        <meshStandardMaterial color={RED} />
      </mesh>
      <Engine fan={fanL} side={1} />
      <Engine fan={fanR} side={-1} />
      <mesh geometry={fin} position={[-3.55, 0.35, -0.04]}>
        <meshStandardMaterial color={RED} roughness={0.5} side={DoubleSide} />
      </mesh>
      <mesh position={[-4.15, 1.35, 0.05]}>
        <planeGeometry args={[0.7, 0.7]} />
        <meshBasicMaterial map={mark} transparent />
      </mesh>
      <mesh position={[-4.15, 1.35, -0.05]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.7, 0.7]} />
        <meshBasicMaterial map={mark} transparent />
      </mesh>
      <mesh geometry={tailL} position={[-3.7, 0.42, 0.12]}>
        <meshStandardMaterial color="#f7f8fa" roughness={0.6} side={DoubleSide} />
      </mesh>
      <mesh geometry={tailR} position={[-3.7, 0.42, -0.12]}>
        <meshStandardMaterial color="#f7f8fa" roughness={0.6} side={DoubleSide} />
      </mesh>
      <mesh position={[3.85, 0.18, 0]} scale={[1.15, 0.72, 0.9]}>
        <sphereGeometry args={[0.38, 16, 12]} />
        <meshStandardMaterial color="#16324a" roughness={0.15} metalness={0.25} />
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
  const z = 2.15 * side;
  return (
    <group position={[0.55, -0.72, z]}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.38, 0.46, 1.55, 20]} />
        <meshStandardMaterial color="#e8eaef" roughness={0.4} metalness={0.28} />
      </mesh>
      <mesh position={[0.72, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.28, 0.28, 0.08, 16]} />
        <meshStandardMaterial color="#1c2430" />
      </mesh>
      <group ref={fan} position={[0.78, 0, 0]}>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[0.02, 0.48, 0.07]} />
          <meshStandardMaterial color="#d5dde6" />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, Math.PI / 2]}>
          <boxGeometry args={[0.02, 0.48, 0.07]} />
          <meshStandardMaterial color="#d5dde6" />
        </mesh>
      </group>
      <mesh position={[-0.15, 0.42, 0]}>
        <boxGeometry args={[0.7, 0.08, 0.12]} />
        <meshStandardMaterial color="#d5dae2" />
      </mesh>
    </group>
  );
}

function Wheel({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.58, 0]}>
        <boxGeometry args={[0.07, 0.9, 0.07]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.12, 14]} />
        <meshStandardMaterial color="#1c2430" roughness={0.7} />
      </mesh>
    </group>
  );
}

function Gear() {
  return (
    <group>
      <Wheel position={[2.15, -1.22, 0]} />
      <Wheel position={[-0.15, -1.22, 0.95]} />
      <Wheel position={[-0.15, -1.22, -0.95]} />
    </group>
  );
}

function NavLights() {
  return (
    <group>
      <mesh position={[-0.4, 0.12, 5.05]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <mesh position={[-0.4, 0.12, -5.05]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshBasicMaterial color="#22c55e" />
      </mesh>
      <mesh position={[-4.55, 2.05, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}
