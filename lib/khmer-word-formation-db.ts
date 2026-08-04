// Khmer Root & Word Formation Explorer — data + analysis engine.
// Every entry carries the morphological breakdown of a Khmer word:
// components, roots, the derivation rule, Khmer/English meanings, and
// related words. VERIFIED_LEXICON is the union of hand-entered entries and
// rule-generated derivations; any other Khmer input falls back to the
// algorithmic prefix/suffix analyser below.

export interface WordFormationRoot {
  word: string;
  origin: string;
  meaning: string;
}

export interface InfixDetail {
  rootVerb: string;
  infix: string;
  infixTerm: string;
  formula: string;
  resultNoun: string;
  explanation: string;
}

export interface WordFormationEntry {
  word: string;
  type: string;
  components?: string[];
  rule?: string;
  infixDetail?: InfixDetail;
  roots: WordFormationRoot[];
  meaningKhmer: string;
  meaningEn: string;
  related: string[];
  /** true when the entry is an algorithmic guess rather than verified data. */
  isGuess?: boolean;
}

const makePrefixEntry = (
  word: string,
  root: string,
  prefix: string,
  formName: string,
  meaningKhmer: string,
  meaningEn: string
): Record<string, WordFormationEntry> => ({
  [word]: {
    word,
    type: `Derivation (ផ្នត់ដើម / ${formName})`,
    components: [prefix, root],
    rule: `រូបមន្តនិរុត្តិសាស្ត្រ (ផ្នត់ដើម): ${prefix} + ${root} ➔ ${word}`,
    roots: [
      { word: root, origin: "Native Khmer (ឫស)", meaning: "ពាក្យឫសដើម" },
      { word: prefix, origin: `Khmer Prefix (${formName})`, meaning: "ផ្នត់ដើមបន្ថែមន័យ" },
    ],
    meaningKhmer,
    meaningEn,
    related: [root],
  },
});

const makeInfixEntry = (
  word: string,
  root: string,
  infix: string,
  formName: string,
  meaningKhmer: string,
  meaningEn: string
): Record<string, WordFormationEntry> => ({
  [word]: {
    word,
    type: `Derivation (ផ្នត់ជែក / ${formName})`,
    components: [root, infix],
    rule: `រូបមន្តនិរុត្តិសាស្ត្រ (ផ្នត់ជែក): ${root} + [${infix}] ➔ ${word}`,
    infixDetail: {
      rootVerb: root,
      infix,
      infixTerm: `ផ្នត់ជែក ${formName}`,
      formula: `${root} + [${infix}] ➔ ${word}`,
      resultNoun: word,
      explanation: `ការជ្រែកផ្នត់ <strong>'${infix}'</strong> ចូលក្នុងពាក្យឫស <strong>'${root}'</strong> ដើម្បីបង្កើតពាក្យថ្មី <strong>'${word}'</strong>។`,
    },
    roots: [
      { word: root, origin: "Native Khmer (ឫស)", meaning: "ពាក្យឫសដើម" },
      { word: infix, origin: `Khmer Infix (${formName})`, meaning: "ផ្នត់ជែកបំប្លែងពាក្យ" },
    ],
    meaningKhmer,
    meaningEn,
    related: [root],
  },
});

