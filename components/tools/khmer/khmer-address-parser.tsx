"use client";

import { useMemo } from "react";
import { MapPin } from "lucide-react";
import addressData from "@/data/address_data.json";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextArea, ToolShell } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";

type Level = "province" | "district" | "commune" | "village";

const LEVEL_LABEL: Record<Level, [string, string]> = {
  province: ["Province", "ខេត្ត"],
  district: ["District", "ស្រុក"],
  commune: ["Commune", "ឃុំ"],
  village: ["Village", "ភូមិ"],
};

// Deepest level first: a village match is more specific than a province match.
const LEVEL_ORDER: Level[] = ["village", "commune", "district", "province"];

type NodeInfo = { code: string; en: string; kh: string };

type Indexed = NodeInfo & {
  level: Level;
  provinceCode: string;
  districtCode: string;
  communeCode: string;
  villageCode: string;
  /** [lowercased en, kh, code] sorted longest-first so the longest name wins. */
  names: string[];
};

// Flat index over every administrative level plus a code → node map so
// parent lookups (and the sample address) stay O(1).
const INDEX: Indexed[] = [];
const NODE_MAP = new Map<string, NodeInfo>();

function addNode(node: NodeInfo) {
  NODE_MAP.set(node.code, node);
}

for (const p of addressData) {
  addNode(p);
  INDEX.push({
    ...p,
    level: "province",
    provinceCode: p.code,
    districtCode: "",
    communeCode: "",
    villageCode: "",
    names: [p.en.toLowerCase(), p.kh, p.code].sort((a, b) => b.length - a.length),
  });
  for (const d of p.districts) {
    addNode(d);
    INDEX.push({
      ...d,
      level: "district",
      provinceCode: p.code,
      districtCode: d.code,
      communeCode: "",
      villageCode: "",
      names: [d.en.toLowerCase(), d.kh, d.code].sort((a, b) => b.length - a.length),
    });
    for (const c of d.communes) {
      addNode(c);
      INDEX.push({
        ...c,
        level: "commune",
        provinceCode: p.code,
        districtCode: d.code,
        communeCode: c.code,
        villageCode: "",
        names: [c.en.toLowerCase(), c.kh, c.code].sort((a, b) => b.length - a.length),
      });
      for (const v of c.villages) {
        addNode(v);
        INDEX.push({
          ...v,
          level: "village",
          provinceCode: p.code,
          districtCode: d.code,
          communeCode: c.code,
          villageCode: v.code,
          names: [v.en.toLowerCase(), v.kh, v.code].sort((a, b) => b.length - a.length),
        });
      }
    }
  }
}

// A realistic sample address built from real data (first Phnom Penh village).
const SAMPLE_ADDRESS = (() => {
  const p = addressData.find((x) => x.en === "Phnom Penh") ?? addressData[0];
  const d = p.districts[0];
  const c = d.communes[0];
  const v = c.villages[0];
  return `ផ្ទះលេខ ១២ ផ្លូវ ២៧១, ${v.kh}, ${c.kh}, ${d.kh}, ${p.kh}`;
})();

/** Does any of this node's names (en, kh, code) appear in the input? */
function hasName(node: NodeInfo | undefined, lower: string) {
  if (!node) return false;
  return (
    (node.en.length >= 2 && lower.includes(node.en.toLowerCase())) ||
    lower.includes(node.kh) ||
    lower.includes(node.code)
  );
}

/**
 * A matched node scores higher when its parent chain (province, district,
 * commune) also appears in the input. This keeps short, common names such as
 * "Thmei" (ថ្មី) or "Kampong Svay" from dragging in the wrong province.
 */
function chainScore(hit: Indexed, lower: string) {
  let score = 1;
  if (hit.level !== "province" && hasName(NODE_MAP.get(hit.provinceCode), lower)) score++;
  if ((hit.level === "commune" || hit.level === "village") && hasName(NODE_MAP.get(hit.districtCode), lower)) score++;
  if (hit.level === "village" && hasName(NODE_MAP.get(hit.communeCode), lower)) score++;
  return score;
}

type Parsed = {
  house: string;
  street: string;
  village: NodeInfo | null;
  commune: NodeInfo | null;
  district: NodeInfo | null;
  province: NodeInfo | null;
  matched: boolean;
};

