"use client";

// Unix File Permissions (chmod) Calculator — convert between the checkbox grid,
// the octal mode (e.g. 755 / 4755) and the symbolic string (rwxr-xr-x), and
// build the matching chmod command. Includes the special setuid/setgid/sticky
// bits. Pure client-side arithmetic; no data is sent anywhere.

import { useMemo, useState } from "react";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useLanguage } from "@/components/LanguageProvider";
import { useToolState } from "@/lib/storage";

type Who = "u" | "g" | "o";
type Perm = "r" | "w" | "x";
type Grid = Record<Who, Record<Perm, boolean>>;
type Special = { setuid: boolean; setgid: boolean; sticky: boolean };

const EMPTY_GRID: Grid = {
  u: { r: false, w: false, x: false },
  g: { r: false, w: false, x: false },
  o: { r: false, w: false, x: false },
};

function digit(p: Record<Perm, boolean>): number {
  return (p.r ? 4 : 0) + (p.w ? 2 : 0) + (p.x ? 1 : 0);
}

function octal(grid: Grid, special: Special): string {
  const s = (special.setuid ? 4 : 0) + (special.setgid ? 2 : 0) + (special.sticky ? 1 : 0);
  const body = `${digit(grid.u)}${digit(grid.g)}${digit(grid.o)}`;
  return s > 0 ? `${s}${body}` : body;
}

// Build the 9-character rwx string, folding the special bits into the execute
// slots exactly as `ls -l` shows them (s/S for setuid & setgid, t/T for sticky).
function symbolic(grid: Grid, special: Special): string {
  const trip = (p: Record<Perm, boolean>, sp: boolean, on: string, off: string) =>
    `${p.r ? "r" : "-"}${p.w ? "w" : "-"}${sp ? (p.x ? on : off) : p.x ? "x" : "-"}`;
  return trip(grid.u, special.setuid, "s", "S") + trip(grid.g, special.setgid, "s", "S") + trip(grid.o, special.sticky, "t", "T");
}

// Parse an octal mode string (3 or 4 octal digits) back into the grid + special
// bits. Returns null if it is not a valid mode.
function parseOctal(input: string): { grid: Grid; special: Special } | null {
  const raw = input.trim();
  if (!/^[0-7]{3,4}$/.test(raw)) return null;
  const padded = raw.length === 3 ? `0${raw}` : raw;
  const [s, u, g, o] = padded.split("").map((d) => parseInt(d, 10));
  const toPerm = (n: number): Record<Perm, boolean> => ({ r: (n & 4) !== 0, w: (n & 2) !== 0, x: (n & 1) !== 0 });
  return {
    grid: { u: toPerm(u), g: toPerm(g), o: toPerm(o) },
    special: { setuid: (s & 4) !== 0, setgid: (s & 2) !== 0, sticky: (s & 1) !== 0 },
  };
}

