"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type Confidence = "high" | "medium" | "low";

type Candidate = {
  name: string;
  nameKm: string;
  confidence: Confidence;
  note?: string;
  noteKm?: string;
};

// Length → candidate hash families. Several families share a length (e.g.
// 64 hex chars: SHA-256 / SHA3-256 / BLAKE2b-256) and cannot be told apart
// by length alone, so those are reported as medium confidence.
const LENGTH_TABLE: { length: number; candidates: Candidate[] }[] = [
  { length: 8, candidates: [{ name: "CRC32", nameKm: "CRC32", confidence: "low", note: "Any 4-byte value matches this length.", noteKm: "តម្លៃ ៤ បៃណាមួយអាចមានប្រវែងនេះ។" }] },
  {
    length: 32,
    candidates: [
      { name: "MD5", nameKm: "MD5", confidence: "medium", note: "Same length as NTLM.", noteKm: "ប្រវែងដូច NTLM។" },
      { name: "NTLM", nameKm: "NTLM", confidence: "medium", note: "Same length as MD5.", noteKm: "ប្រវែងដូច MD5។" },
    ],
  },
  { length: 40, candidates: [{ name: "SHA-1", nameKm: "SHA-1", confidence: "medium", note: "Also matches RIPEMD-160 length.", noteKm: "ក៏ត្រូវនឹងប្រវែង RIPEMD-160 ដែរ។" }] },
  { length: 56, candidates: [{ name: "SHA-224", nameKm: "SHA-224", confidence: "medium" }] },
  {
    length: 64,
    candidates: [
      { name: "SHA-256", nameKm: "SHA-256", confidence: "medium" },
      { name: "SHA3-256", nameKm: "SHA3-256", confidence: "medium" },
      { name: "BLAKE2b-256", nameKm: "BLAKE2b-256", confidence: "medium" },
    ],
  },
  { length: 96, candidates: [{ name: "SHA-384", nameKm: "SHA-384", confidence: "medium" }] },
  {
    length: 128,
    candidates: [
      { name: "SHA-512", nameKm: "SHA-512", confidence: "medium" },
      { name: "SHA3-512", nameKm: "SHA3-512", confidence: "medium" },
      { name: "BLAKE2b-512", nameKm: "BLAKE2b-512", confidence: "medium" },
    ],
  },
];

const CONFIDENCE_UI: Record<Confidence, { label: string; labelKm: string; cls: string }> = {
  high: { label: "High confidence", labelKm: "ទំនុកចិត្តខ្ពស់", cls: "border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--gold)]" },
  medium: { label: "Medium confidence", labelKm: "ទំនុកចិត្តមធ្យម", cls: "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink)]" },
  low: { label: "Low confidence", labelKm: "ទំនុកចិត្តទាប", cls: "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-dim)]" },
};

type DetectResult = { kind: "hex" | "base64" | "other"; length: number; candidates: Candidate[] } | null;

function detectHash(rawInput: string): DetectResult {
  const raw = rawInput.trim();
  if (!raw) return null;

  if (/^\$argon2/i.test(raw)) {
    return { kind: "other", length: raw.length, candidates: [{ name: "Argon2", nameKm: "Argon2", confidence: "high" }] };
  }
  if (/^\$2[abxy]\$/.test(raw)) {
    return { kind: "other", length: raw.length, candidates: [{ name: "bcrypt", nameKm: "bcrypt", confidence: "high" }] };
  }
  if (/^\*[0-9a-f]{40}$/i.test(raw)) {
    return {
      kind: "hex",
      length: 40,
      candidates: [{ name: "MySQL (4.1+ password)", nameKm: "MySQL (ពាក្យសម្ងាត់ 4.1+)", confidence: "high" }],
    };
  }

  const uuid = /^([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})$/i.exec(raw);
  if (uuid) {
    const version = Number(uuid[3][0]);
    if (version >= 1 && version <= 5) {
      return {
        kind: "hex",
        length: raw.length,
        candidates: [{ name: `UUID v${version}`, nameKm: `UUID v${version}`, confidence: "high" }],
      };
    }
  }

  const hex = raw.replace(/[\s:]/g, "").toLowerCase();
  if (/^[0-9a-f]+$/.test(hex)) {
    const hit = LENGTH_TABLE.find((e) => e.length === hex.length);
    return { kind: "hex", length: hex.length, candidates: hit ? hit.candidates : [] };
  }

  const b64 = raw.replace(/\s/g, "");
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(b64) && b64.length % 4 === 0 && b64.length >= 8) {
    return { kind: "base64", length: b64.length, candidates: [] };
  }

  return { kind: "other", length: raw.length, candidates: [] };
}

