// lib/beam/engine.ts
// Luby Transform (LT) fountain code: encode + peeling decoder, plus the
// self-describing frame format used to carry it over QR. Framework-agnostic,
// no DOM/React dependency — safe to unit test on its own.

export interface FrameMeta {
  sessionId: number;
  seq: number;
  K: number;
  blockSize: number;
  totalLen: number;
  name: string;
  mime: string;
  sha256Bytes: Uint8Array;
}

export interface ParsedFrame extends FrameMeta {
  payload: Uint8Array;
}

const MAGIC = 0xd0;

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function robustSolitonTable(K: number, c = 0.05, delta = 0.5): Float64Array {
  const rho = new Float64Array(K + 1);
  rho[1] = 1 / K;
  for (let i = 2; i <= K; i++) rho[i] = 1 / (i * (i - 1));
  const S = c * Math.log(K / delta) * Math.sqrt(K);
  const tau = new Float64Array(K + 1);
  const spike = Math.round(K / S) || 1;
  for (let i = 1; i < spike; i++) tau[i] = S / (K * i);
  tau[Math.min(spike, K)] = (S * Math.log(S / delta)) / K;
  const mu = new Float64Array(K + 1);
  let Z = 0;
  for (let i = 1; i <= K; i++) {
    mu[i] = rho[i] + tau[i];
    Z += mu[i];
  }
  for (let i = 1; i <= K; i++) mu[i] /= Z;
  const cdf = new Float64Array(K + 1);
  let acc = 0;
  for (let i = 1; i <= K; i++) {
    acc += mu[i];
    cdf[i] = acc;
  }
  cdf[K] = 1;
  return cdf;
}

function sampleDegree(cdf: Float64Array, K: number, rand: () => number): number {
  const x = rand();
  let lo = 1, hi = K;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cdf[mid] < x) lo = mid + 1; else hi = mid;
  }
  return lo;
}

function sampleIndices(K: number, degree: number, rand: () => number): number[] {
  degree = Math.min(degree, K);
  if (degree === K) return Array.from({ length: K }, (_, i) => i);
  const chosen = new Set<number>();
  while (chosen.size < degree) chosen.add(Math.floor(rand() * K));
  return Array.from(chosen);
}

export function splitBlocks(bytes: Uint8Array, blockSize: number): Uint8Array[] {
  const K = Math.ceil(bytes.length / blockSize);
  const blocks: Uint8Array[] = [];
  for (let i = 0; i < K; i++) {
    const block = new Uint8Array(blockSize);
    const start = i * blockSize;
    block.set(bytes.subarray(start, Math.min(start + blockSize, bytes.length)));
    blocks.push(block);
  }
  return blocks;
}

function xorInto(dst: Uint8Array, src: Uint8Array): void {
  for (let i = 0; i < dst.length; i++) dst[i] ^= src[i];
}

export function encodePayload(
  blocks: Uint8Array[], K: number, blockSize: number, seq: number, cdf: Float64Array
): Uint8Array {
  const rand = mulberry32(seq);
  const degree = sampleDegree(cdf, K, rand);
  const indices = sampleIndices(K, degree, rand);
  const payload = new Uint8Array(blockSize);
  for (const idx of indices) xorInto(payload, blocks[idx]);
  return payload;
}

interface PendingFrame { indices: Set<number>; payload: Uint8Array; }

export class Decoder {
  K: number;
  blockSize: number;
  cdf: Float64Array;
  resolved: (Uint8Array | null)[];
  resolvedCount = 0;
  private seenSeq = new Set<number>();
  private pending: PendingFrame[] = [];

  constructor(K: number, blockSize: number, cdf: Float64Array) {
    this.K = K;
    this.blockSize = blockSize;
    this.cdf = cdf;
    this.resolved = new Array(K).fill(null);
  }

  get isComplete(): boolean { return this.resolvedCount === this.K; }

  addFrame(seq: number, payload: Uint8Array): boolean {
    if (this.seenSeq.has(seq)) return false;
    this.seenSeq.add(seq);
    const rand = mulberry32(seq);
    const degree = sampleDegree(this.cdf, this.K, rand);
    const indices = new Set(sampleIndices(this.K, degree, rand));
    const frame: PendingFrame = { indices, payload: Uint8Array.from(payload) };
    this.reduce(frame);
    if (frame.indices.size > 0) this.pending.push(frame);
    this.peel();
    return true;
  }

