import * as THREE from 'three';

/**
 * Koh Ker's Prasat Thom, rebuilt in code as its defining silhouette: a
 * seven-tier stepped sandstone pyramid — Cambodia's answer to a ziggurat —
 * climbed by one steep frontal staircase flanked by crouching lion
 * balustrades, crowned by a single square shrine under a four-sided
 * pyramidal roof.
 *
 * Live animation (looping ~20s): a lone raptor circles the summit shrine and
 * a slow heat-shimmer warmth breathes across the sun-baked stone.
 */

export interface KohKerOptions {
  shadows?: boolean;
}

/* ---- palette ---- */
const COL = {
  stone: 0xa88e69,
  stoneDark: 0x7c6647,
  laterite: 0x6b4f38,
  gold: 0xcda85a,
  lion: 0x8a6c48,
  bird: 0x241f1a,
};

function hex(n: number): string {
  return '#' + n.toString(16).padStart(6, '0');
}

/* ============================================================ */
/* texture helper                                                */
/* ============================================================ */
function stoneTexture(base: number, w = 256, h = 256): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = hex(base);
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 1000; i++) {
    const shade = Math.random() * 0.15 - 0.075;
    ctx.fillStyle = shade > 0 ? `rgba(255,255,255,${shade})` : `rgba(0,0,0,${-shade})`;
    const s = Math.random() * 3 + 1;
    ctx.fillRect(Math.random() * w, Math.random() * h, s, s);
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  for (let y = 0; y < h; y += 14) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(4, 1);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ============================================================ */
/* geometry helpers                                              */
/* ============================================================ */
function block(len: number, h: number, dep: number, mat: THREE.Material, shadows: boolean): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(len, h, dep), mat);
  m.castShadow = shadows;
  m.receiveShadow = shadows;
  return m;
}

/** A simple crouching lion, built from stacked primitives — guards the stair base. */
function lionStatue(mat: THREE.Material, shadows: boolean): THREE.Group {
  const g = new THREE.Group();
  const haunches = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), mat);
  haunches.scale.set(1.1, 0.85, 1.4);
  haunches.position.set(0, 0.2, -0.05);
  haunches.castShadow = shadows;
  g.add(haunches);
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.3, 10), mat);
  chest.position.set(0, 0.26, 0.2);
  chest.castShadow = shadows;
  g.add(chest);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 12), mat);
  head.position.set(0, 0.44, 0.28);
  head.castShadow = shadows;
  g.add(head);
  const mane = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.05, 8, 16), mat);
  mane.position.set(0, 0.44, 0.24);
  mane.rotation.x = Math.PI / 2;
  g.add(mane);
  for (const dx of [-0.09, 0.09]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.24, 8), mat);
    leg.position.set(dx, 0.12, 0.32);
    g.add(leg);
  }
  return g;
}

