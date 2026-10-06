"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type PerspectiveCamera } from "three";
import { Figure } from "@/components/game/low-poly-human";
import { homeLook, moodOf, SHOP, type HomeGrade, type Life, type Placed, type ShopItem } from "@/lib/game/world";

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
  pieces = [],
  picked = null,
  placing = false,
  onPick,
  onDrag,
}: {
  life: Life;
  pos: { x: number; z: number };
  pose: "idle" | "walk" | "act" | "sleep";
  heading: number;
  dark: boolean;
  bedColor: string;
  sofaColor: string | null;
  onAsk: () => void;
  onGo: (id: string) => void;
  pieces?: Placed[];
  picked?: string | null;
  placing?: boolean;
  onPick?: (id: string) => void;
  onDrag?: (x: number, z: number) => void;
}) {
  const look = homeLook(life.homeId);
  const grade = look.grade;
  return (
    <Canvas
      camera={{ position: [18, 24, 20], fov: 38 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true }}
      resize={{ scroll: false }}
      style={{ width: "100%", height: "100%", touchAction: "none" }}
    >
      <CameraRig frozen={placing} />
      <color attach="background" args={[dark ? "#10131a" : look.sky]} />
      <ambientLight intensity={dark ? 0.22 : grade === "low" ? 0.42 : grade === "high" ? 1.05 : grade === "hall" ? 0.72 : 0.82} />
      <directionalLight position={[6, 16, 8]} intensity={dark ? 0.15 : grade === "low" ? 0.45 : grade === "high" ? 1.15 : 0.95} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0.2]}>
        <circleGeometry args={[22, 64]} />
        <meshLambertMaterial color={dark ? "#3d4a32" : look.yard} />
      </mesh>
      <Floor grade={grade} floorId={life.floor} />
      <Walls grade={grade} />
      {grade === "hall" ? <StripLight /> : null}
      {grade === "high" ? <Cooler /> : null}
      {!dark && grade !== "low" && grade !== "hall" ? <Sconces /> : null}
      {grade === "low" ? <Bulb /> : null}
      <Door color={look.door} onGo={onGo} />
      <Bed color={bedColor} grade={grade} wide={life.inventory.includes("king")} onGo={onGo} />
      <Sofa color={sofaColor ?? look.sofa} onGo={onGo} />
      <Fridge onGo={onGo} />
      <Stove onGo={onGo} />
      <Toilet onGo={onGo} />
      <Shower onGo={onGo} />
      <Radio onGo={onGo} />
      {placing && onDrag ? <PlacePad onDrag={onDrag} /> : null}
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
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
                <planeGeometry args={[1.25, 1.25]} />
                <meshBasicMaterial color="#8fd18a" transparent opacity={0.9} />
              </mesh>
            ) : null}
            <Prop item={item} />
          </group>
        );
      })}
      {pose === "sleep" ? (
        <group position={[2.15, 0, -2.35]} onClick={(event) => { event.stopPropagation(); onAsk(); }}>
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
    </Canvas>
  );
}

