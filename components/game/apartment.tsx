"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ExtrudeGeometry, Shape, SphereGeometry, type Group, type Mesh, type MeshBasicMaterial, type PerspectiveCamera } from "three";
import { AfricanGrey, Aquarium, BathBucket, BedPillow, BowlAndPitcher, BullionVault, CompoundDog, CookingPot, GasCooker, GoldLion, GuitarProp, HouseCat, KenteCloth, KitchenCounter, KitchenSink, LuxuryTv, MosquitoNet, OldPainting, SilkCurtains, SolarKit, StandingFan, StuddedThrone, TransistorRadio, WallAircon, WeightRack } from "@/components/game/home-figures";
import { HouseGarage } from "@/components/game/house-garage";
import { LaptopSet, modelFor, PlacedModel } from "@/components/game/kit-mesh";
import { InteriorFinish, plankMap, PlasterBox, tileMap } from "@/components/game/room-finish";
import { WearMarks } from "@/components/game/wear-marks";
import { goodsOf } from "@/lib/game/wear";
import { Figure } from "@/components/game/low-poly-human";
import { garageBox } from "@/lib/game/garage";
import { DIVIDERS, FIXTURES, fixtureAt, hangSpot, homeLook, moodOf, roomReach, SHOP, type HomeGrade, type Life, type Placed, type ShopItem } from "@/lib/game/world";

