"use client";
/* eslint-disable @typescript-eslint/no-explicit-any -- CDN-loaded window.THREE (three r128) and window.Babel are intentionally untyped */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  FileCode,
  Upload,
  Camera,
  RotateCcw,
  Sliders,
  Copy,
  Check,
  Info,
  X,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Loader2,
  PlayCircle
} from 'lucide-react';

import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell, Field, Select } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";

// Declare THREE on window for loaded external scripts
declare global {
  interface Window {
    THREE: any;
  }
}

interface CodeStats {
  lines: number;
  chars: number;
  exportsCount: number;
  interfacesCount: number;
  typesCount: number;
}

interface MeshStats {
  vertices: number;
  polygons: number;
  meshes: number;
  dimensions: string;
}

const I18N = {
  km: {
    app_title: "កម្មវិធីមើល 3D & ឯកសារ TypeScript (.ts/.tsx)",
    open_file: "បើកឯកសារ (3D / .TS)",
    take_snapshot: "ថតរូប (Snapshot)",
    controls: "ការកំណត់ & ឧបករណ៍",
    mode_3d: "ទិដ្ឋភាព 3D Canvas",
    mode_code: "ទិដ្ឋភាព កូដ (.TS/.TSX)",
    sample_models: "គំរូ 3D & TS គំរូស្រាប់ (Presets)",
    angkor_wat: "ប្រាសាទអង្គរវត្ត",
    khmer_stupa: "ចេតិយខ្មែរ",
    sci_drone: "Sci-Fi Drone",
    ts_sample: "កូដ TypeScript 3D Scene",
    display_settings: "ការបង្ហាញរូបភាព 3D",
    wireframe: "លួសក្រឡា (Wireframe)",
    grid_floor: "ក្រឡាបាត (Grid Floor)",
    auto_rotate: "បង្វិលស្វ័យប្រវត្តិ",
    bounding_box: "ប្រអប់ព្រំដែន (Bounding Box)",
    shadows: "ស្រមោល (Shadows)",
    material_override: "ស្ទីលសម្ភារៈ (Material)",
    mat_original: "សម្ភារៈដើម (Original)",
    mat_clay: "ដីឥដ្ឋព័រស្បែក (Studio Clay)",
    mat_bronze: "សំរឹទ្ធបុរាណ (Antique Bronze)",
    mat_gold: "មាសទឹកដប់ (Metallic Gold)",
    mat_normal: "ផែនទី Normal Shader",
    lighting: "ពន្លឺ & បរិយាកាស",
    light_intensity: "កម្រិតពន្លឺ (Intensity)",
    env_background: "ពណ៌ផ្ទៃខាងក្រោយ",
    drop_title: "ទម្លាក់ឯកសារ 3D ឬ .TS/.TSX នៅទីនេះ",
    drop_subtitle: "គាំទ្រ .GLB, .GLTF, .OBJ, .STL, .TS, .TSX, .JSON",
    btn_reset: "កំណត់ទិដ្ឋភាពឡើងវិញ",
    model_info: "ព័ត៌មានលម្អិត (Inspector)",
    stats_3d: "ស្ថិតិ 3D Mesh",
    stats_code: "ស្ថិតិ កូដ TypeScript",
    file_name: "ឈ្មោះឯកសារ:",
    vertex_count: "ចំណុចកំពូល (Vertices):",
    poly_count: "ផ្ទៃត្រីកោណ (Triangles):",
    mesh_count: "ចំនួន Sub-meshes:",
    bbox_dimensions: "ទំហំប្រអប់ (X×Y×Z):",
    code_lines: "ចំនួនបន្ទាត់កូដ (Lines):",
    code_chars: "ចំនួនអក្សរ (Characters):",
    code_exports: "ចំនួន Exports:",
    code_interfaces: "Interfaces / Types:",
    copy_code: "ចម្លងកូដ (Copy)",
    copied: "បានចម្លង!",
    run_ts_code: "បង្ហាញ 3D ពី Script នេះ",
    running_ts_code: "កំពុងចងក្រង TypeScript...",
    smartphone_model: "ស្មាតហ្វូន (Smartphone)",
    ts_live_render: "TS → 3D (Live)",
    compile_error: "កំហុសក្នុងកូដ TypeScript",
    no_factory_found: "រកមិនឃើញ Function បង្កើតម៉ូដែល (create...Model)"
  },
  en: {
    app_title: "3D Model & TypeScript (.ts/.tsx) Inspector",
    open_file: "Open File (3D / .TS)",
    take_snapshot: "Take Snapshot",
    controls: "Controls & Settings",
    mode_3d: "3D Viewport",
    mode_code: "TypeScript Code (.TS/.TSX)",
    sample_models: "Preset 3D & TS Models",
    angkor_wat: "Angkor Wat Temple",
    khmer_stupa: "Khmer Stupa",
    sci_drone: "Sci-Fi Drone",
    ts_sample: "3D Scene Script (.ts)",
    display_settings: "3D Display Settings",
    wireframe: "Wireframe Overlay",
    grid_floor: "Grid Floor",
    auto_rotate: "Auto Rotate",
    bounding_box: "Bounding Box",
    shadows: "Shadows",
    material_override: "Material Override",
    mat_original: "Original Materials",
    mat_clay: "Studio Clay",
    mat_bronze: "Antique Bronze",
    mat_gold: "Metallic Gold",
    mat_normal: "Normal Map Shader",
    lighting: "Lighting & Environment",
    light_intensity: "Light Intensity",
    env_background: "Background Color",
    drop_title: "Drop 3D File or .TS/.TSX Here",
    drop_subtitle: "Supports .GLB, .GLTF, .OBJ, .STL, .TS, .TSX, .JSON",
    btn_reset: "Reset Camera View",
    model_info: "Inspector Panel",
    stats_3d: "3D Mesh Statistics",
    stats_code: "TypeScript Code Metrics",
    file_name: "File Name:",
    vertex_count: "Vertices:",
    poly_count: "Triangles:",
    mesh_count: "Sub-mesh Count:",
    bbox_dimensions: "Bounding Box (X×Y×Z):",
    code_lines: "Total Lines:",
    code_chars: "Characters:",
    code_exports: "Exports Count:",
    code_interfaces: "Interfaces & Types:",
    copy_code: "Copy Code",
    copied: "Copied!",
    run_ts_code: "Render 3D from Script",
    running_ts_code: "Compiling TypeScript...",
    smartphone_model: "Smartphone",
    ts_live_render: "TS → 3D (Live)",
    compile_error: "TypeScript Compile Error",
    no_factory_found: "No model factory function found (create...Model)"
  }
};

const SAMPLE_TS_CODE = `/**
 * Tools123 - Khmer Architectural 3D Generator in TypeScript
 * @file AngkorWatGenerator.ts
 */

export interface AngkorConfig {
  baseWidth: number;
  baseHeight: number;
  towersCount: number;
  stoneMaterialColor: string;
  isGoldCrownEnabled: boolean;
}

export interface ModelMeshStats {
  totalVertices: number;
  totalTriangles: number;
  isCompliant: boolean;
}

export class AngkorWatBuilder {
  private config: AngkorConfig;

  constructor(config: AngkorConfig) {
    this.config = config;
  }

  public generatePrasatTower(height: number, radiusBase: number): void {
    console.log(\`Generating Prasat Tower with height: \${height}m and base radius: \${radiusBase}m\`);
  }

  public calculateStats(): ModelMeshStats {
    return {
      totalVertices: 14280,
      totalTriangles: 28400,
      isCompliant: true
    };
  }
}

export const defaultAngkorConfig: AngkorConfig = {
  baseWidth: 10,
  baseHeight: 1.2,
  towersCount: 5,
  stoneMaterialColor: '#94a3b8',
  isGoldCrownEnabled: true
};
`;