const AUTO_GENERATED_WORDS: Record<string, WordFormationEntry> = {
  // ទម្រង់(ពស-)
  ...makePrefixEntry("កកាយ", "កាយ", "ក-", "ពស-", "ការកាយផ្ទួនៗ", "To scratch repeatedly"),
  ...makePrefixEntry("កកូរ", "កូរ", "ក-", "ពស-", "ការកូររឿយៗ", "To stir continuously"),
  ...makePrefixEntry("ចចឹក", "ចឹក", "ច-", "ពស-", "ការចឹករឿយៗ", "To peck repeatedly"),
  ...makePrefixEntry("តតះ", "តះ", "ត-", "ពស-", "ការប្រឆាំង រើបម្រះ", "To struggle/resist"),
  ...makePrefixEntry("បបោស", "បោស", "ប-", "ពស-", "ការអង្អែល ឬ បោសថ្នមៗ", "To stroke/caress"),
  ...makePrefixEntry("សសិត", "សិត", "ស-", "ពស-", "ការសិតសក់រឿយៗ", "To comb continuously"),

  // ទម្រង់(ពសព-)
  ...makePrefixEntry("កន្តឿ", "តឿ", "ក'ន-", "ពសព-", "ដែលទាប មិនលូតលាស់", "Dwarf/short"),
  ...makePrefixEntry("កំបាក់", "បាក់", "ក'ម-", "ពសព-", "សភាពដែលបាក់ ឬ កំណាត់ដែលបាក់", "Broken part"),
  ...makePrefixEntry("កំបាំង", "បាំង", "ក'ម-", "ពសព-", "ដែលបិទបាំង មិនឲ្យគេឃើញ", "Hidden/secret"),
  ...makePrefixEntry("បន្ត", "ត", "ប'ន-", "ពសព-", "ធ្វើឲ្យតភ្ជាប់គ្នា មិនឲ្យដាច់", "To continue"),
  ...makePrefixEntry("បណ្តើរ", "ដើរ", "ប'ណ-", "ពសព-", "ដើរទៅជាមួយគ្នា ឬ នាំឲ្យដើរ", "To walk together/escort"),
  ...makePrefixEntry("បញ្ចេញ", "ចេញ", "ប'ញ-", "ពសព-", "ធ្វើឲ្យចេញមកក្រៅ", "To express/emit"),
  ...makePrefixEntry("បំពេញ", "ពេញ", "ប'ម-", "ពសព-", "ធ្វើឲ្យពេញ ឬ សម្រេចគោលដៅ", "To fulfill/fill"),
  ...makePrefixEntry("ពន្យល់", "យល់", "ព'ន-", "ពសព-", "ធ្វើឲ្យយល់ បំភ្លឺ", "To explain"),
  ...makePrefixEntry("រំលេច", "លេច", "រ'ម-", "ពសព-", "ធ្វើឲ្យលេចឡើង ធ្វើឲ្យលេចធ្លោ", "To highlight/reveal"),
  ...makePrefixEntry("អំរែក", "រែក", "អ'ម-", "ពសព-", "វត្ថុសម្រាប់រែក", "Yoke/carrying pole"),
  ...makePrefixEntry("អំបោស", "បោស", "អ'ម-", "ពសព-", "ប្រដាប់សម្រាប់បោស", "Broom"),
  ...makePrefixEntry("បង្គ្រប់", "គ្រប់", "ប'ង-", "ពសព-", "ធ្វើឲ្យគ្រប់ចំនួន", "To make complete"),
  ...makePrefixEntry("បង្កើយ", "កើយ", "ប'ង-", "ពសព-", "ធ្វើឲ្យកើយ ឬ ចូលមកជិត", "To bring close/rest upon"),
  ...makePrefixEntry("បង្គួរ", "គួរ", "ប'ង-", "ពសព-", "ដែលសមល្មម គួរសម", "Moderate/fair"),

  // ទម្រង់(ពពស-)
  ...makePrefixEntry("ប្រដាល់", "ដាល់", "ប្រ-", "ពពស-", "ការវាយតប់គ្នាដោយកណ្តាប់ដៃ", "Boxing"),
  ...makePrefixEntry("ប្រជល់", "ជល់", "ប្រ-", "ពពស-", "ការយកក្បាលទៅទង្គិចគ្នា (ឧ. មាន់ជល់)", "Fighting (cockfight)"),
  ...makePrefixEntry("ប្រកាន់", "កាន់", "ប្រ-", "ពពស-", "ចាប់កំហុស យកជាការ", "To hold against/discriminate"),
  ...makePrefixEntry("ស្រអាប់", "អាប់", "ស្រ-", "ពពស-", "ដែលមិនភ្លឺច្បាស់ ងងឹតបន្តិច", "Dim/blurry"),
  ...makePrefixEntry("ស្រលះ", "លះ", "ស្រ-", "ពពស-", "ដែលទូលាយ គ្មានអ្វីទើស", "Clear/open"),
  ...makePrefixEntry("ស្រទន់", "ទន់", "ស្រ-", "ពពស-", "ដែលទន់ភ្លន់ មិនកាច", "Soft/gentle"),

  // ទម្រង់(-ព-)
  ...makeInfixEntry("ខ្នើយ", "កើយ", "-ន-", "-ព-", "ប្រដាប់សម្រាប់កើយ", "Pillow"),
  ...makeInfixEntry("ខ្ជាប់", "ជាប់", "-ន-", "-ព-", "ដែលជាប់រឹងមាំ មិនរបូត", "Firmly/securely"),
  ...makeInfixEntry("ស្នែង", "សែង", "-ន-", "-ព-", "វត្ថុរឹងដុះលើក្បាលសត្វ", "Horn"),
  ...makeInfixEntry("ល្បាយ", "លាយ", "-ប-", "-ព-", "ការលាយបញ្ចូលគ្នា វត្ថុដែលលាយរួច", "Mixture"),
  ...makeInfixEntry("ល្បែង", "លេង", "-ប-", "-ព-", "ការលេងកម្សាន្ត", "Game/play"),
  ...makeInfixEntry("ល្បឿន", "លឿន", "-ប-", "-ព-", "កម្រិតនៃភាពលឿន", "Speed"),
  ...makeInfixEntry("ឈ្មួញ", "ជួញ", "-ម-", "-ព-", "អ្នករកស៊ីទិញលក់", "Merchant"),
  ...makeInfixEntry("ថ្មើរ", "ដើរ", "-ម-", "-ព-", "អ្នកដើរជើង ឬ វេលា (ថ្មើរនេះ)", "Pedestrian / Time"),
  ...makeInfixEntry("ឆ្មាំ", "ចាំ", "-ម-", "-ព-", "អ្នកយាមកាម", "Guard"),
  ...makeInfixEntry("ស្មូន", "សូន", "-ម-", "-ព-", "អ្នកសូនដី (ជាងស្មូន)", "Potter"),
  ...makeInfixEntry("ស្មេរ", "សេរ", "-ម-", "-ព-", "អ្នកសរសេរ អ្នកនិពន្ធ", "Writer"),
  ...makeInfixEntry("ខ្នើត", "កើត", "-ន-", "-ព-", "ដំណើរព្រះចន្ទរះ (ខែខ្នើត)", "Waxing moon"),

  // ទម្រង់(-សព-)
  ...makeInfixEntry("កង្វះ", "ខ្វះ", "-អ'ង-", "-សព-", "ភាពដែលខ្វះខាត", "Lack/shortage"),
  ...makeInfixEntry("កង្វារ", "ខ្វារ", "-អ'ង-", "-សព-", "ប្រដាប់សម្រាប់ខ្វារ", "Rake/hook tool"),
  ...makeInfixEntry("ពង្រោះ", "ព្រោះ", "-អ៊'ង-", "-សព-", "ការព្រោះគ្រាប់ពូជ", "Sowing"),
  ...makeInfixEntry("ពង្រាត់", "ព្រាត់", "-អ៊'ង-", "-សព-", "ធ្វើឲ្យព្រាត់ប្រាស់គ្នា", "To separate"),
  ...makeInfixEntry("គង្វាល", "ឃ្វាល", "-អ៊'ង-", "-សព-", "អ្នកឃ្វាលសត្វ", "Herder"),
  ...makeInfixEntry("សម្លាប់", "ស្លាប់", "-អ'ម-", "-សព-", "ធ្វើឲ្យស្លាប់", "To kill"),
  ...makeInfixEntry("កម្លាំង", "ខ្លាំង", "-អ'ម-", "-សព-", "ថាមពល ភាពខ្លាំង", "Strength/power"),
  ...makeInfixEntry("ជំហរ", "ឈរ", "-អ៊ម-", "-សព-", "ឥរិយាបថនៃការឈរ ឬ គោលការណ៍", "Stance/position"),
  ...makeInfixEntry("កន្លាស់", "ខ្លាស់", "-អ'ន-", "-សព-", "ប្រដាប់សម្រាប់កន្លាស់ ធ្វើឲ្យរើលែងរួច", "Latch/pin"),

  // ទម្រង់(-ស/ព-)
  ...makeInfixEntry("រនាប", "រាប", "-អ៊/ន-", "-ស/ព-", "បន្ទះឫស្សីឬឈើសម្រាប់ក្រាល", "Floorboard/slats"),
  ...makeInfixEntry("រនាស់", "រាស់", "-អ៊/ន-", "-ស/ព-", "ប្រដាប់កសិកម្មសម្រាប់រាស់ដី", "Harrow"),
  ...makeInfixEntry("រនោច", "រោច", "-អ៊/ន-", "-ស/ព-", "ដំណើរព្រះចន្ទស្រុតចុះពន្លឺ (ខែរនោច)", "Waning moon"),
  ...makeInfixEntry("របៀប", "រៀប", "-អ៊/ប-", "-ស/ព-", "បែបបទ លំដាប់លំដោយ", "Order/method"),
  ...makeInfixEntry("របាំ", "រាំ", "-អ៊/ប-", "-ស/ព-", "ការរាំ ការសម្តែងសិល្បៈ", "Dance"),
  ...makeInfixEntry("របោយ", "រោយ", "-អ៊/ប-", "-ស/ព-", "អ្វីៗដែលរោយចុះមក", "Falling/scattering"),

  // ទម្រង់(-សព/ព-)
  ...makeInfixEntry("ចំណេញ", "ចេញ", "-អ'ម/ណ-", "-សព/ព-", "ផលដែលទទួលបានលើសពីដើមទុន", "Profit"),
  ...makeInfixEntry("គំនិត", "គិត", "-អ៊'ម/ន-", "-សព/ព-", "ការគិត ការយល់ឃើញ", "Thought/idea"),
  ...makeInfixEntry("ទំនិញ", "ទិញ", "-អ៊'ម/ន-", "-សព/ព-", "របស់របរសម្រាប់ទិញលក់", "Merchandise/goods"),
};