export function Apartment({
  life,
  pos,
  pose,
  heading,
  dark,
  night = false,
  bedColor,
  sofaColor,
  onAsk,
  onGo,
  onWalk,
  pieces = [],
  fixtures,
  span = 0,
  picked = null,
  placing = false,
  focus = null,
  guests = [],
  onPick,
  onDrag,
  bays = 1,
  onCar,
  doorOpen = false,
  recoil = null,
  garageShut = false,
  onGarage,
}: {
  life: Life;
  pos: { x: number; z: number };
  pose: "idle" | "walk" | "act" | "sleep" | "sit";
  heading: number;
  dark: boolean;
  night?: boolean;
  bedColor: string;
  sofaColor: string | null;
  onAsk: () => void;
  onGo: (id: string) => void;
  onWalk?: (x: number, z: number) => void;
  pieces?: Placed[];
  fixtures?: Placed[];
  span?: number;
  picked?: string | null;
  placing?: boolean;
  focus?: { x: number; z: number } | null;
  guests?: { name: string; doing?: string }[];
  onPick?: (id: string) => void;
  onDrag?: (x: number, z: number) => void;
  bays?: number;
  onCar?: (key: string, x: number, z: number) => void;
  doorOpen?: boolean;
  recoil?: { x: number; z: number } | null;
  garageShut?: boolean;
  onGarage?: (shut: boolean) => void;
}) {
  const look = homeLook(life.homeId);
  const grade = look.grade;
  const room = roomReach(span);
  const built = fixtures ?? FIXTURES.map((item) => fixtureAt(life, item.id));
  const bedSpot = built.find((piece) => piece.id === "fix-bed") ?? fixtureAt(life, "fix-bed");
  return (
    <Canvas
      shadows="soft"
      camera={{ position: [14, 11, 16], fov: 32 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true }}
      resize={{ scroll: false }}
      style={{ width: "100%", height: "100%", touchAction: "none" }}
    >
      <CameraRig frozen={placing} follow={placing && focus ? focus : pos} lift={placing ? 0.85 : 0} />
      <RoomShadows />
      <color attach="background" args={[dark ? "#100e0c" : night ? "#12182a" : look.sky]} />
      <HouseLight night={night} dark={dark} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0.2]}>
        <circleGeometry args={[22, 64]} />
        <meshLambertMaterial color={dark ? "#3d4a32" : look.yard} />
      </mesh>
      <Floor grade={grade} floorId={life.floor} span={span} />
      <Walls grade={grade} span={span} gap={garageBox(span, bays)} />
      <HouseGarage life={life} span={span} bays={bays} shut={garageShut} onShut={onGarage} onWalk={placing ? undefined : onWalk} onCar={placing ? undefined : onCar} />
      <InteriorFinish span={span} night={night} dark={dark} />
      {grade === "high" ? <Cooler /> : null}
      <Door color={look.door} x={-room.halfW + 0.1} open={doorOpen} onGo={onGo} />
      <FixtureSpot piece={spotOf(built, "fix-bed")} active={picked === "fix-bed"}>
        <Bed color={bedColor} grade={grade} wide={life.inventory.includes("king")} onGo={onGo} />
        <WearMarks cond={goodsOf(life, "fix-bed").cond} dust={goodsOf(life, "fix-bed").dust} kind="bed" id="fix-bed" />
      </FixtureSpot>
      <FixtureSpot piece={spotOf(built, "fix-sofa")} active={picked === "fix-sofa"}>
        <Sofa color={sofaColor ?? look.sofa} onGo={onGo} />
        <WearMarks cond={goodsOf(life, "fix-sofa").cond} dust={goodsOf(life, "fix-sofa").dust} kind="sofa" id="fix-sofa" />
      </FixtureSpot>
      <FixtureSpot piece={spotOf(built, "fix-fridge")} active={picked === "fix-fridge"}>
        <Fridge onGo={onGo} />
      </FixtureSpot>
      <FixtureSpot piece={spotOf(built, "fix-stove")} active={picked === "fix-stove"}>
        <Stove onGo={onGo} />
      </FixtureSpot>
      <FixtureSpot piece={spotOf(built, "fix-toilet")} active={picked === "fix-toilet"}>
        <Toilet onGo={onGo} />
      </FixtureSpot>
      <FixtureSpot piece={spotOf(built, "fix-shower")} active={picked === "fix-shower"}>
        <Shower onGo={onGo} />
      </FixtureSpot>
      <FixtureSpot piece={spotOf(built, "fix-radio")} active={picked === "fix-radio"}>
        <Radio onGo={onGo} />
      </FixtureSpot>
      {DIVIDERS.map((wall) => {
        const spot = FIXTURES.find((item) => item.id === wall.id);
        return (
          <FixtureSpot key={wall.id} piece={spotOf(built, wall.id)} active={picked === wall.id}>
            <Divider at={[spot?.x ?? 0, spot?.z ?? 0]} along={wall.along} length={wall.length} gap={wall.id === "fix-wall-side" ? 1.05 : 0} color={spot?.color ?? "#f3ead8"} onPick={() => onPick?.(wall.id)} />
          </FixtureSpot>
        );
      })}
      {placing && onDrag ? <PlacePad onDrag={onDrag} span={span} /> : null}
      {!placing && onWalk ? <WalkPad onWalk={onWalk} span={span} /> : null}
      {pieces.map((piece) => {
        const item = SHOP.find((entry) => entry.id === piece.id);
        if (!item || item.consume) return null;
        const active = picked === piece.id;
        const hung = hangSpot(item.id, piece.x, piece.z, span);
        const onBed = item.id === "net";
        return (
          <group
            key={piece.id}
            position={onBed ? [bedSpot.x, 0, bedSpot.z] : [hung?.x ?? piece.x, hung?.y ?? 0, hung?.z ?? piece.z]}
            rotation={[0, ((hung?.rot ?? piece.rot) * Math.PI) / 2, 0]}
            onClick={(event) => {
              event.stopPropagation();
              onPick?.(piece.id);
            }}
          >
            {active ? (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
                <ringGeometry args={[0.72, 0.92, 28]} />
                <meshBasicMaterial color="#3DDC6A" transparent opacity={0.95} />
              </mesh>
            ) : null}
            <Prop item={item} />
            <WearMarks cond={goodsOf(life, piece.id).cond} dust={goodsOf(life, piece.id).dust} kind={item.kind} id={item.id} />
          </group>
        );
      })}
      {pose === "sleep" ? (
        <group position={[bedSpot.x, 0, bedSpot.z]} onClick={(event) => { event.stopPropagation(); onAsk(); }}>
          <group position={[0, 0.47, 0.74]} rotation={[-Math.PI / 2, 0, 0]} scale={0.9}>
            <Figure
              skin={life.look.skin}
              shirt={life.look.cloth}
              pants={life.look.body === "woman" ? "#1c2744" : life.look.accent}
              hair={life.look.hair}
              cloth={life.look.cloth}
              pattern={life.look.pattern}
              outfit={life.look.outfit}
              body={life.look.body}
              pose="idle"
              turn={0}
            />
          </group>
          <Box color={bedColor} position={[0, 0.6, 0.34]} size={[life.inventory.includes("king") ? 2.05 : 1.52, 0.1, 1.3]} />
        </group>
      ) : (
        <group
          position={[pos.x + (recoil?.x ?? 0), 0, pos.z + (recoil?.z ?? 0)]}
          onClick={(event) => {
            event.stopPropagation();
            if (pose === "sit" && onWalk) {
              onWalk(pos.x, pos.z + 0.95);
              return;
            }
            onAsk();
          }}
        >
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <circleGeometry args={[0.32, 16]} />
            <meshBasicMaterial color="#1a2418" transparent opacity={0.18} />
          </mesh>
          <Figure
            skin={life.look.skin}
            shirt={life.look.cloth}
            pants={life.look.body === "woman" ? "#1c2744" : life.look.accent}
            hair={life.look.hair}
            cloth={life.look.cloth}
            pattern={life.look.pattern}
            outfit={life.look.outfit}
            body={life.look.body}
            crown={moodOf(life.needs).label === "Happy"}
            pose={pose}
            turn={(heading * 180) / Math.PI}
          />
        </group>
      )}
      {guests.slice(0, 3).map((guest, index) => {
        const atDoor = guest.doing === "door";
        const inKitchen = guest.doing === "eat" || guest.doing === "cook";
        const spot: [number, number, number] = atDoor ? [-4.35, 0, 0.15] : inKitchen ? [3.7, 0, 1.15] : [-1.35 + index * 0.5, 0, 0.35];
        return (
          <group key={guest.name} position={spot}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
              <circleGeometry args={[0.28, 14]} />
              <meshBasicMaterial color="#3b82f6" transparent opacity={0.2} />
            </mesh>
            <Figure
              skin={["#8d5a3b", "#a06a45", "#6b4423"][index % 3]}
              shirt={["#3b82f6", "#FCD116", "#22c55e"][index % 3]}
              pants="#1c2744"
              hair={["Afro", "Bun", "Bob"][index % 3]}
              cloth="#3b82f6"
              pattern="Plain"
              outfit="Casual"
              body={index % 2 === 0 ? "woman" : "man"}
              pose={atDoor || inKitchen ? "idle" : "sit"}
              turn={atDoor ? 90 : 20 + index * 15}
            />
          </group>
        );
      })}
    </Canvas>
  );
}

