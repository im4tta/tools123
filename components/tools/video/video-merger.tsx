"use client";
import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { ToolShell } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useLanguage } from "@/components/LanguageProvider";

function mimeType() {
  const c = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  for (const m of c) if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) return m;
  return "video/webm";
}

export default function VideoMergerTool() {
  const { text: t } = useLanguage();
  const [files, setFiles] = useState<File[]>([]);
  const [urls, setUrls] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const picked = Array.from(list).filter((f) => f.type.startsWith("video/"));
    setFiles((prev) => [...prev, ...picked]);
    setUrls((prev) => [...prev, ...picked.map((f) => URL.createObjectURL(f))]);
    setResultUrl(null);
    setError("");
  }

  function removeAt(i: number) {
    URL.revokeObjectURL(urls[i]);
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
    setUrls((prev) => prev.filter((_, idx) => idx !== i));
  }

  useEffect(() => () => { cancelAnimationFrame(rafRef.current); urls.forEach((u) => URL.revokeObjectURL(u)); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Play each file in sequence into a hidden canvas, recording with MediaRecorder.
  async function merge() {
    if (files.length < 2) { setError(t("Select at least two videos to merge.", "ជ្រើសរើសវីដេអូយ៉ាងតិចពីរដើម្បីបញ្ចូលគ្នា។")); return; }
    setBusy(true);
    setError("");
    setResultUrl(null);
    setProgress(0);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) { setBusy(false); return; }
    const stream = canvas.captureStream(30);
    const rec = new MediaRecorder(stream, { mimeType: mimeType(), videoBitsPerSecond: 5_000_000 });
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    const done = new Promise<Blob>((resolve) => {
      rec.onstop = () => resolve(new Blob(chunks, { type: mimeType() }));
    });
    rec.start();

    let total = 0;
    let elapsed = 0;
    try {
      // Total duration (best-effort) for progress.
      for (const u of urls) {
        const d = await durationOf(u);
        total += d;
      }
      video.muted = true;
      for (const u of urls) {
        await playInto(video, u, canvas);
        // Draw the last frame so there's a persistent image while seeking.
        elapsed += (await durationOf(u));
        setProgress(Math.min(100, Math.round((elapsed / (total || 1)) * 100)));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("Merge failed.", "ការបញ្ចូលបរាជ័យ។"));
    } finally {
      video.pause();
      rec.stop();
      cancelAnimationFrame(rafRef.current);
      const blob = await done;
      setResultUrl(URL.createObjectURL(blob));
      setBusy(false);
    }
  }

  function durationOf(url: string): Promise<number> {
    return new Promise((resolve) => {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.src = url;
      v.onloadedmetadata = () => resolve(v.duration || 0);
      v.onerror = () => resolve(0);
    });
  }

  // Play a video from start to end, drawing frames to the canvas.
  function playInto(video: HTMLVideoElement, url: string, canvas: HTMLCanvasElement): Promise<void> {
    return new Promise((resolve, reject) => {
      const ctx = canvas.getContext("2d")!;
      video.src = url;
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth || canvas.width;
        canvas.height = video.videoHeight || canvas.height;
      };
      const drawFrame = () => {
        if (video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      };
      video.ontimeupdate = drawFrame;
      video.onerror = () => reject(new Error(t("Could not read one of the videos.", "មិនអាចអានវីដេអូមួយណាមួយបានទេ។")));
      video.onended = () => { drawFrame(); resolve(); };
      void video.play();
    });
  }

  function download() {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = "merged-video.webm";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <ToolShell
      title="Video Merger"
      khmerTitle="បញ្ចូលវីដេអូ"
      description="Combine multiple video files into a single video — re-encoded client-side with MediaRecorder, no upload."
      descriptionKm="បញ្ចូលឯកសារវីដេអូជាច្រើនទៅជាវីដេអូតែមួយ — ដោយប្រើ MediaRecorder ក្នុងកម្មវិធីរុករក គ្មានការបញ្ចូលឡើយ។"
    >
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-8 text-center text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)]">
        <span>{t("Choose video files (Ctrl/⌘+click for multiple)", "ជ្រើសរើសឯកសារវីដេអូ (ចុច Ctrl/⌘ + ចុចសម្រាប់ច្រើន)")}</span>
        <input type="file" accept="video/*" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
      </label>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between gap-3 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm">
              <span className="truncate text-[var(--ink)]">{i + 1}. {f.name}</span>
              <button type="button" onClick={() => removeAt(i)} className="shrink-0 text-xs text-red-600 hover:underline">{t("Remove", "ដកចេញ")}</button>
            </div>
          ))}
          <p className="text-xs text-[var(--ink-faint)]">{t(`${files.length} file(s) selected`, `${files.length} ឯកសារដែលបានជ្រើសរើស`)}</p>
        </div>
      )}

      <div className="hidden">
        <video ref={videoRef} muted playsInline />
        <canvas ref={canvasRef} width={640} height={360} />
      </div>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      <div className="flex flex-wrap items-end gap-3">
        <Button onClick={merge} disabled={busy || files.length < 2}>
          {busy ? `${t("Merging…", "កំពុងបញ្ចូល…")} ${progress}%` : t("Merge videos", "បញ្ចូលវីដេអូ")}
        </Button>
        {resultUrl && (
          <Button onClick={download}>
            <Download size={15} className="mr-1 inline" />
            {t("Download", "ទាញយក")} .webm
          </Button>
        )}
      </div>

      {busy && <div className="h-1.5 overflow-hidden rounded-full bg-[var(--ground)]"><div className="h-full rounded-full bg-[var(--gold)] transition-[width]" style={{ width: `${progress}%` }} /></div>}

      <p className="text-[11px] leading-relaxed text-[var(--ink-faint)]">
        {t("Videos are played in sequence and re-encoded into a single WebM file in your browser. Output quality depends on the source and your browser.", "វីដេអូត្រូវបានចាក់តាមលំដាប់ និងបំលែងឡើងវិញទៅជាឯកសារ WebM តែមួយក្នុងកម្មវិធីរុករក។ គុណភាពអាស្រ័យលើឯកសារដើម និងកម្មវិធីរុករករបស់អ្នក។")}
      </p>
    </ToolShell>
  );
}
