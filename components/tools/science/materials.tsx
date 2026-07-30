'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, Globe, X, Layers, Shield, Sparkles, Zap, 
  Droplet, Flame, Wind, Mountain, Bookmark,
  Moon, Sun, Copy, Check, Grid, List, Scale, Cpu, Leaf, ArrowRight,
  FlaskConical, Atom, RefreshCw, ChevronRight, Eye, Maximize2, RotateCcw,
  Volume2, VolumeX, Award, HelpCircle, Play, Sliders, Activity, Box, Plus, Hammer,
  Wrench, Thermometer, Info, FileText
} from 'lucide-react';
import { useLanguage } from "@/components/LanguageProvider";

const uiTranslations: Record<string, Record<string, string>> = {
  km: {
    appTitle: 'សារធាតុផែនដី & អាតូម 3D Pro',
    appSubtitle: 'បណ្ណាល័យសារធាតុទំនើប, តារាងខួប 3D, និងបន្ទប់ពិសោធន៍គីមី',
    searchPlaceholder: 'ស្វែងរកសារធាតុ, រូបមន្ត ឬធាតុគីមី (ឧ. មាស, C, Fe, PE, Wood, Aerogel)...',
    tabMaterials: 'បណ្ណាល័យសារធាតុ (Materials)',
    tabPeriodic: 'តារាងខួប 3D (Periodic Table)',
    tabCrafting: 'បន្ទប់ផ្សំសារធាតុ (Synthesizer)',
    tabQuiz: 'តេស្តចំណេះដឹង (Quiz)',
    allCategories: 'ទាំងអស់',
    metals: 'លោហៈ',
    alloys: 'លោហៈលាយ',
    plastics: 'ប្លាស្ទិក',
    advanced: 'បច្ចេកវិទ្យាខ្ពស់',
    natural: 'ធម្មជាតិ & សរីរាង្គ',
    ceramics: 'សេរ៉ាមិច & កញ្ចក់',
    minerals: 'រ៉ែ & ត្បូង',
    properties: 'លក្ខណៈសម្បត្តិ key',
    applications: 'ការប្រើប្រាស់',
    techData: 'ព័ត៌មានបច្ចេកទេស',
    density: 'ដង់ស៊ីតេ',
    meltingPoint: 'ចំណុចរលាយ',
    hardness: 'កម្រិតរឹង (Mohs)',
    recyclable: 'ការកែច្នៃ',
    close: 'បិទ',
    noResults: 'រកមិនឃើញសារធាតុ ឬធាតុគីមីដែលអ្នកស្វែងរកទេ!',
    favorites: 'បានរក្សាទុក',
    compare: 'ប្រៀបធៀប',
    compareTitle: 'ប្រៀបធៀបសារធាតុ',
    selectToCompare: 'ជ្រើសរើស ២ សារធាតុដើម្បីប្រៀបធៀប',
    copyFormula: 'ចម្លងរូបមន្ត',
    copied: 'បានចម្លង!',
    viewMode: 'ទម្រង់បង្ហាញ',
    densityLabel: 'ដង់ស៊ីតេ',
    atomicNumber: 'លេខអាតូម',
    atomicMass: 'ម៉ាសអាតូម',
    group: 'ក្រុម',
    period: 'ខួប',
    category: 'ប្រភេទ',
    electronConfig: 'ការរៀបចំអេឡិចត្រុង',
    elementDetails: 'ព័ត៌មានលម្អិតនៃធាតុគីមី',
    view3DAtom: 'មើលអាតូម 3D',
    view3DLattice: 'រចនាសម្ព័ន្ធក្រឡាចត្រង្គ (3D Lattice)',
    shells: 'ស្រទាប់អេឡិចត្រុង',
    phase: 'ស្ថានភាព',
    discoveredBy: 'រកឃើញឆ្នាំ',
    dragToRotate: 'អូសដើម្បីបង្វិល 360°',
    radarChart: 'តារាងវិភាគលក្ខណៈសម្បត្តិ 5-Axis',
    craftingTitle: 'មន្ទីរពិសោធន៍ផ្សំសារធាតុ & សំយោគ (Crafting Lab)',
    craftingDesc: 'ជ្រើសរើសធាតុដើម ២ ឬច្រើនដើម្បីបង្កើតជាសារធាតុថ្មី ឬលោហៈធាតុលាយ',
    craftBtn: 'ផ្សំសារធាតុ (Synthesize)',
    clearCraft: 'សម្អាត',
    craftResult: 'លទ្ធផលនៃការផ្សំ',
    quizTitle: 'តេស្តប្រឡងចំណេះដឹងវិទ្យាសាស្ត្រ',
    quizScore: 'ពិន្ទុរបស់អ្នក',
    nextQuestion: 'សំណួរដកពិសោធន៍បន្ទាប់',
    soundEffects: 'សំឡេង (Sound)',
    speakTitle: 'អានឈ្មោះសារធាតុ',
    tempFilterLabel: 'សីតុណ្ហភាពតារាងខួប (°C)',
    gridGoogle3D: 'ទម្រង់តារាង 18 ជួរឈរ (Google 3D Style)',
    gridCompact: 'ទម្រង់បង្រួម (Compact Grid)',
  },
  en: {
    appTitle: 'Earth Materials & 3D Atom Pro',
    appSubtitle: 'Interactive Science Encyclopedia, Google-Style 3D Periodic Table & Synthesizer',
    searchPlaceholder: 'Search materials, formulas or elements (e.g. Gold, C, Fe, PE, Wood, Aerogel)...',
    tabMaterials: 'Materials Catalog',
    tabPeriodic: 'Periodic Table (3D)',
    tabCrafting: 'Synthesizer Lab',
    tabQuiz: 'Science Quiz',
    allCategories: 'All',
    metals: 'Metals',
    alloys: 'Alloys',
    plastics: 'Plastics',
    advanced: 'Advanced/Tech',
    natural: 'Natural & Bio',
    ceramics: 'Ceramics & Glass',
    minerals: 'Minerals & Gems',
    properties: 'Key Properties',
    applications: 'Applications',
    techData: 'Technical Specs',
    density: 'Density',
    meltingPoint: 'Melting Point',
    hardness: 'Hardness (Mohs)',
    recyclable: 'Recyclability',
    close: 'Close',
    noResults: 'No materials or elements match your search!',
    favorites: 'Saved',
    compare: 'Compare',
    compareTitle: 'Material Comparison',
    selectToCompare: 'Select 2 materials to compare side-by-side',
    copyFormula: 'Copy Formula',
    copied: 'Copied!',
    viewMode: 'View Mode',
    densityLabel: 'Density',
    atomicNumber: 'Atomic Number',
    atomicMass: 'Atomic Mass',
    group: 'Group',
    period: 'Period',
    category: 'Category',
    electronConfig: 'Electron Config',
    elementDetails: 'Chemical Element Details',
    view3DAtom: '3D Atom Model',
    view3DLattice: '3D Crystal Lattice',
    shells: 'Electron Shells',
    phase: 'Phase (STP)',
    discoveredBy: 'Discovery Year',
    dragToRotate: 'Drag to rotate 3D viewport 360°',
    radarChart: '5-Axis Property Radar Graph',
    craftingTitle: 'Material Synthesizer & Crafting Lab',
    craftingDesc: 'Select 2 base materials/elements to synthesize modern alloys or compounds',
    craftBtn: 'Synthesize Material',
    clearCraft: 'Clear All',
    craftResult: 'Synthesis Output',
    quizTitle: 'Earth Science & Materials Trivia Challenge',
    quizScore: 'Your Score',
    nextQuestion: 'Next Question',
    soundEffects: 'Sound FX',
    speakTitle: 'Pronounce Name',
    tempFilterLabel: 'Table Temperature (°C)',
    gridGoogle3D: '18-Column Standard Grid (Google 3D Style)',
    gridCompact: 'Compact Grid View',
  }
};

