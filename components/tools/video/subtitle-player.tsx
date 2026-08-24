"use client";
import { useMemo, useState } from "react";
import { Pause, Play, Upload, Minus, Plus } from "lucide-react";
import { ToolShell, Field, TextArea } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type Cue = { start: number; end: number; text: string };

function parseSrt(raw: string): Cue[] {
  const blocks = raw.replace(/\r/g, "").split(/\n\s*\n/);
  const cues: Cue[] = [];
  for (const block of blocks) {
    const lines = block.split("\n").filter(Boolean);
    if (!lines.length) continue;
    // Find the time line (contains "-->").
    const timeIdx = lines.findIndex((l) => l.includes("-->"));
    if (timeIdx < 0) continue;
    const [startStr, endStr] = lines[timeIdx].split("-->");
    const cue = { start: srtTime(startStr), end: srtTime(endStr), text: lines.slice(timeIdx + 1).join("\n").trim() };
    if (!isNaN(cue.start) && !isNaN(cue.end) && cue.text) cues.push(cue);
  }
  return cues.sort((a, b) => a.start - b.start);
}
function srtTime(s: string): number {
  const parts = (s.trim()).split(",")[0].split(":");
  if (parts.length === 3) return Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number(parts[2]);
  if (parts.length === 2) return Number(parts[0]) * 60 + Number(parts[1]);
  return Number(parts[0]) || 0;
}
function fmt(s: number): string {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60); const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

