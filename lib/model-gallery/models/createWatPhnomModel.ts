import * as THREE from 'three';

/**
 * Wat Phnom, rebuilt in code as its defining silhouette: a grassy man-made
 * hill with a stair spiralling up to a whitewashed, gold-spired bell stupa
 * (chedi) at the summit, and a small multi-tiered pagoda-roofed vihara at
 * the base — a completely different massing from a Khmer prasat: a mound +
 * dome + tapering ringed spire, rather than a tiered tower.
 *
 * Live animation (looping ~15s): pigeons circle the square below, two
 * banners flutter at the summit, and the gold spire glints slowly.
 */

export interface WatPhnomOptions {
  shadows?: boolean;
}

/* ---- palette ---- */
const COL = {
  hill: 0x5f7a41,
  stairStone: 0xcfc9ba,
  stupaWhite: 0xf2ede1,
  stupaBase: 0xd9c9a3,
  gold: 0xd4af5a,
  roofRed: 0x8a3a2c,
  roofGreen: 0x3a5a3a,
  wallWhite: 0xece4d2,
  bird: 0x3a352c,
  banner: 0xb84a3a,
};

/* ============================================================ */
/* geometry helpers                                              */
/* ============================================================ */

/** Bell-stupa silhouette: wide plinth -> bulbous anda dome -> tapering neck. */
function stupaProfile(): THREE.Vector2[] {
  return [
    new THREE.Vector2(1.05, 0),
    new THREE.Vector2(1.05, 0.14),
    new THREE.Vector2(0.86, 0.24),
    new THREE.Vector2(0.72, 0.34),
    new THREE.Vector2(0.95, 0.55),
    new THREE.Vector2(1.1, 0.78),
    new THREE.Vector2(1.02, 1.02),
    new THREE.Vector2(0.72, 1.28),
    new THREE.Vector2(0.42, 1.48),
    new THREE.Vector2(0.24, 1.6),
    new THREE.Vector2(0.16, 1.72),
    new THREE.Vector2(0.16, 1.86),
    new THREE.Vector2(0.07, 2.05),
    new THREE.Vector2(0.03, 2.35),
    new THREE.Vector2(0.0, 2.55),
  ];
}

function mound(radius: number, height: number, mat: THREE.Material, shadows: boolean): THREE.Mesh {
  const geo = new THREE.SphereGeometry(radius, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  geo.scale(1, height / radius, 1);
  const m = new THREE.Mesh(geo, mat);
  m.receiveShadow = shadows;
  m.castShadow = shadows;
  return m;
}

/** Ring height on the flattened hemisphere-mound at a given fraction of its height. */
function moundRadiusAt(hillR: number, hillH: number, y: number): number {
  const t = THREE.MathUtils.clamp(y / hillH, 0, 0.999);
  return hillR * Math.sqrt(1 - t * t);
}

function stepBlock(mat: THREE.Material, shadows: boolean): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.09, 0.3), mat);
  m.castShadow = shadows;
  m.receiveShadow = shadows;
  return m;
}

/** Layered pagoda-style roof: 2 stacked pitched tiers, each smaller than the last. */
function layeredRoof(w: number, matRoof: THREE.Material, shadows: boolean): THREE.Group {
  const g = new THREE.Group();
  const tiers = [
    { w: w, h: 0.28, y: 0 },
    { w: w * 0.72, h: 0.24, y: 0.24 },
    { w: w * 0.46, h: 0.2, y: 0.44 },
  ];
  for (const t of tiers) {
    const geo = new THREE.ConeGeometry(t.w * 0.72, t.h, 4);
    geo.rotateY(Math.PI / 4);
    const m = new THREE.Mesh(geo, matRoof);
    m.position.y = t.y + t.h / 2;
    m.castShadow = shadows;
    g.add(m);
  }
  const finial = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.3, 8), matRoof);
  finial.position.y = 0.44 + 0.2 + 0.15;
  g.add(finial);
  return g;
}

function bannerFlag(mat: THREE.Material): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(0.25, 0.7, 6, 1);
  const m = new THREE.Mesh(geo, mat);
  return m;
}

function birdShape(mat: THREE.Material): THREE.Mesh {
  const shape = new THREE.Shape();
  shape.moveTo(-0.08, 0);
  shape.quadraticCurveTo(0, 0.028, 0.08, 0);
  shape.quadraticCurveTo(0, -0.014, -0.08, 0);
  const m = new THREE.Mesh(new THREE.ShapeGeometry(shape), mat);
  m.rotation.x = -Math.PI / 2;
  return m;
}

