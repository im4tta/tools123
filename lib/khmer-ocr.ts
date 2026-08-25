// Browser port of Khmer OCR engines, each = detection + recognition.
// - KhmerOCR (github.com/seanghay/KhmerOCR, MIT): det.onnx + rec.onnx CRNN.
// - Kiri OCR (github.com/mrrtmob/kiri-ocr, Apache-2.0): DB detection + a
//   Transformer encoder/CTC recognizer (exported from PyTorch to ONNX).
// Detection is shared (the proven KhmerOCR YOLO-style model); the recognizer is
// chosen per engine. All pipelines match their reference implementations.

import { InferenceSession, Tensor } from "onnxruntime-web";
import { KIRI_VOCAB } from "@/lib/kiri-vocab";

export type EngineId = "khmerocr" | "kiri";

export interface EngineInfo {
  id: EngineId;
  label: string;
  description: string;
  license: string;
  author: string;
  source: string;
}

export const ENGINES: EngineInfo[] = [
  { id: "khmerocr", label: "KhmerOCR", description: "CRNN detection + recognition (800+ fonts)", license: "MIT", author: "Seanghay Yath", source: "github.com/seanghay/KhmerOCR" },
  { id: "kiri", label: "Kiri OCR", description: "Transformer encoder + CTC, 12M lines, mixed EN/KM", license: "Apache-2.0", author: "mrrtmob", source: "github.com/mrrtmob/kiri-ocr" },
];

export const MODEL_FILES: Record<EngineId, { det: string; rec: string }> = {
  khmerocr: { det: "/models/khmerocr/det.onnx", rec: "/models/khmerocr/rec.onnx" },
  kiri: { det: "/models/khmerocr/det.onnx", rec: "/models/kiri/rec.onnx" },
};

// The 98 Khmer character tokens (recovered from the reference TOKENS string).
export const TOKENS: string[] = [
  "ក","ខ","គ","ឃ","ង","ច","ឆ","ជ","ឈ","ញ","ដ","ឋ","ឌ","ឍ","ណ","ត","ថ","ទ","ធ","ន","ប","ផ","ព","ភ","ម","យ","រ","ល","វ","ឝ","ឞ","ស","ហ","ឡ","អ","ឣ","ឤ","ឥ","ឦ","ឧ","ឩ","ឪ","ឫ","ឬ","ឭ","ឮ","ឯ","ឰ","ឱ","ឲ","ឳ","ា","ិ","ី","ឹ","ឺ","ុ","ូ","ួ","ើ","ឿ","ៀ","េ","ែ","ៃ","ោ","ៅ","ំ","ះ","ៈ","៉","៊","់","៌","៍","៎","៏","័","៑","្","។","៕","៖","ៗ","៘","៛","៝","០","១","២","៣","៤","៥","៦","៧","៨","៩","៳",
];

export interface Box { x1: number; y1: number; x2: number; y2: number; classId: number; score: number }
export interface Line { boxes: Box[] }
export interface OcrResult { text: string; confidence: number; box: Box }
export interface OcrOutput { lines: Line[]; results: OcrResult[] }

async function loadSession(url: string, opts: InferenceSession.SessionOptions): Promise<InferenceSession> {
  const u = new URL(url, window.location.origin);
  u.searchParams.set("fp16", "false");
  return InferenceSession.create(u.toString(), opts);
}

const SESSION_OPTS: InferenceSession.SessionOptions = { executionProviders: ["wasm"], graphOptimizationLevel: "all" };

/** Builds an OCR engine (detector + recognizer) for the given engine id. */
export async function createOcrEngine(engineId: EngineId): Promise<KhmerOcr> {
  const files = MODEL_FILES[engineId];
  const det = await loadSession(files.det, SESSION_OPTS);
  const rec = await loadSession(files.rec, SESSION_OPTS);
  return new KhmerOcr(det, rec, engineId);
}

function bilinearResizeGray(src: Float32Array, srcW: number, srcH: number, dstW: number, dstH: number): Float32Array {
  const dst = new Float32Array(dstW * dstH);
  const xRatio = srcW / dstW;
  const yRatio = srcH / dstH;
  for (let y = 0; y < dstH; y++) {
    const fy = (y + 0.5) * yRatio - 0.5;
    let sy = Math.floor(fy);
    if (sy < 0) sy = 0;
    if (sy > srcH - 1) sy = srcH - 1;
    const wy = fy - sy;
    const sy2 = sy + 1 < srcH ? sy + 1 : srcH - 1;
    for (let x = 0; x < dstW; x++) {
      const fx = (x + 0.5) * xRatio - 0.5;
      let sx = Math.floor(fx);
      if (sx < 0) sx = 0;
      if (sx > srcW - 1) sx = srcW - 1;
      const wx = fx - sx;
      const sx2 = sx + 1 < srcW ? sx + 1 : srcW - 1;
      const top = src[sy * srcW + sx] * (1 - wx) + src[sy * srcW + sx2] * wx;
      const bottom = src[sy2 * srcW + sx] * (1 - wx) + src[sy2 * srcW + sx2] * wx;
      dst[y * dstW + x] = top * (1 - wy) + bottom * wy;
    }
  }
  return dst;
}

