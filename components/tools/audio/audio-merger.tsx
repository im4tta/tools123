"use client";
import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Download, Trash2, Upload } from "lucide-react";
import { ToolShell, Field, Select, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const TARGET_RATE = 44100;

// PCM 16-bit WAV encoding (RIFF/WAVE container — public file format).
function encodeWav(buffer: AudioBuffer): Blob {
  const numCh = buffer.numberOfChannels;
  const len = buffer.length;
  const blockAlign = numCh * 2;
  const dataSize = len * blockAlign;
  const out = new ArrayBuffer(44 + dataSize);
  const view = new DataView(out);
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numCh, true);
  view.setUint32(24, TARGET_RATE, true);
  view.setUint32(28, TARGET_RATE * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);
  const chans = Array.from({ length: numCh }, (_, c) => buffer.getChannelData(c));
  let off = 44;
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < numCh; c++) {
      const s = Math.max(-1, Math.min(1, chans[c][i]));
      view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      off += 2;
    }
  }
  return new Blob([out], { type: "audio/wav" });
}

type LoadedFile = { id: number; name: string; buffer: AudioBuffer | null; error: string | null };

export default function AudioMergerTool() {
  const { text: t } = useLanguage();
  const [mode, setMode] = useToolState("audio-merger:mode", "merge");
  const [items, setItems] = useState<LoadedFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);

  function getCtx() {
    if (!ctxRef.current) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctxRef.current = new Ctx();
    }
    return ctxRef.current;
  }

  async function addFiles(list: FileList | null) {
    if (!list) return;
    setError(null);
    setResultUrl(null);
    const picked = Array.from(list).filter((f) => f.type.startsWith("audio/"));
    const added: LoadedFile[] = picked.map((f, idx) => ({
      id: Date.now() + Math.random() + idx,
      name: f.name,
      buffer: null,
      error: null,
    }));
    setItems((prev) => (mode === "merge" ? [...prev, ...added] : added));
    await Promise.all(
      added.map(async (item, idx) => {
        try {
          const buf = await getCtx().decodeAudioData(await picked[idx].arrayBuffer());
          setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, buffer: buf } : p)));
        } catch {
          setItems((prev) =>
            prev.map((p) =>
              p.id === item.id ? { ...p, error: t("Could not decode this file.", "មិនអាចបកស្រាយឯកសារនេះបានទេ។") } : p
            )
          );
        }
      })
    );
  }

  function move(i: number, dir: -1 | 1) {
    setItems((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    setResultUrl(null);
  }

  function removeAt(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
    setResultUrl(null);
  }

  async function render() {
    const ready = items.filter((i) => i.buffer);
    if (ready.length === 0) {
      setError(t("Add at least one decodable audio file.", "សូមបន្ថែមឯកសារសំឡេងយ៉ាងតិចមួយដែលអាចបកស្រាយបាន។"));
      return;
    }
    if (mode === "merge" && ready.length < 2) {
      setError(t("Merge needs at least two files — use Convert for a single file.", "ការបញ្ចូលត្រូវការឯកសារយ៉ាងតិចពីរ — ប្រើរបៀបបម្លែងសម្រាប់ឯកសារតែមួយ។"));
      return;
    }
    setBusy(true);
    setError(null);
    setResultUrl(null);
    try {
      const maxCh = Math.min(2, Math.max(...ready.map((i) => i.buffer!.numberOfChannels)));
      const totalLen = Math.max(1, Math.ceil(ready.reduce((sum, i) => sum + i.buffer!.duration * TARGET_RATE, 0)));
      const OfflineCtx = window.OfflineAudioContext || (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext;
      const offline = new OfflineCtx(maxCh, totalLen, TARGET_RATE);
      let offset = 0;
      for (const item of ready) {
        const src = offline.createBufferSource();
        src.buffer = item.buffer!;
        src.connect(offline.destination);
        src.start(offset);
        offset += item.buffer!.duration;
      }
      const rendered = await offline.startRendering();
      const blob = encodeWav(rendered);
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
    } catch {
      setError(t("Rendering failed — the files may be too large.", "ការបង្កើតបរាជ័យ — ឯកសារអាចធំពេក។"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell
      title="Audio Merger / Converter"
      khmerTitle="បញ្ចូលសំឡេង / បម្លែង"
      description="Add several audio files, reorder them, and merge them into one WAV (44.1 kHz PCM 16-bit), or convert a single file to WAV — all in your browser."
      descriptionKm="បន្ថែមឯកសារសំឡេងជាច្រើន តម្រៀប និងបញ្ចូលគ្នាទៅជាឯកសារ WAV តែមួយ (44.1 kHz PCM 16-bit) ឬបម្លែងឯកសារតែមួយទៅជា WAV — ទាំងអស់ក្នុងកម្មវិធីរុករករបស់អ្នក។"
    >
      <Row>
        <Field label={t("Mode", "របៀប")}>
          <Select
            value={mode}
            onChange={(e) => {
              setMode(e.target.value);
              setItems([]);
              setResultUrl(null);
              setError(null);
            }}
          >
            <option value="merge">{t("Merge multiple files", "បញ្ចូលឯកសារច្រើន")}</option>
            <option value="convert">{t("Convert one file to WAV", "បម្លែងឯកសារមួយទៅជា WAV")}</option>
          </Select>
        </Field>
        <Field label={t("Output format", "ទម្រង់ទិន្នផល")}>
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink)]">
            {t("WAV · 44.1 kHz · PCM 16-bit", "WAV · 44.1 kHz · PCM 16-bit")}
          </div>
        </Field>
      </Row>

      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-8 text-center text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold)]">
        <span className="flex items-center gap-2">
          <Upload size={15} />
          {t(
            mode === "merge" ? "Choose audio files (multiple)" : "Choose an audio file",
            mode === "merge" ? "ជ្រើសរើសឯកសារសំឡេង (ច្រើន)" : "ជ្រើសរើសឯកសារសំឡេង"
          )}
        </span>
        <input type="file" accept="audio/*" multiple={mode === "merge"} className="hidden" onChange={(e) => addFiles(e.target.files)} />
      </label>

      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[var(--ink)]">{item.name}</div>
                <div className="text-xs text-[var(--ink-dim)]">
                  {item.error ? (
                    <span className="text-[var(--danger)]">{item.error}</span>
                  ) : item.buffer ? (
                    `${item.buffer.duration.toFixed(1)}s`
                  ) : (
                    t("Decoding…", "កំពុងបកស្រាយ…")
                  )}
                </div>
              </div>
              {mode === "merge" && (
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="rounded border border-[var(--ground-line)] p-1 text-[var(--ink-dim)] disabled:opacity-30"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === items.length - 1}
                    className="rounded border border-[var(--ground-line)] p-1 text-[var(--ink-dim)] disabled:opacity-30"
                  >
                    <ArrowDown size={13} />
                  </button>
                  <button type="button" onClick={() => removeAt(i)} className="rounded border border-[var(--ground-line)] p-1 text-[var(--danger)]">
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          ))}
          <p className="text-xs text-[var(--ink-dim)]">{t(`${items.length} file(s)`, `${items.length} ឯកសារ`)}</p>
        </div>
      )}

      <Button onClick={render} disabled={busy || items.some((i) => !i.buffer)}>
        {busy ? t("Rendering…", "កំពុងបង្កើត…") : mode === "merge" ? t("Merge to WAV", "បញ្ចូលទៅជា WAV") : t("Convert to WAV", "បម្លែងទៅជា WAV")}
      </Button>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      {resultUrl && (
        <div className="space-y-2">
          <audio controls src={resultUrl} className="w-full" />
          <a
            href={resultUrl}
            download="merged.wav"
            className="inline-flex items-center gap-1.5 rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-medium text-[#0a0c0d] hover:opacity-90"
          >
            <Download size={13} /> {t("Download WAV", "ទាញយក WAV")} — {(resultSize / 1024 / 1024).toFixed(2)} MB
          </a>
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-[var(--ink-dim)]">
        {t("All processing happens locally in your browser — nothing is uploaded. Output is always PCM 16-bit WAV at 44.1 kHz.", "ការកែច្នៃទាំងអស់ធ្វើក្នុងកម្មវិធីរុករករបស់អ្នក — គ្មានអ្វីត្រូវបានផ្ទុកឡើយ។ លទ្ធផលតែងតែជា WAV PCM 16-bit នៅ 44.1 kHz។")}
      </p>
    </ToolShell>
  );
}
