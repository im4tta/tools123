"use client";
import { useState } from "react";
import { Download } from "lucide-react";
import { ToolShell } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useLanguage } from "@/components/LanguageProvider";

function encodeWav(buffer: AudioBuffer): Blob {
  const numCh = buffer.numberOfChannels;
  const len = buffer.length;
  const sampleRate = buffer.sampleRate;
  const bytesPerSample = 2;
  const blockAlign = numCh * bytesPerSample;
  const dataSize = len * blockAlign;
  const arrBuf = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrBuf);
  function writeStr(offset: number, s: string) { for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i)); }
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numCh, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, bytesPerSample * 8, true);
  view.setUint16(34, numCh, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) {
    const s = Math.max(-1, Math.min(1, data[i]));
    view.setInt16(44 + i * 2, s * 0x7fff, true);
  }
  return new Blob([arrBuf], { type: "audio/wav" });
}

export default function VideoToAudioTool() {
  const { text: t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);

  // Decode the file's audio into an AudioBuffer via OfflineAudioContext.
  async function extract() {
    if (!file) return;
    setBusy(true);
    setError("");
    setResultUrl(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const OfflineCtx = window.OfflineAudioContext || (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext;
      // Use a 2-channel offline context sized generously; the file buffer decodes.
      const tmp = new OfflineCtx(2, 1, 48000);
      const decoded = await tmp.decodeAudioData(arrayBuffer);
      const offline = new OfflineCtx(decoded.numberOfChannels, decoded.length, decoded.sampleRate);
      const src = offline.createBufferSource();
      src.buffer = decoded;
      src.connect(offline.destination);
      src.start(0);
      const rendered = await offline.startRendering();
      setDuration(rendered.duration);
      const blob = encodeWav(rendered);
      setResultUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("Could not extract audio from this file.", "មិនអាចទាញយកសំឡេងពីឯកសារនេះបានទេ។"));
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `${(file?.name || "audio").replace(/\.[^.]+$/, "")}.wav`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <ToolShell
      title="Video to Audio"
      khmerTitle="ទាញសំឡេងពីវីដេអូ"
      description="Extract the audio track from a video file and download it as a WAV — entirely in your browser, no upload."
      descriptionKm="ទាញយកសំឡេងពីឯកសារវីដេអូ ហើយនាំចេញជា WAV — ដំណើរការទាំងស្រុងក្នុងកម្មវិធីរុករក គ្មានការបញ្ចូលឡើយ។"
    >
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-8 text-center text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)]">
        <span>{file ? file.name : t("Click to choose a video file", "ចុចដើម្បីជ្រើសរើសឯកសារវីដេអូ")}</span>
        <input type="file" accept="video/*,audio/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0] ?? null; if (fileUrl) URL.revokeObjectURL(fileUrl); setFile(f); setFileUrl(f ? URL.createObjectURL(f) : null); setResultUrl(null); setError(""); setDuration(0); }} />
      </label>

      {fileUrl && file && (
        <video src={fileUrl} controls className="max-h-72 w-full rounded-md border border-[var(--ground-line)] bg-black" />
      )}

      {duration > 0 && (
        <p className="text-xs text-[var(--ink-dim)]">{t("Detected audio", "សំឡេងដែលបានរកឃើញ")}: {duration.toFixed(1)}s</p>
      )}

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      <div className="flex flex-wrap items-end gap-3">
        <Button onClick={extract} disabled={!file || busy}>
          {busy ? t("Extracting…", "កំពុងទាញ…") : t("Extract audio", "ទាញសំឡេង")}
        </Button>
        {resultUrl && (
          <Button onClick={download}>
            <Download size={15} className="mr-1 inline" />
            {t("Download", "ទាញយក")} .wav
          </Button>
        )}
      </div>

      <p className="text-[11px] leading-relaxed text-[var(--ink-faint)]">
        {t("The video's audio track is decoded and rendered to a WAV file locally. Files never leave your browser.", "បទសំឡេងរបស់វីដេអូត្រូវបានដោះស្រាយ និងបង្ហាញជា WAV ក្នុងម៉ាស៊ីន។ ឯកសារមិនចាកចេញពីកម្មវិធីរុករករបស់អ្នកទេ។")}
      </p>
    </ToolShell>
  );
}
