import * as THREE from "three";

/**
 * Cambodia Fuel Tracker Badge — a commemorative-style 3D badge/coin with
 * Cambodia flag colours, a fuel-drop motif, and encircling text.
 *
 * Looping ~8s animation: badge breathes (gentle scale pulse) while a
 * fuel-drop indicator inside pulses its emissive glow.
 */

export interface CambodiaFuelTrackerBadgeOptions {
  shadows?: boolean;
}

const COL = {
  red: 0xc8242e,
  blue: 0x1e3799,
  gold: 0xd4a02a,
  silver: 0xc9ccd0,
  dark: 0x1a1a1e,
  white: 0xf0f0f0,
  green: 0x2d9b4e,
};

const BADGE_RADIUS = 1.0;
const RIM_WIDTH = 0.1;
const RIM_HEIGHT = 0.08;
const BADGE_DEPTH = 0.18;

function hex(n: number): string {
  return "#" + n.toString(16).padStart(6, "0");
}

function textTexture(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  w = 512,
  h = 128,
): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function decal(
  tex: THREE.Texture,
  w: number,
  h: number,
  opacity = 1,
): THREE.Mesh {
  const m = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    opacity,
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
}

// Simplified Cambodia-map silhouette as a Shape (stylised approximation)
function cambodiaShape(): THREE.Shape {
  const s = new THREE.Shape();
  const sc = 0.32;
  // Approximate outline using key lat/lng-like control points
  const pts: [number, number][] = [
    [0.00, 0.90], [0.20, 0.85], [0.45, 0.80], [0.65, 0.78],
    [0.85, 0.72], [0.95, 0.60], [0.98, 0.48], [0.92, 0.35],
    [0.85, 0.25], [0.78, 0.18], [0.70, 0.12], [0.60, 0.08],
    [0.48, 0.05], [0.35, 0.04], [0.22, 0.06], [0.10, 0.10],
    [0.02, 0.18], [-0.05, 0.28], [-0.08, 0.38], [-0.06, 0.48],
    [0.00, 0.58], [0.04, 0.68], [0.02, 0.78], [-0.02, 0.85],
  ];
  s.moveTo(pts[0][0] * sc, pts[0][1] * sc);
  for (let i = 1; i < pts.length; i++) {
    s.lineTo(pts[i][0] * sc, pts[i][1] * sc);
  }
  s.closePath();
  return s;
}

// Fuel-drop shape
function fuelDropShape(): THREE.Shape {
  const s = new THREE.Shape();
  const sc = 0.18;
  s.moveTo(0, 0.6 * sc);
  s.quadraticCurveTo(0.4 * sc, 0.2 * sc, 0.3 * sc, -0.2 * sc);
  s.quadraticCurveTo(0.15 * sc, -0.55 * sc, 0, -0.6 * sc);
  s.quadraticCurveTo(-0.15 * sc, -0.55 * sc, -0.3 * sc, -0.2 * sc);
  s.quadraticCurveTo(-0.4 * sc, 0.2 * sc, 0, 0.6 * sc);
  return s;
}

