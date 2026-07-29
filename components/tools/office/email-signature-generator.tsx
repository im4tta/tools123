"use client";

import { ChangeEvent } from "react";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell, Field, TextInput } from "@/components/ui/Shell";
import { Button, Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

type Signature = { name: string; role: string; company: string; email: string; phone: string; website: string; accent: string; useAccent: boolean };
const INITIAL: Signature = { name: "", role: "", company: "", email: "", phone: "", website: "", accent: "#a97922", useAccent: true };
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
const safeAccent = (value: string) => /^#[0-9a-f]{6}$/i.test(value) ? value : "#333333";
const websiteHref = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try { const url = new URL(candidate); return /^https?:$/.test(url.protocol) ? url.href : ""; } catch { return ""; }
};
const makePlain = (data: Signature) => [data.name, data.role, data.company, data.email && `Email: ${data.email}`, data.phone && `Phone: ${data.phone}`, data.website && `Web: ${data.website}`].filter(Boolean).join("\n");
const makeHtml = (data: Signature) => {
  const accent = data.useAccent ? safeAccent(data.accent) : "#333333";
  const lines = [
    `<div style="font-family:Arial,sans-serif;color:#222;font-size:14px;line-height:1.45;border-left:3px solid ${escapeHtml(accent)};padding-left:12px">`,
    data.name && `<strong style="font-size:16px;color:${escapeHtml(accent)}">${escapeHtml(data.name)}</strong><br>`,
    data.role && `${escapeHtml(data.role)}${data.company ? " · " : ""}`,
    data.company && `<strong>${escapeHtml(data.company)}</strong>`,
    (data.role || data.company) && "<br>",
    data.email && `Email: <a href="mailto:${escapeHtml(data.email)}" style="color:${escapeHtml(accent)}">${escapeHtml(data.email)}</a><br>`,
    data.phone && `Phone: ${escapeHtml(data.phone)}<br>`,
    data.website && websiteHref(data.website) && `Web: <a href="${escapeHtml(websiteHref(data.website))}" style="color:${escapeHtml(accent)}">${escapeHtml(data.website)}</a><br>`,
    "</div>",
  ];
  return lines.filter(Boolean).join("");
};

const downloadHtml = (content: string) => {
  const url = URL.createObjectURL(new Blob([content], { type: "text/html;charset=utf-8" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = "email-signature.html"; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

export default function EmailSignatureGenerator() {
  const { text } = useLanguage();
  const [data, setData] = useToolState<Signature>("office-email-signature", INITIAL);
  const plain = makePlain(data), html = makeHtml(data);
  const setField = (field: keyof Signature) => (event: ChangeEvent<HTMLInputElement>) => setData((current) => ({ ...current, [field]: field === "useAccent" ? event.target.checked : event.target.value }));
  const accent = data.useAccent ? safeAccent(data.accent) : "#333333";

  return (
    <ToolShell title="Email Signature Generator" khmerTitle="កម្មវិធីបង្កើតហត្ថលេខាអ៊ីមែល" description="Build a private, image-free email signature with safe preview and source output." descriptionKm="បង្កើតហត្ថលេខាអ៊ីមែលឯកជនដោយគ្មានរូបភាព ជាមួយការមើលជាមុន និងកូដប្រភពសុវត្ថិភាព។">
      <p className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs text-[var(--ink-dim)]">{text("Local only: your fields are stored in this browser and are never sent to a service. The HTML is shown as text, never injected into this page.", "ប្រើតែក្នុងម៉ាស៊ីន៖ ព័ត៌មានរបស់អ្នករក្សាទុកក្នុងកម្មវិធីរុករកនេះ និងមិនត្រូវបានផ្ញើទៅសេវាណាមួយទេ។ កូដ HTML បង្ហាញជាអត្ថបទ និងមិនត្រូវបានបញ្ចូលក្នុងទំព័រនេះទេ។")}</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name" labelKm="ឈ្មោះពេញ"><TextInput value={data.name} onChange={setField("name")} autoComplete="name" /></Field>
        <Field label="Job title" labelKm="តួនាទីការងារ"><TextInput value={data.role} onChange={setField("role")} /></Field>
        <Field label="Company" labelKm="ក្រុមហ៊ុន"><TextInput value={data.company} onChange={setField("company")} autoComplete="organization" /></Field>
        <Field label="Email" labelKm="អ៊ីមែល"><TextInput type="email" value={data.email} onChange={setField("email")} autoComplete="email" /></Field>
        <Field label="Phone" labelKm="ទូរស័ព្ទ"><TextInput type="tel" value={data.phone} onChange={setField("phone")} autoComplete="tel" /></Field>
        <Field label="Website" labelKm="គេហទំព័រ"><TextInput type="url" value={data.website} onChange={setField("website")} placeholder="example.com" /></Field>
      </div>
      <div className="flex flex-wrap items-center gap-4 rounded-md border border-[var(--ground-line)] p-4"><label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm text-[var(--ink)]"><input type="checkbox" checked={data.useAccent} onChange={setField("useAccent")} />{text("Use accent color", "ប្រើពណ៌រំលេច")}</label><label className="flex items-center gap-2 text-sm text-[var(--ink)]">{text("Accent", "ពណ៌រំលេច")}<input type="color" value={data.accent} onChange={setField("accent")} disabled={!data.useAccent} className="h-10 w-14 cursor-pointer rounded border border-[var(--ground-line)] bg-transparent p-1" /></label></div>
      <section aria-labelledby="signature-preview" className="rounded-md border border-[var(--ground-line)] bg-white p-5 text-[#222]">
        <div className="mb-4 flex items-center justify-between gap-3"><h2 id="signature-preview" className="text-xs font-medium uppercase tracking-wide text-[#555]">{text("Safe React preview", "ការមើលជាមុន React សុវត្ថិភាព")}</h2><CopyButton text={plain} /></div>
        <div className="border-l-[3px] pl-3 text-sm leading-relaxed" style={{ borderColor: accent }}>
          {data.name && <div className="text-base font-bold" style={{ color: accent }}>{data.name}</div>}
          {(data.role || data.company) && <div>{data.role}{data.role && data.company ? " · " : ""}{data.company && <strong>{data.company}</strong>}</div>}
          <div className="mt-2 text-[#444]">{data.email && <div>Email: {data.email}</div>}{data.phone && <div>Phone: {data.phone}</div>}{data.website && <div>Web: {data.website}</div>}</div>
          {!plain && <div className="text-[#777]">{text("Enter details to preview your signature.", "បញ្ចូលព័ត៌មានដើម្បីមើលហត្ថលេខាជាមុន។")}</div>}
        </div>
      </section>
      <Output label={text("Plain-text signature", "ហត្ថលេខាអត្ថបទធម្មតា")} value={plain} mono={false} />
      <Output label={text("HTML source (escaped text only)", "កូដប្រភព HTML (អត្ថបទដែលបានការពារតែប៉ុណ្ណោះ)")} value={html} />
      <div className="flex flex-wrap gap-2"><CopyButton text={html} /><Button type="button" onClick={() => downloadHtml(html)}>{text("Download HTML source", "ទាញយកកូដ HTML")}</Button></div>
      <p className="text-xs text-[var(--ink-dim)]">{text("Email clients vary; paste or import the source into your client’s signature settings and review it before sending.", "កម្មវិធីអ៊ីមែលនីមួយៗអាចបង្ហាញខុសគ្នា។ សូមបិទភ្ជាប់ ឬនាំចូលកូដទៅការកំណត់ហត្ថលេខា ហើយពិនិត្យមុនពេលផ្ញើ។")}</p>
    </ToolShell>
  );
}
