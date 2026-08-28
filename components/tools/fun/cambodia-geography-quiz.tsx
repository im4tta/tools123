"use client";
import { useState } from "react";
import { ToolShell } from "@/components/ui/Shell";
import { Button } from "@/components/ui/Output";
import { useLanguage } from "@/components/LanguageProvider";

// Province dataset copied verbatim from components/tools/khmer/provinces-reference.tsx
// (25 first-level divisions: 24 provinces + Phnom Penh capital).
interface Province {
  en: string;
  km: string;
  capitalEn: string;
  capitalKm: string;
  region: "Capital" | "Central Plain" | "Tonlé Sap Basin" | "Northeast Plateau" | "Cardamom & Southwest" | "Coastal" | "Northwest Border" | "Mekong Corridor";
}

const PROVINCES: Province[] = [
  { en: "Phnom Penh", km: "ភ្នំពេញ", capitalEn: "Phnom Penh", capitalKm: "ភ្នំពេញ", region: "Capital" },
  { en: "Banteay Meanchey", km: "បន្ទាយមានជ័យ", capitalEn: "Serei Saophoan", capitalKm: "សិរីសោភ័ណ", region: "Northwest Border" },
  { en: "Battambang", km: "បាត់ដំបង", capitalEn: "Battambang", capitalKm: "បាត់ដំបង", region: "Northwest Border" },
  { en: "Kampong Cham", km: "កំពង់ចាម", capitalEn: "Kampong Cham", capitalKm: "កំពង់ចាម", region: "Mekong Corridor" },
  { en: "Kampong Chhnang", km: "កំពង់ឆ្នាំង", capitalEn: "Kampong Chhnang", capitalKm: "កំពង់ឆ្នាំង", region: "Tonlé Sap Basin" },
  { en: "Kampong Speu", km: "កំពង់ស្ពឺ", capitalEn: "Chbar Mon", capitalKm: "ច្បារមន", region: "Central Plain" },
  { en: "Kampong Thom", km: "កំពង់ធំ", capitalEn: "Kampong Thom", capitalKm: "កំពង់ធំ", region: "Tonlé Sap Basin" },
  { en: "Kampot", km: "កំពត", capitalEn: "Kampot", capitalKm: "កំពត", region: "Coastal" },
  { en: "Kandal", km: "កណ្ដាល", capitalEn: "Ta Khmau", capitalKm: "តាខ្មៅ", region: "Central Plain" },
  { en: "Kep", km: "កែប", capitalEn: "Kep", capitalKm: "កែប", region: "Coastal" },
  { en: "Koh Kong", km: "កោះកុង", capitalEn: "Khemarak Phoumin", capitalKm: "ខេមរភូមិន្ទ", region: "Cardamom & Southwest" },
  { en: "Kratié", km: "ក្រចេះ", capitalEn: "Kratié", capitalKm: "ក្រចេះ", region: "Mekong Corridor" },
  { en: "Mondulkiri", km: "មណ្ឌលគិរី", capitalEn: "Senmonorom", capitalKm: "សែនមនោរម្យ", region: "Northeast Plateau" },
  { en: "Oddar Meanchey", km: "ឧត្តរមានជ័យ", capitalEn: "Samraong", capitalKm: "សំរោង", region: "Northwest Border" },
  { en: "Pailin", km: "ប៉ៃលិន", capitalEn: "Pailin", capitalKm: "ប៉ៃលិន", region: "Northwest Border" },
  { en: "Preah Vihear", km: "ព្រះវិហារ", capitalEn: "Tbeng Meanchey", capitalKm: "ត្បែងមានជ័យ", region: "Tonlé Sap Basin" },
  { en: "Prey Veng", km: "ព្រៃវែង", capitalEn: "Prey Veng", capitalKm: "ព្រៃវែង", region: "Mekong Corridor" },
  { en: "Pursat", km: "ពោធិ៍សាត់", capitalEn: "Pursat", capitalKm: "ពោធិ៍សាត់", region: "Tonlé Sap Basin" },
  { en: "Ratanakiri", km: "រតនគិរី", capitalEn: "Banlung", capitalKm: "បានលុង", region: "Northeast Plateau" },
  { en: "Siem Reap", km: "សៀមរាប", capitalEn: "Siem Reap", capitalKm: "សៀមរាប", region: "Tonlé Sap Basin" },
  { en: "Preah Sihanouk", km: "ព្រះសីហនុ", capitalEn: "Sihanoukville", capitalKm: "ក្រុងព្រះសីហនុ", region: "Coastal" },
  { en: "Stung Treng", km: "ស្ទឹងត្រែង", capitalEn: "Stung Treng", capitalKm: "ស្ទឹងត្រែង", region: "Northeast Plateau" },
  { en: "Svay Rieng", km: "ស្វាយរៀង", capitalEn: "Svay Rieng", capitalKm: "ស្វាយរៀង", region: "Mekong Corridor" },
  { en: "Takéo", km: "តាកែវ", capitalEn: "Doun Kaev", capitalKm: "ដូនកែវ", region: "Central Plain" },
  { en: "Tboung Khmum", km: "ត្បូងឃ្មុំ", capitalEn: "Suong", capitalKm: "សួង", region: "Mekong Corridor" },
];

