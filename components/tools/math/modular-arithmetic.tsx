"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type Mode = "sum" | "diff" | "prod" | "pow" | "inverse" | "congruence";

const MODES: { id: Mode; label: [string, string] }[] = [
  { id: "sum", label: ["(a + b) mod m", "(a + b) mod m"] },
  { id: "diff", label: ["(a − b) mod m", "(a − b) mod m"] },
  { id: "prod", label: ["(a × b) mod m", "(a × b) mod m"] },
  { id: "pow", label: ["a^b mod m", "a^b mod m"] },
  { id: "inverse", label: ["a⁻¹ mod m (inverse)", "a⁻¹ mod m (អាំងវឺស)"] },
  { id: "congruence", label: ["a·x ≡ b (mod m)", "a·x ≡ b (mod m)"] },
];

interface Result {
  steps: string[];
  answer: string | null;
  noSolution?: boolean;
}

type Translate = (en: string, km: string) => string;

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const next = x % y;
    x = y;
    y = next;
  }
  return x;
}

/** Extended Euclidean algorithm: returns gcd and the Bézout coefficients. */
function egcd(a: number, b: number): { gcd: number; s: number; t: number; steps: string[] } {
  let oldR = a;
  let r = b;
  let oldS = 1;
  let s = 0;
  let oldT = 0;
  let t = 1;
  const steps: string[] = [];
  while (r !== 0) {
    const q = Math.floor(oldR / r);
    steps.push(`${oldR} = ${q}·${r} + ${oldR - q * r}`);
    [oldR, r] = [r, oldR - q * r];
    [oldS, s] = [s, oldS - q * s];
    [oldT, t] = [t, oldT - q * t];
  }
  return { gcd: oldR, s: oldS, t: oldT, steps };
}