const materialsData = [
  // === ADVANCED / HIGH-TECH ===
  {
    id: 'tech1', category: 'advanced', name: { km: 'ក្រាហ្វែន', en: 'Graphene' }, symbol: 'C',
    spec: { density: '0.77 mg/m²', melting: '3800°C', hardness: '10+', recyclable: 'Experimental' },
    metrics: { hardness: 100, conductivity: 100, thermal: 98, density: 10, sustainability: 75 },
    latticeType: 'HEXAGONAL_2D', accent: 'from-emerald-600 to-teal-900 text-emerald-100', icon: Cpu,
    description: { km: 'ក្រាហ្វែនជាបណ្តាញកាបូនដែលមានកម្រាស់ត្រឹមមួយអាតូម។ វាជារូបធាតុរឹងមាំជាងគេលើលោក (រឹងជាងដែកថែប ២០០ ដង) និងចម្លងអគ្គិសនីបានលឿនបំផុត។', en: 'A single atomic layer of carbon. It is the strongest material known to humanity (200x stronger than steel) with extreme conductivity.' },
    properties: { km: ['រឹងមាំបំផុតលើលោក', 'ចម្លងអគ្គិសនីលឿនខ្លាំង', 'ស្ទើរតែថ្លា ១០០%', 'ទន់បត់បែនបាន'], en: ['Strongest material known', 'Ultra-fast electrical conductivity', '97.7% Transparent', 'Flexible'] },
    applications: { km: ['ថ្មសាកលឿនស៊េរីថ្មី', 'បន្ទះសៀគ្វី Quantum', 'ស្គ្រីនទូរស័ព្ទបត់បាន', 'សម្ភារៈអវកាស'], en: ['Next-gen fast-charging batteries', 'Quantum chips', 'Flexible displays', 'Aerospace composites'] }
  },
  {
    id: 'tech2', category: 'advanced', name: { km: 'អេរ៉ូជែល', en: 'Aerogel' }, symbol: 'SiO2 (99.8% Air)',
    spec: { density: '0.0011 g/cm³', melting: '1200°C', hardness: '2', recyclable: 'Eco-friendly' },
    metrics: { hardness: 20, conductivity: 5, thermal: 100, density: 2, sustainability: 90 },
    latticeType: 'AMORPHOUS_POROUS', accent: 'from-sky-500 to-indigo-800 text-sky-100', icon: Wind,
    description: { km: 'អេរ៉ូជែល ឬ "ផ្សែងកក" គឺជាសារធាតុរឹងស្រាលជាងគេបំផុតលើផែនដី ផ្សំឡើងពីខ្យល់ ៩៩.៨% និងជាអ៊ីសូឡង់កម្តៅដ៏អស្ចារ្យបំផុត។', en: 'Known as "Frozen Smoke", it is the lightest solid material on Earth (99.8% air) and an extraordinary thermal insulator.' },
    properties: { km: ['ទម្ងន់ស្រាលបំផុត (៩៩.៨% ខ្យល់)', 'អ៊ីសូឡង់កម្តៅខ្ពស់បំផុត', 'ទប់ទល់កម្តៅបាន ២០០០°C', 'ថ្លាស្រពោន'], en: ['Ultra-lightweight', 'Extreme thermal insulation', 'Withstands up to 2000°C', 'Translucent'] },
    applications: { km: ['អាវអវកាស NASA', 'ផ្ទាំងការពារកម្តៅរ៉ូកែត', 'អ៊ីសូឡង់អាគារទំនើប', 'ការចាប់យកធូលីផ្កាយ'], en: ['NASA spacesuits', 'Rocket heat shields', 'Super-insulated buildings', 'Space dust capture'] }
  },
  {
    id: 'tech3', category: 'advanced', name: { km: 'ស៊ីលីកូន', en: 'Silicon' }, symbol: 'Si',
    spec: { density: '2.329 g/cm³', melting: '1414°C', hardness: '6.5', recyclable: 'High' },
    metrics: { hardness: 65, conductivity: 70, thermal: 75, density: 30, sustainability: 85 },
    latticeType: 'DIAMOND_CUBIC', accent: 'from-slate-600 to-cyan-900 text-cyan-200', icon: Cpu,
    description: { km: 'ស៊ីលីកូនគឺជាអឌ្ឍចម្លង (Semiconductor) ដ៏សំខាន់បំផុត ក្នុងការបង្កើតបន្ទះឈីបកុំព្យូទ័រ និងបច្ចេកវិទ្យាឌីជីថលទូទាំងពិភពលោក។', en: 'The bedrock semiconductor element that powers all modern computer chips, microprocessors, and digital technology.' },
    properties: { km: ['អឌ្ឍចម្លងអគ្គិសនី (Semiconductor)', 'សម្បូរបែបលើសំបកផែនដី', 'បង្កើតគ្រីស្តាល់រឹង'], en: ['Semiconductor', 'Abundant in Earth crust', 'Stable crystal structure'] },
    applications: { km: ['បន្ទះឈីប CPU/GPU', 'បន្ទះសូឡា (Solar Cells)', 'គ្រឿងអេឡិចត្រូនិក', 'សែនស័រអុបទិក'], en: ['Microchips & Processors', 'Solar panels', 'Smartphones & Electronics', 'Optical sensors'] }
  },
  {
    id: 'tech4', category: 'advanced', name: { km: 'សរសៃកាបូន', en: 'Carbon Fiber' }, symbol: 'C-Composite',
    spec: { density: '1.75 g/cm³', melting: '3500°C', hardness: '8', recyclable: 'Specialized' },
    metrics: { hardness: 85, conductivity: 40, thermal: 80, density: 25, sustainability: 60 },
    latticeType: 'FIBER_MATRIX', accent: 'from-zinc-800 to-black text-gray-200', icon: Layers,
    description: { km: 'សរសៃកាបូនជាសម្ភារៈស្រាល ប៉ុន្តែមានកម្លាំងរឹងមាំខ្លាំង ត្រូវបានប្រើប្រាស់ក្នុងរថយន្តប្រណាំង និងយន្តហោះ។', en: 'A high-strength, lightweight composite material consisting of thin carbon crystals embedded in resin.' },
    properties: { km: ['ស្រាលខ្លាំង ប៉ុន្តែរឹងមាំ', 'ធន់នឹងកម្លាំងទាញ', 'មិនច្រេះ', 'រូបរាងទំនើប'], en: ['Ultra-light & rigid', 'High tensile strength', 'Corrosion proof', 'Sleek appearance'] },
    applications: { km: ['រថយន្តប្រណាំង F1', 'យន្តហោះ Boeing 787', 'កង់ប្រណាំង', 'ដងវាយកូនហ្គោល'], en: ['F1 Racing cars', 'Boeing 787 aircraft', 'High-end bicycles', 'Golf clubs'] }
  },
  {
    id: 'tech5', category: 'advanced', name: { km: 'នីទីណូល (លោហៈចងចាំរូបរាង)', en: 'Nitinol (Shape Memory)' }, symbol: 'Ni-Ti',
    spec: { density: '6.45 g/cm³', melting: '1310°C', hardness: '6', recyclable: 'Medium' },
    metrics: { hardness: 60, conductivity: 35, thermal: 40, density: 55, sustainability: 70 },
    latticeType: 'MARTENSITE_AUSTENITE', accent: 'from-indigo-600 to-blue-900 text-indigo-100', icon: RefreshCw,
    description: { km: 'នីទីណូលគឺជាលោហៈធាតុលាយរវាងនីកែល និងទីតាញ៉ូម ដែលអាចត្រឡប់ទៅមករូបរាងដើមវិញនៅពេលទទួលបានកម្តៅ។', en: 'A shape-memory alloy of nickel and titanium that remembers its original shape when heated.' },
    properties: { km: ['ចងចាំរូបរាងដើម (Shape Memory)', 'យឺតខ្លាំង (Superelasticity)', 'ធន់នឹងការហត់នឿយលោហៈ'], en: ['Shape memory effect', 'Superelasticity', 'High fatigue resistance'] },
    applications: { km: ['ស្តង់បំពង់ឈាមបេះដូង', 'ដែកពត់ធ្មេញ', 'សែនស័រកម្តៅ', 'រ៉ូបូតសាច់ដុំ'], en: ['Medical stents', 'Orthodontic archwires', 'Thermal sensors', 'Robotic actuators'] }
  },
  {
    id: 'tech6', category: 'advanced', name: { km: 'កាបូនណាណូទីត', en: 'Carbon Nanotubes' }, symbol: 'CNT',
    spec: { density: '1.3 g/cm³', melting: '3650°C', hardness: '10+', recyclable: 'Experimental' },
    metrics: { hardness: 100, conductivity: 95, thermal: 100, density: 15, sustainability: 60 },
    latticeType: 'NANOTUBE_CYLINDER', accent: 'from-purple-800 to-slate-900 text-purple-200', icon: Atom,
    description: { km: 'បំពង់កាបូនកម្រិតណាណូដែលមានកម្លាំងទាញខ្ពស់ជាងគេបំផុត និងចម្លងកម្តៅបានល្អឥតខ្ចោះ។', en: 'Cylindrical molecules of carbon with exceptional tensile strength and thermal conductivity.' },
    properties: { km: ['កម្លាំងទាញខ្ពស់បំផុត', 'ចម្លងកម្តៅ និងអគ្គិសនី', 'ទម្ងន់ស្រាលស្រទន់'], en: ['Extreme tensile strength', 'Thermal & electrical conductor', 'Lightweight structure'] },
    applications: { km: ['ខ្សែយោងជណ្ដើរយន្តអវកាស', 'គ្រឿងបន្លាស់ណាណូ', 'ថ្មអាគុយជំនាន់ថ្មី'], en: ['Space elevator cables', 'Nano-electronics', 'Next-gen energy storage'] }
  },

  // === METALS ===
  {
    id: 'm1', category: 'metals', name: { km: 'ទង់ដែង', en: 'Copper' }, symbol: 'Cu',
    spec: { density: '8.96 g/cm³', melting: '1085°C', hardness: '3', recyclable: '100%' },
    metrics: { hardness: 35, conductivity: 98, thermal: 95, density: 75, sustainability: 95 },
    latticeType: 'FCC', accent: 'from-amber-600 to-red-800 text-amber-100', icon: Zap,
    description: { km: 'ទង់ដែងជាលោហៈទន់ ចម្លងអគ្គិសនី និងកម្តៅបានល្អឥតខ្ចោះ មានពណ៌ក្រហមទង់ដែងដ៏ស្រស់ស្អាត។', en: 'A ductile metal with extremely high electrical and thermal conductivity, featuring a distinct reddish hue.' },
    properties: { km: ['ចម្លងអគ្គិសនីខ្ពស់បំផុត', 'ធន់នឹងការច្រេះ', 'សម្លាប់បាក់តេរីដោយស្វ័យប្រវត្តិ'], en: ['High conductivity', 'Corrosion resistant', 'Natural antimicrobial'] },
    applications: { km: ['ខ្សែភ្លើង & ខ្សែកាប', 'បំពង់ទឹក', 'ម៉ូទ័រអគ្គិសនី EV', 'បន្ទះសៀគ្វី'], en: ['Electrical wiring', 'Plumbing', 'EV Motors', 'Circuit boards'] }
  },
  {
    id: 'm2', category: 'metals', name: { km: 'មាស', en: 'Gold' }, symbol: 'Au',
    spec: { density: '19.30 g/cm³', melting: '1064°C', hardness: '2.5', recyclable: '100%' },
    metrics: { hardness: 25, conductivity: 85, thermal: 80, density: 98, sustainability: 99 },
    latticeType: 'FCC', accent: 'from-amber-400 to-yellow-700 text-amber-950', icon: Sparkles,
    description: { km: 'មាសជាលោហៈមានតម្លៃខ្ពស់ មិនច្រេះ ឬប្រែពណ៌ និងមានសមត្ថភាពចម្លងអគ្គិសនីយ៉ាងពិសេស។', en: 'A noble precious metal that never oxidizes or tarnishes, renowned for density, beauty, and conductivity.' },
    properties: { km: ['មិនច្រេះ ឬខ្មៅជានិច្ច', 'ងាយលូតជាបន្ទះស្តើង', 'ចម្លងសញ្ញាអេឡិចត្រូនិកច្បាស់'], en: ['Unreactive / Tarnish-proof', 'Highly malleable', 'Flawless signal conductor'] },
    applications: { km: ['គ្រឿងអលង្ការ', 'ជើងតំណភ្ជាប់អេឡិចត្រូនិក', 'ទុនបម្រុងជាតិ', 'កញ្ចក់មួកអវកាស'], en: ['Jewelry', 'Electronic connectors', 'Financial reserves', 'Astronaut visors'] }
  },
  {
    id: 'm3', category: 'metals', name: { km: 'ទីតាញ៉ូម', en: 'Titanium' }, symbol: 'Ti',
    spec: { density: '4.506 g/cm³', melting: '1668°C', hardness: '6', recyclable: 'High' },
    metrics: { hardness: 75, conductivity: 25, thermal: 30, density: 50, sustainability: 80 },
    latticeType: 'HCP', accent: 'from-slate-500 to-slate-800 text-slate-100', icon: Shield,
    description: { km: 'ទីតាញ៉ូមមានកម្លាំងរឹងមាំស្មើដែកថែប ប៉ុន្តែស្រាលជាង ៤៥% និងមិនច្រេះក្នុងទឹកសមុទ្រឡើយ។', en: 'Strong as steel but 45% lighter, featuring unmatched corrosion resistance in seawater and human body.' },
    properties: { km: ['រឹងមាំខ្លាំង ប៉ុន្តែស្រាល', 'មិនប្រតិកម្មក្នុងខ្លួនមនុស្ស', 'ធន់នឹងទឹកសមុទ្រ'], en: ['High strength-to-weight ratio', 'Biocompatible', 'Extreme corrosion resistance'] },
    applications: { km: ['យន្តហោះ និងយានអវកាស', 'ឆ្អឹងសិប្បនិម្មិត', 'ស៊ុមវ៉ែនតា', 'នាវាមុជទឹក'], en: ['Aerospace frames', 'Medical implants', 'Eyeglass frames', 'Submarines'] }
  },
  {
    id: 'm4', category: 'metals', name: { km: 'ប្រាក់', en: 'Silver' }, symbol: 'Ag',
    spec: { density: '10.49 g/cm³', melting: '961.8°C', hardness: '2.5', recyclable: '100%' },
    metrics: { hardness: 30, conductivity: 100, thermal: 100, density: 80, sustainability: 95 },
    latticeType: 'FCC', accent: 'from-slate-300 to-gray-500 text-slate-900', icon: Sparkles,
    description: { km: 'ប្រាក់ជាលោហៈដែលមានចម្លងអគ្គិសនី និងកម្តៅខ្ពស់ជាងគេបំផុតក្នុងចំណោមធាតុទាំងអស់លើផែនដី។', en: 'Silver boasts the absolute highest electrical conductivity, thermal conductivity, and reflectivity of all metals.' },
    properties: { km: ['ចម្លងអគ្គិសនីលេខ ១', 'ចម្លងកម្តៅលេខ ១', 'សម្លាប់មេរោគ'], en: ['Highest electrical conductor', 'Highest thermal conductor', 'Antibacterial'] },
    applications: { km: ['បន្ទះសូឡា', 'គ្រឿងអលង្ការ', 'កញ្ចក់ឆ្លុះស្ថាបត្យកម្ម', 'ឧបករណ៍ពេទ្យ'], en: ['Solar panels', 'Jewelry', 'Precision mirrors', 'Medical bandages'] }
  },
  {
    id: 'm5', category: 'metals', name: { km: 'អាលុយមីញ៉ូម', en: 'Aluminum' }, symbol: 'Al',
    spec: { density: '2.70 g/cm³', melting: '660.3°C', hardness: '2.75', recyclable: '100%' },
    metrics: { hardness: 30, conductivity: 65, thermal: 70, density: 30, sustainability: 98 },
    latticeType: 'FCC', accent: 'from-slate-400 to-zinc-600 text-slate-100', icon: Wind,
    description: { km: 'អាលុយមីញ៉ូមជាលោហៈស្រាល មិនងាយច្រេះ និងជាសម្ភារៈកែច្នៃឡើងវិញបានច្រើនជាងគេលើលោក។', en: 'A lightweight, non-magnetic metal with excellent corrosion resistance due to its natural oxide film.' },
    properties: { km: ['ស្រាល និងស្វិត', 'មិនច្រេះ', 'កែច្នៃចំណាយថាមពលតិច'], en: ['Lightweight & malleable', 'Corrosion proof', 'Infinite recyclability'] },
    applications: { km: ['កំប៉ុងភេសជ្ជៈ', 'ស៊ុមបង្អួច', 'តើយន្តហោះ', 'ខ្សែកាបភ្លើងតង់ស្យុងខ្ពស់'], en: ['Beverage cans', 'Window frames', 'Aircraft fuselages', 'Power grid cables'] }
  },
  {
    id: 'm6', category: 'metals', name: { km: 'តង់ស្តែន', en: 'Tungsten' }, symbol: 'W',
    spec: { density: '19.25 g/cm³', melting: '3422°C', hardness: '7.5', recyclable: 'High' },
    metrics: { hardness: 90, conductivity: 30, thermal: 50, density: 95, sustainability: 85 },
    latticeType: 'BCC', accent: 'from-gray-700 to-slate-900 text-slate-200', icon: Flame,
    description: { km: 'តង់ស្តែនជាលោហៈដែលមានចំណុចរលាយខ្ពស់ជាងគេបំផុត (៣៤២២°C) និងមានដង់ស៊ីតេស្ទើរស្មើផ្លាទីន។', en: 'Has the highest melting point of all elements (3,422°C) and remarkable hardness at high heat.' },
    properties: { km: ['ចំណុចរលាយខ្ពស់ដាច់គេ', 'រឹងមាំខ្លាំង', 'ធន់នឹងកម្តៅ'], en: ['Highest melting point', 'Extreme density', 'High heat stability'] },
    applications: { km: ['អំពូលភ្លើងខ្សែ', 'មុខស្វានកាត់លោហៈ', 'ក្បាលរ៉ូកែត', 'គ្រឿងការពារកាំរស្មី'], en: ['Incandescent filaments', 'Industrial cutting tools', 'Rocket nozzles', 'Radiation shielding'] }
  },

  // === ALLOYS ===
  {
    id: 'a1', category: 'alloys', name: { km: 'ដែកថែប', en: 'Steel' }, symbol: 'Fe + C',
    spec: { density: '7.85 g/cm³', melting: '1510°C', hardness: '7.5', recyclable: '100%' },
    metrics: { hardness: 80, conductivity: 20, thermal: 45, density: 70, sustainability: 95 },
    latticeType: 'BCC', accent: 'from-slate-700 to-gray-900 text-gray-200', icon: Layers,
    description: { km: 'ដែកថែបគឺជាលោហៈធាតុលាយរវាងដែក និងកាបូន។ វាជាឆ្អឹងខ្នងនៃហេដ្ឋារចនាសម្ព័ន្ធមនុស្សជាតិ។', en: 'An alloy of iron and carbon. It is the foundational structural backbone of modern infrastructure.' },
    properties: { km: ['កម្លាំងទាញខ្ពស់', 'រឹងមាំខ្លាំង', 'កែច្នៃឡើងវិញបាន ១០០%'], en: ['High tensile strength', 'Extremely durable', '100% Recyclable'] },
    applications: { km: ['អគារ និងស្ពាន', 'រថយន្ត និងកប៉ាល់', 'គ្រឿងម៉ាស៊ីន', 'ឧបករណ៍ប្រើប្រាស់'], en: ['Skyscrapers & Bridges', 'Cars and Ships', 'Heavy machinery', 'Hardware tools'] }
  },
  {
    id: 'a2', category: 'alloys', name: { km: 'ដែកអ៊ីណុក', en: 'Stainless Steel' }, symbol: 'Fe + Cr + Ni',
    spec: { density: '8.00 g/cm³', melting: '1450°C', hardness: '6.5', recyclable: '100%' },
    metrics: { hardness: 70, conductivity: 15, thermal: 25, density: 72, sustainability: 95 },
    latticeType: 'FCC', accent: 'from-slate-400 to-slate-700 text-slate-100', icon: Shield,
    description: { km: 'ដែកថែបមិនច្រេះដោយសារការបន្ថែមធាតុក្រូមីញ៉ូមយ៉ាងតិច ១០.៥% បង្កើតស្រទាប់ការពារអុកស៊ីត។', en: 'Corrosion-resistant steel alloy containing chromium, preventing rust and stains in moist environments.' },
    properties: { km: ['មិនច្រេះ', 'អនាម័យខ្ពស់', 'ងាយស្រួលលាងសម្អាត'], en: ['Rust resistant', 'Hygienic', 'Easy maintenance'] },
    applications: { km: ['ឧបករណ៍វះកាត់', 'ស្លាបព្រាចាន', 'ធុងផ្ទុកគីមី', 'គ្រឿងសង្ហារឹមសំណង់'], en: ['Surgical tools', 'Cutlery', 'Chemical vats', 'Architecture'] }
  },
  {
    id: 'a3', category: 'alloys', name: { km: 'លង្ហិន', en: 'Brass' }, symbol: 'Cu + Zn',
    spec: { density: '8.73 g/cm³', melting: '930°C', hardness: '3.5', recyclable: '100%' },
    metrics: { hardness: 40, conductivity: 60, thermal: 65, density: 75, sustainability: 90 },
    latticeType: 'FCC', accent: 'from-yellow-600 to-amber-800 text-amber-100', icon: Flame,
    description: { km: 'លង្ហិនជាលោហៈលាយទង់ដែង និងស័ង្កសី មានពណ៌លឿងភ្លឺ និងមិនបង្កើតផ្កាភ្លើងពេលប៉ះទង្គិច។', en: 'An alloy of copper and zinc with low friction, bright gold appearance, and non-sparking properties.' },
    properties: { km: ['មិនបង្កើតផ្កាភ្លើង', 'សូរសម្លេងល្អ', 'កកិតទាប'], en: ['Non-sparking', 'Acoustic resonance', 'Low friction'] },
    applications: { km: ['ក្បាលរ៉ូប៊ីណេ និងវ៉ាន', 'ឧបករណ៍តន្ត្រី (ត្រែ)', 'សោរទ្វារ', 'គ្រឿងតុបតែង'], en: ['Valves and taps', 'Brass instruments', 'Locks', 'Decor'] }
  },

  // === PLASTICS ===
  {
    id: 'p1', category: 'plastics', name: { km: 'ប៉ូលីអេទីឡែន (PE)', en: 'Polyethylene (PE)' }, symbol: 'PE',
    spec: { density: '0.95 g/cm³', melting: '120°C', hardness: '2', recyclable: 'Yes (Type 2/4)' },
    metrics: { hardness: 20, conductivity: 1, thermal: 10, density: 15, sustainability: 65 },
    latticeType: 'POLYMER_CHAIN', accent: 'from-cyan-600 to-teal-900 text-cyan-100', icon: Droplet,
    description: { km: 'PE គឺជាប្លាស្ទិកប្រៀបដូចជើងឯកដែលគេប្រើប្រាស់ច្រើនជាងគេបំផុតលើលោក សម្រាប់ធ្វើការវេចខ្ចប់។', en: 'The world’s most common plastic, used extensively for packaging, containers, and piping.' },
    properties: { km: ['ទម្ងន់ស្រាល និងស្វិត', 'មិនជ្រាបទឹក', 'មិនមានជាតិពុល'], en: ['Lightweight & flexible', 'Waterproof', 'Chemically inert'] },
    applications: { km: ['ថង់ប្លាស្ទិក', 'ដបទឹក', 'ទុយោទឹក PE', 'ប្រអប់ផ្ទុកអាហារ'], en: ['Plastic bags', 'Bottles', 'PE Pipes', 'Food containers'] }
  },
  {
    id: 'p2', category: 'plastics', name: { km: 'កេវឡា', en: 'Kevlar' }, symbol: 'Aramid',
    spec: { density: '1.44 g/cm³', melting: '450°C', hardness: '7', recyclable: 'Specialized' },
    metrics: { hardness: 75, conductivity: 2, thermal: 40, density: 20, sustainability: 50 },
    latticeType: 'ARAMID_FIBER', accent: 'from-yellow-600 to-amber-900 text-yellow-100', icon: Shield,
    description: { km: 'កេវឡាជាសរសៃសំយោគរឹងមាំជាងដែកថែប ៥ ដង (ធៀបទម្ងន់ស្មើគ្នា) ប្រើប្រាស់សម្រាប់ការពារជីវិត។', en: 'A heat-resistant synthetic fiber that is 5x stronger than steel on an equal weight basis.' },
    properties: { km: ['រឹងមាំជាងដែក ៥ ដង', 'ធន់នឹងការចាក់ធ្លុះ', 'មិនងាយឆេះ'], en: ['5x stronger than steel', 'Puncture resistant', 'Heat & flame resistant'] },
    applications: { km: ['អាវក្រោះការពារគ្រាប់', 'មួកសុវត្ថិភាពយោធា', 'សំបកកង់ប្រណាំង', 'ខ្សែពួរនាវា'], en: ['Body armor', 'Helmets', 'Racing tires', 'Mooring lines'] }
  },
  {
    id: 'p3', category: 'plastics', name: { km: 'តេផ្លុង (PTFE)', en: 'Teflon (PTFE)' }, symbol: 'PTFE',
    spec: { density: '2.20 g/cm³', melting: '327°C', hardness: '2.5', recyclable: 'Specialized' },
    metrics: { hardness: 25, conductivity: 1, thermal: 15, density: 25, sustainability: 45 },
    latticeType: 'POLYMER_FLUORO', accent: 'from-slate-700 to-black text-slate-100', icon: Shield,
    description: { km: 'តេផ្លុងជាផ្លាស្ទិកកកិតទាបបំផុតលើលោក មិនជាប់ស្អិត និងធន់នឹងអាស៊ីតគីមីយ៉ាងខ្លាំង។', en: 'A synthetic fluoropolymer with one of the lowest friction coefficients against any solid.' },
    properties: { km: ['មិនជាប់ស្អិត', 'កកិតទាបបំផុត', 'ធន់នឹងគីមី និងអាស៊ីត'], en: ['Non-stick surface', 'Ultra-low friction', 'Chemical resistance'] },
    applications: { km: ['ខ្ទះឆាមិនជាប់', 'ខ្សែបូគីមី', 'បំពង់បង្ហូរអាស៊ីត', 'កាសែតរុំទុយោ'], en: ['Non-stick cookware', 'Chemical gaskets', 'Acid tubing', 'Plumber tape'] }
  },
  {
    id: 'p4', category: 'plastics', name: { km: 'នីឡុង', en: 'Nylon (Polyamide)' }, symbol: 'PA66',
    spec: { density: '1.15 g/cm³', melting: '260°C', hardness: '4', recyclable: 'Yes' },
    metrics: { hardness: 45, conductivity: 1, thermal: 20, density: 18, sustainability: 60 },
    latticeType: 'POLYAMIDE_CHAIN', accent: 'from-blue-600 to-indigo-900 text-blue-100', icon: Layers,
    description: { km: 'នីឡុងជាប៉ូលីមែរស្វិតរឹងមាំ ប្រើប្រាស់ក្នុងសរសៃអំបោះ គ្រឿងបន្លាស់ប្រកែ និងខ្សែពួរ។', en: 'A silky synthetic thermoplastic material that can be melt-processed into fibers, films, or shapes.' },
    properties: { km: ['ស្វិតធន់នឹងការកកិត', 'កម្លាំងទាញខ្ពស់', 'ស្រាល'], en: ['Tough & wear resistant', 'High tensile strength', 'Lightweight'] },
    applications: { km: ['ខ្សែពួរ', 'ប្រកែម៉ាស៊ីន (Gears)', 'ស្រោមជើង និងសម្លៀកបំពាក់', 'សរសៃតន្ត្រី'], en: ['Ropes', 'Mechanical gears', 'Textiles & hosiery', 'Guitar strings'] }
  },

  // === NATURAL & ORGANIC ===
  {
    id: 'n1', category: 'natural', name: { km: 'ឈើ', en: 'Wood / Timber' }, symbol: 'Cellulose',
    spec: { density: '0.60 g/cm³', melting: '300°C (Combusts)', hardness: '3.5', recyclable: 'Biodegradable' },
    metrics: { hardness: 35, conductivity: 1, thermal: 15, density: 10, sustainability: 95 },
    latticeType: 'CELLULAR_FIBER', accent: 'from-amber-700 to-yellow-950 text-amber-100', icon: Leaf,
    description: { km: 'ឈើជាសារធាតុធម្មជាតិរឹងមាំ កកើតឡើងវិញបាន ដែលជាគ្រឹះសំណង់ និងគ្រឿងសង្ហារឹមរាប់ពាន់ឆ្នាំ។', en: 'A natural porous organic tissue from trees, serving as a primary renewable building material for millennia.' },
    properties: { km: ['កកើតឡើងវិញបាន', 'អ៊ីសូឡង់កម្តៅល្អ', 'ងាយស្រួលកែច្នៃឆ្លាក់'], en: ['Renewable', 'Good insulation', 'Workable and aesthetic'] },
    applications: { km: ['ផ្ទះ & សំណង់', 'គ្រឿងសង្ហារឹម', 'ក្រដាស', 'ឧបករណ៍តន្ត្រី'], en: ['Houses & Framing', 'Furniture', 'Paper production', 'Musical instruments'] }
  },
  {
    id: 'n2', category: 'natural', name: { km: 'ក្រដាស', en: 'Paper' }, symbol: 'Wood Cellulose',
    spec: { density: '0.80 g/cm³', melting: '230°C (Combusts)', hardness: '1', recyclable: '100% Biodegradable' },
    metrics: { hardness: 10, conductivity: 1, thermal: 10, density: 8, sustainability: 98 },
    latticeType: 'FIBER_SHEET', accent: 'from-slate-200 to-stone-400 text-slate-900', icon: FileText,
    description: { km: 'ក្រដាសត្រូវបានផលិតចេញពីសរសៃសេលុយឡូសរបស់ឈើ ប្រើប្រាស់សម្រាប់សរសេរ ផ្តិតពុម្ព និងវេចខ្ចប់។', en: 'A thin sheet material produced by mechanically or chemically processing cellulose fibers from wood or rags.' },
    properties: { km: ['កែច្នៃងាយស្រួល', 'ស្រាល', 'កកើតឡើងវិញ'], en: ['Recyclable', 'Lightweight', 'Biodegradable'] },
    applications: { km: ['សៀវភៅ និងកាសែត', 'ប្រអប់កាតុង', 'ក្រដាសប្រាក់', 'សម្ភារៈអនាម័យ'], en: ['Books & Documents', 'Cardboard boxes', 'Banknotes', 'Tissues'] }
  },
  {
    id: 'n3', category: 'natural', name: { km: 'កៅស៊ូធម្មជាតិ', en: 'Natural Rubber' }, symbol: 'Polyisoprene',
    spec: { density: '0.92 g/cm³', melting: '180°C', hardness: '2', recyclable: 'Eco-friendly' },
    metrics: { hardness: 20, conductivity: 1, thermal: 10, density: 12, sustainability: 90 },
    latticeType: 'ELASTOMER_CHAIN', accent: 'from-emerald-700 to-green-950 text-emerald-100', icon: Leaf,
    description: { km: 'ជ័រផ្លាស់ចេញពីដើមកៅស៊ូ មានភាពយឺតខ្ពស់ មិនជ្រាបទឹក និងកាត់បន្ថយរំញ័របានល្អ។', en: 'Harvested from the latex of Hevea trees, featuring remarkable elasticity and waterproofing.' },
    properties: { km: ['ភាពយឺតខ្ពស់', 'មិនជ្រាបទឹក', 'កាត់បន្ថយរំញ័រ'], en: ['High elasticity', 'Waterproof', 'Shock absorption'] },
    applications: { km: ['សំបកកង់យានយន្ត', 'ស្រោមដៃពេទ្យ', 'បាតស្បែកជើង', 'ខ្សែពួរកៅស៊ូ'], en: ['Vehicle tires', 'Medical gloves', 'Footwear soles', 'Seals & gaskets'] }
  },

  // === CERAMICS & GLASS ===
  {
    id: 'c1', category: 'ceramics', name: { km: 'កញ្ចក់ស៊ីលីកា', en: 'Silica Glass' }, symbol: 'SiO2',
    spec: { density: '2.50 g/cm³', melting: '1700°C', hardness: '6.5', recyclable: '100%' },
    metrics: { hardness: 65, conductivity: 1, thermal: 20, density: 30, sustainability: 90 },
    latticeType: 'AMORPHOUS_GLASS', accent: 'from-sky-600 to-blue-950 text-sky-100', icon: Sparkles,
    description: { km: 'កញ្ចក់ជាសារធាតុរឹង ថ្លា មិនជ្រាបទឹក ដែលដុតរលាយចេញពីខ្សាច់ស៊ីលីកា។', en: 'An inorganic, non-crystalline solid made mostly of melted quartz/sand.' },
    properties: { km: ['ថ្លាឆ្លុះ ១០០%', 'មិនជ្រាបទឹក/ខ្យល់', 'ងាយបែក'], en: ['Transparent', 'Impermeable', 'Brittle'] },
    applications: { km: ['បង្អួចអគារ', 'ដបកែវ', 'ស្គ្រីនទូរស័ព្ទ', 'កែវពង្រីក'], en: ['Windows', 'Glass bottles', 'Smartphone displays', 'Lenses'] }
  },
  {
    id: 'c2', category: 'ceramics', name: { km: 'បេតុង', en: 'Concrete' }, symbol: 'Cement Composite',
    spec: { density: '2.40 g/cm³', melting: '1500°C', hardness: '6', recyclable: 'Crushed Aggregate' },
    metrics: { hardness: 60, conductivity: 1, thermal: 30, density: 40, sustainability: 70 },
    latticeType: 'COMPOSITE_AGGREGATE', accent: 'from-gray-500 to-slate-800 text-gray-100', icon: Mountain,
    description: { km: 'បេតុងជាសារធាតុផ្សំពីស៊ីម៉ងត៍ ខ្សាច់ និងថ្ម ដែលជាគ្រឹះសំណង់ធំជាងគេលើផែនដី។', en: 'A heavy building material made from a mixture of broken stone or gravel, sand, cement, and water.' },
    properties: { km: ['ធន់នឹងកម្លាំងសង្កត់', 'ប្រើប្រាស់បានយូរ', 'ធន់នឹងអគ្គិភ័យ'], en: ['High compressive strength', 'Durable', 'Fire resistant'] },
    applications: { km: ['គ្រឹះអគារ និងសសរ', 'ស្ពាន និងផ្លូវថ្នល់', 'ទំនប់វារីអគ្គិសនី'], en: ['Building foundations', 'Bridges & Roads', 'Hydroelectric dams'] }
  },

  // === MINERALS & GEMS ===
  {
    id: 'g1', category: 'minerals', name: { km: 'ពេជ្រ', en: 'Diamond' }, symbol: 'C (Crystal)',
    spec: { density: '3.52 g/cm³', melting: '4000°C', hardness: '10', recyclable: 'Everlasting' },
    metrics: { hardness: 100, conductivity: 1, thermal: 100, density: 40, sustainability: 80 },
    latticeType: 'DIAMOND_CUBIC', accent: 'from-cyan-400 to-blue-800 text-cyan-100', icon: Sparkles,
    description: { km: 'ពេជ្រជារូបរាងគ្រីស្តាល់នៃកាបូន និងជាសារធាតុធម្មជាតិដែលរឹងបំផុតលើផែនដី (កម្រិត ១០ Mohs)។', en: 'A solid form of carbon with atoms arranged in a crystal structure, making it the hardest natural substance.' },
    properties: { km: ['រឹងបំផុតលើផែនដី (10 Mohs)', 'ចម្លងកម្តៅល្អខ្លាំង', 'ចំណាំងផ្លាតពន្លឺខ្ពស់'], en: ['Hardest natural element', 'Exceptional thermal conductivity', 'High optical dispersion'] },
    applications: { km: ['គ្រឿងអលង្ការ', 'មុខកាំបិត និងផ្លែស្វានស្អិត', 'បង្អួចឡាស៊ែរ'], en: ['Luxury jewelry', 'Industrial drills & cutters', 'Laser windows'] }
  },
  {
    id: 'g2', category: 'minerals', name: { km: 'ក្រាហ្វីត', en: 'Graphite' }, symbol: 'C (Layered)',
    spec: { density: '2.26 g/cm³', melting: '3600°C', hardness: '1.5', recyclable: '100%' },
    metrics: { hardness: 15, conductivity: 80, thermal: 85, density: 25, sustainability: 90 },
    latticeType: 'HEXAGONAL_LAYERED', accent: 'from-slate-700 to-black text-slate-100', icon: Layers,
    description: { km: 'ក្រាហ្វីតជារូបរាងកាបូនស្រទាប់ៗដែលទន់ រអិល និងចម្លងអគ្គិសនីបានល្អសម្រាប់ធ្វើខ្មៅដៃ និងថ្មពិល។', en: 'A crystalline form of carbon used in pencils and lubricants, known for its electrical conductivity.' },
    properties: { km: ['ចម្លងអគ្គិសនីបាន', 'រអិលទន់', 'ធន់នឹងកម្តៅ'], en: ['Conducts electricity', 'Soft & slippery', 'Heat resistant'] },
    applications: { km: ['ស្នូលខ្មៅដៃ', 'អាណូតថ្មពិល Lithium-Ion', 'ប្រេងរំអិលស្ងួត'], en: ['Pencil lead', 'Battery anodes', 'Dry lubricants'] }
  }
];

