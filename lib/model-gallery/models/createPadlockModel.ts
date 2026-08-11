import * as THREE from 'three';

/**
 * Brushed-steel padlock, built in the same primitives-plus-decal style as
 * the rest of this set. Focus: a rounded body with an engraved keyhole and
 * a status window, and a shackle that genuinely pivots open and swings back
 * closed — no CSG, just a hinged group.
 *
 * Live animation (looping ~5s): shackle unlatches and swings open, the LED
 * flips from green ("SECURE") to amber ("OPEN"), holds, then swings shut and
 * the LED flips back.
 */

export interface PadlockOptions {
  shadows?: boolean;
}

const COL = {
  steel: 0xc3c6cc,
  steelDark: 0x74777d,
  brass: 0xc9a24b,
  dark: 0x1a1b1e,
  green: 0x35d16b,
  amber: 0xe0a12e,
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

function decal(tex: THREE.Texture, w: number, h: number): THREE.Mesh {
  const m = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
}

function keyholeTex(): THREE.CanvasTexture {
  return textTexture((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0c0c0e';
    const cx = w / 2;
    const cy = h * 0.4;
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.11, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.045, cy);
    ctx.lineTo(cx + w * 0.045, cy);
    ctx.lineTo(cx + w * 0.09, h * 0.72);
    ctx.lineTo(cx - w * 0.09, h * 0.72);
    ctx.closePath();
    ctx.fill();
  }, 384, 384);
}

/** Rounded padlock body via ExtrudeGeometry on a fillet-cornered rectangle. */
function bodyShape(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  const hw = w / 2;
  const hh = h / 2;
  s.moveTo(-hw + r, -hh);
  s.lineTo(hw - r, -hh);
  s.quadraticCurveTo(hw, -hh, hw, -hh + r);
  s.lineTo(hw, hh - r);
  s.quadraticCurveTo(hw, hh, hw - r, hh);
  s.lineTo(-hw + r, hh);
  s.quadraticCurveTo(-hw, hh, -hw, hh - r);
  s.lineTo(-hw, -hh + r);
  s.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  return s;
}

