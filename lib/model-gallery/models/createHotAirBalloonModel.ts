import * as THREE from 'three';

/**
 * Hot air balloon, built from primitives in the same style as the rest of
 * this set. Focus: a gore-panelled envelope (alternating colour wedges via
 * a lathed profile + panel-seam texture), a rigging net of load lines down
 * to a wicker-textured basket, and a burner whose flame genuinely flares up
 * (scale + emissive pulse) on a firing cycle, tilting the whole balloon
 * slightly with the blast.
 *
 * Live animation (looping ~8s): burner fires twice with a bright flare each
 * time, the balloon rocks gently in response, and throughout, the whole rig
 * drifts and slowly turns as if airborne.
 */

export interface HotAirBalloonOptions {
  shadows?: boolean;
}

const COL = {
  panelA: 0xd6483a,
  panelB: 0xecd482,
  panelC: 0x3a7ac9,
  basket: 0xa9764a,
  basketDark: 0x7a5232,
  rope: 0xcfc09a,
  flame: 0xffb347,
  flameCore: 0xfff2c0,
};

function textTexture(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  w = 1024,
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

/** Alternating gore panels + seam lines, wrapped around the envelope. */
function envelopeGoreTex(): THREE.CanvasTexture {
  const colors = [COL.panelA, COL.panelB, COL.panelC, COL.panelB];
  return textTexture((ctx, w, h) => {
    const gores = 16;
    const gw = w / gores;
    for (let i = 0; i < gores; i++) {
      ctx.fillStyle = '#' + colors[i % colors.length].toString(16).padStart(6, '0');
      ctx.fillRect(i * gw, 0, gw, h);
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= gores; i++) {
      ctx.beginPath();
      ctx.moveTo(i * gw, 0);
      ctx.lineTo(i * gw, h);
      ctx.stroke();
    }
  }, 1024, 512);
}

function wickerTex(): THREE.CanvasTexture {
  const t = textTexture((ctx, w, h) => {
    ctx.fillStyle = '#a9764a';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(0,0,0,0.22)';
    ctx.lineWidth = 3;
    for (let y = 0; y < h; y += 10) {
      ctx.beginPath();
      for (let x = 0; x <= w; x += 20) {
        ctx.moveTo(x, y);
        ctx.lineTo(x + 10, y + (x / 20 % 2 === 0 ? 6 : -6));
      }
      ctx.stroke();
    }
  }, 256, 256);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(4, 2);
  return t;
}

/** Lathed balloon envelope: bulbous top, tapering to a narrow throat/skirt. */
function envelopeProfile(): THREE.Vector2[] {
  return [
    new THREE.Vector2(0.0, 1.55),
    new THREE.Vector2(0.35, 1.5),
    new THREE.Vector2(0.75, 1.3),
    new THREE.Vector2(0.98, 0.95),
    new THREE.Vector2(1.05, 0.5),
    new THREE.Vector2(0.95, 0.05),
    new THREE.Vector2(0.7, -0.3),
    new THREE.Vector2(0.42, -0.5),
    new THREE.Vector2(0.34, -0.56),
  ];
}

export function createHotAirBalloonModel(options: HotAirBalloonOptions = {}): THREE.Group {
  const shadows = options.shadows ?? true;
  const root = new THREE.Group();
  root.position.y = 2.6;

  const matEnvelope = new THREE.MeshPhysicalMaterial({
    map: envelopeGoreTex(),
    roughness: 0.55,
    metalness: 0,
    clearcoat: 0.2,
    side: THREE.DoubleSide,
  });
  const matBasket = new THREE.MeshStandardMaterial({ color: COL.basket, map: wickerTex(), roughness: 0.85 });
  const matBasketRim = new THREE.MeshStandardMaterial({ color: COL.basketDark, roughness: 0.7 });
  const matRope = new THREE.MeshStandardMaterial({ color: COL.rope, roughness: 0.9 });
  const matBurnerFrame = new THREE.MeshStandardMaterial({ color: 0x2c2c30, roughness: 0.4, metalness: 0.8 });
  const matFlame = new THREE.MeshStandardMaterial({
    color: COL.flame,
    emissive: COL.flame,
    emissiveIntensity: 1.5,
    transparent: true,
    opacity: 0.85,
  });
  const matFlameCore = new THREE.MeshStandardMaterial({
    color: COL.flameCore,
    emissive: COL.flameCore,
    emissiveIntensity: 2.0,
    transparent: true,
    opacity: 0.9,
  });

  /* ---- envelope ---- */
  const envGeo = new THREE.LatheGeometry(envelopeProfile(), 32);
  const envelope = new THREE.Mesh(envGeo, matEnvelope);
  envelope.position.y = 1.4;
  envelope.castShadow = shadows;
  root.add(envelope);

  /* skirt / throat opening */
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, 0.2, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0x2a2a2c, roughness: 0.8, side: THREE.DoubleSide }));
  skirt.position.y = 0.7;
  root.add(skirt);

  /* ---- rigging: load lines from the skirt down to the basket corners ---- */
  const basketY = -0.1;
  const basketHalf = 0.42;
  const riggingTop: THREE.Vector3[] = [];
  const N = 8;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    riggingTop.push(new THREE.Vector3(Math.cos(a) * 0.38, 0.75, Math.sin(a) * 0.38));
  }
  const cornerTargets = [
    new THREE.Vector3(basketHalf, basketY + 0.32, basketHalf),
    new THREE.Vector3(-basketHalf, basketY + 0.32, basketHalf),
    new THREE.Vector3(basketHalf, basketY + 0.32, -basketHalf),
    new THREE.Vector3(-basketHalf, basketY + 0.32, -basketHalf),
  ];
  riggingTop.forEach((top, i) => {
    const target = cornerTargets[i % 4];
    const geo = new THREE.CylinderGeometry(0.006, 0.006, top.distanceTo(target), 6);
    const line = new THREE.Mesh(geo, matRope);
    const mid = top.clone().add(target).multiplyScalar(0.5);
    line.position.copy(mid);
    line.lookAt(target);
    line.rotateX(Math.PI / 2);
    root.add(line);
  });

  /* ---- basket ---- */
  const basketGroup = new THREE.Group();
  basketGroup.position.y = basketY;
  root.add(basketGroup);
  const basketBody = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.5, 0.84), matBasket);
  basketBody.position.y = 0.25;
  basketBody.castShadow = shadows;
  basketBody.receiveShadow = shadows;
  basketGroup.add(basketBody);
  const basketRim = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.9), matBasketRim);
  basketRim.position.y = 0.5;
  basketGroup.add(basketRim);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.75, 10), matBasketRim);
    post.position.set(sx * 0.38, 0.62, sz * 0.38);
    basketGroup.add(post);
  }

  /* ---- burner + flame, mounted above the basket ---- */
  const burnerGroup = new THREE.Group();
  burnerGroup.position.y = basketY + 0.78;
  root.add(burnerGroup);
  const burnerRing = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 10, 20), matBurnerFrame);
  burnerRing.rotation.x = Math.PI / 2;
  burnerGroup.add(burnerRing);
  const burnerPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 10), matBurnerFrame);
  burnerPipe.position.y = -0.15;
  burnerGroup.add(burnerPipe);

  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.5, 16), matFlame);
  flame.position.y = 0.25;
  burnerGroup.add(flame);
  const flameCore = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.32, 12), matFlameCore);
  flameCore.position.y = 0.16;
  burnerGroup.add(flameCore);
  const flameLight = new THREE.PointLight(COL.flame, 0, 3, 2);
  flameLight.position.y = 0.2;
  burnerGroup.add(flameLight);

  /* ---- animation ---- */
  const CYCLE = 8.0;
  function updateAnimation(time: number): void {
    // drift + slow turn, as if airborne
    root.position.x = Math.sin(time * 0.12) * 0.3;
    root.position.z = Math.cos(time * 0.09) * 0.2;
    root.rotation.y = time * 0.1;
    root.position.y = 2.6 + Math.sin(time * 0.4) * 0.06;

    // burner fires twice per cycle
    const t = time % CYCLE;
    const fire1 = Math.max(0, 1 - Math.abs(t - 1.2) / 0.5);
    const fire2 = Math.max(0, 1 - Math.abs(t - 4.4) / 0.5);
    const fire = Math.max(fire1, fire2);

    flame.scale.set(1, 0.4 + fire * 1.4, 1);
    flameCore.scale.set(1, 0.4 + fire * 1.5, 1);
    matFlame.opacity = 0.4 + fire * 0.5;
    matFlameCore.opacity = 0.5 + fire * 0.5;
    flameLight.intensity = fire * 2.5;

    basketGroup.rotation.z = -fire * 0.03;
    envelope.rotation.z = fire * 0.015;
  }

  updateAnimation(0);
  root.userData.tick = (_dt: number, elapsed: number): void => updateAnimation(elapsed);

  return root;
}

export function createHotAirBalloonLookDevLights(): THREE.Group {
  const lights = new THREE.Group();
  const key = new THREE.DirectionalLight(0xfff6e0, 2.6);
  key.position.set(4, 8, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  lights.add(key);
  const fill = new THREE.DirectionalLight(0xdfe6ff, 0.6);
  fill.position.set(-5, 3, 3);
  lights.add(fill);
  lights.add(new THREE.HemisphereLight(0x9fc9ff, 0x4a3a2a, 0.5));
  return lights;
}

export function makeHotAirBalloonBackground(): THREE.Color {
  return new THREE.Color(0x8fc3f0);
}
