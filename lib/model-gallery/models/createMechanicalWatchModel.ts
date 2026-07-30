import * as THREE from 'three';

/**
 * Mechanical wristwatch, built from primitives in the same style as the
 * Sony earbuds / Cambodia badge factories. Focus: a brushed-steel case with
 * a fluted bezel, a sunburst dial with applied hour markers, blued sweeping
 * hands, a knurled crown, and a stitched leather strap.
 *
 * Live animation (continuous): second hand sweeps in real time, minute and
 * hour hands advance to match, and the case idles with a faint wrist-tilt.
 */

export interface MechanicalWatchOptions {
  shadows?: boolean;
}

const COL = {
  steel: 0xb9bcc2,
  steelDark: 0x6a6d73,
  dial: 0x14171c,
  dialRim: 0xd8dadd,
  blued: 0x2a5fae,
  gold: 0xcaa24d,
  leather: 0x3b2417,
  stitch: 0xe4d3b8,
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

function dialTex(): THREE.CanvasTexture {
  return textTexture((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    const r = w * 0.46;
    const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, r);
    grad.addColorStop(0, '#20242b');
    grad.addColorStop(1, '#0c0e12');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    // sunburst rays
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 120; i++) {
      const a = (i / 120) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 6, Math.sin(a) * 6);
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      ctx.stroke();
    }
    ctx.restore();
    // minute ticks + hour markers
    ctx.save();
    ctx.translate(cx, cy);
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const isHour = i % 5 === 0;
      ctx.strokeStyle = isHour ? '#e7e2d4' : 'rgba(231,226,212,0.4)';
      ctx.lineWidth = isHour ? 5 : 2;
      const outer = r * 0.92;
      const inner = isHour ? r * 0.78 : r * 0.87;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
      ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
      ctx.stroke();
    }
    ctx.restore();
    // logo text
    ctx.fillStyle = '#cbd0d6';
    ctx.textAlign = 'center';
    ctx.font = '600 26px Georgia, serif';
    ctx.fillText('AUTOMATIC', cx, cy - r * 0.34);
    ctx.font = '400 15px Arial';
    ctx.fillStyle = 'rgba(203,208,214,0.6)';
    ctx.fillText('21 JEWELS', cx, cy + r * 0.42);
  }, 640, 640);
}

function bezelFluteTex(): THREE.CanvasTexture {
  return textTexture((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) {
      const x = (i / 60) * w;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.1)';
      ctx.fillRect(x, 0, w / 60, h);
    }
  }, 480, 40);
}