function CameraRig({ frozen, follow, lift = 0 }: { frozen: boolean; follow: { x: number; z: number }; lift?: number }) {
  const { camera, gl, size } = useThree();
  const pan = useRef({ x: 0, z: 0 });
  const zoom = useRef(1);
  const soft = useRef({ x: follow.x, z: follow.z });
  const frozenRef = useRef(frozen);
  const followRef = useRef(follow);
  const liftRef = useRef(lift);
  frozenRef.current = frozen;
  followRef.current = follow;
  liftRef.current = lift;
  useEffect(() => {
    if (frozen) zoom.current = 0.46;
  }, [frozen]);
  useEffect(() => {
    const el = gl.domElement;
    const pointers = new Map<number, { x: number; y: number }>();
    let pinch = 0;
    let moved = 0;
    let panning = false;
    const down = (event: PointerEvent) => {
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      el.setPointerCapture(event.pointerId);
      moved = 0;
      panning = false;
    };
    const move = (event: PointerEvent) => {
      const prev = pointers.get(event.pointerId);
      if (!prev) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (frozenRef.current) return;
      if (pointers.size >= 2) {
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch > 0) zoom.current = clamp(zoom.current * (pinch / dist), 0.42, 1.85);
        pinch = dist;
        return;
      }
      const dx = event.clientX - prev.x;
      const dy = event.clientY - prev.y;
      moved += Math.abs(dx) + Math.abs(dy);
      if (!panning) {
        if (moved < 22) return;
        panning = true;
      }
      const phone = size.width < 720;
      const step = (phone ? 0.032 : 0.018) * zoom.current;
      pan.current.x = clamp(pan.current.x - dx * step, -6, 6);
      pan.current.z = clamp(pan.current.z + dy * step, -8, 4);
    };
    const up = (event: PointerEvent) => {
      pointers.delete(event.pointerId);
      if (pointers.size < 2) pinch = 0;
      if (panning || moved > 22) event.stopPropagation();
    };
    const wheel = (event: WheelEvent) => {
      if (frozenRef.current) return;
      event.preventDefault();
      zoom.current = clamp(zoom.current * (event.deltaY > 0 ? 1.08 : 0.92), 0.42, 1.85);
    };
    const bump = (event: Event) => {
      const factor = Number((event as CustomEvent).detail ?? 1);
      if (!Number.isFinite(factor) || factor <= 0) return;
      zoom.current = clamp(zoom.current * factor, 0.42, 1.85);
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up, true);
    el.addEventListener("pointercancel", up, true);
    el.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("accralife-home-zoom", bump);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up, true);
      el.removeEventListener("pointercancel", up, true);
      el.removeEventListener("wheel", wheel);
      window.removeEventListener("accralife-home-zoom", bump);
    };
  }, [gl, size.width]);
  useFrame((_, dt) => {
    if (frozenRef.current) zoom.current = Math.min(zoom.current, 0.46);
    soft.current.x += (followRef.current.x - soft.current.x) * Math.min(1, dt * 4.5);
    soft.current.z += (followRef.current.z - soft.current.z) * Math.min(1, dt * 4.5);
    const aspect = size.width / Math.max(1, size.height);
    const phone = aspect < 0.85;
    const distance = (phone ? 11.8 : aspect < 1.15 ? 18 : 20) * zoom.current * (frozenRef.current ? 2.4 : 1);
    const lookX = soft.current.x + pan.current.x;
    const lookY = 0;
    const lookZ = soft.current.z + pan.current.z + (phone ? liftRef.current : liftRef.current * 0.45) - 3.1;
    const lens = camera as PerspectiveCamera;
    lens.position.set(lookX + distance * (phone ? 0.46 : 0.52), lookY + distance * (phone ? 0.68 : 0.54), lookZ + distance * (phone ? 0.5 : 0.58));
    lens.fov = phone ? 38 : 30;
    lens.lookAt(lookX, lookY + (phone ? 0.5 : 0.42), lookZ);
    lens.updateProjectionMatrix();
  });
  return null;
}

