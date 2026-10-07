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
      <Canvas camera={{ position: [-10, 7, 26], fov: 42 }} dpr={[1, 1.6]}>
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
    if (phase === "climb") return { x: 4, y: 4 + progress * 8, z: -6, pitch: 0.22, yaw: -0.08, camY: 10, camZ: 20 };
    if (phase === "cruise") return { x: 2, y: 14, z: -10, pitch: 0.04, yaw: 0.06, camY: 16, camZ: 22 };
    if (phase === "descent") return { x: 0, y: 8, z: -4, pitch: -0.14, yaw: 0.04, camY: 12, camZ: 18 };
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
    camera.position.x = MathUtils.damp(camera.position.x, g.position.x + (parked ? -8 : -10), 2.2, dt);
    camera.position.y = MathUtils.damp(camera.position.y, g.position.y + (parked ? 5 : 6.5), 2.2, dt);
    camera.position.z = MathUtils.damp(camera.position.z, g.position.z + (parked ? 20 : 30), 2.2, dt);
    camera.lookAt(g.position.x, g.position.y + 0.2, g.position.z);
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
const WHITE = "#f7f8fa";
const BELLY = "#d5dbe3";

function paintTitle() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 96;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, 512, 96);
    ctx.fillStyle = RED;
    ctx.font = "700 54px Georgia, 'Times New Roman', serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("PASSION AIRWAYS", 256, 48);
  }
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

function paintBlur() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, 128, 128);
    const hub = ctx.createRadialGradient(64, 64, 4, 64, 64, 60);
    hub.addColorStop(0, "#f8fafc");
    hub.addColorStop(0.18, "#9aa6b5");
    hub.addColorStop(0.45, "rgba(80,92,108,0.55)");
    hub.addColorStop(1, "rgba(40,48,60,0.15)");
    ctx.fillStyle = hub;
    ctx.beginPath();
    ctx.arc(64, 64, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(230,236,242,0.55)";
    ctx.lineWidth = 3;
    for (let blade = 0; blade < 10; blade += 1) {
      ctx.beginPath();
      ctx.arc(64, 64, 46, blade * 0.62, blade * 0.62 + 0.35);
      ctx.stroke();
    }
  }
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

function paintStreak() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const wash = ctx.createLinearGradient(0, 0, 256, 0);
    wash.addColorStop(0, "rgba(255,255,255,0)");
    wash.addColorStop(0.35, "rgba(255,255,255,0.75)");
    wash.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 18, 256, 28);
  }
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
    new Vector2(0, 0),
    new Vector2(0.16, 0.22),
    new Vector2(0.46, 0.62),
    new Vector2(0.78, 1.15),
    new Vector2(0.92, 1.85),
    new Vector2(0.96, 3.1),
    new Vector2(0.96, 6.35),
    new Vector2(0.9, 7.15),
    new Vector2(0.7, 7.75),
    new Vector2(0.4, 8.25),
    new Vector2(0.12, 8.6),
    new Vector2(0, 8.8),
  ];
  const geo = new LatheGeometry(pts, 40);
  geo.translate(0, -4.4, 0);
  geo.rotateZ(-Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

function buildWing(flip: boolean) {
  const shape = new Shape();
  shape.moveTo(1.25, 0.2);
  shape.lineTo(-0.85, 0.08);
  shape.quadraticCurveTo(-1.15, 2.2, -1.9, 4.55);
  shape.lineTo(-0.05, 4.7);
  shape.quadraticCurveTo(0.85, 2.3, 1.25, 0.2);
  shape.closePath();
  const geo = new ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.03, bevelSegments: 1 });
  geo.rotateX(-Math.PI / 2);
  geo.scale(1, 1, flip ? -1 : 1);
  return geo;
}

function buildFin() {
  const shape = new Shape();
  shape.moveTo(0.45, 0);
  shape.lineTo(-0.95, 0.05);
  shape.lineTo(-1.25, 2.15);
  shape.lineTo(-0.15, 1.95);
  shape.closePath();
  const geo = new ExtrudeGeometry(shape, { depth: 0.08, bevelEnabled: false });
  geo.translate(0, 0, -0.04);
  return geo;
}

function buildTailplane(flip: boolean) {
  const shape = new Shape();
  shape.moveTo(0.55, 0.05);
  shape.lineTo(-0.55, 0.02);
  shape.lineTo(-1.15, 1.55);
  shape.lineTo(0.05, 1.4);
  shape.closePath();
  const geo = new ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  geo.scale(1, 1, flip ? -1 : 1);
  return geo;
}

