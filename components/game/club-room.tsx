"use client";

import { useEffect, useRef } from "react";
import type { Matrix, Scene, ShadowGenerator, TransformNode } from "@babylonjs/core";

const ROOT = "/models/kenney/";

type Prop = { file: string; at: [number, number, number]; tall?: number; span?: number; yaw?: number; shade?: boolean };

const STOOL_Z = [14, 24, 34, 44, 54, 64];

const FURNITURE: Prop[] = [
  { file: "furniture/bookcaseOpen.glb", at: [-110, 0, 18], tall: 24, yaw: Math.PI / 2, shade: true },
  { file: "furniture/bookcaseOpen.glb", at: [-110, 0, 38], tall: 24, yaw: Math.PI / 2 },
  { file: "furniture/bookcaseOpen.glb", at: [-110, 0, 56], tall: 24, yaw: Math.PI / 2 },
  { file: "furniture/kitchenFridge.glb", at: [-108, 0, 0], tall: 22, yaw: Math.PI / 2, shade: true },
  { file: "furniture/desk.glb", at: [-50, 0, -48], span: 30, shade: true },
  { file: "furniture/laptop.glb", at: [-40, 12.2, -44], tall: 2.2 },
  { file: "furniture/speaker.glb", at: [-78, 0, -44], tall: 22, shade: true },
  { file: "furniture/speaker.glb", at: [-22, 0, -44], tall: 22, shade: true },
  { file: "furniture/speaker.glb", at: [-78, 0, -30], tall: 12 },
  { file: "furniture/speaker.glb", at: [-22, 0, -30], tall: 12 },
  { file: "furniture/loungeSofaLong.glb", at: [96, 0, 8], span: 30, yaw: -Math.PI / 2, shade: true },
  { file: "furniture/loungeSofaCorner.glb", at: [104, 0, 30], span: 18, yaw: Math.PI },
  { file: "furniture/loungeSofa.glb", at: [74, 0, 24], span: 16, yaw: Math.PI / 2, shade: true },
  { file: "furniture/loungeChair.glb", at: [62, 0, 8], tall: 12, yaw: Math.PI / 2 },
  { file: "furniture/loungeChair.glb", at: [62, 0, 30], tall: 12, yaw: Math.PI / 2 },
  { file: "furniture/tableCoffee.glb", at: [80, 0, 14], span: 11 },
  { file: "furniture/tableCoffeeGlass.glb", at: [42, 0, -28], span: 10 },
  { file: "furniture/loungeSofa.glb", at: [42, 0, -42], span: 18, shade: true },
  { file: "furniture/sideTable.glb", at: [18, 0, 24], tall: 11 },
  { file: "furniture/sideTable.glb", at: [-28, 0, 16], tall: 11 },
  { file: "furniture/sideTable.glb", at: [22, 0, 72], tall: 11 },
  { file: "furniture/table.glb", at: [-34, 0, 80], span: 14 },
  { file: "furniture/chair.glb", at: [-24, 0, 80], tall: 10, yaw: Math.PI },
  { file: "furniture/chair.glb", at: [-44, 0, 80], tall: 10 },
  { file: "furniture/cabinetTelevision.glb", at: [-24, 0, 94], tall: 16, shade: true },
  { file: "furniture/bathroomMirror.glb", at: [-112, 8, 36], tall: 10, yaw: Math.PI / 2 },
  { file: "furniture/pottedPlant.glb", at: [40, 0, 92], tall: 14 },
  { file: "furniture/rugRectangle.glb", at: [86, 0.05, 16], span: 28 },
  { file: "furniture/lampRoundFloor.glb", at: [108, 0, 48], tall: 16 },
  { file: "furniture/ceilingFan.glb", at: [-46, 34, 24], tall: 5 },
  { file: "furniture/ceilingFan.glb", at: [48, 34, 36], tall: 5 },
  { file: "furniture/toilet.glb", at: [106, 0, -48], tall: 9, yaw: Math.PI },
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
      stop = mountClub(core, canvas, () => disposed, name);
    })();

    return () => {
      disposed = true;
      stop();
    };
  }, [name]);

  return (
    <div className="absolute inset-0">
      <canvas ref={host} className="h-full w-full" style={{ pointerEvents: "none" }} />
      <p className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1 text-[11px] font-bold tracking-wide text-[#FCD116]">{name}</p>
    </div>
  );
}

