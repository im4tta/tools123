"use client";
import { useEffect, useRef, useState } from "react";
import { Mic, Square, Play, Trash2 } from "lucide-react";
import { ToolShell } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useLanguage } from "@/components/LanguageProvider";

export default function VoiceRecorder() {
  const { text: t } = useLanguage();
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
      };
      mediaRef.current = rec;
      rec.start();
      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch {
      // permission denied
    }
  };

  const stop = () => {
    mediaRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setRecording(false);
  };

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const mmss = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`;

  return (
    <ToolShell
      title="Voice Recorder"
      khmerTitle="ថតសម្លេង"
      description="Record audio straight from your microphone — no upload needed, it stays on your device."
      descriptionKm="ថតសម្លេងផ្ទាល់ពីមីក្រូហ្វូនរបស់អ្នក — ដោយមិនបាច់ផ្ទុកឡើង ស្នាក់នៅលើឧបករណ៍របស់អ្នក។"
    >
      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-8 text-center">
        {recording && (
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--danger)]/10 px-3 py-1 text-xs font-medium text-[var(--danger)]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--danger)]" />
            {t("Recording", "កំពុងថត")}
          </div>
        )}
        <div className="font-display text-6xl font-semibold text-[var(--ink)]">{mmss}</div>
        <div className="mt-2 text-sm text-[var(--ink-dim)]">
          {t("Everything is recorded locally in your browser.", "អ្វីៗត្រូវបានថតក្នុងកម្មវិធីរុករករបស់អ្នកប៉ុណ្ណោះ។")}
        </div>
      </div>

      <div className="flex justify-center gap-3">
        {recording ? (
          <Button type="button" onClick={stop} className="w-40">
            <Square size={15} className="mr-1 inline" />
            {t("Stop", "បញ្ឈប់")}
          </Button>
        ) : (
          <Button type="button" onClick={start} className="w-40">
            <Mic size={15} className="mr-1 inline" />
            {t("Record", "ថត")}
          </Button>
        )}
      </div>

      {audioUrl && (
        <>
          <audio controls src={audioUrl} className="w-full" />
          <div className="flex gap-2">
            <a href={audioUrl} download="recording.webm" className="flex-1 rounded-md bg-[var(--gold)] px-4 py-2 text-center text-sm font-medium text-[#0a0c0d] transition hover:bg-[var(--gold-dim)]">
              <Play size={14} className="mr-1 inline" />
              {t("Download", "ទាញយក")}
            </a>
            <Button type="button" onClick={() => setAudioUrl(null)} className="flex-1">
              <Trash2 size={14} className="mr-1 inline" />
              {t("Discard", "លុបចោល")}
            </Button>
          </div>
        </>
      )}
    </ToolShell>
  );
}