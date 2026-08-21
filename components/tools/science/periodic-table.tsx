"use client";
import { useMemo, useState } from "react";
import { ToolShell, TextInput, Field } from "@/components/ui/Shell";
import { useLanguage } from "@/components/LanguageProvider";

// [symbol, name, standard atomic weight]
const ELEMENTS: [string, string, number][] = [
  ["H", "Hydrogen", 1.008], ["He", "Helium", 4.0026], ["Li", "Lithium", 6.94], ["Be", "Beryllium", 9.0122],
  ["B", "Boron", 10.81], ["C", "Carbon", 12.011], ["N", "Nitrogen", 14.007], ["O", "Oxygen", 15.999],
  ["F", "Fluorine", 18.998], ["Ne", "Neon", 20.180], ["Na", "Sodium", 22.990], ["Mg", "Magnesium", 24.305],
  ["Al", "Aluminium", 26.982], ["Si", "Silicon", 28.085], ["P", "Phosphorus", 30.974], ["S", "Sulfur", 32.06],
  ["Cl", "Chlorine", 35.45], ["Ar", "Argon", 39.948], ["K", "Potassium", 39.098], ["Ca", "Calcium", 40.078],
  ["Sc", "Scandium", 44.956], ["Ti", "Titanium", 47.867], ["V", "Vanadium", 50.942], ["Cr", "Chromium", 51.996],
  ["Mn", "Manganese", 54.938], ["Fe", "Iron", 55.845], ["Co", "Cobalt", 58.933], ["Ni", "Nickel", 58.693],
  ["Cu", "Copper", 63.546], ["Zn", "Zinc", 65.38], ["Ga", "Gallium", 69.723], ["Ge", "Germanium", 72.630],
  ["As", "Arsenic", 74.922], ["Se", "Selenium", 78.971], ["Br", "Bromine", 79.904], ["Kr", "Krypton", 83.798],
  ["Rb", "Rubidium", 85.468], ["Sr", "Strontium", 87.62], ["Y", "Yttrium", 88.906], ["Zr", "Zirconium", 91.224],
  ["Nb", "Niobium", 92.906], ["Mo", "Molybdenum", 95.95], ["Tc", "Technetium", 98], ["Ru", "Ruthenium", 101.07],
  ["Rh", "Rhodium", 102.91], ["Pd", "Palladium", 106.42], ["Ag", "Silver", 107.87], ["Cd", "Cadmium", 112.41],
  ["In", "Indium", 114.82], ["Sn", "Tin", 118.71], ["Sb", "Antimony", 121.76], ["Te", "Tellurium", 127.60],
  ["I", "Iodine", 126.90], ["Xe", "Xenon", 131.29], ["Cs", "Caesium", 132.91], ["Ba", "Barium", 137.33],
  ["La", "Lanthanum", 138.91], ["Ce", "Cerium", 140.12], ["Pr", "Praseodymium", 140.91], ["Nd", "Neodymium", 144.24],
  ["Pm", "Promethium", 145], ["Sm", "Samarium", 150.36], ["Eu", "Europium", 151.96], ["Gd", "Gadolinium", 157.25],
  ["Tb", "Terbium", 158.93], ["Dy", "Dysprosium", 162.50], ["Ho", "Holmium", 164.93], ["Er", "Erbium", 167.26],
  ["Tm", "Thulium", 168.93], ["Yb", "Ytterbium", 173.05], ["Lu", "Lutetium", 174.97], ["Hf", "Hafnium", 178.49],
  ["Ta", "Tantalum", 180.95], ["W", "Tungsten", 183.84], ["Re", "Rhenium", 186.21], ["Os", "Osmium", 190.23],
  ["Ir", "Iridium", 192.22], ["Pt", "Platinum", 195.08], ["Au", "Gold", 196.97], ["Hg", "Mercury", 200.59],
  ["Tl", "Thallium", 204.38], ["Pb", "Lead", 207.2], ["Bi", "Bismuth", 208.98], ["Po", "Polonium", 209],
  ["At", "Astatine", 210], ["Rn", "Radon", 222], ["Fr", "Francium", 223], ["Ra", "Radium", 226],
  ["Ac", "Actinium", 227], ["Th", "Thorium", 232.04], ["Pa", "Protactinium", 231.04], ["U", "Uranium", 238.03],
  ["Np", "Neptunium", 237], ["Pu", "Plutonium", 244], ["Am", "Americium", 243], ["Cm", "Curium", 247],
  ["Bk", "Berkelium", 247], ["Cf", "Californium", 251], ["Es", "Einsteinium", 252], ["Fm", "Fermium", 257],
  ["Md", "Mendelevium", 258], ["No", "Nobelium", 259], ["Lr", "Lawrencium", 266], ["Rf", "Rutherfordium", 267],
  ["Db", "Dubnium", 268], ["Sg", "Seaborgium", 269], ["Bh", "Bohrium", 270], ["Hs", "Hassium", 269],
  ["Mt", "Meitnerium", 278], ["Ds", "Darmstadtium", 281], ["Rg", "Roentgenium", 282], ["Cn", "Copernicium", 285],
  ["Nh", "Nihonium", 286], ["Fl", "Flerovium", 289], ["Mc", "Moscovium", 290], ["Lv", "Livermorium", 293],
  ["Ts", "Tennessine", 294], ["Og", "Oganesson", 294],
];