function HouseLight({ night, dark }: { night: boolean; dark: boolean }) {
  const day = !night && !dark;
  return (
    <>
      <hemisphereLight args={[day ? "#fff6ea" : dark ? "#1a2233" : "#243044", day ? "#e4d2b4" : "#14110e", day ? 0.46 : dark ? 0.05 : 0.1]} />
      <ambientLight color={day ? "#fff8ee" : dark ? "#1a1612" : "#241c16"} intensity={day ? 0.42 : dark ? 0.04 : 0.08} />
      <directionalLight
        castShadow
        position={day ? [-1.6, 10.5, -8.2] : [2.2, 8, -3.5]}
        color={day ? "#fff3dc" : "#9aadc4"}
        intensity={day ? 1.15 : dark ? 0.05 : 0.18}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={32}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.00045}
        shadow-normalBias={0.04}
        shadow-radius={3}
      />
      {night && !dark ? <pointLight position={[4.55, 1.7, 2.3]} color="#d7e6ff" intensity={3.4} distance={5.2} decay={2} /> : null}
    </>
  );
}

function RoomShadows() {
  const scene = useThree((state) => state.scene);
  const tick = useRef(0);
  useFrame(() => {
    tick.current += 1;
    if (tick.current % 12 !== 1) return;
    scene.traverse((obj) => {
      const mesh = obj as Mesh;
      if (!mesh.isMesh || mesh.userData.skipShadow) return;
      const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      if (list.every((item) => item && (item as MeshBasicMaterial).isMeshBasicMaterial)) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });
  });
  return null;
}

