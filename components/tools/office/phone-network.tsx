"use client";
import { useMemo } from "react";
import {
  Smartphone, BarChart3, Search, Zap, MapPin, Cpu, ShieldCheck, Award, Phone, Clock, ExternalLink,
} from "lucide-react";
import { ToolShell, TextInput, Field, Select } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";
import { CopyButton } from "@/components/CopyButton";

interface Operator {
  id: string;
  name: string;
  km: string;
  color: string;
  prefixes: string[];
  hotline: string;
  website: string;
  description: string;
}

const OPERATORS: Operator[] = [
  { id: "smart", name: "Smart Axiata", km: "ស្មាត អាស៊ីអាតា", color: "#00a550", prefixes: ["010", "015", "016", "069", "070", "081", "086", "087", "093", "096", "098"], hotline: "888", website: "https://www.smart.com.kh", description: "ក្រុមហ៊ុនទូរស័ព្ទចល័តឈានមុខគេមួយនៅកម្ពុជា ដែលមានប្រព័ន្ធ 5G គ្របដណ្តប់ច្រើន និងសេវាកម្មឌីជីថលសម្បូរបែប។" },
  { id: "cellcard", name: "Cellcard (CamGSM)", km: "សែលខាត (CamGSM)", color: "#f59e0b", prefixes: ["011", "012", "014", "017", "061", "076", "077", "078", "085", "089", "092", "095", "099"], hotline: "812", website: "https://www.cellcard.com.kh", description: "ក្រុមហ៊ុនដែលមានប្រវត្តិយូរលង់ និងជាម្ចាស់ពានរង្វាន់បណ្តាញលឿន ជាមួយកញ្ចប់ Time To Rise ល្បីល្បាញ។" },
  { id: "metfone", name: "Metfone", km: "មេតហ្វូន (Viettel)", color: "#ef4444", prefixes: ["031", "060", "066", "067", "068", "071", "088", "090", "097"], hotline: "1777", website: "https://www.metfone.com.kh", description: "ក្រុមហ៊ុនដែលមានបណ្តាញទូលំទូលាយដល់ទីជនបទ និងផ្តល់គម្រោង Met5G ថ្មីជាមួយទិន្នន័យច្រើន។" },
  { id: "yes", name: "YES Seatel", km: "យេស (Seatel)", color: "#0ea5e9", prefixes: ["018"], hotline: "1800", website: "https://www.yes.com.kh", description: "ប្រតិបត្តិករសេវាកម្មទិន្នន័យ 4G VoLTE ដែលមានកញ្ចប់អ៊ីនធឺណិតល្បឿនលឿនតម្លៃសន្សំសំចៃ។" },
];

interface Plan {
  id: string;
  operatorId: string;
  name: string;
  km: string;
  price: number;
  validity: string;
  data: string;
  calls: string;
  sms: string;
  perk: string;
  type: "weekly" | "monthly";
  popular: boolean;
  code: string;
}