/* ============================================================ */
/* model                                                         */
/* ============================================================ */
export function createWatPhnomModel(options: WatPhnomOptions = {}): THREE.Group {
  const shadows = options.shadows ?? true;
  const root = new THREE.Group();

  /* ---- materials ---- */
  const matHill = new THREE.MeshStandardMaterial({ color: COL.hill, roughness: 1.0 });
  const matStair = new THREE.MeshStandardMaterial({ color: COL.stairStone, roughness: 0.8 });
  const matStupaWhite = new THREE.MeshPhysicalMaterial({ color: COL.stupaWhite, roughness: 0.55, metalness: 0.0, clearcoat: 0.15 });
  const matStupaBase = new THREE.MeshStandardMaterial({ color: COL.stupaBase, roughness: 0.7 });
  const matGold = new THREE.MeshStandardMaterial({ color: COL.gold, roughness: 0.3, metalness: 0.9 });
  const matWall = new THREE.MeshStandardMaterial({ color: COL.wallWhite, roughness: 0.7 });
  const matRoof = new THREE.MeshStandardMaterial({ color: COL.roofRed, roughness: 0.6 });
  const matBird = new THREE.MeshBasicMaterial({ color: COL.bird, side: THREE.DoubleSide });
  const matBanner = new THREE.MeshStandardMaterial({ color: COL.banner, roughness: 0.8, side: THREE.DoubleSide });

  /* ---- ground plaza ---- */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), new THREE.MeshStandardMaterial({ color: 0x9a9484, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = shadows;
  root.add(ground);

  /* ---- the hill ---- */
  const hillR = 3.1;
  const hillH = 1.9;
  const hillMesh = mound(hillR, hillH, matHill, shadows);
  root.add(hillMesh);

  /* ---- spiral staircase climbing the mound ---- */
  const stairSteps = 46;
  const turns = 1.85;
  const steps: THREE.Mesh[] = [];
  for (let i = 0; i < stairSteps; i++) {
    const t = i / (stairSteps - 1);
    const ang = t * Math.PI * 2 * turns;
    const yPos = t * hillH * 0.97;
    const rad = moundRadiusAt(hillR, hillH, yPos) + 0.22;
    const step = stepBlock(matStair, shadows);
    step.position.set(Math.cos(ang) * rad, yPos + 0.05, Math.sin(ang) * rad);
    step.rotation.y = -ang;
    root.add(step);
    steps.push(step);
  }

  /* ---- summit platform + stupa ---- */
  const platform = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.4, 0.2, 16), matStupaBase);
  platform.position.y = hillH + 0.1;
  platform.castShadow = shadows;
  platform.receiveShadow = shadows;
  root.add(platform);

  const stupaGeo = new THREE.LatheGeometry(stupaProfile(), 28);
  const stupa = new THREE.Mesh(stupaGeo, matStupaWhite);
  stupa.position.y = hillH + 0.2;
  stupa.castShadow = shadows;
  root.add(stupa);

  // chattravali rings on the spire
  const spireBaseY = hillH + 0.2 + 1.86;
  for (let i = 0; i < 5; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.13 - i * 0.02, 0.014, 8, 20), matGold);
    ring.position.y = spireBaseY + i * 0.14;
    ring.rotation.x = Math.PI / 2;
    root.add(ring);
  }
  const spireTip = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), matGold);
  spireTip.position.y = hillH + 0.2 + 2.55 + 0.05;
  root.add(spireTip);

  /* ---- banners flanking the stupa ---- */
  const bannerL = bannerFlag(matBanner);
  bannerL.position.set(-1.0, hillH + 0.75, 0.3);
  root.add(bannerL);
  const bannerR = bannerFlag(matBanner);
  bannerR.position.set(1.0, hillH + 0.75, -0.3);
  root.add(bannerR);

  /* ---- small vihara at the base with a layered pagoda roof ---- */
  const viharaBody = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 1.5), matWall);
  viharaBody.position.set(0, 0.55, hillR + 1.6);
  viharaBody.castShadow = shadows;
  viharaBody.receiveShadow = shadows;
  root.add(viharaBody);
  const viharaRoof = layeredRoof(2.6, matRoof, shadows);
  viharaRoof.position.set(0, 1.1, hillR + 1.6);
  root.add(viharaRoof);

  /* ---- circling pigeons ---- */
  const birds = [birdShape(matBird), birdShape(matBird), birdShape(matBird)];
  for (const b of birds) root.add(b);

  /* ---- animation ---- */
  const CYCLE = 15;
  function updateAnimation(elapsed: number): void {
    birds.forEach((b, i) => {
      const a = (elapsed / CYCLE) * Math.PI * 2 + (i * Math.PI * 2) / birds.length;
      const r = 4.2 + i * 0.3;
      b.position.set(Math.cos(a) * r, 0.6 + Math.sin(elapsed * 1.4 + i) * 0.15, Math.sin(a) * r);
      b.rotation.y = -a - Math.PI / 2;
    });

    const flutter = Math.sin(elapsed * 4) * 0.25;
    bannerL.rotation.y = flutter;
    bannerR.rotation.y = -flutter * 0.8;

    const glint = 0.7 + 0.3 * Math.sin(elapsed * 0.8);
    matGold.emissive.setRGB(0.25 * glint, 0.18 * glint, 0.02 * glint);
  }

  updateAnimation(0);
  root.userData.tick = (_dt: number, elapsed: number): void => updateAnimation(elapsed);

  return root;
}

/* ============================================================ */
/* lights + background                                           */
/* ============================================================ */
export function createWatPhnomLookDevLights(): THREE.Group {
  const lights = new THREE.Group();

  const key = new THREE.DirectionalLight(0xfff4df, 2.4);
  key.position.set(4, 8, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 20;
  const kc = key.shadow.camera as THREE.OrthographicCamera;
  kc.left = -7;
  kc.right = 7;
  kc.top = 7;
  kc.bottom = -7;
  key.shadow.bias = -0.0005;
  key.shadow.radius = 4;
  lights.add(key);

  const fill = new THREE.DirectionalLight(0xcfe0ff, 0.55);
  fill.position.set(-5, 3, -2);
  lights.add(fill);

  const rim = new THREE.DirectionalLight(0xffe6c0, 0.5);
  rim.position.set(-2, 4, -6);
  lights.add(rim);

  lights.add(new THREE.HemisphereLight(0xdcecff, 0x5f7a41, 0.5));
  return lights;
}

export function makeWatPhnomBackground(): THREE.Color {
  return new THREE.Color(0xdff0f6);
}
