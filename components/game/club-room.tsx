"use client";

import { useEffect, useRef } from "react";
import type { Matrix, Scene, ShadowGenerator, TransformNode } from "@babylonjs/core";

const ROOT = "/models/kenney/";

const FURNITURE: { file: string; at: [number, number, number]; tall?: number; span?: number }[] = [
  { file: "furniture/chair.glb", at: [-91.5, 0, 18.5], tall: 11 },
  { file: "furniture/chair.glb", at: [-91.5, 0, 30.5], tall: 11 },
  { file: "furniture/chair.glb", at: [-91.5, 0, 42.5], tall: 11 },
  { file: "furniture/loungeSofa.glb", at: [67, 0, 16], span: 18 },
  { file: "furniture/loungeSofa.glb", at: [88, 0, 18], span: 16 },
  { file: "furniture/tableCoffee.glb", at: [73, 0, 34], span: 12 },
  { file: "furniture/desk.glb", at: [0, 0, -34], span: 40 },
  { file: "furniture/laptop.glb", at: [-10, 7, -30], tall: 3 },
  { file: "furniture/speaker.glb", at: [-52, 0, -36], tall: 18 },
  { file: "furniture/speaker.glb", at: [30, 0, -36], tall: 18 },
  { file: "furniture/table.glb", at: [-40, 0, 36], span: 14 },
  { file: "furniture/table.glb", at: [12, 0, 40], span: 14 },
  { file: "furniture/rugRectangle.glb", at: [-6, 0.05, 58], span: 42 },
  { file: "furniture/lampRoundFloor.glb", at: [96, 0, 8], tall: 16 },
];

export function ClubRoom({ name }: { name: string }) {
  const host = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = host.current;
    if (!canvas) return;
    let disposed = false;
    let stop = () => {};

    void (async () => {
      const core = await import("@babylonjs/core");
      await import("@babylonjs/loaders/glTF");
      if (disposed) return;
      stop = mountClub(core, canvas, () => disposed);
    })();

    return () => {
      disposed = true;
      stop();
    };
  }, []);

  return (
    <div className="absolute inset-0">
      <canvas ref={host} className="h-full w-full" style={{ pointerEvents: "none" }} />
      <p className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1 text-[11px] font-bold tracking-wide text-[#FCD116]">{name}</p>
    </div>
  );
}

