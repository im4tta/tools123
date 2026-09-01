"use client";
import { useMemo, useState } from "react";
import { ToolShell, TextArea, Field, Select, Row } from "@/components/ui/Shell";
import { Button, Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type Format = "gzip" | "deflate" | "deflate-raw";

const FORMATS: { id: Format; label: string }[] = [
  { id: "gzip", label: "gzip" },
  { id: "deflate", label: "deflate" },
  { id: "deflate-raw", label: "deflate-raw" },
];

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToBytes(input: string): Uint8Array<ArrayBuffer> | null {
  try {
    const binary = atob(input.trim());
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

async function compressText(text: string, format: Format): Promise<Uint8Array> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream(format));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function decompressBytes(bytes: Uint8Array<ArrayBuffer>, format: Format): Promise<string> {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream(format));
  return new TextDecoder().decode(await new Response(stream).arrayBuffer());
}

function isSupported(): boolean {
  return typeof CompressionStream !== "undefined" && typeof DecompressionStream !== "undefined";
}

export default function TextCompressor() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("text-compressor:input", "ភាសាខ្មែរ គឺជាភាសាជាតិរបស់ព្រះរាជាណាចក្រកម្ពុជា។ អត្ថបទនេះនឹងត្រូវបានបង្ហាប់។");
  const [format, setFormat] = useToolState<Format>("text-compressor:format", "gzip");
  const [b64In, setB64In] = useToolState("text-compressor:b64in", "");

  const [compResult, setCompResult] = useState<{ b64: string; origBytes: number; compBytes: number } | null>(null);
  const [decResult, setDecResult] = useState<{ text: string; bytes: number } | null>(null);
  const [compError, setCompError] = useState("");
  const [decError, setDecError] = useState("");

  const origBytes = useMemo(() => new TextEncoder().encode(input).length, [input]);

  const handleCompress = async () => {
    setCompError("");
    setDecError("");
    if (!isSupported()) {
      setCompError(
        t(
          "This browser does not support the CompressionStream API yet (Chrome/Edge 80+, Firefox 113+, Safari 16.4+).",
          "កម្មវិធីរុករកនេះមិនទាន់គាំទ្រ API CompressionStream ទេ (Chrome/Edge 80+, Firefox 113+, Safari 16.4+)។"
        )
      );
      return;
    }
    if (!input.trim()) {
      setCompError(t("Enter some text to compress first.", "សូមបញ្ចូលអត្ថបទដើម្បីបង្ហាប់ជាមុនសិន។"));
      return;
    }
    try {
      const bytes = await compressText(input, format);
      setCompResult({ b64: bytesToBase64(bytes), origBytes: new TextEncoder().encode(input).length, compBytes: bytes.length });
    } catch {
      setCompError(t("Compression failed.", "ការបង្ហាប់បរាជ័យ។"));
    }
  };

  const handleDecompress = async () => {
    setCompError("");
    setDecError("");
    if (!isSupported()) {
      setDecError(
        t(
          "This browser does not support the DecompressionStream API yet (Chrome/Edge 80+, Firefox 113+, Safari 16.4+).",
          "កម្មវិធីរុករកនេះមិនទាន់គាំទ្រ API DecompressionStream ទេ (Chrome/Edge 80+, Firefox 113+, Safari 16.4+)។"
        )
      );
      return;
    }
    const bytes = base64ToBytes(b64In);
    if (!bytes || bytes.length === 0) {
      setDecError(t("Enter a valid base64 string to decompress.", "សូមបញ្ចូលខ្សែអក្សរ base64 ត្រឹមត្រូវដើម្បីស្រាយបង្ហាប់។"));
      return;
    }
    try {
      const text = await decompressBytes(bytes, format);
      setDecResult({ text, bytes: bytes.length });
    } catch {
      setDecError(t("Decompression failed — check the format and the base64 data.", "ការស្រាយបង្ហាប់បរាជ័យ — សូមពិនិត្យទម្រង់ និងទិន្នន័យ base64។"));
    }
  };

  return (
    <ToolShell
      title="Text Compressor"
      khmerTitle="បង្ហាប់អត្ថបទ"
      description="Compress and decompress text entirely in your browser with the native CompressionStream API (gzip, deflate, deflate-raw), and compare original vs compressed size."
      descriptionKm="បង្ហាប់ និងស្រាយបង្ហាប់អត្ថបទទាំងស្រុងក្នុងកម្មវិធីរុករក ដោយប្រើ API CompressionStream ដើម (gzip, deflate, deflate-raw) និងប្រៀបធៀបទំហំមុន និងក្រោយបង្ហាប់។"
    >
      <Field
        label={t("Text to compress", "អត្ថបទត្រូវបង្ហាប់")}
        hint={t(`${origBytes} bytes (UTF-8)`, `${origBytes} បៃ (UTF-8)`)}
      >
        <TextArea rows={6} value={input} onChange={(e) => setInput(e.target.value)} className="font-khmer" />
      </Field>

      <Row>
        <Field label={t("Format", "ទម្រង់")}>
          <Select value={format} onChange={(e) => setFormat(e.target.value as Format)}>
            {FORMATS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex items-end">
          <Button type="button" onClick={() => void handleCompress()}>
            {t("Compress", "បង្ហាប់")}
          </Button>
        </div>
      </Row>

      {compError && (
        <p className="rounded-md border border-[var(--danger)]/50 bg-[var(--danger)]/10 p-4 text-sm text-[var(--danger)]">
          {compError}
        </p>
      )}

      {compResult && (
        <>
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-3 text-sm text-[var(--ink)]">
            {t("Original", "ដើម")}: <span className="font-mono-ui text-[var(--gold)]">{compResult.origBytes} B</span>{" "}
            {t("→", "→")} {t("Compressed", "បង្ហាប់")}:{" "}
            <span className="font-mono-ui text-[var(--gold)]">{compResult.compBytes} B</span>{" "}
            <span className="text-[var(--ink-faint)]">
              ({Math.round((compResult.compBytes / Math.max(compResult.origBytes, 1)) * 100)}%)
            </span>
          </div>
          <Output label={t("Compressed output (base64)", "លទ្ធផលបង្ហាប់ (base64)")} value={compResult.b64} />
        </>
      )}

      <div className="border-t border-[var(--ground-line)] pt-5">
        <Field label={t("Base64 to decompress", "base64 ត្រូវស្រាយបង្ហាប់")}>
          <TextArea rows={5} value={b64In} onChange={(e) => setB64In(e.target.value)} className="font-mono-ui" />
        </Field>
        <Row>
          <Field label={t("Format", "ទម្រង់")}>
            <Select value={format} onChange={(e) => setFormat(e.target.value as Format)}>
              {FORMATS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex items-end">
            <Button type="button" onClick={() => void handleDecompress()}>
              {t("Decompress", "ស្រាយបង្ហាប់")}
            </Button>
          </div>
        </Row>

        {decError && (
          <p className="rounded-md border border-[var(--danger)]/50 bg-[var(--danger)]/10 p-4 text-sm text-[var(--danger)]">
            {decError}
          </p>
        )}

        {decResult && (
          <>
            <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-3 text-sm text-[var(--ink)]">
              {t("Input was", "ការបញ្ចូលមានទំហំ")}:{" "}
              <span className="font-mono-ui text-[var(--gold)]">{decResult.bytes} B</span>
            </div>
            <Output label={t("Decompressed text", "អត្ថបទស្រាយបង្ហាប់")} value={decResult.text} mono={false} />
          </>
        )}
      </div>

      <p className="text-xs leading-relaxed text-[var(--ink-dim)]">
        {t(
          "All compression happens locally in your browser using the native CompressionStream / DecompressionStream APIs — nothing is uploaded. Requires a modern browser (Chrome/Edge 80+, Firefox 113+, Safari 16.4+). Output is base64 text so it can be copied and pasted anywhere.",
          "ការបង្ហាប់ទាំងអស់កើតឡើងក្នុងកម្មវិធីរុករករបស់អ្នក ដោយប្រើ API CompressionStream / DecompressionStream ដើម — គ្មានអ្វីត្រូវបានផ្ទុកឡើងទេ។ ត្រូវការកម្មវិធីរុករកទំនើប (Chrome/Edge 80+, Firefox 113+, Safari 16.4+)។ លទ្ធផលជាអត្ថបទ base64 ដើម្បីអាចចម្លង និងបិទភ្ជាប់បានគ្រប់ទីកន្លែង។"
        )}
      </p>
    </ToolShell>
  );
}
