"use client";
import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { ToolShell } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useLanguage } from "@/components/LanguageProvider";

// ---------------------------------------------------------------------------
// Built-in EAN-13 / UPC-A decoder (original Tools123 implementation).
// Encodings follow the public EAN/UPC symbology specification (GS1):
// 95 modules, L/G parity-coded left half, R-coded right half, mod-10 checksum.
// ---------------------------------------------------------------------------

const L_CODES: Record<string, number> = {
  "0001101": 0, "0011001": 1, "0010011": 2, "0111101": 3, "0100011": 4,
  "0110001": 5, "0101111": 6, "0111011": 7, "0110111": 8, "0001011": 9,
};
const G_CODES: Record<string, number> = {
  "0100111": 0, "0110011": 1, "0011011": 2, "0100001": 3, "0011101": 4,
  "0111001": 5, "0000101": 6, "0010001": 7, "0001001": 8, "0010111": 9,
};
const R_CODES: Record<string, number> = {
  "1110010": 0, "1100110": 1, "1101100": 2, "1000010": 3, "1011100": 4,
  "1001110": 5, "1010000": 6, "1000100": 7, "1001000": 8, "1110100": 9,
};
// L = 0, G = 1. The pattern of the six left digits encodes the leading digit.
const PARITY: Record<string, string> = {
  "0": "LLLLLL", "1": "LLGLGG", "2": "LLGGLG", "3": "LLGGGL",
  "4": "LGLLGG", "5": "LGGLLG", "6": "LGGGLL", "7": "LGLGLG",
  "8": "LGLGGL", "9": "LGGLGL",
};

interface Run {
  dark: boolean;
  len: number;
}

function otsu(values: number[]): number {
  const hist = new Array<number>(256).fill(0);
  let total = 0;
  for (const v of values) {
    hist[v]++;
    total++;
  }
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sumB = 0;
  let wB = 0;
  let maxVar = 0;
  let threshold = 0;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const v = wB * wF * (mB - mF) * (mB - mF);
    if (v > maxVar) {
      maxVar = v;
      threshold = t;
    }
  }
  return threshold;
}

function decodeModules(modules: boolean[]): string | null {
  if (modules.length < 95) return null;
  const mod = (p: number) => (modules[p] ? "1" : "0");
  if (mod(0) !== "1" || mod(1) !== "0" || mod(2) !== "1") return null;
  if (mod(45) !== "0" || mod(46) !== "1" || mod(47) !== "0" || mod(48) !== "1" || mod(49) !== "0") return null;
  if (mod(92) !== "1" || mod(93) !== "0" || mod(94) !== "1") return null;

  const leftCodes: string[] = [];
  for (let d = 0; d < 6; d++) {
    let code = "";
    for (let m = 0; m < 7; m++) code += mod(3 + d * 7 + m);
    leftCodes.push(code);
  }
  let first: number | null = null;
  for (const [k, pat] of Object.entries(PARITY)) {
    let ok = true;
    for (let d = 0; d < 6; d++) {
      const table = pat[d] === "L" ? L_CODES : G_CODES;
      if (table[leftCodes[d]] === undefined) {
        ok = false;
        break;
      }
    }
    if (ok) {
      first = Number(k);
      break;
    }
  }
  if (first === null) return null;

  const digits = [first];
  const pattern = PARITY[String(first)];
  for (let d = 0; d < 6; d++) {
    const table = pattern[d] === "L" ? L_CODES : G_CODES;
    digits.push(table[leftCodes[d]]);
  }
  for (let d = 0; d < 6; d++) {
    let code = "";
    for (let m = 0; m < 7; m++) code += mod(50 + d * 7 + m);
    const v = R_CODES[code];
    if (v === undefined) return null;
    digits.push(v);
  }
  return digits.join("");
}

function validChecksum(code: string): boolean {
  if (code.length !== 13) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const d = Number(code[i]);
    sum += i % 2 === 0 ? d : d * 3;
  }
  const check = (10 - (sum % 10)) % 10;
  return Number(code[12]) === check;
}

