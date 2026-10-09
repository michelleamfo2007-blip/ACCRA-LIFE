"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Cast } from "@/components/game/cast-person";
import type { CastBody } from "@/lib/game/cast";

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
  stature,
  build,
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
  body?: CastBody;
  crown?: boolean;
  pose?: string;
  face?: 1 | -1;
  yaw?: number;
  stature?: string;
  build?: string;
  passive?: boolean;
  className?: string;
}) {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(true), []);
  const turn = yaw ?? (face < 0 ? 180 : 0);
  return (
    <div className={className} style={{ width: "100%", height: "100%" }}>
      {on ? (
        <Canvas camera={{ position: [0, 0.9, 4.15], fov: 26 }} dpr={[1, 1.6]} gl={{ antialias: true, alpha: true }} style={{ pointerEvents: passive ? "none" : "auto" }}>
          <Aim />
          <ambientLight intensity={0.85} />
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
            stature={stature}
            build={build}
          />
        </Canvas>
      ) : null}
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
  body,
  crown = false,
  pose,
  turn,
  role,
  stature,
  build,
  shadow = true,
  tall,
}: {
  skin: string;
  shirt: string;
  pants: string;
  hair: string;
  cloth?: string;
  pattern?: string;
  outfit?: string;
  body: CastBody;
  crown?: boolean;
  pose: string;
  turn: number;
  role?: string;
  stature?: string;
  build?: string;
  shadow?: boolean;
  tall?: number;
}) {
  return (
    <Cast
      skin={skin}
      shirt={shirt}
      pants={pants}
      hair={hair}
      body={body}
      pose={pose}
      role={role}
      turn={turn}
      stature={stature}
      build={build}
      crown={crown}
      shadow={shadow}
      tall={tall}
      seed={`${body}|${hair}|${skin}|${shirt}`}
    />
  );
}
