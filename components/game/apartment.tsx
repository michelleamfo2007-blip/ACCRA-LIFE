"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CanvasTexture, ExtrudeGeometry, RepeatWrapping, Shape, SphereGeometry, SRGBColorSpace, type PerspectiveCamera } from "three";
import { Figure } from "@/components/game/low-poly-human";
import { FIXTURES, fixtureAt, homeLook, moodOf, roomReach, SHOP, type HomeGrade, type Life, type Placed, type ShopItem } from "@/lib/game/world";

export function Apartment({
  life,
  pos,
  pose,
  heading,
  dark,
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
}: {
  life: Life;
  pos: { x: number; z: number };
  pose: "idle" | "walk" | "act" | "sleep" | "sit";
  heading: number;
  dark: boolean;
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
}) {
  const look = homeLook(life.homeId);
  const grade = look.grade;
  const room = roomReach(span);
  const built = fixtures ?? FIXTURES.map((item) => fixtureAt(life, item.id));
  const bedSpot = built.find((piece) => piece.id === "fix-bed") ?? fixtureAt(life, "fix-bed");
  return (
    <Canvas
      camera={{ position: [18, 24, 20], fov: 38 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true }}
      resize={{ scroll: false }}
      style={{ width: "100%", height: "100%", touchAction: "none" }}
    >
      <CameraRig frozen={placing} follow={placing && focus ? focus : pos} lift={placing ? 0.85 : 0} />
      <color attach="background" args={[dark ? "#10131a" : look.sky]} />
      <ambientLight intensity={dark ? 0.22 : grade === "low" ? 0.42 : grade === "high" ? 1.05 : grade === "hall" ? 0.72 : 0.82} />
      <directionalLight position={[6, 16, 8]} intensity={dark ? 0.15 : grade === "low" ? 0.45 : grade === "high" ? 1.15 : 0.95} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0.2]}>
        <circleGeometry args={[22, 64]} />
        <meshLambertMaterial color={dark ? "#3d4a32" : look.yard} />
      </mesh>
      <Floor grade={grade} floorId={life.floor} span={span} />
      <Walls grade={grade} span={span} />
      {grade === "hall" ? <StripLight /> : null}
      {grade === "high" ? <Cooler /> : null}
      {!dark && grade !== "low" && grade !== "hall" ? <Sconces /> : null}
      {grade === "low" ? <Bulb /> : null}
      <Door color={look.door} x={-room.halfW + 0.1} onGo={onGo} />
      <FixtureSpot piece={spotOf(built, "fix-bed")} active={picked === "fix-bed"}>
        <Bed color={bedColor} grade={grade} wide={life.inventory.includes("king")} onGo={onGo} />
      </FixtureSpot>
      <FixtureSpot piece={spotOf(built, "fix-sofa")} active={picked === "fix-sofa"}>
        <Sofa color={sofaColor ?? look.sofa} onGo={onGo} />
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
      {placing && onDrag ? <PlacePad onDrag={onDrag} span={span} /> : null}
      {!placing && onWalk ? <WalkPad onWalk={onWalk} span={span} /> : null}
      {pieces.map((piece) => {
        const item = SHOP.find((entry) => entry.id === piece.id);
        if (!item || item.consume || item.kind === "bed") return null;
        const active = picked === piece.id;
        return (
          <group
            key={piece.id}
            position={[piece.x, 0, piece.z]}
            rotation={[0, (piece.rot * Math.PI) / 2, 0]}
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
        <group position={[pos.x, 0, pos.z]} onClick={(event) => { event.stopPropagation(); onAsk(); }}>
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
      pan.current.x = clamp(pan.current.x - dx * step, -4.2, 4.2);
      pan.current.z = clamp(pan.current.z + dy * step, -3.4, 3.4);
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
    const lookZ = soft.current.z + pan.current.z + (phone ? liftRef.current : liftRef.current * 0.45);
    const lens = camera as PerspectiveCamera;
    lens.position.set(lookX + distance * (phone ? 0.36 : 0.42), lookY + distance * (phone ? 0.88 : 0.72), lookZ + distance * (phone ? 0.42 : 0.5));
    lens.fov = phone ? 38 : 30;
    lens.lookAt(lookX, lookY + (phone ? 0.35 : 0), lookZ);
    lens.updateProjectionMatrix();
  });
  return null;
}

function WalkPad({ onWalk, span = 0 }: { onWalk: (x: number, z: number) => void; span?: number }) {
  return (
    <mesh
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
  if (item.kind === "chair") {
    return (
      <group>
        <mesh position={[0, 0.34, 0.02]}>
          <cylinderGeometry args={[0.2, 0.22, 0.08, 18]} />
          <meshStandardMaterial color={color} roughness={0.55} />
        </mesh>
        <Cushion color={color} position={[0, 0.58, -0.18]} size={[0.4, 0.32, 0.1]} />
        <Pole color="#4a3424" position={[-0.16, 0.16, -0.14]} height={0.3} />
        <Pole color="#4a3424" position={[0.16, 0.16, -0.14]} height={0.3} />
        <Pole color="#4a3424" position={[-0.16, 0.16, 0.16]} height={0.3} />
        <Pole color="#4a3424" position={[0.16, 0.16, 0.16]} height={0.3} />
      </group>
    );
  }
  if (item.kind === "sofa") {
    return <Lounge color={color} wide={item.size.startsWith("3") ? 1.9 : 1.55} />;
  }
  if (item.kind === "table") {
    return (
      <group>
        <Cushion color={color} position={[0, 0.46, 0]} size={[1.2, 0.08, 0.72]} />
        <Pole color="#6b4428" position={[-0.46, 0.22, -0.26]} height={0.42} />
        <Pole color="#6b4428" position={[0.46, 0.22, -0.26]} height={0.42} />
        <Pole color="#6b4428" position={[-0.46, 0.22, 0.26]} height={0.42} />
        <Pole color="#6b4428" position={[0.46, 0.22, 0.26]} height={0.42} />
      </group>
    );
  }
  if (item.kind === "fan") {
    return (
      <group>
        <Pole color="#9aa3ad" position={[0, 0.55, 0]} height={1.05} radius={0.03} />
        <mesh position={[0, 1.08, 0.08]}>
          <cylinderGeometry args={[0.2, 0.2, 0.06, 16]} />
          <meshLambertMaterial color={color} />
        </mesh>
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.2, 0.04, 16]} />
          <meshLambertMaterial color="#c5ced6" />
        </mesh>
      </group>
    );
  }
  if (item.kind === "ac") {
    return <Box color={color} position={[0, 0.7, 0]} size={[0.85, 0.28, 0.28]} />;
  }
  if (item.kind === "lamp") {
    return (
      <group>
        <Pole color="#d7dde4" position={[0, 0.38, 0]} height={0.7} radius={0.035} />
        <mesh position={[0, 0.78, 0]}>
          <sphereGeometry args={[0.16, 16, 12]} />
          <meshLambertMaterial color={color} emissive={color} emissiveIntensity={0.35} />
        </mesh>
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.14, 0.04, 12]} />
          <meshLambertMaterial color="#c5ced6" />
        </mesh>
      </group>
    );
  }
  if (item.kind === "fridge") {
    const tall = item.id === "double-fridge";
    return <Icebox tall={tall} color={color} />;
  }
  if (item.kind === "stove") {
    return <Cooker />;
  }
  if (item.kind === "sink") {
    return (
      <group>
        <Box color={color} position={[0, 0.36, 0]} size={[0.7, 0.42, 0.46]} />
        <Box color="#f7f7f7" position={[0, 0.6, 0]} size={[0.36, 0.06, 0.24]} />
      </group>
    );
  }
  if (item.kind === "toilet") {
    return (
      <group>
        <Box color={color} position={[0, 0.22, 0.08]} size={[0.36, 0.22, 0.42]} />
        <Box color={color} position={[0, 0.42, -0.16]} size={[0.32, 0.4, 0.12]} />
      </group>
    );
  }
  if (item.kind === "shower") {
    return <Box color={color} position={[0, 0.7, 0]} size={[0.55, 1.3, 0.55]} />;
  }
  if (item.kind === "tv") {
    const wide = item.size.startsWith("2");
    return <Screen wide={wide} color={color} />;
  }
  if (item.kind === "desk") {
    return (
      <group>
        <Box color={color} position={[0, 0.42, 0]} size={[0.9, 0.08, 0.5]} />
        <Box color="#8a623c" position={[-0.36, 0.2, 0]} size={[0.06, 0.4, 0.4]} />
        <Box color="#8a623c" position={[0.36, 0.2, 0]} size={[0.06, 0.4, 0.4]} />
        <Box color="#9aa7b2" position={[0.12, 0.52, 0]} size={[0.28, 0.16, 0.2]} />
        <Box color="#f3b7c4" position={[-0.28, 0.28, 0.28]} size={[0.22, 0.28, 0.22]} />
      </group>
    );
  }
  if (item.kind === "guitar") {
    return (
      <group>
        <Box color="#5c4030" position={[0, 0.55, 0]} size={[0.06, 0.7, 0.06]} />
        <Box color={color} position={[0, 0.22, 0]} size={[0.28, 0.18, 0.18]} />
      </group>
    );
  }
  if (item.kind === "weights") {
    return (
      <group>
        <Box color={color} position={[0, 0.22, 0]} size={[0.7, 0.16, 0.22]} />
        <Box color="#c4563a" position={[0, 0.34, 0]} size={[0.36, 0.1, 0.1]} />
      </group>
    );
  }
  if (item.kind === "plant") {
    return (
      <group>
        <mesh position={[0, 0.14, 0]}>
          <cylinderGeometry args={[0.12, 0.1, 0.22, 12]} />
          <meshLambertMaterial color="#c4a46a" />
        </mesh>
        <mesh position={[0, 0.42, 0]}>
          <sphereGeometry args={[0.2, 12, 10]} />
          <meshLambertMaterial color={color} />
        </mesh>
        <mesh position={[-0.12, 0.58, 0.04]}>
          <sphereGeometry args={[0.12, 10, 8]} />
          <meshLambertMaterial color={item.accent ?? "#1f8a70"} />
        </mesh>
        <mesh position={[0.14, 0.56, -0.02]}>
          <sphereGeometry args={[0.11, 10, 8]} />
          <meshLambertMaterial color={color} />
        </mesh>
      </group>
    );
  }
  if (item.kind === "rug") {
    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <circleGeometry args={[0.85, 24]} />
        <meshLambertMaterial color={color} />
      </mesh>
    );
  }
  if (item.kind === "curtain") {
    return <Box color={color} position={[0, 0.7, 0]} size={[0.7, 1.2, 0.08]} />;
  }
  if (item.kind === "tank") {
    return (
      <group>
        <Box color="#1c1c1c" position={[0, 0.16, 0]} size={[0.7, 0.16, 0.4]} />
        <Box color={color} position={[0, 0.48, 0]} size={[0.66, 0.42, 0.36]} />
        <Box color="#1c1c1c" position={[0, 0.74, 0]} size={[0.7, 0.08, 0.4]} />
      </group>
    );
  }
  if (item.kind === "statue" || item.kind === "vault") {
    return <Box color={color} position={[0, item.kind === "vault" ? 0.45 : 0.32, 0]} size={item.kind === "vault" ? [0.55, 0.85, 0.4] : [0.4, 0.55, 0.28]} />;
  }
  if (item.kind === "dog" || item.kind === "cat") {
    const small = item.kind === "cat";
    return (
      <group>
        <Box color={color} position={[0, small ? 0.16 : 0.22, 0]} size={small ? [0.42, 0.18, 0.2] : [0.58, 0.26, 0.26]} />
        <Box color={color} position={[small ? 0.2 : 0.28, small ? 0.26 : 0.36, 0]} size={small ? [0.16, 0.14, 0.14] : [0.22, 0.18, 0.18]} />
      </group>
    );
  }
  if (item.kind === "bird") {
    return (
      <group>
        <Box color="#5c4030" position={[0, 0.35, 0]} size={[0.06, 0.7, 0.06]} />
        <mesh position={[0, 0.75, 0]}>
          <sphereGeometry args={[0.12, 10, 8]} />
          <meshLambertMaterial color={color} />
        </mesh>
      </group>
    );
  }
  if (item.kind === "throne") {
    return (
      <group>
        <Box color={color} position={[0, 0.28, 0]} size={[0.55, 0.16, 0.5]} />
        <Box color={color} position={[0, 0.7, -0.18]} size={[0.55, 0.7, 0.12]} />
        <Box color="#c4a46a" position={[0, 1.1, -0.18]} size={[0.12, 0.16, 0.12]} />
      </group>
    );
  }
  if (item.kind === "painting") {
    return (
      <group position={[0, 0.72, 0]}>
        <Box color="#f4efe6" position={[0, 0, 0]} size={[0.78, 0.62, 0.04]} />
        <Box color={color} position={[0, 0, 0.03]} size={[0.62, 0.46, 0.02]} />
        <Box color={item.accent ?? "#FCD116"} position={[-0.08, -0.04, 0.045]} size={[0.22, 0.16, 0.01]} />
      </group>
    );
  }
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
  const map = useMemo(() => tiles(tileA, tileB), [tileA, tileB]);
  const room = roomReach(span);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[room.halfW * 2, room.halfD * 2]} />
      <meshLambertMaterial map={map} />
    </mesh>
  );
}

