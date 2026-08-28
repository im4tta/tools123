"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type Op = "and" | "or" | "xor" | "not" | "shl" | "shr";

/** Parses a decimal or `0x`-prefixed hexadecimal integer, allowing a leading minus sign. */
function parseOperand(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;
  let neg = false;
  let body = s;
  if (body.startsWith("-")) {
    neg = true;
    body = body.slice(1);
  }
  const hex = /^0x/i.test(body);
  if (hex) body = body.slice(2);
  if (!/^[0-9a-f]+$/i.test(body)) return null;
  const n = parseInt(body, hex ? 16 : 10);
  if (!Number.isFinite(n)) return null;
  return neg ? -n : n;
}

/** Interprets a JS number as an unsigned 32-bit integer. */
const toU32 = (n: number) => n >>> 0;
/** Interprets a JS number as a signed 32-bit integer (two's complement). */
const toI32 = (n: number) => n | 0;

export default function BitwiseCalculator() {
  const { text: t } = useLanguage();
  const [a, setA] = useToolState("bitwise:a", "13");
  const [b, setB] = useToolState("bitwise:b", "6");
  const [op, setOp] = useToolState("bitwise:op", "and");

  const result = useMemo(() => {
    const x = parseOperand(a);
    if (x === null) return null;
    const needsB = op !== "not";
    const y = needsB ? parseOperand(b) : null;
    if (needsB && y === null) return null;

    let v: number;
    switch (op as Op) {
      case "and":
        v = toI32(x & (y as number));
        break;
      case "or":
        v = toI32(x | (y as number));
        break;
      case "xor":
        v = toI32(x ^ (y as number));
        break;
      case "not":
        v = toI32(~x);
        break;
      case "shl":
        v = toI32(x << ((y as number) & 31));
        break;
      case "shr":
        v = toI32(x >> ((y as number) & 31));
        break;
      default:
        v = 0;
    }

    const u = toU32(v);
    const bin = u.toString(2).padStart(32, "0");
    return {
      signed: v,
      unsigned: u,
      hex: u.toString(16).toUpperCase().padStart(8, "0"),
      bin,
      oct: u.toString(8),
      bitLength: u === 0 ? 0 : 32 - Math.clz32(u),
      popcount: bin.split("1").length - 1,
    };
  }, [a, b, op]);

  return (
    <ToolShell
      title="Bitwise Calculator"
      khmerTitle="គណនាប៊ីត"
      description="Bitwise AND, OR, XOR, NOT, shift-left and shift-right on 32-bit integers, with results in decimal, hex, binary and octal."
      descriptionKm="គណនា AND, OR, XOR, NOT, ប្ដូរឆ្វេង និងប្ដូរស្ដាំ លើចំនួនគត់ ៣២ ប៊ីត ដោយបង្ហាញលទ្ធផលជាទសភាគ គោលដប់ប្រាំមួយ គោលពីរ និងគោលប្រាំបី។"
    >
      <Row>
        <Field label={t("First operand", "ប្រមាណវិធីទីមួយ")} hint={t("decimal or 0x hex", "ទសភាគ ឬ 0x គោលដប់ប្រាំមួយ")}>
          <TextInput inputMode="text" value={a} onChange={(e) => setA(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label={t("Second operand / shift", "ប្រមាណវិធីទីពីរ / ចំនួនប្ដូរ")} hint={t("decimal or 0x hex", "ទសភាគ ឬ 0x គោលដប់ប្រាំមួយ")}>
          <TextInput inputMode="text" value={b} onChange={(e) => setB(e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label={t("Operation", "ប្រមាណវិធី")}>
          <Select value={op} onChange={(e) => setOp(e.target.value)}>
            <option value="and">AND (a &amp; b)</option>
            <option value="or">OR (a | b)</option>
            <option value="xor">XOR (a ^ b)</option>
            <option value="not">NOT (~a)</option>
            <option value="shl">SHL (a &lt;&lt; b)</option>
            <option value="shr">SHR (a &gt;&gt; b)</option>
          </Select>
        </Field>
      </Row>

      <p className="text-xs leading-relaxed text-[var(--ink-dim)]">
        {t(
          "Negative values are handled as 32-bit two's complement. Results are shown as both signed and unsigned 32-bit values.",
          "តម្លៃអវិជ្ជមានត្រូវបានគណនាជា two's complement ទំហំ ៣២ ប៊ីត។ លទ្ធផលបង្ហាញទាំងតម្លៃសញ្ញានិងគ្មានសញ្ញា ៣២ ប៊ីត។"
        )}
      </p>

      {result ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Decimal (signed)", "ទសភាគ (មានសញ្ញា)")}</div>
            <div className="mt-1 font-mono-ui text-lg font-semibold text-[var(--ink)]">{result.signed}</div>
          </div>
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Decimal (unsigned)", "ទសភាគ (គ្មានសញ្ញា)")}</div>
            <div className="mt-1 font-mono-ui text-lg font-semibold text-[var(--gold)]">{result.unsigned}</div>
          </div>
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Hex (32-bit)", "គោលដប់ប្រាំមួយ (៣២ ប៊ីត)")}</div>
            <div className="mt-1 font-mono-ui text-lg font-semibold text-[var(--ink)]">0x{result.hex}</div>
          </div>
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Octal", "គោលប្រាំបី")}</div>
            <div className="mt-1 font-mono-ui text-lg font-semibold text-[var(--ink)]">0o{result.oct}</div>
          </div>
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 sm:col-span-2 lg:col-span-4">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Binary (32-bit)", "គោលពីរ (៣២ ប៊ីត)")}</div>
            <div className="mt-1 break-all font-mono-ui text-sm leading-relaxed text-[var(--ink)]">{result.bin}</div>
          </div>
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Bit length", "ប្រវែងប៊ីត")}</div>
            <div className="mt-1 font-mono-ui text-lg font-semibold text-[var(--gold)]">{result.bitLength}</div>
          </div>
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t("Popcount (set bits)", "ចំនួនប៊ីតដែលជា 1")}</div>
            <div className="mt-1 font-mono-ui text-lg font-semibold text-[var(--ink)]">{result.popcount}</div>
          </div>
        </div>
      ) : (
        <p className="text-sm font-medium text-[var(--gold)]">
          {t("Enter valid integers (decimal or 0x hex).", "សូមបញ្ចូលចំនួនគត់ឱ្យបានត្រឹមត្រូវ (ទសភាគ ឬ 0x គោលដប់ប្រាំមួយ)។")}
        </p>
      )}
    </ToolShell>
  );
}
