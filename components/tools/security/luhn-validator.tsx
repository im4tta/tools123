"use client";
import { ToolShell, TextInput, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

function luhnValid(digits: string) {
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (alt) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export default function LuhnValidator() {
  const [input, setInput] = useToolState("luhn-validator:input", "4111 1111 1111 1111");
  const digits = input.replace(/\D/g, "");
  const valid = digits.length >= 8 && luhnValid(digits);

  return (
    <ToolShell title="Luhn Algorithm Card Validator" description="Checks the Luhn (mod 10) checksum used by credit card, IMEI, and other identifier numbers. Does not verify a real card is active.">
      <Field label="Number"><TextInput value={input} onChange={(e) => setInput(e.target.value)} className="font-mono-ui" /></Field>
      <Output label="Result" value={digits.length < 8 ? "Enter at least 8 digits" : valid ? "Passes Luhn check" : "Fails Luhn check"} error={digits.length >= 8 && !valid} />
    </ToolShell>
  );
}
