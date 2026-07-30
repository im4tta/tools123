import * as THREE from 'three';

/**
 * Potted echeveria-style succulent, built from primitives in the same style
 * as the rest of this set. Focus: a lathed terracotta pot with a rolled rim
 * and drainage-saucer, a soil cap, and a rosette of tapered, scale-shaped
 * leaves arranged in three staggered rings around a central bud — plus a
 * couple of small offset "pups" at the base, the way echeverias actually
 * grow.
 *
 * Live animation (looping, continuous): a slow, organic sway driven by
 * layered sine waves per-leaf-ring (outer leaves move more than inner), as
 * if in a light breeze.
 */

export interface PottedSucculentOptions {
  shadows?: boolean;
}

const COL = {
  terracotta: 0xb5603d,
  terracottaDark: 0x8a4529,
  soil: 0x3c2a1e,
  leafOuter: 0x6f8f5c,
  leafInner: 0x8fae72,
  leafBlush: 0xb96a5c,
  saucer: 0xc97148,
};

/** Single tapered succulent leaf: a flattened, pointed teardrop. */
function leafGeometry(len: number, width: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.quadraticCurveTo(width / 2, len * 0.3, width * 0.34, len * 0.75);
  shape.quadraticCurveTo(width * 0.12, len, 0, len);
  shape.quadraticCurveTo(-width * 0.12, len, -width * 0.34, len * 0.75);
  shape.quadraticCurveTo(-width / 2, len * 0.3, 0, 0);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: width * 0.22,
    bevelEnabled: true,
    bevelThickness: width * 0.08,
    bevelSize: width * 0.06,
    bevelSegments: 3,
    curveSegments: 10,
  });
  geo.translate(0, 0, -width * 0.11);
  geo.rotateX(Math.PI / 2);
  return geo;
}

function rosette(
  rings: { count: number; leafLen: number; leafW: number; tilt: number; radius: number; mat: THREE.Material }[],
): THREE.Group {
  const g = new THREE.Group();
  const allLeaves: THREE.Mesh[] = [];
  rings.forEach((ring, ringIdx) => {
    const geo = leafGeometry(ring.leafLen, ring.leafW);
    for (let i = 0; i < ring.count; i++) {
      const a = (i / ring.count) * Math.PI * 2 + ringIdx * 0.4;
      const leaf = new THREE.Mesh(geo, ring.mat);
      leaf.position.set(Math.cos(a) * ring.radius, 0, Math.sin(a) * ring.radius);
      leaf.rotation.y = -a + Math.PI / 2;
      leaf.rotation.x = ring.tilt;
      leaf.userData.ring = ringIdx;
      leaf.userData.angle = a;
      leaf.castShadow = true;
      g.add(leaf);
      allLeaves.push(leaf);
    }
  });
  g.userData.leaves = allLeaves;
  return g;
}