function mountClub(core: typeof import("@babylonjs/core"), canvas: HTMLCanvasElement, gone: () => boolean) {
  const {
    Camera,
    Color3,
    Color4,
    DefaultRenderingPipeline,
    Engine,
    HemisphericLight,
    ImageProcessingConfiguration,
    Light,
    Matrix,
    MeshBuilder,
    PBRMaterial,
    PointLight,
    Scene,
    ShadowGenerator,
    SpotLight,
    StandardMaterial,
    TransformNode,
    Vector3,
    ImportMeshAsync,
    DynamicTexture,
  } = core;

  const engine = new Engine(canvas, true, { alpha: false, stencil: true, antialias: true, adaptToDeviceRatio: false }, false);
  const dpr = Math.min(globalThis.devicePixelRatio || 1, 1.5);
  engine.setHardwareScalingLevel(1 / dpr);

  const scene = new Scene(engine);
  scene.useRightHandedSystem = true;
  scene.clearColor = new Color4(7 / 255, 4 / 255, 12 / 255, 1);
  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.004;
  scene.fogColor = new Color3(0.05, 0.02, 0.07);
  scene.shadowsEnabled = true;

  const view = Matrix.Identity();

  class IsoCamera extends Camera {
    constructor() {
      super("iso", Vector3.Zero(), scene);
      this.minZ = 0.01;
      this.maxZ = 800;
    }

    override getViewMatrix(): Matrix {
      this._computedViewMatrix.copyFrom(view);
      return this._computedViewMatrix;
    }

    override getProjectionMatrix(): Matrix {
      const width = Math.max(1, canvas.clientWidth);
      const height = Math.max(1, canvas.clientHeight);
      writeIso(Matrix, this._projectionMatrix, width, height);
      return this._projectionMatrix;
    }
  }

  const camera = new IsoCamera();
  scene.activeCamera = camera;

  const hemi = new HemisphericLight("room", new Vector3(0.15, 1, 0.05), scene);
  hemi.intensity = 0.72;
  hemi.diffuse = new Color3(0.62, 0.48, 0.78);
  hemi.groundColor = new Color3(0.08, 0.04, 0.1);

  const aimA = new Vector3();
  const aimB = new Vector3();
  const spotA = new SpotLight("magenta", new Vector3(-16, 42, -34), new Vector3(0, -1, 0.6), 1.15, 1.4, scene);
  const spotB = new SpotLight("violet", new Vector3(6, 42, -34), new Vector3(0, -1, 0.55), 1.05, 1.5, scene);
  paintSpot(spotA, "#ff2d95", 280, 180, Light.FALLOFF_STANDARD);
  paintSpot(spotB, "#7c5cff", 220, 170, Light.FALLOFF_STANDARD);
  spotA.exponent = 0.25;
  spotB.exponent = 0.25;

  const floorWashA = new PointLight("floor-a", new Vector3(-6, 18, 56), scene);
  const floorWashB = new PointLight("floor-b", new Vector3(10, 16, 48), scene);
  paintPoint(floorWashA, "#ff4d9a", 36, 80, Light.FALLOFF_STANDARD);
  paintPoint(floorWashB, "#7c5cff", 28, 76, Light.FALLOFF_STANDARD);

  const barLight = new PointLight("bar", new Vector3(-96, 22, 32), scene);
  paintPoint(barLight, "#FCD116", 48, 70, Light.FALLOFF_STANDARD);
  const vip = new PointLight("vip", new Vector3(74, 14, 18), scene);
  paintPoint(vip, "#e8b15a", 22, 50, Light.FALLOFF_STANDARD);
  const dj = new SpotLight("dj", new Vector3(-4, 28, -48), new Vector3(0, -0.7, 1), 1.35, 1.2, scene);
  paintSpot(dj, "#7ee0ff", 40, 90, Light.FALLOFF_STANDARD);

  const shadow = new ShadowGenerator(1024, spotA);
  shadow.usePercentageCloserFiltering = true;
  shadow.filteringQuality = ShadowGenerator.QUALITY_HIGH;
  shadow.bias = 0.01;
  shadow.normalBias = 0.05;
  shadow.darkness = 0.72;
  spotA.shadowMinZ = 2;
  spotA.shadowMaxZ = 90;

  const floorMat = pbr(scene, PBRMaterial, Color3, "#4c2460", 0.08, 0.4);
  const wallMat = pbr(scene, PBRMaterial, Color3, "#241828", 0.02, 0.9);
  const sideMat = pbr(scene, PBRMaterial, Color3, "#1c121c", 0.02, 0.9);
  const wood = pbr(scene, PBRMaterial, Color3, "#5a3a22", 0.18, 0.28);
  const brass = pbr(scene, PBRMaterial, Color3, "#e2c27a", 0.55, 0.16);

  const floor = MeshBuilder.CreateGround("floor", { width: 236, height: 168 }, scene);
  floor.position.set(0, 0, 22);
  floor.material = floorMat;
  floor.receiveShadows = true;
  floor.alwaysSelectAsActiveMesh = true;
  floorMat.backFaceCulling = false;

  block(scene, MeshBuilder, "back-wall", 240, 44, 3, 0, 22, -62, wallMat);
  block(scene, MeshBuilder, "side-wall", 3, 44, 168, -118, 22, 22, sideMat);
  const bar = block(scene, MeshBuilder, "bar", 14, 16, 48, -101, 8, 32, wood);
  shadow.addShadowCaster(bar);
  block(scene, MeshBuilder, "bar-top", 12, 0.7, 44, -100, 16.5, 32, brass);
  led(scene, MeshBuilder, PBRMaterial, Color3, -20, 20, -58, 90, 0.6, 0.6, "#ff2d95");
  led(scene, MeshBuilder, PBRMaterial, Color3, -100, 18, 32, 0.5, 0.45, 40, "#FCD116");
  led(scene, MeshBuilder, PBRMaterial, Color3, -8, 1.2, 50, 36, 0.3, 0.5, "#7c5cff");
  led(scene, MeshBuilder, PBRMaterial, Color3, -8, 1.2, 64, 36, 0.3, 0.5, "#ff2d95");
  sign(scene, MeshBuilder, PBRMaterial, Color3, DynamicTexture, "BAR", [-112, 24, 28], "#ff2d95");
  sign(scene, MeshBuilder, PBRMaterial, Color3, DynamicTexture, "VIP", [78, 16, 4], "#FCD116");

  const dustMat = new StandardMaterial("dust", scene);
  dustMat.emissiveColor = Color3.FromHexString("#e7c6ff");
  dustMat.disableLighting = true;
  dustMat.alpha = 0.45;
  const dust = Array.from({ length: 28 }, (_, index) => {
    const mote = MeshBuilder.CreateSphere(`dust-${index}`, { diameter: 0.5, segments: 6 }, scene);
    const y = 4 + Math.random() * 28;
    mote.position.set((Math.random() - 0.5) * 160, y, Math.random() * 80);
    mote.material = index % 2 ? dustMat : dustMat.clone(`dust-${index}`);
    if (index % 2) (mote.material as InstanceType<typeof StandardMaterial>).emissiveColor = Color3.FromHexString("#ffd7a8");
    mote.alwaysSelectAsActiveMesh = true;
    return { mote, y };
  });

  const bits = ["#ff2d95", "#FCD116", "#7c5cff", "#7ee0ff"].flatMap((color, colorIndex) =>
    Array.from({ length: 4 }, (_, index) => {
      const bit = MeshBuilder.CreateBox(`bit-${colorIndex}-${index}`, { width: 0.7, height: 0.35, depth: 0.15 }, scene);
      bit.position.set(-40 + ((colorIndex * 4 + index) * 17) % 90, 8 + index * 6, 20 + colorIndex * 8);
      const mat = new StandardMaterial(`bit-${color}`, scene);
      mat.emissiveColor = Color3.FromHexString(color);
      mat.disableLighting = true;
      bit.material = mat;
      bit.alwaysSelectAsActiveMesh = true;
      return bit;
    }),
  );

  const pipeline = new DefaultRenderingPipeline("club", true, scene, [camera]);
  pipeline.bloomEnabled = true;
  pipeline.bloomThreshold = 0.55;
  pipeline.bloomWeight = 0.42;
  pipeline.bloomKernel = 64;
  pipeline.fxaaEnabled = true;
  pipeline.glowLayerEnabled = true;
  if (pipeline.glowLayer) pipeline.glowLayer.intensity = 0.55;
  pipeline.imageProcessingEnabled = true;
  pipeline.imageProcessing.toneMappingEnabled = true;
  pipeline.imageProcessing.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
  pipeline.imageProcessing.exposure = 1.45;

  const started = performance.now();
  const tick = scene.onBeforeRenderObservable.add(() => {
    const t = (performance.now() - started) / 1000;
    spotA.position.set(-16 + Math.sin(t * 0.7) * 10, 42, -34);
    aimA.set(-8 + Math.sin(t * 0.9) * 16, 0, 56);
    spotA.setDirectionToTarget(aimA);
    spotB.position.set(6 + Math.cos(t * 0.6) * 8, 42, -34);
    aimB.set(8 + Math.cos(t * 0.8) * 14, 0, 62);
    spotB.setDirectionToTarget(aimB);
    const bob = Math.sin(t * 0.4) * 0.8;
    for (const mote of dust) mote.mote.position.y = mote.y + bob;
    for (const bit of bits) {
      bit.position.y -= 0.12;
      bit.rotation.z += 0.03;
      if (bit.position.y < 0.4) bit.position.y = 32;
    }
  });

  const resize = new ResizeObserver(() => engine.resize());
  resize.observe(canvas.parentElement ?? canvas);
  engine.resize();
  engine.runRenderLoop(() => scene.render());

  void Promise.all(FURNITURE.map((item) => placeModel(scene, TransformNode, ImportMeshAsync, shadow, item).catch(() => undefined))).then(() => {
    if (gone()) return;
  });

  return () => {
    resize.disconnect();
    scene.onBeforeRenderObservable.remove(tick);
    pipeline.dispose();
    scene.dispose();
    engine.dispose();
  };
}