  private reduce(frame: PendingFrame): void {
    for (const idx of Array.from(frame.indices)) {
      const known = this.resolved[idx];
      if (known) { xorInto(frame.payload, known); frame.indices.delete(idx); }
    }
  }

  private peel(): void {
    let progress = true;
    while (progress) {
      progress = false;
      for (let i = this.pending.length - 1; i >= 0; i--) {
        const frame = this.pending[i];
        this.reduce(frame);
        if (frame.indices.size === 1) {
          const idx = Array.from(frame.indices)[0];
          if (!this.resolved[idx]) {
            this.resolved[idx] = frame.payload;
            this.resolvedCount++;
            progress = true;
          }
          this.pending.splice(i, 1);
        } else if (frame.indices.size === 0) {
          this.pending.splice(i, 1);
        }
      }
      if (progress) for (const frame of this.pending) this.reduce(frame);
    }
  }

  assemble(totalLen: number): Uint8Array | null {
    if (!this.isComplete) return null;
    const out = new Uint8Array(this.K * this.blockSize);
    for (let i = 0; i < this.K; i++) out.set(this.resolved[i] as Uint8Array, i * this.blockSize);
    return out.subarray(0, totalLen);
  }
}

// ---- frame wire format (see README for byte layout) ----
function checksum16(bytes: Uint8Array): number {
  let s = 0;
  for (let i = 0; i < bytes.length; i++) s = (s + bytes[i]) % 65535;
  return s;
}

export function packFrame(args: FrameMeta & { payload: Uint8Array }): Uint8Array {
  const { sessionId, seq, K, blockSize, totalLen, name, mime, sha256Bytes, payload } = args;
  const nameBytes = new TextEncoder().encode(name).slice(0, 80);
  const mimeBytes = new TextEncoder().encode(mime).slice(0, 60);
  const headerLen = 51 + nameBytes.length + mimeBytes.length;
  const buf = new Uint8Array(headerLen + payload.length + 2);
  const dv = new DataView(buf.buffer);
  buf[0] = MAGIC;
  dv.setUint32(1, sessionId, true);
  dv.setUint32(5, seq, true);
  dv.setUint16(9, K, true);
  dv.setUint16(11, blockSize, true);
  dv.setUint32(13, totalLen, true);
  buf[17] = nameBytes.length;
  buf[18] = mimeBytes.length;
  buf.set(sha256Bytes, 19);
  buf.set(nameBytes, 51);
  buf.set(mimeBytes, 51 + nameBytes.length);
  buf.set(payload, headerLen);
  const cs = checksum16(buf.subarray(0, headerLen + payload.length));
  dv.setUint16(headerLen + payload.length, cs, true);
  return buf;
}

export function unpackFrame(buf: Uint8Array): ParsedFrame | null {
  if (buf.length < 53 || buf[0] !== MAGIC) return null;
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const sessionId = dv.getUint32(1, true);
  const seq = dv.getUint32(5, true);
  const K = dv.getUint16(9, true);
  const blockSize = dv.getUint16(11, true);
  const totalLen = dv.getUint32(13, true);
  const nameLen = buf[17];
  const mimeLen = buf[18];
  const sha256Bytes = buf.slice(19, 51);
  const headerLen = 51 + nameLen + mimeLen;
  if (buf.length !== headerLen + blockSize + 2) return null;
  const expected = checksum16(buf.subarray(0, headerLen + blockSize));
  const actual = dv.getUint16(headerLen + blockSize, true);
  if (expected !== actual) return null;
  const name = new TextDecoder().decode(buf.subarray(51, 51 + nameLen));
  const mime = new TextDecoder().decode(buf.subarray(51 + nameLen, headerLen));
  const payload = buf.subarray(headerLen, headerLen + blockSize);
  return { sessionId, seq, K, blockSize, totalLen, name, mime, sha256Bytes, payload };
}

export async function sha256(bytes: Uint8Array): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest('SHA-256', bytes as BufferSource);
  return new Uint8Array(digest);
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function bytesToBinaryString(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return s;
}
