"use client";
import { useEffect, useRef, useState } from "react";
import { Circle, Download, Square } from "lucide-react";
import { ToolShell } from "@/components/ui/Shell";
import { useLanguage } from "@/components/LanguageProvider";

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export default function ScreenRecorder() {
  const { text: t } = useLanguage();
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [url, setUrl] = useState<string | null>(null);
  const [sizeMb, setSizeMb] = useState(0);
  const [withMic, setWithMic] = useState(true);
  const [error, setError] = useState("");
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    recRef.current?.stream.getTracks().forEach((tr) => tr.stop());
  }, []);

  async function start() {
    setError("");
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      if (withMic) {
        try {
          const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
          mic.getAudioTracks().forEach((tr) => display.addTrack(tr));
        } catch {
          /* mic denied — record screen only */
        }
      }
      const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
      const rec = new MediaRecorder(display, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        setUrl(URL.createObjectURL(blob));
        setSizeMb(blob.size / 1048576);
        display.getTracks().forEach((tr) => tr.stop());
      };
      display.getVideoTracks()[0]?.addEventListener("ended", () => {
        if (recRef.current?.state === "recording") stopRec();
      });
      rec.start(250);
      recRef.current = rec;
      setRecording(true);
      setSeconds(0);
      setUrl(null);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      /* user cancelled the picker */
    }
  }

  function stopRec() {
    recRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function download() {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `screen-recording-${Date.now()}.webm`;
    a.click();
  }

  return (
    <ToolShell
      title="Screen Recorder"
      khmerTitle="ការថតអេក្រង់"
      description="Record your screen or a browser tab to a WebM video — with optional microphone narration."
      descriptionKm="ថតអេក្រង់ ឬផ្ទាំងកម្មវិធីរុករកទៅជា WebM — ជាមួយសំឡេងមីក្រូហ្វូនបើចង់បាន។"
    >
      <div className="space-y-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--ink-dim)]">
          <input type="checkbox" checked={withMic} onChange={(e) => setWithMic(e.target.checked)} className="h-4 w-4 accent-[var(--gold)]" />
          {t("Include microphone narration", "រួមបញ្ចូលសំឡេងមីក្រូហ្វូន")}
        </label>

        <div className="flex flex-col items-center gap-4 rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-8">
          {recording ? (
            <>
              <div className="flex items-center gap-3 font-mono-ui text-4xl font-semibold tabular-nums text-[var(--danger)]">
                <span className="h-3 w-3 animate-pulse rounded-full bg-[var(--danger)]" />
                {fmtTime(seconds)}
              </div>
              <button type="button" onClick={stopRec} className="flex items-center justify-center gap-2 rounded-xl bg-[var(--danger)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90">
                <Square size={15} />{t("Stop recording", "បញ្ឈប់ការថត")}
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={start} className="flex items-center justify-center gap-2 rounded-xl bg-[var(--gold)] px-6 py-3 text-sm font-semibold text-[#0a0c0d] transition hover:bg-[var(--gold-dim)]">
                <Circle size={15} fill="currentColor" />{t("Start recording", "ចាប់ផ្តើមថត")}
              </button>
              <p className="text-xs text-[var(--ink-faint)]">{t("Choose a screen, window, or tab when prompted.", "ជ្រើសរើសអេក្រង់ វីនដូ ឬផ្ទាំងពេលត្រូវបានសួរ។")}</p>
            </>
          )}
        </div>

        {url && !recording && (
          <div className="space-y-3">
            <video src={url} controls className="w-full rounded-xl border border-[var(--ground-line)] bg-black" />
            <div className="text-xs text-[var(--ink-faint)]">WebM · {sizeMb.toFixed(1)} MB</div>
            <a href={url} download={`screen-recording-${Date.now()}.webm`} onClick={(e) => { e.preventDefault(); download(); }} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-[#0a0c0d] transition hover:bg-[var(--gold-dim)]">
              <Download size={16} />{t("Download WebM", "ទាញយក WebM")}
            </a>
          </div>
        )}

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <p className="text-xs text-[var(--ink-faint)]">{t("Recordings stay on your device until you download them.", "ការថតនៅក្នុងឧបករណ៍អ្នករហូតដល់អ្នកទាញយក។")}</p>
      </div>
    </ToolShell>
  );
}