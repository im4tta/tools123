"use client";

import { useState } from "react";
import { Award, BookOpen, ExternalLink, Globe, Sparkles, Star } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

const NAMS = [
  { id: "ariname", titleKm: "អរិនាម", titleEn: "The Challenger", weekday: "ថ្ងៃសុក្រ", consonants: "ស ហ ឡ", elementKm: "ភ្លើងឆេះសន្ធោសន្ធៅ", elementEn: "Vibrant Fire", symbol: "ខ្លា / គោក្បុស", descKm: "តំណាងឱ្យជោគវាសនាដែលត្រូវឆ្លងកាត់ឧបសគ្គធំៗ ប៉ុន្តែផ្តល់ថាមពលតស៊ូខ្ពស់។ អ្នកមានថ្ងៃកំណើតនេះមានយុទ្ធសាស្ត្រក្នុងការយកឈ្នះសត្រូវ។", descEn: "Represents a path of great trials but blesses with extreme resilience and strategic mastery." },
  { id: "kurujanam", titleKm: "កុរុជានាម", titleEn: "The Elite Scholar", weekday: "ថ្ងៃអាទិត្យ", consonants: "អ អា ឥ ឦ ឧ ឩ ឯ ឱ", elementKm: "អាកាស / ធាតុទទេ", elementEn: "Cosmos & Ether", symbol: "គ្រុឌ (Garuda)", descKm: "តំណាងឱ្យពន្លឺស្មារតី បញ្ញាញាណខ្ពង់ខ្ពស់។ ម្ចាស់នាមនេះច្រើនជាអ្នកដឹកនាំផ្លូវចិត្ត និងទទួលបានការគោរពខ្លាំង។", descEn: "Associated with deep intellect, moral purity, and academic brilliance." },
  { id: "chornam", titleKm: "ចោរនាម", titleEn: "The Resourceful Strategist", weekday: "ថ្ងៃចន្ទ", consonants: "ក ខ គ ឃ ង", elementKm: "ដីមានជីជាតិ", elementEn: "Fertile Earth", symbol: "ឆ្មា / ខ្លា", descKm: "តំណាងភាពឈ្លាសវៃ ដឹងកាលៈទេសៈ។ អាចបំបែកបង្កើតទ្រព្យបានពីកន្លែងដែលអ្នកដទៃមើលមិនឃើញ។", descEn: "Represents agility, resourcefulness, and sharp business acumen." },
  { id: "rajanam", titleKm: "រាជនាម", titleEn: "The Royal Sovereign", weekday: "ថ្ងៃអង្គារ", consonants: "ច ឆ ជ ឈ ញ", elementKm: "ទឹកហូរ", elementEn: "Flowing Water", symbol: "សេះ / ស្តេចតោ", descKm: "តំណាងស្តេច មន្ត្រីជាន់ខ្ពស់។ ផ្តល់បុណ្យបារមីខ្ពស់ ភាពជាអ្នកដឹកនាំពីកំណើត និងសិរីមង្គលរុងរឿង។", descEn: "Signifies executive power, authority, and sovereign leadership." },
  { id: "polnam", titleKm: "ពលនាម", titleEn: "The Loyal Force", weekday: "ថ្ងៃពុធ", consonants: "ដ ឋ ឌ ឍ ណ", elementKm: "ភ្លើងកម្តៅ", elementEn: "Fire Element", symbol: "ដំរី / ឆ្កែ", descKm: "តំណាងកម្លាំង ស្មារតីអត់ធន់ ភាពស្មោះត្រង់។ ជាគ្រឹះដ៏រឹងមាំ ឧស្សាហ៍ព្យាយាម គួរឱ្យទុកចិត្តបំផុត។", descEn: "Represents military discipline, robust endurance, and absolute loyalty." },
  { id: "anam", titleKm: "អានាម", titleEn: "The Resilient Citizen", weekday: "ថ្ងៃសៅរ៍", consonants: "ត ថ ទ ធ ន", elementKm: "ខ្យល់បក់", elementEn: "Wind & Air", symbol: "នាគ / គ្រុឌ", descKm: "តំណាងប្រជារាស្ត្រទូទៅ។ ផ្តល់និស្ស័យរាបទាប ងាយស្រួលរស់នៅ និងឫសគល់ជីវិតរឹងមាំ។", descEn: "Signifies deep humility, approachability, and enduring resilience." },
  { id: "sakunanam", titleKm: "សកុណនាម", titleEn: "The Free Explorer", weekday: "ថ្ងៃព្រហស្បតិ៍", consonants: "ប ផ ព ភ ម", elementKm: "ដែក / លោហធាតុ", elementEn: "Metal & Iron", symbol: "សត្វស្លាប (Royal Bird)", descKm: "តំណាងសេរីភាព ការធ្វើដំណើរ។ មានគំនិតច្នៃប្រឌិតខ្ពស់ និយាយស្តីពិរោះ ពូកែផ្សារភ្ជាប់ទំនាក់ទំនង។", descEn: "Represents freedom, communication, and swift adaptable intellect." },
  { id: "yaknam", titleKm: "យក្សនាម", titleEn: "The Formidable Protector", weekday: "ថ្ងៃពុធយប់", consonants: "យ រ ល វ", elementKm: "ឈើធំ / ព្រៃព្រឹក្សា", elementEn: "Large Wood", symbol: "យក្ស (Yaksha)", descKm: "តំណាងយក្សបុរាណមានអំណាចរឹងមាំ។ ផ្តល់ការការពារគ្រួសារ មានឥទ្ធិពលស្ងប់ស្ងៀមគួរឱ្យកោតក្រែង។", descEn: "Signifies supreme defensive power and mysterious inner depths." },
];

