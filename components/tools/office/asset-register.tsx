"use client";

import { useMemo, useRef, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";
import { Button, Output } from "@/components/ui/Output";
import { Select, TextInput, ToolShell } from "@/components/ui/Shell";
import { recordExport } from "@/lib/export";

type AssetStatus = "in-use" | "available" | "maintenance" | "retired";
type Asset = {
  id: number;
  code: string;
  name: string;
  category: string;
  assignee: string;
  status: AssetStatus;
  value: string;
};

const newAsset = (id: number): Asset => ({
  id,
  code: "",
  name: "",
  category: "",
  assignee: "",
  status: "available",
  value: "",
});

function csvCell(value: string) {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

function downloadCsv(content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "asset-register.csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  recordExport();
}

type EditableAsset = Omit<Asset, "id">;

export default function AssetRegister() {
  const { text } = useLanguage();
  const nextId = useRef(1);
  const [assets, setAssets] = useState<Asset[]>([]);

  const recorded = useMemo(() => assets.filter((asset) =>
    asset.code.trim() || asset.name.trim() || asset.category.trim() || asset.assignee.trim() || asset.value,
  ), [assets]);
  const invalidValues = recorded.some((asset) => asset.value !== "" && (!Number.isFinite(Number(asset.value)) || Number(asset.value) < 0));
  const totalValue = recorded.reduce((total, asset) => {
    const value = Number(asset.value);
    return total + (Number.isFinite(value) && value >= 0 ? value : 0);
  }, 0);

  const statusLabel = (status: AssetStatus) => ({
    "in-use": text("In use", "កំពុងប្រើ"),
    available: text("Available", "ទំនេរ"),
    maintenance: text("Maintenance", "កំពុងជួសជុល"),
    retired: text("Retired", "ឈប់ប្រើ"),
  })[status];

  const csv = (() => {
    const headers = ["Asset ID", "Name", "Category", "Assignee", "Status", "Value"];
    const records = recorded.map((asset) => [
      asset.code,
      asset.name,
      asset.category,
      asset.assignee,
      statusLabel(asset.status),
      asset.value,
    ]);
    return `\uFEFF${[headers, ...records].map((record) => record.map(csvCell).join(",")).join("\r\n")}\r\n`;
  })();

  function updateAsset<K extends keyof EditableAsset>(id: number, key: K, value: EditableAsset[K]) {
    setAssets((current) => current.map((asset) => asset.id === id ? { ...asset, [key]: value } : asset));
  }

  const count = (status: AssetStatus) => recorded.filter((asset) => asset.status === status).length;
  const summary = [
    `${text("Assets", "សម្ភារៈ")}: ${recorded.length}`,
    `${text("In use", "កំពុងប្រើ")}: ${count("in-use")} · ${text("Available", "ទំនេរ")}: ${count("available")}`,
    `${text("Maintenance", "កំពុងជួសជុល")}: ${count("maintenance")} · ${text("Retired", "ឈប់ប្រើ")}: ${count("retired")}`,
    `${text("Total value", "តម្លៃសរុប")}: ${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(totalValue)}`,
  ].join("\n");

  return (
    <ToolShell
      title="Asset Register"
      khmerTitle="បញ្ជីសម្ភារៈ"
      description="Maintain a temporary office asset register, review status and value totals, and export CSV without storing business data."
      descriptionKm="រៀបចំបញ្ជីសម្ភារៈការិយាល័យបណ្ដោះអាសន្ន ពិនិត្យស្ថានភាព និងតម្លៃសរុប ហើយនាំចេញ CSV ដោយមិនរក្សាទុកទិន្នន័យអាជីវកម្ម។"
    >
      <div className="overflow-x-auto rounded-md border border-[var(--ground-line)]">
        <table className="min-w-[980px] w-full text-left text-sm">
          <thead className="bg-[var(--ground-raised)] text-xs text-[var(--ink-dim)]">
            <tr>
              <th className="px-3 py-2">{text("Asset ID", "លេខសម្ភារៈ")}</th>
              <th className="px-3 py-2">{text("Name", "ឈ្មោះ")}</th>
              <th className="px-3 py-2">{text("Category", "ប្រភេទ")}</th>
              <th className="px-3 py-2">{text("Assignee", "អ្នកប្រើ")}</th>
              <th className="px-3 py-2">{text("Status", "ស្ថានភាព")}</th>
              <th className="px-3 py-2">{text("Value", "តម្លៃ")}</th>
              <th className="px-3 py-2"><span className="sr-only">{text("Remove", "លុប")}</span></th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.id} className="border-t border-[var(--ground-line)] align-top">
                <td className="w-36 px-2 py-2"><TextInput aria-label={text("Asset ID", "លេខសម្ភារៈ")} value={asset.code} onChange={(event) => updateAsset(asset.id, "code", event.target.value)} /></td>
                <td className="w-52 px-2 py-2"><TextInput aria-label={text("Name", "ឈ្មោះ")} value={asset.name} onChange={(event) => updateAsset(asset.id, "name", event.target.value)} /></td>
                <td className="w-44 px-2 py-2"><TextInput aria-label={text("Category", "ប្រភេទ")} value={asset.category} onChange={(event) => updateAsset(asset.id, "category", event.target.value)} placeholder={text("e.g. Hardware", "ឧ. ផ្នែករឹង")} /></td>
                <td className="w-44 px-2 py-2"><TextInput aria-label={text("Assignee", "អ្នកប្រើ")} value={asset.assignee} onChange={(event) => updateAsset(asset.id, "assignee", event.target.value)} /></td>
                <td className="w-44 px-2 py-2">
                  <Select aria-label={text("Status", "ស្ថានភាព")} value={asset.status} onChange={(event) => updateAsset(asset.id, "status", event.target.value as AssetStatus)}>
                    <option value="in-use">{text("In use", "កំពុងប្រើ")}</option>
                    <option value="available">{text("Available", "ទំនេរ")}</option>
                    <option value="maintenance">{text("Maintenance", "កំពុងជួសជុល")}</option>
                    <option value="retired">{text("Retired", "ឈប់ប្រើ")}</option>
                  </Select>
                </td>
                <td className="w-36 px-2 py-2"><TextInput aria-label={text("Value", "តម្លៃ")} type="number" min="0" step="0.01" value={asset.value} onChange={(event) => updateAsset(asset.id, "value", event.target.value)} /></td>
                <td className="px-2 py-2"><button type="button" onClick={() => setAssets((current) => current.filter((row) => row.id !== asset.id))} className="rounded px-2 py-2 text-[var(--danger)] hover:bg-[var(--danger)]/10" aria-label={text("Remove asset", "លុបសម្ភារៈ")}>×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!assets.length && <p className="p-8 text-center text-sm text-[var(--ink-faint)]">{text("No assets yet. Add an asset to begin.", "មិនទាន់មានសម្ភារៈទេ។ បន្ថែមសម្ភារៈដើម្បីចាប់ផ្តើម។")}</p>}
      </div>

      {invalidValues && <p role="alert" className="rounded-md border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-3 text-sm text-[var(--danger)]">{text("Asset values must be zero or greater. Invalid values are excluded from the total.", "តម្លៃសម្ភារៈត្រូវតែសូន្យ ឬធំជាង។ តម្លៃមិនត្រឹមត្រូវមិនត្រូវបានរាប់បញ្ចូលក្នុងសរុបទេ។")}</p>}

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => setAssets((current) => [...current, newAsset(nextId.current++)])}>{text("Add asset", "បន្ថែមសម្ភារៈ")}</Button>
        {recorded.length > 0 && <CopyButton text={csv} />}
        <Button type="button" disabled={!recorded.length} onClick={() => downloadCsv(csv)} className="!bg-[var(--ground-raised)] !text-[var(--ink)]">{text("Download CSV", "ទាញយក CSV")}</Button>
      </div>

      <Output
        label={text("Register summary", "សង្ខេបបញ្ជី")}
        value={recorded.length ? summary : text("Add asset details to see status and value totals.", "បន្ថែមព័ត៌មានសម្ភារៈ ដើម្បីមើលស្ថានភាព និងតម្លៃសរុប។")}
        error={!recorded.length}
        mono={false}
      />
    </ToolShell>
  );
}