export const VERIFIED_LEXICON: Record<string, WordFormationEntry> = {
  ...AUTO_GENERATED_WORDS,
  "កំណើត": {
    word: "កំណើត",
    type: "Derivation (ផ្នត់ជែក / Infixation)",
    components: ["កើត", "-ំ-", "ណ"],
    rule: "រូបមន្តនិរុត្តិសាស្ត្រ (ផ្នត់ជែក): កើត (ក + ើ + ត) ➔ ក + [-ំ- + ណ] + ើត = កំណើត",
    infixDetail: {
      rootVerb: "កើត",
      infix: "-ំ- / ណ",
      infixTerm: "ផ្នត់ជែក (Infix)",
      formula: "កើត (ក + ើ + ត)  ➔  ក + [-ំ- + ណ] + ើត  ➔  កំណើត",
      resultNoun: "កំណើត",
      explanation: "ការបញ្ចូលផ្នត់ជែក (និគ្គហិត -ំ- និង ព្យញ្ជនៈ ណ) ទៅក្នុងចន្លោះព្យញ្ជនៈដើម 'ក' នៃកិរិយា 'កើត' ដើម្បីបង្កើតជានាម 'កំណើត' (ដើមកំណើត)",
    },
    roots: [
      { word: "កើត", origin: "Native Khmer (កិរិយាសព្ទ)", meaning: "ចេះតែមានឡើង, ចាប់ដង្ហើមរស់, ប្រវត្តិកើត (To be born, arise, originate)" },
      { word: "ផ្នត់ជែក", origin: "Khmer Morphophonetics (-ំ- / ណ)", meaning: "សំឡេង ឬ តួអក្សរជ្រែកកណ្ដាលសម្រាប់ផ្លាស់ប្ដូរកិរិយាទៅជានាម (Infix transformation)" },
    ],
    meaningKhmer: "ការចាប់បដិសន្ធិ, ដើមកំណើត, ឬ ចំណុចចាប់ផ្ដើមដំបូងនៃការមានរូបរាងឡើង។",
    meaningEn: "Birth, origin, genesis, or inception.",
    related: ["កើត", "ថ្ងៃកំណើត", "ដើមកំណើត"],
  },
  "ដំណើរ": {
    word: "ដំណើរ",
    type: "Derivation (ផ្នត់ជែក / Infixation)",
    components: ["ដើរ", "-ំ-", "ណ"],
    rule: "រូបមន្តនិរុត្តិសាស្ត្រ (ផ្នត់ជែក): ដើរ (ដ + ើ + រ) ➔ ដ + [-ំ- + ណ] + ើ + រ ➔ ដំណើរ",
    infixDetail: {
      rootVerb: "ដើរ",
      infix: "-ំ- / ណ",
      infixTerm: "ផ្នត់ជែក (Infix)",
      formula: "ដើរ (ដ + ើ + រ)  ➔  ដ + [-ំ- + ណ] + ើ + រ  ➔  ដំណើរ",
      resultNoun: "ដំណើរ",
      explanation: "ការជ្រែកផ្នត់ '-ំ-ណ-' ចូលក្នុងកិរិយា 'ដើរ' បង្កើតជានាម 'ដំណើរ' (ការធ្វើដំណើរ)",
    },
    roots: [
      { word: "ដើរ", origin: "Native Khmer (កិរិយាសព្ទ)", meaning: "កិរិយាផ្លាស់ទីដោយជើង, ចរចារ (To walk, travel, move)" },
      { word: "ផ្នត់ជែក", origin: "Khmer Infix (-ំ-ណ-)", meaning: "ផ្នត់ជ្រែកកណ្ដាលផ្លាស់ប្ដូរកិរិយាទៅជានាម (Action noun infix)" },
    ],
    meaningKhmer: "ការធ្វើដំណើរ, ចររិក, ឬ លំដាប់សកម្មភាពនៃការប្រព្រឹត្តទៅនៃហេតុការណ៍អ្វីមួយ។",
    meaningEn: "Journey, trip, gait, or course of action/process.",
    related: ["ដំណេក", "កំណើត", "ទំហំ"],
  },
  "ជំនឿ": {
    word: "ជំនឿ",
    type: "Derivation (ផ្នត់ជែក / Infixation)",
    components: ["ជឿ", "-ំ-", "ន"],
    rule: "រូបមន្តនិរុត្តិសាស្ត្រ (ផ្នត់ជែក): ជឿ (ជ + ឿ) ➔ ជ + [-ំ- + ន] + ឿ ➔ ជំនឿ",
    infixDetail: {
      rootVerb: "ជឿ",
      infix: "-ំ- / ន",
      infixTerm: "ផ្នត់ជែក (Infix)",
      formula: "ជឿ (ជ + ឿ)  ➔  ជ + [-ំ- + ន] + ឿ  ➔  ជំនឿ",
      resultNoun: "ជំនឿ",
      explanation: "ជ្រែកផ្នត់ '-ំ-ន-' ចូលទៅក្នុងកិរិយា 'ជឿ' (ព្យញ្ជនៈពួក អ៊) ដើម្បីបង្កើតជានាមអរូបី 'ជំនឿ'",
    },
    roots: [
      { word: "ជឿ", origin: "Native Khmer (កិរិយាសព្ទ)", meaning: "កិរិយាទុកចិត្ត, ជឿជាក់ (To believe, trust)" },
      { word: "ផ្នត់ជែក", origin: "Khmer Infix (-ំ-ន-)", meaning: "ផ្នត់ជ្រែកសម្រាប់បង្កើតនាមអរូបី (Abstract noun infix)" },
    ],
    meaningKhmer: "ការជឿជាក់ សេចក្ដីទុកចិត្ត ឬ សាសនានិយមដែលមនុស្សប្រកាន់ខ្ជាប់ក្នុងចិត្ត។",
    meaningEn: "Belief, faith, or conviction.",
    related: ["ជឿ", "ជំនឿសាសនា", "ទំនុកចិត្ត"],
  },
  "ទំហំ": {
    word: "ទំហំ",
    type: "Derivation (ផ្នត់ជែក / Infixation)",
    components: ["ធំ", "-ំ-"],
    rule: "រូបមន្តនិរុត្តិសាស្ត្រ (ផ្នត់ជែក): ធំ (ធ + ំ) ➔ ធ + [-ំ-] ➔ ទំហំ",
    infixDetail: {
      rootVerb: "ធំ",
      infix: "-ំ-",
      infixTerm: "ផ្នត់ជែក (Infix)",
      formula: "ធំ (គុណនាម)  ➔  ធ + [-ំ-]  ➔  ទំហំ (នាម)",
      resultNoun: "ទំហំ",
      explanation: "ជ្រែកផ្នត់ '-ំ-' (និគ្គហិត) ចូលក្នុងគុណនាម 'ធំ' ដើម្បីបង្កើតជានាម 'ទំហំ' (មានការផ្លាស់ប្ដូរព្យញ្ជនៈ ធ ➔ ទ)",
    },
    roots: [
      { word: "ធំ", origin: "Native Khmer (គុណនាម)", meaning: "មានប្រវែង ឬ ផ្ទៃក្រឡាច្រើន, ធំធេង (Large, big, vast)" },
      { word: "ផ្នត់ជែក", origin: "Khmer Infix (-ំ-)", meaning: "ផ្នត់ជ្រែកកម្រិត/បរិមាណ (Magnitude infix)" },
    ],
    meaningKhmer: "រវាងនៃប្រវែង បរិមាណ ផ្ទៃក្រឡា ឬ កម្រិតភាពធំនៃវត្ថុអ្វីមួយ។",
    meaningEn: "Size, dimension, volume, or magnitude.",
    related: ["ធំ", "ធំធេង", "ទម្ងន់"],
  },
  "សន្តិភាព": {
    word: "សន្តិភាព",
    type: "Compound (សមាសនាម)",
    components: ["សន្តិ", "ភាព"],
    roots: [
      { word: "សន្តិ", origin: "Pali (Santi)", meaning: "សេចក្ដីស្ងប់, ភាពត្រជាក់ត្រជុំ (Peace, calmness, tranquility)" },
      { word: "ភាព", origin: "Pali (Bhāva)", meaning: "ស្ថានភាព, លក្ខណៈ (State, condition)" },
    ],
    meaningKhmer: "ស្ថានភាពស្ងប់ស្ងាត់ គ្មានសង្គ្រាម គ្មានការទាស់ទែងគ្នា ឬ ការរស់នៅដោយសុខសាន្ត។",
    meaningEn: "Peace; freedom from disturbance, tranquility, and absence of war.",
    related: ["សន្តិសុខ", "សុខភាព", "សុខសាន្ត"],
  },
  "ប្រវត្តិសាស្ត្រ": {
    word: "ប្រវត្តិសាស្ត្រ",
    type: "Compound (សមាសនាម)",
    components: ["ប្រវត្តិ", "សាស្ត្រ"],
    roots: [
      { word: "ប្រវត្តិ", origin: "Pali (Pavatti)", meaning: "រឿងរ៉ាវ, ដំណើរដើមទង, លំដាប់ហេតុការណ៍ (History, story, account)" },
      { word: "សាស្ត្រ", origin: "Sanskrit (Śāstra)", meaning: "ក្បួន, វិជ្ជា, គម្ពីរ, មុខវិជ្ជា (Science, doctrine, treatise)" },
    ],
    meaningKhmer: "រឿងរ៉ាវ ឬ ព្រឹត្តិការណ៍ដែលបានកើតឡើងកន្លងមកក្នុងអតីតកាល ព្រមទាំងការសិក្សាស្រាវជ្រាវអំពីហេតុការណ៍ទាំងនោះ។",
    meaningEn: "History; the study of past events and continuous chronological records.",
    related: ["ប្រវត្តិរូប", "ប្រវត្តិវិទ្យា", "វិទ្យាសាស្ត្រ", "អក្សរសាស្ត្រ"],
  },
  "សាកលវិទ្យាល័យ": {
    word: "សាកលវិទ្យាល័យ",
    type: "Complex Compound (សមាសនាមស្មុគស្មាញ)",
    components: ["សាកល", "វិទ្យា", "អាល័យ"],
    rule: "Sandhi: វិទ្យា (ā) + អាល័យ (ā) = វិទ្យាល័យ (ā)",
    roots: [
      { word: "សាកល", origin: "Pali (Sakala)", meaning: "ទូទៅ, ទាំងអស់, ពិភពលោក (Universal, whole, entire)" },
      { word: "វិទ្យា", origin: "Sanskrit (Vidyā)", meaning: "ចំណេះដឹង, ក្បួនវិជ្ជា (Knowledge, learning)" },
      { word: "អាល័យ", origin: "Sanskrit (Ālaya)", meaning: "ទីលំនៅ, ទីតាំង, ស្ថាន (Abode, dwelling, institution)" },
    ],
    meaningKhmer: "គ្រឹះស្ថានឧត្តមសិក្សាដែលបង្រៀន និងស្រាវជ្រាវមុខវិជ្ជាជ្រៅជ្រះគ្រប់ផ្នែកកម្រិតខ្ពស់។",
    meaningEn: "University; high-level educational institution of learning and research.",
    related: ["សាកលលោក", "មហាវិទ្យាល័យ", "វិទ្យាស្ថាន"],
  },
};

