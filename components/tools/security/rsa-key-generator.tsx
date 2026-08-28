"use client";
import { useState } from "react";
import { ToolShell, Field, Select, Row } from "@/components/ui/Shell";
import { Output, Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

function toBase64(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function toPem(buf: ArrayBuffer, label: string): string {
  const b64 = toBase64(new Uint8Array(buf));
  const lines = b64.match(/.{1,64}/g) ?? [b64];
  return `-----BEGIN ${label}-----\n${lines.join("\n")}\n-----END ${label}-----`;
}

export default function RsaKeyGenerator() {
  const { text: t } = useLanguage();
  const [bits, setBits] = useToolState<"2048" | "4096">("rsa:bits", "2048");
  const [publicPem, setPublicPem] = useState("");
  const [privatePem, setPrivatePem] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    setError("");
    setPublicPem("");
    setPrivatePem("");
    try {
      const pair = await crypto.subtle.generateKey(
        { name: "RSA-OAEP", modulusLength: Number(bits), publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
        true,
        ["encrypt", "decrypt"]
      );
      const [spki, pkcs8] = await Promise.all([
        crypto.subtle.exportKey("spki", pair.publicKey),
        crypto.subtle.exportKey("pkcs8", pair.privateKey),
      ]);
      setPublicPem(toPem(spki, "PUBLIC KEY"));
      setPrivatePem(toPem(pkcs8, "PRIVATE KEY"));
    } catch {
      setError(t("Key generation failed — Web Crypto is unavailable in this browser context (HTTPS or localhost required).", "ការបង្កើតសោបរាជ័យ — Web Crypto មិនអាចប្រើបានក្នុងបរិបទកម្មវិធីរុករកនេះទេ (ត្រូវការ HTTPS ឬ localhost)។"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell
      title="RSA Key Pair Generator"
      khmerTitle="បង្កើតសោ RSA"
      description="Generate RSA-OAEP key pairs (2048/4096 bit) and export them as PEM (SPKI public, PKCS#8 private)."
      descriptionKm="បង្កើតសោគូ RSA-OAEP (2048/4096 ប៊ីត) និងនាំចេញជា PEM (SPKI សាធារណៈ, PKCS#8 ឯកជន)។"
    >
      <div className="space-y-4">
        <Row>
          <Field label={t("Key size", "ទំហំសោ")}>
            <Select value={bits} onChange={(e) => setBits(e.target.value as "2048" | "4096")}>
              <option value="2048">2048 {t("bits", "ប៊ីត")}</option>
              <option value="4096">4096 {t("bits", "ប៊ីត")}</option>
            </Select>
          </Field>
          <Field label={t("Action", "សកម្មភាព")}>
            <Button type="button" onClick={() => void generate()} disabled={busy}>
              {busy ? t("Generating…", "កំពុងបង្កើត…") : t("Generate key pair", "បង្កើតសោគូ")}
            </Button>
          </Field>
        </Row>

        <div className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
          {bits === "2048" ? (
            <p>
              {t("≈112-bit security level for 2048-bit RSA (NIST SP 800-57).", "កម្រិតសន្តិសុខ ≈112 ប៊ីត សម្រាប់ RSA 2048 ប៊ីត (NIST SP 800-57)។")}
            </p>
          ) : (
            <p>
              {t("≈140-bit security level for 4096-bit RSA (estimate — NIST SP 800-57 lists 3072-bit ≈ 128 and 7680-bit ≈ 192).", "កម្រិតសន្តិសុខ ≈140 ប៊ីត សម្រាប់ RSA 4096 ប៊ីត (ប៉ាន់ស្មាន — NIST SP 800-57 កំណត់ 3072 ប៊ីត ≈ 128 និង 7680 ប៊ីត ≈ 192)។")}
            </p>
          )}
          <p className="mt-1">{t("Hash: SHA-256 · Padding: OAEP (RFC 8017) · Export: SPKI (public) and PKCS#8 (private) PEM.", "Hash៖ SHA-256 · Padding៖ OAEP (RFC 8017) · នាំចេញ៖ SPKI (សាធារណៈ) និង PKCS#8 (ឯកជន) PEM។")}</p>
        </div>

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

        {publicPem && (
          <>
            <Output label={t("Public key (PEM / SPKI)", "សោសាធារណៈ (PEM / SPKI)")} value={publicPem} />
            <Output label={t("Private key (PEM / PKCS#8)", "សោឯកជន (PEM / PKCS#8)")} value={privatePem} />
            <div className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-3 text-xs leading-relaxed text-[var(--danger)]">
              <p className="font-medium">
                {t("Warning", "ការព្រមាន")}:{" "}
                {t("The private key is generated locally and never leaves your device. Anyone who obtains it can decrypt data meant for you — store it securely and never share it. Tools123 cannot recover a lost private key.", "សោឯកជនត្រូវបានបង្កើតក្នុងឧបករណ៍ ហើយមិនដែលចេញពីឧបករណ៍របស់អ្នកទេ។ អ្នកណាដែលបានវា អាចឌិគ្រីបទិន្នន័យដែលមានបំណងសម្រាប់អ្នក — សូមរក្សាទុកដោយសុវត្ថិភាព ហើយកុំចែករំលែក។ Tools123 មិនអាចយកសោឯកជនដែលបាត់មកវិញបានទេ។")}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Source & Credits */}
      <div className="mt-6 rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6">
        <h3 className="mb-3 font-semibold text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងក្រេឌីត")}</h3>
        <ul className="space-y-1.5 text-xs text-[var(--ink-dim)]">
          <li>
            <a href="https://www.rfc-editor.org/rfc/rfc8017" target="_blank" rel="noreferrer" className="text-[var(--gold)] underline underline-offset-2">
              RFC 8017
            </a>{" "}
            — {t("RSA-OAEP encryption scheme", "គ្រោងការអ៊ិនគ្រីប RSA-OAEP")}
          </li>
          <li>
            <a href="https://csrc.nist.gov/pubs/sp/800/57/r1/upd1/final" target="_blank" rel="noreferrer" className="text-[var(--gold)] underline underline-offset-2">
              NIST SP 800-57
            </a>{" "}
            — {t("Key-size security strength estimates", "ការប៉ាន់ស្មានកម្លាំងសន្តិសុខតាមទំហំសោ")}
          </li>
          <li>{t("Implemented with the W3C Web Crypto API (crypto.subtle) — keys are generated in the browser.", "អនុវត្តដោយ W3C Web Crypto API (crypto.subtle) — សោត្រូវបានបង្កើតក្នុងកម្មវិធីរុករក។")}</li>
        </ul>
      </div>
    </ToolShell>
  );
}
