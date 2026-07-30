import * as THREE from 'three';

/**
 * Pirate-style treasure chest, built from primitives in the same style as
 * the rest of this set. Focus: a plank-textured wooden body bound with
 * riveted iron straps, a domed lid on a rear hinge, a front latch that
 * disengages before the lid lifts, and a jumbled pile of gold coins and
 * gems inside that catch the light.
 *
 * Live animation (looping ~7s): latch flips open, lid swings up on its
 * hinge, holds open while the gold glints, then swings back shut and the
 * latch re-engages.
 */

export interface TreasureChestOptions {
  shadows?: boolean;
}

const COL = {
  wood: 0x6b4226,
  woodDark: 0x4a2c18,
  iron: 0x2e2b28,
  ironLight: 0x4a453f,
  gold: 0xd9b143,
  goldBright: 0xf0d878,
  gem: 0x2fa8d1,
  gemDeep: 0x1a6e94,
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

function plankTex(): THREE.CanvasTexture {
  const t = textTexture((ctx, w, h) => {
    ctx.fillStyle = '#6b4226';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) {
      const y = (i / 6) * h;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)';
      ctx.fillRect(0, y, w, h / 6);
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 10 + Math.random() * 20, y + (Math.random() - 0.5) * 6);
      ctx.stroke();
    }
  }, 256, 256);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 1.5);
  return t;
}