function AirlinerMesh({ phase }: { phase: FlightPhase }) {
  const air = phase === "climb" || phase === "cruise" || phase === "descent";
  const mark = useMemo(() => paintMark(), []);
  const title = useMemo(() => paintTitle(), []);
  const blur = useMemo(() => paintBlur(), []);
  const streak = useMemo(() => paintStreak(), []);
  const fuse = useMemo(() => buildFuselage(), []);
  const wing = useMemo(() => buildWing(false), []);
  const wingL = useMemo(() => buildWing(true), []);
  const fin = useMemo(() => buildFin(), []);
  const tailL = useMemo(() => buildTailplane(false), []);
  const tailR = useMemo(() => buildTailplane(true), []);
  const fanL = useRef<Group>(null);
  const fanR = useRef<Group>(null);

  useFrame(() => {
    const spin = air ? performance.now() / 28 : performance.now() / 90;
    if (fanL.current) fanL.current.rotation.x = spin;
    if (fanR.current) fanR.current.rotation.x = spin;
  });

  return (
    <group>
      <mesh geometry={fuse} castShadow>
        <meshStandardMaterial color={WHITE} roughness={0.45} metalness={0.08} />
      </mesh>
      <mesh position={[0.1, -0.62, 0]} scale={[2.6, 0.28, 0.72]}>
        <sphereGeometry args={[0.7, 18, 12]} />
        <meshStandardMaterial color={BELLY} roughness={0.6} />
      </mesh>
      <mesh geometry={wing} position={[0.15, -0.22, 0.12]} rotation={[0.07, 0, 0]} castShadow>
        <meshStandardMaterial color="#eef1f4" roughness={0.55} side={DoubleSide} />
      </mesh>
      <mesh geometry={wingL} position={[0.15, -0.22, -0.12]} rotation={[-0.07, 0, 0]} castShadow>
        <meshStandardMaterial color="#eef1f4" roughness={0.55} side={DoubleSide} />
      </mesh>
      <mesh position={[-0.7, 0.42, 4.72]} rotation={[0.15, 0.35, 0]}>
        <boxGeometry args={[0.42, 0.72, 0.06]} />
        <meshStandardMaterial color={RED} />
      </mesh>
      <mesh position={[-0.7, 0.42, -4.72]} rotation={[-0.15, -0.35, 0]}>
        <boxGeometry args={[0.42, 0.72, 0.06]} />
        <meshStandardMaterial color={RED} />
      </mesh>
      {[1, -1].map((side) => (
        <group key={side}>
          <mesh position={[0.55, 0.28, 0.98 * side]}>
            <boxGeometry args={[4.6, 0.14, 0.05]} />
            <meshStandardMaterial color="#16324a" roughness={0.25} metalness={0.15} />
          </mesh>
          <mesh position={[0.55, 0.12, 1.0 * side]}>
            <boxGeometry args={[5.4, 0.07, 0.04]} />
            <meshStandardMaterial color={RED} />
          </mesh>
          <mesh position={[1.15, 0.48, 1.02 * side]} rotation={[0, side === 1 ? 0 : Math.PI, 0]}>
            <planeGeometry args={[2.5, 0.38]} />
            <meshBasicMaterial map={title} transparent />
          </mesh>
        </group>
      ))}
      <Engine fan={fanL} blur={blur} side={1} />
      <Engine fan={fanR} blur={blur} side={-1} />
      <mesh geometry={fin} position={[-3.35, 0.42, 0]} castShadow>
        <meshStandardMaterial color={RED} roughness={0.45} side={DoubleSide} />
      </mesh>
      <mesh position={[-3.85, 1.55, 0.06]}>
        <planeGeometry args={[0.72, 0.72]} />
        <meshBasicMaterial map={mark} transparent />
      </mesh>
      <mesh position={[-3.85, 1.55, -0.06]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.72, 0.72]} />
        <meshBasicMaterial map={mark} transparent />
      </mesh>
      <mesh geometry={tailL} position={[-3.55, 0.48, 0.1]}>
        <meshStandardMaterial color={WHITE} roughness={0.5} side={DoubleSide} />
      </mesh>
      <mesh geometry={tailR} position={[-3.55, 0.48, -0.1]}>
        <meshStandardMaterial color={WHITE} roughness={0.5} side={DoubleSide} />
      </mesh>
      {[0.42, -0.42, 0.72, -0.72].map((z) => (
        <mesh key={z} position={[3.35, 0.32, z]} rotation={[0, z > 0 ? 0.7 : -0.7, 0.15 * Math.sign(z)]}>
          <boxGeometry args={[0.34, 0.2, 0.04]} />
          <meshStandardMaterial color="#10283a" roughness={0.12} metalness={0.35} />
        </mesh>
      ))}
      {air ? (
        <group>
          {[1, -1].map((side) => (
            <mesh key={side} position={[-4.2, -0.55, 2.05 * side]}>
              <planeGeometry args={[7.5, 0.55]} />
              <meshBasicMaterial map={streak} transparent opacity={0.7} depthWrite={false} />
            </mesh>
          ))}
        </group>
      ) : null}
      {!air ? <Gear /> : null}
      <NavLights />
    </group>
  );
}

function Engine({ fan, blur, side }: { fan: RefObject<Group | null>; blur: CanvasTexture; side: 1 | -1 }) {
  const z = 2.15 * side;
  return (
    <group position={[0.35, -0.68, z]}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.34, 0.4, 1.45, 22]} />
        <meshStandardMaterial color="#e7ebf0" roughness={0.35} metalness={0.35} />
      </mesh>
      <mesh position={[0.62, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.34, 0.045, 8, 22]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.45} roughness={0.3} />
      </mesh>
      <mesh position={[0.7, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[0.3, 20]} />
        <meshBasicMaterial color="#1c2430" />
      </mesh>
      <group ref={fan} position={[0.74, 0, 0]}>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <circleGeometry args={[0.28, 24]} />
          <meshBasicMaterial map={blur} transparent />
        </mesh>
      </group>
      <mesh position={[-0.72, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.28, 0.28, 14]} />
        <meshStandardMaterial color="#2c3440" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0.05, 0.38, 0]}>
        <boxGeometry args={[0.85, 0.1, 0.1]} />
        <meshStandardMaterial color="#d5dbe3" />
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
      <mesh position={[-0.55, 0.55, 4.7]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <mesh position={[-0.55, 0.55, -4.7]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshBasicMaterial color="#22c55e" />
      </mesh>
      <mesh position={[-4.35, 2.45, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}
