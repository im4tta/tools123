"use client";
import { useMemo, useState } from "react";
import { ToolShell, Field, Select, Row } from "@/components/ui/Shell";
import { Button, Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type Family = { key: string; lines: string[] };
type Theme = { id: string; titleEn: string; titleKm: string; families: Family[] };

// Small curated Khmer word-bank lines per theme. Each line in a family ends
// with the same rhyme sound so pairs can be joined into kâp-style couplets.
const THEMES: Theme[] = [
  {
    id: "nature",
    titleEn: "Nature",
    titleKm: "ធម្មជាតិ",
    families: [
      {
        key: "ាយ",
        lines: [
          "ផ្ការីកពេញសួនច្បារ ក្លិនក្រអូបសាយទៅឆ្ងាយ",
          "សត្វស្លាបហើរលើមេឃ សំឡេងពិរោះឮឆ្ងាយ",
          "ខ្យល់បក់បោកស្លឹកឈើ សំឡេងរសាត់ទៅឆ្ងាយ",
        ],
      },
      {
        key: "ូន",
        lines: [
          "ដើមឈើដុះតម្រង់ ម្លប់ត្រជាក់ក្រោមសួន",
          "ស្រះទឹកថ្លាឈ្វេង ផ្កាឈូករីកពេញសួន",
          "ខ្យល់អាកាសបរិសុទ្ធ ស្រួលដកដង្ហើមក្នុងសួន",
        ],
      },
      {
        key: "ិត",
        lines: [
          "ព្រៃភ្នំបៃតងស្រស់ អាកាសធាតុល្អពិត",
          "ទឹកធ្លាក់ពីលើភ្នំ សំឡេងពិរោះពិត",
          "ផ្កាឈូករីកក្នុងស្រះ ទេសភាពស្អាតពិត",
        ],
      },
    ],
  },
  {
    id: "love",
    titleEn: "Love",
    titleKm: "ស្នេហ៍",
    families: [
      {
        key: "ាយ",
        lines: [
          "ចិត្តខ្ញុំមានតែអ្នក មិនដែលឃ្លាតឆ្ងាយ",
          "ឃើញមុខអ្នករាល់ថ្ងៃ ទុក្ខក៏បាត់ទៅឆ្ងាយ",
          "ពេលអ្នកញញឹមដាក់ខ្ញុំ ទុក្ខទាំងអស់បាត់ឆ្ងាយ",
        ],
      },
      {
        key: "ូន",
        lines: [
          "ស្នេហ៍យើងដូចផ្កាឈូក រីកស្អាតក្នុងសួន",
          "នឹកឃើញមុខអ្នក ដូចផ្កាក្នុងសួន",
          "ដើរលេងជាមួយគ្នា សប្បាយពេញសួន",
        ],
      },
      {
        key: "ិត",
        lines: [
          "ស្នេហ៍ខ្ញុំចំពោះអ្នក ស្មោះត្រង់បរិសុទ្ធពិត",
          "រាល់ពាក្យដែលអ្នកថា ខ្ញុំជឿថាពិត",
          "ចិត្តអ្នកស្មោះនឹងខ្ញុំ ខ្ញុំដឹងច្បាស់ពិត",
        ],
      },
    ],
  },
  {
    id: "newyear",
    titleEn: "Khmer New Year",
    titleKm: "បុណ្យចូលឆ្នាំ",
    families: [
      {
        key: "ាយ",
        lines: [
          "រីករាយបុណ្យចូលឆ្នាំ សុខសប្បាយកុំឃ្លាតឆ្ងាយ",
          "ជូនពរសុខភាពល្អ សេចក្ដីសុខកុំឃ្លាតឆ្ងាយ",
          "ជូនពរឲ្យបានសុខ ទុក្ខទាំងអស់ឃ្លាតឆ្ងាយ",
        ],
      },
      {
        key: "ូន",
        lines: [
          "គ្រួសារជួបជុំគ្នា សប្បាយដូចកូន",
          "ល្បែងប្រជាប្រិយ លេងសប្បាយក្នុងសួន",
          "រាំលេងកំសាន្ត សប្បាយពេញសួន",
        ],
      },
      {
        key: "ិត",
        lines: [
          "ពិធីបុណ្យចូលឆ្នាំ ជាប្រពៃណីខ្មែរពិត",
          "ឆ្នាំថ្មីជិតមកដល់ បេះដូងរីករាយពិត",
          "ជូនពរគ្នាទៅវិញទៅមក ជាទំនៀមល្អពិត",
        ],
      },
    ],
  },
  {
    id: "teacher",
    titleEn: "Teacher",
    titleKm: "គ្រូបង្រៀន",
    families: [
      {
        key: "ាយ",
        lines: [
          "គ្រូបង្រៀនខំប្រឹង ចង់ឲ្យសិស្សដើរទៅឆ្ងាយ",
          "អរគុណលោកគ្រូ ដែលផ្ដល់ចំណេះឲ្យខ្ញុំដើរទៅឆ្ងាយ",
          "សិស្សល្អត្រូវឧស្សាហ៍ ទើបជីវិតរុងរឿងទៅឆ្ងាយ",
        ],
      },
      {
        key: "ូន",
        lines: [
          "គ្រូប្រៀបដូចអ្នកថែសួន ស្រោចស្រពសិស្សដូចកូន",
          "លោកគ្រូអត់ធ្មត់ បង្រៀនសិស្សដូចកូន",
          "បង្រៀនដោយក្ដីស្រឡាញ់ មើលសិស្សដូចកូន",
        ],
      },
      {
        key: "ិត",
        lines: [
          "គ្រូល្អបង្រៀនសិស្ស ដោយចិត្តស្មោះត្រង់ពិត",
          "ការគោរពគ្រូអ្នកផ្ដល់ចំណេះ ជាកិច្ចល្អពិត",
          "សិស្សឧស្សាហ៍រៀនសូត្រ ជាទីពេញចិត្តគ្រូពិត",
        ],
      },
    ],
  },
  {
    id: "food",
    titleEn: "Food",
    titleKm: "ម្ហូបអាហារ",
    families: [
      {
        key: "ាយ",
        lines: [
          "ម្ហូបខ្មែរឆ្ងាញ់ពិសា ក្លិនក្រអូបសាយទៅឆ្ងាយ",
          "អាម៉ុកនិងសម្លម្ជូរ ក្លិនឈ្ងុយឮទៅឆ្ងាយ",
          "បង្អែមខ្មែរផ្អែមល្អ ល្បីឈ្មោះឆ្ងាយ",
        ],
      },
      {
        key: "ូន",
        lines: [
          "ចម្អិនម្ហូបឲ្យឆ្ងាញ់ ដូចម្ដាយចម្អិនឲ្យកូន",
          "អាហារសម្បូរបែប ចែកគ្នាញុាំដូចបងប្អូន",
          "អាហារពេលល្ងាច រៀបចំឲ្យកូន",
        ],
      },
      {
        key: "ិត",
        lines: [
          "អាហារខ្មែរប្លែកៗ រសជាតិឆ្ងាញ់ពិត",
          "ម្ហូបដែលម្ដាយធ្វើ ឆ្ងាញ់ជាងគេពិត",
          "ប្រហុកល្អផ្ទះ ឆ្ងាញ់ជាងគ្រឿងថ្លៃពិត",
        ],
      },
    ],
  },
];

function graphemeCount(text: string): number {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter("km", { granularity: "grapheme" });
    return [...seg.segment(text)].filter((s) => s.segment.trim() !== "").length;
  }
  return [...text].filter((c) => c.trim() !== "").length;
}

