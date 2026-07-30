import * as THREE from 'three';

/**
 * iPad, rebuilt in code from a single studio reference set. Focus: the thin
 * aluminum unibody slab, the edge-to-edge display behind a thin bezel, a
 * front camera dot, a single back camera lens, a volume rocker + top button,
 * a USB-C slot, and an Apple Pencil that magnetically docks to the side edge
 * with a soft charge-ring pulse.
 *
 * Live animation (looping ~9s): slow turntable → screen wallpaper glow
 * breathes → the Pencil lifts off, hovers, and glides back to snap onto its
 * magnetic edge, glowing while it charges.
 */

export interface IpadOptions {
  shadows?: boolean;
}

const COL = {
  body: 0xd7d5cf, // silver aluminum unibody
  screenBezel: 0x0a0a0c,
  screenGlow: 0x9db4ff,
  pencilBody: 0xf1f0ec,
  pencilTip: 0x2a2a2c,
  pencilBand: 0xd8b25a,
  led: 0x8fe3a0,
};

const BODY_W = 1.86;
const BODY_H = 2.55;
const BODY_R = 0.14;
const BODY_T = 0.09;

/* ---- texture helpers ---- */
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

function drawWallpaper(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#20263f');
  grad.addColorStop(0.6, '#4a3f78');
  grad.addColorStop(1, '#131425');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.textAlign = 'center';
  ctx.font = '300 100px Arial';
  ctx.fillText('9:41', w / 2, h * 0.18);
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
    bevelSegments: 5,
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
export function createIpadModel(options: IpadOptions = {}): THREE.Group {
  const shadows = options.shadows ?? true;
  const root = new THREE.Group();
  root.position.y = 0.06;

  const matBody = new THREE.MeshPhysicalMaterial({
    color: COL.body,
    roughness: 0.3,
    metalness: 0.9,
    clearcoat: 0.3,
    clearcoatRoughness: 0.35,
  });
  const matBezel = new THREE.MeshStandardMaterial({ color: COL.screenBezel, roughness: 0.45, metalness: 0.2 });
  const matCamRim = new THREE.MeshStandardMaterial({ color: 0x9a988f, roughness: 0.25, metalness: 0.9 });
  const matCamGlass = new THREE.MeshPhysicalMaterial({
    color: 0x101114,
    roughness: 0.05,
    metalness: 0.2,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
  });
  const matPencilBody = new THREE.MeshPhysicalMaterial({
    color: COL.pencilBody,
    roughness: 0.28,
    metalness: 0.1,
    clearcoat: 0.5,
    clearcoatRoughness: 0.3,
  });
  const matPencilTip = new THREE.MeshStandardMaterial({ color: COL.pencilTip, roughness: 0.35, metalness: 0.4 });
  const matPencilBand = new THREE.MeshStandardMaterial({ color: COL.pencilBand, roughness: 0.4, metalness: 0.6 });
  const matLed = new THREE.MeshStandardMaterial({ color: COL.led, emissive: COL.led, emissiveIntensity: 0.8 });

  /* ---- body slab ---- */
  const body = slab(BODY_W, BODY_H, BODY_T, BODY_R, matBody, 0.015, shadows);
  root.add(body);

  /* ---- screen bezel + wallpaper ---- */
  const bezel = slab(BODY_W - 0.03, BODY_H - 0.03, 0.01, BODY_R - 0.01, matBezel, 0.003, shadows);
  bezel.position.y = BODY_T - 0.005;
  root.add(bezel);

  const wallSurface = makeCanvasTexture(768, 1024);
  drawWallpaper(wallSurface.ctx, 768, 1024);
  wallSurface.tex.needsUpdate = true;
  const wallpaper = decal(wallSurface.tex, BODY_W - 0.09, BODY_H - 0.09);
  wallpaper.rotation.x = -Math.PI / 2;
  wallpaper.position.y = BODY_T + 0.003;
  root.add(wallpaper);

  const screenGlow = new THREE.PointLight(COL.screenGlow, 0.35, 1.4);
  screenGlow.position.y = BODY_T + 0.15;
  root.add(screenGlow);

  /* ---- front camera dot (top edge, landscape-style) ---- */
  const frontCam = new THREE.Mesh(new THREE.CircleGeometry(0.03, 20), matCamGlass);
  frontCam.rotation.x = -Math.PI / 2;
  frontCam.position.set(0, BODY_T + 0.003, BODY_H / 2 - 0.1);
  root.add(frontCam);

  /* ---- back camera lens ---- */
  const camRim = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.012, 12, 28), matCamRim);
  camRim.rotation.x = Math.PI / 2;
  camRim.position.set(-BODY_W / 2 + 0.22, -0.01, BODY_H / 2 - 0.3);
  root.add(camRim);
  const camGlass = new THREE.Mesh(new THREE.CircleGeometry(0.06, 24), matCamGlass);
  camGlass.rotation.x = -Math.PI / 2;
  camGlass.position.set(-BODY_W / 2 + 0.22, -0.009, BODY_H / 2 - 0.3);
  root.add(camGlass);

  /* ---- volume rocker + top button ---- */
  const volUp = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.16, 0.05), matBody);
  volUp.position.set(BODY_W / 2 + 0.008, BODY_H / 2 - 0.4, 0);
  root.add(volUp);
  const volDown = volUp.clone();
  volDown.position.y -= 0.22;
  root.add(volDown);
  const topButton = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.005, 0.4), matBody);
  topButton.position.set(BODY_W / 2 + 0.008, 0, -BODY_H / 2 + 0.35);
  topButton.rotation.z = Math.PI / 2;
  root.add(topButton);

  /* ---- USB-C port slot ---- */
  const port = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.02), new THREE.MeshBasicMaterial({ color: 0x050505 }));
  port.position.set(0, 0, -BODY_H / 2 - 0.005);
  root.add(port);

  /* ---- Apple Pencil (docked on the right edge, magnetically) ---- */
  const pencilGroup = new THREE.Group();
  const pencilBody = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.4, 24), matPencilBody);
  pencilGroup.add(pencilBody);
  const flatGeo = new THREE.BoxGeometry(0.012, 1.0, 0.06);
  const flat = new THREE.Mesh(flatGeo, matPencilBody);
  flat.position.x = 0.044;
  pencilGroup.add(flat);
  const tipCone = new THREE.Mesh(new THREE.CylinderGeometry(0.001, 0.045, 0.14, 24), matPencilTip);
  tipCone.position.y = -0.77;
  pencilGroup.add(tipCone);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.047, 0.047, 0.02, 24), matPencilBand);
  band.position.y = -0.6;
  pencilGroup.add(band);
  const led = new THREE.Mesh(new THREE.TorusGeometry(0.046, 0.006, 8, 24), matLed);
  led.rotation.x = Math.PI / 2;
  led.position.y = -0.55;
  pencilGroup.add(led);

  pencilGroup.rotation.z = Math.PI / 2;
  root.add(pencilGroup);

  const dockedX = BODY_W / 2 + 0.05;
  const dockedZ = 0;

  /* ---- animation ---- */
  const CYCLE = 9.0;
  const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const smooth = (x: number, a: number, b: number): number =>
    easeInOut(THREE.MathUtils.clamp((x - a) / (b - a), 0, 1));

  function updateAnimation(time: number): void {
    root.rotation.y = Math.sin(time * 0.16) * 0.3;
    root.rotation.x = 0.05 + Math.sin(time * 0.11) * 0.03;

    const pulse = 0.5 + 0.5 * Math.sin(time * 0.6);
    screenGlow.intensity = 0.28 + pulse * 0.25;

    const t = time % CYCLE;
    const lift = Math.max(smooth(t, 1.0, 2.2) - smooth(t, 5.0, 6.2), 0);
    pencilGroup.position.set(dockedX + lift * 0.35, Math.sin(time * 1.4) * 0.02 * lift, dockedZ);
    pencilGroup.rotation.y = lift * 0.5;

    const chargeGlow = 1 - lift;
    (led.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.4 + chargeGlow * 0.7 * (0.6 + 0.4 * Math.sin(time * 3));
  }
  updateAnimation(0);
  root.userData.tick = (_dt: number, elapsed: number): void => updateAnimation(elapsed);

  return root;
}

export function createIpadLookDevLights(): THREE.Group {
  const lights = new THREE.Group();
  const key = new THREE.DirectionalLight(0xffffff, 2.5);
  key.position.set(4, 7, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 30;
  const kc = key.shadow.camera as THREE.OrthographicCamera;
  kc.left = -4;
  kc.right = 4;
  kc.top = 4;
  kc.bottom = -4;
  key.shadow.bias = -0.0004;
  lights.add(key);
  const fill = new THREE.DirectionalLight(0xdfe6ff, 0.6);
  fill.position.set(-5, 3, 2);
  lights.add(fill);
  const rim = new THREE.DirectionalLight(0xffe8cf, 0.55);
  rim.position.set(-3, 4, -6);
  lights.add(rim);
  lights.add(new THREE.HemisphereLight(0xffffff, 0x9a9a9d, 0.4));
  return lights;
}

export function makeIpadBackground(): THREE.Color {
  return new THREE.Color(0xeceded);
}
