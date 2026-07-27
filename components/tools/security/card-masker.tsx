"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

interface State {
  number: string;
  visibleDigits: number;
  maskChar: string;
}

export default function CardMaskerTool() {
  const [s, setS] = useToolState<State>("card-masker", { number: "4111 1111 1111 1234", visibleDigits: 4, maskChar: "•" });
  const update = (patch: Partial<State>) => setS((prev) => ({ ...prev, ...patch }));

  const masked = useMemo(() => {
    const digits = s.number.replace(/\D/g, "");
    if (digits.length === 0) return "";
    const visible = Math.min(Math.max(0, s.visibleDigits), digits.length);
    const maskedPart = s.maskChar.repeat(digits.length - visible);
    const visiblePart = digits.slice(digits.length - visible);
    const full = maskedPart + visiblePart;
    return full.replace(/(.{4})/g, "$1 ").trim();
  }, [s.number, s.visibleDigits, s.maskChar]);

  return (
    <ToolShell
      title="Credit Card Number Masker"
      description="Mask all but the last few digits of a card number — for screenshots, docs, or support tickets. Nothing here is sent anywhere; it all stays in your browser."
    >
      <Field label="Card number">
        <TextInput value={s.number} onChange={(e) => update({ number: e.target.value })} />
      </Field>
      <Row>
        <Field label="Visible digits">
          <TextInput type="number" min={0} max={8} value={s.visibleDigits} onChange={(e) => update({ visibleDigits: Number(e.target.value) })} />
        </Field>
        <Field label="Mask character">
          <Select value={s.maskChar} onChange={(e) => update({ maskChar: e.target.value })}>
            <option value="•">• dot</option>
            <option value="*">* asterisk</option>
            <option value="X">X letter</option>
          </Select>
        </Field>
      </Row>
      <Output label="Masked" value={masked} />
    </ToolShell>
  );
}
