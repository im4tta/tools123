import * as THREE from 'three';

/**
 * Banteay Srei, rebuilt in code as a miniature pink-sandstone citadel —
 * three small sanctuary towers on a shared plinth, each crowned with a
 * deeply carved pediment (drawn procedurally onto canvas decals), guarded
 * by crouching lion and monkey-guardian statues, behind a bright laterite
 * enclosure wall.
 *
 * Live animation (looping ~12s): frangipani petals drift down past the
 * carved pediments and a soft golden light breathes across the reliefs.
 */

export interface BanteaySreiOptions {
  shadows?: boolean;
}

/* ---- palette ---- */
const COL = {
  pink: 0xc98868,
  pinkDark: 0xa66a4e,
  laterite: 0x7a4a34,
  carve: 0x7d4a30,
  petal: 0xf6e4d0,
  petalCenter: 0xf2b25a,
  guardian: 0x8a5a3c,
};

function hex(n: number): string {
  return '#' + n.toString(16).padStart(6, '0');
}

/* ============================================================ */
/* texture helpers                                              */
/* ============================================================ */
function textTexture(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  w = 512,
  h = 384,
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function stoneTexture(base: number, w = 256, h = 256): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = hex(base);
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 800; i++) {
    const shade = Math.random() * 0.12 - 0.06;
    ctx.fillStyle = shade > 0 ? `rgba(255,255,255,${shade})` : `rgba(0,0,0,${-shade})`;
    const s = Math.random() * 2.5 + 1;
    ctx.fillRect(Math.random() * w, Math.random() * h, s, s);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 2);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** A stylised deep-relief pediment: a triangular field of scrollwork framing
 *  a small central figure, in the spirit of Banteay Srei's kala/naga arches. */
function pedimentTexture(): THREE.CanvasTexture {
  return textTexture((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = hex(COL.carve);
    ctx.fillStyle = hex(COL.carve);
    ctx.lineWidth = 5;

    // outer flame-like arch frame
    ctx.beginPath();
    ctx.moveTo(w * 0.06, h * 0.92);
    ctx.quadraticCurveTo(w * 0.06, h * 0.3, w * 0.5, h * 0.05);
    ctx.quadraticCurveTo(w * 0.94, h * 0.3, w * 0.94, h * 0.92);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w * 0.16, h * 0.9);
    ctx.quadraticCurveTo(w * 0.16, h * 0.38, w * 0.5, h * 0.16);
    ctx.quadraticCurveTo(w * 0.84, h * 0.38, w * 0.84, h * 0.9);
    ctx.stroke();

    // scrollwork foliage, mirrored left/right
    for (const sign of [-1, 1]) {
      for (let i = 0; i < 5; i++) {
        const cx = w * 0.5 + sign * (0.1 + i * 0.065) * w;
        const cy = h * (0.82 - i * 0.11);
        if (cx < w * 0.08 || cx > w * 0.92) continue;
        ctx.beginPath();
        ctx.arc(cx, cy, 10 + i * 1.5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // small central seated figure (kala mask suggestion)
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.32, 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w * 0.44, h * 0.29, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(w * 0.56, h * 0.29, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(w * 0.42, h * 0.4);
    ctx.quadraticCurveTo(w * 0.5, h * 0.46, w * 0.58, h * 0.4);
    ctx.stroke();
  });
}

function decal(tex: THREE.Texture, w: number, h: number): THREE.Mesh {
  const m = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
}

function petalTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, 64, 64);
  ctx.fillStyle = hex(COL.petal);
  ctx.beginPath();
  ctx.ellipse(32, 32, 22, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hex(COL.petalCenter);
  ctx.beginPath();
  ctx.ellipse(24, 32, 7, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ============================================================ */
/* geometry helpers                                             */
/* ============================================================ */
function towerProfile(baseR: number, height: number, tiers: number): THREE.Vector2[] {
  const pts: THREE.Vector2[] = [];
  pts.push(new THREE.Vector2(baseR * 1.08, 0));
  pts.push(new THREE.Vector2(baseR * 1.08, height * 0.03));
  let y = height * 0.03;
  let r = baseR;
  const shaftH = height * 0.6;
  const tierH = shaftH / tiers;
  for (let i = 0; i < tiers; i++) {
    const rNext = r * 0.82;
    pts.push(new THREE.Vector2(r, y));
    pts.push(new THREE.Vector2(r * 0.88, y + tierH * 0.2));
    pts.push(new THREE.Vector2(rNext, y + tierH * 0.26));
    pts.push(new THREE.Vector2(rNext, y + tierH));
    y += tierH;
    r = rNext;
  }
  pts.push(new THREE.Vector2(r * 0.7, y + height * 0.12));
  pts.push(new THREE.Vector2(r * 0.32, y + height * 0.24));
  pts.push(new THREE.Vector2(0.008, y + height * 0.34));
  return pts;
}

function khmerTower(baseR: number, height: number, tiers: number, mat: THREE.Material, shadows: boolean): THREE.Mesh {
  const geo = new THREE.LatheGeometry(towerProfile(baseR, height, tiers), 16);
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = shadows;
  m.receiveShadow = shadows;
  return m;
}

function terrace(len: number, dep: number, h: number, mat: THREE.Material, shadows: boolean): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(len, h, dep), mat);
  m.castShadow = shadows;
  m.receiveShadow = shadows;
  return m;
}

/** A small crouching guardian statue (lion or monkey), built from primitives. */
function guardianStatue(mat: THREE.Material, shadows: boolean): THREE.Group {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.3), mat);
  base.position.y = 0.03;
  g.add(base);
  const haunches = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), mat);
  haunches.scale.set(1.1, 0.9, 1.3);
  haunches.position.set(0, 0.16, -0.02);
  haunches.castShadow = shadows;
  g.add(haunches);
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.22, 10), mat);
  chest.position.set(0, 0.2, 0.12);
  chest.castShadow = shadows;
  g.add(chest);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.08, 14, 12), mat);
  head.position.set(0, 0.33, 0.16);
  head.castShadow = shadows;
  g.add(head);
  for (const dx of [-0.035, 0.035]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.04, 8), mat);
    ear.position.set(dx, 0.39, 0.16);
    g.add(ear);
  }
  return g;
}

