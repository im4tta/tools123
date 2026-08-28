"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextArea } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type Direction = "to-punycode" | "to-unicode";

// Bootstring parameters from RFC 3492.
const BASE = 36;
const TMIN = 1;
const TMAX = 26;
const SKEW = 38;
const DAMP = 700;
const INITIAL_BIAS = 72;
const INITIAL_N = 128;
const DELIMITER = "-";
const MAX_INT = 0x7fffffff;

function digitToChar(d: number): string {
  return d < 26 ? String.fromCharCode(97 + d) : String.fromCharCode(48 + d - 26);
}

function charToDigit(ch: string): number {
  const code = ch.charCodeAt(0);
  if (code >= 97 && code <= 122) return code - 97;
  if (code >= 48 && code <= 57) return code - 48 + 26;
  return -1;
}

function adapt(delta: number, numPoints: number, firstTime: boolean): number {
  let d = firstTime ? Math.floor(delta / DAMP) : delta >> 1;
  d += Math.floor(d / numPoints);
  let k = 0;
  while (d > Math.floor(((BASE - TMIN) * TMAX) / 2)) {
    d = Math.floor(d / (BASE - TMIN));
    k += BASE;
  }
  return k + Math.floor(((BASE - TMIN + 1) * d) / (d + SKEW));
}

/** RFC 3492 punycode encoder for a single label. */
function encodePunycode(input: string): string {
  const cps = Array.from(input).map((ch) => ch.codePointAt(0) as number);
  const output: string[] = [];
  let h = 0;
  let b = 0;
  for (const c of cps) {
    if (c < 0x80) {
      output.push(String.fromCodePoint(c));
      h += 1;
      b += 1;
    }
  }
  if (b > 0 && h < cps.length) output.push(DELIMITER);
  let n = INITIAL_N;
  let delta = 0;
  let bias = INITIAL_BIAS;
  while (h < cps.length) {
    const m = Math.min(...cps.filter((c) => c >= n));
    if (m - n > Math.floor((MAX_INT - delta) / (h + 1))) throw new Error("overflow");
    delta += (m - n) * (h + 1);
    n = m;
    for (const c of cps) {
      if (c < n) {
        delta += 1;
        if (delta > MAX_INT) throw new Error("overflow");
      } else if (c === n) {
        let q = delta;
        for (let k = BASE; ; k += BASE) {
          const tk = k <= bias ? TMIN : k >= bias + TMAX ? TMAX : k - bias;
          if (q < tk) break;
          output.push(digitToChar(tk + ((q - tk) % (BASE - tk))));
          q = Math.floor((q - tk) / (BASE - tk));
        }
        output.push(digitToChar(q));
        bias = adapt(delta, h + 1, h === b);
        delta = 0;
        h += 1;
      }
    }
    delta += 1;
    n += 1;
  }
  return output.join("");
}

/** RFC 3492 punycode decoder for a single label. */
function decodePunycode(input: string): string {
  const output: number[] = [];
  const lastDelim = input.lastIndexOf(DELIMITER);
  // `i` is the insertion position / accumulated delta (starts at 0); the
  // input cursor is tracked separately in `pos`, as in the RFC's decoder.
  let i = 0;
  const pos = lastDelim >= 0 ? lastDelim + 1 : 0;
  if (lastDelim >= 0) {
    for (let k = 0; k < lastDelim; k += 1) {
      const c = input.charCodeAt(k);
      if (c >= 0x80) throw new Error("invalid basic code point");
      output.push(c);
    }
  }
  let n = INITIAL_N;
  let bias = INITIAL_BIAS;
  let cursor = pos;
  while (cursor < input.length) {
    const oldi = i;
    let w = 1;
    for (let k = BASE; ; k += BASE) {
      if (cursor >= input.length) throw new Error("invalid input");
      const digit = charToDigit(input[cursor]);
      cursor += 1;
      if (digit < 0) throw new Error("invalid input");
      i += digit * w;
      if (i > MAX_INT) throw new Error("overflow");
      const tk = k <= bias ? TMIN : k >= bias + TMAX ? TMAX : k - bias;
      if (digit < tk) break;
      w *= BASE - tk;
      if (w > MAX_INT) throw new Error("overflow");
    }
    const outLen = output.length + 1;
    bias = adapt(i - oldi, outLen, oldi === 0);
    n += Math.floor(i / outLen);
    if (n > 0x10ffff) throw new Error("overflow");
    i %= outLen;
    output.splice(i, 0, n);
    i += 1;
  }
  return output.map((c) => String.fromCodePoint(c)).join("");
}

/** Encode every non-ASCII label of a (possibly multi-label) domain. */
function toPunycode(domain: string): string {
  return domain
    .split(".")
    .map((label) => (/^[\x00-\x7F]*$/.test(label) ? label : "xn--" + encodePunycode(label)))
    .join(".");
}

