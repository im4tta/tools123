import * as THREE from 'three';

/**
 * Simplified tabletop solar system model, built from primitives in the same
 * style as the rest of this set. Focus: an emissive sun, six orbiting
 * planets (each spinning on its own axis while it circles), thin orbit-path
 * rings, a banded gas-giant texture for Jupiter and Saturn, a moon orbiting
 * Earth, and a tilted ring system for Saturn.
 *
 * Live animation (looping, non-cyclic/continuous): every planet orbits the
 * sun at a speed roughly scaled to its real relative period (inner planets
 * faster), spins on its own axis, Earth's moon circles it, and the sun's
 * glow pulses gently.
 */

export interface SolarSystemOptions {
  shadows?: boolean;
}

const COL = {
  sun: 0xffcc33,
  sunCore: 0xfff2b0,
  mercury: 0x9c9488,
  venus: 0xd9b46c,
  moon: 0xc4c4c4,
  mars: 0xc1440e,
  jupiter: 0xd9b98a,
  saturn: 0xe0c17a,
  saturnRing: 0xc9b280,
  orbit: 0x445566,
};

function textTexture(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  w = 256,
  h = 128,
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

function bandedTex(base: number, stripes: number[]): THREE.CanvasTexture {
  return textTexture((ctx, w, h) => {
    ctx.fillStyle = '#' + base.toString(16).padStart(6, '0');
    ctx.fillRect(0, 0, w, h);
    stripes.forEach((color, i) => {
      ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
      const y = (i / stripes.length) * h;
      ctx.globalAlpha = 0.5;
      ctx.fillRect(0, y, w, h / stripes.length / 1.4);
    });
    ctx.globalAlpha = 1;
  });
}

function earthTex(): THREE.CanvasTexture {
  return textTexture((ctx, w, h) => {
    ctx.fillStyle = '#3a6ea5';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#4a8f4a';
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.ellipse(Math.random() * w, Math.random() * h, 15 + Math.random() * 25, 8 + Math.random() * 12, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

interface PlanetDef {
  name: string;
  radius: number;
  orbitRadius: number;
  orbitSpeed: number;
  spinSpeed: number;
  color?: number;
  map?: THREE.CanvasTexture;
  tilt?: number;
  moon?: boolean;
  ring?: boolean;
}

export function createSolarSystemModel(options: SolarSystemOptions = {}): THREE.Group {
  const shadows = options.shadows ?? true;
  const root = new THREE.Group();

  const matSun = new THREE.MeshStandardMaterial({ color: COL.sunCore, emissive: COL.sun, emissiveIntensity: 1.8 });
  const matOrbit = new THREE.MeshBasicMaterial({ color: COL.orbit, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
  const matMoon = new THREE.MeshStandardMaterial({ color: COL.moon, roughness: 0.9 });
  const matSaturnRing = new THREE.MeshStandardMaterial({
    color: COL.saturnRing,
    roughness: 0.7,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
  });

  /* ---- sun ---- */
  const sun = new THREE.Mesh(new THREE.SphereGeometry(0.4, 32, 24), matSun);
  root.add(sun);
  const sunLight = new THREE.PointLight(0xfff2c0, 2.2, 30, 1.5);
  root.add(sunLight);

  const planets: PlanetDef[] = [
    { name: 'mercury', radius: 0.07, orbitRadius: 0.9, orbitSpeed: 0.9, spinSpeed: 0.4, color: COL.mercury },
    { name: 'venus', radius: 0.11, orbitRadius: 1.25, orbitSpeed: 0.65, spinSpeed: 0.15, color: COL.venus },
    { name: 'earth', radius: 0.12, orbitRadius: 1.65, orbitSpeed: 0.5, spinSpeed: 1.2, map: earthTex(), moon: true },
    { name: 'mars', radius: 0.09, orbitRadius: 2.05, orbitSpeed: 0.4, spinSpeed: 1.1, color: COL.mars },
    {
      name: 'jupiter',
      radius: 0.28,
      orbitRadius: 2.7,
      orbitSpeed: 0.22,
      spinSpeed: 2.4,
      map: bandedTex(COL.jupiter, [0xc9a876, 0xe0cfa0, 0xb08858, 0xd9b98a]),
    },
    {
      name: 'saturn',
      radius: 0.24,
      orbitRadius: 3.4,
      orbitSpeed: 0.16,
      spinSpeed: 2.1,
      map: bandedTex(COL.saturn, [0xead9a0, 0xd9c17a, 0xf0e2b0]),
      tilt: 0.45,
      ring: true,
    },
  ];

  const orbitPivots: THREE.Group[] = [];
  const planetMeshes: THREE.Mesh[] = [];
  const moonPivots: (THREE.Group | null)[] = [];

  for (const def of planets) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(def.orbitRadius - 0.006, def.orbitRadius + 0.006, 64), matOrbit);
    ring.rotation.x = -Math.PI / 2;
    root.add(ring);

    const pivot = new THREE.Group();
    root.add(pivot);

    const planetGroup = new THREE.Group();
    planetGroup.position.x = def.orbitRadius;
    if (def.tilt) planetGroup.rotation.z = def.tilt;
    pivot.add(planetGroup);

    const mat = def.map
      ? new THREE.MeshStandardMaterial({ map: def.map, roughness: 0.7 })
      : new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.7 });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(def.radius, 24, 18), mat);
    mesh.castShadow = shadows;
    mesh.receiveShadow = shadows;
    planetGroup.add(mesh);

    let moonPivot: THREE.Group | null = null;
    if (def.moon) {
      moonPivot = new THREE.Group();
      planetGroup.add(moonPivot);
      const moon = new THREE.Mesh(new THREE.SphereGeometry(def.radius * 0.27, 14, 10), matMoon);
      moon.position.x = def.radius * 2.6;
      moonPivot.add(moon);
    }

    if (def.ring) {
      const sRing = new THREE.Mesh(new THREE.RingGeometry(def.radius * 1.4, def.radius * 2.2, 48), matSaturnRing);
      sRing.rotation.x = Math.PI / 2;
      planetGroup.add(sRing);
    }

    orbitPivots.push(pivot);
    planetMeshes.push(mesh);
    moonPivots.push(moonPivot);
  }

  /* ---- animation ---- */
  function updateAnimation(time: number): void {
    matSun.emissiveIntensity = 1.8 + Math.sin(time * 1.5) * 0.2;

    for (let i = 0; i < planets.length; i++) {
      const def = planets[i];
      orbitPivots[i].rotation.y = time * def.orbitSpeed;
      planetMeshes[i].rotation.y = time * def.spinSpeed;
      const moonPivot = moonPivots[i];
      if (moonPivot) moonPivot.rotation.y = time * 3.2;
    }
  }

  updateAnimation(0);
  root.userData.tick = (_dt: number, elapsed: number): void => updateAnimation(elapsed);

  return root;
}

export function createSolarSystemLookDevLights(): THREE.Group {
  const lights = new THREE.Group();
  const fill = new THREE.DirectionalLight(0xdfe6ff, 0.35);
  fill.position.set(-4, 3, 4);
  lights.add(fill);
  lights.add(new THREE.AmbientLight(0x223344, 0.5));
  return lights;
}

export function makeSolarSystemBackground(): THREE.Color {
  return new THREE.Color(0x03040a);
}
