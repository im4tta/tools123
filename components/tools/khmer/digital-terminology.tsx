"use client";
import { Fragment, useMemo, useState } from "react";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { MPTC_TERMS } from "@/lib/data/mptc-lexicon";

export default function DigitalTerminology() {
  const [q, setQ] = useToolState("digital-terminology:q", "");
  const [openKey, setOpenKey] = useState<string | null>(null);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return MPTC_TERMS;
    return MPTC_TERMS.filter(
      (t) =>
        t.en.toLowerCase().includes(query) ||
        t.km.includes(q) ||
        t.fr.toLowerCase().includes(query) ||
        t.def.includes(q)
    );
  }, [q]);

  return (
    <ToolShell
      title="Khmer Digital Terminology"
      khmerTitle="វាក្យស័ព្ទឌីជីថល"
      description={`The full official MPTC (Ministry of Posts and Telecommunications of Cambodia) Digital Terminology Lexicon — ${MPTC_TERMS.length} standardized terms with English, French, and Khmer definitions, from the ministry's 2025/2026 published update. Search by English, French, or Khmer; tap a row to expand its definition.`}
    >
      <Field label="Filter" hint={`${results.length} of ${MPTC_TERMS.length}`}>
        <TextInput
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search English, French, or Khmer..."
        />
      </Field>
      <div className="overflow-hidden rounded-md border border-[var(--ground-line)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--ground-raised)] text-xs uppercase tracking-wide text-[var(--ink-dim)]">
            <tr>
              <th className="px-3 py-2 text-left">English</th>
              <th className="px-3 py-2 text-left">Khmer</th>
              <th className="hidden px-3 py-2 text-left sm:table-cell">French</th>
            </tr>
          </thead>
          <tbody>
            {results.map((t, i) => {
              const key = `${t.km}::${t.en}::${i}`;
              const isOpen = openKey === key;
              return (
                <Fragment key={key}>
                  <tr
                    className="cursor-pointer border-t border-[var(--ground-line)] hover:bg-[var(--ground-raised)]"
                    onClick={() => setOpenKey(isOpen ? null : key)}
                  >
                    <td className="px-3 py-2">{t.en}</td>
                    <td className="px-3 py-2 font-khmer">{t.km}</td>
                    <td className="hidden px-3 py-2 text-[var(--ink-dim)] sm:table-cell">{t.fr}</td>
                  </tr>
                  {isOpen && t.def && (
                    <tr className="border-t border-[var(--ground-line)] bg-[var(--ground-raised)]">
                      <td colSpan={3} className="px-3 py-3">
                        <div className="font-khmer text-sm leading-relaxed text-[var(--ink)]">{t.def}</div>
                        {t.fr && (
                          <div className="mt-1 text-xs text-[var(--ink-faint)] sm:hidden">
                            French: {t.fr}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {results.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-4 text-center text-[var(--ink-faint)]">
                  No matches
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-[var(--ink-faint)]">
        Source: Ministry of Posts and Telecommunications of Cambodia, Digital Terminology Lexicon.
      </p>
    </ToolShell>
  );
}
