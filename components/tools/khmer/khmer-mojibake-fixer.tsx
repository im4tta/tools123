"use client";
import { useMemo } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, TextArea, ToolShell } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { Pill, PillAction, PillGroup } from "@/components/ui/Pill";
import { SourceCredits } from "@/components/ui/SourceCredits";
import { useToolState } from "@/lib/storage";
import { encodeAsMojibake, repairMojibake, type MojibakeFix } from "@/lib/khmer-devkit";

const SAMPLE_CLEAN = "សួស្តី ពិភពលោក — ភាសាខ្មែរ";

const FIX_LABEL: Record<MojibakeFix, [string, string]> = {
  cp1252: ["UTF-8 mis-read as Windows-1252 / Latin-1", "UTF-8 ត្រូវបានអានខុសជា Windows-1252 / Latin-1"],
  percent: ["Percent-encoded URL bytes (%E1%9E%80)", "បៃ URL ដែលបានអ៊ិនកូដភាគរយ (%E1%9E%80)"],
  escapes: ["Escape sequences (\\xE1, \\u1780, &#6016;)", "លំដាប់ escape (\\xE1, \\u1780, &#6016;)"],
};

export default function KhmerMojibakeFixer() {
  const { text: t } = useLanguage();
  const [input, setInput] = useToolState("khmer-mojibake:input", "");
  const [cp1252, setCp1252] = useToolState("khmer-mojibake:cp1252", true);
  const [percent, setPercent] = useToolState("khmer-mojibake:percent", true);
  const [escapes, setEscapes] = useToolState("khmer-mojibake:escapes", true);

  const result = useMemo(() => repairMojibake(input, { cp1252, percent, escapes }), [input, cp1252, percent, escapes]);
  const changed = input.length > 0 && result.text !== input;

  return (
    <ToolShell
      title="Khmer Mojibake Repair"
      khmerTitle="ឧបករណ៍ជួសជុលអក្សរខ្មែរខូច (Mojibake)"
      description="Khmer text that shows up as “áž€áž¶” or “%E1%9E%80” was saved correctly as UTF-8 but read back with the wrong encoding — a classic bug in old databases, CSV exports, emails, and PHP/MySQL sites. Paste the garbled text and this reverses the damage (even when it happened twice), decodes percent-encoded and escaped bytes, and tells you what went wrong. Runs entirely in your browser."
      descriptionKm="អត្ថបទខ្មែរដែលបង្ហាញជា «áž€áž¶» ឬ «%E1%9E%80» ត្រូវបានរក្សាទុកត្រឹមត្រូវជា UTF-8 ប៉ុន្តែត្រូវបានអានវិញដោយការអ៊ិនកូដខុស — កំហុសទូទៅក្នុងមូលដ្ឋានទិន្នន័យចាស់ ការនាំចេញ CSV អ៊ីមែល និងគេហទំព័រ PHP/MySQL។ បិទភ្ជាប់អត្ថបទខូច ហើយឧបករណ៍នេះនឹងត្រឡប់ការខូចខាត (ទោះបីកើតឡើងពីរដងក៏ដោយ) ឌិកូដបៃដែលអ៊ិនកូដភាគរយ និង escape ហើយប្រាប់អ្នកពីអ្វីដែលខុស។ ដំណើរការទាំងស្រុងក្នុងកម្មវិធីរុករក។"
    >
      <Field label="Garbled text" labelKm="អត្ថបទខូច">
        <TextArea value={input} onChange={(e) => setInput(e.target.value)} rows={5} placeholder="Paste text like áž€áž¶ or %E1%9E%80…" />
      </Field>

      <div className="flex flex-wrap items-center gap-2">
        <PillAction onClick={() => setInput(encodeAsMojibake(SAMPLE_CLEAN))}>{t("Sample: wrong decoder", "គំរូ៖ ឌិកូដខុស")}</PillAction>
        <PillAction onClick={() => setInput(encodeAsMojibake(encodeAsMojibake(SAMPLE_CLEAN)))}>{t("Sample: double-encoded", "គំរូ៖ អ៊ិនកូដពីរដង")}</PillAction>
        <PillAction onClick={() => setInput(encodeURIComponent(SAMPLE_CLEAN))}>{t("Sample: URL-encoded", "គំរូ៖ អ៊ិនកូដ URL")}</PillAction>
      </div>

      <PillGroup label={t("Repairs to try", "ការជួសជុលដែលត្រូវសាក")}>
        <Pill active={cp1252} onClick={() => setCp1252((v) => !v)}>{t("Wrong decoder (Windows-1252)", "ឌិកូដខុស (Windows-1252)")}</Pill>
        <Pill active={percent} onClick={() => setPercent((v) => !v)}>{t("Percent-encoding", "អ៊ិនកូដភាគរយ")}</Pill>
        <Pill active={escapes} onClick={() => setEscapes((v) => !v)}>{t("Escape sequences", "លំដាប់ escape")}</Pill>
      </PillGroup>

      <Output label="Repaired text" value={input ? result.text : ""} mono={false} />

      {input && (
        <div className="space-y-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 text-sm">
          {changed ? (
            <>
              <p className="font-medium text-[var(--ink)]">{t("What was fixed", "អ្វីដែលបានជួសជុល")}</p>
              <ul className="list-disc space-y-1 pl-5 text-[var(--ink-dim)]">
                {result.applied.map((f) => (
                  <li key={f}>
                    {t(FIX_LABEL[f][0], FIX_LABEL[f][1])}
                    {f === "cp1252" && result.layers > 1 && ` — ${t(`encoded ${result.layers} times`, `អ៊ិនកូដ ${result.layers} ដង`)}`}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-[var(--ink-dim)]">{t("No recoverable damage found — the text is either already correct or damaged in a way these repairs can't undo.", "រកមិនឃើញការខូចខាតដែលអាចជួសជុលបានទេ — អត្ថបទត្រឹមត្រូវស្រាប់ ឬខូចតាមរបៀបដែលការជួសជុលទាំងនេះមិនអាចត្រឡប់វិញបាន។")}</p>
          )}
          {result.lossy && (
            <p className="text-[var(--danger)]">{t("Warning: the text contains “?” runs or � (U+FFFD). Those bytes were already thrown away when the text was saved and cannot be recovered — re-export from the original source.", "ព្រមាន៖ អត្ថបទមាន «?» ជាបន្តបន្ទាប់ ឬ � (U+FFFD)។ បៃទាំងនោះត្រូវបានបោះចោលរួចពេលរក្សាទុក ហើយមិនអាចសង្គ្រោះបានទេ — សូមនាំចេញម្តងទៀតពីប្រភពដើម។")}</p>
          )}
        </div>
      )}

      <SourceCredits>
        <p>{t(
          "Each run of suspicious characters is mapped back to the bytes it came from (the Windows-1252 / ISO-8859-1 code page) and re-decoded as strict UTF-8; a run is only replaced when that produces valid UTF-8, so correct text and genuine accented letters are left alone. Up to four layers of double-encoding are undone. The approach is the same idea popularised by the ftfy (“fixes text for you”) Python library by Robyn Speer (Apache-2.0) — no ftfy code is used; this is an independent Tools123 implementation. For text typed with legacy (Limon/ABC) fonts rather than broken UTF-8, use the Khmer Font Encoding Inspector instead.",
          "ជួរតួអក្សរគួរឱ្យសង្ស័យនីមួយៗត្រូវបានបម្លែងត្រឡប់ទៅជាបៃដើម (ទំព័រកូដ Windows-1252 / ISO-8859-1) ហើយឌិកូដម្តងទៀតជា UTF-8 តឹងរ៉ឹង ជួរមួយត្រូវជំនួសតែពេលវាបង្កើតបាន UTF-8 ត្រឹមត្រូវប៉ុណ្ណោះ ដូច្នេះអត្ថបទត្រឹមត្រូវ និងអក្សរមានសញ្ញាពិតប្រាកដមិនត្រូវប៉ះពាល់ទេ។ អាចត្រឡប់ការអ៊ិនកូដជាន់គ្នារហូតដល់បួនស្រទាប់។ វិធីនេះជាគំនិតដូចគ្នាដែលបណ្ណាល័យ Python ftfy («fixes text for you») របស់ Robyn Speer (Apache-2.0) បានធ្វើឱ្យល្បី — មិនប្រើកូដ ftfy ទេ នេះជាការអនុវត្តឯករាជ្យរបស់ Tools123។ សម្រាប់អត្ថបទវាយដោយពុម្ពអក្សរចាស់ (Limon/ABC) ជំនួសឱ្យ UTF-8 ខូច សូមប្រើឧបករណ៍ត្រួតពិនិត្យការអ៊ិនកូដពុម្ពអក្សរខ្មែរ។",
        )}</p>
        <p className="mt-1"><a className="underline hover:text-[var(--ink-dim)]" href="https://github.com/rspeer/python-ftfy" target="_blank" rel="noreferrer">github.com/rspeer/python-ftfy</a></p>
      </SourceCredits>
    </ToolShell>
  );
}