const periodicCategoryMap: Record<string, { km: string; en: string; color: string }> = {
  alkali: { km: 'លោហៈអាល់កាឡាំង (Alkali)', en: 'Alkali Metal', color: 'bg-red-500/10 text-[var(--ink)] border-red-500/40' },
  alkaline: { km: 'លោហៈអាល់កាឡាំងដី (Alkaline Earth)', en: 'Alkaline Earth', color: 'bg-orange-500/10 text-[var(--ink)] border-orange-500/40' },
  transition: { km: 'លោហៈអន្តរកាល (Transition)', en: 'Transition Metal', color: 'bg-blue-500/10 text-[var(--ink)] border-blue-500/40' },
  post_transition: { km: 'លោហៈក្រោយអន្តរកាល (Post-Transition)', en: 'Post-Transition Metal', color: 'bg-sky-500/10 text-[var(--ink)] border-sky-500/40' },
  metalloid: { km: 'អឌ្ឍលោហៈ (Metalloid)', en: 'Metalloid', color: 'bg-yellow-500/10 text-[var(--ink)] border-yellow-500/40' },
  nonmetal: { km: 'អលោហៈ (Reactive Nonmetal)', en: 'Reactive Nonmetal', color: 'bg-emerald-500/10 text-[var(--ink)] border-emerald-500/40' },
  halogen: { km: 'ហាឡូហ្សែន (Halogen)', en: 'Halogen', color: 'bg-teal-500/10 text-[var(--ink)] border-teal-500/40' },
  noble: { km: 'ឧស្ម័នអសកម្ម (Noble Gas)', en: 'Noble Gas', color: 'bg-purple-500/10 text-[var(--ink)] border-purple-500/40' },
  lanthanide: { km: 'ឡង់តានីត (Lanthanide)', en: 'Lanthanide', color: 'bg-pink-500/10 text-[var(--ink)] border-pink-500/40' },
  actinide: { km: 'អាទីនីត (Actinide)', en: 'Actinide', color: 'bg-fuchsia-500/10 text-[var(--ink)] border-fuchsia-500/40' }
};