export function createCambodiaFuelTrackerBadgeModel(
  options: CambodiaFuelTrackerBadgeOptions = {},
): THREE.Group {
  const shadows = options.shadows ?? true;
  const root = new THREE.Group();
  root.position.y = 0;
  root.scale.setScalar(0.5);

  /* ---- materials ---- */
  const matRim = new THREE.MeshPhysicalMaterial({
    color: COL.gold,
    roughness: 0.25,
    metalness: 0.85,
    clearcoat: 0.3,
    envMapIntensity: 1.2,
  });
  const matFace = new THREE.MeshPhysicalMaterial({
    color: COL.blue,
    roughness: 0.4,
    metalness: 0.05,
    clearcoat: 0.15,
  });
  const matRedBand = new THREE.MeshPhysicalMaterial({
    color: COL.red,
    roughness: 0.5,
    metalness: 0.02,
  });
  const matDrop = new THREE.MeshPhysicalMaterial({
    color: COL.green,
    roughness: 0.3,
    metalness: 0.6,
    emissive: COL.green,
    emissiveIntensity: 0.0,
    clearcoat: 0.5,
  });
  const matGold = new THREE.MeshPhysicalMaterial({
    color: COL.gold,
    roughness: 0.2,
    metalness: 0.9,
    clearcoat: 0.4,
  });
  const matDark = new THREE.MeshStandardMaterial({
    color: COL.dark,
    roughness: 0.9,
    metalness: 0.0,
  });

  /* ---- textures ---- */
  const texArcTop = textTexture((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = hex(COL.gold);
    ctx.font = "700 52px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("CAMBODIA FUEL TRACKER", w / 2, h / 2);
  }, 1024, 128);

  const texArcBot = textTexture((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = hex(COL.gold);
    ctx.font = "600 40px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ប្រព័ន្ធតាមដានប្រេងឥន្ធនៈ", w / 2, h / 2);
  }, 1024, 128);

  /* ---- badge body ---- */
  const badgeGroup = new THREE.Group();
  // Stand the coin upright on its edge, face toward the camera, so it clearly
  // sits ON the desk instead of lying flat against it. Bottom edge = table.
  badgeGroup.rotation.x = Math.PI / 2;
  badgeGroup.position.y = BADGE_RADIUS;
  root.add(badgeGroup);

  // Back face
  const backGeo = new THREE.CircleGeometry(BADGE_RADIUS, 48);
  const back = new THREE.Mesh(backGeo, matDark);
  back.rotation.x = -Math.PI / 2;
  back.position.y = -BADGE_DEPTH / 2 + 0.005;
  back.receiveShadow = shadows;
  badgeGroup.add(back);

  // Main face disc
  const faceGeo = new THREE.CircleGeometry(BADGE_RADIUS - RIM_WIDTH, 48);
  const face = new THREE.Mesh(faceGeo, matFace);
  face.rotation.x = -Math.PI / 2;
  face.position.y = BADGE_DEPTH / 2 - 0.005;
  face.receiveShadow = shadows;
  badgeGroup.add(face);

  // Outer rim ring
  const rimShape = new THREE.Shape();
  rimShape.absarc(0, 0, BADGE_RADIUS, 0, Math.PI * 2);
  const rimHole = new THREE.Path();
  rimHole.absarc(0, 0, BADGE_RADIUS - RIM_WIDTH, 0, Math.PI * 2, true);
  rimShape.holes.push(rimHole);
  const rimGeo = new THREE.ExtrudeGeometry(rimShape, {
    depth: RIM_HEIGHT,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 8,
    curveSegments: 48,
  });
  rimGeo.rotateX(-Math.PI / 2);
  rimGeo.translate(0, BADGE_DEPTH / 2 - 0.005, 0);
  const rim = new THREE.Mesh(rimGeo, matRim);
  rim.castShadow = shadows;
  rim.receiveShadow = shadows;
  badgeGroup.add(rim);

  // Red band across the middle
  const band = new THREE.Mesh(
    new THREE.BoxGeometry(BADGE_RADIUS * 1.6, 0.035, 0.08),
    matRedBand,
  );
  band.position.set(0, BADGE_DEPTH / 2 + 0.002, 0);
  badgeGroup.add(band);

  /* ---- Cambodia map silhouette ---- */
  const mapShape = cambodiaShape();
  const mapGeo = new THREE.ShapeGeometry(mapShape, 24);
  const mapMesh = new THREE.Mesh(mapGeo, matGold);
  mapMesh.rotation.x = -Math.PI / 2;
  mapMesh.position.y = BADGE_DEPTH / 2 + 0.003;
  mapMesh.castShadow = shadows;
  badgeGroup.add(mapMesh);

  // Tonle Sap lake indicator (small oval)
  const lake = new THREE.Mesh(
    new THREE.CircleGeometry(0.04, 16),
    new THREE.MeshBasicMaterial({ color: 0x3a7bd5 }),
  );
  lake.rotation.x = -Math.PI / 2;
  lake.position.set(-0.02, BADGE_DEPTH / 2 + 0.004, 0.04);
  badgeGroup.add(lake);

  /* ---- fuel-drop ---- */
  const dropShape = fuelDropShape();
  const dropGeo = new THREE.ShapeGeometry(dropShape, 24);
  const drop = new THREE.Mesh(dropGeo, matDrop);
  drop.rotation.x = -Math.PI / 2;
  drop.position.set(0, BADGE_DEPTH / 2 + 0.004, -0.08);
  drop.castShadow = shadows;
  badgeGroup.add(drop);
  drop.userData.isDrop = true;

  /* ---- encircling text ---- */
  const arcTop = decal(texArcTop, BADGE_RADIUS * 1.5, 0.12, 0.85);
  arcTop.rotation.x = -Math.PI / 2;
  arcTop.position.set(0, BADGE_DEPTH / 2 + 0.005, 0);
  badgeGroup.add(arcTop);

  const arcBot = decal(texArcBot, BADGE_RADIUS * 1.5, 0.10, 0.75);
  arcBot.rotation.x = Math.PI / 2;
  arcBot.rotation.z = Math.PI;
  arcBot.position.set(0, -BADGE_DEPTH / 2 - 0.005, 0);
  badgeGroup.add(arcBot);

  /* ---- small stars (4 around the rim) ---- */
  function makeStar(angle: number, radius: number, size: number): THREE.Mesh {
    const starShape = new THREE.Shape();
    const spikes = 5;
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? size : size * 0.4;
      const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
      if (i === 0) starShape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else starShape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    starShape.closePath();
    const g = new THREE.ShapeGeometry(starShape);
    const m = new THREE.Mesh(g, matGold);
    m.rotation.x = -Math.PI / 2;
    const rad = BADGE_RADIUS - RIM_WIDTH / 2 - 0.02;
    m.position.set(
      Math.cos(angle) * rad,
      BADGE_DEPTH / 2 + 0.004,
      Math.sin(angle) * rad,
    );
    m.lookAt(0, BADGE_DEPTH / 2 + 0.004, 0);
    return m;
  }
  for (let i = 0; i < 4; i++) {
    badgeGroup.add(makeStar((i / 4) * Math.PI * 2, 0.85, 0.05));
  }

  /* ---- animation ---- */
  function updateAnimation(elapsed: number): void {
    const breathe = 1 + Math.sin(elapsed * 1.6) * 0.008;
    badgeGroup.scale.setScalar(breathe);

    const pulse = 0.15 + Math.sin(elapsed * 2.4) * 0.12;
    matDrop.emissiveIntensity = pulse;
  }

  updateAnimation(0);
  root.userData.tick = (_dt: number, elapsed: number): void =>
    updateAnimation(elapsed);

  return root;
}

export function createFuelTrackerLookDevLights(): THREE.Group {
  const lights = new THREE.Group();

  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(3, 5, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 20;
  const kc = key.shadow.camera as THREE.OrthographicCamera;
  kc.left = -5;
  kc.right = 5;
  kc.top = 5;
  kc.bottom = -5;
  key.shadow.bias = -0.0003;
  key.shadow.radius = 4;
  lights.add(key);

  const fill = new THREE.DirectionalLight(0xc8d4ff, 0.5);
  fill.position.set(-4, 2, 3);
  lights.add(fill);

  const rim = new THREE.DirectionalLight(0xffe4b5, 0.6);
  rim.position.set(-2, 1, -5);
  lights.add(rim);

  lights.add(new THREE.HemisphereLight(0xffffff, 0x6a6a7a, 0.4));
  return lights;
}

export function makeFuelTrackerBackground(): THREE.Color {
  return new THREE.Color(0xe8ecf0);
}
