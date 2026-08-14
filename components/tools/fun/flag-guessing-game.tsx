"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Flag, Home, Lightbulb, RotateCcw, Trophy } from "lucide-react";
import { ToolShell } from "@/components/ui/Shell";
import { useLanguage } from "@/components/LanguageProvider";

type Continent = "Asia" | "Europe" | "Africa" | "Americas" | "Oceania";
interface Country {
  en: string;
  km: string;
  cont: Continent;
}

const COUNTRY_DB: Record<string, Country> = {
  AF: { en: "Afghanistan", km: "អាហ្វហ្គានីស្ថាន", cont: "Asia" },
  AL: { en: "Albania", km: "អាល់បានី", cont: "Europe" },
  DZ: { en: "Algeria", km: "អាល់ហ្សេរី", cont: "Africa" },
  AD: { en: "Andorra", km: "អង់ដូរ៉ា", cont: "Europe" },
  AO: { en: "Angola", km: "អង់ហ្គោឡា", cont: "Africa" },
  AG: { en: "Antigua and Barbuda", km: "អង់ទីហ្គា និងបាប៊ុយដា", cont: "Americas" },
  AR: { en: "Argentina", km: "អាហ្សង់ទីន", cont: "Americas" },
  AM: { en: "Armenia", km: "អាមេនី", cont: "Asia" },
  AU: { en: "Australia", km: "អូស្ត្រាលី", cont: "Oceania" },
  AT: { en: "Austria", km: "អូទ្រីស", cont: "Europe" },
  AZ: { en: "Azerbaijan", km: "អាស៊ែបៃហ្សង់", cont: "Asia" },
  BS: { en: "Bahamas", km: "បាហាម៉ា", cont: "Americas" },
  BH: { en: "Bahrain", km: "បារ៉ែន", cont: "Asia" },
  BD: { en: "Bangladesh", km: "បង់ក្លាដែស", cont: "Asia" },
  BB: { en: "Barbados", km: "បាបាដុស", cont: "Americas" },
  BY: { en: "Belarus", km: "បេឡារុស្ស", cont: "Europe" },
  BE: { en: "Belgium", km: "បែលហ្ស៊ិក", cont: "Europe" },
  BZ: { en: "Belize", km: "បេលីស", cont: "Americas" },
  BJ: { en: "Benin", km: "បេណាំង", cont: "Africa" },
  BT: { en: "Bhutan", km: "ភូតាន", cont: "Asia" },
  BO: { en: "Bolivia", km: "បូលីវី", cont: "Americas" },
  BA: { en: "Bosnia and Herzegovina", km: "បូស្នីនិងហឺហ្សេហ្គោវីណា", cont: "Europe" },
  BW: { en: "Botswana", km: "រូបូតស្វាណា", cont: "Africa" },
  BR: { en: "Brazil", km: "ប្រេស៊ីល", cont: "Americas" },
  BN: { en: "Brunei", km: "ប្រ៊ុយណេ", cont: "Asia" },
  BG: { en: "Bulgaria", km: "ប៊ុលហ្គារី", cont: "Europe" },
  BF: { en: "Burkina Faso", km: "ប៊ូគីណាហ្វាសូ", cont: "Africa" },
  BI: { en: "Burundi", km: "ប៊ូរុនឌី", cont: "Africa" },
  CV: { en: "Cabo Verde", km: "កាប់វែរ", cont: "Africa" },
  KH: { en: "Cambodia", km: "កម្ពុជា", cont: "Asia" },
  CM: { en: "Cameroon", km: "កាមេរូន", cont: "Africa" },
  CA: { en: "Canada", km: "កាណាដា", cont: "Americas" },
  CF: { en: "Central African Republic", km: "សាធារណរដ្ឋអាហ្វ្រិកកណ្តាល", cont: "Africa" },
  TD: { en: "Chad", km: "ឆាដ", cont: "Africa" },
  CL: { en: "Chile", km: "ស៊ីលី", cont: "Americas" },
  CN: { en: "China", km: "ចិន", cont: "Asia" },
  CO: { en: "Colombia", km: "កូឡុំប៊ី", cont: "Americas" },
  KM: { en: "Comoros", km: "កូម័រ", cont: "Africa" },
  CG: { en: "Congo (Brazzaville)", km: "កុងហ្គោ", cont: "Africa" },
  CD: { en: "Congo (Kinshasa)", km: "កុងហ្គោ (ឌីម៉ូក្រាទិក)", cont: "Africa" },
  CR: { en: "Costa Rica", km: "កូស្តារីកា", cont: "Americas" },
  HR: { en: "Croatia", km: "ក្រូអាត", cont: "Europe" },
  CU: { en: "Cuba", km: "គុយបា", cont: "Americas" },
  CY: { en: "Cyprus", km: "ស៊ីប", cont: "Asia" },
  CZ: { en: "Czechia", km: "ឆេក", cont: "Europe" },
  CI: { en: "Côte d'Ivoire", km: "កូតឌីវ័រ", cont: "Africa" },
  DK: { en: "Denmark", km: "ដាណឺម៉ាក", cont: "Europe" },
  DJ: { en: "Djibouti", km: "ជីប៊ូទី", cont: "Africa" },
  DM: { en: "Dominica", km: "ដូមីនីកា", cont: "Americas" },
  DO: { en: "Dominican Republic", km: "សាធារណរដ្ឋដូមីនិក", cont: "Americas" },
  EC: { en: "Ecuador", km: "អេក្វាទ័រ", cont: "Americas" },
  EG: { en: "Egypt", km: "អេហ្ស៊ីប", cont: "Africa" },
  SV: { en: "El Salvador", km: "អែលសាល់វ៉ាឌ័រ", cont: "Americas" },
  GQ: { en: "Equatorial Guinea", km: "ហ្គីណេអេក្វាទ័រ", cont: "Africa" },
  ER: { en: "Eritrea", km: "អេរីទ្រា", cont: "Africa" },
  EE: { en: "Estonia", km: "អេស្តូនី", cont: "Europe" },
  SZ: { en: "Eswatini", km: "អេស្តូវីនី", cont: "Africa" },
  ET: { en: "Ethiopia", km: "អេត្យូពី", cont: "Africa" },
  FJ: { en: "Fiji", km: "ហ្វីជី", cont: "Oceania" },
  FI: { en: "Finland", km: "ហ្វាំងឡង់", cont: "Europe" },
  FR: { en: "France", km: "បារាំង", cont: "Europe" },
  GA: { en: "Gabon", km: "ហ្គាបុង", cont: "Africa" },
  GM: { en: "Gambia", km: "ហ្គំប៊ី", cont: "Africa" },
  GE: { en: "Georgia", km: "ហ្សកហ្ស៊ី", cont: "Asia" },
  DE: { en: "Germany", km: "អាល្លឺម៉ង់", cont: "Europe" },
  GH: { en: "Ghana", km: "ហ្គាណា", cont: "Africa" },
  GR: { en: "Greece", km: "ក្រិក", cont: "Europe" },
  GD: { en: "Grenada", km: "ហ្គ្រេណាដា", cont: "Americas" },
  GT: { en: "Guatemala", km: "ក្វាតេម៉ាឡា", cont: "Americas" },
  GN: { en: "Guinea", km: "ហ្គីណេ", cont: "Africa" },
  GW: { en: "Guinea-Bissau", km: "ហ្គីណេប៊ីសូ", cont: "Africa" },
  GY: { en: "Guyana", km: "ហ្គីយ៉ាន", cont: "Americas" },
  HT: { en: "Haiti", km: "ហៃទី", cont: "Americas" },
  HN: { en: "Honduras", km: "ហុងឌូរ៉ាស", cont: "Americas" },
  HU: { en: "Hungary", km: "ហុងគ្រី", cont: "Europe" },
  IS: { en: "Iceland", km: "អ៊ីស្លង់", cont: "Europe" },
  IN: { en: "India", km: "ឥណ្ឌា", cont: "Asia" },
  ID: { en: "Indonesia", km: "ឥណ្ឌូនេស៊ី", cont: "Asia" },
  IR: { en: "Iran", km: "អ៊ីរ៉ង់", cont: "Asia" },
  IQ: { en: "Iraq", km: "អ៊ីរ៉ាក់", cont: "Asia" },
  IE: { en: "Ireland", km: "អៀរឡង់", cont: "Europe" },
  IL: { en: "Israel", km: "អ៊ីស្រាអែល", cont: "Asia" },
  IT: { en: "Italy", km: "អ៊ីតាលី", cont: "Europe" },
  JM: { en: "Jamaica", km: "ហ្សាម៉ាអ៊ីក", cont: "Americas" },
  JP: { en: "Japan", km: "ជប៉ុន", cont: "Asia" },
  JO: { en: "Jordan", km: "ហ្ស៊កដានី", cont: "Asia" },
  KZ: { en: "Kazakhstan", km: "កាហ្សាក់ស្ថាន", cont: "Asia" },
  KE: { en: "Kenya", km: "កេនយ៉ា", cont: "Africa" },
  KI: { en: "Kiribati", km: "គិរីបាទី", cont: "Oceania" },
  KP: { en: "North Korea", km: "កូរ៉េខាងជើង", cont: "Asia" },
  KR: { en: "South Korea", km: "កូរ៉េខាងត្បូង", cont: "Asia" },
  XK: { en: "Kosovo", km: "កូសូវ៉ូ", cont: "Europe" },
  KW: { en: "Kuwait", km: "កូវ៉ែត", cont: "Asia" },
  KG: { en: "Kyrgyzstan", km: "កៀហ្ស៊ីស៊ីស្ថាន", cont: "Asia" },
  LA: { en: "Laos", km: "ឡាវ", cont: "Asia" },
  LV: { en: "Latvia", km: "ឡាតវី", cont: "Europe" },
  LB: { en: "Lebanon", km: "លីបង់", cont: "Asia" },
  LS: { en: "Lesotho", km: "ឡេសូតូ", cont: "Africa" },
  LR: { en: "Liberia", km: "លីបេរីយ៉ា", cont: "Africa" },
  LY: { en: "Libya", km: "លីប៊ី", cont: "Africa" },
  LI: { en: "Liechtenstein", km: "លីចតិនស្តាញ", cont: "Europe" },
  LT: { en: "Lithuania", km: "លីទុយអានី", cont: "Europe" },
  LU: { en: "Luxembourg", km: "លុចសំបួ", cont: "Europe" },
  MG: { en: "Madagascar", km: "ម៉ាដាហ្គាស្ការ", cont: "Africa" },
  MW: { en: "Malawi", km: "ម៉ាឡាវី", cont: "Africa" },
  MY: { en: "Malaysia", km: "ម៉ាឡេស៊ី", cont: "Asia" },
  MV: { en: "Maldives", km: "ម៉ាល់ឌីវ", cont: "Asia" },
  ML: { en: "Mali", km: "ម៉ាលី", cont: "Africa" },
  MT: { en: "Malta", km: "ម៉ាល់តា", cont: "Europe" },
  MH: { en: "Marshall Islands", km: "កោះម៉ាសាល់", cont: "Oceania" },
  MR: { en: "Mauritania", km: "ម៉ូរីតានី", cont: "Africa" },
  MU: { en: "Mauritius", km: "ម៉ូរីស", cont: "Africa" },
  MX: { en: "Mexico", km: "ម៉ិកស៊ិក", cont: "Americas" },
  FM: { en: "Micronesia", km: "មីក្រូណេស៊ី", cont: "Oceania" },
  MD: { en: "Moldova", km: "ម៉ុលដូវ៉ា", cont: "Europe" },
  MC: { en: "Monaco", km: "ម៉ូណាកូ", cont: "Europe" },
  MN: { en: "Mongolia", km: "ម៉ុងហ្គោលី", cont: "Asia" },
  ME: { en: "Montenegro", km: "ម៉ុងតេណេហ្គ្រោ", cont: "Europe" },
  MA: { en: "Morocco", km: "ម៉ារ៉ុក", cont: "Africa" },
  MZ: { en: "Mozambique", km: "ម៉ូសំប៊ិក", cont: "Africa" },
  MM: { en: "Myanmar", km: "មីយ៉ាន់ម៉ា", cont: "Asia" },
  NA: { en: "Namibia", km: "ណាមីប៊ី", cont: "Africa" },
  NR: { en: "Nauru", km: "ណូរូ", cont: "Oceania" },
  NP: { en: "Nepal", km: "នេប៉ាល់", cont: "Asia" },
  NL: { en: "Netherlands", km: "ហូឡង់", cont: "Europe" },
  NZ: { en: "New Zealand", km: "នូវែលសេឡង់", cont: "Oceania" },
  NI: { en: "Nicaragua", km: "នីការ៉ាហ្គា", cont: "Americas" },
  NE: { en: "Niger", km: "នីហ្សេ", cont: "Africa" },
  NG: { en: "Nigeria", km: "នីហ្សេរីយ៉ា", cont: "Africa" },
  MK: { en: "North Macedonia", km: "ម៉ាសេដូនៀខាងជើង", cont: "Europe" },
  NO: { en: "Norway", km: "ន័រវែស", cont: "Europe" },
  OM: { en: "Oman", km: "អូម៉ង់", cont: "Asia" },
  PK: { en: "Pakistan", km: "ប៉ាគីស្ថាន", cont: "Asia" },
  PW: { en: "Palau", km: "ប៉ាឡាវ", cont: "Oceania" },
  PA: { en: "Panama", km: "ប៉ាណាម៉ា", cont: "Americas" },
  PG: { en: "Papua New Guinea", km: "ប៉ាពួញូវហ្គីណេ", cont: "Oceania" },
  PY: { en: "Paraguay", km: "ប៉ារ៉ាហ្គាយ", cont: "Americas" },
  PE: { en: "Peru", km: "ប៉េរូ", cont: "Americas" },
  PH: { en: "Philippines", km: "ហ្វីលីពីន", cont: "Asia" },
  PL: { en: "Poland", km: "ប៉ូឡូញ", cont: "Europe" },
  PT: { en: "Portugal", km: "ព័រទុយហ្គាល់", cont: "Europe" },
  QA: { en: "Qatar", km: "កាតា", cont: "Asia" },
  RO: { en: "Romania", km: "រូម៉ានី", cont: "Europe" },
  RU: { en: "Russia", km: "រុស្ស៊ី", cont: "Europe" },
  RW: { en: "Rwanda", km: "រវ៉ាន់ដា", cont: "Africa" },
  KN: { en: "Saint Kitts and Nevis", km: "សាំងគីតនិងណេវីស", cont: "Americas" },
  LC: { en: "Saint Lucia", km: "សាំងលូស៊ី", cont: "Americas" },
  VC: { en: "Saint Vincent and the Grenadines", km: "សាំងវ៉ាំងសង់", cont: "Americas" },
  WS: { en: "Samoa", km: "សាម័រ", cont: "Oceania" },
  SM: { en: "San Marino", km: "សាន់ម៉ារីណូ", cont: "Europe" },
  ST: { en: "Sao Tome and Principe", km: "សៅតូមេនិងប្រាំងស៊ីប", cont: "Africa" },
  SA: { en: "Saudi Arabia", km: "អារ៉ាប៊ីសាអូឌីត", cont: "Asia" },
  SN: { en: "Senegal", km: "សេណេហ្គាល់", cont: "Africa" },
  RS: { en: "Serbia", km: "ស៊ែប៊ី", cont: "Europe" },
  SC: { en: "Seychelles", km: "សីស្ហែល", cont: "Africa" },
  SL: { en: "Sierra Leone", km: "សៀរ៉ាឡេអូន", cont: "Africa" },
  SG: { en: "Singapore", km: "សិង្ហបុរី", cont: "Asia" },
  SK: { en: "Slovakia", km: "ស្លូវ៉ាគី", cont: "Europe" },
  SI: { en: "Slovenia", km: "ស្លូវេនី", cont: "Europe" },
  SB: { en: "Solomon Islands", km: "កោះសូឡូម៉ុន", cont: "Oceania" },
  SO: { en: "Somalia", km: "សូម៉ាលី", cont: "Africa" },
  ZA: { en: "South Africa", km: "អាហ្វ្រិកខាងត្បូង", cont: "Africa" },
  SS: { en: "South Sudan", km: "ស៊ូដង់ខាងត្បូង", cont: "Africa" },
  ES: { en: "Spain", km: "អេស្ប៉ាញ", cont: "Europe" },
  LK: { en: "Sri Lanka", km: "ស្រីលង្កា", cont: "Asia" },
  SD: { en: "Sudan", km: "ស៊ូដង់", cont: "Africa" },
  SR: { en: "Suriname", km: "សូរីណាម", cont: "Americas" },
  SE: { en: "Sweden", km: "ស៊ុយអែត", cont: "Europe" },
  CH: { en: "Switzerland", km: "ស្វីស", cont: "Europe" },
  SY: { en: "Syria", km: "ស៊ីរី", cont: "Asia" },
  TJ: { en: "Tajikistan", km: "តាជីគីស្ថាន", cont: "Asia" },
  TZ: { en: "Tanzania", km: "តង់ហ្សានី", cont: "Africa" },
  TH: { en: "Thailand", km: "ថៃ", cont: "Asia" },
  TL: { en: "Timor-Leste", km: "ទីម័រខាងកើត", cont: "Asia" },
  TG: { en: "Togo", km: "តូហ្គោ", cont: "Africa" },
  TO: { en: "Tonga", km: "តុងហ្គា", cont: "Oceania" },
  TT: { en: "Trinidad and Tobago", km: "ទ្រីនីដាត", cont: "Americas" },
  TN: { en: "Tunisia", km: "ទុយនេស៊ី", cont: "Africa" },
  TR: { en: "Turkey", km: "តួកគី", cont: "Asia" },
  TM: { en: "Turkmenistan", km: "តួកម៉េនីស្ថាន", cont: "Asia" },
  TV: { en: "Tuvalu", km: "ទូវ៉ាលូ", cont: "Oceania" },
  UG: { en: "Uganda", km: "អ៊ូហ្គង់ដា", cont: "Africa" },
  UA: { en: "Ukraine", km: "អ៊ុយក្រែន", cont: "Europe" },
  AE: { en: "United Arab Emirates", km: "អេមីរ៉ាតអារ៉ាប់រួម", cont: "Asia" },
  GB: { en: "United Kingdom", km: "ចក្រភពអង់គ្លេស", cont: "Europe" },
  US: { en: "United States", km: "សហរដ្ឋអាមេរិក", cont: "Americas" },
  UY: { en: "Uruguay", km: "អ៊ុយរូហ្គាយ", cont: "Americas" },
  UZ: { en: "Uzbekistan", km: "អ៊ូសបេគីស្ថាន", cont: "Asia" },
  VU: { en: "Vanuatu", km: "វ៉ានូអាទូ", cont: "Oceania" },
  VA: { en: "Vatican City", km: "វ៉ាទីកង់", cont: "Europe" },
  VE: { en: "Venezuela", km: "វេណេស៊ុយអេឡា", cont: "Americas" },
  VN: { en: "Vietnam", km: "វៀតណាម", cont: "Asia" },
  YE: { en: "Yemen", km: "យេម៉ែន", cont: "Asia" },
  ZM: { en: "Zambia", km: "សំប៊ី", cont: "Africa" },
  ZW: { en: "Zimbabwe", km: "ស៊ីមបាវ៉េ", cont: "Africa" },
  TW: { en: "Taiwan", km: "តៃវ៉ាន់", cont: "Asia" },
  HK: { en: "Hong Kong", km: "ហុងកុង", cont: "Asia" },
  MO: { en: "Macau", km: "ម៉ាកាវ", cont: "Asia" },
  PR: { en: "Puerto Rico", km: "ព័រតូរីកូ", cont: "Americas" },
  PS: { en: "Palestine", km: "ប៉ាឡេស្ទីន", cont: "Asia" },
  GL: { en: "Greenland", km: "ហ្គ្រីនឡិន", cont: "Americas" },
  CK: { en: "Cook Islands", km: "កោះគុក", cont: "Oceania" },
  NU: { en: "Niue", km: "នីវ៉េ", cont: "Oceania" },
  PF: { en: "French Polynesia", km: "ប៉ូលីនេស៊ីបារាំង", cont: "Oceania" },
  NC: { en: "New Caledonia", km: "នូវែលកេឡេដូនី", cont: "Oceania" },
  GU: { en: "Guam", km: "ហ្គាំ", cont: "Oceania" },
  AW: { en: "Aruba", km: "អារូបា", cont: "Americas" },
  BM: { en: "Bermuda", km: "ប៊ឺមូដា", cont: "Americas" },
  KY: { en: "Cayman Islands", km: "កោះកៃម៉ាន", cont: "Americas" },
  FO: { en: "Faroe Islands", km: "កោះហ្វារ៉ូ", cont: "Europe" },
  GI: { en: "Gibraltar", km: "ហ្ស៊ីប្រាល់តា", cont: "Europe" },
  VI: { en: "U.S. Virgin Islands", km: "កោះវឺជីនអាមេរិក", cont: "Americas" },
  VG: { en: "British Virgin Islands", km: "កោះវឺជីនអង់គ្លេស", cont: "Americas" },
};

