// Khmer spoonerisms (ពាក្យគន្លាស់កាត់): the word list and pure helpers for the
// Khmer Spoonerisms tool. No imports, so tests/khmer-spoonerisms.test.mjs can
// run it under Node.
//
// PROVENANCE: the entries are copied verbatim from a user-supplied standalone
// app (khmer_spoonerisms_app.html, contributed by the site owner). The six
// entries marked `fromImage` come from a widely shared image of Khmer
// spoonerisms whose original author is unknown (Provenance Pending). The other
// entries came with that file and have NOT been checked by a Khmer language
// reviewer; they are labelled as unverified in the UI and must not be
// presented as an authoritative list.
//
// Each entry: `meaning` is the plain phrase, `spoonerism` is the same phrase
// with sounds swapped between syllables, and `word` is the headword pair the
// entry is filed under.

export type SpoonerismCategory = "image" | "general" | "funny" | "love" | "sad";

export interface Spoonerism {
  id: number;
  word: string;
  spoonerism: string;
  meaning: string;
  category: SpoonerismCategory;
  /** One of the six entries shown in the original shared image. */
  fromImage?: boolean;
  /** Added by the user in this browser (not part of the bundled list). */
  custom?: boolean;
}

export const SPOONERISM_CATEGORIES: { id: SpoonerismCategory; en: string; km: string }[] = [
  { id: "image", en: "From the original image", km: "ក្នុងរូបភាព" },
  { id: "general", en: "General", km: "ទូទៅ" },
  { id: "funny", en: "Funny", km: "កំប្លែង" },
  { id: "love", en: "Love", km: "ស្នេហា" },
  { id: "sad", en: "Sad", km: "កំសត់" },
];

