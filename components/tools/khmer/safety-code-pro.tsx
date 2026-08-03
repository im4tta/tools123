"use client";

import { useState } from "react";
import {
  Shield,
  HardHat,
  Info,
  Activity,
  BarChart3,
  TriangleAlert,
  LifeBuoy,
  Eye,
  Scale,
  FileText,
  BookOpen,
  ExternalLink,
  Building2,
  Link as LinkIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell } from "@/components/ui/Shell";

const translations = {
  en: {
    hardhats: "Hard Hats",
    vests: "Safety Vests",
    analytics: "Data & Analytics",
    general: "General PPE",
    regulations: "Laws & Prakas",
    sources: "Official Sources",
    // Hard Hats
    hhTitle: "Hard Hat Color Coding (Cambodia Standard)",
    hhDesc: "Color-coded hard hats help quickly identify roles and responsibilities on Cambodian construction sites, improving communication and emergency response.",
    hhWhite: "White",
    hhWhiteDesc: "Engineers, Managers, Supervisors, Foremen.",
    hhYellow: "Yellow",
    hhYellowDesc: "General Laborers, Earthmoving Operators.",
    hhBlue: "Blue",
    hhBlueDesc: "Electricians, Carpenters, Technical Operators.",
    hhGreen: "Green",
    hhGreenDesc: "Safety Officers (HSE), Environmental Staff.",
    hhRed: "Red",
    hhRedDesc: "Firefighters, Emergency Responders.",
    hhOrange: "Orange",
    hhOrangeDesc: "Road Crews, Traffic Controllers, Visitors.",
    // Vests
    vestTitle: "Safety Vest Requirements",
    vestDesc: "High-visibility safety apparel (HVSA) is mandatory. Standards typically follow ANSI/ISEA 107 or EN ISO 20471 adapted for local conditions.",
    vestClass2: "Class 2 (Moderate Risk)",
    vestClass2Desc: "Standard for most construction sites, traffic control (daytime), and areas with moderate vehicle speed.",
    vestClass3: "Class 3 (High Risk)",
    vestClass3Desc: "For high-speed road work, night work, or complex environments where maximum visibility is critical.",
    vestColorTitle: "Vest Color Coding (Role Identification)",
    vestColorYellow: "Fluorescent Yellow/Green",
    vestColorYellowDesc: "Standard issue for most workers, laborers, and general site personnel.",
    vestColorOrange: "Fluorescent Orange",
    vestColorOrangeDesc: "Traffic controllers, road construction workers, and heavy machinery operators for high contrast.",
    vestColorRed: "Red",
    vestColorRedDesc: "Emergency responders, fire safety personnel, or specific warning roles.",
    vestColorBlue: "Blue",
    vestColorBlueDesc: "Medical personnel, site medics, or sometimes technical specialists.",
    vestColorGreen: "Dark/Forest Green",
    vestColorGreenDesc: "Safety personnel (HSE), first aiders, or environmental inspectors.",
    // General PPE
    genTitle: "Core PPE Requirements",
    genDesc: "Standard Personal Protective Equipment required on all major Cambodian construction sites.",
    genBoots: "Safety Boots",
    genBootsDesc: "Steel-toe caps and puncture-resistant soles.",
    genGlasses: "Safety Glasses",
    genGlassesDesc: "Protection against flying debris and dust.",
    genGloves: "Work Gloves",
    genGlovesDesc: "Appropriate material for the specific task (e.g., cut-resistant, leather).",
    // Analytics
    statTitle: "Compliance & Distribution Data",
    statDesc: "Estimated statistics based on major infrastructure projects in Phnom Penh and Sihanoukville.",
    distChartTitle: "Typical Hard Hat Distribution on Site",
    compChartTitle: "PPE Compliance Rates (2020-2026)",
    visChartTitle: "Vest Visibility Distance (Meters)",
    // Regulations
    regTitle: "Legal Framework & Regulations",
    regDesc: "Key Cambodian laws, sub-decrees, and Prakas (declarations) governing construction safety and occupational health.",
    lawConst: "Law on Construction (2019)",
    lawConstDesc: "Sets fundamental regulations for the construction sector, mandating strict safety management systems, quality control, and defining legal liability for site accidents.",
    lawLabor: "Labor Law (1997)",
    lawLaborDesc: "Chapter VIII explicitly outlines employer obligations to ensure a safe, healthy working environment and to take preventive measures against work-related accidents.",
    prakas43: "Prakas No. 043/02 (PPE)",
    prakas43Desc: "Requires employers to provide appropriate Personal Protective Equipment (hard hats, high-vis vests, safety boots) free of charge to all workers on site.",
    prakas52: "Prakas No. 052/00 (Safety & Health)",
    prakas52Desc: "Mandates the prevention of accidents, minimum hygiene standards, and specific safety conditions at workplaces, including heavy construction sites.",
    // Sources
    srcTitle: "Ministries & Standard Institutes",
    srcDesc: "Official resources for Cambodian labor laws, construction standards, and occupational health guidelines.",
    mlmupc: "Ministry of Land Management, Urban Planning and Construction (MLMUPC)",
    mlmupcDesc: "Governs overall construction standards, building codes, and site permits in Cambodia.",
    mlvt: "Ministry of Labor and Vocational Training (MLVT)",
    mlvtDesc: "Issues Prakas (declarations) on occupational safety, health requirements, and labor inspections.",
    isc: "Institute of Standards of Cambodia (ISC)",
    iscDesc: "The national standard body responsible for adopting and promoting industrial standardizations (including PPE).",
    nssf: "National Social Security Fund (NSSF)",
    nssfDesc: "Handles occupational risk schemes, workplace accident reporting, and worker safety promotion.",
    intStandards: "International References (Recognized in KH)",
    intStandardsDesc: "ANSI/ISEA (US), EN ISO (EU), and ILO Conventions heavily influence Cambodian local regulations.",
  },
  km: {
    hardhats: "មួកសុវត្ថិភាព",
    vests: "អាវចំណាំងផ្លាត",
    analytics: "ទិន្នន័យវិភាគ",
    general: "ឧបករណ៍ការពារ",
    regulations: "ច្បាប់ និងប្រកាស",
    sources: "ប្រភពផ្លូវការ",
    // Hard Hats
    hhTitle: "អត្ថន័យពណ៌មួកសុវត្ថិភាព (ស្តង់ដារកម្ពុជា)",
    hhDesc: "មួកសុវត្ថិភាពមានពណ៌ជួយកំណត់អត្តសញ្ញាណតួនាទី និងទំនួលខុសត្រូវយ៉ាងឆាប់រហ័សនៅលើការដ្ឋានសាងសង់កម្ពុជា ធ្វើអោយប្រសើរឡើងនូវទំនាក់ទំនង និងការឆ្លើយតបពេលមានអាសន្ន។",
    hhWhite: "ស",
    hhWhiteDesc: "វិស្វករ អ្នកគ្រប់គ្រង អ្នកត្រួតពិនិត្យ មេការ។",
    hhYellow: "លឿង",
    hhYellowDesc: "កម្មករទូទៅ អ្នកបើកបរគ្រឿងចក្រកាយដី។",
    hhBlue: "ខៀវ",
    hhBlueDesc: "ជាងអគ្គិសនី ជាងឈើ អ្នកបច្ចេកទេស។",
    hhGreen: "បៃតង",
    hhGreenDesc: "មន្ត្រីសុវត្ថិភាព (HSE) បុគ្គលិកបរិស្ថាន។",
    hhRed: "ក្រហម",
    hhRedDesc: "អ្នកពន្លត់អគ្គិភ័យ ក្រុមសង្គ្រោះបន្ទាន់។",
    hhOrange: "ទឹកក្រូច",
    hhOrangeDesc: "អ្នកធ្វើផ្លូវ អ្នកសម្រួលចរាចរណ៍ ភ្ញៀវ។",
    // Vests
    vestTitle: "តម្រូវការអាវចំណាំងផ្លាត",
    vestDesc: "សម្លៀកបំពាក់សុវត្ថិភាពដែលអាចមើលឃើញច្បាស់ (HVSA) គឺជាកាតព្វកិច្ច។ ស្តង់ដារជាទូទៅអនុវត្តតាម ANSI/ISEA 107 ឬ EN ISO 20471 ដែលប្រែប្រួលសម្រាប់លក្ខខណ្ឌក្នុងស្រុក។",
    vestClass2: "ថ្នាក់ទី ២ (ហានិភ័យមធ្យម)",
    vestClass2Desc: "ស្តង់ដារសម្រាប់ការដ្ឋានសាងសង់ភាគច្រើន ការគ្រប់គ្រងចរាចរណ៍ (ពេលថ្ងៃ) និងតំបន់ដែលមានល្បឿនយានយន្តមធ្យម។",
    vestClass3: "ថ្នាក់ទី ៣ (ហានិភ័យខ្ពស់)",
    vestClass3Desc: "សម្រាប់ការងារលើផ្លូវល្បឿនលឿន ពេលយប់ ឬតំបន់ដែលត្រូវការការមើលឃើញច្បាស់បំផុត។",
    vestColorTitle: "អត្ថន័យពណ៌អាវចំណាំងផ្លាត (ចំណាត់ថ្នាក់តួនាទី)",
    vestColorYellow: "លឿងបៃតង",
    vestColorYellowDesc: "ស្តង់ដារសម្រាប់កម្មករទូទៅ បុគ្គលិកការដ្ឋាន និងអ្នកធ្វើការធម្មតា។",
    vestColorOrange: "ទឹកក្រូច",
    vestColorOrangeDesc: "អ្នកសម្រួលចរាចរណ៍ កម្មករធ្វើផ្លូវ និងអ្នកបើកបរគ្រឿងចក្រធុនធ្ងន់។",
    vestColorRed: "ក្រហម",
    vestColorRedDesc: "ក្រុមសង្គ្រោះបន្ទាន់ ភ្នាក់ងារពន្លត់អគ្គិភ័យ។",
    vestColorBlue: "ខៀវ",
    vestColorBlueDesc: "បុគ្គលិកពេទ្យ អ្នកសង្គ្រោះបឋម ឬអ្នកបច្ចេកទេស។",
    vestColorGreen: "បៃតងចាស់",
    vestColorGreenDesc: "មន្ត្រីសុវត្ថិភាព (HSE) ឬអ្នកត្រួតពិនិត្យបរិស្ថាន។",
    // General PPE
    genTitle: "តម្រូវការឧបករណ៍ការពារផ្ទាល់ខ្លួន (PPE) ស្នូល",
    genDesc: "ឧបករណ៍ការពារផ្ទាល់ខ្លួនស្តង់ដារដែលត្រូវការនៅគ្រប់ការដ្ឋានសំណង់ធំៗនៅកម្ពុជា។",
    genBoots: "ស្បែកជើងសុវត្ថិភាព",
    genBootsDesc: "ក្បាលដែក និងបាតការពារការមុតធ្លុះ។",
    genGlasses: "វ៉ែនតាសុវត្ថិភាព",
    genGlassesDesc: "ការពារពីកម្ទេចកំទី និងធូលីហោះ។",
    genGloves: "ស្រោមដៃការងារ",
    genGlovesDesc: "សម្ភារៈសមស្របសម្រាប់កិច្ចការជាក់លាក់ (ឧទាហរណ៍៖ ការពារការមុត, ស្បែក)។",
    // Analytics
    statTitle: "ទិន្នន័យនៃការអនុវត្ត និងការបែងចែក",
    statDesc: "ស្ថិតិប៉ាន់ស្មានផ្អែកលើគម្រោងហេដ្ឋារចនាសម្ព័ន្ធធំៗនៅភ្នំពេញ និងព្រះសីហនុ។",
    distChartTitle: "ការបែងចែកមួកសុវត្ថិភាពធម្មតានៅលើការដ្ឋាន",
    compChartTitle: "អត្រាអនុវត្ត PPE (២០២០-២០២៦)",
    visChartTitle: "ចម្ងាយមើលឃើញអាវចំណាំងផ្លាត (ម៉ែត្រ)",
    // Regulations
    regTitle: "ក្របខ័ណ្ឌច្បាប់ និងបទប្បញ្ញត្តិ",
    regDesc: "ច្បាប់ អនុក្រឹត្យ និងប្រកាសសំខាន់ៗរបស់កម្ពុជាដែលគ្រប់គ្រងសុវត្ថិភាពសំណង់ និងសុខភាពការងារ។",
    lawConst: "ច្បាប់ស្តីពីសំណង់ (ឆ្នាំ ២០១៩)",
    lawConstDesc: "កំណត់បទប្បញ្ញត្តិជាមូលដ្ឋានសម្រាប់វិស័យសំណង់ តម្រូវឱ្យមានប្រព័ន្ធគ្រប់គ្រងសុវត្ថិភាពយ៉ាងតឹងរ៉ឹង ការត្រួតពិនិត្យគុណភាព និងការទទួលខុសត្រូវចំពោះគ្រោះថ្នាក់។",
    lawLabor: "ច្បាប់ស្តីពីការងារ (ឆ្នាំ ១៩៩៧)",
    lawLaborDesc: "ជំពូកទី ៨ ចែងយ៉ាងច្បាស់ពីកាតព្វកិច្ចរបស់និយោជកក្នុងការធានាបរិយាកាសការងារប្រកបដោយសុវត្ថិភាព សុខភាពល្អ និងការពារគ្រោះថ្នាក់ការងារ។",
    prakas43: "ប្រកាសលេខ ០៤៣/០២ (PPE)",
    prakas43Desc: "តម្រូវឱ្យនិយោជកផ្តល់ឧបករណ៍ការពារផ្ទាល់ខ្លួន (មួកសុវត្ថិភាព អាវចំណាំងផ្លាត ស្បែកជើង) ដោយឥតគិតថ្លៃដល់កម្មករទាំងអស់នៅការដ្ឋាន។",
    prakas52: "ប្រកាសលេខ ០៥២/០០ (សុវត្ថិភាព និងសុខភាព)",
    prakas52Desc: "ចែងពីការទប់ស្កាត់គ្រោះថ្នាក់ ស្តង់ដារអនាម័យអប្បបរមា និងលក្ខខណ្ឌសុវត្ថិភាពជាក់លាក់នៅកន្លែងធ្វើការ រួមទាំងការដ្ឋានសំណង់។",
    // Sources
    srcTitle: "ក្រសួង និងវិទ្យាស្ថានស្តង់ដារ",
    srcDesc: "ប្រភពផ្លូវការសម្រាប់ច្បាប់ការងារកម្ពុជា ស្តង់ដារសំណង់ និងគោលការណ៍ណែនាំស្តីពីសុខភាពការងារ។",
    mlmupc: "ក្រសួងរៀបចំដែនដី នគរូបនីយកម្ម និងសំណង់",
    mlmupcDesc: "គ្រប់គ្រងស្តង់ដារសំណង់ទូទៅ ក្រមអគារ និងលិខិតអនុញ្ញាតការដ្ឋាននៅកម្ពុជា។",
    mlvt: "ក្រសួងការងារ និងបណ្តុះបណ្តាលវិជ្ជាជីវៈ",
    mlvtDesc: "ចេញប្រកាសស្តីពីសុវត្ថិភាពការងារ តម្រូវការសុខភាព និងការត្រួតពិនិត្យការងារ។",
    isc: "វិទ្យាស្ថានស្តង់ដារកម្ពុជា (ISC)",
    iscDesc: "ស្ថាប័នស្តង់ដារជាតិទទួលបន្ទុកអនុម័ត និងលើកកម្ពស់ស្តង់ដារឧស្សាហកម្ម (រួមទាំង PPE)។",
    nssf: "បេឡាជាតិសន្តិសុខសង្គម (ប.ស.ស)",
    nssfDesc: "គ្រប់គ្រងគ្រោះថ្នាក់ការងារ ការរាយការណ៍ពីគ្រោះថ្នាក់នៅកន្លែងធ្វើការ និងការលើកកម្ពស់សុវត្ថិភាពកម្មករ។",
    intStandards: "ឯកសារយោងអន្តរជាតិ (ទទួលស្គាល់នៅកម្ពុជា)",
    intStandardsDesc: "ANSI/ISEA (សហរដ្ឋអាមេរិក), EN ISO (អឺរ៉ុប) និងអនុសញ្ញា ILO មានឥទ្ធិពលយ៉ាងខ្លាំងលើបទប្បញ្ញត្តិក្នុងស្រុករបស់កម្ពុជា។",
  },
};