function Walls({ grade, span = 0 }: { grade: HomeGrade; span?: number }) {
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
  return (
    <group>
      <Box color={look.wall} position={[0, y, -halfD]} size={[halfW * 2 + 0.2, h, 0.18]} />
      <Box color={look.wall} position={[0, y, halfD]} size={[halfW * 2 + 0.2, h, 0.18]} />
      <Box color={look.side} position={[halfW, y, 0]} size={[0.18, h, halfD * 2 + 0.16]} />
      <Box color={look.side} position={[-halfW, y, backCenter]} size={[0.18, h, backLen]} />
      <Box color={look.side} position={[-halfW, y, frontCenter]} size={[0.18, h, frontLen]} />
      <Box color={look.wall} position={[3.4, y, -1.35]} size={[3.2, h, 0.16]} />
      <Box color={look.side} position={[-3.15, y, 2.85]} size={[0.16, h, 3.1]} />
      <Box color={look.wall} position={[-4.6, y, 1.25]} size={[2.6, h, 0.16]} />
      {grade === "mid" || grade === "high" ? <WoodFloor pale={grade === "high"} /> : null}
      {grade === "high" ? <Rug /> : null}
      {grade === "low" || grade === "mid" ? <WindowBars rusty={grade === "low"} /> : null}
    </group>
  );
}

