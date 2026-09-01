"use client";
import { ToolShell, Field, Select, Row, TextInput } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const FPS_OPTIONS = ["23.976", "24", "25", "29.97", "30", "50", "59.94", "60"];

function parseDuration(hours: string, minutes: string, seconds: string): number {
  const h = parseFloat(hours) || 0;
  const m = parseFloat(minutes) || 0;
  const s = parseFloat(seconds) || 0;
  if (h < 0 || m < 0 || s < 0) return 0;
  return h * 3600 + m * 60 + s;
}

function formatClock(totalSeconds: number): string {
  const t = Math.max(0, totalSeconds);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = Math.floor(t % 60);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function FrameRateConverter() {
  const { text: t } = useLanguage();
  const [srcFps, setSrcFps] = useToolState("frame-rate-converter:src", "24");
  const [tgtFps, setTgtFps] = useToolState("frame-rate-converter:tgt", "25");
  const [hours, setHours] = useToolState("frame-rate-converter:h", "0");
  const [minutes, setMinutes] = useToolState("frame-rate-converter:m", "10");
  const [seconds, setSeconds] = useToolState("frame-rate-converter:s", "0");

  const src = parseFloat(srcFps);
  const tgt = parseFloat(tgtFps);
  const total = parseDuration(hours, minutes, seconds);
  const valid = !isNaN(src) && !isNaN(tgt) && src > 0 && tgt > 0 && total > 0;
  const factor = valid ? tgt / src : 1;
  const newDuration = valid ? (total * src) / tgt : 0;

  return (
    <ToolShell
      title="Frame Rate Converter"
      khmerTitle="បំលែងអត្រាស៊ុម"
      description="Pick a source and a target frame rate, enter a duration, and see the speed change and the new duration after conversion."
      descriptionKm="ជ្រើសរើសអត្រាស៊ុមដើម និងអត្រាស៊ុមគោលដៅ បញ្ចូលរយៈពេល រួចមើលការប្រែប្រួលល្បឿន និងរយៈពេលថ្មីបន្ទាប់ពីបំលែង។"
    >
      <Row>
        <Field label={t("Source frame rate", "អត្រាស៊ុមដើម")} hint={t("fps", "fps")}>
          <Select value={srcFps} onChange={(e) => setSrcFps(e.target.value)} className="font-mono-ui">
            {FPS_OPTIONS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("Target frame rate", "អត្រាស៊ុមគោលដៅ")} hint={t("fps", "fps")}>
          <Select value={tgtFps} onChange={(e) => setTgtFps(e.target.value)} className="font-mono-ui">
            {FPS_OPTIONS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </Select>
        </Field>
      </Row>

      <Row>
        <Field label={t("Duration — hours", "រយៈពេល — ម៉ោង")}>
          <TextInput inputMode="decimal" value={hours} onChange={(e) => setHours(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label={t("Duration — minutes", "រយៈពេល — នាទី")}>
          <TextInput inputMode="decimal" value={minutes} onChange={(e) => setMinutes(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label={t("Duration — seconds", "រយៈពេល — វិនាទី")}>
          <TextInput inputMode="decimal" value={seconds} onChange={(e) => setSeconds(e.target.value)} className="font-mono-ui" />
        </Field>
      </Row>

      <Output
        label={t("Speed change", "ការប្រែប្រួលល្បឿន")}
        value={valid ? `${factor.toFixed(4)}×  (${factor >= 1 ? "+" : ""}${((factor - 1) * 100).toFixed(2)}%)` : ""}
        error={!valid}
      />
      <Output
        label={t("New duration", "រយៈពេលថ្មី")}
        value={valid ? `${formatClock(newDuration)}  (${newDuration.toFixed(2)} s)` : ""}
        error={!valid}
      />

      <p className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-xs leading-relaxed text-[var(--ink-faint)]">
        {t(
          "Note: this is a mathematical speed conversion (new duration = source duration × source fps ÷ target fps). Real footage is usually converted between 23.976/24/25/29.97/30 fps with pulldown patterns (e.g. 3:2), field duplication, or resampling rather than a plain speed change, and NTSC rates (29.97/59.94) run 0.1% slower than their nominal integer values.",
          "កំណត់សម្គាល់៖ នេះជាការបំលែងល្បឿនតាមគណិតវិទ្យា (រយៈពេលថ្មី = រយៈពេលដើម × អត្រាស៊ុមដើម ÷ អត្រាស៊ុមគោលដៅ)។ ជាទូទៅវីដេអូពិតត្រូវបានបំលែងរវាង 23.976/24/25/29.97/30 fps ដោយប្រើលំនាំ pulldown (ឧ. 3:2) ការចម្លងស៊ុមវាល ឬការធ្វើគំរូឡើងវិញ ជាជាងការប្តូរល្បឿនសុទ្ធ ហើយអត្រា NTSC (29.97/59.94) យឺតជាងតម្លៃចំនួនគត់បន្តិច (0.1%)។"
        )}
      </p>
    </ToolShell>
  );
}
