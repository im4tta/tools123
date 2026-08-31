"use client";
import { useState } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Output, Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type BlankDef = { id: string; en: string; km: string };
type Template = {
  id: string;
  titleEn: string;
  titleKm: string;
  blanks: BlankDef[];
  textEn: string;
  textKm: string;
};

// Original bilingual story templates written for this tool.
const TEMPLATES: Template[] = [
  {
    id: "market",
    titleEn: "A Day at the Market",
    titleKm: "ថ្ងៃមួយនៅផ្សារ",
    blanks: [
      { id: "adj1", en: "an adjective", km: "គុណនាម" },
      { id: "place1", en: "a place", km: "ទីកន្លែង" },
      { id: "noun1", en: "a noun", km: "នាម" },
      { id: "adj2", en: "an adjective", km: "គុណនាម" },
      { id: "noun2", en: "a noun", km: "នាម" },
      { id: "verb1", en: "a verb", km: "កិរិយាសព្ទ" },
    ],
    textEn: "One {adj1} morning I went to {place1} with my {noun1}. We saw a {adj2} {noun2} and decided to {verb1} together. What a day!",
    textKm: "ព្រឹក {adj1} មួយ ខ្ញុំបានទៅ {place1} ជាមួយ {noun1} របស់ខ្ញុំ។ យើងបានឃើញ {noun2} {adj2} មួយ ហើយក៏សម្រេចចិត្ត {verb1} ជាមួយគ្នា។ អស្ចារ្យណាស់!",
  },
  {
    id: "dragon",
    titleEn: "The Sneaky Dragon",
    titleKm: "នាគឆ្លាតមួយក្បាល",
    blanks: [
      { id: "adj1", en: "an adjective", km: "គុណនាម" },
      { id: "noun1", en: "a noun", km: "នាម" },
      { id: "verb1", en: "a verb", km: "កិរិយាសព្ទ" },
      { id: "noun2", en: "a noun", km: "នាម" },
      { id: "adj2", en: "an adjective", km: "គុណនាម" },
      { id: "verb2", en: "a verb", km: "កិរិយាសព្ទ" },
    ],
    textEn: "A {adj1} dragon hid inside a {noun1} and began to {verb1}. Everyone thought it was a {adj2} {noun2}, until it started to {verb2}!",
    textKm: "នាគ {adj1} មួយក្បាល លាក់ខ្លួនក្នុង {noun1} ហើយចាប់ផ្ដើម {verb1}។ គ្រប់គ្នាគិតថាវាជា {noun2} {adj2} មួយ រហូតដល់វាចាប់ផ្ដើម {verb2}!",
  },
  {
    id: "dream",
    titleEn: "My Crazy Dream",
    titleKm: "សុបិនចម្លែករបស់ខ្ញុំ",
    blanks: [
      { id: "noun1", en: "a noun", km: "នាម" },
      { id: "verb1", en: "a verb", km: "កិរិយាសព្ទ" },
      { id: "place1", en: "a place", km: "ទីកន្លែង" },
      { id: "person1", en: "a person", km: "មនុស្ស" },
      { id: "adj1", en: "an adjective", km: "គុណនាម" },
      { id: "noun2", en: "a noun", km: "នាម" },
    ],
    textEn: "Last night I dreamed that my {noun1} could {verb1}. I rode it to {place1} where {person1} was wearing a {adj1} {noun2}. Then I woke up!",
    textKm: "យប់មិញ ខ្ញុំសុបិនឃើញ {noun1} របស់ខ្ញុំ អាច {verb1} បាន។ ខ្ញុំជិះវាទៅ {place1} ដែល {person1} កំពុងពាក់ {noun2} {adj1} មួយ។ បន្ទាប់មកខ្ញុំក៏ភ្ញាក់ឡើង!",
  },
];

function fillStory(text: string, words: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (_, id: string) => words[id]?.trim() || "______");
}

export default function MadLibs() {
  const { text: t } = useLanguage();
  const [templateId, setTemplateId] = useToolState("mad-libs:template", "market");
  const [words, setWords] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState(false);

  const template = TEMPLATES.find((x) => x.id === templateId) ?? TEMPLATES[0];

  const changeTemplate = (id: string) => {
    setTemplateId(id);
    setWords({});
    setRevealed(false);
  };

  const setWord = (id: string, value: string) => {
    setWords((w) => ({ ...w, [id]: value }));
  };

  const filledCount = template.blanks.filter((b) => words[b.id]?.trim()).length;

  return (
    <ToolShell
      title="Mad Libs"
      khmerTitle="ល្បែងបំពេញពាក្យ"
      description="Pick a story, fill the blanks with your own words, then reveal the funny result."
      descriptionKm="ជ្រើសរើសរឿងមួយ បំពេញពាក្យតាមការស្រមៃរបស់អ្នក រួចមើលលទ្ធផលគួរឱ្យអស់សំណើច។"
    >
      <Field label={t("Story template", "រឿង")}>
        <Select
          value={templateId}
          onChange={(e) => changeTemplate(e.target.value)}
        >
          {TEMPLATES.map((x) => (
            <option key={x.id} value={x.id}>
              {t(x.titleEn, x.titleKm)}
            </option>
          ))}
        </Select>
      </Field>

      <Row>
        {template.blanks.map((b) => (
          <Field key={b.id} label={t(b.en, b.km)}>
            <TextInput value={words[b.id] ?? ""} onChange={(e) => setWord(b.id, e.target.value)} placeholder={t("Type here…", "វាយនៅទីនេះ…")} />
          </Field>
        ))}
      </Row>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={() => setRevealed(true)} disabled={filledCount < template.blanks.length}>
          {t("Reveal story", "បង្ហាញរឿង")}
        </Button>
        <button
          type="button"
          onClick={() => {
            setWords({});
            setRevealed(false);
          }}
          className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--gold)]"
        >
          {t("Clear", "សម្អាត")}
        </button>
        <span className="text-xs text-[var(--ink-dim)]">
          {filledCount}/{template.blanks.length} {t("filled", "បានបំពេញ")}
        </span>
      </div>

      {revealed && (
        <Output
          label={t("Your story", "រឿងរបស់អ្នក")}
          mono={false}
          value={t(fillStory(template.textEn, words), fillStory(template.textKm, words))}
        />
      )}
    </ToolShell>
  );
}