function mountClub(core: typeof import("@babylonjs/core"), canvas: HTMLCanvasElement, gone: () => boolean, clubName: string) {
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
      (this as unknown as { _refreshFrustumPlanes: boolean })._refreshFrustumPlanes = true;
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

  const dark = pbr(scene, PBRMaterial, Color3, "#14080e", 0.08, 0.62);
  const velvet = pbr(scene, PBRMaterial, Color3, "#6b1f3a", 0.04, 0.72);
  const glass = pbr(scene, PBRMaterial, Color3, "#d7eef8", 0.04, 0.08);
  glass.alpha = 0.55;
  const gold = pbr(scene, PBRMaterial, Color3, "#f0d090", 0.65, 0.28);
  const deckMat = pbr(scene, PBRMaterial, Color3, "#1a1218", 0.2, 0.45);

  block(scene, MeshBuilder, "back-wall", 240, 44, 3, 0, 22, -62, wallMat);
  block(scene, MeshBuilder, "side-wall", 3, 44, 168, -118, 22, 22, sideMat);
  block(scene, MeshBuilder, "right-wall", 3, 44, 168, 118, 22, 22, sideMat);
  const barFront = block(scene, MeshBuilder, "bar-front", 5, 11, 58, -74, 5.5, 34, dark);
  shadow.addShadowCaster(barFront);
  const barTop = block(scene, MeshBuilder, "bar-top", 10, 0.7, 62, -71, 11.2, 34, wood);
  barTop.material = brass;
  shadow.addShadowCaster(barTop);
  const rail = MeshBuilder.CreateCylinder("foot-rail", { height: 54, diameter: 0.45, tessellation: 8 }, scene);
  rail.rotation.x = Math.PI / 2;
  rail.position.set(-66, 2.2, 34);
  rail.material = gold;
  rail.alwaysSelectAsActiveMesh = true;

  const stage = block(scene, MeshBuilder, "stage", 40, 2, 18, -50, 1, -46, dark);
  shadow.addShadowCaster(stage);
  block(scene, MeshBuilder, "booth-front", 32, 8, 1.4, -50, 8, -52, dark);
  const platter = MeshBuilder.CreateCylinder("platter", { height: 0.35, diameter: 3.4, tessellation: 16 }, scene);
  platter.material = deckMat;
  platter.isVisible = false;
  for (const x of [-58, -46]) {
    const deck = platter.createInstance(`deck-${x}`);
    deck.position.set(x, 12.6, -44);
    deck.alwaysSelectAsActiveMesh = true;
  }
  block(scene, MeshBuilder, "mixer", 6, 0.8, 3.2, -52, 12.5, -44, deckMat);
  for (const x of [-54, -52, -50]) {
    const knob = MeshBuilder.CreateCylinder(`knob-${x}`, { height: 0.35, diameter: 0.45, tessellation: 8 }, scene);
    knob.position.set(x, 13, -44);
    knob.material = gold;
    knob.alwaysSelectAsActiveMesh = true;
  }
  const mic = MeshBuilder.CreateCylinder("mic-stand", { height: 14, diameter: 0.28, tessellation: 6 }, scene);
  mic.position.set(-38, 7, -40);
  mic.material = deckMat;
  const micHead = MeshBuilder.CreateSphere("mic-head", { diameter: 0.9, segments: 8 }, scene);
  micHead.position.set(-38, 14.2, -40);
  micHead.material = gold;
  const cans = MeshBuilder.CreateTorus("headphones", { diameter: 2.2, thickness: 0.28, tessellation: 12 }, scene);
  cans.position.set(-44, 12.8, -43);
  cans.material = deckMat;
  for (const x of [-80, -24]) {
    block(scene, MeshBuilder, `sub-${x}`, 8, 8, 8, x, 4, -36, deckMat);
    block(scene, MeshBuilder, `cable-${x}`, Math.abs(x + 16), 0.15, 0.2, (x - 16) / 2, 0.1, -40, deckMat);
  }
  block(scene, MeshBuilder, "light-rig", 28, 0.6, 0.6, -50, 28, -40, deckMat);
  led(scene, MeshBuilder, PBRMaterial, Color3, -60, 27.2, -40, 2.2, 1.2, 1.2, "#ff2d95");
  led(scene, MeshBuilder, PBRMaterial, Color3, -50, 27.2, -40, 2.2, 1.2, 1.2, "#7ee0ff");
  led(scene, MeshBuilder, PBRMaterial, Color3, -40, 27.2, -40, 2.2, 1.2, 1.2, "#FCD116");

  const danceMat = pbr(scene, PBRMaterial, Color3, "#3a1460", 0.05, 0.18);
  danceMat.emissiveColor = Color3.FromHexString("#7c5cff");
  danceMat.emissiveIntensity = 1.2;
  const tile = MeshBuilder.CreateBox("dance-tile", { width: 7, height: 0.22, depth: 7 }, scene);
  tile.material = danceMat;
  tile.isVisible = false;
  for (let col = 0; col < 5; col += 1) {
    for (let row = 0; row < 4; row += 1) {
      const cell = tile.createInstance(`tile-${col}-${row}`);
      cell.position.set(-22 + col * 8, 0.12, 40 + row * 8);
      cell.alwaysSelectAsActiveMesh = true;
    }
  }
  block(scene, MeshBuilder, "rail", 34, 3, 0.4, -6, 1.6, 34, gold);

  for (const [x, z] of [
    [58, 2],
    [58, 40],
    [108, 2],
    [108, 40],
  ] as [number, number][]) {
    const post = MeshBuilder.CreateCylinder(`post-${x}-${z}`, { height: 10, diameter: 0.45, tessellation: 8 }, scene);
    post.position.set(x, 5, z);
    post.material = gold;
    const cap = MeshBuilder.CreateSphere(`cap-${x}-${z}`, { diameter: 1.1, segments: 8 }, scene);
    cap.position.set(x, 10.2, z);
    cap.material = velvet;
  }
  block(scene, MeshBuilder, "rope-a", 50, 0.28, 0.28, 83, 8.2, 2, velvet);
  block(scene, MeshBuilder, "rope-b", 0.28, 0.28, 38, 58, 8.2, 21, velvet);

  block(scene, MeshBuilder, "door-l", 8, 22, 1.4, -24, 11, 77, dark);
  block(scene, MeshBuilder, "door-r", 8, 22, 1.4, -12, 11, 77, dark);
  for (const x of [-16, 4, 24]) {
    const queue = MeshBuilder.CreateCylinder(`queue-${x}`, { height: 9, diameter: 0.4, tessellation: 6 }, scene);
    queue.position.set(x, 4.5, 86);
    queue.material = gold;
  }
  block(scene, MeshBuilder, "queue-rope", 40, 0.25, 0.25, 4, 7.4, 86, velvet);
  block(scene, MeshBuilder, "wc-wall", 18, 26, 1.6, 96, 13, -36, wallMat);

  block(scene, MeshBuilder, "beam-a", 200, 1.1, 2.4, 0, 41, -16, dark);
  block(scene, MeshBuilder, "beam-b", 200, 1.1, 2.4, 0, 41, 58, dark);
  block(scene, MeshBuilder, "beam-c", 2.4, 1.1, 120, -60, 41, 20, dark);
  block(scene, MeshBuilder, "beam-d", 2.4, 1.1, 120, 70, 41, 20, dark);
  const disco = MeshBuilder.CreateSphere("disco", { diameter: 6.5, segments: 18 }, scene);
  disco.position.set(-6, 33, 52);
  const mirror = pbr(scene, PBRMaterial, Color3, "#f4efe6", 1, 0.12);
  mirror.emissiveColor = Color3.FromHexString("#ffd7ea");
  mirror.emissiveIntensity = 0.35;
  disco.material = mirror;
  disco.alwaysSelectAsActiveMesh = true;

  led(scene, MeshBuilder, PBRMaterial, Color3, 0, 30, -60, 70, 0.45, 0.45, "#ff2d95");
  led(scene, MeshBuilder, PBRMaterial, Color3, -116, 16, 30, 0.4, 0.4, 80, "#FCD116");
  led(scene, MeshBuilder, PBRMaterial, Color3, 116, 16, 20, 0.4, 0.4, 70, "#7c5cff");
  led(scene, MeshBuilder, PBRMaterial, Color3, -6, 0.2, 52, 36, 0.15, 28, "#ff2d95");
  sign(scene, MeshBuilder, PBRMaterial, Color3, DynamicTexture, clubName.slice(0, 16).toUpperCase(), [0, 34, -59], "#ff2d95", 36, 8, 0);
  sign(scene, MeshBuilder, PBRMaterial, Color3, DynamicTexture, "BAR", [-92, 26, 34], "#FCD116", 16, 6, Math.PI / 2);
  sign(scene, MeshBuilder, PBRMaterial, Color3, DynamicTexture, "VIP", [96, 28, -4], "#FCD116", 16, 6, 0);
  sign(scene, MeshBuilder, PBRMaterial, Color3, DynamicTexture, "EXIT", [30, 24, 96], "#3DDC6A", 12, 5, Math.PI);
  sign(scene, MeshBuilder, PBRMaterial, Color3, DynamicTexture, "WC", [96, 22, -30], "#7ee0ff", 10, 5, Math.PI);
  sign(scene, MeshBuilder, PBRMaterial, Color3, DynamicTexture, "DRINKS", [-92, 20, 58], "#ff2d95", 14, 8, Math.PI / 2);
  sign(scene, MeshBuilder, PBRMaterial, Color3, DynamicTexture, "NO SLEEP", [20, 30, -59], "#7ee0ff", 22, 5, 0);
  poster(scene, MeshBuilder, StandardMaterial, Color3, DynamicTexture, "HIGHLIFE", [-116, 24, 70], Math.PI / 2);
  poster(scene, MeshBuilder, StandardMaterial, Color3, DynamicTexture, "TONIGHT", [116, 24, 64], -Math.PI / 2);
  poster(scene, MeshBuilder, StandardMaterial, Color3, DynamicTexture, "AMAPIANO", [40, 26, -60], 0);

  const bottleColors = ["#CE1126", "#FCD116", "#f4efe6", "#1a120e", "#7c5cff"];
  const bottleSpots: [number, number, number][] = [];
  for (let i = 0; i < 12; i += 1) bottleSpots.push([-112, 16 + (i % 3) * 3.2, 10 + (i % 4) * 8]);
  for (const z of [20, 34, 48]) bottleSpots.push([-71, 13.2, z]);
  bottleSpots.push([80, 8, 14], [-50, 13.2, -44], [-34, 8, 80]);
  bottleColors.forEach((color, index) => {
    const source = MeshBuilder.CreateCylinder(`bottle-${index}`, { height: 3.1, diameterTop: 0.55, diameterBottom: 0.85, tessellation: 8 }, scene);
    source.material = pbr(scene, PBRMaterial, Color3, color, 0.35, 0.28);
    source.isVisible = false;
    bottleSpots.forEach((at, spot) => {
      if (spot % bottleColors.length !== index) return;
      const inst = source.createInstance(`bottle-${index}-${spot}`);
      inst.position.set(at[0], at[1], at[2]);
      inst.alwaysSelectAsActiveMesh = true;
    });
  });
  const tumbler = MeshBuilder.CreateCylinder("glass", { height: 1.3, diameterTop: 0.9, diameterBottom: 0.7, tessellation: 8 }, scene);
  tumbler.material = glass;
  tumbler.isVisible = false;
  for (const [x, y, z] of [
    [-68, 12.4, 22],
    [-68, 12.4, 36],
    [-68, 12.4, 50],
    [78, 7.2, 14],
    [-30, 7.2, 80],
    [18, 8, 24],
    [-44, 12.8, -43],
  ] as [number, number, number][]) {
    const inst = tumbler.createInstance(`glass-${x}-${z}`);
    inst.position.set(x, y, z);
    inst.alwaysSelectAsActiveMesh = true;
  }
  const note = MeshBuilder.CreateBox("note", { width: 1.3, height: 0.05, depth: 0.7 }, scene);
  note.material = gold;
  note.isVisible = false;
  for (let i = 0; i < 14; i += 1) {
    const bill = note.createInstance(`note-${i}`);
    bill.position.set(-20 + (i % 7) * 6, 0.12, 46 + (i % 3) * 5);
    bill.rotation.y = i * 0.7;
    bill.alwaysSelectAsActiveMesh = true;
  }

  for (const z of STOOL_Z) {
    const pole = MeshBuilder.CreateCylinder(`stool-pole-${z}`, { height: 7, diameter: 0.4, tessellation: 6 }, scene);
    pole.position.set(-60, 3.5, z);
    pole.material = gold;
    const seat = MeshBuilder.CreateCylinder(`stool-seat-${z}`, { height: 0.5, diameter: 3.6, tessellation: 10 }, scene);
    seat.position.set(-60, 7.2, z);
    seat.material = velvet;
    const foot = MeshBuilder.CreateTorus(`stool-foot-${z}`, { diameter: 2.4, thickness: 0.18, tessellation: 8 }, scene);
    foot.position.set(-60, 2, z);
    foot.material = gold;
  }
  block(scene, MeshBuilder, "pos", 2.4, 1.5, 1.8, -68, 12.5, 28, deckMat);
  led(scene, MeshBuilder, PBRMaterial, Color3, -68, 13.4, 27.1, 1.8, 1.1, 0.2, "#7ee0ff");
  const shaker = MeshBuilder.CreateCylinder("shaker", { height: 2.2, diameterTop: 0.55, diameterBottom: 0.85, tessellation: 8 }, scene);
  shaker.position.set(-72, 13.1, 42);
  shaker.material = gold;
  shaker.alwaysSelectAsActiveMesh = true;
  const napkin = pbr(scene, PBRMaterial, Color3, "#f6efe4", 0.02, 0.8);
  for (const z of [18, 30, 46]) block(scene, MeshBuilder, `napkin-${z}`, 1.1, 0.08, 1.1, -67, 11.7, z, napkin);
  const bucket = MeshBuilder.CreateCylinder("ice-bucket", { height: 2.6, diameterTop: 2.2, diameterBottom: 1.5, tessellation: 10 }, scene);
  bucket.position.set(82, 6.4, 16);
  bucket.material = gold;
  bucket.alwaysSelectAsActiveMesh = true;
  block(scene, MeshBuilder, "booth-back", 8, 16, 1.2, 40, 8, 90, dark);
  block(scene, MeshBuilder, "booth-side", 1.2, 16, 6, 36, 8, 87, dark);
  led(scene, MeshBuilder, PBRMaterial, Color3, 40, 14, 89.2, 4, 3, 0.2, "#ff2d95");

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
    danceMat.emissiveIntensity = 0.8 + Math.sin(t * 2.4) * 0.55;
    disco.rotation.y = t * 0.55;
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

  void placeAll(scene, TransformNode, ImportMeshAsync, shadow, FURNITURE)
    .catch(() => undefined)
    .finally(() => {
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
  // Stay inside 0..1 depth. Higher furniture and the near corner are closer than the floor.
  Matrix.FromValuesToRef(ax, -az, -0.001, 0, 0, ay, -0.002, 0, -ax, -az, -0.001, 0, bx, by, 0.5, 1, proj);
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
  width = 18,
  height = 7,
  yaw = 0,
) {
  const tex = new DynamicTexture(`sign-${text}-${at[0]}`, { width: 512, height: 160 }, scene, false);
  const pen = tex.getContext() as CanvasRenderingContext2D;
  pen.fillStyle = "#12080c";
  pen.fillRect(0, 0, 512, 160);
  pen.fillStyle = color;
  pen.font = "700 72px sans-serif";
  pen.textAlign = "center";
  pen.textBaseline = "middle";
  pen.fillText(text, 256, 84);
  tex.update();
  const mat = new PBRMaterial(`sign-${text}-${at[0]}`, scene);
  const glow = Color3.FromHexString(color);
  mat.albedoTexture = tex;
  mat.emissiveTexture = tex;
  mat.emissiveColor = glow;
  mat.emissiveIntensity = 0.9;
  mat.maxSimultaneousLights = 4;
  const mesh = MeshBuilder.CreatePlane(`sign-${text}-${at[0]}`, { width, height, sideOrientation: 2 }, scene);
  mesh.position.set(at[0], at[1], at[2]);
  mesh.rotation.y = yaw;
  mesh.material = mat;
  mesh.alwaysSelectAsActiveMesh = true;
}

function poster(
  scene: Scene,
  MeshBuilder: typeof import("@babylonjs/core").MeshBuilder,
  StandardMaterial: typeof import("@babylonjs/core").StandardMaterial,
  Color3: typeof import("@babylonjs/core").Color3,
  DynamicTexture: typeof import("@babylonjs/core").DynamicTexture,
  text: string,
  at: [number, number, number],
  yaw: number,
) {
  const tex = new DynamicTexture(`poster-${text}`, { width: 256, height: 320 }, scene, false);
  const pen = tex.getContext() as CanvasRenderingContext2D;
  pen.fillStyle = "#1a1020";
  pen.fillRect(0, 0, 256, 320);
  pen.fillStyle = "#FCD116";
  pen.fillRect(0, 0, 256, 18);
  pen.fillStyle = "#ffffff";
  pen.font = "700 36px sans-serif";
  pen.textAlign = "center";
  pen.fillText(text, 128, 170);
  tex.update();
  const mat = new StandardMaterial(`poster-${text}`, scene);
  mat.diffuseTexture = tex;
  mat.emissiveTexture = tex;
  mat.emissiveColor = Color3.FromHexString("#2a2030");
  mat.backFaceCulling = false;
  const mesh = MeshBuilder.CreatePlane(`poster-${text}`, { width: 10, height: 13 }, scene);
  mesh.position.set(at[0], at[1], at[2]);
  mesh.rotation.y = yaw;
  mesh.material = mat;
  mesh.alwaysSelectAsActiveMesh = true;
}

async function placeAll(
  scene: Scene,
  TransformNode: typeof import("@babylonjs/core").TransformNode,
  ImportMeshAsync: typeof import("@babylonjs/core").ImportMeshAsync,
  shadow: ShadowGenerator,
  items: Prop[],
) {
  const groups = new Map<string, Prop[]>();
  for (const item of items) {
    const list = groups.get(item.file) ?? [];
    list.push(item);
    groups.set(item.file, list);
  }
  await Promise.all(
    [...groups.entries()].map(async ([file, list]) => {
      const loaded = await ImportMeshAsync(file, scene, { rootUrl: ROOT });
      const root = loaded.meshes[0];
      if (!root) return;
      for (const group of loaded.animationGroups) group.stop();
      const copies = list.map((_, index) => (index === 0 ? root : root.clone(`${file}-${index}`, null)));
      copies.forEach((node, index) => {
        const item = list[index];
        if (!node || !item) return;
        const holder = new TransformNode(`${file}-hold-${index}`, scene);
        holder.position.set(item.at[0], item.at[1], item.at[2]);
        holder.rotation.y = item.yaw ?? 0;
        node.parent = holder;
        fit(holder, item.tall, item.span, item.at);
        const meshes = [node, ...node.getChildMeshes(false)];
        for (const mesh of meshes) {
          mesh.alwaysSelectAsActiveMesh = true;
          mesh.receiveShadows = true;
          relight(mesh);
        }
        if (item.shade) shadow.addShadowCaster(node, true);
      });
    }),
  );
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
  const scale = Math.min(Math.max(Math.min(byTall, bySpan), 0.02), 40);
  node.scaling.setAll(Number.isFinite(scale) ? scale : 1);
  node.computeWorldMatrix(true);
  const box = node.getHierarchyBoundingVectors(true);
  node.position.x += at[0] - (box.min.x + box.max.x) / 2;
  node.position.z += at[2] - (box.min.z + box.max.z) / 2;
  node.position.y += at[1] - box.min.y;
}
