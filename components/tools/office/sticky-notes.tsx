"use client";

import { FormEvent, useMemo, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell, Field, TextInput, TextArea, Select, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { recordExport } from "@/lib/export";

type Color = "yellow" | "blue" | "green" | "pink" | "purple";
type Note = { id: string; title: string; content: string; color: Color; updatedAt: string };
const COLORS: Record<Color, string> = {
  yellow: "border-amber-300/60 bg-amber-100/80 text-amber-950",
  blue: "border-sky-300/60 bg-sky-100/80 text-sky-950",
  green: "border-emerald-300/60 bg-emerald-100/80 text-emerald-950",
  pink: "border-pink-300/60 bg-pink-100/80 text-pink-950",
  purple: "border-violet-300/60 bg-violet-100/80 text-violet-950",
};
const downloadJson = (notes: Note[]) => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(notes, null, 2)], { type: "application/json" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = "sticky-notes.json"; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  recordExport();
};

export default function StickyNotes() {
  const { text } = useLanguage();
  const [notes, setNotes] = useToolState<Note[]>("office-sticky-notes", []);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState({ title: "", content: "", color: "yellow" as Color });
  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return notes.filter((note) => !needle || `${note.title} ${note.content}`.toLocaleLowerCase().includes(needle));
  }, [notes, query]);

  function addNote(event: FormEvent) {
    event.preventDefault();
    if (!draft.title.trim() && !draft.content.trim()) return;
    const note: Note = { id: crypto.randomUUID(), title: draft.title.trim(), content: draft.content.trim(), color: draft.color, updatedAt: new Date().toISOString() };
    setNotes((items) => [note, ...items]);
    setDraft({ title: "", content: "", color: "yellow" });
  }
  function updateNote(id: string, patch: Partial<Pick<Note, "title" | "content" | "color">>) {
    setNotes((items) => items.map((note) => note.id === id ? { ...note, ...patch, updatedAt: new Date().toISOString() } : note));
  }
  function removeNote(id: string) {
    if (window.confirm(text("Delete this note?", "លុបកំណត់ត្រានេះមែនទេ?"))) setNotes((items) => items.filter((note) => note.id !== id));
  }

  return (
    <ToolShell title="Sticky Notes" khmerTitle="កំណត់ត្រារហ័ស" description="Keep a searchable, colorful note board entirely in your browser." descriptionKm="រក្សាផ្ទាំងកំណត់ត្រាចម្រុះពណ៌ដែលអាចស្វែងរកបានទាំងស្រុងក្នុងកម្មវិធីរុករករបស់អ្នក។">
      <p className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs text-[var(--ink-dim)]">{text("Local storage: notes stay only in this browser. Export a backup before clearing browser data.", "ការផ្ទុកក្នុងម៉ាស៊ីន៖ កំណត់ត្រារក្សាទុកតែក្នុងកម្មវិធីរុករកនេះ។ សូមនាំចេញឯកសារបម្រុងមុនពេលលុបទិន្នន័យកម្មវិធីរុករក។")}</p>
      <form onSubmit={addNote} className="space-y-4 rounded-md border border-[var(--ground-line)] p-4">
        <h2 className="font-medium text-[var(--ink)]">{text("New note", "កំណត់ត្រាថ្មី")}</h2>
        <Field label="Title" labelKm="ចំណងជើង"><TextInput value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder={text("Optional title", "ចំណងជើងជាជម្រើស")} /></Field>
        <Field label="Note" labelKm="កំណត់ត្រា"><TextArea rows={3} value={draft.content} onChange={(event) => setDraft({ ...draft, content: event.target.value })} placeholder={text("Write an idea or reminder…", "សរសេរគំនិត ឬការរំលឹក…")} /></Field>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end"><div className="flex-1"><Field label="Color" labelKm="ពណ៌"><Select value={draft.color} onChange={(event) => setDraft({ ...draft, color: event.target.value as Color })}><option value="yellow">{text("Yellow", "លឿង")}</option><option value="blue">{text("Blue", "ខៀវ")}</option><option value="green">{text("Green", "បៃតង")}</option><option value="pink">{text("Pink", "ផ្កាឈូក")}</option><option value="purple">{text("Purple", "ស្វាយ")}</option></Select></Field></div><Button type="submit">{text("Add note", "បន្ថែមកំណត់ត្រា")}</Button></div>
      </form>
      <Row><Field label="Search" labelKm="ស្វែងរក"><TextInput type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text("Search notes…", "ស្វែងរកកំណត់ត្រា…")} /></Field><div className="flex items-end"><Button type="button" onClick={() => downloadJson(notes)} disabled={!notes.length}>{text("Export JSON backup", "នាំចេញឯកសារ JSON បម្រុង")}</Button></div></Row>
      <p className="text-xs text-[var(--ink-dim)]">{text(`${visible.length} of ${notes.length} notes`, `កំណត់ត្រា ${visible.length} ក្នុងចំណោម ${notes.length}`)}</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {!visible.length && <p className="col-span-full py-8 text-center text-sm text-[var(--ink-dim)]">{text("No matching notes.", "មិនមានកំណត់ត្រាដែលត្រូវគ្នា។")}</p>}
        {visible.map((note) => <article key={note.id} className={`rounded-lg border p-4 shadow-sm ${COLORS[note.color]}`}>
          <label className="block text-xs font-semibold uppercase tracking-wide"><span>{text("Title", "ចំណងជើង")}</span><input className="mt-1 w-full rounded border border-black/10 bg-white/35 px-2 py-1.5 text-base font-semibold outline-none focus:ring-2 focus:ring-black/20" value={note.title} onChange={(event) => updateNote(note.id, { title: event.target.value })} /></label>
          <label className="mt-3 block text-xs font-semibold uppercase tracking-wide"><span>{text("Note", "កំណត់ត្រា")}</span><textarea className="mt-1 min-h-32 w-full resize-y rounded border border-black/10 bg-white/35 px-2 py-2 text-sm font-normal leading-relaxed outline-none focus:ring-2 focus:ring-black/20" value={note.content} onChange={(event) => updateNote(note.id, { content: event.target.value })} /></label>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-2"><label className="text-xs font-semibold"><span className="block">{text("Color", "ពណ៌")}</span><select className="mt-1 rounded border border-black/10 bg-white/60 px-2 py-1" value={note.color} onChange={(event) => updateNote(note.id, { color: event.target.value as Color })}><option value="yellow">{text("Yellow", "លឿង")}</option><option value="blue">{text("Blue", "ខៀវ")}</option><option value="green">{text("Green", "បៃតង")}</option><option value="pink">{text("Pink", "ផ្កាឈូក")}</option><option value="purple">{text("Purple", "ស្វាយ")}</option></select></label><button type="button" className="min-h-10 rounded-md bg-red-700 px-3 py-2 text-sm font-medium text-white" onClick={() => removeNote(note.id)}>{text("Delete", "លុប")}</button></div>
          <p className="mt-3 text-[11px] opacity-65">{text("Updated", "បានកែប្រែ")}: {new Date(note.updatedAt).toLocaleString()}</p>
        </article>)}
      </div>
    </ToolShell>
  );
}
