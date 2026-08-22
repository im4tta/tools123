"use client";
import { useRef, useState } from "react";
import { CheckCircle2, Upload, XCircle } from "lucide-react";
import { ToolShell } from "@/components/ui/Shell";
import { CopyButton } from "@/components/CopyButton";
import { TextInput } from "@/components/ui/Shell";
import { useLanguage } from "@/components/LanguageProvider";

const ALGOS = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function FileChecksum() {
  const { text: t } = useLanguage();
  const [fileName, setFileName] = useState<string | null>(null);
  const [sizeLabel, setSizeLabel] = useState("");
  const [hashes, setHashes] = useState<Record<string, string> | null>(null);
  const [expected, setExpected] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function load(file: File) {
    setBusy(true);
    setFileName(file.name);
    setSizeLabel(`${(file.size / 1024).toFixed(1)} KB`);
    try {
      const buf = await file.arrayBuffer();
      const entries = await Promise.all(
        ALGOS.map(async (algo) => [algo, toHex(await crypto.subtle.digest(algo, buf))] as const),
      );
      setHashes(Object.fromEntries(entries));
    } catch {
      setHashes(null);
    } finally {
      setBusy(false);
    }
  }

  const normalizedExpected = expected.trim().toLowerCase().replace(/\s+/g, "");
  const matchAlgo = hashes && normalizedExpected
    ? ALGOS.find((a) => hashes[a] === normalizedExpected || hashes[a].startsWith(normalizedExpected) && normalizedExpected.length >= 16)
    : undefined;

  return (
    <ToolShell
      title="File Checksum Verifier"
      khmerTitle="ពិនិត្យកូដផ្ទៀងផ្ទាត់ឯកសារ"
      description="Hash any file with SHA-1/256/384/512 and verify it against an expected checksum."
      descriptionKm="គណនាកូដ SHA-1/256/384/512 នៃឯកសារណាមួយ ហើយផ្ទៀងផ្ទាត់ទៅនឹងកូដដែលរំពឹងទុក។"
    >
      <div className="space-y-4">
        <input ref={inputRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) load(f); e.target.value = ""; }} />
        {!hashes ? (
          <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[var(--ground-line)] p-12 transition hover:border-[var(--gold)]/40">
            <Upload size={30} className="text-[var(--ink-faint)]" />
            <span className="text-sm font-semibold text-[var(--ink)]">{t("Drop a file or click to browse", "ទម្លាក់ឯកសារ ឬចុចដើម្បីជ្រើសរើស")}</span>
          </button>
        ) : (
          <>
            <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="truncate text-sm font-semibold text-[var(--ink)]">{fileName}</div>
              <div className="text-xs text-[var(--ink-faint)]">{sizeLabel}</div>
              <button onClick={() => { setHashes(null); setFileName(null); setExpected(""); }} className="mt-2 rounded-md border border-[var(--ground-line)] px-3 py-1 text-xs text-[var(--ink-faint)] hover:text-[var(--ink)]">
                {t("Change", "ផ្លាស់ប្តូរ")}
              </button>
            </div>

            {(["SHA-256", "SHA-1", "SHA-384", "SHA-512"] as const).map((a) => (
              <div key={a} className="flex items-start gap-2 rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-faint)]">{a}</div>
                  <div className="break-all font-mono-ui text-xs text-[var(--ink)]">{hashes[a]}</div>
                </div>
                <CopyButton text={hashes[a]} compact />
              </div>
            ))}

            <div>
              <TextInput value={expected} onChange={(e) => setExpected(e.target.value)} placeholder={t("Paste expected checksum to verify…", "បិទភ្ជាប់កូដដើម្បីផ្ទៀងផ្ទាត់…")} className="font-mono-ui" />
            </div>

            {normalizedExpected.length >= 8 && (
              <div className={`flex items-center gap-2 rounded-xl border p-4 text-sm font-semibold ${matchAlgo ? "border-[var(--teal)]/40 bg-[var(--teal)]/10 text-[var(--teal)]" : "border-[var(--danger)]/40 bg-[var(--danger)]/10 text-[var(--danger)]"}`}>
                {matchAlgo ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                {matchAlgo
                  ? t("Match found!", "ត្រូវគ្នា!") + ` (${matchAlgo})`
                  : t("No match against any algorithm.", "មិនត្រូវគ្នាទេ។")}
              </div>
            )}
          </>
        )}
        <p className="text-xs text-[var(--ink-faint)]">{t("Hashed locally via the Web Crypto API — the file never leaves your device.", "គណនាក្នុងឧបករណ៍ដោយ Web Crypto API — ឯកសារមិនចេញពីឧបករណ៍អ្នកទេ។")}</p>
      </div>
    </ToolShell>
  );
}