function bilinearResizeCh(src: Float32Array, srcW: number, srcH: number, dstW: number, dstH: number): Float32Array {
  const dst = new Float32Array(dstW * dstH);
  const xRatio = srcW / dstW;
  const yRatio = srcH / dstH;
  for (let y = 0; y < dstH; y++) {
    const fy = (y + 0.5) * yRatio - 0.5;
    let sy = Math.floor(fy);
    if (sy < 0) sy = 0;
    if (sy > srcH - 1) sy = srcH - 1;
    const wy = fy - sy;
    const sy2 = sy + 1 < srcH ? sy + 1 : srcH - 1;
    for (let x = 0; x < dstW; x++) {
      const fx = (x + 0.5) * xRatio - 0.5;
      let sx = Math.floor(fx);
      if (sx < 0) sx = 0;
      if (sx > srcW - 1) sx = srcW - 1;
      const wx = fx - sx;
      const sx2 = sx + 1 < srcW ? sx + 1 : srcW - 1;
      const top = src[sy * srcW + sx] * (1 - wx) + src[sy * srcW + sx2] * wx;
      const bottom = src[sy2 * srcW + sx] * (1 - wx) + src[sy2 * srcW + sx2] * wx;
      dst[y * dstW + x] = top * (1 - wy) + bottom * wy;
    }
  }
  return dst;
}

export class KhmerOcr {
  private det: InferenceSession;
  private rec: InferenceSession;
  private engineId: EngineId;
  private threshold = 0.25;
  private nmsThreshold = 0.45;

  constructor(det: InferenceSession, rec: InferenceSession, engineId: EngineId) {
    this.det = det;
    this.rec = rec;
    this.engineId = engineId;
  }

  async detect(imageData: ImageData): Promise<Line[]> {
    const w = imageData.width;
    const h = imageData.height;
    const TARGET = 1024;
    const ratio = Math.min(TARGET / w, TARGET / h);
    const nw = Math.max(1, Math.floor(w * ratio));
    const nh = Math.max(1, Math.floor(h * ratio));

    // CHW 3x1024x1024, RGB, 0..1, padded with zeros.
    const input = new Float32Array(3 * TARGET * TARGET);
    const raw = imageData.data;
    for (let c = 0; c < 3; c++) {
      const ch = new Float32Array(w * h);
      for (let i = 0; i < w * h; i++) ch[i] = raw[i * 4 + c] / 255;
      const resized = bilinearResizeCh(ch, w, h, nw, nh);
      const base = c * TARGET * TARGET;
      for (let y = 0; y < nh; y++) {
        for (let x = 0; x < nw; x++) {
          input[base + y * TARGET + x] = resized[y * nw + x];
        }
      }
    }

    const tensor = new Tensor("float32", input, [1, 3, TARGET, TARGET]);
    const names = this.det.inputNames;
    const feeds: Record<string, Tensor> = {};
    if (names.length) feeds[names[0]] = tensor;
    const outputNames = this.det.outputNames;
    const out = await this.det.run(feeds, outputNames);
    const output0 = out[outputNames[0] ?? "output0"];
    const shape = output0.dims; // [1, num_features, num_detections]
    const numDetections = shape[2];
    const data = output0.data as Float32Array;

    const boxes: Box[] = [];
    for (let i = 0; i < numDetections; i++) {
      const cx = data[0 * numDetections + i];
      const cy = data[1 * numDetections + i];
      const bw = data[2 * numDetections + i];
      const bh = data[3 * numDetections + i];
      const c0 = data[4 * numDetections + i];
      const c1 = data[5 * numDetections + i];
      const score = Math.max(c0, c1);
      const classId = c1 > c0 ? 1 : 0;
      if (score < this.threshold) continue;
      let x1 = (cx - bw / 2) / ratio;
      let y1 = (cy - bh / 2) / ratio;
      let x2 = (cx + bw / 2) / ratio;
      let y2 = (cy + bh / 2) / ratio;
      x1 = Math.max(0, Math.min(x1, w));
      y1 = Math.max(0, Math.min(y1, h));
      x2 = Math.max(0, Math.min(x2, w));
      y2 = Math.max(0, Math.min(y2, h));
      boxes.push({ x1, y1, x2, y2, classId, score });
    }

    const keep = nms(boxes, this.nmsThreshold);
    const kept = keep.map((idx) => boxes[idx]);
    return getSortedLines(kept, 0.5);
  }