const MAX_ROUNDS = 20;

type Mode = "world" | "Asia" | "Europe" | "Africa" | "Americas" | "alpha_A_M" | "alpha_N_Z";
type Screen = "menu" | "game" | "result";

const CONTINENTS: Record<Continent, { en: string; km: string }> = {
  Asia: { en: "Asia", km: "អាស៊ី" },
  Europe: { en: "Europe", km: "អឺរ៉ុប" },
  Africa: { en: "Africa", km: "អាហ្វ្រិក" },
  Americas: { en: "Americas", km: "អាមេរិក" },
  Oceania: { en: "Oceania", km: "អូសេអានី" },
};

interface HistoryItem {
  flag: string;
  guessed: string;
  isCorrect: boolean;
}

const MODES: { id: Mode; name: string; nameKm: string; desc: string; descKm: string; emoji: string; wide?: boolean }[] = [
  { id: "world", name: "All World", nameKm: "ពិភពលោកទាំងមូល", desc: "Guess flags from all over the world (Hardest)", descKm: "ទាយទង់ជាតិប្រទេសទាំងអស់នៅលើពិភពលោក (ពិបាកបំផុត)", emoji: "🌎", wide: true },
  { id: "Asia", name: "Asia", nameKm: "អាស៊ី", desc: "Asian countries", descKm: "ប្រទេសអាស៊ី", emoji: "🌏" },
  { id: "Europe", name: "Europe", nameKm: "អឺរ៉ុប", desc: "European countries", descKm: "ប្រទេសអឺរ៉ុប", emoji: "🏰" },
  { id: "Africa", name: "Africa", nameKm: "អាហ្វ្រិក", desc: "African countries", descKm: "ប្រទេសអាហ្វ្រិក", emoji: "🦁" },
  { id: "Americas", name: "Americas", nameKm: "អាមេរិក", desc: "North & South America", descKm: "អាមេរិកខាងជើង និងខាងត្បូង", emoji: "🌎" },
  { id: "alpha_A_M", name: "A – M", nameKm: "A – M", desc: "Sorted by English alphabet", descKm: "តម្រៀបតាមអក្ខរក្រមអង់គ្លេស", emoji: "A" },
  { id: "alpha_N_Z", name: "N – Z", nameKm: "N – Z", desc: "Sorted by English alphabet", descKm: "តម្រៀបតាមអក្ខរក្រមអង់គ្លេស", emoji: "Z" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function FlagGuessingGame() {
  const { mode: lang, text: t } = useLanguage();
  const [screen, setScreen] = useState<Screen>("menu");
  const [currentMode, setCurrentMode] = useState<Mode>("world");
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [pool, setPool] = useState<string[]>([]);
  const [available, setAvailable] = useState<string[]>([]);
  const [correctCode, setCorrectCode] = useState("");
  const [choices, setChoices] = useState<string[]>([]);
  const [answered, setAnswered] = useState(false);
  const [guessed, setGuessed] = useState<string>("");
  const [wasCorrect, setWasCorrect] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [flagLoaded, setFlagLoaded] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const roundsTotal = Math.min(MAX_ROUNDS, pool.length);

  const name = (code: string) => {
    const c = COUNTRY_DB[code];
    if (!c) return code;
    if (lang === "km") return c.km;
    if (lang === "bi") return `${c.km} — ${c.en}`;
    return c.en;
  };

  const poolForMode = (mode: Mode): string[] => {
    const codes = Object.keys(COUNTRY_DB);
    if (mode === "world") return codes;
    if (mode === "Asia" || mode === "Europe" || mode === "Africa" || mode === "Americas") {
      return codes.filter((c) => COUNTRY_DB[c].cont === mode);
    }
    if (mode === "alpha_A_M") return codes.filter((c) => /^[A-M]/i.test(COUNTRY_DB[c].en));
    if (mode === "alpha_N_Z") return codes.filter((c) => /^[N-Z]/i.test(COUNTRY_DB[c].en));
    return codes;
  };

  function startGame(mode: Mode) {
    const p = poolForMode(mode);
    const shuffled = shuffle(p);
    setCurrentMode(mode);
    setPool(shuffled);
    setAvailable(shuffled.slice(1));
    setRound(1);
    setScore(0);
    setHistory([]);
    setAnswered(false);
    setHintLevel(0);
    setShowHint(false);
    setScreen("game");
    if (shuffled.length > 0) loadQuestion(shuffled, shuffled[0]);
  }

  function loadQuestion(pool: string[], correct: string) {
    setCorrectCode(correct);
    const wrong = shuffle(pool.filter((c) => c !== correct)).slice(0, 3);
    setChoices(shuffle([correct, ...wrong]));
    setFlagLoaded(false);
    setHintLevel(0);
    setShowHint(false);
    setAnswered(false);
  }

  function nextRound() {
    if (round < roundsTotal) {
      const nextRound = round + 1;
      const nextCorrect = available[0];
      const nextAvail = available.slice(1);
      setRound(nextRound);
      setAvailable(nextAvail);
      setAnswered(false);
      setHintLevel(0);
      setShowHint(false);
      if (nextCorrect) loadQuestion(pool, nextCorrect);
    } else {
      setScreen("result");
    }
  }

  function handleAnswer(code: string) {
    if (answered) return;
    const correct = code === correctCode;
    setAnswered(true);
    setGuessed(code);
    setWasCorrect(correct);
    setShowHint(false);
    setHistory((h) => [...h, { flag: correctCode, guessed: code, isCorrect: correct }]);
    if (correct) setScore((s) => s + 1);
  }

  function goMenu() {
    setScreen("menu");
  }

  const cData = correctCode ? COUNTRY_DB[correctCode] : null;
  const progressPercent = roundsTotal ? ((round - 1) / roundsTotal) * 100 : 0;
  const accuracy = roundsTotal ? Math.round((score / roundsTotal) * 100) : 0;

  const hintText = useMemo(() => {
    if (!cData) return "";
    if (hintLevel >= 1 && hintLevel < 2) {
      const cont = CONTINENTS[cData.cont];
      return t(`Continent: ${cont.en}`, `ទ្វីប៖ ${cont.km}`);
    }
    if (hintLevel >= 2) {
      const letter = lang === "km" ? cData.km.charAt(0) : cData.en.charAt(0);
      return t(`Starts with: ${letter}`, `ផ្តើមដោយអក្សរ៖ ${letter}`);
    }
    return "";
  }, [cData, hintLevel, lang, t]);

  function toggleHint() {
    if (answered) return;
    if (!showHint) {
      setShowHint(true);
      setHintLevel(1);
    } else if (hintLevel === 1) {
      setHintLevel(2);
    }
  }

  return (
    <ToolShell
      title="Flag Guessing Game"
      khmerTitle="ល្បែងទាយទង់ជាតិ"
      description="Test your geography with this flag-guessing quiz. Choose a region — the whole world, a continent, or an alphabetical group — then identify the country from its flag. A hint button reveals the continent and first letter, and a final report shows your score, accuracy, and match history."
      descriptionKm="សាកល្បងចំណេះដឹងភូមិសាស្ត្ររបស់អ្នកជាមួយល្បែងទាយទង់ជាតិ។ ជ្រើសរើសតំបន់ — ពិភពលោកទាំងមូល ទ្វីប ឬក្រុមតាមអក្ខរក្រម — រួចស្គាល់ប្រទេសពីទង់ជាតិរបស់វា។ ប៊ូតុងជំនួយបង្ហាញទ្វីប និងអក្សរដើម ហើយរបាយការណ៍ចុងក្រោយបង្ហាញពិន្ទុ ភាពត្រឹមត្រូវ និងប្រវត្តិការលេង។"
    >
      {screen === "menu" && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="font-display text-xl font-semibold text-[var(--ink)]">{t("Choose a game mode", "ជ្រើសរើសកម្រិតលេង")}</h2>
            <p className="mt-1 text-sm text-[var(--ink-dim)]">{t("Select a region or category to play", "ជ្រើសរើសតំបន់ ឬប្រភេទដែលអ្នកចង់លេង")}</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => startGame(m.id)}
                className={`group relative flex items-center justify-between gap-3 overflow-hidden rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5 text-left transition hover:-translate-y-0.5 hover:border-[var(--gold-dim)] hover:shadow-lg ${m.wide ? "md:col-span-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700" : ""}`}
              >
                <div className="min-w-0">
                  <h3 className={`font-bold ${m.wide ? "text-xl text-white" : "text-base text-[var(--ink)]"}`}>{t(m.name, m.nameKm)}</h3>
                  <p className={`mt-0.5 text-xs ${m.wide ? "text-blue-100" : "text-[var(--ink-dim)]"}`}>{t(m.desc, m.descKm)}</p>
                  <p className={`mt-1 text-[11px] font-semibold ${m.wide ? "text-blue-200" : "text-[var(--ink-faint)]"}`}>
                    {poolForMode(m.id).length} {t("countries", "ប្រទេស")}
                  </p>
                </div>
                <span className={`shrink-0 rounded-xl p-3 text-3xl ${m.wide ? "bg-white/10" : "bg-[var(--ground)]"}`}>{m.emoji}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {screen === "game" && (
        <div className="space-y-5">
          {/* Header stats */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={goMenu} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-xs font-semibold text-[var(--ink-dim)] transition hover:bg-[var(--ground-raised-hi)] hover:text-[var(--ink)]">
              <Home size={14} /> {t("Menu", "ម៉ឺនុយ")}
            </button>
            <div className="flex items-center gap-3 text-sm font-semibold text-[var(--ink-dim)]">
              <span>{t("Round", "ជុំ")} {round}/{roundsTotal}</span>
              <span className="flex items-center gap-1 text-[var(--gold)]"><Trophy size={15} /> {score}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--ground-line)]">
            <div className="h-full rounded-full bg-[var(--gold)] transition-all duration-300" style={{ width: `${progressPercent}%` }} />
          </div>

          <div className="rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6">
            <div className="relative flex min-h-[200px] items-center justify-center">
              <button
                type="button"
                onClick={toggleHint}
                disabled={answered}
                title={t("Hint", "ជំនួយ")}
                className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--ground-line)] bg-[var(--ground)] text-lg text-[var(--gold)] transition hover:bg-[var(--ground-raised-hi)] disabled:opacity-40"
              >
                <Lightbulb size={18} />
              </button>

              {showHint && hintText && (
                <div className="absolute right-0 top-12 z-10 max-w-[220px] rounded-xl border border-[var(--ground-line)] bg-[var(--ground)] px-4 py-3 text-sm text-[var(--ink)] shadow-xl">
                  {hintText}
                </div>
              )}

              {!flagLoaded && cData && (
                <div className="absolute inset-0 flex animate-pulse items-center justify-center rounded-2xl bg-[var(--ground)] text-sm text-[var(--ink-faint)]">
                  {t("Loading flag…", "កំពុងផ្ទុកទង់…")}
                </div>
              )}
              {cData && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`https://flagcdn.com/w320/${correctCode.toLowerCase()}.png`}
                  alt={t("Country flag", "ទង់ជាតិ")}
                  onLoad={() => setFlagLoaded(true)}
                  onError={() => setFlagLoaded(true)}
                  className="max-h-[220px] rounded-xl border border-[var(--ground-line)] object-contain"
                />
              )}
            </div>

            <h2 className="mt-6 text-center text-lg font-semibold text-[var(--ink)]">
              {t("Which country does this flag belong to?", "តើនេះជាទង់ជាតិនៃប្រទេសមួយណា?")}
            </h2>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {choices.map((code) => {
                const isCorrectChoice = code === correctCode;
                const isGuessed = code === guessed;
                let cls = "border-[var(--ground-line)] bg-[var(--ground)] text-[var(--ink)] hover:border-[var(--gold-dim)] hover:bg-[var(--ground-raised-hi)]";
                if (answered) {
                  if (isCorrectChoice) cls = "border-[var(--success)] bg-[var(--success)] text-white";
                  else if (isGuessed && !wasCorrect) cls = "border-[var(--danger)] bg-[var(--danger)] text-white";
                  else cls = "border-[var(--ground-line)] bg-[var(--ground)] text-[var(--ink-faint)] opacity-60";
                }
                return (
                  <button
                    key={code}
                    type="button"
                    disabled={answered}
                    onClick={() => handleAnswer(code)}
                    className={`flex min-h-[56px] items-center justify-center rounded-xl border-2 px-4 py-3 text-center font-semibold leading-tight transition ${cls}`}
                  >
                    {name(code)}
                  </button>
                );
              })}
            </div>

            {answered && (
              <div className="mt-5 flex flex-col items-center justify-between gap-4 rounded-xl border border-[var(--ground-line)] bg-[var(--ground)] p-4 sm:flex-row">
                <div className="flex items-center gap-3 text-center sm:text-left">
                  <span className="text-3xl">{wasCorrect ? "🎉" : "❌"}</span>
                  <div>
                    <p className={`font-bold ${wasCorrect ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>{wasCorrect ? t("Correct!", "ត្រឹមត្រូវ!") : t("Wrong!", "ខុសហើយ!")}</p>
                    {cData && <p className="text-sm text-[var(--ink-dim)]">{cData.km} — {cData.en}</p>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={nextRound}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--gold)] px-6 py-2.5 text-sm font-bold text-[#0a0c0d] transition hover:brightness-110"
                >
                  {round < roundsTotal ? t("Next round", "បន្តទៅមុខទៀត") : t("See results", "មើលលទ្ធផល")} <ArrowRight size={15} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {screen === "result" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-8 text-center">
            <div className="text-6xl">🏆</div>
            <h2 className="mt-4 font-display text-2xl font-bold text-[var(--ink)]">{t("Game over!", "បញ្ចប់ល្បែង!")}</h2>
            <p className="mt-1 text-sm text-[var(--ink-dim)]">{t("Here is your final result", "នេះជាលទ្ធផលរបស់អ្នក")}</p>
            <div className="mt-6 flex justify-center gap-6">
              <div className="min-w-[120px] rounded-2xl border border-[var(--ground-line)] bg-[var(--ground)] p-4">
                <span className="block text-xs font-medium text-[var(--ink-faint)]">{t("Final score", "ពិន្ទុសរុប")}</span>
                <span className="text-3xl font-bold text-[var(--ink)]">{score}/{roundsTotal}</span>
              </div>
              <div className="min-w-[120px] rounded-2xl border border-[var(--ground-line)] bg-[var(--ground)] p-4">
                <span className="block text-xs font-medium text-[var(--ink-faint)]">{t("Accuracy", "ភាពត្រឹមត្រូវ")}</span>
                <span className={`text-3xl font-bold ${accuracy >= 80 ? "text-[var(--success)]" : accuracy >= 50 ? "text-[var(--gold)]" : "text-[var(--danger)]"}`}>{accuracy}%</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-6">
            <h3 className="flex items-center gap-2 text-base font-bold text-[var(--ink)]"><Flag size={16} className="text-[var(--gold)]" /> {t("Match history", "ប្រវត្តិការលេង")}</h3>
            <div className="mt-4 flex flex-col gap-3">
              {history.map((h, i) => {
                const guessedName = COUNTRY_DB[h.guessed];
                return (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-[var(--ground-line)] bg-[var(--ground)] p-3">
                    <span className="w-6 text-center text-sm font-bold text-[var(--ink-faint)]">{i + 1}</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`https://flagcdn.com/w80/${h.flag.toLowerCase()}.png`} alt="" className="h-auto w-12 rounded border border-[var(--ground-line)]" />
                    <div className="min-w-0 flex-1">
                      <span className={`block truncate font-bold ${h.isCorrect ? "text-[var(--success)]" : "text-[var(--ink)]"}`}>{name(h.flag)}</span>
                      {!h.isCorrect && guessedName && <span className="block truncate text-xs text-[var(--danger)] line-through">{name(h.guessed)}</span>}
                    </div>
                    <span className="text-xl">{h.isCorrect ? "✅" : "❌"}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={goMenu} className="flex-1 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] py-3.5 text-sm font-bold text-[var(--ink)] transition hover:bg-[var(--ground-raised-hi)]">
              {t("Main menu", "ម៉ឺនុយដើម")}
            </button>
            <button type="button" onClick={() => startGame(currentMode)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--gold)] py-3.5 text-sm font-bold text-[#0a0c0d] transition hover:brightness-110">
              <RotateCcw size={15} /> {t("Play again", "លេងម្ដងទៀត")}
            </button>
          </div>
        </div>
      )}
    </ToolShell>
  );
}
