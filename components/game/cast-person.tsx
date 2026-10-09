"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AnimationMixer,
  Box3,
  LoopOnce,
  LoopRepeat,
  Mesh,
  SkinnedMesh,
  Vector3,
  type AnimationAction,
  type AnimationClip,
  type Group,
  type Material,
  type Object3D,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { castStature, castUrl, clipFor, type CastBody } from "@/lib/game/cast";

type Loaded = { scene: Object3D; clips: AnimationClip[] };

const cache = new Map<string, Promise<Loaded>>();

function loadCast(url: string) {
  const hit = cache.get(url);
  if (hit) return hit;
  const pending = new Promise<Loaded>((resolve, reject) => {
    new GLTFLoader().load(
      url,
      (gltf) => resolve({ scene: gltf.scene, clips: gltf.animations }),
      undefined,
      () => reject(new Error(url)),
    );
  });
  cache.set(url, pending);
  return pending;
}

function hairColor(hair: string) {
  if (/grey|gray|silver|white/i.test(hair)) return "#c8c2b8";
  if (/blonde|honey|gold/i.test(hair)) return "#b8883a";
  if (/brown|auburn/i.test(hair)) return "#4a2c1a";
  return "#1a120e";
}

function slot(name: string): "skin" | "top" | "pants" | "hair" | null {
  const n = name.toLowerCase();
  if (n.includes("eye") || n.includes("brow") || n.includes("tie") || n.includes("detail") || n.includes("shoe") || n.includes("sock")) return null;
  if (n.includes("skin")) return "skin";
  if (n.includes("hair")) return "hair";
  if (n.includes("pant")) return "pants";
  if (n.includes("shirt") || n.includes("dress") || n.includes("jacket") || n.includes("top")) return "top";
  return null;
}

function tint(root: Object3D, skin: string, shirt: string, pants: string, hair: string) {
  const hairHex = hairColor(hair);
  root.traverse((node) => {
    const mesh = node as Mesh;
    if (!mesh.isMesh) return;
    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const next = list.map((material) => {
      const mat = material.clone();
      const which = slot(mat.name || "");
      const colored = mat as Material & { color?: { set: (hex: string) => void } };
      if (which && colored.color) {
        colored.color.set(which === "skin" ? skin : which === "top" ? shirt : which === "pants" ? pants : hairHex);
      }
      return mat;
    });
    mesh.material = next.length === 1 ? next[0] : next;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
  });
}

function standOnFloor(model: Object3D, tall: number) {
  model.updateMatrixWorld(true);
  let box = new Box3().setFromObject(model);
  let height = box.getSize(new Vector3()).y;
  if (height < 0.2) {
    model.scale.multiplyScalar(100);
    model.updateMatrixWorld(true);
    box = new Box3().setFromObject(model);
    height = box.getSize(new Vector3()).y;
  }
  if (height > 0.05) model.scale.multiplyScalar(tall / height);
  model.updateMatrixWorld(true);
  const grounded = new Box3().setFromObject(model);
  model.position.y -= grounded.min.y;
  model.traverse((node) => {
    const mesh = node as SkinnedMesh;
    if (!mesh.isSkinnedMesh) return;
    mesh.frustumCulled = false;
    mesh.castShadow = false;
  });
}

function findClip(clips: AnimationClip[], name: string) {
  return clips.find((clip) => clip.name.endsWith(`_${name}`) || clip.name.endsWith(name));
}

