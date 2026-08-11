"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Settings2, Type } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

const BASE: Record<string, string> = { q: "ឆ", w: "វ", e: "េ", r: "រ", t: "ត", y: "យ", u: "ុ", i: "ិ", o: "ោ", p: "ផ", a: "ា", s: "ស", d: "ដ", f: "ថ", g: "ង", h: "ហ", j: "្", k: "ក", l: "ល", ";": "ើ", "'": "់", z: "ឋ", x: "ខ", c: "ច", v: "ឥ", b: "ប", n: "ន", m: "ម", "[": "ៀ", "]": "ឪ", "\\": "ឮ", "/": "៊", "1": "១", "2": "២", "3": "៣", "4": "៤", "5": "៥", "6": "៦", "7": "៧", "8": "៨", "9": "៩", "0": "០", "`": "«", "=": "៭" };
const SHIFT: Record<string, string> = { q: "ឈ", w: "ឝ", e: "ែ", r: "ឫ", t: "ទ", y: "ួ", u: "ូ", i: "ី", o: "ៅ", p: "ភ", a: "ាំ", s: "ឞ", d: "ឌ", f: "ធ", g: "អ", h: "ះ", j: "ញ", k: "គ", l: "ឡ", ";": "ឹ", "'": "៉", z: "ឍ", x: "ឃ", c: "ជ", v: "ឦ", b: "ព", n: "ណ", m: "ំ", "[": "ឿ", "]": "ឳ", "\\": "ឭ", "1": "!", "2": "@", "3": "#", "4": "$", "5": "%", "6": "^", "7": "&", "8": "៏", "9": "(", "0": ")", ",": "។", ".": "៕" };
const ALT: Record<string, string> = { "1": "៱", "2": "៲", "3": "៳", "4": "៴", "5": "៵", "6": "៶", "7": "៷", "8": "៸", "9": "៹", "0": "៺", "-": "៻", "=": "៼", w: "៙", e: "ឯ", r: "៚", t: "ឰ", u: "ឧ", i: "ឩ", o: "ឱ", p: "៰", a: "ឣ", s: "ឤ", d: "៟", f: "៘", g: "៝", c: "ៜ" };
const KEY_ROWS = [["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="], ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]", "\\"], ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'"], ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"]];
const SHIFT_SYMBOLS: Record<string, string> = { "`": "~", "1": "!", "2": "@", "3": "#", "4": "$", "5": "%", "6": "^", "7": "&", "8": "*", "9": "(", "0": ")", "-": "_", "=": "+", "[": "{", "]": "}", "\\": "|", ";": ":", "'": '"', ",": "<", ".": ">", "/": "?" };

function keyChar(key: string, shift: boolean, altgr: boolean) { return (altgr ? ALT[key] : shift ? SHIFT[key] : BASE[key]) ?? (shift ? SHIFT_SYMBOLS[key] ?? key.toUpperCase() : key); }
function classify(char: string) { const c = char.charCodeAt(0); if (c >= 0x1780 && c <= 0x17a2) return "Consonant"; if (c >= 0x17a3 && c <= 0x17b3) return "Independent Vowel"; if (c >= 0x17b6 && c <= 0x17c5) return "Dependent Vowel"; if (c >= 0x17c6 && c <= 0x17d3) return "Diacritic / Coeng"; if (c >= 0x17e0 && c <= 0x17e9) return "Numeral"; return "Other"; }
function codepoint(char: string) { return `U+${char.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0")}`; }

