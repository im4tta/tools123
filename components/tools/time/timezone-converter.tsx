"use client";
import { ToolShell, TextInput, Field, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

const ZONES = [
  "UTC", "Asia/Phnom_Penh", "Asia/Bangkok", "Asia/Singapore", "Asia/Tokyo", "Asia/Shanghai",
  "Asia/Kolkata", "Asia/Dubai", "Europe/London", "Europe/Paris", "America/New_York",
  "America/Los_Angeles", "America/Chicago", "Australia/Sydney",
];

export default function TimezoneConverter() {
  const [datetime, setDatetime] = useToolState("timezone-converter:datetime", new Date().toISOString().slice(0, 16));
  const [from, setFrom] = useToolState("timezone-converter:from", "Asia/Phnom_Penh");
  const [to, setTo] = useToolState("timezone-converter:to", "UTC");

  function convert() {
    try {
      const utcDate = new Date(new Date(datetime).toLocaleString("en-US", { timeZone: from }));
      const offsetMs = new Date(datetime).getTime() - utcDate.getTime();
      const trueUtc = new Date(new Date(datetime).getTime() + offsetMs);
      return new Intl.DateTimeFormat("en-US", {
        timeZone: to, year: "numeric", month: "short", day: "2-digit",
        hour: "2-digit", minute: "2-digit", hour12: false,
      }).format(trueUtc);
    } catch {
      return "";
    }
  }

  return (
    <ToolShell title="Timezone Converter" description="Convert a date and time from one timezone to another.">
      <Field label="Date & time"><TextInput type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} className="font-mono-ui" /></Field>
      <Row>
        <Field label="From">
          <Select value={from} onChange={(e) => setFrom(e.target.value)}>
            {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
          </Select>
        </Field>
        <Field label="To">
          <Select value={to} onChange={(e) => setTo(e.target.value)}>
            {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
          </Select>
        </Field>
      </Row>
      <Output label="Converted" value={convert()} />
    </ToolShell>
  );
}
