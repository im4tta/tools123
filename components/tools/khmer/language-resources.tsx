"use client";
import { useMemo } from "react";
import { ExternalLink } from "lucide-react";
import { CopyButton, type CopyField } from "@/components/CopyButton";
import { ToolShell, Field, Select } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

interface Resource {
  name: string;
  category: "Fonts" | "NLP & Speech" | "Datasets & Corpora" | "Dictionaries" | "Input & Keyboards";
  desc: string;
  url: string;
}

const RESOURCES: Resource[] = [
  { name: "Noto Sans/Serif Khmer", category: "Fonts", desc: "Google's open-source Unicode Khmer typefaces, the safest baseline for web and print.", url: "https://fonts.google.com/noto/specimen/Noto+Sans+Khmer" },
  { name: "Khmer OS fonts", category: "Fonts", desc: "The long-running open Khmer font family originally funded for government/NGO use.", url: "https://www.khmertype.org" },
  { name: "Mozilla Common Voice — Khmer", category: "Datasets & Corpora", desc: "Crowd-sourced, openly licensed Khmer speech dataset for ASR/TTS training.", url: "https://commonvoice.mozilla.org/km" },
  { name: "SEALang Khmer Library", category: "Dictionaries", desc: "Digitized Khmer-English dictionaries and reference texts for Southeast Asian languages.", url: "https://sealang.net/khmer/" },
  { name: "khmer-nlp / khmer-word-segmentation projects", category: "NLP & Speech", desc: "Community tokenizers and segmenters that handle Khmer's lack of word boundaries.", url: "https://github.com/topics/khmer-nlp" },
  { name: "Hugging Face — Khmer models", category: "NLP & Speech", desc: "Open Khmer ASR, TTS, and language models shared by the community (e.g. MMS, Whisper fine-tunes).", url: "https://huggingface.co/models?language=km" },
  { name: "Unicode CLDR — Khmer locale", category: "Datasets & Corpora", desc: "Locale data (date/number formatting, collation) for the Khmer (km) locale.", url: "https://cldr.unicode.org" },
  { name: "NiDA / Khmer Unicode keyboard layouts", category: "Input & Keyboards", desc: "Standard Khmer Unicode keyboard layouts for Windows, macOS, and mobile.", url: "https://www.nida.gov.kh" },
  { name: "awesome-khmer-language", category: "NLP & Speech", desc: "A community-maintained collection of Khmer language tools, corpora, and papers.", url: "https://github.com/seanghay/awesome-khmer-language" },
  { name: "tha (ថា)", category: "NLP & Speech", desc: "A Khmer text normalization and verbalization toolkit — spells out numbers, dates, and abbreviations.", url: "https://github.com/seanghay/tha" },
  { name: "khmertagger", category: "NLP & Speech", desc: "Joint Khmer part-of-speech tagger and word segmenter, published on PyPI.", url: "https://pypi.org/project/khmertagger/" },
  { name: "khmer-unicode-converter", category: "NLP & Speech", desc: "Converts legacy Khmer fonts (Limon, ABC, etc.) to and from Unicode.", url: "https://github.com/seanghay/khmer-unicode-converter" },
  { name: "Khmer Coders community", category: "NLP & Speech", desc: "An active Cambodian developer community building open Khmer NLP, speech, and web tooling.", url: "https://github.com/seanghay/khmercoders-web" },
];

const CATEGORIES = ["All", "Fonts", "NLP & Speech", "Datasets & Corpora", "Dictionaries", "Input & Keyboards"] as const;

export default function LanguageResources() {
  const [cat, setCat] = useToolState<(typeof CATEGORIES)[number]>("language-resources:cat", "All");
  const results = useMemo(() => (cat === "All" ? RESOURCES : RESOURCES.filter((r) => r.category === cat)), [cat]);

  return (
    <ToolShell
      title="Khmer Language Resources"
      khmerTitle="ធនធានភាសាខ្មែរ"
      description="Curated jumping-off points for Khmer NLP, fonts, and open datasets — useful when starting a new Khmer-language project. Not exhaustive; treat it as a starting map rather than a full directory."
    >
      <Field label="Category">
        <Select value={cat} onChange={(e) => setCat(e.target.value as (typeof CATEGORIES)[number])}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
      </Field>
      <div className="space-y-2">
        {results.map((r) => (
          <div key={r.name} className="flex items-start gap-3 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2.5 text-sm transition hover:border-[var(--gold-dim)]">
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex-1">
              <div className="font-medium text-[var(--ink)]">{r.name}</div>
              <div className="mt-0.5 text-xs text-[var(--ink-dim)]">{r.desc}</div>
              <div className="mt-1 text-[10px] uppercase tracking-wide text-[var(--ink-faint)]">{r.category}</div>
            </a>
            <div className="mt-0.5 flex shrink-0 items-center gap-1.5">
              <CopyButton compact text={`${r.name}\n${r.desc}\n${r.url}`}
                fields={[
                  { id: "name", label: "Name", getValue: r.name },
                  { id: "desc", label: "Description", getValue: r.desc },
                  { id: "url", label: "URL", getValue: r.url },
                  { id: "category", label: "Category", getValue: r.category },
                ]}
              />
              <ExternalLink size={14} className="text-[var(--ink-faint)]" />
            </div>
          </div>
        ))}
      </div>
    </ToolShell>
  );
}