function WoodFloor({ pale }: { pale: boolean }) {
  const map = useMemo(() => wood(pale ? "#f3ead6" : "#e7d2a4", pale ? "#e6d7b4" : "#dcc497"), [pale]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3.2, 0.012, -2.9]}>
      <planeGeometry args={[3.6, 3]} />
      <meshLambertMaterial map={map} />
    </mesh>
  );
}

function Sconces() {
  return (
    <group>
      <Light at={[-2.2, 1.7, -4.35]} />
      <Light at={[2.4, 1.7, -4.35]} />
      <Light at={[5.85, 1.7, 1.2]} />
    </group>
  );
}

function Light({ at }: { at: [number, number, number] }) {
  return (
    <mesh position={at}>
      <sphereGeometry args={[0.08, 8, 6]} />
      <meshBasicMaterial color="#fff4c4" />
    </mesh>
  );
}

function Door({ color, x, onGo }: { color: string; x: number; onGo: (id: string) => void }) {
  return (
    <group position={[x, 0.95, 0.15]} onClick={(event) => { event.stopPropagation(); onGo("door"); }}>
      <mesh>
        <boxGeometry args={[0.08, 1.7, 0.82]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0.05, 0.12, 0]}>
        <boxGeometry args={[0.02, 1.15, 0.5]} />
        <meshStandardMaterial color="#f4efe6" roughness={0.8} />
      </mesh>
      <mesh position={[0.07, 0, 0.22]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, 0.08, 10]} />
        <meshStandardMaterial color="#c4a46a" metalness={0.4} roughness={0.35} />
      </mesh>
    </group>
  );
}