const periodicElementsData = [
  // Period 1
  { number: 1, symbol: 'H', name: { km: 'អ៊ីដ្រូសែន', en: 'Hydrogen' }, mass: '1.008', group: 1, period: 1, category: 'nonmetal', config: '1s¹', phase: 'Gas', discovered: '1766', latticeType: 'HEXAGONAL' },
  { number: 2, symbol: 'He', name: { km: 'អេល្យូម', en: 'Helium' }, mass: '4.0026', group: 18, period: 1, category: 'noble', config: '1s²', phase: 'Gas', discovered: '1868', latticeType: 'HCP' },

  // Period 2
  { number: 3, symbol: 'Li', name: { km: 'លីចូម', en: 'Lithium' }, mass: '6.94', group: 1, period: 2, category: 'alkali', config: '[He] 2s¹', phase: 'Solid', discovered: '1817', latticeType: 'BCC' },
  { number: 4, symbol: 'Be', name: { km: 'បេរីល្យូម', en: 'Beryllium' }, mass: '9.0122', group: 2, period: 2, category: 'alkaline', config: '[He] 2s²', phase: 'Solid', discovered: '1798', latticeType: 'HCP' },
  { number: 5, symbol: 'B', name: { km: 'បារ', en: 'Boron' }, mass: '10.81', group: 13, period: 2, category: 'metalloid', config: '[He] 2s² 2p¹', phase: 'Solid', discovered: '1808', latticeType: 'RHOMBOHEDRAL' },
  { number: 6, symbol: 'C', name: { km: 'កាបូន', en: 'Carbon' }, mass: '12.011', group: 14, period: 2, category: 'nonmetal', config: '[He] 2s² 2p²', phase: 'Solid', discovered: 'Ancient', latticeType: 'DIAMOND_CUBIC' },
  { number: 7, symbol: 'N', name: { km: 'អាសូត', en: 'Nitrogen' }, mass: '14.007', group: 15, period: 2, category: 'nonmetal', config: '[He] 2s² 2p³', phase: 'Gas', discovered: '1772', latticeType: 'HEXAGONAL' },
  { number: 8, symbol: 'O', name: { km: 'អុកស៊ីសែន', en: 'Oxygen' }, mass: '15.999', group: 16, period: 2, category: 'nonmetal', config: '[He] 2s² 2p⁴', phase: 'Gas', discovered: '1774', latticeType: 'CUBIC' },
  { number: 9, symbol: 'F', name: { km: 'ភ្លុយអ័រ', en: 'Fluorine' }, mass: '18.998', group: 17, period: 2, category: 'halogen', config: '[He] 2s² 2p⁵', phase: 'Gas', discovered: '1886', latticeType: 'CUBIC' },
  { number: 10, symbol: 'Ne', name: { km: 'នេអុង', en: 'Neon' }, mass: '20.180', group: 18, period: 2, category: 'noble', config: '[He] 2s² 2p⁶', phase: 'Gas', discovered: '1898', latticeType: 'FCC' },

  // Period 3
  { number: 11, symbol: 'Na', name: { km: 'សូដ្យូម', en: 'Sodium' }, mass: '22.990', group: 1, period: 3, category: 'alkali', config: '[Ne] 3s¹', phase: 'Solid', discovered: '1807', latticeType: 'BCC' },
  { number: 12, symbol: 'Mg', name: { km: 'ម៉ាញ៉េស្យូម', en: 'Magnesium' }, mass: '24.305', group: 2, period: 3, category: 'alkaline', config: '[Ne] 3s²', phase: 'Solid', discovered: '1755', latticeType: 'HCP' },
  { number: 13, symbol: 'Al', name: { km: 'អាលុយមីញ៉ូម', en: 'Aluminum' }, mass: '26.982', group: 13, period: 3, category: 'post_transition', config: '[Ne] 3s² 3p¹', phase: 'Solid', discovered: '1825', latticeType: 'FCC' },
  { number: 14, symbol: 'Si', name: { km: 'ស៊ីលីកូន', en: 'Silicon' }, mass: '28.085', group: 14, period: 3, category: 'metalloid', config: '[Ne] 3s² 3p²', phase: 'Solid', discovered: '1824', latticeType: 'DIAMOND_CUBIC' },
  { number: 15, symbol: 'P', name: { km: 'ផូស្វ័រ', en: 'Phosphorus' }, mass: '30.974', group: 15, period: 3, category: 'nonmetal', config: '[Ne] 3s² 3p³', phase: 'Solid', discovered: '1669', latticeType: 'TRICLINIC' },
  { number: 16, symbol: 'S', name: { km: 'ស្ពាន់ធ័រ', en: 'Sulfur' }, mass: '32.06', group: 16, period: 3, category: 'nonmetal', config: '[Ne] 3s² 3p⁴', phase: 'Solid', discovered: 'Ancient', latticeType: 'ORTHORHOMBIC' },
  { number: 17, symbol: 'Cl', name: { km: 'ក្លរ', en: 'Chlorine' }, mass: '35.45', group: 17, period: 3, category: 'halogen', config: '[Ne] 3s² 3p⁵', phase: 'Gas', discovered: '1774', latticeType: 'ORTHORHOMBIC' },
  { number: 18, symbol: 'Ar', name: { km: 'អារហ្គុង', en: 'Argon' }, mass: '39.948', group: 18, period: 3, category: 'noble', config: '[Ne] 3s² 3p⁶', phase: 'Gas', discovered: '1894', latticeType: 'FCC' },

  // Period 4
  { number: 19, symbol: 'K', name: { km: 'ប៉ូតាស្យូម', en: 'Potassium' }, mass: '39.098', group: 1, period: 4, category: 'alkali', config: '[Ar] 4s¹', phase: 'Solid', discovered: '1807', latticeType: 'BCC' },
  { number: 20, symbol: 'Ca', name: { km: 'កាល់ស្យូម', en: 'Calcium' }, mass: '40.078', group: 2, period: 4, category: 'alkaline', config: '[Ar] 4s²', phase: 'Solid', discovered: '1808', latticeType: 'FCC' },
  { number: 21, symbol: 'Sc', name: { km: 'ស្កង់ដ្យូម', en: 'Scandium' }, mass: '44.956', group: 3, period: 4, category: 'transition', config: '[Ar] 3d¹ 4s²', phase: 'Solid', discovered: '1879', latticeType: 'HCP' },
  { number: 22, symbol: 'Ti', name: { km: 'ទីតាញ៉ូម', en: 'Titanium' }, mass: '47.867', group: 4, period: 4, category: 'transition', config: '[Ar] 3d² 4s²', phase: 'Solid', discovered: '1791', latticeType: 'HCP' },
  { number: 23, symbol: 'V', name: { km: 'វ៉ាណាដ្យូម', en: 'Vanadium' }, mass: '50.942', group: 5, period: 4, category: 'transition', config: '[Ar] 3d³ 4s²', phase: 'Solid', discovered: '1801', latticeType: 'BCC' },
  { number: 24, symbol: 'Cr', name: { km: 'ក្រូម', en: 'Chromium' }, mass: '51.996', group: 6, period: 4, category: 'transition', config: '[Ar] 3d⁵ 4s¹', phase: 'Solid', discovered: '1797', latticeType: 'BCC' },
  { number: 25, symbol: 'Mn', name: { km: 'ម៉ង់ហ្គាណែស', en: 'Manganese' }, mass: '54.938', group: 7, period: 4, category: 'transition', config: '[Ar] 3d⁵ 4s²', phase: 'Solid', discovered: '1774', latticeType: 'CUBIC' },
  { number: 26, symbol: 'Fe', name: { km: 'ដែក', en: 'Iron' }, mass: '55.845', group: 8, period: 4, category: 'transition', config: '[Ar] 3d⁶ 4s²', phase: 'Solid', discovered: 'Ancient', latticeType: 'BCC' },
  { number: 27, symbol: 'Co', name: { km: 'កូបាល់', en: 'Cobalt' }, mass: '58.933', group: 9, period: 4, category: 'transition', config: '[Ar] 3d⁷ 4s²', phase: 'Solid', discovered: '1735', latticeType: 'HCP' },
  { number: 28, symbol: 'Ni', name: { km: 'នីកែល', en: 'Nickel' }, mass: '58.693', group: 10, period: 4, category: 'transition', config: '[Ar] 3d⁸ 4s²', phase: 'Solid', discovered: '1751', latticeType: 'FCC' },
  { number: 29, symbol: 'Cu', name: { km: 'ទង់ដែង', en: 'Copper' }, mass: '63.546', group: 11, period: 4, category: 'transition', config: '[Ar] 3d¹⁰ 4s¹', phase: 'Solid', discovered: 'Ancient', latticeType: 'FCC' },
  { number: 30, symbol: 'Zn', name: { km: 'ស័ង្កសី', en: 'Zinc' }, mass: '65.38', group: 12, period: 4, category: 'transition', config: '[Ar] 3d¹⁰ 4s²', phase: 'Solid', discovered: 'Ancient', latticeType: 'HCP' },
  { number: 31, symbol: 'Ga', name: { km: 'ហ្គាល្យូម', en: 'Gallium' }, mass: '69.723', group: 13, period: 4, category: 'post_transition', config: '[Ar] 3d¹⁰ 4s² 4p¹', phase: 'Solid', discovered: '1875', latticeType: 'ORTHORHOMBIC' },
  { number: 32, symbol: 'Ge', name: { km: 'ជែម៉ាញ៉ូម', en: 'Germanium' }, mass: '72.630', group: 14, period: 4, category: 'metalloid', config: '[Ar] 3d¹⁰ 4s² 4p²', phase: 'Solid', discovered: '1886', latticeType: 'DIAMOND_CUBIC' },
  { number: 33, symbol: 'As', name: { km: 'អាសេនិច', en: 'Arsenic' }, mass: '74.922', group: 15, period: 4, category: 'metalloid', config: '[Ar] 3d¹⁰ 4s² 4p³', phase: 'Solid', discovered: 'Ancient', latticeType: 'RHOMBOHEDRAL' },
  { number: 34, symbol: 'Se', name: { km: 'សេឡេន្យូម', en: 'Selenium' }, mass: '78.971', group: 16, period: 4, category: 'nonmetal', config: '[Ar] 3d¹⁰ 4s² 4p⁴', phase: 'Solid', discovered: '1817', latticeType: 'HEXAGONAL' },
  { number: 35, symbol: 'Br', name: { km: 'ប្រូម', en: 'Bromine' }, mass: '79.904', group: 17, period: 4, category: 'halogen', config: '[Ar] 3d¹⁰ 4s² 4p⁵', phase: 'Liquid', discovered: '1826', latticeType: 'ORTHORHOMBIC' },
  { number: 36, symbol: 'Kr', name: { km: 'គ្រីបតុង', en: 'Krypton' }, mass: '83.798', group: 18, period: 4, category: 'noble', config: '[Ar] 3d¹⁰ 4s² 4p⁶', phase: 'Gas', discovered: '1898', latticeType: 'FCC' },

  // Period 5
  { number: 37, symbol: 'Rb', name: { km: 'រូប៊ីដ្យូម', en: 'Rubidium' }, mass: '85.468', group: 1, period: 5, category: 'alkali', config: '[Kr] 5s¹', phase: 'Solid', discovered: '1861', latticeType: 'BCC' },
  { number: 38, symbol: 'Sr', name: { km: 'ស្រ្តុងទីយូម', en: 'Strontium' }, mass: '87.62', group: 2, period: 5, category: 'alkaline', config: '[Kr] 5s²', phase: 'Solid', discovered: '1790', latticeType: 'FCC' },
  { number: 39, symbol: 'Y', name: { km: 'អ៊ីតូញ៉ូម', en: 'Yttrium' }, mass: '88.906', group: 3, period: 5, category: 'transition', config: '[Kr] 4d¹ 5s²', phase: 'Solid', discovered: '1794', latticeType: 'HCP' },
  { number: 40, symbol: 'Zr', name: { km: 'ហ្សៀកូញ៉ូម', en: 'Zirconium' }, mass: '91.224', group: 4, period: 5, category: 'transition', config: '[Kr] 4d² 5s²', phase: 'Solid', discovered: '1789', latticeType: 'HCP' },
  { number: 41, symbol: 'Nb', name: { km: 'នីអូប៊ីយូម', en: 'Niobium' }, mass: '92.906', group: 5, period: 5, category: 'transition', config: '[Kr] 4d⁴ 5s¹', phase: 'Solid', discovered: '1801', latticeType: 'BCC' },
  { number: 42, symbol: 'Mo', name: { km: 'ម៉ូលីបដែន', en: 'Molybdenum' }, mass: '95.95', group: 6, period: 5, category: 'transition', config: '[Kr] 4d⁵ 5s¹', phase: 'Solid', discovered: '1778', latticeType: 'BCC' },
  { number: 43, symbol: 'Tc', name: { km: 'តិចនេស្យូម', en: 'Technetium' }, mass: '98', group: 7, period: 5, category: 'transition', config: '[Kr] 4d⁵ 5s²', phase: 'Solid', discovered: '1937', latticeType: 'HCP' },
  { number: 44, symbol: 'Ru', name: { km: 'រូថេន្យូម', en: 'Ruthenium' }, mass: '101.07', group: 8, period: 5, category: 'transition', config: '[Kr] 4d⁷ 5s¹', phase: 'Solid', discovered: '1844', latticeType: 'HCP' },
  { number: 45, symbol: 'Rh', name: { km: 'រ៉ូដ្យូម', en: 'Rhodium' }, mass: '102.91', group: 9, period: 5, category: 'transition', config: '[Kr] 4d⁸ 5s¹', phase: 'Solid', discovered: '1803', latticeType: 'FCC' },
  { number: 46, symbol: 'Pd', name: { km: 'ប៉ាឡាដ្យូម', en: 'Palladium' }, mass: '106.42', group: 10, period: 5, category: 'transition', config: '[Kr] 4d¹⁰', phase: 'Solid', discovered: '1803', latticeType: 'FCC' },
  { number: 47, symbol: 'Ag', name: { km: 'ប្រាក់', en: 'Silver' }, mass: '107.87', group: 11, period: 5, category: 'transition', config: '[Kr] 4d¹⁰ 5s¹', phase: 'Solid', discovered: 'Ancient', latticeType: 'FCC' },
  { number: 48, symbol: 'Cd', name: { km: 'កាដមីយូម', en: 'Cadmium' }, mass: '112.41', group: 12, period: 5, category: 'transition', config: '[Kr] 4d¹⁰ 5s²', phase: 'Solid', discovered: '1817', latticeType: 'HCP' },
  { number: 49, symbol: 'In', name: { km: 'អាំងដ្យូម', en: 'Indium' }, mass: '114.82', group: 13, period: 5, category: 'post_transition', config: '[Kr] 4d¹⁰ 5s² 5p¹', phase: 'Solid', discovered: '1863', latticeType: 'TETRAGONAL' },
  { number: 50, symbol: 'Sn', name: { km: 'សំណប៉ាហាំង', en: 'Tin' }, mass: '118.71', group: 14, period: 5, category: 'post_transition', config: '[Kr] 4d¹⁰ 5s² 5p²', phase: 'Solid', discovered: 'Ancient', latticeType: 'TETRAGONAL' },
  { number: 51, symbol: 'Sb', name: { km: 'ស្បៃអង់', en: 'Antimony' }, mass: '121.76', group: 15, period: 5, category: 'metalloid', config: '[Kr] 4d¹⁰ 5s² 5p³', phase: 'Solid', discovered: 'Ancient', latticeType: 'RHOMBOHEDRAL' },
  { number: 52, symbol: 'Te', name: { km: 'តែលុយរ្យូម', en: 'Tellurium' }, mass: '127.60', group: 16, period: 5, category: 'metalloid', config: '[Kr] 4d¹⁰ 5s² 5p⁴', phase: 'Solid', discovered: '1782', latticeType: 'HEXAGONAL' },
  { number: 53, symbol: 'I', name: { km: 'អ៊ីយ៉ូត', en: 'Iodine' }, mass: '126.90', group: 17, period: 5, category: 'halogen', config: '[Kr] 4d¹⁰ 5s² 5p⁵', phase: 'Solid', discovered: '1811', latticeType: 'ORTHORHOMBIC' },
  { number: 54, symbol: 'Xe', name: { km: 'សេណុង', en: 'Xenon' }, mass: '131.29', group: 18, period: 5, category: 'noble', config: '[Kr] 4d¹⁰ 5s² 5p⁶', phase: 'Gas', discovered: '1898', latticeType: 'FCC' },

  // Period 6
  { number: 55, symbol: 'Cs', name: { km: 'សេស្យូម', en: 'Cesium' }, mass: '132.91', group: 1, period: 6, category: 'alkali', config: '[Xe] 6s¹', phase: 'Solid', discovered: '1860', latticeType: 'BCC' },
  { number: 56, symbol: 'Ba', name: { km: 'បារ្យូម', en: 'Barium' }, mass: '137.33', group: 2, period: 6, category: 'alkaline', config: '[Xe] 6s²', phase: 'Solid', discovered: '1808', latticeType: 'BCC' },
  { number: 57, symbol: 'La', name: { km: 'ឡង់តាន', en: 'Lanthanum' }, mass: '138.91', group: 3, period: 6, category: 'lanthanide', config: '[Xe] 5d¹ 6s²', phase: 'Solid', discovered: '1839', latticeType: 'DHCP' },
  { number: 58, symbol: 'Ce', name: { km: 'សេរ្យូម', en: 'Cerium' }, mass: '140.12', group: 4, period: 8, category: 'lanthanide', config: '[Xe] 4f¹ 5d¹ 6s²', phase: 'Solid', discovered: '1803', latticeType: 'FCC' },
  { number: 59, symbol: 'Pr', name: { km: 'ប្រាសេអូឌីម', en: 'Praseodymium' }, mass: '140.91', group: 5, period: 8, category: 'lanthanide', config: '[Xe] 4f³ 6s²', phase: 'Solid', discovered: '1885', latticeType: 'DHCP' },
  { number: 60, symbol: 'Nd', name: { km: 'នេអូឌីម', en: 'Neodymium' }, mass: '144.24', group: 6, period: 8, category: 'lanthanide', config: '[Xe] 4f⁴ 6s²', phase: 'Solid', discovered: '1885', latticeType: 'DHCP' },
  { number: 61, symbol: 'Pm', name: { km: 'ប្រូមេថ្យូម', en: 'Promethium' }, mass: '145', group: 7, period: 8, category: 'lanthanide', config: '[Xe] 4f⁵ 6s²', phase: 'Solid', discovered: '1945', latticeType: 'DHCP' },
  { number: 62, symbol: 'Sm', name: { km: 'សាម៉ារ្យូម', en: 'Samarium' }, mass: '150.36', group: 8, period: 8, category: 'lanthanide', config: '[Xe] 4f⁶ 6s²', phase: 'Solid', discovered: '1879', latticeType: 'RHOMBOHEDRAL' },
  { number: 63, symbol: 'Eu', name: { km: 'អឺរ៉ូព្យូម', en: 'Europium' }, mass: '151.96', group: 9, period: 8, category: 'lanthanide', config: '[Xe] 4f⁷ 6s²', phase: 'Solid', discovered: '1901', latticeType: 'BCC' },
  { number: 64, symbol: 'Gd', name: { km: 'កាដូលីន្យូម', en: 'Gadolinium' }, mass: '157.25', group: 10, period: 8, category: 'lanthanide', config: '[Xe] 4f⁷ 5d¹ 6s²', phase: 'Solid', discovered: '1880', latticeType: 'HCP' },
  { number: 65, symbol: 'Tb', name: { km: 'ទែប៊ីយូម', en: 'Terbium' }, mass: '158.93', group: 11, period: 8, category: 'lanthanide', config: '[Xe] 4f⁹ 6s²', phase: 'Solid', discovered: '1843', latticeType: 'HCP' },
  { number: 66, symbol: 'Dy', name: { km: 'ឌីស្ប្រូស្យូម', en: 'Dysprosium' }, mass: '162.50', group: 12, period: 8, category: 'lanthanide', config: '[Xe] 4f¹⁰ 6s²', phase: 'Solid', discovered: '1886', latticeType: 'HCP' },
  { number: 67, symbol: 'Ho', name: { km: 'ហុលម៉្យូម', en: 'Holmium' }, mass: '164.93', group: 13, period: 8, category: 'lanthanide', config: '[Xe] 4f¹¹ 6s²', phase: 'Solid', discovered: '1878', latticeType: 'HCP' },
  { number: 68, symbol: 'Er', name: { km: 'អឺប៊ីយូម', en: 'Erbium' }, mass: '167.26', group: 14, period: 8, category: 'lanthanide', config: '[Xe] 4f¹² 6s²', phase: 'Solid', discovered: '1843', latticeType: 'HCP' },
  { number: 69, symbol: 'Tm', name: { km: 'ធូល្យូម', en: 'Thulium' }, mass: '168.93', group: 15, period: 8, category: 'lanthanide', config: '[Xe] 4f¹³ 6s²', phase: 'Solid', discovered: '1879', latticeType: 'HCP' },
  { number: 70, symbol: 'Yb', name: { km: 'អ៊ីទែប៊ីយូម', en: 'Ytterbium' }, mass: '173.05', group: 16, period: 8, category: 'lanthanide', config: '[Xe] 4f¹⁴ 6s²', phase: 'Solid', discovered: '1878', latticeType: 'FCC' },
  { number: 71, symbol: 'Lu', name: { km: 'លុយតេស្យូម', en: 'Lutetium' }, mass: '174.97', group: 17, period: 8, category: 'lanthanide', config: '[Xe] 4f¹⁴ 5d¹ 6s²', phase: 'Solid', discovered: '1907', latticeType: 'HCP' },
  { number: 72, symbol: 'Hf', name: { km: 'ហាហ្វញ៉ូម', en: 'Hafnium' }, mass: '178.49', group: 4, period: 6, category: 'transition', config: '[Xe] 4f¹⁴ 5d² 6s²', phase: 'Solid', discovered: '1923', latticeType: 'HCP' },
  { number: 73, symbol: 'Ta', name: { km: 'តង់តាល់', en: 'Tantalum' }, mass: '180.95', group: 5, period: 6, category: 'transition', config: '[Xe] 4f¹⁴ 5d³ 6s²', phase: 'Solid', discovered: '1802', latticeType: 'BCC' },
  { number: 74, symbol: 'W', name: { km: 'តង់ស្តែន', en: 'Tungsten' }, mass: '183.84', group: 6, period: 6, category: 'transition', config: '[Xe] 4f¹⁴ 5d⁴ 6s²', phase: 'Solid', discovered: '1783', latticeType: 'BCC' },
  { number: 75, symbol: 'Re', name: { km: 'រេញ៉ូម', en: 'Rhenium' }, mass: '186.21', group: 7, period: 6, category: 'transition', config: '[Xe] 4f¹⁴ 5d⁵ 6s²', phase: 'Solid', discovered: '1925', latticeType: 'HCP' },
  { number: 76, symbol: 'Os', name: { km: 'អូស្មីយូម', en: 'Osmium' }, mass: '190.23', group: 8, period: 6, category: 'transition', config: '[Xe] 4f¹⁴ 5d⁶ 6s²', phase: 'Solid', discovered: '1803', latticeType: 'HCP' },
  { number: 77, symbol: 'Ir', name: { km: 'អ៊ីរីដ្យូម', en: 'Iridium' }, mass: '192.22', group: 9, period: 6, category: 'transition', config: '[Xe] 4f¹⁴ 5d⁷ 6s²', phase: 'Solid', discovered: '1803', latticeType: 'FCC' },
  { number: 78, symbol: 'Pt', name: { km: 'ប្លាទីន', en: 'Platinum' }, mass: '195.08', group: 10, period: 6, category: 'transition', config: '[Xe] 4f¹⁴ 5d⁹ 6s¹', phase: 'Solid', discovered: '1735', latticeType: 'FCC' },
  { number: 79, symbol: 'Au', name: { km: 'មាស', en: 'Gold' }, mass: '196.97', group: 11, period: 6, category: 'transition', config: '[Xe] 4f¹⁴ 5d¹⁰ 6s¹', phase: 'Solid', discovered: 'Ancient', latticeType: 'FCC' },
  { number: 80, symbol: 'Hg', name: { km: 'បារ៉ត', en: 'Mercury' }, mass: '200.59', group: 12, period: 6, category: 'transition', config: '[Xe] 4f¹⁴ 5d¹⁰ 6s²', phase: 'Liquid', discovered: 'Ancient', latticeType: 'RHOMBOHEDRAL' },
  { number: 81, symbol: 'Tl', name: { km: 'ថាល្យូម', en: 'Thallium' }, mass: '204.38', group: 13, period: 6, category: 'post_transition', config: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p¹', phase: 'Solid', discovered: '1861', latticeType: 'HCP' },
  { number: 82, symbol: 'Pb', name: { km: 'សំណ', en: 'Lead' }, mass: '207.2', group: 14, period: 6, category: 'post_transition', config: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²', phase: 'Solid', discovered: 'Ancient', latticeType: 'FCC' },
  { number: 83, symbol: 'Bi', name: { km: 'ប៊ីស្មុត', en: 'Bismuth' }, mass: '208.98', group: 15, period: 6, category: 'post_transition', config: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p³', phase: 'Solid', discovered: '1753', latticeType: 'RHOMBOHEDRAL' },
  { number: 84, symbol: 'Po', name: { km: 'ប៉ូឡូញ៉ូម', en: 'Polonium' }, mass: '209', group: 16, period: 6, category: 'post_transition', config: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁴', phase: 'Solid', discovered: '1898', latticeType: 'CUBIC' },
  { number: 85, symbol: 'At', name: { km: 'អាស្តាត', en: 'Astatine' }, mass: '210', group: 17, period: 6, category: 'halogen', config: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁵', phase: 'Solid', discovered: '1940', latticeType: 'UNKNOWN' },
  { number: 86, symbol: 'Rn', name: { km: 'រ៉ាដុង', en: 'Radon' }, mass: '222', group: 18, period: 6, category: 'noble', config: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁶', phase: 'Gas', discovered: '1899', latticeType: 'FCC' },

  // Period 7
  { number: 87, symbol: 'Fr', name: { km: 'ហ្វ្រង់ស្យូម', en: 'Francium' }, mass: '223', group: 1, period: 7, category: 'alkali', config: '[Rn] 7s¹', phase: 'Solid', discovered: '1939', latticeType: 'BCC' },
  { number: 88, symbol: 'Ra', name: { km: 'រ៉ាដ្យូម', en: 'Radium' }, mass: '226', group: 2, period: 7, category: 'alkaline', config: '[Rn] 7s²', phase: 'Solid', discovered: '1898', latticeType: 'BCC' },
  { number: 89, symbol: 'Ac', name: { km: 'អាទីញ៉ូម', en: 'Actinium' }, mass: '227', group: 3, period: 7, category: 'actinide', config: '[Rn] 6d¹ 7s²', phase: 'Solid', discovered: '1899', latticeType: 'FCC' },
  { number: 90, symbol: 'Th', name: { km: 'ថូរ្យូម', en: 'Thorium' }, mass: '232.04', group: 4, period: 9, category: 'actinide', config: '[Rn] 6d² 7s²', phase: 'Solid', discovered: '1829', latticeType: 'FCC' },
  { number: 91, symbol: 'Pa', name: { km: 'ប្រូតាកទីញ៉ូម', en: 'Protactinium' }, mass: '231.04', group: 5, period: 9, category: 'actinide', config: '[Rn] 5f² 6d¹ 7s²', phase: 'Solid', discovered: '1913', latticeType: 'TETRAGONAL' },
  { number: 92, symbol: 'U', name: { km: 'អ៊ុយរ៉ាន្យូម', en: 'Uranium' }, mass: '238.03', group: 6, period: 9, category: 'actinide', config: '[Rn] 5f³ 6d¹ 7s²', phase: 'Solid', discovered: '1789', latticeType: 'ORTHORHOMBIC' },
  { number: 93, symbol: 'Np', name: { km: 'នេបតុញ៉ូម', en: 'Neptunium' }, mass: '237', group: 7, period: 9, category: 'actinide', config: '[Rn] 5f⁴ 6d¹ 7s²', phase: 'Solid', discovered: '1940', latticeType: 'ORTHORHOMBIC' },
  { number: 94, symbol: 'Pu', name: { km: 'ប្លុយតូញ៉ូម', en: 'Plutonium' }, mass: '244', group: 8, period: 9, category: 'actinide', config: '[Rn] 5f⁶ 7s²', phase: 'Solid', discovered: '1940', latticeType: 'MONOCLINIC' },
  { number: 95, symbol: 'Am', name: { km: 'អាមេរីស្យូម', en: 'Americium' }, mass: '243', group: 9, period: 9, category: 'actinide', config: '[Rn] 5f⁷ 7s²', phase: 'Solid', discovered: '1944', latticeType: 'DHCP' },
  { number: 96, symbol: 'Cm', name: { km: 'កុយរីយូម', en: 'Curium' }, mass: '247', group: 10, period: 9, category: 'actinide', config: '[Rn] 5f⁷ 6d¹ 7s²', phase: 'Solid', discovered: '1944', latticeType: 'DHCP' },
  { number: 97, symbol: 'Bk', name: { km: 'ប៊ែគលីយូម', en: 'Berkelium' }, mass: '247', group: 11, period: 9, category: 'actinide', config: '[Rn] 5f⁹ 7s²', phase: 'Solid', discovered: '1949', latticeType: 'DHCP' },
  { number: 98, symbol: 'Cf', name: { km: 'កាលីហ្វ័រញ៉ូម', en: 'Californium' }, mass: '251', group: 12, period: 9, category: 'actinide', config: '[Rn] 5f¹⁰ 7s²', phase: 'Solid', discovered: '1950', latticeType: 'DHCP' },
  { number: 99, symbol: 'Es', name: { km: 'អាំងស្តង់ញ៉ូម', en: 'Einsteinium' }, mass: '252', group: 13, period: 9, category: 'actinide', config: '[Rn] 5f¹¹ 7s²', phase: 'Solid', discovered: '1952', latticeType: 'FCC' },
  { number: 100, symbol: 'Fm', name: { km: 'ហ្វែមីយូម', en: 'Fermium' }, mass: '257', group: 14, period: 9, category: 'actinide', config: '[Rn] 5f¹² 7s²', phase: 'Solid', discovered: '1952', latticeType: 'FCC' },
  { number: 101, symbol: 'Md', name: { km: 'ម៉ង់ដេឡេវ្យូម', en: 'Mendelevium' }, mass: '258', group: 15, period: 9, category: 'actinide', config: '[Rn] 5f¹³ 7s²', phase: 'Solid', discovered: '1955', latticeType: 'UNKNOWN' },
  { number: 102, symbol: 'No', name: { km: 'ណូបេល្យូម', en: 'Nobelium' }, mass: '259', group: 16, period: 9, category: 'actinide', config: '[Rn] 5f¹⁴ 7s²', phase: 'Solid', discovered: '1966', latticeType: 'UNKNOWN' },
  { number: 103, symbol: 'Lr', name: { km: 'ឡូរ៉ង់ស្យូម', en: 'Lawrencium' }, mass: '266', group: 17, period: 9, category: 'actinide', config: '[Rn] 5f¹⁴ 7s² 7p¹', phase: 'Solid', discovered: '1961', latticeType: 'UNKNOWN' },
  { number: 104, symbol: 'Rf', name: { km: 'រូធើហ្វ័រឌ្យូម', en: 'Rutherfordium' }, mass: '267', group: 4, period: 7, category: 'transition', config: '[Rn] 5f¹⁴ 6d² 7s²', phase: 'Synthetic', discovered: '1964', latticeType: 'UNKNOWN' },
  { number: 105, symbol: 'Db', name: { km: 'ឌុបន្យូម', en: 'Dubnium' }, mass: '268', group: 5, period: 7, category: 'transition', config: '[Rn] 5f¹⁴ 6d³ 7s²', phase: 'Synthetic', discovered: '1967', latticeType: 'UNKNOWN' },
  { number: 106, symbol: 'Sg', name: { km: 'ស៊ីបូគ្យូម', en: 'Seaborgium' }, mass: '269', group: 6, period: 7, category: 'transition', config: '[Rn] 5f¹⁴ 6d⁴ 7s²', phase: 'Synthetic', discovered: '1974', latticeType: 'UNKNOWN' },
  { number: 107, symbol: 'Bh', name: { km: 'បូញ៉ូម', en: 'Bohrium' }, mass: '270', group: 7, period: 7, category: 'transition', config: '[Rn] 5f¹⁴ 6d⁵ 7s²', phase: 'Synthetic', discovered: '1981', latticeType: 'UNKNOWN' },
  { number: 108, symbol: 'Hs', name: { km: 'ហាស់ស្យូម', en: 'Hassium' }, mass: '277', group: 8, period: 7, category: 'transition', config: '[Rn] 5f¹⁴ 6d⁶ 7s²', phase: 'Synthetic', discovered: '1984', latticeType: 'UNKNOWN' },
  { number: 109, symbol: 'Mt', name: { km: 'ម៉ៃត្នេរ្យូម', en: 'Meitnerium' }, mass: '278', group: 9, period: 7, category: 'transition', config: '[Rn] 5f¹⁴ 6d⁷ 7s²', phase: 'Synthetic', discovered: '1982', latticeType: 'UNKNOWN' },
  { number: 110, symbol: 'Ds', name: { km: 'ដាមស្តាតទីយូម', en: 'Darmstadtium' }, mass: '281', group: 10, period: 7, category: 'transition', config: '[Rn] 5f¹⁴ 6d⁸ 7s²', phase: 'Synthetic', discovered: '1994', latticeType: 'UNKNOWN' },
  { number: 111, symbol: 'Rg', name: { km: 'រ៉ូអង់ហ្គេន្យូម', en: 'Roentgenium' }, mass: '282', group: 11, period: 7, category: 'transition', config: '[Rn] 5f¹⁴ 6d⁹ 7s²', phase: 'Synthetic', discovered: '1994', latticeType: 'UNKNOWN' },
  { number: 112, symbol: 'Cn', name: { km: 'កូពែរនិចស្យូម', en: 'Copernicium' }, mass: '285', group: 12, period: 7, category: 'transition', config: '[Rn] 5f¹⁴ 6d¹⁰ 7s²', phase: 'Synthetic', discovered: '1996', latticeType: 'UNKNOWN' },
  { number: 113, symbol: 'Nh', name: { km: 'នីហូញ៉ូម', en: 'Nihonium' }, mass: '286', group: 13, period: 7, category: 'post_transition', config: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p¹', phase: 'Synthetic', discovered: '2004', latticeType: 'UNKNOWN' },
  { number: 114, symbol: 'Fl', name: { km: 'ភ្លេរ៉ូវ្យូម', en: 'Flerovium' }, mass: '289', group: 14, period: 7, category: 'post_transition', config: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p²', phase: 'Synthetic', discovered: '1998', latticeType: 'UNKNOWN' },
  { number: 115, symbol: 'Mc', name: { km: 'ម៉ូស្កូវ្យូម', en: 'Moscovium' }, mass: '290', group: 15, period: 7, category: 'post_transition', config: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p³', phase: 'Synthetic', discovered: '2003', latticeType: 'UNKNOWN' },
  { number: 116, symbol: 'Lv', name: { km: 'លីវើម៉ូរ្យូម', en: 'Livermorium' }, mass: '293', group: 16, period: 7, category: 'post_transition', config: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁴', phase: 'Synthetic', discovered: '2000', latticeType: 'UNKNOWN' },
  { number: 117, symbol: 'Ts', name: { km: 'តែនណេសស៊ីន', en: 'Tennessine' }, mass: '294', group: 17, period: 7, category: 'halogen', config: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁵', phase: 'Synthetic', discovered: '2010', latticeType: 'UNKNOWN' },
  { number: 118, symbol: 'Og', name: { km: 'អូហ្គាណេសុង', en: 'Oganesson' }, mass: '294', group: 18, period: 7, category: 'noble', config: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶', phase: 'Synthetic', discovered: '2002', latticeType: 'UNKNOWN' }
];

const getShellsForElement = (z: number, explicitShells?: number[]) => {
  if (explicitShells && explicitShells.length > 0) return explicitShells;
  const maxShells = [2, 8, 18, 32, 32, 18, 8];
  let remaining = z;
  let shells = [];
  for (let max of maxShells) {
    if (remaining <= 0) break;
    let count = Math.min(remaining, max);
    shells.push(count);
    remaining -= count;
  }
  return shells;
};

class AudioSynth {
  private ctx: AudioContext | null = null;
  public enabled = true;
  constructor() {
    this.enabled = true;
  }
  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }
  playClick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch(e) {}
  }
  playSynthCraft() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch(e) {}
  }
}
const soundFx = new AudioSynth();

function Visualizer3DCanvas({ element, mode = 'atom' }: { element: any; mode?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [speed, setSpeed] = useState(0.01);
  const [wireframe, setWireframe] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;

    const initializeThree = () => {
      if (!(window as any).THREE) return;
      const THREE = (window as any).THREE;

      const container = mountRef.current;
      if (!container) return;
      const width = container.clientWidth || 320;
      const height = container.clientHeight || 320;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.z = 24;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
      scene.add(ambientLight);

      const pointLight1 = new THREE.PointLight(0x00f0ff, 3, 50);
      pointLight1.position.set(10, 10, 10);
      scene.add(pointLight1);

      const pointLight2 = new THREE.PointLight(0xff00aa, 2, 50);
      pointLight2.position.set(-10, -10, -10);
      scene.add(pointLight2);

      const mainGroup = new THREE.Group();
      scene.add(mainGroup);

      if (mode === 'atom') {
        const nGeo = new THREE.SphereGeometry(1.5, 24, 24);
        const nMat = new THREE.MeshStandardMaterial({ 
          color: 0x38bdf8, 
          emissive: 0x0284c7, 
          roughness: 0.2, 
          wireframe: wireframe 
        });
        const nMesh = new THREE.Mesh(nGeo, nMat);
        mainGroup.add(nMesh);

        const shellCounts = getShellsForElement(element.number);
        const shellObjects: any[] = [];

        shellCounts.forEach((count, sIdx) => {
          const radius = 3.8 + sIdx * 2.1;
          const tiltX = (sIdx * 0.4) + 0.2;
          const tiltY = (sIdx * 0.5) + 0.1;

          const ringGeo = new THREE.TorusGeometry(radius, 0.05, 16, 100);
          const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.4 });
          const ringMesh = new THREE.Mesh(ringGeo, ringMat);
          ringMesh.rotation.x = tiltX;
          ringMesh.rotation.y = tiltY;
          mainGroup.add(ringMesh);

          const eGeo = new THREE.SphereGeometry(0.35, 16, 16);
          const eMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff });

          for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const eMesh = new THREE.Mesh(eGeo, eMat);
            mainGroup.add(eMesh);
            shellObjects.push({ mesh: eMesh, radius, angle, speedVal: 0.02 / (sIdx + 1), tiltX, tiltY });
          }
        });

        mainGroup.userData.shellObjects = shellObjects;
      } else {
        const sphereGeo = new THREE.SphereGeometry(0.8, 16, 16);
        const matSphere = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.2, wireframe });
        const lineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.5 });

        const points: any[] = [];
        const spacing = 3.5;

        for (let x = -1; x <= 1; x++) {
          for (let y = -1; y <= 1; y++) {
            for (let z = -1; z <= 1; z++) {
              const mesh = new THREE.Mesh(sphereGeo, matSphere);
              mesh.position.set(x * spacing, y * spacing, z * spacing);
              mainGroup.add(mesh);
              points.push(mesh.position);
            }
          }
        }

        points.forEach((p1, i) => {
          points.forEach((p2, j) => {
            if (i < j && p1.distanceTo(p2) <= spacing + 0.1) {
              const geom = new THREE.BufferGeometry().setFromPoints([p1, p2]);
              const line = new THREE.Line(geom, lineMat);
              mainGroup.add(line);
            }
          });
        });
      }

      let isDragging = false;
      let prevMouse = { x: 0, y: 0 };

      const onMouseDown = (e: MouseEvent | TouchEvent) => {
        isDragging = true;
        const ce = 'touches' in e ? e.touches[0] : e;
        prevMouse = { x: ce.clientX, y: ce.clientY };
      };

      const onMouseMove = (e: MouseEvent | TouchEvent) => {
        if (!isDragging) return;
        const ce = 'touches' in e ? e.touches[0] : e;
        const curX = ce.clientX;
        const curY = ce.clientY;
        const dx = curX - prevMouse.x;
        const dy = curY - prevMouse.y;

        mainGroup.rotation.y += dx * 0.01;
        mainGroup.rotation.x += dy * 0.01;
        prevMouse = { x: curX, y: curY };
      };

      const onMouseUp = () => { isDragging = false; };

      const dom = renderer.domElement;
      dom.addEventListener('mousedown', onMouseDown);
      dom.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      dom.addEventListener('touchstart', onMouseDown);
      dom.addEventListener('touchmove', onMouseMove);
      window.addEventListener('touchend', onMouseUp);

      let animId: number;
      const animate = () => {
        animId = requestAnimationFrame(animate);

        if (mode === 'atom' && mainGroup.userData.shellObjects) {
          mainGroup.userData.shellObjects.forEach((obj: any) => {
            obj.angle += obj.speedVal * (speed / 0.01);
            const x = Math.cos(obj.angle) * obj.radius;
            const z = Math.sin(obj.angle) * obj.radius;
            obj.mesh.position.set(x, z * Math.sin(obj.tiltX), z * Math.cos(obj.tiltX));
          });
        }

        if (!isDragging) {
          mainGroup.rotation.y += speed;
          mainGroup.rotation.x += speed * 0.5;
        }

        renderer.render(scene, camera);
      };

      animate();

      return () => {
        cancelAnimationFrame(animId);
        dom.removeEventListener('mousedown', onMouseDown);
        dom.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        dom.removeEventListener('touchstart', onMouseDown);
        dom.removeEventListener('touchmove', onMouseMove);
        window.removeEventListener('touchend', onMouseUp);
        renderer.dispose();
      };
    };

    if (!(window as any).THREE) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.async = true;
      script.onload = () => initializeThree();
      document.head.appendChild(script);
    } else {
      initializeThree();
    }
  }, [element, mode, speed, wireframe]);

  return (
    <div className="relative w-full h-64 sm:h-80 bg-[var(--ground)] rounded-2xl overflow-hidden border border-[var(--ground-line)] shadow-inner flex items-center justify-center">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing"></div>
      
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-[var(--ground-raised)]/80 backdrop-blur-md px-2 py-1 rounded-xl border border-[var(--ground-line)] text-[10px]">
        <button 
          onClick={() => setWireframe(!wireframe)}
          className={`p-1 rounded-lg ${wireframe ? 'bg-cyan-600 text-white' : 'text-[var(--ink-dim)] hover:text-[var(--ink)]'}`}
          title="Toggle Wireframe"
        >
          <Box className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="absolute bottom-2 left-3 right-3 flex justify-between items-center text-[10px] font-mono text-cyan-400 bg-[var(--ground-raised)]/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[var(--ground-line)]">
        <span className="flex items-center gap-1"><Maximize2 className="w-3 h-3" /> {mode === 'atom' ? '3D Atom' : '3D Lattice'}</span>
        <span>Drag to rotate 360°</span>
      </div>
    </div>
  );
}

