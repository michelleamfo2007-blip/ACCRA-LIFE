"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CanvasTexture, SRGBColorSpace, type OrthographicCamera } from "three";
import { Figure } from "@/components/game/low-poly-human";
import { PlacedModel } from "@/components/game/kit-mesh";
import { plasterMap, plankMap, tileMap } from "@/components/game/room-finish";

export type VenueBlock = { x: number; y: number; z: number; w: number; h: number; d: number; color: string };

export type VenueBody = {
  id?: string;
  x: number;
  z: number;
  skin: string;
  shirt: string;
  pants: string;
  hair: string;
  pose: "idle" | "walk" | "act" | "sit" | "dance";
  turn: number;
  body?: "woman" | "man";
  role?: string;
  stature?: string;
  build?: string;
};

function useCastCap() {
  const [cap, setCap] = useState(8);
  useEffect(() => {
    const pick = () => setCap(window.matchMedia("(max-width: 760px)").matches ? 8 : 14);
    pick();
    const query = window.matchMedia("(max-width: 760px)");
    query.addEventListener("change", pick);
    return () => query.removeEventListener("change", pick);
  }, []);
  return cap;
}

const KIT: Record<string, string[]> = {
  shop: ["furniture/bookcaseOpen.glb", "furniture/desk.glb", "furniture/table.glb", "furniture/cabinetTelevision.glb", "furniture/chair.glb"],
  court: ["furniture/desk.glb", "furniture/bookcaseOpen.glb", "furniture/chair.glb", "furniture/table.glb", "furniture/books.glb"],
  market: ["furniture/table.glb", "furniture/kitchenCabinet.glb", "furniture/sideTable.glb", "furniture/chair.glb"],
  clinic: ["furniture/bedSingle.glb", "furniture/desk.glb", "furniture/cabinetTelevision.glb", "furniture/chair.glb"],
  tables: ["furniture/table.glb", "furniture/chair.glb", "furniture/kitchenStove.glb", "furniture/kitchenCabinet.glb", "furniture/loungeChair.glb"],
  hall: ["furniture/desk.glb", "furniture/chair.glb", "furniture/bookcaseOpen.glb", "furniture/table.glb"],
  hotel: ["furniture/loungeSofa.glb", "furniture/desk.glb", "furniture/loungeChair.glb", "furniture/pottedPlant.glb", "furniture/lampRoundFloor.glb"],
  gym: ["furniture/table.glb", "furniture/chair.glb", "furniture/cabinetTelevision.glb"],
  airport: ["furniture/desk.glb", "furniture/chair.glb", "furniture/loungeSofa.glb", "furniture/sideTable.glb"],
  shore: ["furniture/table.glb", "furniture/loungeChair.glb", "furniture/chair.glb", "furniture/pottedPlant.glb"],
  garden: ["furniture/loungeChair.glb", "furniture/table.glb", "furniture/pottedPlant.glb", "furniture/chair.glb"],
};

