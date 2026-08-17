"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type JsVal = string | number | boolean | null | JsVal[] | { [k: string]: JsVal };

function typeOf(v: JsVal): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  if (typeof v === "number") return "number";
  if (typeof v === "boolean") return "boolean";
  if (typeof v === "string") return "string";
  return "object";
}

function schemaOf(v: JsVal, title?: string): unknown {
  const t = typeOf(v);
  const base: Record<string, unknown> = {};
  if (title) base.title = title;
  if (Array.isArray(v)) {
    const items = v.length > 0 ? v.map((val) => schemaOf(val)) : [];
    const first = items[0];
    return { ...base, type: "array", items: first ?? { type: "string" } };
  }
  if (t === "object" && v !== null) {
    const props: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v as { [k: string]: JsVal })) {
      props[k] = schemaOf(val);
    }
    return { ...base, type: "object", properties: props, required: Object.keys(v).slice(0, Object.keys(v).length) };
  }
  if (t === "number") return { ...base, type: "number" };
  if (t === "boolean") return { ...base, type: "boolean" };
  if (t === "null") return { ...base, type: "null" };
  return { ...base, type: "string" };
}

export default function JsonToSchema() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("json-schema:input", '{\n  "name": "Sok",\n  "age": 25,\n  "active": true,\n  "tags": ["khmer", "dev"],\n  "address": { "city": "Phnom Penh" }\n}');

  const schema = useMemo(() => {
    try {
      const parsed = JSON.parse(input) as JsVal;
      return JSON.stringify(schemaOf(parsed), null, 2);
    } catch {
      return "";
    }
  }, [input]);

  return (
    <ToolShell
      title="JSON → JSON Schema"
      khmerTitle="បម្លែង JSON → Schema"
      description="Derive a JSON Schema draft from a sample JSON object."
      descriptionKm="ទាញយក JSON Schema draft ពីវត្ថុ JSON គំរូមួយ។"
    >
      <Field label={t("Sample JSON", "គំរូ JSON")}>
        <TextArea rows={10} value={input} onChange={(e) => setInput(e.target.value)} />
      </Field>
      {schema ? (
        <Output label={t("JSON Schema", "Schema")} value={schema} />
      ) : (
        <p className="text-sm text-[var(--danger)]">{t("Enter valid JSON", "សូមបញ្ចូល JSON ឱ្យបានត្រឹមត្រូវ")}</p>
      )}
    </ToolShell>
  );
}