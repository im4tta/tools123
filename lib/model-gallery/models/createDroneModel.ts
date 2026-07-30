import * as THREE from 'three';

/**
 * Consumer quadcopter drone, built from primitives in the same style as the
 * rest of this set. Focus: a matte carbon-fibre-weave body with a gimbal
 * camera slung underneath, four arms ending in motor nacelles with
 * genuinely spinning props (blurred via additive double-blades at speed),
 * red/green nav lights that alternate, and a downward-facing landing-gear
 * pair of skids.
 *
 * Live animation (looping, continuous): props spin continuously, the whole
 * craft hovers with a bob + slight yaw drift, nav lights blink on a
 * standard aviation-style pattern, and the gimbal camera makes small
 * scanning adjustments.
 */

export interface DroneOptions {
  shadows?: boolean;
}

const COL = {
  carbon: 0x1c1d20,
  carbonWeave: 0x2a2c30,
  accent: 0xd94c3d,
  propGrey: 0x3a3c40,
  lensGlass: 0x0a1520,
  navRed: 0xff3b30,
  navGreen: 0x35d16b,
};

function textTexture(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  w = 256,
  h = 256,
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(4, 4);
  return t;
}

function weaveTex(): THREE.CanvasTexture {
  return textTexture((ctx, w, h) => {
    ctx.fillStyle = '#1c1d20';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 3;
    for (let i = -h; i < w + h; i += 12) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + h, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i, h);
      ctx.lineTo(i + h, 0);
      ctx.stroke();
    }
  }, 128, 128);
}

