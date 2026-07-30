import * as THREE from 'three';

/**
 * Apple Vision Pro, rebuilt in code from a single studio reference set. Focus:
 * the curved 3D laminated-glass front wrapped in a light aluminum-alloy frame,
 * the dark foam Light Seal peeking out below, the Dual Loop Band (top strap +
 * back strap), the knurled Digital Crown + top button on the right hinge, and
 * the separate battery pack tethered by a braided cable.
 *
 * Live animation (looping ~9s): slow turntable sway → EyeSight glass brightens
 * as if someone approached, holds, fades back to a dim mirror → Digital Crown
 * gives a small idle twist → battery pack bobs gently on its cable.
 */

export interface AppleVisionProOptions {
  shadows?: boolean;
}

/* ---- palette (measured from the reference) ---- */
const COL = {
  frame: 0xe7e3da, // polished light aluminum alloy
  frameDark: 0xb8b3a8, // shaded recess of the frame
  glass: 0x2b2e33, // dark laminated glass, mostly mirror
  lightSeal: 0x232226, // foam light seal
  band: 0x38383b, // dual loop band fabric
  bandLight: 0x9a968c, // stitched edge highlight
  battery: 0xf2f1ee, // white polycarbonate
  cable: 0x2a2a2c, // braided cable
  crown: 0xcfcbc2,
  led: 0xdcefe0,
};

/* ---- dimensions ---- */
const VISOR_W = 2.7;
const VISOR_H = 1.0;
const FRAME_R = 0.46;
const GLASS_INSET = 0.12;
const FRAME_T = 0.14;
const GLASS_T = 0.05;
const CURVE_R = 1.7; // wraparound radius for the visor

/* ============================================================ */
/* texture helpers                                               */
/* ============================================================ */
function textTexture(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  w = 512,
  h = 256,
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

function decal(tex: THREE.Texture, w: number, h: number, opacity = 1): THREE.Mesh {
  const m = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    opacity,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
}

function eyesightTexture(): THREE.CanvasTexture {
  return textTexture(
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const grad = ctx.createRadialGradient(w / 2, h / 2, 8, w / 2, h / 2, w / 2);
      grad.addColorStop(0, 'rgba(214,228,255,0.55)');
      grad.addColorStop(1, 'rgba(214,228,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(28,32,44,0.88)';
      const eye = (cx: number): void => {
        ctx.beginPath();
        ctx.ellipse(cx, h / 2, 62, 30, 0, 0, Math.PI * 2);
        ctx.fill();
      };
      eye(w * 0.33);
      eye(w * 0.67);
    },
    512,
    256,
  );
}

function mirrorGradientTexture(): THREE.CanvasTexture {
  return textTexture(
    (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#e6edf4');
      grad.addColorStop(0.42, '#aeb8c5');
      grad.addColorStop(0.58, '#838d99');
      grad.addColorStop(1, '#464b54');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    },
    8,
    256,
  );
}

function knurlTexture(): THREE.CanvasTexture {
  const t = textTexture(
    (ctx, w, h) => {
      ctx.fillStyle = '#c9c9cc';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(58,58,62,0.55)';
      ctx.lineWidth = 3;
      for (let x = 0; x <= w; x += 8) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
    },
    64,
    64,
  );
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(6, 1);
  return t;
}

/* ============================================================ */
/* geometry helpers                                               */
/* ============================================================ */
function roundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  const hw = w / 2;
  const hh = h / 2;
  s.moveTo(-hw + r, -hh);
  s.lineTo(hw - r, -hh);
  s.absarc(hw - r, -hh + r, r, -Math.PI / 2, 0);
  s.lineTo(hw, hh - r);
  s.absarc(hw - r, hh - r, r, 0, Math.PI / 2);
  s.lineTo(-hw + r, hh);
  s.absarc(-hw + r, hh - r, r, Math.PI / 2, Math.PI);
  s.lineTo(-hw, -hh + r);
  s.absarc(-hw + r, -hh + r, r, Math.PI, Math.PI * 1.5);
  return s;
}