export const SPOONERISMS: Spoonerism[] = [
  { id: 1, word: "ក្រមុំក្រមាច់", spoonerism: "ក្រមាច់ពេញសុំ", meaning: "ក្រមុំពេញសាច់", category: "image", fromImage: true },
  { id: 2, word: "ស្បថស្បែ", spoonerism: "ស្បែមិនកត់", meaning: "ស្បថមិនកែ", category: "image", fromImage: true },
  { id: 3, word: "ស្នេហ៍ស្និទ្ធ", spoonerism: "ស្និទ្ធជាប់ចែ", meaning: "ស្នេហ៍ជាប់ចិត្ត", category: "image", fromImage: true },
  { id: 4, word: "សមសួន", spoonerism: "សួនទាំងខ្លំ", meaning: "សមទាំងខ្លួន", category: "image", fromImage: true },
  { id: 5, word: "ក្មេងក្មាង", spoonerism: "ក្មាងនៅជិតខេង", meaning: "ក្មេងនៅជិតខាង", category: "image", fromImage: true },
  { id: 6, word: "ក្រីក្រ", spoonerism: "ក្រីអប្រ", meaning: "ក្រអប្រិយ", category: "image", fromImage: true },
  { id: 7, word: "កាក់កប", spoonerism: "កាក់គ្រប់ដំណប", meaning: "កបគ្រប់ដំណាក់", category: "general" },
  { id: 8, word: "កំលោះកំលាំង", spoonerism: "កំលោះទាំងអាំង", meaning: "កំលាំងទាំងអស់", category: "general" },
  { id: 9, word: "ក្រៀមក្រំ", spoonerism: "ក្រំដូចគេវាយឌៀម", meaning: "ក្រៀមដូចគេវាយដំ", category: "general" },
  { id: 10, word: "កណ្តោចកណ្តែង", spoonerism: "កណ្តែងតែម្នាច់អោច", meaning: "កណ្តោចតែម្នាក់ឯង", category: "sad" },
  { id: 11, word: "កំព្រីកំព្រា", spoonerism: "កំព្រីដោយឥតមេជា", meaning: "កំព្រាដោយឥតមេជី", category: "sad" },
  { id: 12, word: "កំប្លុកកំប្លែង", spoonerism: "កំប្លុកថ្លែង", meaning: "កំប្លែងត្លុក", category: "funny" },
  { id: 13, word: "ខិតខំ", spoonerism: "ខិតធ្វើការឲ្យអស់ពីចំ", meaning: "ខំធ្វើការឲ្យអស់ពីចិត្ត", category: "general" },
  { id: 14, word: "ខ្ទេចខ្ទី", spoonerism: "ខ្ទីដូចធូលេច", meaning: "ខ្ទេចដូចធូលី", category: "sad" },
  { id: 15, word: "ខ្វាយខ្វល់", spoonerism: "ខ្វាយក្នុងរូបកល់", meaning: "ខ្វល់ក្នុងរូបកាយ", category: "sad" },
  { id: 16, word: "ខ្មីឃ្មាត", spoonerism: "ឃ្មាតខំធ្វើការកុំឲ្យបង់មាយ៉ី", meaning: "ខ្មីខំធ្វើការកុំឲ្យបង់មារយាទ", category: "general" },
  { id: 17, word: "ខ្មោះខ្មួរ", spoonerism: "ខ្មួរដល់ខោះ", meaning: "ខ្មោះដល់ខួរ", category: "funny" },
  { id: 18, word: "គិតគួរ", spoonerism: "គួរដើម្បីឲ្យបានធិត", meaning: "គិតដើម្បីឲ្យបានធូរ", category: "general" },
  { id: 19, word: "គំរោះគំរើយ", spoonerism: "គំរើយដោយជំលោះ", meaning: "គំរោះដោយជំលើយ", category: "general" },
  { id: 20, word: "គ្រាំគ្រា", spoonerism: "គ្រាព្រោះចាស់ជរាំ", meaning: "គ្រាំព្រោះចាស់ជរា", category: "sad" },
  { id: 21, word: "ងងឹតងងុល", spoonerism: "ងងុលមើលពុំយិត", meaning: "ងងឹតមើលពុំយល់", category: "general" },
  { id: 22, word: "ចំណីចំណុក", spoonerism: "ចំណុកច្រើនគ្រប់ម៉ី", meaning: "ចំណីច្រើនគ្រប់មុខ", category: "general" },
  { id: 23, word: "ចង្អៀតចង្អល់", spoonerism: "ចង្អល់តប់ប្រមៀត", meaning: "ចង្អៀតតប់ប្រមល់", category: "sad" },
  { id: 24, word: "ចែចង់", spoonerism: "ចែស្នង់", meaning: "ចង់ស្នេហ៍", category: "love" },
  { id: 25, word: "ឆ្អិនឆ្អៅ", spoonerism: "ឆ្អៅពុំមានឆិន", meaning: "ឆ្អិនពុំមានឆៅ", category: "general" },
  { id: 26, word: "ជ្រុលជ្រួស", spoonerism: "ជ្រួសដើរហ៊ុល", meaning: "ជ្រុលដើរហួស", category: "general" },
  { id: 27, word: "ជាតិជៅ", spoonerism: "ជៅលើចុងភៀត", meaning: "ជាតិលើចុងភៅ", category: "funny" },
  { id: 28, word: "ឈ្ងុយឈ្ងប់", spoonerism: "ឈ្ងប់មិនឈុយ", meaning: "ឈ្ងុយមិនឈប់", category: "general" },
  { id: 29, word: "ឈ្លក់ឈ្លី", spoonerism: "ឈ្លីដោយញីញក់", meaning: "ឈ្លក់ដោយញក់ញី", category: "general" },
  { id: 30, word: "ដុកដាន់", spoonerism: "ដាន់រុកកួនដោយចិត្តប្រកុក", meaning: "ដុករុកកួនដោយចិត្តប្រកាន់", category: "general" },
  { id: 31, word: "តឹងតែង", spoonerism: "តែងដូចខ្សែខ្លឹង", meaning: "តឹងដូចខ្សែខ្លែង", category: "general" },
  { id: 32, word: "ថ្លោះធ្លោយ", spoonerism: "ធ្លោយដោយមានការបណ្តែងបណ្តោះ", meaning: "ថ្លោះដោយមានការបណ្តែតបណ្តោយ", category: "general" },
  { id: 33, word: "ថ្មីថ្មោង", spoonerism: "ថ្មីព្រហ្មចារ៉ោង", meaning: "ថ្មោងព្រហ្មចារីយ៍", category: "love" },
  { id: 34, word: "ទាក់ទង", spoonerism: "ទងឲ្យត្រូវទំនាក់", meaning: "ទាក់ឲ្យត្រូវទំនង", category: "general" },
  { id: 35, word: "ធំធេង", spoonerism: "ធេងគួរឲ្យរង្វំ", meaning: "ធំគួរឲ្យវង្វេង", category: "general" },
  { id: 36, word: "ធ្ងន់ធ្ងរ", spoonerism: "ធ្ងរដូចនៅក្រោមទំងន់", meaning: "ធ្ងន់ដូចនៅក្រោមគំនរ", category: "general" },
  { id: 37, word: "ប្រយ័ត្នប្រយែង", spoonerism: "ប្រយែងដោយខ្លួនអាត់", meaning: "ប្រយ័ត្នដោយខ្លួនឯង", category: "general" },
  { id: 38, word: "ប្រកៀកប្រកើយ", spoonerism: "ប្រកើយបំរុងអៀក", meaning: "ប្រកៀកបំរុងអោយ", category: "love" },
  { id: 39, word: "ផ្ទុញផ្ទាល់", spoonerism: "ផ្ទាល់ធ្វើឲ្យទុញ", meaning: "ផ្ទុញធ្វើឲ្យទាល់", category: "general" },
  { id: 40, word: "ផ្អៀងផ្អង", spoonerism: "ផ្អងជាច្រើនដៀង", meaning: "ផ្អៀងជាច្រើនដង", category: "general" },
  { id: 41, word: "ពាក្យពេចន៍", spoonerism: "ពេចន៍ដែលគេរំលៀក", meaning: "ពាក្យដែលគេរំលេច", category: "general" },
  { id: 42, word: "ល្អិតល្អន់", spoonerism: "ល្អន់ដូចគេអង្កិត", meaning: "ល្អិតដូចគេអង្កន់", category: "general" },
  { id: 43, word: "ល្វីងល្វើយ", spoonerism: "ល្វើយគ្មានកោះត្រឹង", meaning: "ល្វីងគ្មានកោះត្រើយ", category: "sad" },
  { id: 44, word: "យឺតយ៉ាវ", spoonerism: "យ៉ាវទាល់តែស្រែកហ៊ូ", meaning: "យូរទាល់តែស្រែកហៅ", category: "funny" },
  { id: 45, word: "វង្វេងវង្វាន់", spoonerism: "វង្វាន់ច្រឡំស្មារតីធេង", meaning: "វង្វេងច្រឡំស្មារតីកាន់", category: "general" },
  { id: 46, word: "ស្ទុះស្ទា", spoonerism: "ស្ទារេរុះ", meaning: "ស្ទុះរេរា", category: "general" },
  { id: 47, word: "ស្នេហ៍ស្នង", spoonerism: "ស្នងអូនបែរ", meaning: "ស្នេហ៍អូនបង", category: "love" },
  { id: 48, word: "ហាមប្រាម", spoonerism: "ប្រាមដោយមានបំរាប់", meaning: "ប្រាប់ដោយមានបំរាម", category: "general" },
  { id: 49, word: "ហូរហៀរ", spoonerism: "ហៀរដូចគេកួរ", meaning: "ហូរដូចគេកៀរ", category: "general" },
  { id: 50, word: "ហូរហែ", spoonerism: "ហែរដូចខ្សូ", meaning: "ហូរដូចខ្សែ", category: "general" },
  { id: 51, word: "អៀនអន់", spoonerism: "អន់ព្រោះគេចំអៀន", meaning: "អៀនព្រោះគេចំអន់", category: "funny" },
  { id: 52, word: "អើតអើម", spoonerism: "អើមមើលដង្ហើត", meaning: "អើតមើលដង្ហើម", category: "general" },
  { id: 53, word: "អែបអប", spoonerism: "អបជារណែប", meaning: "អែបជារណប", category: "general" },
  { id: 54, word: "នឹងនរ", spoonerism: "នរជំហឹង", meaning: "នឹងជំហរ", category: "general" },
  { id: 55, word: "គគ្រឹកគគ្រេង", spoonerism: "គគ្រេងព្រោះមានមនុស្សច្រើនមកលងបុណ្យស្តប់ភ្លឺក", meaning: "គគ្រឹកព្រោះមានមនុស្សច្រើនមកលេងបុណ្យស្តាប់ភ្លេង", category: "funny" },
  { id: 56, word: "វត្តវ៉ា", spoonerism: "វ៉ាបញ្ចុះសីមាត់", meaning: "វត្តបញ្ចុះសីមា", category: "general" },
  { id: 57, word: "សំលសំលុក", spoonerism: "សំលុកបង់ប្រហរ", meaning: "សំលបង់ប្រហុក", category: "funny" },
  { id: 58, word: "កំសត់កំសោយ", spoonerism: "កំសោយមិនមានអ្នកណាដត់", meaning: "កំសត់មិនមានអ្នកណាដោយ", category: "sad" },
  { id: 59, word: "ក្រវីក្រវាត់", spoonerism: "ក្រវាត់កុំឲ្យនៅជិតវី", meaning: "ក្រវីកុំឲ្យនៅជិតវាត់", category: "general" },
  { id: 60, word: "ខ្នាញ់ខ្នែង", spoonerism: "ខ្នែងឡើងទាញ", meaning: "ខ្នាញ់ឡើងទែង", category: "funny" },
  { id: 61, word: "ចាស់ជរា", spoonerism: "ជរាគួរឲ្យអាណាស់", meaning: "ចាស់គួរឲ្យអាណិត(ជិត)", category: "sad" },
  { id: 62, word: "ឆ្ងាយឆ្ងល់", spoonerism: "ឆ្ងល់មើលមិនសូវស្តាយ", meaning: "ឆ្ងាយមើលមិនសូវស្គាល់", category: "general" },
  { id: 63, word: "ឈឺចាប់", spoonerism: "ចាប់ចុកក្នុងគ្រឺ", meaning: "ឈឺចុកក្នុងគ្រាប់", category: "sad" },
  { id: 64, word: "ញញឹមញញែម", spoonerism: "ញញែមគួរឲ្យចង់ថឹម", meaning: "ញញឹមគួរឲ្យចង់ថែម", category: "love" },
  { id: 65, word: "តក់ស្លុត", spoonerism: "ស្លុតចិត្តរន្ធក់", meaning: "តក់ចិត្តរន្ធត់", category: "sad" },
  { id: 66, word: "ថ្នាក់ថ្នម", spoonerism: "ថ្នមបីបាក់", meaning: "ថ្នាក់បីបម", category: "love" },
  { id: 67, word: "ទន់ភ្លន់", spoonerism: "ភ្លន់គួរឲ្យគយគន់ជាទម្ងន់", meaning: "ទន់គួរឲ្យគយគន់ជាទម្លាប់", category: "general" },
  { id: 68, word: "នឹកនា", spoonerism: "នាដោយសេចក្តីស្វឹក", meaning: "នឹកដោយសេចក្តីស្នេហា", category: "love" },
  { id: 69, word: "ប្លែកប្លាត", spoonerism: "ប្លាតមិនដែលហែក", meaning: "ប្លែកមិនដែលហាត", category: "general" },
  { id: 70, word: "ផូរផង់", spoonerism: "ផង់ដូចដុំសូរ", meaning: "ផូរដូចដុំសង់", category: "general" },
  { id: 71, word: "ពិតប្រាកដ", spoonerism: "ប្រាកដមិនមានការឃ្លិត", meaning: "ពិតមិនមានការឃ្លាត", category: "general" },
  { id: 72, word: "ភ័យភិត", spoonerism: "ភិតញាប់ញ័ររញ្ជ័យ", meaning: "ភ័យញាប់ញ័ររញ្ជួយ", category: "sad" },
  { id: 73, word: "មាំមួន", spoonerism: "មួនរក្សាខ្លួនឲ្យបានគាំ", meaning: "មាំរក្សាខ្លួនឲ្យបានគួន", category: "general" },
  { id: 74, word: "យូរយង់", spoonerism: "យង់កន្លងហូរ", meaning: "យូរកន្លងហង់", category: "general" },
  { id: 75, word: "រស់រវើក", spoonerism: "រវើកដូចមានជីវស់", meaning: "រស់ដូចមានជីវិត", category: "general" },
  { id: 76, word: "លង់លក់", spoonerism: "លក់មិនដឹងខ្លួនត្រង់", meaning: "លង់មិនដឹងខ្លួនត្រឡប់", category: "general" },
  { id: 77, word: "សើចសប្បាយ", spoonerism: "សប្បាយរាយរើច", meaning: "សើចរាយរបាយ", category: "funny" },
  { id: 78, word: "ហ្មត់ចត់", spoonerism: "ចត់ឥតមានខ្ចោះរហ្មត់", meaning: "ហ្មត់ឥតមានខ្ចោះរហូត", category: "general" },
  { id: 79, word: "ឡូឡា", spoonerism: "ឡាធ្វើឲ្យថ្លង់សូរ", meaning: "ឡូធ្វើឲ្យថ្លង់សោត", category: "funny" },
  { id: 80, word: "អណ្តែតអណ្តូង", spoonerism: "អណ្តូងហោះហើរតាមខ្យ៉ែត", meaning: "អណ្តែតហោះហើរតាមខ្យល់", category: "general" },
  { id: 81, word: "ឯកោ", spoonerism: "កោរស់នៅតែម្នាក់អែក", meaning: "ឯករស់នៅតែម្នាក់ឯង", category: "sad" },
  { id: 82, word: "ឱ្យទាន", spoonerism: "ទានដល់អ្នកក្រខ្សោយ", meaning: "ឱ្យដល់អ្នកក្រខ្សត់", category: "general" },
  { id: 83, word: "កាត់កង", spoonerism: "កងឲ្យអស់ពីស្មាត់", meaning: "កាត់ឲ្យអស់ពីស្មង", category: "general" },
  { id: 84, word: "ខឹងសម្បា", spoonerism: "សម្បាមុខក្រហឹង", meaning: "ខឹងមុខក្រហម", category: "sad" },
  { id: 85, word: "គូគាប់", spoonerism: "គាប់រស់នៅយូរយូ", meaning: "គូរស់នៅយូរអង្វែង", category: "love" },
  { id: 86, word: "ឃាត់ឃាំង", spoonerism: "ឃាំងមិនឲ្យជិតមាត់", meaning: "ឃាត់មិនឲ្យជិតមាំង", category: "general" },
  { id: 87, word: "ងាយស្រួល", spoonerism: "ស្រួលមិនពិបាកឡាយ", meaning: "ងាយមិនពិបាកលំបាក", category: "general" },
  { id: 88, word: "ចងចាំ", spoonerism: "ចាំទុកក្នុងខួរក្បង", meaning: "ចងទុកក្នុងខួរក្បាល", category: "general" },
  { id: 89, word: "ឆបោក", spoonerism: "បោកយកទ្រព្យគេអសល្ប", meaning: "ឆយកទ្រព្យគេអស់រលីង", category: "sad" },
  { id: 90, word: "ជួបជុំ", spoonerism: "ជុំញាតិមិត្តសន្តួប", meaning: "ជួបញាតិមិត្តសន្តាន", category: "general" },
  { id: 91, word: "ឈ្នះចាញ់", spoonerism: "ចាញ់ជារឿងធម្មត្នះ", meaning: "ឈ្នះជារឿងធម្មតា", category: "general" },
  { id: 92, word: "ញាប់ញ័រ", spoonerism: "ញ័ររន្ធត់តក់ស្លាប់", meaning: "ញាប់រន្ធត់តក់ស្លុត", category: "sad" },
  { id: 93, word: "ដាំដុះ", spoonerism: "ដុះថែទាំឲ្យលូតលាំ", meaning: "ដាំថែទាំឲ្យលូតលាស់", category: "general" },
  { id: 94, word: "ឋានសួគ៌", spoonerism: "សួគ៌កន្លែងមានក្តីសុខសាន្ត", meaning: "ឋានកន្លែងមានក្តីសុខសប្បាយ", category: "love" },
  { id: 95, word: "ឌឺដង", spoonerism: "ដងនិយាយបញ្ជឺ", meaning: "ឌឺនិយាយបញ្ជោះ", category: "funny" },
  { id: 96, word: "ឍាមរា", spoonerism: "រាដើរយឺតយ៉ាម", meaning: "ឍាមដើរយឺតយ៉ាវ", category: "funny" },
  { id: 97, word: "ណែនាំ", spoonerism: "នាំបង្ហាញផ្លូវមែន", meaning: "ណែបង្ហាញផ្លូវត្រូវ", category: "general" },
  { id: 98, word: "តស៊ូ", spoonerism: "ស៊ូមិនព្រមចុះចញ់", meaning: "តមិនព្រមចុះចាញ់", category: "general" },
  { id: 99, word: "ថោកទាប", spoonerism: "ទាបប្រព្រឹត្តអាក្រោក", meaning: "ថោកប្រព្រឹត្តអាក្រក់", category: "sad" },
  { id: 100, word: "ទុំជោរ", spoonerism: "ជោរក្រហមទុំ", meaning: "ទុំក្រហមទុំ", category: "general" },
  { id: 101, word: "ធានារ៉ាប់រង", spoonerism: "រ៉ាប់រងទទួលខុសត្រានា", meaning: "ធានាទទួលខុសត្រូវ", category: "general" },
  { id: 102, word: "នឿយហត់", spoonerism: "ហត់សម្រាកបន្តឿយ", meaning: "នឿយសម្រាកបន្តិច", category: "general" },
];

/** Filter by category ("all" for every category) and a substring query over all three fields. */
export function filterSpoonerisms(list: Spoonerism[], category: SpoonerismCategory | "all", query: string): Spoonerism[] {
  const q = query.trim();
  return list.filter((w) => (category === "all" || w.category === category) && (!q || w.word.includes(q) || w.spoonerism.includes(q) || w.meaning.includes(q)));
}

/** The one-line form used in the shared image and for copying: word = spoonerism = meaning. */
export function formatSpoonerism(w: Pick<Spoonerism, "word" | "spoonerism" | "meaning">): string {
  return `${w.word} = ${w.spoonerism} = ${w.meaning}`;
}
