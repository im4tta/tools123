"use client";
import { ToolShell, Field, Select, Row, TextInput } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const RESOLUTIONS = [
  { id: "240p", label: "240p (426×240)", w: 426, h: 240 },
  { id: "360p", label: "360p (640×360)", w: 640, h: 360 },
  { id: "480p", label: "480p (854×480)", w: 854, h: 480 },
  { id: "720p", label: "720p (1280×720)", w: 1280, h: 720 },
  { id: "1080p", label: "1080p (1920×1080)", w: 1920, h: 1080 },
  { id: "1440p", label: "1440p / 2K (2560×1440)", w: 2560, h: 1440 },
  { id: "4k", label: "4K UHD (3840×2160)", w: 3840, h: 2160 },
  { id: "8k", label: "8K UHD (7680×4320)", w: 7680, h: 4320 },
];

// General guidance from common platform (YouTube) recommended SDR upload bitrates.
const BITRATE_GUIDE: [string, string][] = [
  ["2160p (4K)", "35 – 45"],
  ["1440p (2K)", "16"],
  ["1080p (Full HD)", "8"],
  ["720p (HD)", "5"],
  ["480p", "2.5"],
  ["360p", "1"],
];

function parseDuration(hours: string, minutes: string, seconds: string): number {
  const h = parseFloat(hours) || 0;
  const m = parseFloat(minutes) || 0;
  const s = parseFloat(seconds) || 0;
  if (h < 0 || m < 0 || s < 0) return 0;
  return h * 3600 + m * 60 + s;
}

export default function VideoFileSizeCalculator() {
  const { text: t } = useLanguage();
  const [res, setRes] = useToolState("video-file-size-calculator:res", "1080p");
  const [bitrateMbps, setBitrateMbps] = useToolState("video-file-size-calculator:bitrate", "8");
  const [hours, setHours] = useToolState("video-file-size-calculator:h", "0");
  const [minutes, setMinutes] = useToolState("video-file-size-calculator:m", "60");
  const [seconds, setSeconds] = useToolState("video-file-size-calculator:s", "0");

  const bitrate = parseFloat(bitrateMbps);
  const total = parseDuration(hours, minutes, seconds);
  const valid = !isNaN(bitrate) && bitrate > 0 && total > 0;
  const bytes = valid ? (bitrate * 1_000_000 * total) / 8 : 0;
  const mb = bytes / 1_000_000;
  const gb = bytes / 1_000_000_000;
  const selected = RESOLUTIONS.find((r) => r.id === res) ?? RESOLUTIONS[3];

  return (
    <ToolShell
      title="Video File Size Calculator"
      khmerTitle="គណនាទំហំឯកសារវីដេអូ"
      description="Estimate the file size of a video from resolution, bitrate and duration, with typical bitrate guidance for common resolutions."
      descriptionKm="ប៉ាន់ស្មានទំហំឯកសារវីដេអូ ពីគុណភាពរូបភាព អត្រាប៊ីត និងរយៈពេល រួមជាមួយការណែនាំអត្រាប៊ីតទូទៅសម្រាប់គុណភាពធម្មតា។"
    >
      <Row>
        <Field label={t("Resolution", "គុណភាពរូបភាព")}>
          <Select value={res} onChange={(e) => setRes(e.target.value)}>
            {RESOLUTIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("Bitrate", "អត្រាប៊ីត")} hint={t("Mbps", "Mbps")}>
          <TextInput inputMode="decimal" value={bitrateMbps} onChange={(e) => setBitrateMbps(e.target.value)} className="font-mono-ui" />
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
        label={`${t("Estimated file size", "ទំហំឯកសារប៉ាន់ស្មាន")} · ${selected.label}`}
        value={valid ? (gb >= 1 ? `${gb.toFixed(2)} GB  (${mb.toFixed(0)} MB)` : `${mb.toFixed(1)} MB`) : ""}
        error={!valid}
      />

      <div className="overflow-hidden rounded-md border border-[var(--ground-line)]">
        <div className="bg-[var(--ground-raised)] px-3 py-2 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
          {t("Typical recommended bitrates", "អត្រាប៊ីតដែលគួរប្រើជាទូទៅ")}
          <span className="ml-1 font-normal normal-case text-[var(--ink-faint)]">
            {t("(Mbps, SDR — approximate)", "(Mbps, SDR — ប្រហាក់ប្រហែល)")}
          </span>
        </div>
        <table className="w-full text-left text-xs">
          <tbody>
            {BITRATE_GUIDE.map(([label, mbps]) => (
              <tr key={label} className="border-t border-[var(--ground-line)]">
                <td className="px-3 py-1.5 text-[var(--ink-dim)]">{label}</td>
                <td className="px-3 py-1.5 text-right font-mono-ui text-[var(--ink)]">{mbps} Mbps</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-xs leading-relaxed text-[var(--ink-faint)]">
        {t(
          "Estimate only: size = bitrate × duration (1 MB = 1,000,000 bytes). Audio track, container overhead, and codec efficiency are not included. The bitrate guide follows YouTube's recommended SDR upload encoding settings — actual values vary by codec, content and platform.",
          "គ្រាន់តែប៉ាន់ស្មាន៖ ទំហំ = អត្រាប៊ីត × រយៈពេល (1 MB = 1,000,000 បៃ)។ ផ្នែកសំឡេង ទិន្នន័យបន្ថែមរបស់កុងតឺន័រ និងប្រសិទ្ធភាពកូឌិកមិនត្រូវបានរាប់បញ្ចូលទេ។ ការណែនាំអត្រាប៊ីតធ្វើតាមរបៀបផ្ទុកឡើង SDR ដែល YouTube ណែនាំ — តម្លៃពិតប្រែក្លាយទៅតាមកូឌិក ខ្លឹមសារ និងវេទិកា។"
        )}
      </p>
    </ToolShell>
  );
}