export default function ChmodCalculator() {
  const { text: t } = useLanguage();
  const [grid, setGrid] = useState<Grid>({
    u: { r: true, w: true, x: true },
    g: { r: true, w: false, x: true },
    o: { r: true, w: false, x: true },
  });
  const [special, setSpecial] = useState<Special>({ setuid: false, setgid: false, sticky: false });
  const [target, setTarget] = useToolState("chmod-calculator:target", "file");
  const [octalInput, setOctalInput] = useState("");

  const oct = useMemo(() => octal(grid, special), [grid, special]);
  const sym = useMemo(() => symbolic(grid, special), [grid, special]);

  const toggle = (who: Who, perm: Perm) =>
    setGrid((prev) => ({ ...prev, [who]: { ...prev[who], [perm]: !prev[who][perm] } }));
  const toggleSpecial = (bit: keyof Special) => setSpecial((prev) => ({ ...prev, [bit]: !prev[bit] }));

  const applyOctal = (value: string) => {
    setOctalInput(value);
    const parsed = parseOctal(value);
    if (parsed) {
      setGrid(parsed.grid);
      setSpecial(parsed.special);
    }
  };

  const clear = () => {
    setGrid(EMPTY_GRID);
    setSpecial({ setuid: false, setgid: false, sticky: false });
    setOctalInput("");
  };

  const whos: { key: Who; en: string; km: string }[] = [
    { key: "u", en: "Owner", km: "ម្ចាស់" },
    { key: "g", en: "Group", km: "ក្រុម" },
    { key: "o", en: "Others", km: "អ្នកផ្សេង" },
  ];
  const perms: { key: Perm; en: string; km: string }[] = [
    { key: "r", en: "Read", km: "អាន" },
    { key: "w", en: "Write", km: "សរសេរ" },
    { key: "x", en: "Execute", km: "ប្រតិបត្តិ" },
  ];
  const specials: { key: keyof Special; label: string }[] = [
    { key: "setuid", label: "setuid" },
    { key: "setgid", label: "setgid" },
    { key: "sticky", label: t("sticky", "sticky") },
  ];

  const cmd = `chmod ${oct} ${target.trim() || "file"}`;

  return (
    <ToolShell
      title="Chmod Permissions Calculator"
      khmerTitle="គណនាសិទ្ធិឯកសារ chmod"
      description="Work out Unix/Linux file permissions without memorising the numbers. Tick read/write/execute for owner, group, and others — including the setuid, setgid, and sticky bits — and read off the octal mode (e.g. 755), the symbolic string (rwxr-xr-x), and the exact chmod command. Or type an octal mode to see what it means. Runs locally."
      descriptionKm="គណនាសិទ្ធិឯកសារ Unix/Linux ដោយមិនចាំបាច់ចងចាំលេខ។ គូសអាន/សរសេរ/ប្រតិបត្តិសម្រាប់ម្ចាស់ ក្រុម និងអ្នកផ្សេង — រួមទាំង setuid, setgid, និង sticky — ហើយអានលេខ octal (ឧ. 755) ខ្សែអក្សរនិមិត្តសញ្ញា (rwxr-xr-x) និងពាក្យបញ្ជា chmod ត្រឹមត្រូវ។ ឬវាយលេខ octal ដើម្បីមើលអត្ថន័យ។ ដំណើរការក្នុងម៉ាស៊ីន។"
    >
      <div className="overflow-hidden rounded-lg border border-[var(--ground-line)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--ground-raised)] text-[var(--ink-dim)]">
              <th className="px-3 py-2 text-left font-medium"> </th>
              {perms.map((p) => (
                <th key={p.key} className="px-3 py-2 text-center font-medium">{t(p.en, p.km)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {whos.map((w) => (
              <tr key={w.key} className="border-t border-[var(--ground-line)]">
                <td className="px-3 py-2 text-[var(--ink)]">{t(w.en, w.km)}</td>
                {perms.map((p) => (
                  <td key={p.key} className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={grid[w.key][p.key]}
                      onChange={() => toggle(w.key, p.key)}
                      aria-label={`${t(w.en, w.km)} ${t(p.en, p.km)}`}
                      className="h-4 w-4 accent-[var(--gold)]"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Field label="Special bits" labelKm="ប៊ីតពិសេស">
        <div className="flex flex-wrap gap-4">
          {specials.map((s) => (
            <label key={s.key} className="flex cursor-pointer items-center gap-1.5 text-sm text-[var(--ink)]">
              <input type="checkbox" checked={special[s.key]} onChange={() => toggleSpecial(s.key)} className="h-4 w-4 accent-[var(--gold)]" />
              {s.label}
            </label>
          ))}
          <button onClick={clear} className="ml-auto text-xs text-[var(--ink-faint)] hover:text-[var(--ink)]">{t("Clear", "សម្អាត")}</button>
        </div>
      </Field>

      <Field label="Or enter an octal mode" labelKm="ឬវាយលេខ octal" hint="e.g. 755 or 4755" hintKm="ឧ. 755 ឬ 4755">
        <TextInput value={octalInput} onChange={(e) => applyOctal(e.target.value)} inputMode="numeric" />
      </Field>

      <Field label="Target (for the command)" labelKm="គោលដៅ (សម្រាប់ពាក្យបញ្ជា)">
        <TextInput value={target} onChange={(e) => setTarget(e.target.value)} />
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Output label={t("Octal", "លេខ Octal")} value={oct} />
        <Output label={t("Symbolic", "និមិត្តសញ្ញា")} value={sym} />
        <Output label={t("Command", "ពាក្យបញ្ជា")} value={cmd} />
      </div>
    </ToolShell>
  );
}