  async recognize(box: Box, imageData: ImageData): Promise<{ text: string; confidence: number }> {
    const w = imageData.width;
    const h = imageData.height;
    const x1 = Math.max(0, Math.min(Math.round(box.x1), w));
    const y1 = Math.max(0, Math.min(Math.round(box.y1), h));
    const x2 = Math.max(0, Math.min(Math.round(box.x2), w));
    const y2 = Math.max(0, Math.min(Math.round(box.y2), h));
    const cw = x2 - x1;
    const ch = y2 - y1;
    if (cw <= 0 || ch <= 0) return { text: "", confidence: 0 };

    // Grayscale crop.
    const raw = imageData.data;
    const gray = new Float32Array(cw * ch);
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        const i = ((y1 + y) * w + (x1 + x)) * 4;
        gray[y * cw + x] = (raw[i] * 0.299 + raw[i + 1] * 0.587 + raw[i + 2] * 0.114) / 255;
      }
    }

    // Build the model input per engine.
    let tensor: Tensor;
    if (this.engineId === "kiri") {
      // Kiri OCR: resize height=48, left-pad to 640 with gray (128/255), normalize (x-0.5)/0.5.
      tensor = kiriInput(gray, cw, ch);
    } else {
      // KhmerOCR: resize height=32, width keeps aspect ratio.
      const newWidth = Math.max(1, Math.round((cw / ch) * 32));
      const resized = bilinearResizeGray(gray, cw, ch, newWidth, 32);
      tensor = new Tensor("float32", resized, [1, 1, 32, newWidth]);
    }

    const names = this.rec.inputNames;
    const feeds: Record<string, Tensor> = {};
    if (names.length) feeds[names[0]] = tensor;
    const outputNames = this.rec.outputNames;
    const out = await this.rec.run(feeds, outputNames);

    const logitsName = outputNames.find((n) => /logits/i.test(n)) ?? outputNames[0];
    const logits = out[logitsName];
    const shape = logits.dims;
    const data = logits.data as Float32Array;

    if (this.engineId === "kiri") {
      // Kiri output: [batch, seq_len, vocab]
      const seqLen = shape.length >= 3 ? shape[1] : shape[0];
      const vocabSize = shape[shape.length - 1];
      return decodeKiriCtc(data, seqLen, vocabSize);
    }
    // KhmerOCR output: [seq_len, batch, vocab]
    const seqLen = shape[0];
    const vocabSize = shape[shape.length - 1];
    return decodeCtc(data, seqLen, vocabSize);
  }

  async ocr(imageData: ImageData): Promise<OcrOutput> {
    const lines = await this.detect(imageData);
    const results: OcrResult[] = [];
    for (const line of lines) {
      for (const box of line.boxes) {
        if (box.classId === 0) continue;
        const { text, confidence } = await this.recognize(box, imageData);
        if (text) results.push({ text, confidence, box });
      }
    }
    return { lines, results };
  }
}

function nms(boxes: Box[], iouThreshold: number): number[] {
  if (boxes.length === 0) return [];
  const indices = boxes.map((_, i) => i).sort((a, b) => boxes[b].score - boxes[a].score);
  const areas = boxes.map((b) => (b.x2 - b.x1) * (b.y2 - b.y1));
  const keep: number[] = [];
  const suppressed = new Array<boolean>(boxes.length).fill(false);
  for (const idx of indices) {
    if (suppressed[idx]) continue;
    keep.push(idx);
    const bi = boxes[idx];
    for (let j = 0; j < indices.length; j++) {
      const oi = indices[j];
      if (suppressed[oi] || oi === idx) continue;
      const bj = boxes[oi];
      const xx1 = Math.max(bi.x1, bj.x1);
      const yy1 = Math.max(bi.y1, bj.y1);
      const xx2 = Math.min(bi.x2, bj.x2);
      const yy2 = Math.min(bi.y2, bj.y2);
      const iw = Math.max(0, xx2 - xx1);
      const ih = Math.max(0, yy2 - yy1);
      const inter = iw * ih;
      const union = areas[idx] + areas[oi] - inter;
      const iou = union > 0 ? inter / union : 0;
      if (iou > iouThreshold) suppressed[oi] = true;
    }
  }
  return keep;
}