function WalkPad({ onWalk, span = 0 }: { onWalk: (x: number, z: number) => void; span?: number }) {
  return (
    <mesh
      userData={{ skipShadow: true }}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.02, 0]}
      onClick={(event) => {
        event.stopPropagation();
        onWalk(event.point.x, event.point.z);
      }}
    >
      <planeGeometry args={[roomReach(span).halfW * 2 - 1.2, roomReach(span).halfD * 2 - 1.2]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function PlacePad({ onDrag, span = 0 }: { onDrag: (x: number, z: number) => void; span?: number }) {
  return (
    <mesh
      userData={{ skipShadow: true }}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.025, 0]}
      onClick={(event) => {
        event.stopPropagation();
        onDrag(event.point.x, event.point.z);
      }}
      onPointerMove={(event) => {
        if (event.buttons !== 1) return;
        event.stopPropagation();
        onDrag(event.point.x, event.point.z);
      }}
    >
      <planeGeometry args={[roomReach(span).halfW * 2 - 1.2, roomReach(span).halfD * 2 - 1.2]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

function Prop({ item }: { item: ShopItem }) {
  const color = item.color;
  const kit = modelFor(item);
  if (item.kind === "wall") {
    return <Box color={color} position={[0, 0.85, 0]} size={[3.2, 1.7, 0.16]} flat={false} />;
  }
  if (item.kind === "fan") return <StandingFan />;
  if (item.id === "bucket") return <BathBucket color={color} />;
  if (item.id === "bowl-set") return <BowlAndPitcher />;
  if (item.id === "curtains") return <SilkCurtains color={color} />;
  if (item.kind === "tank") return <Aquarium />;
  if (item.kind === "statue") return <GoldLion />;
  if (item.kind === "dog") return <CompoundDog />;
  if (item.kind === "cat") return <HouseCat />;
  if (item.kind === "bird") return <AfricanGrey />;
  if (item.kind === "throne") return <StuddedThrone />;
  if (item.kind === "painting") return <OldPainting />;
  if (item.kind === "vault") return <BullionVault />;
  if (item.id === "solar") return <SolarKit />;
  if (item.kind === "guitar") return <GuitarProp color={color} />;
  if (item.kind === "weights") return <WeightRack />;
  if (item.kind === "ac") return <WallAircon />;
  if (item.id === "kente") return <KenteCloth />;
  if (item.id === "net") return <MosquitoNet />;
  if (item.id === "pillow") return <BedPillow />;
  if (item.id === "pan") return <CookingPot />;
  if (item.id === "kerosene") return <GasCooker simple />;
  if (item.kind === "stove") return <GasCooker />;
  if (item.id === "counter") return <KitchenCounter />;
  if (item.kind === "sink") return <KitchenSink />;
  if (item.kind === "tv") return <LuxuryTv wide={item.size.startsWith("2")} />;
  if (item.kind === "desk") return <LaptopSet />;
  if (item.id === "transistor") return <TransistorRadio />;
  if (kit) return <PlacedModel file={kit.file} tall={kit.tall} span={kit.span} />;
  if (item.kind === "jet") {
    const heavy = item.id === "heavy-jet";
    const body = heavy ? 1.55 : 1.25;
    const span = heavy ? 1.55 : 1.25;
    return (
      <group position={[0, 0.22, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.12, body, 4, 12]} />
          <meshLambertMaterial color={color} />
        </mesh>
        <mesh position={[body / 2 + 0.1, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.12, 0.26, 12]} />
          <meshLambertMaterial color={color} />
        </mesh>
        <mesh position={[0.28, 0.1, 0]}>
          <sphereGeometry args={[0.08, 12, 8]} />
          <meshLambertMaterial color="#8fb4d4" />
        </mesh>
        <mesh position={[0.02, -0.02, 0]}>
          <boxGeometry args={[0.36, 0.03, span]} />
          <meshLambertMaterial color={color} />
        </mesh>
        <mesh position={[-body / 2 + 0.08, 0.16, 0]}>
          <boxGeometry args={[0.2, 0.26, 0.04]} />
          <meshLambertMaterial color={color} />
        </mesh>
        <mesh position={[0.08, -0.1, span * 0.28]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.06, 0.24, 10]} />
          <meshLambertMaterial color="#3a3f46" />
        </mesh>
        <mesh position={[0.08, -0.1, -span * 0.28]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.06, 0.24, 10]} />
          <meshLambertMaterial color="#3a3f46" />
        </mesh>
      </group>
    );
  }
  return <Cushion color={color} position={[0, 0.28, 0]} size={[0.46, 0.36, 0.46]} />;
}

function spotOf(pieces: Placed[], id: string) {
  return pieces.find((piece) => piece.id === id) ?? fixtureAt({ layout: pieces } as Life, id);
}

function FixtureSpot({ piece, active, children }: { piece: Placed; active?: boolean; children: ReactNode }) {
  const base = FIXTURES.find((item) => item.id === piece.id) ?? { x: 0, z: 0 };
  return (
    <group position={[piece.x, 0, piece.z]} rotation={[0, (piece.rot * Math.PI) / 2, 0]}>
      {active ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
          <ringGeometry args={[0.85, 1.08, 28]} />
          <meshBasicMaterial color="#3DDC6A" transparent opacity={0.95} />
        </mesh>
      ) : null}
      <group position={[-base.x, 0, -base.z]}>{children}</group>
    </group>
  );
}

function Floor({ grade, floorId, span = 0 }: { grade: HomeGrade; floorId?: string; span?: number }) {
  const bought = SHOP.find((item) => item.id === floorId && item.kind === "floor");
  const look = homeLook(grade === "low" ? "jamestown" : grade === "hall" ? "legon-hall" : grade === "high" ? "east-legon" : "adabraka");
  const tileA = bought?.color ?? look.tileA;
  const tileB = bought?.accent ?? look.tileB;
  const woodFloor = !bought && (grade === "mid" || grade === "high");
  const lookWood = homeLook(grade === "high" ? "east-legon" : "adabraka");
  const map = useMemo(
    () => (woodFloor ? plankMap(lookWood.woodA, lookWood.woodB) : tileMap(tileA, tileB)),
    [woodFloor, lookWood.woodA, lookWood.woodB, tileA, tileB],
  );
  const room = roomReach(span);
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[room.halfW * 2, room.halfD * 2]} />
      <meshStandardMaterial map={map} color={map ? "#ffffff" : tileA} roughness={woodFloor ? 0.72 : 0.42} metalness={woodFloor ? 0.02 : 0.08} />
    </mesh>
  );
}