function signMap(name: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const pen = canvas.getContext("2d");
  if (!pen) return null;
  pen.fillStyle = "#121212";
  pen.fillRect(0, 0, 512, 128);
  pen.fillStyle = "#FCD116";
  pen.fillRect(0, 0, 512, 10);
  pen.fillRect(0, 118, 512, 10);
  pen.fillStyle = "#ffffff";
  pen.font = "700 54px sans-serif";
  pen.textAlign = "center";
  pen.textBaseline = "middle";
  pen.fillText(name.toUpperCase().slice(0, 18), 256, 68);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Match the venue's flat projection so people and the room share one floor. */
function fitIso(camera: OrthographicCamera, width: number, height: number) {
  const viewW = 760;
  const viewH = 480;
  const scale = Math.max(width / viewW, height / viewH);
  const ox = (width - viewW * scale) / 2;
  const oy = (height - viewH * scale) / 2;
  const kx = (2 / width) * 1.85 * scale;
  const ky = (2 / height) * 0.92 * scale;
  const kyH = (2 / height) * 1.85 * scale;
  const dx = (2 / width) * (ox + 390 * scale) - 1;
  const dy = 1 - (2 / height) * (oy + 268 * scale);
  camera.matrix.identity();
  camera.matrixWorld.identity();
  camera.matrixAutoUpdate = false;
  camera.matrixWorldAutoUpdate = false;
  camera.projectionMatrix.set(kx, 0, -kx, dx, -ky, kyH, -ky, dy, -0.001, -0.002, -0.001, 0.5, 0, 0, 0, 1);
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
}

function IsoRig() {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  useFrame(() => {
    const width = gl.domElement.clientWidth || 1;
    const height = gl.domElement.clientHeight || 1;
    fitIso(camera as OrthographicCamera, width, height);
  });
  return null;
}

function CatchShadows() {
  const scene = useThree((state) => state.scene);
  const tick = useRef(0);
  useFrame(() => {
    tick.current += 1;
    if (tick.current % 24 !== 1) return;
    scene.traverse((obj) => {
      const mesh = obj as { isMesh?: boolean; castShadow?: boolean; receiveShadow?: boolean };
      const skinned = mesh as { isSkinnedMesh?: boolean };
      if (!mesh.isMesh || skinned.isSkinnedMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });
  });
  return null;
}

function VenueLamp({ x, y, z, on, night }: { x: number; y: number; z: number; on: boolean; night: boolean }) {
  const glow = on ? (night ? 3.2 : 0.35) : 0;
  return (
    <group position={[x, y, z]}>
      <mesh>
        <boxGeometry args={[3.2, 1.2, 1.4]} />
        <meshStandardMaterial color="#c4b39a" roughness={0.45} metalness={0.3} />
      </mesh>
      <mesh position={[0, -2.2, 1.2]}>
        <sphereGeometry args={[1.5, 16, 12]} />
        <meshStandardMaterial color={on ? "#fff6d4" : "#efe6d4"} emissive={on ? "#ffd27a" : "#000"} emissiveIntensity={on ? 0.8 : 0} />
      </mesh>
      {glow > 0 ? <pointLight position={[0, -2, 6]} color="#ffd7a1" intensity={glow} distance={90} decay={2} /> : null}
    </group>
  );
}

function VenueBlinds({ x, y, z, night }: { x: number; y: number; z: number; night: boolean }) {
  return (
    <group position={[x, y, z]}>
      <mesh>
        <boxGeometry args={[36, 22, 1.2]} />
        <meshStandardMaterial color="#f7f3ea" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0, 0.7]}>
        <boxGeometry args={[30, 16, 0.4]} />
        <meshBasicMaterial color={night ? "#243656" : "#d7eef8"} />
      </mesh>
      {Array.from({ length: 7 }, (_, index) => (
        <mesh key={index} position={[0, 7 - index * 2.2, 1.05]}>
          <boxGeometry args={[29, 0.45, 0.5]} />
          <meshStandardMaterial color="#f4f1ea" roughness={0.7} />
        </mesh>
      ))}
      <pointLight position={[0, 0, 10]} color={night ? "#b7c6dc" : "#fff1d2"} intensity={night ? 0.7 : 1.6} distance={110} decay={2} />
    </group>
  );
}

function DoorSlab({ open }: { open: boolean }) {
  const shift = useRef(0);
  const group = useRef<import("three").Group>(null);
  useFrame((_, dt) => {
    const goal = open ? 22 : 0;
    shift.current += (goal - shift.current) * Math.min(1, dt * 6);
    if (group.current) group.current.position.x = -18 + shift.current;
  });
  return (
    <group ref={group} position={[-18, 16, 77]}>
      <mesh>
        <boxGeometry args={[18, 32, 2.4]} />
        <meshStandardMaterial color="#6b3a24" roughness={0.7} />
      </mesh>
    </group>
  );
}