function CameraRig({ frozen }: { frozen: boolean }) {
  const { camera, gl, size } = useThree();
  const pan = useRef({ x: 0, z: 0 });
  const zoom = useRef(1);
  const frozenRef = useRef(frozen);
  frozenRef.current = frozen;
  useEffect(() => {
    const el = gl.domElement;
    const pointers = new Map<number, { x: number; y: number }>();
    let pinch = 0;
    let moved = 0;
    const down = (event: PointerEvent) => {
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      el.setPointerCapture(event.pointerId);
      moved = 0;
    };
    const move = (event: PointerEvent) => {
      const prev = pointers.get(event.pointerId);
      if (!prev) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (frozenRef.current) return;
      if (pointers.size >= 2) {
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch > 0) zoom.current = clamp(zoom.current * (pinch / dist), 0.72, 1.05);
        pinch = dist;
        return;
      }
      const dx = event.clientX - prev.x;
      const dy = event.clientY - prev.y;
      moved += Math.abs(dx) + Math.abs(dy);
      const step = 0.018 * zoom.current;
      pan.current.x = clamp(pan.current.x - dx * step, -5.5, 5.5);
      pan.current.z = clamp(pan.current.z + dy * step, -4.2, 4.2);
    };
    const up = (event: PointerEvent) => {
      pointers.delete(event.pointerId);
      if (pointers.size < 2) pinch = 0;
      if (moved > 10) event.stopPropagation();
    };
    const wheel = (event: WheelEvent) => {
      if (frozenRef.current) return;
      event.preventDefault();
      zoom.current = clamp(zoom.current * (event.deltaY > 0 ? 1.08 : 0.92), 0.72, 1.05);
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up, true);
    el.addEventListener("pointercancel", up, true);
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up, true);
      el.removeEventListener("pointercancel", up, true);
      el.removeEventListener("wheel", wheel);
    };
  }, [gl]);
  useFrame(() => {
    const aspect = size.width / Math.max(1, size.height);
    const distance = (aspect < 0.85 ? 16 : aspect < 1.15 ? 22 : 20) * zoom.current;
    const lookX = pan.current.x;
    const lookY = 0;
    const lookZ = pan.current.z;
    const lens = camera as PerspectiveCamera;
    lens.position.set(lookX + distance * 0.42, lookY + distance * 0.72, lookZ + distance * 0.5);
    lens.fov = 30;
    lens.lookAt(lookX, lookY, lookZ);
    lens.updateProjectionMatrix();
  });
  return null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function PlacePad({ onDrag }: { onDrag: (x: number, z: number) => void }) {
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
      <planeGeometry args={[10.5, 7.6]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

function Prop({ item }: { item: ShopItem }) {
  const color = item.color;
  if (item.kind === "chair") {
    return (
      <group>
        <Box color={color} position={[0, 0.28, 0]} size={[0.55, 0.12, 0.55]} />
        <Box color={color} position={[0, 0.5, -0.22]} size={[0.55, 0.38, 0.1]} />
        <Box color="#6b4428" position={[-0.2, 0.14, -0.18]} size={[0.06, 0.28, 0.06]} />
        <Box color="#6b4428" position={[0.2, 0.14, -0.18]} size={[0.06, 0.28, 0.06]} />
        <Box color="#6b4428" position={[-0.2, 0.14, 0.18]} size={[0.06, 0.28, 0.06]} />
        <Box color="#6b4428" position={[0.2, 0.14, 0.18]} size={[0.06, 0.28, 0.06]} />
      </group>
    );
  }
  if (item.kind === "sofa") {
    return (
      <group>
        <Box color={color} position={[0, 0.28, 0.04]} size={[1.55, 0.26, 0.58]} />
        <Box color={color} position={[0, 0.52, -0.22]} size={[1.55, 0.38, 0.14]} />
        <Box color={color} position={[-0.72, 0.42, 0.04]} size={[0.12, 0.32, 0.58]} />
        <Box color={color} position={[0.72, 0.42, 0.04]} size={[0.12, 0.32, 0.58]} />
      </group>
    );
  }
  if (item.kind === "table") {
    return (
      <group>
        <Box color={color} position={[0, 0.42, 0]} size={[1.15, 0.08, 0.7]} />
        <Box color="#8a623c" position={[-0.46, 0.2, -0.26]} size={[0.06, 0.4, 0.06]} />
        <Box color="#8a623c" position={[0.46, 0.2, -0.26]} size={[0.06, 0.4, 0.06]} />
        <Box color="#8a623c" position={[-0.46, 0.2, 0.26]} size={[0.06, 0.4, 0.06]} />
        <Box color="#8a623c" position={[0.46, 0.2, 0.26]} size={[0.06, 0.4, 0.06]} />
        <Box color="#9aa7b2" position={[0.12, 0.5, 0]} size={[0.34, 0.04, 0.24]} />
      </group>
    );
  }
  if (item.kind === "fan") {
    return (
      <group>
        <Box color="#9aa3ad" position={[0, 0.55, 0]} size={[0.06, 1.05, 0.06]} />
        <Box color={color} position={[0, 1.05, 0.08]} size={[0.42, 0.42, 0.08]} />
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.22, 12]} />
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
        <Box color="#d7dde4" position={[0, 0.35, 0]} size={[0.08, 0.7, 0.08]} />
        <mesh position={[0, 0.78, 0]}>
          <sphereGeometry args={[0.16, 10, 8]} />
          <meshBasicMaterial color={color} />
        </mesh>
      </group>
    );
  }
  if (item.kind === "fridge") {
    const tall = item.id === "double-fridge";
    return <Box color={color} position={[0, tall ? 0.7 : 0.32, 0]} size={tall ? [0.62, 1.35, 0.5] : [0.7, 0.55, 0.5]} />;
  }
  if (item.kind === "stove") {
    return (
      <group>
        <Box color={item.accent ?? "#cbbba6"} position={[0, 0.28, 0]} size={[0.62, 0.5, 0.5]} />
        <Box color={color} position={[0, 0.56, 0]} size={[0.5, 0.06, 0.4]} />
      </group>
    );
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
    return (
      <group>
        <Box color="#cbbba6" position={[0, 0.22, 0]} size={[wide ? 1.35 : 0.7, 0.22, 0.28]} />
        <Box color={color} position={[0, 0.62, 0]} size={[wide ? 1.4 : 0.72, 0.55, 0.06]} />
      </group>
    );
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
        <Box color="#cbbba6" position={[0, 0.16, 0]} size={[0.22, 0.28, 0.22]} />
        <Box color={color} position={[0, 0.5, 0]} size={[0.08, 0.4, 0.08]} />
        <Box color={color} position={[-0.1, 0.62, 0]} size={[0.16, 0.28, 0.06]} />
        <Box color={color} position={[0.1, 0.66, 0]} size={[0.16, 0.32, 0.06]} />
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
    return <Box color={color} position={[0, 0.7, 0]} size={[0.7, 0.55, 0.06]} />;
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
  return <Box color={color} position={[0, 0.28, 0]} size={[0.48, 0.48, 0.48]} />;
}

function Floor({ grade, floorId }: { grade: HomeGrade; floorId?: string }) {
  const bought = SHOP.find((item) => item.id === floorId && item.kind === "floor");
  const look = homeLook(grade === "low" ? "jamestown" : grade === "hall" ? "legon-hall" : grade === "high" ? "east-legon" : "adabraka");
  const tileA = bought?.color ?? look.tileA;
  const tileB = bought?.accent ?? look.tileB;
  const map = useMemo(() => tiles(tileA, tileB), [tileA, tileB]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[12, 9]} />
      <meshLambertMaterial map={map} />
    </mesh>
  );
}