function Walls({ grade, span = 0, gap }: { grade: HomeGrade; span?: number; gap?: { doorX0: number; doorX1: number } }) {
  const look = homeLook(grade === "low" ? "jamestown" : grade === "hall" ? "legon-hall" : grade === "high" ? "east-legon" : "adabraka");
  const room = roomReach(span);
  const h = 1.7;
  const y = h / 2;
  const halfW = room.halfW;
  const halfD = room.halfD;
  const backLen = -0.55 - -halfD;
  const backCenter = (-halfD + -0.55) / 2;
  const frontLen = halfD - 0.85;
  const frontCenter = (0.85 + halfD) / 2;
  const doorX0 = Math.max(-halfW + 0.4, gap?.doorX0 ?? -0.1);
  const doorX1 = Math.min(halfW - 0.4, gap?.doorX1 ?? 1.35);
  const leftLen = doorX0 - -halfW;
  const leftCenter = (-halfW + doorX0) / 2;
  const rightLen = halfW - doorX1;
  const rightCenter = (doorX1 + halfW) / 2;
  return (
    <group>
      <PlasterBox color={look.wall} position={[leftCenter, y, -halfD]} size={[leftLen, h, 0.18]} />
      <PlasterBox color={look.wall} position={[rightCenter, y, -halfD]} size={[rightLen, h, 0.18]} />
      <PlasterBox color={look.wall} position={[0, y, halfD]} size={[halfW * 2 + 0.2, h, 0.18]} />
      <PlasterBox color={look.side} position={[halfW, y, 0]} size={[0.18, h, halfD * 2 + 0.16]} />
      <PlasterBox color={look.side} position={[-halfW, y, backCenter]} size={[0.18, h, backLen]} />
      <PlasterBox color={look.side} position={[-halfW, y, frontCenter]} size={[0.18, h, frontLen]} />
      {grade === "low" || grade === "mid" ? <WindowBars rusty={grade === "low"} /> : null}
    </group>
  );
}

function Door({ color, x, open, onGo }: { color: string; x: number; open: boolean; onGo: (id: string) => void }) {
  const hinge = useRef<Group>(null);
  const yaw = useRef(0);
  useFrame((_, dt) => {
    const goal = open ? -1.35 : 0;
    yaw.current += (goal - yaw.current) * Math.min(1, dt * 8);
    if (hinge.current) hinge.current.rotation.y = yaw.current;
  });
  return (
    <group position={[x, 0, -0.26]} onClick={(event) => { event.stopPropagation(); onGo("door"); }}>
      <group ref={hinge}>
        <mesh position={[0.04, 0.95, 0.41]}>
          <boxGeometry args={[0.08, 1.7, 0.82]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
        <mesh position={[0.08, 0.95, 0.41]}>
          <boxGeometry args={[0.02, 1.15, 0.5]} />
          <meshStandardMaterial color="#f4efe6" roughness={0.8} />
        </mesh>
        <mesh position={[0.1, 0.95, 0.62]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.025, 0.025, 0.08, 10]} />
          <meshStandardMaterial color="#c4a46a" metalness={0.4} roughness={0.35} />
        </mesh>
      </group>
    </group>
  );
}

function Divider({ at, along, length, color, onPick, gap = 0 }: { at: [number, number]; along: "x" | "z"; length: number; color: string; onPick: () => void; gap?: number }) {
  const open = gap > 0.4 && gap < length - 0.3;
  const stub = open ? (length - gap) / 2 : length;
  const shift = open ? (stub + gap) / 2 : 0;
  const slab = (offset: number) => {
    const size: [number, number, number] = along === "x" ? [stub, 1.7, 0.16] : [0.16, 1.7, stub];
    const position: [number, number, number] = along === "x" ? [offset, 0.85, 0] : [0, 0.85, offset];
    return <PlasterBox color={color} position={position} size={size} />;
  };
  return (
    <group position={[at[0], 0, at[1]]} onClick={(event) => { event.stopPropagation(); onPick(); }}>
      {open ? (
        <>
          {slab(-shift)}
          {slab(shift)}
        </>
      ) : (
        slab(0)
      )}
    </group>
  );
}

