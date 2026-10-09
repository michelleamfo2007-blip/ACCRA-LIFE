"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Group } from "three";

export function LowPolyHuman({
  skin = "#8d5a3b",
  shirt = "#e7c85a",
  pants = "#1c2744",
  hair = "Braids",
  cloth = shirt,
  pattern = "Ankara",
  outfit = "Classic",
  body = "woman",
  crown = false,
  pose = "idle",
  face = 1,
  yaw,
  passive = false,
  className = "",
}: {
  skin?: string;
  shirt?: string;
  pants?: string;
  hair?: string;
  cloth?: string;
  pattern?: string;
  outfit?: string;
  body?: "woman" | "man";
  crown?: boolean;
  pose?: "idle" | "walk" | "act" | "sit" | "drive";
  face?: 1 | -1;
  yaw?: number;
  passive?: boolean;
  className?: string;
}) {
  const turn = yaw ?? (face < 0 ? 180 : 0);
  return (
    <div className={className} style={{ width: "100%", height: "100%" }}>
      <Canvas
        camera={{ position: [0, 0.9, 4.15], fov: 26 }}
        dpr={[1, 1.6]}
        gl={{ antialias: true, alpha: true }}
        style={{ pointerEvents: passive ? "none" : "auto" }}
      >
        <Aim />
        <ambientLight intensity={0.78} />
        <directionalLight position={[1.4, 3.1, 2.2]} intensity={1.45} />
        <directionalLight position={[-1.5, 1.2, -0.8]} intensity={0.28} />
        <Figure
          skin={skin}
          shirt={shirt}
          pants={pants}
          hair={hair}
          cloth={cloth}
          pattern={pattern}
          outfit={outfit}
          body={body}
          crown={crown}
          pose={pose}
          turn={turn}
        />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0.02]}>
          <circleGeometry args={[0.42, 32]} />
          <meshBasicMaterial color="#8b95a6" transparent opacity={0.28} />
        </mesh>
      </Canvas>
    </div>
  );
}

function Aim() {
  const { camera } = useThree();
  useLayoutEffect(() => {
    camera.lookAt(0, 0.88, 0);
  }, [camera]);
  return null;
}