export function VenueRoom({
  name,
  kind,
  night,
  dark,
  blocks,
  doorOpen,
  bodies,
}: {
  name: string;
  kind: string;
  night: boolean;
  dark: boolean;
  blocks: VenueBlock[];
  doorOpen: boolean;
  bodies: VenueBody[];
}) {
  const outdoor = kind === "shore" || kind === "garden";
  const wood = kind === "court" || kind === "hall";
  const floorColor = outdoor ? (kind === "shore" ? "#e6c892" : "#5d7a3a") : wood ? "#c4894f" : "#f3efe6";
  const floorAccent = outdoor ? floorColor : wood ? "#8d5a32" : "#e4ddd0";
  const map = useMemo(() => (outdoor ? null : wood ? plankMap("#c4894f", "#8d5a32") : tileMap(floorColor, floorAccent)), [outdoor, wood, floorColor, floorAccent]);
  const plaster = useMemo(() => plasterMap(night || dark ? "#d9d0c2" : "#f4efe6"), [night, dark]);
  const label = useMemo(() => signMap(name), [name]);
  const files = KIT[kind] ?? KIT.hall;
  const walls = blocks.filter((block) => block.h >= 40 && (block.w >= 40 || block.d >= 40));
  const pieces = blocks
    .filter((block) => block.h >= 5 && block.h < 40 && block.w >= 10 && block.d >= 8 && block.y < 8)
    .sort((a, b) => b.w * b.d - a.w * a.d)
    .slice(0, 7);
  const lampsOn = !dark;
  const cap = useCastCap();
  const people = bodies.slice(0, cap);
  return (
    <div className="pointer-events-none absolute inset-0">
      <Canvas
        orthographic
        shadows="soft"
        camera={{ position: [0, 0, 0], near: -500, far: 500, left: -1, right: 1, top: 1, bottom: -1 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ width: "100%", height: "100%" }}
      >
        <IsoRig />
        <CatchShadows />
        <color attach="background" args={[outdoor ? (night ? "#1a2430" : "#c5d6a4") : night || dark ? "#1a1814" : "#efe6d4"]} />
        <hemisphereLight args={[night || dark ? "#243044" : "#fff6ea", outdoor ? "#6d8a48" : "#e4d2b4", night || dark ? 0.12 : 0.42]} />
        <ambientLight color={night || dark ? "#241c16" : "#fff8ee"} intensity={dark ? 0.05 : night ? 0.1 : 0.38} />
        <directionalLight
          castShadow
          position={night ? [40, 120, -30] : [-40, 160, -80]}
          color={night || dark ? "#9aadc4" : "#fff3dc"}
          intensity={dark ? 0.08 : night ? 0.28 : 1.05}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={1}
          shadow-camera-far={400}
          shadow-camera-left={-140}
          shadow-camera-right={140}
          shadow-camera-top={140}
          shadow-camera-bottom={-140}
          shadow-bias={-0.0004}
          shadow-normalBias={0.06}
        />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 22]} receiveShadow>
          <planeGeometry args={[236, 168]} />
          <meshStandardMaterial map={map ?? undefined} color={map ? "#ffffff" : floorColor} roughness={wood ? 0.72 : 0.48} />
        </mesh>
        {kind === "shore" ? (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, -42]}>
            <planeGeometry args={[236, 48]} />
            <meshStandardMaterial color="#6eb8d4" roughness={0.25} metalness={0.08} />
          </mesh>
        ) : null}
        {walls.map((block) => (
          <mesh key={`w-${block.x}-${block.z}-${block.w}`} position={[block.x + block.w / 2, block.h / 2, block.z + block.d / 2]}>
            <boxGeometry args={[block.w, block.h, block.d]} />
            <meshStandardMaterial map={plaster ?? undefined} color={plaster ? "#ffffff" : "#f4efe6"} roughness={0.92} />
          </mesh>
        ))}
        {walls.map((block) => (
          <mesh key={`s-${block.x}-${block.z}`} position={[block.x + block.w / 2, 2.2, block.z + block.d / 2]}>
            <boxGeometry args={[block.w + 0.4, 4.4, block.d + 0.6]} />
            <meshStandardMaterial color="#f6f1e6" roughness={0.72} />
          </mesh>
        ))}
        {!outdoor && !dark ? (
          <>
            <VenueBlinds x={-10} y={48} z={-50} night={night} />
            <VenueLamp x={-70} y={58} z={-50} on={lampsOn} night={night} />
            <VenueLamp x={55} y={58} z={-50} on={lampsOn} night={night} />
            <VenueLamp x={-108} y={52} z={20} on={lampsOn} night={night} />
          </>
        ) : null}
        {dark ? <pointLight position={[8, 22, 24]} color="#ffb15a" intensity={6} distance={70} decay={2} /> : null}
        {pieces.map((block, index) => {
          const file = files[index % files.length];
          const wide = Math.max(block.w, block.d);
          const tall = block.h > wide * 0.7;
          return (
            <group key={`${file}-${block.x}-${block.z}`} position={[block.x + block.w / 2, 0, block.z + block.d / 2]} rotation={[0, index % 2 ? Math.PI / 2 : 0, 0]}>
              <PlacedModel file={file} span={tall ? undefined : Math.min(wide * 0.82, 36)} tall={tall ? Math.min(block.h * 0.9, 26) : undefined} quiet />
            </group>
          );
        })}
        <group position={[-78, 0, 48]}>
          <mesh position={[0, 3, 0]}>
            <boxGeometry args={[6, 6, 5]} />
            <meshStandardMaterial color="#c4a574" roughness={0.8} />
          </mesh>
        </group>
        <group position={[62, 0, 58]}>
          <mesh position={[0, 2.4, 0]}>
            <cylinderGeometry args={[2.2, 2.6, 4.8, 12]} />
            <meshStandardMaterial color="#d9dde2" roughness={0.45} metalness={0.2} />
          </mesh>
        </group>
        <group position={[-88, 0, 18]}>
          <PlacedModel file="furniture/pottedPlant.glb" tall={16} quiet />
        </group>
        {label ? (
          <mesh position={outdoor ? [-40, 16, 6] : [-6, 62, -49]}>
            <planeGeometry args={[outdoor ? 48 : 78, outdoor ? 12 : 16]} />
            <meshStandardMaterial map={label} emissiveMap={label} emissive="#ffffff" emissiveIntensity={night || dark ? 0.55 : 0.2} roughness={0.6} />
          </mesh>
        ) : null}
        {!outdoor ? <DoorSlab open={doorOpen} /> : null}
        <People bodies={people} />
      </Canvas>
    </div>
  );
}