const EQUATION_NODES = [
  { id: "kampu", title: "កម្ពុ (Kampu)", subtitle: "មាស / Gold", desc: "តំណាងឱ្យធាតុលោហៈមាសដ៏ភ្លឺថ្លា ភាពរឹងមាំ ទ្រព្យសម្បត្តិ និងពន្លឺចាំងការពារទឹកដី។", longDesc: "យោងតាមអក្សរសាស្ត្រខ្មែរបុរាណ ពាក្យថា «កម្ពុ» គឺតំណាងឱ្យលោហធាតុ «មាស» ដែលមិនចេះច្រែះចាប់។ តំណាងឱ្យសេចក្តីស្អាតបរិសុទ្ធ ភាពរឹងមាំ និងអំណាចការពារគ្រួសារ។" },
  { id: "ja", title: "ជ / ជា (Ja/Jaa)", subtitle: "កំណើត / Birth", desc: "តំណាងឱ្យការចាប់ផ្តើម សំណាបជីវិតលូតលាស់ ថាមពលនៃស្មារតី និងការបង្កើតថ្មី។", longDesc: "ពាក្យថា «ជ» ឬ «ជា» សំដៅលើ «កំណើត» ឬ «ការលូតលាស់មិនចេះចប់»។ ធាតុនេះតំណាងឱ្យការចាប់ផ្តើមដ៏ល្អមង្គល។" },
  { id: "kampuchea", title: "កម្ពុជា (Kampuchea)", subtitle: "សុវណ្ណភូមិ / The Golden Land", desc: "ការរួមបញ្ចូលគ្នានៃធាតុទាំងពីរ បង្កើតបានជា «ដែនដីកំណើតមាស» ដែលមានតម្លៃខ្ពង់ខ្ពស់។", longDesc: "នៅពេលធាតុទាំងពីរ «កម្ពុ» (មាស) និង «ជ/ជា» (កំណើត) ផ្សំផ្គុំគ្នាជាពាក្យ «កម្ពុជា» វានឹងបង្កើតបានជា «ដែនដីកំណើតមាស» ដែលប្រវត្តិសាស្ត្រស្គាល់ថា «សុវណ្ណភូមិ»។" },
];