export function createDroneModel(options: DroneOptions = {}): THREE.Group {
  const shadows = options.shadows ?? true;
  const root = new THREE.Group();
  root.position.y = 1.0;

  const matCarbon = new THREE.MeshPhysicalMaterial({
    color: COL.carbon,
    map: weaveTex(),
    roughness: 0.5,
    metalness: 0.2,
    clearcoat: 0.5,
    clearcoatRoughness: 0.35,
  });
  const matArm = new THREE.MeshStandardMaterial({ color: COL.carbonWeave, roughness: 0.4, metalness: 0.5 });
  const matAccent = new THREE.MeshStandardMaterial({ color: COL.accent, roughness: 0.4, metalness: 0.1 });
  const matProp = new THREE.MeshStandardMaterial({
    color: COL.propGrey,
    roughness: 0.35,
    metalness: 0.3,
    transparent: true,
    opacity: 0.9,
  });
  const matLens = new THREE.MeshPhysicalMaterial({
    color: COL.lensGlass,
    roughness: 0.05,
    metalness: 0.1,
    clearcoat: 1.0,
    envMapIntensity: 1.2,
  });
  const matSkid = new THREE.MeshStandardMaterial({ color: 0x0e0f11, roughness: 0.6, metalness: 0.3 });
  const matNavRed = new THREE.MeshStandardMaterial({
    color: COL.navRed,
    emissive: COL.navRed,
    emissiveIntensity: 0,
  });
  const matNavGreen = new THREE.MeshStandardMaterial({
    color: COL.navGreen,
    emissive: COL.navGreen,
    emissiveIntensity: 0,
  });

  /* ---- central body ---- */
  const bodyGeo = new THREE.SphereGeometry(0.42, 32, 24);
  bodyGeo.scale(1.15, 0.5, 0.95);
  const body = new THREE.Mesh(bodyGeo, matCarbon);
  body.castShadow = shadows;
  body.receiveShadow = shadows;
  root.add(body);

  const canopyGeo = new THREE.SphereGeometry(0.2, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const canopy = new THREE.Mesh(canopyGeo, matAccent);
  canopy.position.set(0, 0.13, 0.28);
  canopy.rotation.x = -0.3;
  root.add(canopy);

  /* ---- gimbal camera, underslung ---- */
  const gimbalYoke = new THREE.Group();
  gimbalYoke.position.set(0, -0.28, 0.22);
  root.add(gimbalYoke);
  const yokeArmGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.16, 10);
  for (const sign of [-1, 1]) {
    const arm = new THREE.Mesh(yokeArmGeo, matArm);
    arm.rotation.z = Math.PI / 2;
    arm.position.set(sign * 0.09, 0, 0);
    gimbalYoke.add(arm);
  }
  const gimbalPitch = new THREE.Group();
  gimbalYoke.add(gimbalPitch);
  const camBody = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.11, 0.16), matCarbon);
  camBody.castShadow = shadows;
  gimbalPitch.add(camBody);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.05, 24), matLens);
  lens.rotation.x = Math.PI / 2;
  lens.position.set(0, 0, 0.1);
  gimbalPitch.add(lens);

  /* ---- four arms, each ending in a motor nacelle + spinning prop ---- */
  const propGroups: { group: THREE.Group; spinDir: number }[] = [];
  const armPositions = [
    { x: 0.55, z: 0.55, spin: 1 },
    { x: -0.55, z: 0.55, spin: -1 },
    { x: 0.55, z: -0.55, spin: -1 },
    { x: -0.55, z: -0.55, spin: 1 },
  ];

  function bladePair(): THREE.Group {
    const g = new THREE.Group();
    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(0, 0);
    bladeShape.quadraticCurveTo(0.18, 0.02, 0.36, 0);
    bladeShape.quadraticCurveTo(0.18, -0.03, 0, 0);
    const geo = new THREE.ExtrudeGeometry(bladeShape, { depth: 0.008, bevelEnabled: false, curveSegments: 8 });
    geo.rotateX(-Math.PI / 2);
    for (const sign of [-1, 1]) {
      const blade = new THREE.Mesh(geo, matProp);
      blade.scale.x = sign;
      g.add(blade);
    }
    return g;
  }

  for (const pos of armPositions) {
    const armLen = Math.hypot(pos.x, pos.z);
    const armGeo = new THREE.CylinderGeometry(0.025, 0.03, armLen, 12);
    const arm = new THREE.Mesh(armGeo, matArm);
    arm.rotation.z = Math.PI / 2;
    arm.rotation.y = -Math.atan2(pos.z, pos.x);
    arm.position.set(pos.x / 2, -0.02, pos.z / 2);
    arm.castShadow = shadows;
    root.add(arm);

    const nacelle = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.1, 20), matArm);
    nacelle.position.set(pos.x, -0.02, pos.z);
    nacelle.castShadow = shadows;
    root.add(nacelle);

    const propGroup = new THREE.Group();
    propGroup.position.set(pos.x, 0.04, pos.z);
    const blades = bladePair();
    propGroup.add(blades);
    root.add(propGroup);
    propGroups.push({ group: propGroup, spinDir: pos.spin });

    // nav light on the nacelle: red on the two "left" arms, green on "right"
    const navMat = pos.x < 0 ? matNavRed : matNavGreen;
    const nav = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), navMat);
    nav.position.set(pos.x + (pos.x < 0 ? -0.08 : 0.08), -0.03, pos.z);
    root.add(nav);
  }

  /* ---- landing skids ---- */
  for (const sign of [-1, 1]) {
    const skidGeo = new THREE.TorusGeometry(0.5, 0.018, 8, 6, Math.PI * 0.4);
    const skid = new THREE.Mesh(skidGeo, matSkid);
    skid.rotation.z = Math.PI / 2;
    skid.rotation.y = Math.PI / 2;
    skid.position.set(sign * 0.34, -0.5, 0);
    skid.castShadow = shadows;
    root.add(skid);
    const strutGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.28, 8);
    for (const zSign of [-1, 1]) {
      const strut = new THREE.Mesh(strutGeo, matSkid);
      strut.position.set(sign * 0.34, -0.36, zSign * 0.3);
      root.add(strut);
    }
  }

  /* ---- animation ---- */
  function updateAnimation(time: number): void {
    for (const p of propGroups) {
      p.group.rotation.y = time * 34 * p.spinDir;
    }
    root.position.y = 1.0 + Math.sin(time * 1.4) * 0.05;
    root.rotation.y = time * 0.12;
    root.rotation.z = Math.sin(time * 0.9) * 0.02;
    root.rotation.x = Math.sin(time * 0.7 + 1) * 0.015;

    gimbalPitch.rotation.x = Math.sin(time * 0.5) * 0.15 - 0.2;
    gimbalYoke.rotation.y = Math.sin(time * 0.35) * 0.2;

    // standard blink pattern: quick double-flash every ~2.4s
    const blinkT = time % 2.4;
    const on = (blinkT < 0.1 || (blinkT > 0.2 && blinkT < 0.3)) ? 1.6 : 0;
    matNavRed.emissiveIntensity = on;
    matNavGreen.emissiveIntensity = on;
  }

  updateAnimation(0);
  root.userData.tick = (_dt: number, elapsed: number): void => updateAnimation(elapsed);

  return root;
}

export function createDroneLookDevLights(): THREE.Group {
  const lights = new THREE.Group();
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(3, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  lights.add(key);
  const fill = new THREE.DirectionalLight(0xdfe6ff, 0.5);
  fill.position.set(-4, 2, 3);
  lights.add(fill);
  const rim = new THREE.DirectionalLight(0xcfe0ff, 0.6);
  rim.position.set(-2, 3, -5);
  lights.add(rim);
  lights.add(new THREE.HemisphereLight(0xbcd3ff, 0x1a1a1e, 0.4));
  return lights;
}

export function makeDroneBackground(): THREE.Color {
  return new THREE.Color(0x8fb8e8);
}