/** Best-effort parse: longest admin-name match wins, tie-broken by hierarchy. */
function parseAddress(raw: string): Parsed {
  const input = raw.trim();
  const houseKm = /ផ្ទះ\s*លេខ\s*([0-9០-៩][0-9០-៩A-Za-z/.,-]*)/.exec(input);
  const houseEn = /\b(?:No\.?|#)\s*([0-9][0-9A-Za-z/.,-]*)/.exec(input);
  const streetKm = /ផ្លូវ(?!ការ)\s*(?:លេខ\s*)?([0-9០-៩][0-9០-៩A-Za-z/.,-]*|[\u1780-\u17FF]{2,})/.exec(input);
  const streetEn = /\b(?:Street|St\.?|Road|Rd\.?)\s*([0-9][0-9A-Za-z/.,-]*|[A-Za-z][A-Za-z0-9 .'/-]*)/.exec(input);
  const clean = (s: string | undefined) => (s ? s.replace(/[.,;:()\s]+$/g, "") : "");
  const house = clean(houseKm?.[1] ?? houseEn?.[1]);
  const street = clean(streetKm?.[1] ?? streetEn?.[1]);

  let village: NodeInfo | null = null;
  let commune: NodeInfo | null = null;
  let district: NodeInfo | null = null;
  let province: NodeInfo | null = null;

  if (input) {
    const lower = input.toLowerCase();
    const cands: { hit: Indexed; isCode: boolean; chain: number; len: number; depth: number }[] = [];
    for (const hit of INDEX) {
      const name = hit.names.find((n) => n.length >= 2 && lower.includes(n));
      if (!name) continue;
      cands.push({
        hit,
        isCode: name === hit.code,
        chain: chainScore(hit, lower),
        len: name.length,
        depth: LEVEL_ORDER.indexOf(hit.level),
      });
    }
    cands.sort(
      (a, b) => b.chain - a.chain || Number(b.isCode) - Number(a.isCode) || b.len - a.len || b.depth - a.depth
    );
    const winner = cands[0]?.hit;
    if (winner) {
      province = NODE_MAP.get(winner.provinceCode) ?? null;
      district = NODE_MAP.get(winner.districtCode) ?? null;
      commune = NODE_MAP.get(winner.communeCode) ?? null;
      village = NODE_MAP.get(winner.villageCode) ?? null;
    }
  }

  return { house, street, village, commune, district, province, matched: !!village || !!commune || !!district || !!province };
}

function InfoRow({ label, labelKm, value, code }: { label: string; labelKm: string; value: string; code?: string }) {
  const { text: t } = useLanguage();
  return (
    <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground)] px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-[var(--ink-faint)]">{t(label, labelKm)}</p>
      <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2 text-sm leading-relaxed text-[var(--ink)]">
        <span className="font-khmer">{value}</span>
        {code && <code className="text-xs text-[var(--gold)]">{code}</code>}
      </p>
    </div>
  );
}

export default function KhmerAddressParser() {
  const { text: t } = useLanguage();
  const [raw, setRaw] = useToolState("khmer-address-parser:address", "");

  const parsed = useMemo(() => parseAddress(raw), [raw]);
  const input = raw.trim();

  const adminRows = useMemo(() => {
    const out: { label: [string, string]; node: NodeInfo }[] = [];
    const add = (label: [string, string], node: NodeInfo | null) => {
      if (node) out.push({ label, node });
    };
    add(LEVEL_LABEL.village, parsed.village);
    add(LEVEL_LABEL.commune, parsed.commune);
    add(LEVEL_LABEL.district, parsed.district);
    add(LEVEL_LABEL.province, parsed.province);
    return out;
  }, [parsed.village, parsed.commune, parsed.district, parsed.province]);

  const fullAddress = useMemo(() => {
    const parts: string[] = [];
    if (parsed.house) parts.push(`${t("House", "ផ្ទះលេខ")} ${parsed.house}`);
    if (parsed.street) parts.push(`${t("Street", "ផ្លូវ")} ${parsed.street}`);
    for (const row of adminRows) parts.push(t(row.node.en, row.node.kh));
    return parts.length ? parts.join(", ") : input;
  }, [parsed.house, parsed.street, adminRows, input, t]);

  const copyText = useMemo(() => {
    const lines: string[] = [];
    if (parsed.house) lines.push(`${t("House", "ផ្ទះលេខ")}: ${parsed.house}`);
    if (parsed.street) lines.push(`${t("Street", "ផ្លូវ")}: ${parsed.street}`);
    for (const row of adminRows) lines.push(`${t(...row.label)}: ${t(row.node.en, row.node.kh)} (${row.node.code})`);
    return lines.join("\n");
  }, [parsed.house, parsed.street, adminRows, t]);

  const mapsHref = `https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`;

  return (
    <ToolShell
      title="Khmer Address Parser"
      khmerTitle="អ្នកវិភាគអាសយដ្ឋានខ្មែរ"
      description="Paste a free-text Khmer, English, or mixed address and parse out the house/street, village, commune, district, and province with administrative codes — best-effort matching against the Cambodia administrative dataset."
      descriptionKm="បិទភ្ជាប់អាសយដ្ឋានជាភាសាខ្មែរ អង់គ្លេស ឬលាយ រួចវិភាគយកផ្ទះ/ផ្លូវ ភូមិ ឃុំ ស្រុក និងខេត្ត ជាមួយលេខកូដរដ្ឋបាល — ការផ្គូផ្គងជាការប៉ាន់ស្មានល្អបំផុត ទល់នឹងទិន្នន័យរដ្ឋបាលកម្ពុជា។"
    >
      <Field label="Address" labelKm="អាសយដ្ឋាន" hint="Khmer, English, or mixed" hintKm="ខ្មែរ អង់គ្លេស ឬលាយ">
        <TextArea
          rows={4}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={t("Paste an address, e.g. ផ្ទះលេខ ១២ ផ្លូវ ២៧១…", "បិទភ្ជាប់អាសយដ្ឋាន ឧ. ផ្ទះលេខ ១២ ផ្លូវ ២៧១…")}
          className="font-khmer"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <Button type="button" onClick={() => setRaw(SAMPLE_ADDRESS)}>
            {t("Load sample", "ផ្ទុកឧទាហរណ៍")}
          </Button>
          {!!input && (
            <Button type="button" onClick={() => setRaw("")}>
              {t("Clear", "សម្អាត")}
            </Button>
          )}
        </div>
      </Field>

      {!!input && (
        <section className="rounded-md border border-[var(--gold-dim)] bg-[var(--ground-raised)] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--gold)]">
              {t("Parsed address", "អាសយដ្ឋានដែលបានវិភាគ")}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <CopyButton text={copyText} compact />
              <a
                href={mapsHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md bg-[var(--gold)] px-3 py-1.5 text-xs font-medium text-[#0a0c0d] transition hover:bg-[var(--gold-dim)]"
              >
                <MapPin size={13} />
                {t("Google Maps", "ផែនទី Google")}
              </a>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {parsed.house && <InfoRow label="House" labelKm="ផ្ទះលេខ" value={parsed.house} />}
            {parsed.street && <InfoRow label="Street" labelKm="ផ្លូវ" value={parsed.street} />}
            {adminRows.map((row) => (
              <InfoRow key={row.node.code} label={row.label[0]} labelKm={row.label[1]} value={t(row.node.en, row.node.kh)} code={row.node.code} />
            ))}
          </div>
          {!parsed.matched && (
            <p className="mt-3 text-xs leading-relaxed text-[var(--ink-faint)]">
              {t(
                "No province, district, commune, or village names were recognized in this address. Check the spelling or use the official Khmer administrative names.",
                "រកមិនឃើញឈ្មោះខេត្ត ស្រុក ឃុំ ឬភូមិណាមួយក្នុងអាសយដ្ឋាននេះទេ។ សូមពិនិត្យអក្ខរាវិរុទ្ធ ឬប្រើឈ្មោះរដ្ឋបាលខ្មែរផ្លូវការ។"
              )}
            </p>
          )}
        </section>
      )}

      <p className="text-xs leading-relaxed text-[var(--ink-dim)]">
        {t(
          "Best-effort parse: the address is matched against the Cambodia administrative dataset (province/district/commune/village names in Khmer, English, and codes); house and street fragments are extracted with simple patterns. Always verify the result before official use.",
          "ការវិភាគជាការប៉ាន់ស្មានល្អបំផុត៖ អាសយដ្ឋានត្រូវបានផ្គូផ្គងជាមួយទិន្នន័យរដ្ឋបាលកម្ពុជា (ឈ្មោះខេត្ត/ស្រុក/ឃុំ/ភូមិ ជាភាសាខ្មែរ អង់គ្លេស និងលេខកូដ); ផ្ទះ និងផ្លូវត្រូវបានដកស្រង់តាមលំនាំសាមញ្ញ។ សូមផ្ទៀងផ្ទាត់លទ្ធផល មុនពេលប្រើប្រាស់ជាផ្លូវការ។"
        )}
      </p>
    </ToolShell>
  );
}