export function Figure({
  skin,
  shirt,
  pants,
  hair,
  cloth,
  pattern,
  outfit,
  body,
  crown = false,
  pose,
  turn,
}: {
  skin: string;
  shirt: string;
  pants: string;
  hair: string;
  cloth: string;
  pattern: string;
  outfit: string;
  body: "woman" | "man";
  crown?: boolean;
  pose: "idle" | "walk" | "act" | "sit" | "drive";
  turn: number;
}) {
  const woman = body === "woman";
  const clothes = wardrobe(outfit, woman, shirt, pants);
  const map = useMemo(() => (clothes.patterned ? clothMap(pattern, clothes.top) : null), [clothes.patterned, clothes.top, pattern]);
  const thighL = useRef<Group>(null);
  const thighR = useRef<Group>(null);
  const shinL = useRef<Group>(null);
  const shinR = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const foreL = useRef<Group>(null);
  const foreR = useRef<Group>(null);
  const root = useRef<Group>(null);
  const hip = useRef<Group>(null);
  const torso = useRef<Group>(null);
  const head = useRef<Group>(null);
  const hairSway = useRef<Group>(null);
  const lids = useRef<Group>(null);
  const mouth = useRef<Group>(null);
  const phase = hashTone(skin + hair);

  useFrame(({ clock }, dt) => {
    const ease = Math.min(1, dt * 9);
    const sitting = pose === "sit" || pose === "drive";
    const driving = pose === "drive";
    const walking = pose === "walk";
    const t = clock.elapsedTime + phase;
    const step = Math.sin(t * 6.4);
    const knee = Math.max(0, -Math.cos(t * 6.4));
    const breath = 1 + Math.sin(t * 1.7) * (walking ? 0.008 : 0.02);
    const shift = Math.sin(t * 0.65);
    const aim = (group: Group | null, x: number, y = 0, z = 0) => {
      if (!group) return;
      group.rotation.x += (x - group.rotation.x) * ease;
      group.rotation.y += (y - group.rotation.y) * ease;
      group.rotation.z += (z - group.rotation.z) * ease;
    };
    if (root.current) root.current.position.y += ((sitting ? 0.38 : walking ? Math.abs(step) * 0.035 : 0) - root.current.position.y) * ease;
    if (hip.current) {
      hip.current.rotation.z += ((walking ? step * 0.05 : shift * 0.04) - hip.current.rotation.z) * ease;
      hip.current.rotation.y += ((walking ? step * 0.07 : 0) - hip.current.rotation.y) * ease;
    }
    if (torso.current) {
      torso.current.scale.y += (breath - torso.current.scale.y) * ease;
      aim(torso.current, sitting ? 0.16 : walking ? 0.1 : pose === "act" ? 0.08 : shift * 0.02, 0, walking ? -step * 0.03 : -shift * 0.03);
      torso.current.position.z += ((sitting ? 0.06 : 0) - torso.current.position.z) * ease;
    }
    aim(thighL.current, sitting ? -1.28 : walking ? step * 0.72 : shift > 0 ? 0.12 : 0);
    aim(thighR.current, sitting ? -1.28 : walking ? -step * 0.72 : shift < 0 ? 0.12 : 0);
    aim(shinL.current, sitting ? 1.45 : walking ? Math.max(0, step) * 1.15 : 0.04);
    aim(shinR.current, sitting ? 1.45 : walking ? Math.max(0, -step) * 1.15 : 0.04);
    aim(armL.current, driving ? -1.15 : sitting ? -0.45 : walking ? -step * 0.48 : pose === "act" ? -0.7 : 0.08 + shift * 0.05, 0, driving ? 0.4 : 0.08);
    aim(armR.current, driving ? -1.15 : sitting ? -0.35 : walking ? step * 0.48 : pose === "act" ? -0.25 : 0.05, 0, driving ? -0.4 : -0.08);
    aim(foreL.current, driving ? -0.4 : walking ? 0.25 + knee * 0.35 : pose === "act" ? 0.8 : 0.18);
    aim(foreR.current, driving ? -0.4 : walking ? 0.25 + (1 - knee) * 0.2 : 0.15);
    aim(head.current, walking ? -0.06 : Math.sin(t * 0.33) * 0.06, walking ? step * 0.04 : Math.sin(t * 0.27) * 0.14);
    if (hairSway.current) hairSway.current.rotation.z += ((walking ? step * 0.06 : Math.sin(t * 1.3) * 0.03) - hairSway.current.rotation.z) * ease;
    if (lids.current) {
      const blink = Math.sin(t * 1.15) > 0.985 ? 0.08 : 1;
      lids.current.scale.y += (blink - lids.current.scale.y) * Math.min(1, dt * 22);
    }
    if (mouth.current) {
      const open = pose === "act" ? 1.8 + Math.sin(t * 8) * 0.6 : pose === "sit" ? 0.7 : 1;
      mouth.current.scale.y += (open - mouth.current.scale.y) * ease;
    }
  });

  const shoulder = woman ? 0.22 : 0.26;
  const legColor = clothes.skirt ? skin : clothes.bottom;
  return (
    <group ref={root} rotation={[0, (turn * Math.PI) / 180, 0]}>
      <group ref={hip} position={[0, 0.78, 0]}>
        <group ref={thighL} position={[-0.09, 0, 0]}>
          <Limb color={legColor} length={0.36} radius={0.072} />
          <group ref={shinL} position={[0, -0.36, 0]}>
            <Limb color={legColor} length={0.32} radius={0.055} />
            <Shoe woman={woman} />
          </group>
        </group>
        <group ref={thighR} position={[0.09, 0, 0]}>
          <Limb color={legColor} length={0.36} radius={0.072} />
          <group ref={shinR} position={[0, -0.36, 0]}>
            <Limb color={legColor} length={0.32} radius={0.055} />
            <Shoe woman={woman} />
          </group>
        </group>
      </group>
      <group ref={torso}>
      {clothes.skirt ? (
        <mesh position={[0, 0.86, 0]}>
          <cylinderGeometry args={[0.2, 0.3, 0.36, 8]} />
          <meshLambertMaterial color={clothes.bottom} flatShading />
        </mesh>
      ) : (
        <mesh position={[0, 0.9, 0.01]}>
          <boxGeometry args={[woman ? 0.28 : 0.32, 0.06, 0.15]} />
          <meshLambertMaterial color={mix(clothes.bottom, 0.15)} flatShading />
        </mesh>
      )}
      <mesh position={[0, 1.08, 0]}>
        <boxGeometry args={[woman ? 0.3 : 0.36, 0.16, 0.16]} />
        <meshLambertMaterial color={clothes.top} map={map} flatShading />
      </mesh>
      <mesh position={[0, 1.24, 0]}>
        <boxGeometry args={[woman ? 0.32 : 0.4, 0.2, 0.18]} />
        <meshLambertMaterial color={clothes.top} map={map} flatShading />
      </mesh>
      <mesh position={[0, 1.34, 0.02]}>
        <boxGeometry args={[woman ? 0.16 : 0.18, 0.04, 0.04]} />
        <meshLambertMaterial color={mix(clothes.top, 0.2)} flatShading />
      </mesh>
      <group ref={armL} position={[-shoulder, 1.28, 0]}>
        <Limb color={clothes.top} length={0.24} radius={0.05} />
        <group ref={foreL} position={[0, -0.24, 0]}>
          <Limb color={skin} length={0.22} radius={0.04} />
          <mesh position={[0, -0.24, 0.02]}>
            <boxGeometry args={[0.06, 0.04, 0.07]} />
            <meshLambertMaterial color={skin} flatShading />
          </mesh>
        </group>
      </group>
      <group ref={armR} position={[shoulder, 1.28, 0]}>
        <Limb color={clothes.top} length={0.24} radius={0.05} />
        <group ref={foreR} position={[0, -0.24, 0]}>
          <Limb color={skin} length={0.22} radius={0.04} />
          <mesh position={[0, -0.24, 0.02]}>
            <boxGeometry args={[0.06, 0.04, 0.07]} />
            <meshLambertMaterial color={skin} flatShading />
          </mesh>
        </group>
      </group>
      <mesh position={[0, 1.42, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 0.08, 8]} />
        <meshLambertMaterial color={skin} flatShading />
      </mesh>
      <group ref={head} position={[0, 1.58, 0]}>
        <mesh>
          <sphereGeometry args={[0.155, 12, 10]} />
          <meshLambertMaterial color={skin} flatShading />
        </mesh>
        <Face skin={skin} lids={lids} mouth={mouth} />
        <group ref={hairSway}>
          <Hair hair={hair} cloth={cloth} />
        </group>
        {crown ? <Crown /> : null}
      </group>
      </group>
    </group>
  );
}

