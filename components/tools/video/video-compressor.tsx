"use client";
import { useEffect, useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { ToolShell, Field, Select, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

function mimeType() {
  const candidates = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  for (const m of candidates) if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) return m;
  return "video/webm";
}

const fmtSize = (n: number) => (n < 1024 * 1024 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1024 / 1024).toFixed(2)} MB`);
const fmtDur = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export default function VideoCompressorTool() {
  const { text: t } = useLanguage();
  const [scale, setScale] = useToolState<number>("video-compressor:scale", 50);
  const [bitrate, setBitrate] = useToolState<number>("video-compressor:bitrate", 2000);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [srcDuration, setSrcDuration] = useState(0);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [resultDuration, setResultDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);

  function handleFile(f: File) {
    if (url) URL.revokeObjectURL(url);
    setFile(f);
    setUrl(URL.createObjectURL(f));
    setSrcDuration(0);
    setResultUrl(null);
    setResultSize(0);
    setError(null);
  }

  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current);
      if (url) URL.revokeObjectURL(url);
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  async function compress() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !file) return;
    setBusy(true);
    setError(null);
    setResultUrl(null);
    setResultSize(0);
    setProgress(0);
    try {
      const w = Math.max(2, Math.round((video.videoWidth * scale) / 100));
      const h = Math.max(2, Math.round((video.videoHeight * scale) / 100));
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no 2d context");

      const stream = canvas.captureStream(30);
      const mime = mimeType();
      const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: bitrate * 1000 });
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      const done = new Promise<Blob>((resolve) => {
        rec.onstop = () => resolve(new Blob(chunks, { type: mime }));
      });
      rec.start(500);

      const draw = () => {
        ctx.drawImage(video, 0, 0, w, h);
        rafRef.current = requestAnimationFrame(draw);
      };
      draw();

      video.currentTime = 0;
      video.muted = true;
      video.playsInline = true;
      const prog = setInterval(() => {
        if (video.duration) setProgress(Math.min(99, Math.round((video.currentTime / video.duration) * 100)));
      }, 200);

      await video.play();
      await new Promise<void>((resolve) => {
        video.addEventListener("ended", () => resolve(), { once: true });
        video.addEventListener("error", () => resolve(), { once: true });
      });

      clearInterval(prog);
      cancelAnimationFrame(rafRef.current);
      ctx.drawImage(video, 0, 0, w, h);
      rec.stop();
      const blob = await done;
      setResultDuration(video.duration || srcDuration);
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch {
      setError(
        t(
          "Could not re-encode this video in your browser — try a smaller scale or a lower bitrate.",
          "មិនអាចបង្ហាប់វីដេអូនេះក្នុងកម្មវិធីរុករករបស់អ្នកបានទេ — សាកល្បងទំហំតូចជាង ឬ bitrate ទាបជាង។"
        )
      );
    } finally {
      setBusy(false);
    }
  }

  const ratio = file && resultSize > 0 ? `${Math.round((resultSize / file.size) * 100)}%` : "";

  return (
    <ToolShell
      title="Video Compressor"
      khmerTitle="បង្រួមវីដេអូ"
      description="Load a video and re-encode it in your browser — choose a scale and bitrate, then compare original vs compressed size and duration. No upload."
      descriptionKm="ផ្ទុកវីដេអូ ហើយបង្ហាប់ឡើងវិញក្នុងកម្មវិធីរុករករបស់អ្នក — ជ្រើសរើសទំហំ និង bitrate រួចប្រៀបធៀបទំហំ និងរយៈពេលរវាងឯកសារដើម និងឯកសារបង្ហាប់។ គ្មានការផ្ទុកឡើយ។"
    >
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-8 text-center text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold)]">
        <span className="flex items-center gap-2">
          <Upload size={15} />
          {file ? file.name : t("Click to choose a video", "ចុចដើម្បីជ្រើសរើសវីដេអូ")}
        </span>
        <input type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </label>

      {url && (
        <>
          <video
            ref={videoRef}
            src={url}
            controls
            onLoadedMetadata={(e) => setSrcDuration(e.currentTarget.duration)}
            className="max-h-72 w-full rounded-md border border-[var(--ground-line)]"
          />

          <Row>
            <Field label={t("Scale", "ទំហំ")} hint={`${scale}%`}>
              <Select value={scale} onChange={(e) => setScale(Number(e.target.value))}>
                <option value={100}>100%</option>
                <option value={75}>75%</option>
                <option value={50}>50%</option>
                <option value={25}>25%</option>
              </Select>
            </Field>
            <Field label={t("Bitrate", "Bitrate")} hint={`${bitrate >= 1000 ? (bitrate / 1000).toFixed(1) : bitrate} Mbps`}>
              <input type="range" min={300} max={8000} step={100} value={bitrate} onChange={(e) => setBitrate(Number(e.target.value))} className="w-full" />
            </Field>
          </Row>

          <Button onClick={compress} disabled={busy || !srcDuration}>
            {busy ? `${t("Re-encoding…", "កំពុងបង្ហាប់…")} ${progress}%` : t("Compress video", "បង្រួមវីដេអូ")}
          </Button>

          {busy && (
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--ground-line)]">
              <div className="h-full rounded-full bg-[var(--gold)] transition-[width]" style={{ width: `${progress}%` }} />
            </div>
          )}

          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

          {resultUrl && resultSize > 0 && (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Original", "ដើម")}</div>
                  <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{fmtSize(file?.size ?? 0)}</div>
                  <div className="mt-1 text-xs text-[var(--ink-dim)]">
                    {t("Duration", "រយៈពេល")} {fmtDur(srcDuration)}
                  </div>
                </div>
                <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Compressed (WebM)", "បង្ហាប់ (WebM)")}</div>
                  <div className="mt-1 text-lg font-semibold text-[var(--gold)]">{fmtSize(resultSize)}</div>
                  <div className="mt-1 text-xs text-[var(--ink-dim)]">
                    {t("Duration", "រយៈពេល")} {fmtDur(resultDuration)} {ratio ? `· ${ratio}` : ""}
                  </div>
                </div>
              </div>

              <a
                href={resultUrl}
                download="compressed.webm"
                className="inline-flex items-center gap-1.5 rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-medium text-[#0a0c0d] hover:opacity-90"
              >
                <Download size={13} /> {t("Download WebM", "ទាញយក WebM")} — {fmtSize(resultSize)}
              </a>
            </>
          )}

          <p className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-xs leading-relaxed text-[var(--ink-dim)]">
            {t(
              "This is a browser WebM re-encode (VP8/VP9), not H.264 — the output plays in most modern browsers but may not suit every device. The picture track is captured via canvas and re-encoded with MediaRecorder; the audio track is not carried into this version.",
              "នេះជាការបង្ហាប់ឡើងវិញជា WebM ក្នុងកម្មវិធីរុករក (VP8/VP9) មិនមែន H.264 — លទ្ធផលចាក់បានក្នុងកម្មវិធីរុករកទំនើបភាគច្រើន ប៉ុន្តែប្រហែលជាមិនស័ក្តិសមរាល់ឧបករណ៍។ ផ្នែករូបភាពត្រូវបានចាប់តាម canvas ហើយបង្ហាប់ឡើងវិញដោយ MediaRecorder; ផ្នែកសំឡេងមិនត្រូវបានបញ្ចូលក្នុងកំណែនេះទេ។"
            )}
          </p>
        </>
      )}
    </ToolShell>
  );
}
