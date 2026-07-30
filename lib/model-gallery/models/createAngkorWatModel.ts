import * as THREE from 'three';

/**
 * Angkor Wat, rebuilt in code as a stylised low-poly/procedural miniature —
 * three tiered sandstone terraces, a central quincunx of five corncob-shaped
 * prasat towers (one tall central tower + four lower corner towers) linked by
 * pitched-roof galleries, a west causeway crossing the great moat, and a
 * perimeter enclosure wall.
 *
 * Live animation (looping ~24s): a pair of egrets circles the central tower,
 * the moat catches a slow shimmer, and warm late-afternoon light breathes
 * gently across the sandstone (subtle emissive pulse).
 */

export interface AngkorWatOptions {
  shadows?: boolean;
}

/* ---- palette ---- */
const COL = {
  sandstone: 0xb79b74,
  sandstoneDark: 0x8f7654,
  laterite: 0x6b5844,
  roofTile: 0x5a4632,
  water: 0x3c6e6a,
  waterDeep: 0x244f4d,
  grass: 0x4c6b3e,
  gold: 0xcda85a,
  bird: 0x2b2620,
};

function hex(n: number): string {
  return '#' + n.toString(16).padStart(6, '0');
}

/* ============================================================ */
/* texture helpers                                              */
/* ============================================================ */
function stoneTexture(base: number, w = 256, h = 256): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = hex(base);
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) {
    const shade = Math.random() * 0.14 - 0.07;
    ctx.fillStyle = shade > 0 ? `rgba(255,255,255,${shade})` : `rgba(0,0,0,${-shade})`;
    const bw = Math.random() * 3 + 1;
    ctx.fillRect(Math.random() * w, Math.random() * h, bw, bw);
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1;
  for (let y = 0; y < h; y += 18) {
    ctx.beginPath();
    ctx.moveTo(0, y + (Math.random() * 4 - 2));
    ctx.lineTo(w, y + (Math.random() * 4 - 2));
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(4, 2);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ============================================================ */
/* geometry helpers                                             */
/* ============================================================ */

/** Silhouette points (radius, height) for a tiered Khmer corncob prasat tower. */
function towerProfile(baseR: number, height: number, tiers: number): THREE.Vector2[] {
  const pts: THREE.Vector2[] = [];
  pts.push(new THREE.Vector2(baseR * 1.1, 0));
  pts.push(new THREE.Vector2(baseR * 1.1, height * 0.03));
  let y = height * 0.03;
  let r = baseR;
  const shaftH = height * 0.62;
  const tierH = shaftH / tiers;
  for (let i = 0; i < tiers; i++) {
    const rNext = r * 0.84;
    pts.push(new THREE.Vector2(r, y));
    pts.push(new THREE.Vector2(r * 0.9, y + tierH * 0.18));
    pts.push(new THREE.Vector2(rNext, y + tierH * 0.24));
    pts.push(new THREE.Vector2(rNext, y + tierH));
    y += tierH;
    r = rNext;
  }
  // rounded bud finial
  pts.push(new THREE.Vector2(r * 0.75, y + height * 0.1));
  pts.push(new THREE.Vector2(r * 0.4, y + height * 0.2));
  pts.push(new THREE.Vector2(r * 0.14, y + height * 0.28));
  pts.push(new THREE.Vector2(0.008, y + height * 0.34));
  return pts;
}

function khmerTower(
  baseR: number,
  height: number,
  tiers: number,
  mat: THREE.Material,
  shadows: boolean,
): THREE.Mesh {
  const geo = new THREE.LatheGeometry(towerProfile(baseR, height, tiers), 20);
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = shadows;
  m.receiveShadow = shadows;
  return m;
}

function pitchedGallery(
  length: number,
  width: number,
  wallH: number,
  roofH: number,
  matWall: THREE.Material,
  matRoof: THREE.Material,
  shadows: boolean,
): THREE.Group {
  const g = new THREE.Group();
  const wall = new THREE.Mesh(new THREE.BoxGeometry(length, wallH, width), matWall);
  wall.position.y = wallH / 2;
  wall.castShadow = shadows;
  wall.receiveShadow = shadows;
  g.add(wall);

  const shape = new THREE.Shape();
  shape.moveTo(-width / 2 - 0.05, 0);
  shape.lineTo(0, roofH);
  shape.lineTo(width / 2 + 0.05, 0);
  shape.closePath();
  const roofGeo = new THREE.ExtrudeGeometry(shape, { depth: length, bevelEnabled: false, curveSegments: 1 });
  roofGeo.rotateY(Math.PI / 2);
  roofGeo.translate(-length / 2, wallH, 0);
  const roof = new THREE.Mesh(roofGeo, matRoof);
  roof.castShadow = shadows;
  g.add(roof);
  return g;
}

function terrace(
  len: number,
  dep: number,
  h: number,
  mat: THREE.Material,
  shadows: boolean,
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(len, h, dep), mat);
  m.castShadow = shadows;
  m.receiveShadow = shadows;
  return m;
}

function birdShape(mat: THREE.Material): THREE.Mesh {
  const shape = new THREE.Shape();
  shape.moveTo(-0.09, 0);
  shape.quadraticCurveTo(0, 0.03, 0.09, 0);
  shape.quadraticCurveTo(0, -0.015, -0.09, 0);
  const geo = new THREE.ShapeGeometry(shape);
  const m = new THREE.Mesh(geo, mat);
  m.rotation.x = -Math.PI / 2;
  return m;
}

/* ============================================================ */
/* model                                                        */
/* ============================================================ */
export function createAngkorWatModel(options: AngkorWatOptions = {}): THREE.Group {
  const shadows = options.shadows ?? true;
  const root = new THREE.Group();

  /* ---- materials ---- */
  const matStone = new THREE.MeshPhysicalMaterial({
    color: COL.sandstone,
    map: stoneTexture(COL.sandstone),
    roughness: 0.85,
    metalness: 0.0,
    clearcoat: 0.05,
  });
  const matStoneDark = new THREE.MeshPhysicalMaterial({
    color: COL.sandstoneDark,
    map: stoneTexture(COL.sandstoneDark),
    roughness: 0.88,
    metalness: 0.0,
  });
  const matLaterite = new THREE.MeshStandardMaterial({ color: COL.laterite, roughness: 0.95, metalness: 0.0 });
  const matRoof = new THREE.MeshStandardMaterial({ color: COL.roofTile, roughness: 0.7, metalness: 0.05 });
  const matWater = new THREE.MeshPhysicalMaterial({
    color: COL.water,
    roughness: 0.15,
    metalness: 0.0,
    transmission: 0.35,
    thickness: 0.4,
    ior: 1.33,
    envMapIntensity: 1.2,
  });
  const matGrass = new THREE.MeshStandardMaterial({ color: COL.grass, roughness: 1.0 });
  const matBird = new THREE.MeshBasicMaterial({ color: COL.bird, side: THREE.DoubleSide });

  /* ---- ground + moat ---- */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 24), matGrass);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = shadows;
  root.add(ground);

  const moatOuter = new THREE.Mesh(new THREE.PlaneGeometry(20, 15.4), matWater);
  moatOuter.rotation.x = -Math.PI / 2;
  moatOuter.position.y = 0.0;
  moatOuter.receiveShadow = shadows;
  root.add(moatOuter);

  const islandPad = terrace(13.4, 9.4, 0.16, matLaterite, shadows);
  islandPad.position.y = 0.08;
  root.add(islandPad);

  /* ---- west causeway ---- */
  const causeway = terrace(6.2, 1.3, 0.14, matStone, shadows);
  causeway.position.set(-9.6, 0.07, 0);
  root.add(causeway);
  const nagaMat = matStoneDark;
  for (const side of [-1, 1]) {
    for (let i = 0; i < 10; i++) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.32, 8), nagaMat);
      post.position.set(-12.6 + i * 0.66, 0.16, side * 0.72);
      post.castShadow = shadows;
      root.add(post);
    }
  }

  /* ---- west entrance gopura (gate tower) ---- */
  const gopuraBase = terrace(2.2, 1.6, 0.5, matStone, shadows);
  gopuraBase.position.set(-6.6, 0.32, 0);
  root.add(gopuraBase);
  const gopuraTower = khmerTower(0.55, 2.1, 3, matStone, shadows);
  gopuraTower.position.set(-6.6, 0.57, 0);
  root.add(gopuraTower);

  /* ---- three tiered terraces ---- */
  const tierDefs = [
    { len: 11.5, dep: 8.6, h: 0.55, y: 0.16 },
    { len: 8.6, dep: 6.4, h: 0.55, y: 0.71 },
    { len: 6.0, dep: 4.6, h: 0.55, y: 1.26 },
  ];
  for (const t of tierDefs) {
    const tier = terrace(t.len, t.dep, t.h, matStone, shadows);
    tier.position.set(0.6, t.y + t.h / 2, 0);
    root.add(tier);
  }
  const topY = tierDefs[2].y + tierDefs[2].h;

  /* ---- perimeter enclosure gallery (mid tier) ---- */
  const encY = tierDefs[1].y + tierDefs[1].h;
  const encLen = tierDefs[1].len - 0.4;
  const encDep = tierDefs[1].dep - 0.4;
  const galN = pitchedGallery(encLen, 0.5, 0.55, 0.4, matStone, matRoof, shadows);
  galN.position.set(0.6, encY, encDep / 2);
  root.add(galN);
  const galS = pitchedGallery(encLen, 0.5, 0.55, 0.4, matStone, matRoof, shadows);
  galS.position.set(0.6, encY, -encDep / 2);
  root.add(galS);
  const galE = pitchedGallery(encDep, 0.5, 0.55, 0.4, matStone, matRoof, shadows);
  galE.rotation.y = Math.PI / 2;
  galE.position.set(0.6 + encLen / 2, encY, 0);
  root.add(galE);
  const galW = pitchedGallery(encDep, 0.5, 0.55, 0.4, matStone, matRoof, shadows);
  galW.rotation.y = Math.PI / 2;
  galW.position.set(0.6 - encLen / 2, encY, 0);
  root.add(galW);

  /* ---- quincunx of five towers on the top terrace ---- */
  const cornerOffset = 1.55;
  const central = khmerTower(0.85, 3.3, 5, matStone, shadows);
  central.position.set(0.6, topY, 0);
  root.add(central);

  const corners = [
    [cornerOffset, cornerOffset],
    [cornerOffset, -cornerOffset],
    [-cornerOffset, cornerOffset],
    [-cornerOffset, -cornerOffset],
  ];
  for (const [dx, dz] of corners) {
    const tower = khmerTower(0.5, 2.1, 4, matStoneDark, shadows);
    tower.position.set(0.6 + dx, topY, dz);
    root.add(tower);

    // short cruciform link gallery from the corner tower toward the centre
    const link = pitchedGallery(1.1, 0.35, 0.4, 0.28, matStoneDark, matRoof, shadows);
    link.rotation.y = Math.atan2(dz, dx) + Math.PI / 2;
    link.position.set(0.6 + dx * 0.55, topY, dz * 0.55);
    root.add(link);
  }

  /* ---- circling egrets ---- */
  const bird1 = birdShape(matBird);
  const bird2 = birdShape(matBird);
  root.add(bird1, bird2);

  /* ---- animation ---- */
  const CYCLE = 24;
  function updateAnimation(elapsed: number): void {
    const a1 = (elapsed / CYCLE) * Math.PI * 2;
    const a2 = a1 + Math.PI;
    const radius = 3.0;
    const flyH = topY + 3.6 + Math.sin(elapsed * 1.3) * 0.15;
    bird1.position.set(0.6 + Math.cos(a1) * radius, flyH, Math.sin(a1) * radius * 0.7);
    bird1.rotation.y = -a1 - Math.PI / 2;
    bird2.position.set(0.6 + Math.cos(a2) * radius * 0.8, flyH - 0.3, Math.sin(a2) * radius * 0.55);
    bird2.rotation.y = -a2 - Math.PI / 2;

    const shimmer = 0.9 + Math.sin(elapsed * 0.6) * 0.08;
    matWater.color.setHex(COL.water).multiplyScalar(shimmer);
    const warm = 1 + Math.sin(elapsed * 0.25) * 0.03;
    matStone.color.setHex(COL.sandstone).multiplyScalar(warm);
  }

  updateAnimation(0);
  root.userData.tick = (_dt: number, elapsed: number): void => updateAnimation(elapsed);

  return root;
}

/* ============================================================ */
/* lights + background                                          */
/* ============================================================ */
export function createAngkorWatLookDevLights(): THREE.Group {
  const lights = new THREE.Group();

  const key = new THREE.DirectionalLight(0xfff1d9, 2.4);
  key.position.set(-6, 8, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 40;
  const kc = key.shadow.camera as THREE.OrthographicCamera;
  kc.left = -16;
  kc.right = 16;
  kc.top = 16;
  kc.bottom = -16;
  key.shadow.bias = -0.0005;
  key.shadow.radius = 4;
  lights.add(key);

  const fill = new THREE.DirectionalLight(0xcfe0ff, 0.6);
  fill.position.set(6, 4, -3);
  lights.add(fill);

  const rim = new THREE.DirectionalLight(0xffe0b0, 0.5);
  rim.position.set(2, 3, -8);
  lights.add(rim);

  lights.add(new THREE.HemisphereLight(0xbfd6ff, 0x4c6b3e, 0.5));
  return lights;
}

export function makeAngkorWatBackground(): THREE.Color {
  return new THREE.Color(0xdcebf5);
}
