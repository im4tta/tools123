"use client";
import { useMemo } from "react";
import { ToolShell, TextArea, Field } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

const KEYWORDS = new Set([
  "SELECT", "FROM", "WHERE", "JOIN", "LEFT", "RIGHT", "INNER", "OUTER", "ON",
  "GROUP", "BY", "ORDER", "HAVING", "LIMIT", "OFFSET", "INSERT", "INTO", "VALUES",
  "UPDATE", "SET", "DELETE", "CREATE", "TABLE", "ALTER", "DROP", "AND", "OR", "NOT",
  "NULL", "AS", "DISTINCT", "UNION", "ALL", "CASE", "WHEN", "THEN", "ELSE", "END",
]);

function formatSql(sql: string): string {
  // Normalize newlines and collapse runs of spaces (but keep inside quotes untouched).
  const re = /('(?:[^']|'')*'|"(?:[^"]|"")*"|\s+|[(),;]|[^'"\s(),;]+)/g;
  let m: RegExpExecArray | null;
  let out = "";
  let indent = 0;
  let lineStart = true;
  while ((m = re.exec(sql)) !== null) {
    const tok = m[0];
    if (/^['"]/.test(tok)) {
      out += tok;
      lineStart = false;
      continue;
    }
    if (tok === ",") {
      out += ",\n" + "  ".repeat(indent);
      lineStart = true;
      continue;
    }
    if (tok === "(") {
      out += tok + "\n" + "  ".repeat(++indent);
      lineStart = true;
      continue;
    }
    if (tok === ")") {
      indent = Math.max(0, indent - 1);
      out += "\n" + "  ".repeat(indent) + tok;
      lineStart = false;
      continue;
    }
    if (tok === ";") {
      out += ";";
      lineStart = false;
      continue;
    }
    const upper = tok.toUpperCase();
    const isKeyword = KEYWORDS.has(upper);
    if (["FROM", "WHERE", "GROUP", "ORDER", "HAVING", "LIMIT", "JOIN", "LEFT", "RIGHT", "INNER", "OUTER", "UNION", "SET", "VALUES", "ON", "AND", "OR", "WHEN", "THEN", "ELSE"].includes(upper)) {
      out += "\n" + "  ".repeat(indent) + upper;
      lineStart = false;
      continue;
    }
    out += (lineStart ? "" : " ") + (isKeyword ? upper : tok);
    lineStart = false;
  }
  return out.trim();
}

export default function SqlFormatter() {
  const [sql, setSql] = useToolState("sql-formatter:input", "select id, name from users where age > 18 order by name limit 10;");

  const formatted = useMemo(() => (sql.trim() ? formatSql(sql) : ""), [sql]);

  return (
    <ToolShell
      title="SQL Formatter"
      khmerTitle="រៀបចំទម្រង់ SQL"
      description="Pretty-print SQL queries — uppercase keywords and break clauses onto their own lines."
      descriptionKm="រៀបចំសំណួរ SQL ឱ្យស្អាត — ដាក់អក្សរធំលើពាក្យគន្លឹះ និងបំបែក clause នីមួយៗទៅបន្ទាត់ថ្មី។"
    >
      <Field label="SQL">
        <TextArea rows={10} value={sql} onChange={(e) => setSql(e.target.value)} />
      </Field>
      <Output label="Formatted" value={formatted} />
    </ToolShell>
  );
}
