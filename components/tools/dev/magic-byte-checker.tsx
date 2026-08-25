"use client";
import { useMemo, useState } from "react";
import { Upload } from "lucide-react";
import { ToolShell, Field, TextArea } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type Sig = { ext: string; name: string; bytes: number[]; offset?: number; mask?: number[] };

// Common file signatures (magic bytes). Ordered; first match wins per offset.
const SIGNATURES: Sig[] = [
  { ext: "png", name: "PNG image", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { ext: "jpg", name: "JPEG image", bytes: [0xff, 0xd8, 0xff] },
  { ext: "gif", name: "GIF image", bytes: [0x47, 0x49, 0x46, 0x38] }, // GIF8
  { ext: "webp", name: "WebP image", bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF....WEBP
  { ext: "bmp", name: "Bitmap image", bytes: [0x42, 0x4d] },
  { ext: "ico", name: "Icon (.ico)", bytes: [0x00, 0x00, 0x01, 0x00] },
  { ext: "pdf", name: "PDF document", bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { ext: "zip", name: "ZIP archive", bytes: [0x50, 0x4b, 0x03, 0x04] },
  { ext: "zip", name: "ZIP (empty)", bytes: [0x50, 0x4b, 0x05, 0x06] },
  { ext: "zip", name: "ZIP (spanned)", bytes: [0x50, 0x4b, 0x07, 0x08] },
  { ext: "gzip", name: "GZIP archive", bytes: [0x1f, 0x8b] },
  { ext: "rar", name: "RAR archive", bytes: [0x52, 0x61, 0x72, 0x21] },
  { ext: "7z", name: "7-Zip archive", bytes: [0x37, 0x7a, 0xbc, 0xaf] },
  { ext: "tar", name: "TAR archive", bytes: [0x75, 0x73, 0x74, 0x61, 0x72] },
  { ext: "mp3", name: "MP3 audio", bytes: [0x49, 0x44, 0x33] },
  { ext: "wav", name: "WAV audio", bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF....WAVE
  { ext: "flac", name: "FLAC audio", bytes: [0x66, 0x4c, 0x61, 0x43] },
  { ext: "ogg", name: "Ogg audio", bytes: [0x4f, 0x67, 0x67, 0x53] },
  { ext: "mp4", name: "MP4 video", bytes: [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70] },
  { ext: "mov", name: "QuickTime video", bytes: [0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70, 0x71, 0x74, 0x20, 0x20] },
  { ext: "webm", name: "WebM video", bytes: [0x1a, 0x45, 0xdf, 0xa3] },
  { ext: "avi", name: "AVI video", bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF....AVI
  { ext: "ttf", name: "TrueType font", bytes: [0x00, 0x01, 0x00, 0x00] },
  { ext: "otf", name: "OpenType font", bytes: [0x4f, 0x54, 0x54, 0x4f] },
  { ext: "woff", name: "WOFF font", bytes: [0x77, 0x4f, 0x46, 0x46] },
  { ext: "woff2", name: "WOFF2 font", bytes: [0x77, 0x4f, 0x46, 0x32] },
  { ext: "wasm", name: "WebAssembly", bytes: [0x00, 0x61, 0x73, 0x6d] },
  { ext: "exe", name: "PE executable", bytes: [0x4d, 0x5a] },
  { ext: "sqlite", name: "SQLite database", bytes: [0x53, 0x51, 0x4c, 0x69, 0x74, 0x65] },
  { ext: "docx", name: "DOCX / OOXML", bytes: [0x50, 0x4b, 0x03, 0x04] }, // zip-based; check later
  { ext: "xlsx", name: "XLSX / OOXML", bytes: [0x50, 0x4b, 0x03, 0x04] },
  { ext: "epub", name: "EPUB book", bytes: [0x50, 0x4b, 0x03, 0x04] },
  { ext: "json", name: "JSON text", bytes: [0x7b] }, // {
  { ext: "webp2", name: "WebP image", bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 },
  { ext: "wav2", name: "WAVE audio", bytes: [0x57, 0x41, 0x56, 0x45], offset: 8 },
  { ext: "avi2", name: "AVI video", bytes: [0x41, 0x56, 0x49, 0x20], offset: 8 },
  { ext: "epub2", name: "EPUB (zip+mimetype)", bytes: [0x50, 0x4b, 0x03, 0x04] },
];

function matchSig(candidate: number[]): Sig | null {
  for (const sig of SIGNATURES) {
    const off = sig.offset ?? 0;
    if (candidate.length < off + sig.bytes.length) continue;
    let ok = true;
    for (let i = 0; i < sig.bytes.length; i++) {
      if (candidate[off + i] !== sig.bytes[i]) { ok = false; break; }
    }
    if (ok) return sig;
  }
  return null;
}

export default function MagicByteChecker() {
  const { text: t } = useLanguage();
  const [hex, setHex] = useToolState("magic-byte:hex", "");
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState("");

  const clean = useMemo(() => hex.replace(/[^0-9a-fA-F]/g, "").toLowerCase(), [hex]);
  const parsed: number[] = useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i + 1 < clean.length; i += 2) out.push(parseInt(clean.slice(i, i + 2), 16));
    return out;
  }, [clean]);

  const result = useMemo(() => (clean.length >= 2 ? matchSig(parsed) : null), [clean, parsed]);
  const preview = useMemo(() => clean.slice(0, 24), [clean]);

  function onFile(f: File | null) {
    if (!f) return;
    setFile(f);
    setErr("");
    const reader = new FileReader();
    reader.onload = () => {
      const arr = Array.from(new Uint8Array(reader.result as ArrayBuffer));
      setHex(arr.map((b) => b.toString(16).padStart(2, "0")).join(""));
    };
    reader.readAsArrayBuffer(f);
  }

  return (
    <ToolShell
      title="File Magic-Byte Checker"
      khmerTitle="ពិនិត្យប្រភេទឯកសារ"
      description="Detect a file's real type from its magic bytes (PNG, PDF, ZIP, DOCX, audio, video, fonts, and more) — upload a file or paste hex. Local, no upload."
      descriptionKm="ស្វែងរកប្រភេទពិតប្រាកដរបស់ឯកសារពី magic bytes (PNG, PDF, ZIP, DOCX, សំឡេង, វីដេអូ, ពុម្ពអក្សរ...) — ផ្ទុកឯកសារ ឬបិទភ្ជាប់ hex។ ដំណើរការក្នុងម៉ាស៊ីន។"
    >
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-8 text-center text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)]">
        <Upload size={16} className="text-[var(--ink-faint)]" />
        <span>{file ? file.name : t("Click to choose a file", "ចុចដើម្បីជ្រើសរើសឯកសារ")}</span>
        <input type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
      </label>

      <Field label={t("Or paste hex bytes", "ឬបិទភ្ជាប់ hex")}>
        <TextArea rows={3} value={hex} onChange={(e) => setHex(e.target.value)} placeholder="89 50 4E 47 0D 0A 1A 0A …" className="font-mono-ui" />
      </Field>

      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-dim)]">{t("Bytes", "បៃ")}</span>
        <p className="break-all font-mono-ui text-sm text-[var(--ink)]">{preview ? preview.replace(/(..)/g, "$1 ").trim() : t("No data yet", "គ្មានទិន្នន័យ")}</p>
      </div>

      {clean.length > 0 && (
        <Output
          label={t("Detected type", "ប្រភេទដែលបានរកឃើញ")}
          value={result ? `${result.name} (.${result.ext})` : t("No known magic-byte match", "រកមិនឃើញការផ្គូផ្គង magic-byte")}
          error={!result}
        />
      )}
      {err && <p className="text-sm text-[var(--danger)]">{err}</p>}
      {result && result.ext === "zip" && (
        <p className="text-[11px] leading-relaxed text-[var(--ink-faint)]">
          {t("ZIP-based formats (DOCX, XLSX, EPUB) share the same leading bytes; check for a nested mimetype to distinguish.", "ទម្រង់ដែលផ្អែកលើ ZIP (DOCX, XLSX, EPUB) មានបៃនាំមុខដូចគ្នា — សូមពិនិត្យ mimetype ដើម្បីបែងចែក។")}
        </p>
      )}
    </ToolShell>
  );
}