/** Decode every "xn--" label of a (possibly multi-label) domain. */
function toUnicode(domain: string): string {
  return domain
    .split(".")
    .map((label) => (/^xn--/i.test(label) ? decodePunycode(label.slice(4)) : label))
    .join(".");
}

/** Per-label Unicode code points (hex) for all non-ASCII labels. */
function unicodeHex(unicode: string): { label: string; codepoints: { ch: string; hex: string }[] }[] {
  return unicode
    .split(".")
    .filter((label) => /[^\x00-\x7F]/.test(label))
    .map((label) => ({
      label,
      codepoints: Array.from(label).map((ch) => ({
        ch,
        hex: `U+${(ch.codePointAt(0) as number).toString(16).toUpperCase().padStart(4, "0")}`,
      })),
    }));
}

const DIRECTIONS: { id: Direction; en: string; km: string }[] = [
  { id: "to-punycode", en: "To Punycode (IDN → ASCII)", km: "ទៅ Punycode (IDN → ASCII)" },
  { id: "to-unicode", en: "To Unicode (ASCII → IDN)", km: "ទៅ Unicode (ASCII → IDN)" },
];

export default function PunycodeConverter() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("punycode-converter:input", "münchen.de");
  const [dir, setDir] = useToolState<Direction>("punycode-converter:dir", "to-punycode");

  const result = useMemo(() => {
    if (!input.trim()) return { error: "", output: "", hex: [] as { label: string; codepoints: { ch: string; hex: string }[] }[] };
    try {
      const output = dir === "to-punycode" ? toPunycode(input.trim()) : toUnicode(input.trim());
      const hex = unicodeHex(dir === "to-punycode" ? input : output);
      return { error: "", output, hex };
    } catch (err) {
      return {
        error: `${t("Invalid Punycode input", "បញ្ចូល Punycode មិនត្រឹមត្រូវ")}: ${err instanceof Error ? err.message : String(err)}`,
        output: "",
        hex: [],
      };
    }
  }, [input, dir, t]);

  return (
    <ToolShell
      title="Punycode / IDN Converter"
      khmerTitle="បម្លែង Punycode / IDN"
      description="Convert internationalized domain names to and from ASCII punycode (RFC 3492), with the hex Unicode code point of every character."
      descriptionKm="បម្លែងឈ្មោះដែនអន្តរជាតិទៅ និងពី punycode ASCII (RFC 3492) ដោយបង្ហាញលេខកូដ Unicode ជាគោលដប់ប្រាំមួយសម្រាប់រាល់តួអក្សរ។"
    >
      <Field label={t("Domain or label", "ដែន ឬស្លាក")}>
        <TextArea rows={2} value={input} onChange={(e) => setInput(e.target.value)} placeholder="münchen.de" />
      </Field>
      <Field label={t("Direction", "ទិសដៅ")}>
        <div className="flex flex-wrap gap-2">
          {DIRECTIONS.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDir(d.id)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                dir === d.id
                  ? "bg-[var(--gold)] text-[#0a0c0d]"
                  : "border border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-dim)] hover:text-[var(--ink)]"
              }`}
            >
              {t(d.en, d.km)}
            </button>
          ))}
        </div>
      </Field>
      {result.error ? (
        <Output label={t("Error", "កំហុស")} value={result.error} error />
      ) : (
        <Output label={t("Result", "លទ្ធផល")} value={result.output} />
      )}
      {result.hex.length > 0 && (
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
            {t("Unicode code points", "លេខកូដ Unicode")}
          </div>
          <div className="space-y-2 font-mono-ui text-xs">
            {result.hex.map((row) => (
              <div key={row.label} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-[var(--ink)]">{row.label}</span>
                <span className="text-[var(--ink-faint)]">
                  {row.codepoints.map((cp) => `${cp.ch} ${cp.hex}`).join("  ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6">
        <h3 className="mb-3 font-semibold text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងក្រេឌីត")}</h3>
        <p className="text-xs leading-relaxed text-[var(--ink-dim)]">
          {t(
            "Original implementation by Tools123 of the punycode algorithm specified in RFC 3492 (Punycode: A Bootstring encoding of Unicode for Internationalized Domain Names in Applications) by Adam M. Costello.",
            "ការអនុវត្តឯករាជ្យរបស់ Tools123 នៃក្បួនដោះស្រាយ punycode ដែលកំណត់ក្នុង RFC 3492 (Punycode: A Bootstring encoding of Unicode for IDNA) ដោយ Adam M. Costello។"
          )}{" "}
          <a href="https://www.rfc-editor.org/rfc/rfc3492" target="_blank" rel="noreferrer" className="text-[var(--gold)] underline underline-offset-2">
            rfc-editor.org/rfc/rfc3492
          </a>
        </p>
      </div>
    </ToolShell>
  );
}
