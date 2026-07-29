"use client";
import { useState } from "react";
import { CopyButton, type CopyField } from "@/components/CopyButton";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";

const ENTRIES = [
  { mark: "។", name: "Khan", usage: "Full stop / end of sentence" },
  { mark: "៕", name: "Bariyoosan", usage: "End of a passage or verse" },
  { mark: "៖", name: "Camnuc pii kuuh", usage: "Colon-like, introduces a list or quote" },
  { mark: "ៗ", name: "Lek Too", usage: "Repetition mark — repeats the preceding word" },
  { mark: "៙", name: "Phnaek Muan", usage: "Old-style section/poetry marker" },
  { mark: "៚", name: "Koomuut", usage: "Marks the end of a book or major text" },
  { mark: "៝", name: "Bathamasat", usage: "Rare mark, sometimes used in royal titles" },
  { mark: "៑", name: "Muusikatoan", usage: "Diacritic-like mark, indicates a checked short vowel" },
  { mark: "៎", name: "Triisap", usage: "Diacritic mark, raises tone register on some consonants" },
  { mark: "៘", name: "Beyyal", usage: "Indicates omitted/abbreviated text, like an ellipsis" },
  { mark: "៓", name: "Bantoc", usage: "Small stroke shortening a vowel's pronunciation" },
  { mark: "៉", name: "Muusikatoan (above)", usage: "Register shift diacritic placed above a consonant" },
];

export default function PunctuationReferenceTool() {
  const [q, setQ] = useState("");
  const filtered = ENTRIES.filter(
    (e) => q.trim() === "" || e.name.toLowerCase().includes(q.toLowerCase()) || e.usage.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <ToolShell
      title="Khmer Punctuation Reference"
      khmerTitle="សញ្ញាវណ្ណយុត្តិខ្មែរ"
      description="A quick reference for traditional Khmer punctuation and diacritic marks and what they're used for."
    >
      <Field label="Filter">
        <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or usage…" />
      </Field>
      <div className="overflow-hidden rounded-md border border-[var(--ground-line)]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--ground-line)] bg-[var(--ground-raised)] text-xs uppercase tracking-wide text-[var(--ink-dim)]">
              <th className="px-3 py-2 font-medium">Mark</th>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Usage</th>
              <th className="px-3 py-2 w-10" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.name} className="border-b border-[var(--ground-line)] last:border-0">
                <td className="px-3 py-2 font-khmer text-lg text-[var(--gold)]">{e.mark}</td>
                <td className="px-3 py-2 text-[var(--ink)]">{e.name}</td>
                <td className="px-3 py-2 text-[var(--ink-dim)]">{e.usage}</td>
                <td className="px-3 py-2">
                  <CopyButton compact text={`${e.mark} ${e.name}\n${e.usage}`}
                    fields={[
                      { id: "mark", label: "Mark", getValue: e.mark },
                      { id: "name", label: "Name", getValue: e.name },
                      { id: "usage", label: "Usage", getValue: e.usage },
                    ]}
                  />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-[var(--ink-faint)]">
                  No matches.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ToolShell>
  );
}
