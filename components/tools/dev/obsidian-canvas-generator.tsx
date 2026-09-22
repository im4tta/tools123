"use client";
import { useMemo } from "react";
import { Download } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { CopyButton } from "@/components/CopyButton";
import { Field, TextArea, ToolShell } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { downloadBlob } from "@/lib/download";

const COLORS: { id: string; en: string; km: string; hex: string }[] = [
  { id: "", en: "None", km: "គ្មាន", hex: "#8a8f98" },
  { id: "1", en: "Red", km: "ក្រហម", hex: "#e93147" },
  { id: "2", en: "Orange", km: "ទឹកក្រូច", hex: "#e0812c" },
  { id: "3", en: "Yellow", km: "លឿង", hex: "#e0ac00" },
  { id: "4", en: "Green", km: "បៃតង", hex: "#0ca678" },
  { id: "5", en: "Cyan", km: "ខៀវ", hex: "#00bfa0" },
  { id: "6", en: "Purple", km: "ស្វាយ", hex: "#7852ee" },
];

function buildCanvas(cards: string[], columns: number, w: number, h: number, gap: number, color: string, connect: boolean) {
  const nodes = cards.map((text, i) => {
    const col = i % columns;
    const row = Math.floor(i / columns);
    return {
      id: `n${i}`,
      type: "text" as const,
      text,
      x: col * (w + gap),
      y: row * (h + gap),
      width: w,
      height: h,
      ...(color ? { color } : {}),
    };
  });
  const edges = connect
    ? cards.slice(1).map((_, i) => ({ id: `e${i}`, fromNode: `n${i}`, fromSide: "right", toNode: `n${i + 1}`, toSide: "left" }))
    : [];
  return { nodes, edges };
}

export default function ObsidianCanvasGenerator() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("obsidian-canvas:input", "");
  const [columns, setColumns] = useToolState("obsidian-canvas:cols", 3);
  const [color, setColor] = useToolState("obsidian-canvas:color", "");
  const [connect, setConnect] = useToolState("obsidian-canvas:connect", false);

  const cards = useMemo(() => {
    const blocks = input.includes("\n\n") ? input.split(/\n\s*\n/) : input.split("\n");
    return blocks.map((b) => b.trim()).filter(Boolean);
  }, [input]);

  const json = useMemo(() => JSON.stringify(buildCanvas(cards, Math.max(1, columns), 260, 120, 40, color, connect), null, 2), [cards, columns, color, connect]);

  return (
    <ToolShell
      title="Obsidian Canvas Generator"
      khmerTitle="ឧបករណ៍បង្កើត Canvas សម្រាប់ Obsidian"
      description="Turn a list of notes into an Obsidian Canvas (.canvas) file. Write one card per line — or separate longer cards with a blank line — choose a grid layout and colour, optionally chain the cards with arrows, then download the .canvas file and open it in Obsidian. Everything runs in your browser."
      descriptionKm="បម្លែងបញ្ជីកំណត់ត្រាទៅជាឯកសារ Obsidian Canvas (.canvas)។ សរសេរមួយកាតក្នុងមួយបន្ទាត់ — ឬបំបែកកាតវែងដោយបន្ទាត់ទទេ — ជ្រើសប្លង់ក្រឡា និងពណ៌ ភ្ជាប់កាតដោយព្រួញតាមជម្រើស រួចទាញយកឯកសារ .canvas ហើយបើកក្នុង Obsidian។ អ្វីៗដំណើរការក្នុងកម្មវិធីរុករក។"
    >
      <Field label="Cards" labelKm="កាត" hint="one per line, or blank line between cards" hintKm="មួយក្នុងមួយបន្ទាត់ ឬបន្ទាត់ទទេរវាងកាត">
        <TextArea value={input} onChange={(e) => setInput(e.target.value)} rows={6} placeholder={t("Idea one\nIdea two\nIdea three", "គំនិតទី១\nគំនិតទី២\nគំនិតទី៣")} />
      </Field>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-[var(--ink-faint)]">{t("Columns", "ជួរឈរ")}:</span>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setColumns(n)} className={`h-8 w-8 rounded-md border text-xs font-medium transition ${columns === n ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]" : "border-[var(--ground-line)] text-[var(--ink-dim)] hover:border-[var(--ink-faint)]"}`}>{n}</button>
        ))}
        <button type="button" onClick={() => setConnect((v) => !v)} className={`ml-2 rounded-md border px-3 py-1.5 text-xs font-medium transition ${connect ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]" : "border-[var(--ground-line)] text-[var(--ink-dim)] hover:border-[var(--ink-faint)]"}`}>
          {t("Connect with arrows", "ភ្ជាប់ដោយព្រួញ")}
        </button>
      </div>

      <div>
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Card colour", "ពណ៌កាត")}</span>
        <div className="flex flex-wrap gap-1.5">
          {COLORS.map((c) => (
            <button key={c.id} type="button" onClick={() => setColor(c.id)} className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition ${color === c.id ? "border-[var(--gold)] text-[var(--ink)]" : "border-[var(--ground-line)] text-[var(--ink-dim)] hover:border-[var(--ink-faint)]"}`}>
              <span className="h-3 w-3 rounded-sm" style={{ background: c.hex }} />{t(c.en, c.km)}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-[var(--ink-faint)]">{t(`${cards.length} card${cards.length === 1 ? "" : "s"}`, `${cards.length} កាត`)}</p>

      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--ink-faint)]">{t("Copy JSON", "ចម្លង JSON")}</span><CopyButton text={json} compact />
        <button type="button" onClick={() => downloadBlob(new Blob([json], { type: "application/json" }), "diagram.canvas")} disabled={cards.length === 0} className="flex items-center gap-1.5 rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-medium text-[#0a0c0d] transition hover:bg-[var(--gold-dim)] disabled:opacity-50">
          <Download size={13} />{t("Download .canvas", "ទាញយក .canvas")}
        </button>
      </div>
      <Output label="diagram.canvas" value={json} />

      <section className="rounded-md border border-[var(--ground-line)] p-4 text-xs leading-6 text-[var(--ink-faint)]">
        <p className="mb-1 font-medium text-[var(--ink-dim)]">{t("Source & Credits", "ប្រភព និងកិត្តិយស")}</p>
        <p>{t(
          "Output follows the open JSON Canvas format (jsoncanvas.org) that Obsidian Canvas uses: text nodes with x/y/width/height and optional colour, plus edges between nodes. It is built in your browser. Obsidian is a trademark of Dynalith Systems, Inc.; this tool is not affiliated with or endorsed by it.",
          "លទ្ធផលអនុវត្តតាមទម្រង់ JSON Canvas បើកចំហ (jsoncanvas.org) ដែល Obsidian Canvas ប្រើ៖ node អត្ថបទដែលមាន x/y/width/height និងពណ៌តាមជម្រើស ព្រមទាំង edge រវាង node។ វាបង្កើតក្នុងកម្មវិធីរុករក។ Obsidian ជាពាណិជ្ជសញ្ញារបស់ Dynalith Systems, Inc.; ឧបករណ៍នេះមិនពាក់ព័ន្ធ ឬទទួលការគាំទ្រពីវាទេ។",
        )}</p>
      </section>
    </ToolShell>
  );
}
