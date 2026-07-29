"use client";
import { useMemo } from "react";
import { ToolShell, Field, Select, TextInput } from "@/components/ui/Shell";
import { CopyButton, type CopyField } from "@/components/CopyButton";
import { useClipboard } from "@/components/ClipboardProvider";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

interface Term {
  en: string;
  km: string;
  category: "Correspondence & Contract" | "Procurement & BOQ" | "Irrigation & Hydraulic" | "Road Construction" | "QA/QC & Testing" | "Environmental & Social Safeguards";
  note?: string;
}

const TERMS: Term[] = [
  { en: "Letter / Correspondence", km: "លិខិត / លិខិតឆ្លើយឆ្លង", category: "Correspondence & Contract", note: "Official written communication between project parties" },
  { en: "Notice to Proceed (NTP)", km: "លិខិតជូនដំណឹងឱ្យចាប់ផ្តើមការងារ", category: "Correspondence & Contract", note: "Official instruction to commence work" },
  { en: "Contract", km: "កិច្ចសន្យា", category: "Correspondence & Contract", note: "Legally binding agreement between parties" },
  { en: "Variation Order (VO)", km: "លិខិតបញ្ជាការផ្លាស់ប្ដូរ", category: "Correspondence & Contract", note: "Change order to the original scope or cost" },
  { en: "Extension of Time (EOT)", km: "ការពន្យារពេលវេលា", category: "Correspondence & Contract", note: "Granted extra time to complete works" },
  { en: "Letter of Acceptance (LoA)", km: "លិខិតទទួលស្គាល់ការដេញថ្លៃ / លិខិតប្រគល់ការងារ", category: "Correspondence & Contract", note: "Official acceptance of a winning bid" },
  { en: "Defect Liability Period (DLP)", km: "រយៈពេលធានាជួសជុលការខូចខាត", category: "Correspondence & Contract", note: "Period after completion during which contractor fixes defects" },
  { en: "Performance Security / Guarantee", km: "លិខិតធានាការអនុវត្តកិច្ចសន្យា", category: "Correspondence & Contract", note: "Financial guarantee provided by contractor for contract performance" },
  { en: "Advance Payment Bond / Guarantee", km: "លិខិតធានាប្រាក់មុន", category: "Correspondence & Contract", note: "Security provided by contractor against advance payment" },
  { en: "Interim Payment Certificate (IPC)", km: "វិញ្ញាបនបត្រទូទាត់ប្រាក់ដំណាក់កាល", category: "Correspondence & Contract", note: "Certificate for progress payments to contractor" },
  { en: "Final Payment Certificate (FPC)", km: "វិញ្ញាបនបត្រទូទាត់ប្រាក់ស្ថាពរ", category: "Correspondence & Contract", note: "Final certificate issued after completion of DLP" },
  { en: "Taking-Over Certificate (TOC)", km: "វិញ្ញាបនបត្រប្រគល់-ទទួលការងារ", category: "Correspondence & Contract", note: "Certificate issued when works are substantially completed" },
  { en: "Retention Money", km: "ថវិកាតម្កល់ទុកធានា", category: "Correspondence & Contract", note: "Percentage deducted from payments held until final acceptance" },
  { en: "Liquidated Damages (LD)", km: "សំណងជំងឺចិត្តនៃការយឺតយ៉ាវ", category: "Correspondence & Contract", note: "Penalty fees assessed for contractor delay" },
  { en: "Site Logbook / Site Diary", km: "សៀវភៅកំណត់ហេតុការដ្ឋាន", category: "Correspondence & Contract", note: "Daily record of activities, weather, labor, and machinery on site" },
  { en: "Engineer's Representative", km: "តំណាងវិស្វករ", category: "Correspondence & Contract", note: "Person delegated by the Supervising Engineer on site" },
  { en: "Supervising Engineer / PMC", km: "វិស្វករត្រួតពិនិត្យ / ទីប្រឹក្សាគ្រប់គ្រងគម្រោង", category: "Correspondence & Contract", note: "Consultant responsible for construction supervision" },
  { en: "Contractor's Site Agent / PM", km: "នាយកគម្រោង / អ្នកគ្រប់គ្រងការដ្ឋានរបស់អ្នកម៉ៅការ", category: "Correspondence & Contract", note: "Contractor's representative responsible for managing site operations" },
  { en: "As-Built Drawings", km: "ប្លង់សាងសង់ជាក់ស្តែង (As-built)", category: "Correspondence & Contract", note: "Drawings reflecting the actual completed infrastructure" },
  { en: "Claim", km: "ការទាមទារ (សំណង/ពេលវេលា)", category: "Correspondence & Contract", note: "Request for additional payment or time extension" },
  { en: "Joint Venture (JV)", km: "សហគ្រាសរួមគ្នា (JV)", category: "Correspondence & Contract", note: "Association of two or more firms to execute a contract" },
  { en: "Subcontractor", km: "អ្នកម៉ៅការបន្ត", category: "Correspondence & Contract", note: "Party hired by main contractor to perform specific tasks" },
  { en: "Force Majeure", km: "ករណីប្រធានស័ក្តិ", category: "Correspondence & Contract", note: "Unforeseeable external circumstances preventing contract execution" },
  { en: "Minutes of Meeting (MoM)", km: "កំណត់ហេតុប្រជុំ", category: "Correspondence & Contract", note: "Official record of discussions during progress meetings" },
  { en: "Non-Conformance Report (NCR)", km: "របាយការណ៍សកម្មភាពមិនប្រក្រតី (NCR)", category: "Correspondence & Contract", note: "Formal report issued when work fails to meet specifications" },
  { en: "Site Inspection Request (SIR)", km: "លិខិតស្នើពិនិត្យការងារ", category: "Correspondence & Contract", note: "Formal request submitted to engineer to inspect work" },
  { en: "Mobilization / Demobilization", km: "ការចល័ត / ការដកថយ", category: "Correspondence & Contract", note: "Setup or removal of contractor's personnel, equipment, and facilities" },
  { en: "Bill of Quantities (BOQ)", km: "បញ្ជីបរិមាណនិងតម្លៃ", category: "Procurement & BOQ", note: "Itemized list of materials, parts, and labor with costs" },
  { en: "Unit Rate", km: "តម្លៃក្នុងមួយឯកតា", category: "Procurement & BOQ", note: "Cost per specific unit of work" },
  { en: "Unit Price Analysis", km: "ការវិភាគតម្លៃក្នុងមួយឯកតា", category: "Procurement & BOQ", note: "Breakdown showing how a unit rate was derived" },
  { en: "Bidding Document", km: "ឯកសារដេញថ្លៃ", category: "Procurement & BOQ", note: "Formal documentation provided to prospective bidders" },
  { en: "Provisional Sum", km: "ថវិកាបម្រុងទុក / ប្រាក់បម្រុង", category: "Procurement & BOQ", note: "Allowance included in BOQ for unexpected work" },
  { en: "Lump Sum", km: "តម្លៃម៉ៅដាច់", category: "Procurement & BOQ", note: "Fixed sum paid for a specific scope of work" },
  { en: "Daywork Schedule", km: "តារាងតម្លៃការងារគិតជាថ្ងៃ", category: "Procurement & BOQ", note: "Rates for labor, material, and equipment used on daywork basis" },
  { en: "Technical Specification", km: "លក្ខណៈបច្ចេកទេស", category: "Procurement & BOQ", note: "Detailed technical standards and requirements for execution" },
  { en: "Addendum / Corrigendum", km: "លិខិតកែប្រែ/បន្ថែមឯកសារដេញថ្លៃ", category: "Procurement & BOQ", note: "Formal modification to bidding documents before bid opening" },
  { en: "Bid Security / Bid Bond", km: "លិខិតធានាការដេញថ្លៃ", category: "Procurement & BOQ", note: "Security submitted with a bid to guarantee bid validity" },
  { en: "Invitation for Bids (IFB)", km: "ការអញ្ជើញឱ្យចូលរួមដេញថ្លៃ", category: "Procurement & BOQ", note: "Formal notice inviting contractors to submit proposals" },
  { en: "Method Statement", km: "របាយការណ៍វិធីសាស្ត្រអនុវត្តការងារ", category: "Procurement & BOQ", note: "Plan detailing how specific construction work will be executed safely" },
  { en: "Quantity Surveyor (QS)", km: "វិស្វករប្រមាណតម្លៃ", category: "Procurement & BOQ", note: "Professional responsible for measuring and estimating costs" },
  { en: "Price Adjustment / Escalation", km: "ការកែប្រែតម្លៃតាមអតិផរណា", category: "Procurement & BOQ", note: "Adjustment of contract rates due to market price fluctuation" },
  { en: "Pre-Bid Meeting", km: "កិច្ចប្រជុំមុនការដេញថ្លៃ", category: "Procurement & BOQ", note: "Meeting held with potential bidders prior to bid submission" },
  { en: "Headworks", km: "សំណង់មេ / ក្បាលហុង", category: "Irrigation & Hydraulic", note: "Intake or control structures at the source of a water system" },
  { en: "Diversion Structure", km: "សំណង់បង្វែរទឹក", category: "Irrigation & Hydraulic", note: "Structure to redirect river or stream flow into a canal" },
  { en: "Sluice Gate", km: "ទ្វារទឹក Slide Gate / ទ្វារទប់ទឹក", category: "Irrigation & Hydraulic", note: "Sliding gate used to control water flow level" },
  { en: "Spillway", km: "សំណង់បង្ហូរទឹកលើស / ស្ពៀលវ៉េ", category: "Irrigation & Hydraulic", note: "Structure constructed to provide safe release of floodwater" },
  { en: "Culvert", km: "លូ (លូមូល / លូប្រអប់)", category: "Irrigation & Hydraulic", note: "Enclosed channel or pipe carrying water under a road or embankment" },
  { en: "Box Culvert", km: "លូប្រអប់", category: "Irrigation & Hydraulic", note: "Rectangular concrete culvert structure" },
  { en: "Pipe Culvert", km: "លូមូល", category: "Irrigation & Hydraulic", note: "Circular concrete or corrugated pipe culvert" },
  { en: "Check Structure / Cross Regulator", km: "សំណង់ទប់ទឹក / សំណង់ទប់បង្វែរទឹក", category: "Irrigation & Hydraulic", note: "Structure across canal to control upstream water level" },
  { en: "Head Regulator", km: "សំណង់ទ្វារទឹកដើមប្រឡាយ", category: "Irrigation & Hydraulic", note: "Control structure at the entrance of a secondary or tertiary canal" },
  { en: "Offtake Structure / Turnout", km: "សំណង់ចែកទឹក / ទ្វារចែកទឹក", category: "Irrigation & Hydraulic", note: "Structure delivering water from canal to field channels" },
  { en: "Drop Structure / Drop Fall", km: "សំណង់ទម្លាក់កម្រិតទឹក (Drop)", category: "Irrigation & Hydraulic", note: "Structure designed to drop water level safely without erosion" },
  { en: "Primary Canal / Main Canal", km: "ប្រឡាយមេ", category: "Irrigation & Hydraulic", note: "Principal canal conveying water from intake to distribution network" },
  { en: "Secondary Canal", km: "ប្រឡាយរង", category: "Irrigation & Hydraulic", note: "Branch canal taking water from primary canal to tertiary canals" },
  { en: "Tertiary Canal", km: "ប្រឡាយថ្នាក់ទី៣ / ប្រឡាយជីក", category: "Irrigation & Hydraulic", note: "Small canal delivering water directly to farm units" },
  { en: "Riprap / Stone Facing", km: "ការរៀបថ្មការពារច្រាំង (Riprap)", category: "Irrigation & Hydraulic", note: "Layer of large stones to protect slopes against erosion" },
  { en: "Gabion Mattress / Basket", km: "កន្ត្រកថ្ម (Gabion)", category: "Irrigation & Hydraulic", note: "Wire mesh box filled with stones for erosion protection" },
  { en: "Aqueduct", km: "ស្ពានប្រឡាយទឹក (Aqueduct)", category: "Irrigation & Hydraulic", note: "Elevated structure carrying water channel over a depression" },
  { en: "Inverted Syphon", km: "ស៊ីហ្វុង (Inverted Syphon)", category: "Irrigation & Hydraulic", note: "Pressurized conduit carrying canal flow under a road or stream" },
  { en: "Embankment / Dike", km: "ទំនប់ / ភ្លឺប្រឡាយ", category: "Irrigation & Hydraulic", note: "Raised bank of earth built to contain water or carry roads" },
  { en: "Sedimentation / Siltation", km: "ការកកស្ទះល្បាប់", category: "Irrigation & Hydraulic", note: "Accumulation of soil and organic particles in water bodies" },
  { en: "Dredging", km: "ការស្តារប្រឡាយ / ការកាយល្បាប់", category: "Irrigation & Hydraulic", note: "Excavation of silt and sediment from canal bed or watercourse" },
  { en: "Freeboard", km: "រយៈពេលកម្ពស់បម្រុង (Freeboard)", category: "Irrigation & Hydraulic", note: "Vertical distance between maximum water level and top of bank" },
  { en: "Discharge / Flow Rate", km: "លំហូរទឹក (Q)", category: "Irrigation & Hydraulic", note: "Volume of water passing a given point per unit time" },
  { en: "Catchment Area", km: "អាងប្រមូលទឹក / អាងជលសាស្ត្រ", category: "Irrigation & Hydraulic", note: "Area from which rainfall flows into a river or reservoir" },
  { en: "Reservoir", km: "អាងស្តុកទឹក", category: "Irrigation & Hydraulic", note: "Artificial lake or pond created to store water" },
  { en: "Weir", km: "ទំនប់បង្ហូរ / វ៉ៀ (Weir)", category: "Irrigation & Hydraulic", note: "Low dam built across a river to raise level or measure flow" },
  { en: "Canal Lining", km: "ការក្រាលបេតុងប្រឡាយ", category: "Irrigation & Hydraulic", note: "Impermeable lining (concrete/geomembrane) to prevent seepage" },
  { en: "Seepage", km: "ការជ្រាបទឹក", category: "Irrigation & Hydraulic", note: "Slow percolation of water through soil or channel lining" },
  { en: "Water Level Gauge / Staff Gauge", km: "បង្គោលវាស់កម្ពស់ទឹក", category: "Irrigation & Hydraulic", note: "Graduated scale for measuring water surface elevation" },
  { en: "Farmer Water User Community (FWUC)", km: "សហគមន៍កសិករប្រើប្រាស់ទឹក (សកប)", category: "Irrigation & Hydraulic", note: "Organization of farmers managing local irrigation systems" },
  { en: "Subgrade", km: "ស្រទាប់គ្រឹះបាត (Subgrade)", category: "Road Construction", note: "Prepared natural soil layer supporting pavement structure" },
  { en: "Subbase Course", km: "ស្រទាប់គ្រឹះរង (Subbase)", category: "Road Construction", note: "Layer of selected material placed above subgrade" },
  { en: "Base Course", km: "ស្រទាប់គ្រឹះលើ (Base Course)", category: "Road Construction", note: "High-quality crushed stone layer beneath asphalt or surface layer" },
  { en: "Asphalt Concrete (AC)", km: "បេតុងអាសហ្វាល់ (AC)", category: "Road Construction", note: "Composite material of aggregate and asphalt binder for surfacing" },
  { en: "Double Bituminous Surface Treatment (DBST)", km: "ការអ៊ុតកៅស៊ូពីរជាន់ (DBST)", category: "Road Construction", note: "Two layers of asphalt binder covered with aggregates" },
  { en: "Prime Coat", km: "ស្រទាប់កៅស៊ូបាត (Prime Coat)", category: "Road Construction", note: "Initial application of low-viscosity asphalt to unpaved base" },
  { en: "Tack Coat", km: "ស្រទាប់កៅស៊ូភ្ជាប់ (Tack Coat)", category: "Road Construction", note: "Thin application of asphalt binder between aggregate/pavement layers" },
  { en: "Compaction", km: "ការកិនបង្ហាប់", category: "Road Construction", note: "Process of mechanically densifying soil or pavement materials" },
  { en: "California Bearing Ratio (CBR)", km: "សូចនាករកម្លាំងទ្រទម្ពដី (CBR)", category: "Road Construction", note: "Standard test evaluating mechanical strength of soil/subbase" },
  { en: "Field Density Test (FDT)", km: "ការតេស្តដង់ស៊ីតេដីនៅការដ្ឋាន (FDT)", category: "Road Construction", note: "Test to verify soil compaction density on site" },
  { en: "Slump Test", km: "ការតេស្តភាពស្រុតនៃបេតុង (Slump Test)", category: "Road Construction", note: "Test measuring workability/consistency of fresh concrete" },
  { en: "Concrete Compressive Strength Test", km: "ការតេស្តកម្លាំងទប់សង្កត់បេតុង", category: "Road Construction", note: "Testing concrete cylinder/cube samples for load capacity" },
  { en: "Slope Protection", km: "ការពារជម្រាល / ជញ្ជាំងទប់", category: "Road Construction", note: "Structural measures to prevent landslides and slope erosion" },
  { en: "Retaining Wall", km: "ជញ្ជាំងទប់ដី", category: "Road Construction", note: "Structure designed to retain soil behind it" },
  { en: "Wearing Course / Surface Course", km: "ស្រទាប់ខាងលើ / ស្រទាប់ចរាចរណ៍", category: "Road Construction", note: "Top layer of pavement designed to resist traffic wear" },
  { en: "Drainage Ditch / Side Drain", km: "ប្រឡាយរំដោះទឹកតាមដងផ្លូវ", category: "Road Construction", note: "Channel along road edge to collect and drain runoff" },
  { en: "Cross Drainage", km: "ប្រព័ន្ធរំដោះទឹកទទឹងផ្លូវ", category: "Road Construction", note: "Drainage structures conducting water across road alignment" },
  { en: "Shoulder", km: "ចិញ្ចើមផ្លូវ", category: "Road Construction", note: "Paved or unpaved strip adjacent to traffic lanes" },
  { en: "Borrow Pit", km: "រណ្តៅដី / កន្លែងយកដី", category: "Road Construction", note: "Excavation area where soil or aggregate is extracted for construction" },
  { en: "Stripping and Grubbing", km: "ការកាយដីលើ និងជម្រះឫសឈើ", category: "Road Construction", note: "Removal of topsoil, vegetation, and roots prior to earthworks" },
  { en: "Cut and Fill", km: "ការជីកនិងចាក់លុប", category: "Road Construction", note: "Process of excavating high areas and filling low areas" },
  { en: "Right of Way (ROW)", km: "ដីចំណីផ្លូវ (ROW)", category: "Road Construction", note: "Legal land area designated for road construction and utilities" },
  { en: "Camber / Cross Slope", km: "ជម្រាលទទឹងផ្លូវ (Camber)", category: "Road Construction", note: "Transverse slope of road surface to drain rainwater" },
  { en: "Geotextile", km: "ក្រណាត់ភូមិសាស្ត្រ (Geotextile)", category: "Road Construction", note: "Permeable synthetic fabric used for filtration and soil stabilization" },
  { en: "Guardrail", km: "របាំងការពារសុវត្ថិភាពចរាចរណ៍", category: "Road Construction", note: "Protective barrier along dangerous sections of road" },
  { en: "Berm", km: "ខ្នងដីជំនួយ / Berm", category: "Road Construction", note: "Horizontal bench or ledge formed on an embankment slope" },
  { en: "Quality Assurance / Quality Control (QA/QC)", km: "ការធានា និងត្រួតពិនិត្យគុណភាព (QA/QC)", category: "QA/QC & Testing", note: "Systematic measures to ensure project standard compliance" },
  { en: "Initial Environmental Examination (IEE)", km: "ការវាយតម្លៃផលប៉ះពាល់បរិស្ថានដំបូង (IEE)", category: "Environmental & Social Safeguards", note: "Preliminary assessment of potential environmental impacts" },
  { en: "Environmental and Social Management Plan (ESMP)", km: "ផែនការគ្រប់គ្រងបរិស្ថាន និងសង្គម (ESMP)", category: "Environmental & Social Safeguards", note: "Plan outlining mitigation measures, monitoring, and responsibilities" },
  { en: "Resettlement Action Plan (RAP)", km: "ផែនការសកម្មភាពតាំងទីលំនៅឡើងវិញ (RAP)", category: "Environmental & Social Safeguards", note: "Plan specifying procedures to mitigate land acquisition impact" },
  { en: "Project Affected Persons (PAPs)", km: "ប្រជាពលរដ្ឋរងផលប៉ះពាល់ពីគម្រោង", category: "Environmental & Social Safeguards", note: "Individuals or households directly impacted by land acquisition" },
  { en: "Grievance Redress Mechanism (GRM)", km: "យន្តការដោះស្រាយបណ្តឹងតវ៉ា (GRM)", category: "Environmental & Social Safeguards", note: "Formal system for receiving and resolving complaints from communities" },
  { en: "Land Acquisition", km: "ការទទួលបានដី / ការប្រមូលដីធ្លី", category: "Environmental & Social Safeguards", note: "Process of obtaining private land for public project infrastructure" },
  { en: "Compensation", km: "ប្រាក់សំណង / សំណងផលប៉ះពាល់", category: "Environmental & Social Safeguards", note: "Payment or assistance provided to replace lost assets or livelihoods" },
  { en: "Stakeholder Engagement / Public Consultation", km: "ការពិគ្រោះយោបល់សាធារណៈ / ការចូលរួមពីភាគីពាក់ព័ន្ធ", category: "Environmental & Social Safeguards", note: "Meaningful dialogue with local communities and affected parties" },
  { en: "Code of Conduct", km: "ក្រមសីលធម៌ការងារ", category: "Environmental & Social Safeguards", note: "Rules governing worker behavior, child protection, and GBV prevention" },
  { en: "Occupational Health and Safety (OHS)", km: "សុខភាព និងសុវត្ថិភាពការងារ (OHS)", category: "Environmental & Social Safeguards", note: "Procedures and protective measures to ensure worker health and safety" },
  { en: "Personal Protective Equipment (PPE)", km: "ឧបករណ៍ការពារសុវត្ថិភាពផ្ទាល់ខ្លួន (PPE)", category: "Environmental & Social Safeguards", note: "Safety gear required on construction sites (helmets, boots, vests)" },
  { en: "Environmental Monitoring Report (EMR)", km: "របាយការណ៍តាមដានត្រួតពិនិត្យបរិស្ថាន", category: "Environmental & Social Safeguards", note: "Periodic report documenting compliance with environmental plan" },
  { en: "Spoil Bank / Disposal Site", km: "ទីលានចាក់ដី / សំណល់", category: "Environmental & Social Safeguards", note: "Designated area for dumping excavated waste earth" },
  { en: "Dust Suppression", km: "ការកាត់បន្ថយ / គ្រប់គ្រងធូលី", category: "Environmental & Social Safeguards", note: "Water spraying or methods to limit airborne dust" },
];

