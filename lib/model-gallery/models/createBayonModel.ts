import * as THREE from 'three';

/**
 * The Bayon, rebuilt in code as a stylised mountain-temple of face-towers —
 * a cruciform laterite terrace crowded with stubby prasat towers, each
 * carrying four huge serene stone faces (drawn procedurally onto canvas
 * decals) looking out to the cardinal directions, plus a colonnaded outer
 * gallery and a pair of flickering stone braziers.
 *
 * Live animation (looping ~14s): the braziers flicker and drift thin smoke,
 * and a slow warm pulse breathes across the faces' half-closed eyes, evoking
 * torchlit dusk at Angkor Thom.
 */

export interface BayonOptions {
  shadows?: boolean;
}

/* ---- palette ---- */
const COL = {
  stone: 0x7d7263,
  stoneDark: 0x5d5448,
  stoneLight: 0x958a78,
  moss: 0x5c6b45,
  fire: 0xff8a3d,
  smoke: 0xc9c4ba,
  faceLine: 0x2c2620,
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
  h = 512,
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
  for (let i = 0; i < 1000; i++) {
    const shade = Math.random() * 0.16 - 0.08;
    ctx.fillStyle = shade > 0 ? `rgba(255,255,255,${shade})` : `rgba(0,0,0,${-shade})`;
    const s = Math.random() * 3 + 1;
    ctx.fillRect(Math.random() * w, Math.random() * h, s, s);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Serene, half-closed "Bayon smile" face, drawn with simple canvas primitives. */
function faceTexture(): THREE.CanvasTexture {
  return textTexture((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = hex(COL.faceLine);
    ctx.fillStyle = hex(COL.faceLine);
    ctx.lineCap = 'round';

    // brows
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(w * 0.22, h * 0.34);
    ctx.quadraticCurveTo(w * 0.33, h * 0.27, w * 0.44, h * 0.34);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w * 0.56, h * 0.34);
    ctx.quadraticCurveTo(w * 0.67, h * 0.27, w * 0.78, h * 0.34);
    ctx.stroke();

    // downcast half-closed eyes
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(w * 0.26, h * 0.41);
    ctx.quadraticCurveTo(w * 0.335, h * 0.455, w * 0.41, h * 0.41);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w * 0.59, h * 0.41);
    ctx.quadraticCurveTo(w * 0.665, h * 0.455, w * 0.74, h * 0.41);
    ctx.stroke();

    // broad nose
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.37);
    ctx.lineTo(w * 0.45, h * 0.58);
    ctx.quadraticCurveTo(w * 0.5, h * 0.63, w * 0.55, h * 0.58);
    ctx.stroke();

    // the famous wide serene smile
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(w * 0.28, h * 0.67);
    ctx.quadraticCurveTo(w * 0.5, h * 0.79, w * 0.72, h * 0.67);
    ctx.stroke();

    // ear hints
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(w * 0.16, h * 0.36);
    ctx.quadraticCurveTo(w * 0.1, h * 0.5, w * 0.16, h * 0.66);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w * 0.84, h * 0.36);
    ctx.quadraticCurveTo(w * 0.9, h * 0.5, w * 0.84, h * 0.66);
    ctx.stroke();
  });
}

function decal(tex: THREE.Texture, w: number, h: number): THREE.Mesh {
  const m = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
}

/* ============================================================ */
/* geometry helpers                                             */
/* ============================================================ */
function towerProfile(baseR: number, blockY: number, blockR: number, topY: number): THREE.Vector2[] {
  return [
    new THREE.Vector2(baseR * 1.08, 0),
    new THREE.Vector2(baseR, blockY * 0.15),
    new THREE.Vector2(baseR * 0.94, blockY * 0.4),
    new THREE.Vector2(blockR, blockY * 0.55),
    new THREE.Vector2(blockR, blockY),
    new THREE.Vector2(blockR * 0.7, blockY + (topY - blockY) * 0.35),
    new THREE.Vector2(blockR * 0.32, blockY + (topY - blockY) * 0.7),
    new THREE.Vector2(0.01, topY),
  ];
}

/** A stubby Bayon face-tower: tapered shaft, a wide face-block with four
 *  outward-facing decals, and a small rounded finial. */