const PLANS: Plan[] = [
  { id: "p1", operatorId: "smart", name: "Smart 5G Data 30GB", km: "ស្មាត 5G Data $2", price: 2, validity: "7 ថ្ងៃ", data: "30 GB (4G/5G)", calls: "100 នាទីក្នុងប្រព័ន្ធ", sms: "100 SMS", perk: "ថែម Secure Browsing", type: "weekly", popular: true, code: "*1725*200#" },
  { id: "p2", operatorId: "smart", name: "Smart 5G Data 90GB", km: "ស្មាត 5G Data $6", price: 6, validity: "30 ថ្ងៃ", data: "90 GB (4G/5G)", calls: "300 នាទីក្នុងប្រព័ន្ធ", sms: "300 SMS", perk: "ថែម Secure Browsing", type: "monthly", popular: true, code: "*1725*600#" },
  { id: "p4", operatorId: "smart", name: "Smart ThomMorng! $5", km: "ស្មាត ធំហ្មង! $5", price: 5, validity: "30 ថ្ងៃ", data: "41 GB", calls: "27,000 នាទីក្នុងប្រព័ន្ធ", sms: "40,000 SMS", perk: "ងាយស្រួលគ្រប់គ្រងការចំណាយប្រចាំខែ", type: "monthly", popular: true, code: "*1333*5#" },
  { id: "p5", operatorId: "cellcard", name: "Cellcard Time To Rise $1", km: "សែលខាត Time To Rise $1", price: 1, validity: "7 ថ្ងៃ", data: "រហូតដល់ 40 GB", calls: "500 នាទីក្នុងប្រព័ន្ធ", sms: "500 SMS", perk: "ប្រើបានតែបណ្តាញ 4G", type: "weekly", popular: false, code: "*1788*1#" },
  { id: "p6", operatorId: "cellcard", name: "Cellcard Time To Rise $6", km: "សែលខាត Time To Rise $6", price: 6, validity: "30 ថ្ងៃ", data: "រហូតដល់ 40 GB (4G/5G)", calls: "4,000 នាទីក្នុងប្រព័ន្ធ", sms: "4,000 SMS", perk: "ប្រើបាន 5G និង Rollover", type: "monthly", popular: true, code: "*1788*2#" },
  { id: "p7", operatorId: "metfone", name: "Met5G 20GB $1.5", km: "មេតហ្វូន Met5G $1.5", price: 1.5, validity: "7 ថ្ងៃ", data: "20 GB (4G/5G)", calls: "100 នាទីក្នុងប្រព័ន្ធ", sms: "100 SMS", perk: "ល្បឿន 5G និង Rollover ទិន្នន័យ", type: "weekly", popular: true, code: "*1567*1#" },
  { id: "p8", operatorId: "metfone", name: "Met5G 90GB $6", km: "មេតហ្វូន Met5G $6", price: 6, validity: "30 ថ្ងៃ", data: "90 GB (4G/5G)", calls: "300 នាទីក្នុងប្រព័ន្ធ", sms: "300 SMS", perk: "មិនកាត់លុយដើមពេលអស់អ៊ីនធឺណិត", type: "monthly", popular: true, code: "*1567*6#" },
  { id: "p9", operatorId: "metfone", name: "Met5G 150GB $10", km: "មេតហ្វូន Met5G $10", price: 10, validity: "30 ថ្ងៃ", data: "150 GB (4G/5G)", calls: "500 នាទីក្នុងប្រព័ន្ធ", sms: "500 SMS", perk: "ទិន្នន័យធំ 5G", type: "monthly", popular: false, code: "*1567*10#" },
  { id: "p10", operatorId: "metfone", name: "KADO 1.5 Social", km: "មេតហ្វូន KADO $1.5", price: 1.5, validity: "7 ថ្ងៃ", data: "10 GB", calls: "500 នាទី", sms: "500 SMS", perk: "ផ្តោតលើការលេងបណ្តាញសង្គម", type: "weekly", popular: false, code: "*1535*2#" },
  { id: "p11", operatorId: "yes", name: "YES App Exclusive Data", km: "យេស ទិញ Data តាម App", price: 1, validity: "ប្រែប្រួល", data: "ប្រែប្រួល", calls: "មានតាមកញ្ចប់", sms: "មានតាមកញ្ចប់", perk: "មិនគិតថ្លៃ Data ពេលប្រើ YES App", type: "weekly", popular: true, code: "ទិញតាម YES App" },
  { id: "p12", operatorId: "yes", name: "YES eSIM Data Plan", km: "យេស កញ្ចប់ eSIM", price: 2, validity: "7 ថ្ងៃ", data: "15 GB (4G VoLTE)", calls: "ទូរស័ព្ទក្នុងប្រព័ន្ធឥតគិតថ្លៃ", sms: "SMS ឥតគិតថ្លៃ", perk: "ល្អសម្រាប់ទេសចរណ៍", type: "weekly", popular: false, code: "ទិញតាម YES App / ហាង" },
];

interface Store {
  id: string;
  operatorId: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  hours: string;
  lat: number;
  lng: number;
}