export function VenuePeople({ bodies }: { bodies: VenueBody[] }) {
  const people = bodies.slice(0, useCastCap());
  return (
    <div className="pointer-events-none absolute inset-0 z-[5]">
      <Canvas orthographic camera={{ position: [0, 0, 0], near: -500, far: 500, left: -1, right: 1, top: 1, bottom: -1 }} dpr={[1, 1.25]} gl={{ antialias: true, alpha: true }} style={{ width: "100%", height: "100%", pointerEvents: "none" }}>
        <IsoRig />
        <ambientLight intensity={1.45} />
        <directionalLight position={[40, 90, 30]} intensity={1.7} color="#fff4e8" />
        <People bodies={people} />
      </Canvas>
    </div>
  );
}

function People({ bodies }: { bodies: VenueBody[] }) {
  return (
    <>
      {bodies.map((body, index) => (
        <group key={body.id ?? `${body.hair}-${index}`} position={[body.x, 0, body.z]}>
          <Figure
            skin={body.skin}
            shirt={body.shirt}
            pants={body.pants}
            hair={body.hair}
            cloth={body.shirt}
            pattern="Plain"
            outfit="Casual"
            body={body.body ?? "woman"}
            pose={body.pose}
            role={body.role}
            stature={body.stature}
            build={body.build}
            turn={body.turn}
            tall={32}
          />
        </group>
      ))}
    </>
  );
}
