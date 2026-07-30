import * as THREE from 'three';

/**
 * Belt-drive vinyl turntable, built from primitives in the same style as
 * the rest of this set. Focus: a walnut-veneer plinth, an aluminium platter
 * under a spinning record with an etched label and groove rings, a
 * counterweighted tonearm that genuinely swings from its rest to the
 * record's edge and lowers the stylus, and a small backlit power LED.
 *
 * Live animation (looping ~10s): platter spins continuously at a constant
 * rate; the tonearm lifts, swings in over the record, drops onto the
 * groove, "plays" for a few seconds, then lifts and swings back to rest.
 */

export interface TurntableOptions {
  shadows?: boolean;
}

const COL = {
  walnut: 0x4a2f1e,
  walnutDark: 0x33200f,
  platter: 0x111214,
  aluminium: 0xc7cbd1,
  vinylBlack: 0x0a0a0c,
  label: 0xd6483a,
  chrome: 0xe4e6ea,
  led: 0x35d16b,
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

function recordTopTex(): THREE.CanvasTexture {
  return textTexture((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    ctx.fillStyle = '#0a0a0c';
    ctx.beginPath();
    ctx.arc(cx, cy, w / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let r = w * 0.16; r < w * 0.49; r += 3) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    // label
    ctx.fillStyle = '#d6483a';
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2e6c8';
    ctx.textAlign = 'center';
    ctx.font = '700 20px Georgia, serif';
    ctx.fillText('SIDE A', cx, cy - 4);
    ctx.font = '400 12px Arial';
    ctx.fillText('33 1/3 RPM', cx, cy + 16);
    ctx.fillStyle = '#0a0a0c';
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.012, 0, Math.PI * 2);
    ctx.fill();
  }, 640, 640);
}

function veneerTex(): THREE.CanvasTexture {
  return textTexture((ctx, w, h) => {
    ctx.fillStyle = '#4a2f1e';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    for (let i = 0; i < 40; i++) {
      const y = (i / 40) * h + Math.sin(i) * 4;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(w * 0.3, y + 6, w * 0.7, y - 6, w, y);
      ctx.stroke();
    }
  }, 256, 256);
}

