"use client";

import { useState } from "react";
import { Activity, Check, ChevronRight, Droplet, FileText, PlusCircle, Sparkles, Trash2, UserCheck } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

const VITAMIN_A = [{ d: 1, age: "៦ ខែ (6m)" }, { d: 2, age: "១២ ខែ (12m)" }, { d: 3, age: "១៨ ខែ (18m)" }, { d: 4, age: "២៤ ខែ (24m)" }, { d: 5, age: "៣៦ ខែ (36m)" }, { d: 6, age: "៤៨ ខែ (48m)" }];
const DEWORMING = [{ d: 1, age: "១២ ខែ (12m)" }, { d: 2, age: "១៨ ខែ (18m)" }, { d: 3, age: "២៤ ខែ (24m)" }, { d: 4, age: "៣៦ ខែ (36m)" }, { d: 5, age: "៤៨ ខែ (48m)" }, { d: 6, age: "៦០ ខែ (60m)" }];

const VACCINE_SCHEDULE = [
  { ageGroup: "ពេលកើត (At Birth)", items: [
    { id: "bcg", name: "BCG", full: "ការពារជំងឺរបេង", note: "ចាក់ស្មាឆ្វេង", drop: false },
    { id: "hepb", name: "HepB", full: "ការពាររលាកថ្លើមប្រភេទ បេ", note: "ចាក់ភ្លៅស្តាំ", drop: false },
  ]},
  { ageGroup: "អាយុ ១.៥ ខែ (6 Weeks)", items: [
    { id: "opv1", name: "OPV1", full: "គ្រុនស្វិតដៃជើង (បន្តក់)", note: "បន្តក់តាមមាត់ ២ដំណក់", drop: true },
    { id: "dpt1", name: "DPT-HepB-Hib 1", full: "ក្អកមាន់, ក្រញ៉ង់, តេតាណូស, HepB, Hib", note: "ចាក់ភ្លៅស្តាំ", drop: false },
    { id: "pcv1", name: "PCV1", full: "រលាកសួត/ស្រោមខួរ", note: "ចាក់ភ្លៅឆ្វេង", drop: false },
  ]},
  { ageGroup: "អាយុ ២.៥ ខែ (10 Weeks)", items: [
    { id: "opv2", name: "OPV2", full: "គ្រុនស្វិតដៃជើង (បន្តក់)", note: "បន្តក់តាមមាត់ ២ដំណក់", drop: true },
    { id: "dpt2", name: "DPT-HepB-Hib 2", full: "ក្អកមាន់, ក្រញ៉ង់, តេតាណូស, HepB, Hib", note: "ចាក់ភ្លៅស្តាំ", drop: false },
    { id: "pcv2", name: "PCV2", full: "រលាកសួត/ស្រោមខួរ", note: "ចាក់ភ្លៅឆ្វេង", drop: false },
  ]},
  { ageGroup: "អាយុ ៣.៥ ខែ (14 Weeks)", items: [
    { id: "opv3", name: "OPV3", full: "គ្រុនស្វិតដៃជើង (បន្តក់)", note: "បន្តក់តាមមាត់ ២ដំណក់", drop: true },
    { id: "ipv", name: "IPV", full: "គ្រុនស្វិតដៃជើង (ចាក់)", note: "ចាក់ភ្លៅឆ្វេង", drop: false },
    { id: "dpt3", name: "DPT-HepB-Hib 3", full: "ក្អកមាន់, ក្រញ៉ង់, តេតាណូស, HepB, Hib", note: "ចាក់ភ្លៅស្តាំ", drop: false },
    { id: "pcv3", name: "PCV3", full: "រលាកសួត/ស្រោមខួរ", note: "ចាក់ភ្លៅឆ្វេង", drop: false },
  ]},
  { ageGroup: "អាយុ ៩-១៨ ខែ (9-18 Months)", items: [
    { id: "mr1", name: "MR1", full: "កញ្ជ្រិល និងស្អូច", note: "ចាក់ដៃឆ្វេង (៩ខែ)", drop: false },
    { id: "je", name: "JE", full: "រលាកខួរក្បាលជេអ៊ី", note: "ចាក់ដៃស្តាំ (៩ខែ)", drop: false },
    { id: "mr2", name: "MR2", full: "កញ្ជ្រិល និងស្អូច (ដូសជំរុញ)", note: "ចាក់ដៃឆ្វេង (១៨ខែ)", drop: false },
  ]},
];