function Limb({ color, length, radius }: { color: string; length: number; radius: number }) {
  return (
    <mesh position={[0, -length / 2, 0]}>
      <cylinderGeometry args={[radius * 0.86, radius, length, 6]} />
      <meshLambertMaterial color={color} flatShading />
    </mesh>
  );
}

function Shoe({ woman }: { woman: boolean }) {
  return (
    <mesh position={[0, -0.34, 0.04]}>
      <boxGeometry args={[0.09, 0.04, 0.16]} />
      <meshLambertMaterial color={woman ? "#7a3030" : "#1a1816"} flatShading />
    </mesh>
  );
}

function Face({ skin, lids, mouth }: { skin: string; lids: { current: Group | null }; mouth: { current: Group | null } }) {
  const lip = mix(skin, 0.28);
  return (
    <group position={[0, 0.01, 0.12]}>
      <mesh position={[-0.045, 0.02, 0]}>
        <sphereGeometry args={[0.016, 8, 6]} />
        <meshLambertMaterial color="#f4efe6" />
      </mesh>
      <mesh position={[0.045, 0.02, 0]}>
        <sphereGeometry args={[0.016, 8, 6]} />
        <meshLambertMaterial color="#f4efe6" />
      </mesh>
      <mesh position={[-0.045, 0.02, 0.008]}>
        <sphereGeometry args={[0.008, 6, 5]} />
        <meshLambertMaterial color="#1a140f" />
      </mesh>
      <mesh position={[0.045, 0.02, 0.008]}>
        <sphereGeometry args={[0.008, 6, 5]} />
        <meshLambertMaterial color="#1a140f" />
      </mesh>
      <group ref={lids} position={[0, 0.028, 0.012]}>
        <mesh position={[-0.045, 0, 0]}>
          <boxGeometry args={[0.03, 0.012, 0.008]} />
          <meshLambertMaterial color={skin} />
        </mesh>
        <mesh position={[0.045, 0, 0]}>
          <boxGeometry args={[0.03, 0.012, 0.008]} />
          <meshLambertMaterial color={skin} />
        </mesh>
      </group>
      <mesh position={[-0.045, 0.042, 0.004]}>
        <boxGeometry args={[0.03, 0.006, 0.008]} />
        <meshLambertMaterial color="#1a140f" />
      </mesh>
      <mesh position={[0.045, 0.042, 0.004]}>
        <boxGeometry args={[0.03, 0.006, 0.008]} />
        <meshLambertMaterial color="#1a140f" />
      </mesh>
      <mesh position={[0, -0.01, 0.012]} rotation={[0.5, 0, 0]}>
        <boxGeometry args={[0.02, 0.03, 0.016]} />
        <meshLambertMaterial color={mix(skin, 0.08)} flatShading />
      </mesh>
      <group ref={mouth} position={[0, -0.055, 0.01]}>
        <mesh>
          <boxGeometry args={[0.046, 0.012, 0.012]} />
          <meshLambertMaterial color={lip} flatShading />
        </mesh>
      </group>
    </group>
  );
}