const MASS: Record<string, number> = Object.fromEntries(ELEMENTS.map(([s, , m]) => [s, m]));

function gridPos(n: number): { x: number; y: number } {
  if (n === 1) return { x: 1, y: 1 };
  if (n === 2) return { x: 18, y: 1 };
  if (n <= 4) return { x: n - 2, y: 2 };
  if (n <= 10) return { x: n + 8, y: 2 };
  if (n <= 12) return { x: n - 10, y: 3 };
  if (n <= 18) return { x: n, y: 3 };
  if (n <= 36) return { x: n - 18, y: 4 };
  if (n <= 54) return { x: n - 36, y: 5 };
  if (n <= 56) return { x: n - 54, y: 6 };
  if (n <= 71) return { x: n - 54, y: 9 };
  if (n <= 86) return { x: n - 68, y: 6 };
  if (n <= 88) return { x: n - 86, y: 7 };
  if (n <= 103) return { x: n - 86, y: 10 };
  return { x: n - 100, y: 7 };
}

interface ParseResult {
  total: number;
  counts: [string, number][];
}

function parseFormula(input: string): ParseResult | null {
  const s = input.replace(/\s+/g, "").replace(/[·*]/g, ".");
  if (!s) return null;
  const stack: Record<string, number>[] = [{}];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (ch === "(" || ch === "[") {
      stack.push({});
      i++;
    } else if (ch === ")" || ch === "]") {
      i++;
      let num = "";
      while (i < s.length && s[i] >= "0" && s[i] <= "9") {
        num += s[i];
        i++;
      }
      const mult = num ? Number(num) : 1;
      const top = stack.pop();
      if (!top || stack.length === 0) return null;
      for (const [el, c] of Object.entries(top)) {
        const cur = stack[stack.length - 1];
        cur[el] = (cur[el] ?? 0) + c * mult;
      }
    } else if (ch === ".") {
      i++;
    } else if (ch >= "A" && ch <= "Z") {
      let sym = ch;
      i++;
      while (i < s.length && s[i] >= "a" && s[i] <= "z") {
        sym += s[i];
        i++;
      }
      let num = "";
      while (i < s.length && s[i] >= "0" && s[i] <= "9") {
        num += s[i];
        i++;
      }
      const mult = num ? Number(num) : 1;
      const cur = stack[stack.length - 1];
      cur[sym] = (cur[sym] ?? 0) + mult;
    } else {
      i++;
    }
  }
  if (stack.length !== 1) return null;
  const counts = Object.entries(stack[0]);
  if (counts.length === 0) return null;
  let total = 0;
  for (const [el, c] of counts) {
    const m = MASS[el];
    if (m === undefined) return null;
    total += m * c;
  }
  counts.sort((a, b) => b[1] - a[1]);
  return { total, counts };
}

