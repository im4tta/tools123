"use client";
import { useMemo } from "react";
import { ExternalLink } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import { ToolShell, Field, Select, TextInput } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

interface ModelEntry {
  name: string;
  task: "Speech-to-Text" | "Text-to-Speech" | "Translation" | "OCR" | "Language Model" | "Tokenization & POS" | "Text Normalization" | "Embeddings";
  desc: string;
  url: string;
  author: string;
}

const MODELS: ModelEntry[] = [
  { name: "whisper-tiny-khmer", task: "Speech-to-Text", desc: "Whisper tiny checkpoint fine-tuned for Khmer speech recognition.", url: "https://github.com/sengtha/whisper-tiny-khmer", author: "sengtha" },
  { name: "whisper-small-khmer-v2", task: "Speech-to-Text", desc: "A larger Whisper checkpoint fine-tuned on Khmer audio for better accuracy.", url: "https://github.com/seanghay/whisper-small-khmer-v2", author: "seanghay" },
  { name: "Qwen3-ASR-0.6B-Khmer", task: "Speech-to-Text", desc: "Qwen3-based compact ASR model adapted for Khmer transcription.", url: "https://github.com/seanghay/Qwen3-ASR-0.6B-Khmer", author: "seanghay" },
  { name: "w2v-bert-2.0-khmer", task: "Speech-to-Text", desc: "Wav2Vec2-BERT 2.0 encoder fine-tuned for Khmer speech tasks.", url: "https://github.com/seanghay/w2v-bert-2.0-khmer", author: "seanghay" },
  { name: "wav2vec2-base-khmer-phonetisaurus", task: "Speech-to-Text", desc: "Wav2Vec2 base model paired with Phonetisaurus for Khmer phoneme-level recognition.", url: "https://github.com/seanghay/wav2vec2-base-khmer-phonetisaurus", author: "seanghay" },
  { name: "khmer-tts-female-v2", task: "Text-to-Speech", desc: "A female-voice Khmer text-to-speech model, second iteration.", url: "https://github.com/sengtha/khmer-tts-female-v2", author: "sengtha" },
  { name: "voxcpm2-server", task: "Text-to-Speech", desc: "Server wrapper around VoxCPM2 for serving Khmer-capable speech synthesis.", url: "https://github.com/seanghay/voxcpm2-server", author: "seanghay" },
  { name: "gemini-khmer-translator", task: "Translation", desc: "Pipeline using Gemini 2.5/3.1 TTS to translate English videos into Khmer voice-overs with timed WebVTT subtitles.", url: "https://github.com/sengtha/gemini-khmer-translator", author: "sengtha" },
  { name: "marian-khmer-english", task: "Translation", desc: "MarianMT model translating Khmer text into English.", url: "https://github.com/seanghay/marian-khmer-english", author: "seanghay" },
  { name: "marian-english-khmer", task: "Translation", desc: "MarianMT model translating English text into Khmer.", url: "https://github.com/seanghay/marian-english-khmer", author: "seanghay" },
  { name: "khmer-ocr", task: "OCR", desc: "Optical character recognition model targeting printed and scanned Khmer script.", url: "https://github.com/sengtha/khmer-ocr", author: "sengtha" },
  { name: "KhmerOCR", task: "OCR", desc: "A fast optical character recognition model built specifically for Khmer script.", url: "https://github.com/seanghay/KhmerOCR", author: "seanghay" },
  { name: "Qwen3-0.6B-khm-ft3", task: "Language Model", desc: "Qwen3 0.6B fine-tuned for Khmer text generation and understanding.", url: "https://github.com/sengtha/Qwen3-0.6B-khm-ft3", author: "sengtha" },
  { name: "Qwen3-0.6B-khm-ft3-Q8_0-GGUF", task: "Language Model", desc: "Quantized GGUF build of the Khmer-tuned Qwen3 0.6B model for local/offline inference.", url: "https://github.com/sengtha/Qwen3-0.6B-khm-ft3-Q8_0-GGUF", author: "sengtha" },
  { name: "iany-khmer-tiny-v1-ONNX", task: "Language Model", desc: "ONNX-exported tiny Khmer language model for on-device inference.", url: "https://github.com/sengtha/iany-khmer-tiny-v1-ONNX", author: "sengtha" },
  { name: "albert-khmer-small", task: "Language Model", desc: "Small ALBERT encoder pre-trained on Khmer text.", url: "https://github.com/seanghay/albert-khmer-small", author: "seanghay" },
  { name: "roberta-khmer-tiny", task: "Language Model", desc: "Tiny RoBERTa encoder pre-trained on Khmer text for lightweight downstream tasks.", url: "https://github.com/seanghay/roberta-khmer-tiny", author: "seanghay" },
  { name: "roberta-khmer-small", task: "Language Model", desc: "Small RoBERTa encoder pre-trained on Khmer text.", url: "https://github.com/seanghay/roberta-khmer-small", author: "seanghay" },
  { name: "xlm-roberta-khmer-small", task: "Language Model", desc: "Small XLM-RoBERTa variant adapted with Khmer vocabulary.", url: "https://github.com/seanghay/xlm-roberta-khmer-small", author: "seanghay" },
  { name: "xlm-roberta-khmer-32k-tokenizer", task: "Tokenization & POS", desc: "A 32k-vocabulary XLM-RoBERTa tokenizer trained for Khmer subword segmentation.", url: "https://github.com/seanghay/xlm-roberta-khmer-32k-tokenizer", author: "seanghay" },
  { name: "khmer-pos-roberta", task: "Tokenization & POS", desc: "RoBERTa-based part-of-speech tagger for Khmer.", url: "https://github.com/seanghay/khmer-pos-roberta", author: "seanghay" },
  { name: "khmertagger", task: "Tokenization & POS", desc: "Joint Khmer part-of-speech tagger and word segmenter, published on PyPI.", url: "https://pypi.org/project/khmertagger/", author: "seanghay" },
  { name: "khmer-sentence-segmentation", task: "Tokenization & POS", desc: "Splits raw Khmer text into sentence units, handling the script's lack of clear boundaries.", url: "https://github.com/seanghay/khmer-sentence-segmentation", author: "seanghay" },
  { name: "khmer-forced-aligner", task: "Tokenization & POS", desc: "Aligns Khmer transcripts to audio at word/phoneme level.", url: "https://github.com/seanghay/khmer-forced-aligner", author: "seanghay" },
  { name: "khmer-g2p", task: "Tokenization & POS", desc: "Grapheme-to-phoneme conversion for Khmer, useful for TTS front-ends.", url: "https://github.com/seanghay/khmer-g2p", author: "seanghay" },
  { name: "tha (ថា)", task: "Text Normalization", desc: "A Khmer text normalization and verbalization toolkit (numbers, dates, abbreviations spoken out).", url: "https://github.com/seanghay/tha", author: "seanghay" },
  { name: "khmer-punctuation-restore", task: "Text Normalization", desc: "Restores punctuation in unpunctuated Khmer text, e.g. after ASR output.", url: "https://github.com/seanghay/khmer-punctuation-restore", author: "seanghay" },
  { name: "khmer-fast-fix", task: "Text Normalization", desc: "Quick fixes for common Khmer Unicode encoding and rendering issues.", url: "https://github.com/seanghay/khmer-fast-fix", author: "seanghay" },
  { name: "khmernumber", task: "Text Normalization", desc: "Converts between Khmer number words and digits.", url: "https://github.com/seanghay/khmernumber", author: "seanghay" },
  { name: "khmerpronounce", task: "Text Normalization", desc: "Generates approximate pronunciation guides for Khmer words.", url: "https://github.com/seanghay/khmerpronounce", author: "seanghay" },
  { name: "khmer-unicode-converter", task: "Text Normalization", desc: "Converts legacy Khmer fonts (Limon, ABC, etc.) to and from Unicode.", url: "https://github.com/seanghay/khmer-unicode-converter", author: "seanghay" },
  { name: "betterkhmer", task: "Text Normalization", desc: "A regex-free, fast Khmer text encoding normalizer, with the same approach ported to 18 other languages.", url: "https://github.com/seanghay/betterkhmer", author: "seanghay" },
];