function GuestBed({ color, wide }: { color: string; wide?: boolean }) {
  const span = wide ? 2.05 : 1.5;
  return (
    <group>
      <Pole color="#6b4428" position={[-span * 0.38, 0.12, -0.75]} height={0.22} radius={0.04} />
      <Pole color="#6b4428" position={[span * 0.38, 0.12, -0.75]} height={0.22} radius={0.04} />
      <Pole color="#6b4428" position={[-span * 0.38, 0.12, 0.75]} height={0.22} radius={0.04} />
      <Pole color="#6b4428" position={[span * 0.38, 0.12, 0.75]} height={0.22} radius={0.04} />
      <Cushion color="#6b4428" position={[0, 0.28, 0]} size={[span, 0.1, 1.85]} />
      <Cushion color="#f7f4ef" position={[0, 0.4, 0.06]} size={[span * 0.86, 0.18, 1.55]} />
      <Cushion color={color} position={[0, 0.46, 0.32]} size={[span * 0.8, 0.1, 0.9]} />
      <Cushion color="#6b4428" position={[0, 0.64, -0.86]} size={[span, 0.5, 0.08]} />
      <Puff color="#fffaf4" position={[-0.26, 0.5, -0.48]} size={[0.36, 0.1, 0.22]} />
      <Puff color="#fff" position={[0.26, 0.5, -0.48]} size={[0.36, 0.1, 0.22]} />
    </group>
  );
}

function Bed({ wide, onGo }: { color: string; grade: HomeGrade; wide?: boolean; onGo: (id: string) => void }) {
  return (
    <group position={[2.15, 0, -2.35]} onClick={(event) => { event.stopPropagation(); onGo("bed"); }}>
      <PlacedModel file={wide ? "furniture/bedDouble.glb" : "furniture/bedSingle.glb"} span={wide ? 2.15 : 1.9} />
    </group>
  );
}

function Sofa({ color, onGo }: { color: string; onGo: (id: string) => void }) {
  return (
    <group position={[-1.55, 0, -0.15]} onClick={(event) => { event.stopPropagation(); onGo("chair"); }}>
      <PlacedModel file="furniture/loungeSofa.glb" span={1.7} />
    </group>
  );
}

function Fridge({ onGo }: { onGo: (id: string) => void }) {
  return (
    <group position={[4.55, 0, 1.7]} onClick={(event) => { event.stopPropagation(); onGo("cooler"); }}>
      <PlacedModel file="furniture/kitchenFridgeLarge.glb" tall={1.45} />
    </group>
  );
}

function Stove({ onGo }: { onGo: (id: string) => void }) {
  return (
    <group position={[4.4, 0, 3.05]} onClick={(event) => { event.stopPropagation(); onGo("stove"); }}>
      <group scale={1.25}>
        <GasCooker />
      </group>
    </group>
  );
}

function Toilet({ onGo }: { onGo: (id: string) => void }) {
  return (
    <group position={[-4.7, 0, 3.3]} onClick={(event) => { event.stopPropagation(); onGo("toilet"); }}>
      <PlacedModel file="furniture/toilet.glb" tall={0.72} />
    </group>
  );
}

function Shower({ onGo }: { onGo: (id: string) => void }) {
  return (
    <group position={[-5.15, 0, 1.9]} onClick={(event) => { event.stopPropagation(); onGo("shower"); }}>
      <PlacedModel file="furniture/shower.glb" tall={1.45} />
    </group>
  );
}

function Radio({ onGo }: { onGo: (id: string) => void }) {
  return (
    <group position={[0.35, 0, 1.35]} onClick={(event) => { event.stopPropagation(); onGo("radio"); }}>
      <group scale={1.35}>
        <TransistorRadio />
      </group>
    </group>
  );
}

function WindowBars({ rusty }: { rusty: boolean }) {
  return (
    <group position={[5.9, 1.15, 2.2]}>
      {[-0.22, -0.07, 0.08, 0.23].map((z) => (
        <Box key={z} color={rusty ? "#8a5a3a" : "#dfe6ee"} position={[0, 0, z]} size={[0.04, 0.7, 0.03]} />
      ))}
    </group>
  );
}

function Cooler() {
  return <Box color="#d9dee6" position={[5.7, 1.35, -1.4]} size={[0.16, 0.28, 0.7]} />;
}

function roundedRect(width: number, depth: number, radius: number) {
  const shape = new Shape();
  const x = -width / 2;
  const y = -depth / 2;
  const r = Math.max(0.02, Math.min(radius, width / 2 - 0.01, depth / 2 - 0.01));
  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + depth - r);
  shape.quadraticCurveTo(x + width, y + depth, x + width - r, y + depth);
  shape.lineTo(x + r, y + depth);
  shape.quadraticCurveTo(x, y + depth, x, y + depth - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}

function Cushion({ color, position, size }: { color: string; position: [number, number, number]; size: [number, number, number] }) {
  const geometry = useMemo(() => {
    const bevel = Math.min(0.04, size[1] * 0.3);
    const geo = new ExtrudeGeometry(roundedRect(size[0], size[2], Math.min(0.12, size[0] * 0.18, size[2] * 0.18)), {
      depth: Math.max(size[1] - bevel * 2, 0.02),
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel * 0.7,
      bevelSegments: 2,
      curveSegments: 8,
    });
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, -size[1] / 2, 0);
    geo.computeVertexNormals();
    return geo;
  }, [size[0], size[1], size[2]]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh position={position} geometry={geometry}>
      <meshStandardMaterial color={color} roughness={0.62} metalness={0.03} />
    </mesh>
  );
}

