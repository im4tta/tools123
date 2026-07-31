"use client";

import { useMemo, useState } from "react";
import {
  Search,
  BookOpen,
  Filter,
  Globe,
  Sparkles,
  Volume2,
  Bookmark,
  BookmarkCheck,
  Award,
  Info,
  Layers,
  ChevronRight,
  RotateCcw,
  X,
  PieChart,
  Grid,
  List,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { ToolShell, Field, Select, TextInput } from "@/components/ui/Shell";
import { useToolState } from "@/lib/storage";

const ORIGIN_CONFIG: Record<string, { km: string; en: string; color: string; icon: string; era: string }> = {
  "sanskrit-pali": {
    km: "សំស្ក្រឹត / បាលី", en: "Sanskrit / Pali", color: "var(--gold)", icon: "☸️",
    era: "Ancient & Classical Era (1st–14th C.)",
  },
  french: {
    km: "បារាំង", en: "French", color: "var(--teal)", icon: "🥐",
    era: "Protectorate Era (1863–1953)",
  },
  english: {
    km: "អង់គ្លេស", en: "English", color: "var(--success)", icon: "💻",
    era: "Modern & Digital Era (1990s–Present)",
  },
  chinese: {
    km: "ចិន (តេជូ / ហុកគៀន)", en: "Chinese (Teochew / Hokkien)", color: "var(--danger)", icon: "🥢",
    era: "Maritime Trade & Migration Era",
  },
  thai: {
    km: "ថៃ / ឡាវ", en: "Thai / Lao", color: "var(--slate-accent)", icon: "🐘",
    era: "Post-Angkorian Regional Exchange",
  },
  portuguese: {
    km: "ព័រទុយហ្គាល់ / អឺរ៉ុប", en: "Portuguese / Early European", color: "#6B21A8", icon: "⛵",
    era: "Early Modern Trade Era (16th–17th C.)",
  },
};

const DOMAIN_CONFIG: Record<string, { km: string; en: string; icon: string }> = {
  religion: { km: "សាសនានិងរាជស័ព្ទ", en: "Religion & Royalty", icon: "🕌" },
  culinary: { km: "អាហារនិងភេសជ្ជៈ", en: "Food & Culinary", icon: "🍲" },
  tech: { km: "បច្ចេកវិទ្យានិងវិទ្យាសាស្ត្រ", en: "Technology & Science", icon: "⚙️" },
  daily: { km: "ជីវភាពរស់នៅនិងសម្លៀកបំពាក់", en: "Daily Life & Objects", icon: "👕" },
  admin: { km: "រដ្ឋបាលនិងសេដ្ឋកិច្ច", en: "Administration & Economy", icon: "🏛️" },
};

interface Loanword {
  id: string;
  khmer: string;
  romanization: string;
  ipa: string;
  meaningEn: string;
  meaningKm: string;
  origin: string;
  originWord: string;
  domain: string;
  noteEn: string;
  noteKm: string;
  source: string;
}

const LOANWORD_DATASET: Loanword[] = [
  // Sanskrit/Pali
  { id: "thoa", khmer: "ធម៌", romanization: "thoa", ipa: "/tʰəə/", meaningEn: "dharma, doctrine, natural law, virtue", meaningKm: "ព្រះពុទ្ធដីកា, ច្បាប់ធម្មជាតិ, សីលធម៌", origin: "sanskrit-pali", originWord: "Sanskrit dharma (धर्म) / Pali dhamma", domain: "religion", noteEn: "Core Buddhist vocabulary representing the deepest linguistic layer in Khmer.", noteKm: "ពាក្យគ្រឹះក្នុងព្រះពុទ្ធសាសនា និងលទ្ធិព្រហ្មញ្ញសាសនា ដែលជាស្រទាប់ភាសាចាស់ជាងគេ។", source: "Pali-Sanskrit Khmer Dictionary (Chuon Nath)" },
  { id: "sathu", khmer: "សាធុ", romanization: "sathu", ipa: "/saːtʰoʔ/", meaningEn: "well done, amen, blessing exclamation", meaningKm: "ការប្រពៃហើយ, ពាក្យប្រាសាទសាទរ ឬទទួលពរ", origin: "sanskrit-pali", originWord: "Pali sādhu ('good, virtuous')", domain: "religion", noteEn: "Commonly uttered during Buddhist prayers and everyday expressions of reverence.", noteKm: "ប្រើប្រាស់ក្នុងពិធីសាសនា និងការសម្តែងការយល់ព្រម ឬទទួលពរជ័យ។", source: "Cambodian Buddhist Institute Lexicon" },
  { id: "preah", khmer: "ព្រះ", romanization: "preah", ipa: "/prəah/", meaningEn: "sacred, divine, royal honorific prefix", meaningKm: "អ្នកដ៏ប្រសើរ, ព្រះសង្ឃ, រាជស័ព្ទសម្រាប់ក្សត្រ", origin: "sanskrit-pali", originWord: "Sanskrit vara / Pali vara ('excellent, noble')", domain: "religion", noteEn: "The most pervasive honorific prefix in Khmer.", noteKm: "ជាពាក្យបុព្វបទកិត្តិយសដ៏សំខាន់បំផុតក្នុងភាសាខ្មែរ។", source: "Pali-Sanskrit Khmer Glossary" },
  { id: "karma", khmer: "កម្ម", romanization: "kam", ipa: "/kam/", meaningEn: "karma, action, deed, cause and effect", meaningKm: "អំពើ, ការធ្វើ, ផលនៃអំពើល្អឬអាក្រក់", origin: "sanskrit-pali", originWord: "Sanskrit karma (कर्म) / Pali kamma", domain: "religion", noteEn: "Central concept in Cambodian philosophy and daily ethics.", noteKm: "គំនិតសំខាន់ក្នុងទស្សនវិជ្ជាខ្មែរ និងព្រះពុទ្ធសាសនា។", source: "Chuon Nath Dictionary" },
  { id: "santipheap", khmer: "សន្តិភាព", romanization: "santipheap", ipa: "/san.teʔ.pʰiəp/", meaningEn: "peace, harmony, tranquility", meaningKm: "ភាពស្ងប់ស្ងាត់, ការគ្មានសង្គ្រាម, សុខសន្តិភាព", origin: "sanskrit-pali", originWord: "Sanskrit śānti + bhāva ('peace' + 'state')", domain: "admin", noteEn: "Compound word constructed from classical Indic roots.", noteKm: "ពាក្យសមាសផ្សំពីឫសគល់សំស្ក្រឹត រវាង 'សន្តិ' និង 'ភាព'។", source: "National Institute of Language" },
  { id: "krou", khmer: "គ្រូ", romanization: "krou", ipa: "/kruː/", meaningEn: "teacher, master, instructor, guru", meaningKm: "អ្នកប្រដៅ, អ្នកបង្រៀនចំណេះដឹង", origin: "sanskrit-pali", originWord: "Sanskrit guru (गुरु - 'heavy, venerable')", domain: "religion", noteEn: "Denotes deeply respected spiritual guides and school teachers.", noteKm: "សំដៅលើអ្នកបំភ្លឺផ្លូវចិត្ត គ្រូបង្រៀន និងគ្រូគុនបុរាណ។", source: "Etymological Notes on Khmer" },
  { id: "pheasa", khmer: "ភាសា", romanization: "pheasa", ipa: "/pʰiə.saː/", meaningEn: "language, speech, tongue", meaningKm: "សម្តី, ពាក្យនិយាយ, ភាសាទំនាក់ទំនង", origin: "sanskrit-pali", originWord: "Sanskrit bhāṣā (भाषा - 'speech')", domain: "admin", noteEn: "Borrowed from Sanskrit classical linguistics.", noteKm: "ពាក្យបាលី-សំស្ក្រឹតប្រើប្រាស់យ៉ាងទូលំទូលាយក្នុងវិស័យអប់រំ។", source: "Chuon Nath Dictionary" },
  { id: "procheachon", khmer: "ប្រជាជន", romanization: "procheachon", ipa: "/pro.ceə.con/", meaningEn: "population, citizens, people", meaningKm: "អ្នកស្រុក, ប្រជារាស្ត្រ, ពលរដ្ឋ", origin: "sanskrit-pali", originWord: "Sanskrit prajā + jana ('offspring/subjects' + 'people')", domain: "admin", noteEn: "Formal civic terminology used in constitutional texts.", noteKm: "ពាក្យផ្លូវការក្នុងវិស័យរដ្ឋបាល និងច្បាប់រដ្ឋធម្មនុញ្ញខ្មែរ។", source: "Khmer Administrative Lexicon" },
  { id: "sala", khmer: "សាលា", romanization: "sala", ipa: "/saː.laː/", meaningEn: "school, hall, public building", meaningKm: "សាលារៀន, ទីកន្លែងសម្រាប់ប្រជុំ ឬរៀនសូត្រ", origin: "sanskrit-pali", originWord: "Sanskrit śālā (शाला - 'hall, house')", domain: "admin", noteEn: "Found in compounds like 'Sala Khum' (commune hall) and 'Sala Rien' (school).", noteKm: "ប្រើក្នុងពាក្យសមាសដូចជា សាលារៀន សាលាឃុំ សាលាក្រុង។", source: "Chuon Nath Dictionary" },
  { id: "prates", khmer: "ប្រទេស", romanization: "prates", ipa: "/prɑ.teh/", meaningEn: "country, nation, state", meaningKm: "រដ្ឋ, ដែនដី, ស្រុក", origin: "sanskrit-pali", originWord: "Sanskrit pradeśa (प्रदेश - 'region, country')", domain: "admin", noteEn: "Formal term for nation-state.", noteKm: "ពាក្យផ្លូវការសម្រាប់សម្គាល់រដ្ឋ ឬដែនដី។", source: "National Institute of Language" },
  // French
  { id: "kafe", khmer: "កាហ្វេ", romanization: "kafé", ipa: "/kaː.feː/", meaningEn: "coffee", meaningKm: "ភេសជ្ជៈឆុងចេញពីគ្រាប់កាហ្វេ", origin: "french", originWord: "French café", domain: "culinary", noteEn: "Introduced during the French Protectorate era (1863–1953).", noteKm: "នាំចូលក្នុងសម័យអាណានិគមបារាំង រួមជាមួយការដាំដុះដំណាំកាហ្វេ។", source: "Wonders of Cambodia, 'Loanwords in Khmer'" },
  { id: "masin", khmer: "ម៉ាស៊ីន", romanization: "masin", ipa: "/maː.sɨn/", meaningEn: "machine, engine, motor", meaningKm: "គ្រឿងយន្ត, ឧបករណ៍បំពាក់ម៉ូទ័រ", origin: "french", originWord: "French machine", domain: "tech", noteEn: "Came with industrialization and railways.", noteKm: "ប្រើប្រាស់សម្រាប់គ្រឿងយន្ត និងបច្ចេកវិទ្យាឧស្សាហកម្ម។", source: "French Influence on Khmer Vocabulary" },
  { id: "bor", khmer: "ប័រ", romanization: "bâ", ipa: "/baː/", meaningEn: "butter", meaningKm: "ឆាញ់ផលិតចេញពីទឹកដោះគោ", origin: "french", originWord: "French beurre", domain: "culinary", noteEn: "Colonial food loanword; French final '-r' dropped in Khmer.", noteKm: "ពាក្យចំណីអាហារសម័យបារាំង សម្លេង 'r' ខាងចុងត្រូវលុបចេញ។", source: "Wonders of Cambodia, 'Loanwords in Khmer'" },
  { id: "boutong", khmer: "ប៊ូតុង", romanization: "bou-tong", ipa: "/buː.toŋ/", meaningEn: "button (clothing or switch)", meaningKm: "ឡេវអាវ ឬប៊ូតុងចុចឧបករណ៍", origin: "french", originWord: "French bouton", domain: "daily", noteEn: "Used for shirt buttons and electronic switches.", noteKm: "ប្រើប្រាស់ទាំងសម្រាប់ឡេវអាវ និងប៊ូតុងចុចគ្រឿងអគ្គិសនី។", source: "Lexique Cambodgien-Français" },
  { id: "barang", khmer: "បារាំង", romanization: "barang", ipa: "/baː.raŋ/", meaningEn: "French person, France, Westerner", meaningKm: "ជនជាតិបារាំង ឬជនជាតិនៃប្រទេសប៉ែកអឺរ៉ុប", origin: "french", originWord: "French Français", domain: "admin", noteEn: "Khmer lacks initial /f/, adapting 'Français' into 'Barang'.", noteKm: "ដោយសារភាសាខ្មែរគ្មានសម្លេង 'F' ពាក្យ 'Français' ត្រូវបានបំផ្លែងជា 'បារាំង'។", source: "Wikipedia, 'Barang (Khmer word)'" },
  { id: "vaccine", khmer: "វ៉ាក់សាំង", romanization: "vak-sang", ipa: "/vak.saŋ/", meaningEn: "vaccine, immunization shot", meaningKm: "ថ្នាំបង្ការជំងឺ, វ៉ាក់សាំងការពារ", origin: "french", originWord: "French vaccin", domain: "tech", noteEn: "Medical term introduced during colonial healthcare programs.", noteKm: "ពាក្យវេជ្ជសាស្ត្រនាំចូលក្នុងសម័យអាណានិគមបារាំង។", source: "Socio-historical Khmer Studies" },
  { id: "simang", khmer: "ស៊ីម៉ង់ត៍", romanization: "si-mang", ipa: "/siː.maŋ/", meaningEn: "cement, concrete building material", meaningKm: "ម្សៅស៊ីម៉ង់ត៍សម្រាប់ចាក់បេតុងសាងសង់", origin: "french", originWord: "French ciment", domain: "tech", noteEn: "Arrived with modern masonry in the early 20th century.", noteKm: "នាំចូលក្នុងវិស័យសំណង់អាគារ និងស្ពានថ្នល់សម័យទំនើបដើមសតវត្សរ៍ទី២០។", source: "Khmer Architecture History" },
  { id: "carreau", khmer: "ការ៉ូ", romanization: "ka-rou", ipa: "/kaː.ruː/", meaningEn: "floor tile, checkered pattern", meaningKm: "ការ៉ូក្រាលការ៉ូ ឬក្រឡាចក្រពត្រ", origin: "french", originWord: "French carreau", domain: "daily", noteEn: "Refers to pattern tiles in colonial shop houses.", noteKm: "សំដៅលើការ៉ូក្រាលបាតផ្ទះតាមរចនាបថបារាំង។", source: "Urban Heritage Lexicon" },
  { id: "robe", khmer: "រ៉ូប", romanization: "roub", ipa: "/roːp/", meaningEn: "dress, gown", meaningKm: "សម្លៀកបំពាក់រ៉ូបនារី", origin: "french", originWord: "French robe", domain: "daily", noteEn: "Western fashion loanword for women's dresses.", noteKm: "ពាក្យម៉ូដសម្លៀកបំពាក់នារីនាំចូលពីអឺរ៉ុប។", source: "Khmer Fashion History" },
  { id: "frein", khmer: "ហ្វ្រាំង", romanization: "freang", ipa: "/fraŋ/", meaningEn: "brake (vehicle/bicycle)", meaningKm: "ប្រព័ន្ធហ្វ្រាំងទប់ល្បឿនយានយន្ត", origin: "french", originWord: "French frein", domain: "tech", noteEn: "Automotive and bicycle vocabulary.", noteKm: "ពាក្យបច្ចេកទេសយានយន្តសម្រាប់បញ្ឈប់ ឬបន្ថយល្បឿន។", source: "Wonders of Cambodia" },
  { id: "moto", khmer: "ម៉ូតូ", romanization: "mo-tou", ipa: "/moː.toː/", meaningEn: "motorcycle, motorbike", meaningKm: "ទោចក្រយានយន្ត, ម៉ូតូ", origin: "french", originWord: "French moto (abbrev. of motocyclette)", domain: "daily", noteEn: "Ubiquitous term for motorbikes in Cambodia.", noteKm: "ពាក្យប្រើប្រាស់ប្រចាំថ្ងៃយ៉ាងទូលំទូលាយសម្រាប់ហៅទោចក្រយានយន្ត។", source: "French Influence on Khmer Vocabulary" },
  { id: "kado", khmer: "កាដូ", romanization: "ka-dou", ipa: "/kaː.doː/", meaningEn: "gift, present", meaningKm: "អំណោយ, វត្ថុអនុស្សាវរីយ៍", origin: "french", originWord: "French cadeau", domain: "daily", noteEn: "Colloquial term for a gift, alongside native 'omnaoy' (អំណោយ).", noteKm: "ពាក្យនិយមប្រើក្នុងជីវភាពប្រចាំថ្ងៃ មានន័យដូច 'អំណោយ'។", source: "Modern Khmer Colloquialisms" },
  { id: "gas", khmer: "ហ្គាស", romanization: "gas", ipa: "/gaːs/", meaningEn: "gas, cooking gas", meaningKm: "ឧស្ម័នហ្គាសសម្រាប់ចម្អិនអាហារ", origin: "french", originWord: "French gaz", domain: "daily", noteEn: "Used for cooking gas and petroleum gas.", noteKm: "ប្រើប្រាស់សម្រាប់ឧស្ម័នចម្អិនអាហារ។", source: "Lexique Cambodgien-Français" },
  // English
  { id: "kompyuter", khmer: "កំព្យូទ័រ", romanization: "kom-pyu-tœ", ipa: "/kəm.pjuː.təː/", meaningEn: "computer", meaningKm: "ម៉ាស៊ីនគណនាអេឡិចត្រូនិក, កំព្យូទ័រ", origin: "english", originWord: "English computer", domain: "tech", noteEn: "Direct post-1990s loanword adapted to Khmer phonology.", noteKm: "ពាក្យបច្ចេកវិទ្យាព័ត៌មានវិទ្យានាំចូលផ្ទាល់ពីភាសាអង់គ្លេសក្នុងទសវត្សរ៍ឆ្នាំ ១៩៩០។", source: "Wonders of Cambodia" },
  { id: "internet", khmer: "អ៊ីនធឺណិត", romanization: "in-thœ-nit", ipa: "/in.təː.nət/", meaningEn: "internet, global network", meaningKm: "បណ្តាញទំនាក់ទំនងសកល, អ៊ីនធឺណិត", origin: "english", originWord: "English internet", domain: "tech", noteEn: "Universal tech loanword.", noteKm: "ពាក្យសកលប្រើប្រាស់ជារៀងរាល់ថ្ងៃក្នុងសម័យឌីជីថល។", source: "Modern Khmer Tech Glossary" },
  { id: "smartphone", khmer: "ស្មាតហ្វូន", romanization: "smat-foun", ipa: "/smaːt.foːn/", meaningEn: "smartphone, mobile phone", meaningKm: "ទូរស័ព្ទដៃឆ្លាតវៃ", origin: "english", originWord: "English smartphone", domain: "tech", noteEn: "Widely used alongside traditional Khmer 'ទូរស័ព្ទ'.", noteKm: "ប្រើប្រាស់ទន្ទឹមគ្នានឹងពាក្យខ្មែរដើម 'ទូរស័ព្ទដៃ'។", source: "Digital Khmer Corpus" },
  { id: "email", khmer: "អ៊ីមែល", romanization: "i-mael", ipa: "/iː.mɛːl/", meaningEn: "email, electronic mail", meaningKm: "សារអេឡិចត្រូនិក, អ៊ីមែល", origin: "english", originWord: "English email", domain: "tech", noteEn: "Standard business communication loanword.", noteKm: "ពាក្យទំនាក់ទំនងការងារក្នុងការិយាល័យសម័យទំនើប។", source: "Cambodian Business Terminology" },
  // Chinese
  { id: "kuyteav", khmer: "គុយទាវ", romanization: "kuy teav", ipa: "/kuj.tiəv/", meaningEn: "flat rice noodle soup dish", meaningKm: "ម្ហូបគុយទាវសរសៃអង្ករទឹកស៊ុប", origin: "chinese", originWord: "Teochew 粿條 (guǒtiáo - 'rice cake strips')", domain: "culinary", noteEn: "Cambodia's iconic breakfast dish, brought by Teochew Chinese immigrants.", noteKm: "ម្ហូបអាហារពេលព្រឹកដ៏ល្បីល្បាញ នាំចូលដោយអន្តោប្រវេសន៍ចិនតេជូ។", source: "Cambodian Food Heritage Studies" },
  { id: "tauhu", khmer: "តៅហ៊ូ", romanization: "tau-hu", ipa: "/taw.huː/", meaningEn: "tofu, bean curd", meaningKm: "តៅហ៊ូធ្វើពីសណ្តែកសៀង", origin: "chinese", originWord: "Teochew 豆腐 (tōfū)", domain: "culinary", noteEn: "Staple soy ingredient from Southern Chinese dialects.", noteKm: "គ្រឿងផ្សំសណ្តែកសៀងប្រើក្នុងម្ហូបខ្មែរ-ចិន។", source: "Chinese Dialects in Cambodia" },
  { id: "cha", khmer: "ឆា", romanization: "cha", ipa: "/cʰaː/", meaningEn: "stir-fry (cooking technique)", meaningKm: "វិធីចម្អិនអាហារបំពងប្រេងក្ដៅឆា", origin: "chinese", originWord: "Chinese 炒 (chǎo - 'stir-fry')", domain: "culinary", noteEn: "Fundamental cooking technique in Khmer cuisine.", noteKm: "វិធីសាស្ត្រធ្វើម្ហូបដ៏សំខាន់ក្នុងផ្ទះបាយខ្មែរ។", source: "Culinary Etymology of Mainland Southeast Asia" },
  { id: "mee", khmer: "មី", romanization: "mee", ipa: "/miː/", meaningEn: "wheat noodles, instant noodles", meaningKm: "សរសៃមីធ្វើពីម្សៅសាលី", origin: "chinese", originWord: "Hokkien / Teochew 麵 (mīn)", domain: "culinary", noteEn: "Found in dishes like 'Mee Cha' (fried noodles).", noteKm: "ពាក្យសំដៅលើសរសៃមីគ្រប់ប្រភេទ។", source: "Southeast Asian Culinary History" },
  { id: "hang", khmer: "ហាង", romanization: "hang", ipa: "/haːŋ/", meaningEn: "shop, store, commercial establishment", meaningKm: "ហាងទំនិញ, ផ្ទះលក់ដូរ", origin: "chinese", originWord: "Teochew 行 (hâng - 'business house/firm')", domain: "admin", noteEn: "Core commercial word used throughout Cambodia.", noteKm: "ពាក្យអាជីវកម្មសំដៅលើទីតាំងលក់ដូរ ឬក្រុមហ៊ុន។", source: "Socio-Economic History of Phnom Penh" },
  { id: "kaoei", khmer: "កៅអី", romanization: "kao ei", ipa: "/kaw.əj/", meaningEn: "chair, seat", meaningKm: "កន្លែងអង្គុយមានជើង, កៅអី", origin: "chinese", originWord: "Teochew/Hokkien 交椅 (jiāoyǐ - 'folding chair')", domain: "daily", noteEn: "Ubiquitous household word from Chinese traders.", noteKm: "ពាក្យប្រើប្រាស់ប្រចាំថ្ងៃក្នុងផ្ទះដែលនាំចូលដោយជនជាតិចិន។", source: "Chinese Dialects in Cambodia" },
  { id: "chhong", khmer: "ឆុង", romanization: "chhong", ipa: "/cʰoŋ/", meaningEn: "to brew or steep (coffee/tea)", meaningKm: "ចាក់ទឹកក្ដៅត្រាំស្លឹកតែឬកាហ្វេ", origin: "chinese", originWord: "Chinese 沖 (chōng - 'to pour boiling water')", domain: "culinary", noteEn: "Exclusively used for brewing beverages.", noteKm: "ប្រើប្រាស់ជាពិសេសសម្រាប់សកម្មភាពធ្វើកាហ្វេ ឬតែ។", source: "Culinary Etymology of Mainland Southeast Asia" },
  // Thai/Lao
  { id: "khneuy", khmer: "ខ្នើយ", romanization: "khneuy", ipa: "/knəj/", meaningEn: "pillow, cushion", meaningKm: "ខ្នើយកល់ក្បាលកើយគេង", origin: "thai", originWord: "Thai หมอน (mɔ̌ɔn) / Shared Tai-Khmer substrate", domain: "daily", noteEn: "Reflects deep historical cross-cultural contact.", noteKm: "បង្ហាញពីទំនាក់ទំនងវប្បធម៌រវាងប្រជាជនខ្មែរ និងថៃ។", source: "Tai-Khmer Linguistic Exchanges" },
  { id: "lkhaon", khmer: "ល្ខោន", romanization: "lkhaon", ipa: "/lkaon/", meaningEn: "theatrical drama, royal ballet", meaningKm: "សិល្បៈទស្សនីយភាពសម្តែងរឿង", origin: "thai", originWord: "Thai ละคร (lakhon) / Shared SE Asian vocabulary", domain: "religion", noteEn: "Classical performance art shared across royal courts.", noteKm: "ពាក្យសិល្បៈទស្សនីយភាពព្រះរាជទ្រព្យ។", source: "Cambodian Performing Arts Lexicon" },
  { id: "kapi", khmer: "កាពិ", romanization: "ka-pi", ipa: "/kaː.piʔ/", meaningEn: "shrimp paste", meaningKm: "គ្រឿងផ្សំម្ហូបធ្វើពីគីបុកត្រាំអំបិល", origin: "thai", originWord: "Thai กะปิ (kapi)", domain: "culinary", noteEn: "Common culinary ingredient name across SE Asia.", noteKm: "ឈ្មោះគ្រឿងផ្សំអាហារប្រើប្រាស់រួមគ្នានៅអាស៊ីអាគ្នេយ៍។", source: "Tai-Khmer Linguistic Exchanges" },
  // Portuguese
  { id: "nombang", khmer: "នំប៉័ង", romanization: "nom-bang", ipa: "/num.paŋ/", meaningEn: "bread, baguette, Cambodian sandwich", meaningKm: "នំប៉័ងធ្វើពីម្សៅសាលី", origin: "portuguese", originWord: "Portuguese pão (from Latin panis)", domain: "culinary", noteEn: "Traces to 16th-century Portuguese traders in Longvek.", noteKm: "មានប្រភពដើមពីពាក្យព័រទុយហ្គាល់ 'pão' ក្នុងសម័យលង្វែក សតវត្សរ៍ទី១៦។", source: "Early European Trade in Longvek (1500s)" },
  { id: "sabou", khmer: "សាប៊ូ", romanization: "sa-bou", ipa: "/saː.buː/", meaningEn: "soap, detergent", meaningKm: "សាប៊ូដុសខ្លួន ឬបោកសម្លៀកបំពាក់", origin: "portuguese", originWord: "Portuguese sabão (from Latin sapo)", domain: "daily", noteEn: "Spread through maritime SE Asia by Portuguese sailors.", noteKm: "ពាក្យប្រើប្រាស់សកលនៅអាស៊ីអាគ្នេយ៍នាំចូលដោយអ្នកនាវាចរណ៍ព័រទុយហ្គាល់។", source: "Maritime European Loanwords in Asia" },
  { id: "thnamchok", khmer: "ថ្នាំជក់", romanization: "thnam chok", ipa: "/tʰnam.cok/", meaningEn: "tobacco", meaningKm: "ស្លឹកថ្នាំជក់, បារីបុរាណ", origin: "portuguese", originWord: "Portuguese tabaco (New World crop)", domain: "daily", noteEn: "Brought to SE Asia from America by Portuguese galleons.", noteKm: "ដំណាំថ្នាំជក់នាំចូលមកអាស៊ីពីអាមេរិកតាមរយៈកប៉ាល់ព័រទុយហ្គាល់។", source: "Agricultural Loanword History" },
];

export default function LoanwordExplorer() {
  const { text: t } = useLanguage();
  const [searchQuery, setSearchQuery] = useToolState("loanword-explorer:search", "");
  const [selectedOrigin, setSelectedOrigin] = useToolState("loanword-explorer:origin", "all");
  const [onlyBookmarks, setOnlyBookmarks] = useToolState("loanword-explorer:bookmarks", false);
  const [bookmarks, setBookmarks] = useToolState<string[]>("loanword-explorer:bookmarkIds", []);
  const [viewMode, setViewMode] = useToolState<"grid" | "list">("loanword-explorer:viewMode", "grid");
  const [selectedWord, setSelectedWord] = useState<Loanword | null>(null);
  const [activeTab, setActiveTab] = useToolState<"explorer" | "quiz" | "analytics">("loanword-explorer:tab", "explorer");
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [selectedQuizOption, setSelectedQuizOption] = useState<string | null>(null);

  const toggleBookmark = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setBookmarks((prev) => prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]);
  };

  const speakWord = (text: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "km-KH";
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    }
  };

  const filteredWords = useMemo(() =>
    LOANWORD_DATASET.filter((word) => {
      if (selectedOrigin !== "all" && word.origin !== selectedOrigin) return false;
      if (onlyBookmarks && !bookmarks.includes(word.id)) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return word.khmer.includes(q) || word.romanization.toLowerCase().includes(q) ||
        word.meaningEn.toLowerCase().includes(q) || word.meaningKm.includes(q) ||
        word.originWord.toLowerCase().includes(q) || word.noteEn.toLowerCase().includes(q) ||
        word.noteKm.includes(q);
    }),
  [searchQuery, selectedOrigin, onlyBookmarks, bookmarks]);

  const originStats = useMemo(() => {
    const s: Record<string, number> = {};
    Object.keys(ORIGIN_CONFIG).forEach((k) => (s[k] = 0));
    LOANWORD_DATASET.forEach((w) => { if (s[w.origin] !== undefined) s[w.origin]++; });
    return s;
  }, []);

  return (
    <ToolShell
      title="Khmer Loanword Explorer"
      khmerTitle="កម្មវិធីស្រាវជ្រាវពាក្យកម្ចីក្នុងភាសាខ្មែរ"
      description="Uncover the origins, etymology, and phonology of Sanskrit, French, English, Chinese, Thai & Portuguese loanwords in Khmer."
      descriptionKm="ស្វែងយល់ពីប្រភពដើម និងការវិវត្តនៃពាក្យកម្ចី បាលី-សំស្ក្រឹត បារាំង អង់គ្លេស ចិន ថៃ និងព័រទុយហ្គាល់"
    >
      {/* Tab bar */}
      <div className="mb-6 flex w-full snap-x gap-2 overflow-x-auto rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-1.5 no-scrollbar">
        {[
          { id: "explorer" as const, label: t("Word Explorer", "រុករកពាក្យ"), icon: BookOpen },
          { id: "quiz" as const, label: t("Quiz", "ល្បែងសាកល្បង"), icon: Award },
          { id: "analytics" as const, label: t("Analytics", "វិភាគទិន្នន័យ"), icon: PieChart },
        ].map((tb) => (
          <button
            key={tb.id}
            type="button"
            onClick={() => setActiveTab(tb.id)}
            className={`flex snap-start items-center gap-2 whitespace-nowrap rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
              activeTab === tb.id
                ? "bg-[var(--ground-raised-hi)] text-[var(--ink)] shadow-sm ring-1 ring-[var(--gold)]"
                : "text-[var(--ink-dim)] hover:bg-[var(--ground-raised-hi)] hover:text-[var(--ink)]"
            }`}
          >
            <tb.icon size={16} className={activeTab === tb.id ? "text-[var(--gold)]" : "text-[var(--ink-faint)]"} />
            {tb.label}
          </button>
        ))}
      </div>

      {/* EXPLORER TAB */}
      {activeTab === "explorer" && (
        <div className="space-y-5">
          {/* Search & Filter Bar */}
          <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-faint)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("Search by Khmer script, romanization, or origin…", "ស្វែងរកតាមពាក្យខ្មែរ, អក្សរឡាតាំង, ឬប្រភពដើម…")}
                className="w-full rounded-md border border-[var(--ground-line)] bg-[var(--ground)] py-2.5 pl-10 pr-10 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] focus:border-[var(--gold-dim)]"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--ink-faint)] hover:text-[var(--ink)]">
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedOrigin("all")}
                className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
                  selectedOrigin === "all"
                    ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--ground)]"
                    : "border-[var(--ground-line)] bg-[var(--ground)] text-[var(--ink-dim)] hover:text-[var(--ink)]"
                }`}
              >
                {t("All Origins", "គ្រប់ប្រភពដើម")}
              </button>
              {Object.entries(ORIGIN_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedOrigin(key)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
                    selectedOrigin === key
                      ? "border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold)]"
                      : "border-[var(--ground-line)] bg-[var(--ground)] text-[var(--ink-dim)] hover:text-[var(--ink)]"
                  }`}
                >
                  {cfg.icon} {t(cfg.en, cfg.km)}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 border-t border-[var(--ground-line)] pt-3">
              <button
                type="button"
                onClick={() => setOnlyBookmarks(!onlyBookmarks)}
                className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
                  onlyBookmarks
                    ? "border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold)]"
                    : "border-[var(--ground-line)] bg-[var(--ground)] text-[var(--ink-dim)] hover:text-[var(--ink)]"
                }`}
              >
                <Bookmark size={13} fill={onlyBookmarks ? "currentColor" : "none"} />
                {t(`Saved (${bookmarks.length})`, `រក្សាទុក (${bookmarks.length})`)}
              </button>
              <div className="ml-auto flex items-center rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`rounded-md px-2 py-1.5 text-xs transition ${
                    viewMode === "grid" ? "bg-[var(--gold)]/15 text-[var(--gold)]" : "text-[var(--ink-faint)]"
                  }`}
                >
                  <Grid size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`rounded-md px-2 py-1.5 text-xs transition ${
                    viewMode === "list" ? "bg-[var(--gold)]/15 text-[var(--gold)]" : "text-[var(--ink-faint)]"
                  }`}
                >
                  <List size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between text-xs font-medium text-[var(--ink-faint)] px-1">
            <span>{t(`Found ${filteredWords.length} loanwords`, `រកឃើញ ${filteredWords.length} ពាក្យ`)}</span>
            {(selectedOrigin !== "all" || searchQuery || onlyBookmarks) && (
              <button
                type="button"
                onClick={() => { setSelectedOrigin("all"); setSearchQuery(""); setOnlyBookmarks(false); }}
                className="flex items-center gap-1 text-[var(--gold)] hover:underline"
              >
                <RotateCcw size={12} />
                {t("Clear Filters", "សម្អាតការជ្រើសរើស")}
              </button>
            )}
          </div>

          {/* Cards */}
          {filteredWords.length > 0 ? (
            <div className={
              viewMode === "grid"
                ? "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                : "space-y-3"
            }>
              {filteredWords.map((word) => {
                const cfg = ORIGIN_CONFIG[word.origin];
                const isBm = bookmarks.includes(word.id);
                return (
                  <div
                    key={word.id}
                    onClick={() => setSelectedWord(word)}
                    className="cursor-pointer rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 transition hover:border-[var(--gold-dim)] hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <span
                        className="inline-flex items-center gap-1 rounded-md border border-[var(--ground-line)] bg-[var(--ground)] px-2 py-0.5 text-[10px] font-bold text-[var(--ink-dim)]"
                      >
                        {cfg.icon}
                      </span>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={(e) => speakWord(word.khmer, e)}
                          className="rounded p-1.5 text-[var(--ink-faint)] transition hover:text-[var(--gold)] hover:bg-[var(--ground)]"
                          title={t("Listen", "អានសម្លេង")}
                        >
                          <Volume2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => toggleBookmark(word.id, e)}
                          className={`rounded p-1.5 transition ${isBm ? "text-[var(--gold)]" : "text-[var(--ink-faint)] hover:text-[var(--ink)]"}`}
                        >
                          <Bookmark size={14} fill={isBm ? "currentColor" : "none"} />
                        </button>
                      </div>
                    </div>
                    <div className="mb-2.5">
                      <h3 className="text-2xl font-bold text-[var(--ink)] font-khmer">{word.khmer}</h3>
                      <span className="font-mono-ui text-xs text-[var(--ink-faint)]">/{word.romanization}/</span>
                    </div>
                    <p className="text-sm font-medium text-[var(--ink-dim)] mb-2.5 line-clamp-2">
                      {t(word.meaningEn, word.meaningKm)}
                    </p>
                    <div className="rounded-md border border-[var(--ground-line)] bg-[var(--ground)] p-2.5 mb-2.5 font-mono-ui text-xs text-[var(--ink-dim)]">
                      <span className="block text-[10px] uppercase tracking-wider text-[var(--ink-faint)]">
                        {t("Root Etymology", "ឫសគល់ដើម")}
                      </span>
                      <span className="font-semibold text-[var(--ink)]">{word.originWord}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-[var(--ground-line)] pt-2 text-[11px] text-[var(--ink-faint)]">
                      <span>{DOMAIN_CONFIG[word.domain]?.icon} {t(DOMAIN_CONFIG[word.domain]?.en, DOMAIN_CONFIG[word.domain]?.km)}</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[var(--ground-line)] p-10 text-center">
              <p className="text-sm font-semibold text-[var(--ink-dim)]">
                {t("No loanwords found", "មិនរកឃើញពាក្យដែលត្រូវគ្នា")}
              </p>
              <p className="mt-1 text-xs text-[var(--ink-faint)]">
                {t("Try adjusting your search or reset filters.", "សូមព្យាយាមផ្លាស់ប្តូរពាក្យស្វែងរក ឬសម្អាតតម្រង។")}
              </p>
            </div>
          )}
        </div>
      )}

      {/* QUIZ TAB */}
      {activeTab === "quiz" && (
        <div className="mx-auto max-w-xl space-y-5">
          <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6">
            <div className="mb-6 flex items-center justify-between border-b border-[var(--ground-line)] pb-4">
              <div className="flex items-center gap-2">
                <Award size={20} className="text-[var(--gold)]" />
                <h3 className="font-display text-lg font-bold text-[var(--ink)]">
                  {t("Loanword Origin Quiz", "សំណួរប្រភពដើមពាក្យកម្ចី")}
                </h3>
              </div>
              <span className="rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-3 py-1 font-mono-ui text-xs font-bold text-[var(--gold)]">
                {t(`Score: ${quizScore}`, `ពិន្ទុ: ${quizScore}`)}
              </span>
            </div>

            <div className="rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] p-5 text-center mb-5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-[var(--ink-faint)] block mb-1">
                {t(`Question #${quizIndex + 1}`, `សំណួរទី ${quizIndex + 1}`)}
              </span>
              <h2 className="font-khmer text-3xl font-bold text-[var(--ink)] mb-2">
                {LOANWORD_DATASET[quizIndex % LOANWORD_DATASET.length].khmer}
              </h2>
              <p className="text-sm text-[var(--ink-dim)]">
                "{t(
                  LOANWORD_DATASET[quizIndex % LOANWORD_DATASET.length].meaningEn,
                  LOANWORD_DATASET[quizIndex % LOANWORD_DATASET.length].meaningKm
                )}"
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 mb-5">
              {Object.entries(ORIGIN_CONFIG).map(([key, cfg]) => {
                const isCorrect = key === LOANWORD_DATASET[quizIndex % LOANWORD_DATASET.length].origin;
                const isSelected = selectedQuizOption === key;
                let cls = "border-[var(--ground-line)] bg-[var(--ground)] text-[var(--ink-dim)] hover:border-[var(--gold-dim)]";
                if (quizAnswered) {
                  if (isCorrect) cls = "border-[var(--success)]/40 bg-[var(--success)]/10 text-[var(--success)] font-bold";
                  else if (isSelected) cls = "border-[var(--danger)]/40 bg-[var(--danger)]/10 text-[var(--danger)]";
                }
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={quizAnswered}
                    onClick={() => {
                      setSelectedQuizOption(key);
                      setQuizAnswered(true);
                      if (isCorrect) setQuizScore((p) => p + 10);
                    }}
                    className={`rounded-lg border px-4 py-3 text-left text-sm font-semibold transition ${cls}`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{cfg.icon}</span>
                      {t(cfg.en, cfg.km)}
                    </span>
                  </button>
                );
              })}
            </div>

            {quizAnswered && (
              <div className="flex items-center justify-between border-t border-[var(--ground-line)] pt-4">
                <span className="text-xs font-semibold">
                  {selectedQuizOption === LOANWORD_DATASET[quizIndex % LOANWORD_DATASET.length].origin
                    ? <span className="text-[var(--success)]">{t("Correct! +10 pts", "ត្រឹមត្រូវ! +១០ ពិន្ទុ")}</span>
                    : <span className="text-[var(--danger)]">{t("Incorrect!", "មិនត្រឹមត្រូវ!")}</span>
                  }
                </span>
                <button
                  type="button"
                  onClick={() => { setQuizIndex((p) => p + 1); setQuizAnswered(false); setSelectedQuizOption(null); }}
                  className="flex items-center gap-2 rounded-md bg-[var(--gold)] px-4 py-2 text-xs font-semibold text-[#0a0c0d] transition hover:bg-[var(--gold-dim)]"
                >
                  {t("Next Question", "សំណួរបន្ទាប់")}
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === "analytics" && (
        <div className="space-y-5">
          <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6">
            <h3 className="mb-1 font-display text-lg font-semibold text-[var(--ink)]">
              {t("Etymological Breakdown", "ការបែងចែកប្រភពដើមនៃពាក្យកម្ចី")}
            </h3>
            <p className="mb-6 text-xs text-[var(--ink-faint)]">
              {t("Distribution of loanword origins in the verified database.", "ការបែងចែកប្រភពដើមពាក្យកម្ចីនៅក្នុងទិន្នន័យ។")}
            </p>
            <div className="space-y-4">
              {Object.entries(ORIGIN_CONFIG).map(([key, cfg]) => {
                const count = originStats[key] || 0;
                const pct = Math.round((count / LOANWORD_DATASET.length) * 100);
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-[var(--ink-dim)]">
                        <span>{cfg.icon}</span> {t(cfg.en, cfg.km)}
                      </span>
                      <span className="text-[var(--ink)]">{count} {t("words", "ពាក្យ")} ({pct}%)</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--ground-line)]">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: cfg.color }}
                      />
                    </div>
                    <div className="text-[10px] italic text-[var(--ink-faint)]">{cfg.era}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* WORD DETAIL MODAL */}
      {selectedWord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setSelectedWord(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedWord(null)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-[var(--ink-faint)] transition hover:bg-[var(--ground)] hover:text-[var(--ink)]"
            >
              <X size={18} />
            </button>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ground-line)] bg-[var(--ground)] px-2.5 py-1 text-xs font-bold text-[var(--ink-dim)]">
                {ORIGIN_CONFIG[selectedWord.origin].icon}{" "}
                {t(ORIGIN_CONFIG[selectedWord.origin].en, ORIGIN_CONFIG[selectedWord.origin].km)}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-faint)]">
                {DOMAIN_CONFIG[selectedWord.domain]?.icon}{" "}
                {t(DOMAIN_CONFIG[selectedWord.domain]?.en, DOMAIN_CONFIG[selectedWord.domain]?.km)}
              </span>
            </div>

            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-khmer text-4xl font-bold text-[var(--ink)]">{selectedWord.khmer}</h2>
                <p className="mt-1 font-mono-ui text-sm text-[var(--ink-faint)]">
                  /{selectedWord.romanization}/ &bull; IPA: {selectedWord.ipa}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => speakWord(selectedWord.khmer, e)}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[var(--gold)] px-3 py-2 text-xs font-semibold text-[#0a0c0d] transition hover:bg-[var(--gold-dim)]"
              >
                <Volume2 size={14} />
                {t("Listen", "អានសម្លេង")}
              </button>
            </div>

            <div className="mb-4 rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] p-4">
              <span className="text-[10px] font-medium uppercase tracking-widest text-[var(--ink-faint)]">
                {t("Meaning", "អត្ថន័យ")}
              </span>
              <p className="mt-1 text-sm font-semibold text-[var(--ink)]">
                {t(selectedWord.meaningEn, selectedWord.meaningKm)}
              </p>
            </div>

            <div className="mb-4">
              <span className="text-[10px] font-medium uppercase tracking-widest text-[var(--ink-faint)]">
                {t("Root Etymology", "ឫសគល់ដើម")}
              </span>
              <div className="mt-1.5 rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] p-3">
                <div className="font-mono-ui text-sm font-bold text-[var(--ink)]">{selectedWord.originWord}</div>
                <p className="mt-1 text-xs text-[var(--ink-faint)]">
                  {t("Historical Era:", "សម័យកាល៖")} {ORIGIN_CONFIG[selectedWord.origin].era}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <span className="text-[10px] font-medium uppercase tracking-widest text-[var(--ink-faint)]">
                {t("Linguistic Evolution", "កំណត់សម្គាល់ភាសាសាស្ត្រ")}
              </span>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink-dim)]">
                {t(selectedWord.noteEn, selectedWord.noteKm)}
              </p>
            </div>

            <div className="border-t border-[var(--ground-line)] pt-3 text-xs text-[var(--ink-faint)]">
              {t("Source:", "ប្រភព៖")} <strong className="text-[var(--ink-dim)]">{selectedWord.source}</strong>
            </div>
          </div>
        </div>
      )}
    </ToolShell>
  );
}
