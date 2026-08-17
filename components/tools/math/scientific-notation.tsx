"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const PREFIXES = [
  { sym: "T", exp: 12, name: "Tera" }, { sym: "G", exp: 9, name: "Giga" }, { sym: "M", exp: 6, name: "Mega" },
  { sym: "k", exp: 3, name: "Kilo" }, { sym: "", exp: 0, name: "" }, { sym: "m", exp: -3, name: "milli" },
  { sym: "µ", exp: -6, name: "micro" }, { sym: "n", exp: -9, name: "nano" }, { sym: "p", exp: -12, name: "pico" },
];

export default function ScientificNotation() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("sci-notation:input", "1234000");
  const [mode, setMode] = useToolState("sci-notation:mode", "toSci");

  type Res = { err: boolean; sci: string; eng: string; normal: string };

  const result = useMemo<Res>(() => {
    const n = parseFloat(input);
    if (Number.isNaN(n)) return { err: true, sci: "", eng: "", normal: "" };
    if (mode === "toSci") {
      const exp = n === 0 ? 0 : Math.floor(Math.log10(Math.abs(n)));
      const mant = n === 0 ? 0 : n / Math.pow(10, exp);
      const eng = PREFIXES.filter((p) => p.sym).find((p) => Math.abs(exp) >= Math.abs(p.exp) && Math.abs(exp) <= Math.abs(p.exp) + 2);
      return {
        err: false,
        sci: `${mant.toFixed(4).replace(/0+$/, "").replace(/\.$/, "")} × 10${exp >= 0 ? "" : "⁻"}${Math.abs(exp)}`,
        eng: eng ? `${(n / Math.pow(10, eng.exp)).toFixed(4).replace(/0+$/, "").replace(/\.$/, "")} ${eng.sym}` : n.toLocaleString("en-US"),
        normal: n.toLocaleString("en-US", { maximumFractionDigits: 12 }),
      };
    }
    const m = input.trim().match(/^([-+]?\d*\.?\d+)\s*[eE]\s*([-+]?\d+)$/);
    if (!m) return { err: true, sci: "", eng: "", normal: "" };
    const val = parseFloat(m[1]) * Math.pow(10, parseInt(m[2], 10));
    return { err: false, sci: `${m[1]} × 10^${m[2]}`, eng: val.toLocaleString("en-US", { maximumFractionDigits: 12 }), normal: val.toLocaleString("en-US", { maximumFractionDigits: 12 }) };
  }, [input, mode]);

  return (
    <ToolShell
      title="Scientific Notation Converter"
      khmerTitle="បម្លែងអិចស្ប៉ូណង់ស្យែល"
      description="Convert between normal numbers and scientific notation, with SI prefixes."
      descriptionKm="បម្លែងរវាងចំនួនធម្មតា និងសញ្ញាណអិចស្ប៉ូណង់ស្យែល ជាមួយបុព្វបទ SI។"
    >
      <Row>
        <Field label={t("Mode", "របៀប")}>
          <Select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="toSci">{t("Number → Scientific", "លេខ → អិចស្ប៉ូណង់ស្យែល")}</option>
            <option value="fromSci">{t("Scientific → Number", "អិចស្ប៉ូណង់ស្យែល → លេខ")}</option>
          </Select>
        </Field>
        <Field label={t("Value", "តម្លៃ")}>
          <TextInput value={input} onChange={(e) => setInput(e.target.value)} placeholder={mode === "toSci" ? "1234000" : "1.234e6"} />
        </Field>
      </Row>
      {result.err ? (
        <p className="text-sm text-[var(--danger)]">{t("Enter a valid number", "សូមបញ្ចូលលេខឱ្យបានត្រឹមត្រូវ")}</p>
      ) : (
        <>
          <Output label={t("Scientific notation", "សញ្ញាណអិចស្ប៉ូណង់ស្យែល")} value={result.sci} />
          <Output label={t("Normal number", "ចំនួនធម្មតា")} value={result.normal} />
          <Output label={t("SI prefix", "បុព្វបទ SI")} value={result.eng} />
        </>
      )}
    </ToolShell>
  );
}