function PropertyRadarChart({ metrics }: { metrics: any }) {
  if (!metrics) return null;

  const labels = ['Hardness', 'Conductivity', 'Thermal', 'Density', 'Eco/Recycle'];
  const values = [
    metrics.hardness || 50,
    metrics.conductivity || 50,
    metrics.thermal || 50,
    metrics.density || 50,
    metrics.sustainability || 50
  ];

  const size = 180;
  const center = size / 2;
  const radius = 65;
  const totalAxes = 5;

  const getCoordinates = (index: number, valuePercent: number) => {
    const angle = (Math.PI * 2 / totalAxes) * index - Math.PI / 2;
    const r = (radius * valuePercent) / 100;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  const polyPoints = values.map((val, idx) => {
    const { x, y } = getCoordinates(idx, val);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="flex flex-col items-center justify-center p-3 bg-[var(--ground)] rounded-2xl border border-[var(--ground-line)]/80">
      <svg width={size} height={size} className="overflow-visible">
        {[20, 40, 60, 80, 100].map(level => {
          const pts = Array.from({ length: totalAxes }).map((_, i) => {
            const { x, y } = getCoordinates(i, level);
            return `${x},${y}`;
          }).join(' ');
          return (
            <polygon 
              key={level} 
              points={pts} 
              fill="none" 
              stroke="#334155" 
              strokeWidth="1" 
              strokeDasharray={level === 100 ? "none" : "2 2"}
            />
          );
        })}

        {Array.from({ length: totalAxes }).map((_, i) => {
          const { x, y } = getCoordinates(i, 100);
          return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="#334155" strokeWidth="1" />;
        })}

        <polygon points={polyPoints} fill="rgba(56, 189, 248, 0.3)" stroke="#38bdf8" strokeWidth="2" />

        {values.map((val, idx) => {
          const { x, y } = getCoordinates(idx, val);
          return <circle key={idx} cx={x} cy={y} r="3" fill="#00f0ff" />;
        })}
      </svg>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] font-mono mt-2 text-[var(--ink-dim)]">
        <span>H: {values[0]}%</span>
        <span>C: {values[1]}%</span>
        <span>T: {values[2]}%</span>
        <span>D: {values[3]}%</span>
      </div>
    </div>
  );
}

function MaterialCraftingLab({ lang }: { lang: "km" | "en" }) {
  const [slot1, setSlot1] = useState<any>(null);
  const [slot2, setSlot2] = useState<any>(null);
  const [result, setResult] = useState<any>(null);

  const recipes: { in: string[]; out: { name: { km: string; en: string }; desc: string } }[] = [
    { in: ['Cu', 'Zn'], out: { name: { km: 'លង្ហិន (Brass)', en: 'Brass Alloy' }, desc: 'Copper + Zinc = Brass (Non-sparking acoustic metal)' } },
    { in: ['Fe', 'C'], out: { name: { km: 'ដែកថែប (Steel)', en: 'Steel Alloy' }, desc: 'Iron + Carbon = Structural High-Tensile Steel' } },
    { in: ['Cu', 'Sn'], out: { name: { km: 'សំរឹទ្ធ (Bronze)', en: 'Bronze Alloy' }, desc: 'Copper + Tin = Marine Seawater Resistant Bronze' } },
    { in: ['C', 'C'], out: { name: { km: 'ក្រាហ្វែន ឬ ពេជ្រ (Diamond/Graphene)', en: 'Graphene / Diamond' }, desc: 'Pure Carbon under extreme synthesis' } },
    { in: ['Si', 'O'], out: { name: { km: 'កញ្ចក់ស៊ីលីកា (Silica Glass)', en: 'Silica Glass / Quartz' }, desc: 'Silicon + Oxygen = High-purity Glass' } },
  ];

  const handleSynthesize = () => {
    soundFx.playSynthCraft();
    if (!slot1 || !slot2) return;

    const match = recipes.find(r => 
      (r.in[0] === slot1.symbol && r.in[1] === slot2.symbol) ||
      (r.in[1] === slot1.symbol && r.in[0] === slot2.symbol)
    );

    if (match) {
      setResult(match.out);
    } else {
      setResult({ name: { km: 'សារធាតុផ្សំមិនស្គាល់ (Unknown Reaction)', en: 'Unknown Synthetic Mixture' }, desc: 'No stable compound formed for this combination.' });
    }
  };

  return (
    <div className="p-5 rounded-3xl bg-[var(--ground-raised)] border border-[var(--ground-line)] text-[var(--ink)] max-w-2xl mx-auto space-y-5 shadow-2xl">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-500/30">
          <FlaskConical className="w-6 h-6 animate-bounce" />
        </div>
        <div>
          <h3 className="font-bold text-lg">{uiTranslations[lang].craftingTitle}</h3>
          <p className="text-xs text-[var(--ink-dim)]">{uiTranslations[lang].craftingDesc}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl border border-dashed border-[var(--ground-line)] bg-[var(--ground)]/60 flex flex-col items-center justify-center min-h-[100px]">
          {slot1 ? (
            <div className="text-center">
              <span className="text-xl font-bold text-cyan-400 font-mono">{slot1.symbol}</span>
              <div className="text-xs font-semibold">{slot1.name[lang]}</div>
              <button onClick={() => setSlot1(null)} className="text-[10px] text-red-400 mt-1 hover:underline">Remove</button>
            </div>
          ) : (
            <span className="text-xs text-[var(--ink-faint)]">Slot 1 (Select Below)</span>
          )}
        </div>

        <div className="p-4 rounded-2xl border border-dashed border-[var(--ground-line)] bg-[var(--ground)]/60 flex flex-col items-center justify-center min-h-[100px]">
          {slot2 ? (
            <div className="text-center">
              <span className="text-xl font-bold text-cyan-400 font-mono">{slot2.symbol}</span>
              <div className="text-xs font-semibold">{slot2.name[lang]}</div>
              <button onClick={() => setSlot2(null)} className="text-[10px] text-red-400 mt-1 hover:underline">Remove</button>
            </div>
          ) : (
            <span className="text-xs text-[var(--ink-faint)]">Slot 2 (Select Below)</span>
          )}
        </div>
      </div>

      <div>
        <div className="text-xs text-[var(--ink-dim)] font-medium mb-2">Select Base Ingredients:</div>
        <div className="flex flex-wrap gap-2">
          {periodicElementsData.slice(0, 10).map(el => (
            <button
              key={el.number}
              onClick={() => {
                if (!slot1) setSlot1(el);
                else if (!slot2) setSlot2(el);
              }}
              className="px-3 py-1.5 rounded-xl bg-[var(--ground-raised-hi)] hover:bg-[var(--ground-raised-hi)] border border-[var(--ground-line)] text-xs font-mono text-cyan-300 font-bold active:scale-95"
            >
              {el.symbol} ({el.name[lang]})
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSynthesize}
          disabled={!slot1 || !slot2}
          className={`w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            slot1 && slot2 ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg' : 'bg-[var(--ground-raised-hi)] text-[var(--ink-faint)]'
          }`}
        >
          <Hammer className="w-4 h-4" />
          {uiTranslations[lang].craftBtn}
        </button>
        <button 
          onClick={() => { setSlot1(null); setSlot2(null); setResult(null); }}
          className="px-4 py-3 bg-[var(--ground-raised-hi)] hover:bg-[var(--ground-raised-hi)] text-[var(--ink-dim)] rounded-2xl text-xs font-bold"
        >
          {uiTranslations[lang].clearCraft}
        </button>
      </div>

      {result && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border border-cyan-500/40 animate-in fade-in">
          <div className="text-xs text-cyan-400 font-bold flex items-center gap-1.5 mb-1">
            <Sparkles className="w-4 h-4" /> {uiTranslations[lang].craftResult}
          </div>
          <div className="text-base font-bold text-white">{result.name[lang]}</div>
          <div className="text-xs text-[var(--ink-dim)] mt-1">{result.desc}</div>
        </div>
      )}
    </div>
  );
}

function ScienceQuizModule({ lang }: { lang: "km" | "en" }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const questions = [
    {
      q: { km: 'តើសារធាតុរឹងណាដែលរឹងជាងគេបំផុតលើផែនដី?', en: 'Which is the hardest natural substance on Earth?' },
      opts: ['Graphene', 'Diamond', 'Steel', 'Titanium'],
      ans: 1
    },
    {
      q: { km: 'តើធាតុគីមីណាដែលមានសមត្ថភាពចម្លងអគ្គិសនីខ្ពស់ជាងគេ?', en: 'Which element has the highest electrical conductivity?' },
      opts: ['Copper (Cu)', 'Gold (Au)', 'Silver (Ag)', 'Aluminum (Al)'],
      ans: 2
    },
    {
      q: { km: 'តើសារធាតុ "អេរ៉ូជែល" (Aerogel) ផ្សំឡើងពីខ្យល់ប៉ុន្មានភាគរយ?', en: 'What percentage of Aerogel consists of air?' },
      opts: ['50%', '75%', '90%', '99.8%'],
      ans: 3
    }
  ];

  const handleSelect = (idx: number) => {
    setSelectedOption(idx);
    if (idx === questions[currentIdx].ans) {
      setScore(score + 10);
      soundFx.playSynthCraft();
    } else {
      soundFx.playClick();
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    setCurrentIdx((currentIdx + 1) % questions.length);
  };

  const q = questions[currentIdx];

  return (
    <div className="p-6 rounded-3xl bg-[var(--ground-raised)] border border-[var(--ground-line)] text-[var(--ink)] max-w-xl mx-auto space-y-5 shadow-2xl">
      <div className="flex justify-between items-center border-b border-[var(--ground-line)] pb-3">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-sm sm:text-base">{uiTranslations[lang].quizTitle}</h3>
        </div>
        <div className="text-xs font-mono bg-blue-600/20 text-cyan-300 px-3 py-1 rounded-xl border border-blue-500/30 font-bold">
          {uiTranslations[lang].quizScore}: {score}
        </div>
      </div>

      <div className="text-sm font-semibold text-[var(--ink)]">
        #{currentIdx + 1}. {q.q[lang]}
      </div>

      <div className="space-y-2">
        {q.opts.map((opt, idx) => {
          const isCorrect = idx === q.ans;
          const isSelected = selectedOption === idx;
          let btnClass = 'bg-[var(--ground-raised-hi)] border-[var(--ground-line)] text-[var(--ink)] hover:bg-[var(--ground-raised-hi)]';
          if (selectedOption !== null) {
            if (isCorrect) btnClass = 'bg-emerald-600 text-white border-emerald-500';
            else if (isSelected) btnClass = 'bg-red-600 text-white border-red-500';
          }

          return (
            <button
              key={idx}
              disabled={selectedOption !== null}
              onClick={() => handleSelect(idx)}
              className={`w-full text-left p-3 rounded-2xl border text-xs font-semibold transition-all flex justify-between items-center ${btnClass}`}
            >
              <span>{opt}</span>
              {selectedOption !== null && isCorrect && <Check className="w-4 h-4 text-white" />}
            </button>
          );
        })}
      </div>

      {selectedOption !== null && (
        <button
          onClick={handleNext}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all"
        >
          {uiTranslations[lang].nextQuestion}
        </button>
      )}
    </div>
  );
}

function GooglePeriodicGrid({ elements, lang, onSelectElement, searchQuery }: { elements: any[]; lang: "km" | "en"; onSelectElement: (el: any) => void; searchQuery: string }) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filtered = useMemo(() => {
    return elements.filter(e => {
      const matchCat = selectedCategory === 'all' || e.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQ = !q || e.name.km.toLowerCase().includes(q) || e.name.en.toLowerCase().includes(q) || e.symbol.toLowerCase().includes(q) || e.number.toString() === q;
      return matchCat && matchQ;
    });
  }, [elements, selectedCategory, searchQuery]);

  // Map elements into 18-column grid slots
  return (
    <div className="space-y-4">
      {/* Category Pills Filter */}
      <div className="flex overflow-x-auto no-scrollbar gap-1.5 py-1">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            selectedCategory === 'all' ? 'bg-cyan-600 text-white' : 'bg-[var(--ground-raised-hi)]/80 text-[var(--ink-dim)] hover:bg-[var(--ground-raised-hi)]'
          }`}
        >
          {uiTranslations[lang].allCategories}
        </button>
        {Object.entries(periodicCategoryMap).map(([catKey, catInfo]) => (
          <button
            key={catKey}
            onClick={() => setSelectedCategory(catKey)}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border ${catInfo.color} ${
              selectedCategory === catKey ? 'ring-2 ring-cyan-400 scale-105' : 'opacity-80 hover:opacity-100'
            }`}
          >
            {catInfo[lang]}
          </button>
        ))}
      </div>

      {/* Google 3D Style 18-Column Grid Container */}
      <div className="overflow-x-auto pb-4 pt-2 no-scrollbar">
        <div 
          className="grid gap-1.5 min-w-[1000px]" 
          style={{ gridTemplateColumns: 'repeat(18, minmax(54px, 1fr))' }}
        >
          {Array.from({ length: 7 }).map((_, pIdx) => {
            const periodNum = pIdx + 1;
            return Array.from({ length: 18 }).map((_, gIdx) => {
              const groupNum = gIdx + 1;

              const el = filtered.find(e => e.period === periodNum && e.group === groupNum);

              if (!el) {
                return <div key={`empty-${periodNum}-${groupNum}`} className="h-16"></div>;
              }

              const catStyle = periodicCategoryMap[el.category]?.color || 'bg-[var(--ground-raised-hi)] text-[var(--ink-dim)] border-[var(--ground-line)]';

              return (
                <div
                  key={el.number}
                  onClick={() => {
                    soundFx.playClick();
                    onSelectElement(el);
                  }}
                  className={`p-1 rounded-xl border transition-all cursor-pointer hover:scale-110 hover:z-20 flex flex-col justify-between h-16 relative group shadow-sm ${catStyle}`}
                >
                  <div className="flex justify-between items-center text-[8px] font-mono opacity-80">
                    <span>{el.number}</span>
                    <span className="text-[7px] truncate max-w-[24px]">{el.mass}</span>
                  </div>
                  <div className="text-center my-auto">
                    <div className="text-sm font-black text-cyan-300 drop-shadow">{el.symbol}</div>
                    <div className="text-[8px] font-bold truncate leading-none">{el.name[lang]}</div>
                  </div>
                </div>
              );
            });
          })}

          {/* Spacer row between Main Grid and Lanthanides / Actinides */}
          <div className="col-span-18 h-3"></div>

          {/* Lanthanide Row (Row 8) */}
          <div className="col-span-2 text-right pr-2 flex items-center justify-end text-[10px] font-bold text-pink-400">
            Lanthanides:
          </div>
          {filtered.filter(e => e.period === 8).map(el => {
            const catStyle = periodicCategoryMap[el.category]?.color || 'bg-[var(--ground-raised-hi)] text-[var(--ink-dim)] border-[var(--ground-line)]';
            return (
              <div
                key={el.number}
                onClick={() => { soundFx.playClick(); onSelectElement(el); }}
                className={`p-1 rounded-xl border transition-all cursor-pointer hover:scale-110 hover:z-20 flex flex-col justify-between h-16 relative shadow-sm ${catStyle}`}
              >
                <div className="flex justify-between items-center text-[8px] font-mono opacity-80">
                  <span>{el.number}</span>
                  <span className="text-[7px] truncate max-w-[24px]">{el.mass}</span>
                </div>
                <div className="text-center my-auto">
                  <div className="text-sm font-black text-pink-300 drop-shadow">{el.symbol}</div>
                  <div className="text-[8px] font-bold truncate leading-none">{el.name[lang]}</div>
                </div>
              </div>
            );
          })}
          <div className="col-span-1"></div>

          {/* Actinide Row (Row 9) */}
          <div className="col-span-2 text-right pr-2 flex items-center justify-end text-[10px] font-bold text-fuchsia-400">
            Actinides:
          </div>
          {filtered.filter(e => e.period === 9).map(el => {
            const catStyle = periodicCategoryMap[el.category]?.color || 'bg-[var(--ground-raised-hi)] text-[var(--ink-dim)] border-[var(--ground-line)]';
            return (
              <div
                key={el.number}
                onClick={() => { soundFx.playClick(); onSelectElement(el); }}
                className={`p-1 rounded-xl border transition-all cursor-pointer hover:scale-110 hover:z-20 flex flex-col justify-between h-16 relative shadow-sm ${catStyle}`}
              >
                <div className="flex justify-between items-center text-[8px] font-mono opacity-80">
                  <span>{el.number}</span>
                  <span className="text-[7px] truncate max-w-[24px]">{el.mass}</span>
                </div>
                <div className="text-center my-auto">
                  <div className="text-sm font-black text-fuchsia-300 drop-shadow">{el.symbol}</div>
                  <div className="text-[8px] font-bold truncate leading-none">{el.name[lang]}</div>
                </div>
              </div>
            );
          })}
          <div className="col-span-1"></div>
        </div>
      </div>
    </div>
  );
}

