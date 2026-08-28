"use client";
import { useEffect, useState } from "react";
import { ToolShell, Field, TextArea, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

type B58Error = "invalid-b58" | "invalid-hex" | "too-short" | "checksum" | "version";

function base58Encode(bytes: Uint8Array): string {
  if (bytes.length === 0) return "";
  const digits: number[] = [0];
  for (const byte of bytes) {
    let carry = byte;
    for (let i = 0; i < digits.length; i++) {
      carry += digits[i] * 256;
      digits[i] = carry % 58;
      carry = Math.floor(carry / 58);
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }
  let zeros = 0;
  for (const byte of bytes) {
    if (byte !== 0) break;
    zeros++;
  }
  let out = "1".repeat(zeros);
  for (let i = digits.length - 1; i >= 0; i--) out += ALPHABET[digits[i]];
  return out;
}

function base58Decode(value: string): Uint8Array {
  const clean = value.trim();
  if (!clean) return new Uint8Array();
  const num: number[] = [0];
  for (const ch of clean) {
    const idx = ALPHABET.indexOf(ch);
    if (idx === -1) throw new Error("invalid character");
    let carry = idx;
    for (let i = 0; i < num.length; i++) {
      carry += num[i] * 58;
      num[i] = carry % 256;
      carry = Math.floor(carry / 256);
    }
    while (carry > 0) {
      num.push(carry % 256);
      carry = Math.floor(carry / 256);
    }
  }
  let zeros = 0;
  for (const ch of clean) {
    if (ch !== "1") break;
    zeros++;
  }
  const out = new Uint8Array(num.length + zeros);
  for (let i = 0; i < zeros; i++) out[i] = 0;
  for (let i = 0; i < num.length; i++) out[zeros + i] = num[num.length - 1 - i];
  return out;
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/^0x/i, "").replace(/[\s:]/g, "");
  if (!/^[0-9a-f]*$/i.test(clean)) throw new Error("invalid hex");
  const out = new Uint8Array(Math.ceil(clean.length / 2));
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function toHex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function doubleSha256(bytes: Uint8Array): Promise<Uint8Array> {
  const first = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  const second = await crypto.subtle.digest("SHA-256", first);
  return new Uint8Array(second);
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

type ExtraInfo = { version?: string; dataHex?: string; length: number };

export default function Base58Codec() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("b58:input", "");
  const [direction, setDirection] = useToolState<"encode" | "decode">("b58:direction", "encode");
  const [format, setFormat] = useToolState<"text" | "hex">("b58:format", "text");
  const [checksum, setChecksum] = useToolState<"off" | "on">("b58:checksum", "off");
  const [version, setVersion] = useToolState("b58:version", "00");
  const [result, setResult] = useState("");
  const [extra, setExtra] = useState<ExtraInfo | null>(null);
  const [error, setError] = useState<B58Error | "">("");

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const trimmed = input.trim();
        if (!trimmed) {
          if (alive) {
            setResult("");
            setExtra(null);
            setError("");
          }
          return;
        }
        if (direction === "encode") {
          let bytes: Uint8Array;
          try {
            bytes = format === "hex" ? hexToBytes(trimmed) : new TextEncoder().encode(trimmed);
          } catch {
            throw new Error("invalid-hex");
          }
          if (checksum === "on") {
            let versionBytes: Uint8Array;
            try {
              versionBytes = hexToBytes(version);
            } catch {
              throw new Error("version");
            }
            if (versionBytes.length !== 1) throw new Error("version");
            const payload = new Uint8Array(1 + bytes.length);
            payload.set(versionBytes, 0);
            payload.set(bytes, 1);
            const checksum4 = (await doubleSha256(payload)).subarray(0, 4);
            const full = new Uint8Array(payload.length + 4);
            full.set(payload, 0);
            full.set(checksum4, payload.length);
            if (alive) {
              setResult(base58Encode(full));
              setExtra({ version: toHex(versionBytes), dataHex: toHex(bytes), length: bytes.length });
              setError("");
            }
            return;
          }
          if (alive) {
            setResult(base58Encode(bytes));
            setExtra({ length: bytes.length });
            setError("");
          }
          return;
        }
        let bytes: Uint8Array;
        try {
          bytes = base58Decode(trimmed);
        } catch {
          throw new Error("invalid-b58");
        }
        if (checksum === "on") {
          if (bytes.length < 5) throw new Error("too-short");
          const payload = bytes.subarray(0, bytes.length - 4);
          const checksum4 = bytes.subarray(bytes.length - 4);
          const expected = (await doubleSha256(payload)).subarray(0, 4);
          if (!bytesEqual(checksum4, expected)) throw new Error("checksum");
          const data = payload.subarray(1);
          if (alive) {
            setResult(toHex(data));
            setExtra({ version: toHex(new Uint8Array([payload[0]])), dataHex: toHex(data), length: data.length });
            setError("");
          }
          return;
        }
        if (alive) {
          setResult(toHex(bytes));
          setExtra({ length: bytes.length });
          setError("");
        }
      } catch (e) {
        if (!alive) return;
        setResult("");
        setExtra(null);
        setError((e instanceof Error ? e.message : "") as B58Error);
      }
    })();
    return () => {
      alive = false;
    };
  }, [input, direction, format, checksum, version]);

  const errorText: Record<B58Error, string> = {
    "invalid-b58": t("Invalid Base58 character — the alphabet is 1-9, A-H, J-N, P-Z, a-k, m-z.", "តួអក្សរ Base58 មិនត្រឹមត្រូវ — អក្ខរក្រមគឺ 1-9, A-H, J-N, P-Z, a-k, m-z។"),
    "invalid-hex": t("Invalid hex input — only 0-9, a-f, spaces, colons, and an optional 0x prefix are allowed.", "ការបញ្ចូល hex មិនត្រឹមត្រូវ — អនុញ្ញាតតែ 0-9, a-f, ដកឃ្លា, សញ្ញាចុចពីរ និងបុព្វបទ 0x ប៉ុណ្ណោះ។"),
    "too-short": t("Data is too short for Base58Check (needs payload + 4-byte checksum).", "ទិន្នន័យខ្លីពេកសម្រាប់ Base58Check (ត្រូវការ payload + កូដផ្ទៀងផ្ទាត់ ៤ បៃ)។"),
    checksum: t("Checksum mismatch — the data is corrupted or was not Base58Check-encoded.", "កូដផ្ទៀងផ្ទាត់មិនត្រូវគ្នា — ទិន្នន័យខូច ឬមិនមែនត្រូវបានអ៊ិនកូដដោយ Base58Check។"),
    version: t("Version byte must be exactly one hex byte (e.g. 00).", "បៃកំណែត្រូវតែជា hex មួយបៃពិតប្រាកដ (ឧ. 00)។"),
  };

  return (
    <ToolShell
      title="Base58 Encoder / Decoder"
      khmerTitle="អ៊ិនកូដ Base58"
      description="Encode text or hex to Base58 (Bitcoin alphabet) and decode back, with optional Base58Check checksum verification."
      descriptionKm="អ៊ិនកូដអត្ថបទ ឬ hex ទៅជា Base58 (អក្ខរក្រម Bitcoin) និងឌិកូដត្រឡប់ ជាមួយការផ្ទៀងផ្ទាត់កូដ Base58Check ស្រេចចិត្ត។"
    >
      <div className="space-y-4">
        <Row>
          <Field label={t("Operation", "ប្រតិបត្តិការ")}>
            <Select value={direction} onChange={(e) => setDirection(e.target.value as "encode" | "decode")}>
              <option value="encode">{t("Encode → Base58", "អ៊ិនកូដ → Base58")}</option>
              <option value="decode">{t("Decode ← Base58", "ឌិកូដ ← Base58")}</option>
            </Select>
          </Field>
          {direction === "encode" ? (
            <Field label={t("Input format", "ទម្រង់បញ្ចូល")}>
              <Select value={format} onChange={(e) => setFormat(e.target.value as "text" | "hex")}>
                <option value="text">{t("Text", "អត្ថបទ")}</option>
                <option value="hex">Hex</option>
              </Select>
            </Field>
          ) : (
            <Field label={t("Base58Check", "Base58Check")}>
              <Select value={checksum} onChange={(e) => setChecksum(e.target.value as "off" | "on")}>
                <option value="off">{t("Off — plain Base58", "បិទ — Base58 ធម្មតា")}</option>
                <option value="on">{t("On — verify 4-byte checksum", "បើក — ផ្ទៀងផ្ទាត់កូដ ៤ បៃ")}</option>
              </Select>
            </Field>
          )}
        </Row>

        {direction === "encode" && (
          <Row>
            <Field label={t("Base58Check", "Base58Check")}>
              <Select value={checksum} onChange={(e) => setChecksum(e.target.value as "off" | "on")}>
                <option value="off">{t("Off — no checksum", "បិទ — គ្មានកូដផ្ទៀងផ្ទាត់")}</option>
                <option value="on">{t("On — append double-SHA256 checksum", "បើក — បន្ថែមកូដ double-SHA256")}</option>
              </Select>
            </Field>
            {checksum === "on" && (
              <Field label={t("Version byte (hex)", "បៃកំណែ (hex)")}>
                <Select value={version} onChange={(e) => setVersion(e.target.value)}>
                  <option value="00">00</option>
                  <option value="6f">6f</option>
                  <option value="05">05</option>
                  <option value="30">30</option>
                  <option value="80">80</option>
                </Select>
              </Field>
            )}
          </Row>
        )}

        <Field label={direction === "encode" ? t("Plain text / hex input", "អត្ថបទ / បញ្ចូល hex") : t("Base58 input", "បញ្ចូល Base58")}>
          <TextArea
            rows={4}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={direction === "encode" ? t("Hello World…", "ជំរាបសួរ…") : t("Paste Base58…", "បិទភ្ជាប់ Base58…")}
          />
        </Field>

        {error && <p className="text-sm text-[var(--danger)]">{errorText[error]}</p>}
        {result && <Output label={direction === "encode" ? t("Base58 result", "លទ្ធផល Base58") : t("Decoded bytes (hex)", "បៃឌិកូដ (hex)")} value={result} />}

        {extra && (
          <div className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs text-[var(--ink-dim)]">
            {extra.version !== undefined && (
              <p>
                {t("Version byte", "បៃកំណែ")}: <span className="font-mono-ui text-[var(--ink)]">0x{extra.version}</span>
              </p>
            )}
            <p>
              {t("Payload length", "ប្រវែង payload")}: <span className="font-mono-ui text-[var(--ink)]">{extra.length}</span> {t("bytes", "បៃ")}
            </p>
            {extra.dataHex && (
              <p className="mt-1">
                {t("Payload (hex)", "Payload (hex)")}: <span className="break-all font-mono-ui text-[var(--ink)]">{extra.dataHex}</span>
              </p>
            )}
          </div>
        )}

        <p className="text-xs text-[var(--ink-dim)]">
          {t("The checksum is the first 4 bytes of double-SHA256 over version ‖ payload (Bitcoin Base58Check). All computation is local.", "កូដផ្ទៀងផ្ទាត់គឺ ៤ បៃដំបូងនៃ double-SHA256 លើ version ‖ payload (Bitcoin Base58Check)។ ការគណនាទាំងអស់ធ្វើក្នុងឧបករណ៍។")}
        </p>
      </div>

      {/* Source & Credits */}
      <div className="mt-6 rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6">
        <h3 className="mb-3 font-semibold text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងក្រេឌីត")}</h3>
        <p className="text-xs leading-relaxed text-[var(--ink-dim)]">
          {t("Independent implementation of the Base58 and Base58Check encoding schemes defined by Bitcoin (Satoshi Nakamoto / Bitcoin Core).", "ការអនុវត្តឯករាជ្យនៃគ្រោងការអ៊ិនកូដ Base58 និង Base58Check ដែលកំណត់ដោយ Bitcoin (Satoshi Nakamoto / Bitcoin Core)។")}
        </p>
        <ul className="mt-3 space-y-1.5 text-xs text-[var(--ink-dim)]">
          <li>
            <a href="https://en.bitcoin.it/wiki/Base58Check_encoding" target="_blank" rel="noreferrer" className="text-[var(--gold)] underline underline-offset-2">
              Bitcoin Wiki — Base58Check encoding
            </a>
          </li>
        </ul>
      </div>
    </ToolShell>
  );
}
