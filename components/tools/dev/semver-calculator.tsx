"use client";
import { useMemo } from "react";
import { ToolShell, Field, TextInput, Select, Row } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

// SemVer 2.0.0 grammar — https://semver.org/#backusnaur-form-grammar-for-valid-semver-versions
const SEMVER_RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

interface SemVer {
  major: number;
  minor: number;
  patch: number;
  pre: string[];
  build: string[];
}

function parseSemver(input: string): SemVer | null {
  const m = SEMVER_RE.exec(input.trim());
  if (!m) return null;
  return {
    major: Number(m[1]),
    minor: Number(m[2]),
    patch: Number(m[3]),
    pre: m[4] ? m[4].split(".") : [],
    build: m[5] ? m[5].split(".") : [],
  };
}

/** Compare two pre-release identifiers: numeric < alphanumeric, ASCII order. */
function cmpIdent(a: string, b: string): number {
  const aNum = /^\d+$/.test(a);
  const bNum = /^\d+$/.test(b);
  if (aNum && bNum) return Number(a) - Number(b);
  if (aNum !== bNum) return aNum ? -1 : 1;
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Compare pre-release identifier lists; a shorter list sorts lower. */
function cmpPre(a: string[], b: string[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (i >= a.length) return -1;
    if (i >= b.length) return 1;
    const c = cmpIdent(a[i], b[i]);
    if (c !== 0) return c;
  }
  return 0;
}

/** SemVer precedence: build metadata is ignored; a pre-release sorts below its release. */
function compareVersions(a: SemVer, b: SemVer): number {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  if (a.patch !== b.patch) return a.patch - b.patch;
  if (a.pre.length === 0 && b.pre.length === 0) return 0;
  if (a.pre.length === 0) return 1;
  if (b.pre.length === 0) return -1;
  return cmpPre(a.pre, b.pre);
}

function format(v: SemVer): string {
  return `${v.major}.${v.minor}.${v.patch}${v.pre.length ? `-${v.pre.join(".")}` : ""}${v.build.length ? `+${v.build.join(".")}` : ""}`;
}

/** Bump one part; incrementing a pre-release drops the pre-release labels. */
function increment(v: SemVer, part: "major" | "minor" | "patch"): SemVer {
  return {
    major: part === "major" ? v.major + 1 : v.major,
    minor: part === "minor" ? v.minor + 1 : part === "major" ? 0 : v.minor,
    patch: part === "patch" ? (v.pre.length ? v.patch : v.patch + 1) : 0,
    pre: [],
    build: [],
  };
}

export default function SemverCalculator() {
  const { text: t } = useLanguage();
  const [version, setVersion] = useToolState("semver:version", "1.2.3");
  const [other, setOther] = useToolState("semver:other", "1.2.4");
  const [bump, setBump] = useToolState<"major" | "minor" | "patch">("semver:bump", "patch");

  const parsed = useMemo(() => parseSemver(version), [version]);
  const parsedOther = useMemo(() => parseSemver(other), [other]);
  const next = useMemo(() => (parsed ? format(increment(parsed, bump)) : ""), [parsed, bump]);
  const suggestions = useMemo(
    () =>
      parsed
        ? {
            patch: format(increment(parsed, "patch")),
            minor: format(increment(parsed, "minor")),
            major: format(increment(parsed, "major")),
          }
        : null,
    [parsed]
  );
  const cmp = useMemo(() => (parsed && parsedOther ? compareVersions(parsed, parsedOther) : null), [parsed, parsedOther]);

  return (
    <ToolShell
      title="SemVer Calculator"
      khmerTitle="គណនា SemVer"
      description="Parse, compare and increment Semantic Versioning 2.0.0 versions."
      descriptionKm="ញែក ប្រៀបធៀប និងបង្កើនកំណែតាមស្ដង់ដារ Semantic Versioning 2.0.0។"
    >
      <Field label="Version" labelKm="កំណែ">
        <TextInput value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.2.3" className="font-mono-ui" />
      </Field>

      {parsed ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              ["Major", "ចម្បង", String(parsed.major)],
              ["Minor", "អនុ", String(parsed.minor)],
              ["Patch", "បំណះ", String(parsed.patch)],
              ["Pre-release", "កំណែមុនផ្សាយ", parsed.pre.length ? parsed.pre.join(".") : "—"],
              ["Build", "កសាង", parsed.build.length ? parsed.build.join(".") : "—"],
            ].map(([label, km, value]) => (
              <div key={label} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
                <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">{t(label, km)}</div>
                <div className="mt-1 truncate font-mono-ui text-sm font-semibold text-[var(--ink)]">{value}</div>
              </div>
            ))}
          </div>

          <Row>
            <Field label="Version A" labelKm="កំណែ A">
              <TextInput value={version} onChange={(e) => setVersion(e.target.value)} className="font-mono-ui" />
            </Field>
            <Field label="Version B" labelKm="កំណែ B">
              <TextInput value={other} onChange={(e) => setOther(e.target.value)} className="font-mono-ui" />
            </Field>
          </Row>
          <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-sm text-[var(--ink)]">
            {cmp === null ? (
              <span className="text-[var(--danger)]">{t("Enter two valid versions to compare.", "សូមបញ្ចូលកំណែត្រឹមត្រូវពីរដើម្បីប្រៀបធៀប។")}</span>
            ) : (
              <>
                {t("Version A is", "កំណែ A គឺ")}{" "}
                <span className="font-semibold text-[var(--gold)]">
                  {cmp > 0 ? t("greater than", "ធំជាង") : cmp < 0 ? t("less than", "តូចជាង") : t("equal to", "ស្មើនឹង")}
                </span>{" "}
                {t("Version B", "កំណែ B")}
              </>
            )}
          </div>

          <Row>
            <Field label="Increment" labelKm="បង្កើន">
              <Select value={bump} onChange={(e) => setBump(e.target.value as "major" | "minor" | "patch")}>
                <option value="major">major</option>
                <option value="minor">minor</option>
                <option value="patch">patch</option>
              </Select>
            </Field>
            <Output label={t("Next version", "កំណែបន្ទាប់")} value={next} />
          </Row>

          <Output
            label={t("Suggested next versions", "កំណែបន្ទាប់ដែលបានណែនាំ")}
            value={
              suggestions
                ? `patch → ${suggestions.patch}\nminor → ${suggestions.minor}\nmajor → ${suggestions.major}`
                : ""
            }
          />
        </>
      ) : (
        <p className="text-sm text-[var(--danger)]">{t("Enter a valid SemVer 2.0.0 version, e.g. 1.2.3-beta.1.", "សូមបញ្ចូលកំណែ SemVer 2.0.0 ឱ្យបានត្រឹមត្រូវ ឧ. 1.2.3-beta.1។")}</p>
      )}

      <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
        <div className="mb-1 font-medium text-[var(--ink)]">{t("Source & Credits", "ប្រភព និងការអរគុណ")}</div>
        {t("Parsing, precedence and increment rules follow the Semantic Versioning 2.0.0 specification —", "ក្បួនញែក លំដាប់អាទិភាព និងការបង្កើន អនុវត្តតាមលក្ខណៈបច្ចេកទេស Semantic Versioning 2.0.0 —")}{" "}
        <a className="underline" href="https://semver.org/" target="_blank" rel="noreferrer">semver.org</a>
        {t(" — original Tools123 implementation.", " — ការសរសេរដើមរបស់ Tools123។")}
      </div>
    </ToolShell>
  );
}