export function createTurntableModel(options: TurntableOptions = {}): THREE.Group {
  const shadows = options.shadows ?? true;
  const root = new THREE.Group();

  const veneer = veneerTex();
  veneer.wrapS = veneer.wrapT = THREE.RepeatWrapping;
  veneer.repeat.set(2, 2);
  const matPlinth = new THREE.MeshPhysicalMaterial({
    color: COL.walnut,
    map: veneer,
    roughness: 0.35,
    metalness: 0,
    clearcoat: 0.6,
    clearcoatRoughness: 0.25,
  });
  const matPlatter = new THREE.MeshStandardMaterial({ color: COL.platter, roughness: 0.4, metalness: 0.7 });
  const matAluminium = new THREE.MeshStandardMaterial({ color: COL.aluminium, roughness: 0.25, metalness: 0.95 });
  const matVinyl = new THREE.MeshPhysicalMaterial({
    color: COL.vinylBlack,
    roughness: 0.3,
    metalness: 0,
    clearcoat: 0.7,
    clearcoatRoughness: 0.2,
  });
  const matChrome = new THREE.MeshStandardMaterial({ color: COL.chrome, roughness: 0.15, metalness: 1.0 });
  const matLed = new THREE.MeshStandardMaterial({ color: COL.led, emissive: COL.led, emissiveIntensity: 1.4 });

  /* ---- plinth ---- */
  const PLINTH_W = 2.0;
  const PLINTH_D = 1.6;
  const PLINTH_H = 0.14;
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(PLINTH_W, PLINTH_H, PLINTH_D), matPlinth);
  plinth.position.y = PLINTH_H / 2;
  plinth.castShadow = shadows;
  plinth.receiveShadow = shadows;
  root.add(plinth);

  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 16), matChrome);
    foot.position.set((sx * PLINTH_W) / 2 - sx * 0.1, -0.01, (sz * PLINTH_D) / 2 - sz * 0.1);
    root.add(foot);
  }

  /* ---- platter + spindle ---- */
  const platterCenter = new THREE.Vector3(-0.25, PLINTH_H, -0.05);
  const platter = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.03, 64), matPlatter);
  platter.position.copy(platterCenter);
  platter.castShadow = shadows;
  platter.receiveShadow = shadows;
  root.add(platter);

  const platterRim = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.012, 8, 64), matAluminium);
  platterRim.rotation.x = Math.PI / 2;
  platterRim.position.copy(platterCenter).add(new THREE.Vector3(0, 0.015, 0));
  root.add(platterRim);

  const spinGroup = new THREE.Group();
  spinGroup.position.copy(platterCenter);
  root.add(spinGroup);

  const record = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.015, 64), matVinyl);
  record.position.y = 0.025;
  record.castShadow = shadows;
  spinGroup.add(record);

  const recordTop = new THREE.Mesh(new THREE.CircleGeometry(0.58, 64), new THREE.MeshBasicMaterial({ map: recordTopTex() }));
  recordTop.rotation.x = -Math.PI / 2;
  recordTop.position.y = 0.033;
  spinGroup.add(recordTop);

  const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.06, 12), matChrome);
  spindle.position.copy(platterCenter).add(new THREE.Vector3(0, 0.05, 0));
  root.add(spindle);

  /* ---- tonearm: pivots at the rear-right, counterweight at the tail ---- */
  const armBase = new THREE.Vector3(0.68, PLINTH_H, -0.55);
  const armPivot = new THREE.Group();
  armPivot.position.copy(armBase);
  root.add(armPivot);

  const armBaseMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.08, 20), matAluminium);
  armBaseMesh.position.y = 0.04;
  armPivot.add(armBaseMesh);

  const armSwing = new THREE.Group();
  armSwing.position.y = 0.08;
  armPivot.add(armSwing);

  const ARM_LEN = 0.78;
  const armTube = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, ARM_LEN, 16), matChrome);
  armTube.rotation.z = Math.PI / 2;
  armTube.position.x = -ARM_LEN / 2 + 0.05;
  armSwing.add(armTube);

  const counterweight = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.06, 20), matAluminium);
  counterweight.rotation.z = Math.PI / 2;
  counterweight.position.x = 0.12;
  armSwing.add(counterweight);

  const headshell = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.05), matPlatter);
  headshell.position.x = -ARM_LEN + 0.05;
  armSwing.add(headshell);

  const stylusPivot = new THREE.Group();
  stylusPivot.position.x = -ARM_LEN + 0.05;
  armSwing.add(stylusPivot);
  const stylus = new THREE.Mesh(new THREE.ConeGeometry(0.006, 0.02, 8), matChrome);
  stylus.position.set(-0.02, -0.02, 0);
  stylus.rotation.z = Math.PI;
  stylusPivot.add(stylus);

  /* ---- power LED ---- */
  const led = new THREE.Mesh(new THREE.CircleGeometry(0.012, 12), matLed);
  led.position.set(0.7, PLINTH_H + 0.001, 0.6);
  led.rotation.x = -Math.PI / 2;
  root.add(led);

  /* ---- animation ---- */
  const CYCLE = 10.0;
  const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const smooth = (x: number, a: number, b: number): number =>
    easeInOut(THREE.MathUtils.clamp((x - a) / (b - a), 0, 1));

  const REST_Y = 0.35; // arm swung out, resting
  const PLAY_Y = -0.9; // arm swung in, over the record

  function updateAnimation(time: number): void {
    spinGroup.rotation.y = time * (2 * Math.PI) / 1.8; // ~33rpm feel

    const t = time % CYCLE;
    const liftUp1 = smooth(t, 0.3, 0.9);
    const swingIn = smooth(t, 0.9, 1.8);
    const dropDown = smooth(t, 1.8, 2.3);
    const liftUp2 = smooth(t, 7.5, 8.0);
    const swingOut = smooth(t, 8.0, 8.9);
    const dropRest = smooth(t, 8.9, 9.3);

    const lift = Math.max(liftUp1 - dropDown, liftUp2 - dropRest);
    armSwing.position.y = 0.08 + lift * 0.08;

    const swingProgress = swingIn - swingOut;
    armSwing.rotation.y = THREE.MathUtils.lerp(REST_Y, PLAY_Y, THREE.MathUtils.clamp(swingProgress, 0, 1));

    matLed.emissiveIntensity = 1.1 + Math.sin(time * 2) * 0.15;
  }

  updateAnimation(0);
  root.userData.tick = (_dt: number, elapsed: number): void => updateAnimation(elapsed);

  return root;
}

export function createTurntableLookDevLights(): THREE.Group {
  const lights = new THREE.Group();
  const key = new THREE.DirectionalLight(0xfff2e0, 2.4);
  key.position.set(3, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  lights.add(key);
  const fill = new THREE.DirectionalLight(0xdfe6ff, 0.55);
  fill.position.set(-4, 2, 3);
  lights.add(fill);
  lights.add(new THREE.HemisphereLight(0xffffff, 0x2a2420, 0.4));
  return lights;
}

export function makeTurntableBackground(): THREE.Color {
  return new THREE.Color(0xd8d2c4);
}
