"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { useLanguage } from "@/components/LanguageProvider";

const STOPWORDS = new Set([
  "the", "and", "for", "are", "but", "not", "you", "all", "can", "her", "was", "one", "our", "out",
  "day", "get", "has", "him", "his", "how", "man", "new", "now", "old", "see", "two", "way", "who",
  "did", "its", "let", "put", "say", "she", "too", "use", "that", "with", "have", "this", "will",
  "your", "from", "they", "know", "want", "been", "good", "much", "some", "time", "very", "when",
  "come", "here", "just", "like", "long", "make", "many", "more", "only", "over", "such", "take",
  "than", "them", "well", "were", "what", "which", "their", "there", "these", "those", "then", "also",
]);

const PALETTE = ["#0f9e8e", "#c97a1f", "#2f8f5b", "#5b7fd4", "#c94f7c", "#8a63c9", "#b8860b"];

interface Word {
  text: string;
  size: number;
  color: string;
  rot: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
}

function overlaps(a: Word, b: Word): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

const W = 860;
const H = 520;

function buildCloud(text: string, seed: number): Word[] {
  const tokens = text.toLowerCase().split(/[^\p{L}\p{N}']+/u).filter((w) => w.length >= 2 && !STOPWORDS.has(w));
  const freq = new Map<string, number>();
  for (const w of tokens) freq.set(w, (freq.get(w) ?? 0) + 1);
  const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 60);
  if (top.length === 0) return [];

  const max = top[0][1];
  const min = top[top.length - 1][1];
  let random = seed || 1;
  const rand = () => {
    random = (random * 1664525 + 1013904223) % 4294967296;
    return random / 4294967296;
  };

  const measure = document.createElement("canvas").getContext("2d");
  if (!measure) return [];

  const placed: Word[] = [];
  const words: Word[] = [];

  top.forEach(([word, count], i) => {
    const t = max === min ? 1 : (count - min) / (max - min);
    const size = Math.round(16 + t * t * 56);
    const rot = i % 4 === 3;
    measure.font = `700 ${size}px system-ui, sans-serif`;
    const width = Math.ceil(measure.measureText(word).width) + 4;
    const height = Math.ceil(size * 1.15);
    const wW = rot ? height : width;
    const wH = rot ? width : height;

    let ok = false;
    let x = W / 2 - wW / 2;
    let y = H / 2 - wH / 2;
    let angle = rand() * Math.PI * 2;
    for (let step = 1; step <= 900; step++) {
      const candidate: Word = { text: word, size, color: "#000", rot, x, y, w: wW, h: wH };
      const inside = x >= 4 && y >= 4 && x + wW <= W - 4 && y + wH <= H - 4;
      if (inside && !placed.some((r) => overlaps(candidate, r))) {
        placed.push(candidate);
        words.push({ ...candidate, color: PALETTE[Math.floor(rand() * PALETTE.length)] });
        ok = true;
        break;
      }
      angle += 0.35;
      const radius = 3 * step;
      x = W / 2 - wW / 2 + radius * Math.cos(angle) * 1.35;
      y = H / 2 - wH / 2 + radius * Math.sin(angle);
    }
    if (!ok) rand();
  });

  return words;
}

export default function WordCloud() {
  const { text: t } = useLanguage();
  const [text, setText] = useState(
    "Khmer language tools help people type, segment, and format Khmer text. Tools make Khmer typing faster and Khmer documents cleaner. Good tools for Khmer words, Khmer numbers, and Khmer dates save time every day.",
  );
  const [seed, setSeed] = useState(7);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const words = useMemo(() => buildCloud(text, seed), [text, seed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = W;
    canvas.height = H;
    ctx.clearRect(0, 0, W, H);
    ctx.textBaseline = "top";
    for (const w of words) {
      ctx.save();
      ctx.font = `700 ${w.size}px system-ui, sans-serif`;
      ctx.fillStyle = w.color;
      if (w.rot) {
        ctx.translate(w.x + w.w / 2, w.y + w.h / 2);
        ctx.rotate(Math.PI / 2);
        ctx.fillText(w.text, -w.w / 2, -w.h / 2);
      } else {
        ctx.fillText(w.text, w.x, w.y);
      }
      ctx.restore();
    }
  }, [words]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "word-cloud.png";
    a.click();
  }

  return (
    <ToolShell
      title="Word Cloud Generator"
      khmerTitle="បង្កើតពពកពាក្យ"
      description="Turn any text into a word cloud sized by word frequency — export as PNG."
      descriptionKm="បម្លែងអត្ថបទទៅជាពពកពាក្យ ដែលទំហំផ្អែកលើប្រេកង់ពាក្យ — នាំចេញជា PNG។"
    >
      <div className="space-y-4">
        <Field label={t("Your text", "អត្ថបទរបស់អ្នក")}>
          <TextArea rows={5} value={text} onChange={(e) => setText(e.target.value)} />
        </Field>

        <canvas ref={canvasRef} className="w-full rounded-xl border border-[var(--ground-line)] bg-white" />

        <div className="flex gap-2">
          <button type="button" onClick={() => setSeed((s) => s + 1)} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--ground-line)] px-5 py-3 text-sm font-semibold text-[var(--ink-dim)] transition hover:text-[var(--ink)]">
            <RefreshCw size={15} />{t("Shuffle layout", "ផ្លាស់ប្តូរបង់ចុះ")}
          </button>
          <button type="button" onClick={download} disabled={words.length === 0} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-[#0a0c0d] transition hover:bg-[var(--gold-dim)] disabled:opacity-40">
            <Download size={15} />{t("Download PNG", "ទាញយក PNG")}
          </button>
        </div>
        <p className="text-xs text-[var(--ink-faint)]">{t("Common English stop words are filtered automatically.", "ពាក្យទូទៅដែលគ្មានន័យត្រូវបានយកចេញស្វ័យប្រវត្តិ។")}</p>
      </div>
    </ToolShell>
  );
}