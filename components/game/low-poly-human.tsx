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
  const left = useRef<Group>(null);
  const right = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const root = useRef<Group>(null);
  const torso = useRef<Group>(null);

  useFrame(({ clock }) => {
    const sitting = pose === "sit" || pose === "drive";
    const driving = pose === "drive";
    const swing = pose === "walk" ? Math.sin(clock.elapsedTime * 7) * 0.42 : 0;
    const bob = pose === "act" ? Math.sin(clock.elapsedTime * 5) * 0.08 : 0;
    if (root.current) root.current.position.y = sitting ? 0.42 : 0;
    if (torso.current) {
      torso.current.position.y = sitting ? 0.08 : 0;
      torso.current.position.z = sitting ? 0.08 : 0;
      torso.current.rotation.x = sitting ? 0.12 : bob;
    }
    if (left.current) left.current.rotation.x = sitting ? -1.45 : swing;
    if (right.current) right.current.rotation.x = sitting ? -1.45 : -swing;
    if (armL.current) {
      armL.current.rotation.x = driving ? -1.2 : sitting ? -0.55 : pose === "act" ? -0.55 + bob : -swing * 0.65;
      armL.current.rotation.z = driving ? 0.42 : 0;
    }
    if (armR.current) {
      armR.current.rotation.x = driving ? -1.2 : sitting ? -0.4 : pose === "act" ? -0.35 - bob : swing * 0.65;
      armR.current.rotation.z = driving ? -0.42 : 0;
    }
  });

  const shoulder = woman ? 0.22 : 0.26;
  const legColor = clothes.skirt ? skin : clothes.bottom;
  return (
    <group ref={root} rotation={[0, (turn * Math.PI) / 180, 0]}>
      <group ref={left} position={[-0.09, 0.74, 0]}>
        <Limb color={legColor} length={0.66} radius={0.07} />
        <Shoe woman={woman} />
      </group>
      <group ref={right} position={[0.09, 0.74, 0]}>
        <Limb color={legColor} length={0.66} radius={0.07} />
        <Shoe woman={woman} />
      </group>
      <group ref={torso}>
      {clothes.skirt ? (
        <mesh position={[0, 0.86, 0]}>
          <cylinderGeometry args={[0.2, 0.28, 0.34, 6]} />
          <meshLambertMaterial color={clothes.bottom} flatShading />
        </mesh>
      ) : null}
      <mesh position={[0, 1.08, 0]}>
        <boxGeometry args={[woman ? 0.3 : 0.36, 0.16, 0.16]} />
        <meshLambertMaterial color={clothes.top} map={map} flatShading />
      </mesh>
      <mesh position={[0, 1.24, 0]}>
        <boxGeometry args={[woman ? 0.32 : 0.4, 0.18, 0.18]} />
        <meshLambertMaterial color={clothes.top} map={map} flatShading />
      </mesh>
      <mesh position={[-0.1, 1.36, 0]}>
        <boxGeometry args={[0.045, 0.12, 0.04]} />
        <meshLambertMaterial color={clothes.top} map={map} flatShading />
      </mesh>
      <mesh position={[0.1, 1.36, 0]}>
        <boxGeometry args={[0.045, 0.12, 0.04]} />
        <meshLambertMaterial color={clothes.top} map={map} flatShading />
      </mesh>
      <group ref={armL} position={[-shoulder, 1.28, 0]}>
        <Limb color={skin} length={0.48} radius={0.048} />
        <mesh position={[0, -0.52, 0]}>
          <sphereGeometry args={[0.046, 6, 5]} />
          <meshLambertMaterial color={skin} flatShading />
        </mesh>
      </group>
      <group ref={armR} position={[shoulder, 1.28, 0]}>
        <Limb color={skin} length={0.48} radius={0.048} />
        <mesh position={[0, -0.52, 0]}>
          <sphereGeometry args={[0.046, 6, 5]} />
          <meshLambertMaterial color={skin} flatShading />
        </mesh>
      </group>
      <mesh position={[0, 1.42, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 0.08, 6]} />
        <meshLambertMaterial color={skin} flatShading />
      </mesh>
      <group position={[0, 1.58, 0]}>
        <mesh>
          <sphereGeometry args={[0.155, 10, 8]} />
          <meshLambertMaterial color={skin} flatShading />
        </mesh>
        <Face skin={skin} />
        <Hair hair={hair} cloth={cloth} />
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
    <mesh position={[0, -0.7, 0.04]}>
      <boxGeometry args={[0.1, 0.045, 0.18]} />
      <meshLambertMaterial color={woman ? "#7a3030" : "#1a1816"} flatShading />
    </mesh>
  );
}

function Face({ skin }: { skin: string }) {
  const lip = mix(skin, 0.28);
  return (
    <group position={[0, 0.01, 0.11]}>
      <mesh position={[-0.04, 0.025, 0]}>
        <sphereGeometry args={[0.014, 6, 5]} />
        <meshLambertMaterial color="#1a140f" />
      </mesh>
      <mesh position={[0.04, 0.025, 0]}>
        <sphereGeometry args={[0.014, 6, 5]} />
        <meshLambertMaterial color="#1a140f" />
      </mesh>
      <mesh position={[-0.04, 0.03, 0.01]}>
        <sphereGeometry args={[0.004, 4, 4]} />
        <meshBasicMaterial color="#f7f4ef" />
      </mesh>
      <mesh position={[0.04, 0.03, 0.01]}>
        <sphereGeometry args={[0.004, 4, 4]} />
        <meshBasicMaterial color="#f7f4ef" />
      </mesh>
      <mesh position={[-0.04, 0.048, 0]}>
        <boxGeometry args={[0.028, 0.006, 0.008]} />
        <meshLambertMaterial color="#1a140f" />
      </mesh>
      <mesh position={[0.04, 0.048, 0]}>
        <boxGeometry args={[0.028, 0.006, 0.008]} />
        <meshLambertMaterial color="#1a140f" />
      </mesh>
      <mesh position={[0, -0.012, 0.01]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[0.016, 0.028, 0.016]} />
        <meshLambertMaterial color={skin} flatShading />
      </mesh>
      <mesh position={[0, -0.05, 0.008]}>
        <boxGeometry args={[0.04, 0.012, 0.012]} />
        <meshLambertMaterial color={lip} flatShading />
      </mesh>
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
  if (hair === "Low cut") {
    return (
      <mesh position={[0, 0.04, -0.01]} scale={[1.02, 0.42, 1.05]}>
        <sphereGeometry args={[0.14, 8, 6]} />
        <meshLambertMaterial color={dark} flatShading />
      </mesh>
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

function mix(hex: string, amount: number) {
  const clean = hex.replace("#", "");
  if (clean.length < 6) return hex;
  const channel = (start: number) => Math.max(0, Math.round(parseInt(clean.slice(start, start + 2), 16) * (1 - amount)));
  return `rgb(${channel(0)}, ${channel(2)}, ${channel(4)})`;
}