export default function PeriodicTable() {
  const { text: t } = useLanguage();
  const [selected, setSelected] = useState(20);
  const [formula, setFormula] = useState("Ca(OH)2");

  const parsed = useMemo(() => parseFormula(formula), [formula]);
  const el = ELEMENTS[selected - 1];

  return (
    <ToolShell
      title="Periodic Table & Molar Mass"
      khmerTitle="តារាងខួប និងម៉ាសម៉ូលា"
      description="Interactive periodic table of all 118 elements plus a chemical formula molar-mass calculator."
      descriptionKm="តារាងខួបអន្តរកម្មនៃធាតុទាំង ១១៨ ព្រមទាំងម៉ាស៊ីនគណនាម៉ាសម៉ូលាពីរូបមន្តគីមី។"
    >
      <div className="space-y-5">
        <div className="overflow-x-auto pb-2">
          <div className="grid min-w-[720px] gap-[3px]" style={{ gridTemplateColumns: "repeat(18, minmax(0, 1fr))", gridTemplateRows: "repeat(10, minmax(0, 1fr))" }}>
            {ELEMENTS.map(([sym, name], idx) => {
              const n = idx + 1;
              const { x, y } = gridPos(n);
              const active = n === selected;
              return (
                <button
                  key={sym}
                  type="button"
                  title={name}
                  onClick={() => setSelected(n)}
                  className={`rounded-[4px] border p-0.5 text-left transition ${active ? "border-[var(--gold)] bg-[var(--gold)]/15" : "border-transparent bg-[var(--ground-raised)] hover:bg-[var(--gold)]/10"}`}
                  style={{ gridColumn: x, gridRow: y }}
                >
                  <div className="text-[7px] leading-none text-[var(--ink-faint)]">{n}</div>
                  <div className={`text-center font-semibold leading-tight text-[var(--ink)] ${String(sym).length > 2 ? "text-[8px]" : "text-[11px]"}`}>{sym}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[var(--gold)]/15 font-mono-ui text-xl font-bold text-[var(--gold)]">{el[0]}</span>
          <div>
            <div className="text-sm font-semibold text-[var(--ink)]">#{selected} · {el[1]}</div>
            <div className="text-xs text-[var(--ink-dim)]">{t("Atomic mass", "ម៉ាសអាតូម")}: {el[2]} u</div>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <Field label={t("Chemical formula", "រូបមន្តគីមី")} hint={t("e.g. H2SO4, Ca(OH)2, C6H12O6", "ឧ. H2SO4, Ca(OH)2, C6H12O6")}>
            <TextInput value={formula} onChange={(e) => setFormula(e.target.value)} className="font-mono-ui" />
          </Field>

          {parsed ? (
            <>
              <div className="rounded-lg border border-[var(--teal)]/40 bg-[var(--teal)]/10 p-3">
                <div className="text-[11px] uppercase tracking-wide text-[var(--ink-faint)]">{t("Molar mass", "ម៉ាសម៉ូលា")}</div>
                <div className="mt-1 font-mono-ui text-2xl font-semibold tabular-nums text-[var(--ink)]">{Number(parsed.total.toFixed(4))} g/mol</div>
              </div>
              <table className="w-full text-xs">
                <tbody>
                  {parsed.counts.map(([sym, count]) => (
                    <tr key={sym} className="border-b border-[var(--ground-line)] last:border-0">
                      <td className="py-1.5 font-mono-ui font-semibold text-[var(--ink)]">{sym}</td>
                      <td className="py-1.5 text-[var(--ink-dim)]">{ELEMENTS.find((e) => e[0] === sym)?.[1]}</td>
                      <td className="py-1.5 text-right font-mono-ui text-[var(--ink-dim)]">× {count}</td>
                      <td className="py-1.5 text-right font-mono-ui text-[var(--ink)]">{Number((MASS[sym] * count).toFixed(4))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : formula.trim() ? (
            <p className="text-sm text-[var(--danger)]">{t("Could not parse this formula or an element symbol is unknown.", "មិនអាចញែករូបមន្តនេះបាន ឬសញ្ញាធាតុមិនស្គាល់។")}</p>
          ) : null}
        </div>
      </div>
    </ToolShell>
  );
}