function writeIso(Matrix: typeof import("@babylonjs/core").Matrix, proj: Matrix, width: number, height: number) {
  const scale = Math.max(width / 760, height / 480);
  const ox = (width - 760 * scale) / 2;
  const oy = (height - 480 * scale) / 2;
  const ax = (1.85 * scale * 2) / width;
  const bx = ((ox + 390 * scale) / width) * 2 - 1;
  const ay = (1.85 * scale * 2) / height;
  const az = (0.92 * scale * 2) / height;
  const by = 1 - ((oy + 268 * scale) / height) * 2;
  // Row-vector form of the same isometric projection the people use.
  Matrix.FromValuesToRef(ax, -az, 0.004, 0, 0, ay, 0.001, 0, -ax, -az, 0.004, 0, bx, by, 0.15, 1, proj);
}

function paintSpot(
  light: { diffuse: { r: number; g: number; b: number }; specular: { r: number; g: number; b: number }; intensity: number; range: number; falloffType: number },
  hex: string,
  intensity: number,
  range: number,
  falloff: number,
) {
  const color = hexToRgb(hex);
  light.diffuse.r = color.r;
  light.diffuse.g = color.g;
  light.diffuse.b = color.b;
  light.specular.r = color.r;
  light.specular.g = color.g;
  light.specular.b = color.b;
  light.intensity = intensity;
  light.range = range;
  light.falloffType = falloff;
}