type TabType = "hardhats" | "vests" | "general" | "regulations" | "analytics" | "sources";

function useI18n(text: (en: string, km: string) => string) {
  const out: Record<string, string> = {};
  for (const key of Object.keys(translations.en)) {
    out[key] = text(translations.en[key as keyof typeof translations.en], translations.km[key as keyof typeof translations.km]);
  }
  return out as typeof translations.en;
}

const hardHats = [
  { color: "bg-white", border: "border-slate-200", key: "White" },
  { color: "bg-yellow-400", border: "border-yellow-500", key: "Yellow" },
  { color: "bg-blue-500", border: "border-blue-600", key: "Blue" },
  { color: "bg-green-500", border: "border-green-600", key: "Green" },
  { color: "bg-red-500", border: "border-red-600", key: "Red" },
  { color: "bg-orange-500", border: "border-orange-600", key: "Orange" },
];

const vestColorsList = [
  { key: "Yellow", bg: "bg-yellow-300", border: "border-yellow-400" },
  { key: "Orange", bg: "bg-orange-500", border: "border-orange-600" },
  { key: "Red", bg: "bg-red-600", border: "border-red-700" },
  { key: "Blue", bg: "bg-blue-600", border: "border-blue-700" },
  { key: "Green", bg: "bg-emerald-700", border: "border-emerald-800" },
];