const WHO: Record<string, { m: number; s3n: number; s2n: number; med: number; s2p: number }[]> = {
  girls: [
    { m: 0, s3n: 2.0, s2n: 2.4, med: 3.2, s2p: 4.2 }, { m: 2, s3n: 3.4, s2n: 3.9, med: 5.1, s2p: 6.6 },
    { m: 4, s3n: 4.4, s2n: 5.0, med: 6.4, s2p: 8.2 }, { m: 6, s3n: 5.1, s2n: 5.8, med: 7.3, s2p: 9.3 },
    { m: 9, s3n: 5.8, s2n: 6.6, med: 8.2, s2p: 10.5 }, { m: 12, s3n: 6.3, s2n: 7.0, med: 8.9, s2p: 11.5 },
    { m: 18, s3n: 7.2, s2n: 8.1, med: 10.2, s2p: 13.0 }, { m: 24, s3n: 8.1, s2n: 9.0, med: 11.5, s2p: 14.8 },
    { m: 36, s3n: 9.7, s2n: 10.8, med: 13.9, s2p: 18.1 }, { m: 48, s3n: 11.0, s2n: 12.3, med: 16.1, s2p: 21.2 },
    { m: 60, s3n: 12.1, s2n: 13.7, med: 18.2, s2p: 24.2 },
  ],
  boys: [
    { m: 0, s3n: 2.1, s2n: 2.5, med: 3.3, s2p: 4.4 }, { m: 2, s3n: 3.8, s2n: 4.3, med: 5.6, s2p: 7.1 },
    { m: 4, s3n: 4.9, s2n: 5.6, med: 7.0, s2p: 8.8 }, { m: 6, s3n: 5.7, s2n: 6.4, med: 7.9, s2p: 9.8 },
    { m: 9, s3n: 6.4, s2n: 7.2, med: 8.9, s2p: 11.0 }, { m: 12, s3n: 6.9, s2n: 7.7, med: 9.6, s2p: 12.0 },
    { m: 18, s3n: 7.8, s2n: 8.6, med: 10.9, s2p: 13.7 }, { m: 24, s3n: 8.6, s2n: 9.7, med: 12.2, s2p: 15.5 },
    { m: 36, s3n: 10.0, s2n: 11.3, med: 14.3, s2p: 18.3 }, { m: 48, s3n: 11.2, s2n: 12.7, med: 16.3, s2p: 21.2 },
    { m: 60, s3n: 12.4, s2n: 14.1, med: 18.3, s2p: 24.2 },
  ],
};

