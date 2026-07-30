import * as THREE from 'three';

/**
 * Desktop world globe on a brass meridian stand, built from primitives in
 * the same style as the rest of this set. Focus: a textured, tilted globe
 * with a semi-transparent cloud layer, a fixed brass meridian ring and
 * turned-wood base.
 *
 * Live animation (looping, non-cyclic/continuous): the globe spins steadily
 * on its 23.5° tilted axis while the cloud layer drifts past at a slightly
 * different rate, and the whole assembly rocks very gently as if resting
 * on a desk.
 */

export interface GlobeOptions {
  shadows?: boolean;
}

const COL = {
  ocean: 0x1c5f8c,
  wood: 0x5a3a22,
  brass: 0xc9a24b,
  brassDark: 0x8a6d2e,
};

function textTexture(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  w = 1024,
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

/** Simplified, stylised continents on an equirectangular ocean field. */
function earthTex(): THREE.CanvasTexture {
  return textTexture((ctx, w, h) => {
    ctx.fillStyle = '#1c5f8c';
    ctx.fillRect(0, 0, w, h);

    const blob = (points: [number, number][], color: string): void => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(points[0][0] * w, points[0][1] * h);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0] * w, points[i][1] * h);
      ctx.closePath();
      ctx.fill();
    };

    blob([[0.18,0.18],[0.28,0.16],[0.32,0.30],[0.26,0.42],[0.30,0.50],[0.24,0.62],[0.20,0.78],[0.16,0.60],[0.14,0.40],[0.15,0.25]], '#4a8f4a');
    blob([[0.46,0.14],[0.55,0.12],[0.58,0.22],[0.56,0.36],[0.60,0.48],[0.54,0.64],[0.49,0.62],[0.47,0.44],[0.44,0.30],[0.45,0.20]], '#3f7a40');
    blob([[0.60,0.10],[0.82,0.12],[0.88,0.22],[0.80,0.32],[0.86,0.40],[0.74,0.42],[0.64,0.34],[0.60,0.22]], '#4a8f4a');
    blob([[0.82,0.58],[0.92,0.56],[0.94,0.66],[0.84,0.68]], '#5a8f3f');

    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    for (let i = 0; i < 300; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 12; i++) {
      const x = (i / 12) * w;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let i = 1; i < 6; i++) {
      const y = (i / 6) * h;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }, 1024, 512);
}

/** Alpha-blotched cloud layer baked directly with transparency. */
function cloudTex(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * c.width;
    const y = Math.random() * c.height;
    const rx = 20 + Math.random() * 60;
    const ry = 8 + Math.random() * 20;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createGlobeModel(options: GlobeOptions = {}): THREE.Group {
  const shadows = options.shadows ?? true;
  const root = new THREE.Group();

  const matWood = new THREE.MeshPhysicalMaterial({ color: COL.wood, roughness: 0.4, clearcoat: 0.4 });
  const matBrass = new THREE.MeshStandardMaterial({ color: COL.brass, roughness: 0.3, metalness: 0.9 });
  const matBrassDark = new THREE.MeshStandardMaterial({ color: COL.brassDark, roughness: 0.35, metalness: 0.85 });
  const matEarth = new THREE.MeshStandardMaterial({ map: earthTex(), roughness: 0.75, metalness: 0 });
  const matCloud = new THREE.MeshStandardMaterial({
    map: cloudTex(),
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    roughness: 1,
  });

  /* ---- base ---- */
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 0.12, 32), matWood);
  base.position.y = 0.06;
  base.castShadow = shadows;
  base.receiveShadow = shadows;
  root.add(base);

  const baseRing = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.02, 8, 32), matBrass);
  baseRing.rotation.x = Math.PI / 2;
  baseRing.position.y = 0.12;
  root.add(baseRing);

  /* ---- support posts rising to the meridian ring ---- */
  const armHeight = 0.95;
  for (const sx of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, armHeight, 12), matBrass);
    post.position.set(sx * 0.42, 0.12 + armHeight / 2, 0);
    post.castShadow = shadows;
    root.add(post);
  }

  /* ---- fixed meridian ring (does not rotate with the globe) ---- */
  const GLOBE_R = 0.55;
  const meridian = new THREE.Mesh(new THREE.TorusGeometry(GLOBE_R + 0.03, 0.018, 10, 48), matBrassDark);
  meridian.position.y = 0.12 + armHeight;
  root.add(meridian);

  /* ---- tilted globe assembly ---- */
  const tiltGroup = new THREE.Group();
  tiltGroup.position.y = 0.12 + armHeight;
  tiltGroup.rotation.z = THREE.MathUtils.degToRad(23.5);
  root.add(tiltGroup);

  const spinGroup = new THREE.Group();
  tiltGroup.add(spinGroup);

  const globe = new THREE.Mesh(new THREE.SphereGeometry(GLOBE_R, 48, 32), matEarth);
  globe.castShadow = shadows;
  globe.receiveShadow = shadows;
  spinGroup.add(globe);

  const cloudGroup = new THREE.Group();
  tiltGroup.add(cloudGroup);
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(GLOBE_R + 0.008, 48, 32), matCloud);
  cloudGroup.add(clouds);

  const axisRod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, GLOBE_R * 2 + 0.08, 8), matBrass);
  tiltGroup.add(axisRod);

  /* ---- animation ---- */
  function updateAnimation(time: number): void {
    spinGroup.rotation.y = time * 0.35;
    cloudGroup.rotation.y = time * 0.24;
    root.rotation.z = Math.sin(time * 0.3) * 0.01;
  }

  updateAnimation(0);
  root.userData.tick = (_dt: number, elapsed: number): void => updateAnimation(elapsed);

  return root;
}

export function createGlobeLookDevLights(): THREE.Group {
  const lights = new THREE.Group();
  const key = new THREE.DirectionalLight(0xfff6e8, 2.4);
  key.position.set(3, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  lights.add(key);
  const fill = new THREE.DirectionalLight(0xdfe6ff, 0.5);
  fill.position.set(-4, 2, 3);
  lights.add(fill);
  lights.add(new THREE.HemisphereLight(0xffffff, 0x2a2420, 0.4));
  return lights;
}

export function makeGlobeBackground(): THREE.Color {
  return new THREE.Color(0xe4ddc8);
}