// Suggested Khmer labels for the reference dataset's region values.
const REGION_KM: Record<string, string> = {
  "Capital": "រាជធានី",
  "Central Plain": "វាលទំនាបកណ្តាល",
  "Tonlé Sap Basin": "អាងទន្លេសាប",
  "Northeast Plateau": "ខ្ពង់រាបឦសាន",
  "Cardamom & Southwest": "ក្រវាញ និងនិរតី",
  "Coastal": "តំបន់ឆ្នេរ",
  "Northwest Border": "ព្រំដែនពាយ័ព្យ",
  "Mekong Corridor": "ច្រករបៀងមេគង្គ",
};

// Well-documented Cambodian landmarks; explanations accompany each answer.
const LANDMARKS: { q: [string, string]; province: string; exp: [string, string] }[] = [
  {
    q: ["Angkor Wat, the famous temple complex, is located in which province?", "ប្រាសាទអង្គរវត្តស្ថិតនៅក្នុងខេត្តណា?"],
    province: "Siem Reap",
    exp: ["Angkor Wat, built in the 12th century, is in Siem Reap province.", "អង្គរវត្ត ដែលសាងសង់ក្នុងសតវត្សទី១២ ស្ថិតនៅខេត្តសៀមរាប។"],
  },
  {
    q: ["Preah Vihear Temple stands on the Dângrêk Mountains in which province?", "ប្រាសាទព្រះវិហារស្ថិតនៅលើជួរភ្នំដងរែកក្នុងខេត្តណា?"],
    province: "Preah Vihear",
    exp: ["Preah Vihear Temple sits on the Dângrêk escarpment in Preah Vihear province.", "ប្រាសាទព្រះវិហារស្ថិតនៅលើច្រាំងថ្មដងរែក ក្នុងខេត្តព្រះវិហារ។"],
  },
  {
    q: ["Cambodia's Tonlé Sap joins the Mekong River at which city?", "ទន្លេសាបរបស់កម្ពុជាភ្ជាប់ជាមួយទន្លេមេគង្គនៅទីក្រុងណា?"],
    province: "Phnom Penh",
    exp: ["The Tonlé Sap connects with the Mekong at Phnom Penh (Chaktomuk); its flow reverses in the wet season.", "ទន្លេសាបភ្ជាប់ជាមួយទន្លេមេគង្គនៅភ្នំពេញ (ចតុមុខ) ហើយលំហូរបញ្ច្រាសនៅរដូវវស្សា។"],
  },
  {
    q: ["Bokor Hill Station, a former French hill resort, is located in which province?", "ស្ថានីយភ្នំបូកគោ ដែលធ្លាប់ជារមណីយដ្ឋានបារាំង ស្ថិតនៅក្នុងខេត្តណា?"],
    province: "Kampot",
    exp: ["Bokor Hill Station sits on Bokor Mountain in Kampot province.", "ស្ថានីយភ្នំបូកគោស្ថិតនៅលើភ្នំបូកគោ ក្នុងខេត្តកំពត។"],
  },
  {
    q: ["The Silver Pagoda (Wat Preah Keo) is located in which city?", "វត្តព្រះកែវមរកត (វត្តប្រាក់) ស្ថិតនៅក្នុងទីក្រុងណា?"],
    province: "Phnom Penh",
    exp: ["The Silver Pagoda stands on the Royal Palace grounds in Phnom Penh.", "វត្តប្រាក់ស្ថិតក្នុងបរិវេណព្រះបរមរាជវាំង ក្នុងរាជធានីភ្នំពេញ។"],
  },
  {
    q: ["Which province is famous for its world-renowned pepper?", "តើខេត្តណាល្បីល្បាញខាងម្រេចដ៏ល្បីលើពិភពលោក?"],
    province: "Kampot",
    exp: ["Kampot pepper is a protected geographical-indication product of Kampot province.", "ម្រេចកំពតជាផលិតផលមានការការពារសន្ទស្សន៍ភូមិសាស្ត្ររបស់ខេត្តកំពត។"],
  },
  {
    q: ["Ream National Park is located in which coastal province?", "ឧទ្យានជាតិរាមស្ថិតនៅក្នុងខេត្តឆ្នេរណា?"],
    province: "Preah Sihanouk",
    exp: ["Ream National Park is in Preah Sihanouk province.", "ឧទ្យានជាតិរាមស្ថិតនៅខេត្តព្រះសីហនុ។"],
  },
  {
    q: ["Which northeastern province is known for its gem mines and volcanic terrain?", "តើខេត្តណានៅភាគឦសានល្បីខាងអណ្តូងត្បូង និងដីភ្នំភ្លើង?"],
    province: "Ratanakiri",
    exp: ["Ratanakiri is known for gem mining around Banlung and its volcanic landscape.", "រតនគិរីល្បីខាងការជីកយកត្បូងនៅតំបន់បានលុង និងទេសភាពភ្នំភ្លើង។"],
  },
  {
    q: ["Phnom Kulen, a sacred mountain with ancient river carvings, is in which province?", "ភ្នំគូលេន ដែលជាភ្នំពិសិដ្ឋមានចម្លាក់តាមបាតទន្លេបុរាណ ស្ថិតនៅក្នុងខេត្តណា?"],
    province: "Siem Reap",
    exp: ["Phnom Kulen is in Siem Reap province.", "ភ្នំគូលេនស្ថិតនៅខេត្តសៀមរាប។"],
  },
  {
    q: ["Cambodia's best-known beaches (Ochheuteal, Otres) are in which city?", "ឆ្នេរល្បីៗរបស់កម្ពុជា (អូរឈើទាល អូត្រេស) ស្ថិតនៅក្នុងក្រុងណា?"],
    province: "Preah Sihanouk",
    exp: ["Sihanoukville in Preah Sihanouk province is Cambodia's main beach resort.", "ក្រុងព្រះសីហនុក្នុងខេត្តព្រះសីហនុ ជារមណីយដ្ឋានឆ្នេរសមុទ្រសំខាន់របស់កម្ពុជា។"],
  },
];

