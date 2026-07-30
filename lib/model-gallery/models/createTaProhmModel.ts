import * as THREE from 'three';

/**
 * Ta Prohm, rebuilt in code as a jungle-swallowed ruin — a crumbling
 * sandstone gallery with a collapsed section and rubble, dominated by a
 * single giant silk-cotton tree whose trunk splits into a leafy canopy and
 * whose roots pour down over the stonework in sculpted tube-geometry
 * tendrils, exactly as at the real site.
 *
 * Live animation (looping ~16s): the canopy sways gently in the breeze and
 * a slow scatter of leaves drifts down past the ruined wall.
 */

export interface TaProhmOptions {
  shadows?: boolean;
}

/* ---- palette ---- */
const COL = {
  stone: 0x9c8f78,
  stoneDark: 0x746a58,
  moss: 0x5e7048,
  bark: 0x5b4632,
  barkLight: 0x6f5640,
  leaf: 0x3f6b34,
  leafLight: 0x568f45,
};

function hex(n: number): string {
  return '#' + n.toString(16).padStart(6, '0');
}

/* ============================================================ */
/* texture helpers                                              */
/* ============================================================ */
function stoneTexture(base: number, mossy: boolean, w = 256, h = 256): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = hex(base);
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) {
    const shade = Math.random() * 0.16 - 0.08;
    ctx.fillStyle = shade > 0 ? `rgba(255,255,255,${shade})` : `rgba(0,0,0,${-shade})`;
    const s = Math.random() * 3 + 1;
    ctx.fillRect(Math.random() * w, Math.random() * h, s, s);
  }
  if (mossy) {
    for (let i = 0; i < 40; i++) {
      const r = Math.random() * 14 + 4;
      ctx.fillStyle = `rgba(70,90,50,${Math.random() * 0.3 + 0.1})`;
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 2);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function leafTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, 64, 64);
  ctx.fillStyle = hex(COL.leafLight);
  ctx.beginPath();
  ctx.ellipse(32, 32, 26, 14, Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ============================================================ */
/* geometry helpers                                             */
/* ============================================================ */
function rng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function terrace(len: number, dep: number, h: number, mat: THREE.Material, shadows: boolean): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(len, h, dep), mat);
  m.castShadow = shadows;
  m.receiveShadow = shadows;
  return m;
}

/** One rough-hewn ashlar block, optionally knocked off-axis to read as ruined. */
function rubbleBlock(
  w: number,
  h: number,
  d: number,
  mat: THREE.Material,
  shadows: boolean,
  tilt = 0,
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.rotation.set(tilt * 0.6, tilt * 0.3, tilt);
  m.castShadow = shadows;
  m.receiveShadow = shadows;
  return m;
}

/** A gallery wall built from stacked ashlar rows, with a gap where it has collapsed. */
function ruinedWall(
  length: number,
  height: number,
  thickness: number,
  gapAt: number,
  gapWidth: number,
  mat: THREE.Material,
  shadows: boolean,
): THREE.Group {
  const g = new THREE.Group();
  const rows = 5;
  const rowH = height / rows;
  const blockW = 0.55;
  const cols = Math.round(length / blockW);
  const rand = rng(7);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = -length / 2 + (c + 0.5) * blockW;
      if (Math.abs(x - gapAt) < gapWidth / 2 && r > rows - 2 - Math.floor(rand() * 2)) continue; // collapsed opening
      const jitter = (rand() - 0.5) * 0.03;
      const block = new THREE.Mesh(new THREE.BoxGeometry(blockW - 0.03, rowH - 0.02, thickness), mat);
      block.position.set(x + jitter, r * rowH + rowH / 2, 0);
      block.castShadow = shadows;
      block.receiveShadow = shadows;
      g.add(block);
    }
  }
  return g;
}

