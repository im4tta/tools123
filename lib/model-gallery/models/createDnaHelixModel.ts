import * as THREE from 'three';

/**
 * Double-helix DNA strand model, built from primitives in the same style as
 * the rest of this set. Focus: two intertwined sugar-phosphate backbones
 * (tubes along a helical curve), evenly spaced base-pair rungs colored by
 * nucleotide type (adenine-thymine, cytosine-guanine), and a soft travelling
 * highlight that sweeps up and down the strand like a replication scan.
 *
 * Live animation (looping, non-cyclic/continuous): the whole helix rotates
 * steadily about its long axis, bobs gently, and a band of brighter-glowing
 * rungs travels back and forth along the length of the strand.
 */

export interface DnaHelixOptions {
  shadows?: boolean;
}

const COL = {
  backboneA: 0x3aa6d1,
  backboneB: 0xd1573a,
  adenine: 0x4caf50,
  thymine: 0xffca28,
  cytosine: 0x7e57c2,
  guanine: 0xef5350,
};

const HEIGHT = 2.6;
const RADIUS = 0.34;
const TURNS = 3.2;
const RUNG_COUNT = 26;
const PAIR_TYPES: Array<[number, number]> = [
  [COL.adenine, COL.thymine],
  [COL.thymine, COL.adenine],
  [COL.cytosine, COL.guanine],
  [COL.guanine, COL.cytosine],
];

function helixPoint(t: number, phase: number): THREE.Vector3 {
  const angle = t * TURNS * Math.PI * 2 + phase;
  const y = t * HEIGHT - HEIGHT / 2;
  return new THREE.Vector3(Math.cos(angle) * RADIUS, y, Math.sin(angle) * RADIUS);
}

export function createDnaHelixModel(options: DnaHelixOptions = {}): THREE.Group {
  const shadows = options.shadows ?? true;
  const root = new THREE.Group();

  const matBackboneA = new THREE.MeshPhysicalMaterial({ color: COL.backboneA, roughness: 0.3, metalness: 0.1, clearcoat: 0.5 });
  const matBackboneB = new THREE.MeshPhysicalMaterial({ color: COL.backboneB, roughness: 0.3, metalness: 0.1, clearcoat: 0.5 });

  const spinGroup = new THREE.Group();
  root.add(spinGroup);

  /* ---- two backbone tubes ---- */
  const SEGMENTS = 220;
  const pointsA: THREE.Vector3[] = [];
  const pointsB: THREE.Vector3[] = [];
  for (let i = 0; i <= SEGMENTS; i++) {
    const t = i / SEGMENTS;
    pointsA.push(helixPoint(t, 0));
    pointsB.push(helixPoint(t, Math.PI));
  }
  const curveA = new THREE.CatmullRomCurve3(pointsA);
  const curveB = new THREE.CatmullRomCurve3(pointsB);
  const backboneA = new THREE.Mesh(new THREE.TubeGeometry(curveA, 220, 0.028, 10, false), matBackboneA);
  const backboneB = new THREE.Mesh(new THREE.TubeGeometry(curveB, 220, 0.028, 10, false), matBackboneB);
  backboneA.castShadow = shadows;
  backboneB.castShadow = shadows;
  spinGroup.add(backboneA, backboneB);

  /* ---- rungs (base pairs): two colored half-cylinders + end caps ---- */
  const rungGroup = new THREE.Group();
  spinGroup.add(rungGroup);
  const rungMeshes: THREE.Mesh[] = [];

  for (let i = 0; i < RUNG_COUNT; i++) {
    const t = i / (RUNG_COUNT - 1);
    const pA = helixPoint(t, 0);
    const pB = helixPoint(t, Math.PI);
    const mid = pA.clone().add(pB).multiplyScalar(0.5);
    const pair = PAIR_TYPES[i % PAIR_TYPES.length];

    const matHalfA = new THREE.MeshStandardMaterial({ color: pair[0], emissive: pair[0], emissiveIntensity: 0.25, roughness: 0.4 });
    const matHalfB = new THREE.MeshStandardMaterial({ color: pair[1], emissive: pair[1], emissiveIntensity: 0.25, roughness: 0.4 });

    const halfLen = pA.distanceTo(mid);
    const half1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, halfLen, 8), matHalfA);
    const m1 = pA.clone().add(mid).multiplyScalar(0.5);
    half1.position.copy(m1);
    half1.lookAt(mid);
    half1.rotateX(Math.PI / 2);
    half1.castShadow = shadows;
    rungGroup.add(half1);
    rungMeshes.push(half1);

    const half2 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, halfLen, 8), matHalfB);
    const m2 = pB.clone().add(mid).multiplyScalar(0.5);
    half2.position.copy(m2);
    half2.lookAt(mid);
    half2.rotateX(Math.PI / 2);
    half2.castShadow = shadows;
    rungGroup.add(half2);
    rungMeshes.push(half2);

    const capA = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 8), matHalfA);
    capA.position.copy(pA);
    rungGroup.add(capA);

    const capB = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 8), matHalfB);
    capB.position.copy(pB);
    rungGroup.add(capB);
  }

  /* ---- animation ---- */
  function updateAnimation(time: number): void {
    spinGroup.rotation.y = time * 0.5;
    root.position.y = Math.sin(time * 0.4) * 0.04;

    // travelling highlight: a scan position eases back and forth along the
    // strand (0 = bottom, 1 = top), brightening nearby rungs
    const scan = Math.sin(time * 0.6) * 0.5 + 0.5;
    for (let i = 0; i < RUNG_COUNT; i++) {
      const t = i / (RUNG_COUNT - 1);
      const dist = Math.abs(t - scan);
      const glow = Math.max(0, 1 - dist * 6);
      const matA = rungMeshes[i * 2].material as THREE.MeshStandardMaterial;
      const matB = rungMeshes[i * 2 + 1].material as THREE.MeshStandardMaterial;
      matA.emissiveIntensity = 0.25 + glow * 1.4;
      matB.emissiveIntensity = 0.25 + glow * 1.4;
    }
  }

  updateAnimation(0);
  root.userData.tick = (_dt: number, elapsed: number): void => updateAnimation(elapsed);

  return root;
}

export function createDnaHelixLookDevLights(): THREE.Group {
  const lights = new THREE.Group();
  const key = new THREE.DirectionalLight(0xe8f0ff, 2.2);
  key.position.set(3, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  lights.add(key);
  const fill = new THREE.DirectionalLight(0xdfe6ff, 0.5);
  fill.position.set(-4, 2, 3);
  lights.add(fill);
  lights.add(new THREE.HemisphereLight(0xffffff, 0x1a1a24, 0.4));
  return lights;
}

export function makeDnaHelixBackground(): THREE.Color {
  return new THREE.Color(0x0c0e16);
}