function Bed({ color, grade, wide, onGo }: { color: string; grade: HomeGrade; wide?: boolean; onGo: (id: string) => void }) {
  const frame = grade === "hall" ? "#8b9094" : grade === "low" ? "#5c4030" : grade === "high" ? "#c4a46a" : "#6b4428";
  const sheet = grade === "low" ? "#d9cbb6" : grade === "high" ? "#fffdf8" : "#f7f4ef";
  const span = wide ? 2.2 : 1.7;
  const linen = wide ? 1.95 : 1.48;
  return (
    <group position={[2.15, 0, -2.35]} onClick={(event) => { event.stopPropagation(); onGo("bed"); }}>
      <Pole color={frame} position={[-span * 0.38, 0.12, -0.82]} height={0.22} radius={0.045} />
      <Pole color={frame} position={[span * 0.38, 0.12, -0.82]} height={0.22} radius={0.045} />
      <Pole color={frame} position={[-span * 0.38, 0.12, 0.82]} height={0.22} radius={0.045} />
      <Pole color={frame} position={[span * 0.38, 0.12, 0.82]} height={0.22} radius={0.045} />
      <Cushion color={frame} position={[0, 0.28, 0]} size={[span, 0.1, 2.05]} />
      <Cushion color={sheet} position={[0, 0.4, 0.08]} size={[linen, 0.22, 1.72]} />
      <Cushion color={color} position={[0, 0.46, 0.42]} size={[linen * 0.92, 0.12, 1.05]} />
      <Cushion color={frame} position={[0, 0.72, -0.96]} size={[span, 0.62, 0.1]} />
      <Puff color={grade === "high" ? "#fff" : "#f4efe6"} position={[-0.32, 0.52, -0.55]} size={[0.42, 0.12, 0.26]} />
      <Puff color="#fff" position={[0.32, 0.52, -0.55]} size={[0.42, 0.12, 0.26]} />
    </group>
  );
}

