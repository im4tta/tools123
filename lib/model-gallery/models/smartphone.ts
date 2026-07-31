import * as THREE from 'three';

/**
 * Generic modern flagship smartphone, built the same way as the earbuds case
 * and watch models: extruded squircle slab body, glass front with a
 * lock-screen canvas texture, a raised camera module with three real lens
 * rings, side buttons, and a bottom speaker/USB-C deck.
 *
 * Live animation (looping ~7s): phone rests face-up on a surface → lifts and
 * tilts as if picked up while the screen wakes from black to the lock
 * screen → holds at a hero angle → lowers and the screen sleeps again.
 */

export interface SmartphoneOptions {
  shadows?: boolean;
}

/* ---- palette ---- */
const COL = {
  frame: 0xb9bcc2,
  glassBack: 0x2b2f38,
  screenOff: 0x030405,
  screenInk: 0xf5f6f8,
  screenDim: 0x9aa0ab,
  camHousing: 0x1c1e22,
  lensRing: 0x4b4f57,
  lensGlass: 0x0a0c10,
  flash: 0xf3e9c9,
  accent: 0xd8dce2,
};

/* ---- dimensions ---- */
const W = 0.9;
const H = 1.86;
const D = 0.11;
const R = 0.2;
const topY = D;

function hex(n: number): string {
  return '#' + n.toString(16).padStart(6, '0');
}

function textTexture(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  w = 512,
  h = 1024,
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

function squircleShape(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  const hx = w / 2 - r;
  const hy = h / 2 - r;
  s.absarc(hx, -hy, r, -Math.PI / 2, 0);
  s.absarc(hx, hy, r, 0, Math.PI / 2);
  s.absarc(-hx, hy, r, Math.PI / 2, Math.PI);
  s.absarc(-hx, -hy, r, Math.PI, Math.PI * 1.5);
  return s;
}

function squircleSlab(
  w: number,
  h: number,
  depth: number,
  r: number,
  mat: THREE.Material,
  bevel: number,
  shadows: boolean,
): THREE.Mesh {
  const shape = squircleShape(w, h, r);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: depth - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 6,
    curveSegments: 28,
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, bevel, 0);
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = shadows;
  m.receiveShadow = shadows;
  return m;
}

