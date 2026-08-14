"use client";

import { FormEvent, useMemo, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { recordExport } from "@/lib/export";

type Status = "todo" | "progress" | "done";
type Priority = "low" | "medium" | "high";
type Task = { id: string; title: string; status: Status; priority: Priority; dueDate: string; createdAt: string };
type Draft = Omit<Task, "id" | "createdAt">;

const EMPTY: Draft = { title: "", status: "todo", priority: "medium", dueDate: "" };
const csvCell = (value: unknown) => {
  let text = String(value ?? "");
  if (/^[\t\r ]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
};
const download = (name: string, content: string, type: string) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  recordExport();
};

export default function TaskManager() {
  const { text } = useLanguage();
  const [tasks, setTasks] = useToolState<Task[]>("office-task-manager", []);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [exportType, setExportType] = useState<"json" | "csv">("csv");

  const today = new Date().toISOString().slice(0, 10);
  const summary = useMemo(() => ({
    total: tasks.length,
    open: tasks.filter((task) => task.status !== "done").length,
    done: tasks.filter((task) => task.status === "done").length,
    overdue: tasks.filter((task) => task.status !== "done" && task.dueDate && task.dueDate < today).length,
  }), [tasks, today]);
  const visible = useMemo(() => tasks.filter((task) => filter === "all" || task.status === filter), [tasks, filter]);
  const statusLabel = (status: Status) => ({
    todo: text("To do", "ត្រូវធ្វើ"), progress: text("In progress", "កំពុងធ្វើ"), done: text("Done", "រួចរាល់"),
  })[status];
  const priorityLabel = (priority: Priority) => ({
    low: text("Low", "ទាប"), medium: text("Medium", "មធ្យម"), high: text("High", "ខ្ពស់"),
  })[priority];

  function submit(event: FormEvent) {
    event.preventDefault();
    const title = draft.title.trim();
    if (!title) return;
    if (editingId) {
      setTasks((items) => items.map((item) => item.id === editingId ? { ...item, ...draft, title } : item));
    } else {
      setTasks((items) => [{ ...draft, title, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...items]);
    }
    setDraft(EMPTY); setEditingId(null);
  }
  function edit(task: Task) {
    setDraft({ title: task.title, status: task.status, priority: task.priority, dueDate: task.dueDate });
    setEditingId(task.id);
  }
  function exportTasks() {
    if (exportType === "json") {
      download("tasks.json", JSON.stringify(tasks, null, 2), "application/json");
      return;
    }
    const rows = [["Title", "Status", "Priority", "Due date", "Created"], ...tasks.map((task) => [task.title, task.status, task.priority, task.dueDate, task.createdAt])];
    download("tasks.csv", rows.map((row) => row.map(csvCell).join(",")).join("\r\n"), "text/csv;charset=utf-8");
  }

  return (
    <ToolShell title="Task Manager" khmerTitle="កម្មវិធីគ្រប់គ្រងកិច្ចការ" description="Organize tasks, deadlines, and priorities privately in this browser." descriptionKm="រៀបចំកិច្ចការ កាលកំណត់ និងអាទិភាពដោយឯកជនក្នុងកម្មវិធីរុករកនេះ។">
      <p className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs text-[var(--ink-dim)]">
        {text("Local storage: tasks stay only in this browser until you delete its site data.", "ការផ្ទុកក្នុងម៉ាស៊ីន៖ កិច្ចការរក្សាទុកតែក្នុងកម្មវិធីរុករកនេះ រហូតដល់អ្នកលុបទិន្នន័យគេហទំព័រ។")}
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[[text("Total", "សរុប"), summary.total], [text("Open", "មិនទាន់រួច"), summary.open], [text("Done", "រួចរាល់"), summary.done], [text("Overdue", "ហួសកំណត់"), summary.overdue]].map(([label, value]) => (
          <div key={String(label)} className="rounded-md border border-[var(--ground-line)] p-3"><div className="text-xs text-[var(--ink-dim)]">{label}</div><div className="mt-1 text-xl font-semibold text-[var(--ink)]">{value}</div></div>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-4 rounded-md border border-[var(--ground-line)] p-4">
        <Field label="Task" labelKm="កិច្ចការ"><TextInput value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder={text("What needs doing?", "តើត្រូវធ្វើអ្វី?")} /></Field>
        <Row>
          <Field label="Status" labelKm="ស្ថានភាព"><Select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as Status })}><option value="todo">{text("To do", "ត្រូវធ្វើ")}</option><option value="progress">{text("In progress", "កំពុងធ្វើ")}</option><option value="done">{text("Done", "រួចរាល់")}</option></Select></Field>
          <Field label="Priority" labelKm="អាទិភាព"><Select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as Priority })}><option value="low">{text("Low", "ទាប")}</option><option value="medium">{text("Medium", "មធ្យម")}</option><option value="high">{text("High", "ខ្ពស់")}</option></Select></Field>
        </Row>
        <Field label="Due date" labelKm="កាលកំណត់"><TextInput type="date" value={draft.dueDate} onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })} /></Field>
        <div className="flex flex-wrap gap-2"><Button type="submit">{editingId ? text("Save changes", "រក្សាទុកការកែប្រែ") : text("Add task", "បន្ថែមកិច្ចការ")}</Button>{editingId && <Button type="button" className="!bg-[var(--ground-raised)] !text-[var(--ink)]" onClick={() => { setEditingId(null); setDraft(EMPTY); }}>{text("Cancel", "បោះបង់")}</Button>}</div>
      </form>
      <Row>
        <Field label="Filter" labelKm="តម្រង"><Select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}><option value="all">{text("All tasks", "កិច្ចការទាំងអស់")}</option><option value="todo">{text("To do", "ត្រូវធ្វើ")}</option><option value="progress">{text("In progress", "កំពុងធ្វើ")}</option><option value="done">{text("Done", "រួចរាល់")}</option></Select></Field>
        <div className="flex items-end gap-2"><Field label="Export format" labelKm="ទម្រង់នាំចេញ"><Select value={exportType} onChange={(event) => setExportType(event.target.value as "json" | "csv")}><option value="csv">CSV</option><option value="json">JSON</option></Select></Field><Button type="button" onClick={exportTasks} disabled={!tasks.length}>{text("Export", "នាំចេញ")}</Button></div>
      </Row>
      <div className="space-y-3" aria-live="polite">
        {!visible.length && <p className="py-6 text-center text-sm text-[var(--ink-dim)]">{text("No matching tasks.", "មិនមានកិច្ចការដែលត្រូវគ្នា។")}</p>}
        {visible.map((task) => <article key={task.id} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><h2 className={`break-words font-medium text-[var(--ink)] ${task.status === "done" ? "line-through opacity-60" : ""}`}>{task.title}</h2><p className="mt-1 text-xs text-[var(--ink-dim)]">{statusLabel(task.status)} · {priorityLabel(task.priority)}{task.dueDate ? ` · ${text("Due", "កំណត់")}: ${task.dueDate}` : ""}{task.status !== "done" && task.dueDate && task.dueDate < today ? ` · ${text("Overdue", "ហួសកំណត់")}` : ""}</p></div>
          <div className="flex flex-wrap gap-2"><Button type="button" className="!px-3 !py-1.5" onClick={() => setTasks((items) => items.map((item) => item.id === task.id ? { ...item, status: item.status === "done" ? "todo" : "done" } : item))}>{task.status === "done" ? text("Reopen", "បើកឡើងវិញ") : text("Complete", "បញ្ចប់")}</Button><Button type="button" className="!bg-[var(--ground)] !px-3 !py-1.5 !text-[var(--ink)]" onClick={() => edit(task)}>{text("Edit", "កែប្រែ")}</Button><Button type="button" className="!bg-[var(--danger)] !px-3 !py-1.5 !text-white" onClick={() => setTasks((items) => items.filter((item) => item.id !== task.id))}>{text("Delete", "លុប")}</Button></div></div>
        </article>)}
      </div>
    </ToolShell>
  );
}
