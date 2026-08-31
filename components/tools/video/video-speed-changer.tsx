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

const fmtSize = (n: number) =>
  n < 1024 * 1024 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1024 / 1024).toFixed(2)} MB`;
const fmtDur = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

const SPEEDS = ["0.25", "0.5", "0.75", "1", "1.5", "2", "3", "4"];

export default function VideoSpeedChanger() {
  const { text: t } = useLanguage();
  const [speed, setSpeed] = useToolState("video-speed:speed", "2");
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
    setResultDuration(0);
    setError(null);
  }

  // Live preview: the <video> element plays at the chosen speed.
  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = Number(speed);
  }, [speed, url]);

  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current);
      if (url) URL.revokeObjectURL(url);
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  async function convert() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !file) return;
    const sp = Math.max(0.25, Math.min(4, Number(speed) || 1));
    setBusy(true);
    setError(null);
    setResultUrl(null);
    setResultSize(0);
    setResultDuration(0);
    setProgress(0);
    try {
      const w = video.videoWidth;
      const h = video.videoHeight;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no 2d context");

      const stream = canvas.captureStream(30);
      const rec = new MediaRecorder(stream, { mimeType: mimeType(), videoBitsPerSecond: 8_000_000 });
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      const done = new Promise<Blob>((resolve) => {
        rec.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
      });
      rec.start(500);

      const draw = () => {
        ctx.drawImage(video, 0, 0, w, h);
        rafRef.current = requestAnimationFrame(draw);
      };
      draw();

      video.playbackRate = sp;
      video.currentTime = 0;
      video.muted = true;
      video.playsInline = true;
      const total = (video.duration || srcDuration) / sp;
      const prog = setInterval(() => {
        if (total) setProgress(Math.min(99, Math.round((video.currentTime / total) * 100)));
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
      setResultDuration(total);
      setResultSize(blob.size);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
    } catch {
      setError(
        t(
          "Could not re-encode this video in your browser — try a different speed or a shorter clip.",
          "មិនអាចបង្ហាប់វីដេអូនេះក្នុងកម្មវិធីរុករករបស់អ្នកបានទេ — សាកល្បងល្បឿនផ្សេង ឬវីដេអូខ្លីជាង។"
        )
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell
      title="Video Speed Changer"
      khmerTitle="ប្តូរល្បឿនវីដេអូ"
      description="Load a video, choose a playback speed from 0.25× to 4×, preview it, and re-encode a WebM copy in your browser. No upload."
      descriptionKm="ផ្ទុកវីដេអូ ជ្រើសរើសល្បឿនចាក់ពី 0.25× ដល់ 4× មើលជាមុន រួចបង្ហាប់ឡើងវិញជា WebM ក្នុងកម្មវិធីរុករករបស់អ្នក។ គ្មានការផ្ទុកឡើងឡើយ។"
    >
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-8 text-center text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold)]">
        <span className="flex items-center gap-2">
          <Upload size={15} />
          {file ? file.name : t("Click to choose a video", "ចុចដើម្បីជ្រើសរើសវីដេអូ")}
        </span>
        <input
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
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
            <Field
              label={t("Playback speed", "ល្បឿនចាក់")}
              hint={`${speed}× · ${t("preview plays at this speed", "មើលជាមុនចាក់ក្នុងល្បឿននេះ")}`}
            >
              <Select value={speed} onChange={(e) => setSpeed(e.target.value)}>
                {SPEEDS.map((s) => (
                  <option key={s} value={s}>
                    {s}×
                  </option>
                ))}
              </Select>
            </Field>
          </Row>

          <Button onClick={() => void convert()} disabled={busy || !srcDuration}>
            {busy ? `${t("Re-encoding…", "កំពុងបង្ហាប់…")} ${progress}%` : t("Change speed & export WebM", "ប្តូរល្បឿន និងនាំចេញ WebM")}
          </Button>

          {busy && (
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--ground-line)]">
              <div
                className="h-full rounded-full bg-[var(--gold)] transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

          {resultUrl && resultSize > 0 && (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
                    {t("Original", "ដើម")}
                  </div>
                  <div className="mt-1 text-lg font-semibold text-[var(--ink)]">{fmtSize(file?.size ?? 0)}</div>
                  <div className="mt-1 text-xs text-[var(--ink-dim)]">
                    {t("Duration", "រយៈពេល")} {fmtDur(srcDuration)}
                  </div>
                </div>
                <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
                    {t("Speed-changed (WebM)", "ប្តូរល្បឿន (WebM)")}
                  </div>
                  <div className="mt-1 text-lg font-semibold text-[var(--gold)]">{fmtSize(resultSize)}</div>
                  <div className="mt-1 text-xs text-[var(--ink-dim)]">
                    {t("Duration", "រយៈពេល")} {fmtDur(resultDuration)} · {speed}×
                  </div>
                </div>
              </div>

              <a
                href={resultUrl}
                download="speed-changed.webm"
                className="inline-flex items-center gap-1.5 rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-medium text-[#0a0c0d] hover:opacity-90"
              >
                <Download size={13} />
                {t("Download WebM", "ទាញយក WebM")} — {fmtSize(resultSize)}
              </a>
            </>
          )}

          <p className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-xs leading-relaxed text-[var(--ink-dim)]">
            {t(
              "This is a browser WebM re-encode (VP8/VP9): frames are captured from the video playing at the chosen speed and re-encoded with MediaRecorder. The audio track is not carried into the output.",
              "នេះជាការបង្ហាប់ឡើងវិញជា WebM ក្នុងកម្មវិធីរុករក (VP8/VP9): ស៊ុមត្រូវបានចាប់ពីវីដេអូដែលកំពុងចាក់ក្នុងល្បឿនដែលបានជ្រើសរើស រួចបង្ហាប់ឡើងវិញដោយ MediaRecorder។ ផ្នែកសំឡេងមិនត្រូវបានបញ្ចូលក្នុងលទ្ធផលទេ។"
            )}
          </p>
        </>
      )}
    </ToolShell>
  );
}
