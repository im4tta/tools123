"use client";

import { useMemo, useRef, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";
import { Button, Output } from "@/components/ui/Output";
import { Field, Select, TextInput, ToolShell } from "@/components/ui/Shell";

type AttendanceStatus = "present" | "absent" | "leave" | "remote";
type AttendanceRow = {
  id: number;
  name: string;
  status: AttendanceStatus;
  inTime: string;
  outTime: string;
  note: string;
};

const newRow = (id: number): AttendanceRow => ({
  id,
  name: "",
  status: "present",
  inTime: "",
  outTime: "",
  note: "",
});

function csvCell(value: string) {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

function downloadText(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export default function AttendanceSheet() {
  const { text } = useLanguage();
  const nextId = useRef(3);
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [rows, setRows] = useState<AttendanceRow[]>([newRow(1), newRow(2)]);

  const activeRows = useMemo(
    () => rows.filter((row) => row.name.trim() || row.inTime || row.outTime || row.note.trim()),
    [rows],
  );

  const statusLabel = (status: AttendanceStatus) => ({
    present: text("Present", "វត្តមាន"),
    absent: text("Absent", "អវត្តមាន"),
    leave: text("On leave", "សុំច្បាប់"),
    remote: text("Remote", "ធ្វើការពីចម្ងាយ"),
  })[status];

  const workedMinutes = useMemo(() => activeRows.reduce((total, row) => {
    if (!row.inTime || !row.outTime) return total;
    const [inHour, inMinute] = row.inTime.split(":").map(Number);
    const [outHour, outMinute] = row.outTime.split(":").map(Number);
    const minutes = outHour * 60 + outMinute - inHour * 60 - inMinute;
    return total + Math.max(0, minutes);
  }, 0), [activeRows]);

  const csv = (() => {
    const headers = ["Date", "Location", "Name", "Status", "In", "Out", "Note"];
    const records = activeRows.map((row) => [
      date,
      location,
      row.name,
      statusLabel(row.status),
      row.inTime,
      row.outTime,
      row.note,
    ]);
    return `\uFEFF${[headers, ...records].map((record) => record.map(csvCell).join(",")).join("\r\n")}\r\n`;
  })();

  const counts = (status: AttendanceStatus) => activeRows.filter((row) => row.status === status).length;
  const updateRow = <K extends keyof Omit<AttendanceRow, "id">>(
    id: number,
    key: K,
    value: AttendanceRow[K],
  ) => setRows((current) => current.map((row) => row.id === id ? { ...row, [key]: value } : row));

  const summary = [
    `${text("Recorded", "បានកត់ត្រា")}: ${activeRows.length}`,
    `${text("Present", "វត្តមាន")}: ${counts("present")} · ${text("Remote", "ពីចម្ងាយ")}: ${counts("remote")}`,
    `${text("Absent", "អវត្តមាន")}: ${counts("absent")} · ${text("On leave", "សុំច្បាប់")}: ${counts("leave")}`,
    `${text("Total recorded time", "ម៉ោងសរុបដែលបានកត់ត្រា")}: ${Math.floor(workedMinutes / 60)}h ${workedMinutes % 60}m`,
  ].join("\n");

  return (
    <ToolShell
      title="Attendance Sheet"
      khmerTitle="បញ្ជីវត្តមាន"
      description="Record attendance, arrival and departure times, then export the sheet as CSV. Everything stays in this browser tab."
      descriptionKm="កត់ត្រាវត្តមាន ម៉ោងចូល និងម៉ោងចេញ រួចនាំចេញជា CSV។ ទិន្នន័យទាំងអស់ស្ថិតនៅក្នុងផ្ទាំងកម្មវិធីរុករកនេះ។"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Date" labelKm="កាលបរិច្ឆេទ">
          <TextInput type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </Field>
        <Field label="Location" labelKm="ទីតាំង">
          <TextInput value={location} onChange={(event) => setLocation(event.target.value)} placeholder={text("Office or event", "ការិយាល័យ ឬកម្មវិធី")} />
        </Field>
      </div>

      <div className="overflow-x-auto rounded-md border border-[var(--ground-line)]">
        <table className="min-w-[860px] w-full text-left text-sm">
          <thead className="bg-[var(--ground-raised)] text-xs text-[var(--ink-dim)]">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">{text("Name", "ឈ្មោះ")}</th>
              <th className="px-3 py-2">{text("Status", "ស្ថានភាព")}</th>
              <th className="px-3 py-2">{text("In", "ចូល")}</th>
              <th className="px-3 py-2">{text("Out", "ចេញ")}</th>
              <th className="px-3 py-2">{text("Note", "កំណត់សម្គាល់")}</th>
              <th className="px-3 py-2"><span className="sr-only">{text("Remove", "លុប")}</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id} className="border-t border-[var(--ground-line)] align-top">
                <td className="px-3 py-2 text-[var(--ink-faint)]">{index + 1}</td>
                <td className="w-48 px-2 py-2"><TextInput aria-label={text("Name", "ឈ្មោះ")} value={row.name} onChange={(event) => updateRow(row.id, "name", event.target.value)} /></td>
                <td className="w-40 px-2 py-2">
                  <Select aria-label={text("Status", "ស្ថានភាព")} value={row.status} onChange={(event) => updateRow(row.id, "status", event.target.value as AttendanceStatus)}>
                    <option value="present">{text("Present", "វត្តមាន")}</option>
                    <option value="absent">{text("Absent", "អវត្តមាន")}</option>
                    <option value="leave">{text("On leave", "សុំច្បាប់")}</option>
                    <option value="remote">{text("Remote", "ធ្វើការពីចម្ងាយ")}</option>
                  </Select>
                </td>
                <td className="w-32 px-2 py-2"><TextInput aria-label={text("In time", "ម៉ោងចូល")} type="time" value={row.inTime} onChange={(event) => updateRow(row.id, "inTime", event.target.value)} /></td>
                <td className="w-32 px-2 py-2"><TextInput aria-label={text("Out time", "ម៉ោងចេញ")} type="time" value={row.outTime} onChange={(event) => updateRow(row.id, "outTime", event.target.value)} /></td>
                <td className="w-52 px-2 py-2"><TextInput aria-label={text("Note", "កំណត់សម្គាល់")} value={row.note} onChange={(event) => updateRow(row.id, "note", event.target.value)} /></td>
                <td className="px-2 py-2"><button type="button" onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))} className="rounded px-2 py-2 text-[var(--danger)] hover:bg-[var(--danger)]/10" aria-label={text("Remove row", "លុបជួរ")}>×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="p-6 text-center text-sm text-[var(--ink-faint)]">{text("No rows yet. Add a row to begin.", "មិនទាន់មានជួរទេ។ បន្ថែមជួរដើម្បីចាប់ផ្តើម។")}</p>}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => setRows((current) => [...current, newRow(nextId.current++)])}>{text("Add row", "បន្ថែមជួរ")}</Button>
        {activeRows.length > 0 && <CopyButton text={csv} />}
        <Button type="button" disabled={!activeRows.length} onClick={() => downloadText(csv, `attendance-${date || "sheet"}.csv`, "text/csv;charset=utf-8")} className="!bg-[var(--ground-raised)] !text-[var(--ink)]">{text("Download CSV", "ទាញយក CSV")}</Button>
      </div>

      <Output
        label={text("Summary", "សង្ខេប")}
        value={activeRows.length ? summary : text("Fill in at least one row to see totals and export CSV.", "បំពេញយ៉ាងហោចណាស់មួយជួរ ដើម្បីមើលសរុប និងនាំចេញ CSV។")}
        error={!activeRows.length}
        mono={false}
      />
    </ToolShell>
  );
}
