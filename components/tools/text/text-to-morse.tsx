"use client";
import { ToolShell, TextArea, Field, Select } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

const MORSE: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....",
  I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.",
  Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
  Y: "-.--", Z: "--..", "0": "-----", "1": ".----", "2": "..---", "3": "...--",
  "4": "....-", "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
  ".": ".-.-.-", ",": "--..--", "?": "..--..",
};
const REVERSE: Record<string, string> = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]));

export default function TextToMorse() {
  const [input, setInput] = useToolState("text-to-morse:input", "SOS ANGKOR");
  const [direction, setDirection] = useToolState<"encode" | "decode">("text-to-morse:direction", "encode");

  function encode(text: string) {
    return text.toUpperCase().split(" ").map((word) =>
      [...word].map((ch) => MORSE[ch] ?? "").filter(Boolean).join(" ")
    ).join(" / ");
  }
  function decode(morse: string) {
    return morse.split(" / ").map((word) =>
      word.trim().split(/\s+/).map((code) => REVERSE[code] ?? "").join("")
    ).join(" ");
  }

  return (
    <ToolShell title="Text ⟷ Morse Code" description="Encode text to International Morse Code (words separated by /) or decode it back.">
      <Field label="Mode">
        <Select value={direction} onChange={(e) => setDirection(e.target.value as typeof direction)}>
          <option value="encode">Text → Morse</option>
          <option value="decode">Morse → Text</option>
        </Select>
      </Field>
      <Field label="Input"><TextArea rows={4} value={input} onChange={(e) => setInput(e.target.value)} className="font-mono-ui" /></Field>
      <Output label="Output" value={direction === "encode" ? encode(input) : decode(input)} />
    </ToolShell>
  );
}
