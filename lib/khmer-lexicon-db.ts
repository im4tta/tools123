
export interface KhmerHomophone { word: string; definition: string; pronunciation?: string; }
export interface KhmerWordData { id?: string; word: string; pronunciation?: string; definition: string; homophones: KhmerHomophone[]; synonyms: string[]; antonyms: string[]; relatedWords: string[]; example: string; }

// KHLEXICON COMPREHENSIVE OFFLINE DATABASE
// Sourced from Chuon Nath & Headley Dictionaries.
// Optimized for Homophone (សទិសសូរ) lookup and general vocabulary.

export const STATIC_DATABASE: Record<string, KhmerWordData> = {
  // ========================== ក (K) ==========================
  "ក": {
    word: "ក",
    pronunciation: "ក",
    definition: "ផ្នែករាងកាយដែលតភ្ជាប់ក្បាលទៅនឹងខ្លួន។",
    homophones: [
      { word: "ក", definition: "ផ្នែកនៃរាងកាយ", pronunciation: "ក" },
      { word: "ករ", definition: "ដៃ (រាជសព្ទ), អ្នកធ្វើ", pronunciation: "ក" },
      { word: "កុរ", definition: "ឈ្មោះឆ្នាំកុរ (ជ្រូក)", pronunciation: "កុ" }
    ],
    synonyms: ["ស", "គ្រប"],
    antonyms: [],
    relatedWords: ["កដៃ", "កជើង"],
    example: "គាត់ឈឺក។"
  },
  "ករ": {
    word: "ករ",
    pronunciation: "ក",
    definition: "ដៃ (រាជសព្ទ: ព្រះករ), អ្នកធ្វើ (វិស្វករ)។",
    homophones: [
      { word: "ក", definition: "ផ្នែកនៃរាងកាយ", pronunciation: "ក" },
      { word: "ករ", definition: "ដៃ, អ្នកធ្វើ", pronunciation: "ក" }
    ],
    synonyms: ["ដៃ"],
    antonyms: [],
    relatedWords: ["វិស្វករ", "កសិករ", "នគរ"],
    example: "លើកដៃសំពះ។"
  },
  "កក": {
    word: "កក",
    pronunciation: "កក់",
    definition: "រឹងដោយត្រជាក់ ឬដោយអស់ជាតិទឹក។",
    homophones: [
      { word: "កក", definition: "រឹង, កកស្ទះ", pronunciation: "កក់" },
      { word: "កក់", definition: "លាងសក់, បម្រុងទុក", pronunciation: "កក់" }
    ],
    synonyms: ["រឹង", "ក្ដាំង"],
    antonyms: ["រលាយ"],
    relatedWords: ["ទឹកកក", "កកស្ទះ"],
    example: "ទឹកកក។"
  },
  "កក់": {
    word: "កក់",
    pronunciation: "កក់",
    definition: "លាងសម្អាតសក់ / បម្រុងទុក។",
    homophones: [
      { word: "កក", definition: "រឹង", pronunciation: "កក់" },
      { word: "កក់", definition: "លាងសក់, បម្រុងទុក", pronunciation: "កក់" }
    ],
    synonyms: ["លាង"],
    antonyms: [],
    relatedWords: ["កក់សក់", "កក់បន្ទប់"],
    example: "កក់សក់។"
  },
  "កង": {
    word: "កង",
    pronunciation: "កង",
    definition: "វត្ថុដែលមានរាងមូល / ក្រុម, ពួក។",
    homophones: [
      { word: "កង", definition: "វត្ថុរាងមូល, ក្រុម", pronunciation: "កង" },
      { word: "កង់", definition: "កង់រមៀល (សូរជិត)", pronunciation: "កុង" }
    ],
    synonyms: ["វង្វង់", "ក្រុម"],
    antonyms: [],
    relatedWords: ["កងដៃ", "កងទ័ព"],
    example: "ពាក់កងដៃ។"
  },
  "កង់": {
    word: "កង់",
    pronunciation: "កុង",
    definition: "វត្ថុមានរាងមូលសម្រាប់រមៀល (កង់ឡាន)។",
    homophones: [
      { word: "កង់", definition: "កង់រមៀល", pronunciation: "កុង" },
      { word: "កុង", definition: "ជីតា (ចិន), កុងតាក់", pronunciation: "កុង" }
    ],
    synonyms: ["ចក្រ"],
    antonyms: [],
    relatedWords: ["កង់ឡាន", "រោមកង់"],
    example: "ជិះកង់។"
  },
  "កុង": {
    word: "កុង",
    pronunciation: "កុង",
    definition: "ជីតា (ចិន) / កុងតាក់។",
    homophones: [
      { word: "កង់", definition: "កង់រមៀល", pronunciation: "កុង" },
      { word: "កុង", definition: "ជីតា, កុងតាក់", pronunciation: "កុង" }
    ],
    synonyms: ["ជីតា"],
    antonyms: [],
    relatedWords: ["កុងម៉ា"],
    example: "កុងចិន។"
  },
  "កាត់": {
    word: "កាត់",
    pronunciation: "កាត",
    definition: "ធ្វើឲ្យដាច់ដោយកាំបិត។",
    homophones: [
      { word: "កាត់", definition: "ធ្វើឲ្យដាច់", pronunciation: "កាត" },
      { word: "កាត", definition: "ប័ណ្ណ (កាត)", pronunciation: "កាត" }
    ],
    synonyms: ["អារ", "ច្រៀក"],
    antonyms: ["ត"],
    relatedWords: ["កាំបិត", "កន្ត្រៃ"],
    example: "កាត់ក្រដាស។"
  },
  "កាត": {
    word: "កាត",
    pronunciation: "កាត",
    definition: "ប័ណ្ណ (Card).",
    homophones: [
      { word: "កាត់", definition: "ធ្វើឲ្យដាច់", pronunciation: "កាត" },
      { word: "កាត", definition: "ប័ណ្ណ", pronunciation: "កាត" }
    ],
    synonyms: ["ប័ណ្ណ"],
    antonyms: [],
    relatedWords: ["កាតទូរស័ព្ទ", "កាតធនាគារ"],
    example: "កាតសមាជិក។"
  },
  "កា": {
    word: "កា",
    pronunciation: "កា",
    definition: "ភាជន៍សម្រាប់ដាក់ទឹក។",
    homophones: [
      { word: "កា", definition: "ភាជន៍ដាក់ទឹក", pronunciation: "កា" },
      { word: "ការ", definition: "ការងារ, ពិធីមង្គល, អំពើ", pronunciation: "កា" },
      { word: "ការណ៍", definition: "ហេតុ, ដំណើរ, រឿងរ៉ាវ", pronunciation: "កា" },
      { word: "ការ្យ", definition: "កិច្ច, ធុរៈ", pronunciation: "កា" }
    ],
    synonyms: ["ក្អម", "ប៉ាន់"],
    antonyms: [],
    relatedWords: ["ទឹក", "ផឹក", "ដាំទឹក"],
    example: "គាត់ដាំទឹកក្នុងកា។"
  },
  "ការ": {
    word: "ការ",
    pronunciation: "កា",
    definition: "អំពើ, មុខក្រសួង, ពិធីមង្គលការ។",
    homophones: [
      { word: "កា", definition: "ភាជន៍ដាក់ទឹក", pronunciation: "កា" },
      { word: "ការ", definition: "ការងារ, ពិធីមង្គល", pronunciation: "កា" },
      { word: "ការណ៍", definition: "ហេតុ, ដំណើរ", pronunciation: "កា" },
      { word: "ការ្យ", definition: "កិច្ច, ធុរៈ", pronunciation: "កា" }
    ],
    synonyms: ["ពិធី", "រៀបការ", "កិច្ច", "អំពើ"],
    antonyms: ["លែងលះ"],
    relatedWords: ["កូនកំលោះ", "កូនក្រមុំ", "កិច្ចការ"],
    example: "ពួកគេនឹងរៀបការនៅខែក្រោយ។"
  },
  "ការណ៍": {
    word: "ការណ៍",
    pronunciation: "កា",
    definition: "ហេតុ, ដំណើរ, រឿងរ៉ាវដែលបានពិត។",
    homophones: [
      { word: "កា", definition: "ភាជន៍ដាក់ទឹក", pronunciation: "កា" },
      { word: "ការ", definition: "ការងារ, ពិធីមង្គល", pronunciation: "កា" },
      { word: "ការណ៍", definition: "ហេតុ, ដំណើរ", pronunciation: "កា" },
      { word: "ការ្យ", definition: "កិច្ច, ធុរៈ", pronunciation: "កា" }
    ],
    synonyms: ["ហេតុ", "រឿងរ៉ាវ", "ព្រឹត្តិការណ៍"],
    antonyms: [],
    relatedWords: ["ស្ថានការណ៍", "ហេតុការណ៍"],
    example: "ប៉ូលិសកំពុងស៊ើបអង្កេតការណ៍នេះ។"
  },
  "ការ្យ": {
    word: "ការ្យ",
    pronunciation: "កា",
    definition: "កិច្ច, ធុរៈ, អ្វីដែលត្រូវធ្វើ (សំស្រ្កឹត)។",
    homophones: [
      { word: "កា", definition: "ភាជន៍ដាក់ទឹក", pronunciation: "កា" },
      { word: "ការ", definition: "ការងារ, ពិធីមង្គល", pronunciation: "កា" },
      { word: "ការណ៍", definition: "ហេតុ, ដំណើរ", pronunciation: "កា" },
      { word: "ការ្យ", definition: "កិច្ច, ធុរៈ", pronunciation: "កា" }
    ],
    synonyms: ["កិច្ច", "ធុរៈ"],
    antonyms: [],
    relatedWords: ["សង្រ្កាន្ត (ដំណើរឃ្លាតចាកការ្យ)", "កិច្ចការ"],
    example: "នេះជាការ្យដែលត្រូវបំពេញ។"
  },
  "កាល": {
    word: "កាល",
    pronunciation: "កាល",
    definition: "ពេល, វេលា, គ្រា។",
    homophones: [
      { word: "កាល", definition: "ពេលវេលា", pronunciation: "កាល" },
      { word: "កាល់", definition: "កល់, ទប់", pronunciation: "កាល" }
    ],
    synonyms: ["ពេល", "វេលា", "សម័យ"],
    antonyms: [],
    relatedWords: ["កាលណា", "កាលពីមុន"],
    example: "កាលពីម្សិលមិញ។"
  },
  "កាល់": {
    word: "កាល់",
    pronunciation: "កាល",
    definition: "យកអ្វីមកដាក់ទប់កុំឲ្យរមៀលឬរលំ។",
    homophones: [
      { word: "កាល", definition: "ពេលវេលា", pronunciation: "កាល" },
      { word: "កាល់", definition: "កល់, ទប់", pronunciation: "កាល" }
    ],
    synonyms: ["កល់", "ទប់"],
    antonyms: [],
    relatedWords: ["កល់", "ទ្រ"],
    example: "កាល់ជើងតុ។"
  },
  "កាំ": {
    word: "កាំ",
    pronunciation: "កាំ",
    definition: "ជើងជណ្តើរ, ធ្នាប់រទេះ, ដែកកាំភ្លើង។",
    homophones: [
      { word: "កាំ", definition: "កាំជណ្តើរ, កាំភ្លើង", pronunciation: "កាំ" },
      { word: "កម្ម", definition: "អំពើ, ផល (សំឡេងខ្លី)", pronunciation: "កាំ" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["ជណ្តើរ", "កង់រទេះ", "កាំភ្លើង"],
    example: "ជណ្តើរនេះមាន ១០ កាំ។"
  },
  "កម្ម": {
    word: "កម្ម",
    pronunciation: "កាំ",
    definition: "អំពើ (ល្អ ឬ អាក្រក់) ដែលសត្វលោកបានធ្វើ។",
    homophones: [
      { word: "កាំ", definition: "កាំជណ្តើរ, កាំភ្លើង", pronunciation: "កាំ" },
      { word: "កម្ម", definition: "អំពើ, ផល", pronunciation: "កាំ" }
    ],
    synonyms: ["អំពើ", "ផល"],
    antonyms: [],
    relatedWords: ["កម្មផល", "វាសនា", "កម្មករ"],
    example: "មនុស្សម្នាក់ៗតែងមានកម្មរៀងខ្លួន។"
  },
  "កិច": {
    word: "កិច",
    pronunciation: "កិច",
    definition: "កិច្ចកល, ល្បិច, គេច។",
    homophones: [
      { word: "កិច", definition: "ល្បិច, គេច", pronunciation: "កិច" },
      { word: "កិច្ច", definition: "ការងារ, ធុរៈ", pronunciation: "កិច" }
    ],
    synonyms: ["ល្បិច", "កល"],
    antonyms: ["ត្រង់"],
    relatedWords: ["កិច្ចកល", "គេច"],
    example: "ប្រើកិចកល។"
  },
  "កិច្ច": {
    word: "កិច្ច",
    pronunciation: "កិច",
    definition: "ការងារ, ធុរៈ, អ្វីដែលត្រូវធ្វើ។",
    homophones: [
      { word: "កិច", definition: "ល្បិច, គេច", pronunciation: "កិច" },
      { word: "កិច្ច", definition: "ការងារ, ធុរៈ", pronunciation: "កិច" }
    ],
    synonyms: ["ការងារ", "ភារកិច្ច"],
    antonyms: [],
    relatedWords: ["កិច្ចការ", "កិច្ចសន្យា"],
    example: "បំពេញកិច្ចការសាលា។"
  },
  "កុល": {
    word: "កុល",
    pronunciation: "កុល",
    definition: "ត្រកូល, វង្ស, ញាតិ។",
    homophones: [
      { word: "កុល", definition: "ត្រកូល, ញាតិ", pronunciation: "កុល" },
      { word: "កុល់", definition: "កល់, ទប់", pronunciation: "កុល" }
    ],
    synonyms: ["ត្រកូល", "វង្ស"],
    antonyms: [],
    relatedWords: ["កុលសម្ព័ន្ធ", "ត្រកូល"],
    example: "កុលសម្ព័ន្ធ។"
  },
  "កុល់": {
    word: "កុល់",
    pronunciation: "កុល",
    definition: "ដាក់អ្វីទប់កុំឲ្យរមៀលឬកុំឲ្យផ្អៀង។",
    homophones: [
      { word: "កុល", definition: "ត្រកូល", pronunciation: "កុល" },
      { word: "កុល់", definition: "កល់, ទប់", pronunciation: "កុល" }
    ],
    synonyms: ["ទប់", "កល់"],
    antonyms: [],
    relatedWords: [],
    example: "យកដុំថ្មទៅកុល់កង់ឡាន។"
  },
  "កេត": {
    word: "កេត",
    pronunciation: "កេត",
    definition: "ទីកន្លែង, និវេសនដ្ឋាន។",
    homophones: [
      { word: "កេត", definition: "ទីកន្លែង", pronunciation: "កេត" },
      { word: "កេតុ", definition: "ផ្កាយកន្ទុយ, ទង់", pronunciation: "កេត (សំនៀង)" }
    ],
    synonyms: ["កន្លែង", "លំនៅ"],
    antonyms: [],
    relatedWords: ["និវេសន៍", "គេហដ្ឋាន"],
    example: "គេហកេត។"
  },
  "កោ": {
    word: "កោ",
    pronunciation: "កោ",
    definition: "កោសចេញ, កោរ (សំនៀង)។",
    homophones: [
      { word: "កោ", definition: "កោសចេញ", pronunciation: "កោ" },
      { word: "កោរ", definition: "កាត់សក់", pronunciation: "កោ" },
      { word: "កោដិ", definition: "ដប់លាន (១០,០០០,០០០)", pronunciation: "កោ" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["សក់"],
    example: "កោរសក់។"
  },
  "កោរ": {
    word: "កោរ",
    pronunciation: "កោ",
    definition: "កាត់សក់ ឬរោមឲ្យអស់ដោយកាំបិត។",
    homophones: [
      { word: "កោ", definition: "កោសចេញ", pronunciation: "កោ" },
      { word: "កោរ", definition: "កាត់សក់", pronunciation: "កោ" },
      { word: "កោដិ", definition: "ដប់លាន", pronunciation: "កោ" }
    ],
    synonyms: ["កាត់"],
    antonyms: ["ទុក"],
    relatedWords: ["កាំបិត", "សក់"],
    example: "ព្រះសង្ឃកោរសក់។"
  },
  "កោដិ": {
    word: "កោដិ",
    pronunciation: "កោ",
    definition: "ចំនួន ១០ លាន (10,000,000)។",
    homophones: [
      { word: "កោ", definition: "កោសចេញ", pronunciation: "កោ" },
      { word: "កោរ", definition: "កាត់សក់", pronunciation: "កោ" },
      { word: "កោដិ", definition: "ដប់លាន", pronunciation: "កោ" }
    ],
    synonyms: ["លាន", "សែន"],
    antonyms: [],
    relatedWords: ["លាន", "សែន"],
    example: "ទ្រព្យមួយកោដិ។"
  },
  "ក្ស័យ": {
    word: "ក្ស័យ",
    pronunciation: "ក្សៃ",
    definition: "ការអស់ទៅ, ការស្លាប់, ការវិនាស។",
    homophones: [
      { word: "ក្ស័យ", definition: "ស្លាប់, អស់, វិនាស", pronunciation: "ក្សៃ" },
      { word: "ខ្ស័យ", definition: "ថយ, ចុះ, អន់", pronunciation: "ក្សៃ" }
    ],
    synonyms: ["ស្លាប់", "អស់", "វិនាស"],
    antonyms: ["កើត", "ចម្រើន"],
    relatedWords: ["ក្ស័យធន", "អសង្ខ័យ"],
    example: "ក្រុមហ៊ុនបានក្ស័យធន។"
  },
  "ក្រ": {
    word: "ក្រ",
    pronunciation: "ក្រ",
    definition: "ខ្សត់, លំបាក, មិនមាន។",
    homophones: [
      { word: "ក្រ", definition: "ខ្សត់, លំបាក", pronunciation: "ក្រ" },
      { word: "ក្ររ", definition: "ក្រាស់ក្រែល (បុរាណ)", pronunciation: "ក្រ" }
    ],
    synonyms: ["ខ្សត់", "ក្រីក្រ"],
    antonyms: ["មាន", "ធន"],
    relatedWords: ["ក្រីក្រ", "ទុរគត"],
    example: "គ្រួសារក្រីក្រ។"
  },
  "កុក": {
    word: "កុក",
    pronunciation: "កុក",
    definition: "សត្វស្លាបមួយប្រភេទ។",
    homophones: [
      { word: "កុក", definition: "សត្វកុក", pronunciation: "កុក" },
      { word: "កុក", definition: "ភេសជ្ជៈកូកា (Coke)", pronunciation: "កុក" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["សត្វស្លាប"],
    example: "សត្វកុក។"
  },
  "កុដិ": {
    word: "កុដិ",
    pronunciation: "កុត",
    definition: "ផ្ទះព្រះសង្ឃ។",
    homophones: [
      { word: "កុដិ", definition: "ផ្ទះព្រះសង្ឃ", pronunciation: "កុត" },
      { word: "កុត", definition: "ដាច់, ខ្លី (កន្ទុយ)", pronunciation: "កុត" }
    ],
    synonyms: ["អាស្រម"],
    antonyms: [],
    relatedWords: ["វត្ត", "ព្រះសង្ឃ"],
    example: "ព្រះសង្ឃគង់នៅកុដិ។"
  },
  "កុត": {
    word: "កុត",
    pronunciation: "កុត",
    definition: "ដាច់, ខ្លី (កន្ទុយ)។",
    homophones: [
      { word: "កុដិ", definition: "ផ្ទះព្រះសង្ឃ", pronunciation: "កុត" },
      { word: "កុត", definition: "ដាច់, ខ្លី", pronunciation: "កុត" }
    ],
    synonyms: ["ដាច់", "ខ្លី"],
    antonyms: ["វែង"],
    relatedWords: ["កន្ទុយកុត"],
    example: "ឆ្កែកន្ទុយកុត។"
  },
  "កប": {
    word: "កប",
    pronunciation: "កប់",
    definition: "គាប់, ត្រូវ (ថ្នាំកប), នាំមកនូវសិរីសួស្តី។",
    homophones: [
      { word: "កប", definition: "គាប់, ត្រូវ", pronunciation: "កប់" },
      { word: "កប់", definition: "ដាក់ក្នុងដី", pronunciation: "កប់" }
    ],
    synonyms: ["គាប់", "ត្រូវ"],
    antonyms: [],
    relatedWords: ["កបនឹង", "កប់យោបល់"],
    example: "ថ្នាំនេះកបនឹងជំងឺ។"
  },
  "កប់": {
    word: "កប់",
    pronunciation: "កប់",
    definition: "ដាក់ក្នុងដីហើយលុប។",
    homophones: [
      { word: "កប", definition: "គាប់, ត្រូវ", pronunciation: "កប់" },
      { word: "កប់", definition: "ដាក់ក្នុងដី", pronunciation: "កប់" }
    ],
    synonyms: ["បញ្ចុះ"],
    antonyms: ["ជីក"],
    relatedWords: ["កប់ខ្មោច"],
    example: "កប់សាកសព។"
  },

  // ========================== ខ (Kh) ==========================
  "ខ": {
    word: "ខ",
    pronunciation: "ខ",
    definition: "អក្សរទី ២ ក្នុងពពួកព្យញ្ជនៈ / មាត្រា, ចំណុច។",
    homophones: [
      { word: "ខ", definition: "អក្សរ ខ / ចំណុច", pronunciation: "ខ" },
      { word: "ខរ", definition: "ឈរត្រៀម", pronunciation: "ខ" }
    ],
    synonyms: ["មាត្រា", "ចំណុច"],
    antonyms: [],
    relatedWords: ["ខសន្យា", "ខច្បាប់"],
    example: "ខទី១ នៃកិច្ចសន្យា។"
  },
  "ខរ": {
    word: "ខរ",
    pronunciation: "ខ",
    definition: "ឈរត្រៀម, ត្រៀមចាំ (ប្រើក្នុងឃ្លា 'ខរចាំ')។",
    homophones: [
      { word: "ខ", definition: "អក្សរ ខ / ចំណុច", pronunciation: "ខ" },
      { word: "ខរ", definition: "ឈរត្រៀម", pronunciation: "ខ" }
    ],
    synonyms: ["ឈរ", "ចាំ"],
    antonyms: [],
    relatedWords: [],
    example: "ឈរខរចាំ។"
  },
  "ខ្ស័យ": {
    word: "ខ្ស័យ",
    pronunciation: "ក្សៃ",
    definition: "ថយ, ចុះ, អន់, មិនគ្រប់។",
    homophones: [
      { word: "ក្ស័យ", definition: "ស្លាប់, អស់", pronunciation: "ក្សៃ" },
      { word: "ខ្ស័យ", definition: "ថយ, ចុះ", pronunciation: "ក្សៃ" }
    ],
    synonyms: ["ថយ", "ចុះ"],
    antonyms: ["ចម្រើន"],
    relatedWords: ["ខ្ស័យជីវិត"],
    example: "ព្រះរាជាខ្ស័យព្រះជន្ម។"
  },
  "ខាន់": {
    word: "ខាន់",
    pronunciation: "ខាន់",
    definition: "ឈ្មោះតំណែងមន្ត្រីពីបុរាណ / ស្ទះ, ផ្អាក។",
    homophones: [
      { word: "ខាន់", definition: "ឈ្មោះតំណែង / ផ្អាក", pronunciation: "ខាន់" },
      { word: "ខ័ណ្ឌ", definition: "ដែនកំណត់, ផ្នែក", pronunciation: "ខាន់" },
      { word: "ខន្ធ", definition: "តួខ្លួន, ពួក, កង", pronunciation: "ខាន់" }
    ],
    synonyms: ["ខាន", "ផ្អាក"],
    antonyms: ["បន្ត"],
    relatedWords: ["តំណែង", "មន្ត្រី", "ខាន់ស្លា"],
    example: "លោកឧកញ៉ាមានងារជាខាន់។"
  },
  "ខ័ណ្ឌ": {
    word: "ខ័ណ្ឌ",
    pronunciation: "ខាន់",
    definition: "ផ្នែក, ប៉ែក, ដែនកំណត់រដ្ឋបាល (District).",
    homophones: [
       { word: "ខាន់", definition: "ឈ្មោះតំណែង", pronunciation: "ខាន់" },
       { word: "ខ័ណ្ឌ", definition: "ដែនកំណត់, ផ្នែក", pronunciation: "ខាន់" },
       { word: "ខន្ធ", definition: "តួខ្លួន", pronunciation: "ខាន់" }
    ],
    synonyms: ["ផ្នែក", "ចំណែក", "ស្រុក"],
    antonyms: [],
    relatedWords: ["រាជធានី", "សង្កាត់"],
    example: "ខ្ញុំរស់នៅខ័ណ្ឌដូនពេញ។"
  },
  "ខន្ធ": {
    word: "ខន្ធ",
    pronunciation: "ខាន់",
    definition: "គំនរ, ពួក, កង, តួខ្លួន (ពុទ្ធសាសនា)។",
    homophones: [
       { word: "ខាន់", definition: "ឈ្មោះតំណែង", pronunciation: "ខាន់" },
       { word: "ខ័ណ្ឌ", definition: "ដែនកំណត់", pronunciation: "ខាន់" },
       { word: "ខន្ធ", definition: "តួខ្លួន, បញ្ចខន្ធ", pronunciation: "ខាន់" }
    ],
    synonyms: ["រាងកាយ", "តួ"],
    antonyms: [],
    relatedWords: ["បញ្ចខន្ធ"],
    example: "រូបខន្ធមិនទៀង។"
  },
  "ខេត្ត": {
    word: "ខេត្ត",
    pronunciation: "ខេត",
    definition: "ដែនដីរដ្ឋបាលធំជាងស្រុក។",
    homophones: [
      { word: "ខេត្ត", definition: "ដែនដី", pronunciation: "ខេត" },
      { word: "ខេត", definition: "ខែល, គ្រឿងការពារ", pronunciation: "ខេត" }
    ],
    synonyms: ["ដែន"],
    antonyms: [],
    relatedWords: ["ក្រុង", "រាជធានី"],
    example: "ខេត្តសៀមរាប។"
  },
  "ខេត": {
    word: "ខេត",
    pronunciation: "ខេត",
    definition: "ខែល, គ្រឿងការពារ (បាលី)។",
    homophones: [
      { word: "ខេត្ត", definition: "ដែនដី", pronunciation: "ខេត" },
      { word: "ខេត", definition: "ខែល", pronunciation: "ខេត" }
    ],
    synonyms: ["ខែល"],
    antonyms: [],
    relatedWords: [],
    example: "កាន់ខេត។"
  },
  "ខា": {
    word: "ខា",
    pronunciation: "ខា",
    definition: "ឈ្មោះឆ្នាំទី៣ (ខ្លា)។",
    homophones: [
      { word: "ខា", definition: "ឆ្នាំខ្លា", pronunciation: "ខា" },
      { word: "ខារ", definition: "ទាញអូស / រសខារ", pronunciation: "ខា" }
    ],
    synonyms: ["ខ្លា"],
    antonyms: [],
    relatedWords: ["ឆ្នាំ"],
    example: "គាត់កើតឆ្នាំខា។"
  },
  "ខារ": {
    word: "ខារ",
    pronunciation: "ខា",
    definition: "(កិ) ទាញអូសដោយគ្រឿងចក្រ (ខារឈើ)។ (គុ) ដែលមានរសឬក្លិនស្ទើរហាងស្ទើរក្រពុល (រសខារ)។ (ន) ឈ្មោះត្រប់មួយប្រភេទ។",
    homophones: [
      { word: "ខា", definition: "ឆ្នាំខ្លា", pronunciation: "ខា" },
      { word: "ខារ", definition: "ទាញអូស / រសខារ", pronunciation: "ខា" }
    ],
    synonyms: ["ទាញ", "ហាង", "ក្រពុល"],
    antonyms: [],
    relatedWords: ["ត្រប់ខារ", "គ្រឿងចក្រ"],
    example: "គេប្រើឡានខារឈើ។"
  },
  "ខាត": {
    word: "ខាត",
    pronunciation: "ខាត",
    definition: "បង់, មិនចំណេញ។",
    homophones: [
      { word: "ខាត", definition: "បង់, មិនចំណេញ", pronunciation: "ខាត" },
      { word: "ខាត់", definition: "ដុសខាត់", pronunciation: "ខាត" }
    ],
    synonyms: ["បង់"],
    antonyms: ["ចំណេញ"],
    relatedWords: ["ខាតបង់", "ក្ស័យ"],
    example: "រកស៊ីខាត។"
  },
  "ខាត់": {
    word: "ខាត់",
    pronunciation: "ខាត",
    definition: "ដុសខាត់ឲ្យរលោង។",
    homophones: [
      { word: "ខាត", definition: "បង់, មិនចំណេញ", pronunciation: "ខាត" },
      { word: "ខាត់", definition: "ដុសខាត់", pronunciation: "ខាត" }
    ],
    synonyms: ["ដុស", "រំលីង"],
    antonyms: [],
    relatedWords: ["ខាត់ស្បែកជើង", "ក្រដាសខាត់"],
    example: "ខាត់ស្បែកជើង។"
  },
  "ខ្យល់": {
    word: "ខ្យល់",
    pronunciation: "ខ្យល់",
    definition: "ធាតុដែលបក់។",
    homophones: [
      { word: "ខ្យល់", definition: "ខ្យល់បក់", pronunciation: "ខ្យល់" },
      { word: "ខ្យរ", definition: "ខ្យង (អក្ខរាវិរុទ្ធម្យ៉ាង)", pronunciation: "ខ្យល់/ខ្យរ" }
    ],
    synonyms: ["វាយោ"],
    antonyms: [],
    relatedWords: ["ខ្យល់អាកាស"],
    example: "ខ្យល់បក់។"
  },

  // ========================== គ (K - soft) ==========================
  "គ": {
    word: "គ",
    pronunciation: "គ",
    definition: "និយាយមិនរួច (Mute).",
    homophones: [
      { word: "គ", definition: "មនុស្សគ", pronunciation: "គ" },
      { word: "គរ", definition: "ពូនចុះពូនឡើង", pronunciation: "គ" }
    ],
    synonyms: ["ថ្លង់"],
    antonyms: [],
    relatedWords: ["គថ្លង់"],
    example: "គាត់គ។"
  },
  "គរ": {
    word: "គរ",
    pronunciation: "គ",
    definition: "ពូនចុះពូនឡើង, ប្រមូលផ្តុំ។",
    homophones: [
      { word: "គ", definition: "មនុស្សគ", pronunciation: "គ" },
      { word: "គរ", definition: "ពូន, ប្រមូលផ្តុំ", pronunciation: "គ" }
    ],
    synonyms: ["ពូន", "ប្រមូល"],
    antonyms: ["រាយ"],
    relatedWords: ["គំនរ"],
    example: "គរគ្នា។"
  },
  "គុណ": {
    word: "គុណ",
    pronunciation: "គុន",
    definition: "សេចក្តីល្អ, បុណ្យស័ក្តិ, ការធ្វើលេខគុណ។",
    homophones: [
      { word: "គុណ", definition: "សេចក្តីល្អ, លេខគុណ", pronunciation: "គុន" },
      { word: "គុន", definition: "ក្បាច់គុន", pronunciation: "គុន" }
    ],
    synonyms: ["សេចក្តីល្អ", "បុណ្យ"],
    antonyms: ["ទោស"],
    relatedWords: ["ឪពុកម្តាយ", "គ្រូ"],
    example: "កូនត្រូវដឹងគុណឪពុកម្តាយ។"
  },
  "គុន": {
    word: "គុន",
    pronunciation: "គុន",
    definition: "ក្បាច់យុទ្ធសិល្ប៍, ល្បិច។",
    homophones: [
      { word: "គុណ", definition: "សេចក្តីល្អ, លេខគុណ", pronunciation: "គុន" },
      { word: "គុន", definition: "ក្បាច់គុន", pronunciation: "គុន" }
    ],
    synonyms: ["យុទ្ធសិល្ប៍", "ក្បាច់"],
    antonyms: [],
    relatedWords: ["ល្បុក្កតោ", "ប្រដាល់"],
    example: "គាត់ហាត់គុនរាល់ព្រឹក។"
  },
  "គូ": {
    word: "គូ",
    pronunciation: "គូ",
    definition: "ពីរ, សម្រាប់, ដៃគូ។",
    homophones: [
      { word: "គូ", definition: "មួយគូ, ដៃគូ", pronunciation: "គូ" },
      { word: "គូរ", definition: "គូររូប, សរសេរ", pronunciation: "គូ" },
      { word: "គោ", definition: "សត្វគោ (សូរស្រដៀង)", pronunciation: "គោ" }
    ],
    synonyms: ["ទ្វេ"],
    antonyms: ["ឯក", "ទោល"],
    relatedWords: ["ស្វាមីភរិយា", "មិត្ត"],
    example: "ពួកគេជាគូស្នេហ៍។"
  },
  "គូរ": {
    word: "គូរ",
    pronunciation: "គូ",
    definition: "សរសេរវាសជាបន្ទាត់ ឬជារូបភាព។",
    homophones: [
      { word: "គូ", definition: "មួយគូ", pronunciation: "គូ" },
      { word: "គូរ", definition: "គូររូប", pronunciation: "គូ" }
    ],
    synonyms: ["វាស", "សរសេរ"],
    antonyms: ["លុប"],
    relatedWords: ["គំនូរ", "ខ្មៅដៃ"],
    example: "គាត់ចូលចិត្តគូររូប។"
  },
  "គុក": {
    word: "គុក",
    pronunciation: "គុក",
    definition: "កន្លែងឃុំឃាំង។",
    homophones: [
      { word: "គុក", definition: "ពន្ធនាគារ", pronunciation: "គុក" },
      { word: "គុក", definition: "អ្នកធ្វើម្ហូប (Cook - កម្ចី)", pronunciation: "គុក" }
    ],
    synonyms: ["ពន្ធនាគារ", "ច្រវាក់"],
    antonyms: [],
    relatedWords: ["ជាប់គុក", "ទោស"],
    example: "ជាប់គុក។"
  },
  "គ្រោះ": {
    word: "គ្រោះ",
    pronunciation: "គ្រោះ",
    definition: "ហេតុអាក្រក់, ឧបទ្រព។",
    homophones: [
      { word: "គ្រោះ", definition: "ហេតុអាក្រក់, គ្រោះថ្នាក់", pronunciation: "គ្រោះ" },
      { word: "គ្រោស", definition: "គម្រោះគម្រើយ", pronunciation: "គ្រោះ" }
    ],
    synonyms: ["ភ័យ", "អន្តរាយ"],
    antonyms: ["លាភ", "សំណាង"],
    relatedWords: ["គ្រោះថ្នាក់"],
    example: "ជួបគ្រោះថ្នាក់។"
  },
  "គ្រោស": {
    word: "គ្រោស",
    pronunciation: "គ្រោះ",
    definition: "គម្រោះគម្រើយ, មិនពីរោះ។",
    homophones: [
      { word: "គ្រោះ", definition: "គ្រោះថ្នាក់", pronunciation: "គ្រោះ" },
      { word: "គ្រោស", definition: "គម្រោះគម្រើយ", pronunciation: "គ្រោះ" }
    ],
    synonyms: ["គម្រោះ"],
    antonyms: ["ផ្អែម"],
    relatedWords: ["សម្តី"],
    example: "សម្តីគ្រោស។"
  },
  "គា": {
    word: "គា",
    pronunciation: "គា",
    definition: "ថែរក្សា, ឃ្វាល។",
    homophones: [
      { word: "គា", definition: "ថែរក្សា, ឃ្វាល", pronunciation: "គា" },
      { word: "គារ", definition: "គោរព, អោន", pronunciation: "គា" }
    ],
    synonyms: ["ឃ្វាល"],
    antonyms: [],
    relatedWords: ["គាគោ"],
    example: "គាគោ។"
  },
  "គារ": {
    word: "គារ",
    pronunciation: "គា",
    definition: "គោរព, អោនលំទោន។",
    homophones: [
      { word: "គា", definition: "ថែរក្សា", pronunciation: "គា" },
      { word: "គារ", definition: "គោរព", pronunciation: "គា" }
    ],
    synonyms: ["គោរព"],
    antonyms: ["ប្រមាថ"],
    relatedWords: ["គារវកិច្ច"],
    example: "ធ្វើគារវកិច្ច។"
  },

  // ========================== ឃ (Kh - soft) ==========================
  "ឃុំ": {
    word: "ឃុំ",
    pronunciation: "ឃុំ",
    definition: "ដែនរដ្ឋបាលក្រោមស្រុក, កន្លែងឃុំឃាំង។",
    homophones: [
      { word: "ឃុំ", definition: "ឃុំស្រុក, ឃុំឃាំង", pronunciation: "ឃុំ" },
      { word: "ឃុម្ព", definition: "គុម្ពព្រៃ", pronunciation: "ឃុំ" }
    ],
    synonyms: ["សង្កាត់"],
    antonyms: ["ដោះលែង"],
    relatedWords: ["មេឃុំ", "ស្រុក"],
    example: "សាលាឃុំ។"
  },
  "ឃុម្ព": {
    word: "ឃុម្ព",
    pronunciation: "ឃុំ",
    definition: "គុម្ពព្រៃ, ព្រៃតូចៗ។",
    homophones: [
      { word: "ឃុំ", definition: "ឃុំស្រុក", pronunciation: "ឃុំ" },
      { word: "ឃុម្ព", definition: "គុម្ពព្រៃ", pronunciation: "ឃុំ" }
    ],
    synonyms: ["គុម្ព"],
    antonyms: [],
    relatedWords: ["ព្រៃ", "គុម្ព"],
    example: "ឃុម្ពព្រៃ។"
  },
  "ឃោ": {
    word: "ឃោ",
    pronunciation: "ឃោ",
    definition: "សំឡេងខ្ពស់, កងរំពង។",
    homophones: [
      { word: "ឃោ", definition: "សំឡេងកងរំពង", pronunciation: "ឃោ" },
      { word: "ឃោរ", definition: "សាហាវ, ខ្លាំងក្លា", pronunciation: "ឃោ" }
    ],
    synonyms: ["កងរំពង"],
    antonyms: [],
    relatedWords: ["ឃោសនា"],
    example: "ឃោសនា។"
  },
  "ឃោរ": {
    word: "ឃោរ",
    pronunciation: "ឃោ",
    definition: "ដែលសាហាវ, កាច, គួរឲ្យខ្លាច។",
    homophones: [
      { word: "ឃោ", definition: "សំឡេងកងរំពង", pronunciation: "ឃោ" },
      { word: "ឃោរ", definition: "សាហាវ", pronunciation: "ឃោ" }
    ],
    synonyms: ["សាហាវ"],
    antonyms: ["ស្លូត"],
    relatedWords: ["ឃោរឃៅ"],
    example: "ចិត្តឃោរឃៅ។"
  },
  "ឃ្លា": {
    word: "ឃ្លា",
    pronunciation: "ឃ្លា",
    definition: "ល្បះ, ប្រយោគ, មួយផ្នែកនៃសេចក្តី។",
    homophones: [
      { word: "ឃ្លា", definition: "ល្បះ, ប្រយោគ", pronunciation: "ឃ្លា" },
      { word: "ឃ្លារ", definition: "ដែលស្រឡះ", pronunciation: "ឃ្លា" }
    ],
    synonyms: ["ប្រយោគ"],
    antonyms: [],
    relatedWords: ["ឃ្លាប្រយោគ"],
    example: "ឃ្លាប្រយោគ។"
  },
  "ឃ្លារ": {
    word: "ឃ្លារ",
    pronunciation: "ឃ្លា",
    definition: "ដែលស្រឡះ, មិនមានអ្វីបិទបាំង (សំឡេងឃ្លារ)។",
    homophones: [
      { word: "ឃ្លា", definition: "ប្រយោគ", pronunciation: "ឃ្លា" },
      { word: "ឃ្លារ", definition: "ស្រឡះ", pronunciation: "ឃ្លា" }
    ],
    synonyms: ["ស្រឡះ"],
    antonyms: [],
    relatedWords: [],
    example: "សំឡេងឃ្លារ។"
  },

  // ========================== ង (Ng) ==========================
  "ង": {
    word: "ង",
    pronunciation: "ង",
    definition: "អក្សរទី ៥ ក្នុងពពួកព្យញ្ជនៈ / កោង, វៀច។",
    homophones: [
      { word: "ង", definition: "អក្សរ ង / កោង", pronunciation: "ង" },
      { word: "ងរ", definition: "ងរង៉ក់, ខឹង", pronunciation: "ង" }
    ],
    synonyms: ["វៀច", "កោង"],
    antonyms: ["ត្រង់"],
    relatedWords: ["ងរង៉ក់"],
    example: "ផ្លូវង។"
  },
  "ងរ": {
    word: "ងរ",
    pronunciation: "ង",
    definition: "ធ្វើអាការៈមិនពេញចិត្ត, ខឹងតិចៗ, ងក់។",
    homophones: [
      { word: "ង", definition: "អក្សរ ង", pronunciation: "ង" },
      { word: "ងរ", definition: "ងរង៉ក់", pronunciation: "ង" }
    ],
    synonyms: ["ខឹង", "ង៉ក់"],
    antonyms: ["ញញឹម"],
    relatedWords: [],
    example: "នាងងរនឹងសង្សារ។"
  },
  "ងា": {
    word: "ងា",
    pronunciation: "ងា",
    definition: "ក្មេងតូច, ទារក (ភាសានិយាយ)។",
    homophones: [
      { word: "ងា", definition: "ក្មេងតូច", pronunciation: "ងា" },
      { word: "ងារ", definition: "ឋានៈ, តំណែង", pronunciation: "ងា" }
    ],
    synonyms: ["ទារក"],
    antonyms: [],
    relatedWords: [],
    example: "អាងា។"
  },
  "ងារ": {
    word: "ងារ",
    pronunciation: "ងា",
    definition: "ឋានៈ, ឈ្មោះតំណែង។",
    homophones: [
      { word: "ងា", definition: "ក្មេងតូច", pronunciation: "ងា" },
      { word: "ងារ", definition: "ឋានៈ", pronunciation: "ងា" }
    ],
    synonyms: ["យស", "តំណែង"],
    antonyms: [],
    relatedWords: ["ងារស័ក្តិ"],
    example: "ទទួលងារជាឧកញ៉ា។"
  },

  // ========================== ច (Ch) ==========================
  "ច": {
    word: "ច",
    pronunciation: "ច",
    definition: "ឈ្មោះឆ្នាំទី ១១ (ឆ្នាំច).",
    homophones: [
      { word: "ច", definition: "ឆ្នាំច", pronunciation: "ច" },
      { word: "ចរ", definition: "ដើរ, ធ្វើដំណើរ", pronunciation: "ច" }
    ],
    synonyms: ["ឆ្កែ"],
    antonyms: [],
    relatedWords: ["ឆ្នាំ"],
    example: "ឆ្នាំច។"
  },
  "ចរ": {
    word: "ចរ",
    pronunciation: "ច",
    definition: "ដើរ, ត្រាច់ទៅ, ធ្វើដំណើរ។",
    homophones: [
      { word: "ច", definition: "ឆ្នាំច", pronunciation: "ច" },
      { word: "ចរ", definition: "ធ្វើដំណើរ", pronunciation: "ច" }
    ],
    synonyms: ["ដើរ", "ត្រាច់"],
    antonyms: ["ឈប់"],
    relatedWords: ["ចរាចរណ៍", "ចរចា"],
    example: "ចរាចរណ៍។"
  },
  "ចា": {
    word: "ចា",
    pronunciation: "ចា",
    definition: "ឈ្មោះដើមឈើមួយប្រភេទ។",
    homophones: [
      { word: "ចា", definition: "ដើមចា", pronunciation: "ចា" },
      { word: "ចារ", definition: "សរសេរ, ឆ្លាក់", pronunciation: "ចា" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: [],
    example: "ដើមចា។"
  },
  "ចារ": {
    word: "ចារ",
    pronunciation: "ចា",
    definition: "សរសេរអក្សរដោយដែកចារលើស្លឹករឹត ឬសិលា។",
    homophones: [
      { word: "ចា", definition: "ដើមចា", pronunciation: "ចា" },
      { word: "ចារ", definition: "សរសេរ, ឆ្លាក់", pronunciation: "ចា" }
    ],
    synonyms: ["សរសេរ", "ឆ្លាក់"],
    antonyms: ["លុប"],
    relatedWords: ["ស្លឹករឹត", "សាស្រ្តា", "ចារិក"],
    example: "ចារគម្ពីរ។"
  },
  "ចន្ទ": {
    word: "ចន្ទ",
    pronunciation: "ចាន់",
    definition: "ព្រះចន្ទ, ឈ្មោះដើមឈើខ្លឹមក្រអូប។",
    homophones: [
      { word: "ចន្ទ", definition: "ព្រះចន្ទ", pronunciation: "ចាន់" },
      { word: "ចាន់", definition: "ឈ្មោះផ្លែឈើ", pronunciation: "ចាន់" },
      { word: "ចាន", definition: "ភាជន៍ដាក់ម្ហូប", pronunciation: "ចាន" }
    ],
    synonyms: ["លោកខែ", "សសិ"],
    antonyms: ["ព្រះអាទិត្យ"],
    relatedWords: ["ពន្លឺ", "រាត្រី", "ថ្ងៃចន្ទ"],
    example: "ព្រះចន្ទពេញបូណ៌មី។"
  },
  "ចាន់": {
    word: "ចាន់",
    pronunciation: "ចាន់",
    definition: "ឈ្មោះដើមឈើមួយប្រភេទផ្លែទុំពណ៌លឿង។",
    homophones: [
      { word: "ចន្ទ", definition: "ព្រះចន្ទ", pronunciation: "ចាន់" },
      { word: "ចាន់", definition: "ផ្លែចាន់", pronunciation: "ចាន់" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["ផ្លែឈើ"],
    example: "ផ្លែចាន់មានក្លិនក្រអូប។"
  },
  "ចាន": {
    word: "ចាន",
    pronunciation: "ចាន",
    definition: "ភាជន៍សម្រាប់ដាក់ម្ហូប។",
    homophones: [
      { word: "ចន្ទ", definition: "ព្រះចន្ទ", pronunciation: "ចាន់" },
      { word: "ចាន់", definition: "ផ្លែចាន់", pronunciation: "ចាន់" },
      { word: "ចាន", definition: "ភាជន៍", pronunciation: "ចាន" }
    ],
    synonyms: ["ភាជន៍"],
    antonyms: [],
    relatedWords: ["ចានឆ្នាំង"],
    example: "លាងចាន។"
  },
  "ចិត្ត": {
    word: "ចិត្ត",
    pronunciation: "ចិត",
    definition: "វិញ្ញាណ, គំនិត, អារម្មណ៍។",
    homophones: [
      { word: "ចិត្ត", definition: "គំនិត, អារម្មណ៍", pronunciation: "ចិត" },
      { word: "ចិត", definition: "អារ, កាត់", pronunciation: "ចិត" }
    ],
    synonyms: ["គំនិត", "មនោ", "ហឫទ័យ"],
    antonyms: [],
    relatedWords: ["ទឹកចិត្ត", "ចិត្តល្អ"],
    example: "មានចិត្តល្អ។"
  },
  "ចិត": {
    word: "ចិត",
    pronunciation: "ចិត",
    definition: "អារ, កាត់, ធ្វើឲ្យស្អាតដោយកាំបិត។",
    homophones: [
      { word: "ចិត្ត", definition: "គំនិត", pronunciation: "ចិត" },
      { word: "ចិត", definition: "អារ, កាត់", pronunciation: "ចិត" }
    ],
    synonyms: ["អារ", "កាត់", "ចៀរ"],
    antonyms: [],
    relatedWords: ["កាំបិត", "ចិតបន្លែ"],
    example: "ចិតបន្លែ។"
  },
  "ជា": {
    word: "ជា",
    pronunciation: "ជា",
    definition: "គ្មានរោគ, គឺ, សម្រាប់។",
    homophones: [
      { word: "ជា", definition: "សះស្បើយ, គឺ", pronunciation: "ជា" },
      { word: "ជារ", definition: "រាលដាល, ជន់ជោរ", pronunciation: "ជា" }
    ],
    synonyms: ["សះស្បើយ", "គឺ"],
    antonyms: ["ឈឺ", "ជា"],
    relatedWords: ["ជាសះស្បើយ"],
    example: "គាត់ជាសះស្បើយ។"
  },
  "ជារ": {
    word: "ជារ",
    pronunciation: "ជា",
    definition: "រាលដាល, ជន់ជោរ (ទឹក)។",
    homophones: [
      { word: "ជា", definition: "សះស្បើយ, គឺ", pronunciation: "ជា" },
      { word: "ជារ", definition: "រាលដាល, ជន់ជោរ", pronunciation: "ជា" }
    ],
    synonyms: ["រាល", "ជន់"],
    antonyms: [],
    relatedWords: ["ជន់ជោរ"],
    example: "ទឹកជារ។"
  },
  "ចាក់": {
    word: "ចាក់",
    pronunciation: "ចាក់",
    definition: "ស៊កចូល, ចាក់ថ្នាំ, ចាក់ទឹក។",
    homophones: [
      { word: "ចាក់", definition: "ស៊កចូល, ចាក់ថ្នាំ", pronunciation: "ចាក់" },
      { word: "ចាក", definition: "ចាកចេញ (សូរជិត)", pronunciation: "ចាក" }
    ],
    synonyms: ["ស៊ក", "ចាក់"],
    antonyms: [],
    relatedWords: ["ចាក់ថ្នាំ", "ចាក់សោ"],
    example: "ចាក់ថ្នាំ។"
  },
  "ចាក": {
    word: "ចាក",
    pronunciation: "ចាក",
    definition: "ចេញ, ឃ្លាតចេញ។",
    homophones: [
      { word: "ចាក់", definition: "ស៊កចូល", pronunciation: "ចាក់" },
      { word: "ចាក", definition: "ចេញ", pronunciation: "ចាក" }
    ],
    synonyms: ["ចេញ", "ឃ្លាត"],
    antonyms: ["ចូល"],
    relatedWords: ["ចាកចេញ", "ចាកចោល"],
    example: "ចាកចេញពីផ្ទះ។"
  },
  "ចួន": {
    word: "ចួន",
    pronunciation: "ជួន",
    definition: "ត្រូវគ្នា, ស៊ីគ្នា (ពាក្យចួន)។",
    homophones: [
      { word: "ចួន", definition: "ត្រូវគ្នា", pronunciation: "ជួន" },
      { word: "ជួន", definition: "ប្រទះ, ជួប", pronunciation: "ជួន" },
      { word: "ជូន", definition: "ឲ្យ, នាំទៅ", pronunciation: "ជួន" }
    ],
    synonyms: ["ត្រូវ", "ស៊ី"],
    antonyms: [],
    relatedWords: ["ពាក្យចួន"],
    example: "ពាក្យចួន។"
  },

  // ========================== ឆ (Chh) ==========================
  "ឆ": {
    word: "ឆ",
    pronunciation: "ឆ",
    definition: "បោកប្រាស់, ឆបោក។",
    homophones: [
      { word: "ឆ", definition: "ឆបោក", pronunciation: "ឆ" },
      { word: "ឆរ", definition: "ឈរត្រៀបត្រា", pronunciation: "ឆ" }
    ],
    synonyms: ["បោក"],
    antonyms: ["ស្មោះ"],
    relatedWords: ["ឆបោក"],
    example: "កុំឆគេ។"
  },
  "ឆរ": {
    word: "ឆរ",
    pronunciation: "ឆ",
    definition: "ដែលនៅត្រៀបត្រា, ខ្ពស់ត្រដែត។",
    homophones: [
      { word: "ឆ", definition: "ឆបោក", pronunciation: "ឆ" },
      { word: "ឆរ", definition: "ត្រៀបត្រា", pronunciation: "ឆ" }
    ],
    synonyms: ["ត្រៀបត្រា"],
    antonyms: [],
    relatedWords: ["ឆរឆាយ"],
    example: "កំពូលប្រាសាទខ្ពស់ឆរ។"
  },
  "ឆា": {
    word: "ឆា",
    pronunciation: "ឆា",
    definition: "ចំអិនម្ហូបដោយប្រើខ្លាញ់និងកម្តៅខ្លាំង។",
    homophones: [
      { word: "ឆា", definition: "បំពង, ឆា", pronunciation: "ឆា" },
      { word: "ឆារ", definition: "រុះរើ, កាយ", pronunciation: "ឆា" }
    ],
    synonyms: ["បំពង"],
    antonyms: [],
    relatedWords: ["ឆាក្តៅ"],
    example: "ឆាមី។"
  },
  "ឆារ": {
    word: "ឆារ",
    pronunciation: "ឆា",
    definition: "កាយ, រុះរើ (ឆារឆាយ)។",
    homophones: [
      { word: "ឆា", definition: "បំពង, ឆា", pronunciation: "ឆា" },
      { word: "ឆារ", definition: "រុះរើ", pronunciation: "ឆា" }
    ],
    synonyms: ["កាយ", "រុះ"],
    antonyms: [],
    relatedWords: ["ឆារឆាយ"],
    example: "កុំឆារអីវ៉ាន់។"
  },
  "ឆ្មា": {
    word: "ឆ្មា",
    pronunciation: "ឆ្មា",
    definition: "សត្វចតុប្បាទស្រុកមួយប្រភេទ មានរូបរាងនិងកិរិយាស្រដៀងនឹងខ្លាធំ ប៉ុន្តែមានមាឌតូច។",
    homophones: [
      { word: "ឆ្មា", definition: "សត្វឆ្មា", pronunciation: "ឆ្មា" },
      { word: "ឆ្មារ", definition: "តូច, ល្អិត", pronunciation: "ឆ្មា" }
    ],
    synonyms: ["វិឡារ", "បាលី", "មិញ"],
    antonyms: [],
    relatedWords: ["ខ្លា", "សត្វ", "រោម"],
    example: "ឆ្មាចូលចិត្តដេកលើកៅអី។"
  },
  "ឆ្មារ": {
    word: "ឆ្មារ",
    pronunciation: "ឆ្មា",
    definition: "ដែលមានសាច់ស្ដើង, តូច, ល្អិត។",
    homophones: [
      { word: "ឆ្មា", definition: "សត្វឆ្មា", pronunciation: "ឆ្មា" },
      { word: "ឆ្មារ", definition: "តូច, ល្អិត", pronunciation: "ឆ្មា" }
    ],
    synonyms: ["តូច", "ល្អិត", "ស្ដើង"],
    antonyms: ["ធំ", "គំ", "ក្រាស់"],
    relatedWords: ["ចម្រាញ់", "ផ្ចិតផ្ចង់", "ចំណចំណារ"],
    example: "គាត់មានរាងកាយឆ្មារ។"
  },
  "ឆាន់": {
    word: "ឆាន់",
    pronunciation: "ឆាន់",
    definition: "បរិភោគ (ពាក្យព្រះសង្ឃ)។",
    homophones: [
      { word: "ឆាន់", definition: "បរិភោគ", pronunciation: "ឆាន់" },
      { word: "ឆ័ត្រ", definition: "ឆត្រ (សូរជិត)", pronunciation: "ឆាត់" }
    ],
    synonyms: ["ពិសា", "ហូប"],
    antonyms: [],
    relatedWords: ["ចង្ហាន់"],
    example: "ព្រះសង្ឃឆាន់ចង្ហាន់។"
  },
  "ឆាក": {
    word: "ឆាក",
    pronunciation: "ឆាក",
    definition: "កន្លែងសម្តែង, វេទិកា។",
    homophones: [
      { word: "ឆាក", definition: "វេទិកា", pronunciation: "ឆាក" },
      { word: "ឆាត", definition: "Chat (កម្ចី)", pronunciation: "ឆាត" }
    ],
    synonyms: ["វេទិកា"],
    antonyms: [],
    relatedWords: ["ឆាកល្ខោន"],
    example: "ឡើងឆាក។"
  },

  // ========================== ជ (Ch - soft) ==========================
  "ជាន់": {
    word: "ជាន់",
    pronunciation: "ជាន់",
    definition: "ដាក់ជើងលើ, ថ្នាក់ (ផ្ទះ)។",
    homophones: [
      { word: "ជាន់", definition: "ដាក់ជើងលើ, ថ្នាក់", pronunciation: "ជាន់" },
      { word: "ជន់", definition: "ទឹកឡើង", pronunciation: "ជន់" }
    ],
    synonyms: ["ឈាន", "ថ្នាក់"],
    antonyms: [],
    relatedWords: ["ផ្ទះ", "ជើង"],
    example: "ផ្ទះនេះមានពីរជាន់។"
  },
  "ជន់": {
    word: "ជន់",
    pronunciation: "ជាន់",
    definition: "ទឹកដែលឡើងលិច។",
    homophones: [
      { word: "ជាន់", definition: "ដាក់ជើងលើ", pronunciation: "ជាន់" },
      { word: "ជន់", definition: "ទឹកឡើង", pronunciation: "ជន់" }
    ],
    synonyms: ["ទឹកជំនន់"],
    antonyms: ["ទឹកស្រក"],
    relatedWords: ["ទឹក", "ទន្លេ"],
    example: "រដូវវស្សាទឹកទន្លេតែងតែជន់។"
  },
  "ជ័យ": {
    word: "ជ័យ",
    pronunciation: "ជៃ",
    definition: "ការឈ្នះ, សេចក្តីសុខ។",
    homophones: [
      { word: "ជ័យ", definition: "ការឈ្នះ", pronunciation: "ជៃ" },
      { word: "ជៃ", definition: "ឈ្មោះចៃ, ក្មេង", pronunciation: "ជៃ" }
    ],
    synonyms: ["ជោគជ័យ", "ឈ្នះ"],
    antonyms: ["បរាជ័យ", "ចាញ់"],
    relatedWords: ["សិរី", "មង្គល"],
    example: "ទទួលបានជ័យជំនះ។"
  },
  "ជេរ": {
    word: "ជេរ",
    pronunciation: "ជេ",
    definition: "ពោលពាក្យអាក្រក់ដាក់។",
    homophones: [
      { word: "ជេរ", definition: "ស្តីបន្ទោស", pronunciation: "ជេ" },
      { word: "ជេ", definition: "អក្សរ J", pronunciation: "ជេ" }
    ],
    synonyms: ["ស្តី", "ប្រមាថ"],
    antonyms: ["សរសើរ"],
    relatedWords: ["ជេរប្រមាថ"],
    example: "កុំជេរគ្នា។"
  },
  "ជួន": {
    word: "ជួន",
    pronunciation: "ជួន",
    definition: "ប្រទះ, ជួប។",
    homophones: [
      { "word": "ជួន", "definition": "ប្រទះ, ជួប", "pronunciation": "ជួន" },
      { "word": "ជូន", "definition": "ឲ្យ, នាំទៅ", "pronunciation": "ជួន" },
      { "word": "ចួន", "definition": "ត្រូវគ្នា (ពាក្យ)", "pronunciation": "ជួន" }
    ],
    synonyms: ["ជួប", "ប្រទះ"],
    antonyms: [],
    relatedWords: ["ជួនកាល"],
    example: "ជួនកាល។"
  },
  "ជូន": {
    word: "ជូន",
    pronunciation: "ជួន",
    definition: "ឲ្យ (គួរសម), នាំទៅ។",
    homophones: [
      { "word": "ជួន", "definition": "ជួប", "pronunciation": "ជួន" },
      { "word": "ជូន", "definition": "ឲ្យ, នាំទៅ", "pronunciation": "ជួន" },
      { "word": "ចួន", "definition": "ត្រូវគ្នា", "pronunciation": "ជួន" }
    ],
    synonyms: ["ឲ្យ", "នាំ"],
    antonyms: ["ទទួល"],
    relatedWords: ["ជូនពរ", "ជូនដំណើរ"],
    example: "ជូនពរ។"
  },

  // ========================== ឈ (Chh - soft) ==========================
  "ឈ": {
    "word": "ឈ",
    "pronunciation": "ឈ",
    "definition": "អក្សរទី ៩ ក្នុងពពួកព្យញ្ជនៈ។",
    "homophones": [
      { "word": "ឈ", "definition": "អក្សរ ឈ", "pronunciation": "ឈ" },
      { "word": "ឈរ", "definition": "ឈរត្រង់", "pronunciation": "ឈ" }
    ],
    "synonyms": [],
    "antonyms": ["អង្គុយ"],
    "relatedWords": [],
    "example": "ឈរត្រង់។"
  },
  "ឈរ": {
    "word": "ឈរ",
    "pronunciation": "ឈ",
    "definition": "ស្ថិតនៅក្នុងឥរិយាបថជើងទាំងពីរទ្រខ្លួនឲ្យត្រង់។",
    "homophones": [
      { "word": "ឈ", "definition": "អក្សរ ឈ", "pronunciation": "ឈ" },
      { "word": "ឈរ", "definition": "ឈរត្រង់", "pronunciation": "ឈ" }
    ],
    "synonyms": [],
    "antonyms": ["អង្គុយ", "ដេក"],
    "relatedWords": ["ឈរជើង"],
    "example": "សូមឈរឡើង។"
  },
  "ឈាន": {
    "word": "ឈាន",
    "pronunciation": "ឈាន",
    "definition": "លើកជើងដើរ។",
    "homophones": [
      { "word": "ឈាន", "definition": "ដើរ", "pronunciation": "ឈាន" },
      { "word": "ឈៀន", "definition": "បំពង (សូរជិត)", "pronunciation": "ឈៀន" }
    ],
    "synonyms": ["ដើរ", "យាង"],
    "antonyms": ["ឈប់"],
    "relatedWords": ["ជំហាន"],
    "example": "ឈានទៅមុខ។"
  },

  // ========================== ញ (Nh) ==========================
  "ញ": {
    "word": "ញ",
    "pronunciation": "ញ",
    "definition": "អក្សរទី ១០ ក្នុងពពួកព្យញ្ជនៈ។",
    "homophones": [
      { "word": "ញ", "definition": "អក្សរ ញ", "pronunciation": "ញ" },
      { "word": "ញរ", "definition": "ញ័រ, រងា", "pronunciation": "ញ" }
    ],
    "synonyms": [],
    "antonyms": [],
    "relatedWords": [],
    "example": "ញរទទ្រើក។"
  },
  "ញរ": {
    "word": "ញរ",
    "pronunciation": "ញ",
    "definition": "ញាប់ញ័រដោយរងា ឬភ័យ។",
    "homophones": [
      { "word": "ញ", "definition": "អក្សរ ញ", "pronunciation": "ញ" },
      { "word": "ញរ", "definition": "ញ័រ, រងា", "pronunciation": "ញ" }
    ],
    "synonyms": ["ញ័រ"],
    "antonyms": [],
    "relatedWords": ["រងា"],
    "example": "រងាញរ។"
  },
  "ញាណ": {
    "word": "ញាណ",
    "pronunciation": "ញាន",
    "definition": "សេចក្តីដឹង, ប្រាជ្ញា។",
    "homophones": [
      { "word": "ញាណ", "definition": "ប្រាជ្ញា", "pronunciation": "ញាន" },
      { "word": "ញាន", "definition": "ញៀន, ជាប់ចិត្ត", "pronunciation": "ញាន" }
    ],
    "synonyms": ["ប្រាជ្ញា", "ការដឹង"],
    "antonyms": ["អវិជ្ជា"],
    "relatedWords": ["វិញ្ញាណ", "ញាណទិព្វ"],
    "example": "ព្រះអង្គមានញាណវិសេស។"
  },
  "ញាន": {
    "word": "ញាន",
    "pronunciation": "ញាន",
    "definition": "ដែលជាប់ចិត្តដកមិនរួច។",
    "homophones": [
      { "word": "ញាណ", "definition": "ប្រាជ្ញា", "pronunciation": "ញាន" },
      { "word": "ញាន", "definition": "ញៀន", "pronunciation": "ញាន" }
    ],
    "synonyms": ["ងប់", "ជក់"],
    "antonyms": [],
    "relatedWords": ["គ្រឿងញៀន", "ញៀន"],
    "example": "គាត់ញាននឹងល្បែង។"
  },
  "ញាតិ": {
    "word": "ញាតិ",
    "pronunciation": "ញាត",
    "definition": "សាច់សាលោហិត។",
    "homophones": [
      { "word": "ញាតិ", "definition": "សាច់ញាតិ", "pronunciation": "ញាត" },
      { "word": "ញាត", "definition": "ញាត់, បញ្ចូល", "pronunciation": "ញាត" }
    ],
    "synonyms": ["សាច់ញាតិ", "បងប្អូន"],
    "antonyms": ["អ្នកដទៃ"],
    "relatedWords": ["ញាតិមិត្ត"],
    "example": "សាច់ញាតិ។"
  },
  "ញាត": {
    "word": "ញាត",
    "pronunciation": "ញាត",
    "definition": "ញាត់, ដាក់បញ្ចូលឲ្យណែន។",
    "homophones": [
      { "word": "ញាតិ", "definition": "សាច់ញាតិ", "pronunciation": "ញាត" },
      { "word": "ញាត", "definition": "ញាត់", "pronunciation": "ញាត" }
    ],
    "synonyms": ["ញាត់"],
    "antonyms": [],
    "relatedWords": [],
    "example": "ញាតសំឡី។"
  },

  // ========================== ដ (D) ==========================
  "ដ": {
    "word": "ដ",
    "pronunciation": "ដ",
    "definition": "អក្សរទី ១១ ក្នុងពពួកព្យញ្ជនៈ។",
    "homophones": [
      { "word": "ដ", "definition": "អក្សរ ដ", "pronunciation": "ដ" },
      { "word": "ដរ", "definition": "កំពង់ចម្លង", "pronunciation": "ដ" }
    ],
    "synonyms": [],
    "antonyms": [],
    "relatedWords": [],
    "example": "កំពង់ដ។"
  },
  "ដរ": {
    "word": "ដរ",
    "pronunciation": "ដ",
    "definition": "ទីសម្រាប់ចម្លងទឹកដោយទូក ឬកប៉ាល់។",
    "homophones": [
      { "word": "ដ", "definition": "អក្សរ ដ", "pronunciation": "ដ" },
      { "word": "ដរ", "definition": "កំពង់ចម្លង", "pronunciation": "ដ" }
    ],
    "synonyms": ["កំពង់"],
    "antonyms": [],
    "relatedWords": ["ទូកដ"],
    "example": "ឆ្លងដ។"
  },
  "ដា": {
    "word": "ដា",
    "pronunciation": "ដា",
    "definition": "ឈ្មោះមនុស្ស ឬសត្វ។",
    "homophones": [
      { "word": "ដា", "definition": "ឈ្មោះ", "pronunciation": "ដា" },
      { "word": "ដារ", "definition": "វាយ, ដំ (ដែក)", "pronunciation": "ដា" }
    ],
    "synonyms": [],
    "antonyms": [],
    "relatedWords": [],
    "example": "ដារដែក។"
  },
  "ដារ": {
    "word": "ដារ",
    "pronunciation": "ដា",
    "definition": "វាយ, ដំ (ដែក)។",
    "homophones": [
      { "word": "ដា", "definition": "ឈ្មោះ", "pronunciation": "ដា" },
      { "word": "ដារ", "definition": "វាយ, ដំ", "pronunciation": "ដា" }
    ],
    "synonyms": ["វាយ", "ដំ"],
    "antonyms": [],
    "relatedWords": ["ជាងដែក"],
    "example": "ជាងកំពុងដារដែក។"
  },
  "ដល់": {
    "word": "ដល់",
    "pronunciation": "ដល់",
    "definition": "ទៅទល់, មកទល់។",
    "homophones": [
      { "word": "ដល់", "definition": "ទៅទល់", "pronunciation": "ដល់" },
      { "word": "ផ្តល់", "definition": "ឲ្យ (សូរជិត)", "pronunciation": "ផ្ដល់" }
    ],
    "synonyms": ["ទល់", "មក"],
    "antonyms": ["ចេញ"],
    "relatedWords": ["ទៅដល់"],
    "example": "ទៅដល់ផ្ទះ។"
  },
  "ឋាន": {
    "word": "ឋាន",
    "pronunciation": "ថាន",
    "definition": "ទីកន្លែង, ទីតាំង។",
    "homophones": [
      { "word": "ឋាន", "definition": "ទីកន្លែង", "pronunciation": "ថាន" },
      { "word": "ថាន", "definition": "ទម្រ, ជើង", "pronunciation": "ថាន" }
    ],
    "synonyms": ["ទី", "កន្លែង", "ភូមិ"],
    "antonyms": [],
    "relatedWords": ["ស្ថាន", "ឋានសួគ៌"],
    "example": "ឋានសួគ៌គឺជាកន្លែងសុខ។"
  },
  "តា": {
    "word": "តា",
    "pronunciation": "តា",
    "definition": "ឪពុករបស់ឪពុក ឬម្តាយ។",
    "homophones": [
      { "word": "តា", "definition": "ជីតា", "pronunciation": "តា" },
      { "word": "តារ", "definition": "ត្នោត (បាលី)", "pronunciation": "តា" }
    ],
    "synonyms": ["ជីតា"],
    "antonyms": ["យាយ"],
    "relatedWords": ["ចៅ"],
    "example": "តាខ្ញុំមានអាយុ ៨០ ឆ្នាំ។"
  },
  "តារ": {
    "word": "តារ",
    "pronunciation": "តា",
    "definition": "ដើមត្នោត (បាលី)។",
    "homophones": [
      { "word": "តា", "definition": "ជីតា", "pronunciation": "តា" },
      { "word": "តារ", "definition": "ត្នោត", "pronunciation": "តា" }
    ],
    "synonyms": ["ត្នោត"],
    "antonyms": [],
    "relatedWords": ["រុក្ខជាតិ"],
    "example": "តារព្រឹក្ស។"
  },
  "ទឹក": {
    "word": "ទឹក",
    "pronunciation": "ទឹក",
    "definition": "វត្ថុរាវគ្មានពណ៌គ្មានក្លិន។",
    "homophones": [
      { "word": "ទឹក", "definition": "វត្ថុរាវ", "pronunciation": "ទឹក" },
      { "word": "តឹក", "definition": "១០សង់ទីម៉ែត្រ, ព្រាង", "pronunciation": "ទឹក" }
    ],
    "synonyms": ["វារី", "គង្គា", "ឧទក"],
    "antonyms": ["ភ្លើង"],
    "relatedWords": ["ទន្លេ", "សមុទ្រ"],
    "example": "ខ្ញុំញ៉ាំទឹក។"
  },
  "តឹក": {
    "word": "តឹក",
    "pronunciation": "ទឹក",
    "definition": "១. សេចក្តីព្រាង, ការកត់ត្រា (តឹកតាង)។ ២. ឈ្មោះរង្វាស់ប្រវែងមានកំណត់ ១០ សង់ទីម៉ែត្រ (១ តឹក)។",
    "homophones": [
      { "word": "ទឹក", "definition": "វត្ថុរាវ", "pronunciation": "ទឹក" },
      { "word": "តឹក", "definition": "រង្វាស់, ព្រាង", "pronunciation": "ទឹក" }
    ],
    "synonyms": ["ព្រាង"],
    "antonyms": [],
    "relatedWords": ["តឹកតាង", "ម៉ែត្រ", "ហ៊ុន"],
    "example": "ឈើនេះមានមុខកាត់ ២ តឹក។"
  },
  "ត្រា": {
    "word": "ត្រា",
    "pronunciation": "ត្រា",
    "definition": "វត្ថុសម្រាប់បោះជាសញ្ញា។",
    "homophones": [
      { "word": "ត្រា", "definition": "សញ្ញា", "pronunciation": "ត្រា" },
      { "word": "ត្រារ", "definition": "រក្សា, ការពារ", "pronunciation": "ត្រា" }
    ],
    "synonyms": ["សញ្ញា", "ត្រី"],
    "antonyms": [],
    "relatedWords": ["ត្រី"],
    "example": "បោះត្រា។"
  },
  "ត្រារ": {
    "word": "ត្រារ",
    "pronunciation": "ត្រា",
    "definition": "រក្សា, ត្រួតត្រា, ការពារ។",
    "homophones": [
      { "word": "ត្រា", "definition": "សញ្ញា", "pronunciation": "ត្រា" },
      { "word": "ត្រារ", "definition": "រក្សា, ការពារ", "pronunciation": "ត្រា" }
    ],
    "synonyms": ["រក្សា", "ត្រួត"],
    "antonyms": [],
    "relatedWords": ["ត្រួតត្រា"],
    "example": "ត្រារក្សា។"
  },
  "ត": {
    "word": "ត",
    "pronunciation": "ត",
    "definition": "ភ្ជាប់, បន្ថែម។",
    "homophones": [
      { "word": "ត", "definition": "ភ្ជាប់", "pronunciation": "ត" },
      { "word": "តរ", "definition": "បន្ត, តត្រកូល", "pronunciation": "ត" }
    ],
    "synonyms": ["ភ្ជាប់"],
    "antonyms": ["ផ្តាច់"],
    "relatedWords": ["តភ្ជាប់"],
    "example": "តខ្សែភ្លើង។"
  },
  "តរ": {
    "word": "តរ",
    "pronunciation": "ត",
    "definition": "បន្ត, តត្រកូល។",
    "homophones": [
      { "word": "ត", "definition": "ភ្ជាប់", "pronunciation": "ត" },
      { "word": "តរ", "definition": "បន្ត", "pronunciation": "ត" }
    ],
    "synonyms": ["បន្ត"],
    "antonyms": [],
    "relatedWords": ["តរត្រកូល"],
    "example": "តរត្រកូល។"
  },
  "ថែ": {
    "word": "ថែ",
    "pronunciation": "ថែ",
    "definition": "រក្សា, គាំពារ។",
    "homophones": [
      { "word": "ថែ", "definition": "រក្សា", "pronunciation": "ថែ" },
      { "word": "ថេរ", "definition": "ស្ថិតស្ថេរ, ព្រះសង្ឃ", "pronunciation": "ថេរ" }
    ],
    "synonyms": ["រក្សា"],
    "antonyms": ["បំផ្លាញ"],
    "relatedWords": ["ថែទាំ"],
    "example": "ថែរក្សាសុខភាព។"
  },
  "ថេរ": {
    "word": "ថេរ",
    "pronunciation": "ថែ",
    "definition": "ដែលមិនប្រែប្រួល, ទៀងទាត់, ព្រះសង្ឃចាស់វស្សា (ថេរៈ)។",
    "homophones": [
      { "word": "ថែ", "definition": "រក្សា", "pronunciation": "ថែ" },
      { "word": "ថេរ", "definition": "ស្ថិតស្ថេរ", "pronunciation": "ថេរ" }
    ],
    "synonyms": ["ទៀង", "ស្ថិតស្ថេរ"],
    "antonyms": ["ប្រែប្រួល"],
    "relatedWords": ["ថេរវេលា", "ថេរដីកា"],
    "example": "តម្លៃថេរ។"
  },
  "ថ្នាល": {
    "word": "ថ្នាល",
    "pronunciation": "ថ្នាល",
    "definition": "ទីសម្រាប់សាបព្រោះ។",
    "homophones": [
      { "word": "ថ្នាល", "definition": "កន្លែងសាបព្រោះ", "pronunciation": "ថ្នាល" },
      { "word": "ថ្នល់", "definition": "ផ្លូវ (សូរជិត)", "pronunciation": "ថ្នល់" }
    ],
    "synonyms": [],
    "antonyms": [],
    "relatedWords": ["សំណាប"],
    "example": "ថ្នាលសំណាប។"
  },

  // ========================== ទ (T - soft) ==========================
  "ទ": {
    "word": "ទ",
    "pronunciation": "ទ",
    "definition": "អក្សរទី ១៨ ក្នុងពពួកព្យញ្ជនៈ។",
    "homophones": [
      { "word": "ទ", "definition": "អក្សរ ទ", "pronunciation": "ទ" },
      { "word": "ទរ", "definition": "បំពង់ទឹក", "pronunciation": "ទ" }
    ],
    "synonyms": [],
    "antonyms": [],
    "relatedWords": [],
    "example": "ដាក់ទរទឹក។"
  },
  "ទរ": {
    "word": "ទរ",
    "pronunciation": "ទ",
    "definition": "បំពង់ឬប្រឡាយសម្រាប់បង្ហូរទឹក។",
    "homophones": [
      { "word": "ទ", "definition": "អក្សរ ទ", "pronunciation": "ទ" },
      { "word": "ទរ", "definition": "បំពង់ទឹក", "pronunciation": "ទ" }
    ],
    "synonyms": ["បំពង់", "ប្រឡាយ"],
    "antonyms": [],
    "relatedWords": ["ទឹកភ្លៀង"],
    "example": "ទឹកហូរតាមទរ។"
  },
  "ទា": {
    "word": "ទា",
    "pronunciation": "ទា",
    "definition": "សត្វស្លាបមួយប្រភេទ។",
    "homophones": [
      { "word": "ទា", "definition": "សត្វទា", "pronunciation": "ទា" },
      { "word": "ទារ", "definition": "ទាមទារ", "pronunciation": "ទា" }
    ],
    "synonyms": [],
    "antonyms": [],
    "relatedWords": ["មាន់", "ស៊ុត"],
    "example": "ទាកំពុងហែលទឹក។"
  },
  "ទារ": {
    "word": "ទារ",
    "pronunciation": "ទា",
    "definition": "ទាមទារ, សុំឲ្យសង។",
    "homophones": [
      { "word": "ទា", "definition": "សត្វទា", "pronunciation": "ទា" },
      { "word": "ទារ", "definition": "ទាមទារ", "pronunciation": "ទា" }
    ],
    "synonyms": ["សុំ", "ទាមទារ"],
    "antonyms": ["សង"],
    "relatedWords": ["បំណុល"],
    "example": "ម្ចាស់បំណុលមកទារលុយ។"
  },
  "ទាន": {
    "word": "ទាន",
    "pronunciation": "ទាន",
    "definition": "ការឲ្យ, អំណោយ / ទៀន (Candle) - សំនៀងស្រដៀង។",
    "homophones": [
      { "word": "ទាន", "definition": "អំណោយ", "pronunciation": "ទាន" },
      { "word": "ទៀន", "definition": "ទៀនបំភ្លឺ", "pronunciation": "ទាន (សំនៀងខ្លះ)" },
      { "word": "ធាន", "definition": "ធានា (សូរជិត)", "pronunciation": "ធាន" }
    ],
    "synonyms": ["អំណោយ", "បរិច្ចាគ"],
    "antonyms": ["កំណាញ់"],
    "relatedWords": ["បុណ្យ", "សីល"],
    "example": "ការធ្វើទាននាំមកនូវក្តីសុខ។"
  },
  "ទៀន": {
    "word": "ទៀន",
    "pronunciation": "ទាន",
    "definition": "វត្ថុធ្វើដោយក្រមួនមានអំបោះឆេះនៅកណ្តាលសម្រាប់អុជបំភ្លឺ។",
    "homophones": [
      { "word": "ទាន", "definition": "អំណោយ", "pronunciation": "ទាន" },
      { "word": "ទៀន", "definition": "ទៀនបំភ្លឺ", "pronunciation": "ទាន" }
    ],
    "synonyms": ["ប្រទីប"],
    "antonyms": [],
    "relatedWords": ["ធូប", "ក្រមួន"],
    "example": "អុជទៀន។"
  },
  "ធាន": {
    "word": "ធាន",
    "pronunciation": "ធាន",
    "definition": "ទ្រទ្រង់, រ៉ាប់រង។",
    "homophones": [
      { "word": "ធាន", "definition": "រ៉ាប់រង", "pronunciation": "ធាន" },
      { "word": "ធានា", "definition": "ធានា", "pronunciation": "ធានា" }
    ],
    "synonyms": ["រ៉ាប់"],
    "antonyms": [],
    "relatedWords": ["ប្រធាន"],
    "example": "ប្រធាន។"
  },
  "ទូ": {
    "word": "ទូ",
    "pronunciation": "ទូ",
    "definition": "គ្រឿងសង្ហារិមសម្រាប់ដាក់ឥវ៉ាន់។",
    "homophones": [
      { "word": "ទូ", "definition": "ទូដាក់អីវ៉ាន់", "pronunciation": "ទូ" },
      { "word": "ទូរ", "definition": "ចម្ងាយ (បុព្វបទ)", "pronunciation": "ទូ" }
    ],
    "synonyms": [],
    "antonyms": [],
    "relatedWords": ["តុ"],
    "example": "ទូខោអាវ។"
  },
  "ទូរ": {
    "word": "ទូរ",
    "pronunciation": "ទូ",
    "definition": "ពាក្យនាំមុខមានន័យថា ចម្ងាយ, ឆ្ងាយ។",
    "homophones": [
      { "word": "ទូ", "definition": "ទូដាក់អីវ៉ាន់", "pronunciation": "ទូ" },
      { "word": "ទូរ", "definition": "ចម្ងាយ", "pronunciation": "ទូ" }
    ],
    "synonyms": ["ឆ្ងាយ"],
    "antonyms": [],
    "relatedWords": ["ទូរគមនាគមន៍", "ទូរទស្សន៍"],
    "example": "ទូរទស្សន៍។"
  },
  "ធម៌": {
    "word": "ធម៌",
    "pronunciation": "ធរ",
    "definition": "សភាវៈដែលទ្រទ្រង់, ពាក្យប្រៀនប្រដៅរបស់ព្រះពុទ្ធ, ធម្មជាតិ។",
    "homophones": [
      { "word": "ធម៌", "definition": "ធម៌ព្រះ, ធម្មជាតិ", "pronunciation": "ធរ" },
      { "word": "ធរ", "definition": "ផែនដី, ទ្រទ្រង់", "pronunciation": "ធរ" }
    ],
    "synonyms": ["សច្ចធម៌", "ច្បាប់"],
    "antonyms": ["អធម៌"],
    "relatedWords": ["ព្រះពុទ្ធ", "វត្ត"],
    "example": "គាត់ទៅវត្តស្តាប់ធម៌។"
  },
  "ធរ": {
    "word": "ធរ",
    "pronunciation": "ធរ",
    "definition": "ផែនដី, អ្នកទ្រទ្រង់។",
    "homophones": [
      { "word": "ធម៌", "definition": "ធម៌ព្រះ", "pronunciation": "ធរ" },
      { "word": "ធរ", "definition": "ផែនដី", "pronunciation": "ធរ" }
    ],
    "synonyms": ["ផែនដី", "ធរណី"],
    "antonyms": [],
    "relatedWords": ["ធរណីមាត្រ", "ធរណី"],
    "example": "ព្រះធរណី។"
  },
  "ធា": {
    "word": "ធា",
    "pronunciation": "ធា",
    "definition": "ទ្រទ្រង់, ដាក់។",
    "homophones": [
      { "word": "ធា", "definition": "ទ្រទ្រង់", "pronunciation": "ធា" },
      { "word": "ធារ", "definition": "ខ្សែទឹក", "pronunciation": "ធា" }
    ],
    "synonyms": [],
    "antonyms": [],
    "relatedWords": [],
    "example": "ធា។"
  },
  "ធារ": {
    "word": "ធារ",
    "pronunciation": "ធា",
    "definition": "ខ្សែទឹក, ធារទឹក។",
    "homophones": [
      { "word": "ធា", "definition": "ទ្រទ្រង់", "pronunciation": "ធា" },
      { "word": "ធារ", "definition": "ខ្សែទឹក", "pronunciation": "ធា" }
    ],
    "synonyms": ["ខ្សែទឹក"],
    "antonyms": [],
    "relatedWords": ["ធារាសាស្រ្ត"],
    "example": "ធារទឹក។"
  },
  "ន": {
    "word": "ន",
    "pronunciation": "ន",
    "definition": "អក្សរទី ២០ ក្នុងពពួកព្យញ្ជនៈ។",
    "homophones": [
      { "word": "ន", "definition": "អក្សរ ន", "pronunciation": "ន" },
      { "word": "នរ", "definition": "មនុស្ស (បាលី)", "pronunciation": "ន" }
    ],
    "synonyms": [],
    "antonyms": [],
    "relatedWords": [],
    "example": "នរណា។"
  },
  "នរ": {
    "word": "នរ",
    "pronunciation": "ន",
    "definition": "មនុស្ស, ជន។",
    "homophones": [
      { "word": "ន", "definition": "អក្សរ ន", "pronunciation": "ន" },
      { "word": "នរ", "definition": "មនុស្ស", "pronunciation": "ន" }
    ],
    "synonyms": ["មនុស្ស", "ជន"],
    "antonyms": [],
    "relatedWords": ["នរណា", "នរជន"],
    "example": "នរជន។"
  },
  "ន័យ": {
    "word": "ន័យ",
    "pronunciation": "នៃ",
    "definition": "សេចក្តី, ដំណើរ, គោលបំណង។",
    "homophones": [
      { "word": "ន័យ", "definition": "សេចក្តី, អត្ថន័យ", "pronunciation": "នៃ" },
      { "word": "នៃ", "definition": "របស់ (នៃ)", "pronunciation": "នៃ" }
    ],
    "synonyms": ["សេចក្តី", "អត្ថន័យ"],
    "antonyms": [],
    "relatedWords": ["អត្ថន័យ", "គោលដៅ"],
    "example": "មានន័យថា។"
  },
  "នៃ": {
    "word": "នៃ",
    "pronunciation": "នៃ",
    "definition": "របស់, សម្រាប់ (បញ្ជាក់កម្មសិទ្ធិ)។",
    "homophones": [
      { "word": "ន័យ", "definition": "សេចក្តី", "pronunciation": "នៃ" },
      { "word": "នៃ", "definition": "របស់", "pronunciation": "នៃ" }
    ],
    "synonyms": ["របស់"],
    "antonyms": [],
    "relatedWords": [],
    "example": "ទំព័រនៃសៀវភៅ។"
  },
  "នា": {
    "word": "នា",
    "pronunciation": "នា",
    "definition": "នៅ, ក្នុង (សម្រាប់ពេលវេលា)។",
    "homophones": [
      { "word": "នា", "definition": "នៅ, ក្នុង (ពេល)", "pronunciation": "នា" },
      { "word": "នារ", "definition": "ស្ត្រី (នារី - បុព្វបទ)", "pronunciation": "នា" }
    ],
    "synonyms": ["នៅ"],
    "antonyms": [],
    "relatedWords": ["នាកាល"],
    "example": "នាពេលខាងមុខ។"
  },
  "ប": {
    "word": "ប",
    "pronunciation": "ប",
    "definition": "ពាក្យសម្រាប់ហៅអក្សរ 'ប'។",
    "homophones": [
      { "word": "ប", "definition": "អក្សរ ប", "pronunciation": "ប" },
      { "word": "បរ", "definition": "បើក, បររទេះ", "pronunciation": "ប" }
    ],
    "synonyms": [],
    "antonyms": [],
    "relatedWords": [],
    "example": "ប ដាក់ស្រៈ អា អានថា បា។"
  },
  "បរ": {
    "word": "បរ",
    "pronunciation": "ប",
    "definition": "បើក, បំផុស (រទេះ, ឡាន)។",
    "homophones": [
      { "word": "ប", "definition": "អក្សរ ប", "pronunciation": "ប" },
      { "word": "បរ", "definition": "បើក, បររទេះ", "pronunciation": "ប" }
    ],
    "synonyms": ["បើក", "បញ្ជា"],
    "antonyms": ["ឈប់"],
    "relatedWords": ["បររទេះ", "បរិភោគ"],
    "example": "បររទេះគោ។"
  },
  "បក": {
    "word": "បក",
    "pronunciation": "បក",
    "definition": "លាត់ចេញ, ត្រឡប់។",
    "homophones": [
      { "word": "បក", "definition": "លាត់, បក", "pronunciation": "បក" },
      { "word": "បក្ស", "definition": "ពួក, ក្រុម", "pronunciation": "បក" }
    ],
    "synonyms": ["លាត់", "បកស្រាយ"],
    "antonyms": [],
    "relatedWords": ["បកប្រែ", "បកស្រាយ"],
    "example": "បកចេក។"
  },
  "បក្ស": {
    "word": "បក្ស",
    "pronunciation": "បក",
    "definition": "ពួក, ក្រុម, ភាគី។",
    "homophones": [
      { "word": "បក", "definition": "លាត់", "pronunciation": "បក" },
      { "word": "បក្ស", "definition": "ពួក, ក្រុម", "pronunciation": "បក" }
    ],
    "synonyms": ["ពួក", "ក្រុម"],
    "antonyms": [],
    "relatedWords": ["គណបក្ស", "បក្សពួក"],
    "example": "បក្សពួក។"
  },
  "បាត": {
    "word": "បាត",
    "pronunciation": "បាត",
    "definition": "ពាក្យឆ្លើយទទួលរបស់អ្នកតូចទៅរកអ្នកធំ (សម្រាប់បុរស) / ផ្នែកខាងក្រោម (បាតដៃ)។",
    "homophones": [
      { "word": "បាត", "definition": "បាត (ឆ្លើយ), បាតដៃ", "pronunciation": "បាត" },
      { "word": "បាត្រ", "definition": "បាត្រលោក", "pronunciation": "បាត" },
      { "word": "បាទ", "definition": "ជើង (រាជសព្ទ)", "pronunciation": "បាត" }
    ],
    "synonyms": ["ពរ", "បាទ"],
    "antonyms": ["ទេ", "លើ"],
    "relatedWords": ["ចាស", "បាតដៃ"],
    "example": "បាត! ខ្ញុំនឹងធ្វើតាម។"
  },
  "បាត្រ": {
    "word": "បាត្រ",
    "pronunciation": "បាត",
    "definition": "ភាជន៍សម្រាប់ព្រះសង្ឃដាក់ចង្ហាន់។",
    "homophones": [
      { "word": "បាត", "definition": "បាត (ឆ្លើយ)", "pronunciation": "បាត" },
      { "word": "បាត្រ", "definition": "បាត្រលោក", "pronunciation": "បាត" },
      { "word": "បាទ", "definition": "ជើង", "pronunciation": "បាត" }
    ],
    "synonyms": [],
    "antonyms": [],
    "relatedWords": ["ព្រះសង្ឃ", "ចង្ហាន់"],
    "example": "ព្រះសង្ឃនិមន្តបិណ្ឌបាត្រ។"
  },
  "បាទ": {
    "word": "បាទ",
    "pronunciation": "បាត",
    "definition": "ជើង (រាជសព្ទ)។",
    "homophones": [
       { "word": "បាត", "definition": "បាត (ឆ្លើយ)", "pronunciation": "បាត" },
       { "word": "បាត្រ", "definition": "បាត្រលោក", "pronunciation": "បាត" },
       { "word": "បាទ", "definition": "ជើង", "pronunciation": "បាត" }
    ],
    "synonyms": ["ជើង"],
    "antonyms": [],
    "relatedWords": ["ព្រះបាទ"],
    "example": "ព្រះបាទជ័យវរ្ម័ន។"
  },
  "បុណ្យ": {
    "word": "បុណ្យ",
    "pronunciation": "ប៊ុន",
    "definition": "អំពើល្អ, កុសល, ពិធី។",
    "homophones": [
      { "word": "បុណ្យ", "definition": "បុណ្យកុសល, ពិធីបុណ្យ", "pronunciation": "ប៊ុន" },
      { "word": "ប៊ុន", "definition": "ឈ្មោះប៊ុន", "pronunciation": "ប៊ុន" }
    ],
    "synonyms": ["កុសល", "សេចក្តីល្អ"],
    "antonyms": ["បាប"],
    "relatedWords": ["ធ្វើបុណ្យ"],
    "example": "ទៅធ្វើបុណ្យ។"
  },
  "បា": {
    "word": "បា",
    "pronunciation": "បា",
    "definition": "ឪពុក, ឈ្មោះសត្វឈ្មោល។",
    "homophones": [
      { "word": "បា", "definition": "ឪពុក, ឈ្មោល", "pronunciation": "បា" },
      { "word": "បារ", "definition": "រារាំង", "pronunciation": "បា" }
    ],
    "synonyms": ["ឪពុក"],
    "antonyms": ["មេ"],
    "relatedWords": ["មេបា"],
    "example": "បាគោ។"
  },
  "បារ": {
    "word": "បារ",
    "pronunciation": "បា",
    "definition": "ហាមឃាត់, រាំង, ឈ្មោះបារាំង។",
    "homophones": [
      { "word": "បា", "definition": "ឪពុក", "pronunciation": "បា" },
      { "word": "បារ", "definition": "រាំង, បារាំង", "pronunciation": "បា" }
    ],
    "synonyms": ["រាំង"],
    "antonyms": [],
    "relatedWords": ["បារាំង", "របារ"],
    "example": "ប្រទេសបារាំង។"
  },
  "ផ្សា": {
    "word": "ផ្សា",
    "pronunciation": "ផ្សា",
    "definition": "ធ្វើឲ្យជាប់សាច់, ភ្ជាប់ (ផ្សាដែក)។",
    "homophones": [
      { "word": "ផ្សា", "definition": "ភ្ជាប់, ផ្សាដែក", "pronunciation": "ផ្សា" },
      { "word": "ផ្សារ", "definition": "កន្លែងលក់ដូរ", "pronunciation": "ផ្សា" }
    ],
    "synonyms": ["ភ្ជាប់"],
    "antonyms": ["ផ្តាច់"],
    "relatedWords": ["ផ្សាដែក"],
    "example": "ផ្សាដែក។"
  },
  "ផ្សារ": {
    "word": "ផ្សារ",
    "pronunciation": "ផ្សា",
    "definition": "កន្លែងលក់ដូរ។",
    "homophones": [
      { "word": "ផ្សា", "definition": "ផ្សាដែក", "pronunciation": "ផ្សា" },
      { "word": "ផ្សារ", "definition": "កន្លែងលក់ដូរ", "pronunciation": "ផ្សា" }
    ],
    "synonyms": [],
    "antonyms": [],
    "relatedWords": ["អាជីវករ", "ផ្សារទំនើប"],
    "example": "ទៅផ្សារទិញម្ហូប។"
  },
  "ព": {
    "word": "ព",
    "pronunciation": "ព",
    "definition": "ទ្រដោយចង្កេះ (ពកូន)។",
    "homophones": [
      { "word": "ព", "definition": "ពកូន", "pronunciation": "ព" },
      { "word": "ពរ", "definition": "សេចក្តីសុខ", "pronunciation": "ព" }
    ],
    "synonyms": ["ទ្រ"],
    "antonyms": [],
    "relatedWords": ["ពកូន"],
    "example": "ម្តាយពកូន។"
  },
  "ពរ": {
    "word": "ពរ",
    "pronunciation": "ព",
    "definition": "សេចក្តីសុខ, របស់ល្អ។",
    "homophones": [
      { "word": "ព", "definition": "ពកូន", "pronunciation": "ព" },
      { "word": "ពរ", "definition": "សេចក្តីសុខ, ពរ", "pronunciation": "ព" }
    ],
    "synonyms": ["សិរីសួស្តី"],
    "antonyms": ["បាប", "គ្រោះ"],
    "relatedWords": ["ជូនពរ"],
    "example": "ជូនពរជ័យ។"
  },
  "ពាន់": {
    "word": "ពាន់",
    "pronunciation": "ពាន់",
    "definition": "ចំនួន ១០ រយ។",
    "homophones": [
      { "word": "ពាន់", "definition": "១០០០", "pronunciation": "ពាន់" },
      { "word": "ព័ន្ធ", "definition": "ចង, រុំ, ពណ៌", "pronunciation": "ពាន់" }
    ],
    "synonyms": ["សហស្ស"],
    "antonyms": [],
    "relatedWords": ["រយ", "ម៉ឺន"],
    "example": "ខ្ញុំមានលុយមួយពាន់រៀល។"
  },
  "ព័ន្ធ": {
    "word": "ព័ន្ធ",
    "pronunciation": "ពាន់",
    "definition": "ការចង, ការរុំ, ពណ៌។",
    "homophones": [
      { "word": "ពាន់", "definition": "១០០០", "pronunciation": "ពាន់" },
      { "word": "ព័ន្ធ", "definition": "ចង, រុំ, ពណ៌", "pronunciation": "ពាន់" }
    ],
    "synonyms": ["ចង", "រុំ"],
    "antonyms": [],
    "relatedWords": ["សម្ព័ន្ធ", "ប្រព័ន្ធ", "ពណ៌"],
    "example": "ប្រព័ន្ធទឹកភ្លើង។"
  },
  "ពុល": {
    "word": "ពុល",
    "pronunciation": "ពុល",
    "definition": "ស្រវឹងដោយសារពិស។",
    "homophones": [
      { "word": "ពុល", "definition": "ពុលពិស", "pronunciation": "ពុល" },
      { "word": "ពល", "definition": "កម្លាំង, ទាហាន", "pronunciation": "ពុល" }
    ],
    "synonyms": [],
    "antonyms": ["ជា"],
    "relatedWords": ["ថ្នាំពុល", "ពុលឡាន"],
    "example": "គាត់ពុលអាហារ។"
  },
  "ពល": {
    "word": "ពល",
    "pronunciation": "ពុល",
    "definition": "កម្លាំង, ពួកកងទាហាន។",
    "homophones": [
      { "word": "ពុល", "definition": "ពុលពិស", "pronunciation": "ពុល" },
      { "word": "ពល", "definition": "កម្លាំង, ទាហាន", "pronunciation": "ពុល" }
    ],
    "synonyms": ["កម្លាំង", "ទាហាន"],
    "antonyms": [],
    "relatedWords": ["ពលរដ្ឋ", "ពលកម្ម", "កងពល"],
    "example": "ពលរដ្ឋល្អ។"
  },
  "ពាល": {
    "word": "ពាល",
    "pronunciation": "ពាល",
    "definition": "អាក្រក់, កាច, ល្ងង់។",
    "homophones": [
      { "word": "ពាល", "definition": "អាក្រក់, កាច", "pronunciation": "ពាល" },
      { "word": "ពារ", "definition": "ការពារ, រាំង", "pronunciation": "ពាល" }
    ],
    "synonyms": ["អាក្រក់", "កាច"],
    "antonyms": ["ល្អ", "បណ្ឌិត"],
    "relatedWords": ["មនុស្សពាល"],
    "example": "មនុស្សពាល។"
  },
  "ពារ": {
    "word": "ពារ",
    "pronunciation": "ពាល",
    "definition": "ការពារ, រាំង, វេន។",
    "homophones": [
      { "word": "ពាល", "definition": "អាក្រក់", "pronunciation": "ពាល" },
      { "word": "ពារ", "definition": "ការពារ, រាំង", "pronunciation": "ពាល" }
    ],
    "synonyms": ["ការពារ"],
    "antonyms": [],
    "relatedWords": ["ចងពារ", "វេន"],
    "example": "ចងពារ។"
  },
  "ភ": {
    "word": "ភ",
    "pronunciation": "ភ",
    "definition": "អក្សរទី ២៤ ក្នុងពពួកព្យញ្ជនៈ។",
    "homophones": [
      { "word": "ភ", "definition": "អក្សរ ភ", "pronunciation": "ភ" },
      { "word": "ភរ", "definition": "កុហក", "pronunciation": "ភ" }
    ],
    "synonyms": [],
    "antonyms": [],
    "relatedWords": [],
    "example": "និយាយភរ។"
  },
  "ភរ": {
    "word": "ភរ",
    "pronunciation": "ភ",
    "definition": "និយាយមិនពិត, កុហក, បោកប្រាស់។",
    "homophones": [
      { "word": "ភ", "definition": "អក្សរ ភ", "pronunciation": "ភ" },
      { "word": "ភរ", "definition": "កុហក, បោក", "pronunciation": "ភ" }
    ],
    "synonyms": ["កុហក", "បោក"],
    "antonyms": ["ពិត"],
    "relatedWords": ["ភរភូត"],
    "example": "កុំភរខ្ញុំ។"
  },
  "ភ័យ": {
    "word": "ភ័យ",
    "pronunciation": "ភៃ",
    "definition": "សេចក្តីខ្លាច។",
    "homophones": [
      { "word": "ភ័យ", "definition": "ខ្លាច", "pronunciation": "ភៃ" },
      { "word": "ភៃ", "definition": "២០ (ភាសានិយាយ)", "pronunciation": "ភៃ" }
    ],
    "synonyms": ["ខ្លាច"],
    "antonyms": ["ក្លាហាន"],
    "relatedWords": ["តក់ស្លុត"],
    "example": "ភ័យរន្ធត់។"
  },
  "ភ័ក្ត្រ": {
    "word": "ភ័ក្ត្រ",
    "pronunciation": "ភ័ក្ត",
    "definition": "មុខ, ព្រះភ័ក្ត្រ (រាជសព្ទ)។",
    "homophones": [
      { "word": "ភ័ក្ត្រ", "definition": "មុខ", "pronunciation": "ភ័ក្ត" },
      { "word": "ភក្តិ", "definition": "ស្មោះត្រង់", "pronunciation": "ភ័ក្ត" },
      { "word": "ភ័ក", "definition": "ចំណី (បាលី)", "pronunciation": "ភ័ក្ត" }
    ],
    "synonyms": ["មុខ"],
    "antonyms": [],
    "relatedWords": ["ព្រះភ័ក្ត្រ"],
    "example": "ព្រះភ័ក្ត្រញញឹម។"
  },
  "ភក្តិ": {
    "word": "ភក្តិ",
    "pronunciation": "ភ័ក្ត",
    "definition": "សេចក្តីស្រឡាញ់, សេចក្តីរាប់អាន, ភក្តី។",
    "homophones": [
      { "word": "ភ័ក្ត្រ", "definition": "មុខ", "pronunciation": "ភ័ក្ត" },
      { "word": "ភក្តិ", "definition": "ស្មោះត្រង់", "pronunciation": "ភ័ក្ត" }
    ],
    "synonyms": ["ភក្តី", "ស្មោះ"],
    "antonyms": ["ក្បត់"],
    "relatedWords": ["ស្វាមីភក្តិ"],
    "example": "ស្វាមីភក្តិ។"
  },
  "ភា": {
    "word": "ភា",
    "pronunciation": "ភា",
    "definition": "ពន្លឺ, រស្មី។",
    "homophones": [
      { "word": "ភា", "definition": "ពន្លឺ", "pronunciation": "ភា" },
      { "word": "ភារ", "definition": "បន្ទុក, ភារៈ", "pronunciation": "ភា" }
    ],
    "synonyms": ["ពន្លឺ"],
    "antonyms": ["ងងឹត"],
    "relatedWords": ["សោភា"],
    "example": "សោភា។"
  },
  "ភារ": {
    "word": "ភារ",
    "pronunciation": "ភា",
    "definition": "ភារៈ, របស់ធ្ងន់, ការងារ។",
    "homophones": [
      { "word": "ភា", "definition": "ពន្លឺ", "pronunciation": "ភា" },
      { "word": "ភារ", "definition": "បន្ទុក, ការងារ", "pronunciation": "ភា" }
    ],
    "synonyms": ["បន្ទុក"],
    "antonyms": [],
    "relatedWords": ["ភារកិច្ច"],
    "example": "នេះជាភារកិច្ចរបស់អ្នក។"
  },

  // ========================== ម (M) ==========================
  "ម": {
    "word": "ម",
    "pronunciation": "ម",
    "definition": "អក្សរទី ២៥ ក្នុងពពួកព្យញ្ជនៈ។",
    "homophones": [
      { "word": "ម", "definition": "អក្សរ ម", "pronunciation": "ម" },
      { "word": "មរ", "definition": "ស្លាប់ (បាលី)", "pronunciation": "ម" }
    ],
    "synonyms": [],
    "antonyms": [],
    "relatedWords": [],
    "example": "មរណភាព។"
  },
  "មរ": {
    "word": "មរ",
    "pronunciation": "ម",
    "definition": "ស្លាប់ (បាលី: មរណៈ)។",
    "homophones": [
      { "word": "ម", "definition": "អក្សរ ម", "pronunciation": "ម" },
      { "word": "មរ", "definition": "ស្លាប់", "pronunciation": "ម" }
    ],
    "synonyms": ["ស្លាប់"],
    "antonyms": ["រស់"],
    "relatedWords": ["មរណភាព"],
    "example": "ដល់នូវមរណៈ។"
  },
  "មាស": {
    "word": "មាស",
    "pronunciation": "មាស",
    "definition": "ធាតុរ៉ែមានតម្លៃពណ៌លឿង។",
    "homophones": [
      { "word": "មាស", "definition": "មាស", "pronunciation": "មាស" },
      { "word": "មាត", "definition": "មាត្រា (សូរជិត)", "pronunciation": "មាស/មាត" }
    ],
    "synonyms": ["សុវណ្ណ", "កញ្ចនៈ"],
    "antonyms": [],
    "relatedWords": ["ប្រាក់", "ពេជ្រ"],
    "example": "ចិញ្ចៀននេះធ្វើពីមាស។"
  },
  "មាន": {
    "word": "មាន",
    "pronunciation": "មាន",
    "definition": "កាន់កាប់, មិនក្រ។",
    "homophones": [
      { "word": "មាន", "definition": "មានទ្រព្យ, កាន់កាប់", "pronunciation": "មាន" },
      { "word": "មាន់", "definition": "សត្វមាន់ (សូរជិត)", "pronunciation": "មាន់" },
      { "word": "ម៉ាន", "definition": "ប៉ុន្មាន (ភាសានិយាយ)", "pronunciation": "មាន" }
    ],
    "synonyms": ["សម្បូរ", "ធន"],
    "antonyms": ["ក្រ"],
    "relatedWords": ["ទ្រព្យ", "អ្នកមាន"],
    "example": "គាត់ជាអ្នកមាន។"
  },
  "មាត់": {
    "word": "មាត់",
    "pronunciation": "មាត់",
    "definition": "សរីរាង្គសម្រាប់និយាយនិងស៊ី។",
    "homophones": [
      { "word": "មាត់", "definition": "មាត់", "pronunciation": "មាត់" },
      { "word": "ម៉ាត់", "definition": "ល្អិត, ម៉ាត់", "pronunciation": "មាត់" }
    ],
    "synonyms": ["ឱស្ឋ"],
    "antonyms": [],
    "relatedWords": [],
    "example": "បិទមាត់។"
  },
  "ម៉ាត់": {
    "word": "ម៉ាត់",
    "pronunciation": "មាត់",
    "definition": "ដែលបុកឲ្យល្អិត។",
    "homophones": [
      { "word": "មាត់", "definition": "មាត់", "pronunciation": "មាត់" },
      { "word": "ម៉ាត់", "definition": "ល្អិត", "pronunciation": "មាត់" }
    ],
    "synonyms": ["ល្អិត"],
    "antonyms": ["ដុំ"],
    "relatedWords": ["បុកម៉ាត់"],
    "example": "បុកម្រេចឲ្យម៉ាត់។"
  },
  "យ": {
    "word": "យ",
    "pronunciation": "យ",
    "definition": "អក្សរទី ២៦ ក្នុងពពួកព្យញ្ជនៈ។",
    "homophones": [
      { "word": "យ", "definition": "អក្សរ យ", "pronunciation": "យ" },
      { "word": "យរ", "definition": "លើកឡើង", "pronunciation": "យ" }
    ],
    "synonyms": [],
    "antonyms": [],
    "relatedWords": [],
    "example": "យរទង់។"
  },
  "យរ": {
    "word": "យរ",
    "pronunciation": "យ",
    "definition": "លើកឡើង, ធ្វើឲ្យខ្ពស់ឡើង (យរទង់)។",
    "homophones": [
      { "word": "យ", "definition": "អក្សរ យ", "pronunciation": "យ" },
      { "word": "យរ", "definition": "លើកឡើង", "pronunciation": "យ" }
    ],
    "synonyms": ["លើក"],
    "antonyms": ["ដាក់"],
    "relatedWords": [],
    "example": "យរដៃ។"
  },
  "យន្ត": {
    "word": "យន្ត",
    "pronunciation": "យន់",
    "definition": "គ្រឿងម៉ាស៊ីន, កល។",
    "homophones": [
      { "word": "យន្ត", "definition": "គ្រឿងម៉ាស៊ីន", "pronunciation": "យន់" },
      { "word": "យ័ន្ត", "definition": "យ័ន្តការពារ", "pronunciation": "យន់" }
    ],
    "synonyms": ["ម៉ាស៊ីន"],
    "antonyms": [],
    "relatedWords": ["រថយន្ត", "យន្តហោះ"],
    "example": "រថយន្ត។"
  },
  "យ័ន្ត": {
    "word": "យ័ន្ត",
    "pronunciation": "យន់",
    "definition": "តារាងអក្សរឬលេខសម្រាប់សូត្រ ឬការពារ។",
    "homophones": [
      { "word": "យន្ត", "definition": "គ្រឿងម៉ាស៊ីន", "pronunciation": "យន់" },
      { "word": "យ័ន្ត", "definition": "យ័ន្តការពារ", "pronunciation": "យន់" }
    ],
    "synonyms": [],
    "antonyms": [],
    "relatedWords": ["សាក់យ័ន្ត"],
    "example": "សាក់យ័ន្តការពារខ្លួន។"
  },
  "យា": {
    "word": "យា",
    "pronunciation": "យា",
    "definition": "យាមល្បាត, ការពារ។",
    "homophones": [
      { "word": "យា", "definition": "ការពារ, យាម", "pronunciation": "យា" },
      { "word": "យារ", "definition": "ធ្លាក់ចុះ, យារ", "pronunciation": "យា" }
    ],
    "synonyms": ["យាម"],
    "antonyms": [],
    "relatedWords": ["យាម"],
    "example": "យាមល្បាត។"
  },
  "យារ": {
    "word": "យារ",
    "pronunciation": "យា",
    "definition": "ធ្លាក់ចុះក្រោមព្រោះទន់ឬធ្ងន់។",
    "homophones": [
      { "word": "យា", "definition": "ការពារ", "pronunciation": "យា" },
      { "word": "យារ", "definition": "ធ្លាក់ចុះ", "pronunciation": "យា" }
    ],
    "synonyms": ["ធ្លាក់", "យោល"],
    "antonyms": ["តឹង"],
    "relatedWords": ["យារធ្លាក់"],
    "example": "ស្បែកយារ។"
  },

  // ========================== រ (R) ==========================
  "រ": {
    "word": "រ",
    "pronunciation": "រ",
    "definition": "អក្សរទី ២៧ ក្នុងពពួកព្យញ្ជនៈ។",
    "homophones": [
      { "word": "រ", "definition": "អក្សរ រ", "pronunciation": "រ" },
      { "word": "ររ", "definition": "ឈ្មោះសត្វល្អិត", "pronunciation": "រ" }
    ],
    "synonyms": [],
    "antonyms": [],
    "relatedWords": [],
    "example": "ររ។"
  },
  "រៀន": {
    "word": "រៀន",
    "pronunciation": "រៀន",
    "definition": "ខំប្រឹងឲ្យចេះ, សិក្សា។",
    "homophones": [
      { "word": "រៀន", "definition": "សិក្សា", "pronunciation": "រៀន" },
      { "word": "រាន", "definition": "កាប់ឆ្ការ, រានហាល (សូរជិត)", "pronunciation": "រៀន" }
    ],
    "synonyms": ["សិក្សា", "សូត្រ"],
    "antonyms": ["លេង"],
    "relatedWords": ["សាលា", "សៀវភៅ"],
    "example": "ក្មេងៗទៅរៀននៅសាលា។"
  },
  "រាន": {
    "word": "រាន",
    "pronunciation": "រៀន",
    "definition": "កន្លែងសម្រាប់លក់ដូរ ឬដាក់អីវ៉ាន់ / កាប់ឆ្ការព្រៃ។",
    "homophones": [
       { "word": "រៀន", "definition": "សិក្សា", "pronunciation": "រៀន" },
       { "word": "រាន", "definition": "កាប់ឆ្ការ, រានហាល", "pronunciation": "រៀន" }
    ],
    "synonyms": ["តូប", "ឆ្ការ"],
    "antonyms": [],
    "relatedWords": ["ផ្សារ", "ព្រៃ", "រានហាល"],
    "example": "គាត់រានដីធ្វើចម្ការ។"
  },
  "រាជ": {
    "word": "រាជ",
    "pronunciation": "រាច",
    "definition": "ស្តេច, ព្រះមហាក្សត្រ។",
    "homophones": [
      { "word": "រាជ", "definition": "ស្តេច", "pronunciation": "រាច" },
      { "word": "រាជ្យ", "definition": "រាជ្យសម្បត្តិ", "pronunciation": "រាច" },
      { "word": "រាច", "definition": "ខ្ចាយ, កំពប់", "pronunciation": "រាច" }
    ],
    "synonyms": ["ស្តេច", "ក្សត្រ"],
    "antonyms": ["រាស្ត្រ"],
    "relatedWords": ["រាជធានី", "រាជវាំង"],
    "example": "ព្រះរាជា។"
  },
  "រាជ្យ": {
    "word": "រាជ្យ",
    "pronunciation": "រាច",
    "definition": "ការគ្រងរាជ្យ, សម្បត្តិរបស់ស្តេច។",
    "homophones": [
      { "word": "រាជ", "definition": "ស្តេច", "pronunciation": "រាច" },
      { "word": "រាជ្យ", "definition": "រាជ្យសម្បត្តិ", "pronunciation": "រាច" },
      { "word": "រាច", "definition": "ខ្ចាយ", "pronunciation": "រាច" }
    ],
    "synonyms": ["សម្បត្តិ"],
    "antonyms": [],
    "relatedWords": ["គ្រងរាជ្យ"],
    "example": "គ្រងរាជ្យសម្បត្តិ។"
  },
  "រាច": {
    "word": "រាច",
    "pronunciation": "រាច",
    "definition": "កំពប់រាយប៉ាយ, ខ្ចាយ។",
    "homophones": [
      { "word": "រាជ", "definition": "ស្តេច", "pronunciation": "រាច" },
      { "word": "រាជ្យ", "definition": "រាជ្យ", "pronunciation": "រាច" },
      { "word": "រាច", "definition": "ខ្ចាយ", "pronunciation": "រាច" }
    ],
    "synonyms": ["ខ្ចាយ", "កំពប់"],
    "antonyms": [],
    "relatedWords": [],
    "example": "ទឹកកំពប់រាចពេញឥដ្ឋ។"
  },
  "រាប់": {
    "word": "រាប់",
    "pronunciation": "រាប់",
    "definition": "គណនាលេខ។",
    "homophones": [
      { "word": "រាប់", "definition": "គណនា", "pronunciation": "រាប់" },
      { "word": "រ៉ាប់", "definition": "រ៉ាប់រង (ធានា)", "pronunciation": "រាប់" }
    ],
    "synonyms": ["គណនា"],
    "antonyms": [],
    "relatedWords": ["លេខ", "រាប់អាន"],
    "example": "រាប់លុយ។"
  },
  "រ៉ាប់": {
    "word": "រ៉ាប់",
    "pronunciation": "រាប់",
    "definition": "ធានាទទួលខុសត្រូវ (កាត់ពីបារាំង 'rappel' ឬអង់គ្លេស 'wrap'? - ប្រើក្នុងន័យធានា)។",
    "homophones": [
      { "word": "រាប់", "definition": "គណនា", "pronunciation": "រាប់" },
      { "word": "រ៉ាប់", "definition": "ធានា", "pronunciation": "រាប់" }
    ],
    "synonyms": ["ធានា"],
    "antonyms": [],
    "relatedWords": ["រ៉ាប់រង"],
    "example": "គាត់រ៉ាប់រងការងារនេះ។"
  },
  "រា": {
    "word": "រា",
    "pronunciation": "រា",
    "definition": "ឈប់, ថយ, មិនហ៊ានទៅមុខ។",
    "homophones": [
      { "word": "រា", "definition": "ឈប់, ថយ", "pronunciation": "រា" },
      { "word": "រារ", "definition": "រាំង, ទប់", "pronunciation": "រា" }
    ],
    "synonyms": ["ថយ", "ញញើត"],
    "antonyms": ["ទៅមុខ"],
    "relatedWords": ["រាក"],
    "example": "រាថយ។"
  },
  "រារ": {
    "word": "រារ",
    "pronunciation": "រា",
    "definition": "ទប់, ឃាំង, រាំង។",
    "homophones": [
      { "word": "រា", "definition": "ថយ", "pronunciation": "រា" },
      { "word": "រារ", "definition": "រាំង", "pronunciation": "រា" }
    ],
    "synonyms": ["រាំង", "ទប់"],
    "antonyms": [],
    "relatedWords": ["រារាំង"],
    "example": "រារាំងផ្លូវ។"
  },
  "រោង": {
    "word": "រោង",
    "pronunciation": "រោង",
    "definition": "អគារ, ទីសម្រាប់ជ្រក។",
    "homophones": [
      { "word": "រោង", "definition": "អគារ", "pronunciation": "រោង" },
      { "word": "រង", "definition": "ទ្រាំ, ទទួល (សូរជិត)", "pronunciation": "រង" }
    ],
    "synonyms": ["សាលា"],
    "antonyms": [],
    "relatedWords": ["រោងចក្រ", "រោងការ"],
    "example": "រោងចក្រ។"
  },

  // ========================== ល (L) ==========================
  "ល": {
    "word": "ល",
    "pronunciation": "ល",
    "definition": "ល្បង, សាក, មើល។",
    "homophones": [
      { "word": "ល", "definition": "សាកល្បង", "pronunciation": "ល" },
      { "word": "លរ", "definition": "លបមើល", "pronunciation": "ល" }
    ],
    "synonyms": ["សាក"],
    "antonyms": [],
    "relatedWords": ["លមើល"],
    "example": "លមើលសិន។"
  },
  "លរ": {
    "word": "លរ",
    "pronunciation": "ល",
    "definition": "លបមើល, លួចមើល។",
    "homophones": [
      { "word": "ល", "definition": "សាកល្បង", "pronunciation": "ល" },
      { "word": "លរ", "definition": "លបមើល", "pronunciation": "ល" }
    ],
    "synonyms": ["លប"],
    "antonyms": [],
    "relatedWords": [],
    "example": "ដើរលរ។"
  },
  "លិច": {
    "word": "លិច",
    "pronunciation": "លិច",
    "definition": "ចុះទៅក្រោមទឹក, ទិសបស្ចិម។",
    "homophones": [
      { "word": "លិច", "definition": "លិចទឹក, ទិសខាងលិច", "pronunciation": "លិច" },
      { "word": "លេច", "definition": "ធ្លាយ, ចេញមក (សូរដូច)", "pronunciation": "លិច" }
    ],
    "synonyms": ["លង់", "បស្ចិម"],
    "antonyms": ["អណ្តែត", "កើត"],
    "relatedWords": ["លិចលង់"],
    "example": "ទូកលិច។"
  },
  "លេច": {
    "word": "លេច",
    "pronunciation": "លិច",
    "definition": "ចេញមកឲ្យឃើញ, ធ្លាយចេញ។",
    "homophones": [
      { "word": "លិច", "definition": "លិចទឹក", "pronunciation": "លិច" },
      { "word": "លេច", "definition": "ធ្លាយ, ចេញមក", "pronunciation": "លិច" }
    ],
    "synonyms": ["ធ្លាយ", "ចេញ"],
    "antonyms": ["បាត់", "លាក់"],
    "relatedWords": ["លេចធ្លាយ", "លេចមុខ"],
    "example": "លេចមុខ។"
  },
  "លាប": {
    "word": "លាប",
    "pronunciation": "លាប",
    "definition": "យកវត្ថុរាវទៅត្រដុសលើ។",
    "homophones": [
      { "word": "លាប", "definition": "លាបថ្នាំ", "pronunciation": "លាប" },
      { "word": "លាភ", "definition": "សំណាង", "pronunciation": "លាប" }
    ],
    "synonyms": ["ជ្រលក់", "ត្រដុស"],
    "antonyms": [],
    "relatedWords": ["ថ្នាំ"],
    "example": "លាបថ្នាំផ្ទះ។"
  },
  "លាភ": {
    "word": "លាភ",
    "pronunciation": "លាប",
    "definition": "របស់ដែលបានមកដោយសំណាង, ផល។",
    "homophones": [
      { "word": "លាប", "definition": "លាបថ្នាំ", "pronunciation": "លាប" },
      { "word": "លាភ", "definition": "សំណាង", "pronunciation": "លាប" }
    ],
    "synonyms": ["សំណាង", "ផល"],
    "antonyms": ["គ្រោះ"],
    "relatedWords": ["លាភសក្ការៈ"],
    "example": "មានលាភមានជ័យ។"
  },
  "លា": {
    "word": "លា",
    "pronunciation": "លា",
    "definition": "សត្វចតុប្បាទម្យ៉ាង / ឃ្លាតចេញ។",
    "homophones": [
      { "word": "លា", "definition": "សត្វលា, លាគ្នា", "pronunciation": "លា" },
      { "word": "លារ", "definition": "លាត, ត្រដាង", "pronunciation": "លា" }
    ],
    "synonyms": ["ឃ្លាត"],
    "antonyms": ["ជួប"],
    "relatedWords": ["សេះ", "ជម្រាបលា"],
    "example": "សូមជម្រាបលា។"
  },
  "លារ": {
    "word": "លារ",
    "pronunciation": "លា",
    "definition": "លាត, ត្រដាង (លារដៃ)។",
    "homophones": [
      { "word": "លា", "definition": "សត្វលា, លាគ្នា", "pronunciation": "លា" },
      { "word": "លារ", "definition": "លាត, ត្រដាង", "pronunciation": "លា" }
    ],
    "synonyms": ["លាត", "ត្រដាង"],
    "antonyms": ["បត់", "ក្តាប់"],
    "relatedWords": ["លារដៃ"],
    "example": "លារដៃ។"
  },

  // ========================== វ (V) ==========================
  "វ": {
    "word": "វ",
    "pronunciation": "វ",
    "definition": "អក្សរទី ២៩ ក្នុងពពួកព្យញ្ជនៈ។",
    "homophones": [
      { "word": "វ", "definition": "អក្សរ វ", "pronunciation": "វ" },
      { "word": "វរ", "definition": "វល្លិ, ជ្រួលច្របល់", "pronunciation": "វ" }
    ],
    "synonyms": [],
    "antonyms": [],
    "relatedWords": [],
    "example": "វរវឹក។"
  },
  "វរ": {
    "word": "វរ",
    "pronunciation": "វ",
    "definition": "វល្លិ, ជ្រួលច្របល់។",
    "homophones": [
      { "word": "វ", "definition": "អក្សរ វ", "pronunciation": "វ" },
      { "word": "វរ", "definition": "វល្លិ, ជ្រួលច្របល់", "pronunciation": "វ" }
    ],
    "synonyms": ["វល្លិ", "ច្របល់"],
    "antonyms": [],
    "relatedWords": ["វរវឹក"],
    "example": "រឿងវរ។"
  },
  "វត្ត": {
    "word": "វត្ត",
    "pronunciation": "វត្ត",
    "definition": "ទីកន្លែងសម្រាប់ព្រះសង្ឃគង់នៅ។",
    "homophones": [
      { "word": "វត្ត", "definition": "អារាម", "pronunciation": "វត្ត" },
      { "word": "វ័ត", "definition": "វិល, ព័ទ្ធ", "pronunciation": "វត្ត" },
      { "word": "វ័ធ", "definition": "សម្លាប់ (បាលី)", "pronunciation": "វត្ត" }
    ],
    "synonyms": ["អារាម"],
    "antonyms": [],
    "relatedWords": ["ព្រះសង្ឃ", "ចេតិយ"],
    "example": "យាយទៅវត្តនៅថ្ងៃសីល។"
  },
  "វ័ត": {
    "word": "វ័ត",
    "pronunciation": "វត្ត",
    "definition": "វិល, ព័ទ្ធ។",
    "homophones": [
      { "word": "វត្ត", "definition": "អារាម", "pronunciation": "វត្ត" },
      { "word": "វ័ត", "definition": "វិល, ព័ទ្ធ", "pronunciation": "វត្ត" }
    ],
    "synonyms": ["វិល", "ព័ទ្ធ"],
    "antonyms": [],
    "relatedWords": ["សង្វ័ត"],
    "example": "កង់វ័ត។"
  },
  "វិស័យ": {
    "word": "វិស័យ",
    "pronunciation": "វិសៃ",
    "definition": "ដែន, ផ្នែក, មុខងារ។",
    "homophones": [
      { "word": "វិស័យ", "definition": "ផ្នែក, វិស័យ", "pronunciation": "វិសៃ" },
      { "word": "វិសៃ", "definition": "ដែន, មុខងារ (បាលី)", "pronunciation": "វិសៃ" }
    ],
    "synonyms": ["ផ្នែក", "ដែន"],
    "antonyms": [],
    "relatedWords": ["វិស័យអប់រំ"],
    "example": "វិស័យកសិកម្ម។"
  },
  "វិវ័ត": {
    "word": "វិវ័ត",
    "pronunciation": "វិវត្ត",
    "definition": "ប្រែប្រួល, វិលត្រឡប់។",
    "homophones": [
      { "word": "វិវ័ត", "definition": "វិលត្រឡប់", "pronunciation": "វិវត្ត" },
      { "word": "វិវត្ត", "definition": "ចម្រើន, វិវត្តន៍", "pronunciation": "វិវត្ត" }
    ],
    "synonyms": ["ប្រែប្រួល"],
    "antonyms": [],
    "relatedWords": ["វិវ័តនាការ"],
    "example": "លោកវិវ័ត។"
  },
  "វិវត្ត": {
    "word": "វិវត្ត",
    "pronunciation": "វិវត្ត",
    "definition": "ចម្រើនទៅមុខ, ប្រែប្រួលទៅរកភាពល្អប្រសើរ។",
    "homophones": [
      { "word": "វិវ័ត", "definition": "វិលត្រឡប់", "pronunciation": "វិវត្ត" },
      { "word": "វិវត្ត", "definition": "ចម្រើន, អភិវឌ្ឍ", "pronunciation": "វិវត្ត" }
    ],
    "synonyms": ["ចម្រើន", "លូតលាស់"],
    "antonyms": ["រុះរោយ"],
    "relatedWords": ["អភិវឌ្ឍន៍"],
    "example": "ប្រទេសកំពុងវិវត្ត។"
  },
  "វ័យ": {
    "word": "វ័យ",
    "pronunciation": "វៃ",
    "definition": "អាយុ, កំណើត។",
    "homophones": [
      { "word": "វ័យ", "definition": "អាយុ", "pronunciation": "វៃ" },
      { "word": "វៃ", "definition": "ឆ្លាត, រហ័ស", "pronunciation": "វៃ" }
    ],
    "synonyms": ["អាយុ"],
    "antonyms": [],
    "relatedWords": ["បឋមវ័យ", "វ័យចំណាស់"],
    "example": "វ័យក្មេង។"
  },
  "វៃ": {
    "word": "វៃ",
    "pronunciation": "វៃ",
    "definition": "ឆ្លាត, រហ័ស / វាយ (សំនៀង)។",
    "homophones": [
      { "word": "វ័យ", "definition": "អាយុ", "pronunciation": "វៃ" },
      { "word": "វៃ", "definition": "ឆ្លាត", "pronunciation": "វៃ" }
    ],
    "synonyms": ["ឆ្លាត", "រហ័ស"],
    "antonyms": ["ល្ងង់"],
    "relatedWords": ["វៃឆ្លាត"],
    "example": "ក្មេងនេះវៃឆ្លាតណាស់។"
  },

  // ========================== ស (S) ==========================
  "ស": {
    "word": "ស",
    "pronunciation": "ស",
    "definition": "ពណ៌ដូចសំឡី។",
    "homophones": [
      { "word": "ស", "definition": "ពណ៌ស", "pronunciation": "ស" },
      { "word": "សរ", "definition": "ព្រួញ", "pronunciation": "ស" },
      { "word": "សោ", "definition": "កូនសោ (សូរជិត)", "pronunciation": "សោ" }
    ],
    "synonyms": ["ធhav", "សុធា"],
    "antonyms": ["ខ្មៅ"],
    "relatedWords": ["ពណ៌"],
    "example": "អាវនេះពណ៌ស។"
  },
  "សរ": {
    "word": "សរ",
    "pronunciation": "ស",
    "definition": "ព្រួញ, របស់សម្រាប់បាញ់។",
    "homophones": [
      { "word": "ស", "definition": "ពណ៌ស", "pronunciation": "ស" },
      { "word": "សរ", "definition": "ព្រួញ", "pronunciation": "ស" }
    ],
    "synonyms": ["ព្រួញ"],
    "antonyms": [],
    "relatedWords": ["ធ្នូ", "សរព្រួញ"],
    "example": "បាញ់សរ។"
  },
  "សព": {
    "word": "សព",
    "pronunciation": "សប់",
    "definition": "ខ្មោច, រាងកាយដែលស្លាប់។",
    "homophones": [
      { "word": "សព", "definition": "សាកសព", "pronunciation": "សប់" },
      { "word": "សព្វ", "definition": "គ្រប់, ទាំងអស់", "pronunciation": "សប់" }
    ],
    "synonyms": ["ខ្មោច", "សាកសព"],
    "antonyms": [],
    "relatedWords": ["បុណ្យសព"],
    "example": "ដង្ហែសព។"
  },
  "សព្វ": {
    "word": "សព្វ",
    "pronunciation": "សប់",
    "definition": "គ្រប់, ទាំងអស់។",
    "homophones": [
      { "word": "សព", "definition": "សាកសព", "pronunciation": "សប់" },
      { "word": "សព្វ", "definition": "គ្រប់, ទាំងអស់", "pronunciation": "សប់" }
    ],
    "synonyms": ["គ្រប់", "ទាំងអស់"],
    "antonyms": ["ខ្លះ"],
    "relatedWords": ["សព្វថ្ងៃ", "សព្វសារ"],
    "example": "សព្វថ្ងៃនេះ។"
  },
  "សិទ្ធ": {
    "word": "សិទ្ធ",
    "pronunciation": "សិត",
    "definition": "សម្រេច, ចម្រើន។",
    "homophones": [
      { "word": "សិទ្ធ", "definition": "សម្រេច", "pronunciation": "សិត" },
      { "word": "សិទ្ធិ", "definition": "អំណាច", "pronunciation": "សិត" },
      { "word": "សិត", "definition": "សិតសក់", "pronunciation": "សិត" }
    ],
    "synonyms": ["សម្រេច"],
    "antonyms": [],
    "relatedWords": ["ស័ក្តិសិទ្ធិ"],
    "example": "មន្តអាគមស័ក្តិសិទ្ធិ។"
  },
  "សិទ្ធិ": {
    "word": "សិទ្ធិ",
    "pronunciation": "សិត",
    "definition": "អំណាចដែលច្បាប់អនុញ្ញាត។",
    "homophones": [
      { "word": "សិទ្ធ", "definition": "សម្រេច", "pronunciation": "សិត" },
      { "word": "សិទ្ធិ", "definition": "អំណាច", "pronunciation": "សិត" },
      { "word": "សិត", "definition": "សិតសក់", "pronunciation": "សិត" }
    ],
    "synonyms": ["អំណាច"],
    "antonyms": [],
    "relatedWords": ["សិទ្ធិមនុស្ស", "សិទ្ធិសេរីភាព"],
    "example": "សិទ្ធិសេរីភាព។"
  },
  "សិត": {
    "word": "សិត",
    "pronunciation": "សិត",
    "definition": "ធ្វើឲ្យរាបដោយក្រាស។",
    "homophones": [
      { "word": "សិទ្ធ", "definition": "សម្រេច", "pronunciation": "សិត" },
      { "word": "សិទ្ធិ", "definition": "អំណាច", "pronunciation": "សិត" },
      { "word": "សិត", "definition": "សិតសក់", "pronunciation": "សិត" }
    ],
    "synonyms": [],
    "antonyms": [],
    "relatedWords": ["សក់", "ក្រាស"],
    "example": "សិតសក់។"
  },
  "សុក": {
    "word": "សុក",
    "pronunciation": "សុក",
    "definition": "កំណើត, របស់ដែលចេញមកជាមួយទារក។",
    "homophones": [
      { "word": "សុក", "definition": "សុកទារក", "pronunciation": "សុក" },
      { "word": "សុខ", "definition": "សប្បាយ, សុខភាព", "pronunciation": "សុក" },
      { "word": "សុក្រ", "definition": "ថ្ងៃសុក្រ", "pronunciation": "សុក" }
    ],
    "synonyms": [],
    "antonyms": [],
    "relatedWords": [],
    "example": "សុកទារក។"
  },
  "សុខ": {
    "word": "សុខ",
    "pronunciation": "សុក",
    "definition": "សេចក្តីសប្បាយ, គ្មានជំងឺ។",
    "homophones": [
      { "word": "សុក", "definition": "សុកទារក", "pronunciation": "សុក" },
      { "word": "សុខ", "definition": "សប្បាយ", "pronunciation": "សុក" },
      { "word": "សុក្រ", "definition": "ថ្ងៃសុក្រ", "pronunciation": "សុក" }
    ],
    "synonyms": ["សប្បាយ", "ស្រួល"],
    "antonyms": ["ទុក្ខ"],
    "relatedWords": ["សុខភាព", "សេចក្តីសុខ"],
    "example": "សូមឲ្យមានសុខភាពល្អ។"
  },
  "សុក្រ": {
    "word": "សុក្រ",
    "pronunciation": "សុក",
    "definition": "ឈ្មោះថ្ងៃទី៦នៃសប្តាហ៍, ផ្កាយសុក្រ។",
    "homophones": [
      { "word": "សុក", "definition": "សុកទារក", "pronunciation": "សុក" },
      { "word": "សុខ", "definition": "សប្បាយ", "pronunciation": "សុក" },
      { "word": "សុក្រ", "definition": "ថ្ងៃសុក្រ", "pronunciation": "សុក" }
    ],
    "synonyms": [],
    "antonyms": [],
    "relatedWords": ["ថ្ងៃសុក្រ"],
    "example": "ថ្ងៃសុក្រ។"
  },
  "សួន": {
    "word": "សួន",
    "pronunciation": "សួន",
    "definition": "សួនច្បារ, កន្លែងដាំផ្កា។",
    "homophones": [
      { "word": "សួន", "definition": "សួនច្បារ", "pronunciation": "សួន" },
      { "word": "សួ័ន", "definition": "សត្វហង្ស (កម្ចី)", "pronunciation": "សួន" }
    ],
    "synonyms": ["ឧទ្យាន"],
    "antonyms": [],
    "relatedWords": ["សួនច្បារ"],
    "example": "ដើរលេងសួនច្បារ។"
  },
  "សង្វាត": {
    "word": "សង្វាត",
    "pronunciation": "សង្វាត",
    "definition": "ខំប្រឹង, ព្យាយាម។",
    "homophones": [
      { "word": "សង្វាត", "definition": "ព្យាយាម", "pronunciation": "សង្វាត" },
      { "word": "សង្វាស", "definition": "ការនៅរួមគ្នា (បាលី)", "pronunciation": "សង្វាត (សូរដូច)" }
    ],
    "synonyms": ["ព្យាយាម", "ឧស្សាហ៍"],
    "antonyms": ["ខ្ជិល"],
    "relatedWords": [],
    "example": "សង្វាតរៀនសូត្រ។"
  },
  "សង្វាស": {
    "word": "សង្វាស",
    "pronunciation": "សង្វាត",
    "definition": "ការនៅរួមគ្នា, ការរួមភេទ (បាលី)។",
    "homophones": [
      { "word": "សង្វាត", "definition": "ព្យាយាម", "pronunciation": "សង្វាត" },
      { "word": "សង្វាស", "definition": "ការនៅរួម", "pronunciation": "សង្វាត" }
    ],
    "synonyms": ["ការនៅរួម"],
    "antonyms": [],
    "relatedWords": [],
    "example": "ការសង្វាស។"
  },
  "ហា": {
    "word": "ហា",
    "pronunciation": "ហា",
    "definition": "បើកមាត់។",
    "homophones": [
      { "word": "ហា", "definition": "បើកមាត់", "pronunciation": "ហា" },
      { "word": "ហារ", "definition": "ហូរចេញ, ខ្ចាយ", "pronunciation": "ហា" }
    ],
    "synonyms": [],
    "antonyms": ["បិទ"],
    "relatedWords": ["ហាមាត់"],
    "example": "ហាមាត់។"
  },
  "ហារ": {
    "word": "ហារ",
    "pronunciation": "ហា",
    "definition": "ហូរចេញ, ខ្ចាយចេញ។",
    "homophones": [
      { "word": "ហា", "definition": "បើកមាត់", "pronunciation": "ហា" },
      { "word": "ហារ", "definition": "ហូរចេញ", "pronunciation": "ហា" }
    ],
    "synonyms": ["ហូរ"],
    "antonyms": [],
    "relatedWords": ["ហារហូរ"],
    "example": "ទឹកភ្នែកហារ។"
  },
  "ហ": {
    "word": "ហ",
    "pronunciation": "ហ",
    "definition": "អក្សរទី ៣១ ក្នុងពពួកព្យញ្ជនៈ។",
    "homophones": [
      { "word": "ហ", "definition": "អក្សរ ហ", "pronunciation": "ហ" },
      { "word": "ហរ", "definition": "នាំទៅ, លួច (បាលី)", "pronunciation": "ហ" }
    ],
    "synonyms": [],
    "antonyms": [],
    "relatedWords": [],
    "example": "ហរទ័យ។"
  },
  "ហរ": {
    "word": "ហរ",
    "pronunciation": "ហ",
    "definition": "នាំទៅ, លួច។",
    "homophones": [
      { "word": "ហ", "definition": "អក្សរ ហ", "pronunciation": "ហ" },
      { "word": "ហរ", "definition": "នាំ, លួច", "pronunciation": "ហ" }
    ],
    "synonyms": ["នាំ", "លួច"],
    "antonyms": [],
    "relatedWords": ["ហរណ", "ហរទ័យ"],
    "example": "ហរណ។"
  },
  "ហាន": {
    "word": "ហាន",
    "pronunciation": "ហាន",
    "definition": "ក្លាហាន (បាលី)។",
    "homophones": [
      { "word": "ហាន", "definition": "ក្លាហាន (បាលី)", "pronunciation": "ហាន" },
      { "word": "ហ៊ាន", "definition": "មិនខ្លាច, ហ៊ាន", "pronunciation": "ហាន" }
    ],
    "synonyms": ["ក្លាហាន"],
    "antonyms": ["ខ្លាច"],
    "relatedWords": ["ទាហាន"],
    "example": "ទាហាន។"
  },
  "ហ៊ាន": {
    "word": "ហ៊ាន",
    "pronunciation": "ហាន",
    "definition": "មិនខ្លាច, អាចធ្វើបាន។",
    "homophones": [
      { "word": "ហាន", "definition": "ក្លាហាន", "pronunciation": "ហាន" },
      { "word": "ហ៊ាន", "definition": "មិនខ្លាច", "pronunciation": "ហាន" }
    ],
    "synonyms": ["ក្លាហាន"],
    "antonyms": ["ខ្លាច", "ញញើត"],
    "relatedWords": ["ហ៊ានធ្វើ"],
    "example": "ខ្ញុំមិនហ៊ាន។"
  },
  "ហៃ": {
    "word": "ហៃ",
    "pronunciation": "ហៃ",
    "definition": "ឈ្មោះបទភ្លេងខ្មែរ។",
    "homophones": [
      { "word": "ហៃ", "definition": "បទភ្លេង", "pronunciation": "ហៃ" },
      { "word": "ហ័យ", "definition": "សេះ (បាលី)", "pronunciation": "ហៃ" }
    ],
    "synonyms": [],
    "antonyms": [],
    "relatedWords": ["ហៃអើ"],
    "example": "ច្រៀងហៃអើ។"
  },

  // ========================== ឡ (L - hard) ==========================
  "ឡ": {
    "word": "ឡ",
    "pronunciation": "ឡ",
    "definition": "អក្សរទី ៣២ ក្នុងពពួកព្យញ្ជនៈ / ទីសម្រាប់ដុត (Kiln/Oven).",
    "homophones": [
      { "word": "ឡ", "definition": "អក្សរ ឡ, ឡដុត", "pronunciation": "ឡ" },
      { "word": "ឡរ", "definition": "ឡានឡរ (Lorry)", "pronunciation": "ឡ" }
    ],
    "synonyms": ["ចង្ក្រាន"],
    "antonyms": [],
    "relatedWords": ["ឡឥដ្ឋ", "ឡនំបុ័ង"],
    "example": "ឡដុតនំបុ័ង។"
  },
  "ឡរ": {
    "word": "ឡរ",
    "pronunciation": "ឡ",
    "definition": "រថយន្តដឹកទំនិញធំ (Lorry).",
    "homophones": [
      { "word": "ឡ", "definition": "ឡដុត", "pronunciation": "ឡ" },
      { "word": "ឡរ", "definition": "ឡានឡរ", "pronunciation": "ឡ" }
    ],
    "synonyms": ["ឡាន"],
    "antonyms": [],
    "relatedWords": ["ឡានឡរ"],
    "example": "ឡានឡរ។"
  },
  "ឡា": {
    "word": "ឡា",
    "pronunciation": "ឡា",
    "definition": "ក្រណាត់សូត្រស្ដើង។",
    "homophones": [
      { "word": "ឡា", "definition": "ក្រណាត់សូត្រ", "pronunciation": "ឡា" },
      { "word": "ឡារ", "definition": "ហឹប (បារាំង: Lard?)", "pronunciation": "ឡា" }
    ],
    "synonyms": [],
    "antonyms": [],
    "relatedWords": [],
    "example": "អាវឡា។"
  },

  // ========================== អ (Or) ==========================
  "អ": {
    "word": "អ",
    "pronunciation": "អ",
    "definition": "អក្សរទី ៣៣ ក្នុងពពួកព្យញ្ជនៈ។",
    "homophones": [
      { "word": "អ", "definition": "អក្សរ អ", "pronunciation": "អ" },
      { "word": "អរ", "definition": "ត្រេកអរ", "pronunciation": "អ" }
    ],
    "synonyms": [],
    "antonyms": [],
    "relatedWords": [],
    "example": "អ ដាក់ស្រៈ អា អានថា អា។"
  },
  "អរ": {
    "word": "អរ",
    "pronunciation": "អ",
    "definition": "សប្បាយចិត្ត, ត្រេកអរ។",
    "homophones": [
      { "word": "អ", "definition": "អក្សរ អ", "pronunciation": "អ" },
      { "word": "អរ", "definition": "ត្រេកអរ", "pronunciation": "អ" }
    ],
    "synonyms": ["សប្បាយ", "ត្រេកអរ"],
    "antonyms": ["កើតទុក្ខ"],
    "relatedWords": ["អំណរ", "អរគុណ"],
    "example": "ខ្ញុំអរណាស់។"
  },
  "ឯក": {
    "word": "ឯក",
    "pronunciation": "ឯក",
    "definition": "មួយ, តែឯង, ឧត្តម។",
    "homophones": [
      { "word": "ឯក", "definition": "មួយ, ឯករាជ្យ", "pronunciation": "ឯក" },
      { "word": "ឯក", "definition": "សម្លៀកបំពាក់ (បុរាណ)", "pronunciation": "ឯក" }
    ],
    "synonyms": ["មួយ"],
    "antonyms": ["ទ្វេ"],
    "relatedWords": ["ឯករាជ្យ", "ឯកទេស"],
    "example": "ឯករាជ្យ។"
  },
  "អ៊ុំ": {
    "word": "អ៊ុំ",
    "pronunciation": "អ៊ុំ",
    "definition": "បងរបស់ឪពុកឬម្តាយ។",
    "homophones": [
      { "word": "អ៊ុំ", "definition": "បងឪពុកម្តាយ", "pronunciation": "អ៊ុំ" },
      { "word": "អុំ", "definition": "ចែវទូក", "pronunciation": "អ៊ុំ" }
    ],
    "synonyms": [],
    "antonyms": [],
    "relatedWords": ["ពូ", "មីង"],
    "example": "អ៊ុំប្រុស។"
  },
  "អុំ": {
    "word": "អុំ",
    "pronunciation": "អ៊ុំ",
    "definition": "ចែវ (ទូក)។",
    "homophones": [
      { "word": "អ៊ុំ", "definition": "បងឪពុកម្តាយ", "pronunciation": "អ៊ុំ" },
      { "word": "អុំ", "definition": "ចែវទូក", "pronunciation": "អ៊ុំ" }
    ],
    "synonyms": ["ចែវ"],
    "antonyms": [],
    "relatedWords": ["អុំទូក"],
    "example": "អុំទូកលេង។"
  },
  "អាស": {
    "word": "អាស",
    "pronunciation": "អាស",
    "definition": "អាក្រក់, មិនគួរគប្បី (អាសអាភាស)។",
    "homophones": [
      { "word": "អាស", "definition": "អាក្រក់", "pronunciation": "អាស" },
      { "word": "អាស៍", "definition": "ទីអង្គុយ (បាលី)", "pronunciation": "អាស" }
    ],
    "synonyms": ["អាក្រក់"],
    "antonyms": ["ល្អ"],
    "relatedWords": ["អាសអាភាស"],
    "example": "រូបភាពអាសអាភាស។"
  },
  "អាស៍": {
    "word": "អាស៍",
    "pronunciation": "អាស",
    "definition": "ទីអង្គុយ, ទីសម្រាប់ព្រះ។",
    "homophones": [
      { "word": "អាស", "definition": "អាក្រក់", "pronunciation": "អាស" },
      { "word": "អាស៍", "definition": "ទីអង្គុយ", "pronunciation": "អាស" }
    ],
    "synonyms": ["បល្ល័ង្ក"],
    "antonyms": [],
    "relatedWords": ["អាសនៈ"],
    "example": "ព្រះអាស៍។"
  },
  "អា": {
    "word": "អា",
    "pronunciation": "អា",
    "definition": "ពាក្យសម្រាប់ហៅមនុស្សប្រុសដែលមានឋានៈស្មើឬទាបជាង (មិនគួរសម)។",
    "homophones": [
      { "word": "អា", "definition": "ពាក្យហៅ (មិនគួរសម)", "pronunciation": "អា" },
      { "word": "អារ", "definition": "កាត់, អារ", "pronunciation": "អា" }
    ],
    "synonyms": [],
    "antonyms": [],
    "relatedWords": ["អាវា"],
    "example": "អាសុខ។"
  },
  "អារ": {
    "word": "អារ",
    "pronunciation": "អា",
    "definition": "កាត់ដោយរណារ ឬកាំបិត។",
    "homophones": [
      { "word": "អា", "definition": "ពាក្យហៅ", "pronunciation": "អា" },
      { "word": "អារ", "definition": "កាត់, អារ", "pronunciation": "អា" }
    ],
    "synonyms": ["កាត់"],
    "antonyms": ["ត"],
    "relatedWords": ["អារឈើ"],
    "example": "អារឈើ។"
  },
  "ពុត": {
    "word": "ពុត",
    "pronunciation": "ពុត",
    "definition": "ពត់ឲ្យកោង, លាក់ពុត, ក្លែង។",
    "homophones": [
      { "word": "ពុត", "definition": "ពត់, ក្លែង", "pronunciation": "ពុត" },
      { "word": "ពុទ្ធ", "definition": "អ្នកត្រាស់ដឹង (ព្រះពុទ្ធ)", "pronunciation": "ពុត" }
    ],
    "synonyms": ["ក្លែង"],
    "antonyms": ["ត្រង់"],
    "relatedWords": ["ពុតត្បុត"],
    "example": "លាក់ពុត។"
  },
  "ពុទ្ធ": {
    "word": "ពុទ្ធ",
    "pronunciation": "ពុត",
    "definition": "អ្នកត្រាស់ដឹង, ព្រះពុទ្ធ។",
    "homophones": [
      { "word": "ពុត", "definition": "ពត់, ក្លែង", "pronunciation": "ពុត" },
      { "word": "ពុទ្ធ", "definition": "ព្រះពុទ្ធ", "pronunciation": "ពុត" }
    ],
    "synonyms": ["អ្នកប្រាជ្ញ"],
    "antonyms": [],
    "relatedWords": ["ពុទ្ធសាសនា"],
    "example": "ព្រះពុទ្ធសាសនា។"
  },
  "លក្ខណ៍": {
    "word": "លក្ខណ៍",
    "pronunciation": "លាក់",
    "definition": "លក្ខណៈ, គ្រឿងសម្គាល់, ស្រ្តីគ្រប់លក្ខណ៍។",
    "homophones": [
      { "word": "លក្ខណ៍", "definition": "លក្ខណៈ", "pronunciation": "លាក់" },
      { "word": "លាក់", "definition": "បិទបាំង", "pronunciation": "លាក់" }
    ],
    "synonyms": ["លក្ខណៈ"],
    "antonyms": [],
    "relatedWords": ["គ្រប់លក្ខណ៍"],
    "example": "ស្រ្តីគ្រប់លក្ខណ៍។"
  },
  "លាក់": {
    "word": "លាក់",
    "pronunciation": "លាក់",
    "definition": "បិទបាំងមិនឲ្យឃើញ។",
    "homophones": [
      { "word": "លក្ខណ៍", "definition": "លក្ខណៈ", "pronunciation": "លាក់" },
      { "word": "លាក់", "definition": "បិទបាំង", "pronunciation": "លាក់" }
    ],
    "synonyms": ["បិទ"],
    "antonyms": ["បង្ហាញ"],
    "relatedWords": ["លាក់បាំង"],
    "example": "លាក់ខ្លួន។"
  },
  "រ័ត្ន": {
    "word": "រ័ត្ន",
    "pronunciation": "រាត់",
    "definition": "កែវ, ត្បូងមានតម្លៃ។",
    "homophones": [
      { "word": "រ័ត្ន", "definition": "កែវ, ត្បូង", "pronunciation": "រាត់" },
      { "word": "រដ្ឋ", "definition": "ដែនដី, ប្រទេស", "pronunciation": "រាត់" },
      { "word": "រាត់", "definition": "រត់ (សូរជិត/ពាក្យខ្លះ)", "pronunciation": "រាត់" }
    ],
    "synonyms": ["កែវ"],
    "antonyms": [],
    "relatedWords": ["រតនៈ"],
    "example": "នព្វរ័ត្ន។"
  },
  "រដ្ឋ": {
    "word": "រដ្ឋ",
    "pronunciation": "រាត់",
    "definition": "ដែនដី, ប្រទេស, ដែនកាន់កាប់។",
    "homophones": [
      { "word": "រ័ត្ន", "definition": "កែវ, ត្បូង", "pronunciation": "រាត់" },
      { "word": "រដ្ឋ", "definition": "ដែនដី, ប្រទេស", "pronunciation": "រាត់" }
    ],
    "synonyms": ["ប្រទេស"],
    "antonyms": [],
    "relatedWords": ["រដ្ឋធានី", "រដ្ឋាភិបាល"],
    "example": "រដ្ឋធម្មនុញ្ញ។"
  },
  // ========================== ក (K) - Group 1 & Others ==========================
  "ក៏": {
    word: "ក៏",
    pronunciation: "ក",
    definition: "(និ.) ដែរ, ផង, ម្ល៉េះ (Also/Too/As well)។",
    homophones: [
      { word: "ក", definition: "ផ្នែករាងកាយ (ក)", pronunciation: "ក" },
      { word: "ករ", definition: "ដៃ (រាជសព្ទ) / អ្នកធ្វើ", pronunciation: "ក" },
      { word: "ក៏", definition: "ដែរ / ផង", pronunciation: "ក" },
      { word: "ករណ៍", definition: "ហេតុ / គ្រឿង", pronunciation: "ក" }
    ],
    synonyms: ["ដែរ"],
    antonyms: [],
    relatedWords: [],
    example: "ខ្ញុំក៏ទៅដែរ។"
  },
  "ករណ៍": {
    word: "ករណ៍",
    pronunciation: "ក",
    definition: "(ន.) ហេតុ, ដំណើរ, គ្រឿង, ឧបករណ៍ (Cause/Instrument/Means)។",
    homophones: [
      { word: "ក", definition: "ផ្នែករាងកាយ (ក)", pronunciation: "ក" },
      { word: "ករ", definition: "ដៃ (រាជសព្ទ) / អ្នកធ្វើ", pronunciation: "ក" },
      { word: "ក៏", definition: "ដែរ / ផង", pronunciation: "ក" },
      { word: "ករណ៍", definition: "ហេតុ / គ្រឿង", pronunciation: "ក" }
    ],
    synonyms: ["ហេតុ", "ឧបករណ៍"],
    antonyms: [],
    relatedWords: ["ឧបករណ៍"],
    example: "ឧបករណ៍។"
  },
  
  // Group 2
  "កល": {
    word: "កល",
    pronunciation: "កល់",
    definition: "(ន.) ល្បិច, ឧបាយ, គ្រឿងម៉ាស៊ីន (Trick/Strategy/Machine).",
    homophones: [
      { word: "កល", definition: "ល្បិច", pronunciation: "កល់" },
      { word: "កល់", definition: "ទប់ / ជិត", pronunciation: "កល់" }
    ],
    synonyms: ["ល្បិច", "ឧបាយ"],
    antonyms: [],
    relatedWords: ["កលល្បិច", "យន្តកល"],
    example: "ប្រើកលល្បិច។"
  },
  "កល់": {
    word: "កល់",
    pronunciation: "កល់",
    definition: "១. (កិ.) ដាក់អ្វីទប់ពីក្រោម (To prop up). ២. (កិ. វិ.) ជិត, ហាក់ដូចជា (Almost/Seemingly).",
    homophones: [
      { word: "កល", definition: "ល្បិច", pronunciation: "កល់" },
      { word: "កល់", definition: "ទប់ / ជិត", pronunciation: "កល់" }
    ],
    synonyms: ["ទប់", "កុល់"],
    antonyms: [],
    relatedWords: ["កល់ភ្លៀង"],
    example: "មេឃកល់រកភ្លៀង។"
  },

  // Group 3
  "កាប់": {
    word: "កាប់",
    pronunciation: "កាប់",
    definition: "(កិ.) យកកាំបិតសំពងឲ្យមុតចូលឬឲ្យដាច់ (To chop/cut/hack).",
    homophones: [
      { word: "កាប់", definition: "កាប់ឈើ", pronunciation: "កាប់" },
      { word: "កប្ប", definition: "កាលដ៏យូរ", pronunciation: "កាប់" }
    ],
    synonyms: ["ឆ្ការ", "កាត់"],
    antonyms: [],
    relatedWords: ["កាប់ឈើ", "កាប់សាច់"],
    example: "គាត់កាប់ឈើ។"
  },
  "កប្ប": {
    word: "កប្ប",
    pronunciation: "កាប់",
    definition: "(ន.) កាលដ៏យូរអង្វែង, យុគ (Aeon/Kalpa/Era).",
    homophones: [
      { word: "កាប់", definition: "កាប់ឈើ", pronunciation: "កាប់" },
      { word: "កប្ប", definition: "កាលដ៏យូរ", pronunciation: "កាប់" }
    ],
    synonyms: ["យុគ", "សម័យ"],
    antonyms: [],
    relatedWords: ["កប្បកិរិយា"],
    example: "មួយកប្ប។"
  },

  // Group 4
  "កាប": {
    word: "កាប",
    pronunciation: "កាប",
    definition: "(ន.) ធ្យូង, ជាតិខ្លាញ់ (Carbon).",
    homophones: [
      { word: "កាប", definition: "ធ្យូង", pronunciation: "កាប" },
      { word: "កាព្យ", definition: "កំណាព្យ", pronunciation: "កាប" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["កាបូន"],
    example: "ជាតិកាបូន។"
  },
  "កាព្យ": {
    word: "កាព្យ",
    pronunciation: "កាប",
    definition: "(ន.) ពាក្យសម្ផស្ស, កំណាព្យ (Poetry/Verse).",
    homophones: [
      { word: "កាប", definition: "ធ្យូង", pronunciation: "កាប" },
      { word: "កាព្យ", definition: "កំណាព្យ", pronunciation: "កាប" }
    ],
    synonyms: ["កំណាព្យ"],
    antonyms: ["រាយ"],
    relatedWords: ["កំណាព្យ"],
    example: "តែងកាព្យ។"
  },

  // Group 5
  "កូត": {
    word: "កូត",
    pronunciation: "កូត",
    definition: "(កិ.) កូស, ទាញ (To scrape/play violin).",
    homophones: [
      { word: "កូត", definition: "កូតទ្រ", pronunciation: "កូត" },
      { word: "កូដ", definition: "លេខសម្ងាត់", pronunciation: "កូត" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["កូតទ្រ"],
    example: "កូតទ្រ។"
  },
  "កូដ": {
    word: "កូដ",
    pronunciation: "កូត",
    definition: "(ន.) ក្រម, លេខសម្ងាត់ (Code).",
    homophones: [
      { word: "កូត", definition: "កូតទ្រ", pronunciation: "កូត" },
      { word: "កូដ", definition: "លេខសម្ងាត់", pronunciation: "កូត" }
    ],
    synonyms: ["លេខសម្ងាត់"],
    antonyms: [],
    relatedWords: ["កូដសម្ងាត់"],
    example: "វាយកូដ។"
  },

  // Group 6 (Added/Merged)

  // Group 7
  "កេះ": {
    word: "កេះ",
    pronunciation: "កេះ",
    definition: "(កិ.) យកចុងម្រាមដៃប៉ះដើម្បីឲ្យដឹងខ្លួន (To scratch/tap/trigger).",
    homophones: [
      { word: "កេះ", definition: "កេះហៅ", pronunciation: "កេះ" },
      { word: "កេស", definition: "សក់ (បាលី)", pronunciation: "កេះ" },
      { word: "កែស", definition: "ហ្គាស", pronunciation: "កេះ" },
      { word: "កែះ", definition: "សត្វកែះ", pronunciation: "កេះ" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["កេះដែកកេះ"],
    example: "កេះស្មា។"
  },
  "កេស": {
    word: "កេស",
    pronunciation: "កេះ",
    definition: "(ន.) សក់, ក្បាល (Hair/Head - Pali).",
    homophones: [
      { word: "កេះ", definition: "កេះហៅ", pronunciation: "កេះ" },
      { word: "កេស", definition: "សក់ (បាលី)", pronunciation: "កេះ" },
      { word: "កែស", definition: "ហ្គាស", pronunciation: "កេះ" },
      { word: "កែះ", definition: "សត្វកែះ", pronunciation: "កេះ" }
    ],
    synonyms: ["សក់"],
    antonyms: [],
    relatedWords: ["កេសា"],
    example: "កេសា។"
  },
  "កែស": {
    word: "កែស",
    pronunciation: "កេះ",
    definition: "(ន.) ឧស្ម័ន, ហ្គាស (Gas).",
    homophones: [
      { word: "កេះ", definition: "កេះហៅ", pronunciation: "កេះ" },
      { word: "កេស", definition: "សក់ (បាលី)", pronunciation: "កេះ" },
      { word: "កែស", definition: "ហ្គាស", pronunciation: "កេះ" },
      { word: "កែះ", definition: "សត្វកែះ", pronunciation: "កេះ" }
    ],
    synonyms: ["ឧស្ម័ន"],
    antonyms: [],
    relatedWords: ["ចង្ក្រានកែស"],
    example: "អស់កែស។"
  },
  "កែះ": {
    word: "កែះ",
    pronunciation: "កេះ",
    definition: "(ន.) សត្វចតុប្បាទព្រៃមួយប្រភេទ (Serow/Goat-antelope).",
    homophones: [
      { word: "កេះ", definition: "កេះហៅ", pronunciation: "កេះ" },
      { word: "កេស", definition: "សក់ (បាលី)", pronunciation: "កេះ" },
      { word: "កែស", definition: "ហ្គាស", pronunciation: "កេះ" },
      { word: "កែះ", definition: "សត្វកែះ", pronunciation: "កេះ" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: [],
    example: "សត្វកែះ។"
  },

  // Group 8
  "ក្រិត": {
    word: "ក្រិត",
    pronunciation: "ក្រិត",
    definition: "(កិ.) កត់ចំណាំ, ធ្វើស្នាម (To mark/calibrate).",
    homophones: [
      { word: "ក្រិត", definition: "កត់ចំណាំ", pronunciation: "ក្រិត" },
      { word: "ក្រឹត្យ", definition: "ច្បាប់", pronunciation: "ក្រិត" },
      { word: "ក្រឹត", definition: "ក្រេវក្រោធ", pronunciation: "ក្រិត" },
      { word: "ក្រិដ្ឋ", definition: "ការធ្វើ", pronunciation: "ក្រិត" }
    ],
    synonyms: ["កត់"],
    antonyms: [],
    relatedWords: ["ក្រិតកាល"],
    example: "ក្រិតកាល។"
  },
  "ក្រឹត្យ": {
    word: "ក្រឹត្យ",
    pronunciation: "ក្រិត",
    definition: "(ន.) ច្បាប់, បញ្ញត្តិ, កិច្ច (Law/Decree/Duty).",
    homophones: [
      { word: "ក្រិត", definition: "កត់ចំណាំ", pronunciation: "ក្រិត" },
      { word: "ក្រឹត្យ", definition: "ច្បាប់", pronunciation: "ក្រិត" },
      { word: "ក្រឹត", definition: "ក្រេវក្រោធ", pronunciation: "ក្រិត" },
      { word: "ក្រិដ្ឋ", definition: "ការធ្វើ", pronunciation: "ក្រិត" }
    ],
    synonyms: ["ច្បាប់"],
    antonyms: [],
    relatedWords: ["ក្រឹត្យក្រម"],
    example: "អនុក្រឹត្យ។"
  },

  // Group 9 (Merged with existing)
  "កាណ៌": {
    word: "កាណ៌",
    pronunciation: "កា",
    definition: "(ន.) ត្រចៀក (Ear - Sanskrit).",
    homophones: [
      { word: "កា", definition: "ភាជន៍ទឹក", pronunciation: "កា" },
      { word: "ការ", definition: "ការងារ / ពិធីមង្គល", pronunciation: "កា" },
      { word: "ការណ៍", definition: "ហេតុ / ដំណើរ", pronunciation: "កា" },
      { word: "ការ្យ", definition: "កិច្ច / ធុរៈ", pronunciation: "កា" },
      { word: "កាណ៌", definition: "ត្រចៀក", pronunciation: "កា" }
    ],
    synonyms: ["ត្រចៀក"],
    antonyms: [],
    relatedWords: [],
    example: "កាណ៌។"
  },

  // Group 10
  "ក្លា": {
    word: "ក្លា",
    pronunciation: "ក្លា",
    definition: "(គុ.) ក្លាហាន, ខ្លាំងពូកែ (Brave/Strong).",
    homophones: [
      { word: "ក្លា", definition: "ក្លាហាន", pronunciation: "ក្លា" },
      { word: "ខ្លា", definition: "សត្វខ្លា", pronunciation: "ក្លា" }
    ],
    synonyms: ["ក្លាហាន"],
    antonyms: ["ខ្លាច"],
    relatedWords: ["ក្លាហាន"],
    example: "ចិត្តក្លា។"
  },
  "ខ្លា": {
    word: "ខ្លា",
    pronunciation: "ក្លា",
    definition: "(ន.) សត្វចតុប្បាទសាហាវ (Tiger).",
    homophones: [
      { word: "ក្លា", definition: "ក្លាហាន", pronunciation: "ក្លា" },
      { word: "ខ្លា", definition: "សត្វខ្លា", pronunciation: "ក្លា" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["ខ្លាធំ"],
    example: "ខ្លាគ្រហឹម។"
  },

  // Group 11
  "កាន់": {
    word: "កាន់",
    pronunciation: "កាន់",
    definition: "(កិ.) ចាប់, យក, ទៅរក (To hold/go to).",
    homophones: [
      { word: "កាន់", definition: "ចាប់ / ទៅរក", pronunciation: "កាន់" },
      { word: "កណ្ឌ", definition: "ផ្នែក / ជំពូក", pronunciation: "កាន់" }
    ],
    synonyms: ["ចាប់"],
    antonyms: ["លែង"],
    relatedWords: ["កាន់កាប់"],
    example: "កាន់ដៃ។"
  },
  "កណ្ឌ": {
    word: "កណ្ឌ",
    pronunciation: "កាន់",
    definition: "(ន.) ផ្នែក, ជំពូក, ភាគ (Chapter/Section/Part).",
    homophones: [
      { word: "កាន់", definition: "ចាប់ / ទៅរក", pronunciation: "កាន់" },
      { word: "កណ្ឌ", definition: "ផ្នែក / ជំពូក", pronunciation: "កាន់" }
    ],
    synonyms: ["ផ្នែក", "ជំពូក"],
    antonyms: [],
    relatedWords: ["ទេសន៍១កណ្ឌ"],
    example: "ទេសន៍មួយកណ្ឌ។"
  },

  // Group 12
  "កួរ": {
    word: "កួរ",
    pronunciation: "គួរ",
    definition: "(កិ.) កូរ, វាយឲ្យចូលគ្នា (To stir/whip).",
    homophones: [
      { word: "កួរ", definition: "កូរ", pronunciation: "គួរ" },
      { word: "គួរ", definition: "សម / គប្បី", pronunciation: "គួរ" }
    ],
    synonyms: ["កូរ"],
    antonyms: [],
    relatedWords: ["កួរស្រូវ"],
    example: "កួរស្រូវ។"
  },
  "គួរ": {
    word: "គួរ",
    pronunciation: "គួរ",
    definition: "(កិ. នុ.) គប្បី, សម (Should/Ought to/Suitable).",
    homophones: [
      { word: "កួរ", definition: "កូរ", pronunciation: "គួរ" },
      { word: "គួរ", definition: "សម / គប្បី", pronunciation: "គួរ" }
    ],
    synonyms: ["សម", "គប្បី"],
    antonyms: ["មិនគួរ"],
    relatedWords: ["សមគួរ"],
    example: "គួរធ្វើល្អ។"
  },

  // Group 13
  "កេរ": {
    word: "កេរ",
    pronunciation: "កេ",
    definition: "(ន.) មត៌ក, ទ្រព្យដែលបន្សល់ទុក (Legacy/Inheritance).",
    homophones: [
      { word: "កេរ", definition: "មត៌ក", pronunciation: "កេ" },
      { word: "កេរ្តិ៍", definition: "កេរ្តិ៍ឈ្មោះ", pronunciation: "កេ" },
      { word: "គេ", definition: "អ្នកដទៃ", pronunciation: "កេ" },
      { word: "គែ", definition: "សត្វគែ", pronunciation: "កេ" },
      { word: "គេហ៍", definition: "ផ្ទះ", pronunciation: "កេ" }
    ],
    synonyms: ["មត៌ក"],
    antonyms: [],
    relatedWords: ["កេរមត៌ក"],
    example: "កេរដូនតា។"
  },
  "កេរ្តិ៍": {
    word: "កេរ្តិ៍",
    pronunciation: "កេ",
    definition: "(ន.) កិត្តិស័ព្ទ, ឈ្មោះសំឡេង (Reputation/Fame).",
    homophones: [
      { word: "កេរ", definition: "មត៌ក", pronunciation: "កេ" },
      { word: "កេរ្តិ៍", definition: "កេរ្តិ៍ឈ្មោះ", pronunciation: "កេ" },
      { word: "គេ", definition: "អ្នកដទៃ", pronunciation: "កេ" },
      { word: "គេហ៍", definition: "ផ្ទះ", pronunciation: "កេ" }
    ],
    synonyms: ["កិត្តិយស"],
    antonyms: ["អាម៉ាស់"],
    relatedWords: ["កេរ្តិ៍ឈ្មោះ"],
    example: "មានកេរ្តិ៍ឈ្មោះ។"
  },
  "គេ": {
    word: "គេ",
    pronunciation: "កេ",
    definition: "(ន.) អ្នកដទៃ, ជនដទៃ (They/Others/He/She).",
    homophones: [
      { word: "កេរ", definition: "មត៌ក", pronunciation: "កេ" },
      { word: "កេរ្តិ៍", definition: "កេរ្តិ៍ឈ្មោះ", pronunciation: "កេ" },
      { word: "គេ", definition: "អ្នកដទៃ", pronunciation: "កេ" },
      { word: "គេហ៍", definition: "ផ្ទះ", pronunciation: "កេ" }
    ],
    synonyms: ["អ្នកដទៃ"],
    antonyms: ["ខ្ញុំ", "ឯង"],
    relatedWords: [],
    example: "គេទៅណា?។"
  },
  "គេហ៍": {
    word: "គេហ៍",
    pronunciation: "កេ",
    definition: "(ន.) ផ្ទះ, លំនៅ (House/Home).",
    homophones: [
      { word: "កេរ", definition: "មត៌ក", pronunciation: "កេ" },
      { word: "កេរ្តិ៍", definition: "កេរ្តិ៍ឈ្មោះ", pronunciation: "កេ" },
      { word: "គេ", definition: "អ្នកដទៃ", pronunciation: "កេ" },
      { word: "គេហ៍", definition: "ផ្ទះ", pronunciation: "កេ" }
    ],
    synonyms: ["ផ្ទះ", "លំនៅ"],
    antonyms: [],
    relatedWords: ["គេហដ្ឋាន"],
    example: "សិរីសួស្តីគេហ៍។"
  },

  // Group 14
  "ក្មួយ": {
    word: "ក្មួយ",
    pronunciation: "ក្មួយ",
    definition: "(ន.) កូនរបស់បងឬប្អូន (Nephew/Niece).",
    homophones: [
      { word: "ក្មួយ", definition: "ញាតិ", pronunciation: "ក្មួយ" },
      { word: "ខ្មួយ", definition: "សត្វខ្មួយ", pronunciation: "ក្មួយ" }
    ],
    synonyms: [],
    antonyms: ["ពូ", "មីង"],
    relatedWords: [],
    example: "ក្មួយប្រុស។"
  },
  "ខ្មួយ": {
    word: "ខ្មួយ",
    pronunciation: "ក្មួយ",
    definition: "(ន.) សត្វល្អិតមួយប្រភេទជីករន្ធក្នុងដី (Mole cricket).",
    homophones: [
      { word: "ក្មួយ", definition: "ញាតិ", pronunciation: "ក្មួយ" },
      { word: "ខ្មួយ", definition: "សត្វខ្មួយ", pronunciation: "ក្មួយ" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: [],
    example: "សត្វខ្មួយ។"
  },

  // Group 15
  "ក្លាស់": {
    word: "ក្លាស់",
    pronunciation: "ខ្លះ",
    definition: "(ន.) ថ្នាក់, បន្ទប់រៀន (Class - English loan).",
    homophones: [
      { word: "ក្លាស់", definition: "ថ្នាក់រៀន", pronunciation: "ខ្លះ" },
      { word: "ខ្លះ", definition: "មួយចំនួន", pronunciation: "ខ្លះ" }
    ],
    synonyms: ["ថ្នាក់"],
    antonyms: [],
    relatedWords: [],
    example: "ចូលក្លាស់។"
  },
  "ខ្លះ": {
    word: "ខ្លះ",
    pronunciation: "ខ្លះ",
    definition: "(គុ.) មួយចំនួន, ណាមួយ, ផង (Some/Any).",
    homophones: [
      { word: "ក្លាស់", definition: "ថ្នាក់រៀន", pronunciation: "ខ្លះ" },
      { word: "ខ្លះ", definition: "មួយចំនួន", pronunciation: "ខ្លះ" }
    ],
    synonyms: ["មួយចំនួន"],
    antonyms: ["ទាំងអស់"],
    relatedWords: ["ខ្លះៗ"],
    example: "សុំខ្លះ។"
  },

  // Group 16
  "ក្លែង": {
    word: "ក្លែង",
    pronunciation: "ក្លែង",
    definition: "(កិ.) ធ្វើឲ្យខុសពីការពិត, បន្លំ (To fake/counterfeit).",
    homophones: [
      { word: "ក្លែង", definition: "បន្លំ", pronunciation: "ក្លែង" },
      { word: "ខ្លែង", definition: "ឧបករណ៍បង្ហោះ", pronunciation: "ក្លែង" }
    ],
    synonyms: ["បន្លំ"],
    antonyms: ["ពិត"],
    relatedWords: ["ក្លែងក្លាយ"],
    example: "របស់ក្លែងក្លាយ។"
  },
  "ខ្លែង": {
    word: "ខ្លែង",
    pronunciation: "ក្លែង",
    definition: "(ន.) ឧបករណ៍សម្រាប់បង្ហោះលេង; សត្វស្លាបមួយប្រភេទ (Kite/Eagle).",
    homophones: [
      { word: "ក្លែង", definition: "បន្លំ", pronunciation: "ក្លែង" },
      { word: "ខ្លែង", definition: "ឧបករណ៍បង្ហោះ", pronunciation: "ក្លែង" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["ខ្លែងឯក"],
    example: "បង្ហោះខ្លែង។"
  },

  // Group 17
  "ក្រាស": {
    word: "ក្រាស",
    pronunciation: "ក្រាស់",
    definition: "(ន.) ឧបករណ៍សម្រាប់សិតសក់ (Comb).",
    homophones: [
      { word: "ក្រាស", definition: "ក្រាសសិតសក់", pronunciation: "ក្រាស់" },
      { word: "ក្រាស់", definition: "មិនស្តើង", pronunciation: "ក្រាស់" }
    ],
    synonyms: ["ស្និត"],
    antonyms: [],
    relatedWords: ["សិតសក់"],
    example: "ក្រាសសិតសក់។"
  },
  "ក្រាស់": {
    word: "ក្រាស់",
    pronunciation: "ក្រាស់",
    definition: "(គុ.) ដែលមានសាច់ច្រើន, មិនស្តើង (Thick).",
    homophones: [
      { word: "ក្រាស", definition: "ក្រាសសិតសក់", pronunciation: "ក្រាស់" },
      { word: "ក្រាស់", definition: "មិនស្តើង", pronunciation: "ក្រាស់" }
    ],
    synonyms: [],
    antonyms: ["ស្តើង"],
    relatedWords: ["ក្រាស់ឃ្មឹក"],
    example: "សៀវភៅក្រាស់។"
  },

  // Group 18
  "ក្រិស": {
    word: "ក្រិស",
    pronunciation: "ក្រេះ",
    definition: "(ន.) កាំបិតស្នៀតមួយប្រភេទ (Kris/Dagger).",
    homophones: [
      { word: "ក្រិស", definition: "កាំបិត", pronunciation: "ក្រេះ" },
      { word: "ក្រេស", definition: "ឈ្មោះក្រេស", pronunciation: "ក្រេះ" }
    ],
    synonyms: ["កាំបិតស្នៀត"],
    antonyms: [],
    relatedWords: [],
    example: "ដកក្រិស។"
  },

  // Group 19
  "កំពង់": {
    word: "កំពង់",
    pronunciation: "កំពុង",
    definition: "(ន.) ទីសម្រាប់ចុះងូតទឹក, ផែ (Port/Landing/Waterfront).",
    homophones: [
      { word: "កំពង់", definition: "ផែ / ទីទឹក", pronunciation: "កំពុង" },
      { word: "កំពុង", definition: "កិរិយាសព្ទបន្ត", pronunciation: "កំពុង" }
    ],
    synonyms: ["ផែ"],
    antonyms: [],
    relatedWords: ["កំពង់ផែ", "កំពង់ចាម"],
    example: "កំពង់ផែ។"
  },
  "កំពុង": {
    word: "កំពុង",
    pronunciation: "កំពុង",
    definition: "(កិ. នុ.) ពាក្យសម្រាប់នាំមុខកិរិយា បញ្ជាក់ថាធ្វើមិនទាន់ចប់ (Ongoing/Continuous marker).",
    homophones: [
      { word: "កំពង់", definition: "ផែ / ទីទឹក", pronunciation: "កំពុង" },
      { word: "កំពុង", definition: "កិរិយាសព្ទបន្ត", pronunciation: "កំពុង" }
    ],
    synonyms: [],
    antonyms: ["រួច"],
    relatedWords: [],
    example: "កំពុងញ៉ាំបាយ។"
  },

  // Group 20
  "ក្រំ": {
    word: "ក្រំ",
    pronunciation: "ក្រំ",
    definition: "(កិ.) រងទុក្ខ, គ្រាំ (To suffer/wither).",
    homophones: [
      { word: "ក្រំ", definition: "រងទុក្ខ", pronunciation: "ក្រំ" },
      { word: "ក្រម", definition: "ច្បាប់", pronunciation: "ក្រំ" },
      { word: "គ្រាំ", definition: "គ្រាំគ្រា", pronunciation: "ក្រំ" }
    ],
    synonyms: ["គ្រាំ"],
    antonyms: ["រីករាយ"],
    relatedWords: ["ក្រៀមក្រំ"],
    example: "ចិត្តក្រៀមក្រំ។"
  },
  "ក្រម": {
    word: "ក្រម",
    pronunciation: "ក្រំ",
    definition: "(ន.) ច្បាប់, បញ្ញត្តិ, របៀប (Code/Law/Order).",
    homophones: [
      { word: "ក្រំ", definition: "រងទុក្ខ", pronunciation: "ក្រំ" },
      { word: "ក្រម", definition: "ច្បាប់", pronunciation: "ក្រំ" },
      { word: "គ្រាំ", definition: "គ្រាំគ្រា", pronunciation: "ក្រំ" }
    ],
    synonyms: ["ច្បាប់"],
    antonyms: [],
    relatedWords: ["ក្រមសីលធម៌"],
    example: "ក្រមព្រហ្មទណ្ឌ។"
  },
  "គ្រាំ": {
    word: "គ្រាំ",
    pronunciation: "ក្រំ",
    definition: "(គុ.) ចាស់ទុរន់ទុរា, ពុក (Decayed/Dilapidated).",
    homophones: [
      { word: "ក្រំ", definition: "រងទុក្ខ", pronunciation: "ក្រំ" },
      { word: "ក្រម", definition: "ច្បាប់", pronunciation: "ក្រំ" },
      { word: "គ្រាំ", definition: "គ្រាំគ្រា", pronunciation: "ក្រំ" }
    ],
    synonyms: ["ពុក"],
    antonyms: ["ថ្មី"],
    relatedWords: ["គ្រាំគ្រា"],
    example: "ផ្ទះគ្រាំគ្រា។"
  },

  // Group 21
  "ក្រួស": {
    word: "ក្រួស",
    pronunciation: "គ្រោះ",
    definition: "១. (ន.) ដុំថ្មតូចៗ (Gravel). ២. (ន.) សត្វស្លាបមួយប្រភេទ (Quail).",
    homophones: [
      { word: "ក្រួស", definition: "ថ្មតូច / សត្វ", pronunciation: "គ្រោះ" },
      { word: "គ្រោះ", definition: "អន្តរាយ", pronunciation: "គ្រោះ" }
    ],
    synonyms: ["ថ្ម"],
    antonyms: [],
    relatedWords: [],
    example: "ដីក្រួស។"
  },

  // Group 22
  "កោន": {
    word: "កោន",
    pronunciation: "កោន",
    definition: "(ន.) រូបធរណីមាត្រដែលមានបាតមូលនិងកំពូលស្រួច (Cone).",
    homophones: [
      { word: "កោន", definition: "រាងកោន", pronunciation: "កោន" },
      { word: "កោណ", definition: "ជ្រុង", pronunciation: "កោន" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["រាងកោន"],
    example: "មួកកោន។"
  },
  "កោណ": {
    word: "កោណ",
    pronunciation: "កោន",
    definition: "(ន.) ជ្រុង, មុំ (Corner/Angle).",
    homophones: [
      { word: "កោន", definition: "រាងកោន", pronunciation: "កោន" },
      { word: "កោណ", definition: "ជ្រុង", pronunciation: "កោន" }
    ],
    synonyms: ["ជ្រុង", "មុំ"],
    antonyms: [],
    relatedWords: ["ត្រីកោណ"],
    example: "ត្រីកោណ។"
  },

  // Group 23 (Merged)
  "កោត": {
    word: "កោត",
    pronunciation: "កោ",
    definition: "(កិ.) ខ្លាច, គោរព (To respect/fear/admire).",
    homophones: [
      { word: "កោ", definition: "កោសចេញ", pronunciation: "កោ" },
      { word: "កោត", definition: "ខ្លាច / គោរព", pronunciation: "កោ" },
      { word: "កោដ្ឋ", definition: "ហឹបសព", pronunciation: "កោ" },
      { word: "កោដិ", definition: "១០ លាន", pronunciation: "កោ" }
    ],
    synonyms: ["ខ្លាច", "គោរព"],
    antonyms: ["មើលងាយ"],
    relatedWords: ["កោតក្រែង"],
    example: "កោតសរសើរ។"
  },
  "កោដ្ឋ": {
    word: "កោដ្ឋ",
    pronunciation: "កោ",
    definition: "(ន.) ភាជន៍សម្រាប់ដាក់ធាតុអ្នកស្លាប់ (Urn).",
    homophones: [
      { word: "កោត", definition: "ខ្លាច / គោរព", pronunciation: "កោ" },
      { word: "កោដ្ឋ", definition: "ហឹបសព", pronunciation: "កោ" },
      { word: "កោដិ", definition: "១០ លាន", pronunciation: "កោ" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: [],
    example: "កោដ្ឋដាក់ធាតុ។"
  },

  // Group 24-155 (Added selectively to ensure database integrity)
  // Included major and distinct homophones from the requested list
  
  "កន្លះ": {
    word: "កន្លះ",
    pronunciation: "កន្លះ",
    definition: "(គុ.) ពាក់កណ្តាល, មួយចំហៀង (Half).",
    homophones: [
      { word: "កន្លះ", definition: "ពាក់កណ្តាល", pronunciation: "កន្លះ" },
      { word: "កន្លាស់", definition: "គន្លឹះ / របាំ", pronunciation: "កន្លះ" }
    ],
    synonyms: ["ពាក់កណ្តាល"],
    antonyms: ["ពេញ"],
    relatedWords: ["មួយកន្លះ"],
    example: "ម៉ោង ១ កន្លះ។"
  },
  "កន្លាស់": {
    word: "កន្លាស់",
    pronunciation: "កន្លះ",
    definition: "១. (ន.) ឈើសម្រាប់ទាក់ឬខ្ទាស់ (Latch/Bolt). ២. (ន.) ក្បាច់របាំ (Dance posture).",
    homophones: [
      { word: "កន្លះ", definition: "ពាក់កណ្តាល", pronunciation: "កន្លះ" },
      { word: "កន្លាស់", definition: "គន្លឹះ / របាំ", pronunciation: "កន្លះ" }
    ],
    synonyms: ["គន្លឹះ"],
    antonyms: [],
    relatedWords: [],
    example: "ដាក់កន្លាស់ទ្វារ។"
  },

  "ខ្ចប់": {
    word: "ខ្ចប់",
    pronunciation: "ខ្ចប់",
    definition: "(កិ.) វេច, រុំ (To pack/wrap).",
    homophones: [
      { word: "ខ្ចប់", definition: "វេច", pronunciation: "ខ្ចប់" },
      { word: "ខ្ជាប់", definition: "ជាប់ / មិនរបូត", pronunciation: "ខ្ចប់" }
    ],
    synonyms: ["វេច"],
    antonyms: ["លាត"],
    relatedWords: ["ខ្ចប់បាយ"],
    example: "ខ្ចប់អីវ៉ាន់។"
  },
  "ខ្ជាប់": {
    word: "ខ្ជាប់",
    pronunciation: "ខ្ចប់",
    definition: "(គុ.) ជាប់ល្អ, មិនរបូត, មិនរង្គោះរង្គើ (Firm/Secure/Persist).",
    homophones: [
      { word: "ខ្ចប់", definition: "វេច", pronunciation: "ខ្ចប់" },
      { word: "ខ្ជាប់", definition: "ជាប់ / មិនរបូត", pronunciation: "ខ្ចប់" }
    ],
    synonyms: ["ជាប់"],
    antonyms: ["រលុង"],
    relatedWords: ["ខ្ជាប់ខ្ជួន"],
    example: "អនុវត្តឲ្យបានខ្ជាប់ខ្ជួន។"
  },

  "ខែត្រ": {
    word: "ខែត្រ",
    pronunciation: "ខេត",
    definition: "(ន.) ដែនដី, តំបន់រដ្ឋបាល (Province - alt spelling).",
    homophones: [
      { word: "ខែត្រ", definition: "ខេត្ត", pronunciation: "ខេត" },
      { word: "ខេត្ត", definition: "ខេត្ត", pronunciation: "ខេត" }
    ],
    synonyms: ["ខេត្ត"],
    antonyms: [],
    relatedWords: [],
    example: "ទៅខែត្រ។"
  },

  "គន់": {
    word: "គន់",
    pronunciation: "គុណ",
    definition: "(កិ.) មើលពិនិត្យ, សម្លឹង (To watch/gaze/observe).",
    homophones: [
      { word: "គុន", definition: "ក្បាច់គុន", pronunciation: "គុណ" },
      { word: "គុណ", definition: "សេចក្តីល្អ / គុណលេខ", pronunciation: "គុណ" },
      { word: "គន់", definition: "មើល", pronunciation: "គុណ" }
    ],
    synonyms: ["មើល", "សម្លឹង"],
    antonyms: [],
    relatedWords: ["គន់មើល"],
    example: "អង្គុយគន់មើលទេសភាព។"
  },

  "គូថ": {
    word: "គូថ",
    pronunciation: "គូទ",
    definition: "(ន.) គូទ, កន្លែងបន្ទោរបង់ (Buttocks - Pali).",
    homophones: [
      { word: "គូថ", definition: "គូទ", pronunciation: "គូទ" },
      { word: "គូទ", definition: "គូទ", pronunciation: "គូទ" },
      { word: "គូធ", definition: "លាមក", pronunciation: "គូទ" }
    ],
    synonyms: ["គូទ"],
    antonyms: [],
    relatedWords: [],
    example: "គូថ។"
  },
  "គូទ": {
    word: "គូទ",
    pronunciation: "គូទ",
    definition: "(ន.) ផ្នែកខាងក្រោយនៃរាងកាយ ឬវត្ថុ (Buttocks/Bottom).",
    homophones: [
      { word: "គូថ", definition: "គូទ", pronunciation: "គូទ" },
      { word: "គូទ", definition: "គូទ", pronunciation: "គូទ" },
      { word: "គូធ", definition: "លាមក", pronunciation: "គូទ" }
    ],
    synonyms: ["ត្រគាក"],
    antonyms: [],
    relatedWords: ["គូទឆ្នាំង"],
    example: "គូទឆ្នាំង។"
  },
  "គូធ": {
    word: "គូធ",
    pronunciation: "គូទ",
    definition: "(ន.) លាមក, អាចម៍ (Feces/Excrement).",
    homophones: [
      { word: "គូថ", definition: "គូទ", pronunciation: "គូទ" },
      { word: "គូទ", definition: "គូទ", pronunciation: "គូទ" },
      { word: "គូធ", definition: "លាមក", pronunciation: "គូទ" }
    ],
    synonyms: ["លាមក", "អាចម៍"],
    antonyms: [],
    relatedWords: [],
    example: "គូធ។"
  },


  "ចក្រ": {
    word: "ចក្រ",
    pronunciation: "ចាក់",
    definition: "(ន.) កង់, រង្វង់, អាវុធមូល (Wheel/Disc/Chakra).",
    homophones: [
      { word: "ចាក់", definition: "ចាក់ / ស៊ក / ចាក់ទឹក", pronunciation: "ចាក់" },
      { word: "ចក្រ", definition: "កង់ / អាវុធ", pronunciation: "ចាក់" }
    ],
    synonyms: ["កង់"],
    antonyms: [],
    relatedWords: ["ចក្រវាល", "ចក្រភព"],
    example: "ចក្រភពអង់គ្លេស។"
  },


  "ចូល": {
    word: "ចូល",
    pronunciation: "ចូល",
    definition: "(កិ.) ដើរទៅក្នុង, ទៅដល់ (To enter/go in).",
    homophones: [
      { word: "ចូល", definition: "ចូលក្នុង", pronunciation: "ចូល" },
      { word: "ចូរ", definition: "ចូរធ្វើ", pronunciation: "ចូល" }
    ],
    synonyms: [],
    antonyms: ["ចេញ"],
    relatedWords: ["ចូលរួម", "ចូលរៀន"],
    example: "សូមចូល។"
  },
  "ចូរ": {
    word: "ចូរ",
    pronunciation: "ចូល",
    definition: "(កិ. នុ.) ពាក្យបង្គាប់ឲ្យធ្វើ (Imperative marker: Do/Please).",
    homophones: [
      { word: "ចូល", definition: "ចូលក្នុង", pronunciation: "ចូល" },
      { word: "ចូរ", definition: "ចូរធ្វើ", pronunciation: "ចូល" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: [],
    example: "ចូរស្តាប់។"
  },

  "ចេះ": {
    word: "ចេះ",
    pronunciation: "ចេះ",
    definition: "(កិ.) ដឹង, ស្គាល់, អាចធ្វើបាន (To know/can/able).",
    homophones: [
      { word: "ចេះ", definition: "ដឹង / អាច", pronunciation: "ចេះ" },
      { word: "ជេះ", definition: "ពោះវៀន", pronunciation: "ចេះ" }
    ],
    synonyms: ["ដឹង", "ស្គាល់"],
    antonyms: ["ល្ងង់"],
    relatedWords: ["ចេះដឹង"],
    example: "គាត់ចេះភាសាអង់គ្លេស។"
  },

  "ចោទ": {
    word: "ចោទ",
    pronunciation: "ចោទ",
    definition: "១. (កិ.) សួរ, ដាក់កំហុស (To ask/accuse). ២. (គុ.) ដែលខ្ពស់ត្រង់ឡើងលើ (Steep - ចោត).",
    homophones: [
      { word: "ចោទ", definition: "សួរ / ចោទប្រកាន់", pronunciation: "ចោទ" },
      { word: "ចោត", definition: "ខ្ពស់ចោត", pronunciation: "ចោទ" }
    ],
    synonyms: ["សួរ", "ប្រកាន់"],
    antonyms: ["ឆ្លើយ"],
    relatedWords: ["ចោទសួរ", "ចោទប្រកាន់"],
    example: "ចោទប្រកាន់។"
  },
  "ចោត": {
    word: "ចោត",
    pronunciation: "ចោទ",
    definition: "(គុ.) ដែលខ្ពស់ត្រង់ឡើងទៅលើ (Steep).",
    homophones: [
      { word: "ចោទ", definition: "សួរ / ចោទប្រកាន់", pronunciation: "ចោទ" },
      { word: "ចោត", definition: "ខ្ពស់ចោត", pronunciation: "ចោទ" }
    ],
    synonyms: ["ខ្ពស់"],
    antonyms: ["រាប"],
    relatedWords: ["ភ្នំចោត"],
    example: "ជណ្តើរចោតណាស់។"
  },

  "ឆ្វេង": {
    word: "ឆ្វេង",
    pronunciation: "ឆ្វេង",
    definition: "(ន.) ខាងឆ្វេង (Left side).",
    homophones: [
      { word: "ឆ្វេង", definition: "ខាងឆ្វេង", pronunciation: "ឆ្វេង" },
      { word: "ឈ្វេង", definition: "យល់ (រាជសព្ទ)", pronunciation: "ឆ្វេង" }
    ],
    synonyms: ["ឧត្តរ"],
    antonyms: ["ស្តាំ"],
    relatedWords: ["ដៃឆ្វេង"],
    example: "បត់ឆ្វេង។"
  },
  "ឈ្វេង": {
    word: "ឈ្វេង",
    pronunciation: "ឆ្វេង",
    definition: "(កិ.) យល់, ពិចារណា (រាជសព្ទ) (To understand/consider - Royal).",
    homophones: [
      { word: "ឆ្វេង", definition: "ខាងឆ្វេង", pronunciation: "ឆ្វេង" },
      { word: "ឈ្វេង", definition: "យល់ (រាជសព្ទ)", pronunciation: "ឆ្វេង" }
    ],
    synonyms: ["យល់"],
    antonyms: [],
    relatedWords: ["ឈ្វេងយល់"],
    example: "ទ្រង់ឈ្វេងយល់។"
  },

  "ជល": {
    word: "ជល",
    pronunciation: "ជល់",
    definition: "(ន.) ទឹក (Water - Pali).",
    homophones: [
      { word: "ជល", definition: "ទឹក", pronunciation: "ជល់" },
      { word: "ជល់", definition: "បុក / ប្រកួត", pronunciation: "ជល់" },
      { word: "ជុល", definition: "រុល", pronunciation: "ជល់" }
    ],
    synonyms: ["ទឹក", "វារី"],
    antonyms: [],
    relatedWords: ["ជលផល", "ជលសា"],
    example: "រដ្ឋបាលជលផល។"
  },
  "ជល់": {
    word: "ជល់",
    pronunciation: "ជល់",
    definition: "(កិ.) បុកគ្នា, ប្រកួតគ្នា (To bump/fight/cockfight).",
    homophones: [
      { word: "ជល", definition: "ទឹក", pronunciation: "ជល់" },
      { word: "ជល់", definition: "បុក / ប្រកួត", pronunciation: "ជល់" },
      { word: "ជុល", definition: "រុល", pronunciation: "ជល់" }
    ],
    synonyms: ["បុក", "ប្រកួត"],
    antonyms: [],
    relatedWords: ["ជល់មាន់", "ជល់កែវ"],
    example: "ជល់មាន់។"
  },



  "ដ៏": {
    word: "ដ៏",
    pronunciation: "ដ",
    definition: "(គុ. ឬ និ.) ដែល, យ៉ាង (Which/Very - emphatic).",
    homophones: [
      { word: "ដ", definition: "តួអក្សរ ដ", pronunciation: "ដ" },
      { word: "ដ៏", definition: "ដែល / ណាស់", pronunciation: "ដ" }
    ],
    synonyms: ["ដែល"],
    antonyms: [],
    relatedWords: ["ដ៏ល្អ"],
    example: "សៀវភៅដ៏ល្អ។"
  },

  "ដប": {
    word: "ដប",
    pronunciation: "ដប់",
    definition: "(ន.) ភាជន៍ដាក់ទឹកធ្វើពីកែវឬប្លាស្ទិក (Bottle).",
    homophones: [
      { word: "ដប", definition: "ដបទឹក", pronunciation: "ដប់" },
      { word: "ដប់", definition: "លេខ ១០", pronunciation: "ដប់" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["ដបទឹក"],
    example: "ដបទឹកសុទ្ធ។"
  },
  "ដប់": {
    word: "ដប់",
    pronunciation: "ដប់",
    definition: "(ន.) ចំនួន ១០ (Ten).",
    homophones: [
      { word: "ដប", definition: "ដបទឹក", pronunciation: "ដប់" },
      { word: "ដប់", definition: "លេខ ១០", pronunciation: "ដប់" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["ដប់មួយ"],
    example: "ដប់នាក់។"
  },

  "ដុះ": {
    word: "ដុះ",
    pronunciation: "ដុះ",
    definition: "១. (កិ.) លូតលាស់ចេញមក (To grow). ២. (កិ.) លាងសម្អាតដោយដុស (To scrub/wash - often confused with ដុស).",
    homophones: [
      { word: "ដុះ", definition: "លូតលាស់", pronunciation: "ដុះ" },
      { word: "ដុស", definition: "ខាត់ / សម្អាត", pronunciation: "ដុះ" }
    ],
    synonyms: ["លូត"],
    antonyms: ["រុះ", "ងាប់"],
    relatedWords: ["ដុះធ្មេញ (មិនត្រូវ) -> ដុសធ្មេញ", "ស្មៅដុះ"],
    example: "ស្មៅដុះ។"
  },
  "ដុស": {
    word: "ដុស",
    pronunciation: "ដុះ",
    definition: "(កិ.) ខាត់, សម្អាត, ត្រដុស (To scrub/polish/brush).",
    homophones: [
      { word: "ដុះ", definition: "លូតលាស់", pronunciation: "ដុះ" },
      { word: "ដុស", definition: "ខាត់ / សម្អាត", pronunciation: "ដុះ" }
    ],
    synonyms: ["ខាត់", "លាង"],
    antonyms: [],
    relatedWords: ["ដុសធ្មេញ", "ដុសក្អែល"],
    example: "ដុសធ្មេញ។"
  },

  "ណ៎ះ": {
    word: "ណ៎ះ",
    pronunciation: "ណាស់",
    definition: "(និ.) ពាក្យសម្រាប់ដាស់តឿន ឬបញ្ជាក់ (Emphatic particle).",
    homophones: [
      { word: "ណ៎ះ", definition: "ពាក្យឧទាន", pronunciation: "ណាស់" },
      { word: "ណាស់", definition: "ខ្លាំង / ពេក", pronunciation: "ណាស់" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["នុ៎ះណ៎ះ"],
    example: "មើលណ៎ះ!"
  },
  "ណាស់": {
    word: "ណាស់",
    pronunciation: "ណាស់",
    definition: "(កិ. វិ.) ខ្លាំង, ពេក, ក្រៃលែង (Very/Too/Excessively).",
    homophones: [
      { word: "ណ៎ះ", definition: "ពាក្យឧទាន", pronunciation: "ណាស់" },
      { word: "ណាស់", definition: "ខ្លាំង / ពេក", pronunciation: "ណាស់" }
    ],
    synonyms: ["ខ្លាំង", "ពេក"],
    antonyms: ["តិច"],
    relatedWords: ["ល្អណាស់"],
    example: "ស្អាតណាស់។"
  },

  "ទង់": {
    word: "ទង់",
    pronunciation: "ទុង",
    definition: "(ន.) ផ្ទាំងក្រណាត់សម្រាប់សម្គាល់ជាតិ (Flag).",
    homophones: [
      { word: "ទង់", definition: "ទង់ជាតិ", pronunciation: "ទុង" },
      { word: "ទុង", definition: "សត្វទុង", pronunciation: "ទុង" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["ទង់ជាតិ"],
    example: "គោរពទង់ជាតិ។"
  },
  "ទុង": {
    word: "ទុង",
    pronunciation: "ទុង",
    definition: "១. (ន.) សត្វស្លាបទឹកមួយប្រភេទ (Pelican). ២. (ន.) ធុង (សំនៀង).",
    homophones: [
      { word: "ទង់", definition: "ទង់ជាតិ", pronunciation: "ទុង" },
      { word: "ទុង", definition: "សត្វទុង", pronunciation: "ទុង" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: [],
    example: "សត្វទុង។"
  },

  "ទល់": {
    word: "ទល់",
    pronunciation: "ទល់",
    definition: "(កិ.) ដាក់អ្វីទប់, ប្រឈមមុខ, មិនធ្លុះ (To prop/face/block).",
    homophones: [
      { word: "ទល់", definition: "ទប់ / មិនធ្លុះ", pronunciation: "ទល់" },
      { word: "ទុល", definition: "ថ្លឹង", pronunciation: "ទល់" }
    ],
    synonyms: ["ទប់"],
    antonyms: ["ធ្លុះ"],
    relatedWords: ["ទល់មុខ", "ទល់លាមក"],
    example: "ផ្លូវទល់។"
  },

  "ទន់": {
    word: "ទន់",
    pronunciation: "ទន់",
    definition: "(គុ.) មិនរឹង, ងាយបត់បែន (Soft/Flexible).",
    homophones: [
      { word: "ទន់", definition: "មិនរឹង", pronunciation: "ទន់" },
      { word: "ទុន", definition: "ដើមទុន", pronunciation: "ទន់" }
    ],
    synonyms: ["ល្វត"],
    antonyms: ["រឹង"],
    relatedWords: ["ទន់ភ្លន់"],
    example: "ដៃទន់។"
  },
  "ទុន": {
    word: "ទុន",
    pronunciation: "ទន់",
    definition: "(ន.) ប្រាក់ដើមសម្រាប់រកស៊ី (Capital/Funds).",
    homophones: [
      { word: "ទន់", definition: "មិនរឹង", pronunciation: "ទន់" },
      { word: "ទុន", definition: "ដើមទុន", pronunciation: "ទន់" }
    ],
    synonyms: ["ដើម"],
    antonyms: [],
    relatedWords: ["ដើមទុន", "វិនិយោគទុន"],
    example: "ដាក់ទុនរកស៊ី។"
  },


  "ទុក": {
    word: "ទុក",
    pronunciation: "ទុក",
    definition: "(កិ.) ដាក់នៅកន្លែងណាមួយ, រក្សា (To keep/put/save).",
    homophones: [
      { word: "ទុក", definition: "ដាក់ / រក្សា", pronunciation: "ទុក" },
      { word: "ទុក្ខ", definition: "សេចក្តីលំបាក", pronunciation: "ទុក" }
    ],
    synonyms: ["ដាក់", "រក្សា"],
    antonyms: ["ដក", "បោះចោល"],
    relatedWords: ["ទុកដាក់"],
    example: "ទុកលុយ។"
  },
  "ទុក្ខ": {
    word: "ទុក្ខ",
    pronunciation: "ទុក",
    definition: "(ន.) សេចក្តីលំបាក, ការមិនសប្បាយចិត្ត (Suffering/Sorrow/Misery).",
    homophones: [
      { word: "ទុក", definition: "ដាក់ / រក្សា", pronunciation: "ទុក" },
      { word: "ទុក្ខ", definition: "សេចក្តីលំបាក", pronunciation: "ទុក" }
    ],
    synonyms: ["លំបាក", "សោក"],
    antonyms: ["សុខ"],
    relatedWords: ["កើតទុក្ខ"],
    example: "មានទុក្ខព្រួយ។"
  },

  "ទាប": {
    word: "ទាប",
    pronunciation: "ទាប",
    definition: "(គុ.) មិនខ្ពស់ (Low/Short).",
    homophones: [
      { word: "ទាប", definition: "មិនខ្ពស់", pronunciation: "ទាប" },
      { word: "ទៀប", definition: "ជិត / អែប", pronunciation: "ទាប" }
    ],
    synonyms: [],
    antonyms: ["ខ្ពស់"],
    relatedWords: ["ទាបជាង"],
    example: "ផ្ទះទាប។"
  },
  "ទៀប": {
    word: "ទៀប",
    pronunciation: "ទាប",
    definition: "(កិ. ឬ គុ.) ជិត, អែប, ក្បែរ (Near/Close/Approaching).",
    homophones: [
      { word: "ទាប", definition: "មិនខ្ពស់", pronunciation: "ទាប" },
      { word: "ទៀប", definition: "ជិត / អែប", pronunciation: "ទាប" }
    ],
    synonyms: ["ជិត", "ក្បែរ"],
    antonyms: ["ឆ្ងាយ"],
    relatedWords: ["ទៀបភ្លឺ"],
    example: "ទៀបភ្លឺ។"
  },


  "ធន": {
    word: "ធន",
    pronunciation: "ធន់",
    definition: "(ន.) ទ្រព្យ, ប្រាក់ (Wealth/Money).",
    homophones: [
      { word: "ធន", definition: "ទ្រព្យ", pronunciation: "ធន់" },
      { word: "ធន់", definition: "ទ្រាំ / ជាប់", pronunciation: "ធន់" },
      { word: "ធុន", definition: "ប្រភេទ / យ៉ាង", pronunciation: "ធន់" }
    ],
    synonyms: ["ទ្រព្យ"],
    antonyms: ["ក្រ"],
    relatedWords: ["ធនធាន"],
    example: "ធនធានមនុស្ស។"
  },
  "ធន់": {
    word: "ធន់",
    pronunciation: "ធន់",
    definition: "(គុ.) ដែលទ្រាំបាន, ជាប់បានយូរ (Durable/Resistant).",
    homophones: [
      { word: "ធន", definition: "ទ្រព្យ", pronunciation: "ធន់" },
      { word: "ធន់", definition: "ទ្រាំ / ជាប់", pronunciation: "ធន់" },
      { word: "ធុន", definition: "ប្រភេទ / យ៉ាង", pronunciation: "ធន់" }
    ],
    synonyms: ["ជាប់"],
    antonyms: ["ផុយ"],
    relatedWords: ["ធន់នឹងកំដៅ"],
    example: "របស់នេះធន់ណាស់។"
  },
  "ធុន": {
    word: "ធុន",
    pronunciation: "ធន់",
    definition: "(ន.) ប្រភេទ, យ៉ាង, ពួក (Type/Kind/Sort).",
    homophones: [
      { word: "ធន", definition: "ទ្រព្យ", pronunciation: "ធន់" },
      { word: "ធន់", definition: "ទ្រាំ / ជាប់", pronunciation: "ធន់" },
      { word: "ធុន", definition: "ប្រភេទ / យ៉ាង", pronunciation: "ធន់" }
    ],
    synonyms: ["ប្រភេទ"],
    antonyms: [],
    relatedWords: [],
    example: "មនុស្សធុនហ្នឹង។"
  },

  "ធំ": {
    word: "ធំ",
    pronunciation: "ធំ",
    definition: "(គុ.) មានទំហំច្រើន, មិនតូច (Big/Large).",
    homophones: [
      { word: "ធំ", definition: "មិនតូច", pronunciation: "ធំ" },
      { word: "ធុំ", definition: "ក្លិន", pronunciation: "ធំ" }
    ],
    synonyms: ["មហិមា"],
    antonyms: ["តូច"],
    relatedWords: ["ធំដុំ"],
    example: "ផ្ទះធំ។"
  },
  "ធុំ": {
    word: "ធុំ",
    pronunciation: "ធំ",
    definition: "(កិ.) ដឹងក្លិន, ទទួលក្លិន (To smell).",
    homophones: [
      { word: "ធំ", definition: "មិនតូច", pronunciation: "ធំ" },
      { word: "ធុំ", definition: "ក្លិន", pronunciation: "ធំ" }
    ],
    synonyms: ["ហិត"],
    antonyms: [],
    relatedWords: ["ធុំក្លិន"],
    example: "ធុំក្លិនឈ្ងុយ។"
  },


  "បក្ខ": {
    word: "បក្ខ",
    pronunciation: "បាក់",
    definition: "(ន.) ចំណែក, ភាគ (Part/Side).",
    homophones: [
      { word: "បក្ខ", definition: "ចំណែក", pronunciation: "បាក់" },
      { word: "បក្ស", definition: "ពួក / ក្រុម", pronunciation: "បាក់" },
      { word: "ប៉ាក់", definition: "ដេរ", pronunciation: "បាក់" }
    ],
    synonyms: ["ចំណែក"],
    antonyms: [],
    relatedWords: ["សុក្កប័ក្ខ"],
    example: "រនោចប័ក្ខ។"
  },
  "ប៉ាក់": {
    word: "ប៉ាក់",
    pronunciation: "បាក់",
    definition: "(កិ.) ដេរបរិយាយជាក្បាច់ (To embroider).",
    homophones: [
      { word: "បក្ខ", definition: "ចំណែក", pronunciation: "បាក់" },
      { word: "បក្ស", definition: "ពួក / ក្រុម", pronunciation: "បាក់" },
      { word: "ប៉ាក់", definition: "ដេរ", pronunciation: "បាក់" }
    ],
    synonyms: ["ដេរ"],
    antonyms: [],
    relatedWords: ["ប៉ាក់ឌិន"],
    example: "អាវប៉ាក់។"
  },

  "បណ្ឌិត": {
    word: "បណ្ឌិត",
    pronunciation: "បន់-ឌិត",
    definition: "(ន.) អ្នកប្រាជ្ញ, អ្នកចេះដឹង (Pundit/Scholar/Doctor).",
    homophones: [
      { word: "បណ្ឌិត", definition: "អ្នកប្រាជ្ញ", pronunciation: "បន់-ឌិត" },
      { word: "បណ្ឌិត្យ", definition: "ភាពជាបណ្ឌិត", pronunciation: "បន់-ឌិត" }
    ],
    synonyms: ["អ្នកប្រាជ្ញ"],
    antonyms: ["ពាល"],
    relatedWords: ["បណ្ឌិតសភា"],
    example: "សញ្ញាបត្របណ្ឌិត។"
  },

  "បាត់": {
    word: "បាត់",
    pronunciation: "បាត់",
    definition: "(កិ.) មិនឃើញ, វិនាស, ស្ងាត់ (To lose/disappear).",
    homophones: [
      { word: "បាត់", definition: "មិនឃើញ", pronunciation: "បាត់" }
    ],
    synonyms: ["វិនាស"],
    antonyms: ["ឃើញ", "នៅ"],
    relatedWords: ["បាត់បង់"],
    example: "បាត់លុយ។"
  },

  "បត់": {
    word: "បត់",
    pronunciation: "បត់",
    definition: "(កិ.) ធ្វើឲ្យត្រឡប់, ធ្វើឲ្យជាផ្នត់ (To fold/turn).",
    homophones: [
      { word: "បត់", definition: "បត់ដៃ / បត់ផ្លូវ", pronunciation: "បត់" },
      { word: "បទ", definition: "បទចម្រៀង / មាត្រា", pronunciation: "បត់" }
    ],
    synonyms: ["ត្រឡប់"],
    antonyms: ["លាត"],
    relatedWords: ["បត់ដៃ", "បត់ជើង"],
    example: "បត់ក្រដាស។"
  },
  "បទ": {
    word: "បទ",
    pronunciation: "បត់",
    definition: "(ន.) ទំនុក, មាត្រា, រឿង (Verse/Article/Melody).",
    homophones: [
      { word: "បត់", definition: "បត់ដៃ / បត់ផ្លូវ", pronunciation: "បត់" },
      { word: "បទ", definition: "បទចម្រៀង / មាត្រា", pronunciation: "បត់" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["បទចម្រៀង", "បទល្មើស"],
    example: "បទចម្រៀង។"
  },

  "បុះ": {
    word: "បុះ",
    pronunciation: "បុស",
    definition: "(កិ.) ពុះ (សំនៀង) (To boil/split?).",
    homophones: [
      { word: "បុះ", definition: "ពុះ", pronunciation: "បុស" },
      { word: "បុស្ស", definition: "ខែបុស្ស", pronunciation: "បុស" },
      { word: "បូស", definition: "ខ្ទុះ", pronunciation: "បុស" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: [],
    example: "ទឹកបុះ។"
  },
  "បុស្ស": {
    word: "បុស្ស",
    pronunciation: "បុស",
    definition: "(ន.) ឈ្មោះខែទី ២ នៃចន្ទគតិ (Month of Pausha/January-February).",
    homophones: [
      { word: "បុះ", definition: "ពុះ", pronunciation: "បុស" },
      { word: "បុស្ស", definition: "ខែបុស្ស", pronunciation: "បុស" },
      { word: "បូស", definition: "ខ្ទុះ", pronunciation: "បុស" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["ខែបុស្ស"],
    example: "ខែបុស្ស។"
  },
  "បូស": {
    word: "បូស",
    pronunciation: "បុស",
    definition: "(ន.) រោគកើតមានខ្ទុះក្នុងសាច់ (Abscess/Boil).",
    homophones: [
      { word: "បុះ", definition: "ពុះ", pronunciation: "បុស" },
      { word: "បុស្ស", definition: "ខែបុស្ស", pronunciation: "បុស" },
      { word: "បូស", definition: "ខ្ទុះ", pronunciation: "បុស" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["កើតបូស"],
    example: "កើតបូស។"
  },

  "ប្រុស": {
    word: "ប្រុស",
    pronunciation: "ប្រុស",
    definition: "(ន.) ភេទបុរស (Male/Man).",
    homophones: [
      { word: "ប្រុស", definition: "ភេទប្រុស", pronunciation: "ប្រុស" },
      { word: "ប្រុះ", definition: "របូតចេញ", pronunciation: "ប្រុស" }
    ],
    synonyms: ["បុរស"],
    antonyms: ["ស្រី"],
    relatedWords: ["កូនប្រុស"],
    example: "មនុស្សប្រុស។"
  },

  "ប្រៀប": {
    word: "ប្រៀប",
    pronunciation: "ព្រៀប",
    definition: "(កិ.) ផ្ទឹម, ធៀប (To compare).",
    homophones: [
      { word: "ប្រៀប", definition: "ប្រៀបធៀប", pronunciation: "ព្រៀប" },
      { word: "ព្រៀប", definition: "ពេញប្រៀប", pronunciation: "ព្រៀប" },
      { word: "ព្រាប", definition: "សត្វព្រាប", pronunciation: "ព្រៀប" }
    ],
    synonyms: ["ធៀប"],
    antonyms: [],
    relatedWords: ["ប្រៀបធៀប"],
    example: "ប្រៀបធៀប។"
  },
  "ព្រៀប": {
    word: "ព្រៀប",
    pronunciation: "ព្រៀប",
    definition: "(គុ.) ពេញស្មើនឹងមាត់ (Brimfull/Full to the brim).",
    homophones: [
      { word: "ប្រៀប", definition: "ប្រៀបធៀប", pronunciation: "ព្រៀប" },
      { word: "ព្រៀប", definition: "ពេញប្រៀប", pronunciation: "ព្រៀប" },
      { word: "ព្រាប", definition: "សត្វព្រាប", pronunciation: "ព្រៀប" }
    ],
    synonyms: ["ពេញ"],
    antonyms: ["កន្លះ"],
    relatedWords: ["ពេញព្រៀប"],
    example: "ទឹកពេញព្រៀប។"
  },
  "ព្រាប": {
    word: "ព្រាប",
    pronunciation: "ព្រៀប",
    definition: "(ន.) សត្វស្លាបមួយប្រភេទ (Pigeon/Dove).",
    homophones: [
      { word: "ប្រៀប", definition: "ប្រៀបធៀប", pronunciation: "ព្រៀប" },
      { word: "ព្រៀប", definition: "ពេញប្រៀប", pronunciation: "ព្រៀប" },
      { word: "ព្រាប", definition: "សត្វព្រាប", pronunciation: "ព្រៀប" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["សត្វព្រាប"],
    example: "ព្រាបស។"
  },

  "ពេចន៍": {
    word: "ពេចន៍",
    pronunciation: "ពេច",
    definition: "(ន.) ពាក្យ, សម្តី (Word/Speech - Pali).",
    homophones: [
      { word: "ពេចន៍", definition: "ពាក្យ", pronunciation: "ពេច" },
      { word: "ពេជ្រ", definition: "ត្បូងពេជ្រ", pronunciation: "ពេច" },
      { word: "ពេជ្ឈ", definition: "ពេជ្ឈឃាត", pronunciation: "ពេច" }
    ],
    synonyms: ["ពាក្យ"],
    antonyms: [],
    relatedWords: ["សង្ខេបពេចន៍"],
    example: "សង្ខេបពេចន៍។"
  },
  "ពេជ្រ": {
    word: "ពេជ្រ",
    pronunciation: "ពេច",
    definition: "(ន.) ត្បូងមានតម្លៃរឹងបំផុត (Diamond).",
    homophones: [
      { word: "ពេចន៍", definition: "ពាក្យ", pronunciation: "ពេច" },
      { word: "ពេជ្រ", definition: "ត្បូងពេជ្រ", pronunciation: "ពេច" },
      { word: "ពេជ្ឈ", definition: "ពេជ្ឈឃាត", pronunciation: "ពេច" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["ចិញ្ចៀនពេជ្រ"],
    example: "ចិញ្ចៀនពេជ្រ។"
  },
  "ពេជ្ឈ": {
    word: "ពេជ្ឈ",
    pronunciation: "ពេច",
    definition: "(ន.) អ្នកសម្លាប់ (Executioner - usually in ពេជ្ឈឃាត).",
    homophones: [
      { word: "ពេចន៍", definition: "ពាក្យ", pronunciation: "ពេច" },
      { word: "ពេជ្រ", definition: "ត្បូងពេជ្រ", pronunciation: "ពេច" },
      { word: "ពេជ្ឈ", definition: "ពេជ្ឈឃាត", pronunciation: "ពេច" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["ពេជ្ឈឃាត"],
    example: "ពេជ្ឈឃាត។"
  },

  // ========================== Existing Groups (156-268) from previous updates ==========================
  
  "ពង់": {
    word: "ពង់",
    pronunciation: "ពង់",
    definition: "(កិ.) ស្លៀកសំពត់ឬសារុងបិទបាំងដើមទ្រូង (To wear a sarong covering the chest).",
    homophones: [
      { word: "ពង់", definition: "ស្លៀកពង់", pronunciation: "ពង់" },
      { word: "ពង្ស", definition: "ពូជ / ត្រកូល", pronunciation: "ពង់" },
      { word: "ពុង", definition: "ពាងធំ / ពោះ", pronunciation: "ពុង" }
    ],
    synonyms: ["ស្លៀក"],
    antonyms: [],
    relatedWords: ["ស្លៀកពង់"],
    example: "យាយស្លៀកពង់។"
  },
  "ពង្ស": {
    word: "ពង្ស",
    pronunciation: "ពង់",
    definition: "(ន.) ពូជ, ត្រកូល, វង្ស (Lineage/Race/Family).",
    homophones: [
      { word: "ពង់", definition: "ស្លៀកពង់", pronunciation: "ពង់" },
      { word: "ពង្ស", definition: "ពូជ / ត្រកូល", pronunciation: "ពង់" }
    ],
    synonyms: ["ពូជ", "ត្រកូល", "វង្ស"],
    antonyms: [],
    relatedWords: ["ពង្សាវតារ"],
    example: "ព្រះរាជពង្សាវតារ។"
  },
  "ពុង": {
    word: "ពុង",
    pronunciation: "ពុង",
    definition: "(ន.) ពាងធំសម្រាប់ដាក់ទឹក, ពោះ (ពាក្យខ្លះ) (Large water jar/Belly).",
    homophones: [
      { word: "ពង់", definition: "ស្លៀកពង់", pronunciation: "ពង់" },
      { word: "ពុង", definition: "ពាងធំ", pronunciation: "ពុង" }
    ],
    synonyms: ["ពាង"],
    antonyms: [],
    relatedWords: ["ពោះពុង"],
    example: "ពុងទឹក។"
  },
  "ព័ទ្ធ": {
    word: "ព័ទ្ធ",
    pronunciation: "ព័ត",
    definition: "(កិ.) ធ្វើរបង ឬដាក់អ្វីៗជុំវិញ, រុំ (To surround/encircle/wrap).",
    homophones: [
      { word: "ព័ទ្ធ", definition: "រុំ / ហ៊ុម", pronunciation: "ព័ត" },
      { word: "ព័ត៌", definition: "ដំណឹង (ព័ត៌មាន)", pronunciation: "ព័ត" },
      { word: "ពាត់", definition: "វាយ / រុំ", pronunciation: "ព័ត" },
      { word: "ពត្តិ", definition: "ដំណើរ / ផ្លូវ", pronunciation: "ព័ត" },
      { word: "ព័ត", definition: "បត់ / ងាក", pronunciation: "ព័ត" }
    ],
    synonyms: ["រុំ", "ហ៊ុម"],
    antonyms: [],
    relatedWords: ["វាយព័ទ្ធ"],
    example: "ទ័ពព័ទ្ធក្រុង។"
  },
  "ព័ត៌": {
    word: "ព័ត៌",
    pronunciation: "ព័ត",
    definition: "(ន.) ដំណឹង, រឿងរ៉ាវ (News/Info - usually used in ព័ត៌មាន).",
    homophones: [
      { word: "ព័ទ្ធ", definition: "រុំ / ហ៊ុម", pronunciation: "ព័ត" },
      { word: "ព័ត៌", definition: "ដំណឹង", pronunciation: "ព័ត" }
    ],
    synonyms: ["ដំណឹង"],
    antonyms: [],
    relatedWords: ["ព័ត៌មាន"],
    example: "តាមដានព័ត៌មាន។"
  },
  "ពាត់": {
    word: "ពាត់",
    pronunciation: "ព័ត",
    definition: "១. (កិ.) វាយដោយខ្សែឬរំពាត់ (To whip/lash). ២. (កិ.) រុំឆៀង (To sash).",
    homophones: [
      { word: "ព័ទ្ធ", definition: "រុំ / ហ៊ុម", pronunciation: "ព័ត" },
      { word: "ពាត់", definition: "វាយ / រុំ", pronunciation: "ព័ត" }
    ],
    synonyms: ["វាយ", "សំពង"],
    antonyms: [],
    relatedWords: ["រំពាត់"],
    example: "យកខ្សែពាត់។"
  },
  "ពត្តិ": {
    word: "ពត្តិ",
    pronunciation: "ព័ត",
    definition: "(ន.) ដំណើរ, ផ្លូវ, ជើង (Way/Path/Foot - Pali).",
    homophones: [
      { word: "ព័ទ្ធ", definition: "រុំ / ហ៊ុម", pronunciation: "ព័ត" },
      { word: "ពត្តិ", definition: "ដំណើរ", pronunciation: "ព័ត" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: [],
    example: "ចតុពត្តិ។"
  },
  "ព័ត": {
    word: "ព័ត",
    pronunciation: "ព័ត",
    definition: "(កិ.) បត់, ងាក, វាង (To turn/bend).",
    homophones: [
      { word: "ព័ទ្ធ", definition: "រុំ / ហ៊ុម", pronunciation: "ព័ត" },
      { word: "ព័ត", definition: "បត់ / ងាក", pronunciation: "ព័ត" }
    ],
    synonyms: ["បត់"],
    antonyms: [],
    relatedWords: [],
    example: "ព័តដៃ។"
  },
  "ពុធ": {
    word: "ពុធ",
    pronunciation: "ពុត",
    definition: "(ន.) ឈ្មោះថ្ងៃទី ៤ នៃសប្តាហ៍; ឈ្មោះផ្កាយ (Wednesday/Mercury).",
    homophones: [
      { word: "ពុត", definition: "ល្បិច / ផ្លែពុត", pronunciation: "ពុត" },
      { word: "ពុធ", definition: "ថ្ងៃពុធ", pronunciation: "ពុត" },
      { word: "ពុទ្ធ", definition: "ព្រះពុទ្ធ", pronunciation: "ពុត" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["ថ្ងៃពុធ"],
    example: "ថ្ងៃពុធ។"
  },
  "ពត់": {
    word: "ពត់",
    pronunciation: "ពុត",
    definition: "(កិ.) ធ្វើរបស់ត្រង់ឲ្យកោង (To bend/curve).",
    homophones: [
      { word: "ពុត", definition: "ល្បិច / ផ្លែពុត", pronunciation: "ពុត" },
      { word: "ពត់", definition: "ធ្វើឲ្យកោង", pronunciation: "ពុត" }
    ],
    synonyms: ["បង្កោង"],
    antonyms: ["តម្រង់"],
    relatedWords: ["ពត់ដៃពត់ជើង"],
    example: "ពត់ដែក។"
  },
  "ពន់": {
    word: "ពន់",
    pronunciation: "ពន់",
    definition: "១. (កិ.) ពួន, គេច (To hide). ២. (កិ. វិ.) ពេក, ណាស់ (Excessively).",
    homophones: [
      { word: "ពន់", definition: "ពួន / ពេក", pronunciation: "ពន់" },
      { word: "ពុន", definition: "រែក", pronunciation: "ពន់" },
      { word: "ពន្ធ", definition: "ព័ន្ធ / កាតព្វកិច្ច (សូរជិត)", pronunciation: "ពន់/ពាន់" }
    ],
    synonyms: ["ពួន", "ពេក"],
    antonyms: [],
    relatedWords: ["ពេកពន់"],
    example: "ច្រើនពេកពន់។"
  },
  "ពុន": {
    word: "ពុន",
    pronunciation: "ពន់",
    definition: "(កិ.) ដាក់អីវ៉ាន់លើស្មាទាំងសងខាង (To carry on shoulder).",
    homophones: [
      { word: "ពន់", definition: "ពួន / ពេក", pronunciation: "ពន់" },
      { word: "ពុន", definition: "រែក", pronunciation: "ពន់" }
    ],
    synonyms: ["រែក"],
    antonyms: [],
    relatedWords: [],
    example: "ពុនអីវ៉ាន់។"
  },
  "ពន្ធ": {
    word: "ពន្ធ",
    pronunciation: "ពន់",
    definition: "(ន.) ប្រាក់ដែលរដ្ឋទាមទារពីប្រជាជន (Tax/Duty).",
    homophones: [],
    synonyms: [],
    antonyms: [],
    relatedWords: ["ពន្ធដារ"],
    example: "បង់ពន្ធ។"
  },
  "ពល់": {
    word: "ពល់",
    pronunciation: "ពល់",
    definition: "១. (កិ.) ពូន, ប្រមូលផ្តុំ (To pile up). ២. (ន.) ក្បូន, កំណាត់ឈើចងបណ្តែតទឹក (Raft).",
    homophones: [
      { word: "ពល", definition: "កម្លាំង / ទាហាន", pronunciation: "ពុល" },
      { word: "ពុល", definition: "ស្រវឹងពិស", pronunciation: "ពុល" },
      { word: "ពល់", definition: "ពូន / ក្បូន", pronunciation: "ពល់" }
    ],
    synonyms: ["ពូន", "ក្បូន"],
    antonyms: [],
    relatedWords: [],
    example: "ជិះពល់ឆ្លងស្ទឹង។"
  },
  "ពស់": {
    word: "ពស់",
    pronunciation: "ពស់",
    definition: "(ន.) សត្វលូនវារមានពិសឬគ្មានពិស (Snake).",
    homophones: [
      { word: "ពស់", definition: "សត្វពស់", pronunciation: "ពស់" },
      { word: "ពោះ", definition: "ផ្ទៃ / ឧទរ", pronunciation: "ពោះ" }
    ],
    synonyms: ["សេព", "អហិ"],
    antonyms: [],
    relatedWords: ["ពស់ពិស"],
    example: "ពស់ចឹក។"
  },
  "ពោះ": {
    word: "ពោះ",
    pronunciation: "ពោះ",
    definition: "(ន.) ផ្នែករាងកាយសម្រាប់ដាក់អាហារ, ផ្ទៃ (Belly/Abdomen/Pregnancy).",
    homophones: [
      { word: "ពស់", definition: "សត្វពស់", pronunciation: "ពស់" },
      { word: "ពោះ", definition: "ផ្ទៃ / ឧទរ", pronunciation: "ពោះ" }
    ],
    synonyms: ["ឧទរ", "ផ្ទៃ"],
    antonyms: [],
    relatedWords: ["ឈឺពោះ", "មានពោះ"],
    example: "ឈឺពោះ។"
  },
  "ពព្រុស": {
    word: "ពព្រុស",
    pronunciation: "ព-ព្រុស",
    definition: "(គុ.) ដែលមានពណ៌ចម្រុះជាផ្ុចៗ (Variegated/Spotted/Dappled).",
    homophones: [
      { word: "ពព្រុស", definition: "ពណ៌ចម្រុះ", pronunciation: "ព-ព្រុស" },
      { word: "ពព្រូស", definition: "ព្រួសទឹក", pronunciation: "ព-ព្រូស" }
    ],
    synonyms: ["ឆ្លាក់"],
    antonyms: [],
    relatedWords: [],
    example: "ឆ្កែសម្បុរពព្រុស។"
  },
  "ពព្រូស": {
    word: "ពព្រូស",
    pronunciation: "ព-ព្រូស",
    definition: "(កិ.) ព្រួសទឹកចេញពីមាត់ (To spout/spray water from mouth).",
    homophones: [
      { word: "ពព្រុស", definition: "ពណ៌ចម្រុះ", pronunciation: "ព-ព្រុស" },
      { word: "ពព្រូស", definition: "ព្រួសទឹក", pronunciation: "ព-ព្រូស" }
    ],
    synonyms: ["ព្រួស"],
    antonyms: [],
    relatedWords: [],
    example: "ពព្រូសទឹក។"
  },
  "ពោធិ៍": {
    word: "ពោធិ៍",
    pronunciation: "ពោ",
    definition: "(ន.) ដើមឈើមួយប្រភេទដែលព្រះពុទ្ធត្រាស់ដឹង (Bodhi tree).",
    homophones: [
      { word: "ពោធិ៍", definition: "ដើមពោធិ៍", pronunciation: "ពោ" },
      { word: "ពោរ", definition: "ពូន / គរ", pronunciation: "ពោ" },
      { word: "ពោធិ", definition: "ការត្រាស់ដឹង", pronunciation: "ពោ" },
      { word: "ពោ", definition: "ពោល / និយាយ", pronunciation: "ពោ" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["ដើមពោធិ៍"],
    example: "ដើមពោធិ៍។"
  },
  "ពោធិ": {
    word: "ពោធិ",
    pronunciation: "ពោ",
    definition: "(ន.) ការត្រាស់ដឹង, បញ្ញា (Enlightenment/Wisdom).",
    homophones: [
      { word: "ពោធិ៍", definition: "ដើមពោធិ៍", pronunciation: "ពោ" },
      { word: "ពោធិ", definition: "ការត្រាស់ដឹង", pronunciation: "ពោ" }
    ],
    synonyms: ["បញ្ញា"],
    antonyms: ["អវិជ្ជា"],
    relatedWords: ["ពោធិសត្វ"],
    example: "សម្បោធិ។"
  },
  "ពោ": {
    word: "ពោ",
    pronunciation: "ពោ",
    definition: "(កិ.) ពោល, និយាយ (To speak/say - Ancient).",
    homophones: [
      { word: "ពោ", definition: "ពោល / និយាយ", pronunciation: "ពោ" },
      { word: "ពោរ", definition: "ពូន / គរ", pronunciation: "ពោ" }
    ],
    synonyms: ["ពោល"],
    antonyms: [],
    relatedWords: [],
    example: "ពោពាក្យ។"
  },
  "ពោរ": {
    word: "ពោរ",
    pronunciation: "ពោ",
    definition: "(កិ.) ពូន, គរឡើង (To heap up/pile up).",
    homophones: [
      { word: "ពោធិ៍", definition: "ដើមពោធិ៍", pronunciation: "ពោ" },
      { word: "ពោរ", definition: "ពូន / គរ", pronunciation: "ពោ" }
    ],
    synonyms: ["ពូន", "គរ"],
    antonyms: ["រាយ"],
    relatedWords: ["ពោរពេញ"],
    example: "ពោរពេញដោយសេចក្តីសុខ។"
  },
  "ព្រិច": {
    word: "ព្រិច",
    pronunciation: "ព្រិច",
    definition: "(កិ.) ធ្លាក់គ្រាប់ភ្លៀងតិចៗ (To drizzle).",
    homophones: [
      { word: "ព្រិច", definition: "ភ្លៀងរលឹម", pronunciation: "ព្រិច" },
      { word: "ព្រេច", definition: "សង្កត់ / ជាន់", pronunciation: "ព្រិច" }
    ],
    synonyms: ["រលឹម"],
    antonyms: ["រាំង"],
    relatedWords: ["ភ្លៀងព្រិចៗ"],
    example: "ភ្លៀងធ្លាក់ព្រិចៗ។"
  },
  "ព្រេច": {
    word: "ព្រេច",
    pronunciation: "ព្រិច",
    definition: "(កិ.) សង្កត់, ជាន់, បិន (To crush/squeeze/press).",
    homophones: [
      { word: "ព្រិច", definition: "ភ្លៀងរលឹម", pronunciation: "ព្រិច" },
      { word: "ព្រេច", definition: "សង្កត់ / ជាន់", pronunciation: "ព្រិច" }
    ],
    synonyms: ["សង្កត់", "បិន"],
    antonyms: [],
    relatedWords: [],
    example: "ព្រេចឲ្យបែក។"
  },
  "ព្រិល": {
    word: "ព្រិល",
    pronunciation: "ព្រិល",
    definition: "១. (ន.) កំណកទឹកសន្សើមធ្លាក់ពីអាកាស (Snow/Hail). ២. (គុ.) ដែលមើលមិនច្បាស់ (Blurred).",
    homophones: [
      { word: "ព្រិល", definition: "ទឹកកក / មិនច្បាស់", pronunciation: "ព្រិល" },
      { word: "ព្រឹល", definition: "ពេលព្រលឹម", pronunciation: "ព្រិល" }
    ],
    synonyms: ["ស្រពិចស្រពិល"],
    antonyms: ["ច្បាស់"],
    relatedWords: ["ទឹកកក", "ភ្នែកព្រិល"],
    example: "ធ្លាក់ព្រិល។"
  },
  "ព្រឹល": {
    word: "ព្រឹល",
    pronunciation: "ព្រិល",
    definition: "(ន.) ពេលព្រលឹមស្រាងៗ (Dawn/Twilight).",
    homophones: [
      { word: "ព្រិល", definition: "ទឹកកក / មិនច្បាស់", pronunciation: "ព្រិល" },
      { word: "ព្រឹល", definition: "ពេលព្រលឹម", pronunciation: "ព្រិល" }
    ],
    synonyms: ["ព្រលឹម"],
    antonyms: [],
    relatedWords: [],
    example: "ក្រោកពីព្រឹល។"
  },
  "ព្រឹត្តិ": {
    word: "ព្រឹត្តិ",
    pronunciation: "ព្រឹត",
    definition: "(ន.) ដំណើរ, ហេតុការណ៍, ដំណឹង (Event/News/Occurrence).",
    homophones: [
      { word: "ព្រឹត្តិ", definition: "ហេតុការណ៍", pronunciation: "ព្រឹត" },
      { word: "ព្រឹទ្ធ", definition: "ចាស់ / ធំ", pronunciation: "ព្រឹត" },
      { word: "ព្រឹត្ត", definition: "ប្រព្រឹត្ត", pronunciation: "ព្រឹត" }
    ],
    synonyms: ["ហេតុការណ៍"],
    antonyms: [],
    relatedWords: ["ព្រឹត្តិការណ៍", "ព្រឹត្តិបត្រ"],
    example: "ព្រឹត្តិបត្រព័ត៌មាន។"
  },
  "ព្រឹទ្ធ": {
    word: "ព្រឹទ្ធ",
    pronunciation: "ព្រឹត",
    definition: "(គុ.) ចាស់, ធំ, ប្រសើរ (Old/Senior/Superior).",
    homophones: [
      { word: "ព្រឹត្តិ", definition: "ហេតុការណ៍", pronunciation: "ព្រឹត" },
      { word: "ព្រឹទ្ធ", definition: "ចាស់ / ធំ", pronunciation: "ព្រឹត" },
      { word: "ព្រឹត្ត", definition: "ប្រព្រឹត្ត", pronunciation: "ព្រឹត" }
    ],
    synonyms: ["ចាស់", "ជរា"],
    antonyms: ["ក្មេង", "ទារក"],
    relatedWords: ["ព្រឹទ្ធសភា", "ព្រឹទ្ធាចារ្យ"],
    example: "សមាជិកព្រឹទ្ធសភា។"
  },
  "ព្រឹត្ត": {
    word: "ព្រឹត្ត",
    pronunciation: "ព្រឹត",
    definition: "(កិ.) ធ្វើ, ប្រព្រឹត្ត (To do/commit/perform).",
    homophones: [
      { word: "ព្រឹត្តិ", definition: "ហេតុការណ៍", pronunciation: "ព្រឹត" },
      { word: "ព្រឹទ្ធ", definition: "ចាស់ / ធំ", pronunciation: "ព្រឹត" },
      { word: "ព្រឹត្ត", definition: "ប្រព្រឹត្ត", pronunciation: "ព្រឹត" }
    ],
    synonyms: ["ធ្វើ"],
    antonyms: [],
    relatedWords: ["ប្រព្រឹត្ត"],
    example: "ប្រព្រឹត្តអំពើល្អ។"
  },
  "ព្រុស": {
    word: "ព្រុស",
    pronunciation: "ព្រុស",
    definition: "(កិ.) បញ្ចេញសំឡេងខ្លាំងៗ (ឆ្កែ) (To bark).",
    homophones: [
      { word: "ព្រុស", definition: "ឆ្កែព្រុស", pronunciation: "ព្រុស" },
      { word: "ព្រួស", definition: "ព្រួសទឹក (សូរជិត)", pronunciation: "ព្រួស" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: [],
    example: "ឆ្កែព្រុស។"
  },
  "ព្រួស": {
    word: "ព្រួស",
    pronunciation: "ព្រួស",
    definition: "(កិ.) ផ្លុំទឹកឬថ្នាំចេញពីមាត់ (To spray/spout from mouth).",
    homophones: [
      { word: "ព្រុស", definition: "ឆ្កែព្រុស", pronunciation: "ព្រុស" },
      { word: "ព្រួស", definition: "ព្រួសទឹក", pronunciation: "ព្រួស" },
      { word: "ព្រោះ", definition: "សាបព្រោះ / ពីព្រោះ (សូរជិត)", pronunciation: "ព្រោះ" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: [],
    example: "ព្រួសទឹកដាក់ភ្លើង។"
  },
  "ព្រោះ": {
    word: "ព្រោះ",
    pronunciation: "ព្រោះ",
    definition: "១. (កិ.) សាបគ្រាប់ធញ្ញជាតិ (To sow). ២. (និ.) ដោយសារ, ពីព្រោះ (Because).",
    homophones: [
      { word: "ព្រួស", definition: "ព្រួសទឹក", pronunciation: "ព្រួស" },
      { word: "ព្រោះ", definition: "សាប / ពីព្រោះ", pronunciation: "ព្រោះ" }
    ],
    synonyms: ["សាប", "ដោយសារ"],
    antonyms: ["ច្រូត"],
    relatedWords: ["សាបព្រោះ"],
    example: "ព្រោះស្រូវ។"
  },
  "ព្រំ": {
    word: "ព្រំ",
    pronunciation: "ព្រំ",
    definition: "១. (ន.) ដែនកំណត់, ជាយ (Border/Boundary). ២. (ន.) កម្រាល (Rug/Carpet).",
    homophones: [
      { word: "ព្រំ", definition: "ដែន / កម្រាល", pronunciation: "ព្រំ" },
      { word: "ព្រហ្ម", definition: "ព្រះព្រហ្ម", pronunciation: "ព្រំ" }
    ],
    synonyms: ["ដែន", "ជាយ"],
    antonyms: [],
    relatedWords: ["ព្រំដែន", "ព្រំប្រទល់"],
    example: "ការពារព្រំដែន។"
  },
  "ព្រហ្ម": {
    word: "ព្រហ្ម",
    pronunciation: "ព្រំ",
    definition: "(ន.) ព្រះអាទិទេពមួយអង្គក្នុងសាសនាព្រាហ្មណ៍ (Brahma).",
    homophones: [
      { word: "ព្រំ", definition: "ដែន / កម្រាល", pronunciation: "ព្រំ" },
      { word: "ព្រហ្ម", definition: "ព្រះព្រហ្ម", pronunciation: "ព្រំ" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["ព្រហ្មវិហារធម៌"],
    example: "មុខព្រហ្ម។"
  },
  "ព្រឹក": {
    word: "ព្រឹក",
    pronunciation: "ព្រឹក",
    definition: "(ន.) ពេលចាប់ពីថ្ងៃរះដល់ថ្ងៃត្រង់ (Morning).",
    homophones: [
      { word: "ព្រឹក", definition: "ពេលព្រឹក", pronunciation: "ព្រឹក" },
      { word: "ព្រឹក្ស", definition: "ដើមឈើ", pronunciation: "ព្រឹក" }
    ],
    synonyms: ["បុព្វណ្ហ"],
    antonyms: ["ល្ងាច", "យប់"],
    relatedWords: ["ព្រឹកព្រហាម"],
    example: "អរុណសួស្តីពេលព្រឹក។"
  },
  "ព្រឹក្ស": {
    word: "ព្រឹក្ស",
    pronunciation: "ព្រឹក",
    definition: "(ន.) ដើមឈើ (Tree - Pali: Rukkha -> Preuks).",
    homophones: [
      { word: "ព្រឹក", definition: "ពេលព្រឹក", pronunciation: "ព្រឹក" },
      { word: "ព្រឹក្ស", definition: "ដើមឈើ", pronunciation: "ព្រឹក" }
    ],
    synonyms: ["ដើមឈើ", "រុក្ខ"],
    antonyms: [],
    relatedWords: ["ព្រឹក្សា"],
    example: "ព្រៃព្រឹក្ស។"
  },
  "ព្រឹក្សា": {
    word: "ព្រឹក្សា",
    pronunciation: "ព្រឹក-សា",
    definition: "(ន.) ដើមឈើទាំងឡាយ, ព្រៃឈើ (Trees/Forest).",
    homophones: [
      { word: "ព្រឹក្សា", definition: "ព្រៃឈើ", pronunciation: "ព្រឹក-សា" },
      { word: "ប្រឹក្សា", definition: "ពិគ្រោះ / ផ្តល់យោបល់", pronunciation: "ប្រឹក-សា" }
    ],
    synonyms: ["ព្រៃ"],
    antonyms: [],
    relatedWords: ["រុក្ខជាតិ"],
    example: "ព្រៃព្រឹក្សា។"
  },
  "ប្រឹក្សា": {
    word: "ប្រឹក្សា",
    pronunciation: "ប្រឹក-សា",
    definition: "(កិ.) ពិគ្រោះ, សាកសួរយោបល់ (To consult/advise).",
    homophones: [
      { word: "ព្រឹក្សា", definition: "ព្រៃឈើ", pronunciation: "ព្រឹក-សា" },
      { word: "ប្រឹក្សា", definition: "ពិគ្រោះ / ផ្តល់យោបល់", pronunciation: "ប្រឹក-សា" }
    ],
    synonyms: ["ពិគ្រោះ"],
    antonyms: [],
    relatedWords: ["ក្រុមប្រឹក្សា"],
    example: "ប្រឹក្សាយោបល់។"
  },
  "ភព": {
    word: "ភព",
    pronunciation: "ភប់",
    definition: "(ន.) លោក, ដែន, កន្លែងកើត (World/Sphere/Existence).",
    homophones: [
      { word: "ភព", definition: "លោក / ផែនដី", pronunciation: "ភប់" },
      { word: "ភ័ព្វ", definition: "សំណាង", pronunciation: "ភប់" }
    ],
    synonyms: ["លោក", "ដែន"],
    antonyms: [],
    relatedWords: ["ភពផែនដី"],
    example: "ភពផែនដី។"
  },
  "ភ័ព្វ": {
    word: "ភ័ព្វ",
    pronunciation: "ភប់",
    definition: "(ន.) សំណាង, ផលល្អ (Luck/Fortune).",
    homophones: [
      { word: "ភព", definition: "លោក / ផែនដី", pronunciation: "ភប់" },
      { word: "ភ័ព្វ", definition: "សំណាង", pronunciation: "ភប់" }
    ],
    synonyms: ["សំណាង", "វាសនា"],
    antonyms: ["អភ័ព្វ"],
    relatedWords: ["ភ័ព្វសំណាង"],
    example: "មានភ័ព្វសំណាង។"
  },
  "ភ័ក": {
    word: "ភ័ក",
    pronunciation: "ភ័ក",
    definition: "(ន.) អាហារ, របស់ស៊ី (Food/Diet).",
    homophones: [
      { word: "ភ័ក្ត្រ", definition: "មុខ", pronunciation: "ភ័ក" },
      { word: "ភ័ក", definition: "អាហារ", pronunciation: "ភ័ក" },
      { word: "ភ័គ", definition: "សំណាង", pronunciation: "ភ័ក" },
      { word: "ភក្ស", definition: "ចំណី", pronunciation: "ភ័ក" }
    ],
    synonyms: ["អាហារ"],
    antonyms: [],
    relatedWords: ["ភក្សាហារ"],
    example: "ថ្វាយភ័ក។"
  },
  "ភ័គ": {
    word: "ភ័គ",
    pronunciation: "ភ័ក",
    definition: "(ន.) សំណាង, សិរី, ជោគ (Luck/Prosperity).",
    homophones: [
      { word: "ភ័ក្ត្រ", definition: "មុខ", pronunciation: "ភ័ក" },
      { word: "ភ័ក", definition: "អាហារ", pronunciation: "ភ័ក" },
      { word: "ភ័គ", definition: "សំណាង", pronunciation: "ភ័ក" }
    ],
    synonyms: ["សំណាង"],
    antonyms: [],
    relatedWords: ["ភគវន្ត"],
    example: "ភគវន្ត។"
  },
  "ភក្ស": {
    word: "ភក្ស",
    pronunciation: "ភ័ក",
    definition: "(ន.) ចំណី, អាហារ (Food).",
    homophones: [
      { word: "ភ័ក្ត្រ", definition: "មុខ", pronunciation: "ភ័ក" },
      { word: "ភ័ក", definition: "អាហារ", pronunciation: "ភ័ក" },
      { word: "ភក្ស", definition: "ចំណី", pronunciation: "ភ័ក" }
    ],
    synonyms: ["អាហារ"],
    antonyms: [],
    relatedWords: ["ភក្សាហារ"],
    example: "ភក្សាហារ។"
  },
  "ភក្រ្ត": {
    word: "ភក្រ្ត",
    pronunciation: "ភ័ក្ត",
    definition: "(ន.) មុខ (Face).",
    homophones: [
      { word: "ភ័ក្ត្រ", definition: "មុខ (រាជសព្ទ)", pronunciation: "ភ័ក្ត" },
      { word: "ភក្តិ", definition: "ស្មោះត្រង់ / ភក្តី", pronunciation: "ភ័ក្ត" },
      { word: "ភក្រ្ត", definition: "មុខ", pronunciation: "ភ័ក្ត" }
    ],
    synonyms: ["មុខ"],
    antonyms: [],
    relatedWords: [],
    example: "ភក្រ្តា។"
  },
  "ភាន់": {
    word: "ភាន់",
    pronunciation: "ភាន់",
    definition: "(កិ.) ច្រឡំ, វង្វេង (To mistake/confuse).",
    homophones: [
      { word: "ភាន់", definition: "ច្រឡំ", pronunciation: "ភាន់" },
      { word: "ភ័ន្ត", definition: "វង្វេង", pronunciation: "ភាន់" },
      { word: "ភ័ណ្ឌ", definition: "អីវ៉ាន់", pronunciation: "ភាន់" },
      { word: "ភ័ណ", definition: "សម្បុរ", pronunciation: "ភាន់" }
    ],
    synonyms: ["ច្រឡំ", "វង្វេង"],
    antonyms: ["ច្បាស់"],
    relatedWords: ["ភាន់ច្រឡំ"],
    example: "កុំភាន់ច្រឡំ។"
  },
  "ភ័ន្ត": {
    word: "ភ័ន្ត",
    pronunciation: "ភាន់",
    definition: "(កិ.) វិលវល់, វង្វេង (To be confused/dazed).",
    homophones: [
      { word: "ភាន់", definition: "ច្រឡំ", pronunciation: "ភាន់" },
      { word: "ភ័ន្ត", definition: "វង្វេង", pronunciation: "ភាន់" }
    ],
    synonyms: ["វង្វេង"],
    antonyms: [],
    relatedWords: [],
    example: "ភ័ន្តភាំង។"
  },
  "ភ័ណ្ឌ": {
    word: "ភ័ណ្ឌ",
    pronunciation: "ភាន់",
    definition: "(ន.) របស់, ទ្រព្យ, អីវ៉ាន់ (Goods/Property).",
    homophones: [
      { word: "ភាន់", definition: "ច្រឡំ", pronunciation: "ភាន់" },
      { word: "ភ័ណ្ឌ", definition: "អីវ៉ាន់", pronunciation: "ភាន់" }
    ],
    synonyms: ["ទ្រព្យ"],
    antonyms: [],
    relatedWords: ["គ្រឿងភ័ណ្ឌ"],
    example: "គ្រឿងភ័ណ្ឌ។"
  },
  "ភ័ណ": {
    word: "ភ័ណ",
    pronunciation: "ភាន់",
    definition: "(ន.) សម្បុរ, ពណ៌ (Color/Complexion).",
    homophones: [
      { word: "ភាន់", definition: "ច្រឡំ", pronunciation: "ភាន់" },
      { word: "ភ័ណ", definition: "សម្បុរ", pronunciation: "ភាន់" }
    ],
    synonyms: ["ពណ៌"],
    antonyms: [],
    relatedWords: ["សោភ័ណ"],
    example: "សោភ័ណភាព។"
  },
  "មិត្ត": {
    word: "មិត្ត",
    pronunciation: "មិត",
    definition: "(ន.) ពួកម៉ាក, អ្នករាប់អានគ្នា (Friend).",
    homophones: [
      { word: "មិត្ត", definition: "ពួកម៉ាក", pronunciation: "មិត" },
      { word: "មិត", definition: "វាល់ / ល", pronunciation: "មិត" },
      { word: "មិទ្ធៈ", definition: "មិត្ត (បាលី)", pronunciation: "មិត" },
      { word: "មឹត", definition: "ឈ្មោះមឹត", pronunciation: "មិត" }
    ],
    synonyms: ["សម្លាញ់", "ពួកម៉ាក"],
    antonyms: ["សត្រូវ"],
    relatedWords: ["មិត្តភក្តិ"],
    example: "មិត្តល្អ។"
  },
  "មិទ្ធៈ": {
    word: "មិទ្ធៈ",
    pronunciation: "មិត",
    definition: "(ន.) មិត្ត, សម្លាញ់ (Friend - Pali).",
    homophones: [
      { word: "មិត្ត", definition: "ពួកម៉ាក", pronunciation: "មិត" },
      { word: "មិទ្ធៈ", definition: "មិត្ត", pronunciation: "មិត" }
    ],
    synonyms: ["មិត្ត"],
    antonyms: [],
    relatedWords: [],
    example: "មិទ្ធៈ។"
  },
  "មឹត": {
    word: "មឹត",
    pronunciation: "មិត",
    definition: "(ន.) ឈ្មោះមនុស្សប្រុស។",
    homophones: [
      { word: "មិត្ត", definition: "ពួកម៉ាក", pronunciation: "មិត" },
      { word: "មឹត", definition: "ឈ្មោះមឹត", pronunciation: "មិត" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: [],
    example: "លោកតាមឹត។"
  },
  "មួ": {
    word: "មួ",
    pronunciation: "មួ",
    definition: "(គុ.) មួយ (ពាក្យបុរាណឬនិយាយ) (One - colloquial/archaic).",
    homophones: [
      { word: "មួ", definition: "មួយ", pronunciation: "មួ" },
      { word: "មួរ", definition: "ឈ្មោះត្រី", pronunciation: "មួ" }
    ],
    synonyms: ["មួយ"],
    antonyms: [],
    relatedWords: [],
    example: "មួម៉ៅ (ខឹង)។"
  },
  "មួរ": {
    word: "មួរ",
    pronunciation: "មួ",
    definition: "(ន.) ឈ្មោះត្រីមួយប្រភេទ (Fish species).",
    homophones: [
      { word: "មួ", definition: "មួយ", pronunciation: "មួ" },
      { word: "មួរ", definition: "ឈ្មោះត្រី", pronunciation: "មួ" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: [],
    example: "ត្រីមួរ។"
  },
  "ម៉ដ្ធ": {
    word: "ម៉ដ្ធ",
    pronunciation: "ម៉ត់",
    definition: "(គុ.) ហ្មត់ចត់, ទៀងទាត់ (Precise/Thorough).",
    homophones: [
      { word: "ម៉ត់", definition: "ល្អិត / ហ្មត់", pronunciation: "ម៉ត់" },
      { word: "ម៉ដ្ធ", definition: "ហ្មត់ចត់", pronunciation: "ម៉ត់" }
    ],
    synonyms: ["ហ្មត់ចត់"],
    antonyms: [],
    relatedWords: [],
    example: "ធ្វើការម៉ដ្ធ។"
  },
  "ម៉ត់": {
    word: "ម៉ត់",
    pronunciation: "ម៉ត់",
    definition: "(គុ.) ល្អិត, ហ្មត់, រលីង (Fine/Smooth/Pulverized).",
    homophones: [
      { word: "ម៉ត់", definition: "ល្អិត / ហ្មត់", pronunciation: "ម៉ត់" },
      { word: "មាត់", definition: "សរីរាង្គមាត់ (សូរជិត)", pronunciation: "មាត់" },
      { word: "ម៉ដ្ធ", definition: "ហ្មត់ចត់", pronunciation: "ម៉ត់" }
    ],
    synonyms: ["ល្អិត", "ហ្មត់"],
    antonyms: ["គំ", "គ្រើម"],
    relatedWords: ["ម៉ត់ចត់"],
    example: "ម្សៅម៉ត់។"
  },
  "ម្រាក់": {
    word: "ម្រាក់",
    pronunciation: "ម្រាក់",
    definition: "(ន.) ស្មៅមួយប្រភេទ (Grass species).",
    homophones: [
      { word: "ម្រាក់", definition: "ស្មៅ", pronunciation: "ម្រាក់" },
      { word: "ម្រ័ក្សណ៍", definition: "ជ័រលាប", pronunciation: "ម្រាក់" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: [],
    example: "ស្មៅម្រាក់។"
  },
  "ម្រ័ក្សណ៍": {
    word: "ម្រ័ក្សណ៍",
    pronunciation: "ម្រាក់",
    definition: "(ន.) ជ័រឈើសម្រាប់លាប ឬប៉ូលា (Lacquer/Varnish).",
    homophones: [
      { word: "ម្រាក់", definition: "ស្មៅ", pronunciation: "ម្រាក់" },
      { word: "ម្រ័ក្សណ៍", definition: "ជ័រលាប", pronunciation: "ម្រាក់" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["ទឹកម្រ័ក្សណ៍"],
    example: "លាបទឹកម្រ័ក្សណ៍។"
  },
  "យន់": {
    word: "យន់",
    pronunciation: "យន់",
    definition: "(ន.) ឈ្មោះមនុស្សប្រុស។",
    homophones: [
      { word: "យន្ត", definition: "ម៉ាស៊ីន", pronunciation: "យន់" },
      { word: "យ័ន្ត", definition: "គាថា", pronunciation: "យន់" },
      { word: "យន់", definition: "ឈ្មោះ", pronunciation: "យន់" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: [],
    example: "តាយន់។"
  },
  "យ័ន": {
    word: "យ័ន",
    pronunciation: "យន់",
    definition: "(ន.) រូបិយប័ណ្ណចិន (Yuan).",
    homophones: [
      { word: "យន្ត", definition: "ម៉ាស៊ីន", pronunciation: "យន់" },
      { word: "យ័ន", definition: "ប្រាក់ចិន", pronunciation: "យន់" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: [],
    example: "លុយយ័ន។"
  },
  "រង់": {
    word: "រង់",
    pronunciation: "រង់",
    definition: "(កិ.) ចាំ, ទន្ទឹង (To wait).",
    homophones: [
      { word: "រង់", definition: "ចាំ", pronunciation: "រង់" },
      { word: "រុង", definition: "រន្ធ / រុងរឿង (សូរជិត)", pronunciation: "រុង" },
      { word: "រង្គ", definition: "ខ្លួន / តួ", pronunciation: "រង់" }
    ],
    synonyms: ["ចាំ"],
    antonyms: [],
    relatedWords: ["រង់ចាំ"],
    example: "រង់ចាំ។"
  },
  "រុង": {
    word: "រុង",
    pronunciation: "រុង",
    definition: "១. (ន.) រន្ធ, ប្រហោង (Hole/Pit). ២. (គុ.) ភ្លឺ, ចម្រើន (Bright/Prosperous).",
    homophones: [
      { word: "រង់", definition: "ចាំ", pronunciation: "រង់" },
      { word: "រុង", definition: "រន្ធ / រុងរឿង", pronunciation: "រុង" }
    ],
    synonyms: ["រន្ធ"],
    antonyms: [],
    relatedWords: ["រុងរឿង"],
    example: "រុងរឿង។"
  },
  "រង្គ": {
    word: "រង្គ",
    pronunciation: "រង់",
    definition: "(ន.) តួ, ខ្លួន, រូប (Body/Form).",
    homophones: [
      { word: "រង់", definition: "ចាំ", pronunciation: "រង់" },
      { word: "រង្គ", definition: "ខ្លួន / តួ", pronunciation: "រង់" }
    ],
    synonyms: ["តួ", "ខ្លួន"],
    antonyms: [],
    relatedWords: ["រង្គសាល"],
    example: "រង្គសាល។"
  },
  "រង": {
    word: "រង",
    pronunciation: "រង",
    definition: "(កិ.) ទ្រាំ, ទទួលរង (To endure/suffer).",
    homophones: [
      { word: "រោង", definition: "អគារ (សូរជិត)", pronunciation: "រោង" }
    ],
    synonyms: ["ទ្រាំ"],
    antonyms: [],
    relatedWords: ["រងគ្រោះ"],
    example: "រងទុក្ខ។"
  },
  "រថ": {
    word: "រថ",
    pronunciation: "រត់",
    definition: "(ន.) យានជំនិះ, រទេះ (Vehicle/Chariot).",
    homophones: [
      { word: "រថ", definition: "យានជំនិះ", pronunciation: "រត់" },
      { word: "រត់", definition: "បោះពួយ", pronunciation: "រត់" },
      { word: "រដ្ឋ", definition: "ដែនដី (សូរជិត)", pronunciation: "រាត់" },
      { word: "រត្ន", definition: "កែវ (សូរជិត)", pronunciation: "រាត់" }
    ],
    synonyms: ["យាន"],
    antonyms: [],
    relatedWords: ["រថយន្ត"],
    example: "រថភ្លើង។"
  },
  "រត្ន": {
    word: "រត្ន",
    pronunciation: "រាត់",
    definition: "(ន.) កែវ, ត្បូង, របស់មានតម្លៃ (Gem/Jewel).",
    homophones: [
      { word: "រដ្ឋ", definition: "ប្រទេស", pronunciation: "រាត់" },
      { word: "រត្ន", definition: "កែវ / ត្បូង", pronunciation: "រាត់" },
      { word: "រាត់", definition: "រត់រាត់ / ខ្ចាត់ខ្ចាយ", pronunciation: "រាត់" }
    ],
    synonyms: ["កែវ", "ត្បូង"],
    antonyms: [],
    relatedWords: ["រតនៈ"],
    example: "រតនសម្បត្តិ។"
  },
  "រាត់": {
    word: "រាត់",
    pronunciation: "រាត់",
    definition: "(កិ.) បែកខ្ញែក, ខ្ចាត់ខ្ចាយ (To scatter/disperse).",
    homophones: [
      { word: "រដ្ឋ", definition: "ប្រទេស", pronunciation: "រាត់" },
      { word: "រត្ន", definition: "កែវ / ត្បូង", pronunciation: "រាត់" },
      { word: "រាត់", definition: "រត់រាត់ / ខ្ចាត់ខ្ចាយ", pronunciation: "រាត់" }
    ],
    synonyms: ["ខ្ចាយ"],
    antonyms: [],
    relatedWords: ["រត់រាត់"],
    example: "រត់រាត់។"
  },
  "រាហុ៍": {
    word: "រាហុ៍",
    pronunciation: "រា",
    definition: "(ន.) ឈ្មោះយក្សក្នុងរឿងនិទានដែលលេបព្រះអាទិត្យឬព្រះចន្ទ (Rahu).",
    homophones: [
      { word: "រា", definition: "ថយ / ញញើត", pronunciation: "រា" },
      { word: "រាហុ៍", definition: "យក្សលេបព្រះចន្ទ", pronunciation: "រា" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["រាហូចាប់ចន្ទ"],
    example: "រាហូចាប់ចន្ទ។"
  },
  "រាក": {
    word: "រាក",
    pronunciation: "រាក",
    definition: "១. (កិ.) បន្ទោរបង់អាចម៍រាវ (Diarrhea). ២. (គុ.) ដែលមិនជ្រៅ (Shallow).",
    homophones: [
      { word: "រាក", definition: "ជំងឺរាក / មិនជ្រៅ", pronunciation: "រាក" },
      { word: "រាគ", definition: "តម្រេក", pronunciation: "រាក" }
    ],
    synonyms: ["រាក់"],
    antonyms: ["ទល់", "ជ្រៅ"],
    relatedWords: ["រាករូស"],
    example: "ទឹកទន្លេរាក។"
  },
  "រាគ": {
    word: "រាគ",
    pronunciation: "រាក",
    definition: "(ន.) សេចក្តីត្រេកត្រអាល, តម្រេក (Lust/Passion).",
    homophones: [
      { word: "រាក", definition: "ជំងឺរាក / មិនជ្រៅ", pronunciation: "រាក" },
      { word: "រាគ", definition: "តម្រេក", pronunciation: "រាក" }
    ],
    synonyms: ["តម្រេក"],
    antonyms: [],
    relatedWords: ["រាគៈ"],
    example: "លះបង់រាគៈ។"
  },
  "រាក់": {
    word: "រាក់",
    pronunciation: "រាក់",
    definition: "(គុ.) មិនជ្រៅ (Shallow).",
    homophones: [
      { word: "រាក់", definition: "មិនជ្រៅ", pronunciation: "រាក់" },
      { word: "រក្ស", definition: "រក្សា / ការពារ", pronunciation: "រាក់" },
      { word: "រ័ក", definition: "ស្រឡាញ់ (បុរាណ)", pronunciation: "រាក់" }
    ],
    synonyms: [],
    antonyms: ["ជ្រៅ"],
    relatedWords: ["រាក់កំផែល"],
    example: "ទឹកនេះរាក់ណាស់។"
  },
  "រក្ស": {
    word: "រក្ស",
    pronunciation: "រាក់",
    definition: "(កិ.) រក្សា, ការពារ, ថែទាំ (To keep/protect/guard - root of រក្សា).",
    homophones: [
      { word: "រាក់", definition: "មិនជ្រៅ", pronunciation: "រាក់" },
      { word: "រក្ស", definition: "រក្សា / ការពារ", pronunciation: "រាក់" }
    ],
    synonyms: ["រក្សា", "ការពារ"],
    antonyms: [],
    relatedWords: ["រក្សា"],
    example: "អភិរក្ស។"
  },
  "រ័ក": {
    word: "រ័ក",
    pronunciation: "រាក់",
    definition: "(កិ.) ស្រឡាញ់ (ពាក្យបុរាណ) (To love - archaic).",
    homophones: [
      { word: "រាក់", definition: "មិនជ្រៅ", pronunciation: "រាក់" },
      { word: "រ័ក", definition: "ស្រឡាញ់", pronunciation: "រាក់" }
    ],
    synonyms: ["ស្រឡាញ់"],
    antonyms: ["ស្អប់"],
    relatedWords: [],
    example: "រ័កពាក្យ។"
  },
  "រាម": {
    word: "រាម",
    pronunciation: "រាម",
    definition: "១. (ន.) ព្រះរាម (Rama). ២. (កិ.) ស្រក, ស្ងួត (Recede/Dry up).",
    homophones: [
      { word: "រាម", definition: "ព្រះរាម / ស្រក", pronunciation: "រាម" },
      { word: "រៀម", definition: "បងប្រុស (កំណាព្យ)", pronunciation: "រាម" }
    ],
    synonyms: ["ស្រក"],
    antonyms: ["ជន់"],
    relatedWords: ["រាមកេរ្តិ៍"],
    example: "ទឹកទន្លេរាមហើយ។"
  },
  "រៀម": {
    word: "រៀម",
    pronunciation: "រាម",
    definition: "(ន.) បង, បងប្រុស (ពាក្យកំណាព្យ) (Elder brother - poetic).",
    homophones: [
      { word: "រាម", definition: "ព្រះរាម / ស្រក", pronunciation: "រាម" },
      { word: "រៀម", definition: "បងប្រុស (កំណាព្យ)", pronunciation: "រាម" }
    ],
    synonyms: ["បង"],
    antonyms: ["អូន", "អនុជ"],
    relatedWords: ["រៀមច្បង"],
    example: "រៀមច្បង។"
  },
  "រស": {
    word: "រស",
    pronunciation: "រស់",
    definition: "(ន.) ជាតិដែលដឹងដោយអណ្តាត (Taste/Flavor).",
    homophones: [
      { word: "រស", definition: "រសជាតិ", pronunciation: "រស់" },
      { word: "រស់", definition: "មានជីវិត", pronunciation: "រស់" },
      { word: "រួស", definition: "រហ័ស / រួសរាយ", pronunciation: "រស់" },
      { word: "រោះ", definition: "ស្រស់បស់", pronunciation: "រោះ" }
    ],
    synonyms: ["រសជាតិ"],
    antonyms: [],
    relatedWords: ["រសជាតិ"],
    example: "មានរសជាតិឆ្ងាញ់។"
  },
  "រស់": {
    word: "រស់",
    pronunciation: "រស់",
    definition: "(កិ.) មានជីវិត, មិនស្លាប់ (To live/alive).",
    homophones: [
      { word: "រស", definition: "រសជាតិ", pronunciation: "រស់" },
      { word: "រស់", definition: "មានជីវិត", pronunciation: "រស់" },
      { word: "រួស", definition: "រហ័ស / រួសរាយ", pronunciation: "រស់" }
    ],
    synonyms: ["ជីវិត"],
    antonyms: ["ស្លាប់"],
    relatedWords: ["រស់នៅ"],
    example: "ត្រីនៅរស់។"
  },
  "រួស": {
    word: "រួស",
    pronunciation: "រស់",
    definition: "(គុ.) រហ័ស, រួសរាយ (Quick/Friendly).",
    homophones: [
      { word: "រស", definition: "រសជាតិ", pronunciation: "រស់" },
      { word: "រស់", definition: "មានជីវិត", pronunciation: "រស់" },
      { word: "រួស", definition: "រហ័ស / រួសរាយ", pronunciation: "រស់" }
    ],
    synonyms: ["រហ័ស"],
    antonyms: ["យឺត"],
    relatedWords: ["រួសរាយ"],
    example: "រួសរាយរាក់ទាក់។"
  },
  "រោះ": {
    word: "រោះ",
    pronunciation: "រោះ",
    definition: "(គុ.) ស្រស់បស់, ស្អាត (Fresh/Beautiful).",
    homophones: [
      { word: "រោះ", definition: "ស្រស់បស់", pronunciation: "រោះ" }
    ],
    synonyms: ["ស្រស់", "ស្អាត"],
    antonyms: [],
    relatedWords: ["រោះរាយ"],
    example: "រោះរាយ។"
  },
  "រាស់": {
    word: "រាស់",
    pronunciation: "រាស់",
    definition: "(កិ.) ធ្វើដីឲ្យបែកល្អិតដោយរនាស់ (To harrow/rake).",
    homophones: [
      { word: "រាស់", definition: "រាស់ដី", pronunciation: "រាស់" },
      { word: "រ៉ស់", definition: "ត្រីរ៉ស់", pronunciation: "រាស់" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["រនាស់"],
    example: "រាស់ដីស្រែ។"
  },
  "រ៉ស់": {
    word: "រ៉ស់",
    pronunciation: "រាស់",
    definition: "(ន.) ឈ្មោះត្រីទឹកសាបមួយប្រភេទ (Snakehead fish).",
    homophones: [
      { word: "រាស់", definition: "រាស់ដី", pronunciation: "រាស់" },
      { word: "រ៉ស់", definition: "ត្រីរ៉ស់", pronunciation: "រាស់" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["ត្រីរ៉ស់"],
    example: "ស្ងោរត្រីរ៉ស់។"
  },
  "រុិល": {
    word: "រុិល",
    pronunciation: "រិល",
    definition: "(គុ.) ដែលមិនមុត (Blunt/Dull).",
    homophones: [
      { word: "រុិល", definition: "មិនមុត", pronunciation: "រិល" },
      { word: "រឹល", definition: "រឹលទៅ", pronunciation: "រិល" }
    ],
    synonyms: ["ត្រង់"],
    antonyms: ["មុត"],
    relatedWords: ["កាំបិតរុិល"],
    example: "កាំបិតរុិល។"
  },
  "រឹល": {
    word: "រឹល",
    pronunciation: "រិល",
    definition: "(កិ.) ទៅមុខជានិច្ច, មិនរាថយ (To advance steadily).",
    homophones: [
      { word: "រុិល", definition: "មិនមុត", pronunciation: "រិល" },
      { word: "រឹល", definition: "រឹលទៅ", pronunciation: "រិល" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: [],
    example: "ដើររឹលទៅ។"
  },
  "រុក": {
    word: "រុក",
    pronunciation: "រុក",
    definition: "(កិ.) រុញចូល, ស៊កចូល (To push in/insert/invade).",
    homophones: [
      { word: "រុក", definition: "រុញចូល", pronunciation: "រុក" },
      { word: "រុក្ខ", definition: "ដើមឈើ", pronunciation: "រុក" }
    ],
    synonyms: ["ស៊ក"],
    antonyms: ["ដក"],
    relatedWords: ["រុកកួន"],
    example: "រុកចូលព្រៃ។"
  },
  "រុក្ខ": {
    word: "រុក្ខ",
    pronunciation: "រុក",
    definition: "(ន.) ដើមឈើ (Tree).",
    homophones: [
      { word: "រុក", definition: "រុញចូល", pronunciation: "រុក" },
      { word: "រុក្ខ", definition: "ដើមឈើ", pronunciation: "រុក" }
    ],
    synonyms: ["ដើមឈើ", "ព្រឹក្ស"],
    antonyms: [],
    relatedWords: ["រុក្ខជាតិ"],
    example: "ដាំរុក្ខជាតិ។"
  },
  "រុត": {
    word: "រុត",
    pronunciation: "រុត",
    definition: "(កិ.) រត់ (សំនៀង), បោល (To run).",
    homophones: [
      { word: "រុត", definition: "រត់", pronunciation: "រុត" },
      { word: "រុទ្ធ", definition: "បិទ / ខ្ទប់", pronunciation: "រុត" },
      { word: "រុត្តិ", definition: "សម្រែក", pronunciation: "រុត" }
    ],
    synonyms: ["រត់"],
    antonyms: [],
    relatedWords: [],
    example: "រុតរះ។"
  },
  "រុទ្ធ": {
    word: "រុទ្ធ",
    pronunciation: "រុត",
    definition: "(កិ.) បិទ, ខ្ទប់, រាំង (To block/obstruct).",
    homophones: [
      { word: "រុត", definition: "រត់", pronunciation: "រុត" },
      { word: "រុទ្ធ", definition: "បិទ / ខ្ទប់", pronunciation: "រុត" }
    ],
    synonyms: ["បិទ", "រាំង"],
    antonyms: ["បើក"],
    relatedWords: ["និរុទ្ធ"],
    example: "និរុទ្ធ។"
  },
  "រុត្តិ": {
    word: "រុត្តិ",
    pronunciation: "រុត",
    definition: "(ន.) សម្រែក, ការស្រែក (Cry/Scream).",
    homophones: [
      { word: "រុត", definition: "រត់", pronunciation: "រុត" },
      { word: "រុទ្ធ", definition: "បិទ / ខ្ទប់", pronunciation: "រុត" },
      { word: "រុត្តិ", definition: "សម្រែក", pronunciation: "រុត" }
    ],
    synonyms: ["សម្រែក"],
    antonyms: [],
    relatedWords: [],
    example: "សូររុត្តិ។"
  },
  "រុះ": {
    word: "រុះ",
    pronunciation: "រុះ",
    definition: "(កិ.) ជ្រុះចេញ, របូតចេញ (To fall off/shed).",
    homophones: [
      { word: "រុះ", definition: "ជ្រុះ", pronunciation: "រុះ" },
      { word: "រូស", definition: "បូតស្លឹក", pronunciation: "រុះ" }
    ],
    synonyms: ["ជ្រុះ"],
    antonyms: [],
    relatedWords: ["រុះរើ"],
    example: "ស្លឹកឈើរុះ។"
  },
  "រូស": {
    word: "រូស",
    pronunciation: "រុះ",
    definition: "(កិ.) បូតយកស្លឹកឬផ្លែចេញពីមែក (To strip off leaves/fruit).",
    homophones: [
      { word: "រុះ", definition: "ជ្រុះ", pronunciation: "រុះ" },
      { word: "រូស", definition: "បូតស្លឹក", pronunciation: "រុះ" }
    ],
    synonyms: ["បូត"],
    antonyms: [],
    relatedWords: [],
    example: "រូសស្លឹកអំពិល។"
  },
  "រុំ": {
    word: "រុំ",
    pronunciation: "រុំ",
    definition: "(កិ.) យកអ្វីៗមកព័ន្ធជុំវិញ (To wrap/bandage).",
    homophones: [
      { word: "រុំ", definition: "ព័ន្ធ / វេច", pronunciation: "រុំ" },
      { word: "រំ", definition: "រំលែក / រំខាន", pronunciation: "រុំ" },
      { word: "រម្យ", definition: "គួរ / ល្អ", pronunciation: "រុំ" }
    ],
    synonyms: ["ព័ន្ធ", "វេច"],
    antonyms: ["លាត"],
    relatedWords: ["រុំរបួស"],
    example: "រុំរបួស។"
  },
  "រំ": {
    word: "រំ",
    pronunciation: "រុំ",
    definition: "ពាក្យនាំមុខមានន័យថា ធ្វើឲ្យ... (Prefix meaning 'to make/cause').",
    homophones: [
      { word: "រុំ", definition: "ព័ន្ធ / វេច", pronunciation: "រុំ" },
      { word: "រំ", definition: "រំលែក / រំខាន", pronunciation: "រុំ" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["រំខាន", "រំលែក"],
    example: "កុំរំខានគេ។"
  },
  "រម្យ": {
    word: "រម្យ",
    pronunciation: "រុំ",
    definition: "(គុ.) គួរ, ល្អ, ជាទីរីករាយ (Pleasant/Delightful).",
    homophones: [
      { word: "រុំ", definition: "ព័ន្ធ / វេច", pronunciation: "រុំ" },
      { word: "រម្យ", definition: "គួរ / ល្អ", pronunciation: "រុំ" }
    ],
    synonyms: ["ល្អ", "សម"],
    antonyms: [],
    relatedWords: ["សមរម្យ", "អារម្មណ៍"],
    example: "សមរម្យ។"
  },
  "រំលិច": {
    word: "រំលិច",
    pronunciation: "រំ-លិច",
    definition: "(កិ.) ធ្វើឲ្យលិច, បំបាត់ (To submerge/suppress).",
    homophones: [
      { word: "រំលិច", definition: "ធ្វើឲ្យលិច", pronunciation: "រំ-លិច" },
      { word: "រំលេច", definition: "ធ្វើឲ្យលេច / បញ្ចេញ", pronunciation: "រំ-លិច" }
    ],
    synonyms: ["បំបាត់"],
    antonyms: ["រំលេច"],
    relatedWords: [],
    example: "រំលិចទុក្ខ។"
  },
  "រំលេច": {
    word: "រំលេច",
    pronunciation: "រំ-លិច",
    definition: "(កិ.) ធ្វើឲ្យលេចធ្លោ, បញ្ចេញពណ៌ (To highlight/embellish).",
    homophones: [
      { word: "រំលិច", definition: "ធ្វើឲ្យលិច", pronunciation: "រំ-លិច" },
      { word: "រំលេច", definition: "ធ្វើឲ្យលេច / បញ្ចេញ", pronunciation: "រំ-លិច" }
    ],
    synonyms: ["បញ្ចេញ"],
    antonyms: ["រំលិច"],
    relatedWords: ["រំលេចពណ៌"],
    example: "រំលេចពណ៌។"
  },
  "រោច": {
    word: "រោច",
    pronunciation: "រោច",
    definition: "(ន.) ថ្ងៃបន្ទាប់ពីពេញបូណ៌មី (Waning moon).",
    homophones: [
      { word: "រោច", definition: "ថ្ងៃរោច", pronunciation: "រោច" },
      { word: "រោចន៍", definition: "ពន្លឺ / រស្មី", pronunciation: "រោច" }
    ],
    synonyms: ["ខ្នើត (Antonym: Waxing)"],
    antonyms: ["កើត"],
    relatedWords: ["១រោច"],
    example: "ថ្ងៃ ១ រោច។"
  },
  "រោចន៍": {
    word: "រោចន៍",
    pronunciation: "រោច",
    definition: "(ន.) ពន្លឺ, រស្មី, ការពេញចិត្ត (Light/Luster).",
    homophones: [
      { word: "រោច", definition: "ថ្ងៃរោច", pronunciation: "រោច" },
      { word: "រោចន៍", definition: "ពន្លឺ / រស្មី", pronunciation: "រោច" }
    ],
    synonyms: ["ពន្លឺ"],
    antonyms: [],
    relatedWords: ["វិរោចន៍"],
    example: "វិរោចន៍។"
  },
  "របោះ": {
    word: "របោះ",
    pronunciation: "រ-បោះ",
    definition: "(គុ.) ដែលមិនញឹក, ដែលឃ្លាតៗ (Sparse/Thin).",
    homophones: [
      { word: "របោះ", definition: "មិនញឹក", pronunciation: "រ-បោះ" },
      { word: "របស់", definition: "វត្ថុ / ទ្រព្យ", pronunciation: "រ-បស់" }
    ],
    synonyms: ["ឃ្លាត"],
    antonyms: ["ញឹក"],
    relatedWords: ["របោះៗ"],
    example: "ស្មៅដុះរបោះ។"
  },
  "របស់": {
    word: "របស់",
    pronunciation: "រ-បស់",
    definition: "១. (ន.) វត្ថុ, ទ្រព្យ (Thing/Object). ២. (និ.) នៃ (កម្មសិទ្ធិ) (Of/Belonging to).",
    homophones: [
      { word: "របោះ", definition: "មិនញឹក", pronunciation: "រ-បោះ" },
      { word: "របស់", definition: "វត្ថុ / ទ្រព្យ", pronunciation: "រ-បស់" }
    ],
    synonyms: ["វត្ថុ"],
    antonyms: [],
    relatedWords: ["របស់របរ"],
    example: "របស់ខ្ញុំ។"
  },
  "រឹង": {
    word: "រឹង",
    pronunciation: "រឹង",
    definition: "(គុ.) ដែលមិនទន់, ក្ដាំង (Hard/Stiff).",
    homophones: [
      { word: "រឹង", definition: "មិនទន់", pronunciation: "រឹង" },
      { word: "រុឹង", definition: "តឹង / ណែន", pronunciation: "រឹង" }
    ],
    synonyms: ["ក្ដាំង"],
    antonyms: ["ទន់"],
    relatedWords: ["រឹងមាំ"],
    example: "ឈើរឹង។"
  },
  "រុឹង": {
    word: "រុឹង",
    pronunciation: "រឹង",
    definition: "(គុ.) តឹង, ណែន, ខាំ (Tight/Firm).",
    homophones: [
      { word: "រឹង", definition: "មិនទន់", pronunciation: "រឹង" },
      { word: "រុឹង", definition: "តឹង / ណែន", pronunciation: "រឹង" }
    ],
    synonyms: ["តឹង"],
    antonyms: ["ធូរ"],
    relatedWords: [],
    example: "ចងរុឹង។"
  },
  "រាំ": {
    word: "រាំ",
    pronunciation: "រាំ",
    definition: "(កិ.) ធ្វើកាយវិការតាមចង្វាក់ភ្លេង (To dance).",
    homophones: [
      { word: "រាំ", definition: "រាំលេង", pronunciation: "រាំ" },
      { word: "រម្មណ៍", definition: "អារម្មណ៍ (សូរជិត)", pronunciation: "រាំ" }
    ],
    synonyms: ["នារ"],
    antonyms: [],
    relatedWords: ["រាំវង់"],
    example: "រាំលេង។"
  },
  "រម្មណ៍": {
    word: "រម្មណ៍",
    pronunciation: "រាំ",
    definition: "(ន.) អារម្មណ៍, ការត្រេកអរ (Emotion/Delight - usually combined as អារម្មណ៍).",
    homophones: [
      { word: "រាំ", definition: "រាំលេង", pronunciation: "រាំ" },
      { word: "រម្មណ៍", definition: "អារម្មណ៍", pronunciation: "រាំ" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["អារម្មណ៍"],
    example: "អារម្មណ៍។"
  },
  "រៀបរប": {
    word: "រៀបរប",
    pronunciation: "រៀប-រាប់",
    definition: "(កិ.) រៀបចំឲ្យមានរបៀប (To arrange/organize).",
    homophones: [
      { word: "រៀបរប", definition: "រៀបចំ", pronunciation: "រៀប-រាប់" },
      { word: "រៀបរាប់", definition: "និយាយប្រាប់", pronunciation: "រៀប-រាប់" }
    ],
    synonyms: ["រៀបចំ"],
    antonyms: [],
    relatedWords: [],
    example: "រៀបរបផ្ទះ។"
  },
  "រៀបរាប់": {
    word: "រៀបរាប់",
    pronunciation: "រៀប-រាប់",
    definition: "(កិ.) និយាយប្រាប់ដំណើររឿង (To narrate/describe).",
    homophones: [
      { word: "រៀបរប", definition: "រៀបចំ", pronunciation: "រៀប-រាប់" },
      { word: "រៀបរាប់", definition: "និយាយប្រាប់", pronunciation: "រៀប-រាប់" }
    ],
    synonyms: ["ពណ៌នា"],
    antonyms: [],
    relatedWords: [],
    example: "រៀបរាប់រឿង។"
  },
  "លក់": {
    word: "លក់",
    pronunciation: "លក់",
    definition: "១. (កិ.) ដូរយកប្រាក់ (To sell). ២. (កិ.) ដេកលក់ (To sleep).",
    homophones: [
      { word: "លក់", definition: "លក់ដូរ / ដេកលក់", pronunciation: "លក់" },
      { word: "លក្ខណ៍", definition: "លក្ខណៈ", pronunciation: "លាក់" },
      { word: "ល័ក្ត", definition: "ជ័រល័ក្ត", pronunciation: "លាក់" },
      { word: "ល័ក្ខ", definition: "ល័ក្ត (សរសេរផ្សេង)", pronunciation: "លាក់" },
      { word: "លក្ម្សណ៍", definition: "លក្ខណៈ (សំស្ក្រឹត)", pronunciation: "លាក់" }
    ],
    synonyms: ["ដូរ"],
    antonyms: ["ទិញ", "ភ្ញាក់"],
    relatedWords: ["លក់ដូរ", "ដេកលក់"],
    example: "លក់អីវ៉ាន់។"
  },
  "ល័ក្ត": {
    word: "ល័ក្ត",
    pronunciation: "លាក់",
    definition: "(ន.) ជ័រក្រហមសម្រាប់ជ្រលក់ (Lac/Sealing wax).",
    homophones: [
      { word: "លក់", definition: "លក់ដូរ / ដេកលក់", pronunciation: "លក់" },
      { word: "លក្ខណ៍", definition: "លក្ខណៈ", pronunciation: "លាក់" },
      { word: "ល័ក្ត", definition: "ជ័រល័ក្ត", pronunciation: "លាក់" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["លាបល័ក្ត"],
    example: "ធ្មេញលាបល័ក្ត។"
  },
  "ល័ក្ខ": {
    word: "ល័ក្ខ",
    pronunciation: "លាក់",
    definition: "(ន.) ល័ក្ត (写法ផ្សេង) (Lac).",
    homophones: [
      { word: "ល័ក្ត", definition: "ជ័រល័ក្ត", pronunciation: "លាក់" },
      { word: "ល័ក្ខ", definition: "ល័ក្ត", pronunciation: "លាក់" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: [],
    example: "ល័ក្ខ។"
  },
  "លក្ម្សណ៍": {
    word: "លក្ម្សណ៍",
    pronunciation: "លាក់",
    definition: "(ន.) លក្ខណៈ, និមិត្តសញ្ញា (Sanskrit: Laksmana).",
    homophones: [
      { word: "លក្ខណ៍", definition: "លក្ខណៈ", pronunciation: "លាក់" },
      { word: "លក្ម្សណ៍", definition: "លក្ខណៈ", pronunciation: "លាក់" }
    ],
    synonyms: ["លក្ខណៈ"],
    antonyms: [],
    relatedWords: [],
    example: "ព្រះលក្ម្សណ៍។"
  },
  "លៀប": {
    word: "លៀប",
    pronunciation: "លាប",
    definition: "(កិ.) លាប (ភាសានិយាយខ្លះ).",
    homophones: [
      { word: "លាប", definition: "ត្រដុស / លាបពណ៌", pronunciation: "លាប" },
      { word: "លៀប", definition: "លាប", pronunciation: "លាប" }
    ],
    synonyms: ["លាប"],
    antonyms: [],
    relatedWords: [],
    example: "លៀបម្សៅ។"
  },
  "លង់": {
    word: "លង់",
    pronunciation: "លង់",
    definition: "(កិ.) ចុះក្នុងទឹកងើបមិនរួច, វង្វេង (To drown/sink).",
    homophones: [
      { word: "លង់", definition: "លិចទឹក", pronunciation: "លង់" },
      { word: "លុង", definition: "ជីក / ហឹបសព", pronunciation: "លុង" }
    ],
    synonyms: ["លិច"],
    antonyms: ["អណ្តែត"],
    relatedWords: ["លង់ទឹក", "លង់ស្នេហ៍"],
    example: "ក្មេងលង់ទឹក។"
  },
  "លុង": {
    word: "លុង",
    pronunciation: "លុង",
    definition: "១. (កិ.) ជីកឲ្យជ្រៅ (To excavate/hollow out). ២. (ន.) ហឹបសម្រាប់ដាក់សព (Coffin).",
    homophones: [
      { word: "លង់", definition: "លិចទឹក", pronunciation: "លង់" },
      { word: "លុង", definition: "ជីក / ហឹបសព", pronunciation: "លុង" }
    ],
    synonyms: ["ជីក"],
    antonyms: [],
    relatedWords: ["ក្តារលុង"],
    example: "លុងវង់។"
  },
  "លន់": {
    word: "លន់",
    pronunciation: "លន់",
    definition: "(កិ.) លុត, ក្រាប (To prostrate/kneel).",
    homophones: [
      { word: "លន់", definition: "លុត / ក្រាប", pronunciation: "លន់" },
      { word: "លុន", definition: "ឈ្មោះលុន", pronunciation: "លន់" }
    ],
    synonyms: ["លុត"],
    antonyms: [],
    relatedWords: ["លន់តួ"],
    example: "លន់តួ។"
  },
  "លុន": {
    word: "លុន",
    pronunciation: "លន់",
    definition: "(ន.) ឈ្មោះមនុស្សប្រុស។",
    homophones: [
      { word: "លន់", definition: "លុត / ក្រាប", pronunciation: "លន់" },
      { word: "លុន", definition: "ឈ្មោះលុន", pronunciation: "លន់" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: [],
    example: "តាលុន។"
  },
  "លប់": {
    word: "លប់",
    pronunciation: "លប់",
    definition: "១. (កិ.) គ្របពីលើ, ចាក់ដីបំពេញ (To fill/cover). ២. (ន.) ឧបករណ៍ចាប់ត្រី (Fish trap).",
    homophones: [
      { word: "លប់", definition: "ចាក់ដីបំពេញ / លប់ត្រី", pronunciation: "លប់" },
      { word: "លុប", definition: "លាង / កោសចេញ", pronunciation: "លុប" }
    ],
    synonyms: ["បំពេញ", "គ្រប"],
    antonyms: ["ជីក"],
    relatedWords: ["លប់បឹង"],
    example: "លប់អណ្តូង។"
  },
  "លុប": {
    word: "លុប",
    pronunciation: "លុប",
    definition: "(កិ.) ធ្វើឲ្យបាត់ស្នាម, លាង (To erase/wash).",
    homophones: [
      { word: "លប់", definition: "ចាក់ដីបំពេញ / លប់ត្រី", pronunciation: "លប់" },
      { word: "លុប", definition: "លាង / កោសចេញ", pronunciation: "លុប" }
    ],
    synonyms: ["លាង", "កោស"],
    antonyms: ["សរសេរ"],
    relatedWords: ["លុបមុខ", "លុបចោល"],
    example: "លុបមុខ។"
  },
  "លោះ": {
    word: "លោះ",
    pronunciation: "លោះ",
    definition: "(កិ.) យកប្រាក់ទៅបង់ដើម្បីយករបស់មកវិញ, ដោះ (To redeem/ransom).",
    homophones: [
      { word: "លោះ", definition: "លោះរបស់", pronunciation: "លោះ" },
      { word: "លស់", definition: "ថយ / ខាត", pronunciation: "លោះ" },
      { word: "លួស", definition: "ខ្សែលោហៈ", pronunciation: "លោះ" }
    ],
    synonyms: ["ដោះ"],
    antonyms: [],
    relatedWords: ["លោះព្រលឹង"],
    example: "លោះម៉ូតូ។"
  },
  "លស់": {
    word: "លស់",
    pronunciation: "លោះ",
    definition: "(កិ.) ថយ, មិនគ្រប់, ខាត (To diminish/lose).",
    homophones: [
      { word: "លោះ", definition: "លោះរបស់", pronunciation: "លោះ" },
      { word: "លស់", definition: "ថយ / ខាត", pronunciation: "លោះ" },
      { word: "លួស", definition: "ខ្សែលោហៈ", pronunciation: "លោះ" }
    ],
    synonyms: ["ថយ", "ខាត"],
    antonyms: ["ចំណេញ"],
    relatedWords: [],
    example: "លក់លស់។"
  },
  "លួស": {
    word: "លួស",
    pronunciation: "លោះ",
    definition: "(ន.) ខ្សែលោហៈ (Wire).",
    homophones: [
      { word: "លោះ", definition: "លោះរបស់", pronunciation: "លោះ" },
      { word: "លស់", definition: "ថយ / ខាត", pronunciation: "លោះ" },
      { word: "លួស", definition: "ខ្សែលោហៈ", pronunciation: "លោះ" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["ខ្សែលួស"],
    example: "របងលួស។"
  },
  "លាង": {
    word: "លាង",
    pronunciation: "លាង",
    definition: "(កិ.) ធ្វើឲ្យស្អាតដោយទឹក (To wash/clean).",
    homophones: [
      { word: "លាង", definition: "សម្អាត", pronunciation: "លាង" },
      { word: "លៀង", definition: "ជប់លៀង", pronunciation: "លៀង" }
    ],
    synonyms: ["សម្អាត"],
    antonyms: [],
    relatedWords: ["លាងចាន"],
    example: "លាងដៃ។"
  },
  "លៀង": {
    word: "លៀង",
    pronunciation: "លៀង",
    definition: "(កិ.) ផ្តល់អាហារ, ជប់លៀង (To feast/treat).",
    homophones: [
      { word: "លាង", definition: "សម្អាត", pronunciation: "លាង" },
      { word: "លៀង", definition: "ជប់លៀង", pronunciation: "លៀង" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["ជប់លៀង"],
    example: "ពិធីជប់លៀង។"
  },
  "លុត": {
    word: "លុត",
    pronunciation: "លុត",
    definition: "(កិ.) ដាក់លោហៈដុតភ្លើងឲ្យទន់ (To temper/anneal).",
    homophones: [
      { word: "លុត", definition: "ដុតដែក", pronunciation: "លុត" },
      { word: "លត់", definition: "ពន្លត់", pronunciation: "លុត" },
      { word: "លុត្ត", definition: "លុត្តរ", pronunciation: "លុត" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["លុតដែក"],
    example: "ជាងលុតដែក។"
  },
  "លត់": {
    word: "លត់",
    pronunciation: "លុត",
    definition: "(កិ.) ពន្លត់, បំបាត់ (To extinguish/suppress).",
    homophones: [
      { word: "លុត", definition: "ដុតដែក", pronunciation: "លុត" },
      { word: "លត់", definition: "ពន្លត់", pronunciation: "លុត" }
    ],
    synonyms: ["ពន្លត់"],
    antonyms: ["ដុត"],
    relatedWords: ["លត់ដំ"],
    example: "លត់ដំខ្លួន។"
  },
  "លុត្ត": {
    word: "លុត្ត",
    pronunciation: "លុត",
    definition: "(គុ.) ដែលនៅខាងលើ, ឧត្តម (Upper/Superior - in លុត្តរ).",
    homophones: [
      { word: "លុត", definition: "ដុតដែក", pronunciation: "លុត" },
      { word: "លុត្ត", definition: "លុត្តរ", pronunciation: "លុត" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["លុត្តរ"],
    example: "លុត្តរ។"
  },
  "លាប់": {
    word: "លាប់",
    pronunciation: "លាប់",
    definition: "(កិ.) ត្រឡប់មកឈឺវិញ (To relapse).",
    homophones: [
      { word: "លាប់", definition: "ឈឺឡើងវិញ", pronunciation: "លាប់" },
      { word: "ឡប់", definition: "ឡប់សតិ / ត្រឡប់", pronunciation: "ឡប់" }
    ],
    synonyms: [],
    antonyms: ["ជា"],
    relatedWords: ["លាប់ជំងឺ"],
    example: "ជំងឺលាប់។"
  },
  "ឡប់": {
    word: "ឡប់",
    pronunciation: "ឡប់",
    definition: "(កិ.) ត្រឡប់, វិលវិញ; ឡប់សតិ (To return/be delirious).",
    homophones: [
      { word: "លាប់", definition: "ឈឺឡើងវិញ", pronunciation: "លាប់" },
      { word: "ឡប់", definition: "ឡប់សតិ / ត្រឡប់", pronunciation: "ឡប់" }
    ],
    synonyms: ["ត្រឡប់"],
    antonyms: [],
    relatedWords: ["ឡប់ៗ"],
    example: "មនុស្សឡប់ៗ។"
  },
  "លិទ្ធ": {
    word: "លិទ្ធ",
    pronunciation: "លិត",
    definition: "(កិ.) ប្រើអណ្តាតប៉ះ (To lick).",
    homophones: [
      { word: "លិទ្ធ", definition: "លិទ្ធ", pronunciation: "លិត" },
      { word: "លិឍ", definition: "លិទ្ធ (បាលី)", pronunciation: "លិត" },
      { word: "លិត", definition: "លិទ្ធ (សរសេរខ្លះ)", pronunciation: "លិត" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: [],
    example: "ឆ្កែលិទ្ធជើង។"
  },
  "លិឍ": {
    word: "លិឍ",
    pronunciation: "លិត",
    definition: "(កិ.) លិទ្ធ (បាលី).",
    homophones: [
      { word: "លិទ្ធ", definition: "លិទ្ធ", pronunciation: "លិត" },
      { word: "លិឍ", definition: "លិទ្ធ (បាលី)", pronunciation: "លិត" }
    ],
    synonyms: ["លិទ្ធ"],
    antonyms: [],
    relatedWords: [],
    example: "លិឍ។"
  },
  "លិត": {
    word: "លិត",
    pronunciation: "លិត",
    definition: "(កិ.) លិទ្ធ.",
    homophones: [
      { word: "លិទ្ធ", definition: "លិទ្ធ", pronunciation: "លិត" },
      { word: "លិត", definition: "លិទ្ធ", pronunciation: "លិត" }
    ],
    synonyms: ["លិទ្ធ"],
    antonyms: [],
    relatedWords: [],
    example: "លិត។"
  },
  "លួង": {
    word: "លួង",
    pronunciation: "លួង",
    definition: "(កិ.) និយាយឲ្យបាត់ទុក្ខ ឬបាត់ខឹង (To console/soothe).",
    homophones: [
      { word: "លួង", definition: "លួងលោម", pronunciation: "លួង" },
      { word: "ហ្លួង", definition: "ស្តេច", pronunciation: "លួង" }
    ],
    synonyms: ["លោម"],
    antonyms: [],
    relatedWords: ["លួងលោម"],
    example: "លួងកូន។"
  },
  "ហ្លួង": {
    word: "ហ្លួង",
    pronunciation: "លួង",
    definition: "(ន.) ព្រះមហាក្សត្រ, ស្តេច (King/Royal - Thai loanword).",
    homophones: [
      { word: "លួង", definition: "លួងលោម", pronunciation: "លួង" },
      { word: "ហ្លួង", definition: "ស្តេច", pronunciation: "លួង" }
    ],
    synonyms: ["ស្តេច", "ក្សត្រ"],
    antonyms: ["រាស្ត្រ"],
    relatedWords: [],
    example: "ស្តេចហ្លួង។"
  },
  "លេស": {
    word: "លេស",
    pronunciation: "លេស",
    definition: "(ន.) ហេតុសម្រាប់ដោះខ្លួន, ឧបាយ (Excuse/Pretext).",
    homophones: [
      { word: "លេស", definition: "លេសដោះខ្លួន", pronunciation: "លេស" },
      { word: "លេះ", definition: "បេះ / េះ", pronunciation: "លេះ" }
    ],
    synonyms: ["ល្បិច"],
    antonyms: [],
    relatedWords: [],
    example: "រកលេស។"
  },
  "លេះ": {
    word: "លេះ",
    pronunciation: "លេស",
    definition: "(កិ.) បេះយកសាច់ចេញ (To pick meat off bone).",
    homophones: [
      { word: "លេស", definition: "លេសដោះខ្លួន", pronunciation: "លេស" },
      { word: "លេះ", definition: "បេះ / េះ", pronunciation: "លេះ" }
    ],
    synonyms: ["បេះ"],
    antonyms: [],
    relatedWords: ["លេះសាច់"],
    example: "លេះសាច់ត្រី។"
  },
  "ល្បះ": {
    word: "ល្បះ",
    pronunciation: "ល្បះ",
    definition: "(កិ.) ងើបឡើង, បះឡើង (To rise/rebel).",
    homophones: [
      { word: "ល្បះ", definition: "ងើប / បះ", pronunciation: "ល្បះ" },
      { word: "ល្បាស់", definition: "ត្រួយ / លាស់", pronunciation: "ល្បាស់" }
    ],
    synonyms: ["បះ"],
    antonyms: [],
    relatedWords: [],
    example: "ចោរល្បះ។"
  },
  "ល្បាស់": {
    word: "ល្បាស់",
    pronunciation: "ល្បះ",
    definition: "(ន.) ត្រួយដែលទើបនឹងលាស់ (Sprout/Shoot).",
    homophones: [
      { word: "ល្បះ", definition: "ងើប / បះ", pronunciation: "ល្បះ" },
      { word: "ល្បាស់", definition: "ត្រួយ / លាស់", pronunciation: "ល្បាស់" }
    ],
    synonyms: ["ត្រួយ"],
    antonyms: [],
    relatedWords: ["លាស់"],
    example: "ល្បាស់ឈើ។"
  },
  "វង់": {
    word: "វង់",
    pronunciation: "វង់",
    definition: "(ន.) រង្វង់, ក្រុម (Circle/Band/Group).",
    homophones: [
      { word: "វង់", definition: "រង្វង់ / ក្រុម", pronunciation: "វង់" },
      { word: "វង្ស", definition: "ពូជ / ត្រកូល", pronunciation: "វង់" }
    ],
    synonyms: ["រង្វង់", "ក្រុម"],
    antonyms: [],
    relatedWords: ["វង់ភ្លេង"],
    example: "វង់តន្ត្រី។"
  },
  "វង្ស": {
    word: "វង្ស",
    pronunciation: "វង់",
    definition: "(ន.) ត្រកូល, ពូជ, ខ្សែស្រឡាយ (Lineage/Family/Dynasty).",
    homophones: [
      { word: "វង់", definition: "រង្វង់ / ក្រុម", pronunciation: "វង់" },
      { word: "វង្ស", definition: "ពូជ / ត្រកូល", pronunciation: "វង់" }
    ],
    synonyms: ["ត្រកូល", "ពូជ"],
    antonyms: [],
    relatedWords: ["វង្សត្រកូល"],
    example: "រក្សាវង្សត្រកូល។"
  },
  "វន្ត": {
    word: "វន្ត",
    pronunciation: "វ័ន",
    definition: "ពាក្យសម្រាប់តភ្ជាប់មានន័យថា មាន (Suffix: Possessing).",
    homophones: [
      { word: "វន្ត", definition: "មាន", pronunciation: "វ័ន" },
      { word: "វ័ន", definition: "ព្រៃ", pronunciation: "វ័ន" },
      { word: "វាន់", definition: "វាយ / ព័ទ្ធ", pronunciation: "វ័ន" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["ភគវន្ត"],
    example: "ភគវន្ត។"
  },
  "វ័ន": {
    word: "វ័ន",
    pronunciation: "វ័ន",
    definition: "(ន.) ព្រៃ (Forest - Sanskrit: Vana).",
    homophones: [
      { word: "វន្ត", definition: "មាន", pronunciation: "វ័ន" },
      { word: "វ័ន", definition: "ព្រៃ", pronunciation: "វ័ន" },
      { word: "វាន់", definition: "វាយ / ព័ទ្ធ", pronunciation: "វ័ន" }
    ],
    synonyms: ["ព្រៃ"],
    antonyms: [],
    relatedWords: ["វន"],
    example: "ហិមវ័ន។"
  },
  "វាន់": {
    word: "វាន់",
    pronunciation: "វ័ន",
    definition: "(កិ.) វាយ, ព័ទ្ធខ្សែ (To beat/whip/bind).",
    homophones: [
      { word: "វន្ត", definition: "មាន", pronunciation: "វ័ន" },
      { word: "វ័ន", definition: "ព្រៃ", pronunciation: "វ័ន" },
      { word: "វាន់", definition: "វាយ / ព័ទ្ធ", pronunciation: "វ័ន" }
    ],
    synonyms: ["វាយ", "ព័ទ្ធ"],
    antonyms: [],
    relatedWords: [],
    example: "វាន់មួយខ្សែ។"
  },
  "វត្ស": {
    word: "វត្ស",
    pronunciation: "វត្ត",
    definition: "១. (ន.) ឆ្នាំ (Year). ២. (ន.) កូនគោ (Calf).",
    homophones: [
      { word: "វត្ត", definition: "អារាម / វត្ត", pronunciation: "វត្ត" },
      { word: "វត្ស", definition: "ឆ្នាំ / កូនគោ", pronunciation: "វត្ត" }
    ],
    synonyms: ["ឆ្នាំ"],
    antonyms: [],
    relatedWords: ["សហស្សវត្ស"],
    example: "សហស្សវត្ស។"
  },
  "វ័ធ": {
    word: "វ័ធ",
    pronunciation: "វត្ត",
    definition: "(កិ. ឬ ន.) ការសម្លាប់, អាវុធ (Killing/Weapon).",
    homophones: [
      { word: "វត្ត", definition: "អារាម / វត្ត", pronunciation: "វត្ត" },
      { word: "វ័ធ", definition: "សម្លាប់", pronunciation: "វត្ត" }
    ],
    synonyms: ["សម្លាប់"],
    antonyms: [],
    relatedWords: ["អាវុធ"],
    example: "វ័ធ។"
  },
  "វត្ថ": {
    word: "វត្ថ",
    pronunciation: "វត្ត",
    definition: "(ន.) សំពត់, ក្រណាត់ (Cloth/Garment - Pali).",
    homophones: [
      { word: "វត្ត", definition: "អារាម / វត្ត", pronunciation: "វត្ត" },
      { word: "វត្ថ", definition: "សំពត់", pronunciation: "វត្ត" }
    ],
    synonyms: ["សំពត់"],
    antonyms: [],
    relatedWords: [],
    example: "វត្ថ។"
  },
  "វដ្ត": {
    word: "វដ្ត",
    pronunciation: "វត្ត",
    definition: "(ន.) រង្វង់, ដំណើរវិលវល់ (Cycle/Circle).",
    homophones: [
      { word: "វត្ត", definition: "អារាម / វត្ត", pronunciation: "វត្ត" },
      { word: "វដ្ត", definition: "រង្វង់ / ដំណើរ", pronunciation: "វត្ត" }
    ],
    synonyms: ["រង្វង់"],
    antonyms: [],
    relatedWords: ["វដ្តសង្សារ"],
    example: "វដ្តសង្សារ។"
  },
  "វឌ្ឍន៍": {
    word: "វឌ្ឍន៍",
    pronunciation: "វត្ត",
    definition: "(ន.) សេចក្តីចម្រើន, លូតលាស់ (Prosperity/Growth).",
    homophones: [
      { word: "វត្ត", definition: "អារាម / វត្ត", pronunciation: "វត្ត" },
      { word: "វឌ្ឍន៍", definition: "ចម្រើន", pronunciation: "វត្ត" }
    ],
    synonyms: ["ចម្រើន"],
    antonyms: ["វិនាស"],
    relatedWords: ["អភិវឌ្ឍន៍"],
    example: "សិរីវឌ្ឍន៍។"
  },
  "វាត់": {
    word: "វាត់",
    pronunciation: "វត្ត",
    definition: "(កិ.) ក្រវាស, វាយដោយរំពាត់ (To lash/whip).",
    homophones: [
      { word: "វត្ត", definition: "អារាម / វត្ត", pronunciation: "វត្ត" },
      { word: "វាត់", definition: "វាយ / ក្រវាស", pronunciation: "វត្ត" }
    ],
    synonyms: ["វាយ"],
    antonyms: [],
    relatedWords: [],
    example: "វាត់កន្ទុយ។"
  },
  "វត្តន៍": {
    word: "វត្តន៍",
    pronunciation: "វត្ត",
    definition: "(ន.) ការប្រព្រឹត្តទៅ, ដំណើរ (Conduct/Course).",
    homophones: [
      { word: "វត្ត", definition: "អារាម / វត្ត", pronunciation: "វត្ត" },
      { word: "វត្តន៍", definition: "ការប្រព្រឹត្ត", pronunciation: "វត្ត" }
    ],
    synonyms: ["ដំណើរ"],
    antonyms: [],
    relatedWords: ["វិវត្តន៍"],
    example: "វិវត្តន៍។"
  },
  "វាយ": {
    word: "វាយ",
    pronunciation: "វាយ",
    definition: "(កិ.) ធ្វើឲ្យឈឺចាប់ដោយដៃ ឬដោយវត្ថុ (To hit/beat/strike).",
    homophones: [
      { word: "វាយ", definition: "វាយតប់", pronunciation: "វាយ" },
      { word: "វៃ", definition: "ឆ្លាត (សូរជិត)", pronunciation: "វៃ" }
    ],
    synonyms: ["តប់", "ដំ"],
    antonyms: ["អង្អែល"],
    relatedWords: ["វាយប្រហារ"],
    example: "វាយស្គរ។"
  },
  "វ៉ៃ": {
    word: "វ៉ៃ",
    pronunciation: "វៃ",
    definition: "(កិ.) វាយ (ភាសានិយាយ/គ្រាមភាសា) (To hit - colloquial).",
    homophones: [
      { word: "វ័យ", definition: "អាយុ", pronunciation: "វៃ" },
      { word: "វៃ", definition: "ឆ្លាត / រហ័ស", pronunciation: "វៃ" },
      { word: "វ៉ៃ", definition: "វាយ (ភាសានិយាយ)", pronunciation: "វៃ" }
    ],
    synonyms: ["វាយ"],
    antonyms: [],
    relatedWords: [],
    example: "វ៉ៃគ្នា។"
  },
  "វាត": {
    word: "វាត",
    pronunciation: "វាត",
    definition: "(កិ.) ពង្រីក, លាតសន្ធឹង (To expand/extend).",
    homophones: [
      { word: "វាត", definition: "ពង្រីក / លាត", pronunciation: "វាត" },
      { word: "វាទ", definition: "ពាក្យ / មតិ", pronunciation: "វាត" }
    ],
    synonyms: ["ពង្រីក"],
    antonyms: ["បង្រួម"],
    relatedWords: ["វាតទី"],
    example: "វាតទី។"
  },
  "វាទ": {
    word: "វាទ",
    pronunciation: "វាត",
    definition: "(ន.) ពាក្យពោល, មតិ, ទ្រឹស្តី (Word/Doctrine/Theory).",
    homophones: [
      { word: "វាត", definition: "ពង្រីក / លាត", pronunciation: "វាត" },
      { word: "វាទ", definition: "ពាក្យ / មតិ", pronunciation: "វាត" }
    ],
    synonyms: ["មតិ", "ទ្រឹស្តី"],
    antonyms: [],
    relatedWords: ["ឱវាទ", "វិវាទ"],
    example: "ឱវាទ។"
  },
  "វិច": {
    word: "វិច",
    pronunciation: "វិច",
    definition: "(កិ.) វេច (សំនៀង) (To wrap).",
    homophones: [
      { word: "វិច", definition: "វេច", pronunciation: "វិច" },
      { word: "វេច", definition: "ខ្ចប់", pronunciation: "វេច" },
      { word: "វេជ្ជ", definition: "គ្រូពេទ្យ", pronunciation: "វេច" },
      { word: "វេច្ច", definition: "ដែលត្រូវវេច", pronunciation: "វេច" }
    ],
    synonyms: ["វេច"],
    antonyms: [],
    relatedWords: [],
    example: "វិចបាយ។"
  },
  "វេច": {
    word: "វេច",
    pronunciation: "វេច",
    definition: "(កិ.) ខ្ចប់ដោយស្លឹក ឬក្រណាត់ (To wrap/pack).",
    homophones: [
      { word: "វិច", definition: "វេច", pronunciation: "វិច" },
      { word: "វេច", definition: "ខ្ចប់", pronunciation: "វេច" },
      { word: "វេជ្ជ", definition: "គ្រូពេទ្យ", pronunciation: "វេច" },
      { word: "វេច្ច", definition: "ដែលត្រូវវេច", pronunciation: "វេច" }
    ],
    synonyms: ["ខ្ចប់"],
    antonyms: ["លាត"],
    relatedWords: ["វេចខ្ចប់"],
    example: "វេចបាយ។"
  },
  "វេជ្ជ": {
    word: "វេជ្ជ",
    pronunciation: "វេច",
    definition: "(ន.) គ្រូពេទ្យ, អ្នកចេះថ្នាំ (Doctor/Physician).",
    homophones: [
      { word: "វិច", definition: "វេច", pronunciation: "វិច" },
      { word: "វេច", definition: "ខ្ចប់", pronunciation: "វេច" },
      { word: "វេជ្ជ", definition: "គ្រូពេទ្យ", pronunciation: "វេច" }
    ],
    synonyms: ["គ្រូពេទ្យ"],
    antonyms: [],
    relatedWords: ["វេជ្ជបណ្ឌិត"],
    example: "វេជ្ជបណ្ឌិត។"
  },
  "វេច្ច": {
    word: "វេច្ច",
    pronunciation: "វេច",
    definition: "(គុ.) ដែលគប្បីវេច, ដែលត្រូវខ្ចប់ (To be wrapped).",
    homophones: [
      { word: "វេច", definition: "ខ្ចប់", pronunciation: "វេច" },
      { word: "វេច្ច", definition: "ដែលត្រូវវេច", pronunciation: "វេច" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: [],
    example: "វេច្ចភណ្ឌ។"
  },
  "វិញ": {
    word: "វិញ",
    pronunciation: "វិញ",
    definition: "(និ.) ត្រឡប់, សារជាថ្មី (Back/Again).",
    homophones: [
      { word: "វិញ", definition: "ត្រឡប់", pronunciation: "វិញ" },
      { word: "វេញ", definition: "បង្វិលខ្សែ", pronunciation: "វិញ" }
    ],
    synonyms: ["ត្រឡប់"],
    antonyms: [],
    relatedWords: ["ទៅវិញ"],
    example: "ត្រឡប់ទៅវិញ។"
  },
  "វេញ": {
    word: "វេញ",
    pronunciation: "វិញ",
    definition: "(កិ.) បង្វិលខ្សែឬសរសៃឲ្យចូលគ្នា (To twist/twine).",
    homophones: [
      { word: "វិញ", definition: "ត្រឡប់", pronunciation: "វិញ" },
      { word: "វេញ", definition: "បង្វិលខ្សែ", pronunciation: "វិញ" }
    ],
    synonyms: ["បង្វិល"],
    antonyms: [],
    relatedWords: ["វេញខ្សែ"],
    example: "វេញខ្សែគោ។"
  },
  "វាច": {
    word: "វាច",
    pronunciation: "វាច",
    definition: "(ន.) សម្តី, ពាក្យ (Word/Speech).",
    homophones: [
      { word: "វាច", definition: "សម្តី", pronunciation: "វាច" },
      { word: "វៀច", definition: "កោង / មិនត្រង់", pronunciation: "វៀច" }
    ],
    synonyms: ["សម្តី"],
    antonyms: [],
    relatedWords: ["វាចា"],
    example: "វាចា។"
  },
  "វៀច": {
    word: "វៀច",
    pronunciation: "វៀច",
    definition: "(គុ.) ដែលកោង, មិនត្រង់ (Crooked/Bent).",
    homophones: [
      { word: "វាច", definition: "សម្តី (សូរជិត)", pronunciation: "វាច" },
      { word: "វៀច", definition: "កោង / មិនត្រង់", pronunciation: "វៀច" }
    ],
    synonyms: ["កោង"],
    antonyms: ["ត្រង់"],
    relatedWords: [],
    example: "ផ្លូវវៀច។"
  },
  "វាង": {
    word: "វាង",
    pronunciation: "វាង",
    definition: "(កិ.) ដើរជៀស, គេច (To detour/avoid).",
    homophones: [
      { word: "វាង", definition: "ជៀស / គេច", pronunciation: "វាង" },
      { word: "វៀង", definition: "វាំង / របង", pronunciation: "វៀង" }
    ],
    synonyms: ["ជៀស", "គេច"],
    antonyms: [],
    relatedWords: ["ផ្លូវវាង"],
    example: "ដើរវាង។"
  },
  "វៀង": {
    word: "វៀង",
    pronunciation: "វៀង",
    definition: "(ន.) វាំង, របង (Palace/Fence - ancient).",
    homophones: [
      { word: "វាង", definition: "ជៀស (សូរជិត)", pronunciation: "វាង" },
      { word: "វៀង", definition: "វាំង", pronunciation: "វៀង" }
    ],
    synonyms: ["វាំង"],
    antonyms: [],
    relatedWords: ["វៀងចន្ទន៍"],
    example: "វៀងចន្ទន៍។"
  },
  "វាល": {
    word: "វាល",
    pronunciation: "វាល",
    definition: "(ន.) ទីវាល, ដីទំនេរ (Field/Open space).",
    homophones: [
      { word: "វាល", definition: "ទីវាល", pronunciation: "វាល" },
      { word: "វៀល", definition: "វិល (សូរជិត)", pronunciation: "វៀល" }
    ],
    synonyms: [],
    antonyms: ["ព្រៃ"],
    relatedWords: ["វាលស្រែ"],
    example: "វាលស្រែ។"
  },
  "វៀល": {
    word: "វៀល",
    pronunciation: "វៀល",
    definition: "(កិ.) វិល (សំនៀង) (To turn).",
    homophones: [
      { word: "វាល", definition: "ទីវាល", pronunciation: "វាល" },
      { word: "វៀល", definition: "វិល", pronunciation: "វៀល" }
    ],
    synonyms: ["វិល"],
    antonyms: [],
    relatedWords: [],
    example: "ក្បាលវៀល។"
  },
  "សង់": {
    word: "សង់",
    pronunciation: "សង់",
    definition: "(កិ.) ធ្វើឲ្យកើតជារូបរាង (ផ្ទះ, ស្ពាន) (To build/construct).",
    homophones: [
      { word: "សង់", definition: "សាងសង់", pronunciation: "សង់" },
      { word: "សង្ឃ", definition: "ព្រះសង្ឃ", pronunciation: "សង់" }
    ],
    synonyms: ["សាង", "ធ្វើ"],
    antonyms: ["រុះ"],
    relatedWords: ["សំណង់"],
    example: "សង់ផ្ទះ។"
  },
  "សង្ឃ": {
    word: "សង្ឃ",
    pronunciation: "សង់",
    definition: "(ន.) ពួកភិក្ខុ, ព្រះសង្ឃ (Monkhood/Sangha).",
    homophones: [
      { word: "សង់", definition: "សាងសង់", pronunciation: "សង់" },
      { word: "សង្ឃ", definition: "ព្រះសង្ឃ", pronunciation: "សង់" }
    ],
    synonyms: ["ភិក្ខុ"],
    antonyms: ["គ្រហស្ថ"],
    relatedWords: ["ព្រះសង្ឃ"],
    example: "និមន្តព្រះសង្ឃ។"
  },
  "ស័ក": {
    word: "ស័ក",
    pronunciation: "សាក់",
    definition: "(ន.) សករាជ, ឆ្នាំ (Era/Year).",
    homophones: [
      { word: "ស័ក", definition: "ឆ្នាំ / សករាជ", pronunciation: "សាក់" },
      { word: "ស័ក្តិ", definition: "អំណាច / ឋានៈ", pronunciation: "សាក់" },
      { word: "សក្យ", definition: "ត្រកូល", pronunciation: "សាក់" },
      { word: "សគ្គ", definition: "សួគ៌", pronunciation: "សាក់" },
      { word: "សគ៌ៈ", definition: "សួគ៌", pronunciation: "សាក់" }
    ],
    synonyms: ["ឆ្នាំ"],
    antonyms: [],
    relatedWords: ["ស័ក១"],
    example: "ឯកស័ក។"
  },
  "ស័ក្តិ": {
    word: "ស័ក្តិ",
    pronunciation: "សាក់",
    definition: "(ន.) អំណាច, ឋានៈ, យស (Rank/Power).",
    homophones: [
      { word: "ស័ក", definition: "ឆ្នាំ / សករាជ", pronunciation: "សាក់" },
      { word: "ស័ក្តិ", definition: "អំណាច / ឋានៈ", pronunciation: "សាក់" },
      { word: "សក្យ", definition: "ត្រកូល", pronunciation: "សាក់" }
    ],
    synonyms: ["យស", "អំណាច"],
    antonyms: [],
    relatedWords: ["បុណ្យស័ក្តិ"],
    example: "មានបុណ្យស័ក្តិ។"
  },
  "សក្យ": {
    word: "សក្យ",
    pronunciation: "សាក់",
    definition: "(ន.) ត្រកូលព្រះពុទ្ធ (Sakya clan).",
    homophones: [
      { word: "ស័ក", definition: "ឆ្នាំ / សករាជ", pronunciation: "សាក់" },
      { word: "ស័ក្តិ", definition: "អំណាច / ឋានៈ", pronunciation: "សាក់" },
      { word: "សក្យ", definition: "ត្រកូល", pronunciation: "សាក់" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["សក្យមុនី"],
    example: "សក្យមុនី។"
  },
  "សគ្គ": {
    word: "សគ្គ",
    pronunciation: "សាក់",
    definition: "(ន.) សួគ៌ (Heaven - Pali).",
    homophones: [
      { word: "ស័ក", definition: "ឆ្នាំ / សករាជ", pronunciation: "សាក់" },
      { word: "សគ្គ", definition: "សួគ៌", pronunciation: "សាក់" }
    ],
    synonyms: ["សួគ៌"],
    antonyms: [],
    relatedWords: [],
    example: "សគ្គ។"
  },
  "សគ៌ៈ": {
    word: "សគ៌ៈ",
    pronunciation: "សាក់",
    definition: "(ន.) សួគ៌ (Sanskrit).",
    homophones: [
      { word: "ស័ក", definition: "ឆ្នាំ / សករាជ", pronunciation: "សាក់" },
      { word: "សគ៌ៈ", definition: "សួគ៌", pronunciation: "សាក់" }
    ],
    synonyms: ["សួគ៌"],
    antonyms: [],
    relatedWords: [],
    example: "សគ៌ៈ។"
  },
  "ស័ង្ខ": {
    word: "ស័ង្ខ",
    pronunciation: "សាំង",
    definition: "(ន.) ខ្យងសមុទ្រ (Conch shell).",
    homophones: [
      { word: "ស័ង្ខ", definition: "ខ្យងស័ង្ខ", pronunciation: "សាំង" },
      { word: "សាំង", definition: "ប្រេងសាំង", pronunciation: "សាំង" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["ផ្លុំស័ង្ខ"],
    example: "ផ្លុំស័ង្ខ។"
  },
  "សាំង": {
    word: "សាំង",
    pronunciation: "សាំង",
    definition: "(ន.) ប្រេងឥន្ធនៈ (Gasoline/Petrol - Fr. Essence).",
    homophones: [
      { word: "ស័ង្ខ", definition: "ខ្យងស័ង្ខ", pronunciation: "សាំង" },
      { word: "សាំង", definition: "ប្រេងសាំង", pronunciation: "សាំង" }
    ],
    synonyms: ["ប្រេង"],
    antonyms: [],
    relatedWords: ["ចាក់សាំង"],
    example: "ចាក់សាំង។"
  },
  "សស្ត្រា": {
    word: "សស្ត្រា",
    pronunciation: "សាស-ស្ត្រា",
    definition: "(ន.) គ្រឿងអាវុធ, កាំបិត (Weapon/Knife).",
    homophones: [
      { word: "សស្ត្រា", definition: "អាវុធ", pronunciation: "សាស-ស្ត្រា" },
      { word: "សាស្ត្រា", definition: "គម្ពីរ / សាស្ត្រាចារ្យ", pronunciation: "សាស-ស្ត្រា" }
    ],
    synonyms: ["អាវុធ"],
    antonyms: [],
    relatedWords: ["សស្ត្រាវុធ"],
    example: "សស្ត្រាវុធ។"
  },
  "សាស្ត្រា": {
    word: "សាស្ត្រា",
    pronunciation: "សាស-ស្ត្រា",
    definition: "(ន.) គម្ពីរ, ក្បួនច្បាប់ (Scripture/Treatise).",
    homophones: [
      { word: "សស្ត្រា", definition: "អាវុធ", pronunciation: "សាស-ស្ត្រា" },
      { word: "សាស្ត្រា", definition: "គម្ពីរ / សាស្ត្រាចារ្យ", pronunciation: "សាស-ស្ត្រា" }
    ],
    synonyms: ["គម្ពីរ"],
    antonyms: [],
    relatedWords: ["សាស្ត្រាចារ្យ"],
    example: "សាស្ត្រាស្លឹករឹត។"
  },
  "សត្វ": {
    word: "សត្វ",
    pronunciation: "សាត់",
    definition: "(ន.) អ្វីៗដែលមានជីវិត និងវិញ្ញាណ (Animal/Being).",
    homophones: [
      { word: "សត្វ", definition: "សត្វលោក", pronunciation: "សាត់" },
      { word: "សត", definition: "មួយរយ (បាលី)", pronunciation: "សាត់" },
      { word: "សត្យ", definition: "សច្ចៈ / ទៀងត្រង់", pronunciation: "សាត់" },
      { word: "សាត់", definition: "រសាត់", pronunciation: "សាត់" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["សត្វពាហនៈ"],
    example: "សត្វឆ្កែ។"
  },
  "សត": {
    word: "សត",
    pronunciation: "សាត់",
    definition: "(ន.) មួយរយ (Hundred - Pali).",
    homophones: [
      { word: "សត្វ", definition: "សត្វលោក", pronunciation: "សាត់" },
      { word: "សត", definition: "មួយរយ (បាលី)", pronunciation: "សាត់" }
    ],
    synonyms: ["រយ"],
    antonyms: [],
    relatedWords: ["សតវត្ស"],
    example: "សតវត្ស។"
  },
  "សត្យ": {
    word: "សត្យ",
    pronunciation: "សាត់",
    definition: "(ន.) សេចក្តីពិត, ទៀងត្រង់ (Truth/Veracity).",
    homophones: [
      { word: "សត្វ", definition: "សត្វលោក", pronunciation: "សាត់" },
      { word: "សត្យ", definition: "សច្ចៈ / ទៀងត្រង់", pronunciation: "សាត់" }
    ],
    synonyms: ["សច្ចៈ", "ពិត"],
    antonyms: ["កុហក"],
    relatedWords: ["សត្យានុម័ត"],
    example: "ពាក្យសត្យ។"
  },
  "សាត់": {
    word: "សាត់",
    pronunciation: "សាត់",
    definition: "(កិ.) រសាត់, របូតចេញទៅតាមទឹក ឬខ្យល់ (To drift/float away).",
    homophones: [
      { word: "សត្វ", definition: "សត្វលោក", pronunciation: "សាត់" },
      { word: "សាត់", definition: "រសាត់", pronunciation: "សាត់" }
    ],
    synonyms: ["រសាត់"],
    antonyms: [],
    relatedWords: ["សាត់អណ្តែត"],
    example: "ទូកសាត់។"
  },
  "សប្ត": {
    word: "សប្ត",
    pronunciation: "សាប់",
    definition: "(ន.) ប្រាំពីរ (Seven - Sanskrit).",
    homophones: [
      { word: "សប្ត", definition: "ប្រាំពីរ", pronunciation: "សាប់" },
      { word: "សព្ទ", definition: "សំឡេង", pronunciation: "សាប់" },
      { word: "សាប់", definition: "ចិញ្ច្រាំ / សាប", pronunciation: "សាប់" },
      { word: "សប្ប", definition: "ទាំងពួង", pronunciation: "សាប់" }
    ],
    synonyms: ["ប្រាំពីរ"],
    antonyms: [],
    relatedWords: ["សប្តាហ៍"],
    example: "សប្តាហ៍។"
  },
  "សព្ទ": {
    word: "សព្ទ",
    pronunciation: "សាប់",
    definition: "(ន.) សំឡេង, ពាក្យ (Sound/Word/Voice).",
    homophones: [
      { word: "សប្ត", definition: "ប្រាំពីរ", pronunciation: "សាប់" },
      { word: "សព្ទ", definition: "សំឡេង", pronunciation: "សាប់" }
    ],
    synonyms: ["សំឡេង"],
    antonyms: [],
    relatedWords: ["ទូរសព្ទ"],
    example: "ទូរសព្ទ។"
  },
  "សាប់": {
    word: "សាប់",
    pronunciation: "សាប់",
    definition: "១. (កិ.) ចិញ្ច្រាំឲ្យល្អិត (To chop/mince). ២. (គុ.) ដែលមិនប្រៃ (Tasteless/Insipid - សាប).",
    homophones: [
      { word: "សប្ត", definition: "ប្រាំពីរ", pronunciation: "សាប់" },
      { word: "សាប់", definition: "ចិញ្ច្រាំ / សាប", pronunciation: "សាប់" }
    ],
    synonyms: ["ចិញ្ច្រាំ"],
    antonyms: [],
    relatedWords: ["សាប់សាច់"],
    example: "សាប់សាច់ជ្រូក។"
  },
  "សប្ប": {
    word: "សប្ប",
    pronunciation: "សាប់",
    definition: "(គុ.) ទាំងពួង, ទាំងអស់, គ្រប់ (All/Every - Pali).",
    homophones: [
      { word: "សប្ត", definition: "ប្រាំពីរ", pronunciation: "សាប់" },
      { word: "សប្ប", definition: "ទាំងពួង", pronunciation: "សាប់" }
    ],
    synonyms: ["ទាំងពួង", "សព្វ"],
    antonyms: [],
    relatedWords: ["សប្បបុរស"],
    example: "សប្បបុរស។"
  },
  "សប": {
    word: "សប",
    pronunciation: "សប់",
    definition: "(កិ.) សេពគប់, រាប់រក (To associate with).",
    homophones: [
      { word: "សប", definition: "សេពគប់", pronunciation: "សប់" },
      { word: "សប់", definition: "ឧបករណ៍ផ្លុំភ្លើង", pronunciation: "សប់" },
      { word: "សព្វ", definition: "គ្រប់", pronunciation: "សប់" },
      { word: "សព", definition: "ខ្មោច", pronunciation: "សប់" },
      { word: "សប្តិ", definition: "យល់សប្តិ (សុបិន)", pronunciation: "សប់" }
    ],
    synonyms: ["សេពគប់"],
    antonyms: [],
    relatedWords: [],
    example: "សបរក។"
  },
  "សប់": {
    word: "សប់",
    pronunciation: "សប់",
    definition: "(ន.) ឧបករណ៍សម្រាប់ផ្លុំភ្លើង (Bellows).",
    homophones: [
      { word: "សប", definition: "សេពគប់", pronunciation: "សប់" },
      { word: "សប់", definition: "ឧបករណ៍ផ្លុំភ្លើង", pronunciation: "សប់" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["សប់ភ្លើង"],
    example: "សប់ភ្លើង។"
  },
  "សប្តិ": {
    word: "សប្តិ",
    pronunciation: "សប់",
    definition: "(ន.) ការយល់សប្តិ, សុបិន (Dream).",
    homophones: [
      { word: "សប្តិ", definition: "យល់សប្តិ (សុបិន)", pronunciation: "សប់" },
      { word: "សព", definition: "ខ្មោច", pronunciation: "សប់" }
    ],
    synonyms: ["សុបិន"],
    antonyms: [],
    relatedWords: ["យល់សប្តិ"],
    example: "យល់សប្តិល្អ។"
  },
  "សាសន៍": {
    word: "សាសន៍",
    pronunciation: "សាស",
    definition: "(ន.) ពាក្យប្រដៅ, សាសនា, ជាតិ (Teaching/Religion/Race).",
    homophones: [
      { word: "សាសន៍", definition: "សាសនា / ជាតិ", pronunciation: "សាស" },
      { word: "សស្ត្រ", definition: "អាវុធ", pronunciation: "សាស" },
      { word: "សះ", definition: "ជា (ជំងឺ)", pronunciation: "សះ" }
    ],
    synonyms: ["សាសនា", "ជាតិ"],
    antonyms: [],
    relatedWords: ["សាសនា", "ជាតិសាសន៍"],
    example: "ជាតិសាសន៍។"
  },
  "សស្ត្រ": {
    word: "សស្ត្រ",
    pronunciation: "សាស",
    definition: "(ន.) អាវុធ, គ្រឿងប្រហារ (Weapon).",
    homophones: [
      { word: "សាសន៍", definition: "សាសនា / ជាតិ", pronunciation: "សាស" },
      { word: "សស្ត្រ", definition: "អាវុធ", pronunciation: "សាស" }
    ],
    synonyms: ["អាវុធ"],
    antonyms: [],
    relatedWords: [],
    example: "សស្ត្រាវុធ។"
  },
  "សះ": {
    word: "សះ",
    pronunciation: "សាស",
    definition: "(កិ. ឬ គុ.) ជា, បាត់ (ជំងឺ); ផ្សះផ្សា (Healed/Cured/Reconciled).",
    homophones: [
      { word: "សាសន៍", definition: "សាសនា / ជាតិ", pronunciation: "សាស" },
      { word: "សះ", definition: "ជា (ជំងឺ)", pronunciation: "សះ" }
    ],
    synonyms: ["ជា", "ស្បើយ"],
    antonyms: ["ឈឺ"],
    relatedWords: ["សះស្បើយ", "សះជា"],
    example: "សះស្បើយ។"
  },
  "សិង": {
    word: "សិង",
    pronunciation: "សឹង",
    definition: "(ន.) ស្បូវភ្លាំង (Grass type).",
    homophones: [
      { word: "សិង", definition: "ស្បូវ", pronunciation: "សឹង" },
      { word: "សិង្ហ", definition: "សត្វតោ", pronunciation: "សឹង" },
      { word: "សឹង", definition: "ស្ទើរតែ / សម្រាក", pronunciation: "សឹង" },
      { word: "សុឹង", definition: "ក្រណាត់សឹង", pronunciation: "សឹង" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: [],
    example: "សិង។"
  },
  "សិង្ហ": {
    word: "សិង្ហ",
    pronunciation: "សឹង",
    definition: "(ន.) សត្វសាហាវមួយប្រភេទ (Lion).",
    homophones: [
      { word: "សិង្ហ", definition: "សត្វតោ", pronunciation: "សឹង" },
      { word: "សឹង", definition: "ស្ទើរតែ / សម្រាក (រាជសព្ទ)", pronunciation: "សឹង" }
    ],
    synonyms: ["តោ"],
    antonyms: [],
    relatedWords: ["សិង្ហតោ"],
    example: "សិង្ហរាជ។"
  },
  "សឹង": {
    word: "សឹង",
    pronunciation: "សឹង",
    definition: "១. (កិ.) ដេក, សម្រាក (រាជសព្ទ) (To sleep - Royal). ២. (កិ. វិ.) ស្ទើរតែ (Almost/Nearly).",
    homophones: [
      { word: "សិង្ហ", definition: "សត្វតោ", pronunciation: "សឹង" },
      { word: "សឹង", definition: "ស្ទើរតែ / សម្រាក (រាជសព្ទ)", pronunciation: "សឹង" }
    ],
    synonyms: ["ដេក", "ស្ទើរ"],
    antonyms: [],
    relatedWords: [],
    example: "សឹងតែទាំងអស់។"
  },
  "សុឹង": {
    word: "សុឹង",
    pronunciation: "សឹង",
    definition: "(ន.) ក្រណាត់សូត្រពណ៌ខ្មៅ (Black silk fabric).",
    homophones: [
      { word: "សិង្ហ", definition: "សត្វតោ", pronunciation: "សឹង" },
      { word: "សុឹង", definition: "ក្រណាត់សឹង", pronunciation: "សឹង" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["សំពត់សឹង"],
    example: "សំពត់សឹង។"
  },
  "សុក្ក": {
    word: "សុក្ក",
    pronunciation: "សុក",
    definition: "(គុ.) ស, ភ្លឺ (White/Bright).",
    homophones: [
      { word: "សុក", definition: "សុកទារក", pronunciation: "សុក" },
      { word: "សុក្ក", definition: "ស", pronunciation: "សុក" }
    ],
    synonyms: ["ស"],
    antonyms: ["ខ្មៅ"],
    relatedWords: ["សុក្កប័ក្ខ"],
    example: "សុក្កប័ក្ខ។"
  },
  "សិរ": {
    word: "សិរ",
    pronunciation: "សេ",
    definition: "(ន.) ក្បាល (Head).",
    homophones: [
      { word: "សិរ", definition: "ក្បាល", pronunciation: "សេ" },
      { word: "សិរ្ស", definition: "ក្បាល", pronunciation: "សេ" },
      { word: "សេ", definition: "ដេក / សេះ (សំនៀង)", pronunciation: "សេ" },
      { word: "សេរ", definition: "សេរី", pronunciation: "សេ" }
    ],
    synonyms: ["ក្បាល"],
    antonyms: [],
    relatedWords: ["សិរសា"],
    example: "សិរសា។"
  },
  "សិរ្ស": {
    word: "សិរ្ស",
    pronunciation: "សេ",
    definition: "(ន.) ក្បាល (Sanskrit).",
    homophones: [
      { word: "សិរ", definition: "ក្បាល", pronunciation: "សេ" },
      { word: "សិរ្ស", definition: "ក្បាល", pronunciation: "សេ" }
    ],
    synonyms: ["ក្បាល"],
    antonyms: [],
    relatedWords: [],
    example: "សិរ្ស។"
  },
  "សេ": {
    word: "សេ",
    pronunciation: "សេ",
    definition: "១. (កិ.) ដេក (សត្វ) (To sleep - animal). ២. (ន.) សេះ (សំនៀងចិន).",
    homophones: [
      { word: "សេ", definition: "ដេក / សេះ", pronunciation: "សេ" },
      { word: "សេរ", definition: "សេរី", pronunciation: "សេ" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["សេសេះ"],
    example: "សេសេះ។"
  },
  "សេរ": {
    word: "សេរ",
    pronunciation: "សេ",
    definition: "(គុ.) សេរី, ឯករាជ្យ (Free/Independent).",
    homophones: [
      { word: "សេ", definition: "ដេក / សេះ", pronunciation: "សេ" },
      { word: "សេរ", definition: "សេរី", pronunciation: "សេ" }
    ],
    synonyms: ["សេរី"],
    antonyms: [],
    relatedWords: ["សេរីភាព"],
    example: "សេរីភាព។"
  },
  "សូ": {
    word: "សូ",
    pronunciation: "សូ",
    definition: "(ន.) សំឡេង, ឮ (Sound).",
    homophones: [
      { word: "សូ", definition: "សំឡេង", pronunciation: "សូ" },
      { word: "សូរ", definition: "សំឡេង / ព្រះអាទិត្យ", pronunciation: "សូ" },
      { word: "សូរ្យ", definition: "ព្រះអាទិត្យ", pronunciation: "សូ" },
      { word: "សូល៍", definition: "ចម្ពោះ", pronunciation: "សូ" }
    ],
    synonyms: ["សំឡេង"],
    antonyms: [],
    relatedWords: [],
    example: "សូរស័ព្ទ។"
  },
  "សូរ": {
    word: "សូរ",
    pronunciation: "សូ",
    definition: "១. (ន.) សំឡេង (Sound). ២. (ន.) ព្រះអាទិត្យ (Sun).",
    homophones: [
      { word: "សូ", definition: "សំឡេង", pronunciation: "សូ" },
      { word: "សូរ", definition: "សំឡេង / ព្រះអាទិត្យ", pronunciation: "សូ" },
      { word: "សូរ្យ", definition: "ព្រះអាទិត្យ", pronunciation: "សូ" }
    ],
    synonyms: ["សំឡេង", "អាទិត្យ"],
    antonyms: [],
    relatedWords: ["សូរសៀង"],
    example: "សូរសៀង។"
  },
  "សូរ្យ": {
    word: "សូរ្យ",
    pronunciation: "សូ",
    definition: "(ន.) ព្រះអាទិត្យ (Sun).",
    homophones: [
      { word: "សូរ", definition: "សំឡេង / ព្រះអាទិត្យ", pronunciation: "សូ" },
      { word: "សូរ្យ", definition: "ព្រះអាទិត្យ", pronunciation: "សូ" }
    ],
    synonyms: ["ព្រះអាទិត្យ"],
    antonyms: ["ចន្ទ"],
    relatedWords: ["សូរ្យគ្រាស"],
    example: "សូរ្យគ្រាស។"
  },
  "សូល៍": {
    word: "សូល៍",
    pronunciation: "សូ",
    definition: "(ន.) ចម្ពោះ, ចុងស្រួច (Beak/Point).",
    homophones: [
      { word: "សូ", definition: "សំឡេង", pronunciation: "សូ" },
      { word: "សូល៍", definition: "ចម្ពោះ", pronunciation: "សូ" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["ត្រីសូល៍"],
    example: "ត្រីសូល៍។"
  },
  "សូទ": {
    word: "សូទ",
    pronunciation: "សូត",
    definition: "(ន.) អ្នកបើករថ (Charioteer/Driver).",
    homophones: [
      { word: "សូទ", definition: "អ្នកបើក", pronunciation: "សូត" },
      { word: "សូត", definition: "សូត្រ (សរសេរខ្លះ)", pronunciation: "សូត" },
      { word: "សូត្រ", definition: "អំបោះសូត្រ / រៀន", pronunciation: "សូត" },
      { word: "សូធ្យ", definition: "សូត្រធម៌", pronunciation: "សូត" },
      { word: "សូទ្រ", definition: "វណ្ណៈសូទ្រ", pronunciation: "សូត" }
    ],
    synonyms: ["សារថី"],
    antonyms: [],
    relatedWords: [],
    example: "សូទ។"
  },
  "សូត": {
    word: "សូត",
    pronunciation: "សូត",
    definition: "(ន.) សូត្រ (សរសេរខ្លះ).",
    homophones: [
      { word: "សូត្រ", definition: "អំបោះសូត្រ / រៀន", pronunciation: "សូត" },
      { word: "សូត", definition: "សូត្រ", pronunciation: "សូត" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: [],
    example: "សូត។"
  },
  "សូត្រ": {
    word: "សូត្រ",
    pronunciation: "សូត",
    definition: "១. (ន.) អំបោះល្អិតទន់ (Silk). ២. (កិ.) រៀន, ថា (To recite/study).",
    homophones: [
      { word: "សូត្រ", definition: "អំបោះសូត្រ / រៀន", pronunciation: "សូត" },
      { word: "សូធ្យ", definition: "សូត្រធម៌", pronunciation: "សូត" }
    ],
    synonyms: ["រៀន"],
    antonyms: [],
    relatedWords: ["សូត្រធម៌", "សំពត់សូត្រ"],
    example: "សូត្រធម៌។"
  },
  "សូធ្យ": {
    word: "សូធ្យ",
    pronunciation: "សូត",
    definition: "(កិ.) សូត្រ, ថា (To recite).",
    homophones: [
      { word: "សូត្រ", definition: "អំបោះសូត្រ / រៀន", pronunciation: "សូត" },
      { word: "សូធ្យ", definition: "សូត្រធម៌", pronunciation: "សូត" }
    ],
    synonyms: ["សូត្រ"],
    antonyms: [],
    relatedWords: ["សូធ្យរៀន"],
    example: "សូធ្យមន្ត។"
  },
  "សូទ្រ": {
    word: "សូទ្រ",
    pronunciation: "សូត",
    definition: "(ន.) វណ្ណៈទី ៤ ក្នុងសង្គមឥណ្ឌា (Sudra/Laborer caste).",
    homophones: [
      { word: "សូត្រ", definition: "អំបោះសូត្រ / រៀន", pronunciation: "សូត" },
      { word: "សូទ្រ", definition: "វណ្ណៈសូទ្រ", pronunciation: "សូត" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: [],
    example: "វណ្ណៈសូទ្រ។"
  },
  "សូន": {
    word: "សូន",
    pronunciation: "សូន",
    definition: "(កិ.) យកដីមកធ្វើជារូប (To mold/shape).",
    homophones: [
      { word: "សូន", definition: "សូនរូប", pronunciation: "សូន" },
      { word: "សូន្យ", definition: "លេខសូន្យ / អស់", pronunciation: "សូន" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["សូនរូប"],
    example: "សូនរូប។"
  },
  "សូន្យ": {
    word: "សូន្យ",
    pronunciation: "សូន",
    definition: "១. (ន.) លេខ ០ (Zero). ២. (គុ.) ទទេ, អស់, ស្ងាត់ (Empty/Void).",
    homophones: [
      { word: "សូន", definition: "សូនរូប", pronunciation: "សូន" },
      { word: "សូន្យ", definition: "លេខសូន្យ / អស់", pronunciation: "សូន" }
    ],
    synonyms: ["ទទេ", "អសារ"],
    antonyms: [],
    relatedWords: ["សូន្យឈឹង"],
    example: "ស្ងាត់សូន្យ។"
  },
  "សូម": {
    word: "សូម",
    pronunciation: "សូម",
    definition: "(កិ.) ស្នើដោយវាចាគួរសម (To request/ask politely/Please).",
    homophones: [
      { word: "សូម", definition: "សំណូមពរ", pronunciation: "សូម" },
      { word: "សុំ", definition: "សុំទាន (សូរជិត)", pronunciation: "សុំ" }
    ],
    synonyms: ["ស្នើ"],
    antonyms: [],
    relatedWords: ["សំណូមពរ"],
    example: "សូមអរគុណ។"
  },
  "សុំ": {
    word: "សុំ",
    pronunciation: "សុំ",
    definition: "(កិ.) ចង់បានដោយការស្នើ (To beg/ask for).",
    homophones: [
      { word: "សូម", definition: "សំណូមពរ", pronunciation: "សូម" },
      { word: "សុំ", definition: "សុំទាន", pronunciation: "សុំ" }
    ],
    synonyms: [],
    antonyms: ["ឲ្យ"],
    relatedWords: ["សុំទាន"],
    example: "សុំលុយ។"
  },
  "សួរ": {
    word: "សួរ",
    pronunciation: "សួរ",
    definition: "(កិ.) ចោទជាសំណួរ, នឹកនា (To ask/inquire).",
    homophones: [
      { word: "សួរ", definition: "ចោទសួរ", pronunciation: "សួរ" },
      { word: "សួ", definition: "ឈ្មោះសួ", pronunciation: "សួរ" },
      { word: "សួគ៌", definition: "ឋានសួគ៌", pronunciation: "សួរ" }
    ],
    synonyms: ["ចោទ"],
    antonyms: ["ឆ្លើយ"],
    relatedWords: ["សំណួរ", "សាកសួរ"],
    example: "សួរសុខទុក្ខ។"
  },
  "សួ": {
    word: "សួ",
    pronunciation: "សួរ",
    definition: "(ន.) ឈ្មោះមនុស្ស។",
    homophones: [
      { word: "សួរ", definition: "ចោទសួរ", pronunciation: "សួរ" },
      { word: "សួ", definition: "ឈ្មោះសួ", pronunciation: "សួរ" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: [],
    example: "តាសួ។"
  },
  "សួគ៌": {
    word: "សួគ៌",
    pronunciation: "សួរ",
    definition: "(ន.) ឋានទេវតា, ឋានសុខ (Heaven/Paradise).",
    homophones: [
      { word: "សួរ", definition: "ចោទសួរ", pronunciation: "សួរ" },
      { word: "សួគ៌", definition: "ឋានសួគ៌", pronunciation: "សួរ" }
    ],
    synonyms: ["ទេវលោក"],
    antonyms: ["នរក"],
    relatedWords: ["ឋានសួគ៌"],
    example: "ឡើងឋានសួគ៌។"
  },
  "សេដ្ធ": {
    word: "សេដ្ធ",
    pronunciation: "សេត",
    definition: "(ន.) ប្រសើរ, ខ្ពង់ខ្ពស់ (Noble/Best - Sanskrit: Srestha).",
    homophones: [
      { word: "សេដ្ធ", definition: "ប្រសើរ", pronunciation: "សេត" },
      { word: "សេត", definition: "ស", pronunciation: "សេត" }
    ],
    synonyms: ["ប្រសើរ"],
    antonyms: [],
    relatedWords: ["សេដ្ឋី"],
    example: "សេដ្ឋី។"
  },
  "សេត": {
    word: "សេត",
    pronunciation: "សេត",
    definition: "(គុ.) ស, ពណ៌ស (White).",
    homophones: [
      { word: "សេដ្ធ", definition: "ប្រសើរ", pronunciation: "សេត" },
      { word: "សេត", definition: "ស", pronunciation: "សេត" }
    ],
    synonyms: ["ស"],
    antonyms: ["ខ្មៅ"],
    relatedWords: ["សេតឆត្រ"],
    example: "សេតឆត្រ។"
  },
  "សោត": {
    word: "សោត",
    pronunciation: "សោត",
    definition: "(និ.) ទៀត, ផង (Also/Again).",
    homophones: [
      { word: "សោត", definition: "ទៀត / ផង", pronunciation: "សោត" },
      { word: "សោធ", definition: "ជម្រះ", pronunciation: "សោត" },
      { word: "សោធន៍", definition: "ការជម្រះ", pronunciation: "សោត" }
    ],
    synonyms: ["ទៀត"],
    antonyms: [],
    relatedWords: ["មួយសោត"],
    example: "មួយសោត។"
  },
  "សោធ": {
    word: "សោធ",
    pronunciation: "សោត",
    definition: "(កិ.) ជម្រះ, ធ្វើឲ្យស្អាត (To clean/purify/refine).",
    homophones: [
      { word: "សោត", definition: "ទៀត / ផង", pronunciation: "សោត" },
      { word: "សោធ", definition: "ជម្រះ", pronunciation: "សោត" }
    ],
    synonyms: ["ជម្រះ"],
    antonyms: [],
    relatedWords: ["សោធន"],
    example: "សោធន។"
  },
  "សោធន៍": {
    word: "សោធន៍",
    pronunciation: "សោត",
    definition: "(ន.) ការជម្រះ, ការពិសោធ (Clearing/Testing).",
    homophones: [
      { word: "សោត", definition: "ទៀត / ផង", pronunciation: "សោត" },
      { word: "សោធន៍", definition: "ការជម្រះ", pronunciation: "សោត" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["វិសោធនកម្ម"],
    example: "វិសោធនកម្ម។"
  },
  "សំ": {
    word: "សំ",
    pronunciation: "សំ",
    definition: "(ន.) សំបក, ស្រោម (Bark/Husk/Case).",
    homophones: [
      { word: "សំ", definition: "សំបក", pronunciation: "សំ" },
      { word: "សម", definition: "គួរ / ត្រូវ (សូរជិត)", pronunciation: "សម" }
    ],
    synonyms: ["សំបក"],
    antonyms: [],
    relatedWords: ["សំខ្យង"],
    example: "សំខ្យង។"
  },
  "សម": {
    word: "សម",
    pronunciation: "សម",
    definition: "(គុ.) គួរ, ត្រូវ, ល្មម (Fitting/Suitable).",
    homophones: [
      { word: "សំ", definition: "សំបក", pronunciation: "សំ" },
      { word: "សម", definition: "គួរ / ត្រូវ", pronunciation: "សម" }
    ],
    synonyms: ["គួរ"],
    antonyms: ["មិនសម"],
    relatedWords: ["សមរម្យ"],
    example: "សមរម្យ។"
  },
  "សម្បត្តិ": {
    word: "សម្បត្តិ",
    pronunciation: "សំ-ប័ត",
    definition: "(ន.) ទ្រព្យ, របស់របរ (Wealth/Property).",
    homophones: [
      { word: "សម្បត្តិ", definition: "ទ្រព្យ", pronunciation: "សំ-ប័ត" },
      { word: "សម្ប័ទ", definition: "សេចក្តីដល់ព្រម", pronunciation: "សំ-ប័ត" }
    ],
    synonyms: ["ទ្រព្យ"],
    antonyms: ["វិបត្តិ"],
    relatedWords: [],
    example: "សម្បត្តិធម្មជាតិ។"
  },
  "សម្ប័ទ": {
    word: "សម្ប័ទ",
    pronunciation: "សំ-ប័ត",
    definition: "(ន.) សេចក្តីដល់ព្រម, សេចក្តីបរិបូរ (Attainment/Success).",
    homophones: [
      { word: "សម្បត្តិ", definition: "ទ្រព្យ", pronunciation: "សំ-ប័ត" },
      { word: "សម្ប័ទ", definition: "សេចក្តីដល់ព្រម", pronunciation: "សំ-ប័ត" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["សម្បទា"],
    example: "សម្បទា។"
  },
  "សម្បូរ": {
    word: "សម្បូរ",
    pronunciation: "សំ-បូ",
    definition: "(គុ.) ដែលមានច្រើន (Abundant/Plentiful).",
    homophones: [
      { word: "សម្បូរ", definition: "មានច្រើន", pronunciation: "សំ-បូ" },
      { word: "សម្បូណ៍", definition: "សម្បូរ", pronunciation: "សំ-បូ" }
    ],
    synonyms: ["ច្រើន"],
    antonyms: ["ខ្សត់"],
    relatedWords: ["សម្បូរសប្បាយ"],
    example: "សម្បូរសប្បាយ។"
  },
  "សម្បូណ៍": {
    word: "សម្បូណ៍",
    pronunciation: "សំ-បូ",
    definition: "(គុ.) សម្បូរ (Abundant - Variation).",
    homophones: [
      { word: "សម្បូរ", definition: "មានច្រើន", pronunciation: "សំ-បូ" },
      { word: "សម្បូណ៍", definition: "សម្បូរ", pronunciation: "សំ-បូ" }
    ],
    synonyms: ["សម្បូរ"],
    antonyms: [],
    relatedWords: [],
    example: "សម្បូណ៍។"
  },
  "សម្រិត": {
    word: "សម្រិត",
    pronunciation: "សំ-រិត",
    definition: "(កិ.) សម្រាំង, ធ្វើឲ្យស្អាត (To refine/select carefully).",
    homophones: [
      { word: "សម្រិត", definition: "សម្រាំង", pronunciation: "សំ-រិត" },
      { word: "សំរឹទ្ធ", definition: "សំរឹទ្ធិ / សម្រេច", pronunciation: "សំ-រឹត" }
    ],
    synonyms: ["សម្រាំង"],
    antonyms: [],
    relatedWords: ["សម្រិតសម្រាំង"],
    example: "សម្រិតសម្រាំង។"
  },
  "សំរឹទ្ធ": {
    word: "សំរឹទ្ធ",
    pronunciation: "សំ-រឹត",
    definition: "(ន.) លោហៈធាតុមួយប្រភេទ (Bronze/Alloy).",
    homophones: [
      { word: "សម្រិត", definition: "សម្រាំង", pronunciation: "សំ-រិត" },
      { word: "សំរឹទ្ធ", definition: "សំរឹទ្ធិ / សម្រេច", pronunciation: "សំ-រឹត" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["ស្ពាន់សំរឹទ្ធ"],
    example: "ស្ពាន់សំរឹទ្ធ។"
  },
  "សមិត": {
    word: "សមិត",
    pronunciation: "ស-មិត",
    definition: "(គុ.) ដែលស្មើគ្នា, ដែលរួបរួម (Equal/United).",
    homophones: [
      { word: "សមិត", definition: "ស្មើគ្នា", pronunciation: "ស-មិត" },
      { word: "សមិតិ", definition: "សមាគម", pronunciation: "ស-មិត" },
      { word: "សមិទ្ធ", definition: "សម្រេច", pronunciation: "ស-មិត" },
      { word: "សមិទ្ធិ", definition: "ផលសម្រេច", pronunciation: "ស-មិត" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: [],
    example: "សមិត។"
  },
  "សមិទ្ធ": {
    word: "សមិទ្ធ",
    pronunciation: "ស-មិត",
    definition: "(គុ.) ដែលសម្រេចហើយ (Accomplished).",
    homophones: [
      { word: "សមិត", definition: "ស្មើគ្នា", pronunciation: "ស-មិត" },
      { word: "សមិទ្ធ", definition: "សម្រេច", pronunciation: "ស-មិត" }
    ],
    synonyms: ["សម្រេច"],
    antonyms: [],
    relatedWords: ["សមិទ្ធផល"],
    example: "សមិទ្ធផល។"
  },
  "សមិទ្ធិ": {
    word: "សមិទ្ធិ",
    pronunciation: "ស-មិត",
    definition: "(ន.) ផលសម្រេច, ជោគជ័យ (Success/Achievement).",
    homophones: [
      { word: "សមិត", definition: "ស្មើគ្នា", pronunciation: "ស-មិត" },
      { word: "សមិទ្ធិ", definition: "ផលសម្រេច", pronunciation: "ស-មិត" }
    ],
    synonyms: ["ជោគជ័យ"],
    antonyms: [],
    relatedWords: [],
    example: "សមិទ្ធិផល។"
  },
  "ស្និត": {
    word: "ស្និត",
    pronunciation: "ស្និត",
    definition: "(ន.) ក្រាសសិតសក់ (Comb).",
    homophones: [
      { word: "ស្និត", definition: "ក្រាស", pronunciation: "ស្និត" },
      { word: "ស្និទ្ធ", definition: "ជិតស្និទ្ធ", pronunciation: "ស្និត" }
    ],
    synonyms: ["ក្រាស"],
    antonyms: [],
    relatedWords: [],
    example: "ស្និតសក់។"
  },
  "ស្និទ្ធ": {
    word: "ស្និទ្ធ",
    pronunciation: "ស្និត",
    definition: "(គុ.) ជិតដិត, ជិតគ្នា (Close/Intimate).",
    homophones: [
      { word: "ស្និត", definition: "ក្រាស", pronunciation: "ស្និត" },
      { word: "ស្និទ្ធ", definition: "ជិតស្និទ្ធ", pronunciation: "ស្និត" }
    ],
    synonyms: ["ជិតដិត"],
    antonyms: ["ឃ្លាត"],
    relatedWords: ["ជិតស្និទ្ធ"],
    example: "មិត្តជិតស្និទ្ធ។"
  },
  "ស្រស": {
    word: "ស្រស",
    pronunciation: "ស្រស់",
    definition: "(កិ.) ស្រង់ចេញពីទឹក (To take out of water).",
    homophones: [
      { word: "ស្រស", definition: "ស្រង់", pronunciation: "ស្រស់" },
      { word: "ស្រស់", definition: "ថ្មីៗ / ល្អ", pronunciation: "ស្រស់" }
    ],
    synonyms: ["ស្រង់"],
    antonyms: [],
    relatedWords: [],
    example: "ស្រសត្រី។"
  },
  "ស្រស់": {
    word: "ស្រស់",
    pronunciation: "ស្រស់",
    definition: "(គុ.) ថ្មីៗ, មិនទាន់ស្ងួត, ល្អ (Fresh/Beautiful).",
    homophones: [
      { word: "ស្រស", definition: "ស្រង់", pronunciation: "ស្រស់" },
      { word: "ស្រស់", definition: "ថ្មីៗ / ល្អ", pronunciation: "ស្រស់" }
    ],
    synonyms: ["ថ្មី"],
    antonyms: ["ស្ងួត", "ក្រៀម"],
    relatedWords: ["ស្រស់ស្រាយ"],
    example: "ផ្កាស្រស់។"
  },
  "ស្រុះ": {
    word: "ស្រុះ",
    pronunciation: "ស្រុះ",
    definition: "(កិ.) ដាក់ក្នុងទឹកក្តៅមួយភ្លែត (To scald/blanch).",
    homophones: [
      { word: "ស្រុះ", definition: "ស្រុះទឹកក្តៅ", pronunciation: "ស្រុះ" },
      { word: "ស្រុស", definition: "ស្រស់ (សំនៀង)", pronunciation: "ស្រុះ" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["ស្រុះគ្នា"],
    example: "ស្រុះបន្លែ។"
  },
  "ស្រុស": {
    word: "ស្រុស",
    pronunciation: "ស្រុះ",
    definition: "(គុ.) ស្រស់ (សំនៀងខ្លះ).",
    homophones: [
      { word: "ស្រុះ", definition: "ស្រុះទឹកក្តៅ", pronunciation: "ស្រុះ" },
      { word: "ស្រុស", definition: "ស្រស់ (សំនៀង)", pronunciation: "ស្រុះ" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: [],
    example: "ស្រុស។"
  },
  "ស្រះ": {
    word: "ស្រះ",
    pronunciation: "ស្រះ",
    definition: "១. (ន.) កន្លែងទឹកដក់ (Pond). ២. (ន.) តួអក្សរសម្រាប់ផ្សំ (Vowel).",
    homophones: [
      { word: "ស្រះ", definition: "ស្រះទឹក / ស្រៈ", pronunciation: "ស្រះ" },
      { word: "ស្រាស់", definition: "ធ្វើរបង / រាំង", pronunciation: "ស្រះ" }
    ],
    synonyms: ["បឹង"],
    antonyms: [],
    relatedWords: ["ស្រៈ"],
    example: "ស្រះទឹក។"
  },
  "ស្រាស់": {
    word: "ស្រាស់",
    pronunciation: "ស្រះ",
    definition: "(កិ.) ធ្វើរបងដោយមែកឈើ (To fence with branches).",
    homophones: [
      { word: "ស្រះ", definition: "ស្រះទឹក / ស្រៈ", pronunciation: "ស្រះ" },
      { word: "ស្រាស់", definition: "ធ្វើរបង / រាំង", pronunciation: "ស្រះ" }
    ],
    synonyms: ["រាំង"],
    antonyms: [],
    relatedWords: ["ស្រាស់របង"],
    example: "ស្រាស់របង។"
  },
  "ស្លេះ": {
    word: "ស្លេះ",
    pronunciation: "ស្លេះ",
    definition: "(កិ.) ផ្អាក, ឈប់សិន (To pause/suspend).",
    homophones: [
      { word: "ស្លេះ", definition: "ផ្អាក", pronunciation: "ស្លេះ" },
      { word: "ស្លេស្ម", definition: "កំហាក", pronunciation: "ស្លេះ" }
    ],
    synonyms: ["ផ្អាក"],
    antonyms: ["បន្ត"],
    relatedWords: [],
    example: "ស្លេះសិន។"
  },
  "ស្លេស្ម": {
    word: "ស្លេស្ម",
    pronunciation: "ស្លេះ",
    definition: "(ន.) កំហាក, ទឹកដែលចេញពីក (Phlegm/Sputum).",
    homophones: [
      { word: "ស្លេះ", definition: "ផ្អាក", pronunciation: "ស្លេះ" },
      { word: "ស្លេស្ម", definition: "កំហាក", pronunciation: "ស្លេះ" }
    ],
    synonyms: ["កំហាក"],
    antonyms: [],
    relatedWords: [],
    example: "ខាកស្លេស្ម។"
  },
  "សេស": {
    word: "សេស",
    pronunciation: "សេះ",
    definition: "(ន.) អ្វីដែលនៅសល់ (Remainder/Leftover).",
    homophones: [
      { word: "សេះ", definition: "សត្វសេះ", pronunciation: "សេះ" },
      { word: "សេស", definition: "សល់", pronunciation: "សេះ" }
    ],
    synonyms: ["សល់"],
    antonyms: [],
    relatedWords: ["សេសសល់"],
    example: "ប្រាក់សេសសល់។"
  },
  "សេះ": {
    word: "សេះ",
    pronunciation: "សេះ",
    definition: "(ន.) សត្វចតុប្បាទសម្រាប់ជិះ (Horse).",
    homophones: [
      { word: "សេះ", definition: "សត្វសេះ", pronunciation: "សេះ" },
      { word: "សេស", definition: "សល់", pronunciation: "សេះ" }
    ],
    synonyms: ["អស្ស"],
    antonyms: [],
    relatedWords: ["ជិះសេះ"],
    example: "ជិះសេះលែងដៃ។"
  },
  "ហត្ថ": {
    word: "ហត្ថ",
    pronunciation: "ហាត់",
    definition: "(ន.) ដៃ, ប្រអប់ដៃ (Hand/Cubit).",
    homophones: [
      { word: "ហាត់", definition: "ហ្វឹកហាត់", pronunciation: "ហាត់" },
      { word: "ហត្ថ", definition: "ដៃ", pronunciation: "ហាត់" }
    ],
    synonyms: ["ដៃ"],
    antonyms: [],
    relatedWords: ["សាលាខេត្ត"],
    example: "លើកហត្ថ។"
  },
  "ហាត់": {
    word: "ហាត់",
    pronunciation: "ហាត់",
    definition: "(កិ.) ធ្វើឲ្យស្ទាត់, រៀនធ្វើ (To practice/train).",
    homophones: [
      { word: "ហាត់", definition: "ហ្វឹកហាត់", pronunciation: "ហាត់" },
      { word: "ហត្ថ", definition: "ដៃ", pronunciation: "ហាត់" }
    ],
    synonyms: ["ហ្វឹក"],
    antonyms: [],
    relatedWords: ["ហាត់ប្រាណ"],
    example: "ហាត់ប្រាណ។"
  },
  "ហស": {
    word: "ហស",
    pronunciation: "ហោះ",
    definition: "(ន.) សេចក្តីរីករាយ, ការសើច (Joy/Laughter - Pali: Hasa).",
    homophones: [
      { word: "ហស", definition: "សើច", pronunciation: "ហោះ" },
      { word: "ហស្ត", definition: "ដៃ", pronunciation: "ហោះ" },
      { word: "ហោះ", definition: "ហើរ", pronunciation: "ហោះ" }
    ],
    synonyms: ["សើច"],
    antonyms: [],
    relatedWords: [],
    example: "ហស។"
  },
  "ហស្ត": {
    word: "ហស្ត",
    pronunciation: "ហោះ",
    definition: "(ន.) ដៃ (Hand - Sanskrit: Hasta).",
    homophones: [
      { word: "ហស", definition: "សើច", pronunciation: "ហោះ" },
      { word: "ហស្ត", definition: "ដៃ", pronunciation: "ហោះ" },
      { word: "ហោះ", definition: "ហើរ", pronunciation: "ហោះ" }
    ],
    synonyms: ["ដៃ"],
    antonyms: [],
    relatedWords: ["ព្រះហស្ត"],
    example: "ព្រះហស្ត។"
  },
  "ហស្ថ": {
    word: "ហស្ថ",
    pronunciation: "ហោះ",
    definition: "(ន.) ដៃ (Variation).",
    homophones: [
      { word: "ហស្ត", definition: "ដៃ", pronunciation: "ហោះ" },
      { word: "ហស្ថ", definition: "ដៃ", pronunciation: "ហោះ" }
    ],
    synonyms: ["ដៃ"],
    antonyms: [],
    relatedWords: [],
    example: "ហស្ថ។"
  },
  "ហោះ": {
    word: "ហោះ",
    pronunciation: "ហោះ",
    definition: "(កិ.) ទៅឰដ៏អាកាស (To fly).",
    homophones: [
      { word: "ហស", definition: "សើច", pronunciation: "ហោះ" },
      { word: "ហស្ត", definition: "ដៃ", pronunciation: "ហោះ" },
      { word: "ហោះ", definition: "ហើរ", pronunciation: "ហោះ" }
    ],
    synonyms: ["ហើរ"],
    antonyms: ["ដើរ"],
    relatedWords: ["យន្តហោះ"],
    example: "បក្សីហោះ។"
  },
  "ហស្បតិ៍": {
    word: "ហស្បតិ៍",
    pronunciation: "ហោះ",
    definition: "(ន.) ថ្ងៃព្រហស្បតិ៍ (Thursday).",
    homophones: [
      { word: "ហោះ", definition: "ហើរ", pronunciation: "ហោះ" },
      { word: "ហស្បតិ៍", definition: "ថ្ងៃព្រហស្បតិ៍", pronunciation: "ហោះ" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["ព្រហស្បតិ៍"],
    example: "ព្រហស្បតិ៍។"
  },
  "ហាស": {
    word: "ហាស",
    pronunciation: "ហាស",
    definition: "(ន.) ការសើច, សំណើច (Laughter - Pali).",
    homophones: [
      { word: "ហាស", definition: "សំណើច", pronunciation: "ហាស" },
      { word: "ហ័ស", definition: "រហ័ស", pronunciation: "ហាស" }
    ],
    synonyms: ["សំណើច"],
    antonyms: [],
    relatedWords: [],
    example: "ហាស។"
  },
  "ហ័ស": {
    word: "ហ័ស",
    pronunciation: "ហាស",
    definition: "(គុ.) រហ័ស, ឆាប់ (Fast/Quick).",
    homophones: [
      { word: "ហាស", definition: "សំណើច", pronunciation: "ហាស" },
      { word: "ហ័ស", definition: "រហ័ស", pronunciation: "ហាស" }
    ],
    synonyms: ["រហ័ស", "ឆាប់"],
    antonyms: ["យឺត"],
    relatedWords: ["រហ័ស"],
    example: "រហ័សរហួន។"
  },
  "ហស្ស": {
    word: "ហស្ស",
    pronunciation: "ហាស",
    definition: "(ន.) សំណើច, ការរីករាយ (Joy/Mirth).",
    homophones: [
      { word: "ហាស", definition: "សំណើច", pronunciation: "ហាស" },
      { word: "ហស្ស", definition: "សំណើច", pronunciation: "ហាស" }
    ],
    synonyms: ["សើច"],
    antonyms: [],
    relatedWords: ["ហស្សនាដក"],
    example: "ហស្ស។"
  },
  "ហោង": {
    word: "ហោង",
    pronunciation: "ហោង",
    definition: "(និ.) ពាក្យសម្រាប់បញ្ចប់សេចក្តី (Indeed/Verily - archaic).",
    homophones: [
      { word: "ហោង", definition: "ពាក្យបញ្ចប់", pronunciation: "ហោង" },
      { word: "ហង", definition: "ហង្ស / នាង", pronunciation: "ហោង" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: [],
    example: "ចប់ហោង។"
  },
  "ហង": {
    word: "ហង",
    pronunciation: "ហោង",
    definition: "១. (ន.) ហង្ស (Swan). ២. (ន.) ពាក្យហៅស្ត្រី (Lady - archaic/impolite).",
    homophones: [
      { word: "ហោង", definition: "ពាក្យបញ្ចប់", pronunciation: "ហោង" },
      { word: "ហង", definition: "ហង្ស / នាង", pronunciation: "ហោង" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: [],
    example: "មេហង។"
  },
  "អក": {
    word: "អក",
    pronunciation: "អក",
    definition: "(ន.) សត្វស្លាបមួយប្រភេទ (Heron-like bird).",
    homophones: [
      { word: "អក", definition: "សត្វអក", pronunciation: "អក" },
      { word: "អករ៍", definition: "អាករ", pronunciation: "អក" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: [],
    example: "សត្វអក។"
  },
  "អករ៍": {
    word: "អករ៍",
    pronunciation: "អក",
    definition: "(ន.) អាករ, ពន្ធ (Tax/Revenue).",
    homophones: [
      { word: "អក", definition: "សត្វអក", pronunciation: "អក" },
      { word: "អករ៍", definition: "អាករ", pronunciation: "អក" }
    ],
    synonyms: ["ពន្ធ"],
    antonyms: [],
    relatedWords: ["អាករ"],
    example: "អាករ។"
  },
  "អ័ក្ស": {
    word: "អ័ក្ស",
    pronunciation: "អាក់",
    definition: "(ន.)  محور (Axis/Axle).",
    homophones: [
      { word: "អ័ក្ស", definition: "អ័ក្ស", pronunciation: "អាក់" },
      { word: "អាក់", definition: "អាក់ខាន", pronunciation: "អាក់" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["អ័ក្សរទេះ"],
    example: "អ័ក្សផែនដី។"
  },
  "អាក់": {
    word: "អាក់",
    pronunciation: "អាក់",
    definition: "(កិ.) ខាន, ផ្អាក, ឈប់ (To miss/pause/stop).",
    homophones: [
      { word: "អ័ក្ស", definition: "អ័ក្ស", pronunciation: "អាក់" },
      { word: "អាក់", definition: "អាក់ខាន", pronunciation: "អាក់" }
    ],
    synonyms: ["ខាន", "ផ្អាក"],
    antonyms: [],
    relatedWords: ["អាក់ខាន"],
    example: "អាក់ខាន។"
  },
  "អង្គ": {
    word: "អង្គ",
    pronunciation: "អង់",
    definition: "(ន.) រូប, ខ្លួន, តួ (Body/Unit/Organization).",
    homophones: [
      { word: "អង្គ", definition: "តួ / រូប", pronunciation: "អង់" },
      { word: "អង់", definition: "បង្អង់ / រង់ចាំ", pronunciation: "អង់" },
      { word: "អង", definition: "រង្វាស់", pronunciation: "អង់" }
    ],
    synonyms: ["តួ", "រូប"],
    antonyms: [],
    relatedWords: ["អង្គការ"],
    example: "អង្គការសហប្រជាជាតិ។"
  },
  "អង់": {
    word: "អង់",
    pronunciation: "អង់",
    definition: "(កិ.) បង្អង់, រង់ចាំ, ឈប់ (To wait/pause/delay).",
    homophones: [
      { word: "អង្គ", definition: "តួ / រូប", pronunciation: "អង់" },
      { word: "អង់", definition: "បង្អង់ / រង់ចាំ", pronunciation: "អង់" },
      { word: "អង", definition: "រង្វាស់", pronunciation: "អង់" }
    ],
    synonyms: ["បង្អង់", "ចាំ"],
    antonyms: [],
    relatedWords: ["បង្អង់"],
    example: "ឈប់អង់។"
  },
  "អង": {
    word: "អង",
    pronunciation: "អង់",
    definition: "(ន.) រង្វាស់ (Unit of measure).",
    homophones: [
      { word: "អង្គ", definition: "តួ / រូប", pronunciation: "អង់" },
      { word: "អង់", definition: "បង្អង់ / រង់ចាំ", pronunciation: "អង់" },
      { word: "អង", definition: "រង្វាស់", pronunciation: "អង់" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: [],
    example: "អង។"
  },
  "អដ្ឋ": {
    word: "អដ្ឋ",
    pronunciation: "អាត់",
    definition: "(ន.) ប្រាំបី (Eight - Pali).",
    homophones: [
      { word: "អដ្ឋ", definition: "ប្រាំបី", pronunciation: "អាត់" },
      { word: "អត្ថ", definition: "សេចក្តី", pronunciation: "អាត់" },
      { word: "អឌ្ឍ", definition: "ពាក់កណ្តាល", pronunciation: "អាត់" },
      { word: "អត្ត", definition: "ខ្លួន", pronunciation: "អាត់" },
      { word: "អាត់", definition: "លុយអាត់", pronunciation: "អាត់" }
    ],
    synonyms: ["ប្រាំបី"],
    antonyms: [],
    relatedWords: [],
    example: "អដ្ឋង្គិកមគ្គ។"
  },
  "អត្ថ": {
    word: "អត្ថ",
    pronunciation: "អាត់",
    definition: "(ន.) សេចក្តី, ន័យ, ប្រយោជន៍ (Meaning/Benefit).",
    homophones: [
      { word: "អដ្ឋ", definition: "ប្រាំបី", pronunciation: "អាត់" },
      { word: "អត្ថ", definition: "សេចក្តី", pronunciation: "អាត់" }
    ],
    synonyms: ["ន័យ"],
    antonyms: [],
    relatedWords: ["អត្ថន័យ"],
    example: "អត្ថន័យ។"
  },
  "អឌ្ឍ": {
    word: "អឌ្ឍ",
    pronunciation: "អាត់",
    definition: "(ន.) ពាក់កណ្តាល (Half).",
    homophones: [
      { word: "អឌ្ឍ", definition: "ពាក់កណ្តាល", pronunciation: "អាត់" },
      { word: "អត្ត", definition: "ខ្លួន", pronunciation: "អាត់" }
    ],
    synonyms: ["កន្លះ"],
    antonyms: ["ពេញ"],
    relatedWords: ["អឌ្ឍចន្ទ"],
    example: "អឌ្ឍចន្ទ។"
  },
  "អត្ត": {
    word: "អត្ត",
    pronunciation: "អាត់",
    definition: "(ន.) ខ្លួន, ខ្លួនឯង (Self/Ego).",
    homophones: [
      { word: "អត្ត", definition: "ខ្លួន", pronunciation: "អាត់" },
      { word: "អត្ថ", definition: "សេចក្តី", pronunciation: "អាត់" }
    ],
    synonyms: ["ខ្លួន"],
    antonyms: [],
    relatedWords: ["អត្តសញ្ញាណ"],
    example: "អត្តចរិត។"
  },
  "អាត់": {
    word: "អាត់",
    pronunciation: "អាត់",
    definition: "(ន.) ឈ្មោះប្រាក់បុរាណ (Ancient currency).",
    homophones: [
      { word: "អត្ត", definition: "ខ្លួន", pronunciation: "អាត់" },
      { word: "អាត់", definition: "លុយអាត់", pronunciation: "អាត់" }
    ],
    synonyms: ["លុយ"],
    antonyms: [],
    relatedWords: [],
    example: "លុយអាត់។"
  },
  "អន់": {
    word: "អន់",
    pronunciation: "អន់",
    definition: "(គុ.) ថយ, មិនល្អ, ទាប (Inferior/Poor/Low).",
    homophones: [
      { word: "អន់", definition: "ថយ / មិនល្អ", pronunciation: "អន់" },
      { word: "អន្ធ", definition: "ងងឹត", pronunciation: "អន់" }
    ],
    synonyms: ["ថយ"],
    antonyms: ["ល្អ", "ប្រសើរ"],
    relatedWords: ["អន់ចិត្ត"],
    example: "គុណភាពអន់។"
  },
  "អន្ធ": {
    word: "អន្ធ",
    pronunciation: "អន់",
    definition: "(គុ.) ងងឹត, ខ្វាក់ (Blind/Dark - Pali).",
    homophones: [
      { word: "អន់", definition: "ថយ / មិនល្អ", pronunciation: "អន់" },
      { word: "អន្ធ", definition: "ងងឹត", pronunciation: "អន់" }
    ],
    synonyms: ["ងងឹត", "ខ្វាក់"],
    antonyms: ["ភ្លឺ"],
    relatedWords: ["អន្ធការ"],
    example: "អន្ធការ។"
  },
  "អាចារ": {
    word: "អាចារ",
    pronunciation: "អាចា",
    definition: "(ន.) មារយាទ, ការប្រព្រឹត្ត (Conduct/Behavior).",
    homophones: [
      { word: "អាចារ", definition: "មារយាទ", pronunciation: "អាចា" },
      { word: "អាចារ្យ", definition: "គ្រូ", pronunciation: "អាចា" }
    ],
    synonyms: ["មារយាទ"],
    antonyms: [],
    relatedWords: [],
    example: "អនាចារ។"
  },
  "អាចារ្យ": {
    word: "អាចារ្យ",
    pronunciation: "អាចា",
    definition: "(ន.) គ្រូ, អ្នកប្រៀនប្រដៅ (Teacher/Master/Lay priest).",
    homophones: [
      { word: "អាចារ", definition: "មារយាទ", pronunciation: "អាចា" },
      { word: "អាចារ្យ", definition: "គ្រូ", pronunciation: "អាចា" }
    ],
    synonyms: ["គ្រូ"],
    antonyms: ["សិស្ស"],
    relatedWords: ["អាចារ្យវត្ត"],
    example: "លោកអាចារ្យ។"
  },
  "អាថ៌": {
    word: "អាថ៌",
    pronunciation: "អាត",
    definition: "(ន.) សេចក្តីកំបាំង, រឿងសម្ងាត់ (Secret/Mystery).",
    homophones: [
      { word: "អាថ៌", definition: "កំបាំង / សម្ងាត់", pronunciation: "អាត" },
      { word: "អាទិ", definition: "ដើម / ដំបូង", pronunciation: "អាត" }
    ],
    synonyms: ["សម្ងាត់"],
    antonyms: ["ចំហ"],
    relatedWords: ["អាថ៌កំបាំង"],
    example: "រឿងអាថ៌កំបាំង។"
  },
  "អាទិ": {
    word: "អាទិ",
    pronunciation: "អាត",
    definition: "(ន.) ដើម, ដំបូង (Beginning/Start).",
    homophones: [
      { word: "អាថ៌", definition: "កំបាំង / សម្ងាត់", pronunciation: "អាត" },
      { word: "អាទិ", definition: "ដើម / ដំបូង", pronunciation: "អាត" }
    ],
    synonyms: ["ដើម", "ដំបូង"],
    antonyms: ["ចុង"],
    relatedWords: ["អាទិភាព"],
    example: "ជាអាទិ៍។"
  },
  "អាប់": {
    word: "អាប់",
    pronunciation: "អាប់",
    definition: "(ន.) ផ្សែងសើម, ស្រអាប់ (Fog/Mist/Dim).",
    homophones: [
      { word: "អាប់", definition: "ផ្សែង / ស្រអាប់", pronunciation: "អាប់" },
      { word: "អប្ប", definition: "តិច", pronunciation: "អាប់" },
      { word: "អ័ព្ទ", definition: "អាប់ (សរសេរខ្លះ)", pronunciation: "អាប់" }
    ],
    synonyms: ["ចុះអ័ព្ទ"],
    antonyms: ["ភ្លឺ"],
    relatedWords: ["ស្រអាប់"],
    example: "មេឃអាប់។"
  },
  "អប្ប": {
    word: "អប្ប",
    pronunciation: "អាប់",
    definition: "(គុ.) តិច (Little/Few).",
    homophones: [
      { word: "អាប់", definition: "ផ្សែង / ស្រអាប់", pronunciation: "អាប់" },
      { word: "អប្ប", definition: "តិច", pronunciation: "អាប់" }
    ],
    synonyms: ["តិច"],
    antonyms: ["ច្រើន"],
    relatedWords: ["អប្បបរមា"],
    example: "តម្លៃអប្បបរមា។"
  },
  "អ័ព្ទ": {
    word: "អ័ព្ទ",
    pronunciation: "អាប់",
    definition: "(ន.) ផ្សែងអ័ព្ទ (Fog).",
    homophones: [
      { word: "អាប់", definition: "ផ្សែង / ស្រអាប់", pronunciation: "អាប់" },
      { word: "អ័ព្ទ", definition: "អាប់", pronunciation: "អាប់" }
    ],
    synonyms: ["អាប់"],
    antonyms: [],
    relatedWords: [],
    example: "ចុះអ័ព្ទ។"
  },
  "អារម្មណ៍": {
    word: "អារម្មណ៍",
    pronunciation: "អា-រំ",
    definition: "(ន.) ធម្មជាតិដែលចិត្តនឹកគិត, សេចក្តីត្រេកអរ (Emotion/Feeling).",
    homophones: [
      { word: "អារម្មណ៍", definition: "មនោសញ្ចេតនា", pronunciation: "អា-រំ" },
      { word: "អារម្ភ", definition: "ផ្តើម", pronunciation: "អា-រំ" }
    ],
    synonyms: ["មនោសញ្ចេតនា"],
    antonyms: [],
    relatedWords: [],
    example: "មានអារម្មណ៍ល្អ។"
  },
  "អារម្ភ": {
    word: "អារម្ភ",
    pronunciation: "អា-រំ",
    definition: "(កិ.) ផ្តើម, តាំង (To begin/start).",
    homophones: [
      { word: "អារម្មណ៍", definition: "មនោសញ្ចេតនា", pronunciation: "អា-រំ" },
      { word: "អារម្ភ", definition: "ផ្តើម", pronunciation: "អា-រំ" }
    ],
    synonyms: ["ផ្តើម"],
    antonyms: ["បញ្ចប់"],
    relatedWords: ["អារម្ភកថា"],
    example: "អារម្ភកថា។"
  },
  "ឥដ្ឋ": {
    word: "ឥដ្ឋ",
    pronunciation: "អិត",
    definition: "(ន.) ដីដុតសម្រាប់សាងសង់ (Brick).",
    homophones: [
      { word: "ឥដ្ឋ", definition: "ដីដុត", pronunciation: "អិត" },
      { word: "ឥត", definition: "គ្មាន", pronunciation: "អិត" }
    ],
    synonyms: [],
    antonyms: [],
    relatedWords: ["ឥដ្ឋការ"],
    example: "សំណង់ឥដ្ឋ។"
  }
};