export function createPadlockModel(options: PadlockOptions = {}): THREE.Group {
  const shadows = options.shadows ?? true;
  const root = new THREE.Group();
  root.position.y = 0.15;

  const matSteel = new THREE.MeshPhysicalMaterial({
    color: COL.steel,
    roughness: 0.34,
    metalness: 1.0,
    clearcoat: 0.4,
    clearcoatRoughness: 0.3,
  });
  const matSteelDark = new THREE.MeshStandardMaterial({ color: COL.steelDark, roughness: 0.45, metalness: 0.9 });
  const matBrass = new THREE.MeshStandardMaterial({ color: COL.brass, roughness: 0.3, metalness: 1.0 });
  const matLed = new THREE.MeshStandardMaterial({
    color: COL.green,
    emissive: COL.green,
    emissiveIntensity: 1.4,
    roughness: 0.4,
  });

  /* ---- body ---- */
  const BODY_W = 0.9;
  const BODY_H = 0.75;
  const BODY_T = 0.32;
  const shape = bodyShape(BODY_W, BODY_H, 0.14);
  const bodyGeo = new THREE.ExtrudeGeometry(shape, {
    depth: BODY_T,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 4,
    curveSegments: 24,
  });
  bodyGeo.translate(0, 0, -BODY_T / 2);
  const body = new THREE.Mesh(bodyGeo, matSteel);
  body.castShadow = shadows;
  body.receiveShadow = shadows;
  root.add(body);

  const keyholePlate = decal(keyholeTex(), 0.4, 0.4);
  keyholePlate.position.set(0, -0.02, BODY_T / 2 + 0.001);
  root.add(keyholePlate);

  /* status window */
  const windowFrame = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 24), matSteelDark);
  windowFrame.rotation.x = Math.PI / 2;
  windowFrame.position.set(0, BODY_H * 0.28, BODY_T / 2 + 0.005);
  root.add(windowFrame);
  const led = new THREE.Mesh(new THREE.CircleGeometry(0.06, 24), matLed);
  led.position.set(0, BODY_H * 0.28, BODY_T / 2 + 0.017);
  root.add(led);

  /* rivets at the corners */
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 10), matBrass);
      rivet.position.set(sx * (BODY_W / 2 - 0.09), sy * (BODY_H / 2 - 0.09), BODY_T / 2 + 0.005);
      root.add(rivet);
    }
  }

  /* ---- shackle: hinged on one side, free-latching on the other ---- */
  const SHACKLE_R = 0.34;
  const SHACKLE_TUBE = 0.055;
  const shacklePivot = new THREE.Group();
  shacklePivot.position.set(-SHACKLE_R * 0.55, BODY_H / 2 - 0.05, 0);
  root.add(shacklePivot);

  const shackleGroup = new THREE.Group();
  shacklePivot.add(shackleGroup);

  // U-shaped shackle: a half torus arc plus two straight legs
  const arc = new THREE.Mesh(
    new THREE.TorusGeometry(SHACKLE_R * 0.55, SHACKLE_TUBE, 16, 32, Math.PI),
    matSteel,
  );
  arc.rotation.z = Math.PI;
  arc.position.set(SHACKLE_R * 0.55, 0.62, 0);
  arc.castShadow = shadows;
  shackleGroup.add(arc);

  function shackleLeg(sign: number): THREE.Mesh {
    const geo = new THREE.CylinderGeometry(SHACKLE_TUBE, SHACKLE_TUBE, 0.62, 20);
    const m = new THREE.Mesh(geo, matSteel);
    m.position.set(SHACKLE_R * 0.55 + sign * SHACKLE_R * 0.55, 0.31, 0);
    m.castShadow = shadows;
    return m;
  }
  const legFixed = shackleLeg(-1); // stays on the hinge side
  const legFree = shackleLeg(1); // this leg lifts out of the body when open
  shackleGroup.add(legFixed);
  shackleGroup.add(legFree);

  /* ---- animation ---- */
  const CYCLE = 5.0;
  const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const smooth = (x: number, a: number, b: number): number =>
    easeInOut(THREE.MathUtils.clamp((x - a) / (b - a), 0, 1));

  function updateAnimation(time: number): void {
    const t = time % CYCLE;
    const openT = smooth(t, 0.4, 1.4);
    const closeT = smooth(t, 3.2, 4.2);
    const openAmt = openT * (1 - closeT);

    shacklePivot.rotation.z = -openAmt * (Math.PI * 0.62);
    const ledOpen = openAmt > 0.5;
    (matLed.color as THREE.Color).set(ledOpen ? COL.amber : COL.green);
    (matLed.emissive as THREE.Color).set(ledOpen ? COL.amber : COL.green);
    matLed.emissiveIntensity = 1.1 + Math.sin(time * 4) * 0.2;

    root.rotation.y = Math.sin(time * 0.3) * 0.12;
  }

  updateAnimation(0);
  root.userData.tick = (_dt: number, elapsed: number): void => updateAnimation(elapsed);

  return root;
}

export function createPadlockLookDevLights(): THREE.Group {
  const lights = new THREE.Group();
  const key = new THREE.DirectionalLight(0xffffff, 2.6);
  key.position.set(3, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  lights.add(key);
  const fill = new THREE.DirectionalLight(0xdfe6ff, 0.6);
  fill.position.set(-4, 2, 3);
  lights.add(fill);
  const rim = new THREE.DirectionalLight(0xffe8cf, 0.6);
  rim.position.set(-2, 3, -5);
  lights.add(rim);
  lights.add(new THREE.HemisphereLight(0xffffff, 0x2c2d33, 0.4));
  return lights;
}

export function makePadlockBackground(): THREE.Color {
  return new THREE.Color(0x22242a);
}