function Walls({ grade }: { grade: HomeGrade }) {
  const look = homeLook(grade === "low" ? "jamestown" : grade === "hall" ? "legon-hall" : grade === "high" ? "east-legon" : "adabraka");
  const h = 1.7;
  const y = h / 2;
  return (
    <group>
      <Box color={look.wall} position={[0, y, -4.5]} size={[12.2, h, 0.18]} />
      <Box color={look.wall} position={[0, y, 4.5]} size={[12.2, h, 0.18]} />
      <Box color={look.side} position={[6, y, 0]} size={[0.18, h, 9.16]} />
      <Box color={look.side} position={[-6, y, -2.35]} size={[0.18, h, 4.1]} />
      <Box color={look.side} position={[-6, y, 2.7]} size={[0.18, h, 3.4]} />
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

function Door({ color, onGo }: { color: string; onGo: (id: string) => void }) {
  return (
    <mesh position={[-5.9, 0.95, 0.15]} onClick={(event) => { event.stopPropagation(); onGo("door"); }}>
      <boxGeometry args={[0.08, 1.7, 0.8]} />
      <meshLambertMaterial color={color} flatShading />
    </mesh>
  );
}

function Bed({ color, grade, wide, onGo }: { color: string; grade: HomeGrade; wide?: boolean; onGo: (id: string) => void }) {
  const frame = grade === "hall" ? "#8b9094" : grade === "low" ? "#5c4030" : grade === "high" ? "#c4a46a" : "#6b4428";
  const sheet = grade === "low" ? "#d9cbb6" : grade === "high" ? "#fffdf8" : "#f7f4ef";
  const span = wide ? 2.45 : 1.85;
  const linen = wide ? 2.15 : 1.62;
  return (
    <group position={[2.15, 0, -2.35]} onClick={(event) => { event.stopPropagation(); onGo("bed"); }}>
      <Box color={frame} position={[0, 0.16, 0]} size={[span, 0.22, 2.15]} />
      <Box color={frame} position={[0, 0.42, -0.95]} size={[span, 0.55, 0.1]} />
      <Box color={sheet} position={[0, 0.32, 0.06]} size={[linen, 0.12, 1.8]} />
      <Box color={color} position={[0, 0.38, 0.28]} size={[linen, 0.08, 1.25]} />
      {grade === "low" ? null : (
        <>
          <Box color={grade === "high" ? "#fff" : "#f4efe6"} position={[-0.38, 0.46, -0.62]} size={[0.52, 0.12, 0.34]} />
          <Box color="#fff" position={[0.38, 0.46, -0.62]} size={[0.52, 0.12, 0.34]} />
        </>
      )}
      {grade === "hall" ? (
        <>
          <Box color="#8b9094" position={[0, 1.05, 0]} size={[1.9, 0.06, 2.2]} />
          <Box color="#3d5c78" position={[0, 1.16, 0.2]} size={[1.7, 0.08, 1.7]} />
        </>
      ) : null}
    </group>
  );
}

function Sofa({ color, onGo }: { color: string; onGo: (id: string) => void }) {
  return (
    <group position={[-1.55, 0, -0.15]} onClick={(event) => { event.stopPropagation(); onGo("chair"); }}>
      <Box color={color} position={[0, 0.26, 0.06]} size={[1.7, 0.28, 0.62]} />
      <Box color={color} position={[0, 0.5, -0.22]} size={[1.7, 0.42, 0.16]} />
      <Box color={color} position={[-0.78, 0.4, 0.06]} size={[0.14, 0.36, 0.62]} />
      <Box color={color} position={[0.78, 0.4, 0.06]} size={[0.14, 0.36, 0.62]} />
    </group>
  );
}

function Fridge({ onGo }: { onGo: (id: string) => void }) {
  return (
    <group position={[4.55, 0, 1.7]} onClick={(event) => { event.stopPropagation(); onGo("cooler"); }}>
      <Box color="#f4f7fa" position={[0, 0.78, 0]} size={[0.72, 1.55, 0.64]} />
      <Box color="#c5d0da" position={[0, 1.05, 0.33]} size={[0.64, 0.03, 0.02]} />
      <Box color="#9aa7b2" position={[0.28, 0.85, 0.33]} size={[0.04, 0.28, 0.04]} />
    </group>
  );
}

function Stove({ onGo }: { onGo: (id: string) => void }) {
  return (
    <group position={[4.4, 0, 3.05]} onClick={(event) => { event.stopPropagation(); onGo("stove"); }}>
      <Box color="#f3f3f3" position={[0, 0.4, 0]} size={[0.78, 0.8, 0.6]} />
      <Box color="#1c1c1c" position={[0, 0.82, 0]} size={[0.7, 0.04, 0.52]} />
      <mesh position={[0.05, 0.96, 0]}>
        <cylinderGeometry args={[0.12, 0.14, 0.16, 8]} />
        <meshLambertMaterial color="#c4552a" />
      </mesh>
    </group>
  );
}

function Toilet({ onGo }: { onGo: (id: string) => void }) {
  return (
    <group position={[-4.7, 0, 3.3]} onClick={(event) => { event.stopPropagation(); onGo("toilet"); }}>
      <Box color="#f7f7f7" position={[0, 0.38, -0.12]} size={[0.36, 0.7, 0.18]} />
      <Box color="#f4f7f8" position={[0, 0.28, 0.12]} size={[0.4, 0.28, 0.32]} />
    </group>
  );
}

function Shower({ onGo }: { onGo: (id: string) => void }) {
  return (
    <group position={[-5.15, 0, 1.9]} onClick={(event) => { event.stopPropagation(); onGo("shower"); }}>
      <Box color="#e7eef3" position={[0, 0.06, 0]} size={[0.7, 0.08, 0.7]} />
      <Box color="#d5e4f2" position={[0, 0.55, -0.28]} size={[0.7, 0.9, 0.06]} />
    </group>
  );
}

function Radio({ onGo }: { onGo: (id: string) => void }) {
  return (
    <group position={[0.35, 0, 1.35]} onClick={(event) => { event.stopPropagation(); onGo("radio"); }}>
      <Box color="#c4894f" position={[0, 0.22, 0]} size={[0.42, 0.44, 0.32]} />
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