function decodeEanRow(row: number[]): string | null {
  if (row.length < 100) return null;
  const threshold = otsu(row);
  if (threshold < 8 || threshold > 248) return null;
  const binary = row.map((v) => v < threshold);
  const runs: Run[] = [];
  for (const dark of binary) {
    const last = runs[runs.length - 1];
    if (last && last.dark === dark) last.len++;
    else runs.push({ dark, len: 1 });
  }
  for (let i = 0; i + 2 < runs.length; i++) {
    if (!runs[i].dark || runs[i + 1].dark || !runs[i + 2].dark) continue;
    const [a, b, c] = [runs[i].len, runs[i + 1].len, runs[i + 2].len];
    const mw = (a + b + c) / 3;
    if (a < mw * 0.5 || b < mw * 0.5 || c < mw * 0.5) continue;
    if (a > mw * 1.7 || b > mw * 1.7 || c > mw * 1.7) continue;
    for (let j = runs.length - 1; j - 2 > i + 50; j--) {
      if (!runs[j].dark || runs[j - 1].dark || !runs[j - 2].dark) continue;
      const [d, e, f] = [runs[j].len, runs[j - 1].len, runs[j - 2].len];
      const mw2 = (d + e + f) / 3;
      if (Math.abs(mw2 - mw) / mw > 0.35) continue;
      const seg: boolean[] = [];
      for (let k = i; k <= j; k++) {
        for (let n = 0; n < runs[k].len; n++) seg.push(runs[k].dark);
      }
      const modW = seg.length / 95;
      if (modW < 1) continue;
      const modules: boolean[] = [];
      for (let p = 0; p < 95; p++) {
        modules.push(seg[Math.min(seg.length - 1, Math.round((p + 0.5) * modW))]);
      }
      const decoded = decodeModules(modules);
      if (decoded && validChecksum(decoded)) return decoded;
    }
  }
  return null;
}

function decodeEan(img: HTMLImageElement): string | null {
  const maxW = 900;
  const scale = Math.min(1, maxW / img.naturalWidth);
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);
  const step = Math.max(1, Math.round(h / 24));
  const startY = Math.round(h * 0.2);
  const endY = Math.round(h * 0.85);
  for (let y = startY; y < endY; y += step) {
    const row = new Array<number>(w);
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      row[x] = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
    }
    const code = decodeEanRow(row);
    if (code) return code;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Native BarcodeDetector integration (Chrome / Edge).
// ---------------------------------------------------------------------------

type DetectorResult = { rawValue: string; format: string };
type Detector = { detect: (source: unknown) => Promise<DetectorResult[]> };

function makeDetector(): Detector | null {
  const ctor = (window as unknown as { BarcodeDetector?: new (opts?: { formats?: string[] }) => Detector }).BarcodeDetector;
  if (!ctor) return null;
  try {
    return new ctor({ formats: ["ean_13", "upc_a", "ean_8"] });
  } catch {
    return null;
  }
}