export function createTreasureChestModel(options: TreasureChestOptions = {}): THREE.Group {
  const shadows = options.shadows ?? true;
  const root = new THREE.Group();

  const matWood = new THREE.MeshPhysicalMaterial({
    color: COL.wood,
    map: plankTex(),
    roughness: 0.75,
    metalness: 0,
    clearcoat: 0.15,
  });
  const matIron = new THREE.MeshStandardMaterial({ color: COL.iron, roughness: 0.55, metalness: 0.75 });
  const matIronLight = new THREE.MeshStandardMaterial({ color: COL.ironLight, roughness: 0.45, metalness: 0.8 });
  const matGold = new THREE.MeshPhysicalMaterial({
    color: COL.gold,
    roughness: 0.22,
    metalness: 1.0,
    clearcoat: 0.5,
    clearcoatRoughness: 0.2,
  });
  const matGoldBright = new THREE.MeshStandardMaterial({ color: COL.goldBright, roughness: 0.15, metalness: 1.0 });
  const matGem = new THREE.MeshPhysicalMaterial({
    color: COL.gem,
    roughness: 0.05,
    metalness: 0,
    transmission: 0.5,
    ior: 1.9,
    clearcoat: 1,
  });
  const matGemDeep = new THREE.MeshPhysicalMaterial({
    color: COL.gemDeep,
    roughness: 0.05,
    transmission: 0.4,
    ior: 1.9,
    clearcoat: 1,
  });

  /* ---- base box ---- */
  const BOX_W = 1.4;
  const BOX_D = 0.9;
  const BOX_H = 0.7;
  const base = new THREE.Mesh(new THREE.BoxGeometry(BOX_W, BOX_H, BOX_D), matWood);
  base.position.y = BOX_H / 2;
  base.castShadow = shadows;
  base.receiveShadow = shadows;
  root.add(base);

  /* iron corner straps + bands */
  function band(w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material): void {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = shadows;
    root.add(m);
  }
  band(BOX_W + 0.02, 0.08, BOX_D + 0.02, 0, BOX_H * 0.28, 0, matIron);
  band(BOX_W + 0.02, 0.08, BOX_D + 0.02, 0, BOX_H * 0.85, 0, matIron);
  for (const sx of [-1, 1]) {
    band(0.1, BOX_H + 0.02, BOX_D + 0.02, sx * (BOX_W / 2 - 0.02), BOX_H / 2, 0, matIronLight);
  }

  /* rivets */
  const rivetGeo = new THREE.SphereGeometry(0.02, 10, 8);
  for (const y of [BOX_H * 0.28, BOX_H * 0.85]) {
    for (let i = -3; i <= 3; i++) {
      if (i === 0) continue;
      const rivet = new THREE.Mesh(rivetGeo, matGoldBright);
      rivet.position.set((i / 3.5) * (BOX_W / 2 - 0.06), y, BOX_D / 2 + 0.01);
      root.add(rivet);
    }
  }

  /* ---- domed lid, hinged at the back ---- */
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, BOX_H, -BOX_D / 2 + 0.05);
  root.add(lidPivot);

  const lidGroup = new THREE.Group();
  lidPivot.add(lidGroup);

  const domeGeo = new THREE.SphereGeometry(BOX_W / 2 + 0.02, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.5);
  domeGeo.scale(1, 0.62, (BOX_D + 0.04) / (BOX_W + 0.04));
  const dome = new THREE.Mesh(domeGeo, matWood);
  dome.position.z = BOX_D / 2 - 0.05;
  dome.castShadow = shadows;
  lidGroup.add(dome);

  const lidBand = new THREE.Mesh(new THREE.TorusGeometry(BOX_W / 2 - 0.03, 0.035, 8, 4, Math.PI), matIron);
  lidBand.rotation.set(Math.PI / 2, 0, Math.PI / 2);
  lidBand.scale.set(1, (BOX_D + 0.04) / (BOX_W + 0.04), 1);
  lidBand.position.set(0, BOX_H * 0.62 - BOX_H, BOX_D / 2 - 0.05);
  lidGroup.add(lidBand);

  for (const x of [-BOX_W * 0.32, BOX_W * 0.32]) {
    const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.14, 16), matIronLight);
    hinge.rotation.x = Math.PI / 2;
    hinge.position.set(x, 0, 0);
    lidPivot.add(hinge);
  }

  /* ---- front latch: swings open before the lid lifts ---- */
  const latchPivot = new THREE.Group();
  latchPivot.position.set(0, BOX_H * 0.55, BOX_D / 2 + 0.02);
  root.add(latchPivot);
  const latch = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.03), matIron);
  latch.position.y = -0.08;
  latch.castShadow = shadows;
  latchPivot.add(latch);
  const latchLoop = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 8, 16), matGoldBright);
  latchLoop.position.y = -0.16;
  latchPivot.add(latchLoop);

  /* ---- gold + gems inside ---- */
  const hoard = new THREE.Group();
  hoard.position.set(0, BOX_H - 0.06, -0.05);
  root.add(hoard);
  const coinGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.02, 20);
  for (let i = 0; i < 22; i++) {
    const coin = new THREE.Mesh(coinGeo, i % 3 === 0 ? matGoldBright : matGold);
    coin.position.set(
      (Math.random() - 0.5) * (BOX_W - 0.3),
      Math.random() * 0.18,
      (Math.random() - 0.5) * (BOX_D - 0.3),
    );
    coin.rotation.set(Math.random() * 0.6, Math.random() * Math.PI, Math.random() * 0.6);
    coin.castShadow = shadows;
    hoard.add(coin);
  }
  const gemGeo = new THREE.OctahedronGeometry(0.08, 0);
  for (let i = 0; i < 6; i++) {
    const gem = new THREE.Mesh(gemGeo, i % 2 === 0 ? matGem : matGemDeep);
    gem.position.set((Math.random() - 0.5) * (BOX_W - 0.4), 0.1 + Math.random() * 0.1, (Math.random() - 0.5) * (BOX_D - 0.4));
    gem.rotation.set(Math.random(), Math.random(), Math.random());
    gem.castShadow = shadows;
    hoard.add(gem);
  }

  /* ---- animation ---- */
  const CYCLE = 7.0;
  const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const smooth = (x: number, a: number, b: number): number =>
    easeInOut(THREE.MathUtils.clamp((x - a) / (b - a), 0, 1));
  const LID_OPEN_ANGLE = -2.1;

  function updateAnimation(time: number): void {
    const t = time % CYCLE;
    const latchOpen = smooth(t, 0.2, 0.6);
    const latchClose = smooth(t, 5.6, 6.0);
    latchPivot.rotation.x = -(latchOpen - latchClose) * 1.4;

    const lidOpen = smooth(t, 0.7, 1.8);
    const lidClose = smooth(t, 5.4, 6.4);
    lidPivot.rotation.x = LID_OPEN_ANGLE * (lidOpen - lidClose);

    const openAmt = lidOpen - lidClose;
    hoard.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      const mat = mesh.material as THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial;
      const glint = 0.5 + 0.5 * Math.sin(time * 3 + i * 1.3);
      if ('emissiveIntensity' in mat) {
        // no emissive by default; use a subtle env-driven bounce instead
      }
      mesh.position.y = (child.userData.baseY ?? (child.userData.baseY = mesh.position.y)) + (openAmt > 0.5 ? glint * 0.003 : 0);
    });

    root.rotation.y = Math.sin(time * 0.15) * 0.06;
  }

  updateAnimation(0);
  root.userData.tick = (_dt: number, elapsed: number): void => updateAnimation(elapsed);

  return root;
}

export function createTreasureChestLookDevLights(): THREE.Group {
  const lights = new THREE.Group();
  const key = new THREE.DirectionalLight(0xfff0d0, 2.6);
  key.position.set(3, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  lights.add(key);
  const fill = new THREE.DirectionalLight(0xdfe6ff, 0.5);
  fill.position.set(-4, 2, 3);
  lights.add(fill);
  const rim = new THREE.DirectionalLight(0xffe8b0, 0.6);
  rim.position.set(-2, 3, -5);
  lights.add(rim);
  lights.add(new THREE.HemisphereLight(0xfff0d8, 0x2a1e10, 0.4));
  return lights;
}

export function makeTreasureChestBackground(): THREE.Color {
  return new THREE.Color(0x1a140d);
}
