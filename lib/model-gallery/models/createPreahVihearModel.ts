import * as THREE from 'three';

/**
 * Preah Vihear, rebuilt in code as a mountain-ridge sanctuary — a long naga
 * causeway climbing in stepped terraces past a row of gopura gate towers to
 * a sanctuary perched at the very edge of a sheer escarpment, with drifting
 * valley mist far below.
 *
 * Live animation (looping ~26s): layered mist banks drift across the valley,
 * a raptor soars in slow circles below the cliff line, and sunlight breathes
 * gently across the sandstone.
 */

export interface PreahVihearOptions {
  shadows?: boolean;
}

/* ---- palette ---- */
const COL = {
  stone: 0xab8f6c,
  stoneDark: 0x8a7150,
  laterite: 0x6e5138,
  roof: 0x554330,
  mist: 0xe7edf2,
  cliffRock: 0x5b5044,
  bird: 0x272320,
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
  for (let i = 0; i < 900; i++) {
    const shade = Math.random() * 0.15 - 0.075;
    ctx.fillStyle = shade > 0 ? `rgba(255,255,255,${shade})` : `rgba(0,0,0,${-shade})`;
    const s = Math.random() * 3 + 1;
    ctx.fillRect(Math.random() * w, Math.random() * h, s, s);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(5, 1.5);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ============================================================ */
/* geometry helpers                                              */
/* ============================================================ */
function towerProfile(baseR: number, height: number, tiers: number): THREE.Vector2[] {
  const pts: THREE.Vector2[] = [];
  pts.push(new THREE.Vector2(baseR * 1.1, 0));
  pts.push(new THREE.Vector2(baseR * 1.1, height * 0.04));
  let y = height * 0.04;
  let r = baseR;
  const shaftH = height * 0.65;
  const tierH = shaftH / tiers;
  for (let i = 0; i < tiers; i++) {
    const rNext = r * 0.85;
    pts.push(new THREE.Vector2(r, y));
    pts.push(new THREE.Vector2(r * 0.9, y + tierH * 0.2));
    pts.push(new THREE.Vector2(rNext, y + tierH * 0.26));
    pts.push(new THREE.Vector2(rNext, y + tierH));
    y += tierH;
    r = rNext;
  }
  pts.push(new THREE.Vector2(r * 0.72, y + height * 0.1));
  pts.push(new THREE.Vector2(r * 0.36, y + height * 0.19));
  pts.push(new THREE.Vector2(0.01, y + height * 0.26));
  return pts;
}

function khmerTower(baseR: number, height: number, tiers: number, mat: THREE.Material, shadows: boolean): THREE.Mesh {
  const geo = new THREE.LatheGeometry(towerProfile(baseR, height, tiers), 18);
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = shadows;
  m.receiveShadow = shadows;
  return m;
}

function gopura(width: number, height: number, mat: THREE.Material, matRoof: THREE.Material, shadows: boolean): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, width * 0.9), mat);
  body.position.y = height / 2;
  body.castShadow = shadows;
  body.receiveShadow = shadows;
  g.add(body);
  const tower = khmerTower(width * 0.32, height * 0.9, 3, mat, shadows);
  tower.position.y = height;
  g.add(tower);
  const opening = new THREE.Mesh(new THREE.BoxGeometry(width * 0.32, height * 0.55, width), matRoof);
  opening.position.y = height * 0.3;
  g.add(opening);
  return g;
}

function terraceStep(len: number, dep: number, h: number, mat: THREE.Material, shadows: boolean): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(len, h, dep), mat);
  m.castShadow = shadows;
  m.receiveShadow = shadows;
  return m;
}

function mistBank(w: number, h: number, mat: THREE.Material): THREE.Mesh {
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
}

function birdShape(mat: THREE.Material): THREE.Mesh {
  const shape = new THREE.Shape();
  shape.moveTo(-0.11, 0);
  shape.quadraticCurveTo(0, 0.035, 0.11, 0);
  shape.quadraticCurveTo(0, -0.018, -0.11, 0);
  const m = new THREE.Mesh(new THREE.ShapeGeometry(shape), mat);
  m.rotation.x = -Math.PI / 2;
  return m;
}

