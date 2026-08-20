"use client";
import { useMemo, useState } from "react";
import { ToolShell, Field, TextInput, Select } from "@/components/ui/Shell";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";

type Category = "Arithmetic" | "Comparison" | "Algebra" | "Calculus" | "Sets & Logic" | "Greek" | "Constants";

interface Symbol {
  s: string;
  n: string;
  nk: string;
  m: string;
  mk: string;
  lx: string;
  u: string;
  c: Category;
}

const SYMBOLS: Symbol[] = [
  { s: "+", n: "Plus", nk: "បូក", m: "Addition", mk: "ការបូក", lx: "+", u: "U+002B", c: "Arithmetic" },
  { s: "−", n: "Minus", nk: "ដក", m: "Subtraction", mk: "ការដក", lx: "-", u: "U+2212", c: "Arithmetic" },
  { s: "×", n: "Times", nk: "គុណ", m: "Multiplication", mk: "ការគុណ", lx: "\\times", u: "U+00D7", c: "Arithmetic" },
  { s: "÷", n: "Divide", nk: "ចែក", m: "Division", mk: "ការចែក", lx: "\\div", u: "U+00F7", c: "Arithmetic" },
  { s: "±", n: "Plus-minus", nk: "បូកដក", m: "Positive or negative", mk: "វិជ្ជមាន ឬអវិជ្ជមាន", lx: "\\pm", u: "U+00B1", c: "Arithmetic" },
  { s: "√", n: "Square root", nk: "ឬសការេ", m: "Principal square root", mk: "ឬសការេចម្បង", lx: "\\sqrt{}", u: "U+221A", c: "Arithmetic" },
  { s: "∛", n: "Cube root", nk: "ឬសគូប", m: "Cube root", mk: "ឬសគូប", lx: "\\sqrt[3]{}", u: "U+221B", c: "Arithmetic" },
  { s: "%", n: "Percent", nk: "ភាគរយ", m: "Parts per hundred", mk: "ចំណែកក្នុងមួយរយ", lx: "\\%", u: "U+0025", c: "Arithmetic" },
  { s: "|x|", n: "Absolute value", nk: "តម្លៃដាច់ខាត", m: "Magnitude of x", mk: "ទំហំរបស់ x", lx: "|x|", u: "U+007C", c: "Arithmetic" },
  { s: "!", n: "Factorial", nk: "ហ្វាក់តូរីយែល", m: "n! = n·(n−1)···1", mk: "n! = n·(n−1)···1", lx: "!", u: "U+0021", c: "Arithmetic" },
  { s: "=", n: "Equals", nk: "ស្មើ", m: "Equal to", mk: "ស្មើនឹង", lx: "=", u: "U+003D", c: "Comparison" },
  { s: "≠", n: "Not equal", nk: "មិនស្មើ", m: "Not equal to", mk: "មិនស្មើនឹង", lx: "\\neq", u: "U+2260", c: "Comparison" },
  { s: "≈", n: "Approximately", nk: "ប្រហែល", m: "Approximately equal", mk: "ប្រហែលស្មើនឹង", lx: "\\approx", u: "U+2248", c: "Comparison" },
  { s: "<", n: "Less than", nk: "តូចជាង", m: "Less than", mk: "តូចជាង", lx: "<", u: "U+003C", c: "Comparison" },
  { s: ">", n: "Greater than", nk: "ធំជាង", m: "Greater than", mk: "ធំជាង", lx: ">", u: "U+003E", c: "Comparison" },
  { s: "≤", n: "Less or equal", nk: "តូចជាងឬស្មើ", m: "Less than or equal", mk: "តូចជាង ឬស្មើ", lx: "\\leq", u: "U+2264", c: "Comparison" },
  { s: "≥", n: "Greater or equal", nk: "ធំជាងឬស្មើ", m: "Greater than or equal", mk: "ធំជាង ឬស្មើ", lx: "\\geq", u: "U+2265", c: "Comparison" },
  { s: "∝", n: "Proportional", nk: "សមាមាត្រ", m: "Proportional to", mk: "សមាមាត្រនឹង", lx: "\\propto", u: "U+221D", c: "Comparison" },
  { s: "≡", n: "Equivalent", nk: "សមមូល", m: "Identically equal / congruent", mk: "ស្មើជានិច្ច / ប៉ុង", lx: "\\equiv", u: "U+2261", c: "Comparison" },
  { s: "x²", n: "Squared", nk: "ការេ", m: "x raised to power 2", mk: "x ស្វ័យគុណ ២", lx: "x^2", u: "U+00B2", c: "Algebra" },
  { s: "x³", n: "Cubed", nk: "គូប", m: "x raised to power 3", mk: "x ស្វ័យគុណ ៣", lx: "x^3", u: "U+00B3", c: "Algebra" },
  { s: "∑", n: "Summation", nk: "ផលបូក", m: "Sum over a range", mk: "ផលបូកលើចន្លោះមួយ", lx: "\\sum", u: "U+2211", c: "Algebra" },
  { s: "∏", n: "Product", nk: "ផលគុណ", m: "Product over a range", mk: "ផលគុណលើចន្លោះមួយ", lx: "\\prod", u: "U+220F", c: "Algebra" },
  { s: "∞", n: "Infinity", nk: "អនន្ត", m: "Unbounded quantity", mk: "បរិមាណគ្មានកំណត់", lx: "\\infty", u: "U+221E", c: "Algebra" },
  { s: "π", n: "Pi", nk: "ភី", m: "≈ 3.14159265…", mk: "≈ ៣.១៤១៥៩២៦៥…", lx: "\\pi", u: "U+03C0", c: "Constants" },
  { s: "e", n: "Euler's number", nk: "លេខអយល័រ", m: "≈ 2.718281828…", mk: "≈ ២.៧១៨២៨១៨២៨…", lx: "e", u: "U+0065", c: "Constants" },
  { s: "i", n: "Imaginary unit", nk: "ឯកតានិម្មិត", m: "i² = −1", mk: "i² = −១", lx: "i", u: "U+0069", c: "Constants" },
  { s: "φ", n: "Golden ratio", nk: "សមាមាត្រមាស", m: "≈ 1.6180339…", mk: "≈ ១.៦១៨០៣៣៩…", lx: "\\varphi", u: "U+03C6", c: "Constants" },
  { s: "∂", n: "Partial derivative", nk: "ដេរីវេដោយផ្នែក", m: "Rate of change in one variable", mk: "អត្រាប្រែប្រួលតាមអថេរមួយ", lx: "\\partial", u: "U+2202", c: "Calculus" },
  { s: "∫", n: "Integral", nk: "អាំងតេក្រាល", m: "Integration", mk: "ការអាំងតេក្រាល", lx: "\\int", u: "U+222B", c: "Calculus" },
  { s: "∇", n: "Nabla", nk: "ណាប្លា", m: "Gradient / del operator", mk: "ប្រតិបត្តិការ ហ្គ្រាដ្យែន / del", lx: "\\nabla", u: "U+2207", c: "Calculus" },
  { s: "′", n: "Prime", nk: "ដេរីវេ", m: "Derivative notation f′(x)", mk: "និមិត្តសញ្ញាដេរីវេ f′(x)", lx: "'", u: "U+2032", c: "Calculus" },
  { s: "lim", n: "Limit", nk: "លីមីត", m: "Limit as x approaches", mk: "លីមីតពេល x ខិតទៅជិត", lx: "\\lim", u: "—", c: "Calculus" },
  { s: "∈", n: "Element of", nk: "ជាធាតុ", m: "Belongs to a set", mk: "ជារបស់សំណុំ", lx: "\\in", u: "U+2208", c: "Sets & Logic" },
  { s: "∉", n: "Not element of", nk: "មិនមែនជាធាតុ", m: "Not in a set", mk: "មិនមែនក្នុងសំណុំ", lx: "\\notin", u: "U+2209", c: "Sets & Logic" },
  { s: "⊂", n: "Subset", nk: "សំណុំរង", m: "Proper subset", mk: "សំណុំរងពិត", lx: "\\subset", u: "U+2282", c: "Sets & Logic" },
  { s: "⊆", n: "Subset or equal", nk: "សំណុំរងឬស្មើ", m: "Subset", mk: "សំណុំរង", lx: "\\subseteq", u: "U+2286", c: "Sets & Logic" },
  { s: "∪", n: "Union", nk: "ប្រជុំ", m: "Union of sets", mk: "ប្រជុំនៃសំណុំ", lx: "\\cup", u: "U+222A", c: "Sets & Logic" },
  { s: "∩", n: "Intersection", nk: "ប្រសព្វ", m: "Intersection of sets", mk: "ប្រសព្វនៃសំណុំ", lx: "\\cap", u: "U+2229", c: "Sets & Logic" },
  { s: "∅", n: "Empty set", nk: "សំណុំទទេ", m: "Set with no elements", mk: "សំណុំដែលគ្មានធាតុ", lx: "\\emptyset", u: "U+2205", c: "Sets & Logic" },
  { s: "∀", n: "For all", nk: "សម្រាប់ទាំងអស់", m: "Universal quantifier", mk: "កំណត់សម្គាល់សកល", lx: "\\forall", u: "U+2200", c: "Sets & Logic" },
  { s: "∃", n: "There exists", nk: "មាន", m: "Existential quantifier", mk: "កំណត់សម្គាល់អត្ថិភាព", lx: "\\exists", u: "U+2203", c: "Sets & Logic" },
  { s: "⇒", n: "Implies", nk: "បញ្ជាក់ថា", m: "Logical implication", mk: "ការបញ្ជាក់តក្កវិជ្ជា", lx: "\\Rightarrow", u: "U+21D2", c: "Sets & Logic" },
  { s: "⇔", n: "If and only if", nk: "លុះត្រាតែ", m: "Logical equivalence", mk: "សមមូលតក្កវិជ្ជា", lx: "\\Leftrightarrow", u: "U+21D4", c: "Sets & Logic" },
  { s: "∧", n: "And", nk: "និង", m: "Logical AND", mk: "តក្កវិជ្ជា AND", lx: "\\land", u: "U+2227", c: "Sets & Logic" },
  { s: "∨", n: "Or", nk: "ឬ", m: "Logical OR", mk: "តក្កវិជ្ជា OR", lx: "\\lor", u: "U+2228", c: "Sets & Logic" },
  { s: "¬", n: "Not", nk: "មិន", m: "Logical negation", mk: "បដិសេធតក្កវិជ្ជា", lx: "\\neg", u: "U+00AC", c: "Sets & Logic" },
  { s: "°", n: "Degree", nk: "ដឺក្រេ", m: "Angular degree", mk: "ដឺក្រេមុំ", lx: "^\\circ", u: "U+00B0", c: "Arithmetic" },
  { s: "⊥", n: "Perpendicular", nk: "កែង", m: "Perpendicular / orthogonal", mk: "កែងគ្នា", lx: "\\perp", u: "U+22A5", c: "Algebra" },
  { s: "∥", n: "Parallel", nk: "ស្រប", m: "Parallel", mk: "ស្របគ្នា", lx: "\\parallel", u: "U+2225", c: "Algebra" },
  { s: "Δ", n: "Delta (change)", nk: "ដែលតា", m: "Change in quantity", mk: "ការផ្លាស់ប្តូរបរិមាណ", lx: "\\Delta", u: "U+0394", c: "Greek" },
  { s: "θ", n: "Theta", nk: "ថេតា", m: "Angle (often)", mk: "មុំ (ជាទូទៅ)", lx: "\\theta", u: "U+03B8", c: "Greek" },
  { s: "λ", n: "Lambda", nk: "ឡាំដា", m: "Wavelength / eigenvalue", mk: "រលក / តម្លៃអ៊ីហ្គេន", lx: "\\lambda", u: "U+03BB", c: "Greek" },
  { s: "μ", n: "Mu", nk: "មូ", m: "Mean / micro", mk: "មធ្យម / មីក្រូ", lx: "\\mu", u: "U+03BC", c: "Greek" },
  { s: "σ", n: "Sigma (small)", nk: "ស៊ីកម៉ា", m: "Standard deviation", mk: "គម្លាតស្តង់ដារ", lx: "\\sigma", u: "U+03C3", c: "Greek" },
  { s: "Σ", n: "Sigma (capital)", nk: "ស៊ីកម៉ាធំ", m: "Summation", mk: "ផលបូក", lx: "\\Sigma", u: "U+03A3", c: "Greek" },
  { s: "Ω", n: "Omega (capital)", nk: "អូមេហ្គា", m: "Ohm / last element", mk: "អូម / ធាតុចុងក្រោយ", lx: "\\Omega", u: "U+03A9", c: "Greek" },
  { s: "α", n: "Alpha", nk: "អាល់ហ្វា", m: "Angle / significance", mk: "មុំ / កម្រិតសំខាន់", lx: "\\alpha", u: "U+03B1", c: "Greek" },
  { s: "β", n: "Beta", nk: "បេតា", m: "Angle / coefficient", mk: "មុំ / មេគុណ", lx: "\\beta", u: "U+03B2", c: "Greek" },
  { s: "γ", n: "Gamma", nk: "ហ្គាម៉ា", m: "Angle / Lorentz factor", mk: "មុំ / កត្តាឡូរ៉ង់", lx: "\\gamma", u: "U+03B3", c: "Greek" },
  { s: "ℕ", n: "Natural numbers", nk: "ចំនួនធម្មជាតិ", m: "Set {0,1,2,3,…}", mk: "សំណុំ {០,១,២,៣,…}", lx: "\\mathbb{N}", u: "U+2115", c: "Constants" },
  { s: "ℤ", n: "Integers", nk: "ចំនួនគត់", m: "Set {…,−2,−1,0,1,2,…}", mk: "សំណុំ {…,−២,−១,០,១,២,…}", lx: "\\mathbb{Z}", u: "U+2124", c: "Constants" },
  { s: "ℚ", n: "Rational numbers", nk: "ចំនួនសនិទាន", m: "Fractions a/b", mk: "ប្រភាគ a/b", lx: "\\mathbb{Q}", u: "U+211A", c: "Constants" },
  { s: "ℝ", n: "Real numbers", nk: "ចំនួនពិត", m: "All real numbers", mk: "ចំនួនពិតទាំងអស់", lx: "\\mathbb{R}", u: "U+211D", c: "Constants" },
  { s: "ℂ", n: "Complex numbers", nk: "ចំនួនកុំផ្លិច", m: "Numbers a+bi", mk: "ចំនួន a+bi", lx: "\\mathbb{C}", u: "U+2102", c: "Constants" },
];

