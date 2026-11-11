// Chakkhu ចក្ខុ text-line reader on ONNX Runtime Web: the model files of
// muyleanging/Chakkhu-OCR-Khmer-ONNX (Apache-2.0, by Ing Muyleang), loaded straight from Hugging
// Face at a pinned revision (CORS-enabled; the browser caches them). Reads one line the way the
// reference chakkhu_onnx.Chakkhu.read does with a batch of one: encoder → CTC draft → decoder beam
// search (4) → every guess scored 0.5 · CTC + 0.5 · decoder. The reading logic is in chakkhu-core.ts.

import { InferenceSession, Tensor } from "onnxruntime-web";
import {
  BOS,
  EOS,
  LINE_HEIGHT,
  PAD,
  beamSearch,
  ctcGreedy,
  ctcLogProb,
  decodeIds,
  decodeLimit,
  lineConfidence,
  pickBest,
  prepareLine,
  sameIds,
} from "@/lib/chakkhu-core";

export const CHAKKHU_REPO = "muyleanging/Chakkhu-OCR-Khmer-ONNX";
/** Pinned commit of the model repo, so the files never change under the reader. */
export const CHAKKHU_REVISION = "7a2c283f9f2e73198d822f9e6baf3a396df3bd01";

function fileUrl(name: string): string {
  return `https://huggingface.co/${CHAKKHU_REPO}/resolve/${CHAKKHU_REVISION}/${name}`;
}

/** "best" = decoder beam search + CTC check (most accurate); "fast" = CTC head only (~10× quicker). */
export type ChakkhuMode = "best" | "fast";

const SESSION_OPTS: InferenceSession.SessionOptions = { executionProviders: ["wasm"], graphOptimizationLevel: "all" };

const int64 = (values: number[], dims: number[]) => new Tensor("int64", BigInt64Array.from(values.map((v) => BigInt(v))), dims);

export class ChakkhuReader {
  private readonly encoder: InferenceSession;
  private readonly decoder: InferenceSession;
  private readonly vocab: readonly string[];

  private constructor(encoder: InferenceSession, decoder: InferenceSession, vocab: readonly string[]) {
    this.encoder = encoder;
    this.decoder = decoder;
    this.vocab = vocab;
  }

  /** A reader over graphs and a vocabulary that are already loaded. */
  static fromParts(encoder: InferenceSession, decoder: InferenceSession, vocab: readonly string[]): ChakkhuReader {
    return new ChakkhuReader(encoder, decoder, vocab);
  }

  /** Downloads (int8, ~39 MB, cached by the browser after the first time) and opens both graphs. */
  static async load(): Promise<ChakkhuReader> {
    const [encoder, decoder, vocab] = await Promise.all([
      InferenceSession.create(fileUrl("encoder.int8.onnx"), SESSION_OPTS),
      InferenceSession.create(fileUrl("decoder.int8.onnx"), SESSION_OPTS),
      fetch(fileUrl("tokenizer.json")).then(async (res) => {
        if (!res.ok) throw new Error(`Chakkhu tokenizer: HTTP ${res.status}`);
        const json = (await res.json()) as { vocab?: unknown };
        if (!Array.isArray(json.vocab)) throw new Error("Chakkhu tokenizer: no vocab");
        return json.vocab as string[];
      }),
    ]);
    return new ChakkhuReader(encoder, decoder, vocab);
  }

  /** Reads one text line from a grey crop (Pillow "L" values, row-major w × h). */
  async readLine(grey: Uint8Array, w: number, h: number, mode: ChakkhuMode = "best"): Promise<{ text: string; confidence: number }> {
    if (w < 1 || h < 1) return { text: "", confidence: 0 };
    const line = prepareLine(grey, w, h);
    const enc = await this.encoder.run({
      images: new Tensor("float32", line.pixels, [1, 1, LINE_HEIGHT, line.paddedWidth]),
      widths: int64([line.width], [1]),
    });
    const memory = enc.memory;
    const memPad = enc.mem_pad;
    const ctc = enc.ctc_logp;
    const vocabSize = ctc.dims[2];
    const columns = Number((enc.lens.data as BigInt64Array)[0]);
    const lp = ctc.data as Float32Array;

    const draft = ctcGreedy(lp, columns, vocabSize);
    let ids = draft;
    if (mode === "best") {
      const guesses = (await beamSearch((rows) => this.nextToken(rows, memory, memPad), decodeLimit(draft))).map((g) => [...g]);
      if (!guesses.some((g) => sameIds(g, draft))) guesses.push(draft);
      const decoderScores = await this.sequenceLogProbs(guesses, memory, memPad);
      const ctcScores = guesses.map((g) => ctcLogProb(lp, columns, vocabSize, g));
      ids = guesses[pickBest(ctcScores, decoderScores)];
    }
    const text = decodeIds(ids, this.vocab);
    const draftText = ids === draft ? text : decodeIds(draft, this.vocab);
    return { text, confidence: lineConfidence(text, draftText, lp, columns, vocabSize) };
  }

  /** Repeats the one line's encoder output for `n` decoder rows. */
  private repeat(memory: Tensor, memPad: Tensor, n: number): { memory: Tensor; mem_pad: Tensor } {
    const m = memory.data as Float32Array;
    const p = memPad.data as Uint8Array;
    const mem = new Float32Array(m.length * n);
    const pad = new Uint8Array(p.length * n);
    for (let i = 0; i < n; i++) {
      mem.set(m, i * m.length);
      pad.set(p, i * p.length);
    }
    return {
      memory: new Tensor("float32", mem, [n, memory.dims[1], memory.dims[2]]),
      mem_pad: new Tensor("bool", pad, [n, memPad.dims[1]]),
    };
  }

  private async nextToken(rows: number[][], memory: Tensor, memPad: Tensor): Promise<Float32Array[]> {
    const n = rows.length;
    const len = rows[0].length;
    const out = await this.decoder.run({ ids: int64(rows.flat(), [n, len]), ...this.repeat(memory, memPad, n) });
    const logp = out.logp;
    const vocab = logp.dims[2];
    const data = logp.data as Float32Array;
    return rows.map((_, r) => data.slice((r * len + len - 1) * vocab, (r * len + len) * vocab));
  }

  /** Decoder log P(text + </s>) for each guess (chakkhu_onnx.Chakkhu.dec_logp). */
  private async sequenceLogProbs(guesses: number[][], memory: Tensor, memPad: Tensor): Promise<number[]> {
    const n = guesses.length;
    const L = Math.max(1, ...guesses.map((g) => g.length));
    const input: number[] = [];
    const target: number[][] = [];
    for (const g of guesses) {
      const row = [...g, ...new Array<number>(L - g.length).fill(PAD)];
      input.push(BOS, ...row);
      const tgt = [...row, PAD];
      tgt[g.length] = EOS;
      target.push(tgt);
    }
    const out = await this.decoder.run({ ids: int64(input, [n, L + 1]), ...this.repeat(memory, memPad, n) });
    const vocab = out.logp.dims[2];
    const data = out.logp.data as Float32Array;
    return target.map((tgt, r) => {
      let sum = 0;
      for (let t = 0; t <= L; t++) if (tgt[t] !== PAD) sum += data[(r * (L + 1) + t) * vocab + tgt[t]];
      return sum;
    });
  }
}
