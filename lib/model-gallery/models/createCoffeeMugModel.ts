import * as THREE from 'three';

/**
 * Ceramic coffee mug on a saucer, built in the same primitives-plus-decal
 * style as the other factories in this set. Focus: a glossy ceramic body
 * with a rolled rim and looped handle, dark coffee surface with a faint
 * crema swirl, and soft tube-geometry steam wisps that rise and fade.
 *
 * Live animation (looping ~4s per wisp, staggered): three steam wisps rise
 * and dissipate on offset cycles, plus a faint idle sway.
 */

export interface CoffeeMugOptions {
  shadows?: boolean;
}

const COL = {
  ceramic: 0xf3ede2,
  ceramicShadow: 0xd8cfbd,
  coffee: 0x2c1810,
  crema: 0x8a5a34,
  saucer: 0xefe9dd,
};

function textTexture(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  w = 512,
  h = 512,
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

function decal(tex: THREE.Texture, w: number, h: number): THREE.Mesh {
  const m = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
}

function cremaTex(): THREE.CanvasTexture {
  return textTexture((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    const r = w * 0.46;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#2c1810';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(138,90,52,0.5)';
    ctx.lineWidth = 6;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(cx, cy, r * (0.3 + i * 0.2), 0, Math.PI * 1.6);
      ctx.stroke();
    }
    ctx.restore();
  }, 512, 512);
}

/** A soft, tapering steam wisp made from a wavy tube that fades toward its tip. */
function steamWisp(seed: number): { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial } {
  const pts: THREE.Vector3[] = [];
  const n = 10;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = Math.sin(t * Math.PI * 2.2 + seed) * 0.05 * t;
    const y = t * 0.75;
    const z = Math.cos(t * Math.PI * 1.6 + seed) * 0.03 * t;
    pts.push(new THREE.Vector3(x, y, z));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const geo = new THREE.TubeGeometry(curve, 40, 0.016, 8, false);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  return { mesh, mat };
}

export function createCoffeeMugModel(options: CoffeeMugOptions = {}): THREE.Group {
  const shadows = options.shadows ?? true;
  const root = new THREE.Group();
  root.position.y = 0.05;

  const matCeramic = new THREE.MeshPhysicalMaterial({
    color: COL.ceramic,
    roughness: 0.22,
    metalness: 0.0,
    clearcoat: 0.9,
    clearcoatRoughness: 0.15,
    envMapIntensity: 0.8,
  });
  const matSaucer = new THREE.MeshPhysicalMaterial({
    color: COL.saucer,
    roughness: 0.25,
    metalness: 0.0,
    clearcoat: 0.7,
    clearcoatRoughness: 0.2,
  });

  /* ---- saucer ---- */
  const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.85, 0.06, 48), matSaucer);
  saucer.position.y = 0.03;
  saucer.castShadow = shadows;
  saucer.receiveShadow = shadows;
  root.add(saucer);
  const saucerWell = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.03, 48), matCeramic);
  saucerWell.position.y = 0.06;
  root.add(saucerWell);

  /* ---- mug body: lathed profile via LatheGeometry for a rolled rim/foot ---- */
  const profile: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.42, 0.0),
    new THREE.Vector2(0.44, 0.03),
    new THREE.Vector2(0.4, 0.06),
    new THREE.Vector2(0.44, 0.62),
    new THREE.Vector2(0.46, 0.7),
    new THREE.Vector2(0.44, 0.76),
    new THREE.Vector2(0.4, 0.78),
    new THREE.Vector2(0.36, 0.76),
    new THREE.Vector2(0.36, 0.06),
    new THREE.Vector2(0.0, 0.02),
  ];
  const mugGeo = new THREE.LatheGeometry(profile, 48);
  const mug = new THREE.Mesh(mugGeo, matCeramic);
  mug.position.y = 0.08;
  mug.castShadow = shadows;
  mug.receiveShadow = shadows;
  root.add(mug);

  /* coffee surface, slightly below the rim */
  const coffeeSurface = decal(cremaTex(), 0.72, 0.72);
  coffeeSurface.rotation.x = -Math.PI / 2;
  coffeeSurface.position.y = 0.08 + 0.7;
  root.add(coffeeSurface);

  /* handle: torus arc bent to a rounded-D shape */
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.42, 0.55, 0),
    new THREE.Vector3(0.72, 0.5, 0),
    new THREE.Vector3(0.78, 0.36, 0),
    new THREE.Vector3(0.72, 0.22, 0),
    new THREE.Vector3(0.42, 0.17, 0),
  ]);
  const handleGeo = new THREE.TubeGeometry(handleCurve, 40, 0.055, 16, false);
  const handle = new THREE.Mesh(handleGeo, matCeramic);
  handle.position.y = 0.08;
  handle.castShadow = shadows;
  root.add(handle);

  /* ---- steam wisps, staggered ---- */
  const wisp1 = steamWisp(0);
  const wisp2 = steamWisp(1.7);
  const wisp3 = steamWisp(3.3);
  const wisps = [
    { g: wisp1, x: -0.12, offset: 0 },
    { g: wisp2, x: 0.0, offset: 1.3 },
    { g: wisp3, x: 0.13, offset: 2.6 },
  ];
  for (const w of wisps) {
    w.g.mesh.position.set(w.x, 0.08 + 0.78, 0);
    root.add(w.g.mesh);
  }

  /* ---- animation ---- */
  const WISP_CYCLE = 4.0;
  function updateAnimation(time: number): void {
    root.rotation.y = Math.sin(time * 0.25) * 0.1;
    for (const w of wisps) {
      const t = ((time + w.offset) % WISP_CYCLE) / WISP_CYCLE;
      w.g.mesh.position.y = 0.08 + 0.78 + t * 0.5;
      w.g.mesh.scale.setScalar(1 + t * 0.6);
      w.g.mat.opacity = Math.sin(t * Math.PI) * 0.4;
    }
  }

  updateAnimation(0);
  root.userData.tick = (_dt: number, elapsed: number): void => updateAnimation(elapsed);

  return root;
}

export function createCoffeeMugLookDevLights(): THREE.Group {
  const lights = new THREE.Group();
  const key = new THREE.DirectionalLight(0xfff3e0, 2.4);
  key.position.set(3, 5, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  lights.add(key);
  const fill = new THREE.DirectionalLight(0xdfe6ff, 0.55);
  fill.position.set(-4, 2, 3);
  lights.add(fill);
  const rim = new THREE.DirectionalLight(0xffe8cf, 0.5);
  rim.position.set(-2, 3, -5);
  lights.add(rim);
  lights.add(new THREE.HemisphereLight(0xfff6ea, 0x6b5a48, 0.45));
  return lights;
}

export function makeCoffeeMugBackground(): THREE.Color {
  return new THREE.Color(0xf1e9dc);
}