export default function ChhmohAstrology() {
  const { text: t } = useLanguage();
  const [tab, setTab] = useToolState<"nams" | "equation">("ch:tab", "nams");
  const [selectedNam, setSelectedNam] = useState(0);
  const [eqNode, setEqNode] = useState("kampu");

  return (
    <ToolShell
      title="Chhmoh Astrology Portal"
      khmerTitle="ឈ្មោះ ហោរាសាស្ត្រខ្មែរ"
      description="Traditional Khmer naming astrology — the 8 Nams (មហាទក្សា), auspicious consonants by weekday, and the Golden Equation of Khmer heritage."
      descriptionKm="ក្បួនហោរាសាស្ត្រខ្មែរបុរាណ — តម្រានាមទាំង៨ (មហាទក្សា) អក្សរមង្គលតាមថ្ងៃកំណើត និងសមីការមាសនៃបេតិកភណ្ឌខ្មែរ"
    >
      {/* Standalone app banner */}
      <div className="mb-6 rounded-xl border border-[var(--gold)]/30 bg-gradient-to-r from-[var(--gold)]/10 to-transparent p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-[var(--gold)]/20 p-2.5 text-[var(--gold)]"><Sparkles size={20} /></div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-[var(--gold)]">{t("Full experience available on the standalone app", "សូមប្រើកម្មវិធីពេញលេញ")}</h3>
            <p className="mt-1 text-xs leading-relaxed text-[var(--ink-dim)]">
              {t(
                "This page shows the 8 traditional Nams and the Golden Equation. For the full Chhmoh experience — including the interactive astrological wheel, baby naming wizard, name combinator with 45+ traditional names, DOB-based destiny calculator, custom gong sounds, and PNG export — visit the standalone app:",
                "ទំព័រនេះបង្ហាញតម្រានាមទាំង៨ និងសមីការមាសខ្មែរ។ សម្រាប់បទពិសោធន៍ពេញលេញ — រួមមានកង់ហោរាសាស្ត្រ ម៉ាស៊ីនឱ្យឈ្មោះកូន ឈ្មោះបុរាណជាង៤៥ ការគណនាថ្ងៃកំណើត សំឡេងគងវង់ និងការទាញយក PNG — សូមចូលទៅកាន់កម្មវិធីឯករាជ្យ៖"
              )}
            </p>
            <a
              href="https://chhmom.name"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[#0a0c0d] transition hover:bg-[var(--gold-dim)]"
            >
              <ExternalLink size={14} /> chhmom.name
            </a>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="mb-6 flex w-full gap-2 overflow-x-auto rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-1.5 no-scrollbar">
        {[
          { id: "nams" as const, label: t("The 8 Nams", "តម្រានាមទាំង៨"), icon: BookOpen },
          { id: "equation" as const, label: t("Golden Equation", "សមីការមាសខ្មែរ"), icon: Globe },
        ].map((tb) => (
          <button key={tb.id} type="button" onClick={() => setTab(tb.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${tab === tb.id ? "bg-[var(--ground-raised-hi)] text-[var(--ink)] ring-1 ring-[var(--gold)]" : "text-[var(--ink-dim)] hover:bg-[var(--ground-raised-hi)]"}`}>
            <tb.icon size={16} className={tab === tb.id ? "text-[var(--gold)]" : "text-[var(--ink-faint)]"} />{tb.label}
          </button>
        ))}
      </div>

      {/* 8 Nams Tab */}
      {tab === "nams" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-4">
            {NAMS.map((nam, i) => (
              <button key={nam.id} type="button" onClick={() => setSelectedNam(i)}
                className={`rounded-lg border px-3 py-2 text-center text-xs font-semibold transition ${selectedNam === i ? "border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold)]" : "border-[var(--ground-line)] bg-[var(--ground)] text-[var(--ink-dim)]"}`}>
                {nam.weekday}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-[var(--gold)]/30 bg-[var(--ground-raised)] p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--gold)]/20 text-[var(--gold)]"><Award size={24} /></div>
              <div>
                <h2 className="font-khmer text-2xl font-bold text-[var(--ink)]">{NAMS[selectedNam].titleKm}</h2>
                <p className="text-xs italic text-[var(--ink-faint)]">{NAMS[selectedNam].titleEn}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">{t("Weekday", "ថ្ងៃ")}</div>
                <div className="mt-1 text-sm font-bold text-[var(--ink)]">{NAMS[selectedNam].weekday}</div>
              </div>
              <div className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">{t("Element", "ធាតុ")}</div>
                <div className="mt-1 text-sm font-bold text-[var(--ink)]">{NAMS[selectedNam].elementKm}</div>
                <div className="text-[10px] text-[var(--ink-faint)]">{NAMS[selectedNam].elementEn}</div>
              </div>
              <div className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">{t("Symbol", "សត្វតំណាង")}</div>
                <div className="mt-1 text-sm font-bold text-[var(--ink)]">{NAMS[selectedNam].symbol}</div>
              </div>
              <div className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">{t("Consonants", "អក្សរមង្គល")}</div>
                <div className="mt-1 font-khmer text-lg font-bold text-[var(--gold)]">{NAMS[selectedNam].consonants}</div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] p-4">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]"><Star size={11} className="text-[var(--gold)]" /> {t("Character Traits", "ចរិតលក្ខណៈ")}</div>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-dim)]">{NAMS[selectedNam].descKm}</p>
              <p className="mt-2 text-xs leading-relaxed italic text-[var(--ink-faint)]">{NAMS[selectedNam].descEn}</p>
            </div>
          </div>

          {/* All 8 Nams overview */}
          <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5">
            <h3 className="mb-4 font-semibold text-[var(--ink)]">{t("All 8 Nams at a Glance", "តម្រានាមទាំង៨ ដោយសង្ខេប")}</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {NAMS.map((nam, i) => (
                <button key={nam.id} type="button" onClick={() => setSelectedNam(i)}
                  className={`rounded-lg border p-3 text-left transition ${selectedNam === i ? "border-[var(--gold)] bg-[var(--gold)]/5" : "border-[var(--ground-line)] bg-[var(--ground)] hover:border-[var(--gold)]/30"}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--ink)]">{nam.titleKm}</span>
                    <span className="text-[11px] text-[var(--ink-faint)]">{nam.weekday}</span>
                  </div>
                  <div className="mt-1 text-xs text-[var(--ink-dim)]">{nam.titleEn}</div>
                  <div className="mt-1.5 font-mono-ui text-[10px] font-bold text-[var(--gold)]">{nam.consonants}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Golden Equation Tab */}
      {tab === "equation" && (
        <div className="space-y-5">
          <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5 text-center">
            <h2 className="font-khmer text-xl font-bold text-[var(--gold)]">{t("សមីការមាស សុវណ្ណភូមិ", "The Golden Equation — Suvarnabhumi")}</h2>
            <p className="mt-1 text-xs text-[var(--ink-faint)]">{t("The etymology and heritage encoded in the name Kampuchea", "ន័យវិទ្យាសាស្ត្រ និងបេតិកភណ្ឌនៃព្រលឹងជាតិខ្មែរ")}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {EQUATION_NODES.map((node) => (
              <button key={node.id} type="button" onClick={() => setEqNode(node.id)}
                className={`rounded-xl border p-5 text-center transition ${eqNode === node.id ? "border-[var(--gold)] bg-[var(--gold)]/10 shadow-sm" : "border-[var(--ground-line)] bg-[var(--ground-raised)] hover:border-[var(--gold)]/30"}`}>
                <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--gold)]/20 text-[var(--gold)]">
                  <span className="font-khmer text-lg font-bold">{node.title.split(" ")[0]}</span>
                </div>
                <h3 className="font-khmer text-sm font-bold text-[var(--ink)]">{node.title}</h3>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--gold)]">{node.subtitle}</p>
                <p className="mt-2 text-xs leading-relaxed text-[var(--ink-dim)]">{node.desc}</p>
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground)] p-5">
            {EQUATION_NODES.find((n) => n.id === eqNode)?.longDesc && (
              <div className="text-sm leading-relaxed text-[var(--ink-dim)]">
                <h4 className="mb-2 font-khmer font-bold text-[var(--gold)]">{EQUATION_NODES.find((n) => n.id === eqNode)?.title}</h4>
                {EQUATION_NODES.find((n) => n.id === eqNode)?.longDesc}
              </div>
            )}
            {eqNode === "kampuchea" && (
              <div className="mt-4 rounded-lg border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-4 text-center text-sm leading-relaxed text-[var(--gold)]">
                <strong className="font-khmer">{t("កម្ពុជា = កម្ពុ + ជា", "Kampuchea = Kampu + Ja/Jaa")}</strong>
                <p className="mt-2 text-xs text-[var(--ink-dim)]">
                  {t("Gold + Birth = The Golden Land — Suvarnabhumi, the soul of the Khmer nation.", "មាស + កំណើត = ដែនដីមាស — សុវណ្ណភូមិ ព្រលឹងជាតិខ្មែរ។")}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </ToolShell>
  );
}