export default function SubtitlePlayer() {
  const { text: t } = useLanguage();
  const [video, setVideo] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [srt, setSrt] = useToolState("srt-player:srt", "");
  const [customFile, setCustomFile] = useState(false);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [fontSize, setFontSize] = useToolState("srt-player:size", 24);
  const [parsed, setParsed] = useState(false);

  const cues = useMemo(() => parseSrt(srt), [srt]);

  const activeCue = useMemo(() => cues.find((c) => c.start <= current && current < c.end), [cues, current]);

  function onVideo(f: File | null) {
    if (!f) return;
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideo(f);
    setVideoUrl(URL.createObjectURL(f));
    setCurrent(0);
  }

  function loadSrtFile(f: File | null) {
    if (!f) return;
    const r = new FileReader();
    r.onload = () => { setSrt(String(r.result ?? "")); setParsed(true); };
    r.readAsText(f);
  }

  return (
    <ToolShell
      title="Subtitle Player"
      khmerTitle="អ្នកចាក់អក្សររត់ពីក្រោម"
      description="Play a video with .srt subtitles synced to playback — paste SRT text or load a file and read the active cue in real time."
      descriptionKm="ចាក់វីដេអូជាមួយអក្សររត់ពីក្រោម .srt ដែលស្របតាមពេលចាក់ — បិទភ្ជាប់អត្ថបទ SRT ឬផ្ទុកឯកសារ រួចអានអត្ថបទបច្ចុប្បន្នតាមពេលវេលា។"
    >
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-7 text-center text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)]">
        <span>{video ? video.name : t("Choose a video file", "ជ្រើសរើសឯកសារវីដេអូ")}</span>
        <input type="file" accept="video/*" className="hidden" onChange={(e) => onVideo(e.target.files?.[0] ?? null)} />
      </label>

      {videoUrl && video && (
        <div className="relative overflow-hidden rounded-lg border border-[var(--ground-line)] bg-black">
          <video
            src={videoUrl}
            controls
            className="mx-auto block max-h-[440px] w-full"
            onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
          {activeCue && (
            <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center px-4">
              <div className="rounded-md bg-black/75 px-3 py-1.5 text-center font-khmer text-white shadow" style={{ fontSize }}>
                {activeCue.text.split("\n").map((l, i) => <div key={i}>{l}</div>)}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-[var(--ink-dim)]">
          <button
            type="button"
            onClick={() => { if (playing && videoUrl) { const v = document.querySelector(`video[src="${videoUrl}"]`) as HTMLVideoElement | null; v?.pause(); } }}
            className="flex items-center gap-1 rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-medium text-[#0a0c0d]"
          >
            {playing ? <Pause size={13} /> : <Play size={13} />} {playing ? t("Playing", "កំពុងចាក់") : t("Use controls", "ប្រើប៊ូតុងគ្រប់គ្រង")}
          </button>
          <span className="font-mono-ui text-xs">{fmt(current)} / {fmt(duration)}</span>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setFontSize((s) => Math.max(12, s - 2))} className="flex items-center gap-1 rounded-md border border-[var(--ground-line)] px-2 py-1 text-xs text-[var(--ink-dim)]"><Minus size={13} /></button>
        <span className="text-xs text-[var(--ink-faint)]">{t("Subtitle size", "ទំហំអក្សររត់")} {fontSize}px</span>
        <button type="button" onClick={() => setFontSize((s) => Math.min(54, s + 2))} className="flex items-center gap-1 rounded-md border border-[var(--ground-line)] px-2 py-1 text-xs text-[var(--ink-dim)]"><Plus size={13} /></button>
      </div>

      <Field label={t("Subtitle source", "ប្រភពអក្សររត់")}>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={() => setCustomFile(false)} className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${!customFile ? "bg-[var(--gold)] text-[#0a0c0d]" : "bg-[var(--ground-raised)] text-[var(--ink-dim)]"}`}>{t("Paste SRT text", "បិទភ្ជាប់អត្ថបទ SRT")}</button>
          <button type="button" onClick={() => setCustomFile(true)} className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${customFile ? "bg-[var(--gold)] text-[#0a0c0d]" : "bg-[var(--ground-raised)] text-[var(--ink-dim)]"}`}>{t("Load .srt file", "ផ្ទុកឯកសារ .srt")}</button>
        </div>
      </Field>

      {customFile ? (
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-6 text-center text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold-dim)]">
          <Upload size={15} /> {t("Choose a .srt file", "ជ្រើសរើសឯកសារ .srt")}
          <input type="file" accept=".srt,text/plain" className="hidden" onChange={(e) => loadSrtFile(e.target.files?.[0] ?? null)} />
        </label>
      ) : (
        <Field label={t("SRT content", "ខ្លឹមសារ SRT")}>
          <TextArea rows={6} value={srt} onChange={(e) => { setSrt(e.target.value); setParsed(true); }} placeholder={"1\n00:00:01,000 --> 00:00:04,000\nសួស្តី"} className="font-mono-ui" />
        </Field>
      )}

      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm">
        <p className="text-xs uppercase tracking-wide text-[var(--ink-dim)]">{t("Active cue", "អត្ថបទបច្ចុប្បន្ន")}</p>
        <p className="font-khmer leading-relaxed text-[var(--ink)]">{activeCue?.text ?? (!parsed && !srt ? t("Add subtitles to see the active cue.", "បន្ថែមអក្សររត់ដើម្បីមើលអត្ថបទបច្ចុប្បន្ន។") : "")}</p>
      </div>

      <p className="text-[11px] leading-relaxed text-[var(--ink-faint)]">
        {t("Only your video and SRT are used, locally in the browser — nothing is uploaded. SRT timestamps are parsed to sync the overlay to playback.", "មានតែវីដេអូ និង SRT របស់អ្នកប៉ុណ្ណោះដែលត្រូវបានប្រើ ក្នុងកម្មវិធីរុករក — គ្មានអ្វីត្រូវបានផ្ទុកឡើយ។ ពេលវេលា SRT ត្រូវបានញែកដើម្បីសម្រួលអត្ថបទឱ្យស្របនឹងការចាក់។")}
      </p>
      {parsed && <p className="text-xs text-[var(--ink-faint)]">{t(`${cues.length} cues parsed`, `បានញែក ${cues.length} អត្ថបទ`)}</p>}
    </ToolShell>
  );
}
