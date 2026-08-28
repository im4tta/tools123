"use client";
import { useState } from "react";
import { ToolShell, Field, TextInput, TextArea, Select } from "@/components/ui/Shell";
import { Output, Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const PBKDF2_ITERATIONS = 100_000;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function fromBase64(value: string): Uint8Array {
  const bin = atob(value.trim());
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey("raw", encoder.encode(passphrase) as BufferSource, "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/** Layout: salt(16) ‖ IV(12) ‖ ciphertext ‖ GCM tag(16), base64-encoded. */
async function encryptText(passphrase: string, plaintext: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const sealed = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, encoder.encode(plaintext) as BufferSource));
  const tag = sealed.subarray(sealed.length - 16);
  const body = sealed.subarray(0, sealed.length - 16);
  const out = new Uint8Array(16 + 12 + body.length + 16);
  out.set(salt, 0);
  out.set(iv, 16);
  out.set(body, 28);
  out.set(tag, 28 + body.length);
  return toBase64(out);
}

async function decryptText(passphrase: string, payload: string): Promise<string> {
  const bytes = fromBase64(payload);
  if (bytes.length < 16 + 12 + 16) throw new Error("payload too short");
  const salt = bytes.subarray(0, 16);
  const iv = bytes.subarray(16, 28);
  const ciphertext = bytes.subarray(28);
  const key = await deriveKey(passphrase, salt);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, ciphertext as BufferSource);
  return decoder.decode(plain);
}

export default function AesEncryption() {
  const { text: t } = useLanguage();
  const [mode, setMode] = useToolState<"encrypt" | "decrypt">("aes:mode", "encrypt");
  const [passphrase, setPassphrase] = useToolState("aes:passphrase", "");
  const [text, setText] = useToolState("aes:text", "");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    setError("");
    setResult("");
    try {
      if (mode === "encrypt") {
        setResult(await encryptText(passphrase, text));
      } else {
        setResult(await decryptText(passphrase, text));
      }
    } catch {
      setError(
        mode === "encrypt"
          ? t("Encryption failed.", "ការអ៊ិនគ្រីបបរាជ័យ។")
          : t("Decryption failed — wrong passphrase or corrupted/tampered data.", "ការឌិគ្រីបបរាជ័យ — ពាក្យសម្ងាត់ខុស ឬទិន្នន័យខូច/ត្រូវបានកែប្រែ។")
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell
      title="AES Encrypt / Decrypt"
      khmerTitle="អ៊ិនគ្រីប / ឌិគ្រីប AES"
      description="Encrypt and decrypt text with AES-256-GCM, keyed from a passphrase via PBKDF2 (SHA-256, 100,000 iterations)."
      descriptionKm="អ៊ិនគ្រីប និងឌិគ្រីបអត្ថបទដោយ AES-256-GCM ដោយបង្កើតសោពីពាក្យសម្ងាត់តាម PBKDF2 (SHA-256, ១០០,០០០ ដង)។"
    >
      <div className="space-y-4">
        <Select value={mode} onChange={(e) => { setMode(e.target.value as "encrypt" | "decrypt"); setResult(""); setError(""); }}>
          <option value="encrypt">{t("Encrypt", "អ៊ិនគ្រីប")}</option>
          <option value="decrypt">{t("Decrypt", "ឌិគ្រីប")}</option>
        </Select>

        <Field label={t("Passphrase", "ពាក្យសម្ងាត់")}>
          <TextInput
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder={t("Enter a passphrase…", "បញ្ចូលពាក្យសម្ងាត់…")}
            className="font-mono-ui"
          />
        </Field>

        <Field label={mode === "encrypt" ? t("Plain text", "អត្ថបទធម្មតា") : t("Encrypted payload (base64)", "ទិន្នន័យអ៊ិនគ្រីប (base64)")}>
          <TextArea
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={mode === "encrypt" ? t("Text to encrypt…", "អត្ថបទដែលត្រូវអ៊ិនគ្រីប…") : t("Paste base64 payload…", "បិទភ្ជាប់ទិន្នន័យ base64…")}
          />
        </Field>

        <Button type="button" onClick={() => void run()} disabled={!passphrase || !text || busy}>
          {busy ? t("Working…", "កំពុងដំណើរការ…") : mode === "encrypt" ? t("Encrypt", "អ៊ិនគ្រីប") : t("Decrypt", "ឌិគ្រីប")}
        </Button>

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        {result && <Output label={mode === "encrypt" ? t("Encrypted (base64)", "អ៊ិនគ្រីប (base64)") : t("Decrypted text", "អត្ថបទឌិគ្រីប")} value={result} mono={mode === "encrypt"} />}

        <div className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
          <p>
            {t("Format: base64(salt ‖ IV ‖ ciphertext ‖ GCM tag). The random 16-byte salt and 12-byte IV are stored with the ciphertext so decryption works from the payload alone.", "ទម្រង់៖ base64(salt ‖ IV ‖ ciphertext ‖ GCM tag)។ salt ចៃដន្យ ១៦ បៃ និង IV ១២ បៃ ត្រូវបានរក្សាទុកជាមួយ ciphertext ដើម្បីឱ្យការឌិគ្រីបដំណើរការពីទិន្នន័យតែម្នាក់ឯង។")}
          </p>
          <p className="mt-2">
            {t("Key derivation: PBKDF2-HMAC-SHA-256, 100,000 iterations · Cipher: AES-256-GCM with a 12-byte IV (RFC 8018 / NIST SP 800-38D).", "ការបង្កើតសោ៖ PBKDF2-HMAC-SHA-256, ១០០,០០០ ដង · ក្បួន៖ AES-256-GCM ជាមួយ IV ១២ បៃ (RFC 8018 / NIST SP 800-38D)។")}
          </p>
          <p className="mt-2">
            {t("All computation happens locally with the Web Crypto API — nothing is sent over the network.", "ការគណនាទាំងអស់ធ្វើក្នុងឧបករណ៍តាម Web Crypto API — គ្មានអ្វីត្រូវបានបញ្ជូនតាមបណ្តាញទេ។")}
          </p>
        </div>
      </div>

      {/* Source & Credits */}
      <div className="mt-6 rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6">
        <h3 className="mb-3 font-semibold text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងក្រេឌីត")}</h3>
        <ul className="space-y-1.5 text-xs text-[var(--ink-dim)]">
          <li>
            <a href="https://www.rfc-editor.org/rfc/rfc8018" target="_blank" rel="noreferrer" className="text-[var(--gold)] underline underline-offset-2">
              RFC 8018
            </a>{" "}
            — {t("PBKDF2 password-based key derivation", "ការបង្កើតសោពីពាក្យសម្ងាត់ PBKDF2")}
          </li>
          <li>
            <a href="https://csrc.nist.gov/pubs/sp/800/38/d/final" target="_blank" rel="noreferrer" className="text-[var(--gold)] underline underline-offset-2">
              NIST SP 800-38D
            </a>{" "}
            — {t("AES-GCM authenticated encryption", "ការអ៊ិនគ្រីបដែលមានការផ្ទៀងផ្ទាត់ AES-GCM")}
          </li>
          <li>{t("Implemented with the W3C Web Crypto API (crypto.subtle) — no cryptography libraries required.", "អនុវត្តដោយ W3C Web Crypto API (crypto.subtle) — មិនត្រូវការបណ្ណាល័យគ្រីបតូទេ។")}</li>
        </ul>
      </div>
    </ToolShell>
  );
}