/** Picks two lines from a family, preferring a matched line length (graphemes). */
function pickPair(lines: string[], rng: () => number): [string, string] {
  const i = Math.floor(rng() * lines.length);
  const first = lines[i];
  const target = graphemeCount(first);
  let best = lines[(i + 1) % lines.length];
  let bestDiff = Infinity;
  lines.forEach((l, j) => {
    if (j === i) return;
    const d = Math.abs(graphemeCount(l) - target);
    if (d < bestDiff) {
      bestDiff = d;
      best = l;
    }
  });
  return [first, best];
}

/** Small deterministic PRNG so the same seed always yields the same poem. */
function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generatePoem(theme: Theme, stanzas: number, scheme: "aabb" | "abba", seed: number): string[][] {
  const rng = mulberry32(seed + 1);
  const result: string[][] = [];
  for (let s = 0; s < stanzas; s++) {
    const fams = theme.families;
    const ia = Math.floor(rng() * fams.length);
    let ib = Math.floor(rng() * fams.length);
    if (fams.length > 1 && ib === ia) ib = (ia + 1) % fams.length;
    const a = fams[ia];
    const b = fams[ib];
    const [a1, a2] = pickPair(a.lines, rng);
    const [b1, b2] = pickPair(b.lines, rng);
    result.push(scheme === "aabb" ? [a1, a2, b1, b2] : [a1, b1, b2, a2]);
  }
  return result;
}

