"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Button } from "@/components/ui/Output";
import { Field, TextInput, ToolShell } from "@/components/ui/Shell";
import { recordExport } from "@/lib/export";

type StaffRecord = {
  key: number;
  name: string;
  staffId: string;
  role: string;
  department: string;
  photoUrl?: string;
};

type Draft = Omit<StaffRecord, "key" | "photoUrl"> & { photoUrl?: string };

const EMPTY_DRAFT: Draft = { name: "", staffId: "", role: "", department: "" };

function csvCell(value: string) {
  const protectedValue = /^[\t\r\n ]*[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${protectedValue.replace(/"/g, '""')}"`;
}

function downloadCsv(records: StaffRecord[]) {
  const rows = [
    ["Name", "Staff ID", "Role", "Department"],
    ...records.map(({ name, staffId, role, department }) => [name, staffId, role, department]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "staff-directory.csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  recordExport();
}

export default function StaffDirectory() {
  const { text } = useLanguage();
  const [records, setRecords] = useState<StaffRecord[]>([]);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const nextKey = useRef(1);
  const photoInput = useRef<HTMLInputElement>(null);
  const photoUrls = useRef(new Set<string>());

  useEffect(() => {
    const urls = photoUrls.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const visibleRecords = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    if (!term) return records;
    return records.filter((record) =>
      [record.name, record.staffId, record.role, record.department]
        .some((value) => value.toLocaleLowerCase().includes(term)),
    );
  }, [query, records]);

  function revokePhoto(url?: string) {
    if (!url) return;
    URL.revokeObjectURL(url);
    photoUrls.current.delete(url);
  }

  function choosePhoto(file?: File) {
    revokePhoto(draft.photoUrl);
    if (!file) {
      setDraft((current) => ({ ...current, photoUrl: undefined }));
      return;
    }
    const url = URL.createObjectURL(file);
    photoUrls.current.add(url);
    setDraft((current) => ({ ...current, photoUrl: url }));
  }

  function addRecord(event: FormEvent) {
    event.preventDefault();
    const cleaned = {
      name: draft.name.trim(),
      staffId: draft.staffId.trim(),
      role: draft.role.trim(),
      department: draft.department.trim(),
    };
    if (Object.values(cleaned).some((value) => !value)) {
      setError(text("Name, staff ID, role, and department are required.", "ត្រូវបំពេញឈ្មោះ លេខសម្គាល់ តួនាទី និងនាយកដ្ឋាន។"));
      return;
    }
    if (records.some((record) => record.staffId.toLocaleLowerCase() === cleaned.staffId.toLocaleLowerCase())) {
      setError(text("That staff ID already exists.", "លេខសម្គាល់បុគ្គលិកនេះមានរួចហើយ។"));
      return;
    }
    setRecords((current) => [...current, { key: nextKey.current++, ...cleaned, photoUrl: draft.photoUrl }]);
    setDraft(EMPTY_DRAFT);
    if (photoInput.current) photoInput.current.value = "";
    setError("");
  }

  function removeRecord(record: StaffRecord) {
    revokePhoto(record.photoUrl);
    setRecords((current) => current.filter((item) => item.key !== record.key));
  }

  function clearAll() {
    records.forEach((record) => revokePhoto(record.photoUrl));
    revokePhoto(draft.photoUrl);
    setRecords([]);
    setDraft(EMPTY_DRAFT);
    setQuery("");
    setError("");
    if (photoInput.current) photoInput.current.value = "";
  }

  const input = "w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--gold-dim)]";

  return (
    <ToolShell
      title="Staff Directory"
      khmerTitle="បញ្ជីបុគ្គលិក"
      description="Build and search a temporary staff directory, then explicitly export it as a formula-safe CSV."
      descriptionKm="បង្កើត និងស្វែងរកបញ្ជីបុគ្គលិកបណ្ដោះអាសន្ន រួចនាំចេញជា CSV ដែលការពាររូបមន្តដោយផ្ទាល់។"
    >
      <div className="rounded-md border border-[var(--gold)]/50 bg-[var(--gold)]/10 p-4 text-sm text-[var(--ink)]" role="note">
        <strong>{text("Private by design:", "ឯកជនភាពជាចម្បង៖")}</strong>{" "}
        {text("Records and photos stay only in this tab's memory. Nothing is saved or uploaded; closing or refreshing the tab erases the directory.", "កំណត់ត្រា និងរូបថតស្ថិតតែក្នុងអង្គចងចាំនៃផ្ទាំងនេះ។ គ្មានអ្វីត្រូវបានរក្សាទុក ឬបង្ហោះទេ ហើយការបិទ ឬផ្ទុកផ្ទាំងឡើងវិញនឹងលុបបញ្ជី។")}
      </div>

      <form onSubmit={addRecord} className="space-y-4 rounded-md border border-[var(--ground-line)] p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Name" labelKm="ឈ្មោះ"><TextInput value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} /></Field>
          <Field label="Staff ID" labelKm="លេខសម្គាល់បុគ្គលិក"><TextInput value={draft.staffId} onChange={(event) => setDraft((current) => ({ ...current, staffId: event.target.value }))} /></Field>
          <Field label="Role" labelKm="តួនាទី"><TextInput value={draft.role} onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value }))} /></Field>
          <Field label="Department" labelKm="នាយកដ្ឋាន"><TextInput value={draft.department} onChange={(event) => setDraft((current) => ({ ...current, department: event.target.value }))} /></Field>
        </div>
        <Field label="Optional photo" labelKm="រូបថតជាជម្រើស" hint="Session only" hintKm="តែក្នុងសម័យនេះ">
          <input ref={photoInput} type="file" accept="image/*" className={input} onChange={(event) => choosePhoto(event.target.files?.[0])} />
        </Field>
        {draft.photoUrl && (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={draft.photoUrl} alt={text("Selected staff preview", "មើលរូបថតបុគ្គលិកជាមុន")} className="h-14 w-14 rounded-full border border-[var(--ground-line)] object-cover" />
            <button type="button" className="text-xs text-[var(--danger)]" onClick={() => { choosePhoto(); if (photoInput.current) photoInput.current.value = ""; }}>{text("Remove photo", "លុបរូបថត")}</button>
          </div>
        )}
        {error && <p role="alert" className="text-sm text-[var(--danger)]">{error}</p>}
        <Button type="submit">{text("Add staff member", "បន្ថែមបុគ្គលិក")}</Button>
      </form>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <Field label="Search directory" labelKm="ស្វែងរកបញ្ជី">
          <TextInput type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text("Name, ID, role, or department", "ឈ្មោះ លេខសម្គាល់ តួនាទី ឬនាយកដ្ឋាន")} />
        </Field>
        <span className="pb-2 text-xs text-[var(--ink-faint)]">{text(`${visibleRecords.length} of ${records.length} staff`, `បុគ្គលិក ${visibleRecords.length} នាក់ ក្នុងចំណោម ${records.length} នាក់`)}</span>
      </div>

      <div className="overflow-x-auto rounded-md border border-[var(--ground-line)]">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-[var(--ground-raised)] text-xs text-[var(--ink-dim)]">
            <tr>
              <th className="px-3 py-2">{text("Photo", "រូបថត")}</th>
              <th className="px-3 py-2">{text("Name", "ឈ្មោះ")}</th>
              <th className="px-3 py-2">{text("Staff ID", "លេខសម្គាល់")}</th>
              <th className="px-3 py-2">{text("Role", "តួនាទី")}</th>
              <th className="px-3 py-2">{text("Department", "នាយកដ្ឋាន")}</th>
              <th className="px-3 py-2"><span className="sr-only">{text("Remove", "លុប")}</span></th>
            </tr>
          </thead>
          <tbody>
            {visibleRecords.map((record) => (
              <tr key={record.key} className="border-t border-[var(--ground-line)]">
                <td className="px-3 py-2">
                  {record.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={record.photoUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ground-raised)] text-xs text-[var(--ink-faint)]" aria-hidden="true">—</span>}
                </td>
                <td className="px-3 py-2 font-medium text-[var(--ink)]">{record.name}</td>
                <td className="px-3 py-2 text-[var(--ink-dim)]">{record.staffId}</td>
                <td className="px-3 py-2 text-[var(--ink-dim)]">{record.role}</td>
                <td className="px-3 py-2 text-[var(--ink-dim)]">{record.department}</td>
                <td className="px-3 py-2"><button type="button" onClick={() => removeRecord(record)} className="rounded px-2 py-1 text-[var(--danger)] hover:bg-[var(--danger)]/10" aria-label={text(`Remove ${record.name}`, `លុប ${record.name}`)}>×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!visibleRecords.length && <p className="p-7 text-center text-sm text-[var(--ink-faint)]">{records.length ? text("No matching staff.", "គ្មានបុគ្គលិកត្រូវនឹងការស្វែងរក។") : text("No staff records yet.", "មិនទាន់មានកំណត់ត្រាបុគ្គលិកទេ។")}</p>}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={!records.length} onClick={() => downloadCsv(records)}>{text("Export CSV", "នាំចេញ CSV")}</Button>
        <Button type="button" disabled={!records.length && !draft.photoUrl} onClick={clearAll} className="!bg-[var(--ground-raised)] !text-[var(--danger)]">{text("Clear all", "លុបទាំងអស់")}</Button>
      </div>
      <p className="text-xs text-[var(--ink-faint)]">{text("CSV export excludes photos and prefixes formula-like cells with an apostrophe to reduce spreadsheet injection risk.", "ការនាំចេញ CSV មិនរួមបញ្ចូលរូបថត ហើយបន្ថែមសញ្ញាអពូស្ត្រូហ្វមុខក្រឡាដែលស្រដៀងរូបមន្ត ដើម្បីកាត់បន្ថយហានិភ័យបញ្ចូលកូដក្នុងសៀវភៅបញ្ជី។")}</p>
    </ToolShell>
  );
}
