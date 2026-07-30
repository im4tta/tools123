import * as THREE from 'three';

/**
 * Erupting volcano diorama, built from primitives in the same style as the
 * rest of this set. Focus: a noise-textured rock cone rising from a mossy
 * ground disc, a glowing lava lake in the crater with a lava-flow streak
 * down one flank, a drifting smoke plume built from soft layered spheres,
 * and embers that pop and arc up out of the crater.
 *
 * Live animation (looping ~9s): the crater glow pulses steadily, smoke
 * puffs rise and fade on a staggered loop, and every cycle a stronger
 * "eruption" burst sends embers higher and briefly brightens the crater
 * light and lava-flow glow.
 */

export interface VolcanoOptions {
  shadows?: boolean;
}

const COL = {
  rock: 0x4a4038,
  rockDark: 0x2e2620,
  ground: 0x3d5c34,
  lava: 0xff5522,
  lavaBright: 0xffc94a,
  smoke: 0x8a8478,
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

function rockTex(): THREE.CanvasTexture {
  const t = textTexture((ctx, w, h) => {
    ctx.fillStyle = '#4a4038';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      const shade = Math.random() * 40 - 20;
      const c = Math.max(0, Math.min(255, 0x40 + shade));
      ctx.fillStyle = `rgba(${c},${c - 6},${c - 12},0.5)`;
      const x = Math.random() * w;
      const y = Math.random() * h;
      const s = 2 + Math.random() * 8;
      ctx.beginPath();
      ctx.arc(x, y, s, 0, Math.PI * 2);
      ctx.fill();
    }
  }, 512, 512);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 2);
  return t;
}

function groundTex(): THREE.CanvasTexture {
  return textTexture((ctx, w, h) => {
    ctx.fillStyle = '#3d5c34';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)';
      const x = Math.random() * w;
      const y = Math.random() * h;
      ctx.beginPath();
      ctx.arc(x, y, 2 + Math.random() * 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }, 512, 512);
}

