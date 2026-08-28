"use client";
import { useMemo, useState } from "react";
import { Download, Plus, Trash2, Upload } from "lucide-react";
import { ToolShell, Field, Select, TextArea, TextInput, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type Cue = { id: number; startStr: string; endStr: string; text: string };

// Accepts SRT (comma) and VTT (dot) millisecond timestamps, with optional hours.
function parseTime(s: string): number | null {
  const m = s.trim().match(/^(?:(\d+):)?(\d{1,2}):(\d{2})[.,](\d{1,3})$/);
  if (!m) return null;
  const h = m[1] ? Number(m[1]) : 0;
  const min = Number(m[2]);
  const sec = Number(m[3]);
  if (min > 59 || sec > 59) return null;
  return h * 3600 + min * 60 + sec + Number(m[4].padEnd(3, "0")) / 1000;
}

function fmtTime(s: number, sep: "," | "."): string {
  const safe = Math.max(0, s);
  const ms = Math.round((safe % 1) * 1000);
  const total = Math.floor(safe);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  const pad = (n: number, l = 2) => String(n).padStart(l, "0");
  return `${pad(h)}:${pad(m)}:${pad(sec)}${sep}${pad(ms, 3)}`;
}

// Robust SRT/VTT parser: skips WEBVTT headers, NOTE/STYLE/REGION blocks and
// VTT cue settings, and keeps multi-line cue text.
function parseSubs(raw: string): { cues: Cue[]; skipped: number } {
  const lines = raw.replace(/\r/g, "").split("\n");
  const cues: Cue[] = [];
  let skipped = 0;
  let id = 1;
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (
      !line ||
      line === "WEBVTT" ||
      line.startsWith("NOTE") ||
      line.startsWith("STYLE") ||
      line.startsWith("REGION") ||
      line.startsWith("X-TIMESTAMP-MAP")
    ) {
      i++;
      continue;
    }
    const timeMatch = line.match(/^(\S+)\s*-->\s*(\S+)/);
    if (!timeMatch) {
      i++;
      continue;
    }
    const start = parseTime(timeMatch[1]);
    const end = parseTime(timeMatch[2]);
    i++;
    const cueLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !lines[i].includes("-->")) {
      cueLines.push(lines[i]);
      i++;
    }
    if (start !== null && end !== null) {
      cues.push({ id: id++, startStr: fmtTime(start, ","), endStr: fmtTime(end, ","), text: cueLines.join("\n").trim() });
    } else {
      skipped++;
    }
  }
  return { cues, skipped };
}

