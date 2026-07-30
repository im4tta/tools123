import * as THREE from 'three';

/**
 * Articulated desk lamp (balanced-arm style), built from primitives in the
 * same style as the rest of this set. Focus: a weighted disc base, two
 * pivoting arm segments linked by visible spring coils, a tilting head with
 * a warm emissive bulb, and an actual soft light cone / floor pool that
 * fades in when the lamp switches on.
 *
 * Live animation (looping ~9s): the lamp nods down toward a "desk", clicks
 * on (bulb + light cone fade in), holds, then lifts back up and clicks off.
 */

export interface DeskLampOptions {
  shadows?: boolean;
}

const COL = {
  matteBlack: 0x1e1f22,
  matteBlackLight: 0x2c2d31,
  chrome: 0xd7dade,
  bulbWarm: 0xffd9a0,
  spring: 0x9a9ca1,
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

function lightPoolTex(): THREE.CanvasTexture {
  return textTexture((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, w / 2);
    grad.addColorStop(0, 'rgba(255,217,160,0.55)');
    grad.addColorStop(0.6, 'rgba(255,217,160,0.18)');
    grad.addColorStop(1, 'rgba(255,217,160,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }, 512, 512);
}

/** A coiled-spring look for the arm joints, made from a helix TubeGeometry. */
function springMesh(length: number, radius: number, coils: number, mat: THREE.Material): THREE.Mesh {
  const pts: THREE.Vector3[] = [];
  const steps = coils * 16;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = t * Math.PI * 2 * coils;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, t * length - length / 2, Math.sin(a) * radius));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const geo = new THREE.TubeGeometry(curve, steps, radius * 0.16, 8, false);
  return new THREE.Mesh(geo, mat);
}

export function createDeskLampModel(options: DeskLampOptions = {}): THREE.Group {
  const shadows = options.shadows ?? true;
  const root = new THREE.Group();

  const matBody = new THREE.MeshPhysicalMaterial({
    color: COL.matteBlack,
    roughness: 0.55,
    metalness: 0.3,
    clearcoat: 0.2,
    clearcoatRoughness: 0.5,
  });
  const matJoint = new THREE.MeshStandardMaterial({ color: COL.matteBlackLight, roughness: 0.4, metalness: 0.6 });
  const matChrome = new THREE.MeshStandardMaterial({ color: COL.chrome, roughness: 0.25, metalness: 1.0 });
  const matSpring = new THREE.MeshStandardMaterial({ color: COL.spring, roughness: 0.35, metalness: 0.9 });
  const matBulb = new THREE.MeshStandardMaterial({
    color: COL.bulbWarm,
    emissive: COL.bulbWarm,
    emissiveIntensity: 0,
    roughness: 0.4,
  });

  /* ---- base ---- */
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.1, 48), matBody);
  base.position.y = 0.05;
  base.castShadow = shadows;
  base.receiveShadow = shadows;
  root.add(base);
  const baseRing = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.02, 12, 48), matChrome);
  baseRing.rotation.x = Math.PI / 2;
  baseRing.position.y = 0.1;
  root.add(baseRing);

  /* light pool on the desk, in front of the lamp */
  const pool = decal(lightPoolTex(), 1.6, 1.6);
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0.9, 0.11, 0);
  root.add(pool);
  const poolMat = pool.material as THREE.MeshBasicMaterial;
  poolMat.opacity = 0;

  /* ---- lower arm, hinged at the base ---- */
  const lowerPivot = new THREE.Group();
  lowerPivot.position.set(0, 0.1, 0);
  root.add(lowerPivot);

  const ARM_LEN = 1.1;
  const armGeo = new THREE.CylinderGeometry(0.06, 0.06, ARM_LEN, 20);
  const lowerArm = new THREE.Mesh(armGeo, matBody);
  lowerArm.position.y = ARM_LEN / 2;
  lowerArm.castShadow = shadows;
  lowerPivot.add(lowerArm);

  const lowerSpring = springMesh(ARM_LEN * 0.7, 0.1, 9, matSpring);
  lowerSpring.position.y = ARM_LEN / 2;
  lowerPivot.add(lowerSpring);

  const elbowJoint = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 20), matJoint);
  elbowJoint.position.y = ARM_LEN;
  elbowJoint.castShadow = shadows;
  lowerPivot.add(elbowJoint);

  /* ---- upper arm, hinged at the elbow ---- */
  const upperPivot = new THREE.Group();
  upperPivot.position.y = ARM_LEN;
  lowerPivot.add(upperPivot);

  const upperArm = new THREE.Mesh(armGeo, matBody);
  upperArm.position.y = ARM_LEN / 2;
  upperArm.castShadow = shadows;
  upperPivot.add(upperArm);

  const upperSpring = springMesh(ARM_LEN * 0.7, 0.1, 9, matSpring);
  upperSpring.position.y = ARM_LEN / 2;
  upperPivot.add(upperSpring);

  const headJoint = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 20), matJoint);
  headJoint.position.y = ARM_LEN;
  headJoint.castShadow = shadows;
  upperPivot.add(headJoint);

  /* ---- head: conical shade, tilts independently ---- */
  const headPivot = new THREE.Group();
  headPivot.position.y = ARM_LEN;
  upperPivot.add(headPivot);

  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.4, 32, 1, true), matBody);
  shade.rotation.x = Math.PI; // opening faces down
  shade.position.y = -0.2;
  shade.castShadow = shadows;
  headPivot.add(shade);

  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 16), matBulb);
  bulb.position.y = -0.28;
  headPivot.add(bulb);

  const bulbLight = new THREE.PointLight(COL.bulbWarm, 0, 3.5, 2);
  bulbLight.position.y = -0.28;
  bulbLight.castShadow = shadows;
  headPivot.add(bulbLight);

  /* neck collar, chrome accent */
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.015, 10, 24), matChrome);
  collar.rotation.x = Math.PI / 2;
  headPivot.add(collar);

  /* ---- animation ---- */
  const CYCLE = 9.0;
  const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const smooth = (x: number, a: number, b: number): number =>
    easeInOut(THREE.MathUtils.clamp((x - a) / (b - a), 0, 1));

  const REST = { lower: 0.35, upper: -1.1, head: 0.5 };
  const LEAN = { lower: 0.75, upper: -1.55, head: 0.7 };

  function updateAnimation(time: number): void {
    const t = time % CYCLE;
    const leanIn = smooth(t, 0.3, 1.8);
    const leanOut = smooth(t, 6.6, 8.0);
    const lean = leanIn * (1 - leanOut);

    lowerPivot.rotation.z = -THREE.MathUtils.lerp(REST.lower, LEAN.lower, lean);
    upperPivot.rotation.z = -THREE.MathUtils.lerp(REST.upper, LEAN.upper, lean);
    headPivot.rotation.z = -THREE.MathUtils.lerp(REST.head, LEAN.head, lean);

    const onT = smooth(t, 1.6, 2.2) * (1 - smooth(t, 6.2, 6.8));
    matBulb.emissiveIntensity = onT * 1.8;
    bulbLight.intensity = onT * 2.2;
    poolMat.opacity = onT * 0.9;

    root.rotation.y = Math.sin(time * 0.15) * 0.04;
  }

  updateAnimation(0);
  root.userData.tick = (_dt: number, elapsed: number): void => updateAnimation(elapsed);

  return root;
}

export function createDeskLampLookDevLights(): THREE.Group {
  const lights = new THREE.Group();
  const key = new THREE.DirectionalLight(0xffffff, 2.0);
  key.position.set(3, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  lights.add(key);
  const fill = new THREE.DirectionalLight(0xdfe6ff, 0.5);
  fill.position.set(-4, 2, 3);
  lights.add(fill);
  lights.add(new THREE.HemisphereLight(0xffffff, 0x2a2a2e, 0.4));
  return lights;
}

export function makeDeskLampBackground(): THREE.Color {
  return new THREE.Color(0x2b2d33);
}