export default function KhmerKeyboardVisualizer() {
  const { text: t } = useLanguage();
  const [sample, setSample] = useToolState("kkv:sample", "កម្ពុជាឯករាជ្យ");
  const [shift, setShift] = useState(false);
  const [altgr, setAltgr] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [last, setLast] = useState<{ key: string; output: string } | null>(null);

  const handleKey = useCallback((event: KeyboardEvent) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    setActive(event.code);
    if (event.key === "Shift") setShift(true);
    if (event.code === "AltRight") setAltgr(true);
    if (BASE[key] || SHIFT[key] || ALT[key]) setLast({ key: event.key, output: keyChar(key, event.shiftKey, event.getModifierState("AltGraph") || event.code === "AltRight" || altgr) });
    window.setTimeout(() => setActive(null), 140);
  }, [altgr]);
  useEffect(() => { const up = (event: KeyboardEvent) => { if (event.key === "Shift") setShift(false); if (event.code === "AltRight") setAltgr(false); }; window.addEventListener("keyup", up); return () => window.removeEventListener("keyup", up); }, []);
  useEffect(() => { window.addEventListener("keydown", handleKey); return () => window.removeEventListener("keydown", handleKey); }, [handleKey]);

  const generateSequence = (text: string) => Array.from(text).map((char, index) => {
    const alt = Object.keys(ALT).find((key) => ALT[key] === char);
    const base = Object.keys(BASE).find((key) => BASE[key] === char);
    const shifted = Object.keys(SHIFT).find((key) => SHIFT[key] === char);
    return { char, key: alt ?? shifted ?? base ?? char, shift: !alt && Boolean(shifted), alt: Boolean(alt), id: `${index}-${char}` };
  });

  const graphemes = useMemo(() => { try { return Array.from(new Intl.Segmenter("km", { granularity: "grapheme" }).segment(sample)).map((x) => x.segment); } catch { return Array.from(sample); } }, [sample]);

  return <ToolShell title="Khmer Keyboard Visualizer" khmerTitle="ឧបករណ៍បង្ហាញក្តារចុចខ្មែរ" description="Interactive Khmer NiDA keyboard reference, modifier viewer, Unicode inspector, and keystroke sequence simulator." descriptionKm="មើលក្តារចុចខ្មែរ NiDA បែបអន្តរកម្ម ពិនិត្យគ្រាប់ចុច សញ្ញា Unicode និងលំដាប់វាយអក្សរ។">
    <div className="space-y-5">
      <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-semibold text-[var(--ink)]"><Settings2 size={16} className="text-[var(--gold)]" />{t("Khmer Standard (NiDA)", "ខ្មែរស្ដង់ដារ (NiDA)")}</h2><div className="flex gap-2"><span className={`rounded-md px-2 py-1 text-xs font-bold ${shift ? "bg-[var(--gold)]/15 text-[var(--gold)]" : "bg-[var(--ground)] text-[var(--ink-faint)]"}`}>SHIFT {shift ? "ON" : "OFF"}</span><span className={`rounded-md px-2 py-1 text-xs font-bold ${altgr ? "bg-pink-500/15 text-pink-500" : "bg-[var(--ground)] text-[var(--ink-faint)]"}`}>ALTGR {altgr ? "ON" : "OFF"}</span><button onClick={() => setShift(!shift)} className="rounded-md border border-[var(--ground-line)] px-2 py-1 text-xs text-[var(--ink-dim)]">Shift</button><button onClick={() => setAltgr(!altgr)} className="rounded-md border border-[var(--ground-line)] px-2 py-1 text-xs text-[var(--ink-dim)]">AltGr</button></div></div>
        <div className="overflow-x-auto rounded-xl border border-[var(--ground-line)] bg-[var(--ground)] p-4"><div className="mx-auto min-w-[700px] max-w-5xl space-y-2">{KEY_ROWS.map((row, ri) => <div key={ri} className="flex justify-center gap-1.5">{row.map((key) => <button key={key} type="button" onClick={() => setLast({ key, output: keyChar(key, shift, altgr) })} className={`relative flex h-12 min-w-10 flex-col items-center justify-center rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] text-sm font-bold text-[var(--ink)] transition ${active === `Key${key.toUpperCase()}` ? "scale-95 border-[var(--gold)] bg-[var(--gold)]/20" : "hover:border-[var(--gold)]/40"}`}><span className={altgr ? "text-pink-500" : ""}>{keyChar(key, shift, altgr)}</span><span className="absolute bottom-0.5 left-1 text-[9px] text-[var(--ink-faint)]">{altgr ? "AltGr+" + key : shift ? SHIFT_SYMBOLS[key] ?? key.toUpperCase() : key}</span></button>)}</div>)}<div className="flex justify-center pt-1"><div className="h-10 w-64 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] text-center text-[10px] leading-10 text-[var(--ink-faint)]">Space</div></div></div></div>
      </div>

      <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5"><h2 className="mb-3 flex items-center gap-2 font-semibold text-[var(--ink)]"><Search size={16} className="text-[var(--gold)]" />{t("Key Inspector", "ពិនិត្យគ្រាប់ចុច")}</h2>{last ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><div className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] p-4 text-center"><div className="font-khmer text-4xl text-[var(--gold)]">{last.output}</div><div className="mt-1 text-[10px] text-[var(--ink-faint)]">{t("Khmer output", "លទ្ធផលខ្មែរ")}</div></div><div className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] p-4"><div className="text-[10px] text-[var(--ink-faint)]">{t("Latin key", "គ្រាប់ឡាតាំង")}</div><div className="mt-2 font-mono-ui text-xl font-bold text-[var(--ink)]">{last.key}</div></div><div className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] p-4"><div className="text-[10px] text-[var(--ink-faint)]">Unicode</div><div className="mt-2 font-mono-ui text-xl font-bold text-[var(--gold)]">{codepoint(last.output)}</div></div></div> : <div className="rounded-lg border border-dashed border-[var(--ground-line)] p-6 text-center text-xs text-[var(--ink-faint)]">{t("Press a key to inspect it", "ចុចគ្រាប់ចុចដើម្បីពិនិត្យ")}</div>}</div>

      <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5"><h2 className="mb-1 flex items-center gap-2 font-semibold text-[var(--ink)]"><Type size={16} className="text-[var(--gold)]" />{t("Keystroke Sequence Simulator", "កម្មវិធីក្លែងការវាយអក្សរ")}</h2><p className="mb-3 text-xs text-[var(--ink-faint)]">{t("Type Khmer text to inspect graphemes and NiDA keys, including AltGr.", "វាយអត្ថបទខ្មែរដើម្បីមើលតួអក្សរ និងគ្រាប់ចុច NiDA រួមទាំង AltGr។")}</p><input value={sample} onChange={(e) => setSample(e.target.value)} className="mb-4 w-full rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] px-3 py-3 font-khmer text-xl text-[var(--ink)] outline-none focus:border-[var(--gold-dim)]" /><div className="flex flex-wrap gap-2">{generateSequence(sample).map((item) => <div key={item.id} className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] p-2 text-center"><div className="font-khmer text-xl text-[var(--ink)]">{item.char}</div><div className="mt-1 rounded bg-[var(--ground-raised)] px-2 py-0.5 font-mono-ui text-[10px] text-[var(--gold)]">{item.alt ? "AltGr+" : item.shift ? "Shift+" : ""}{item.key}</div><div className="text-[9px] text-[var(--ink-faint)]">{codepoint(item.char)} · {classify(item.char)}</div></div>)}</div><div className="mt-3 text-xs text-[var(--ink-faint)]">{graphemes.length} grapheme clusters detected</div></div>
    </div>
  </ToolShell>;
}