const TASKS = ["All", "Speech-to-Text", "Text-to-Speech", "Translation", "OCR", "Language Model", "Tokenization & POS", "Text Normalization", "Embeddings"] as const;

export default function NlpModelDirectory() {
  const [task, setTask] = useToolState<(typeof TASKS)[number]>("nlp-model-directory:task", "All");
  const [query, setQuery] = useToolState("nlp-model-directory:query", "");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MODELS.filter((m) => {
      const matchesTask = task === "All" || m.task === task;
      const matchesQuery = !q || m.name.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q) || m.author.toLowerCase().includes(q);
      return matchesTask && matchesQuery;
    });
  }, [task, query]);

  return (
    <ToolShell
      title="Khmer NLP & Speech Model Directory"
      khmerTitle="ថតលិបិក្រមម៉ូដែល AI ភាសាខ្មែរ"
      description="A browsable directory of open Khmer AI models — ASR, TTS, translation, OCR, and language models — pulled from active Cambodian ML developers. Not exhaustive; a starting map for anyone building Khmer-language AI."
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Task">
          <Select value={task} onChange={(e) => setTask(e.target.value as (typeof TASKS)[number])}>
            {TASKS.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </Field>
        <Field label="Search">
          <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Model name, author, keyword…" />
        </Field>
      </div>
      <div className="space-y-2">
        {results.length === 0 && (
          <div className="py-8 text-center text-sm text-[var(--ink-faint)]">No models match that filter.</div>
        )}
        {results.map((m) => (
          <div key={m.name} className="flex items-start gap-3 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2.5 text-sm transition hover:border-[var(--gold-dim)]">
            <a href={m.url} target="_blank" rel="noopener noreferrer" className="flex-1">
              <div className="font-medium text-[var(--ink)]">{m.name}</div>
              <div className="mt-0.5 text-xs text-[var(--ink-dim)]">{m.desc}</div>
              <div className="mt-1 text-[10px] uppercase tracking-wide text-[var(--ink-faint)]">{m.task} · @{m.author}</div>
            </a>
            <div className="mt-0.5 flex shrink-0 items-center gap-1.5">
              <CopyButton compact text={`${m.name}\n${m.desc}\n${m.url}`}
                fields={[
                  { id: "name", label: "Name", getValue: m.name },
                  { id: "desc", label: "Description", getValue: m.desc },
                  { id: "url", label: "URL", getValue: m.url },
                  { id: "task", label: "Task", getValue: m.task },
                  { id: "author", label: "Author", getValue: m.author },
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
