import * as THREE from 'three';

/**
 * Sambor Prei Kuk, rebuilt in code as its defining silhouette: a trio of
 * slender pre-Angkorian brick towers with genuinely octagonal cross-sections
 * (not round, not square) — flat-faced brick shafts with blind-window
 * frames and colonnettes, each capped by a corbelled stack of shrinking
 * octagonal roof tiers, standing among jungle trees. A completely different
 * massing from a lathed Khmer prasat or a stepped pyramid.
 *
 * Live animation (looping ~18s): fireflies drift between the towers at dusk
 * and dappled canopy-light patches slide slowly across the brickwork.
 */

export interface SamborPreiKukOptions {
  shadows?: boolean;
}

/* ---- palette ---- */
const COL = {
  brick: 0xa1543a,
  brickDark: 0x7c3f2a,
  brickLight: 0xb5674a,
  mortar: 0x8a5642,
  bark: 0x4a3826,
  leaf: 0x3d5c30,
  firefly: 0xdfff9a,
};

function hex(n: number): string {
  return '#' + n.toString(16).padStart(6, '0');
}

/* ============================================================ */
/* texture helper                                                */
/* ============================================================ */
function brickTexture(base: number, w = 256, h = 256): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = hex(base);
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,0.28)';
  ctx.lineWidth = 2;
  const rowH = 14;
  for (let y = 0; y < h; y += rowH) {
    const offset = (y / rowH) % 2 === 0 ? 0 : 24;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
    for (let x = -offset; x < w; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + rowH);
      ctx.stroke();
    }
  }
  for (let i = 0; i < 500; i++) {
    const shade = Math.random() * 0.12 - 0.06;
    ctx.fillStyle = shade > 0 ? `rgba(255,220,190,${shade})` : `rgba(0,0,0,${-shade})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 3);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ============================================================ */
/* geometry helpers                                              */
/* ============================================================ */

/** An octagonal-plan brick tower: tapered 8-sided shaft, blind window
 *  frames on the cardinal faces, and a corbelled stack of shrinking
 *  octagonal roof tiers rather than a smooth lathed spire. */
function octagonTower(
  radius: number,
  height: number,
  roofTiers: number,
  mat: THREE.Material,
  matFrame: THREE.Material,
  shadows: boolean,
): THREE.Group {
  const g = new THREE.Group();

  const shaftGeo = new THREE.CylinderGeometry(radius * 0.9, radius, height, 8, 1);
  const shaft = new THREE.Mesh(shaftGeo, mat);
  shaft.position.y = height / 2;
  shaft.castShadow = shadows;
  shaft.receiveShadow = shadows;
  g.add(shaft);

  // blind window frames on the four cardinal faces (odd octagon faces)
  for (let i = 0; i < 8; i += 2) {
    const ang = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const frameW = radius * 0.62;
    const frameH = height * 0.4;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(frameW, frameH, 0.05), matFrame);
    const dist = radius * 0.97;
    frame.position.set(Math.sin(ang) * dist, height * 0.52, Math.cos(ang) * dist);
    frame.rotation.y = ang;
    g.add(frame);

    // flanking colonnettes (small turned columns) either side of the frame
    for (const side of [-1, 1]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, frameH * 0.9, 8), matFrame);
      const lateral = side * (frameW / 2 + 0.06);
      const cx = Math.sin(ang) * dist + Math.cos(ang) * lateral;
      const cz = Math.cos(ang) * dist - Math.sin(ang) * lateral;
      col.position.set(cx, height * 0.52, cz);
      g.add(col);
    }
  }

  // corbelled roof: successive octagonal prisms, each shorter and narrower
  let ry = height;
  let rr = radius * 1.05;
  for (let t = 0; t < roofTiers; t++) {
    const th = height * 0.1 * (1 - t * 0.04);
    rr *= 0.76;
    const tier = new THREE.Mesh(new THREE.CylinderGeometry(rr, rr / 0.76, th, 8), matFrame);
    tier.position.y = ry + th / 2;
    tier.castShadow = shadows;
    g.add(tier);
    ry += th;
  }
  const finial = new THREE.Mesh(new THREE.ConeGeometry(rr * 0.5, height * 0.12, 8), matFrame);
  finial.position.y = ry + (height * 0.12) / 2;
  g.add(finial);

  return g;
}

function terrace(len: number, dep: number, h: number, mat: THREE.Material, shadows: boolean): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(len, h, dep), mat);
  m.castShadow = shadows;
  m.receiveShadow = shadows;
  return m;
}

function rng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function jungleTree(matBark: THREE.Material, matLeaf: THREE.Material, rand: () => number): THREE.Group {
  const g = new THREE.Group();
  const h = 2.0 + rand() * 1.2;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, h, 8), matBark);
  trunk.position.y = h / 2;
  g.add(trunk);
  const foliage = new THREE.Group();
  foliage.position.y = h;
  for (let i = 0; i < 6; i++) {
    const r = 0.35 + rand() * 0.3;
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), matLeaf);
    s.position.set((rand() - 0.5) * 1.2, (rand() - 0.2) * 0.8, (rand() - 0.5) * 1.2);
    foliage.add(s);
  }
  g.add(foliage);
  return g;
}

function firefly(mat: THREE.Material): { mesh: THREE.Mesh; light: THREE.PointLight } {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), mat);
  const light = new THREE.PointLight(0xdfff9a, 0.4, 1.2, 2);
  mesh.add(light);
  return { mesh, light };
}

/* ============================================================ */
/* model                                                         */
/* ============================================================ */
export function createSamborPreiKukModel(options: SamborPreiKukOptions = {}): THREE.Group {
  const shadows = options.shadows ?? true;
  const root = new THREE.Group();
  const rand = rng(19);

  /* ---- materials ---- */
  const matBrick = new THREE.MeshPhysicalMaterial({
    color: COL.brick,
    map: brickTexture(COL.brick),
    roughness: 0.85,
    metalness: 0.0,
  });
  const matBrickDark = new THREE.MeshStandardMaterial({ color: COL.brickDark, roughness: 0.85, metalness: 0.0 });
  const matBrickLight = new THREE.MeshPhysicalMaterial({
    color: COL.brickLight,
    map: brickTexture(COL.brickLight),
    roughness: 0.85,
    metalness: 0.0,
  });
  const matBark = new THREE.MeshStandardMaterial({ color: COL.bark, roughness: 0.9 });
  const matLeaf = new THREE.MeshStandardMaterial({ color: COL.leaf, roughness: 1.0, flatShading: true });
  const matFirefly = new THREE.MeshBasicMaterial({ color: COL.firefly });

  /* ---- ground ---- */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(14, 12), new THREE.MeshStandardMaterial({ color: 0x40501f, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = shadows;
  root.add(ground);

  /* ---- three towers in the classic Sambor Prei Kuk row ---- */
  const towerDefs = [
    { x: -1.7, r: 0.62, h: 3.2, mat: matBrick },
    { x: 0, r: 0.72, h: 3.9, mat: matBrickLight },
    { x: 1.7, r: 0.6, h: 3.0, mat: matBrickDark },
  ];
  for (const t of towerDefs) {
    const plinth = terrace(t.r * 2.4, 0.3, t.r * 2.4, matBrickDark, shadows);
    plinth.position.set(t.x, 0.15, 0);
    root.add(plinth);
    const tower = octagonTower(t.r, t.h, 6, t.mat, matBrickDark, shadows);
    tower.position.set(t.x, 0.3, 0);
    root.add(tower);
  }

  /* ---- surrounding jungle trees ---- */
  for (let i = 0; i < 5; i++) {
    const tree = jungleTree(matBark, matLeaf, rand);
    const ang = rand() * Math.PI * 2;
    const dist = 3.6 + rand() * 2.4;
    tree.position.set(Math.cos(ang) * dist, 0, Math.sin(ang) * dist);
    root.add(tree);
  }

  /* ---- scattered fallen brick rubble ---- */
  for (let i = 0; i < 6; i++) {
    const rb = terrace(0.22 + rand() * 0.2, 0.14 + rand() * 0.12, 0.22 + rand() * 0.2, matBrickDark, shadows);
    rb.rotation.y = rand() * Math.PI;
    rb.position.set(-3 + rand() * 6, 0.08, -1.6 + rand() * 3.2);
    root.add(rb);
  }

  /* ---- fireflies ---- */
  const flies = Array.from({ length: 8 }, () => firefly(matFirefly));
  for (const f of flies) root.add(f.mesh);

  /* ---- dappled light patches drifting across the brickwork ---- */
  const dappleMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.12, depthWrite: false });
  const dapples: THREE.Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.9), dappleMat.clone());
    d.userData.seed = rand() * 100;
    dapples.push(d);
    root.add(d);
  }

  /* ---- animation ---- */
  const CYCLE = 18;
  function updateAnimation(elapsed: number): void {
    flies.forEach((f, i) => {
      const seed = i * 13.7;
      const a = elapsed * 0.6 + seed;
      const r = 1.0 + Math.sin(seed) * 0.8;
      f.mesh.position.set(
        Math.sin(a) * r + Math.sin(seed * 3) * 1.5,
        0.6 + Math.sin(a * 1.7 + seed) * 0.4 + 0.3,
        Math.cos(a * 0.8) * r + Math.cos(seed * 2) * 1.2,
      );
      f.light.intensity = 0.3 + Math.abs(Math.sin(elapsed * 3 + seed)) * 0.3;
    });

    dapples.forEach((d, i) => {
      const seed = d.userData.seed as number;
      const t = ((elapsed + seed) % CYCLE) / CYCLE;
      d.position.set(-2 + t * 4, 1.5 + (i % 3) * 0.6, 0.61);
      (d.material as THREE.MeshBasicMaterial).opacity = 0.1 + 0.06 * Math.sin(t * Math.PI);
    });
  }

  updateAnimation(0);
  root.userData.tick = (_dt: number, elapsed: number): void => updateAnimation(elapsed);

  return root;
}

/* ============================================================ */
/* lights + background                                           */
/* ============================================================ */
export function createSamborPreiKukLookDevLights(): THREE.Group {
  const lights = new THREE.Group();

  const key = new THREE.DirectionalLight(0xffd9a0, 1.6);
  key.position.set(3, 6, 4);
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
  key.shadow.radius = 5;
  lights.add(key);

  const fill = new THREE.DirectionalLight(0x6b7ab0, 0.5);
  fill.position.set(-4, 3, -2);
  lights.add(fill);

  const dusk = new THREE.DirectionalLight(0xff9a5a, 0.55);
  dusk.position.set(-3, 2, 5);
  lights.add(dusk);

  lights.add(new THREE.HemisphereLight(0x445577, 0x2a3315, 0.4));
  return lights;
}

export function makeSamborPreiKukBackground(): THREE.Color {
  return new THREE.Color(0x1f2438);
}