export function createPottedSucculentModel(options: PottedSucculentOptions = {}): THREE.Group {
  const shadows = options.shadows ?? true;
  const root = new THREE.Group();

  const matPot = new THREE.MeshPhysicalMaterial({
    color: COL.terracotta,
    roughness: 0.85,
    metalness: 0,
    clearcoat: 0.1,
  });
  const matSaucer = new THREE.MeshStandardMaterial({ color: COL.saucer, roughness: 0.8 });
  const matSoil = new THREE.MeshStandardMaterial({ color: COL.soil, roughness: 1.0 });
  const matLeafOuter = new THREE.MeshPhysicalMaterial({
    color: COL.leafOuter,
    roughness: 0.4,
    clearcoat: 0.3,
    clearcoatRoughness: 0.5,
    sheen: 0.6,
    sheenColor: new THREE.Color(0xcfe0bb),
  });
  const matLeafInner = new THREE.MeshPhysicalMaterial({
    color: COL.leafInner,
    roughness: 0.35,
    clearcoat: 0.35,
    clearcoatRoughness: 0.4,
  });
  const matLeafBlush = new THREE.MeshPhysicalMaterial({
    color: COL.leafBlush,
    roughness: 0.35,
    clearcoat: 0.4,
    clearcoatRoughness: 0.4,
  });

  /* ---- saucer + pot: lathed profile for a rolled rim and tapered body ---- */
  const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.62, 0.06, 40), matSaucer);
  saucer.position.y = 0.03;
  saucer.castShadow = shadows;
  saucer.receiveShadow = shadows;
  root.add(saucer);

  const potProfile: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.4, 0.0),
    new THREE.Vector2(0.42, 0.05),
    new THREE.Vector2(0.38, 0.08),
    new THREE.Vector2(0.32, 0.55),
    new THREE.Vector2(0.36, 0.62),
    new THREE.Vector2(0.4, 0.7),
    new THREE.Vector2(0.34, 0.72),
    new THREE.Vector2(0.0, 0.7),
  ];
  const potGeo = new THREE.LatheGeometry(potProfile, 40);
  const pot = new THREE.Mesh(potGeo, matPot);
  pot.position.y = 0.08;
  pot.castShadow = shadows;
  pot.receiveShadow = shadows;
  root.add(pot);

  const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.06, 32), matSoil);
  soil.position.y = 0.08 + 0.68;
  root.add(soil);

  /* ---- rosette: three rings, outer largest/flattest, inner small/upright ---- */
  const plant = rosette([
    { count: 8, leafLen: 0.55, leafW: 0.22, tilt: 1.15, radius: 0.06, mat: matLeafOuter },
    { count: 8, leafLen: 0.42, leafW: 0.17, tilt: 0.85, radius: 0.05, mat: matLeafBlush },
    { count: 7, leafLen: 0.28, leafW: 0.12, tilt: 0.45, radius: 0.03, mat: matLeafInner },
    { count: 5, leafLen: 0.15, leafW: 0.07, tilt: 0.15, radius: 0.015, mat: matLeafInner },
  ]);
  plant.position.y = 0.08 + 0.7;
  root.add(plant);

  /* two small "pup" rosettes at the base */
  function pup(x: number, z: number, scale: number): THREE.Group {
    const p = rosette([
      { count: 6, leafLen: 0.16, leafW: 0.08, tilt: 1.0, radius: 0.02, mat: matLeafOuter },
      { count: 5, leafLen: 0.09, leafW: 0.045, tilt: 0.5, radius: 0.01, mat: matLeafInner },
    ]);
    p.scale.setScalar(scale);
    p.position.set(x, 0.08 + 0.7, z);
    return p;
  }
  const pup1 = pup(0.22, 0.18, 0.7);
  const pup2 = pup(-0.24, 0.12, 0.55);
  root.add(pup1, pup2);

  /* ---- animation: layered sway, outer leaves move more than inner ---- */
  const allSwaying: { leaves: THREE.Mesh[]; ampMul: number }[] = [
    { leaves: plant.userData.leaves as THREE.Mesh[], ampMul: 1 },
    { leaves: pup1.userData.leaves as THREE.Mesh[], ampMul: 0.6 },
    { leaves: pup2.userData.leaves as THREE.Mesh[], ampMul: 0.6 },
  ];

  function updateAnimation(time: number): void {
    root.rotation.z = Math.sin(time * 0.35) * 0.02;
    root.rotation.x = Math.sin(time * 0.27 + 1.1) * 0.015;

    for (const group of allSwaying) {
      for (const leaf of group.leaves) {
        const ring = leaf.userData.ring as number;
        const angle = leaf.userData.angle as number;
        const amp = (0.03 + ring * 0.025) * group.ampMul;
        const phase = angle * 1.7;
        const sway = Math.sin(time * 0.9 + phase) * amp;
        leaf.rotation.z = sway;
        leaf.rotation.x =
          (leaf.userData.ring === 0 ? 1.15 : leaf.userData.ring === 1 ? 0.85 : leaf.userData.ring === 2 ? 0.45 : 0.15) +
          Math.sin(time * 0.7 + phase * 0.6) * amp * 0.6;
      }
    }
  }

  updateAnimation(0);
  root.userData.tick = (_dt: number, elapsed: number): void => updateAnimation(elapsed);

  return root;
}

export function createPottedSucculentLookDevLights(): THREE.Group {
  const lights = new THREE.Group();
  const key = new THREE.DirectionalLight(0xfff6e8, 2.4);
  key.position.set(3, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  lights.add(key);
  const fill = new THREE.DirectionalLight(0xdfe6ff, 0.5);
  fill.position.set(-4, 2, 3);
  lights.add(fill);
  const rim = new THREE.DirectionalLight(0xd8ffcf, 0.4);
  rim.position.set(-2, 3, -5);
  lights.add(rim);
  lights.add(new THREE.HemisphereLight(0xe8f0d8, 0x5a4230, 0.5));
  return lights;
}

export function makePottedSucculentBackground(): THREE.Color {
  return new THREE.Color(0xf0ece1);
}
