"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Square } from "lucide-react";
import { ToolShell, Field, Select, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
const MINOR_INTERVALS = [0, 2, 3, 5, 7, 8, 10];

type Quality = "maj" | "min" | "dim" | "dom7";

const CHORD_INTERVALS: Record<Quality, number[]> = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
  dom7: [0, 4, 7, 10],
};

const ROMAN_VALUES: Record<string, number> = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7 };

/** Parses a roman-numeral chord symbol into a scale degree (0–6) and quality. */
function parseDegree(sym: string): { degree: number; quality: Quality } | null {
  const m = sym.toLowerCase().match(/^(vii|vi|v|iv|iii|ii|i)(7|o|°)?$/);
  if (!m || !(m[1] in ROMAN_VALUES)) return null;
  const suffix = m[2] ?? "";
  let quality: Quality;
  if (suffix === "7") quality = "dom7";
  else if (suffix === "o" || suffix === "°") quality = "dim";
  else quality = /^[A-Z]/.test(sym) ? "maj" : "min";
  return { degree: ROMAN_VALUES[m[1]] - 1, quality };
}

interface Progression {
  id: string;
  label: string;
  labelKm: string;
  chords: string[];
  scale: "major" | "minor";
}

const PROGRESSIONS: Progression[] = [
  { id: "i-iv-v", label: "I–IV–V–I", labelKm: "I–IV–V–I", chords: ["I", "IV", "V", "I"], scale: "major" },
  { id: "i-v-vi-iv", label: "I–V–vi–IV", labelKm: "I–V–vi–IV", chords: ["I", "V", "vi", "IV"], scale: "major" },
  { id: "ii-v-i", label: "ii–V–I", labelKm: "ii–V–I", chords: ["ii", "V", "I"], scale: "major" },
  { id: "vi-iv-i-v", label: "vi–IV–I–V", labelKm: "vi–IV–I–V", chords: ["vi", "IV", "I", "V"], scale: "major" },
  { id: "12-bar", label: "12-bar blues (I–IV–V)", labelKm: "12-bar blues (I–IV–V)", chords: ["I", "I", "I", "I", "IV", "IV", "I", "I", "V", "IV", "I", "I"], scale: "major" },
  { id: "canon", label: "Canon (I–V–vi–iii–IV–I–IV–V)", labelKm: "Canon (I–V–vi–iii–IV–I–IV–V)", chords: ["I", "V", "vi", "iii", "IV", "I", "IV", "V"], scale: "major" },
  { id: "min-i-iv-v", label: "i–iv–v–i", labelKm: "i–iv–v–i", chords: ["i", "iv", "v", "i"], scale: "minor" },
  { id: "min-i-vi-iii-vii", label: "i–VI–III–VII", labelKm: "i–VI–III–VII", chords: ["i", "VI", "III", "VII"], scale: "minor" },
  { id: "min-iid-v-i", label: "ii°–V–i", labelKm: "ii°–V–i", chords: ["ii°", "V", "i"], scale: "minor" },
  { id: "andalusian", label: "Andalusian cadence (i–VII–VI–V)", labelKm: "Andalusian cadence (i–VII–VI–V)", chords: ["i", "VII", "VI", "V"], scale: "minor" },
];