export default function SubtitleEditorTool() {
  const { text: t } = useLanguage();
  const [raw, setRaw] = useToolState("subtitle-editor:raw", "");
  const [cues, setCues] = useToolState<Cue[]>("subtitle-editor:cues", []);
  const [format, setFormat] = useToolState("subtitle-editor:format", "srt");
  const [offsetInput, setOffsetInput] = useToolState("subtitle-editor:offset", "0");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const stats = useMemo(() => {
    if (!raw.trim()) return null;
    const parsed = parseSubs(raw);
    return { count: parsed.cues.length, skipped: parsed.skipped };
  }, [raw]);

  function applyRaw(value: string) {
    setRaw(value);
    setError(null);
    setNotice(null);
    const parsed = parseSubs(value);
    if (value.trim() && parsed.cues.length === 0) {
      setError(
        t(
          "No valid cues found — check that timestamps use the format 00:00:01,000 --> 00:00:04,000.",
          "រកមិនឃើញអត្ថបទត្រឹមត្រូវ — សូមពិនិត្យថាពេលវេលាប្រើទម្រង់ 00:00:01,000 --> 00:00:04,000។"
        )
      );
    } else if (parsed.skipped > 0) {
      setNotice(
        t(
          `${parsed.skipped} cue(s) with invalid timestamps were skipped.`,
          `បានរំលង ${parsed.skipped} អត្ថបទដែលមានពេលវេលាមិនត្រឹមត្រូវ។`
        )
      );
    }
    setCues(parsed.cues);
  }

  function loadFile(f: File | null) {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => applyRaw(String(reader.result ?? ""));
    reader.readAsText(f);
  }

  function updateCue(id: number, patch: Partial<Cue>) {
    setError(null);
    setCues((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function addCue() {
    const lastEnd = cues.length ? parseTime(cues[cues.length - 1].endStr) ?? 0 : 0;
    setCues((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), startStr: fmtTime(lastEnd, ","), endStr: fmtTime(lastEnd + 2, ","), text: "" },
    ]);
  }

  function removeCue(id: number) {
    setCues((prev) => prev.filter((c) => c.id !== id));
  }

  function applyOffset() {
    const delta = Number(offsetInput);
    if (Number.isNaN(delta) || delta === 0) return;
    setCues((prev) =>
      prev.map((c) => {
        const start = parseTime(c.startStr);
        const end = parseTime(c.endStr);
        if (start === null || end === null) return c;
        return {
          ...c,
          startStr: fmtTime(Math.max(0, start + delta), ","),
          endStr: fmtTime(Math.max(0, end + delta), ","),
        };
      })
    );
  }

  function exportSubs() {
    try {
      const sep = format === "vtt" ? "." : ",";
      const blocks = cues.map((c, idx) => {
        const start = parseTime(c.startStr);
        const end = parseTime(c.endStr);
        if (start === null || end === null) throw new Error("invalid timestamp");
        return `${idx + 1}\n${fmtTime(start, sep)} --> ${fmtTime(end, sep)}\n${c.text}`;
      });
      const content = (format === "vtt" ? "WEBVTT\n\n" : "") + blocks.join("\n\n") + "\n";
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `subtitles.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setError(null);
    } catch {
      setError(t("Fix the invalid timestamps before exporting.", "សូមកែពេលវេលាដែលមិនត្រឹមត្រូវមុនពេលនាំចេញ។"));
    }
  }

  return (
    <ToolShell
      title="Subtitle Editor (SRT/VTT)"
      khmerTitle="កែសម្រួលអក្សររត់"
      description="Paste or load a .srt/.vtt subtitle file, edit cue times and text, shift everything by a global offset, and export as SRT or VTT — locally in your browser."
      descriptionKm="បិទភ្ជាប់ ឬផ្ទុកឯកសារអក្សររត់ .srt/.vtt កែសម្រួលពេលវេលា និងអត្ថបទ ផ្លាស់ប្តូរពេលវេលាទាំងអស់ រួចនាំចេញជា SRT ឬ VTT — ធ្វើក្នុងកម្មវិធីរុករករបស់អ្នក។"
    >
      <Row>
        <Field label={t("Subtitle source", "ប្រភពអក្សររត់")}>
          <TextArea
            rows={6}
            value={raw}
            onChange={(e) => applyRaw(e.target.value)}
            placeholder={`1\n00:00:01,000 --> 00:00:04,000\nសួស្តី`}
          />
        </Field>
        <div className="space-y-3">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-6 text-center text-sm text-[var(--ink-dim)] transition hover:border-[var(--gold)]">
            <Upload size={15} /> {t("Choose .srt or .vtt file", "ជ្រើសរើសឯកសារ .srt ឬ .vtt")}
            <input type="file" accept=".srt,.vtt,text/plain" className="hidden" onChange={(e) => loadFile(e.target.files?.[0] ?? null)} />
          </label>
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink)]">
            {stats
              ? t(`${stats.count} cue(s) parsed`, `បានញែក ${stats.count} អត្ថបទ`)
              : t("Paste or load a file to start.", "បិទភ្ជាប់ ឬផ្ទុកឯកសារដើម្បីចាប់ផ្តើម។")}
          </div>
        </div>
      </Row>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      {notice && <p className="text-sm text-[var(--ink-dim)]">{notice}</p>}

      {cues.length > 0 && (
        <>
          <Row>
            <Field label={t("Global time offset (seconds)", "ការផ្លាស់ប្តូរពេលវេលាសរុប (វិនាទី)")}>
              <TextInput type="number" step="1" value={offsetInput} onChange={(e) => setOffsetInput(e.target.value)} placeholder="-5" />
            </Field>
            <div className="flex items-end">
              <Button type="button" onClick={applyOffset} disabled={!offsetInput.trim()}>
                {t("Apply offset", "អនុវត្តការផ្លាស់ប្តូរ")}
              </Button>
            </div>
          </Row>

          <div className="space-y-3">
            {cues.map((cue, i) => (
              <div key={cue.id} className="space-y-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
                    {t("Cue", "អត្ថបទ")} {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeCue(cue.id)}
                    className="flex items-center gap-1 rounded border border-[var(--ground-line)] px-2 py-1 text-xs text-[var(--danger)]"
                  >
                    <Trash2 size={12} /> {t("Remove", "ដកចេញ")}
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <TextInput value={cue.startStr} onChange={(e) => updateCue(cue.id, { startStr: e.target.value })} aria-label={t("Start time", "ម៉ោងចាប់ផ្តើម")} />
                  <TextInput value={cue.endStr} onChange={(e) => updateCue(cue.id, { endStr: e.target.value })} aria-label={t("End time", "ម៉ោងបញ្ចប់")} />
                </div>
                <TextArea rows={2} value={cue.text} onChange={(e) => updateCue(cue.id, { text: e.target.value })} className="!font-khmer" />
              </div>
            ))}
          </div>

          <Button type="button" onClick={addCue}>
            <Plus size={15} className="mr-1 inline" />
            {t("Add cue", "បន្ថែមអត្ថបទ")}
          </Button>

          <Row>
            <Field label={t("Export format", "ទម្រង់នាំចេញ")}>
              <Select value={format} onChange={(e) => setFormat(e.target.value)}>
                <option value="srt">SRT</option>
                <option value="vtt">VTT</option>
              </Select>
            </Field>
            <div className="flex items-end">
              <Button type="button" onClick={exportSubs}>
                <Download size={15} className="mr-1 inline" />
                {t("Download", "ទាញយក")} .{format}
              </Button>
            </div>
          </Row>
        </>
      )}

      <p className="text-[11px] leading-relaxed text-[var(--ink-dim)]">
        {t(
          "Subtitles are parsed and edited locally in your browser — nothing is uploaded. SRT and VTT timestamps (with or without hours, comma or dot milliseconds) are supported.",
          "អក្សររត់ត្រូវបានញែក និងកែសម្រួលក្នុងកម្មវិធីរុករករបស់អ្នក — គ្មានអ្វីត្រូវបានផ្ទុកឡើយ។ គាំទ្រទម្រង់ពេលវេលា SRT និង VTT (មាន ឬគ្មានម៉ោង សញ្ញាក្បៀស ឬចំនុចសម្រាប់មីលីវិនាទី)។"
        )}
      </p>
    </ToolShell>
  );
}
