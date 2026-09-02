"use client";
import { useMemo, useState } from "react";
import { Dices, Heart, Users } from "lucide-react";
import { ToolShell, Field, TextInput, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

interface Verdict {
  min: number;
  en: string;
  km: string;
}

const VERDICTS: Verdict[] = [
  { min: 90, en: "An incredible match — rare and golden!", km: "គូដ៏អស្ចារ្យ — កម្រណាស់!" },
  { min: 75, en: "A great match — sparks are flying.", km: "ត្រូវគ្នាល្អណាស់ — មានផ្កាភ្លើងស្នេហា។" },
  { min: 60, en: "Sweet connection — worth growing together.", km: "ទំនាក់ទំនងផ្អែមល្ហែម — គួរបន្តជាមួយគ្នា។" },
  { min: 40, en: "A mixed blend — patience helps.", km: "ចម្រុះគ្នា — ត្រូវការការអត់ធ្មត់។" },
  { min: 20, en: "Chalk and cheese — keep it friendly.", km: "ខុសគ្នាឆ្ងាយ — រក្សាទុកជាមិត្តល្អវិញ។" },
  { min: 0, en: "Opposite poles — but opposites attract!", km: "ផ្ទុយគ្នាខ្លាំង — តែផ្ទុយគ្នាតែងទាក់ទាញគ្នា!" },
];

/** Deterministic string hash (djb2) — same input always gives the same number. */
function hashString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export default function NameCompatibility() {
  const { text: t } = useLanguage();
  const [name1, setName1] = useToolState("name-compat:name1", "Sokha");
  const [name2, setName2] = useToolState("name-compat:name2", "Dara");
  const [relation, setRelation] = useToolState("name-compat:relation", "");
  const [seed, setSeed] = useToolState("name-compat:seed", 0);
  const [shaking, setShaking] = useState(false);

  const a = name1.trim();
  const b = name2.trim();
  const ready = a.length > 0 && b.length > 0;

  const pct = useMemo<number | null>(() => {
    if (!ready) return null;
    const left = a.toLowerCase();
    const right = b.toLowerCase();
    const base = [left, right].sort().join("&");
    const rel = relation.trim().toLowerCase();
    const key = `${base}${rel ? `|${rel}` : ""}::${seed}`;
    return hashString(key) % 101;
  }, [ready, a, b, relation, seed]);

  const verdict = pct === null ? null : VERDICTS.find((v) => pct >= v.min) ?? VERDICTS[VERDICTS.length - 1];

  const shake = () => {
    setSeed((s) => s + 1);
    setShaking(true);
    window.setTimeout(() => setShaking(false), 550);
  };

  return (
    <ToolShell
      title="Name Compatibility"
      khmerTitle="ភាពត្រូវគ្នានៃឈ្មោះ"
      description="A playful compatibility score for two names — with a shake-to-reroll button. For entertainment only."
      descriptionKm="ពិន្ទុភាពត្រូវគ្នាលេងសប្បាយរវាងឈ្មោះពីរ — មានប៊ូតុងអង្រួនដើម្បីគណនាឡើងវិញ។ សម្រាប់ការកម្សាន្តតែប៉ុណ្ណោះ។"
    >
      <style>{`@keyframes nc-shake { 0%,100% { transform: rotate(0deg); } 20% { transform: rotate(-8deg); } 40% { transform: rotate(8deg); } 60% { transform: rotate(-5deg); } 80% { transform: rotate(5deg); } }`}</style>

      <div className="rounded-md border border-[var(--gold)] bg-[var(--ground-raised)] px-3 py-2 text-xs leading-relaxed text-[var(--gold)]">
        {t("For entertainment only — not based on real science or astrology.", "សម្រាប់ការកម្សាន្តតែប៉ុណ្ណោះ — មិនមែនផ្អែកលើវិទ្យាសាស្ត្រ ឬហោរាសាស្ត្រពិតប្រាកដទេ។")}
      </div>

      <Row>
        <Field label={t("First name", "ឈ្មោះទីមួយ")}>
          <TextInput value={name1} onChange={(e) => setName1(e.target.value)} maxLength={60} />
        </Field>
        <Field label={t("Second name", "ឈ្មោះទីពីរ")}>
          <TextInput value={name2} onChange={(e) => setName2(e.target.value)} maxLength={60} />
        </Field>
      </Row>

      <Field
        label={t("Relationship (optional)", "ទំនាក់ទំនង (ស្រេចចិត្ត)")}
        hint="friends, partners, siblings…"
        hintKm="មិត្តភក្តិ គូស្នេហ៍ បងប្អូន…"
      >
        <TextInput value={relation} onChange={(e) => setRelation(e.target.value)} maxLength={40} />
      </Field>

      {!ready ? (
        <div className="rounded-md border border-dashed border-[var(--ground-line)] p-8 text-center text-sm text-[var(--ink-faint)]">
          {t("Enter two names to see their compatibility.", "បញ្ចូលឈ្មោះពីរដើម្បីមើលភាពត្រូវគ្នា។")}
        </div>
      ) : (
        <div
          className="mx-auto max-w-md rounded-xl border border-[var(--gold)]/40 bg-[var(--ground-raised)] p-6 text-center"
          style={{ animation: shaking ? "nc-shake 0.55s ease-in-out" : undefined }}
        >
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-[var(--ink)]">
            <Users size={16} className="text-[var(--gold)]" />
            <span>{a} &amp; {b}</span>
          </div>
          {relation.trim() && (
            <div className="mt-1 text-xs uppercase tracking-wide text-[var(--ink-dim)]">{relation.trim()}</div>
          )}

          {pct !== null && verdict && (
            <>
              <div className="mt-4 font-display text-6xl font-bold text-[var(--gold)]">{pct}%</div>
              <div className="mt-3 flex items-center justify-center gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Heart
                    key={i}
                    size={20}
                    className={pct >= (i + 1) * 20 ? "fill-[var(--gold)] text-[var(--gold)]" : "text-[var(--ground-line)]"}
                  />
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-[var(--ink)]">{t(verdict.en, verdict.km)}</p>
              <Button type="button" onClick={shake} className="mt-5 w-full">
                <Dices size={15} className="mr-1 inline" />
                {t("Shake for another result", "អង្រួនដើម្បីលទ្ធផលផ្សេង")}
              </Button>
            </>
          )}
        </div>
      )}

      <p className="text-xs leading-relaxed text-[var(--ink-faint)]">
        {t(
          "The score is computed from a stable code of the two names (and the optional relationship label), so it stays the same until you shake it for a new one. Pure fun — no real science involved.",
          "ពិន្ទុត្រូវបានគណនាពីលេខកូដស្ថិរភាពនៃឈ្មោះទាំងពីរ (និងស្លាកទំនាក់ទំនងបើមាន) ដូច្នេះវានៅដដែល រហូតដល់អ្នកអង្រួនដើម្បីទទួលលទ្ធផលថ្មី។ ជាការកម្សាន្តសុទ្ធសាធ — គ្មានវិទ្យាសាស្ត្រពិតប្រាកដទេ។"
        )}
      </p>
    </ToolShell>
  );
}