const SMARTPHONE_TS_CODE = `import * as THREE from 'three';

/**
 * Generic modern flagship smartphone, built the same way as the earbuds case
 * and watch models: extruded squircle slab body, glass front with a
 * lock-screen canvas texture, a raised camera module with three real lens
 * rings, side buttons, and a bottom speaker/USB-C deck.
 *
 * Live animation (looping ~7s): phone rests face-up on a surface → lifts and
 * tilts as if picked up while the screen wakes from black to the lock
 * screen → holds at a hero angle → lowers and the screen sleeps again.
 */

export interface SmartphoneOptions {
  shadows?: boolean;
}

/* ---- palette ---- */
const COL = {
  frame: 0xb9bcc2,
  glassBack: 0x2b2f38,
  screenOff: 0x030405,
  screenInk: 0xf5f6f8,
  screenDim: 0x9aa0ab,
  camHousing: 0x1c1e22,
  lensRing: 0x4b4f57,
  lensGlass: 0x0a0c10,
  flash: 0xf3e9c9,
  accent: 0xd8dce2,
};

/* ---- dimensions ---- */
const W = 0.9;
const H = 1.86;
const D = 0.11;
const R = 0.2;
const topY = D;

function hex(n: number): string {
  return '#' + n.toString(16).padStart(6, '0');
}

function textTexture(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  w = 512,
  h = 1024,
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function squircleShape(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  const hx = w / 2 - r;
  const hy = h / 2 - r;
  s.absarc(hx, -hy, r, -Math.PI / 2, 0);
  s.absarc(hx, hy, r, 0, Math.PI / 2);
  s.absarc(-hx, hy, r, Math.PI / 2, Math.PI);
  s.absarc(-hx, -hy, r, Math.PI, Math.PI * 1.5);
  return s;
}

function squircleSlab(
  w: number,
  h: number,
  depth: number,
  r: number,
  mat: THREE.Material,
  bevel: number,
  shadows: boolean,
): THREE.Mesh {
  const shape = squircleShape(w, h, r);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: depth - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 6,
    curveSegments: 28,
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, bevel, 0);
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = shadows;
  m.receiveShadow = shadows;
  return m;
}

/* ============================================================ */
export function createSmartphoneModel(options: SmartphoneOptions = {}): THREE.Group {
  const shadows = options.shadows ?? true;
  const root = new THREE.Group();
  root.position.y = 0.11;

  /* ---- materials ---- */
  const matFrame = new THREE.MeshPhysicalMaterial({
    color: COL.frame,
    roughness: 0.28,
    metalness: 0.9,
    clearcoat: 0.3,
    clearcoatRoughness: 0.25,
    envMapIntensity: 1.1,
  });
  const matGlassBack = new THREE.MeshPhysicalMaterial({
    color: COL.glassBack,
    roughness: 0.14,
    metalness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.3,
  });
  const matScreenGlass = new THREE.MeshPhysicalMaterial({
    color: 0x060708,
    roughness: 0.05,
    metalness: 0.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.4,
  });
  const matCamHousing = new THREE.MeshPhysicalMaterial({
    color: COL.camHousing,
    roughness: 0.35,
    metalness: 0.7,
    clearcoat: 0.4,
  });
  const matLensRing = new THREE.MeshStandardMaterial({ color: COL.lensRing, roughness: 0.3, metalness: 0.9 });
  const matLensGlass = new THREE.MeshPhysicalMaterial({
    color: COL.lensGlass,
    roughness: 0.05,
    metalness: 0.0,
    clearcoat: 1.0,
    envMapIntensity: 1.8,
  });
  const matFlash = new THREE.MeshStandardMaterial({ color: COL.flash, roughness: 0.4, metalness: 0.0 });
  const matButton = new THREE.MeshStandardMaterial({ color: COL.accent, roughness: 0.3, metalness: 0.85 });

  /* ---- lock-screen texture ---- */
  const screenTex = textTexture((ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#1a2138');
    grad.addColorStop(1, '#05070c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // status bar
    ctx.fillStyle = hex(COL.screenInk);
    ctx.font = '600 22px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('9:41', 34, 58);
    ctx.textAlign = 'right';
    ctx.fillText('LTE 100%', w - 34, 58);

    // camera cutout
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(w / 2, 40, 12, 0, Math.PI * 2);
    ctx.fill();

    // clock
    ctx.textAlign = 'center';
    ctx.fillStyle = hex(COL.screenInk);
    ctx.font = '300 128px Arial';
    ctx.fillText('9:41', w / 2, h * 0.34);
    ctx.font = '400 32px Arial';
    ctx.fillStyle = hex(COL.screenDim);
    ctx.fillText('Tuesday, 17 March', w / 2, h * 0.4);

    // notification chips
    const chipY = h * 0.52;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    const chipH = 92;
    for (let i = 0; i < 2; i++) {
      const y = chipY + i * (chipH + 18);
      roundRect(ctx, w * 0.08, y, w * 0.84, chipH, 22);
      ctx.fill();
    }
    ctx.fillStyle = hex(COL.screenInk);
    ctx.font = '600 26px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Messages', w * 0.14, chipY + 38);
    ctx.fillText('Calendar', w * 0.14, chipY + chipH + 18 + 38);
    ctx.font = '400 22px Arial';
    ctx.fillStyle = hex(COL.screenDim);
    ctx.fillText('New message received', w * 0.14, chipY + 68);
    ctx.fillText('Standup in 15 minutes', w * 0.14, chipY + chipH + 18 + 68);

    // bottom lock icon + home indicator
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.86, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    roundRect(ctx, w / 2 - 68, h - 26, 136, 6, 3);
    ctx.fill();

    function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w2: number, h2: number, rad: number) {
      c.beginPath();
      c.moveTo(x + rad, y);
      c.arcTo(x + w2, y, x + w2, y + h2, rad);
      c.arcTo(x + w2, y + h2, x, y + h2, rad);
      c.arcTo(x, y + h2, x, y, rad);
      c.arcTo(x, y, x + w2, y, rad);
      c.closePath();
    }
  }, 512, 1108);
  const matScreen = new THREE.MeshStandardMaterial({
    map: screenTex,
    emissive: new THREE.Color(0xffffff),
    emissiveMap: screenTex,
    emissiveIntensity: 1.0,
    roughness: 0.35,
  });

  /* ---- BODY ---- */
  const body = squircleSlab(W, H, D, R, matFrame, 0.02, shadows);
  root.add(body);

  const back = squircleSlab(W - 0.02, H - 0.02, D - 0.03, R - 0.01, matGlassBack, 0.015, shadows);
  back.position.y = -0.005;
  root.add(back);

  // screen is a flat ROUNDED shape (a scaled copy of the body's own outline,
  // not an independent w/h inset) so its corners always stay inside the
  // body's curve, however tight the corner radius is.
  const SCREEN_SCALE = 0.955;
  const screenShapeGeo = new THREE.ShapeGeometry(squircleShape(W * SCREEN_SCALE, H * SCREEN_SCALE, R * SCREEN_SCALE), 24);
  const screenPlane = new THREE.Mesh(screenShapeGeo, matScreen);
  screenPlane.rotation.x = -Math.PI / 2;
  screenPlane.position.y = topY + 0.001;
  root.add(screenPlane);

  const GLASS_SCALE = 0.99;
  const screenGlass = squircleSlab(W * GLASS_SCALE, H * GLASS_SCALE, 0.02, R * GLASS_SCALE, matScreenGlass, 0.008, shadows);
  screenGlass.position.y = topY + 0.008;
  root.add(screenGlass);

  /* ---- camera module (top area of the back, protrudes below y=0) ---- */
  const camGroup = new THREE.Group();
  camGroup.position.set(-W * 0.24, 0, -H * 0.32);
  root.add(camGroup);

  // squircleSlab spans local y:[0, depth]; sitting it at y=-depth flushes its
  // TOP against the phone's underside (y=0) so it bumps outward below that.
  const HOUSING_DEPTH = 0.05;
  const housing = squircleSlab(0.42, 0.42, HOUSING_DEPTH, 0.12, matCamHousing, 0.012, shadows);
  housing.position.y = -HOUSING_DEPTH;
  camGroup.add(housing);
  const housingOuterY = -HOUSING_DEPTH + 0.006; // just inside the bump's outward face

  const lensLayout = [
    { x: -0.11, z: -0.1 },
    { x: 0.11, z: -0.1 },
    { x: 0, z: 0.1 },
  ];
  for (const p of lensLayout) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.012, 12, 28), matLensRing);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(p.x, housingOuterY, p.z);
    camGroup.add(ring);
    const glass = new THREE.Mesh(new THREE.CircleGeometry(0.065, 28), matLensGlass);
    glass.rotation.x = Math.PI / 2;
    glass.position.set(p.x, housingOuterY - 0.003, p.z);
    camGroup.add(glass);
  }
  const flash = new THREE.Mesh(new THREE.CircleGeometry(0.03, 20), matFlash);
  flash.rotation.x = Math.PI / 2;
  flash.position.set(0.14, housingOuterY - 0.003, 0.1);
  camGroup.add(flash);

  /* ---- side buttons: sit centered in the thin Y-thickness band (0..D),
     spaced along Z (the phone's length), flush against the ±X edges ---- */
  const btnY = D / 2;
  const powerBtn = new THREE.Mesh(new THREE.BoxGeometry(0.02, D * 0.55, 0.18), matButton);
  powerBtn.position.set(W / 2 + 0.008, btnY, H * 0.12);
  root.add(powerBtn);

  const volUp = new THREE.Mesh(new THREE.BoxGeometry(0.02, D * 0.55, 0.14), matButton);
  volUp.position.set(-W / 2 - 0.008, btnY, H * 0.1);
  root.add(volUp);
  const volDown = volUp.clone();
  volDown.position.z = H * -0.02;
  root.add(volDown);

  /* ---- bottom deck: speaker holes + USB-C slit, on the bottom short edge ---- */
  const deck = new THREE.Group();
  deck.position.set(0, btnY, -H / 2 - 0.006);
  deck.rotation.y = Math.PI;
  root.add(deck);
  for (let i = 0; i < 6; i++) {
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.008, 10), matCamHousing);
    hole.position.set(0.15 + i * 0.03, 0, 0);
    deck.add(hole);
  }
  const usbC = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.02, 0.005), matCamHousing);
  usbC.position.set(-0.2, 0, 0);
  deck.add(usbC);

  /* ---- animation timeline: pick-up + screen wake ---- */
  const CYCLE = 7.0;
  const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const smooth = (x: number, a: number, b: number): number =>
    easeInOut(THREE.MathUtils.clamp((x - a) / (b - a), 0, 1));

  function updateAnimation(time: number): void {
    const t = time % CYCLE;
    const liftIn = smooth(t, 0.3, 1.6);
    const lowerOut = smooth(t, 5.2, 6.6);
    const lift = liftIn * (1 - lowerOut);

    root.position.y = 0.11 + lift * 0.35;
    root.rotation.x = THREE.MathUtils.lerp(0.5, 0.08, lift);
    root.rotation.z = THREE.MathUtils.lerp(0.12, -0.05, lift) * Math.sin(time * 0.4 + 1);
    root.rotation.y = Math.sin(time * 0.2) * 0.15;

    const wake = smooth(t, 0.9, 1.9) * (1 - smooth(t, 4.8, 5.6));
    matScreen.emissiveIntensity = THREE.MathUtils.lerp(0.05, 1.0, wake);
  }

  updateAnimation(0);
  root.userData.tick = (_dt: number, elapsed: number): void => updateAnimation(elapsed);

  return root;
}

/* ============================================================ */
export function createSmartphoneLookDevLights(): THREE.Group {
  const lights = new THREE.Group();
  const key = new THREE.DirectionalLight(0xffffff, 2.5);
  key.position.set(3.5, 6.5, 4.5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 20;
  const kc = key.shadow.camera as THREE.OrthographicCamera;
  kc.left = -4;
  kc.right = 4;
  kc.top = 4;
  kc.bottom = -4;
  key.shadow.bias = -0.0004;
  key.shadow.radius = 5;
  lights.add(key);

  const fill = new THREE.DirectionalLight(0xdfe6ff, 0.6);
  fill.position.set(-4, 3, 2);
  lights.add(fill);

  const rim = new THREE.DirectionalLight(0xcfe0ff, 0.55);
  rim.position.set(-2, 4, -5);
  lights.add(rim);

  lights.add(new THREE.HemisphereLight(0xffffff, 0x9a9a9d, 0.4));
  return lights;
}

export function makeSmartphoneBackground(): THREE.Color {
  return new THREE.Color(0xe9eaec);
}
`;

