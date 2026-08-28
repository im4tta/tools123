"use client";
import { useEffect, useRef, useState } from "react";
import { ToolShell, Field } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useLanguage } from "@/components/LanguageProvider";

const MIDI_START = 60; // C4
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const noteName = (m: number) => `${NOTE_NAMES[m % 12]}${Math.floor(m / 12) - 1}`;
const midiFreq = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

// Computer key → note index (0 = C4 … 23 = B5).
const KEYMAP: Record<string, number> = {
  a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11,
  k: 12, o: 13, l: 14, p: 15, ";": 16, "'": 17, z: 18, x: 19, c: 20, v: 21, b: 22, n: 23,
};
const KEY_LETTERS: string[] = [];
for (const [k, v] of Object.entries(KEYMAP)) KEY_LETTERS[v] = k;

const CHORDS: { name: string; offsets: number[] }[] = [
  { name: "C", offsets: [0, 4, 7] },
  { name: "D", offsets: [2, 6, 9] },
  { name: "E", offsets: [4, 8, 11] },
  { name: "F", offsets: [5, 9, 12] },
  { name: "G", offsets: [7, 11, 14] },
  { name: "A", offsets: [9, 13, 16] },
  { name: "B", offsets: [11, 15, 18] },
  { name: "Am", offsets: [9, 12, 16] },
  { name: "Em", offsets: [4, 7, 11] },
  { name: "Dm", offsets: [2, 5, 9] },
  { name: "Bm", offsets: [11, 14, 18] },
  { name: "G7", offsets: [7, 11, 14, 17] },
];

const WHITE = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23];
const BLACK = [1, 3, 6, 8, 10, 13, 15, 18, 20, 22];
const WHITE_PCT = 100 / WHITE.length;

type ActiveNote = { osc: OscillatorNode; gain: GainNode; released: boolean };