export const PREFIXES = [
  { text: "ការ", meaning: "អំពើ, សកម្មភាព (Act of, process - Nominalizer)" },
  { text: "សេចក្តី", meaning: "រឿង, គំនិតអរូបី (Matter, concept - Nominalizer for abstract nouns)" },
  { text: "ភាព", meaning: "ស្ថានភាព, លក្ខណៈ (State of, condition)" },
  { text: "អ្នក", meaning: "បុគ្គល, មនុស្ស (Person who does - Agentive)" },
  { text: "មហា", meaning: "ធំ, ធំធេង, ឧត្តម (Great, grand)" },
  { text: "ព្រះ", meaning: "ដ៏វិសេស, រាជសព្ទ (Sacred, royal)" },
  { text: "អន្តរ", meaning: "ចន្លោះ, រវាង (Inter-, between)" },
  { text: "អភិ", meaning: "លើសលប់, ឆ្ពោះទៅ (Over, superior)" },
];

export const SUFFIXES = [
  { text: "ភាព", meaning: "ស្ថានភាព (-ness, -ity)" },
  { text: "កម្ម", meaning: "ការងារ, អំពើ (-ation, -ment)" },
  { text: "កិច្ច", meaning: "មុខការ, កាតព្វកិច្ច (Task, duty)" },
  { text: "សាស្ត្រ", meaning: "ក្បួន, មុខវិជ្ជា (-logy, science)" },
  { text: "វិទ្យា", meaning: "ចំណេះ, ប្រាជ្ញា (-logy, knowledge)" },
  { text: "ជន", meaning: "មនុស្ស, ប្រជាជន (Person, people)" },
];

