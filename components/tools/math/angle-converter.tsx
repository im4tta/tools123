"use client";
import { ToolShell, Field, Row, TextInput } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const round8 = (n: number) => String(Math.round(n * 1e8) / 1e8);

export default function AngleConverter() {
  const { text: t } = useLanguage();
  const [deg, setDeg] = useToolState("angle-converter:deg", "45");
  const [rad, setRad] = useToolState("angle-converter:rad", "0.78539816");
  const [grad, setGrad] = useToolState("angle-converter:grad", "50");
  const [turn, setTurn] = useToolState("angle-converter:turn", "0.125");

  function update(from: "deg" | "rad" | "grad" | "turn", value: string) {
    const num = parseFloat(value);
    if (isNaN(num)) {
      if (from === "deg") setDeg(value);
      else if (from === "rad") setRad(value);
      else if (from === "grad") setGrad(value);
      else setTurn(value);
      return;
    }
    let d: number;
    switch (from) {
      case "deg":
        d = num;
        break;
      case "rad":
        d = (num * 180) / Math.PI;
        break;
      case "grad":
        d = (num * 9) / 10;
        break;
      case "turn":
        d = num * 360;
        break;
    }
    setDeg(round8(d));
    setRad(round8((d * Math.PI) / 180));
    setGrad(round8((d * 10) / 9));
    setTurn(round8(d / 360));
  }

  return (
    <ToolShell
      title="Angle Converter"
      khmerTitle="បំលែងមុំ"
      description="Convert an angle between degrees, radians, gradians and turns — editing any field updates the others live."
      descriptionKm="បំលែងមុំរវាងដឺក្រេ រ៉ាដ្យង់ ហ្គ្រេដ្យង់ និងវេន — ការកែប្រែប្រអប់ណាមួយ នឹងធ្វើបច្ចុប្បន្នភាពប្រអប់ផ្សេងទៀតភ្លាមៗ។"
    >
      <Row>
        <Field label={t("Degrees (°)", "ដឺក្រេ (°)")}>
          <TextInput inputMode="decimal" value={deg} onChange={(e) => update("deg", e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label={t("Radians (rad)", "រ៉ាដ្យង់ (rad)")}>
          <TextInput inputMode="decimal" value={rad} onChange={(e) => update("rad", e.target.value)} className="font-mono-ui" />
        </Field>
      </Row>
      <Row>
        <Field label={t("Gradians (gon)", "ហ្គ្រេដ្យង់ (gon)")}>
          <TextInput inputMode="decimal" value={grad} onChange={(e) => update("grad", e.target.value)} className="font-mono-ui" />
        </Field>
        <Field label={t("Turns", "វេន")}>
          <TextInput inputMode="decimal" value={turn} onChange={(e) => update("turn", e.target.value)} className="font-mono-ui" />
        </Field>
      </Row>

      <p className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-xs leading-relaxed text-[var(--ink-faint)]">
        {t(
          "Conversion factors: 1 turn = 360° = 2π rad = 400 gon. Degrees = radians × 180/π; gradians = degrees × 10/9.",
          "កត្តាបំលែង៖ 1 វេន = 360° = 2π rad = 400 gon។ ដឺក្រេ = រ៉ាដ្យង់ × 180/π; ហ្គ្រេដ្យង់ = ដឺក្រេ × 10/9។"
        )}
      </p>
    </ToolShell>
  );
}
