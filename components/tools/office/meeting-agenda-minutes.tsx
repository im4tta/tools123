"use client";

import { useMemo, useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Button, Output } from "@/components/ui/Output";
import { Field, TextArea, TextInput, ToolShell } from "@/components/ui/Shell";
import { recordExport } from "@/lib/export";

type AgendaItem = { id: number; topic: string; lead: string; minutes: string };
type ActionItem = { id: number; task: string; owner: string; due: string };

const agendaItem = (id: number): AgendaItem => ({ id, topic: "", lead: "", minutes: "" });
const actionItem = (id: number): ActionItem => ({ id, task: "", owner: "", due: "" });

function downloadText(content: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  recordExport();
}

export default function MeetingAgendaMinutes() {
  const { text } = useLanguage();
  const agendaId = useRef(2);
  const actionId = useRef(2);
  const [meta, setMeta] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    facilitator: "",
    attendees: "",
  });
  const [agenda, setAgenda] = useState<AgendaItem[]>([agendaItem(1)]);
  const [notes, setNotes] = useState("");
  const [decisions, setDecisions] = useState("");
  const [actions, setActions] = useState<ActionItem[]>([actionItem(1)]);

  const output = useMemo(() => {
    const agendaRows = agenda.filter((item) => item.topic.trim() || item.lead.trim() || item.minutes.trim());
    const actionRows = actions.filter((item) => item.task.trim() || item.owner.trim() || item.due);
    const line = "─".repeat(48);
    return [
      text("MEETING AGENDA & MINUTES", "របៀបវារៈ និងកំណត់ហេតុប្រជុំ"),
      line,
      `${text("Title", "ចំណងជើង")}: ${meta.title.trim() || "—"}`,
      `${text("Date", "កាលបរិច្ឆេទ")}: ${meta.date || "—"}`,
      `${text("Time", "ម៉ោង")}: ${meta.time || "—"}`,
      `${text("Location", "ទីតាំង")}: ${meta.location.trim() || "—"}`,
      `${text("Facilitator", "អ្នកសម្របសម្រួល")}: ${meta.facilitator.trim() || "—"}`,
      `${text("Attendees", "អ្នកចូលរួម")}: ${meta.attendees.trim() || "—"}`,
      "",
      text("AGENDA", "របៀបវារៈ"),
      line,
      ...(agendaRows.length
        ? agendaRows.map((item, index) => `${index + 1}. ${item.topic.trim() || "—"}${item.lead.trim() ? ` · ${text("Lead", "អ្នកដឹកនាំ")}: ${item.lead.trim()}` : ""}${item.minutes.trim() ? ` · ${item.minutes.trim()} ${text("min", "នាទី")}` : ""}`)
        : [text("No agenda items recorded.", "មិនមានរបៀបវារៈដែលបានកត់ត្រា។")]),
      "",
      text("DISCUSSION NOTES", "កំណត់ត្រាការពិភាក្សា"),
      line,
      notes.trim() || text("No notes recorded.", "មិនមានកំណត់ត្រា។"),
      "",
      text("DECISIONS", "សេចក្តីសម្រេច"),
      line,
      decisions.trim() || text("No decisions recorded.", "មិនមានសេចក្តីសម្រេច។"),
      "",
      text("ACTION ITEMS", "ការងារត្រូវអនុវត្ត"),
      line,
      ...(actionRows.length
        ? actionRows.map((item, index) => `${index + 1}. ${item.task.trim() || "—"} · ${text("Owner", "អ្នកទទួលខុសត្រូវ")}: ${item.owner.trim() || "—"} · ${text("Due", "កំណត់ថ្ងៃ")}: ${item.due || "—"}`)
        : [text("No action items recorded.", "មិនមានការងារត្រូវអនុវត្ត។")]),
    ].join("\n");
  }, [actions, agenda, decisions, meta, notes, text]);

  const updateAgenda = <K extends keyof Omit<AgendaItem, "id">>(id: number, key: K, value: AgendaItem[K]) =>
    setAgenda((current) => current.map((item) => item.id === id ? { ...item, [key]: value } : item));
  const updateAction = <K extends keyof Omit<ActionItem, "id">>(id: number, key: K, value: ActionItem[K]) =>
    setActions((current) => current.map((item) => item.id === id ? { ...item, [key]: value } : item));

  return (
    <ToolShell
      title="Meeting Agenda & Minutes"
      khmerTitle="របៀបវារៈ និងកំណត់ហេតុប្រជុំ"
      description="Prepare an agenda, capture discussion and decisions, and export polished plain-text minutes locally."
      descriptionKm="រៀបចំរបៀបវារៈ កត់ត្រាការពិភាក្សា និងសេចក្តីសម្រេច ហើយនាំចេញកំណត់ហេតុជាអត្ថបទនៅលើឧបករណ៍របស់អ្នក។"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Meeting title" labelKm="ចំណងជើងប្រជុំ"><TextInput value={meta.title} onChange={(event) => setMeta({ ...meta, title: event.target.value })} /></Field>
        <Field label="Facilitator" labelKm="អ្នកសម្របសម្រួល"><TextInput value={meta.facilitator} onChange={(event) => setMeta({ ...meta, facilitator: event.target.value })} /></Field>
        <Field label="Date" labelKm="កាលបរិច្ឆេទ"><TextInput type="date" value={meta.date} onChange={(event) => setMeta({ ...meta, date: event.target.value })} /></Field>
        <Field label="Time" labelKm="ម៉ោង"><TextInput type="time" value={meta.time} onChange={(event) => setMeta({ ...meta, time: event.target.value })} /></Field>
        <Field label="Location" labelKm="ទីតាំង"><TextInput value={meta.location} onChange={(event) => setMeta({ ...meta, location: event.target.value })} /></Field>
        <Field label="Attendees" labelKm="អ្នកចូលរួម"><TextInput value={meta.attendees} onChange={(event) => setMeta({ ...meta, attendees: event.target.value })} placeholder={text("Names separated by commas", "ឈ្មោះបំបែកដោយសញ្ញាក្បៀស")} /></Field>
      </div>

      <section className="space-y-3 rounded-md border border-[var(--ground-line)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-medium text-[var(--ink)]">{text("Agenda items", "របៀបវារៈ")}</h2>
          <Button type="button" onClick={() => setAgenda((current) => [...current, agendaItem(agendaId.current++)])}>{text("Add item", "បន្ថែមប្រធានបទ")}</Button>
        </div>
        {agenda.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-2 rounded-md bg-[var(--ground-raised)] p-3 sm:grid-cols-[2fr_1fr_7rem_auto]">
            <TextInput aria-label={`${text("Agenda topic", "ប្រធានបទ")} ${index + 1}`} placeholder={text("Topic", "ប្រធានបទ")} value={item.topic} onChange={(event) => updateAgenda(item.id, "topic", event.target.value)} />
            <TextInput aria-label={text("Lead", "អ្នកដឹកនាំ")} placeholder={text("Lead", "អ្នកដឹកនាំ")} value={item.lead} onChange={(event) => updateAgenda(item.id, "lead", event.target.value)} />
            <TextInput aria-label={text("Minutes", "នាទី")} type="number" min="1" placeholder={text("Minutes", "នាទី")} value={item.minutes} onChange={(event) => updateAgenda(item.id, "minutes", event.target.value)} />
            <button type="button" onClick={() => setAgenda((current) => current.filter((row) => row.id !== item.id))} className="rounded px-3 text-[var(--danger)] hover:bg-[var(--danger)]/10" aria-label={text("Remove agenda item", "លុបរបៀបវារៈ")}>×</button>
          </div>
        ))}
        {!agenda.length && <p className="text-sm text-[var(--ink-faint)]">{text("No agenda items. Add one when ready.", "មិនមានរបៀបវារៈទេ។ បន្ថែមនៅពេលរួចរាល់។")}</p>}
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Discussion notes" labelKm="កំណត់ត្រាការពិភាក្សា"><TextArea rows={7} value={notes} onChange={(event) => setNotes(event.target.value)} /></Field>
        <Field label="Decisions" labelKm="សេចក្តីសម្រេច"><TextArea rows={7} value={decisions} onChange={(event) => setDecisions(event.target.value)} /></Field>
      </div>

      <section className="space-y-3 rounded-md border border-[var(--ground-line)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-medium text-[var(--ink)]">{text("Action items", "ការងារត្រូវអនុវត្ត")}</h2>
          <Button type="button" onClick={() => setActions((current) => [...current, actionItem(actionId.current++)])}>{text("Add action", "បន្ថែមការងារ")}</Button>
        </div>
        {actions.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-2 rounded-md bg-[var(--ground-raised)] p-3 sm:grid-cols-[2fr_1fr_9rem_auto]">
            <TextInput aria-label={`${text("Task", "ការងារ")} ${index + 1}`} placeholder={text("Task", "ការងារ")} value={item.task} onChange={(event) => updateAction(item.id, "task", event.target.value)} />
            <TextInput aria-label={text("Owner", "អ្នកទទួលខុសត្រូវ")} placeholder={text("Owner", "អ្នកទទួលខុសត្រូវ")} value={item.owner} onChange={(event) => updateAction(item.id, "owner", event.target.value)} />
            <TextInput aria-label={text("Due date", "កាលកំណត់")} type="date" value={item.due} onChange={(event) => updateAction(item.id, "due", event.target.value)} />
            <button type="button" onClick={() => setActions((current) => current.filter((row) => row.id !== item.id))} className="rounded px-3 text-[var(--danger)] hover:bg-[var(--danger)]/10" aria-label={text("Remove action item", "លុបការងារ")}>×</button>
          </div>
        ))}
        {!actions.length && <p className="text-sm text-[var(--ink-faint)]">{text("No action items recorded.", "មិនមានការងារត្រូវអនុវត្ត។")}</p>}
      </section>

      {!meta.title.trim() && <p role="status" className="rounded-md border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-3 text-sm text-[var(--danger)]">{text("Add a meeting title before sharing the minutes.", "សូមបន្ថែមចំណងជើងប្រជុំ មុនពេលចែករំលែកកំណត់ហេតុ។")}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => downloadText(output, `meeting-${meta.date || "minutes"}.txt`)}>{text("Download text", "ទាញយកអត្ថបទ")}</Button>
      </div>
      <Output label={text("Agenda and minutes", "របៀបវារៈ និងកំណត់ហេតុ")} value={output} mono={false} />
    </ToolShell>
  );
}