const CATEGORIES = ["All", "Correspondence & Contract", "Procurement & BOQ", "Irrigation & Hydraulic", "Road Construction", "QA/QC & Testing", "Environmental & Social Safeguards"] as const;

export default function ConstructionWaterGlossary() {
  const { text: localize } = useLanguage();
  const { copyText } = useClipboard();
  const [cat, setCat] = useToolState<(typeof CATEGORIES)[number]>("construction-water-glossary:cat", "All");
  const [query, setQuery] = useToolState("construction-water-glossary:query", "");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TERMS.filter((t) => {
      const matchesCat = cat === "All" || t.category === cat;
      const matchesQuery = !q || t.en.toLowerCase().includes(q) || t.km.includes(q);
      return matchesCat && matchesQuery;
    });
  }, [cat, query]);

  function buildFields(t: Term) {
    const f: CopyField[] = [
      { id: "en", label: localize("English", "អង់គ្លេស"), getValue: t.en },
      { id: "km", label: localize("Khmer", "ខ្មែរ"), getValue: t.km },
      { id: "category", label: localize("Category", "ចំណាត់ថ្នាក់"), getValue: t.category },
    ];
    if (t.note) f.push({ id: "note", label: localize("Description", "ការពិពណ៌នា"), getValue: t.note });
    return f;
  }

  function formatEntry(t: Term) {
    return `${t.en}\n${t.km}${t.note ? `\n${t.note}` : ""}\n${t.category}`;
  }

  function formatAll() {
    return results.map((t) => `${t.en}\n${t.km}${t.note ? `\n${t.note}` : ""}\n${t.category}`).join("\n\n---\n\n");
  }

  return (
    <ToolShell
      title="Construction & Water Resources Glossary"
      khmerTitle="វចនានុក្រមសំណង់ និងធនធានទឹក"
      description="Khmer-English terminology for construction contracts, procurement/BOQ documents, irrigation infrastructure, and environmental & social safeguards — the everyday vocabulary of correspondence registers, contract admin, and canal works. Aimed at practical project documents, not a legal translation authority."
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Category">
          <Select value={cat} onChange={(e) => setCat(e.target.value as (typeof CATEGORIES)[number])}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="Search">
          <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="English or Khmer term…" />
        </Field>
      </div>
      <div className="flex items-center justify-between py-2">
        <p className="text-xs text-[var(--ink-faint)]">{localize(`${results.length} terms`, `ពាក្យចំនួន ${results.length}`)}</p>
        {results.length > 1 && (
          <button
            type="button"
            onClick={() => void copyText(formatAll())}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-1.5 text-xs text-[var(--ink-faint)] transition hover:border-[var(--gold-dim)] hover:text-[var(--gold)]"
          >
            {localize("Copy all", "ចម្លងទាំងអស់")}
          </button>
        )}
      </div>
      <div className="space-y-1.5">
        {results.length === 0 && (
          <div className="py-8 text-center text-sm text-[var(--ink-faint)]">No terms match that filter.</div>
        )}
        {results.map((t) => (
          <div key={t.en} className="flex items-start justify-between gap-3 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-sm">
            <div>
              <div className="font-medium text-[var(--ink)]">{t.en}</div>
              {t.note && <div className="mt-0.5 text-xs text-[var(--ink-dim)]">{t.note}</div>}
              <div className="mt-1 text-[10px] uppercase tracking-wide text-[var(--ink-faint)]">{t.category}</div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div className="whitespace-nowrap font-medium text-[var(--gold)]">{t.km}</div>
              <CopyButton text={formatEntry(t)} compact fields={buildFields(t)} />
            </div>
          </div>
        ))}
      </div>
    </ToolShell>
  );
}