/** Analyse any Khmer word — returns the verified entry when present, else a best-effort algorithmic breakdown. */
export function analyzeWord(word: string): WordFormationEntry {
  const clean = word.trim();
  const verified = VERIFIED_LEXICON[clean];
  if (verified) return { ...verified, isGuess: false };

  const result: WordFormationEntry = {
    word: clean,
    type: "ការវិភាគតាមអាល់ហ្ូរីត (Algorithmic Analysis)",
    components: [],
    roots: [],
    meaningKhmer: "មិនមានទិន្នន័យពន្យល់ផ្លូវការនៅក្នុងវចនានុក្រមផ្ទៀងផ្ទាត់ (ព័ត៌មានប៉ាន់ស្មានតាមទម្រង់ថ្នាក់ពាក្យ)",
    meaningEn: "Unknown (No verified dictionary entry)",
    related: [],
    isGuess: true,
  };

  let remaining = clean;
  let foundPrefix: { text: string; meaning: string } | null = null;
  let foundSuffix: { text: string; meaning: string } | null = null;

  for (const prefix of PREFIXES) {
    if (remaining.startsWith(prefix.text) && remaining.length > prefix.text.length) {
      foundPrefix = prefix;
      remaining = remaining.slice(prefix.text.length);
      break;
    }
  }

  for (const suffix of SUFFIXES) {
    if (remaining.endsWith(suffix.text) && remaining.length > suffix.text.length) {
      foundSuffix = suffix;
      remaining = remaining.slice(0, -suffix.text.length);
      break;
    }
  }

  if (foundPrefix) {
    result.components?.push(foundPrefix.text);
    result.roots.push({ word: foundPrefix.text, origin: "បក្សបន្ថែមដើម (Prefix)", meaning: foundPrefix.meaning });
  }

  if (remaining.length > 0) {
    result.components?.push(remaining);
    result.roots.push({ word: remaining, origin: "ឫសពាក្យមិនច្បាស់ (Unknown Root)", meaning: "ឫសគ្រឹះនៃពាក្យ" });
  }

  if (foundSuffix) {
    result.components?.push(foundSuffix.text);
    result.roots.push({ word: foundSuffix.text, origin: "បក្សបន្ថែមចុង (Suffix)", meaning: foundSuffix.meaning });
  }

  result.rule =
    result.components && result.components.length > 1
      ? "បានបំបែកតាមរយៈការប្រៀបធៀបបក្សបន្ថែមដើម/ចុងជារួមនៃភាសាខ្មែរ។"
      : "មិនបានរកឃើញបក្សបន្ថែមដើម ឬ ចុងឡើយ។ ពាក្យនេះអាចជាឫសពាក្យទោល ឬ ពាក្យកម្ចីស្មុគស្មាញ។";

  return result;
}

export const SAMPLE_WORDS = Object.keys(VERIFIED_LEXICON);