/** A gnarled root tendril following a Catmull-Rom curve, tapering toward the tip. */
function rootTendril(points: THREE.Vector3[], radius: number, mat: THREE.Material, shadows: boolean): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3(points);
  const geo = new THREE.TubeGeometry(curve, 40, radius, 8, false);
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = shadows;
  m.receiveShadow = shadows;
  return m;
}

function foliageCluster(mat: THREE.Material, rand: () => number, n: number): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const r = 0.5 + rand() * 0.55;
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), mat);
    s.position.set((rand() - 0.5) * 2.4, (rand() - 0.3) * 1.4, (rand() - 0.5) * 2.4);
    g.add(s);
  }
  return g;
}

function leafSprite(tex: THREE.Texture): THREE.Mesh {
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
  return new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.08), mat);
}

/* ============================================================ */
/* model                                                        */
/* ============================================================ */
export function createTaProhmModel(options: TaProhmOptions = {}): THREE.Group {
  const shadows = options.shadows ?? true;
  const root = new THREE.Group();
  const rand = rng(42);

  /* ---- materials ---- */
  const matStone = new THREE.MeshPhysicalMaterial({
    color: COL.stone,
    map: stoneTexture(COL.stone, true),
    roughness: 0.9,
    metalness: 0.0,
  });
  const matStoneDark = new THREE.MeshStandardMaterial({ color: COL.stoneDark, roughness: 0.92, metalness: 0.0 });
  const matBark = new THREE.MeshStandardMaterial({ color: COL.bark, roughness: 0.85, metalness: 0.0 });
  const matBarkLight = new THREE.MeshStandardMaterial({ color: COL.barkLight, roughness: 0.85, metalness: 0.0 });
  const matLeaf = new THREE.MeshStandardMaterial({ color: COL.leaf, roughness: 1.0, flatShading: true });
  const matGround = new THREE.MeshStandardMaterial({ color: COL.moss, roughness: 1.0 });
  const leafTex = leafTexture();

  /* ---- ground + rubble ---- */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(12, 10), matGround);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = shadows;
  root.add(ground);

  const plinth = terrace(6.2, 3.2, 0.25, matStoneDark, shadows);
  plinth.position.y = 0.125;
  root.add(plinth);

  for (let i = 0; i < 10; i++) {
    const b = rubbleBlock(
      0.3 + rand() * 0.35,
      0.25 + rand() * 0.3,
      0.3 + rand() * 0.35,
      matStoneDark,
      shadows,
      rand() * 0.6,
    );
    b.position.set(-2.6 + rand() * 5.2, 0.13 + rand() * 0.1, -1.3 + rand() * 2.6);
    root.add(b);
  }

  /* ---- ruined gallery wall, doorway gap swallowed by the tree ---- */
  const wall = ruinedWall(5.4, 2.1, 0.35, 0.6, 1.3, matStone, shadows);
  wall.position.set(0, 0.25, -1.2);
  root.add(wall);

  const doorFrame = terrace(1.3, 1.7, 0.4, matStoneDark, shadows);
  doorFrame.position.set(0.6, 1.1, -1.2);
  root.add(doorFrame);

  /* ---- the great tree ---- */
  const treeGroup = new THREE.Group();
  treeGroup.position.set(0.9, 0, -0.9);
  root.add(treeGroup);

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.42, 3.4, 12), matBark);
  trunk.position.y = 1.7 + 2.2;
  trunk.castShadow = shadows;
  treeGroup.add(trunk);

  const canopyPivot = new THREE.Group();
  canopyPivot.position.set(0, 1.7 + 3.9, 0);
  treeGroup.add(canopyPivot);
  const canopy = foliageCluster(matLeaf, rand, 16);
  canopyPivot.add(canopy);

  // roots draping from the base of the trunk down over the ruined wall
  const rootMat = matBarkLight;
  const rootPaths: THREE.Vector3[][] = [
    [
      new THREE.Vector3(0.1, 1.9, -0.1),
      new THREE.Vector3(-0.5, 1.7, -0.5),
      new THREE.Vector3(-1.1, 1.5, -0.9),
      new THREE.Vector3(-1.5, 0.9, -1.2),
      new THREE.Vector3(-1.6, 0.2, -1.3),
      new THREE.Vector3(-1.55, 0, -1.3),
    ],
    [
      new THREE.Vector3(-0.1, 1.9, 0.1),
      new THREE.Vector3(-0.6, 1.75, 0.6),
      new THREE.Vector3(-1.0, 1.55, 1.1),
      new THREE.Vector3(-1.3, 1.0, 1.3),
      new THREE.Vector3(-1.4, 0.2, 1.35),
      new THREE.Vector3(-1.35, 0, 1.3),
    ],
    [
      new THREE.Vector3(0.15, 1.9, -0.15),
      new THREE.Vector3(0.5, 1.6, -0.7),
      new THREE.Vector3(0.55, 1.2, -1.15),
      new THREE.Vector3(0.4, 0.5, -1.25),
      new THREE.Vector3(0.35, 0.05, -1.25),
    ],
    [
      new THREE.Vector3(0.05, 1.85, 0.2),
      new THREE.Vector3(0.35, 1.5, 0.9),
      new THREE.Vector3(0.25, 0.9, 1.3),
      new THREE.Vector3(0.1, 0.2, 1.35),
      new THREE.Vector3(0.05, 0, 1.3),
    ],
  ];
  for (const path of rootPaths) {
    const worldPath = path.map((p) => p.clone().add(treeGroup.position).sub(treeGroup.position));
    const tendril = rootTendril(worldPath, 0.09, rootMat, shadows);
    treeGroup.add(tendril);
  }

  /* ---- falling leaves ---- */
  const leaves: THREE.Mesh[] = [];
  for (let i = 0; i < 14; i++) {
    const l = leafSprite(leafTex);
    l.position.set((rand() - 0.5) * 2.4 + treeGroup.position.x, rand() * 4, (rand() - 0.5) * 2.4 + treeGroup.position.z);
    l.userData.seed = rand() * 100;
    leaves.push(l);
    root.add(l);
  }

  /* ---- animation ---- */
  const CYCLE = 16;
  function updateAnimation(elapsed: number): void {
    canopyPivot.rotation.z = Math.sin(elapsed * 0.5) * 0.04;
    canopyPivot.rotation.x = Math.sin(elapsed * 0.37 + 1) * 0.03;
    trunk.rotation.z = Math.sin(elapsed * 0.5) * 0.015;

    for (const l of leaves) {
      const seed = l.userData.seed as number;
      const t = ((elapsed + seed) % CYCLE) / CYCLE;
      l.position.y = 4.2 - t * 4.4;
      l.position.x += Math.sin((elapsed + seed) * 1.6) * 0.002;
      l.rotation.x = elapsed * 1.5 + seed;
      l.rotation.y = elapsed * 1.1 + seed;
    }
  }

  updateAnimation(0);
  root.userData.tick = (_dt: number, elapsed: number): void => updateAnimation(elapsed);

  return root;
}

/* ============================================================ */
/* lights + background                                          */
/* ============================================================ */
export function createTaProhmLookDevLights(): THREE.Group {
  const lights = new THREE.Group();

  const key = new THREE.DirectionalLight(0xdcedc0, 2.0);
  key.position.set(3, 7, 4);
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

  const fill = new THREE.DirectionalLight(0x9fc9a0, 0.55);
  fill.position.set(-4, 3, -2);
  lights.add(fill);

  const dapple = new THREE.DirectionalLight(0xd7f0a8, 0.4);
  dapple.position.set(0, 6, -6);
  lights.add(dapple);

  lights.add(new THREE.HemisphereLight(0xcfe8b0, 0x3a3020, 0.5));
  return lights;
}

export function makeTaProhmBackground(): THREE.Color {
  return new THREE.Color(0x2f3d26);
}