function Hair({ hair, cloth }: { hair: string; cloth: string }) {
  const dark = "#1a120e";
  if (hair === "Afro") {
    return (
      <mesh>
        <sphereGeometry args={[0.175, 8, 6]} />
        <meshLambertMaterial color={dark} flatShading />
      </mesh>
    );
  }
  if (hair === "Bald") return null;
  if (hair === "Low cut" || hair === "Fade") {
    return (
      <mesh position={[0, 0.04, -0.01]} scale={[1.02, hair === "Fade" ? 0.28 : 0.42, 1.05]}>
        <sphereGeometry args={[0.14, 8, 6]} />
        <meshLambertMaterial color={dark} flatShading />
      </mesh>
    );
  }
  if (hair === "Weave") {
    return (
      <group>
        <Cap />
        <mesh position={[0.02, -0.16, -0.04]} rotation={[0.35, 0, 0.1]}>
          <cylinderGeometry args={[0.09, 0.05, 0.34, 6]} />
          <meshLambertMaterial color={dark} flatShading />
        </mesh>
      </group>
    );
  }
  if (hair === "Bun") {
    return (
      <group>
        <Cap />
        <mesh position={[0, 0.15, -0.01]}>
          <sphereGeometry args={[0.055, 7, 6]} />
          <meshLambertMaterial color={dark} flatShading />
        </mesh>
      </group>
    );
  }
  if (hair === "Headwrap") {
    return (
      <mesh position={[0, 0.05, 0]} scale={[1.16, 0.72, 1.16]}>
        <sphereGeometry args={[0.15, 8, 6]} />
        <meshLambertMaterial color={cloth} flatShading />
      </mesh>
    );
  }
  if (hair === "Ponytail") {
    return (
      <group>
        <Cap />
        <mesh position={[0, -0.02, -0.12]} rotation={[0.5, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.04, 0.32, 5]} />
          <meshLambertMaterial color={dark} flatShading />
        </mesh>
      </group>
    );
  }
  if (hair === "Long") {
    return (
      <group>
        <Cap />
        <mesh position={[0, -0.14, -0.01]}>
          <cylinderGeometry args={[0.12, 0.07, 0.32, 7]} />
          <meshLambertMaterial color={dark} flatShading />
        </mesh>
      </group>
    );
  }
  const locs = hair === "Locs";
  return (
    <group>
      <Cap />
      {[-0.11, 0.11].map((x) => (
        <mesh key={x} position={[x, -0.08, 0.02]}>
          <cylinderGeometry args={[locs ? 0.016 : 0.012, 0.01, 0.18, 4]} />
          <meshLambertMaterial color={dark} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function Cap() {
  return (
    <mesh position={[0, 0.035, -0.01]} scale={[1.06, 0.58, 1.08]}>
      <sphereGeometry args={[0.14, 8, 6]} />
      <meshLambertMaterial color="#1a120e" flatShading />
    </mesh>
  );
}

function Crown() {
  return (
    <group position={[0, 0.16, 0]}>
      {[-0.06, 0, 0.06].map((x) => (
        <mesh key={x} position={[x, 0.02, 0]}>
          <coneGeometry args={[0.028, 0.07, 4]} />
          <meshLambertMaterial color="#f5c542" flatShading />
        </mesh>
      ))}
    </group>
  );
}

function wardrobe(outfit: string, woman: boolean, shirt: string, pants: string) {
  if (outfit === "All-white") return { top: "#f7f3ea", bottom: "#f3eee4", skirt: woman, patterned: false };
  if (outfit === "Site work") return { top: "#e8873a", bottom: "#6b4a2e", skirt: false, patterned: false };
  if (outfit === "Office") return { top: "#f4f1ea", bottom: "#243044", skirt: woman, patterned: false };
  if (outfit === "Casual") return { top: shirt, bottom: pants, skirt: false, patterned: true };
  return { top: shirt, bottom: woman ? "#1c2744" : pants, skirt: woman, patterned: true };
}

function clothMap(pattern: string, color: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const pen = canvas.getContext("2d");
  if (!pen) return null;
  pen.fillStyle = color;
  pen.fillRect(0, 0, 128, 128);
  if (pattern === "Ankara") {
    const ring = mix(color, 0.38);
    for (let y = 14; y < 128; y += 28) {
      for (let x = 14; x < 128; x += 28) {
        pen.fillStyle = ring;
        pen.beginPath();
        pen.arc(x, y, 8, 0, Math.PI * 2);
        pen.fill();
        pen.fillStyle = "#f6f1e6";
        pen.beginPath();
        pen.arc(x, y, 3.2, 0, Math.PI * 2);
        pen.fill();
      }
    }
  } else if (pattern === "Kente") {
    ["#f5c542", "#0c6b3c", "#ce1126", color].forEach((band, index) => {
      pen.fillStyle = band;
      pen.fillRect(0, index * 32, 128, 14);
    });
  } else if (pattern === "Tie-dye") {
    pen.fillStyle = mix(color, 0.22);
    for (let index = 0; index < 9; index += 1) {
      pen.beginPath();
      pen.arc(18 + ((index * 41) % 100), 20 + ((index * 27) % 90), 16, 0, Math.PI * 2);
      pen.fill();
    }
  } else {
    return null;
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function hashTone(text: string) {
  let hash = 0;
  for (const char of text) hash = (hash * 33 + char.charCodeAt(0)) % 997;
  return hash / 997 * Math.PI * 2;
}

function mix(hex: string, amount: number) {
  const clean = hex.replace("#", "");
  if (clean.length < 6) return hex;
  const channel = (start: number) => Math.max(0, Math.round(parseInt(clean.slice(start, start + 2), 16) * (1 - amount)));
  return `rgb(${channel(0)}, ${channel(2)}, ${channel(4)})`;
}