export default function BarcodeReader() {
  const { text: t } = useLanguage();
  const [url, setUrl] = useState<string | null>(null);
  const [nativeSupported, setNativeSupported] = useState(false);
  const [results, setResults] = useState<DetectorResult[]>([]);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNativeSupported(typeof window !== "undefined" && "BarcodeDetector" in window);
  }, []);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    const img = new Image();
    img.onload = async () => {
      if (cancelled) return;
      setError("");
      if (nativeSupported) {
        try {
          const detector = makeDetector();
          if (detector) {
            const codes = await detector.detect(url);
            if (!cancelled && codes.length > 0) {
              setResults(codes.map((c) => ({ rawValue: c.rawValue, format: c.format })));
              return;
            }
          }
        } catch {
          // Fall through to the built-in decoder.
        }
      }
      if (cancelled) return;
      try {
        const code = decodeEan(img);
        if (code) {
          const isUpc = code.startsWith("0") && code.length === 13;
          setResults([{ rawValue: isUpc ? code.slice(1) : code, format: isUpc ? "upc_a" : "ean_13" }]);
        } else {
          setResults([]);
          setError(t("No barcode detected. Use a sharp, well-lit, upright photo.", "រកមិនឃើញ barcode ទេ។ សូមប្រើរូបភាពច្បាស់ មានពន្លឺល្អ និងតម្រង់ត្រង់។"));
        }
      } catch {
        setResults([]);
        setError(t("Could not decode the barcode from this image.", "មិនអាចអាន barcode ពីរូបភាពនេះបានទេ។"));
      }
    };
    img.onerror = () => {
      if (!cancelled) setError(t("Could not load the image.", "មិនអាចផ្ទុករូបភាពបានទេ។"));
    };
    img.src = url;
    return () => {
      cancelled = true;
    };
  }, [url, nativeSupported, t]);

  function pick(file: File) {
    setError("");
    setResults([]);
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const next = URL.createObjectURL(file);
    urlRef.current = next;
    setUrl(next);
  }

  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  return (
    <ToolShell
      title="Barcode Reader (EAN/UPC)"
      khmerTitle="អាន Barcode (EAN/UPC)"
      description="Read EAN-13, UPC-A and EAN-8 barcodes from a photo — native BarcodeDetector where available, with a built-in EAN/UPC decoder as fallback."
      descriptionKm="អាន Barcode EAN-13, UPC-A និង EAN-8 ពីរូបថត — ប្រើ BarcodeDetector ពេលមាន និងកម្មវិធីអាន EAN/UPC ភ្ជាប់មកជាមួយជាការបម្រុង។"
    >
      <div className="space-y-4">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) pick(f);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[var(--ground-line)] p-8 text-center transition hover:border-[var(--gold)]/40"
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={t("Barcode preview", "មើល barcode ជាមុន")} className="max-h-40 rounded-lg object-contain" />
          ) : (
            <>
              <Upload size={28} className="text-[var(--ink-dim)]" />
              <span className="text-sm font-semibold text-[var(--ink)]">{t("Upload a barcode photo", "ផ្ទុករូបថត barcode")}</span>
            </>
          )}
        </button>

        <div className="rounded-md border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-3 text-xs leading-relaxed text-[var(--ink)]">
          {t(
            "Native camera scanning (BarcodeDetector) works in Chrome and Edge only; other browsers fall back to the built-in EAN-13 / UPC-A decoder.",
            "ការអានតាមកាមេរ៉ា (BarcodeDetector) ដំណើរការលើ Chrome និង Edge តែប៉ុណ្ណោះ; កម្មវិធីរុករកផ្សេងទៀតប្រើកម្មវិធីអាន EAN-13 / UPC-A ភ្ជាប់មកជាមួយ។"
          )}
        </div>

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

        {results.length > 0 && (
          <Output
            value={results.map((r) => `${r.rawValue}  [${r.format}]`).join("\n")}
            label={t("Detected barcode", "Barcode ដែលបានរកឃើញ")}
          />
        )}

        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
          <div className="mb-1 font-medium text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងការអរគុណ")}</div>
          <ul className="list-inside list-disc space-y-0.5">
            <li>
              {t("Built-in EAN-13 / UPC-A decoder:", "កម្មវិធីអាន EAN-13 / UPC-A ភ្ជាប់មកជាមួយ:")}{" "}
              {t("original Tools123 implementation based on the public EAN/UPC (GS1) symbology", "ការសរសេរដើមរបស់ Tools123 ផ្អែកលើការកំណត់ EAN/UPC (GS1) សាធារណៈ")}
            </li>
            <li>
              BarcodeDetector —{" "}
              <a className="underline" href="https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector" target="_blank" rel="noreferrer">W3C Barcode Detection API</a>{" "}
              ({t("integrated browser API, Chrome / Edge", "API កម្មវិធីរុករកដែលភ្ជាប់មក ដំណើរការលើ Chrome / Edge")})
            </li>
          </ul>
        </div>
      </div>
    </ToolShell>
  );
}