interface QuizQuestion {
  q: [string, string];
  opts: [string, string][];
  a: number;
  exp: [string, string];
}

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const provinceKm = (en: string) => PROVINCES.find((p) => p.en === en)?.km ?? en;

// Builds one round: capital questions, region questions, and landmarks.
function buildQuestions(): QuizQuestion[] {
  const qs: QuizQuestion[] = [];
  const sample = <T,>(arr: T[], n: number): T[] => shuffle(arr).slice(0, n);

  for (const p of sample(PROVINCES, 8)) {
    const opts = shuffle([
      { en: p.en, km: p.km },
      ...sample(PROVINCES.filter((x) => x.en !== p.en), 3).map((d) => ({ en: d.en, km: d.km })),
    ]);
    qs.push({
      q: [`Which province has the capital ${p.capitalEn}?`, `តើខេត្តណាមានក្រុង ${p.capitalKm}?`],
      opts: opts.map((o) => [o.en, o.km] as [string, string]),
      a: opts.findIndex((o) => o.en === p.en),
      exp: [`${p.en}'s capital is ${p.capitalEn}.`, `ក្រុងរបស់ខេត្ត ${p.km} គឺ ${p.capitalKm}។`],
    });
  }

  const regions = Object.keys(REGION_KM);
  for (const p of sample(PROVINCES, 8)) {
    const opts = shuffle([p.region, ...shuffle(regions.filter((r) => r !== p.region)).slice(0, 3)]);
    qs.push({
      q: [`Which region does ${p.en} belong to?`, `តើខេត្ត ${p.km} ស្ថិតក្នុងតំបន់ណា?`],
      opts: opts.map((r) => [r, REGION_KM[r]] as [string, string]),
      a: opts.indexOf(p.region),
      exp: [`${p.en} is in the ${p.region} region.`, `ខេត្ត ${p.km} ស្ថិតក្នុងតំបន់ ${REGION_KM[p.region]}។`],
    });
  }

  for (const lm of LANDMARKS) {
    const opts = shuffle([
      { en: lm.province, km: provinceKm(lm.province) },
      ...sample(PROVINCES.filter((x) => x.en !== lm.province), 3).map((d) => ({ en: d.en, km: d.km })),
    ]);
    qs.push({
      q: lm.q,
      opts: opts.map((o) => [o.en, o.km] as [string, string]),
      a: opts.findIndex((o) => o.en === lm.province),
      exp: lm.exp,
    });
  }

  return shuffle(qs);
}