const STORES: Store[] = [
  { id: "s1", operatorId: "smart", name: "មជ្ឈមណ្ឌល ស្មាត ផ្លូវព្រះមុនីវង្ស", city: "ភ្នំពេញ", address: "អគារលេខ 464 ផ្សារដើមថ្កូវ ខណ្ឌចំការមន", phone: "010 808 888", hours: "8:00 AM - 5:30 PM", lat: 11.5432, lng: 104.9211 },
  { id: "s2", operatorId: "smart", name: "មជ្ឈមណ្ឌល ស្មាត សៀមរាប", city: "សៀមរាប", address: "ផ្លូវជាតិលេខ 6 ជិតរង្វង់មូលស្ពាននាគ", phone: "010 808 889", hours: "8:00 AM - 5:00 PM", lat: 13.3633, lng: 103.856 },
  { id: "s3", operatorId: "cellcard", name: "មជ្ឈមណ្ឌលសេវាកម្ម សែលខាត មហាវិថីព្រះសីហនុ", city: "ភ្នំពេញ", address: "អគារលេខ 33 មហាវិថីព្រះសីហនុ", phone: "012 812 812", hours: "8:00 AM - 6:00 PM", lat: 11.5564, lng: 104.9282 },
  { id: "s4", operatorId: "cellcard", name: "សាខា សែលខាត ខេត្តបាត់ដំបង", city: "បាត់ដំបង", address: "ផ្លូវលេខ 1 ជិតស្ពានថ្មចាស់", phone: "012 812 813", hours: "8:00 AM - 5:00 PM", lat: 13.0957, lng: 103.2022 },
  { id: "s5", operatorId: "metfone", name: "ការិយាល័យកណ្តាល មេតហ្វូន ម៉ៅសេទុង", city: "ភ្នំពេញ", address: "អគារលេខ 199 មហាវិថីម៉ៅសេទុង", phone: "097 909 7097", hours: "7:30 AM - 5:30 PM", lat: 11.5489, lng: 104.9125 },
  { id: "s6", operatorId: "yes", name: "មជ្ឈមណ្ឌល យេស ស៊ីថែល កម្ពុជាក្រោម", city: "ភ្នំពេញ", address: "មហាវិថី កម្ពុជាក្រោម ខណ្ឌ៧មករា", phone: "018 980 0800", hours: "8:00 AM - 5:30 PM", lat: 11.5681, lng: 104.91 },
];

const USSD_ROWS = [
  { action: "ពិនិត្យទឹកប្រាក់", smart: "*1201#", cellcard: "#124#", metfone: "*097#", yes: "*101#" },
  { action: "បញ្ចូលកាតប្រាក់", smart: "*1203*PIN#", cellcard: "*123*PIN#", metfone: "*100*PIN#", yes: "*100*PIN#" },
  { action: "ពិនិត្យលេខទូរស័ព្ទខ្លួនឯង", smart: "*888#", cellcard: "*2#", metfone: "*99#", yes: "*102#" },
  { action: "ពិនិត្យទិន្នន័យអ៊ីនធឺណិត", smart: "*1201#", cellcard: "#124#", metfone: "*097#", yes: "*101#" },
  { action: "សេវាអតិថិជន", smart: "888", cellcard: "812", metfone: "1777", yes: "1800" },
];

const COMMON_USSD = [
  { code: "*1200#", action: "ផ្តាច់សេវាបន្ថែម (VAS)", howTo: "ចុច *1200# រួចចុចបញ្ជូន", color: "#06b6d4" },
  { code: "*1201#", action: "ពិនិត្យសមតុល្យទឹកប្រាក់", howTo: "ចុច *1201# រួចចុចបញ្ជូន", color: "#2563eb" },
  { code: "*1202#", action: "ពិនិត្យអត្តសញ្ញាណអ្នកប្រើប្រាស់", howTo: "ចុច *1202# រួចចុចបញ្ជូន", color: "#1e40af" },
  { code: "*1203*PIN#", action: "បញ្ចូលទឹកប្រាក់", howTo: "ចុច *1203* វាយកូដកាត# រួចបញ្ជូន", color: "#f97316" },
  { code: "1204", action: "ទូរស័ព្ទទៅសេវាអតិថិជន", howTo: "ចុច 1204 រួចចុចបញ្ជូន", color: "#059669" },
  { code: "*1206#", action: "បើកសេវារ៉ូមីង (Roaming)", howTo: "បើក: *1206# / បិទ: *1206*0#", color: "#f43f5e" },
];