/* ============================================================ */
/* model                                                         */
/* ============================================================ */
export function createKohKerModel(options: KohKerOptions = {}): THREE.Group {
  const shadows = options.shadows ?? true;
  const root = new THREE.Group();

  /* ---- materials ---- */
  const matStone = new THREE.MeshPhysicalMaterial({
    color: COL.stone,
    map: stoneTexture(COL.stone),
    roughness: 0.88,
    metalness: 0.0,
  });
  const matStoneDark = new THREE.MeshStandardMaterial({ color: COL.stoneDark, roughness: 0.9, metalness: 0.0 });
  const matLaterite = new THREE.MeshStandardMaterial({ color: COL.laterite, roughness: 0.95, metalness: 0.0 });
  const matGold = new THREE.MeshStandardMaterial({ color: COL.gold, roughness: 0.35, metalness: 0.9 });
  const matLion = new THREE.MeshStandardMaterial({ color: COL.lion, roughness: 0.75, metalness: 0.0 });
  const matBird = new THREE.MeshBasicMaterial({ color: COL.bird, side: THREE.DoubleSide });

  /* ---- ground ---- */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), new THREE.MeshStandardMaterial({ color: 0x5c6b45, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = shadows;
  root.add(ground);

  /* ---- seven receding tiers ---- */
  const TIERS = 7;
  const baseLen = 7.6;
  const baseDep = 7.0;
  let y = 0;
  for (let i = 0; i < TIERS; i++) {
    const scale = 1 - i * 0.105;
    const len = baseLen * scale;
    const dep = baseDep * scale;
    const h = i === 0 ? 0.7 : 0.5;
    const tier = block(len, h, dep, i % 2 === 0 ? matStone : matLaterite, shadows);
    tier.position.set(0, y + h / 2, 0);
    root.add(tier);
    y += h;
  }
  const topY = y;

  /* ---- square summit shrine with pyramidal roof ---- */
  const shrine = block(1.7, 1.0, 1.7, matStone, shadows);
  shrine.position.set(0, topY + 0.5, 0);
  root.add(shrine);
  const roofGeo = new THREE.ConeGeometry(1.32, 0.85, 4);
  roofGeo.rotateY(Math.PI / 4);
  const roof = new THREE.Mesh(roofGeo, matStoneDark);
  roof.position.set(0, topY + 1.0 + 0.425, 0);
  roof.castShadow = shadows;
  root.add(roof);
  const finial = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.4, 8), matGold);
  finial.position.set(0, topY + 1.0 + 0.85 + 0.2, 0);
  root.add(finial);

  /* ---- frontal staircase, straight up the south face ---- */
  const stairN = 26;
  const stairW = 1.9;
  const startZ = baseDep / 2 + 0.02;
  const endZ = (baseDep * (1 - (TIERS - 1) * 0.105)) / 2 - 0.15;
  const treadD = (startZ - endZ) / stairN;
  for (let s = 0; s < stairN; s++) {
    const t = (s + 0.5) / stairN;
    const stepY = t * topY;
    const stepZ = startZ - t * (startZ - endZ);
    const step = block(stairW, (topY / stairN) * 1.05, treadD * 1.6, matStoneDark, shadows);
    step.position.set(0, stepY, stepZ);
    root.add(step);
  }

  /* ---- lion guardians at the stair base ---- */
  const lionL = lionStatue(matLion, shadows);
  lionL.position.set(-stairW / 2 - 0.35, 0.05, startZ + 0.35);
  lionL.rotation.y = Math.PI;
  root.add(lionL);
  const lionR = lionStatue(matLion, shadows);
  lionR.position.set(stairW / 2 + 0.35, 0.05, startZ + 0.35);
  lionR.rotation.y = Math.PI;
  root.add(lionR);

  /* ---- scattered fallen blocks at the base ---- */
  for (let i = 0; i < 6; i++) {
    const rb = block(0.3 + Math.random() * 0.3, 0.22 + Math.random() * 0.2, 0.3 + Math.random() * 0.3, matStoneDark, shadows);
    rb.rotation.y = Math.random() * Math.PI;
    rb.position.set(baseLen / 2 + 0.6 + Math.random() * 1.4, 0.12, -2 + Math.random() * 4);
    root.add(rb);
  }

  /* ---- circling raptor ---- */
  const birdShape = new THREE.Shape();
  birdShape.moveTo(-0.12, 0);
  birdShape.quadraticCurveTo(0, 0.04, 0.12, 0);
  birdShape.quadraticCurveTo(0, -0.02, -0.12, 0);
  const bird = new THREE.Mesh(new THREE.ShapeGeometry(birdShape), matBird);
  bird.rotation.x = -Math.PI / 2;
  root.add(bird);

  /* ---- animation ---- */
  const CYCLE = 20;
  function updateAnimation(elapsed: number): void {
    const a = (elapsed / CYCLE) * Math.PI * 2;
    const radius = 2.4;
    bird.position.set(Math.cos(a) * radius, topY + 3.2 + Math.sin(elapsed * 1.1) * 0.12, Math.sin(a) * radius);
    bird.rotation.y = -a - Math.PI / 2;

    const warm = 1 + Math.sin(elapsed * 0.3) * 0.035;
    matStone.color.setHex(COL.stone).multiplyScalar(warm);
  }

  updateAnimation(0);
  root.userData.tick = (_dt: number, elapsed: number): void => updateAnimation(elapsed);

  return root;
}

/* ============================================================ */
/* lights + background                                           */
/* ============================================================ */
export function createKohKerLookDevLights(): THREE.Group {
  const lights = new THREE.Group();

  const key = new THREE.DirectionalLight(0xfff2d8, 2.6);
  key.position.set(5, 9, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 30;
  const kc = key.shadow.camera as THREE.OrthographicCamera;
  kc.left = -9;
  kc.right = 9;
  kc.top = 9;
  kc.bottom = -9;
  key.shadow.bias = -0.0005;
  key.shadow.radius = 4;
  lights.add(key);

  const fill = new THREE.DirectionalLight(0xcfe0ff, 0.5);
  fill.position.set(-6, 4, -3);
  lights.add(fill);

  const rim = new THREE.DirectionalLight(0xffdca8, 0.5);
  rim.position.set(-3, 3, -7);
  lights.add(rim);

  lights.add(new THREE.HemisphereLight(0xbfd6ff, 0x5c6b45, 0.5));
  return lights;
}

export function makeKohKerBackground(): THREE.Color {
  return new THREE.Color(0xdcebf5);
}
