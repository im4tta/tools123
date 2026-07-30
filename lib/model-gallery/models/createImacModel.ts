import * as THREE from 'three';

/**
 * iMac (24" all-in-one), rebuilt in code from a single studio reference set.
 * Focus: the thin white forehead/chin bezel wrapped in edge-to-edge glass,
 * a saturated colour-matched aluminum back shell, the slim chrome foot arm
 * + round base, and a wallpaper desktop with a dock row.
 *
 * Live animation (looping ~10s): slow turntable → desktop wallpaper hue
 * drifts through its gradient → a soft specular sweep crosses the glass →
 * dock icons give a gentle idle bounce, one at a time.
 */

export interface ImacOptions {
  shadows?: boolean;
  shellColor?: number;
}

const COL = {
  bezel: 0xf3f2ee,
  shellDefault: 0x6fa8dc,
  standChrome: 0xd7d7d5,
  base: 0xc8c8c6,
  screenDark: 0x101014,
  dockGlass: 0xffffff,
};

const SCREEN_W = 3.4;
const SCREEN_H = 2.02;
const BEZEL = 0.09;
const CHIN_H = 0.34;
const SHELL_T = 0.22;

/* ---- texture helpers ---- */
function textTexture(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  w = 1024,
  h = 640,
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

function decal(tex: THREE.Texture, w: number, h: number, opacity = 1): THREE.Mesh {
  const m = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    opacity,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
}

function makeCanvasTexture(w: number, h: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; tex: THREE.CanvasTexture } {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return { canvas, ctx, tex };
}

function drawWallpaper(ctx: CanvasRenderingContext2D, w: number, h: number, hueShift: number): void {
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, `hsl(${210 + hueShift}, 70%, 62%)`);
  grad.addColorStop(0.5, `hsl(${260 + hueShift}, 65%, 55%)`);
  grad.addColorStop(1, `hsl(${300 + hueShift}, 60%, 45%)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(0, 0, w, 26);
}

function drawDock(ctx: CanvasRenderingContext2D, w: number, h: number, bounceIndex: number, bounceAmt: number): void {
  ctx.clearRect(0, 0, w, h);
  const n = 8;
  const pad = w * 0.08;
  const cell = (w - pad * 2) / n;
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  const dockH = h * 0.7;
  ctx.beginPath();
  const rx = pad * 0.6;
  ctx.moveTo(pad + rx, h * 0.15);
  ctx.arcTo(w - pad, h * 0.15, w - pad, h * 0.15 + dockH, rx);
  ctx.arcTo(w - pad, h * 0.15 + dockH, pad, h * 0.15 + dockH, rx);
  ctx.arcTo(pad, h * 0.15 + dockH, pad, h * 0.15, rx);
  ctx.arcTo(pad, h * 0.15, w - pad, h * 0.15, rx);
  ctx.fill();
  const hues = [210, 30, 140, 350, 50, 190, 280, 10];
  for (let i = 0; i < n; i++) {
    const bump = i === bounceIndex ? bounceAmt : 0;
    const cx = pad + cell * (i + 0.5);
    const cy = h * 0.15 + dockH / 2 - bump * dockH * 0.35;
    ctx.fillStyle = `hsl(${hues[i]}, 60%, 55%)`;
    ctx.beginPath();
    ctx.roundRect(cx - cell * 0.34, cy - cell * 0.34, cell * 0.68, cell * 0.68, cell * 0.16);
    ctx.fill();
  }
}

/* ---- geometry helpers ---- */
function roundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  const hw = w / 2;
  const hh = h / 2;
  s.moveTo(-hw + r, -hh);
  s.lineTo(hw - r, -hh);
  s.absarc(hw - r, -hh + r, r, -Math.PI / 2, 0);
  s.lineTo(hw, hh - r);
  s.absarc(hw - r, hh - r, r, 0, Math.PI / 2);
  s.lineTo(-hw + r, hh);
  s.absarc(-hw + r, hh - r, r, Math.PI / 2, Math.PI);
  s.lineTo(-hw, -hh + r);
  s.absarc(-hw + r, -hh + r, r, Math.PI, Math.PI * 1.5);
  return s;
}

function slab(
  w: number,
  h: number,
  depth: number,
  r: number,
  mat: THREE.Material,
  bevel: number,
  shadows: boolean,
): THREE.Mesh {
  const geo = new THREE.ExtrudeGeometry(roundedRectShape(w, h, r), {
    depth: depth - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 4,
    curveSegments: 32,
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, bevel, 0);
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = shadows;
  m.receiveShadow = shadows;
  return m;
}

/* ============================================================ */
export function createImacModel(options: ImacOptions = {}): THREE.Group {
  const shadows = options.shadows ?? true;
  const shellColor = options.shellColor ?? COL.shellDefault;
  const root = new THREE.Group();

  const matShell = new THREE.MeshPhysicalMaterial({
    color: shellColor,
    roughness: 0.32,
    metalness: 0.6,
    clearcoat: 0.3,
    clearcoatRoughness: 0.35,
  });
  const matBezel = new THREE.MeshPhysicalMaterial({
    color: COL.bezel,
    roughness: 0.35,
    metalness: 0.15,
    clearcoat: 0.5,
    clearcoatRoughness: 0.3,
  });
  const matScreenGlass = new THREE.MeshPhysicalMaterial({
    color: COL.screenDark,
    roughness: 0.08,
    metalness: 0.1,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
  });
  const matChrome = new THREE.MeshStandardMaterial({ color: COL.standChrome, roughness: 0.2, metalness: 1 });
  const matBase = new THREE.MeshStandardMaterial({ color: COL.base, roughness: 0.3, metalness: 0.8 });

  const displayGroup = new THREE.Group();
  root.add(displayGroup);

  /* ---- front bezel + glass ---- */
  const bezelMesh = slab(SCREEN_W, SCREEN_H + CHIN_H, 0.05, 0.14, matBezel, 0.01, shadows);
  bezelMesh.position.y = -CHIN_H / 2;
  displayGroup.add(bezelMesh);

  const glass = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN_W - BEZEL * 2, SCREEN_H - BEZEL * 2), matScreenGlass);
  glass.position.set(0, CHIN_H / 2 - 0.01, 0.026);
  displayGroup.add(glass);

  /* ---- back shell (thin, flat aluminum panel with rounded edges) ---- */
  const backGeo = new THREE.BoxGeometry(SCREEN_W + 0.3, SCREEN_H + CHIN_H + 0.15, SHELL_T, 4, 4, 2);
  const backPos = backGeo.attributes.position;
  for (let i = 0; i < backPos.count; i++) {
    const x = backPos.getX(i);
    const y = backPos.getY(i);
    const z = backPos.getZ(i);
    const cx = Math.abs(x) / ((SCREEN_W + 0.3) / 2);
    const cy = Math.abs(y) / ((SCREEN_H + CHIN_H + 0.15) / 2);
    const dist = Math.sqrt(cx * cx + cy * cy);
    if (dist > 0.5) {
      const factor = Math.min(1, (dist - 0.5) * 2);
      const round = factor * 0.02;
      backPos.setZ(i, z + round * Math.sign(z || 0.001));
    }
  }
  backGeo.computeVertexNormals();
  const back = new THREE.Mesh(backGeo, matShell);
  back.rotation.x = Math.PI / 2;
  back.position.set(0, -CHIN_H / 2 - 0.01, -SHELL_T / 2 - 0.01);
  back.castShadow = shadows;
  back.receiveShadow = shadows;
  displayGroup.add(back);

  /* ---- desktop wallpaper + dock, on the glass (redrawn in place each frame) ---- */
  const wallSurface = makeCanvasTexture(1024, 640);
  drawWallpaper(wallSurface.ctx, 1024, 640, 0);
  wallSurface.tex.needsUpdate = true;
  const wallpaper = decal(wallSurface.tex, SCREEN_W - BEZEL * 2.6, SCREEN_H - BEZEL * 2.6);
  wallpaper.position.set(0, CHIN_H / 2, 0.028);
  displayGroup.add(wallpaper);

  const dockSurface = makeCanvasTexture(1024, 160);
  drawDock(dockSurface.ctx, 1024, 160, -1, 0);
  dockSurface.tex.needsUpdate = true;
  const dock = decal(dockSurface.tex, 1.6, 0.24, 0.95);
  dock.position.set(0, CHIN_H / 2 - SCREEN_H / 2 + 0.32, 0.029);
  displayGroup.add(dock);

  /* ---- specular sweep on the glass ---- */
  const sweepTex = textTexture((ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.25)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }, 256, 512);
  const sweep = decal(sweepTex, 0.9, SCREEN_H - BEZEL * 2, 0.5);
  sweep.position.set(0, CHIN_H / 2, 0.03);
  displayGroup.add(sweep);

  /* ---- foot arm + round base ---- */
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 0.5, 24), matChrome);
  arm.rotation.z = 0.06;
  arm.position.set(0, -SCREEN_H / 2 - CHIN_H / 2 - 0.18, -0.15);
  arm.castShadow = shadows;
  root.add(arm);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.65, 0.05, 48), matBase);
  base.position.set(0, -SCREEN_H / 2 - CHIN_H / 2 - 0.42, -0.05);
  base.castShadow = shadows;
  base.receiveShadow = shadows;
  root.add(base);

  displayGroup.position.y = -SCREEN_H / 2 - CHIN_H / 2 - 0.4 + 1.0;
  root.position.y = 0.4;
  root.rotation.x = -0.02;

  /* ---- animation ---- */
  function updateAnimation(time: number): void {
    root.rotation.y = Math.sin(time * 0.12) * 0.2;

    const hue = (Math.sin(time * 0.1) * 0.5 + 0.5) * 60;
    drawWallpaper(wallSurface.ctx, 1024, 640, hue);
    wallSurface.tex.needsUpdate = true;

    const bounceIdx = Math.floor(time * 0.7) % 8;
    const bouncePhase = (time * 0.7) % 1;
    const bounceAmt = Math.sin(bouncePhase * Math.PI);
    drawDock(dockSurface.ctx, 1024, 160, bounceIdx, bounceAmt);
    dockSurface.tex.needsUpdate = true;

    const t = (time % 6) / 6;
    sweep.position.x = -SCREEN_W / 2 + t * SCREEN_W * 2 - SCREEN_W / 2;
  }
  updateAnimation(0);
  root.userData.tick = (_dt: number, elapsed: number): void => updateAnimation(elapsed);

  return root;
}

export function createImacLookDevLights(): THREE.Group {
  const lights = new THREE.Group();
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(4, 7, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 30;
  const kc = key.shadow.camera as THREE.OrthographicCamera;
  kc.left = -5;
  kc.right = 5;
  kc.top = 5;
  kc.bottom = -5;
  key.shadow.bias = -0.0004;
  lights.add(key);
  const fill = new THREE.DirectionalLight(0xdfe6ff, 0.6);
  fill.position.set(-5, 3, 3);
  lights.add(fill);
  const rim = new THREE.DirectionalLight(0xffe8cf, 0.5);
  rim.position.set(-3, 4, -6);
  lights.add(rim);
  lights.add(new THREE.HemisphereLight(0xffffff, 0x9a9a9d, 0.45));
  return lights;
}

export function makeImacBackground(): THREE.Color {
  return new THREE.Color(0xf1f1ee);
}