export default function YellowCardTracker() {
  const { text: t } = useLanguage();
  const [tab, setTab] = useToolState<"card" | "growth">("yt:tab", "card");
  const [gender, setGender] = useToolState<"girls" | "boys">("yt:gender", "girls");
  const [vacDone, setVacDone] = useToolState<string[]>("yt:vacDone", ["bcg", "hepb"]);

  const [childName, setChildName] = useToolState("yt:name", "");
  const [dob, setDob] = useToolState("yt:dob", "");
  const [fatherName, setFatherName] = useToolState("yt:father", "");
  const [motherName, setMotherName] = useToolState("yt:mother", "");
  const [village, setVillage] = useToolState("yt:village", "");
  const [commune, setCommune] = useToolState("yt:commune", "");
  const [district, setDistrict] = useToolState("yt:district", "");

  const [growthData, setGrowthData] = useToolState<{ month: number; weight: number; date: string }[]>("yt:growth", [
    { month: 0, weight: 3.2, date: "2026-06-10" }, { month: 2, weight: 5.1, date: "2026-08-10" },
    { month: 4, weight: 6.3, date: "2026-10-10" }, { month: 6, weight: 7.2, date: "2026-12-10" },
  ]);
  const [inMonth, setInMonth] = useState("");
  const [inWeight, setInWeight] = useState("");

  const toggleVax = (id: string) => {
    setVacDone((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const addGrowth = (e: React.FormEvent) => {
    e.preventDefault();
    const m = parseFloat(inMonth);
    const w = parseFloat(inWeight);
    if (m >= 0 && m <= 60 && w > 0 && w <= 30) {
      setGrowthData((prev) => [...prev, { month: m, weight: w, date: new Date().toISOString().slice(0, 10) }].sort((a, b) => a.month - b.month));
      setInMonth(""); setInWeight("");
    }
  };

  const evalWeight = (month: number, weight: number) => {
    const c = WHO[gender];
    let closest = c[0];
    for (const p of c) { if (Math.abs(p.m - month) < Math.abs(closest.m - month)) closest = p; }
    if (weight < closest.s3n) return { label: t("Severely Underweight", "ស្គមខ្លាំង"), cls: "bg-[var(--danger)]/20 text-[var(--danger)]" };
    if (weight < closest.s2n) return { label: t("Underweight", "ស្គម"), cls: "bg-[var(--gold)]/20 text-[var(--gold)]" };
    if (weight <= closest.s2p) return { label: t("Normal Growth", "ធម្មតា"), cls: "bg-[var(--success)]/20 text-[var(--success)]" };
    return { label: t("Overweight", "លើសទម្ងន់"), cls: "bg-orange-500/20 text-orange-500" };
  };

  return (
    <ToolShell
      title="Yellow Card Tracker"
      khmerTitle="ប័ណ្ណសុខភាពកុមារជាតិ"
      description="Cambodia National Child Health Card — immunization schedule, nutrition guidelines, vitamin A & deworming tracker, and WHO child growth chart."
      descriptionKm="ប័ណ្ណសុខភាពកុមារជាតិ — កាលវិភាគផ្តល់ថ្នាំបង្ការ ការណែនាំអាហារូបត្ថម្ភ តារាងវីតាមីន អា និងថ្នាំទម្លាក់សត្វល្អិត និងតារាងលូតលាស់កុមារយោងតាម WHO"
    >
      {/* Tab bar */}
      <div className="mb-6 flex w-full gap-2 overflow-x-auto rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-1.5 no-scrollbar">
        {[
          { id: "card" as const, label: t("Yellow Card", "ប័ណ្ណលឿង"), icon: FileText },
          { id: "growth" as const, label: t("Growth Chart", "តារាងលូតលាស់"), icon: Activity },
        ].map((tb) => (
          <button key={tb.id} type="button" onClick={() => setTab(tb.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${tab === tb.id ? "bg-[var(--ground-raised-hi)] text-[var(--ink)] ring-1 ring-[var(--gold)]" : "text-[var(--ink-dim)] hover:bg-[var(--ground-raised-hi)]"}`}>
            <tb.icon size={16} className={tab === tb.id ? "text-[var(--gold)]" : "text-[var(--ink-faint)]"} />
            {tb.label}
          </button>
        ))}
      </div>

      {/* YELLOW CARD TAB */}
      {tab === "card" && (
        <div className="space-y-5">
          {/* Child Profile */}
          <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5">
            <div className="mb-4 flex items-center gap-2">
              <UserCheck size={18} className="text-[var(--gold)]" />
              <h2 className="font-semibold text-[var(--ink)]">{t("Child Profile", "ព័ត៌មានកុមារ")}</h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="text-[11px] font-semibold text-[var(--ink-faint)]">{t("Child Name", "ឈ្មោះកុមារ")}</label>
                <input value={childName} onChange={(e) => setChildName(e.target.value)} className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--gold-dim)]" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[var(--ink-faint)]">{t("Date of Birth", "ថ្ងៃខែកំណើត")}</label>
                <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--gold-dim)]" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[var(--ink-faint)]">{t("Father", "ឪពុក")}</label>
                <input value={fatherName} onChange={(e) => setFatherName(e.target.value)} className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--gold-dim)]" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[var(--ink-faint)]">{t("Mother", "ម្តាយ")}</label>
                <input value={motherName} onChange={(e) => setMotherName(e.target.value)} className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--gold-dim)]" />
              </div>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="text-[11px] font-semibold text-[var(--ink-faint)]">{t("Village", "ភូមិ")}</label>
                <input value={village} onChange={(e) => setVillage(e.target.value)} className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--gold-dim)]" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[var(--ink-faint)]">{t("Commune", "ឃុំ/សង្កាត់")}</label>
                <input value={commune} onChange={(e) => setCommune(e.target.value)} className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--gold-dim)]" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[var(--ink-faint)]">{t("District", "ស្រុក/ខណ្ឌ")}</label>
                <input value={district} onChange={(e) => setDistrict(e.target.value)} className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--gold-dim)]" />
              </div>
            </div>
          </div>

          {/* Nutrition */}
          <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-[var(--gold)]" />
              <h2 className="font-semibold text-[var(--ink)]">{t("Nutrition Guidelines", "អាហារូបត្ថម្ភ និងអនាម័យ")}</h2>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-[var(--success)]/40 bg-[var(--success)]/5 p-3">
                <div className="font-bold text-sm text-[var(--success)]">{t("0–6 Months", "អាយុ ០–៦ ខែ")}</div>
                <p className="mt-1 text-xs leading-relaxed text-[var(--ink-dim)]">{t("Exclusive breastfeeding — at least 8 times/day. No water or other food.", "បំបៅដោះកូនតែមួយមុខគត់ យ៉ាងតិច ៨ដង/ថ្ងៃ។ មិនត្រូវឲ្យទឹក ឬអាហារផ្សេងឡើយ។")}</p>
              </div>
              <div className="rounded-lg border border-[var(--gold)]/40 bg-[var(--gold)]/5 p-3">
                <div className="font-bold text-sm text-[var(--gold)]">{t("6–11 Months", "អាយុ ៦–១១ ខែ")}</div>
                <p className="mt-1 text-xs leading-relaxed text-[var(--ink-dim)]">{t("Continue breastfeeding + start complementary feeding (thick porridge) 2–3 times/day.", "បន្តបំបៅដោះ និងចាប់ផ្តើមផ្តល់អាហារបន្ថែម ២-៣ដង/ថ្ងៃ។")}</p>
              </div>
              <div className="rounded-lg border border-orange-500/40 bg-orange-500/5 p-3">
                <div className="font-bold text-sm text-orange-500">{t("12–23 Months", "អាយុ ១២–២៣ ខែ")}</div>
                <p className="mt-1 text-xs leading-relaxed text-[var(--ink-dim)]">{t("Continue breastfeeding until 2 years + family meals 3–4 times/day + 1–2 snacks.", "បន្តបំបៅដោះរហូតដល់ ២ឆ្នាំ + អាហារគ្រួសារ ៣-៤ដង/ថ្ងៃ + អាហារសម្រន់ ១-២ដង។")}</p>
              </div>
            </div>
          </div>

          {/* Immunization Schedule */}
          <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5">
            <div className="mb-3 flex items-center gap-2">
              <Droplet size={16} className="text-[var(--gold)]" />
              <h2 className="font-semibold text-[var(--ink)]">{t("Immunization Schedule", "កំណត់ត្រាការផ្តល់ថ្នាំបង្ការ")}</h2>
            </div>
            <div className="text-[11px] italic text-[var(--ink-faint)] mb-3">{t("Click a row to mark as completed", "ចុចលើជួរដើម្បីបញ្ជាក់ថាបានផ្តល់")}</div>
            {VACCINE_SCHEDULE.map((group) => (
              <div key={group.ageGroup} className="mb-3">
                <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground)] px-3 py-1.5 text-xs font-bold text-[var(--ink)]">{group.ageGroup}</div>
                {group.items.map((item) => {
                  const done = vacDone.includes(item.id);
                  return (
                    <button key={item.id} type="button" onClick={() => toggleVax(item.id)}
                      className={`flex w-full items-center gap-2 border-b border-[var(--ground-line)] px-3 py-2 text-left text-sm transition ${done ? "bg-[var(--ground-raised-hi)]" : ""}`}>
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${done ? "border-[var(--gold)] bg-[var(--gold)] text-[var(--ground)]" : "border-[var(--ground-line)]"}`}>
                        {done && <Check size={12} strokeWidth={3} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className={`text-xs font-semibold ${done ? "text-[var(--ink-faint)] line-through" : "text-[var(--ink)]"}`}>
                          {item.name} {item.drop && <span className="text-[var(--teal)]">{t("(drops)", "(បន្តក់)")}</span>}
                        </div>
                        <div className="text-[11px] text-[var(--ink-dim)]">{item.full}</div>
                        <div className="text-[10px] text-[var(--ink-faint)]">{item.note}</div>
                      </div>
                      {done && <div className="ml-auto shrink-0 rounded bg-[var(--success)]/10 px-2 py-0.5 font-mono-ui text-[10px] font-bold text-[var(--success)]">{t("Done", "បានផ្តល់")}</div>}
                      {!done && <ChevronRight size={14} className="ml-auto shrink-0 text-[var(--ink-faint)]" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Vitamin A + Deworming */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold text-[var(--ink)]">{t("Vitamin A (6–59 months)", "វីតាមីន អា (៦–៥៩ ខែ)")}</div>
              <div className="grid grid-cols-3 gap-1 text-center text-[11px]">
                {VITAMIN_A.map((d) => <div key={d.d} className="rounded border border-[var(--ground-line)] bg-[var(--ground)] px-2 py-1.5 font-bold text-[var(--ink-dim)]">{d.d}. {d.age}</div>)}
              </div>
            </div>
            <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold text-[var(--ink)]">{t("Deworming (12–59 months)", "ថ្នាំទម្លាក់សត្វល្អិត (១២–៥៩ ខែ)")}</div>
              <div className="grid grid-cols-3 gap-1 text-center text-[11px]">
                {DEWORMING.map((d) => <div key={d.d} className="rounded border border-[var(--ground-line)] bg-[var(--ground)] px-2 py-1.5 font-bold text-[var(--ink-dim)]">{d.d}. {d.age}</div>)}
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="rounded-xl border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-4 text-center text-xs text-[var(--danger)] leading-relaxed">
            <strong>{t("Important Notice:", "សេចក្តីជូនដំណឹងសំខាន់៖")}</strong>{" "}
            {t("This app is a reference template only. All updates and medical decisions must be consulted with a Referral Hospital or Health Center.", "កម្មវិធីនេះជាទម្រង់គំរូសម្រាប់យោងពិគ្រោះប៉ុណ្ណោះ។ រាល់ការសម្រេចចិត្តត្រូវពិគ្រោះជាមួយមន្ទីរពេទ្យបង្អែក ឬមណ្ឌលសុខភាព។")}
          </div>
        </div>
      )}

      {/* GROWTH CHART TAB */}
      {tab === "growth" && (
        <div className="space-y-5">
          {/* Gender selector */}
          <div className="flex items-center gap-2">
            {[{ id: "girls", label: t("Girls", "កុមារី"), icon: "👧" }, { id: "boys", label: t("Boys", "កុមារា"), icon: "👦" }].map((g) => (
              <button key={g.id} type="button" onClick={() => setGender(g.id as "girls" | "boys")}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition ${gender === g.id ? "border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold)]" : "border-[var(--ground-line)] bg-[var(--ground)] text-[var(--ink-dim)]"}`}>
                {g.icon} {g.label}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
            {[{ c: "bg-orange-500/20 text-orange-600", l: t("Overweight", "លើសទម្ងន់") },
              { c: "bg-[var(--success)]/20 text-[var(--success)]", l: t("Normal", "ធម្មតា") },
              { c: "bg-[var(--gold)]/20 text-[var(--gold)]", l: t("Underweight", "ស្គម") },
              { c: "bg-[var(--danger)]/20 text-[var(--danger)]", l: t("Severe", "ស្គមខ្លាំង") },
            ].map((le, i) => <div key={i} className={`rounded border border-[var(--ground-line)] px-2.5 py-1.5 font-semibold ${le.c}`}>{le.l}</div>)}
          </div>

          {/* SVG Chart */}
          <div className="overflow-x-auto rounded-xl border border-[var(--ground-line)] bg-white p-2">
            <div className="min-w-[650px]">
              <svg viewBox="-45 -15 690 370" className="w-full h-auto max-h-[460px]">
                {/* Y axis */}
                {Array.from({ length: 16 }, (_, i) => {
                  const w = i * 2; const y = 320 - (w * 320 / 30);
                  return <g key={`y${i}`}>
                    <line x1="0" y1={y} x2="600" y2={y} stroke={i % 5 === 0 ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.1)"} strokeWidth={i % 5 === 0 ? 1 : 0.5} />
                    <text x="-8" y={y + 3} textAnchor="end" fontSize="9" fontWeight="bold" fill="#334155">{w} kg</text>
                  </g>;
                })}
                {/* X axis */}
                {Array.from({ length: 31 }, (_, i) => {
                  const m = i * 2; const x = m * 10;
                  return <g key={`x${i}`}><line x1={x} y1="0" x2={x} y2="320" stroke={m % 12 === 0 || m === 6 ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.1)"} strokeWidth={m % 12 === 0 ? 1 : 0.5} />
                    <text x={x} y="336" textAnchor="middle" fontSize="8" fill="#475569">{m}</text></g>;
                })}

                {/* WHO curves */}
                {(() => {
                  const c = WHO[gender];
                  const xy = (p: typeof c[0], key: "s3n" | "s2n" | "med" | "s2p") => `${p.m * 10},${320 - (p[key] * 320 / 30)}`;
                  const path = (key: "s3n" | "s2n" | "med" | "s2p") => c.map((p) => xy(p, key)).join(" L ");
                  const area = (k1: "s3n" | "s2n" | "med" | "s2p", k2: "s3n" | "s2n" | "med" | "s2p") => `M ${path(k1)} L ${c.slice().reverse().map((p) => xy(p, k2)).join(" L ")} Z`;
                  return <g>
                    <path d={`M 0,0 L ${path("s2p")} L 600,0 Z`} fill="#fed7aa" opacity="0.5" />
                    <path d={area("s2p", "s2n")} fill="#a7f3d0" opacity="0.6" />
                    <path d={area("s2n", "s3n")} fill="#fef08a" opacity="0.7" />
                    <path d={`M ${path("s3n")} L 600,320 L 0,320 Z`} fill="#fca5a5" opacity="0.7" />
                    <path d={`M ${path("s2p")}`} fill="none" stroke="#ea580c" strokeWidth="1.5" strokeDasharray="4" />
                    <path d={`M ${path("med")}`} fill="none" stroke="#059669" strokeWidth="2" />
                    <path d={`M ${path("s2n")}`} fill="none" stroke="#ca8a04" strokeWidth="1.5" strokeDasharray="4" />
                    <path d={`M ${path("s3n")}`} fill="none" stroke="#dc2626" strokeWidth="1.5" />
                  </g>;
                })()}

                {/* Data points */}
                {growthData.map((pt, idx) => {
                  const cx = pt.month * 10, cy = 320 - (pt.weight * 320 / 30);
                  const prev = idx > 0 ? growthData[idx - 1] : null;
                  return <g key={idx}>
                    {prev && <line x1={prev.month * 10} y1={320 - (prev.weight * 320 / 30)} x2={cx} y2={cy} stroke="#1e1b4b" strokeWidth="2.5" />}
                    <circle cx={cx} cy={cy} r="5" fill="#1e1b4b" /><circle cx={cx} cy={cy} r="2.5" fill="#fff" />
                  </g>;
                })}
              </svg>
              <div className="mt-1 text-center text-xs font-semibold text-[var(--ink-dim)]">{t("Age (Months) →", "អាយុ (ខែ) →")}</div>
            </div>
          </div>

          {/* Add + Table */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                <PlusCircle size={16} className="text-[var(--gold)]" />
                {t("Add Weight", "បញ្ចូលទម្ងន់")}
              </div>
              <form onSubmit={addGrowth} className="space-y-3">
                <input type="number" step="0.5" min="0" max="60" placeholder={t("Age (months)", "អាយុ (ខែ)")} value={inMonth} onChange={(e) => setInMonth(e.target.value)}
                  className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--gold-dim)]" />
                <input type="number" step="0.1" min="0.5" max="30" placeholder={t("Weight (kg)", "ទម្ងន់ (kg)")} value={inWeight} onChange={(e) => setInWeight(e.target.value)}
                  className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--gold-dim)]" />
                <button type="submit" className="w-full rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[#0a0c0d] transition hover:bg-[var(--gold-dim)]">
                  {t("Save", "កត់ត្រា")}
                </button>
              </form>
            </div>
            <div className="overflow-x-auto rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 lg:col-span-2">
              <div className="mb-2 text-sm font-semibold text-[var(--ink)]">{t("Measurement History", "ប្រវត្តិការវាស់វែង")}</div>
              {growthData.length === 0 ? (
                <p className="py-6 text-center text-xs text-[var(--ink-faint)]">{t("No measurements yet.", "មិនទាន់មានទិន្នន័យ។")}</p>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead><tr className="border-b border-[var(--ground-line)] font-semibold text-[var(--ink-faint)]">
                    <th className="p-2">{t("Age (mo)", "អាយុ (ខែ)")}</th>
                    <th className="p-2">{t("Weight (kg)", "ទម្ងន់ (kg)")}</th>
                    <th className="p-2">{t("Date", "កាលបរិច្ឆេទ")}</th>
                    <th className="p-2">{t("WHO Status", "ស្ថានភាព WHO")}</th>
                    <th className="p-2"></th>
                  </tr></thead>
                  <tbody className="divide-y divide-[var(--ground-line)]">
                    {growthData.map((pt, idx) => {
                      const ev = evalWeight(pt.month, pt.weight);
                      return <tr key={idx}><td className="p-2 font-bold text-[var(--ink)]">{pt.month}</td>
                        <td className="p-2 font-bold text-[var(--gold)]">{pt.weight} kg</td>
                        <td className="p-2 text-[var(--ink-faint)]">{pt.date}</td>
                        <td className="p-2"><span className={`rounded px-2 py-0.5 text-[10px] font-bold ${ev.cls}`}>{ev.label}</span></td>
                        <td className="p-2"><button type="button" onClick={() => setGrowthData((prev) => prev.filter((_, i) => i !== idx))} className="rounded p-1 text-[var(--ink-faint)] hover:text-[var(--danger)]"><Trash2 size={13} /></button></td></tr>;
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="rounded-xl border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-4 text-center text-xs text-[var(--danger)] leading-relaxed">
            <strong>{t("Important Notice:", "សេចក្តីជូនដំណឹងសំខាន់៖")}</strong>{" "}
            {t("This tool shows WHO 2006 child growth standards for reference. All medical decisions must be made by a qualified healthcare professional.", "តារាងនេះបង្ហាញស្តង់ដារ WHO 2006 សម្រាប់ជាឯកសារយោង។ រាល់ការសម្រេចចិត្តផ្នែកវេជ្ជសាស្ត្រត្រូវតែធ្វើឡើងដោយគ្រូពេទ្យជំនាញ។")}
          </div>
        </div>
      )}
    </ToolShell>
  );
}
