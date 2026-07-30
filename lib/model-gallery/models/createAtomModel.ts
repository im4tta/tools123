import * as THREE from 'three';

/**
 * Bohr-style atom model, built from primitives in the same style as the
 * rest of this set. Focus: a clustered nucleus of protons and neutrons,
 * tilted electron-shell rings, and small emissive electrons orbiting each
 * shell at their own speed.
 *
 * Live animation (looping, non-cyclic/continuous): electrons circle their
 * shells continuously (inner shells faster), the nucleus pulses gently as
 * if vibrating, and the whole atom slowly tumbles in space.
 */

export interface AtomOptions {
  shadows?: boolean;
  protons?: number;
  neutrons?: number;
  shellElectronCounts?: number[];
}

const COL = {
  proton: 0xd1573a,
  neutron: 0x7a7f88,
  electron: 0x4fd1e0,
  shell: 0x3aa6d1,
};

export function createAtomModel(options: AtomOptions = {}): THREE.Group {
  const shadows = options.shadows ?? true;
  const protonCount = options.protons ?? 6;
  const neutronCount = options.neutrons ?? 6;
  const shellCounts = options.shellElectronCounts ?? [2, 4];
  const root = new THREE.Group();

  const matProton = new THREE.MeshStandardMaterial({ color: COL.proton, roughness: 0.4 });
  const matNeutron = new THREE.MeshStandardMaterial({ color: COL.neutron, roughness: 0.45 });
  const matShell = new THREE.MeshBasicMaterial({ color: COL.shell, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
  const matElectron = new THREE.MeshStandardMaterial({ color: COL.electron, emissive: COL.electron, emissiveIntensity: 1.6 });

  /* ---- nucleus: jittered cluster of protons + neutrons ---- */
  const nucleus = new THREE.Group();
  root.add(nucleus);
  const nucleonGeo = new THREE.SphereGeometry(0.11, 16, 12);
  const total = protonCount + neutronCount;
  for (let i = 0; i < total; i++) {
    const mesh = new THREE.Mesh(nucleonGeo, i < protonCount ? matProton : matNeutron);
    const r = 0.14 * Math.cbrt(Math.random());
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    mesh.position.set(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi));
    mesh.castShadow = shadows;
    nucleus.add(mesh);
  }

  /* ---- electron shells, each tilted differently ---- */
  interface ShellDef {
    radius: number;
    speed: number;
    electrons: THREE.Mesh[];
  }
  const shells: ShellDef[] = [];
  shellCounts.forEach((count, i) => {
    const radius = 0.7 + i * 0.55;
    const tilt = new THREE.Euler(
      THREE.MathUtils.degToRad(20 + i * 35),
      THREE.MathUtils.degToRad(15 * i),
      THREE.MathUtils.degToRad(10 * i),
    );
    const ring = new THREE.Group();
    ring.rotation.copy(tilt);
    root.add(ring);

    const shellMesh = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.006, 8, 64), matShell);
    ring.add(shellMesh);

    const electrons: THREE.Mesh[] = [];
    for (let e = 0; e < count; e++) {
      const electron = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), matElectron);
      const angle = (e / count) * Math.PI * 2;
      electron.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      ring.add(electron);
      electrons.push(electron);
    }

    shells.push({ radius, speed: 1.4 - i * 0.35, electrons });
  });

  /* ---- animation ---- */
  function updateAnimation(time: number): void {
    shells.forEach((shell) => {
      const count = shell.electrons.length;
      shell.electrons.forEach((electron, e) => {
        const angle = (e / count) * Math.PI * 2 + time * shell.speed;
        electron.position.set(Math.cos(angle) * shell.radius, 0, Math.sin(angle) * shell.radius);
      });
    });

    const pulse = 1 + Math.sin(time * 3) * 0.03;
    nucleus.scale.setScalar(pulse);

    root.rotation.y = time * 0.15;
    root.rotation.x = Math.sin(time * 0.1) * 0.1;
  }

  updateAnimation(0);
  root.userData.tick = (_dt: number, elapsed: number): void => updateAnimation(elapsed);

  return root;
}

export function createAtomLookDevLights(): THREE.Group {
  const lights = new THREE.Group();
  const key = new THREE.DirectionalLight(0xe8f4ff, 2.2);
  key.position.set(3, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  lights.add(key);
  const fill = new THREE.DirectionalLight(0xdfe6ff, 0.5);
  fill.position.set(-4, 2, 3);
  lights.add(fill);
  lights.add(new THREE.HemisphereLight(0xffffff, 0x10141c, 0.4));
  return lights;
}

export function makeAtomBackground(): THREE.Color {
  return new THREE.Color(0x070912);
}