function roundedRectPath(w: number, h: number, r: number): THREE.Path {
  const shape = roundedRectShape(w, h, r);
  const p = new THREE.Path();
  p.curves = shape.curves;
  return p;
}

/** Bends a flat panel (lying near the XY plane, +Z = depth into the shell)
 * around a vertical cylinder of the given radius so it wraps around the face
 * like ski-goggle glass — convex at the center, curving away at the edges. */
function bendAroundY(geo: THREE.BufferGeometry, radius: number): void {
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const theta = v.x / radius;
    const effR = radius - v.z;
    pos.setXYZ(i, effR * Math.sin(theta), v.y, effR * Math.cos(theta) - radius);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

function tubeAlong(points: THREE.Vector3[], radius: number, mat: THREE.Material, shadows: boolean): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3(points);
  const geo = new THREE.TubeGeometry(curve, 48, radius, 14, false);
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = shadows;
  m.receiveShadow = shadows;
  return m;
}

/* ============================================================ */
/* model                                                          */
/* ============================================================ */
export function createAppleVisionProModel(options: AppleVisionProOptions = {}): THREE.Group {
  const shadows = options.shadows ?? true;
  const root = new THREE.Group();
  root.position.y = 0.2;

  /* ---- materials ---- */
  const matFrame = new THREE.MeshPhysicalMaterial({
    color: COL.frame,
    roughness: 0.22,
    metalness: 1.0,
    clearcoat: 0.5,
    clearcoatRoughness: 0.25,
    envMapIntensity: 1.2,
    side: THREE.DoubleSide,
  });
  const matGlass = new THREE.MeshPhysicalMaterial({
    color: COL.glass,
    map: mirrorGradientTexture(),
    roughness: 0.06,
    metalness: 0.85,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.6,
    side: THREE.DoubleSide,
  });
  const matSeal = new THREE.MeshPhysicalMaterial({
    color: COL.lightSeal,
    roughness: 0.92,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });
  const matBand = new THREE.MeshPhysicalMaterial({
    color: COL.band,
    roughness: 0.86,
    metalness: 0.0,
    sheen: 0.4,
    sheenColor: new THREE.Color(COL.bandLight),
  });
  const matBattery = new THREE.MeshPhysicalMaterial({
    color: COL.battery,
    roughness: 0.34,
    metalness: 0.05,
    clearcoat: 0.3,
    clearcoatRoughness: 0.4,
  });
  const matCable = new THREE.MeshStandardMaterial({ color: COL.cable, roughness: 0.7, metalness: 0.0 });
  const matCrown = new THREE.MeshStandardMaterial({ map: knurlTexture(), color: COL.crown, roughness: 0.4, metalness: 0.6 });
  const matLed = new THREE.MeshStandardMaterial({
    color: COL.led,
    emissive: COL.led,
    emissiveIntensity: 0.9,
    roughness: 0.4,
  });

  const visorGroup = new THREE.Group();
  root.add(visorGroup);

  /* ---- frame ring (curved) ---- */
  const outer = roundedRectShape(VISOR_W, VISOR_H, FRAME_R);
  outer.holes.push(roundedRectPath(VISOR_W - GLASS_INSET * 2, VISOR_H - GLASS_INSET * 2, FRAME_R - GLASS_INSET * 0.6));
  const frameGeo = new THREE.ExtrudeGeometry(outer, {
    depth: FRAME_T,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 4,
    curveSegments: 40,
  });
  frameGeo.translate(0, 0, -FRAME_T / 2);
  bendAroundY(frameGeo, CURVE_R);
  const frame = new THREE.Mesh(frameGeo, matFrame);
  frame.castShadow = shadows;
  frame.receiveShadow = shadows;
  visorGroup.add(frame);

  /* ---- glass (curved, recessed slightly behind the frame's front plane) ---- */
  const glassShape = roundedRectShape(
    VISOR_W - GLASS_INSET * 2 - 0.02,
    VISOR_H - GLASS_INSET * 2 - 0.02,
    FRAME_R - GLASS_INSET * 0.6 - 0.01,
  );
  const glassGeo = new THREE.ExtrudeGeometry(glassShape, {
    depth: GLASS_T,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 3,
    curveSegments: 40,
  });
  glassGeo.translate(0, 0, -FRAME_T / 2 + 0.015);
  bendAroundY(glassGeo, CURVE_R);
  const glass = new THREE.Mesh(glassGeo, matGlass);
  glass.castShadow = shadows;
  visorGroup.add(glass);

  /* ---- EyeSight glow layer, sits just proud of the glass ---- */
  const texEyes = eyesightTexture();
  const eyesightDecal = decal(texEyes, 1.5, 0.5, 0.0);
  eyesightDecal.position.set(0, -0.02, GLASS_INSET * 0.1 + FRAME_T / 2 - 0.02);
  visorGroup.add(eyesightDecal);

  /* ---- light seal (dark foam, peeks out below/behind the frame) ---- */
  const sealShape = roundedRectShape(VISOR_W - 0.5, 0.42, 0.16);
  const sealGeo = new THREE.ExtrudeGeometry(sealShape, {
    depth: 0.18,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 3,
    curveSegments: 28,
  });
  sealGeo.translate(0, 0, 0.02);
  bendAroundY(sealGeo, CURVE_R - 0.12);
  const seal = new THREE.Mesh(sealGeo, matSeal);
  seal.position.set(0, -VISOR_H / 2 - 0.06, -0.12);
  seal.rotation.x = 0.12;
  seal.castShadow = shadows;
  seal.receiveShadow = shadows;
  visorGroup.add(seal);

  /* ---- hinge pods (left/right, connect frame to the band) ---- */
  function hingePod(sign: number): THREE.Group {
    const g = new THREE.Group();
    const bodyGeo = new THREE.SphereGeometry(0.11, 24, 20);
    bodyGeo.scale(1, 1.3, 0.85);
    const body = new THREE.Mesh(bodyGeo, matFrame);
    body.castShadow = shadows;
    g.add(body);
    g.position.set(sign * (VISOR_W / 2 + 0.02), -0.02, -0.12);
    return g;
  }
  const hingeL = hingePod(-1);
  const hingeR = hingePod(1);
  visorGroup.add(hingeL, hingeR);

  /* ---- Digital Crown + top button, on the right hinge ---- */
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.05, 28), matCrown);
  crown.rotation.z = Math.PI / 2;
  crown.position.set(VISOR_W / 2 + 0.08, -0.16, 0.1);
  crown.castShadow = shadows;
  visorGroup.add(crown);

  const topButtonGeo = new THREE.SphereGeometry(0.045, 20, 16);
  topButtonGeo.scale(1, 0.6, 1.4);
  const topButton = new THREE.Mesh(topButtonGeo, matFrame);
  topButton.position.set(VISOR_W / 2 + 0.02, 0.02, 0.14);
  topButton.castShadow = shadows;
  visorGroup.add(topButton);

  /* ---- Dual Loop Band ---- */
  const topStrap = tubeAlong(
    [
      new THREE.Vector3(-(VISOR_W / 2 + 0.02), 0.02, -0.14),
      new THREE.Vector3(-0.9, 1.25, -0.75),
      new THREE.Vector3(0, 1.55, -1.05),
      new THREE.Vector3(0.9, 1.25, -0.75),
      new THREE.Vector3(VISOR_W / 2 + 0.02, 0.02, -0.14),
    ],
    0.065,
    matBand,
    shadows,
  );
  visorGroup.add(topStrap);

  const backStrap = tubeAlong(
    [
      new THREE.Vector3(-(VISOR_W / 2 + 0.02), -0.08, -0.14),
      new THREE.Vector3(-1.35, -0.14, -1.05),
      new THREE.Vector3(0, -0.2, -1.55),
      new THREE.Vector3(1.35, -0.14, -1.05),
      new THREE.Vector3(VISOR_W / 2 + 0.02, -0.08, -0.14),
    ],
    0.07,
    matBand,
    shadows,
  );
  visorGroup.add(backStrap);

  /* ---- external battery pack + braided cable ---- */
  const batteryGroup = new THREE.Group();
  const batteryGeo = new THREE.SphereGeometry(0.22, 28, 24);
  batteryGeo.scale(1, 2.1, 1);
  const battery = new THREE.Mesh(batteryGeo, matBattery);
  battery.castShadow = shadows;
  batteryGroup.add(battery);
  const led = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.012, 10, 32), matLed);
  led.rotation.x = Math.PI / 2;
  led.position.y = -0.42;
  batteryGroup.add(led);
  batteryGroup.position.set(1.05, -1.9, -0.95);
  root.add(batteryGroup);

  const cablePoints = [
    new THREE.Vector3(VISOR_W / 2 - 0.05, -0.18, 0.02),
    new THREE.Vector3(0.95, -0.7, -0.3),
    new THREE.Vector3(1.15, -1.3, -0.7),
    new THREE.Vector3(1.05, -1.68, -0.92),
  ];
  const cable = tubeAlong(cablePoints, 0.018, matCable, shadows);
  root.add(cable);

  /* ---- animation timeline ---- */
  const CYCLE = 9.0;
  const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const smooth = (x: number, a: number, b: number): number =>
    easeInOut(THREE.MathUtils.clamp((x - a) / (b - a), 0, 1));

  function updateAnimation(time: number): void {
    const t = time % CYCLE;

    // slow turntable sway
    root.rotation.y = Math.sin(time * 0.16) * 0.22;
    root.rotation.x = Math.sin(time * 0.11 + 1) * 0.05;

    // EyeSight glow: dim → someone approaches → bright hold → fades back
    const riseA = smooth(t, 0.5, 2.2);
    const fallA = smooth(t, 4.2, 5.8);
    const glow = 0.12 + 0.55 * Math.max(riseA - fallA, 0);
    (eyesightDecal.material as THREE.MeshBasicMaterial).opacity = glow;

    // Digital Crown idle twist
    crown.rotation.x = Math.sin(time * 0.9) * 0.5;

    // battery pack gentle bob + sway on its cable
    batteryGroup.position.y = -1.9 + Math.sin(time * 1.3) * 0.03;
    batteryGroup.rotation.z = Math.sin(time * 1.1) * 0.06;
  }

  updateAnimation(0);
  root.userData.tick = (_dt: number, elapsed: number): void => updateAnimation(elapsed);

  return root;
}

/* ============================================================ */
/* lights + background                                            */
/* ============================================================ */
export function createAppleVisionProLookDevLights(): THREE.Group {
  const lights = new THREE.Group();

  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(4, 6, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 30;
  const kc = key.shadow.camera as THREE.OrthographicCamera;
  kc.left = -6;
  kc.right = 6;
  kc.top = 6;
  kc.bottom = -6;
  key.shadow.bias = -0.0004;
  key.shadow.radius = 6;
  lights.add(key);

  const fill = new THREE.DirectionalLight(0xdfe6ff, 0.6);
  fill.position.set(-5, 3, 3);
  lights.add(fill);

  const fill2 = new THREE.DirectionalLight(0xffffff, 0.45);
  fill2.position.set(1, 1, 7);
  lights.add(fill2);

  const rim = new THREE.DirectionalLight(0xd8e6ff, 0.7);
  rim.position.set(-3, 4, -6);
  lights.add(rim);

  lights.add(new THREE.HemisphereLight(0xffffff, 0x9a9a9d, 0.4));
  return lights;
}

export function makeAppleVisionProBackground(): THREE.Color {
  return new THREE.Color(0xf1f1ee);
}