/* ============================================================ */
export function createSmartphoneModel(options: SmartphoneOptions = {}): THREE.Group {
  const shadows = options.shadows ?? true;
  const root = new THREE.Group();
  root.position.y = 0.05;

  /* ---- materials ---- */
  const matFrame = new THREE.MeshPhysicalMaterial({
    color: COL.frame,
    roughness: 0.28,
    metalness: 0.9,
    clearcoat: 0.3,
    clearcoatRoughness: 0.25,
    envMapIntensity: 1.1,
  });
  const matGlassBack = new THREE.MeshPhysicalMaterial({
    color: COL.glassBack,
    roughness: 0.14,
    metalness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.3,
  });
  const matScreenGlass = new THREE.MeshPhysicalMaterial({
    color: 0x060708,
    roughness: 0.05,
    metalness: 0.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.4,
  });
  const matCamHousing = new THREE.MeshPhysicalMaterial({
    color: COL.camHousing,
    roughness: 0.35,
    metalness: 0.7,
    clearcoat: 0.4,
  });
  const matLensRing = new THREE.MeshStandardMaterial({ color: COL.lensRing, roughness: 0.3, metalness: 0.9 });
  const matLensGlass = new THREE.MeshPhysicalMaterial({
    color: COL.lensGlass,
    roughness: 0.05,
    metalness: 0.0,
    clearcoat: 1.0,
    envMapIntensity: 1.8,
  });
  const matFlash = new THREE.MeshStandardMaterial({ color: COL.flash, roughness: 0.4, metalness: 0.0 });
  const matButton = new THREE.MeshStandardMaterial({ color: COL.accent, roughness: 0.3, metalness: 0.85 });

  /* ---- lock-screen texture ---- */
  const screenTex = textTexture((ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#1a2138');
    grad.addColorStop(1, '#05070c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // status bar
    ctx.fillStyle = hex(COL.screenInk);
    ctx.font = '600 22px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('9:41', 34, 58);
    ctx.textAlign = 'right';
    ctx.fillText('LTE 100%', w - 34, 58);

    // camera cutout
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(w / 2, 40, 12, 0, Math.PI * 2);
    ctx.fill();

    // clock
    ctx.textAlign = 'center';
    ctx.fillStyle = hex(COL.screenInk);
    ctx.font = '300 128px Arial';
    ctx.fillText('9:41', w / 2, h * 0.34);
    ctx.font = '400 32px Arial';
    ctx.fillStyle = hex(COL.screenDim);
    ctx.fillText('Tuesday, 17 March', w / 2, h * 0.4);

    // notification chips
    const chipY = h * 0.52;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    const chipH = 92;
    for (let i = 0; i < 2; i++) {
      const y = chipY + i * (chipH + 18);
      roundRect(ctx, w * 0.08, y, w * 0.84, chipH, 22);
      ctx.fill();
    }
    ctx.fillStyle = hex(COL.screenInk);
    ctx.font = '600 26px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Messages', w * 0.14, chipY + 38);
    ctx.fillText('Calendar', w * 0.14, chipY + chipH + 18 + 38);
    ctx.font = '400 22px Arial';
    ctx.fillStyle = hex(COL.screenDim);
    ctx.fillText('New message received', w * 0.14, chipY + 68);
    ctx.fillText('Standup in 15 minutes', w * 0.14, chipY + chipH + 18 + 68);

    // bottom lock icon + home indicator
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.86, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    roundRect(ctx, w / 2 - 68, h - 26, 136, 6, 3);
    ctx.fill();

    function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w2: number, h2: number, rad: number) {
      c.beginPath();
      c.moveTo(x + rad, y);
      c.arcTo(x + w2, y, x + w2, y + h2, rad);
      c.arcTo(x + w2, y + h2, x, y + h2, rad);
      c.arcTo(x, y + h2, x, y, rad);
      c.arcTo(x, y, x + w2, y, rad);
      c.closePath();
    }
  }, 512, 1108);
  const matScreen = new THREE.MeshStandardMaterial({
    map: screenTex,
    emissive: new THREE.Color(0xffffff),
    emissiveMap: screenTex,
    emissiveIntensity: 1.0,
    roughness: 0.35,
  });

  /* ---- BODY ---- */
  const body = squircleSlab(W, H, D, R, matFrame, 0.02, shadows);
  root.add(body);

  const back = squircleSlab(W - 0.02, H - 0.02, D - 0.03, R - 0.01, matGlassBack, 0.015, shadows);
  back.position.y = -0.005;
  root.add(back);

  // screen is a flat ROUNDED shape (a scaled copy of the body's own outline,
  // not an independent w/h inset) so its corners always stay inside the
  // body's curve, however tight the corner radius is.
  const SCREEN_SCALE = 0.955;
  const screenShapeGeo = new THREE.ShapeGeometry(squircleShape(W * SCREEN_SCALE, H * SCREEN_SCALE, R * SCREEN_SCALE), 24);
  const screenPlane = new THREE.Mesh(screenShapeGeo, matScreen);
  screenPlane.rotation.x = -Math.PI / 2;
  screenPlane.position.y = topY + 0.001;
  root.add(screenPlane);

  const GLASS_SCALE = 0.99;
  const screenGlass = squircleSlab(W * GLASS_SCALE, H * GLASS_SCALE, 0.02, R * GLASS_SCALE, matScreenGlass, 0.008, shadows);
  screenGlass.position.y = topY + 0.008;
  root.add(screenGlass);

  /* ---- camera module (top area of the back, protrudes below y=0) ---- */
  const camGroup = new THREE.Group();
  camGroup.position.set(-W * 0.24, 0, -H * 0.32);
  root.add(camGroup);

  // squircleSlab spans local y:[0, depth]; sitting it at y=-depth flushes its
  // TOP against the phone's underside (y=0) so it bumps outward below that.
  const HOUSING_DEPTH = 0.05;
  const housing = squircleSlab(0.42, 0.42, HOUSING_DEPTH, 0.12, matCamHousing, 0.012, shadows);
  housing.position.y = -HOUSING_DEPTH;
  camGroup.add(housing);
  const housingOuterY = -HOUSING_DEPTH + 0.006; // just inside the bump's outward face

  const lensLayout = [
    { x: -0.11, z: -0.1 },
    { x: 0.11, z: -0.1 },
    { x: 0, z: 0.1 },
  ];
  for (const p of lensLayout) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.012, 12, 28), matLensRing);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(p.x, housingOuterY, p.z);
    camGroup.add(ring);
    const glass = new THREE.Mesh(new THREE.CircleGeometry(0.065, 28), matLensGlass);
    glass.rotation.x = Math.PI / 2;
    glass.position.set(p.x, housingOuterY - 0.003, p.z);
    camGroup.add(glass);
  }
  const flash = new THREE.Mesh(new THREE.CircleGeometry(0.03, 20), matFlash);
  flash.rotation.x = Math.PI / 2;
  flash.position.set(0.14, housingOuterY - 0.003, 0.1);
  camGroup.add(flash);

  /* ---- side buttons: sit centered in the thin Y-thickness band (0..D),
     spaced along Z (the phone's length), flush against the ±X edges ---- */
  const btnY = D / 2;
  const powerBtn = new THREE.Mesh(new THREE.BoxGeometry(0.02, D * 0.55, 0.18), matButton);
  powerBtn.position.set(W / 2 + 0.008, btnY, H * 0.12);
  root.add(powerBtn);

  const volUp = new THREE.Mesh(new THREE.BoxGeometry(0.02, D * 0.55, 0.14), matButton);
  volUp.position.set(-W / 2 - 0.008, btnY, H * 0.1);
  root.add(volUp);
  const volDown = volUp.clone();
  volDown.position.z = H * -0.02;
  root.add(volDown);

  /* ---- bottom deck: speaker holes + USB-C slit, on the bottom short edge ---- */
  const deck = new THREE.Group();
  deck.position.set(0, btnY, -H / 2 - 0.006);
  deck.rotation.y = Math.PI;
  root.add(deck);
  for (let i = 0; i < 6; i++) {
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.008, 10), matCamHousing);
    hole.position.set(0.15 + i * 0.03, 0, 0);
    deck.add(hole);
  }
  const usbC = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.02, 0.005), matCamHousing);
  usbC.position.set(-0.2, 0, 0);
  deck.add(usbC);

  /* ---- animation timeline: pick-up + screen wake ---- */
  const CYCLE = 7.0;
  const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const smooth = (x: number, a: number, b: number): number =>
    easeInOut(THREE.MathUtils.clamp((x - a) / (b - a), 0, 1));

  function updateAnimation(time: number): void {
    const t = time % CYCLE;
    const liftIn = smooth(t, 0.3, 1.6);
    const lowerOut = smooth(t, 5.2, 6.6);
    const lift = liftIn * (1 - lowerOut);

    root.position.y = 0.05 + lift * 0.35;
    root.rotation.x = THREE.MathUtils.lerp(0.5, 0.08, lift);
    root.rotation.z = THREE.MathUtils.lerp(0.12, -0.05, lift) * Math.sin(time * 0.4 + 1);
    root.rotation.y = Math.sin(time * 0.2) * 0.15;

    const wake = smooth(t, 0.9, 1.9) * (1 - smooth(t, 4.8, 5.6));
    matScreen.emissiveIntensity = THREE.MathUtils.lerp(0.05, 1.0, wake);
  }

  updateAnimation(0);
  root.userData.tick = (_dt: number, elapsed: number): void => updateAnimation(elapsed);

  return root;
}

/* ============================================================ */
export function createSmartphoneLookDevLights(): THREE.Group {
  const lights = new THREE.Group();
  const key = new THREE.DirectionalLight(0xffffff, 2.5);
  key.position.set(3.5, 6.5, 4.5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 20;
  const kc = key.shadow.camera as THREE.OrthographicCamera;
  kc.left = -4;
  kc.right = 4;
  kc.top = 4;
  kc.bottom = -4;
  key.shadow.bias = -0.0004;
  key.shadow.radius = 5;
  lights.add(key);

  const fill = new THREE.DirectionalLight(0xdfe6ff, 0.6);
  fill.position.set(-4, 3, 2);
  lights.add(fill);

  const rim = new THREE.DirectionalLight(0xcfe0ff, 0.55);
  rim.position.set(-2, 4, -5);
  lights.add(rim);

  lights.add(new THREE.HemisphereLight(0xffffff, 0x9a9a9d, 0.4));
  return lights;
}

export function makeSmartphoneBackground(): THREE.Color {
  return new THREE.Color(0xe9eaec);
}