function Puff({ color, position, size }: { color: string; position: [number, number, number]; size: [number, number, number] }) {
  const geometry = useMemo(() => {
    const geo = new SphereGeometry(0.5, 18, 12);
    geo.scale(size[0], Math.max(size[1], 0.05), size[2]);
    geo.computeVertexNormals();
    return geo;
  }, [size[0], size[1], size[2]]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh position={position} geometry={geometry}>
      <meshStandardMaterial color={color} roughness={0.7} />
    </mesh>
  );
}

function Pole({ color, position, height = 0.28, radius = 0.035 }: { color: string; position: [number, number, number]; height?: number; radius?: number }) {
  return (
    <mesh position={position}>
      <cylinderGeometry args={[radius, radius * 0.8, height, 8]} />
      <meshLambertMaterial color={color} />
    </mesh>
  );
}

function Lounge({ color, wide }: { color: string; wide: number }) {
  const wood = "#6b4428";
  return (
    <group>
      <Pole color={wood} position={[-wide * 0.4, 0.09, 0.22]} height={0.16} radius={0.04} />
      <Pole color={wood} position={[wide * 0.4, 0.09, 0.22]} height={0.16} radius={0.04} />
      <Pole color={wood} position={[-wide * 0.4, 0.09, -0.22]} height={0.16} radius={0.04} />
      <Pole color={wood} position={[wide * 0.4, 0.09, -0.22]} height={0.16} radius={0.04} />
      <Cushion color={wood} position={[0, 0.18, 0]} size={[wide * 0.96, 0.06, 0.72]} />
      <Cushion color={color} position={[0, 0.3, 0.08]} size={[wide * 0.82, 0.14, 0.46]} />
      <Cushion color={color} position={[0, 0.56, -0.26]} size={[wide * 0.84, 0.42, 0.12]} />
      <Cushion color={color} position={[-wide * 0.44, 0.42, 0.06]} size={[0.12, 0.26, 0.48]} />
      <Cushion color={color} position={[wide * 0.44, 0.42, 0.06]} size={[0.12, 0.26, 0.48]} />
      <Puff color="#f6f1e8" position={[-wide * 0.18, 0.44, 0.04]} size={[0.24, 0.12, 0.18]} />
      <Puff color="#f6f1e8" position={[wide * 0.18, 0.44, 0.04]} size={[0.24, 0.12, 0.18]} />
    </group>
  );
}

function Icebox({ tall, color }: { tall?: boolean; color: string }) {
  const h = tall ? 1.45 : 0.7;
  const front = 0.32;
  return (
    <group>
      <Cushion color={color} position={[0, h / 2 + 0.04, 0]} size={[0.68, h, 0.58]} />
      <Box color="#9aa8b4" position={[0, tall ? 1.02 : 0.46, front]} size={[0.52, 0.02, 0.02]} />
      <mesh position={[0.24, tall ? 0.72 : 0.34, front]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, tall ? 0.36 : 0.18, 8]} />
        <meshStandardMaterial color="#6d7b88" metalness={0.35} roughness={0.4} />
      </mesh>
    </group>
  );
}

function Cooker() {
  return (
    <group>
      <Cushion color="#f4f4f4" position={[0, 0.36, 0]} size={[0.78, 0.62, 0.58]} />
      <Box color="#1c1c1c" position={[0, 0.7, 0]} size={[0.66, 0.04, 0.48]} />
      {[[-0.16, -0.1], [0.16, -0.1], [-0.16, 0.12], [0.16, 0.12]].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.73, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.07, 0.012, 6, 12]} />
          <meshLambertMaterial color="#3a3f46" />
        </mesh>
      ))}
    </group>
  );
}

function Screen({ wide, color }: { wide: boolean; color: string }) {
  const w = wide ? 1.35 : 0.72;
  return (
    <group>
      <Cushion color="#cbbba6" position={[0, 0.2, 0]} size={[w * 0.7, 0.16, 0.32]} />
      <Box color="#16181c" position={[0, 0.58, 0]} size={[w, 0.52, 0.05]} />
      <Box color={color} position={[0, 0.58, 0.03]} size={[w * 0.9, 0.42, 0.01]} />
    </group>
  );
}

function Box({ color, position, size, flat = true }: { color: string; position: [number, number, number]; size: [number, number, number]; flat?: boolean }) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshLambertMaterial color={color} flatShading={flat} />
    </mesh>
  );
}