function paintPoint(
  light: { diffuse: { r: number; g: number; b: number }; intensity: number; range: number; falloffType: number },
  hex: string,
  intensity: number,
  range: number,
  falloff: number,
) {
  const color = hexToRgb(hex);
  light.diffuse.r = color.r;
  light.diffuse.g = color.g;
  light.diffuse.b = color.b;
  light.intensity = intensity;
  light.range = range;
  light.falloffType = falloff;
}

function hexToRgb(hex: string) {
  const value = Number.parseInt(hex.slice(1), 16);
  return { r: ((value >> 16) & 255) / 255, g: ((value >> 8) & 255) / 255, b: (value & 255) / 255 };
}

function pbr(
  scene: Scene,
  PBRMaterial: typeof import("@babylonjs/core").PBRMaterial,
  Color3: typeof import("@babylonjs/core").Color3,
  color: string,
  metallic: number,
  roughness: number,
) {
  const mat = new PBRMaterial(color, scene);
  mat.albedoColor = Color3.FromHexString(color);
  mat.metallic = metallic;
  mat.roughness = roughness;
  mat.maxSimultaneousLights = 8;
  return mat;
}

function block(
  scene: Scene,
  MeshBuilder: typeof import("@babylonjs/core").MeshBuilder,
  name: string,
  width: number,
  height: number,
  depth: number,
  x: number,
  y: number,
  z: number,
  material: import("@babylonjs/core").PBRMaterial,
) {
  const mesh = MeshBuilder.CreateBox(name, { width, height, depth }, scene);
  mesh.position.set(x, y, z);
  mesh.material = material;
  mesh.receiveShadows = true;
  mesh.alwaysSelectAsActiveMesh = true;
  return mesh;
}

function led(
  scene: Scene,
  MeshBuilder: typeof import("@babylonjs/core").MeshBuilder,
  PBRMaterial: typeof import("@babylonjs/core").PBRMaterial,
  Color3: typeof import("@babylonjs/core").Color3,
  x: number,
  y: number,
  z: number,
  width: number,
  height: number,
  depth: number,
  color: string,
) {
  const mesh = MeshBuilder.CreateBox(`led-${color}-${x}`, { width, height, depth }, scene);
  mesh.position.set(x, y, z);
  const mat = new PBRMaterial(`led-${color}-${x}`, scene);
  const glow = Color3.FromHexString(color);
  mat.albedoColor = glow;
  mat.emissiveColor = glow;
  mat.emissiveIntensity = 2.4;
  mat.maxSimultaneousLights = 4;
  mesh.material = mat;
  mesh.alwaysSelectAsActiveMesh = true;
}