/* Localises every UI string through the app-level language toggle (en / km / bi),
   instead of running an independent per-tool language switcher. */
function useI18n(text: (en: string, km: string) => string) {
  const en = I18N.en as Record<string, string>;
  const km = I18N.km as Record<string, string>;
  const out: Record<string, string> = {};
  for (const key of Object.keys(en)) {
    out[key] = text(en[key], km[key]);
  }
  return out;
}

export default function ModelPreviewTool() {
  const { text } = useLanguage();
  const [activeTab, setActiveTab] = useState<'3d' | 'code'>('3d');
  const [loadedFileName, setLoadedFileName] = useState<string>("Angkor Wat Temple");
  const [codeContent, setCodeContent] = useState<string>(SAMPLE_TS_CODE);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [showStatsPanel, setShowStatsPanel] = useState<boolean>(true);
  const [toast, setToast] = useState<{ msg: string; type: 'info' | 'success' | 'error' } | null>(null);

  // 3D Scene Controls State
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [gridFloor, setGridFloor] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [boundingBox, setBoundingBox] = useState<boolean>(false);
  const [shadows, setShadows] = useState<boolean>(true);
  const [materialOverride, setMaterialOverride] = useState<string>('original');
  const [lightIntensity, setLightIntensity] = useState<number>(1.2);
  const [bgColor, setBgColor] = useState<string>('#0b0f19');
  const themeGround = useMemo(() => {
    if (typeof window === 'undefined') return '#0b0f19';
    return getComputedStyle(document.documentElement).getPropertyValue('--ground').trim() || '#0b0f19';
  }, []);

  // Stats State
  const [meshStats, setMeshStats] = useState<MeshStats>({ vertices: 0, polygons: 0, meshes: 1, dimensions: '0.00 × 0.00 × 0.00 m' });
  const codeStats = useMemo<CodeStats>(() => {
    const lines = codeContent.split('\n').length;
    const chars = codeContent.length;
    const exportsCount = (codeContent.match(/export\s+/g) || []).length;
    const interfacesCount = (codeContent.match(/interface\s+/g) || []).length;
    const typesCount = (codeContent.match(/type\s+/g) || []).length;
    return { lines, chars, exportsCount, interfacesCount, typesCount };
  }, [codeContent]);

  // DOM Refs
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const threeRef = useRef<{
    scene: any;
    camera: any;
    renderer: any;
    controls: any;
    currentGroup: any;
    bboxHelper: any;
    gridHelper: any;
    dirLight: any;
    originalMaterials: Map<string, any>;
    clock: any;
    tickFn: ((dt: number, elapsed: number) => void) | null;
    customLights: any;
  }>({
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    currentGroup: null,
    bboxHelper: null,
    gridHelper: null,
    dirLight: null,
    originalMaterials: new Map(),
    clock: null,
    tickFn: null,
    customLights: null
  });

  const [libsReady, setLibsReady] = useState<boolean>(false);
  const [babelReady, setBabelReady] = useState<boolean>(false);
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [scriptError, setScriptError] = useState<string | null>(null);

  const t = useI18n(text);

  const loadExternalScript = (src: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  };

  const ensureBabelLoaded = async (): Promise<boolean> => {
    if ((window as any).Babel) {
      setBabelReady(true);
      return true;
    }
    const ok = await loadExternalScript('https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.24.7/babel.min.js');
    setBabelReady(ok && !!(window as any).Babel);
    return ok && !!(window as any).Babel;
  };

  useEffect(() => {
    const loadScript = (src: string) => {
      return new Promise((resolve) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve(true);
          return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.head.appendChild(script);
      });
    };

    const loadAllDependencies = async () => {
      if (!window.THREE) {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
      }
      if (window.THREE) {
        await Promise.all([
          loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js'),
          loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js'),
          loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/OBJLoader.js'),
          loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/STLLoader.js')
        ]);
        setLibsReady(true);
      }
    };

    loadAllDependencies();
  }, []);

  const createAngkorWatModel = () => {
    const THREE = window.THREE;
    const group = new THREE.Group();
    group.name = "Angkor Wat Temple";

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.85, metalness: 0.1 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, metalness: 0.8 });

    // Base Terrace Platform
    const baseGeo = new THREE.BoxGeometry(10, 1.2, 10);
    const baseMesh = new THREE.Mesh(baseGeo, stoneMat);
    baseMesh.position.y = 0.6;
    group.add(baseMesh);

    // Tier 2 Platform
    const tier2Geo = new THREE.BoxGeometry(7, 1.0, 7);
    const tier2Mesh = new THREE.Mesh(tier2Geo, stoneMat);
    tier2Mesh.position.y = 1.7;
    group.add(tier2Mesh);

    // Tier 3 Sanctuary Base
    const tier3Geo = new THREE.BoxGeometry(4.5, 1.0, 4.5);
    const tier3Mesh = new THREE.Mesh(tier3Geo, stoneMat);
    tier3Mesh.position.y = 2.7;
    group.add(tier3Mesh);

    // Helper for Prasat Lotus Towers
    const createPrasat = (height: number, radiusBase: number, isCentral: boolean) => {
      const towerGroup = new THREE.Group();
      const segments = 5;
      for (let i = 0; i < segments; i++) {
        const r = radiusBase * (1 - i * 0.15);
        const h = height / segments;
        const layerGeo = new THREE.CylinderGeometry(r * 0.85, r, h, 8);
        const mat = isCentral && i === segments - 1 ? goldMat : stoneMat;
        const layerMesh = new THREE.Mesh(layerGeo, mat);
        layerMesh.position.y = i * h + h / 2;
        towerGroup.add(layerMesh);
      }
      const crownGeo = new THREE.ConeGeometry(radiusBase * 0.5, height * 0.25, 8);
      const crownMesh = new THREE.Mesh(crownGeo, goldMat);
      crownMesh.position.y = height + height * 0.1;
      towerGroup.add(crownMesh);
      return towerGroup;
    };

    const centralTower = createPrasat(4.5, 1.2, true);
    centralTower.position.set(0, 3.2, 0);
    group.add(centralTower);

    const cornerOffset = 2.2;
    const corners = [
      [-cornerOffset, -cornerOffset],
      [cornerOffset, -cornerOffset],
      [-cornerOffset, cornerOffset],
      [cornerOffset, cornerOffset]
    ];
    corners.forEach(([cx, cz]) => {
      const tower = createPrasat(3.2, 0.8, false);
      tower.position.set(cx, 2.2, cz);
      group.add(tower);
    });

    return group;
  };

  const createKhmerStupaModel = () => {
    const THREE = window.THREE;
    const group = new THREE.Group();
    group.name = "Khmer Ancient Stupa";

    const bronzeMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5, metalness: 0.7 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.2, metalness: 0.9 });

    for (let i = 0; i < 4; i++) {
      const size = 6 - i * 0.8;
      const stepGeo = new THREE.CylinderGeometry(size * 0.9, size, 0.6, 8);
      const step = new THREE.Mesh(stepGeo, bronzeMat);
      step.position.y = i * 0.6 + 0.3;
      group.add(step);
    }

    const domeGeo = new THREE.SphereGeometry(1.8, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.7);
    const dome = new THREE.Mesh(domeGeo, goldMat);
    dome.position.y = 3.2;
    group.add(dome);

    for (let i = 0; i < 7; i++) {
      const ringGeo = new THREE.CylinderGeometry(1.2 - i * 0.14, 1.3 - i * 0.14, 0.25, 12);
      const ring = new THREE.Mesh(ringGeo, goldMat);
      ring.position.y = 4.2 + i * 0.28;
      group.add(ring);
    }

    const spireGeo = new THREE.ConeGeometry(0.3, 2.0, 12);
    const spire = new THREE.Mesh(spireGeo, goldMat);
    spire.position.y = 7.1;
    group.add(spire);

    return group;
  };

  const createDroneModel = () => {
    const THREE = window.THREE;
    const group = new THREE.Group();
    group.name = "Sci-Fi Drone";
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3, metalness: 0.8 });
    const cyanMat = new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x0891b2, emissiveIntensity: 0.8 });

    const coreGeo = new THREE.IcosahedronGeometry(1.8, 2);
    const core = new THREE.Mesh(coreGeo, bodyMat);
    core.position.y = 3.0;
    group.add(core);

    const eyeGeo = new THREE.SphereGeometry(0.7, 16, 16);
    const eye = new THREE.Mesh(eyeGeo, cyanMat);
    eye.position.set(0, 3.0, 1.4);
    group.add(eye);

    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const armGroup = new THREE.Group();
      const armGeo = new THREE.CylinderGeometry(0.2, 0.3, 3);
      const arm = new THREE.Mesh(armGeo, bodyMat);
      arm.rotation.z = Math.PI / 2;
      arm.position.x = 2.0;
      armGroup.add(arm);

      const ringGeo = new THREE.TorusGeometry(0.8, 0.1, 8, 24);
      const ring = new THREE.Mesh(ringGeo, cyanMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.x = 3.5;
      armGroup.add(ring);

      armGroup.rotation.y = angle;
      armGroup.position.y = 3.0;
      group.add(armGroup);
    }
    return group;
  };

  const processAndCenterModel = (modelGroup: any, name: string) => {
    const THREE = window.THREE;
    const { scene, camera, controls, originalMaterials } = threeRef.current;
    if (!scene || !modelGroup) return;

    if (threeRef.current.currentGroup) {
      scene.remove(threeRef.current.currentGroup);
    }
    if (threeRef.current.bboxHelper) {
      scene.remove(threeRef.current.bboxHelper);
    }
    originalMaterials.clear();

    modelGroup.traverse((child: any) => {
      if (child.isMesh) {
        originalMaterials.set(child.uuid, child.material);
        child.castShadow = shadows;
        child.receiveShadow = shadows;
      }
    });

    const box = new THREE.Box3().setFromObject(modelGroup);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    modelGroup.position.x -= center.x;
    modelGroup.position.y -= box.min.y;
    modelGroup.position.z -= center.z;

    const bboxHelper = new THREE.BoxHelper(modelGroup, 0x10b981);
    bboxHelper.visible = boundingBox;
    scene.add(bboxHelper);

    threeRef.current.currentGroup = modelGroup;
    threeRef.current.bboxHelper = bboxHelper;
    scene.add(modelGroup);

    // Compute Stats
    let verticesCount = 0;
    let polygonsCount = 0;
    let meshCount = 0;

    modelGroup.traverse((child: any) => {
      if (child.isMesh && child.geometry) {
        meshCount++;
        const geo = child.geometry;
        if (geo.attributes.position) {
          verticesCount += geo.attributes.position.count;
        }
        if (geo.index) {
          polygonsCount += geo.index.count / 3;
        } else if (geo.attributes.position) {
          polygonsCount += geo.attributes.position.count / 3;
        }
      }
    });

    setMeshStats({
      vertices: verticesCount,
      polygons: Math.floor(polygonsCount),
      meshes: meshCount,
      dimensions: `${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)} m`
    });

    setLoadedFileName(name);
    setActiveTab('3d');

    // Adjust Camera
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 2.2;
    cameraZ = Math.max(cameraZ, 8);

    camera.position.set(cameraZ * 0.8, size.y * 1.2 + 2, cameraZ);
    controls.target.set(0, size.y / 2, 0);
    controls.update();
  };

  const clearLiveScriptState = () => {
    threeRef.current.tickFn = null;
    setScriptError(null);
    if (threeRef.current.customLights && threeRef.current.scene) {
      threeRef.current.scene.remove(threeRef.current.customLights);
      threeRef.current.customLights = null;
    }
  };

  const loadPresetModel = (preset: string) => {
    if (!window.THREE) return;
    let model;
    let name = "Angkor Wat";
    if (preset === 'angkor') {
      model = createAngkorWatModel();
      name = "Angkor Wat Temple";
    } else if (preset === 'stupa') {
      model = createKhmerStupaModel();
      name = "Khmer Ancient Stupa";
    } else if (preset === 'drone') {
      model = createDroneModel();
      name = "Sci-Fi Drone";
    }
    if (model) {
      clearLiveScriptState();
      processAndCenterModel(model, name);
    }
  };

  useEffect(() => {
    if (!libsReady || !canvasContainerRef.current) return;
    const container = canvasContainerRef.current;
    const THREE = window.THREE;
    if (!THREE) return;

    // Clear previous renderer if re-initializing
    container.innerHTML = '';

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(bgColor);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(12, 10, 16);

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = shadows;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 200;
    controls.minDistance = 0.5;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, lightIntensity);
    dirLight.position.set(15, 25, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.4);
    fillLight.position.set(-15, 10, -15);
    scene.add(fillLight);

    const gridHelper = new THREE.GridHelper(30, 30, 0x10b981, 0x334155);
    gridHelper.position.y = -0.01;
    gridHelper.visible = gridFloor;
    scene.add(gridHelper);

    threeRef.current = {
      scene,
      camera,
      renderer,
      controls,
      currentGroup: null,
      bboxHelper: null,
      gridHelper,
      dirLight,
      originalMaterials: new Map(),
      clock: new THREE.Clock(),
      tickFn: null,
      customLights: null
    };

    // Load initial Angkor Wat procedural preset
    // The setState calls inside loadPresetModel run once at mount/initialization.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPresetModel('angkor');

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const { clock, tickFn } = threeRef.current;
      if (clock && tickFn) {
        const dt = clock.getDelta();
        const elapsed = clock.getElapsedTime();
        try {
          tickFn(dt, elapsed);
        } catch {
          // A faulty live script shouldn't crash the render loop
          threeRef.current.tickFn = null;
        }
      } else if (clock) {
        clock.getDelta();
      }
      if (controls) controls.update();
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
    };
    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      renderer.dispose();
    };
    // The scene effect intentionally initializes once per libsReady flip; it reads
    // the display settings at mount time and the toggles below apply live updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libsReady]);

  /**
   * Compiles an uploaded/edited .ts or .tsx source string in-browser (via
   * Babel standalone: typescript -> commonjs) and executes it with `THREE`
   * injected, then renders whatever `create*Model()` factory it exports.
   * This is what makes files like smartphone.ts genuinely previewable
   * instead of just shown as text.
   */
  const runTsScriptToModel = async (code: string, name: string) => {
    const THREE = window.THREE;
    if (!THREE) {
      showToast(text('THREE.js is not ready yet, please wait...', 'THREE.js មិនទាន់ត្រៀមរួចទេ, សូមរង់ចាំ...'), 'error');
      return;
    }

    setIsCompiling(true);
    setScriptError(null);
    showToast(t.running_ts_code, 'info');

    try {
      const ready = babelReady || (window as any).Babel ? true : await ensureBabelLoaded();
      const Babel = (window as any).Babel;
      if (!ready || !Babel) {
        throw new Error('Failed to load the TypeScript compiler (Babel standalone).');
      }

      const transformed = Babel.transform(code, {
        presets: [
          'typescript',
          ['env', { modules: 'commonjs', targets: { esmodules: true } }]
        ],
        filename: 'live-script.tsx'
      }).code;

      // Minimal CommonJS sandbox: `import * as THREE from 'three'` resolves
      // to the already-loaded global THREE build; nothing else is resolvable.
      const sandboxModule: { exports: any } = { exports: {} };
      const sandboxRequire = (id: string) => {
        if (id === 'three') return THREE;
        throw new Error(`Cannot resolve module "${id}" in the browser preview sandbox.`);
      };

      const factory = new Function('exports', 'require', 'module', 'THREE', transformed);
      factory(sandboxModule.exports, sandboxRequire, sandboxModule, THREE);

      const mod = sandboxModule.exports;
      const keys = Object.keys(mod);
      const modelFactoryKey = keys.find((k) => /^create.*Model$/.test(k) && typeof mod[k] === 'function');

      if (!modelFactoryKey) {
        throw new Error(t.no_factory_found);
      }

      const group = mod[modelFactoryKey]({ shadows });
      if (!group || !group.isObject3D) {
        throw new Error(`"${modelFactoryKey}()" did not return a THREE.Object3D / Group.`);
      }

      // Optional companion exports, following the same convention used
      // across these generated model scripts (see smartphone.ts).
      const lightsKey = keys.find((k) => /LookDevLights$/.test(k) && typeof mod[k] === 'function');
      const bgKey = keys.find((k) => /^make.*Background$/.test(k) && typeof mod[k] === 'function');

      clearLiveScriptState();
      processAndCenterModel(group, name);

      if (lightsKey && threeRef.current.scene) {
        const customLights = mod[lightsKey]();
        threeRef.current.scene.add(customLights);
        threeRef.current.customLights = customLights;
      }

      if (bgKey) {
        const bg = mod[bgKey]();
        if (threeRef.current.scene) threeRef.current.scene.background = bg;
        if (bg && bg.getHexString) setBgColor('#' + bg.getHexString());
      }

      if (typeof group.userData?.tick === 'function') {
        threeRef.current.tickFn = group.userData.tick;
      }

      showToast(text(`Rendered "${modelFactoryKey}" from ${name}!`, `បានបង្ហាញ "${modelFactoryKey}" ពី ${name}!`), 'success');
      setActiveTab('3d');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setScriptError(message);
      showToast(`${t.compile_error}: ${message}`, 'error');
    } finally {
      setIsCompiling(false);
    }
  };

  const loadTsPreset = (code: string, name: string) => {
    setCodeContent(code);
    setLoadedFileName(name);
    setActiveTab('code');
    runTsScriptToModel(code, name);
  };

  useEffect(() => {
    const { currentGroup, originalMaterials } = threeRef.current;
    if (!currentGroup || !window.THREE) return;
    const THREE = window.THREE;

    currentGroup.traverse((child: any) => {
      if (child.isMesh) {
        if (materialOverride === 'original') {
          if (originalMaterials.has(child.uuid)) {
            child.material = originalMaterials.get(child.uuid);
          }
        } else if (materialOverride === 'clay') {
          child.material = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.9, metalness: 0.0 });
        } else if (materialOverride === 'bronze') {
          child.material = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.4, metalness: 0.8 });
        } else if (materialOverride === 'gold') {
          child.material = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.2, metalness: 0.95 });
        } else if (materialOverride === 'normal') {
          child.material = new THREE.MeshNormalMaterial();
        }
      }
    });
  }, [materialOverride]);

  useEffect(() => {
    const { currentGroup } = threeRef.current;
    if (!currentGroup) return;
    currentGroup.traverse((child: any) => {
      if (child.isMesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m: any) => (m.wireframe = wireframe));
        } else {
          child.material.wireframe = wireframe;
        }
      }
    });
  }, [wireframe]);

  useEffect(() => {
    if (threeRef.current.gridHelper) threeRef.current.gridHelper.visible = gridFloor;
  }, [gridFloor]);

  useEffect(() => {
    if (threeRef.current.controls) threeRef.current.controls.autoRotate = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    if (threeRef.current.bboxHelper) threeRef.current.bboxHelper.visible = boundingBox;
  }, [boundingBox]);

  useEffect(() => {
    if (threeRef.current.dirLight) threeRef.current.dirLight.intensity = lightIntensity;
  }, [lightIntensity]);

  useEffect(() => {
    if (threeRef.current.scene && window.THREE) {
      threeRef.current.scene.background = new window.THREE.Color(bgColor);
    }
  }, [bgColor]);

  useEffect(() => {
    // Apply the theme's ground color as the default 3D backdrop once on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBgColor((prev) => (prev === '#0b0f19' && themeGround ? themeGround : prev));
  }, [themeGround]);

  const handleFileUpload = (file: File) => {
    const filename = file.name;
    const ext = filename.split('.').pop()?.toLowerCase();
    const reader = new FileReader();

    showToast(text(`Reading ${filename}...`, `កំពុងទាញយក ${filename}...`), 'info');

    if (ext === 'ts' || ext === 'tsx' || ext === 'js' || ext === 'jsx' || ext === 'json' || ext === 'txt') {
      reader.readAsText(file);
      reader.onload = (e) => {
        const textContent = e.target?.result as string;
        setCodeContent(textContent);
        setLoadedFileName(filename);
        setActiveTab('code');
        setScriptError(null);
        const isTs = ext === 'ts' || ext === 'tsx';
        showToast(
          isTs
            ? text(`Opened ${filename}! Click "${t.run_ts_code}" to preview as 3D.`, `បានបើក ${filename}! ចុច "${t.run_ts_code}" ដើម្បីមើលជា 3D`)
            : text(`Opened ${filename} successfully!`, `បានបើកឯកសារ ${filename} ដោយជោគជ័យ!`),
          'success'
        );
      };
    } else if (ext === 'glb' || ext === 'gltf') {
      reader.readAsArrayBuffer(file);
      reader.onload = (e) => {
        const THREE = window.THREE;
        if (!THREE || !THREE.GLTFLoader) return;
        const loader = new THREE.GLTFLoader();
        loader.parse(e.target?.result, '', (gltf: any) => {
          processAndCenterModel(gltf.scene, filename);
          showToast(text(`Opened 3D GLTF ${filename}!`, `បានបើក 3D GLTF ${filename}!`), 'success');
        });
      };
    } else if (ext === 'stl') {
      reader.readAsArrayBuffer(file);
      reader.onload = (e) => {
        const THREE = window.THREE;
        if (!THREE || !THREE.STLLoader) return;
        const loader = new THREE.STLLoader();
        const geometry = loader.parse(e.target?.result);
        const material = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.5, metalness: 0.5 });
        const mesh = new THREE.Mesh(geometry, material);
        const group = new THREE.Group();
        group.add(mesh);
        processAndCenterModel(group, filename);
        showToast(text(`Opened 3D STL ${filename}!`, `បានបើក 3D STL ${filename}!`), 'success');
      };
    } else if (ext === 'obj') {
      reader.readAsText(file);
      reader.onload = (e) => {
        const THREE = window.THREE;
        if (!THREE || !THREE.OBJLoader) return;
        const loader = new THREE.OBJLoader();
        const obj = loader.parse(e.target?.result);
        processAndCenterModel(obj, filename);
        showToast(text(`Opened 3D OBJ ${filename}!`, `បានបើក 3D OBJ ${filename}!`), 'success');
      };
    } else {
      showToast(text('Unsupported file type! Use .ts, .tsx, .glb, .gltf, .obj or .stl', 'ប្រភេទឯកសារមិនគាំទ្រ! សូមប្រើ .ts, .tsx, .glb, .gltf, .obj ឬ .stl'), 'error');
    }
  };

  const showToast = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const takeSnapshot = () => {
    const { renderer, scene, camera } = threeRef.current;
    if (!renderer || !scene || !camera) return;
    renderer.render(scene, camera);
    const dataURL = renderer.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `tools123_Snapshot_${Date.now()}.png`;
    link.href = dataURL;
    link.click();
    showToast(text('Snapshot downloaded!', 'បានទាញយករូបភាព Snapshot ដោយជោគជ័យ!'), 'success');
  };

  const resetCamera = () => {
    const { currentGroup, camera, controls } = threeRef.current;
    if (!currentGroup || !window.THREE) return;
    const THREE = window.THREE;
    const box = new THREE.Box3().setFromObject(currentGroup);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    camera.position.set(maxDim * 1.5, size.y * 1.2 + 2, maxDim * 1.5);
    controls.target.set(0, size.y / 2, 0);
    controls.update();
  };

  const copyCode = () => {
    navigator.clipboard.writeText(codeContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    showToast(text('Code copied to clipboard!', 'បានចម្លងកូដទៅ Clipboard!'), 'success');
  };

  const presetBtn =
    "flex items-center gap-2 rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-2 text-left text-sm transition hover:border-[var(--gold-dim)] hover:bg-[var(--ground-raised-hi)]";
  const tabCls = (tab: '3d' | 'code') =>
    `inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
      activeTab === tab ? 'bg-[var(--ground-raised-hi)] text-[var(--ink)] shadow-sm' : 'text-[var(--ink-dim)] hover:text-[var(--ink)]'
    }`;
  const toggleLabel = 'flex cursor-pointer items-center justify-between gap-2 text-xs text-[var(--ink-dim)]';
  const checkboxCls = 'h-4 w-4 cursor-pointer rounded accent-[var(--gold)]';
  const bgPresets = Array.from(new Set([themeGround, '#1e293b', '#ffffff', '#000000']));

  return (
    <ToolShell
      title="3D Model Previewer"
      description="Live Three.js viewport for procedural TypeScript model factories and 3D files. Pick a preset, drop in a .ts/.tsx/.glb/.gltf/.obj/.stl file, or render the loaded script as 3D."
    >
      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-medium text-[#0a0c0d] transition hover:bg-[var(--gold-dim)]">
          <Upload size={16} />
          <span>{t.open_file}</span>
          <input
            type="file"
            accept=".glb,.gltf,.obj,.stl,.ts,.tsx,.js,.jsx,.json"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) handleFileUpload(e.target.files[0]);
            }}
          />
        </label>
        <Button onClick={takeSnapshot} disabled={!libsReady}>
          <span className="inline-flex items-center gap-1.5">
            <Camera size={14} />
            {t.take_snapshot}
          </span>
        </Button>
        <Button onClick={resetCamera} disabled={!libsReady}>
          <span className="inline-flex items-center gap-1.5">
            <RotateCcw size={14} />
            {t.btn_reset}
          </span>
        </Button>
        <span className="ml-auto truncate text-xs text-[var(--ink-faint)]">{loadedFileName}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Controls */}
        <div className="space-y-5">
          <Field label={t.sample_models}>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => loadPresetModel('angkor')} className={presetBtn}>
                <Sparkles size={16} className="shrink-0 text-[var(--gold)]" />
                <div className="truncate">
                  <div className="truncate font-medium">{t.angkor_wat}</div>
                  <div className="text-[10px] text-[var(--ink-faint)]">Procedural 3D</div>
                </div>
              </button>
              <button onClick={() => loadPresetModel('stupa')} className={presetBtn}>
                <Layers size={16} className="shrink-0 text-[var(--teal)]" />
                <div className="truncate">
                  <div className="truncate font-medium">{t.khmer_stupa}</div>
                  <div className="text-[10px] text-[var(--ink-faint)]">Architecture</div>
                </div>
              </button>
              <button onClick={() => loadPresetModel('drone')} className={presetBtn}>
                <Box size={16} className="shrink-0 text-[var(--slate-accent)]" />
                <div className="truncate">
                  <div className="truncate font-medium">{t.sci_drone}</div>
                  <div className="text-[10px] text-[var(--ink-faint)]">Hard Surface</div>
                </div>
              </button>
              <button
                onClick={() => {
                  setCodeContent(SAMPLE_TS_CODE);
                  setLoadedFileName("AngkorWatGenerator.ts");
                  setActiveTab('code');
                }}
                className={presetBtn}
              >
                <FileCode size={16} className="shrink-0 text-[var(--slate-accent-dim)]" />
                <div className="truncate">
                  <div className="truncate font-medium">{t.ts_sample}</div>
                  <div className="text-[10px] text-[var(--ink-faint)]">TypeScript</div>
                </div>
              </button>
              <button onClick={() => loadTsPreset(SMARTPHONE_TS_CODE, 'smartphone.ts')} className={`${presetBtn} col-span-2`}>
                <Smartphone size={16} className="shrink-0 text-[var(--gold)]" />
                <div className="min-w-0 flex-1 truncate">
                  <div className="truncate font-medium">{t.smartphone_model}</div>
                  <div className="text-[10px] text-[var(--ink-faint)]">smartphone.ts</div>
                </div>
                <span className="shrink-0 rounded border border-[var(--gold)]/30 bg-[var(--gold)]/10 px-1.5 py-0.5 text-[9px] text-[var(--gold)]">
                  {t.ts_live_render}
                </span>
              </button>
            </div>
          </Field>

          <Field label={t.display_settings}>
            <div className="space-y-2 rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
              <label className={toggleLabel}>
                <span>{t.wireframe}</span>
                <input type="checkbox" checked={wireframe} onChange={(e) => setWireframe(e.target.checked)} className={checkboxCls} />
              </label>
              <label className={toggleLabel}>
                <span>{t.grid_floor}</span>
                <input type="checkbox" checked={gridFloor} onChange={(e) => setGridFloor(e.target.checked)} className={checkboxCls} />
              </label>
              <label className={toggleLabel}>
                <span>{t.auto_rotate}</span>
                <input type="checkbox" checked={autoRotate} onChange={(e) => setAutoRotate(e.target.checked)} className={checkboxCls} />
              </label>
              <label className={toggleLabel}>
                <span>{t.bounding_box}</span>
                <input type="checkbox" checked={boundingBox} onChange={(e) => setBoundingBox(e.target.checked)} className={checkboxCls} />
              </label>
              <label className={toggleLabel}>
                <span>{t.shadows}</span>
                <input type="checkbox" checked={shadows} onChange={(e) => setShadows(e.target.checked)} className={checkboxCls} />
              </label>
            </div>
          </Field>

          <Field label={t.material_override}>
            <Select value={materialOverride} onChange={(e) => setMaterialOverride(e.target.value)}>
              <option value="original">{t.mat_original}</option>
              <option value="clay">{t.mat_clay}</option>
              <option value="bronze">{t.mat_bronze}</option>
              <option value="gold">{t.mat_gold}</option>
              <option value="normal">{t.mat_normal}</option>
            </Select>
          </Field>

          <Field label={t.lighting}>
            <div className="space-y-3 rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
              <div>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-[var(--ink-dim)]">{t.light_intensity}</span>
                  <span className="font-mono text-[var(--gold)]">{lightIntensity.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.1"
                  value={lightIntensity}
                  onChange={(e) => setLightIntensity(parseFloat(e.target.value))}
                  className="w-full cursor-pointer accent-[var(--gold)]"
                />
              </div>
              <div>
                <span className="mb-1.5 block text-xs text-[var(--ink-dim)]">{t.env_background}</span>
                <div className="grid grid-cols-4 gap-2">
                  {bgPresets.map((c) => (
                    <button
                      key={c}
                      onClick={() => setBgColor(c)}
                      aria-label={c}
                      className={`h-7 rounded-md border transition ${
                        bgColor === c ? 'ring-2 ring-[var(--gold)]' : 'border-[var(--ground-line)] hover:ring-2 hover:ring-[var(--gold-dim)]'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Field>
        </div>

        {/* Viewport */}
        <div className="relative flex h-[480px] flex-col overflow-hidden rounded-xl border border-[var(--ground-line)] bg-[var(--ground)] md:h-[560px]">
          {/* Tabs */}
          <div className="flex shrink-0 items-center gap-1 border-b border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2">
            <div className="flex items-center gap-1 rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] p-1">
              <button onClick={() => setActiveTab('3d')} className={tabCls('3d')}>
                <Box size={14} />
                <span>{t.mode_3d}</span>
              </button>
              <button onClick={() => setActiveTab('code')} className={tabCls('code')}>
                <FileCode size={14} />
                <span>{t.mode_code}</span>
              </button>
            </div>
            <span className="ml-auto hidden items-center gap-1 rounded-md border border-[var(--ground-line)] px-2 py-0.5 text-[10px] text-[var(--ink-dim)] sm:inline-flex">
              <Sliders size={12} />
              GLTF / OBJ / TS
            </span>
          </div>

          {/* 3D viewport */}
          <div className={`relative flex-1 ${activeTab === '3d' ? 'block' : 'hidden'}`}>
            <div ref={canvasContainerRef} className="absolute inset-0" />
            <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full border border-[var(--ground-line)] bg-[var(--ground-raised)]/95 px-4 py-1.5 text-xs shadow-lg backdrop-blur">
              <button onClick={resetCamera} className="inline-flex items-center gap-1.5 text-[var(--ink-dim)] transition hover:text-[var(--gold)]">
                <RotateCcw size={14} />
                {t.btn_reset}
              </button>
            </div>
          </div>

          {/* TypeScript / Code view */}
          <div className={`min-h-0 flex-1 flex-col ${activeTab === 'code' ? 'flex' : 'hidden'}`}>
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <FileCode size={16} className="shrink-0 text-[var(--gold)]" />
                  <span className="truncate font-mono-ui text-xs font-semibold">{loadedFileName}</span>
                  <span className="rounded bg-[var(--ground-raised-hi)] px-2 py-0.5 text-[10px] text-[var(--ink-dim)]">TypeScript</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    onClick={() => runTsScriptToModel(codeContent, loadedFileName)}
                    disabled={isCompiling}
                    className="!px-3 !py-1.5 !text-xs"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {isCompiling ? <Loader2 size={14} className="animate-spin" /> : <PlayCircle size={14} />}
                      {isCompiling ? t.running_ts_code : t.run_ts_code}
                    </span>
                  </Button>
                  <Button
                    onClick={copyCode}
                    className="!bg-[var(--ground-raised-hi)] !px-3 !py-1.5 !text-xs !text-[var(--ink)] ring-1 ring-[var(--ground-line)]"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {isCopied ? <Check size={14} className="text-[var(--success)]" /> : <Copy size={14} />}
                      {isCopied ? t.copied : t.copy_code}
                    </span>
                  </Button>
                </div>
              </div>

              {scriptError && (
                <div className="flex items-start gap-2 border-b border-[var(--danger)]/40 bg-[var(--danger)]/10 px-4 py-2.5 text-xs">
                  <AlertCircle size={14} className="mt-0.5 shrink-0 text-[var(--danger)]" />
                  <div className="min-w-0">
                    <div className="font-medium text-[var(--danger)]">{t.compile_error}</div>
                    <div className="mt-0.5 break-all font-mono-ui text-[11px] text-[var(--danger)]/80">{scriptError}</div>
                  </div>
                </div>
              )}

              <div className="min-h-0 flex-1 overflow-auto">
                <div className="flex min-w-max">
                  <div className="select-none py-3 pl-3 pr-3 text-right font-mono-ui text-xs leading-relaxed text-[var(--ink-faint)]">
                    {codeContent.split('\n').map((_, idx) => (
                      <div key={idx}>{idx + 1}</div>
                    ))}
                  </div>
                  <pre className="overflow-x-auto whitespace-pre py-3 pr-4 font-mono-ui text-xs leading-relaxed text-[var(--ink)]">
                    <code>{codeContent}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* Inspector panel toggle */}
          <button
            onClick={() => setShowStatsPanel(!showStatsPanel)}
            className="absolute right-3 top-12 z-10 inline-flex items-center gap-1.5 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)]/95 px-3 py-1.5 text-xs font-medium text-[var(--ink-dim)] shadow-lg backdrop-blur transition hover:text-[var(--ink)]"
          >
            <Info size={14} className="text-[var(--gold)]" />
            {t.model_info}
          </button>

          {showStatsPanel && (
            <div className="absolute right-3 top-[3.25rem] z-10 w-72 max-w-[calc(100%-1.5rem)] space-y-3 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)]/95 p-4 text-xs shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between border-b border-[var(--ground-line)] pb-2">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Box size={16} className="text-[var(--gold)]" />
                  <span>{activeTab === '3d' ? t.stats_3d : t.stats_code}</span>
                </span>
                <button onClick={() => setShowStatsPanel(false)} className="text-[var(--ink-faint)] transition hover:text-[var(--ink)]">
                  <X size={16} />
                </button>
              </div>

              {activeTab === '3d' ? (
                <div className="space-y-2">
                  <div className="flex justify-between gap-2">
                    <span className="text-[var(--ink-dim)]">{t.file_name}</span>
                    <span className="truncate font-medium">{loadedFileName}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[var(--ink-dim)]">{t.vertex_count}</span>
                    <span className="font-mono text-[var(--gold)]">{meshStats.vertices.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[var(--ink-dim)]">{t.poly_count}</span>
                    <span className="font-mono text-[var(--gold)]">{meshStats.polygons.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[var(--ink-dim)]">{t.mesh_count}</span>
                    <span className="font-mono">{meshStats.meshes}</span>
                  </div>
                  <div className="border-t border-[var(--ground-line)] pt-2">
                    <span className="mb-1 block text-[var(--ink-dim)]">{t.bbox_dimensions}</span>
                    <span className="block rounded border border-[var(--ground-line)] bg-[var(--ground)] p-1.5 font-mono-ui text-[11px]">
                      {meshStats.dimensions}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between gap-2">
                    <span className="text-[var(--ink-dim)]">{t.file_name}</span>
                    <span className="truncate font-medium">{loadedFileName}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[var(--ink-dim)]">{t.code_lines}</span>
                    <span className="font-mono text-[var(--gold)]">{codeStats.lines}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[var(--ink-dim)]">{t.code_chars}</span>
                    <span className="font-mono text-[var(--gold)]">{codeStats.chars.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[var(--ink-dim)]">{t.code_exports}</span>
                    <span className="font-mono">{codeStats.exportsCount}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[var(--ink-dim)]">{t.code_interfaces}</span>
                    <span className="font-mono">{codeStats.interfacesCount + codeStats.typesCount}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-3 text-xs font-medium shadow-2xl fade-rise">
          {toast.type === 'error' ? (
            <AlertCircle size={18} className="shrink-0 text-[var(--danger)]" />
          ) : (
            <CheckCircle2 size={18} className="shrink-0 text-[var(--success)]" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}
    </ToolShell>
  );
}
