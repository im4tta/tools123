// Shared client-side scan/deskew helpers, used by Rotation Bench and the
// Scan Cleanup tool so the projection-profile skew estimate lives in one place.

export const SKEW_MAX_DEG = 8;
export const SKEW_STEP = 0.2;
export const SKEW_MIN_DEG = 0.4;

/** Rotates a canvas by a multiple of 90° (clockwise) into a new canvas. */
export function rotate90(src: HTMLCanvasElement, deg: number): HTMLCanvasElement {
  const d = ((deg % 360) + 360) % 360;
  if (d === 0) return src;
  const out = document.createElement("canvas");
  const swap = d === 90 || d === 270;
  out.width = swap ? src.height : src.width;
  out.height = swap ? src.width : src.height;
  const ctx = out.getContext("2d");
  if (!ctx) return src;
  ctx.translate(out.width / 2, out.height / 2);
  ctx.rotate((d * Math.PI) / 180);
  ctx.drawImage(src, -src.width / 2, -src.height / 2);
  return out;
}

/** Rotates a canvas by a small arbitrary angle (clockwise) over a white
 *  background, keeping the same dimensions — used to bake a fine deskew. */
export function rotateFine(src: HTMLCanvasElement, deg: number): HTMLCanvasElement {
  if (Math.abs(deg) < 0.01) return src;
  const out = document.createElement("canvas");
  out.width = src.width;
  out.height = src.height;
  const ctx = out.getContext("2d");
  if (!ctx) return src;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.translate(out.width / 2, out.height / 2);
  ctx.rotate((deg * Math.PI) / 180);
  ctx.drawImage(src, -src.width / 2, -src.height / 2);
  return out;
}

/**
 * Projection-profile skew estimate. For each candidate angle the binarised ink
 * map is sheared and scored by how sharply it concentrates into rows; the best
 * angle is the correction that flattens the text lines. Returns the correction
 * to APPLY, in degrees (clockwise), or 0 when there's too little ink or no
 * clear peak. Independent implementation of the classic algorithm.
 */
export function estimateSkew(source: HTMLCanvasElement): number {
  const maxSide = 480;
  const scale = Math.min(1, maxSide / Math.max(source.width, source.height));
  const w = Math.max(1, Math.round(source.width * scale));
  const h = Math.max(1, Math.round(source.height * scale));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) return 0;
  ctx.drawImage(source, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;

  const gray = new Float32Array(w * h);
  let sum = 0;
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    gray[p] = g;
    sum += g;
  }
  const thresh = (sum / (w * h)) * 0.82;
  const dark = new Uint8Array(w * h);
  let ink = 0;
  for (let p = 0; p < gray.length; p++) if (gray[p] < thresh) { dark[p] = 1; ink++; }
  if (ink < w * h * 0.003) return 0;

  const cx = w / 2;
  let best = 0;
  let bestScore = -1;
  let secondScore = -1;
  for (let deg = -SKEW_MAX_DEG; deg <= SKEW_MAX_DEG + 1e-9; deg += SKEW_STEP) {
    const t = Math.tan((deg * Math.PI) / 180);
    const offset = Math.ceil(Math.abs(t) * w) + 1;
    const len = h + 2 * offset;
    const acc = new Float32Array(len);
    for (let y = 0; y < h; y++) {
      const row = y * w;
      for (let x = 0; x < w; x++) {
        if (dark[row + x]) acc[((y + (x - cx) * t) | 0) + offset]++;
      }
    }
    let score = 0;
    for (let i = 1; i < len; i++) { const diff = acc[i] - acc[i - 1]; score += diff * diff; }
    if (score > bestScore) { secondScore = bestScore; bestScore = score; best = deg; }
    else if (score > secondScore) secondScore = score;
  }
  if (bestScore <= 0 || secondScore / bestScore > 0.985) return 0;
  if (Math.abs(best) < SKEW_MIN_DEG) return 0;
  return Math.round(best * 10) / 10;
}

/** Converts a canvas to grayscale in place. */
export function toGrayscale(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    d[i] = d[i + 1] = d[i + 2] = g;
  }
  ctx.putImageData(img, 0, 0);
}

/**
 * Adaptive (local-mean) threshold to crisp black-and-white — far better than a
 * global threshold on unevenly-lit phone photos. `strength` (0..1) shifts the
 * local mean so higher values keep more ink. Uses an integral image so it stays
 * fast on large scans.
 */
export function adaptiveThreshold(canvas: HTMLCanvasElement, strength = 0.5): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const gray = new Float64Array(w * h);
  for (let i = 0, p = 0; i < d.length; i += 4, p++) gray[p] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];

  // Integral image for O(1) window sums.
  const integ = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let rowSum = 0;
    for (let x = 0; x < w; x++) {
      rowSum += gray[y * w + x];
      integ[(y + 1) * (w + 1) + (x + 1)] = integ[y * (w + 1) + (x + 1)] + rowSum;
    }
  }
  const radius = Math.max(8, Math.round(Math.min(w, h) / 40));
  const bias = 1 - strength * 0.3; // strength 0.5 -> mean*0.85
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - radius);
    const y1 = Math.min(h - 1, y + radius);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - radius);
      const x1 = Math.min(w - 1, x + radius);
      const count = (x1 - x0 + 1) * (y1 - y0 + 1);
      const sum = integ[(y1 + 1) * (w + 1) + (x1 + 1)] - integ[(y0) * (w + 1) + (x1 + 1)] - integ[(y1 + 1) * (w + 1) + (x0)] + integ[(y0) * (w + 1) + (x0)];
      const mean = sum / count;
      const v = gray[y * w + x] < mean * bias ? 0 : 255;
      const idx = (y * w + x) * 4;
      d[idx] = d[idx + 1] = d[idx + 2] = v;
      d[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}