function Sofa({ color, onGo }: { color: string; onGo: (id: string) => void }) {
  return (
    <group position={[-1.55, 0, -0.15]} onClick={(event) => { event.stopPropagation(); onGo("chair"); }}>
      <Lounge color={color} wide={1.7} />
    </group>
  );
}

function Fridge({ onGo }: { onGo: (id: string) => void }) {
  return (
    <group position={[4.55, 0, 1.7]} onClick={(event) => { event.stopPropagation(); onGo("cooler"); }}>
      <Icebox tall color="#f4f7fa" />
    </group>
  );
}

function Stove({ onGo }: { onGo: (id: string) => void }) {
  return (
    <group position={[4.4, 0, 3.05]} onClick={(event) => { event.stopPropagation(); onGo("stove"); }}>
      <Cooker />
    </group>
  );
}

function Toilet({ onGo }: { onGo: (id: string) => void }) {
  return (
    <group position={[-4.7, 0, 3.3]} onClick={(event) => { event.stopPropagation(); onGo("toilet"); }}>
      <mesh position={[0, 0.22, 0.08]}>
        <sphereGeometry args={[0.2, 16, 12]} />
        <meshLambertMaterial color="#f7f7f7" />
      </mesh>
      <mesh position={[0, 0.28, 0.08]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.16, 0.035, 8, 16]} />
        <meshLambertMaterial color="#e7eef2" />
      </mesh>
      <Cushion color="#f4f7f8" position={[0, 0.48, -0.16]} size={[0.34, 0.42, 0.14]} />
    </group>
  );
}

function Shower({ onGo }: { onGo: (id: string) => void }) {
  return (
    <group position={[-5.15, 0, 1.9]} onClick={(event) => { event.stopPropagation(); onGo("shower"); }}>
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.38, 0.4, 0.06, 16]} />
        <meshLambertMaterial color="#e7eef3" />
      </mesh>
      <mesh position={[0, 0.7, -0.32]}>
        <boxGeometry args={[0.72, 1.15, 0.04]} />
        <meshLambertMaterial color="#d5e4f2" transparent opacity={0.45} />
      </mesh>
      <mesh position={[0, 1.22, -0.2]}>
        <sphereGeometry args={[0.06, 10, 8]} />
        <meshLambertMaterial color="#c5d0da" />
      </mesh>
    </group>
  );
}

function Radio({ onGo }: { onGo: (id: string) => void }) {
  return (
    <group position={[0.35, 0, 1.35]} onClick={(event) => { event.stopPropagation(); onGo("radio"); }}>
      <Cushion color="#c4894f" position={[0, 0.24, 0]} size={[0.46, 0.36, 0.32]} />
      <mesh position={[-0.08, 0.26, 0.16]}>
        <circleGeometry args={[0.07, 12]} />
        <meshLambertMaterial color="#1c2430" />
      </mesh>
      <mesh position={[0.1, 0.26, 0.16]}>
        <circleGeometry args={[0.07, 12]} />
        <meshLambertMaterial color="#1c2430" />
      </mesh>
      <Box color="#2c3338" position={[0, 0.5, 0]} size={[0.3, 0.16, 0.18]} />
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

function Bulb() {
  return (
    <mesh position={[0, 1.55, 0]}>
      <sphereGeometry args={[0.08, 8, 6]} />
      <meshBasicMaterial color="#e7c56a" />
    </mesh>
  );
}

function StripLight() {
  return <Box color="#f4f7fb" position={[0, 1.62, 0]} size={[2.4, 0.06, 0.18]} />;
}

function Cooler() {
  return <Box color="#d9dee6" position={[5.7, 1.35, -1.4]} size={[0.16, 0.28, 0.7]} />;
}

function Rug() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1.2, 0.02, 0.35]}>
      <planeGeometry args={[2.4, 1.5]} />
      <meshLambertMaterial color="#c4a46a" />
    </mesh>
  );
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

function Box({ color, position, size }: { color: string; position: [number, number, number]; size: [number, number, number] }) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshLambertMaterial color={color} flatShading />
    </mesh>
  );
}

function wood(light: string, dark: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const pen = canvas.getContext("2d");
  if (!pen) return null;
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      pen.fillStyle = (col + row) % 2 === 0 ? light : dark;
      pen.fillRect(col * 16, row * 16, 16, 16);
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(3, 2);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function tiles(light: string, dark: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const pen = canvas.getContext("2d");
  if (!pen) return null;
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      pen.fillStyle = (col + row) % 2 === 0 ? light : dark;
      pen.fillRect(col * 16, row * 16, 16, 16);
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(6, 4.5);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