export default function KhmerPoemGenerator() {
  const { text: t } = useLanguage();
  const [themeId, setThemeId] = useToolState("kpg:theme", "nature");
  const [stanzas, setStanzas] = useToolState("kpg:stanzas", "2");
  const [scheme, setScheme] = useToolState("kpg:scheme", "aabb");
  const [seed, setSeed] = useState(0);

  const theme = THEMES.find((th) => th.id === themeId) ?? THEMES[0];

  const poem = useMemo(
    () => generatePoem(theme, Number(stanzas), scheme as "aabb" | "abba", seed),
    [theme, stanzas, scheme, seed]
  );
  const counts = poem.flat().map(graphemeCount);

  return (
    <ToolShell
      title="Khmer Poem Generator (កាព្យ)"
      khmerTitle="បង្កើតកាព្យខ្មែរ"
      description="Generate playful Khmer kâp-style couplets from small curated word banks per theme, with grapheme-based line-length balancing and simple rhyme schemes (a-a-b-b / a-b-b-a). A learning toy — not traditional literary composition."
      descriptionKm="បង្កើតកាព្យខ្មែរតាមលំនាំលេងៗ ពីធនាគារពាក្យតូចៗតាមប្រធានបទ ដោយថ្លឹងប្រវែងបន្ទាត់តាមការរាប់ grapheme និងលំនាំចង្វាក់សាមញ្ញ (ក-ក-ខ-ខ / ក-ខ-ខ-ក)។ ជាឧបករណ៍សម្រាប់រៀនលេង — មិនមែនជាការតែងកាព្យបែបបុរាណទេ។"
    >
      <Row>
        <Field label={t("Theme", "ប្រធានបទ")}>
          <Select value={themeId} onChange={(e) => setThemeId(e.target.value)}>
            {THEMES.map((th) => (
              <option key={th.id} value={th.id}>
                {t(th.titleEn, th.titleKm)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("Stanzas", "ចំនួនវគ្គ")}>
          <Select value={stanzas} onChange={(e) => setStanzas(e.target.value)}>
            <option value="1">{t("1 stanza", "១ វគ្គ")}</option>
            <option value="2">{t("2 stanzas", "២ វគ្គ")}</option>
            <option value="3">{t("3 stanzas", "៣ វគ្គ")}</option>
            <option value="4">{t("4 stanzas", "៤ វគ្គ")}</option>
          </Select>
        </Field>
        <Field label={t("Rhyme scheme", "លំនាំចង្វាក់")}>
          <Select value={scheme} onChange={(e) => setScheme(e.target.value)}>
            <option value="aabb">{t("a-a-b-b", "ក-ក-ខ-ខ")}</option>
            <option value="abba">{t("a-b-b-a", "ក-ខ-ខ-ក")}</option>
          </Select>
        </Field>
      </Row>

      <Button type="button" onClick={() => setSeed((s) => s + 1)}>
        {t("Generate poem", "បង្កើតកាព្យ")}
      </Button>

      <Output
        label={t("Generated poem", "កាព្យដែលបង្កើតបាន")}
        value={poem.map((stanza) => stanza.join("\n")).join("\n\n")}
        mono={false}
      />

      <p className="text-xs text-[var(--ink-faint)]">
        {t(
          `Line lengths (grapheme clusters): ${counts.join(" · ")}`,
          `ប្រវែងបន្ទាត់ (ចង្កោម grapheme): ${counts.join(" · ")}`
        )}
      </p>

      <p className="text-xs leading-relaxed text-[var(--ink-dim)]">
        {t(
          "AI-assisted generated sample — a playful template poem, not traditional literary work. Traditional Khmer kâp follows strict metrical rules; this tool only approximates line length and rhyme.",
          "គំរូដែលបង្កើតដោយ AI — ជាកាព្យតាមគំរូលេងៗ មិនមែនជាស្នាដៃអក្សរសិល្ប៍បែបប្រពៃណីទេ។ កាព្យខ្មែរបុរាណត្រូវតាមវិធានយ៉ាងតឹងរឹង; ឧបករណ៍នេះគ្រាន់តែប៉ាន់ស្មានប្រវែងបន្ទាត់ និងចង្វាក់ប៉ុណ្ណោះ។"
        )}
      </p>
    </ToolShell>
  );
}
