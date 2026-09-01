"use client";
import { ToolShell, Field, Row, TextInput } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

function fmt(n: number): string {
  if (!isFinite(n)) return "—";
  return String(Math.round(n * 1e6) / 1e6);
}

function sign(n: number): string {
  return n < 0 ? "−" : "+";
}

export default function QuadraticEquationSolver() {
  const { text: t } = useLanguage();
  const [a, setA] = useToolState("quadratic-equation-solver:a", "1");
  const [b, setB] = useToolState("quadratic-equation-solver:b", "-3");
  const [c, setC] = useToolState("quadratic-equation-solver:c", "2");

  const A = parseFloat(a);
  const B = parseFloat(b);
  const C = parseFloat(c);
  const valid = !isNaN(A) && !isNaN(B) && !isNaN(C);
  const disc = valid ? B * B - 4 * A * C : 0;

  function solve() {
    if (!valid) return { roots: "", steps: [] as string[] };
    const eq1 = `${fmt(A)}x² ${sign(B)} ${fmt(Math.abs(B))}x ${sign(C)} ${fmt(Math.abs(C))} = 0`;
    const steps = [
      `${t("Equation", "សមីការ")}: ${eq1}`,
      `${t("Coefficients", "មេគុណ")}: a = ${fmt(A)}, b = ${fmt(B)}, c = ${fmt(C)}`,
      `${t("Discriminant", "ឌីស្គ្រីមីណង់")} Δ = b² − 4ac = ${fmt(B * B)} − ${fmt(4 * A * C)} = ${fmt(disc)}`,
    ];

    if (A === 0) {
      if (B === 0) {
        steps.push(C === 0 ? t("a = b = 0 and c = 0 → every x is a solution", "a = b = 0 និង c = 0 → រាល់ x ជាចម្លើយ") : t("a = b = 0 and c ≠ 0 → no solution", "a = b = 0 និង c ≠ 0 → គ្មានចម្លើយ"));
        return { roots: C === 0 ? t("All real numbers", "ចំនួនពិតទាំងអស់") : t("No solution", "គ្មានចម្លើយ"), steps };
      }
      const x = -C / B;
      steps.push(t("a = 0 → linear equation", "a = 0 → សមីការលីនេអ៊ែរ"));
      steps.push(`x = −c / b = ${fmt(-C)} / ${fmt(B)} = ${fmt(x)}`);
      return { roots: `x = ${fmt(x)}`, steps };
    }

    if (disc > 0) {
      const sqrtD = Math.sqrt(disc);
      const x1 = (-B + sqrtD) / (2 * A);
      const x2 = (-B - sqrtD) / (2 * A);
      steps.push(t("Δ > 0 → two distinct real roots", "Δ > 0 → ឫសពិតពីរផ្សេងគ្នា"));
      steps.push(`√Δ = ${fmt(sqrtD)}`);
      steps.push(`x₁ = (−b + √Δ) / (2a) = (${fmt(-B)} + ${fmt(sqrtD)}) / ${fmt(2 * A)} = ${fmt(x1)}`);
      steps.push(`x₂ = (−b − √Δ) / (2a) = (${fmt(-B)} − ${fmt(sqrtD)}) / ${fmt(2 * A)} = ${fmt(x2)}`);
      return { roots: `x₁ = ${fmt(x1)}, x₂ = ${fmt(x2)}`, steps };
    }

    if (disc === 0) {
      const x = -B / (2 * A);
      steps.push(t("Δ = 0 → one repeated real root", "Δ = 0 → ឫសពិតតែមួយ (រឹសដដែល)"));
      steps.push(`x = −b / (2a) = ${fmt(-B)} / ${fmt(2 * A)} = ${fmt(x)}`);
      return { roots: `x = ${fmt(x)} (${t("double root", "ឫសទ្វេ")})`, steps };
    }

    const re = -B / (2 * A);
    const im = Math.sqrt(-disc) / (2 * A);
    steps.push(t("Δ < 0 → two complex conjugate roots", "Δ < 0 → ឫសកុំផ្លិចពីរភ្ជាប់គ្នា"));
    steps.push(`√|Δ| = ${fmt(Math.sqrt(-disc))}`);
    steps.push(`x = −b/(2a) ± (√|Δ|/(2a))·i`);
    steps.push(`x = ${fmt(re)} ± ${fmt(im)}i`);
    return { roots: `x = ${fmt(re)} ± ${fmt(im)}i`, steps };
  }

  const { roots, steps } = solve();

  return (
    <ToolShell
      title="Quadratic Equation Solver"
      khmerTitle="ដោះស្រាយសមីការដឺក្រេទី២"
      description="Solve ax² + bx + c = 0 and see the discriminant, the real or complex roots, and the full working steps."
      descriptionKm="ដោះស្រាយ ax² + bx + c = 0 ហើយមើលឌីស្គ្រីមីណង់ ឫសពិត ឬឫសកុំផ្លិច និងជំហានគណនាពេញលេញ។"
    >
      <Row>
        <Field label={t("a (x² coefficient)", "a (មេគុណ x²)")}>
          <TextInput inputMode="decimal" value={a} onChange={(e) => setA(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label={t("b (x coefficient)", "b (មេគុណ x)")}>
          <TextInput inputMode="decimal" value={b} onChange={(e) => setB(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label={t("c (constant)", "c (ថេរ)")}>
          <TextInput inputMode="decimal" value={c} onChange={(e) => setC(e.target.value)} className="font-mono-ui" />
        </Field>
      </Row>

      <Output label={`${t("Discriminant", "ឌីស្គ្រីមីណង់")} Δ`} value={valid ? fmt(disc) : ""} error={!valid} />
      <Output label={t("Roots", "ឫស")} value={roots} error={!valid} />
      <Output label={t("Steps", "ជំហាន")} value={steps.join("\n")} error={!valid} />
    </ToolShell>
  );
}
