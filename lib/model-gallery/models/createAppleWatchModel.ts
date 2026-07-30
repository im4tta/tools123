import * as THREE from 'three';

/**
 * Apple Watch, rebuilt in code from a single studio reference set. Focus: the
 * rounded-square titanium case, sapphire-glass display with a live watch
 * face, a knurled Digital Crown + side button, and a sport band curving away
 * from the top and bottom lugs.
 *
 * Live animation (looping, continuous): the watch-face second hand sweeps in
 * real animation time → screen brightens on a "raise to wake" cycle →
 * Digital Crown gives a small idle turn → the band sways gently.
 */

export interface AppleWatchOptions {
  shadows?: boolean;
}

const COL = {
  case: 0x8a8d8f, // titanium
  caseDark: 0x5c5e60,
  screenBezel: 0x0a0a0c,
  band: 0x1c1c1e, // sport band
  bandLight: 0x3a3a3c,
  crown: 0xb9bbbd,
  faceBg: 0x08080a,
};

const CASE_W = 0.72;
const CASE_H = 0.86;
const CASE_R = 0.24;
const CASE_T = 0.2;

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

function drawWatchFace(ctx: CanvasRenderingContext2D, w: number, h: number, seconds: number): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#08080a';
  ctx.fillRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h * 0.42;

  ctx.fillStyle = '#f2b134';
  ctx.textAlign = 'center';
  ctx.font = '300 92px Arial';
  ctx.fillText('9:41', cx, cy);

  ctx.font = '400 26px Arial';
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText('THU JUL 30', cx, cy + 46);

  // small complication rings (activity)
  const rings = [
    { color: '#e0473a', r: 70 },
    { color: '#9ad30a', r: 55 },
    { color: '#12c2e0', r: 40 },
  ];
  const ringCy = h * 0.78;
  for (const ring of rings) {
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(cx, ringCy, ring.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = ring.color;
    ctx.beginPath();
    const frac = 0.35 + 0.5 * (0.5 + 0.5 * Math.sin(seconds * 0.4 + ring.r));
    ctx.arc(cx, ringCy, ring.r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
    ctx.stroke();
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

function tubeAlong(points: THREE.Vector3[], radius: number, mat: THREE.Material, shadows: boolean): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3(points);
  const geo = new THREE.TubeGeometry(curve, 32, radius, 12, false);
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = shadows;
  m.receiveShadow = shadows;
  return m;
}

/* ============================================================ */
export function createAppleWatchModel(options: AppleWatchOptions = {}): THREE.Group {
  const shadows = options.shadows ?? true;
  const root = new THREE.Group();
  root.position.y = 0.24;

  const matCase = new THREE.MeshPhysicalMaterial({
    color: COL.case,
    roughness: 0.35,
    metalness: 0.9,
    clearcoat: 0.4,
    clearcoatRoughness: 0.3,
  });
  const matBezel = new THREE.MeshStandardMaterial({ color: COL.screenBezel, roughness: 0.4, metalness: 0.3 });
  const matGlass = new THREE.MeshPhysicalMaterial({
    color: 0x050506,
    roughness: 0.05,
    metalness: 0.1,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
  });
  const matBand = new THREE.MeshPhysicalMaterial({
    color: COL.band,
    roughness: 0.7,
    metalness: 0.0,
    sheen: 0.3,
    sheenColor: new THREE.Color(COL.bandLight),
  });
  const matCrown = new THREE.MeshStandardMaterial({ color: COL.crown, roughness: 0.3, metalness: 0.85 });

  /* ---- case ---- */
  const caseMesh = slab(CASE_W, CASE_H, CASE_T, CASE_R, matCase, 0.02, shadows);
  root.add(caseMesh);

  /* ---- screen bezel + glass ---- */
  const bezel = slab(CASE_W - 0.05, CASE_H - 0.05, 0.02, CASE_R - 0.02, matBezel, 0.004, shadows);
  bezel.position.y = CASE_T - 0.01;
  root.add(bezel);

  const glass = new THREE.Mesh(new THREE.PlaneGeometry(CASE_W - 0.09, CASE_H - 0.09), matGlass);
  glass.rotation.x = -Math.PI / 2;
  glass.position.y = CASE_T + 0.006;
  root.add(glass);

  /* ---- watch face (redrawn each frame) ---- */
  const faceSurface = makeCanvasTexture(384, 460);
  drawWatchFace(faceSurface.ctx, 384, 460, 0);
  faceSurface.tex.needsUpdate = true;
  const faceMat = new THREE.MeshBasicMaterial({ map: faceSurface.tex, transparent: true });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(CASE_W - 0.1, CASE_H - 0.1), faceMat);
  face.rotation.x = -Math.PI / 2;
  face.position.y = CASE_T + 0.008;
  root.add(face);
  const faceGlow = new THREE.PointLight(0xffffff, 0.5, 1);
  faceGlow.position.y = CASE_T + 0.1;
  root.add(faceGlow);

  /* ---- Digital Crown + side button ---- */
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.06, 24), matCrown);
  crown.rotation.z = Math.PI / 2;
  crown.position.set(CASE_W / 2 + 0.05, 0.08, 0);
  crown.castShadow = shadows;
  root.add(crown);

  const sideButton = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.14, 0.05), matCase);
  sideButton.position.set(CASE_W / 2 + 0.014, -0.12, 0);
  root.add(sideButton);

  /* ---- lugs ---- */
  function lug(sign: number): THREE.Mesh {
    const geo = roundedRectShape(0.3, 0.14, 0.05);
    const m = slab(0.3, 0.14, 0.06, 0.05, matCase, 0.008, shadows);
    void geo;
    m.position.set(0, sign * (CASE_H / 2 + 0.06), 0);
    m.rotation.z = Math.PI / 2;
    return m;
  }
  root.add(lug(1));
  root.add(lug(-1));

  /* ---- sport band, curving away top and bottom ---- */
  const topBand = tubeAlong(
    [
      new THREE.Vector3(0, CASE_H / 2 + 0.1, 0.02),
      new THREE.Vector3(0.05, CASE_H / 2 + 0.7, -0.15),
      new THREE.Vector3(0.02, CASE_H / 2 + 1.3, -0.5),
    ],
    0.28,
    matBand,
    shadows,
  );
  root.add(topBand);
  const bottomBand = tubeAlong(
    [
      new THREE.Vector3(0, -CASE_H / 2 - 0.1, 0.02),
      new THREE.Vector3(-0.05, -CASE_H / 2 - 0.7, -0.15),
      new THREE.Vector3(-0.02, -CASE_H / 2 - 1.3, -0.5),
    ],
    0.28,
    matBand,
    shadows,
  );
  root.add(bottomBand);

  /* ---- animation ---- */
  function updateAnimation(time: number): void {
    root.rotation.y = Math.sin(time * 0.14) * 0.3;
    root.rotation.x = 0.06 + Math.sin(time * 0.1) * 0.03;

    drawWatchFace(faceSurface.ctx, 384, 460, time);
    faceSurface.tex.needsUpdate = true;

    const wakeCycle = (time % 6) / 6;
    const bright = wakeCycle < 0.15 ? wakeCycle / 0.15 : wakeCycle > 0.85 ? (1 - wakeCycle) / 0.15 : 1;
    faceGlow.intensity = 0.25 + bright * 0.5;

    crown.rotation.x = Math.sin(time * 0.8) * 0.6;

    topBand.rotation.x = Math.sin(time * 0.5) * 0.02;
    bottomBand.rotation.x = Math.sin(time * 0.5 + Math.PI) * 0.02;
  }
  updateAnimation(0);
  root.userData.tick = (_dt: number, elapsed: number): void => updateAnimation(elapsed);

  return root;
}

export function createAppleWatchLookDevLights(): THREE.Group {
  const lights = new THREE.Group();
  const key = new THREE.DirectionalLight(0xffffff, 2.6);
  key.position.set(3, 6, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 20;
  const kc = key.shadow.camera as THREE.OrthographicCamera;
  kc.left = -3;
  kc.right = 3;
  kc.top = 3;
  kc.bottom = -3;
  key.shadow.bias = -0.0004;
  lights.add(key);
  const fill = new THREE.DirectionalLight(0xdfe6ff, 0.6);
  fill.position.set(-4, 3, 2);
  lights.add(fill);
  const rim = new THREE.DirectionalLight(0xffe8cf, 0.55);
  rim.position.set(-2, 3, -5);
  lights.add(rim);
  lights.add(new THREE.HemisphereLight(0xffffff, 0x9a9a9d, 0.4));
  return lights;
}

export function makeAppleWatchBackground(): THREE.Color {
  return new THREE.Color(0xeceded);
}