function compute(aStr: string, bStr: string, mStr: string, mode: Mode, tr: Translate): Result | null {
  if (!/^-?\d+$/.test(aStr.trim()) || !/^\d+$/.test(mStr.trim())) return null;
  if (mode !== "inverse" && !/^-?\d+$/.test(bStr.trim())) return null;
  const a = Number(aStr.trim());
  const m = Number(mStr.trim());
  const b = mode === "inverse" ? 0 : Number(bStr.trim());
  const LIMIT = 1_000_000;
  if (m < 2 || m > LIMIT || Math.abs(a) > LIMIT || Math.abs(b) > LIMIT) return null;

  switch (mode) {
    case "sum": {
      const sum = a + b;
      const ans = mod(sum, m);
      return {
        steps: [
          tr(`${a} + ${b} = ${sum}`, `${a} + ${b} = ${sum}`),
          tr(`${sum} mod ${m} = ${ans}`, `${sum} mod ${m} = ${ans}`),
        ],
        answer: tr(`(${a} + ${b}) mod ${m} = ${ans}`, `(${a} + ${b}) mod ${m} = ${ans}`),
      };
    }
    case "diff": {
      const diff = a - b;
      const ans = mod(diff, m);
      const steps: string[] = [tr(`${a} − ${b} = ${diff}`, `${a} − ${b} = ${diff}`)];
      if (diff < 0) {
        steps.push(
          tr(
            `Negative → add ${m} until positive: ${diff} mod ${m} = ${ans}`,
            `អវិជ្ជមាន → បូក ${m} រហូតវិជ្ជមាន: ${diff} mod ${m} = ${ans}`
          )
        );
      }
      steps.push(tr(`(${a} − ${b}) mod ${m} = ${ans}`, `(${a} − ${b}) mod ${m} = ${ans}`));
      return { steps, answer: tr(`(${a} − ${b}) mod ${m} = ${ans}`, `(${a} − ${b}) mod ${m} = ${ans}`) };
    }
    case "prod": {
      const prod = a * b;
      const ans = mod(prod, m);
      return {
        steps: [
          tr(`${a} × ${b} = ${prod}`, `${a} × ${b} = ${prod}`),
          tr(`${prod} mod ${m} = ${ans}`, `${prod} mod ${m} = ${ans}`),
        ],
        answer: tr(`(${a} × ${b}) mod ${m} = ${ans}`, `(${a} × ${b}) mod ${m} = ${ans}`),
      };
    }
    case "pow": {
      if (b < 0) {
        return {
          steps: [tr("The exponent must be 0 or positive.", "និទស្សន្តត្រូវតែ 0 ឬវិជ្ជមាន។")],
          answer: null,
          noSolution: true,
        };
      }
      if (a === 0 && b === 0) {
        return { steps: [tr("0^0 is undefined.", "0^0 មិនមានន័យ។")], answer: null, noSolution: true };
      }
      const base = mod(a, m);
      if (b === 0) {
        const ans = mod(1, m);
        return {
          steps: [
            tr(`${a}^0 = 1 (any non-zero base to the power 0 is 1)`, `${a}^0 = 1 (គោលណាមិនសូន្យដល់អំណាច 0 ស្មើ 1)`),
            tr(`1 mod ${m} = ${ans}`, `1 mod ${m} = ${ans}`),
          ],
          answer: tr(`${a}^${b} mod ${m} = ${ans}`, `${a}^${b} mod ${m} = ${ans}`),
        };
      }
      const steps: string[] = [tr(`Reduce base: ${a} mod ${m} = ${base}`, `បន្ថយគោល: ${a} mod ${m} = ${base}`)];
      const binary = b.toString(2);
      steps.push(tr(`${b} in binary = ${binary}₂ (square-and-multiply, left to right)`, `${b} ជាគោលពីរ = ${binary}₂ (ការ៉េហើយគុណ ពីឆ្វេងទៅស្តាំ)`));
      let result = 1;
      for (const bit of binary) {
        result = mod(result * result, m);
        steps.push(tr(`square: result = ${result}`, `ការ៉េ: result = ${result}`));
        if (bit === "1") {
          result = mod(result * base, m);
          steps.push(tr(`bit 1 → multiply by base: result = ${result}`, `ប៊ីត 1 → គុណនឹងគោល: result = ${result}`));
        }
      }
      return { steps, answer: tr(`${a}^${b} mod ${m} = ${result}`, `${a}^${b} mod ${m} = ${result}`) };
    }
    case "inverse": {
      const aa = mod(a, m);
      if (aa === 0) {
        return {
          steps: [tr(`${a} ≡ 0 (mod ${m}) — zero has no modular inverse.`, `${a} ≡ 0 (mod ${m}) — សូន្យគ្មានអាំងវឺសទេ។`)],
          answer: null,
          noSolution: true,
        };
      }
      const { gcd: g, s, t, steps } = egcd(aa, m);
      if (g !== 1) {
        steps.push(tr(`gcd(${a}, ${m}) = ${g} ≠ 1 → no modular inverse exists.`, `gcd(${a}, ${m}) = ${g} ≠ 1 → គ្មានអាំងវឺសទេ។`));
        return { steps, answer: null, noSolution: true };
      }
      const inv = mod(s, m);
      steps.push(tr("gcd = 1 → the inverse exists.", "gcd = 1 → អាំងវឺសមាន។"));
      steps.push(tr(`Bézout: ${aa}·(${s}) + ${m}·(${t}) = 1`, `Bézout: ${aa}·(${s}) + ${m}·(${t}) = 1`));
      steps.push(tr(`${aa}·${s} ≡ 1 (mod ${m})`, `${aa}·${s} ≡ 1 (mod ${m})`));
      steps.push(
        tr(
          `Check: ${a} × ${inv} = ${a * inv} ≡ ${mod(a * inv, m)} (mod ${m}) ✓`,
          `ពិនិត្យ: ${a} × ${inv} = ${a * inv} ≡ ${mod(a * inv, m)} (mod ${m}) ✓`
        )
      );
      return { steps, answer: tr(`${a}⁻¹ mod ${m} = ${inv}`, `${a}⁻¹ mod ${m} = ${inv}`) };
    }
    case "congruence": {
      const g = gcd(a, m);
      const steps: string[] = [tr(`gcd(${a}, ${m}) = ${g}`, `gcd(${a}, ${m}) = ${g}`)];
      if (mod(b, m) % g !== 0) {
        steps.push(tr(`${g} does not divide ${b} → no solution.`, `${g} មិនចែកដាច់ ${b} → គ្មានចម្លើយ។`));
        return { steps, answer: null, noSolution: true };
      }
      if (mod(a, m) === 0) {
        if (mod(b, m) === 0) {
          steps.push(tr(`${a} ≡ 0 (mod ${m}) and ${b} ≡ 0 (mod ${m}) → every x is a solution.`, `${a} ≡ 0 (mod ${m}) និង ${b} ≡ 0 (mod ${m}) → គ្រប់ x ជាចម្លើយ។`));
          return { steps, answer: tr(`x ≡ anything (mod ${m}) — ${m} solutions`, `x ≡ អ្វីក៏បាន (mod ${m}) — ចម្លើយ ${m}`) };
        }
        steps.push(tr(`${a} ≡ 0 (mod ${m}) but ${b} ≢ 0 (mod ${m}) → no solution.`, `${a} ≡ 0 (mod ${m}) ប៉ុន្តែ ${b} ≢ 0 (mod ${m}) → គ្មានចម្លើយ។`));
        return { steps, answer: null, noSolution: true };
      }
      const ap = a / g;
      const bp = b / g;
      const mp = m / g;
      steps.push(
        tr(
          `${g} divides ${b} → reduce: ${a}·x ≡ ${b} (mod ${m})  ⇒  ${ap}·x ≡ ${bp} (mod ${mp})`,
          `${g} ចែកដាច់ ${b} → បន្ថយ: ${a}·x ≡ ${b} (mod ${m})  ⇒  ${ap}·x ≡ ${bp} (mod ${mp})`
        )
      );
      if (mp === 1) {
        return {
          steps: [...steps, tr(`Reduced modulus is 1 → every x (mod ${m}) is a solution (${g} solutions).`, `ម៉ូឌុលបន្ថយស្មើ 1 → គ្រប់ x (mod ${m}) ជាចម្លើយ (ចម្លើយ ${g})។`)],
          answer: tr(`x ≡ anything (mod ${m})`, `x ≡ អ្វីក៏បាន (mod ${m})`),
        };
      }
      const { gcd: g2, s, t, steps: es } = egcd(ap, mp);
      const inv = mod(s, mp);
      steps.push(...es);
      steps.push(tr(`Bézout: ${ap}·(${s}) + ${mp}·(${t}) = ${g2}`, `Bézout: ${ap}·(${s}) + ${mp}·(${t}) = ${g2}`));
      steps.push(tr(`Inverse: ${ap}⁻¹ ≡ ${inv} (mod ${mp})`, `អាំងវឺស: ${ap}⁻¹ ≡ ${inv} (mod ${mp})`));
      const x0 = mod(bp * inv, mp);
      steps.push(tr(`x₀ = ${bp} × ${inv} = ${bp * inv} ≡ ${x0} (mod ${mp})`, `x₀ = ${bp} × ${inv} = ${bp * inv} ≡ ${x0} (mod ${mp})`));
      const solutions: number[] = [];
      for (let k = 0; k < g; k++) solutions.push(mod(x0 + k * mp, m));
      steps.push(tr(`All solutions: x ≡ ${solutions.join(", ")} (mod ${m})`, `ចម្លើយទាំងអស់: x ≡ ${solutions.join(", ")} (mod ${m})`));
      return {
        steps,
        answer: tr(`x ≡ ${x0} (mod ${mp}) → x ∈ { ${solutions.join(", ")} } (mod ${m})`, `x ≡ ${x0} (mod ${mp}) → x ∈ { ${solutions.join(", ")} } (mod ${m})`),
      };
    }
  }
}

