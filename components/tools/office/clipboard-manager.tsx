"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell, Field, TextInput, TextArea, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

type ClipItem = { id: string; text: string; addedAt: string; khmer?: boolean; pinned?: boolean };
const MAX_ITEMS = 100;
const STORAGE_KEY = "office-clipboard-manager";

function isKhmer(text: string): boolean {
  // Khmer Unicode block + supplementary symbols.
  return /[\u1780-\u17FF\u19E0-\u19FF]/u.test(text);
}

function normalizeText(text: string): string {
  // Collapse multiple blank lines and trim leading/trailing whitespace per line.
  return text.replace(/\r\n/g, "\n").replace(/[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n").trim();
}

function nowLocal(): string {
  return new Date().toLocaleString();
}

export default function ClipboardManager() {
  const { text } = useLanguage();
  const [items, setItems] = useToolState<ClipItem[]>(STORAGE_KEY, []);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [pasteMsg, setPasteMsg] = useState("");
  const lastAdded = useRef<string>("");

  // Listen for copy events in this tab so any copied text is captured live.
  useEffect(() => {
    if (!enabled) return;
    const onCopy = (e: ClipboardEvent) => {
      const picked = e.clipboardData?.getData("text/plain") ?? "";
      if (!picked || picked === lastAdded.current) return;
      lastAdded.current = picked;
      const norm = normalizeText(picked);
      if (!norm) return;
      setItems((prev) => [
        { id: crypto.randomUUID(), text: norm, addedAt: nowLocal(), khmer: isKhmer(norm) },
        ...prev.filter((i) => i.text !== norm),
      ].slice(0, MAX_ITEMS));
    };
    document.addEventListener("copy", onCopy);
    return () => document.removeEventListener("copy", onCopy);
  }, [enabled, setItems]);

  function readClipboard() {
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      setPasteMsg(text("Clipboard reading isn't supported here — use the box above to paste manually.", "ការអានក្ដារចម្លងមិនគាំទ្រនៅទីនេះទេ — សូមប្រើប្រអប់ខាងលើដើម្បីបិទភ្ជាប់ដោយដៃ។"));
      return;
    }
    navigator.clipboard.readText().then((raw) => {
      const norm = normalizeText(raw);
      if (!norm) {
        setPasteMsg(text("The clipboard is empty or contains no text.", "ក្ដារចម្លងទទេ ឬមិនមានអត្ថបទ។"));
        return;
      }
      if (norm === lastAdded.current) return;
      lastAdded.current = norm;
      setItems((prev) => [
        { id: crypto.randomUUID(), text: norm, addedAt: nowLocal(), khmer: isKhmer(norm) },
        ...prev.filter((i) => i.text !== norm),
      ].slice(0, MAX_ITEMS));
      setPasteMsg(text("Pasted from clipboard.", "បានបិទភ្ជាប់ពីក្ដារចម្លង។"));
    }).catch(() => {
      setPasteMsg(text("Permission denied — allow clipboard reading, or paste manually in the box above.", "មិនអនុញ្ញាត — សូមអនុញ្ញាតការអានក្ដារចម្លង ឬបិទភ្ជាប់ដោយដៃក្នុងប្រអប់ខាងលើ។"));
    });
  }

  function addManual(event: React.FormEvent) {
    event.preventDefault();
    const norm = normalizeText(draft);
    if (!norm) return;
    setItems((prev) => [{ id: crypto.randomUUID(), text: norm, addedAt: nowLocal(), khmer: isKhmer(norm) }, ...prev].slice(0, MAX_ITEMS));
    setDraft("");
  }

  function copyItem(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    void navigator.clipboard?.writeText(item.text);
  }
  function togglePin(id: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, pinned: !i.pinned } : i)));
  }
  function removeItem(id: string) {
    if (window.confirm(text("Delete this clipboard item?", "លុបធាតុក្ដារចម្លងនេះមែនទេ?"))) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  }
  function clearAll() {
    if (window.confirm(text("Clear the whole clipboard history?", "ជម្រះប្រវត្តិក្ដារចម្លងទាំងអស់មែនទេ?"))) setItems([]);
  }

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    const filtered = !needle
      ? items
      : items.filter((i) => i.text.toLocaleLowerCase().includes(needle) || (i.khmer && i.text.includes(query.trim())));
    return [...filtered].sort((a, b) => Number(b.pinned ?? false) - Number(a.pinned ?? false));
  }, [items, query]);

  const khmerCount = useMemo(() => items.filter((i) => i.khmer).length, [items]);

  return (
    <ToolShell
      title="Clipboard Manager"
      khmerTitle="ក្ដារចម្លង"
      description="Capture, search, split, and merge your clipboard history entirely in this browser — with Khmer text support, pinning, and one-click re-copy."
      descriptionKm="ចាប់យក ស្វែងរក បំបែក និងបញ្ចូលប្រវត្តិក្ដារចម្លងរបស់អ្នកទាំងស្រុងក្នុងកម្មវិធីរុករកនេះ — ជាមួយការគាំទ្រអក្សរខ្មែរ ការខ្ទាស់ និងការចម្លងឡើងវិញមួយចុច។"
    >
      <p className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs text-[var(--ink-dim)]">
        {text("Local storage: history stays only in this browser. Browsers may ask permission before reading the clipboard — auto-capture and the “Paste from clipboard” button are two ways to bring text in.", "ការផ្ទុកក្នុងម៉ាស៊ីន៖ ប្រវត្តិរក្សាទុកតែក្នុងកម្មវិធីរុករកនេះ។ កម្មវិធីរុករកអាចស្នើអនុញ្ញាតមុនពេលអានក្ដារចម្លង — ការចាប់យកដោយស្វ័យប្រវត្តិ និងប៊ូតុង “បិទភ្ជាប់ពីក្ដារចម្លង” ជាវិធីពីរដើម្បីនាំអត្ថបទចូល។")}
      </p>

      <form onSubmit={addManual} className="space-y-4 rounded-md border border-[var(--ground-line)] p-4">
        <h2 className="font-medium text-[var(--ink)]">{text("Add from clipboard", "បន្ថែមពីក្ដារចម្លង")}</h2>
        <Field label="Text" labelKm="អត្ថបទ">
          <TextArea rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={text("Paste or type text to add…", "បិទភ្ជាប់ ឬវាយអត្ថបទដើម្បីបន្ថែម…")} />
        </Field>
        <Row>
          <Field label="Capture" labelKm="ចាប់យក">
            <div className="flex gap-2">
              <Button type="submit">{text("Add", "បន្ថែម")}</Button>
              <Button type="button" onClick={readClipboard}>{text("Paste from clipboard", "បិទភ្ជាប់ពីក្ដារចម្លង")}</Button>
            </div>
          </Field>
          <Field label="Auto-capture copies" labelKm="ចាប់យកដោយស្វ័យប្រវត្តិ">
            <label className="flex items-center gap-2 pt-1 text-sm text-[var(--ink-dim)]">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-4 w-4 accent-[var(--gold)]" />
              {text("Capture text you copy on this page", "ចាប់យកអត្ថបទដែលអ្នកចម្លងលើទំព័រនេះ")}
            </label>
          </Field>
        </Row>
      </form>

      <Row>
        <Field label="Search" labelKm="ស្វែងរក">
          <TextInput type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={text("Search clipboard history…", "ស្វែងរកប្រវត្តិក្ដារចម្លង…")} />
        </Field>
        <div className="flex items-end">
          <Button type="button" onClick={clearAll} disabled={!items.length}>{text("Clear history", "ជម្រះប្រវត្តិ")}</Button>
        </div>
      </Row>

      <p className="text-xs text-[var(--ink-dim)]">
        {text(`${items.length} item${items.length === 1 ? "" : "s"}${khmerCount ? ` · ${khmerCount} Khmer` : ""}`, `${items.length} ធាតុ${khmerCount ? ` · ${khmerCount} ជាភាសាខ្មែរ` : ""}`)}
      </p>

      <div className="flex flex-col gap-3">
        {!visible.length && <p className="py-8 text-center text-sm text-[var(--ink-dim)]">{text("No clipboard items.", "មិនមានធាតុក្ដារចម្លង។")}</p>}
        {visible.map((item) => (
          <article key={item.id} className={`rounded-lg border p-4 shadow-sm ${item.khmer ? "border-[var(--gold-dim)]/50" : "border-[var(--ground-line)]"} bg-[var(--ground-raised)]`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--ink)]">{item.text}</p>
                <p className="mt-2 text-[11px] text-[var(--ink-faint)]">
                  {item.addedAt}
                  {item.khmer ? ` · ${text("Khmer text", "អត្ថបទខ្មែរ")}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <button type="button" onClick={() => copyItem(item.id)} className="rounded bg-[var(--gold)] px-2.5 py-1 text-xs font-medium text-[#0a0c0d] hover:bg-[var(--gold-dim)]">{text("Copy", "ចម្លង")}</button>
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => togglePin(item.id)} className="rounded border border-[var(--ground-line)] px-2 py-0.5 text-[11px] text-[var(--ink-dim)] hover:border-[var(--gold-dim)]">{item.pinned ? text("Unpin", "ដោះខ្ទាស់") : text("Pin", "ខ្ទាស់")}</button>
                  <button type="button" onClick={() => removeItem(item.id)} className="rounded border border-red-700/40 px-2 py-0.5 text-[11px] text-red-600 hover:border-red-700">{text("Delete", "លុប")}</button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {pasteMsg && <p className="text-xs text-[var(--ink-dim)]">{pasteMsg}</p>}
    </ToolShell>
  );
}