export default function CambodiaGeographyQuiz() {
  const { text: t } = useLanguage();
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);

  const start = () => {
    setQuestions(buildQuestions());
    setCurrent(0);
    setScore(0);
    setPicked(null);
    setStarted(true);
    setDone(false);
  };

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === questions[current].a) setScore((s) => s + 1);
  };

  const next = () => {
    if (current + 1 >= questions.length) setDone(true);
    else {
      setCurrent((c) => c + 1);
      setPicked(null);
    }
  };

  const q = questions[current];
  const pct = questions.length > 0 ? Math.round(((current + (picked !== null ? 1 : 0)) / questions.length) * 100) : 0;

  return (
    <ToolShell
      title="Cambodia Geography Quiz"
      khmerTitle="ល្បែងភូមិសាស្ត្រកម្ពុជា"
      description="Test your knowledge of Cambodia's provinces, capitals, regions, and famous landmarks."
      descriptionKm="សាកល្បងចំណេះដឹងរបស់អ្នកអំពីខេត្ត រាជធានី តំបន់ និងទីតាំងល្បីៗរបស់កម្ពុជា។"
    >
      <p className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
        {t("Questions are built from the Cambodia provinces reference dataset used across this site — capitals, regions, and well-documented landmarks.", "សំណួរបង្កើតពីទិន្នន័យបញ្ជីខេត្តកម្ពុជាដែលប្រើលើគេហទំព័រនេះ — រាជធានី តំបន់ និងទីតាំងល្បីៗដែលបានចុះឯកសារ។")}
      </p>

      {!started ? (
        <div className="mx-auto max-w-md rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-8 text-center">
          <p className="text-sm leading-relaxed text-[var(--ink-dim)]">
            {t("A fresh round of questions each time — capitals, regions, and landmarks. Explanations appear after every answer.", "សំណួរថ្មីរាល់លើក — រាជធានី តំបន់ និងទីតាំងល្បីៗ។ ការពន្យល់បង្ហាញក្រោយចម្លើយនីមួយៗ។")}
          </p>
          <Button onClick={start} className="mt-4">{t("Start quiz", "ចាប់ផ្តើមលេង")}</Button>
        </div>
      ) : done || !q ? (
        <div className="mx-auto max-w-md rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-8 text-center">
          <div className="text-4xl font-semibold text-[var(--gold)]">{score}/{questions.length}</div>
          <div className="mt-1 text-sm text-[var(--ink-dim)]">
            {t("questions correct", "ចម្លើយត្រឹមត្រូវ")} ({questions.length > 0 ? Math.round((score / questions.length) * 100) : 0}%)
          </div>
          <Button onClick={start} className="mt-4">{t("Play again", "លេងម្តងទៀត")}</Button>
        </div>
      ) : (
        <div className="mx-auto max-w-xl space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-mono-ui text-[var(--ink)]">{current + 1}/{questions.length}</span>
            <span className="font-medium text-[var(--gold)]">{t("Score", "ពិន្ទុ")}: {score}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--ground-line)]">
            <div className="h-full rounded-full bg-[var(--gold)] transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
            <p className="text-base font-medium leading-relaxed text-[var(--ink)]">{t(q.q[0], q.q[1])}</p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {q.opts.map((o, i) => {
              const isCorrect = picked !== null && i === q.a;
              const isPicked = picked === i;
              const cls = picked === null
                ? "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink)] hover:border-[var(--gold-dim)]"
                : isCorrect
                  ? "border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--ink)]"
                  : isPicked
                    ? "border-[var(--danger)]/60 bg-[var(--danger)]/15 text-[var(--danger)]"
                    : "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-faint)]";
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => pick(i)}
                  disabled={picked !== null}
                  className={`rounded-md border px-4 py-2.5 text-left text-sm transition ${cls}`}
                >
                  {t(o[0], o[1])}
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <div className="space-y-3">
              <p className="text-sm leading-relaxed text-[var(--ink-dim)]">
                {picked === q.a
                  ? t("Correct!", "ត្រឹមត្រូវ!")
                  : t(`Wrong — the answer is ${q.opts[q.a][0]}.`, `មិនត្រឹមត្រូវ — ចម្លើយគឺ ${q.opts[q.a][1]}។`)}
              </p>
              <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] p-3 text-sm leading-relaxed text-[var(--ink)]">
                {t(q.exp[0], q.exp[1])}
              </div>
              <div className="flex justify-end">
                <Button onClick={next}>
                  {current + 1 >= questions.length ? t("See results", "មើលលទ្ធផល") : t("Next", "បន្ទាប់")}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </ToolShell>
  );
}