export function createMechanicalWatchModel(options: MechanicalWatchOptions = {}): THREE.Group {
  const shadows = options.shadows ?? true;
  const root = new THREE.Group();
  root.position.y = 0.2;

  const matSteel = new THREE.MeshPhysicalMaterial({
    color: COL.steel,
    roughness: 0.32,
    metalness: 1.0,
    clearcoat: 0.4,
    clearcoatRoughness: 0.3,
  });
  const matSteelDark = new THREE.MeshStandardMaterial({ color: COL.steelDark, roughness: 0.5, metalness: 0.9 });
  const matGold = new THREE.MeshStandardMaterial({ color: COL.gold, roughness: 0.28, metalness: 1.0 });
  const matCrystal = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.02,
    metalness: 0,
    transmission: 0.95,
    thickness: 0.05,
    ior: 1.5,
    clearcoat: 1,
  });
  const matLeather = new THREE.MeshPhysicalMaterial({ color: COL.leather, roughness: 0.85, metalness: 0 });

  /* ---- case ---- */
  const CASE_R = 0.9;
  const CASE_H = 0.32;
  const caseBody = new THREE.Mesh(new THREE.CylinderGeometry(CASE_R, CASE_R, CASE_H, 64), matSteel);
  caseBody.castShadow = shadows;
  caseBody.receiveShadow = shadows;
  root.add(caseBody);

  const bezel = new THREE.Mesh(new THREE.TorusGeometry(CASE_R * 0.95, 0.09, 16, 80), matSteelDark);
  bezel.rotation.x = Math.PI / 2;
  bezel.position.y = CASE_H / 2 + 0.02;
  bezel.castShadow = shadows;
  root.add(bezel);

  const fluteWrap = decal(bezelFluteTex(), Math.PI * 2 * CASE_R * 0.95, 0.16);
  fluteWrap.rotation.x = -Math.PI / 2;
  fluteWrap.position.y = CASE_H / 2 + 0.09;
  root.add(fluteWrap);

  const crystal = new THREE.Mesh(new THREE.CylinderGeometry(CASE_R * 0.8, CASE_R * 0.8, 0.05, 64), matCrystal);
  crystal.position.y = CASE_H / 2 + 0.03;
  root.add(crystal);

  const dial = decal(dialTex(), CASE_R * 1.56, CASE_R * 1.56);
  dial.rotation.x = -Math.PI / 2;
  dial.position.y = CASE_H / 2 + 0.001;
  root.add(dial);

  /* crown, at 3 o'clock */
  const crown = new THREE.Group();
  const crownBody = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.14, 20), matSteel);
  crownBody.rotation.z = Math.PI / 2;
  crown.add(crownBody);
  const crownGrip = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 8, 20), matSteelDark);
  crownGrip.rotation.y = Math.PI / 2;
  crown.add(crownGrip);
  crown.position.set(CASE_R + 0.07, 0, 0);
  crown.castShadow = shadows;
  root.add(crown);

  /* lugs, top and bottom */
  function lug(sign: number): THREE.Mesh {
    const geo = new THREE.BoxGeometry(0.3, 0.14, 0.5);
    const m = new THREE.Mesh(geo, matSteel);
    m.position.set(0, -0.02, sign * (CASE_R + 0.18));
    m.castShadow = shadows;
    return m;
  }
  root.add(lug(-1));
  root.add(lug(1));

  /* ---- strap: tapered leather bands top and bottom ---- */
  function strapBand(sign: number): THREE.Mesh {
    const shape = new THREE.Shape();
    shape.moveTo(-0.34, 0);
    shape.lineTo(0.34, 0);
    shape.lineTo(0.24, 1.1);
    shape.lineTo(-0.24, 1.1);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.1,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 2,
      curveSegments: 12,
    });
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, 0.05, 0);
    const m = new THREE.Mesh(geo, matLeather);
    m.position.set(0, -0.14, sign * (CASE_R + 0.32));
    m.rotation.x = sign * 0.5;
    m.castShadow = shadows;
    return m;
  }
  root.add(strapBand(-1));
  root.add(strapBand(1));

  const stitchTex = textTexture((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = '#e4d3b8';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 8]);
    ctx.strokeRect(w * 0.12, h * 0.06, w * 0.76, h * 0.88);
  }, 128, 512);
  for (const sign of [-1, 1]) {
    const stitch = decal(stitchTex, 0.5, 1.05);
    stitch.rotation.x = -Math.PI / 2 + sign * 0.5;
    stitch.position.set(0, -0.09, sign * (CASE_R + 0.32 + 0.02 * sign));
    root.add(stitch);
  }

  /* ---- hands ---- */
  function hand(len: number, width: number, tailLen: number, mat: THREE.Material): THREE.Group {
    const g = new THREE.Group();
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, 0);
    shape.lineTo(width / 2, 0);
    shape.lineTo(width / 2, len * 0.7);
    shape.lineTo(0, len);
    shape.lineTo(-width / 2, len * 0.7);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.012, bevelEnabled: false, curveSegments: 4 });
    geo.rotateX(-Math.PI / 2);
    const blade = new THREE.Mesh(geo, mat);
    g.add(blade);
    const tailGeo = new THREE.CylinderGeometry(width * 0.6, width * 0.6, tailLen, 8);
    tailGeo.rotateX(Math.PI / 2);
    const tail = new THREE.Mesh(tailGeo, mat);
    tail.position.z = -tailLen / 2;
    g.add(tail);
    return g;
  }
  const matBlued = new THREE.MeshStandardMaterial({ color: COL.blued, roughness: 0.3, metalness: 0.8 });

  const hourHand = hand(0.4, 0.06, 0.08, matBlued);
  hourHand.position.y = CASE_H / 2 + 0.04;
  root.add(hourHand);

  const minuteHand = hand(0.6, 0.045, 0.1, matBlued);
  minuteHand.position.y = CASE_H / 2 + 0.05;
  root.add(minuteHand);

  const secondHand = hand(0.62, 0.014, 0.24, matGold);
  secondHand.position.y = CASE_H / 2 + 0.06;
  root.add(secondHand);

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 20), matGold);
  hub.position.y = CASE_H / 2 + 0.06;
  root.add(hub);

  /* ---- animation ---- */
  function updateAnimation(time: number): void {
    const seconds = time % 60;
    const minutes = (time / 60) % 60;
    const hours = (time / 3600) % 12;
    secondHand.rotation.y = (seconds / 60) * Math.PI * 2;
    minuteHand.rotation.y = (minutes / 60) * Math.PI * 2;
    hourHand.rotation.y = (hours / 12) * Math.PI * 2;
    root.rotation.z = Math.sin(time * 0.2) * 0.05;
    root.rotation.x = 0.08 + Math.sin(time * 0.13) * 0.03;
  }

  updateAnimation(0);
  root.userData.tick = (_dt: number, elapsed: number): void => updateAnimation(elapsed);

  return root;
}

export function createMechanicalWatchLookDevLights(): THREE.Group {
  const lights = new THREE.Group();
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(3, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  lights.add(key);
  const fill = new THREE.DirectionalLight(0xdfe6ff, 0.6);
  fill.position.set(-4, 2, 3);
  lights.add(fill);
  const rim = new THREE.DirectionalLight(0xffe8cf, 0.6);
  rim.position.set(-2, 3, -5);
  lights.add(rim);
  lights.add(new THREE.HemisphereLight(0xffffff, 0x33343a, 0.4));
  return lights;
}

export function makeMechanicalWatchBackground(): THREE.Color {
  return new THREE.Color(0xe8e6e1);
}