const CATEGORIES: Category[] = ["Arithmetic", "Comparison", "Algebra", "Calculus", "Sets & Logic", "Greek", "Constants"];

export default function MathSymbols() {
  const { text } = useLanguage();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SYMBOLS.filter((s) => {
      if (category !== "all" && s.c !== category) return false;
      if (!q) return true;
      return (
        s.s.toLowerCase().includes(q) ||
        s.n.toLowerCase().includes(q) ||
        s.m.toLowerCase().includes(q) ||
        s.lx.toLowerCase().includes(q)
      );
    });
  }, [query, category]);

  return (
    <ToolShell
      title="Math Symbol Dictionary"
      description="Searchable reference of common math symbols — name, meaning, LaTeX, and Unicode, click to copy."
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Search symbols">
            <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder={text("Search by name, meaning, or LaTeX…", "ស្វែងរកតាមឈ្មោះ អត្ថន័យ ឬ LaTeX…")} />
          </Field>
          <Field label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="all">All</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <div key={s.s + s.n} className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl leading-none text-[var(--ink)]">{s.s}</span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[var(--ink)]">{text(s.n, s.nk)}</div>
                    <div className="text-xs text-[var(--ink-dim)]">{text(s.m, s.mk)}</div>
                  </div>
                </div>
                <CopyButton text={s.s} compact />
              </div>
              <div className="mt-2 flex items-center gap-2 border-t border-[var(--ground-line)] pt-2 text-[11px] text-[var(--ink-faint)]">
                <span className="font-mono-ui">LaTeX: {s.lx}</span>
                <CopyButton text={s.lx} compact />
                <span className="ml-auto font-mono-ui">{s.u}</span>
                <CopyButton text={s.s} compact />
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full rounded-lg border border-dashed border-[var(--ground-line)] py-10 text-center text-sm text-[var(--ink-faint)]">
              {text("No symbols match your search.", "គ្មានសញ្ញាដែលត្រូវនឹងការស្វែងរករបស់អ្នកទេ។")}
            </div>
          )}
        </div>
      </div>
    </ToolShell>
  );
}