"use client";
import { ToolShell } from "@/components/ui/Shell";
import { useLanguage } from "@/components/LanguageProvider";

export default function AsciiTable() {
  const { text: t } = useLanguage();

  const rows = Array.from({ length: 128 }, (_, code) => {
    const ch = code < 32 ? (code === 9 ? "\\t" : code === 10 ? "\\n" : code === 13 ? "\\r" : "␀") : String.fromCharCode(code);
    const name = code < 32 ? `Ctrl+${String.fromCharCode(code + 64)}` : code === 127 ? "DEL" : "";
    return { code, ch, name };
  });

  return (
    <ToolShell
      title="ASCII Table"
      khmerTitle="តារាង ASCII"
      description="Complete 7-bit ASCII reference: codes 0–127 with characters and control names."
      descriptionKm="តារាងយោង ASCII 7-bit ពេញលេញ៖ លេខកូដ 0–127 ជាមួយតួអក្សរ និងឈ្មោះគ្រប់គ្រង។"
    >
      <div className="overflow-x-auto rounded-md border border-[var(--ground-line)]">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[var(--ground-raised)] text-left text-xs uppercase tracking-wide text-[var(--ink-dim)]">
              <th className="px-3 py-2">Dec</th>
              <th className="px-3 py-2">Hex</th>
              <th className="px-3 py-2">Char</th>
              <th className="px-3 py-2">{t("Meaning", "អត្ថន័យ")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.code} className="border-t border-[var(--ground-line)]">
                <td className="px-3 py-1 font-mono-ui text-[var(--ink)]">{r.code}</td>
                <td className="px-3 py-1 font-mono-ui text-[var(--gold)]">{r.code.toString(16).toUpperCase().padStart(2, "0")}</td>
                <td className="px-3 py-1 font-mono-ui text-[var(--ink)]">{r.ch}</td>
                <td className="px-3 py-1 text-[var(--ink-dim)]">{r.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ToolShell>
  );
}