export default function MaterialsApp() {
  const { mode } = useLanguage();
  const lang: "km" | "en" = mode === "bi" ? "en" : mode;
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('materials'); // 'materials' | 'periodic' | 'crafting' | 'quiz'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState('grid');
  const [periodicGridMode, setPeriodicGridMode] = useState('google3d'); // 'google3d' | 'compact'
  const [compareList, setCompareList] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [view3DMode, setView3DMode] = useState('atom'); // 'atom' | 'lattice'
  const [soundEnabled, setSoundEnabled] = useState(true);

  const t = uiTranslations[lang];

  const categories = [
    { id: 'all', label: t.allCategories, icon: Globe },
    { id: 'advanced', label: t.advanced, icon: Cpu },
    { id: 'metals', label: t.metals, icon: Zap },
    { id: 'alloys', label: t.alloys, icon: Shield },
    { id: 'plastics', label: t.plastics, icon: Droplet },
    { id: 'natural', label: t.natural, icon: Leaf },
    { id: 'ceramics', label: t.ceramics, icon: Layers },
    { id: 'minerals', label: t.minerals, icon: Sparkles },
    { id: 'favs', label: t.favorites, icon: Bookmark },
  ];

  const filteredMaterials = useMemo(() => {
    return materialsData.filter(m => {
      const isFav = activeCategory === 'favs' ? favorites.includes(m.id) : true;
      const matchesCat = activeCategory === 'all' || activeCategory === 'favs' || m.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q || 
        m.name.km.toLowerCase().includes(q) || 
        m.name.en.toLowerCase().includes(q) || 
        m.symbol.toLowerCase().includes(q);
      
      return isFav && matchesCat && matchesQuery;
    });
  }, [searchQuery, activeCategory, favorites]);

  const filteredElements = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return periodicElementsData;
    return periodicElementsData.filter(e => 
      e.name.km.toLowerCase().includes(q) ||
      e.name.en.toLowerCase().includes(q) ||
      e.symbol.toLowerCase().includes(q) ||
      e.number.toString() === q
    );
  }, [searchQuery]);

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    soundFx.playClick();
    setFavorites(prev => prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]);
  };

  const toggleCompare = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    soundFx.playClick();
    setCompareList(prev => {
      if (prev.includes(id)) return prev.filter(cId => cId !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const handleCopy = (text: string, id: string) => {
    soundFx.playClick();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const speakText = (text: string) => {
    soundFx.playClick();
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'km' ? 'km-KH' : 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-300 font-sans bg-[var(--ground)] text-[var(--ink)]">
      
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl opacity-20 bg-[var(--slate-accent)]"></div>
        <div className="absolute top-1/2 -right-24 w-96 h-96 rounded-full blur-3xl opacity-15 bg-[var(--teal)]"></div>
      </div>

      <header className="sticky top-0 z-30 backdrop-blur-md border-b transition-colors bg-[var(--ground-raised)]/85 border-[var(--ground-line)]/80">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/20">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight tracking-tight">{t.appTitle}</h1>
              <p className="text-[10px] text-[var(--ink-dim)] font-medium hidden sm:block">{t.appSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center p-1 rounded-xl border overflow-x-auto no-scrollbar bg-[var(--ground-raised)] border-[var(--ground-line)]">
            <button
              onClick={() => { soundFx.playClick(); setActiveTab('materials'); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'materials' ? 'bg-blue-600 text-white shadow-sm' : 'text-[var(--ink-dim)] hover:text-[var(--ink)]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{t.tabMaterials}</span>
            </button>
            <button
              onClick={() => { soundFx.playClick(); setActiveTab('periodic'); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'periodic' ? 'bg-blue-600 text-white shadow-sm' : 'text-[var(--ink-dim)] hover:text-[var(--ink)]'
              }`}
            >
              <Atom className="w-3.5 h-3.5 animate-pulse text-cyan-300" />
              <span>{t.tabPeriodic}</span>
            </button>
            <button
              onClick={() => { soundFx.playClick(); setActiveTab('crafting'); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'crafting' ? 'bg-blue-600 text-white shadow-sm' : 'text-[var(--ink-dim)] hover:text-[var(--ink)]'
              }`}
            >
              <Hammer className="w-3.5 h-3.5" />
              <span>{t.tabCrafting}</span>
            </button>
            <button
              onClick={() => { soundFx.playClick(); setActiveTab('quiz'); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'quiz' ? 'bg-blue-600 text-white shadow-sm' : 'text-[var(--ink-dim)] hover:text-[var(--ink)]'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>{t.tabQuiz}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-grow max-w-xs sm:max-w-md justify-end">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-dim)]" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 rounded-xl text-xs sm:text-sm border outline-none transition-all bg-[var(--ground-raised)] border-[var(--ground-line)] text-[var(--ink)] placeholder-[var(--ink-faint)] focus:border-blue-500"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-dim)] hover:text-[var(--ink)]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                soundFx.enabled = next;
              }}
              className="p-2 rounded-xl border transition-all active:scale-95 bg-[var(--ground-raised)] border-[var(--ground-line)] text-cyan-400 hover:bg-[var(--ground-raised-hi)]"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <span
              className="p-2 rounded-xl text-xs font-bold border bg-[var(--ground-raised)] border-[var(--ground-line)] text-cyan-400"
            >
              {lang === 'km' ? 'KM' : 'EN'}
            </span>

            <button
              onClick={() => { soundFx.playClick(); setDarkMode(!darkMode); }}
              className="p-2 rounded-xl border transition-all active:scale-95 bg-[var(--ground-raised)] border-[var(--ground-line)] text-amber-400 hover:bg-[var(--ground-raised-hi)]"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-5 pb-28">
        
        {/* TAB 1: MATERIALS CATALOG */}
        {activeTab === 'materials' && (
          <>
            <div className="flex items-center justify-between gap-2 mb-5">
              <div className="flex overflow-x-auto no-scrollbar gap-1.5 py-1 -mx-4 px-4 sm:mx-0 sm:px-0">
                {categories.map(cat => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => { soundFx.playClick(); setActiveCategory(cat.id); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                          : 'bg-[var(--ground-raised)] border border-[var(--ground-line)] text-[var(--ink-dim)] hover:text-[var(--ink)] hover:bg-[var(--ground-raised-hi)]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{cat.label}</span>
                      {cat.id === 'favs' && favorites.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-black text-[10px] rounded-full font-bold">
                          {favorites.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="hidden sm:flex items-center gap-1 p-1 rounded-xl border bg-[var(--ground-raised)] border-[var(--ground-line)]">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-[var(--ground-raised-hi)] text-[var(--ink)] shadow-sm' : 'text-[var(--ink-dim)]'}`}
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-[var(--ground-raised-hi)] text-[var(--ink)] shadow-sm' : 'text-[var(--ink-dim)]'}`}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {filteredMaterials.length > 0 ? (
              <div className={
                viewMode === 'grid' 
                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5" 
                  : "flex flex-col gap-2.5"
              }>
                {filteredMaterials.map(item => {
                  const Icon = item.icon;
                  const isFav = favorites.includes(item.id);
                  const isCompared = compareList.includes(item.id);

                  return (
                    <div
                      key={item.id}
                      onClick={() => { soundFx.playClick(); setSelectedMaterial(item); }}
                      className={`group relative rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden active:scale-[0.98] bg-[var(--ground-raised)] border-[var(--ground-line)] hover:border-[var(--ground-line)] hover:shadow-md ${
                        viewMode === 'list' ? 'p-3.5 flex items-center gap-3.5' : 'p-4 flex flex-col justify-between h-48'}`}
                    >
                      <div className={viewMode === 'list' ? 'contents' : 'flex justify-between items-start'}>
                        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${item.accent} flex items-center justify-center shadow-sm`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>

                        {viewMode === 'grid' && (
                          <div className="flex items-center gap-1 z-10">
                            <button
                              onClick={(e) => toggleCompare(e, item.id)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isCompared 
                                  ? 'bg-blue-600 text-white' 
                                  : 'text-[var(--ink-dim)] hover:text-[var(--ink)] hover:bg-[var(--ground-raised-hi)]'
                              }`}
                              title="Compare"
                            >
                              <Scale className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => toggleFavorite(e, item.id)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isFav 
                                  ? 'text-amber-400 fill-amber-400' 
                                  : 'text-[var(--ink-dim)] hover:text-[var(--ink)] hover:bg-[var(--ground-raised-hi)]'
                              }`}
                            >
                              <Bookmark className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className={viewMode === 'list' ? 'flex-grow min-w-0' : 'mt-2'}>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-bold text-sm sm:text-base leading-snug text-[var(--ink)]">
                            {item.name[lang]}
                          </h3>
                          
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border bg-[var(--ground-raised-hi)] text-cyan-300 border-[var(--ground-line)]">
                            {item.symbol}
                          </span>
                        </div>

                        <p className="text-xs line-clamp-2 leading-relaxed text-[var(--ink-dim)]">
                          {item.description[lang]}
                        </p>
                      </div>

                      {viewMode === 'grid' && (
                        <div className="mt-3 pt-2.5 border-t flex items-center justify-between text-[11px] font-medium border-[var(--ground-line)] text-[var(--ink-dim)]">
                          <span className="flex items-center gap-1">
                            <Flame className="w-3 h-3 text-amber-500" />
                            {item.spec.melting}
                          </span>
                          <span className="flex items-center gap-1 text-blue-500 group-hover:translate-x-0.5 transition-transform">
                            {t.properties}
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 rounded-3xl border border-dashed bg-[var(--ground-raised)] border-[var(--ground-line)]">
                <Search className="w-10 h-10 text-[var(--ink-faint)] mx-auto mb-3 opacity-60" />
                <p className="text-sm font-medium text-[var(--ink-dim)]">{t.noResults}</p>
              </div>
            )}
          </>
        )}

        {/* TAB 2: INTERACTIVE 3D PERIODIC TABLE OF ELEMENTS */}
        {activeTab === 'periodic' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl border bg-[var(--ground-raised)] border-[var(--ground-line)]">
              <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Atom className="w-5 h-5 text-cyan-400 animate-spin" />
                    {t.tabPeriodic} ({periodicElementsData.length} ធាតុគីមី)
                  </h2>
                  <p className="text-xs text-[var(--ink-dim)]">Google 3D Periodic Table Style - 18 Columns Grid Layout</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPeriodicGridMode('google3d')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      periodicGridMode === 'google3d' ? 'bg-blue-600 text-white' : 'bg-[var(--ground-raised-hi)] text-[var(--ink-dim)]'
                    }`}
                  >
                    {t.gridGoogle3D}
                  </button>
                  <button
                    onClick={() => setPeriodicGridMode('compact')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      periodicGridMode === 'compact' ? 'bg-blue-600 text-white' : 'bg-[var(--ground-raised-hi)] text-[var(--ink-dim)]'
                    }`}
                  >
                    {t.gridCompact}
                  </button>
                </div>
              </div>

              {periodicGridMode === 'google3d' ? (
                <GooglePeriodicGrid 
                  elements={periodicElementsData} 
                  lang={lang} 
                  onSelectElement={(el) => setSelectedElement({ ...el, shells: getShellsForElement(el.number) })}
                  searchQuery={searchQuery}
                />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 max-h-[75vh] overflow-y-auto p-1">
                  {filteredElements.map(el => {
                    const catStyle = periodicCategoryMap[el.category]?.color || 'bg-[var(--ground-raised-hi)] text-[var(--ink-dim)] border-[var(--ground-line)]';
                    return (
                      <div
                        key={el.number}
                        onClick={() => { 
                          soundFx.playClick(); 
                          setSelectedElement({
                            ...el,
                            shells: getShellsForElement(el.number)
                          }); 
                        }}
                        className={`p-2 rounded-xl border transition-all cursor-pointer hover:scale-105 active:scale-95 flex flex-col justify-between h-28 relative overflow-hidden group ${catStyle} hover:bg-[var(--ground-raised-hi)]`}
                      >
                        <div className="flex justify-between items-start text-[10px] font-mono opacity-80 z-10">
                          <span>#{el.number}</span>
                          <span>{el.mass}</span>
                        </div>

                        <div className="text-center my-auto z-10">
                          <div className="text-xl font-black tracking-wider text-cyan-300 drop-shadow">{el.symbol}</div>
                          <div className="text-[10px] font-bold truncate leading-tight">{el.name[lang]}</div>
                        </div>

                        <div className="flex justify-between items-center text-[9px] font-mono opacity-80 z-10">
                          <span className="text-amber-300 font-semibold">{el.phase}</span>
                          <span className="truncate max-w-[60px]">{el.config}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: SYNTHESIZER & CRAFTING LAB */}
        {activeTab === 'crafting' && (
          <MaterialCraftingLab lang={lang} />
        )}

        {/* TAB 4: SCIENCE QUIZ */}
        {activeTab === 'quiz' && (
          <ScienceQuizModule lang={lang} />
        )}

      </main>

      {/* FLOATING COMPARISON BAR */}
      {compareList.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-[var(--ground-raised)] text-[var(--ink)] px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-[var(--ground-line)] text-xs">
          <Scale className="w-4 h-4 text-blue-400" />
          <span>{compareList.length} / 2 {t.compare}</span>
          <button
            onClick={() => setShowCompareModal(true)}
            disabled={compareList.length < 2}
            className={`px-3 py-1 rounded-xl font-bold transition-all ${
              compareList.length === 2 
                ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                : 'bg-[var(--ground-raised-hi)] text-[var(--ink-faint)] cursor-not-allowed'
            }`}
          >
            {t.compareTitle}
          </button>
          <button 
            onClick={() => setCompareList([])}
            className="text-[var(--ink-dim)] hover:text-[var(--ink)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MATERIAL DETAILS MODAL */}
      {selectedMaterial && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div 
            className="fixed inset-0 bg-[var(--ground)]/70 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedMaterial(null)}
          ></div>

          <div className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border overflow-hidden z-10 animate-in slide-in-from-bottom duration-300 bg-[var(--ground-raised)] border-[var(--ground-line)] text-[var(--ink)]">
            
            <div className={`p-6 bg-gradient-to-br ${selectedMaterial.accent} relative`}>
              <button 
                onClick={() => setSelectedMaterial(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                  {React.createElement(selectedMaterial.icon, { className: 'w-6 h-6 text-white' })}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-white">{selectedMaterial.name[lang]}</h2>
                    <button 
                      onClick={() => speakText(selectedMaterial.name[lang])}
                      className="p-1 rounded bg-black/20 hover:bg-black/40 text-white"
                      title={t.speakTitle}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono font-bold bg-black/40 text-cyan-300 px-2 py-0.5 rounded-md border border-white/10">
                      {selectedMaterial.symbol}
                    </span>
                    <button 
                      onClick={() => handleCopy(selectedMaterial.symbol, 'symbol')}
                      className="text-xs text-white/80 hover:text-white flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded"
                    >
                      {copiedId === 'symbol' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4 text-xs sm:text-sm">
              <p className="leading-relaxed font-medium text-[var(--ink)]">
                {selectedMaterial.description[lang]}
              </p>

              {selectedMaterial.metrics && (
                <div>
                  <h4 className="font-bold mb-2 text-cyan-400">{t.radarChart}</h4>
                  <PropertyRadarChart metrics={selectedMaterial.metrics} />
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl border bg-[var(--ground)] border-[var(--ground-line)] text-[var(--ink)]">
                <div>
                  <div className="text-[10px] text-[var(--ink-dim)] font-medium">{t.densityLabel}</div>
                  <div className="font-bold truncate mt-0.5">{selectedMaterial.spec.density}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[var(--ink-dim)] font-medium">{t.meltingPoint}</div>
                  <div className="font-bold truncate mt-0.5">{selectedMaterial.spec.melting}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[var(--ink-dim)] font-medium">{t.recyclable}</div>
                  <div className="font-bold truncate mt-0.5 text-emerald-400">{selectedMaterial.spec.recyclable}</div>
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-2 flex items-center gap-1.5 text-blue-400">
                  <Sparkles className="w-4 h-4" />
                  {t.properties}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedMaterial.properties[lang].map((p: string, idx: number) => (
                    <span 
                      key={idx}
                      className="px-2.5 py-1 rounded-xl text-xs font-semibold border bg-[var(--ground-raised-hi)] text-cyan-300 border-[var(--ground-line)]"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-2 flex items-center gap-1.5 text-emerald-400">
                  <Shield className="w-4 h-4" />
                  {t.applications}
                </h4>
                <ul className="space-y-1.5 pl-1">
                  {selectedMaterial.applications[lang].map((a: string, idx: number) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span className="text-[var(--ink)]">{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-4 border-t flex justify-end gap-2 border-[var(--ground-line)]">
              <button
                onClick={() => setSelectedMaterial(null)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs transition-colors"
              >
                {t.close}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ELEMENT DETAILS MODAL */}
      {selectedElement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[var(--ground)]/80 backdrop-blur-sm" onClick={() => setSelectedElement(null)}></div>
          
          <div className="relative w-full max-w-lg rounded-3xl p-6 border shadow-2xl z-10 max-h-[90vh] overflow-y-auto bg-[var(--ground-raised)] border-[var(--ground-line)] text-[var(--ink)]">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-xs font-mono text-cyan-400 flex items-center gap-1">
                  <Atom className="w-4 h-4 text-cyan-400 animate-spin" />
                  {t.elementDetails} #{selectedElement.number}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <h3 className="text-2xl font-black">{selectedElement.name[lang]} ({selectedElement.symbol})</h3>
                  <button onClick={() => speakText(selectedElement.name[lang])} className="p-1 rounded bg-[var(--ground-raised-hi)] text-cyan-300">
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <button onClick={() => setSelectedElement(null)} className="p-1.5 rounded-lg hover:bg-[var(--ground-raised-hi)]">
                <X className="w-5 h-5 text-[var(--ink-dim)]" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-2 p-1 bg-[var(--ground)]/60 rounded-xl border border-[var(--ground-line)]">
              <button
                onClick={() => setView3DMode('atom')}
                className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                  view3DMode === 'atom' ? 'bg-blue-600 text-white' : 'text-[var(--ink-dim)]'
                }`}
              >
                {t.view3DAtom}
              </button>
              <button
                onClick={() => setView3DMode('lattice')}
                className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                  view3DMode === 'lattice' ? 'bg-blue-600 text-white' : 'text-[var(--ink-dim)]'
                }`}
              >
                {t.view3DLattice}
              </button>
            </div>

            <div className="my-2">
              <Visualizer3DCanvas element={selectedElement} mode={view3DMode} />
            </div>

            <div className="grid grid-cols-2 gap-2 my-3 text-xs">
              <div className="p-2.5 rounded-xl bg-[var(--ground)]/60 border border-[var(--ground-line)]">
                <span className="text-[var(--ink-dim)] block">{t.atomicMass}:</span>
                <strong className="text-[var(--ink)] text-sm">{selectedElement.mass} u</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--ground)]/60 border border-[var(--ground-line)]">
                <span className="text-[var(--ink-dim)] block">{t.electronConfig}:</span>
                <strong className="text-cyan-300 font-mono text-sm">{selectedElement.config}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--ground)]/60 border border-[var(--ground-line)]">
                <span className="text-[var(--ink-dim)] block">{t.shells}:</span>
                <strong className="text-amber-300 font-mono text-sm">{(selectedElement.shells || []).join(' - ')}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--ground)]/60 border border-[var(--ground-line)]">
                <span className="text-[var(--ink-dim)] block">{t.phase} / {t.discoveredBy}:</span>
                <strong className="text-emerald-300 text-sm">{selectedElement.phase} ({selectedElement.discovered})</strong>
              </div>
            </div>

            <button
              onClick={() => setSelectedElement(null)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs transition-colors"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}

      {/* COMPARE MODAL */}
      {showCompareModal && compareList.length === 2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[var(--ground)]/70 backdrop-blur-sm" onClick={() => setShowCompareModal(false)}></div>
          
          <div className="relative w-full max-w-2xl rounded-3xl p-6 border shadow-2xl z-10 max-h-[85vh] overflow-y-auto bg-[var(--ground-raised)] border-[var(--ground-line)] text-[var(--ink)]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Scale className="w-5 h-5 text-blue-500" />
                {t.compareTitle}
              </h3>
              <button onClick={() => setShowCompareModal(false)}>
                <X className="w-5 h-5 text-[var(--ink-dim)]" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {compareList.map(id => {
                const item = materialsData.find(m => m.id === id);
                if (!item) return null;
                return (
                  <div key={item.id} className="p-4 rounded-2xl border border-[var(--ground-line)] bg-[var(--ground)]/60">
                    <div className="font-bold text-base">{item.name[lang]}</div>
                    <div className="text-xs font-mono text-cyan-400 mb-3">{item.symbol}</div>
                    
                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="text-[10px] text-[var(--ink-dim)]">{t.densityLabel}</div>
                        <div className="font-semibold">{item.spec.density}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[var(--ink-dim)]">{t.meltingPoint}</div>
                        <div className="font-semibold">{item.spec.melting}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[var(--ink-dim)]">{t.properties}</div>
                        <div className="space-y-1 mt-1">
                          {item.properties[lang].map((p, i) => (
                            <div key={i} className="text-[11px] bg-blue-500/20 text-blue-300 p-1.5 rounded">{p}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}