"use client";
import { useMemo, useRef, useState } from "react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { Download, Image as ImageIcon } from "lucide-react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

type QrType = "text" | "wifi" | "vcard" | "email" | "sms" | "phone";

interface State {
  type: QrType;
  text: string;
  wifiSsid: string;
  wifiPass: string;
  wifiEnc: "WPA" | "WEP" | "nopass";
  vName: string;
  vPhone: string;
  vEmail: string;
  vOrg: string;
  emailTo: string;
  emailSubject: string;
  emailBody: string;
  smsTo: string;
  smsBody: string;
  phone: string;
  fg: string;
  bg: string;
  size: number;
  level: "L" | "M" | "Q" | "H";
  logo: string | null;
}

const initial: State = {
  type: "text",
  text: "https://tmeta.me",
  wifiSsid: "",
  wifiPass: "",
  wifiEnc: "WPA",
  vName: "",
  vPhone: "",
  vEmail: "",
  vOrg: "",
  emailTo: "",
  emailSubject: "",
  emailBody: "",
  smsTo: "",
  smsBody: "",
  phone: "",
  fg: "#0a0c0d",
  bg: "#ffffff",
  size: 260,
  level: "M",
  logo: null,
};

function escapeWifi(v: string) {
  return v.replace(/([\\;,:"])/g, "\\$1");
}

export default function QrGenerator() {
  const [s, setS] = useToolState<State>("qr-generator:v2", initial);
  const update = (patch: Partial<State>) => setS((prev) => ({ ...prev, ...patch }));
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const svgWrapRef = useRef<HTMLDivElement>(null);
  const [logoBusy, setLogoBusy] = useState(false);

  const value = useMemo(() => {
    switch (s.type) {
      case "wifi":
        return `WIFI:T:${s.wifiEnc};S:${escapeWifi(s.wifiSsid)};${s.wifiEnc === "nopass" ? "" : `P:${escapeWifi(s.wifiPass)};`}H:false;;`;
      case "vcard":
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${s.vName}\nORG:${s.vOrg}\nTEL:${s.vPhone}\nEMAIL:${s.vEmail}\nEND:VCARD`;
      case "email":
        return `mailto:${s.emailTo}?subject=${encodeURIComponent(s.emailSubject)}&body=${encodeURIComponent(s.emailBody)}`;
      case "sms":
        return `sms:${s.smsTo}?body=${encodeURIComponent(s.smsBody)}`;
      case "phone":
        return `tel:${s.phone}`;
      default:
        return s.text;
    }
  }, [s]);

  function pickLogo(file: File) {
    setLogoBusy(true);
    const reader = new FileReader();
    reader.onload = () => {
      update({ logo: reader.result as string });
      setLogoBusy(false);
    };
    reader.onerror = () => setLogoBusy(false);
    reader.readAsDataURL(file);
  }

  function downloadPng() {
    const canvas = canvasWrapRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = (canvas as HTMLCanvasElement).toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "qr-code.png";
    a.click();
  }

  function downloadSvg() {
    const svg = svgWrapRef.current?.querySelector("svg");
    if (!svg) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "qr-code.svg";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <ToolShell
      title="QR Code Generator"
      description="Generate a scannable QR code for a link, Wi-Fi network, contact card, email, SMS, or phone number — rendered locally, with custom colors, a center logo, and PNG/SVG export."
    >
      <Field label="Content type">
        <Select value={s.type} onChange={(e) => update({ type: e.target.value as QrType })}>
          <option value="text">URL / Plain text</option>
          <option value="wifi">Wi-Fi network</option>
          <option value="vcard">Contact card (vCard)</option>
          <option value="email">Email</option>
          <option value="sms">SMS</option>
          <option value="phone">Phone number</option>
        </Select>
      </Field>

      {s.type === "text" && (
        <Field label="Content"><TextInput value={s.text} onChange={(e) => update({ text: e.target.value })} placeholder="https://…" /></Field>
      )}

      {s.type === "wifi" && (
        <>
          <Row>
            <Field label="Network name (SSID)"><TextInput value={s.wifiSsid} onChange={(e) => update({ wifiSsid: e.target.value })} /></Field>
            <Field label="Security">
              <Select value={s.wifiEnc} onChange={(e) => update({ wifiEnc: e.target.value as State["wifiEnc"] })}>
                <option value="WPA">WPA / WPA2</option>
                <option value="WEP">WEP</option>
                <option value="nopass">Open (no password)</option>
              </Select>
            </Field>
          </Row>
          {s.wifiEnc !== "nopass" && <Field label="Password"><TextInput value={s.wifiPass} onChange={(e) => update({ wifiPass: e.target.value })} /></Field>}
        </>
      )}

      {s.type === "vcard" && (
        <>
          <Row>
            <Field label="Full name"><TextInput value={s.vName} onChange={(e) => update({ vName: e.target.value })} /></Field>
            <Field label="Organization"><TextInput value={s.vOrg} onChange={(e) => update({ vOrg: e.target.value })} /></Field>
          </Row>
          <Row>
            <Field label="Phone"><TextInput value={s.vPhone} onChange={(e) => update({ vPhone: e.target.value })} /></Field>
            <Field label="Email"><TextInput value={s.vEmail} onChange={(e) => update({ vEmail: e.target.value })} /></Field>
          </Row>
        </>
      )}

      {s.type === "email" && (
        <>
          <Field label="To"><TextInput value={s.emailTo} onChange={(e) => update({ emailTo: e.target.value })} /></Field>
          <Row>
            <Field label="Subject"><TextInput value={s.emailSubject} onChange={(e) => update({ emailSubject: e.target.value })} /></Field>
            <Field label="Body"><TextInput value={s.emailBody} onChange={(e) => update({ emailBody: e.target.value })} /></Field>
          </Row>
        </>
      )}

      {s.type === "sms" && (
        <Row>
          <Field label="To (phone number)"><TextInput value={s.smsTo} onChange={(e) => update({ smsTo: e.target.value })} /></Field>
          <Field label="Message"><TextInput value={s.smsBody} onChange={(e) => update({ smsBody: e.target.value })} /></Field>
        </Row>
      )}

      {s.type === "phone" && (
        <Field label="Phone number"><TextInput value={s.phone} onChange={(e) => update({ phone: e.target.value })} /></Field>
      )}

      <Row>
        <Field label="Foreground color">
          <div className="flex items-center gap-2">
            <input type="color" value={s.fg} onChange={(e) => update({ fg: e.target.value })} className="h-9 w-12 cursor-pointer rounded border border-[var(--ground-line)] bg-transparent" />
            <TextInput value={s.fg} onChange={(e) => update({ fg: e.target.value })} />
          </div>
        </Field>
        <Field label="Background color">
          <div className="flex items-center gap-2">
            <input type="color" value={s.bg} onChange={(e) => update({ bg: e.target.value })} className="h-9 w-12 cursor-pointer rounded border border-[var(--ground-line)] bg-transparent" />
            <TextInput value={s.bg} onChange={(e) => update({ bg: e.target.value })} />
          </div>
        </Field>
      </Row>

      <Row>
        <Field label="Size (px)" hint={`${s.size}px`}>
          <input type="range" min={120} max={600} step={10} value={s.size} onChange={(e) => update({ size: Number(e.target.value) })} className="w-full" />
        </Field>
        <Field label="Error correction" hint={s.logo ? "use High with a logo" : undefined}>
          <Select value={s.level} onChange={(e) => update({ level: e.target.value as State["level"] })}>
            <option value="L">Low (7%)</option>
            <option value="M">Medium (15%)</option>
            <option value="Q">Quartile (25%)</option>
            <option value="H">High (30%)</option>
          </Select>
        </Field>
      </Row>

      <Field label="Center logo (optional)">
        <div className="flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-xs text-[var(--ink-dim)] hover:border-[var(--gold-dim)]">
            <ImageIcon size={14} />
            {logoBusy ? "Loading…" : s.logo ? "Replace logo" : "Upload logo"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pickLogo(f); }} />
          </label>
          {s.logo && (
            <button onClick={() => update({ logo: null })} className="rounded-md border border-[var(--ground-line)] px-2 py-1 text-xs text-[var(--ink-faint)] hover:text-[var(--ink)]">
              Remove
            </button>
          )}
        </div>
      </Field>

      <div className="flex flex-col items-center gap-4 rounded-md border border-[var(--ground-line)] p-6" style={{ background: s.bg }}>
        <div ref={canvasWrapRef}>
          <QRCodeCanvas
            value={value || " "}
            size={s.size}
            fgColor={s.fg}
            bgColor={s.bg}
            level={s.level}
            imageSettings={s.logo ? { src: s.logo, height: Math.round(s.size * 0.22), width: Math.round(s.size * 0.22), excavate: true } : undefined}
          />
        </div>
        {/* hidden SVG twin used only for crisp vector export */}
        <div ref={svgWrapRef} className="hidden">
          <QRCodeSVG value={value || " "} size={s.size} fgColor={s.fg} bgColor={s.bg} level={s.level} />
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={downloadPng}><Download size={13} className="mr-1.5 inline" />PNG</Button>
        <Button onClick={downloadSvg} className="!bg-[var(--ground-raised)] !text-[var(--ink)] border border-[var(--ground-line)] hover:!bg-[var(--ground-raised-hi)]">
          <Download size={13} className="mr-1.5 inline" />SVG
        </Button>
      </div>
    </ToolShell>
  );
}