export default function ChordProgressionGenerator() {
  const { text: t } = useLanguage();
  const [keyName, setKeyName] = useToolState("chord-progression:key", "C");
  const [scaleName, setScaleName] = useToolState("chord-progression:scale", "major");
  const [progId, setProgId] = useToolState("chord-progression:prog", "i-v-vi-iv");
  const [playing, setPlaying] = useState(false);
  const playRef = useRef<{ nodes: { osc: OscillatorNode; gain: GainNode }[]; timer: number } | null>(null);

  const available = PROGRESSIONS.filter((p) => p.scale === scaleName);
  const progression = available.find((p) => p.id === progId) ?? available[0];

  const chords = useMemo(() => {
    const current =
      PROGRESSIONS.find((p) => p.id === progId && p.scale === scaleName) ??
      PROGRESSIONS.find((p) => p.scale === scaleName) ??
      PROGRESSIONS[0];
    const keyIdx = NOTES.indexOf(keyName);
    if (keyIdx < 0) return [];
    const intervals = scaleName === "minor" ? MINOR_INTERVALS : MAJOR_INTERVALS;
    const scaleNotes = intervals.map((semi) => NOTES[(keyIdx + semi) % 12]);
    return current.chords.map((sym) => {
      const parsed = parseDegree(sym);
      if (!parsed) return [];
      const rootIdx = NOTES.indexOf(scaleNotes[parsed.degree]);
      return CHORD_INTERVALS[parsed.quality].map((semi) => NOTES[(rootIdx + semi) % 12]);
    });
  }, [keyName, scaleName, progId]);

  const noteFreq = (note: string) => {
    const midi = 60 + (NOTES.indexOf(note) - 9);
    return 440 * Math.pow(2, (midi - 69) / 12);
  };

  const stop = () => {
    if (!playRef.current) return;
    const { nodes, timer } = playRef.current;
    window.clearTimeout(timer);
    for (const { osc, gain } of nodes) {
      try {
        osc.stop();
      } catch {
        // already stopped
      }
      osc.disconnect();
      gain.disconnect();
    }
    playRef.current = null;
    setPlaying(false);
  };

  const play = () => {
    stop();
    if (chords.length === 0 || chords.some((c) => c.length === 0)) return;
    const ctx = new AudioContext();
    const t0 = ctx.currentTime + 0.05;
    const chordDur = 1.0;
    const nodes: { osc: OscillatorNode; gain: GainNode }[] = [];
    chords.forEach((chord, ci) => {
      const start = t0 + ci * chordDur;
      chord.forEach((note, ni) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = noteFreq(note);
        const at = start + ni * 0.05;
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(0.16, at + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, at + chordDur - 0.06);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(at);
        osc.stop(at + chordDur);
        nodes.push({ osc, gain: g });
      });
    });
    const timer = window.setTimeout(() => {
      try {
        void ctx.close();
      } catch {
        // already closed
      }
      playRef.current = null;
      setPlaying(false);
    }, Math.round((t0 - ctx.currentTime + chords.length * chordDur) * 1000) + 300);
    playRef.current = { nodes, timer };
    setPlaying(true);
  };

  useEffect(
    () => () => {
      if (!playRef.current) return;
      window.clearTimeout(playRef.current.timer);
      for (const { osc, gain } of playRef.current.nodes) {
        try {
          osc.stop();
        } catch {
          // already stopped
        }
        osc.disconnect();
        gain.disconnect();
      }
    },
    []
  );

  return (
    <ToolShell
      title="Chord Progression Generator"
      khmerTitle="បង្កើតលំដាប់អង្កត់ធ្នូ"
      description="Pick a key and scale, choose a common progression, and see the triads spelled out with note names — with optional in-browser playback."
      descriptionKm="ជ្រើសរើស key និង scale ជ្រើសលំដាប់អង្កត់ធ្នូធម្មតា រួចមើល triads ជាឈ្មោះសម្លេង — ជាមួយការលេងក្នុងកម្មវិធីរុករកដោយស្រេចចិត្ត។"
    >
      <Row>
        <Field label={t("Key", "Key")}>
          <Select value={keyName} onChange={(e) => setKeyName(e.target.value)}>
            {NOTES.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </Select>
        </Field>
        <Field label={t("Scale", "Scale")}>
          <Select
            value={scaleName}
            onChange={(e) => {
              setScaleName(e.target.value);
              const first = PROGRESSIONS.find((p) => p.scale === e.target.value);
              if (first) setProgId(first.id);
            }}
          >
            <option value="major">{t("Major (Ionian)", "Major (Ionian)")}</option>
            <option value="minor">{t("Minor (Aeolian)", "Minor (Aeolian)")}</option>
          </Select>
        </Field>
      </Row>
      <Field label={t("Progression", "លំដាប់អង្កត់ធ្នូ")}>
        <Select value={progression.id} onChange={(e) => setProgId(e.target.value)}>
          {available.map((p) => (
            <option key={p.id} value={p.id}>{t(p.label, p.labelKm)}</option>
          ))}
        </Select>
      </Field>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {progression.chords.map((sym, i) => (
          <div key={`${sym}-${i}`} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-center">
            <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--gold)]">{sym}</div>
            <div className="mt-1 font-mono-ui text-sm text-[var(--ink)]">{(chords[i] ?? []).join(" · ") || "—"}</div>
          </div>
        ))}
      </div>

      {playing ? (
        <Button type="button" onClick={stop} className="w-full">
          <Square size={15} className="mr-1 inline" />
          {t("Stop", "បញ្ឈប់")}
        </Button>
      ) : (
        <Button type="button" onClick={play} className="w-full">
          <Play size={15} className="mr-1 inline" />
          {t("Play progression", "លេងលំដាប់អង្កត់ធ្នូ")}
        </Button>
      )}

      <p className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-xs leading-relaxed text-[var(--ink-dim)]">
        {t(
          "These progressions are common practice examples — not an exhaustive list. Chords are built as triads (and dominant sevenths where marked) on the chosen scale; note names use sharps (e.g. C#). Playback is synthesized in your browser with the Web Audio API.",
          "លំដាប់ទាំងនេះជាឧទាហរណ៍ទម្លាប់ធម្មតា — មិនមែនជាបញ្ជីពេញលេញទេ។ អង្កត់ធ្នូត្រូវបានបង្កើតជា triads (និង dominant sevenths ដែលមានសញ្ញាសម្គាល់) លើ scale ដែលបានជ្រើសរើស; ឈ្មោះសម្លេងប្រើសញ្ញា sharp (ឧ. C#)។ ការលេងត្រូវបានសំយោគក្នុងកម្មវិធីរុករករបស់អ្នកជាមួយ Web Audio API។"
        )}
      </p>
    </ToolShell>
  );
}