function getSortedLines(boxes: Box[], thresholdRatio: number): Line[] {
  if (boxes.length === 0) return [];
  const sorted = [...boxes].sort((a, b) => {
    const ya = a.classId === 0 ? a.y2 : a.y1;
    const yb = b.classId === 0 ? b.y2 : b.y1;
    return ya - yb;
  });
  const lines: Line[] = [];
  let current: Box[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const prev = current[current.length - 1];
    const curr = sorted[i];
    const prevVal = prev.classId === 0 ? prev.y2 : prev.y1;
    const currVal = curr.classId === 0 ? curr.y2 : curr.y1;
    const refH = prev.y2 - prev.y1;
    const threshold = refH * thresholdRatio;
    if (Math.abs(currVal - prevVal) < threshold) {
      current.push(curr);
    } else {
      current.sort((a, b) => a.x1 - b.x1);
      lines.push({ boxes: current });
      current = [curr];
    }
  }
  current.sort((a, b) => a.x1 - b.x1);
  lines.push({ boxes: current });
  return lines;
}

function decodeCtc(data: Float32Array, seqLen: number, vocabSize: number): { text: string; confidence: number } {
  if (seqLen < 1 || vocabSize < 1) return { text: "", confidence: 0 };
  let text = "";
  let prev = -1;
  let sumConf = 0;
  let count = 0;
  for (let t = 0; t < seqLen; t++) {
    const base = t * vocabSize;
    let maxVal = data[base];
    for (let v = 1; v < vocabSize; v++) maxVal = Math.max(maxVal, data[base + v]);
    let sumExp = 0;
    const probs = new Float32Array(vocabSize);
    for (let v = 0; v < vocabSize; v++) {
      probs[v] = Math.exp(data[base + v] - maxVal);
      sumExp += probs[v];
    }
    for (let v = 0; v < vocabSize; v++) probs[v] /= sumExp;
    let idx = 0;
    for (let v = 1; v < vocabSize; v++) if (probs[v] > probs[idx]) idx = v;
    if (idx !== prev && idx !== 0) {
      const tokenIdx = idx - 3;
      if (tokenIdx >= 0 && tokenIdx < TOKENS.length) {
        text += TOKENS[tokenIdx];
        sumConf += probs[idx];
        count++;
      }
    }
    prev = idx;
  }
  return { text, confidence: count > 0 ? sumConf / count : 0 };
}

// Kiri OCR input: grayscale crop resized height=48 (keep ratio), left-padded to
// 640 with gray (128/255 ≈ 0.502), normalized (x-0.5)/0.5 → [1,1,48,640].
function kiriInput(gray: Float32Array, cw: number, ch: number): Tensor {
  const H = 48;
  const W = 640;
  const scale = H / ch;
  const nw = Math.max(1, Math.round(cw * scale));
  const resized = bilinearResizeGray(gray, cw, ch, nw, H);
  const padVal = (128 / 255 - 0.5) / 0.5;
  const out = new Float32Array(H * W).fill(padVal);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < Math.min(nw, W); x++) {
      out[y * W + x] = (resized[y * nw + x] - 0.5) / 0.5;
    }
  }
  return new Tensor("float32", out, [1, 1, H, W]);
}

// Kiri CTC decode: argmax per timestep, dedup repeats, skip id < ctc_offset (2),
// map id-offset into the 964-token vocab; confidence = avg max-softmax.
function decodeKiriCtc(data: Float32Array, seqLen: number, vocabSize: number): { text: string; confidence: number } {
  if (seqLen < 1 || vocabSize < 1) return { text: "", confidence: 0 };
  const ctcOffset = 2;
  let text = "";
  let prev = -1;
  let sumConf = 0;
  let count = 0;
  for (let t = 0; t < seqLen; t++) {
    const base = t * vocabSize;
    let maxVal = data[base];
    for (let v = 1; v < vocabSize; v++) maxVal = Math.max(maxVal, data[base + v]);
    let sumExp = 0;
    const probs = new Float32Array(vocabSize);
    for (let v = 0; v < vocabSize; v++) {
      probs[v] = Math.exp(data[base + v] - maxVal);
      sumExp += probs[v];
    }
    for (let v = 0; v < vocabSize; v++) probs[v] /= sumExp;
    let idx = 0;
    for (let v = 1; v < vocabSize; v++) if (probs[v] > probs[idx]) idx = v;
    if (idx !== prev && idx >= ctcOffset) {
      const tokenIdx = idx - ctcOffset;
      if (tokenIdx >= 0 && tokenIdx < KIRI_VOCAB.length) {
        const ch = KIRI_VOCAB[tokenIdx];
        if (ch && ch !== "<unk>") {
          text += ch;
          sumConf += probs[idx];
          count++;
        }
      }
    }
    prev = idx;
  }
  return { text, confidence: count > 0 ? sumConf / count : 0 };
}