type Tab = "operators" | "plans" | "prefix" | "finder" | "stores" | "codes";

function cleanNumber(raw: string): string {
  let n = raw.replace(/\s|-|\(|\)/g, "");
  if (n.startsWith("+855")) n = "0" + n.slice(4);
  else if (n.startsWith("855") && n.length === 11) n = "0" + n.slice(3);
  else if (n.startsWith("00")) n = "0" + n.slice(2);
  return n;
}

export default function PhoneNetworkFinder() {
  const { text: t } = useLanguage();
  const [tab, setTab] = useToolState<Tab>("phone-network:tab", "operators");
  const [input, setInput] = useToolState("phone-network:input", "012 345 678");
  const [opFilter, setOpFilter] = useToolState("phone-network:op", "all");
  const [typeFilter, setTypeFilter] = useToolState("phone-network:type", "all");
  const [maxPrice, setMaxPrice] = useToolState("phone-network:maxPrice", "10");
  const [budget, setBudget] = useToolState("phone-network:budget", "3");
  const [usage, setUsage] = useToolState("phone-network:usage", "social");
  const [period, setPeriod] = useToolState("phone-network:period", "weekly");
  const [city, setCity] = useToolState("phone-network:city", "all");
  const [search, setSearch] = useToolState("phone-network:search", "");

  const operator = (id: string) => OPERATORS.find((o) => o.id === id);

  const filteredPlans = useMemo(() => {
    const max = Number(maxPrice) || 999;
    const q = search.toLowerCase();
    return PLANS.filter((p) => {
      if (opFilter !== "all" && p.operatorId !== opFilter) return false;
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      if (p.price > max) return false;
      if (q && !p.name.toLowerCase().includes(q) && !p.km.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [opFilter, typeFilter, maxPrice, search]);

  const recommended = useMemo(() => {
    const b = Number(budget) || 0;
    return PLANS.filter((p) => {
      if (p.price > b) return false;
      if (period === "weekly" && p.type !== "weekly") return false;
      if (period === "monthly" && p.type !== "monthly") return false;
      return true;
    }).sort((a, b2) => b2.price - a.price);
  }, [budget, period]);

  const clean = cleanNumber(input);
  const detected = /^0\d{8,9}$/.test(clean) ? OPERATORS.find((op) => op.prefixes.some((p) => clean.startsWith(p))) ?? null : null;
  const unknown = /^0\d{8,9}$/.test(clean) && !detected;

  const tabs: { id: Tab; label: string; km: string; icon: typeof Smartphone }[] = [
    { id: "operators", label: "Operators", km: "ក្រុមហ៊ុន", icon: Smartphone },
    { id: "plans", label: "Plans", km: "គម្រោង", icon: BarChart3 },
    { id: "prefix", label: "Prefix Checker", km: "ពិនិត្យក្បាលលេខ", icon: Search },
    { id: "finder", label: "Plan Finder", km: "ស្វែងរកគម្រោង", icon: Zap },
    { id: "stores", label: "Stores", km: "ទីតាំងសាខា", icon: MapPin },
    { id: "codes", label: "USSD Codes", km: "កូដសេវាខ្លី", icon: Cpu },
  ];

  return (
    <ToolShell
      title="Cambodia Phone Network Finder"
      khmerTitle="ស្វែងរកក្រុមហ៊ុនទូរស័ព្ទកម្ពុជា"
      description="Compare Cambodian mobile operators, plans, prefixes, stores, and USSD codes — Smart, Cellcard, Metfone, and YES Seatel."
      descriptionKm="ប្រៀបធៀបក្រុមហ៊ុន គម្រោង ក្បាលលេខ ទីតាំងសាខា និងកូដសេវាខ្លីៗរបស់ប្រតិបត្តិករទូរស័ព្ទនៅកម្ពុជា — ស្មាត សែលខាត មេតហ្វូន និងយេស។"
    >
      <div className="mb-4 flex items-center gap-1 overflow-x-auto rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] p-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition ${tab === item.id ? "bg-[var(--gold)] text-[#0a0c0d]" : "text-[var(--ink-dim)] hover:text-[var(--ink)]"}`}
          >
            <item.icon size={13} />
            {t(item.label, item.km)}
          </button>
        ))}
      </div>

      {tab === "operators" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {OPERATORS.map((op) => (
            <div key={op.id} className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: op.color }}>{op.name[0]}</span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-[var(--ink)]">{t(op.name, op.km)}</div>
                  <div className="text-xs text-[var(--ink-faint)]">{t("Hotline", "ទូរស័ព្ទទំនាក់ទំនង")}: {op.hotline}</div>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-[var(--ink-dim)]">{op.description}</p>
              <div className="mt-3">
                <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--ink-faint)]">{t("Prefixes", "ក្បាលលេខ")}</div>
                <div className="flex flex-wrap gap-1.5">
                  {op.prefixes.map((p) => (
                    <span key={p} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground)] px-2 py-0.5 font-mono-ui text-[11px] text-[var(--ink)]">{p}</span>
                  ))}
                </div>
              </div>
              <a href={op.website} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--gold)] hover:underline">
                <ExternalLink size={12} />{op.website.replace("https://", "")}
              </a>
            </div>
          ))}
        </div>
      )}

      {tab === "plans" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Operator">
              <Select value={opFilter} onChange={(e) => setOpFilter(e.target.value)}>
                <option value="all">All</option>
                {OPERATORS.map((op) => <option key={op.id} value={op.id}>{op.name}</option>)}
              </Select>
            </Field>
            <Field label="Type">
              <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </Select>
            </Field>
            <Field label="Max price ($)">
              <TextInput inputMode="decimal" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="font-mono-ui" />
            </Field>
            <Field label="Search">
              <TextInput value={search} onChange={(e) => setSearch(e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPlans.map((plan) => {
              const op = operator(plan.operatorId)!;
              return (
                <div key={plan.id} className="relative rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
                  {plan.popular && <span className="absolute right-3 top-3 rounded-full bg-[var(--danger)] px-2 py-0.5 text-[10px] font-bold text-white">{t("Popular", "ពេញនិយម")}</span>}
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: op.color }} />
                    <span className="text-xs font-semibold text-[var(--ink-dim)]">{t(op.name, op.km)}</span>
                  </div>
                  <div className="mt-2 text-sm font-semibold text-[var(--ink)]">{t(plan.name, plan.km)}</div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-xl font-bold text-[var(--ink)]">${plan.price.toFixed(2)}</span>
                    <span className="text-xs text-[var(--ink-faint)]">/ {plan.validity}</span>
                  </div>
                  <div className="mt-3 space-y-1 rounded-lg bg-[var(--ground)] p-3 text-xs">
                    <div className="flex justify-between"><span className="text-[var(--ink-faint)]">{t("Data", "ទិន្នន័យ")}:</span><span className="font-semibold text-[var(--ink)]">{plan.data}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--ink-faint)]">{t("Calls", "ការហៅចេញ")}:</span><span className="text-[var(--ink)]">{plan.calls}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--ink-faint)]">SMS:</span><span className="text-[var(--ink)]">{plan.sms}</span></div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="truncate rounded-md border border-[var(--ground-line)] bg-[var(--ground)] px-2 py-1.5 font-mono-ui text-xs font-bold text-[var(--ink)]">{plan.code}</span>
                    <CopyButton text={plan.code} compact />
                  </div>
                </div>
              );
            })}
            {filteredPlans.length === 0 && <p className="col-span-full py-8 text-center text-sm text-[var(--ink-faint)]">{t("No plans match your filters.", "គ្មានគម្រោងត្រូវគ្នានឹងតម្រងទេ។")}</p>}
          </div>
        </div>
      )}

      {tab === "prefix" && (
        <div className="space-y-4">
          <Field label={t("Phone number", "លេខទូរស័ព្ទ")} hint={t("0xx / +855 / 855", "0xx / +855 / 855")}>
            <TextInput value={input} onChange={(e) => setInput(e.target.value)} placeholder="012 345 678" className="font-mono-ui" />
          </Field>
          {detected ? (
            <div className="flex items-center gap-3 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-full text-base font-bold text-white" style={{ background: detected.color }}>{detected.name[0]}</span>
              <div>
                <div className="text-sm font-semibold text-[var(--ink)]">{t(detected.name, detected.km)}</div>
                <div className="font-mono-ui text-xs text-[var(--ink-dim)]">{clean}</div>
              </div>
            </div>
          ) : unknown ? (
            <p className="text-sm text-[var(--danger)]">{t("Unknown or invalid operator prefix.", "លេខកូដមិនត្រូវបានស្គាល់។")}</p>
          ) : input.trim() ? (
            <p className="text-sm text-[var(--danger)]">{t("Enter a valid Cambodian number.", "សូមបញ្ចូលលេខកម្ពុជាឱ្យបានត្រឹមត្រូវ។")}</p>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {OPERATORS.map((op) => (
              <div key={op.id} className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ background: op.color }} />
                  <span className="text-sm font-semibold text-[var(--ink)]">{t(op.name, op.km)}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {op.prefixes.map((p) => <span key={p} className="rounded-md border border-[var(--ground-line)] bg-[var(--ground)] px-2 py-0.5 font-mono-ui text-[11px] text-[var(--ink)]">{p}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "finder" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label={t("Budget (USD)", "ថវិកា (ដុល្លារ)")}>
              <TextInput inputMode="decimal" value={budget} onChange={(e) => setBudget(e.target.value)} className="font-mono-ui" />
            </Field>
            <Field label={t("Usage", "ការប្រើប្រាស់")}>
              <Select value={usage} onChange={(e) => setUsage(e.target.value)}>
                <option value="social">{t("Social media", "បណ្តាញសង្គម")}</option>
                <option value="video">{t("Video", "វីដេអូ")}</option>
                <option value="gaming">{t("Gaming", "ហ្គេម")}</option>
                <option value="work">{t("Work / Hotspot", "ការងារ / Hotspot")}</option>
              </Select>
            </Field>
            <Field label={t("Period", "រយៈពេល")}>
              <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
                <option value="weekly">{t("Weekly", "ប្រចាំសប្តាហ៍")}</option>
                <option value="monthly">{t("Monthly", "ប្រចាំខែ")}</option>
              </Select>
            </Field>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--ink-dim)]">
            <Award size={14} className="text-[var(--gold)]" />
            {t("Recommended plans", "គម្រោងដែលណែនាំ")} ({recommended.length})
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {recommended.map((plan) => {
              const op = operator(plan.operatorId)!;
              return (
                <div key={plan.id} className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--ink-dim)]">{t(op.name, op.km)}</span>
                    <span className="text-base font-bold text-[var(--ink)]">${plan.price.toFixed(2)}</span>
                  </div>
                  <div className="mt-1 text-sm font-semibold text-[var(--ink)]">{t(plan.name, plan.km)}</div>
                  <div className="mt-2 space-y-1 text-xs text-[var(--ink-dim)]">
                    <div>{t("Data", "ទិន្នន័យ")}: {plan.data}</div>
                    <div>{t("Calls", "ការហៅចេញ")}: {plan.calls}</div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="truncate rounded-md border border-[var(--ground-line)] bg-[var(--ground)] px-2 py-1.5 font-mono-ui text-xs font-bold text-[var(--ink)]">{plan.code}</span>
                    <CopyButton text={plan.code} compact />
                  </div>
                </div>
              );
            })}
            {recommended.length === 0 && <p className="col-span-full py-6 text-center text-sm text-[var(--ink-faint)]">{t("No plans fit this budget.", "គ្មានគម្រោងត្រូវគ្នានឹងថវិកានេះទេ។")}</p>}
          </div>
        </div>
      )}

      {tab === "stores" && (
        <div className="space-y-4">
          <Field label={t("City", "ក្រុង / ខេត្ត")}>
            <Select value={city} onChange={(e) => setCity(e.target.value)}>
              <option value="all">{t("All", "ទាំងអស់")}</option>
              <option value="ភ្នំពេញ">ភ្នំពេញ</option>
              <option value="សៀមរាប">សៀមរាប</option>
              <option value="បាត់ដំបង">បាត់ដំបង</option>
            </Select>
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STORES.filter((s) => city === "all" || s.city === city).map((store) => {
              const op = operator(store.operatorId)!;
              return (
                <div key={store.id} className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: op.color }}>{t(op.name, op.km)}</span>
                    <span className="text-xs text-[var(--ink-faint)]">{store.city}</span>
                  </div>
                  <div className="mt-2 text-sm font-semibold text-[var(--ink)]">{store.name}</div>
                  <div className="mt-2 space-y-1.5 text-xs text-[var(--ink-dim)]">
                    <div className="flex items-start gap-1.5"><MapPin size={13} className="mt-0.5 shrink-0 text-[var(--ink-faint)]" /><span>{store.address}</span></div>
                    <div className="flex items-center gap-1.5"><Clock size={13} className="shrink-0 text-[var(--ink-faint)]" /><span>{store.hours}</span></div>
                    <div className="flex items-center gap-1.5"><Phone size={13} className="shrink-0 text-[var(--ink-faint)]" /><span>{store.phone}</span></div>
                  </div>
                  <a href={`https://maps.google.com/?q=${store.lat},${store.lng}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--gold)] hover:underline">
                    <ExternalLink size={12} />{t("View on Google Maps", "មើលលើ Google Maps")}
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "codes" && (
        <div className="space-y-5">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck size={15} className="text-[var(--gold)]" />
              <span className="text-sm font-semibold text-[var(--ink)]">{t("Common codes (all operators)", "លេខកូដរួម (គ្រប់ប្រព័ន្ធ)")}</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {COMMON_USSD.map((item) => (
                <div key={item.code} className="rounded-xl p-4 text-white" style={{ background: item.color }}>
                  <div className="flex items-start justify-between">
                    <div className="font-mono-ui text-lg font-bold">{item.code}</div>
                    <CopyButton text={item.code} compact className="border-0 bg-transparent text-white" />
                  </div>
                  <div className="mt-1 text-sm font-semibold">{item.action}</div>
                  <div className="mt-1 text-[11px] opacity-90">{item.howTo}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-[var(--ground-line)]">
            <table className="w-full min-w-[560px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-dim)]">
                  <th className="px-3 py-2 text-left font-semibold">{t("Action", "សកម្មភាព")}</th>
                  <th className="px-3 py-2 text-left font-semibold" style={{ color: "#00a550" }}>Smart</th>
                  <th className="px-3 py-2 text-left font-semibold" style={{ color: "#f59e0b" }}>Cellcard</th>
                  <th className="px-3 py-2 text-left font-semibold" style={{ color: "#ef4444" }}>Metfone</th>
                  <th className="px-3 py-2 text-left font-semibold" style={{ color: "#0ea5e9" }}>YES</th>
                </tr>
              </thead>
              <tbody>
                {USSD_ROWS.map((row, i) => (
                  <tr key={i} className="border-b border-[var(--ground-line)] last:border-0">
                    <td className="px-3 py-2 font-medium text-[var(--ink)]">{row.action}</td>
                    <td className="px-3 py-2 font-mono-ui text-[var(--ink-dim)]">{row.smart}</td>
                    <td className="px-3 py-2 font-mono-ui text-[var(--ink-dim)]">{row.cellcard}</td>
                    <td className="px-3 py-2 font-mono-ui text-[var(--ink-dim)]">{row.metfone}</td>
                    <td className="px-3 py-2 font-mono-ui text-[var(--ink-dim)]">{row.yes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="mt-5 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-relaxed text-[var(--ink-dim)]">
        {t("Plans, prices, prefixes, and codes are user-supplied reference data and may change — always confirm with the operator before purchasing.", "គម្រោង តម្លៃ ក្បាលលេខ និងកូដសេវា ជាទិន្នន័យយោងដែលផ្តល់ដោយអ្នកប្រើ ហើយអាចផ្លាស់ប្តូរ — សូមផ្ទៀងផ្ទាត់ជាមួយប្រតិបត្តិករមុនពេលទិញ។")}
      </p>
    </ToolShell>
  );
}