function faceTower(
  baseR: number,
  height: number,
  mat: THREE.Material,
  faceTex: THREE.Texture,
  shadows: boolean,
): THREE.Group {
  const g = new THREE.Group();
  const blockY = height * 0.42;
  const blockR = baseR * 1.15;
  const geo = new THREE.LatheGeometry(towerProfile(baseR, blockY, blockR, height), 16);
  const shaft = new THREE.Mesh(geo, mat);
  shaft.castShadow = shadows;
  shaft.receiveShadow = shadows;
  g.add(shaft);

  const faceSize = blockR * 1.55;
  for (let i = 0; i < 4; i++) {
    const face = decal(faceTex, faceSize, faceSize * 1.15);
    const ang = (Math.PI / 2) * i;
    face.position.set(Math.sin(ang) * (blockR + 0.01), blockY * 0.72, Math.cos(ang) * (blockR + 0.01));
    face.rotation.y = ang;
    g.add(face);
  }
  return g;
}

function terrace(len: number, dep: number, h: number, mat: THREE.Material, shadows: boolean): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(len, h, dep), mat);
  m.castShadow = shadows;
  m.receiveShadow = shadows;
  return m;
}

function colonnade(length: number, mat: THREE.Material, count: number, shadows: boolean): THREE.Group {
  const g = new THREE.Group();
  const roof = new THREE.Mesh(new THREE.BoxGeometry(length, 0.08, 0.5), mat);
  roof.position.y = 1.0;
  roof.castShadow = shadows;
  g.add(roof);
  for (let i = 0; i < count; i++) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.0, 8), mat);
    col.position.set(-length / 2 + (i + 0.5) * (length / count), 0.5, 0);
    col.castShadow = shadows;
    g.add(col);
  }
  return g;
}

function brazier(mat: THREE.Material, matFire: THREE.Material): { group: THREE.Group; flame: THREE.Mesh; light: THREE.PointLight } {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 0.5, 10), mat);
  base.position.y = 0.25;
  g.add(base);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.1, 0.12, 10), mat);
  bowl.position.y = 0.56;
  g.add(bowl);
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 8), matFire);
  flame.position.y = 0.7;
  g.add(flame);
  const light = new THREE.PointLight(0xff9a4d, 1.2, 3.5, 2);
  light.position.y = 0.75;
  g.add(light);
  return { group: g, flame, light };
}

