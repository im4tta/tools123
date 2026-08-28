"use client";
import { ToolShell, Field, TextInput, TextArea, Row } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

type Experience = { id: number; company: string; role: string; start: string; end: string; desc: string };
type Education = { id: number; school: string; degree: string; year: string };
type ResumeState = {
  name: string;
  title: string;
  contact: string;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string;
};

const nextId = (arr: { id: number }[]) => arr.reduce((m, x) => Math.max(m, x.id), 0) + 1;

export default function ResumeBuilder() {
  const { text: t } = useLanguage();
  const [state, setState] = useToolState<ResumeState>("resume-builder:state", {
    name: "Sok Dara",
    title: "Web Developer",
    contact: "sok.dara@example.com · +855 12 345 678 · Phnom Penh",
    summary:
      "Frontend developer with 4+ years building bilingual web applications for Cambodian businesses, focused on performance and clean UI.",
    experience: [
      {
        id: 1,
        company: "Digital Khmer Co.",
        role: "Frontend Developer",
        start: "2022",
        end: "",
        desc: "Built and maintained customer-facing React applications; improved page load speed by 40%.",
      },
    ],
    education: [
      { id: 1, school: "Royal University of Phnom Penh", degree: "BS in Computer Science", year: "2021" },
    ],
    skills: "React, TypeScript, Next.js, Tailwind CSS, Git",
  });

  const patch = (p: Partial<ResumeState>) => setState((s) => ({ ...s, ...p }));
  const updateExp = (i: number, p: Partial<Experience>) =>
    setState((s) => ({ ...s, experience: s.experience.map((e, idx) => (idx === i ? { ...e, ...p } : e)) }));
  const updateEdu = (i: number, p: Partial<Education>) =>
    setState((s) => ({ ...s, education: s.education.map((e, idx) => (idx === i ? { ...e, ...p } : e)) }));

  const removeBtn =
    "w-full rounded-md border border-[var(--ground-line)] px-3 py-2 text-sm text-[var(--ink-dim)] transition hover:text-[var(--ink)]";

  return (
    <ToolShell
      title="Resume / CV Builder"
      khmerTitle="បង្កើត CV"
      description="Fill in your details and watch a clean A4-style CV update live, then print or save it as PDF."
      descriptionKm="បំពេញព័ត៌មានរបស់អ្នក ហើយមើល CV រចនាបថ A4 ប្ដូរភ្លាមៗ រួចបោះពុម្ព ឬរក្សាទុកជា PDF។"
    >
      <div className="space-y-5 print:hidden">
        <Row>
          <Field label="Name" labelKm="ឈ្មោះ">
            <TextInput value={state.name} onChange={(e) => patch({ name: e.target.value })} />
          </Field>
          <Field label="Job title" labelKm="តំណែងការងារ">
            <TextInput value={state.title} onChange={(e) => patch({ title: e.target.value })} />
          </Field>
        </Row>
        <Field label="Contact" labelKm="ទំនាក់ទំនង">
          <TextInput value={state.contact} onChange={(e) => patch({ contact: e.target.value })} />
        </Field>
        <Field label="Summary" labelKm="សេចក្តីសង្ខេប">
          <TextArea rows={3} value={state.summary} onChange={(e) => patch({ summary: e.target.value })} />
        </Field>

        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
            {t("Experience", "បទពិសោធន៍")}
          </div>
          <div className="space-y-3">
            {state.experience.map((exp, i) => (
              <div key={exp.id} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
                <Row>
                  <Field label="Company" labelKm="ក្រុមហ៊ុន">
                    <TextInput value={exp.company} onChange={(e) => updateExp(i, { company: e.target.value })} />
                  </Field>
                  <Field label="Role" labelKm="តួនាទី">
                    <TextInput value={exp.role} onChange={(e) => updateExp(i, { role: e.target.value })} />
                  </Field>
                </Row>
                <Row>
                  <Field label="Start" labelKm="ចាប់ផ្តើម">
                    <TextInput value={exp.start} onChange={(e) => updateExp(i, { start: e.target.value })} className="font-mono-ui" />
                  </Field>
                  <Field label="End" labelKm="បញ្ចប់" hint="empty = Present" hintKm="ទទេ = បច្ចុប្បន្ន">
                    <TextInput value={exp.end} onChange={(e) => updateExp(i, { end: e.target.value })} className="font-mono-ui" />
                  </Field>
                </Row>
                <div className="mt-3 flex items-end gap-3">
                  <div className="flex-1">
                    <Field label="Description" labelKm="ការពិពណ៌នា">
                      <TextArea rows={2} value={exp.desc} onChange={(e) => updateExp(i, { desc: e.target.value })} />
                    </Field>
                  </div>
                  <button type="button" onClick={() => setState((s) => ({ ...s, experience: s.experience.filter((_, idx) => idx !== i) }))} className={removeBtn}>
                    {t("Remove", "លុប")}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <Button type="button" onClick={() => setState((s) => ({ ...s, experience: [...s.experience, { id: nextId(s.experience), company: "", role: "", start: "", end: "", desc: "" }] }))}>
              {t("Add experience", "បន្ថែមបទពិសោធន៍")}
            </Button>
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
            {t("Education", "ការអប់រំ")}
          </div>
          <div className="space-y-3">
            {state.education.map((edu, i) => (
              <div key={edu.id} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3">
                <Row>
                  <Field label="School" labelKm="សាលារៀន">
                    <TextInput value={edu.school} onChange={(e) => updateEdu(i, { school: e.target.value })} />
                  </Field>
                  <Field label="Degree" labelKm="សញ្ញាបត្រ">
                    <TextInput value={edu.degree} onChange={(e) => updateEdu(i, { degree: e.target.value })} />
                  </Field>
                </Row>
                <div className="mt-3 flex items-end gap-3">
                  <div className="flex-1">
                    <Field label="Year" labelKm="ឆ្នាំ">
                      <TextInput value={edu.year} onChange={(e) => updateEdu(i, { year: e.target.value })} className="font-mono-ui" />
                    </Field>
                  </div>
                  <button type="button" onClick={() => setState((s) => ({ ...s, education: s.education.filter((_, idx) => idx !== i) }))} className={removeBtn}>
                    {t("Remove", "លុប")}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <Button type="button" onClick={() => setState((s) => ({ ...s, education: [...s.education, { id: nextId(s.education), school: "", degree: "", year: "" }] }))}>
              {t("Add education", "បន្ថែមការអប់រំ")}
            </Button>
          </div>
        </div>

        <Field label="Skills" labelKm="ជំនាញ">
          <TextArea rows={2} value={state.skills} onChange={(e) => patch({ skills: e.target.value })} />
        </Field>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={() => window.print()}>
            {t("Print / Save PDF", "បោះពុម្ព / រក្សាទុក PDF")}
          </Button>
          <p className="text-xs leading-relaxed text-[var(--ink-dim)]">
            {t("Tip: click Print, then choose 'Save as PDF' in the print dialog to export the CV.", "គន្លឹះ៖ ចុចបោះពុម្ព រួចជ្រើសរើស 'Save as PDF' ក្នុងប្រអប់បោះពុម្ព ដើម្បីនាំចេញ CV។")}
          </p>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #resume-print, #resume-print * { visibility: visible; }
          #resume-print { position: absolute; inset: 0; width: 100%; }
        }
      `}</style>

      <div id="resume-print" className="mx-auto max-w-3xl rounded-md border border-[var(--ground-line)] bg-white p-8 text-neutral-900 shadow-sm print:rounded-none print:border-0 print:shadow-none">
        <header>
          <h2 className="text-3xl font-bold">{state.name || t("Your name", "ឈ្មោះរបស់អ្នក")}</h2>
          {state.title && <p className="mt-0.5 text-lg font-medium">{state.title}</p>}
          {state.contact && <p className="mt-1 text-sm text-neutral-600">{state.contact}</p>}
        </header>

        <hr className="my-4 border-neutral-300" />

        {state.summary.trim() && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">{t("Summary", "សេចក្តីសង្ខេប")}</h3>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">{state.summary}</p>
          </section>
        )}

        {state.experience.some((e) => e.company || e.role || e.desc) && (
          <section className="mt-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">{t("Experience", "បទពិសោធន៍")}</h3>
            {state.experience
              .filter((e) => e.company || e.role || e.desc)
              .map((exp) => (
                <div key={exp.id} className="mt-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <h4 className="font-semibold">{exp.role || exp.company}</h4>
                    <span className="text-sm text-neutral-600">
                      {exp.start}
                      {exp.start && (exp.end || t("Present", "បច្ចុប្បន្ន")) ? " – " : ""}
                      {exp.end || t("Present", "បច្ចុប្បន្ន")}
                    </span>
                  </div>
                  {exp.company && <p className="text-sm italic text-neutral-700">{exp.company}</p>}
                  {exp.desc && <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{exp.desc}</p>}
                </div>
              ))}
          </section>
        )}

        {state.education.some((e) => e.school || e.degree || e.year) && (
          <section className="mt-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">{t("Education", "ការអប់រំ")}</h3>
            {state.education
              .filter((e) => e.school || e.degree || e.year)
              .map((edu) => (
                <div key={edu.id} className="mt-3 flex flex-wrap items-baseline justify-between gap-x-3">
                  <div>
                    <h4 className="font-semibold">{edu.school}</h4>
                    {edu.degree && <p className="text-sm text-neutral-700">{edu.degree}</p>}
                  </div>
                  {edu.year && <span className="text-sm text-neutral-600">{edu.year}</span>}
                </div>
              ))}
          </section>
        )}

        {state.skills.trim() && (
          <section className="mt-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">{t("Skills", "ជំនាញ")}</h3>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">{state.skills}</p>
          </section>
        )}
      </div>
    </ToolShell>
  );
}
