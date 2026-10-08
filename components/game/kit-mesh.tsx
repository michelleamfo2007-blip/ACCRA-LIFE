"use client";

import { Suspense, useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import { Box3, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { ShopItem } from "@/lib/game/world";

/** Kenney Furniture Kit, Food Kit, Space Kit, and Nature Kit. CC0. https://kenney.nl */
const ROOT = "/models/kenney/";

export function modelFor(item: ShopItem): { file: string; tall?: number; span?: number } | null {
  const byId: Record<string, { file: string; tall?: number; span?: number }> = {
    book: { file: "furniture/books.glb", span: 0.36 },
    speaker: { file: "furniture/speaker.glb", tall: 0.42 },
    generator: { file: "space/machine_generator.glb", span: 0.7 },
    "yellow-gen": { file: "space/machine_generator.glb", span: 0.7 },
    mirror: { file: "furniture/bathroomMirror.glb", tall: 1.25 },
    armchair: { file: "furniture/loungeChair.glb", tall: 0.85 },
    family: { file: "furniture/loungeSofaLong.glb", span: 1.9 },
    gold: { file: "furniture/loungeSofaCorner.glb", span: 1.55 },
    coffee: { file: "furniture/tableCoffeeGlass.glb", span: 0.9 },
    "cooler-box": { file: "furniture/kitchenFridge.glb", tall: 0.55 },
    "double-fridge": { file: "furniture/kitchenFridgeLarge.glb", tall: 1.45 },
    "lamp-stand": { file: "furniture/lampRoundFloor.glb", tall: 1.15 },
  };
  if (byId[item.id]) return byId[item.id];
  if (item.kind === "bed") return { file: item.size.startsWith("2") ? "furniture/bedDouble.glb" : "furniture/bedSingle.glb", span: item.size.startsWith("2") ? 2.05 : 1.85 };
  if (item.kind === "chair") return { file: "furniture/chair.glb", tall: 0.82 };
  if (item.kind === "sofa") return { file: "furniture/loungeSofa.glb", span: 1.65 };
  if (item.kind === "table") return { file: "furniture/table.glb", tall: 0.72 };
  if (item.kind === "fridge") return { file: "furniture/kitchenFridge.glb", tall: 1.25 };
  if (item.kind === "toilet") return { file: "furniture/toilet.glb", tall: 0.72 };
  if (item.kind === "shower") return { file: "furniture/shower.glb", tall: 1.45 };
  if (item.kind === "plant") return { file: "furniture/pottedPlant.glb", tall: 0.65 };
  if (item.kind === "rug") return { file: "furniture/rugRound.glb", span: 1.7 };
  if (item.kind === "lamp") return { file: "furniture/lampRoundTable.glb", tall: 0.42 };
  if (item.kind === "desk") return { file: "furniture/desk.glb", span: 1.15 };
  if (item.kind === "fan") return { file: "furniture/ceilingFan.glb", span: 0.7 };
  return null;
}

export function KitMesh({ file, tall, span }: { file: string; tall?: number; span?: number }) {
  const gltf = useLoader(GLTFLoader, `${ROOT}${file}`);
  const object = useMemo(() => {
    const root = gltf.scene.clone(true);
    const fitted = new Box3().setFromObject(root);
    const size = fitted.getSize(new Vector3());
    const byTall = tall ? tall / Math.max(size.y, 0.001) : Number.POSITIVE_INFINITY;
    const bySpan = span ? span / Math.max(size.x, size.z, 0.001) : Number.POSITIVE_INFINITY;
    const scale = Math.min(byTall, bySpan);
    root.scale.setScalar(Number.isFinite(scale) ? scale : 1);
    const grounded = new Box3().setFromObject(root);
    const center = grounded.getCenter(new Vector3());
    root.position.x -= center.x;
    root.position.z -= center.z;
    root.position.y -= grounded.min.y;
    return root;
  }, [gltf, tall, span]);
  const shadow = span ?? tall ?? 0.6;
  return (
    <group>
      <primitive object={object} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <circleGeometry args={[shadow * 0.42, 20]} />
        <meshBasicMaterial color="#1a1814" transparent opacity={0.16} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function PlacedModel({ file, tall, span }: { file: string; tall?: number; span?: number }) {
  return (
    <Suspense fallback={null}>
      <KitMesh file={file} tall={tall} span={span} />
    </Suspense>
  );
}

/** Wood desk, open laptop on the top, pink chair beside it. Kenney Furniture Kit. */
export function LaptopSet() {
  return (
    <group>
      <PlacedModel file="furniture/desk.glb" span={1.5} />
      <group position={[-0.1, 0.8, 0.02]}>
        <PlacedModel file="furniture/laptop.glb" span={0.52} />
      </group>
      <group position={[-1.05, 0, 0.02]} rotation={[0, Math.PI / 2, 0]}>
        <PlacedModel file="furniture/loungeChair.glb" tall={0.82} />
      </group>
    </group>
  );
}