export default function VirtualPianoTool() {
  const { text: t } = useLanguage();
  const [sustain, setSustain] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const ctxRef = useRef<AudioContext | null>(null);
  const activeRef = useRef<Map<number, ActiveNote>>(new Map());
  const sustainRef = useRef(false);

  function getCtx() {
    if (!ctxRef.current) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctxRef.current = new Ctx();
    }
    return ctxRef.current;
  }

  function noteOn(index: number) {
    const ctx = getCtx();
    if (ctx.state === "suspended") void ctx.resume();
    if (activeRef.current.has(index)) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = midiFreq(MIDI_START + index);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.012);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    activeRef.current.set(index, { osc, gain, released: false });
  }

  function stopEntry(entry: ActiveNote, ctx: AudioContext) {
    const time = ctx.currentTime;
    entry.gain.gain.cancelScheduledValues(time);
    entry.gain.gain.setValueAtTime(Math.max(entry.gain.gain.value, 0.0001), time);
    entry.gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
    entry.osc.stop(time + 0.15);
  }

  function noteOff(index: number) {
    const entry = activeRef.current.get(index);
    if (!entry) return;
    entry.released = true;
    if (!sustainRef.current && ctxRef.current) {
      stopEntry(entry, ctxRef.current);
      activeRef.current.delete(index);
    }
  }

  function toggleSustain() {
    sustainRef.current = !sustainRef.current;
    setSustain(sustainRef.current);
    if (!sustainRef.current && ctxRef.current) {
      for (const [index, entry] of activeRef.current) {
        if (entry.released) {
          stopEntry(entry, ctxRef.current);
          activeRef.current.delete(index);
        }
      }
    }
  }

  function playChord(offsets: number[]) {
    const ctx = getCtx();
    if (ctx.state === "suspended") void ctx.resume();
    const t0 = ctx.currentTime;
    for (const off of offsets) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = midiFreq(MIDI_START + off);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.16, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 2.2);
    }
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const index: number | undefined = KEYMAP[e.key.toLowerCase()];
      if (index === undefined) return;
      e.preventDefault();
      if (!e.repeat) noteOn(index);
    }
    function onKeyUp(e: KeyboardEvent) {
      const index: number | undefined = KEYMAP[e.key.toLowerCase()];
      if (index === undefined) return;
      e.preventDefault();
      noteOff(index);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      void ctxRef.current?.close();
    },
    []
  );

  const selectedChord = selected ? CHORDS.find((c) => c.name === selected) : null;

  return (
    <ToolShell
      title="Virtual Piano & Chords"
      khmerTitle="ព្យាណូ និង Chord"
      description="A two-octave synth piano (C4–B5) you can play with the mouse or the computer keyboard, plus a small dictionary of common chords that shows and plays their notes."
      descriptionKm="ព្យាណូសំយោគពីរ octave (C4–B5) លេងបានដោយកណ្ដុរ ឬក្ដារចុច រួមជាមួយវចនានុក្រម chord ទូទៅមួយចំនួនដែលបង្ហាញ និងលេងសម្លេងរបស់វា។"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={toggleSustain} className={sustain ? "" : "!bg-[var(--ground-raised)] !text-[var(--ink-dim)]"}>
          {t("Sustain", "រក្សាសំឡេង")} {sustain ? t("ON", "បើក") : t("OFF", "បិទ")}
        </Button>
        <p className="text-xs text-[var(--ink-dim)]">
          {t("Keyboard: a w s e d f t g y h u j k o l p ; ' z x c v b n", "ក្ដារចុច៖ a w s e d f t g y h u j k o l p ; ' z x c v b n")}
        </p>
      </div>

      <div className="relative flex select-none">
        {WHITE.map((idx) => (
          <div
            key={idx}
            onPointerDown={() => noteOn(idx)}
            onPointerUp={() => noteOff(idx)}
            onPointerLeave={() => noteOff(idx)}
            onPointerCancel={() => noteOff(idx)}
            className="relative z-0 flex h-40 flex-1 cursor-pointer items-end justify-center rounded-b-md border border-[var(--ground-line)] bg-white pb-2 text-xs font-medium text-black/50 active:bg-[var(--gold)]"
          >
            <span className="pointer-events-none">{noteName(MIDI_START + idx)}</span>
            <span className="pointer-events-none ml-1 text-black/30">{KEY_LETTERS[idx]}</span>
          </div>
        ))}
        {BLACK.map((idx) => {
          const before = WHITE.filter((w) => w < idx).length;
          return (
            <div
              key={idx}
              onPointerDown={() => noteOn(idx)}
              onPointerUp={() => noteOff(idx)}
              onPointerLeave={() => noteOff(idx)}
              onPointerCancel={() => noteOff(idx)}
              className="absolute top-0 z-10 flex h-24 cursor-pointer items-end justify-center rounded-b-md bg-black pb-1 text-[10px] font-medium text-white/60 active:bg-[var(--gold)]"
              style={{ left: `calc(${before * WHITE_PCT}% - 3.2%)`, width: "6.4%" }}
            >
              <span className="pointer-events-none">{KEY_LETTERS[idx]}</span>
            </div>
          );
        })}
      </div>

      <Field label={t("Chords", "Chord")}>
        <div className="flex flex-wrap gap-2 pt-1">
          {CHORDS.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => {
                setSelected(c.name);
                playChord(c.offsets);
              }}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                selected === c.name
                  ? "border-[var(--gold)] bg-[var(--gold)] text-[#0a0c0d]"
                  : "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink)] hover:border-[var(--gold)]"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </Field>

      {selectedChord && (
        <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 font-khmer text-sm leading-relaxed text-[var(--ink)]">
          {t("Chord notes", "សម្លេងនៃ Chord")}: <span className="font-mono-ui">{selectedChord.name} = {selectedChord.offsets.map((o) => noteName(MIDI_START + o)).join(" ")}</span>
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-[var(--ink-dim)]">
        {t(
          "A simple Web Audio oscillator synth — all sound is generated locally in your browser, nothing is uploaded.",
          "សំយោគសម្លេងសាមញ្ញដោយ Web Audio — សម្លេងទាំងអស់ត្រូវបានបង្កើតក្នុងកម្មវិធីរុករករបស់អ្នក គ្មានអ្វីត្រូវបានផ្ទុកឡើយ។"
        )}
      </p>
    </ToolShell>
  );
}