function sign(
  scene: Scene,
  MeshBuilder: typeof import("@babylonjs/core").MeshBuilder,
  PBRMaterial: typeof import("@babylonjs/core").PBRMaterial,
  Color3: typeof import("@babylonjs/core").Color3,
  DynamicTexture: typeof import("@babylonjs/core").DynamicTexture,
  text: string,
  at: [number, number, number],
  color: string,
) {
  const tex = new DynamicTexture(`sign-${text}`, { width: 256, height: 96 }, scene, false);
  const pen = tex.getContext() as CanvasRenderingContext2D;
  pen.fillStyle = "#12080c";
  pen.fillRect(0, 0, 256, 96);
  pen.fillStyle = color;
  pen.font = "700 54px sans-serif";
  pen.textAlign = "center";
  pen.textBaseline = "middle";
  pen.fillText(text, 128, 50);
  tex.update();
  const mat = new PBRMaterial(`sign-${text}`, scene);
  const glow = Color3.FromHexString(color);
  mat.albedoTexture = tex;
  mat.emissiveTexture = tex;
  mat.emissiveColor = glow;
  mat.emissiveIntensity = 0.8;
  mat.maxSimultaneousLights = 4;
  const mesh = MeshBuilder.CreatePlane(`sign-${text}`, { width: 18, height: 7, sideOrientation: 2 }, scene);
  mesh.position.set(at[0], at[1], at[2]);
  mesh.material = mat;
  mesh.alwaysSelectAsActiveMesh = true;
}

async function placeModel(
  scene: Scene,
  TransformNode: typeof import("@babylonjs/core").TransformNode,
  ImportMeshAsync: typeof import("@babylonjs/core").ImportMeshAsync,
  shadow: ShadowGenerator,
  item: { file: string; at: [number, number, number]; tall?: number; span?: number },
) {
  const loaded = await ImportMeshAsync(item.file, scene, { rootUrl: ROOT });
  const holder = new TransformNode(item.file, scene) as TransformNode;
  holder.position.set(item.at[0], item.at[1], item.at[2]);
  const top = loaded.meshes[0];
  if (top) top.parent = holder;
  fit(holder, item.tall, item.span, item.at);
  for (const mesh of loaded.meshes) {
    mesh.alwaysSelectAsActiveMesh = true;
    mesh.receiveShadows = true;
    relight(mesh);
  }
  if (top) shadow.addShadowCaster(top, true);
  for (const group of loaded.animationGroups) group.stop();
}

function relight(mesh: { material: unknown }) {
  const source = mesh.material as { metallic?: number; roughness?: number; albedoColor?: { r: number; g: number; b: number } } | null;
  if (!source || typeof source.metallic !== "number") return;
  source.metallic = Math.min(source.metallic, 0.15);
  source.roughness = Math.max(source.roughness ?? 0.5, 0.4);
  const color = source.albedoColor;
  if (color && color.r + color.g + color.b < 0.15) {
    color.r = 0.45;
    color.g = 0.38;
    color.b = 0.32;
  }
}

function fit(node: TransformNode, tall: number | undefined, span: number | undefined, at: [number, number, number]) {
  node.computeWorldMatrix(true);
  const raw = node.getHierarchyBoundingVectors(true);
  const sizeY = Math.max(raw.max.y - raw.min.y, 0.001);
  const sizeX = Math.max(raw.max.x - raw.min.x, 0.001);
  const sizeZ = Math.max(raw.max.z - raw.min.z, 0.001);
  const byTall = tall ? tall / sizeY : Number.POSITIVE_INFINITY;
  const bySpan = span ? span / Math.max(sizeX, sizeZ) : Number.POSITIVE_INFINITY;
  const scale = Math.min(byTall, bySpan);
  node.scaling.setAll(Number.isFinite(scale) ? scale : 1);
  node.computeWorldMatrix(true);
  const box = node.getHierarchyBoundingVectors(true);
  node.position.x += at[0] - (box.min.x + box.max.x) / 2;
  node.position.z += at[2] - (box.min.z + box.max.z) / 2;
  node.position.y += at[1] - box.min.y;
}