/* ============================================================ */
/* model                                                        */
/* ============================================================ */
export function createBayonModel(options: BayonOptions = {}): THREE.Group {
  const shadows = options.shadows ?? true;
  const root = new THREE.Group();

  /* ---- materials ---- */
  const matStone = new THREE.MeshPhysicalMaterial({
    color: COL.stone,
    map: stoneTexture(COL.stone),
    roughness: 0.86,
    metalness: 0.0,
  });
  const matStoneLight = new THREE.MeshPhysicalMaterial({
    color: COL.stoneLight,
    map: stoneTexture(COL.stoneLight),
    roughness: 0.82,
    metalness: 0.0,
  });
  const matStoneDark = new THREE.MeshStandardMaterial({ color: COL.stoneDark, roughness: 0.9, metalness: 0.0 });
  const matMoss = new THREE.MeshStandardMaterial({ color: COL.moss, roughness: 1.0 });
  const matFire = new THREE.MeshBasicMaterial({ color: COL.fire });
  const faceTex = faceTexture();

  /* ---- ground ---- */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), matMoss);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = shadows;
  root.add(ground);

  /* ---- cruciform terrace ---- */
  const baseTerrace = terrace(9.5, 9.5, 0.3, matStoneDark, shadows);
  baseTerrace.position.y = 0.15;
  root.add(baseTerrace);
  const midTerrace = terrace(6.6, 6.6, 0.35, matStone, shadows);
  midTerrace.position.y = 0.475;
  root.add(midTerrace);
  const topTerrace = terrace(4.4, 4.4, 0.35, matStoneLight, shadows);
  topTerrace.position.y = 0.825;
  root.add(topTerrace);
  const topY = 1.0;

  /* ---- outer colonnaded gallery ring ---- */
  for (const side of [-1, 1]) {
    const galNS = colonnade(9.0, matStoneDark, 9, shadows);
    galNS.position.set(0, 0.3, side * 4.6);
    root.add(galNS);
    const galEW = colonnade(9.0, matStoneDark, 9, shadows);
    galEW.rotation.y = Math.PI / 2;
    galEW.position.set(side * 4.6, 0.3, 0);
    root.add(galEW);
  }

  /* ---- cluster of face-towers on the summit ---- */
  type TowerDef = { x: number; z: number; r: number; h: number };
  const towers: TowerDef[] = [
    { x: 0, z: 0, r: 0.62, h: 2.7 },
    { x: 1.1, z: 0.6, r: 0.42, h: 2.0 },
    { x: -1.1, z: 0.6, r: 0.42, h: 2.0 },
    { x: 1.1, z: -0.6, r: 0.42, h: 1.9 },
    { x: -1.1, z: -0.6, r: 0.42, h: 1.9 },
    { x: 0, z: 1.35, r: 0.34, h: 1.55 },
    { x: 0, z: -1.35, r: 0.34, h: 1.5 },
    { x: 1.9, z: 0, r: 0.3, h: 1.4 },
    { x: -1.9, z: 0, r: 0.3, h: 1.4 },
  ];
  for (const t of towers) {
    const mat = t.r > 0.5 ? matStoneLight : matStone;
    const tower = faceTower(t.r, t.h, mat, faceTex, shadows);
    tower.position.set(t.x, topY, t.z);
    root.add(tower);
  }

  /* ---- braziers flanking the entry stair ---- */
  const b1 = brazier(matStoneDark, matFire);
  b1.group.position.set(-0.9, topY, 2.6);
  root.add(b1.group);
  const b2 = brazier(matStoneDark, matFire);
  b2.group.position.set(0.9, topY, 2.6);
  root.add(b2.group);

  /* ---- drifting smoke wisps ---- */
  const smokeMat = new THREE.MeshBasicMaterial({ color: COL.smoke, transparent: true, opacity: 0.25 });
  const smoke1 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), smokeMat);
  const smoke2 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), smokeMat.clone());
  root.add(smoke1, smoke2);

  /* ---- animation ---- */
  const CYCLE = 14;
  function updateAnimation(elapsed: number): void {
    const flicker1 = 0.9 + Math.sin(elapsed * 9) * 0.15 + Math.sin(elapsed * 23) * 0.08;
    const flicker2 = 0.9 + Math.sin(elapsed * 8 + 1.7) * 0.15 + Math.sin(elapsed * 19 + 0.4) * 0.08;
    b1.light.intensity = 1.1 * flicker1;
    b1.flame.scale.set(1, flicker1, 1);
    b2.light.intensity = 1.1 * flicker2;
    b2.flame.scale.set(1, flicker2, 1);

    const s1t = (elapsed % 3.5) / 3.5;
    smoke1.position.set(-0.9 + Math.sin(elapsed * 1.4) * 0.06, topY + 0.75 + s1t * 1.1, 2.6);
    (smoke1.material as THREE.MeshBasicMaterial).opacity = 0.28 * (1 - s1t);
    smoke1.scale.setScalar(1 + s1t * 1.8);

    const s2t = ((elapsed + 1.8) % 3.5) / 3.5;
    smoke2.position.set(0.9 + Math.sin(elapsed * 1.1 + 0.6) * 0.06, topY + 0.75 + s2t * 1.1, 2.6);
    (smoke2.material as THREE.MeshBasicMaterial).opacity = 0.24 * (1 - s2t);
    smoke2.scale.setScalar(1 + s2t * 1.8);

    const pulse = 0.5 + 0.5 * Math.sin((elapsed / CYCLE) * Math.PI * 2);
    matStoneLight.emissive.setRGB(0.06 * pulse, 0.04 * pulse, 0.02 * pulse);
  }

  updateAnimation(0);
  root.userData.tick = (_dt: number, elapsed: number): void => updateAnimation(elapsed);

  return root;
}

/* ============================================================ */
/* lights + background                                          */
/* ============================================================ */
export function createBayonLookDevLights(): THREE.Group {
  const lights = new THREE.Group();

  const key = new THREE.DirectionalLight(0xffd9ad, 2.2);
  key.position.set(5, 6, -4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 30;
  const kc = key.shadow.camera as THREE.OrthographicCamera;
  kc.left = -8;
  kc.right = 8;
  kc.top = 8;
  kc.bottom = -8;
  key.shadow.bias = -0.0005;
  key.shadow.radius = 4;
  lights.add(key);

  const fill = new THREE.DirectionalLight(0x9fb6ff, 0.45);
  fill.position.set(-5, 3, 3);
  lights.add(fill);

  const rim = new THREE.DirectionalLight(0xffb877, 0.6);
  rim.position.set(-3, 4, -6);
  lights.add(rim);

  lights.add(new THREE.HemisphereLight(0x8899bb, 0x3a3226, 0.45));
  return lights;
}

export function makeBayonBackground(): THREE.Color {
  return new THREE.Color(0x3a3648);
}
