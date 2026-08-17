"use client";
import { ToolShell } from "@/components/ui/Shell";
import { useLanguage } from "@/components/LanguageProvider";

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function freqOf(note: string, octave: number): number {
  const semitone = NOTES.indexOf(note) - 9 + (octave + 1) * 12;
  return 440 * Math.pow(2, semitone / 12);
}

export default function NoteFrequency() {
  const { text: t } = useLanguage();

  return (
    <ToolShell
      title="Note Frequency Table"
      khmerTitle="តារាងប្រេកង់សម្លេង"
      description="Reference table of musical note frequencies across octaves."
      descriptionKm="តារាងយោងប្រេកង់សម្លេងតន្ត្រីតាមគ្រប់ octave។"
    >
      <div className="overflow-x-auto rounded-md border border-[var(--ground-line)]">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[var(--ground-raised)] text-left text-xs uppercase tracking-wide text-[var(--ink-dim)]">
              <th className="px-3 py-2">{t("Note", "សម្លេង")}</th>
              {[1, 2, 3, 4, 5, 6, 7].map((o) => (
                <th key={o} className="px-3 py-2 text-right">
                  {o}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {NOTES.map((n) => (
              <tr key={n} className="border-t border-[var(--ground-line)]">
                <td className="px-3 py-1.5 font-mono-ui font-semibold text-[var(--ink)]">{n}</td>
                {[1, 2, 3, 4, 5, 6, 7].map((o) => (
                  <td key={o} className="px-3 py-1.5 text-right font-mono-ui text-[var(--ink-dim)]">
                    {freqOf(n, o).toFixed(2)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-[var(--ink-faint)]">
        {t("A4 = 440 Hz (concert pitch).", "A4 = 440 Hz (សម្លេងស្ដង់ដារ)។")}
      </p>
    </ToolShell>
  );
}