export default function ModularArithmetic() {
  const { text: t } = useLanguage();
  const [mode, setMode] = useToolState<Mode>("modular-arithmetic:mode", "sum");
  const [a, setA] = useToolState("modular-arithmetic:a", "17");
  const [b, setB] = useToolState("modular-arithmetic:b", "5");
  const [m, setM] = useToolState("modular-arithmetic:m", "7");

  const result = useMemo(() => compute(a, b, m, mode, t), [a, b, m, mode, t]);

  return (
    <ToolShell
      title="Modular Arithmetic Calculator"
      khmerTitle="គណនានព្វន្តម៉ូឌុល"
      description="Compute sums, differences, products, powers, inverses and small linear congruences modulo m — with every step shown."
      descriptionKm="គណនាផលបូក ផលដក ផលគុណ អំណាច អាំងវឺស និងសមីការលីនេអ៊ែរតូចៗ ម៉ូឌុល m — បង្ហាញរាល់ជំហាន។"
    >
      <Row>
        <Field label={t("Operation", "ប្រមាណវិធី")}>
          <Select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
            {MODES.map((md) => (
              <option key={md.id} value={md.id}>
                {t(md.label[0], md.label[1])}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("a", "a")} hint={t("±1,000,000", "±១,០០០,០០០")}>
          <TextInput inputMode="numeric" value={a} onChange={(e) => setA(e.target.value)} className="font-mono-ui" />
        </Field>
        {mode !== "inverse" && (
          <Field label={t("b", "b")} hint={t("±1,000,000", "±១,០០០,០០០")}>
            <TextInput inputMode="numeric" value={b} onChange={(e) => setB(e.target.value)} className="font-mono-ui" />
          </Field>
        )}
        <Field label={t("Modulus m", "ម៉ូឌុល m")} hint={t("2–1,000,000", "២–១,០០០,០០០")}>
          <TextInput inputMode="numeric" value={m} onChange={(e) => setM(e.target.value)} className="font-mono-ui" />
        </Field>
      </Row>

      {result ? (
        <Output
          label={t("Steps", "ជំហាន")}
          value={result.answer ? [...result.steps, "", t("Answer", "ចម្លើយ") + ": " + result.answer].join("\n") : result.steps.join("\n")}
          error={result.noSolution ?? false}
        />
      ) : (
        <p className="text-sm text-[var(--danger)]">
          {t(
            "Enter integers: a and b up to ±1,000,000, modulus m from 2 to 1,000,000.",
            "សូមបញ្ចូលចំនួនគត់: a និង b មិនលើស ±១,០០០,០០០ ម៉ូឌុល m ពី ២ ដល់ ១,០០០,០០០។"
          )}
        </p>
      )}
    </ToolShell>
  );
}