export function Cast({
  skin,
  shirt,
  pants,
  hair,
  body = "woman",
  pose = "idle",
  role,
  turn = 0,
  stature,
  build,
  seed,
  crown = false,
  shadow = true,
  tall = 1.72,
}: {
  skin: string;
  shirt: string;
  pants: string;
  hair: string;
  body?: CastBody;
  pose?: string;
  role?: string;
  turn?: number;
  stature?: string;
  build?: string;
  seed?: string;
  crown?: boolean;
  shadow?: boolean;
  tall?: number;
}) {
  const root = useRef<Group>(null);
  const mixer = useRef<AnimationMixer | null>(null);
  const action = useRef<AnimationAction | null>(null);
  const clipKey = useRef("");
  const model = useRef<Object3D | null>(null);
  const poseRef = useRef(pose);
  const roleRef = useRef(role);
  const turnRef = useRef(turn);
  poseRef.current = pose;
  roleRef.current = role;
  turnRef.current = turn;
  const who = seed || `${body}|${hair}|${skin}|${shirt}`;
  const url = castUrl(body, who);

  useEffect(() => {
    let gone = false;
    loadCast(url)
      .then((gltf) => {
        if (gone || !root.current) return;
        const next = cloneSkinned(gltf.scene);
        next.userData.clips = gltf.clips;
        tint(next, skin, shirt, pants, hair);
        const shape = castStature(who, stature, build);
        standOnFloor(next, tall * shape.y);
        next.scale.x *= shape.xz;
        next.scale.z *= shape.xz;
        next.updateMatrixWorld(true);
        const grounded = new Box3().setFromObject(next);
        next.position.y -= grounded.min.y;
        next.traverse((node) => {
          const mesh = node as SkinnedMesh;
          if (!mesh.isSkinnedMesh) return;
          mesh.castShadow = false;
        });
        root.current.add(next);
        model.current = next;
        mixer.current = new AnimationMixer(next);
        clipKey.current = "";
        play();
      })
      .catch(() => undefined);
    return () => {
      gone = true;
      mixer.current?.stopAllAction();
      mixer.current = null;
      action.current = null;
      const old = model.current;
      model.current = null;
      if (old) {
        old.traverse((node) => {
          const mesh = node as Mesh;
          if (!mesh.isMesh) return;
          const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const material of list) material.dispose();
        });
        old.removeFromParent();
      }
    };
    // Colors are retinted below. The rig reloads only when the mesh changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, tall]);

  useEffect(() => {
    const current = model.current;
    if (!current) return;
    tint(current, skin, shirt, pants, hair);
  }, [skin, shirt, pants, hair]);

  function play() {
    const mix = mixer.current;
    const current = model.current;
    if (!mix || !current) return;
    const token = clipFor(poseRef.current, roleRef.current);
    const key = `${token.name}:${token.once}`;
    if (clipKey.current === key) return;
    const clip = findClip((current.userData.clips as AnimationClip[]) ?? [], token.name);
    if (!clip) return;
    const next = mix.clipAction(clip);
    next.setLoop(token.once ? LoopOnce : LoopRepeat, token.once ? 1 : Infinity);
    next.clampWhenFinished = token.once;
    const previous = action.current;
    if (previous && previous !== next) {
      next.reset().fadeIn(0.28).play();
      previous.fadeOut(0.28);
    } else {
      next.reset().play();
    }
    action.current = next;
    clipKey.current = key;
  }

  useEffect(() => {
    play();
  }, [pose, role]);

  useFrame((_, dt) => {
    if (typeof document !== "undefined" && document.hidden) return;
    mixer.current?.update(dt);
    const group = root.current;
    if (!group) return;
    const goal = (turnRef.current * Math.PI) / 180;
    let delta = goal - group.rotation.y;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    group.rotation.y += delta * Math.min(1, dt * 8);
  });

  return (
    <group ref={root}>
      {shadow ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
          <circleGeometry args={[tall * 0.22, 20]} />
          <meshBasicMaterial color="#1a140c" transparent opacity={0.35} depthWrite={false} />
        </mesh>
      ) : null}
      {crown ? (
        <mesh position={[0, tall * 1.02, 0]}>
          <torusGeometry args={[0.16, 0.03, 8, 18]} />
          <meshStandardMaterial color="#FCD116" metalness={0.55} roughness={0.35} />
        </mesh>
      ) : null}
    </group>
  );
}