/* ============================================================ */
/* model                                                         */
/* ============================================================ */
export function createPreahVihearModel(options: PreahVihearOptions = {}): THREE.Group {
  const shadows = options.shadows ?? true;
  const root = new THREE.Group();

  /* ---- materials ---- */
  const matStone = new THREE.MeshPhysicalMaterial({
    color: COL.stone,
    map: stoneTexture(COL.stone),
    roughness: 0.85,
    metalness: 0.0,
  });
  const matStoneDark = new THREE.MeshStandardMaterial({ color: COL.stoneDark, roughness: 0.9, metalness: 0.0 });
  const matLaterite = new THREE.MeshStandardMaterial({ color: COL.laterite, roughness: 0.95, metalness: 0.0 });
  const matRoof = new THREE.MeshStandardMaterial({ color: COL.roof, roughness: 0.7, metalness: 0.05 });
  const matCliff = new THREE.MeshStandardMaterial({ color: COL.cliffRock, roughness: 1.0 });
  const matMist = new THREE.MeshBasicMaterial({ color: COL.mist, transparent: true, opacity: 0.35, depthWrite: false });
  const matBird = new THREE.MeshBasicMaterial({ color: COL.bird, side: THREE.DoubleSide });

  /* ---- the ridge: a rising staircase of terraces along Z toward the cliff edge ---- */
  const N_STEPS = 7;
  let z = -8;
  let y = 0;
  const stepDepth = 1.9;
  for (let i = 0; i < N_STEPS; i++) {
    const h = 0.28 + (i % 2 === 0 ? 0.06 : 0);
    const w = 3.6 - i * 0.12;
    const step = terraceStep(w, stepDepth, h, i % 2 === 0 ? matStone : matLaterite, shadows);
    step.position.set(0, y + h / 2, z);
    root.add(step);

    // naga balustrade posts along the edges of every other terrace
    if (i % 2 === 1) {
      for (const side of [-1, 1]) {
        for (let p = 0; p < 4; p++) {
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.24, 6), matStoneDark);
          post.position.set(side * (w / 2 - 0.1), y + h + 0.12, z - stepDepth / 2 + 0.3 + p * 0.45);
          post.castShadow = shadows;
          root.add(post);
        }
      }
    }

    // a gopura gate tower at every third step
    if (i % 3 === 0) {
      const g = gopura(1.5, 1.5 + i * 0.08, matStone, matRoof, shadows);
      g.position.set(0, y + h, z);
      root.add(g);
    }

    y += h + 0.02;
    z += stepDepth;
  }

  /* ---- sanctuary at the cliff edge ---- */
  const sanctuaryPad = terraceStep(4.4, 3.4, 0.4, matStone, shadows);
  sanctuaryPad.position.set(0, y + 0.2, z + 0.6);
  root.add(sanctuaryPad);
  const sanctuaryTower = khmerTower(0.75, 2.6, 4, matStone, shadows);
  sanctuaryTower.position.set(0, y + 0.4, z + 0.6);
  root.add(sanctuaryTower);
  for (const dx of [-1.4, 1.4]) {
    const wing = terraceStep(1.1, 2.0, 1.1, matStoneDark, shadows);
    wing.position.set(dx, y + 0.4 + 0.55, z + 0.5);
    root.add(wing);
  }

  /* ---- the escarpment ---- */
  const cliffTop = z + 2.2;
  const cliffGeo = new THREE.PlaneGeometry(14, 10, 1, 1);
  const cliff = new THREE.Mesh(cliffGeo, matCliff);
  cliff.rotation.x = Math.PI / 2.6;
  cliff.position.set(0, y - 3.5, cliffTop + 1.5);
  cliff.receiveShadow = shadows;
  root.add(cliff);

  const valleyFloor = new THREE.Mesh(new THREE.PlaneGeometry(30, 20), new THREE.MeshStandardMaterial({ color: 0x3c4a34, roughness: 1 }));
  valleyFloor.rotation.x = -Math.PI / 2;
  valleyFloor.position.set(0, -6, cliffTop + 10);
  root.add(valleyFloor);

  /* ---- layered drifting mist ---- */
  const mist1 = mistBank(10, 2.2, matMist);
  mist1.position.set(0, -1.5, cliffTop + 4);
  root.add(mist1);
  const mist2Mat = matMist.clone();
  const mist2 = mistBank(8, 1.6, mist2Mat);
  mist2.position.set(0, -2.6, cliffTop + 6.5);
  root.add(mist2);

  /* ---- soaring raptor below the cliff ---- */
  const bird = birdShape(matBird);
  root.add(bird);

  /* ---- animation ---- */
  const CYCLE = 26;
  function updateAnimation(elapsed: number): void {
    mist1.position.x = Math.sin(elapsed * 0.12) * 2.5;
    mist1.position.y = -1.5 + Math.sin(elapsed * 0.2) * 0.15;
    mist2.position.x = Math.cos(elapsed * 0.09) * 3.0;
    mist2.position.y = -2.6 + Math.sin(elapsed * 0.17 + 1) * 0.18;

    const a = (elapsed / CYCLE) * Math.PI * 2;
    const bx = Math.cos(a) * 3.2;
    const bz = cliffTop + 5 + Math.sin(a) * 2.4;
    bird.position.set(bx, -2.0 + Math.sin(elapsed * 0.6) * 0.2, bz);
    bird.rotation.y = -a - Math.PI / 2;

    const warm = 1 + Math.sin(elapsed * 0.22) * 0.03;
    matStone.color.setHex(COL.stone).multiplyScalar(warm);
  }

  updateAnimation(0);
  root.userData.tick = (_dt: number, elapsed: number): void => updateAnimation(elapsed);

  return root;
}

/* ============================================================ */
/* lights + background                                           */
/* ============================================================ */
export function createPreahVihearLookDevLights(): THREE.Group {
  const lights = new THREE.Group();

  const key = new THREE.DirectionalLight(0xfff0d5, 2.5);
  key.position.set(4, 8, -3);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 30;
  const kc = key.shadow.camera as THREE.OrthographicCamera;
  kc.left = -10;
  kc.right = 10;
  kc.top = 10;
  kc.bottom = -10;
  key.shadow.bias = -0.0005;
  key.shadow.radius = 4;
  lights.add(key);

  const fill = new THREE.DirectionalLight(0xcfe0ff, 0.55);
  fill.position.set(-5, 3, 4);
  lights.add(fill);

  const haze = new THREE.DirectionalLight(0xe9eef5, 0.4);
  haze.position.set(0, 2, 10);
  lights.add(haze);

  lights.add(new THREE.HemisphereLight(0xdfe9f2, 0x4a4232, 0.5));
  return lights;
}

export function makePreahVihearBackground(): THREE.Color {
  return new THREE.Color(0xc3d4dd);
}