export default function HashIdentifier() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("hashid:input", "");

  const result = useMemo(() => detectHash(input), [input]);

  return (
    <ToolShell
      title="Hash Identifier"
      khmerTitle="កំណត់ប្រភេទ Hash"
      description="Paste a hash to identify its likely algorithm by format, prefix, and length."
      descriptionKm="បិទភ្ជាប់ hash ដើម្បីកំណត់ក្បួនដែលទំនងជាប្រើ តាមទម្រង់ បុព្វបទ និងប្រវែង។"
    >
      <Field label={t("Hash value", "តម្លៃ Hash")}>
        <TextInput
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("Paste a hash, e.g. 5f4dcc3b5aa765d61d8327deb882cf99…", "បិទភ្ជាប់ hash ឧ. 5f4dcc3b5aa765d61d8327deb882cf99…")}
          className="font-mono-ui"
        />
      </Field>

      {!result && (
        <p className="text-sm text-[var(--ink-dim)]">{t("Enter a hash to identify it.", "សូមបញ្ចូល hash ដើម្បីកំណត់ប្រភេទ។")}</p>
      )}

      {result && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--ink-dim)]">
            <span className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-2 py-1">
              {t("Length", "ប្រវែង")}: <span className="font-mono-ui text-[var(--ink)]">{result.length}</span>
            </span>
            <span className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-2 py-1">
              {t("Encoding", "ការអ៊ិនកូដ")}:{" "}
              <span className="font-medium text-[var(--ink)]">
                {result.kind === "hex" ? t("Hex", "គោលដប់ប្រាំមួយ") : result.kind === "base64" ? t("Base64", "Base64") : t("Other / structured", "ផ្សេងទៀត / មានរចនាសម្ព័ន្ធ")}
              </span>
            </span>
          </div>

          {result.candidates.length > 0 ? (
            result.candidates.map((c, i) => {
              const conf = CONFIDENCE_UI[c.confidence];
              return (
                <div key={i} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono-ui text-sm font-semibold text-[var(--ink)]">{c.name}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${conf.cls}`}>
                      {t(conf.label, conf.labelKm)}
                    </span>
                  </div>
                  {c.note && <p className="mt-1 text-xs text-[var(--ink-dim)]">{t(c.note, c.noteKm ?? c.note)}</p>}
                </div>
              );
            })
          ) : (
            <p className="text-sm text-[var(--danger)]">
              {result.kind === "base64"
                ? t("This looks like Base64-encoded data, not a standard hex hash. Decode it first or check the length.", "នេះមើលទៅដូចជាទិន្នន័យ Base64 មិនមែន hash គោលដប់ប្រាំមួយទេ។ សូមឌិកូដសិន ឬពិនិត្យប្រវែង។")
                : t("Could not identify this value as a common hash.", "មិនអាចកំណត់ថាតម្លៃនេះជា hash ទូទៅណាមួយទេ។")}
            </p>
          )}

          <p className="text-xs text-[var(--ink-dim)]">
            {t("Identification is heuristic — based only on format, prefix, and length. Prefix-free hex hashes of the same length (e.g. SHA-256 vs SHA3-256) cannot be distinguished without trying each algorithm.", "ការកំណត់នេះជាវិធីសាស្ត្រប៉ាន់ស្មាន — ផ្អែកតែលើទម្រង់ បុព្វបទ និងប្រវែង។ Hash គោលដប់ប្រាំមួយគ្មានបុព្វបទ ដែលមានប្រវែងដូចគ្នា (ឧ. SHA-256 ធៀប SHA3-256) មិនអាចបែងចែកបានទេ បើមិនសាកល្បងក្បួននីមួយៗ។")}
          </p>
        </div>
      )}
    </ToolShell>
  );
}