export function createVolcanoModel(options: VolcanoOptions = {}): THREE.Group {
  const shadows = options.shadows ?? true;
  const root = new THREE.Group();

  const matRock = new THREE.MeshStandardMaterial({ color: COL.rock, map: rockTex(), roughness: 0.9 });
  const matRockDark = new THREE.MeshStandardMaterial({ color: COL.rockDark, roughness: 0.9 });
  const matGround = new THREE.MeshStandardMaterial({ color: COL.ground, map: groundTex(), roughness: 0.95 });
  const matLava = new THREE.MeshStandardMaterial({
    color: COL.lava,
    emissive: COL.lava,
    emissiveIntensity: 1.6,
    roughness: 0.4,
  });
  const matLavaBright = new THREE.MeshStandardMaterial({
    color: COL.lavaBright,
    emissive: COL.lavaBright,
    emissiveIntensity: 2.0,
    roughness: 0.3,
  });
  const matSmoke = new THREE.MeshStandardMaterial({
    color: COL.smoke,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    roughness: 1,
  });

  /* ---- ground ---- */
  const ground = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.3, 0.15, 48), matGround);
  ground.position.y = -0.075;
  ground.receiveShadow = shadows;
  root.add(ground);

  /* ---- cone mountain, flattened crater at the top ---- */
  const CONE_H = 1.6;
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 1.5, CONE_H, 24, 4, true), matRock);
  cone.position.y = CONE_H / 2;
  cone.castShadow = shadows;
  cone.receiveShadow = shadows;
  root.add(cone);

  const craterRim = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.06, 10, 24), matRock);
  craterRim.rotation.x = Math.PI / 2;
  craterRim.position.y = CONE_H;
  root.add(craterRim);

  const craterFloor = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.02, 24), matRockDark);
  craterFloor.position.y = CONE_H - 0.05;
  root.add(craterFloor);

  /* ---- lava lake in the crater ---- */
  const lavaLake = new THREE.Mesh(new THREE.CircleGeometry(0.26, 32), matLava);
  lavaLake.rotation.x = -Math.PI / 2;
  lavaLake.position.y = CONE_H - 0.03;
  root.add(lavaLake);

  const lavaCore = new THREE.Mesh(new THREE.CircleGeometry(0.13, 24), matLavaBright);
  lavaCore.rotation.x = -Math.PI / 2;
  lavaCore.position.y = CONE_H - 0.028;
  root.add(lavaCore);

  const craterLight = new THREE.PointLight(COL.lava, 1.2, 3.5, 2);
  craterLight.position.y = CONE_H + 0.15;
  root.add(craterLight);

  /* ---- lava flow streak down one flank ---- */
  const flowShape: THREE.Vector3[] = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const y = CONE_H - t * CONE_H * 0.85;
    const r = THREE.MathUtils.lerp(0.34, 1.1, t);
    flowShape.push(new THREE.Vector3(Math.sin(t * 2) * 0.06, y, r));
  }
  const flowCurve = new THREE.CatmullRomCurve3(flowShape);
  const flowGeo = new THREE.TubeGeometry(flowCurve, 30, 0.05, 6, false);
  const lavaFlow = new THREE.Mesh(flowGeo, matLava);
  root.add(lavaFlow);

  /* ---- smoke plume: staggered soft spheres drifting upward ---- */
  const SMOKE_COUNT = 7;
  const smokePuffs: THREE.Mesh[] = [];
  for (let i = 0; i < SMOKE_COUNT; i++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.14 + i * 0.02, 12, 10), matSmoke.clone());
    puff.userData.phase = i / SMOKE_COUNT;
    smokePuffs.push(puff);
    root.add(puff);
  }

  /* ---- embers: small glowing spheres that arc up out of the crater ---- */
  const EMBER_COUNT = 5;
  const embers: THREE.Mesh[] = [];
  for (let i = 0; i < EMBER_COUNT; i++) {
    const ember = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), matLavaBright.clone());
    ember.userData.phase = i / EMBER_COUNT;
    ember.userData.dir = (Math.random() - 0.5) * 0.4;
    embers.push(ember);
    root.add(ember);
  }

  /* ---- animation ---- */
  const CYCLE = 9.0;
  const SMOKE_RISE = 1.3;
  const PLUME_BASE_Y = CONE_H + 0.2;

  function updateAnimation(time: number): void {
    const t = time % CYCLE;
    const eruption = Math.max(0, 1 - Math.abs(t - 1.0) / 0.6);

    const glow = 1.6 + Math.sin(time * 2.2) * 0.2 + eruption * 1.2;
    matLava.emissiveIntensity = glow;
    matLavaBright.emissiveIntensity = glow * 1.2;
    craterLight.intensity = 1.0 + Math.sin(time * 2.2) * 0.2 + eruption * 1.8;

    smokePuffs.forEach((puff) => {
      const local = (time * 0.09 + (puff.userData.phase as number)) % 1;
      puff.position.set(
        Math.sin(local * 8 + (puff.userData.phase as number) * 10) * 0.08,
        PLUME_BASE_Y + local * SMOKE_RISE,
        Math.cos(local * 6) * 0.06,
      );
      const mat = puff.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.35 * Math.sin(local * Math.PI) * (1 + eruption * 0.6);
      puff.scale.setScalar(0.6 + local * 1.4);
    });

    embers.forEach((ember) => {
      const phase = ember.userData.phase as number;
      const dir = ember.userData.dir as number;
      const local = (time * 0.55 + phase) % 1;
      const height = (0.4 + eruption * 0.8) * Math.sin(local * Math.PI) * 1.4;
      ember.position.set(dir * local * 1.2, CONE_H + 0.05 + height, dir * 0.7 * local);
      const mat = ember.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 2.0 * (1 - local * 0.5);
      ember.visible = local < 0.95;
    });

    root.rotation.y = Math.sin(time * 0.05) * 0.03;
  }

  updateAnimation(0);
  root.userData.tick = (_dt: number, elapsed: number): void => updateAnimation(elapsed);

  return root;
}

export function createVolcanoLookDevLights(): THREE.Group {
  const lights = new THREE.Group();
  const key = new THREE.DirectionalLight(0xfff0e0, 2.2);
  key.position.set(3, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  lights.add(key);
  const fill = new THREE.DirectionalLight(0xdfe6ff, 0.4);
  fill.position.set(-4, 2, 3);
  lights.add(fill);
  lights.add(new THREE.HemisphereLight(0xffe8d0, 0x1a1610, 0.35));
  return lights;
}

export function makeVolcanoBackground(): THREE.Color {
  return new THREE.Color(0x2a2420);
}