function pediment(width: number, height: number, tex: THREE.Texture, matFrame: THREE.Material, shadows: boolean): THREE.Group {
  const g = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.quadraticCurveTo(-width / 2, height * 0.7, 0, height);
  shape.quadraticCurveTo(width / 2, height * 0.7, width / 2, 0);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 });
  const frame = new THREE.Mesh(geo, matFrame);
  frame.castShadow = shadows;
  g.add(frame);
  const face = decal(tex, width * 0.94, height * 0.94);
  face.position.set(0, height * 0.46, 0.11);
  g.add(face);
  return g;
}

/* ============================================================ */
/* model                                                        */
/* ============================================================ */
export function createBanteaySreiModel(options: BanteaySreiOptions = {}): THREE.Group {
  const shadows = options.shadows ?? true;
  const root = new THREE.Group();

  /* ---- materials ---- */
  const matPink = new THREE.MeshPhysicalMaterial({
    color: COL.pink,
    map: stoneTexture(COL.pink),
    roughness: 0.65,
    metalness: 0.0,
    clearcoat: 0.1,
  });
  const matPinkDark = new THREE.MeshStandardMaterial({ color: COL.pinkDark, roughness: 0.7, metalness: 0.0 });
  const matLaterite = new THREE.MeshStandardMaterial({ color: COL.laterite, roughness: 0.95, metalness: 0.0 });
  const matGuardian = new THREE.MeshStandardMaterial({ color: COL.guardian, roughness: 0.6, metalness: 0.0 });
  const pedimentTex = pedimentTexture();
  const petalTex = petalTexture();

  /* ---- ground + laterite enclosure ---- */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(9, 8), new THREE.MeshStandardMaterial({ color: 0x8a7a5c, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = shadows;
  root.add(ground);

  const wallH = 0.9;
  const wallDefs: [number, number, number, number][] = [
    [4.8, wallH, 0.2, 0],
    [4.8, wallH, 0.2, Math.PI],
    [3.6, wallH, 0.2, Math.PI / 2],
    [3.6, wallH, 0.2, -Math.PI / 2],
  ];
  for (const [len, h, th, rot] of wallDefs) {
    const wall = terrace(len, h, th, matLaterite, shadows);
    wall.position.y = h / 2;
    wall.rotation.y = rot;
    const dist = 2.2;
    wall.position.x = Math.sin(rot) * dist;
    wall.position.z = Math.cos(rot) * dist;
    root.add(wall);
  }

  /* ---- shared plinth ---- */
  const plinth = terrace(3.0, 1.8, 0.35, matPink, shadows);
  plinth.position.y = 0.175;
  root.add(plinth);

  /* ---- three sanctuary towers ---- */
  const towerX = [-0.85, 0, 0.85];
  const towerH = [1.5, 1.9, 1.5];
  for (let i = 0; i < 3; i++) {
    const tower = khmerTower(0.34, towerH[i], 3, i === 1 ? matPink : matPinkDark, shadows);
    tower.position.set(towerX[i], 0.35, 0);
    root.add(tower);

    const ped = pediment(0.55, 0.5, pedimentTex, matPinkDark, shadows);
    ped.position.set(towerX[i], 0.35 + towerH[i] * 0.18, 0.36);
    root.add(ped);
  }

  /* ---- guardian statues flanking the entrance ---- */
  const g1 = guardianStatue(matGuardian, shadows);
  g1.position.set(-1.6, 0.35, 1.5);
  g1.rotation.y = 0.3;
  root.add(g1);
  const g2 = guardianStatue(matGuardian, shadows);
  g2.position.set(1.6, 0.35, 1.5);
  g2.rotation.y = -0.3;
  root.add(g2);

  /* ---- drifting frangipani petals ---- */
  const petals: THREE.Mesh[] = [];
  for (let i = 0; i < 12; i++) {
    const petalMat = new THREE.MeshBasicMaterial({ map: petalTex, transparent: true, side: THREE.DoubleSide });
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.05), petalMat);
    p.position.set((Math.random() - 0.5) * 3, Math.random() * 2.5 + 0.5, (Math.random() - 0.5) * 2 + 0.3);
    p.userData.seed = Math.random() * 100;
    petals.push(p);
    root.add(p);
  }

  /* ---- animation ---- */
  const CYCLE = 12;
  function updateAnimation(elapsed: number): void {
    for (const p of petals) {
      const seed = p.userData.seed as number;
      const t = ((elapsed + seed) % CYCLE) / CYCLE;
      p.position.y = 3.0 - t * 3.0;
      p.position.x += Math.sin((elapsed + seed) * 1.4) * 0.003;
      p.rotation.z = elapsed * 1.2 + seed;
      p.rotation.x = Math.sin(elapsed + seed) * 0.6;
    }
    const glow = 0.5 + 0.5 * Math.sin((elapsed / CYCLE) * Math.PI * 2);
    matPink.emissive.setRGB(0.05 * glow, 0.02 * glow, 0.01 * glow);
  }

  updateAnimation(0);
  root.userData.tick = (_dt: number, elapsed: number): void => updateAnimation(elapsed);

  return root;
}

/* ============================================================ */
/* lights + background                                          */
/* ============================================================ */
export function createBanteaySreiLookDevLights(): THREE.Group {
  const lights = new THREE.Group();

  const key = new THREE.DirectionalLight(0xfff2df, 2.4);
  key.position.set(3, 6, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 20;
  const kc = key.shadow.camera as THREE.OrthographicCamera;
  kc.left = -6;
  kc.right = 6;
  kc.top = 6;
  kc.bottom = -6;
  key.shadow.bias = -0.0005;
  key.shadow.radius = 4;
  lights.add(key);

  const fill = new THREE.DirectionalLight(0xffe0cf, 0.6);
  fill.position.set(-4, 3, 3);
  lights.add(fill);

  const rim = new THREE.DirectionalLight(0xffd7a8, 0.5);
  rim.position.set(-2, 4, -5);
  lights.add(rim);

  lights.add(new THREE.HemisphereLight(0xffe8d0, 0x6b4a30, 0.5));
  return lights;
}

export function makeBanteaySreiBackground(): THREE.Color {
  return new THREE.Color(0xf3e2cf);
}
