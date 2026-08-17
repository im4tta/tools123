"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field, Select } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

function jsonToXml(value: unknown, tag = "root", depth = 0): string {
  const pad = "  ".repeat(depth);
  if (value === null) return `${pad}<${tag} null="true"/>`;
  if (Array.isArray(value)) {
    return value.map((item) => jsonToXml(item, "item", depth)).join("\n");
  }
  if (typeof value === "object") {
    const inner = Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => jsonToXml(v, k, depth + 1))
      .join("\n");
    return `${pad}<${tag}>\n${inner}\n${pad}</${tag}>`;
  }
  const escaped = String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  return `${pad}<${tag}>${escaped}</${tag}>`;
}

function xmlToJson(xml: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");
  if (doc.querySelector("parsererror")) throw new Error("Invalid XML");

  function convert(el: Element): unknown {
    const children = Array.from(el.children);
    const text = el.textContent?.trim() ?? "";

    if (children.length === 0) {
      // leaf: try numeric, boolean, null
      if (text === "") return null;
      if (el.getAttribute("null") === "true") return null;
      const n = Number(text);
      if (text !== "" && Number.isFinite(n)) return n;
      if (text === "true") return true;
      if (text === "false") return false;
      return text;
    }

    const obj: Record<string, unknown> = {};
    for (const child of children) {
      const key = child.tagName;
      const val = convert(child);
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const existing = obj[key];
        obj[key] = Array.isArray(existing) ? [...existing, val] : [existing, val];
      } else {
        obj[key] = val;
      }
    }
    return obj;
  }

  const root = doc.documentElement;
  const result: Record<string, unknown> = { [root.tagName]: convert(root) };
  return JSON.stringify(result, null, 2);
}

export default function JsonXmlConverter() {
  const [direction, setDirection] = useToolState("json-xml:direction", "json2xml");
  const [input, setInput] = useToolState("json-xml:input", '{"person":{"name":"Sokha","age":30,"active":true}}');

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: "", error: false };
    try {
      if (direction === "json2xml") {
        return { output: jsonToXml(JSON.parse(input)), error: false };
      }
      return { output: xmlToJson(input), error: false };
    } catch (e) {
      return { output: e instanceof Error ? e.message : "Invalid input", error: true };
    }
  }, [input, direction]);

  return (
    <ToolShell
      title="JSON ↔ XML Converter"
      khmerTitle="បម្លែង JSON ↔ XML"
      description="Convert between JSON and XML in both directions."
      descriptionKm="បម្លែងរវាង JSON និង XML ទាំងពីរទិសដៅ។"
    >
      <Field label="Direction">
        <Select value={direction} onChange={(e) => setDirection(e.target.value)} className="w-40">
          <option value="json2xml">JSON → XML</option>
          <option value="xml2json">XML → JSON</option>
        </Select>
      </Field>
      <Field label={direction === "json2xml" ? "Input JSON" : "Input XML"}>
        <TextArea rows={10} value={input} onChange={(e) => setInput(e.target.value)} />
      </Field>
      <Output label={error ? "Error" : "Output"} value={output} error={error} />
    </ToolShell>
  );
}