const roleDistributionData = [
  { name: "Laborers (Yellow)", value: 65, color: "#facc15" },
  { name: "Engineers (White)", value: 15, color: "#f8fafc" },
  { name: "Technical (Blue)", value: 10, color: "#3b82f6" },
  { name: "Safety (Green)", value: 5, color: "#22c55e" },
  { name: "Others (Red/Orange)", value: 5, color: "#f97316" },
];

const complianceTrendData = [
  { year: "2020", hardhat: 78, vest: 65, boots: 60 },
  { year: "2021", hardhat: 82, vest: 70, boots: 65 },
  { year: "2022", hardhat: 85, vest: 78, boots: 72 },
  { year: "2023", hardhat: 89, vest: 84, boots: 78 },
  { year: "2024", hardhat: 93, vest: 90, boots: 85 },
  { year: "2025", hardhat: 95, vest: 94, boots: 90 },
  { year: "2026", hardhat: 97, vest: 96, boots: 94 },
];

const visibilityData = [
  { condition: "Daylight", class2: 250, class3: 390 },
  { condition: "Dusk/Dawn", class2: 150, class3: 300 },
  { condition: "Night (Lit)", class2: 120, class3: 250 },
  { condition: "Night (Dark)", class2: 80, class3: 200 },
];

export default function SafetyCodeProTool() {
  const { text } = useLanguage();
  const t = useI18n(text);
  const [activeTab, setActiveTab] = useState<TabType>("hardhats");

  const renderHardHats = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6 shadow-sm">
        <div className="mb-6 flex items-start gap-4">
          <div className="rounded-xl bg-[var(--ground-raised-hi)] p-3 text-[var(--slate-accent)]">
            <HardHat size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--ink)]">{t.hhTitle}</h2>
            <p className="mt-2 text-[var(--ink-dim)]">{t.hhDesc}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {hardHats.map((hat) => (
            <div
              key={hat.key}
              className="flex items-center gap-4 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised-hi)] p-4 transition-colors hover:ring-1 hover:ring-[var(--gold-dim)]"
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 ${hat.color} ${hat.border} shadow-inner`}>
                <div className="h-8 w-8 rounded-full border-2 border-white/20"></div>
              </div>
              <div>
                <h3 className="font-bold text-[var(--ink)]">{t[`hh${hat.key}` as keyof typeof t]}</h3>
                <p className="mt-1 text-sm leading-snug text-[var(--ink-dim)]">{t[`hh${hat.key}Desc` as keyof typeof t]}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderVests = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6 shadow-sm">
        <div className="mb-6 flex items-start gap-4">
          <div className="rounded-xl bg-[var(--ground-raised-hi)] p-3 text-[var(--gold)]">
            <TriangleAlert size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--ink)]">{t.vestTitle}</h2>
            <p className="mt-2 text-[var(--ink-dim)]">{t.vestDesc}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="relative overflow-hidden rounded-xl border-2 border-[var(--gold)] bg-[var(--ground-raised-hi)] p-5">
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[var(--gold)]/20"></div>
            <h3 className="mb-2 text-lg font-bold text-[var(--ink)]">{t.vestClass2}</h3>
            <p className="text-[var(--ink-dim)]">{t.vestClass2Desc}</p>
            <div className="mt-4 flex gap-2">
              <div className="h-2 w-1/3 rounded-full bg-[var(--ground-line)]"></div>
              <div className="h-2 w-1/3 rounded-full bg-[var(--ground-line)]"></div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-xl border-2 border-[var(--danger)] bg-[var(--ground-raised-hi)] p-5">
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[var(--danger)]/20"></div>
            <h3 className="mb-2 text-lg font-bold text-[var(--ink)]">{t.vestClass3}</h3>
            <p className="text-[var(--ink-dim)]">{t.vestClass3Desc}</p>
            <div className="mt-4 flex flex-col gap-2">
              <div className="flex gap-2">
                <div className="h-2 w-full rounded-full bg-[var(--ground-line)]"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-2 w-1/2 rounded-full bg-[var(--ground-line)]"></div>
                <div className="h-2 w-1/2 rounded-full bg-[var(--ground-line)]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6 shadow-sm">
        <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-[var(--ink)]">
          <LifeBuoy className="text-[var(--gold)]" size={24} />
          {t.vestColorTitle}
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vestColorsList.map((vest) => (
            <div
              key={vest.key}
              className="flex items-start gap-4 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised-hi)] p-4 transition-colors hover:ring-1 hover:ring-[var(--gold-dim)]"
            >
              <div className={`relative mt-1 flex h-16 w-14 shrink-0 flex-col justify-between overflow-hidden rounded-md border-2 p-1 shadow-sm ${vest.bg} ${vest.border}`}>
                <div className="mb-1 h-2 w-full rounded-sm bg-gray-200/90" />
                <div className="mb-1 h-2 w-full rounded-sm bg-gray-200/90" />
                <div className="flex h-full justify-between">
                  <div className="h-full w-2 rounded-sm bg-gray-200/90" />
                  <div className="h-full w-2 rounded-sm bg-gray-200/90" />
                </div>
              </div>
              <div>
                <h4 className="font-bold text-[var(--ink)]">{t[`vestColor${vest.key}` as keyof typeof t]}</h4>
                <p className="mt-1 text-sm leading-snug text-[var(--ink-dim)]">
                  {t[`vestColor${vest.key}Desc` as keyof typeof t]}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRegulations = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6 shadow-sm">
        <div className="mb-6 flex items-start gap-4">
          <div className="rounded-xl bg-[var(--ground-raised-hi)] p-3 text-[var(--danger)]">
            <BookOpen size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--ink)]">{t.regTitle}</h2>
            <p className="mt-2 text-[var(--ink-dim)]">{t.regDesc}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised-hi)] p-5">
            <div className="mb-3 flex items-center gap-3 text-[var(--danger)]">
              <Scale size={24} />
              <h3 className="text-lg font-bold">{t.lawConst}</h3>
            </div>
            <p className="text-sm leading-relaxed text-[var(--ink-dim)]">{t.lawConstDesc}</p>
          </div>

          <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised-hi)] p-5">
            <div className="mb-3 flex items-center gap-3 text-[var(--danger)]">
              <Scale size={24} />
              <h3 className="text-lg font-bold">{t.lawLabor}</h3>
            </div>
            <p className="text-sm leading-relaxed text-[var(--ink-dim)]">{t.lawLaborDesc}</p>
          </div>

          <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5 shadow-sm ring-1 ring-[var(--ground-line)]">
            <div className="mb-3 flex items-center gap-3 text-[var(--slate-accent)]">
              <FileText size={22} />
              <h3 className="font-bold">{t.prakas43}</h3>
            </div>
            <p className="text-sm leading-relaxed text-[var(--ink-dim)]">{t.prakas43Desc}</p>
          </div>

          <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5 shadow-sm ring-1 ring-[var(--ground-line)]">
            <div className="mb-3 flex items-center gap-3 text-[var(--slate-accent)]">
              <FileText size={22} />
              <h3 className="font-bold">{t.prakas52}</h3>
            </div>
            <p className="text-sm leading-relaxed text-[var(--ink-dim)]">{t.prakas52Desc}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGeneral = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6 shadow-sm">
        <div className="mb-6 flex items-start gap-4">
          <div className="rounded-xl bg-[var(--ground-raised-hi)] p-3 text-[var(--success)]">
            <Shield size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--ink)]">{t.genTitle}</h2>
            <p className="mt-2 text-[var(--ink-dim)]">{t.genDesc}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised-hi)] p-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--ground-line)]">
              <span className="text-2xl">🥾</span>
            </div>
            <h3 className="mb-2 font-bold text-[var(--ink)]">{t.genBoots}</h3>
            <p className="text-sm text-[var(--ink-dim)]">{t.genBootsDesc}</p>
          </div>
          <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised-hi)] p-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--ground-line)]">
              <span className="text-2xl">🥽</span>
            </div>
            <h3 className="mb-2 font-bold text-[var(--ink)]">{t.genGlasses}</h3>
            <p className="text-sm text-[var(--ink-dim)]">{t.genGlassesDesc}</p>
          </div>
          <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised-hi)] p-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--ground-line)]">
              <span className="text-2xl">🧤</span>
            </div>
            <h3 className="mb-2 font-bold text-[var(--ink)]">{t.genGloves}</h3>
            <p className="text-sm text-[var(--ink-dim)]">{t.genGlovesDesc}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6 shadow-sm">
        <div className="mb-6 flex items-start gap-4">
          <div className="rounded-xl bg-[var(--ground-raised-hi)] p-3 text-[var(--slate-accent)]">
            <Activity size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--ink)]">{t.statTitle}</h2>
            <p className="mt-2 text-[var(--ink-dim)]">{t.statDesc}</p>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised-hi)] p-4">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-[var(--ink)]">
              <BarChart3 className="text-[var(--slate-accent)]" size={18} />
              {t.distChartTitle}
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {roleDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="var(--ground-raised-hi)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => `${value}%`} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised-hi)] p-4">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-[var(--ink)]">
              <Eye className="text-[var(--gold)]" size={18} />
              {t.visChartTitle}
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={visibilityData} layout="vertical" margin={{ left: 40, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="condition" type="category" width={90} tick={{ fontSize: 11 }} />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="class2" name="Class 2" fill="#facc15" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="class3" name="Class 3" fill="#f97316" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="mb-4 text-center text-lg font-bold text-[var(--ink)]">{t.compChartTitle}</h3>
          <div className="h-80 w-full rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised-hi)] p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={complianceTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHardhat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorVest" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" />
                <YAxis domain={[50, 100]} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <RechartsTooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Area type="monotone" dataKey="hardhat" name="Hard Hats" stroke="#3b82f6" fillOpacity={1} fill="url(#colorHardhat)" />
                <Area type="monotone" dataKey="vest" name="Safety Vests" stroke="#f97316" fillOpacity={1} fill="url(#colorVest)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSources = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6 shadow-sm">
        <div className="mb-6 flex items-start gap-4">
          <div className="rounded-xl bg-[var(--ground-raised-hi)] p-3 text-[var(--teal)]">
            <LinkIcon size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--ink)]">{t.srcTitle}</h2>
            <p className="mt-2 text-[var(--ink-dim)]">{t.srcDesc}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <a
            href="http://www.mlmupc.gov.kh/"
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised-hi)] p-5 transition-all hover:border-[var(--teal)]"
          >
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-3 text-[var(--teal)]">
                <Building2 size={24} />
                <h3 className="font-bold leading-tight">{t.mlmupc}</h3>
              </div>
              <ExternalLink size={18} className="shrink-0 text-[var(--ink-faint)] group-hover:text-[var(--teal)]" />
            </div>
            <p className="text-sm text-[var(--ink-dim)]">{t.mlmupcDesc}</p>
          </a>

          <a
            href="https://www.mlvt.gov.kh/"
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised-hi)] p-5 transition-all hover:border-[var(--teal)]"
          >
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-3 text-[var(--teal)]">
                <Building2 size={24} />
                <h3 className="font-bold leading-tight">{t.mlvt}</h3>
              </div>
              <ExternalLink size={18} className="shrink-0 text-[var(--ink-faint)] group-hover:text-[var(--teal)]" />
            </div>
            <p className="text-sm text-[var(--ink-dim)]">{t.mlvtDesc}</p>
          </a>

          <a
            href="http://www.isc.gov.kh/"
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised-hi)] p-5 transition-all hover:border-[var(--teal)]"
          >
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-3 text-[var(--teal)]">
                <FileText size={24} />
                <h3 className="font-bold leading-tight">{t.isc}</h3>
              </div>
              <ExternalLink size={18} className="shrink-0 text-[var(--ink-faint)] group-hover:text-[var(--teal)]" />
            </div>
            <p className="text-sm text-[var(--ink-dim)]">{t.iscDesc}</p>
          </a>

          <a
            href="https://www.nssf.gov.kh/"
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised-hi)] p-5 transition-all hover:border-[var(--teal)]"
          >
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-3 text-[var(--teal)]">
                <Activity size={24} />
                <h3 className="font-bold leading-tight">{t.nssf}</h3>
              </div>
              <ExternalLink size={18} className="shrink-0 text-[var(--ink-faint)] group-hover:text-[var(--teal)]" />
            </div>
            <p className="text-sm text-[var(--ink-dim)]">{t.nssfDesc}</p>
          </a>
        </div>

        <div className="mt-6 rounded-xl border border-[var(--slate-accent)]/40 bg-[var(--slate-accent)]/10 p-5">
          <h3 className="mb-2 font-bold text-[var(--slate-accent)]">{t.intStandards}</h3>
          <p className="text-sm text-[var(--slate-accent)]">{t.intStandardsDesc}</p>
        </div>
      </div>
    </div>
  );

  return (
    <ToolShell
      title="SafetyCodePro Cambodia"
      khmerTitle="ស្តង់ដារសុវត្ថិភាពសំណង់"
      description="Construction Safety Standards Identifier"
      descriptionKm="ស្តង់ដារសុវត្ថិភាពសំណង់"
    >
      <div>
        <div className="mb-8 flex w-full snap-x gap-2 overflow-x-auto rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-1.5 no-scrollbar">
          {[
            { id: "hardhats" as TabType, label: t.hardhats, icon: HardHat },
            { id: "vests" as TabType, label: t.vests, icon: TriangleAlert },
            { id: "general" as TabType, label: t.general, icon: Shield },
            { id: "regulations" as TabType, label: t.regulations, icon: BookOpen },
            { id: "analytics" as TabType, label: t.analytics, icon: BarChart3 },
            { id: "sources" as TabType, label: t.sources, icon: LinkIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex snap-start items-center gap-2 whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-[var(--ground-raised-hi)] text-[var(--ink)] shadow-sm ring-1 ring-[var(--gold)]"
                  : "text-[var(--ink-dim)] hover:bg-[var(--ground-raised-hi)] hover:text-[var(--ink)]"
              }`}
            >
              <tab.icon size={18} className={activeTab === tab.id ? "text-[var(--gold)]" : "text-[var(--ink-faint)]"} />
              {tab.label}
            </button>
          ))}
        </div>

        <div>
          {activeTab === "hardhats" && renderHardHats()}
          {activeTab === "vests" && renderVests()}
          {activeTab === "general" && renderGeneral()}
          {activeTab === "regulations" && renderRegulations()}
          {activeTab === "analytics" && renderAnalytics()}
          {activeTab === "sources" && renderSources()}
        </div>

      <div className="mx-auto mt-12 max-w-2xl text-center text-sm text-[var(--ink-faint)]">
        <p className="flex items-center justify-center gap-1">
          <Info size={14} />
          Standards shown represent common practices and current regulatory frameworks in Cambodia.
        </p>
      </div>
    </div>
  </ToolShell>
  );
}
