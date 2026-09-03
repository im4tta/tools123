import { CATEGORY_META, type ToolDef } from "@/lib/tools";
import { BASE_URL, toolUrl } from "@/lib/site";

type ToolBlurb = {
  en: string;
  km: string;
};

const TOOL_BLURBS: Record<string, ToolBlurb> = {
  "buddhist-era": {
    en: "Convert between Buddhist Era (BE) and Common Era (CE) years for Cambodian dates and official documents.",
    km: "បម្លែងរវាងឆ្នាំពុទ្ធសករាជ (ព.ស.) និងឆ្នាំគ្រិស្តសករាជ (គ.ស.) សម្រាប់កាលបរិច្ឆេទ និងឯកសារផ្លូវការ។",
  },
  "full-lunar-date": {
    en: "Look up a complete Khmer lunar date, including Buddhist Era, animal year, lunar month, and day.",
    km: "ស្វែងរកកាលបរិច្ឆេទចន្ទគតិខ្មែរពេញលេញ រួមមានពុទ្ធសករាជ ឆ្នាំសត្វ ខែ និងថ្ងៃចន្ទគតិ។",
  },
  "administrative-letter-builder": {
    en: "Create Khmer administrative letters from practical templates and export a ready-to-use official document.",
    km: "បង្កើតលិខិតរដ្ឋបាលខ្មែរពីគំរូអនុវត្តជាក់ស្តែង និងនាំចេញឯកសារផ្លូវការរួចរាល់សម្រាប់ប្រើប្រាស់។",
  },
  "administrative-hierarchy": {
    en: "Browse Cambodia's 25 provinces/capital, 210 districts, 1,661 communes, and 14,546 villages, or type to search any address by English, Khmer, or administrative code.",
    km: "រកមើលរាជធានី-ខេត្តទាំង ២៥ ក្រុង-ស្រុក-ខណ្ឌចំនួន ២១០ ឃុំ-សង្កាត់ចំនួន ១,៦៦១ និងភូមិចំនួន ១៤,៥៤៦ ឬវាយដើម្បីស្វែងរកអាសយដ្ឋានតាមឈ្មោះខ្មែរ អង់គ្លេស ឬលេខកូដរដ្ឋបាល។",
  },
  "khmer-sorter": {
    en: "Sort Khmer text lines or words into an approximate dictionary order with this bilingual tool.",
    km: "រៀបតម្រៀបបន្ទាត់ ឬពាក្យអត្ថបទខ្មែរតាមលំដាប់វចនានុក្រមប្រហាក់ប្រហែល ជាមួយឧបករណ៍ជាពីរភាសានេះ។",
  },
  "khmer-text-stats": {
    en: "Analyze Khmer text: count words, characters, consonants, vowels, diacritics, and digits by Unicode range.",
    km: "វិភាគអត្ថបទខ្មែរ៖ រាប់ពាក្យ តួអក្សរ ព្យញ្ជនៈ ស្រៈ សញ្ញាវណ្ណយុត្ត និងលេខតាមជួរ Unicode។",
  },
  "json-diff": {
    en: "Compare two JSON documents and see added, removed, and changed paths at a glance.",
    km: "ប្រៀបធៀបឯកសារ JSON ពីរ និងមើលឃើញអ្វីដែលបន្ថែម ដកចេញ និងផ្លាស់ប្តូរភ្លាមៗ។",
  },
  "excel-column-converter": {
    en: "Convert Excel column letters to numbers and back (A=1, Z=26, AA=27, up to XFD).",
    km: "បម្លែងអក្សរជួរឈរ Excel ទៅជាលេខ និងបញ្ច្រាស់ (A=1, Z=26, AA=27 រហូតដល់ XFD)។",
  },
  "text-compressor": {
    en: "Compress and decompress text in your browser with gzip or deflate, and compare the size savings.",
    km: "បង្ហាប់ និងស្រាយអត្ថបទនៅក្នុងកម្មវិធីរុករកជាមួយ gzip ឬ deflate ហើយប្រៀបធៀបទំហំដែលសន្សំបាន។",
  },
  "pixelate-image": {
    en: "Turn any photo into a pixel-art style image with an adjustable block size and PNG download.",
    km: "បំលែងរូបថតណាមួយទៅជារូបភាពបែប Pixel Art ជាមួយទំហំប្លុកដែលអាចលៃតម្រូវបាន និងទាញយក PNG។",
  },
  "chord-progression-generator": {
    en: "Browse and play common chord progressions in any key, with note names and audio preview.",
    km: "រកមើល និងស្តាប់ Chord Progression ទូទៅក្នុងគ្រប់សោភ្លេង ជាមួយឈ្មោះសន្លឹកភ្លេង និងការស្តាប់ជាក់ស្តែង។",
  },
  "audio-file-size-calculator": {
    en: "Estimate audio file size from bitrate, duration, and channels for MP3, WAV, and more.",
    km: "ប៉ាន់ស្មានទំហំឯកសារអូឌីយ៉ូពី Bitrate រយៈពេល និងចំនួន Channel សម្រាប់ MP3, WAV ជាដើម។",
  },
  "frame-rate-converter": {
    en: "Convert between video frame rates and see the resulting speed change and new duration.",
    km: "បម្លែងរវាង Frame Rate វីដេអូ ហើយមើលការប្រែប្រួលល្បឿន និងរយៈពេលថ្មី។",
  },
  "video-file-size-calculator": {
    en: "Estimate video file size from resolution, bitrate, and duration, with recommended bitrate references.",
    km: "ប៉ាន់ស្មានទំហំឯកសារវីដេអូពីគុណភាព ប៊ីតរេត និងរយៈពេល ជាមួយតារាងប៊ីតរេតដែលណែនាំ។",
  },
  "work-hours-calculator": {
    en: "Track daily work hours, breaks, overtime, and estimated pay with a simple time card.",
    km: "តាមដានម៉ោងធ្វើការប្រចាំថ្ងៃ ការសម្រាក ម៉ោងបន្ថែម និងប្រាក់ខែប៉ាន់ស្មានជាមួយតារាងម៉ោងសាមញ្ញ។",
  },
  "business-days-calculator": {
    en: "Count weekdays between two dates or add business days to a date, excluding weekends.",
    km: "រាប់ថ្ងៃធ្វើការរវាងកាលបរិច្ឆេទពីរ ឬបន្ថែមថ្ងៃធ្វើការទៅកាលបរិច្ឆេទ ដោយមិនរាប់បញ្ចូលថ្ងៃសៅរ៍-អាទិត្យ។",
  },
  "day-of-year-calculator": {
    en: "Find the day-of-year number, ISO week number, and days remaining for any date (or reverse it).",
    km: "ស្វែងរកលេខថ្ងៃទីប៉ុន្មាននៃឆ្នាំ លេខសប្តាហ៍ ISO និងចំនួនថ្ងៃដែលនៅសល់សម្រាប់កាលបរិច្ឆេទណាមួយ (ឬបញ្ច្រាស់)។",
  },
  "quadratic-equation-solver": {
    en: "Solve ax²+bx+c=0 with step-by-step working: discriminant, real or complex roots.",
    km: "ដោះស្រាយ ax²+bx+c=0 មួយជំហានម្តង៖ ឌីស្គ្រីមីណង់ ឫសពិត ឬឫសកុំផ្លិច។",
  },
  "angle-converter": {
    en: "Convert angles between degrees, radians, gradians, and turns instantly in every direction.",
    km: "បម្លែងមុំរវាងដឺក្រេ រ៉ាដ្យង់ ហ្គ្រេដ្យង់ និងជុំ ភ្លាមៗគ្រប់ទិសដៅ។",
  },
  "sleep-cycle-calculator": {
    en: "Find ideal bedtimes or wake times based on 90-minute sleep cycles for feeling more rested.",
    km: "ស្វែងរកពេលចូលគេង ឬពេលភ្ញាក់ដែលសមស្របតាមវដ្តនៃដំណេក ៩០ នាទី ដើម្បីឱ្យមានការសម្រាកគ្រប់គ្រាន់។",
  },
  "step-distance-calculator": {
    en: "Convert steps into distance using your height or stride, with an approximate calorie estimate.",
    km: "បម្លែងចំនួនជំហានទៅជាចម្ងាយដោយប្រើកម្ពស់ ឬជំហានរបស់អ្នក ជាមួយការប៉ាន់ស្មានកាឡូរី។",
  },
  "ingredient-substitution-guide": {
    en: "Look up quick cooking and baking substitutes for common ingredients like eggs, buttermilk, and more.",
    km: "ស្វែងរកគ្រឿងផ្សំជំនួសសម្រាប់ការចម្អិន និងដុតនំដូចជា ស៊ុត ទឹកដោះគោជូរ ជាដើម។",
  },
  "salary-calculator": {
    en: "Estimate net pay from gross salary with selectable progressive tax tables and a bracket breakdown.",
    km: "ប៉ាន់ស្មានប្រាក់ខែសុទ្ធពីប្រាក់ខែសរុប ជាមួយតារាងពន្ធរីកចម្រើនដែលអាចជ្រើសរើស និងលម្អិតតាមកម្រិតពន្ធ។",
  },
  "late-fee-calculator": {
    en: "Calculate the interest or fee on late payments from the principal, annual rate, and days overdue.",
    km: "គណនាការបន្ថែម ឬការប្រាក់លើការបង់យឺត ពីទឹកប្រាក់ដើម អត្រាប្រចាំឆ្នាំ និងចំនួនថ្ងៃយឺត។",
  },
  "morse-code-translator": {
    en: "Translate text to Morse code and back using the standard ITU alphabet, with copy buttons.",
    km: "បម្លែងអត្ថបទទៅជាកូដម័រស និងបញ្ច្រាស់ដោយប្រើអក្ខរក្រម ITU ស្តង់ដារ ជាមួយប៊ូតុងចម្លង។",
  },
  "word-search-generator": {
    en: "Generate printable word search puzzles from your own word list with solution included.",
    km: "បង្កើតល្បែងរកពាក្យដែលអាចបោះពុម្ពបានពីបញ្ជីពាក្យរបស់អ្នក រួមទាំងដំណោះស្រាយ។",
  },
  "khmer-address-parser": {
    en: "Paste a free-text Khmer or English address and split it into house, street, village, commune, district, and province fields.",
    km: "បិទភ្ជាប់អាសយដ្ឋានខ្មែរ ឬអង់គ្លេស ហើយបំបែកវាទៅជាផ្ទះ ផ្លូវ ភូមិ ឃុំ ស្រុក និងខេត្ត។",
  },
  "khmer-keyboard-layout": {
    en: "Explore the standard NIIDA Khmer keyboard layout, click keys to type, and find where any character sits.",
    km: "រកមើលប្លង់ក្តារចុចខ្មែរ NIIDA ស្តង់ដារ ចុចគ្រាប់ចុចដើម្បីវាយ និងស្វែងរកទីតាំងតួអក្សរណាមួយ។",
  },
  "khmer-loanword-dictionary": {
    en: "Look up common Khmer loanwords with their origin language, meaning, and usage examples.",
    km: "ស្វែងរកពាក្យកម្ចីខ្មែរទូទៅ ជាមួយភាសាប្រភព អត្ថន័យ និងឧទាហរណ៍ប្រើប្រាស់។",
  },
  "khmer-word-frequency": {
    en: "Paste Khmer text to see total and unique word counts and a ranked top-20 frequency chart.",
    km: "បិទភ្ជាប់អត្ថបទខ្មែរ ដើម្បីមើលចំនួនពាក្យសរុប ពាក្យតែមួយ និងតារាងប្រេកង់លំដាប់កំពូលទាំង ២០។",
  },
  "khmer-pronunciation-guide": {
    en: "Learn how Khmer consonants and vowels sound with approximate English equivalents and example words.",
    km: "រៀនពីការអានព្យញ្ជនៈ និងស្រៈខ្មែរ ជាមួយសំឡេងប្រហាក់ប្រហែលជាភាសាអង់គ្លេស និងពាក្យឧទាហរណ៍។",
  },
  "khmer-time-in-words": {
    en: "Convert any clock time into Khmer-spoken form — with Khmer numerals, day-part words (ព្រឹក, រសៀល, ល្ងាច…), and a live clock ticker.",
    km: "បម្លែងម៉ោងណាមួយទៅជាទម្រង់និយាយខ្មែរ — ជាមួយលេខខ្មែរ ពាក្យផ្នែកថ្ងៃ (ព្រឹក, រសៀល, ល្ងាច…) និងនាឡិកាផ្ទាល់។",
  },
  "khmer-uposatha-days": {
    en: "Find all four traditional Khmer Buddhist uposatha (ថ្ងៃសីល) observance days inside any Gregorian month or date range, using the Khmer lunisolar calendar.",
    km: "ស្វែងរកថ្ងៃសីល ៤ ប្រភេទជាប្រពៃណីព្រះសាសនាខ្មែរ (ថ្ងៃសីល) នៅក្នុងខែ ឬចន្លោះថ្ងៃណាមួយ តាមប្រតិទិនចន្ទគតិខ្មែរ។",
  },
  "khmer-baby-name-finder": {
    en: "Browse Khmer given names with their root meanings (Pali/Sanskrit glosses), filter by gender, search by name or meaning, keep favourites, and copy names.",
    km: "រកមើលឈ្មោះកណ្ដាលខ្មែរ ជាមួយអត្ថន័យឫស (ពាក្យបាលី សំស្ក្រឹត) ច្រោះតាមភេទ ស្វែងរកតាមឈ្មោះ ឬអត្ថន័យ រក្សាចំណូលចិត្ត និងចម្លងឈ្មោះ។",
  },
  "khmer-poem-metre-checker": {
    en: "Check Khmer poetry (កាព្យ) line by line for approximate syllable count, ending pattern, and consecutive rhyme groups — mismatches are flagged.",
    km: "ពិនិត្យកំណាព្យខ្មែរ (កាព្យ) ជាបន្ទាត់ៗ សម្រាប់ចំនួនព្យាង្គប្រហាក់ប្រហែល គំរូបញ្ចប់ និងក្រុមចង្វាក់ជាប់ៗ — បន្ទាត់ដែលមិនត្រូវគ្នាត្រូវបានសម្គាល់។",
  },
  "khmer-typing-test": {
    en: "Measure your Khmer typing speed (characters per minute) and accuracy across 4 built-in passages, with a live timer and per-character feedback.",
    km: "វាស់ល្បឿនវាយអក្សរខ្មែរ (ចំនួនតួក្នុងមួយនាទី) និងភាពត្រឹមត្រូវលើអត្ថបទ ៤ គំរូ ដោយមានម៉ោងរាប់ផ្ទាល់ និងផ្តល់មតិប្រតិកម្មតាមតួអក្សរ។",
  },
  "anagram-solver": {
    en: "Enter a pile of letters and find all dictionary words you can spell — filter by length or use a wildcard pattern like a__le.",
    km: "បញ្ចូលអក្សរជាច្រើន រកពាក្យវចនានុក្រមទាំងអស់ដែលអ្នកអាចប្រកបបាន — ច្រោះតាមប្រវែង ឬប្រើគំរូឥតកំណត់ដូចជា a__le。",
  },
  "secret-santa-draw": {
    en: "Run a Secret Santa gift exchange: enter names, draw privately one pair at a time, then copy the full giver→recipient list as CSV.",
    km: "ធ្វើការផ្លាស់ប្តូរអំណោយសម្ងាត់៖ បញ្ចូលឈ្មោះ គូរឯកជនម្តងមួយគូ រួចចម្លងបញ្ជីអ្នកឲ្យ→អ្នកទទួលទាំងមូលជា CSV។",
  },
  "name-compatibility": {
    en: "A playful compatibility score between two names, with a shake-to-reroll button and a Khmer-friendly verdict line. For entertainment only.",
    km: "ពិន្ទុភាពត្រូវគ្នាលេងសប្បាយរវាងឈ្មោះពីរ មានប៊ូតុងអង្រួនគណនាឡើងវិញ និងឃ្លាសម្រាយតាមបែបខ្មែរ។ សម្រាប់ការកម្សាន្តតែប៉ុណ្ណោះ។",
  },
  "flashcard-quiz": {
    en: "Build your own study deck with Question | Answer lines, then run a flashcard-style quiz until every card is marked mastered.",
    km: "បង្កើតសន្លឹកសិក្សាផ្ទាល់ខ្លួនដោយប្រើបន្ទាត់ សំណួរ | ចម្លើយ រួចសាកល្បងរហូតដល់សន្លឹកទាំងអស់ត្រូវបានសម្គាល់ថាចេះ។",
  },
  "honorific-guide": {
    en: "Find appropriate Khmer official honorifics, salutations, and formal address for letters and protocol.",
    km: "ស្វែងរកគោរមងារ ពាក្យសំពះ និងរបៀបហៅតាមផ្លូវការខ្មែរសម្រាប់លិខិត និងពិធីការ។",
  },
  "ministry-directory": {
    en: "Browse Cambodia government institutions and ministries in one practical directory.",
    km: "ស្វែងរកព័ត៌មានក្រសួង និងស្ថាប័នរដ្ឋកម្ពុជានៅក្នុងបញ្ជីតែមួយដែលងាយស្រួលប្រើ។",
  },
  "government-plate-lookup": {
    en: "Identify Cambodian government vehicle plate categories, agencies, and common state-vehicle markings.",
    km: "ស្គាល់ប្រភេទផ្លាកលេខរថយន្តរដ្ឋកម្ពុជា ស្ថាប័នពាក់ព័ន្ធ និងសញ្ញាសម្គាល់យានយន្តរដ្ឋ។",
  },
  "government-plate-parser": {
    en: "Parse and normalize Cambodia government vehicle plate text to identify its category and agency.",
    km: "វិភាគ និងកែទម្រង់អត្ថបទផ្លាកលេខរថយន្តរដ្ឋកម្ពុជា ដើម្បីសម្គាល់ប្រភេទ និងស្ថាប័នពាក់ព័ន្ធ។",
  },
  "safety-code-pro": {
    en: "Reference Cambodian construction safety practices, PPE color coding, regulations, and official sources.",
    km: "យោងអំពីការអនុវត្តសុវត្ថិភាពសំណង់កម្ពុជា ពណ៌ឧបករណ៍ PPE បទប្បញ្ញត្តិ និងប្រភពផ្លូវការ។",
  },
  "social-post-generator": {
    en: "Design a styled social post for X, Facebook, Telegram, or Instagram at the correct per-platform size and export it as a PNG, entirely in your browser.",
    km: "រចនាប៉ុស្តិ៍បណ្ដាញសង្គមសម្រាប់ X, Facebook, Telegram ឬ Instagram នៅទំហំត្រឹមត្រូវតាមវេទិកា ហើយនាំចេញជា PNG ដំណើរការទាំងស្រុងក្នុងកម្មវិធីរុករករបស់អ្នក។",
  },
  "math-symbols": {
    en: "Search a reference of common math symbols — name, meaning, LaTeX, and Unicode — and copy any symbol to your clipboard.",
    km: "ស្វែងរកសញ្ញាគណិតវិទ្យាទូទៅ — ឈ្មោះ អត្ថន័យ LaTeX និង Unicode — ហើយចម្លងសញ្ញាទៅក្ដារចម្លងរបស់អ្នក។",
  },
  "formula-solver": {
    en: "Pick a common formula, enter the values you know, and solve for any one variable — area, volume, speed, density, and more.",
    km: "ជ្រើសរើសរូបមន្តទូទៅ បញ្ចូលតម្លៃដែលអ្នកដឹង ហើយដោះស្រាយរកអថេរណាមួយ — ផ្ទៃក្រឡា មាឌ ល្បឿន ដង់ស៊ីតេ និងច្រើនទៀត។",
  },
  "permutation-combination": {
    en: "Compute permutations (nPr), combinations (nCr), and factorials exactly for integers.",
    km: "គណនាការរៀបលំដាប់ (nPr) ការបន្សំ (nCr) និងហ្វាក់តូរីយែលយ៉ាងជាក់លាក់សម្រាប់ចំនួនគត់។",
  },
  "complex-number": {
    en: "Add, subtract, multiply, and divide complex numbers (a + bi), with modulus, argument, and conjugate.",
    km: "បូក ដក គុណ និងចែកចំនួនកុំផ្លិច (a + bi) ព្រមទាំងម៉ូឌុល អាគុយម៉ង់ និងកុងជូហ្គេត។",
  },
  "geometry-calculator": {
    en: "Compute area, perimeter, volume, and surface area for common 2D and 3D shapes.",
    km: "គណនាផ្ទៃក្រឡា បរិមាត្រ មាឌ និងផ្ទៃប្រអប់សម្រាប់រាង 2D និង 3D ទូទៅ។",
  },
  "exponent-logarithm": {
    en: "Solve aᵇ = c for base, exponent, or result, and compute logarithms in any base.",
    km: "ដោះស្រាយ aᵇ = c រកគ្រឹះ ស្វ័យគុណ ឬលទ្ធផល និងគណនាលោការីតក្នុងគ្រឹះណាមួយ។",
  },
  "trig-values": {
    en: "Reference exact sine, cosine, and tangent for common angles, and compute them for any angle.",
    km: "យោងតម្លៃស៊ីនុស កូស៊ីនុស និងតង់សង់ពិតប្រាកដសម្រាប់មុំទូទៅ និងគណនាវាសម្រាប់មុំណាមួយ។",
  },
  "electronics-calculators": {
    en: "Calculate resistor color codes, LED series resistors, voltage dividers, and Ohm's law — all in your browser.",
    km: "គណនាកូដពណ៌រេស៊ីស្ទ័រ រេស៊ីស្ទ័រ LED បំរែបំរួលតង់ស្យុង និងច្បាប់អូម — ទាំងអស់ក្នុងកម្មវិធីរុករករបស់អ្នក។",
  },
  "one-rep-max": {
    en: "Estimate your one-rep max from weight and reps using Epley, Brzycki, Lombardi, and O'Conner formulas.",
    km: "ប៉ាន់ប្រមាណទម្ងន់អតិបរមាដែលអាចលើកបាន ១ដង ពីទម្ងន់ និងចំនួនដង ដោយរូបមន្ត Epley, Brzycki, Lombardi និង O'Conner។",
  },
  "matrix-operations": {
    en: "Add, multiply, transpose, invert, and find the determinant of 2×2 and 3×3 matrices.",
    km: "បូក គុណ ប្តូរជួរឈរ រកអ៊ីនវ៉េស និងដេតេមីណង់នៃម៉ាទ្រីស ២×២ និង ៣×៣។",
  },
  "vector-calculator": {
    en: "Compute dot and cross products, magnitude, angle, and projection for 2D and 3D vectors.",
    km: "គណនាគុណចំណុច និងគុណវ៉ិចទ័រ ម៉ាហ្គីនីទុយត មុំ និងការព្យាករសម្រាប់វ៉ិចទ័រ 2D និង 3D។",
  },
  "image-palette-extractor": {
    en: "Extract the dominant colors from any image as hex swatches with coverage percentages.",
    km: "ស្រង់ពណ៌សំខាន់ៗពីរូបភាពជាការ៉េ hex ជាមួយភាគរយគ្របដណ្តប់។",
  },
  "barcode-generator": {
    en: "Generate Code 128, EAN-13, EAN-8, UPC-A, and Code 39 barcodes as SVG.",
    km: "បង្កើតកូដបារកូដ Code 128, EAN-13, EAN-8, UPC-A និង Code 39 ជា SVG។",
  },
  "inflation-calculator": {
    en: "Estimate how purchasing power changes over time at a given annual inflation rate.",
    km: "ប៉ាន់ប្រមាណការប្រែប្រួលកម្លាំងទិញតាមពេលវេលា តាមអត្រាអតិផរណាប្រចាំឆ្នាំ។",
  },
  "svg-to-png": {
    en: "Render SVG markup to a PNG image at any size, entirely in your browser.",
    km: "បំប្លែងកូដ SVG ទៅជារូប PNG តាមទំហំណាមួយ ក្នុងកម្មវិធីរុករក។",
  },
  "deepseek-rate-desk": {
    en: "Check DeepSeek V4 API pricing with peak/off-peak windows and estimate token costs for any usage.",
    km: "ពិនិត្យតម្លៃ DeepSeek V4 API ជាមួយម៉ោងខ្ពស់/ទាប និងប៉ាន់ប្រមាណថ្លៃ Token សម្រាប់ការប្រើប្រាស់ណាមួយ។",
  },
  "excel-password-remover": {
    en: "Remove worksheet and workbook protection passwords from an .xlsx or .xlsm file, entirely in your browser.",
    km: "ដកពាក្យសម្ងាត់ការពារសន្លឹក និងសៀវភៅការងារពីឯកសារ .xlsx ឬ .xlsm ដំណើរការក្នុងកម្មវិធីរុករករបស់អ្នក។",
  },
  "webcam-mic-test": {
    en: "Test your webcam and microphone with a live preview, resolution readout, and input level meter.",
    km: "សាកល្បងកាមេរ៉ា និងមីក្រូហ្វូនជាមួយការមើលផ្ទាល់ គុណភាពបង្ហាញ និងកម្រិតសំឡេង។",
  },
  "screen-recorder": {
    en: "Record your screen, a window, or a browser tab to a WebM video — with optional microphone narration.",
    km: "ថតអេក្រង់ វីនដូ ឬផ្ទាំងកម្មវិធីរុករកទៅជា WebM — ជាមួយសំឡេងមីក្រូហ្វូនបើចង់បាន។",
  },
  "screen-color-picker": {
    en: "Pick any pixel on your screen with the built-in eyedropper and copy its hex, RGB, or HSL value.",
    km: "ជ្រើសរើសពណ៌ណាមួយលើអេក្រង់ដោយ eyedropper ហើយចម្លងតម្លៃ hex, RGB ឬ HSL។",
  },
  "periodic-table": {
    en: "Browse all 118 elements and compute the molar mass of any chemical formula.",
    km: "រុករកធាតុទាំង ១១៨ និងគណនាម៉ាសម៉ូលានៃរូបមន្តគីមីណាមួយ។",
  },
  "word-cloud": {
    en: "Turn any text into a word cloud sized by word frequency and export it as PNG.",
    km: "បម្លែងអត្ថបទទៅជាពពកពាក្យ ដែលទំហំផ្អែកលើប្រេកង់ពាក្យ និងនាំចេញជា PNG។",
  },
  "braille-translator": {
    en: "Convert text to grade-1 braille and back using Unicode braille patterns.",
    km: "បម្លែងអត្ថបទទៅជាអក្សរប្រៃយ៍កម្រិត១ និងត្រឡប់វិញ ដោយប្រើយូនីកូដប្រៃយ៍។",
  },
  "script-analyzer": {
    en: "Break text down by Unicode script, expose mixed-script homoglyph tricks like Cyrillic 'а' in 'аpple', and strip invisible characters.",
    km: "វិភាគអត្ថបទតាមយូនីកូដ បង្ហាញអក្សរក្លែងក្លាយ ហើយសម្អាតតួអក្សរក្រឡេកមិនឃើញ។",
  },
  "dns-lookup": {
    en: "Query live DNS records (A, AAAA, MX, TXT, NS, CNAME, SOA) for any domain via DNS-over-HTTPS.",
    km: "សួរកំណត់ត្រា DNS ផ្ទាល់ (A, AAAA, MX, TXT, NS, CNAME, SOA) សម្រាប់ដូមេនណាមួយ។",
  },
  "whats-my-ip": {
    en: "Show your public IP address with ISP and approximate location from a free IP API.",
    km: "បង្ហាញលេខ IP សាធារណៈរបស់អ្នក ព្រមទាំងអ៊ីស្ពី និងទីតាំងប្រហាក់ប្រហែល។",
  },
  "http-request-tester": {
    en: "Send HTTP requests with custom headers and bodies, then inspect status, timing, and response.",
    km: "ផ្ញើសំណើ HTTP ជាមួយក្បាល និងខ្លឹមសារដោយខ្លួនឯង ហើយពិនិត្យស្ថានភាព ពេលវេលា និងចម្លើយ។",
  },
  "hmac-generator": {
    en: "Compute HMAC signatures with SHA-1/256/384/512 locally via the Web Crypto API.",
    km: "គណនាហត្ថលេខា HMAC ដោយ SHA-1/256/384/512 ក្នុងឧបករណ៍តាម Web Crypto API។",
  },
  "text-to-speech": {
    en: "Read any text aloud with your browser's built-in voices, plus rate, pitch, and volume controls.",
    km: "អានអត្ថបទជាសំឡេងដោយសំឡេងក្នុងកម្មវិធីរុករក ព្រមទាំងគ្រប់គ្រងល្បឿន តុរឹង និងកម្រិត។",
  },
  "images-to-gif": {
    en: "Combine ordered images into an animated GIF with adjustable delay and quality.",
    km: "ផ្គុំរូបភាពតាមលំដាប់ទៅជា GIF មានចលនា ជាមួយពេល និងគុណភាពដែលអាចកំណត់បាន។",
  },
  "meme-generator": {
    en: "Add classic top and bottom captions to any image and export the result as PNG.",
    km: "បន្ថែមអត្ថបទខាងលើ និងខាងក្រោមទៅលើរូបភាព ហើយនាំចេញជា PNG។",
  },
  "file-checksum": {
    en: "Hash any file with SHA-1/256/384/512 and verify it against an expected checksum, entirely locally.",
    km: "គណនាកូដ SHA-1/256/384/512 នៃឯកសារណាមួយ ហើយផ្ទៀងផ្ទាត់ក្នុងឧបករណ៍របស់អ្នក។",
  },
  "speed-test": {
    en: "Measure real ping, jitter, download, and upload speed against Cloudflare's public endpoints.",
    km: "វាស់ពិង ជីតធឺ ការទាញយក និងការបញ្ជូនជាក់ស្តែងតាមចំណុចបម្រើ Cloudflare។",
  },
  "qr-batch": {
    en: "Turn a list of links or texts into many QR codes and download them all as a ZIP of SVGs.",
    km: "បម្លែងបញ្ជីតំណ ឬអត្ថបទទៅជាកូដ QR ជាច្រើន ដោយទាញយកជា ZIP នៃ SVG។",
  },
  "curl-converter": {
    en: "Paste a curl command and get equivalent fetch, axios, Python requests, or Go code.",
    km: "បិទភ្ជាប់ពាក្យបញ្ជា curl ហើយទទួលបានកូដ fetch, axios, Python requests ឬ Go សមមូល។",
  },
  "markdown-toc": {
    en: "Generate a table of contents with GitHub-style anchors from Markdown headings.",
    km: "បង្កើតតារាងមាតិកាជាមួយអង់គ័របែប GitHub ពីចំណងជើង Markdown។",
  },
  "voice-dictation": {
    en: "Dictate text with your voice using browser speech recognition — Khmer supported where available.",
    km: "សរសេរអត្ថបទដោយសំឡេងតាមការសម្គាល់សំឡេងរបស់កម្មវិធីរុករក — គាំទ្រភាសាខ្មែរ បើមាន។",
  },
  "savings-goal": {
    en: "Find how long it takes to reach a savings goal, or the monthly deposit needed to hit a deadline.",
    km: "រកពេលដែលត្រូវការដើម្បីសម្រេចគោលដៅសន្សំ ឬការដាក់ប្រាក់ក្នុងមួយខែតាមកាលកំណត់។",
  },
  "meta-tag-generator": {
    en: "Generate SEO and social-share meta tags — title, description, Open Graph, Twitter cards.",
    km: "បង្កើតសញ្ញាសម្គាល់ SEO និងបណ្ដាញសង្គម — ចំណងជើង ការពិពណ៌នា Open Graph Twitter cards។",
  },
  "pregnancy-due-date": {
    en: "Estimate a due date, current pregnancy week, and trimester dates from the last menstrual period.",
    km: "ប៉ាន់ប្រមាណថ្ងៃសម្រាល សប្តាហ៍ផ្ទៃពោះ និងកាលបរិច្ឆេទត្រីមាស ពីខែចុងក្រោយ។",
  },
  "debt-settle-up": {
    en: "Split shared expenses fairly and get the minimum transfers that settle everyone up.",
    km: "ចែកចំណាយរួមយុត្តិធម៌ ហើយទទួលបានការផ្ទេរប្រាក់តិចតួចបំផុត។",
  },
  "khmer-studio": {
    en: "Create print-ready Khmer PDFs with correct script shaping — variable-weight posters, crossword/word-search puzzles from a word list, paginated exam sheets with answer keys, and double-sided flashcard decks.",
    km: "បង្កើតឯកសារ PDF ខ្មែរដែលមានរូបរាងត្រឹមត្រូវ — ផ្ទាំងពុម្ពអក្សរ ល្បែងអូសអក្សរ សំណុំបែបបទប្រឡងជាមួយចម្លើយ និងកាតរំលឹក។",
  },
  "khmer-lyrics": {
    en: "Browse and read real Khmer song lyrics from the public khlyrics database — title and artist index, bilingual search, and a copy-ready view.",
    km: "ស្វែងរក និងអានខ្លឹមសារបទចម្រៀងខ្មែរពិតប្រាកដពីមូលដ្ឋានទិន្នន័យ khlyrics សាធារណៈ — លិបិក្រមតាមចំណងជើង និងអ្នកចម្រៀង ការស្វែងរកទ្វេភាសា និងទិដ្ឋភាពអាន។",
  },
  "site-forensics": {
    en: "Inspect any domain in one shot — live DNS records, HTTP response headers, WHOIS registration via RDAP, IP geolocation, and Wayback Machine history.",
    km: "ពិនិត្យដូមេនណាមួយក្នុងមួយដង — កំណត់ត្រា DNS ផ្ទាល់ បឋមកថា HTTP ការចុះបញ្ជី WHOIS ទីតាំង IP និងប្រវត្តិ Wayback Machine។",
  },
  "flight-route-planner": {
    en: "Compute the great-circle distance and estimated cruise time between two airports from real airport coordinates — a truthful distance reference, not a live fare scanner.",
    km: "គណនាចម្ងាយផ្ទៃធំ និងពេលហោះប៉ាន់ស្មានរវាងអាកាសយានដ្ឋានពីរ ពីកូអរដោនេពិតប្រាកដ — ជាឯកសារយោងចម្ងាយដ៏ពិតប្រាកដ មិនមែនជាឧបករណ៍ស្កេនតម្លៃផ្ទាល់ទេ។",
  },
  "map-poster-generator": {
    en: "Create a printable map poster of any location — a live pan-and-zoom map with a real basemap, exported as a high-resolution PNG.",
    km: "បង្កើតផ្ទាំងផែនទីសម្រាប់ទីកន្លែងណាមួយ — ផែនទីផ្ទាល់អូស-ពង្រីក ជាមួយផ្ទៃខាងក្រោយពិតប្រាកដ នាំចេញជា PNG គុណភាពខ្ពស់។",
  },
  "route-on-map": {
    en: "Draw the great-circle route between two airports on a real map and see the distance, using real OurAirports coordinates.",
    km: "គូសផ្លូវរវាងអាកាសយានដ្ឋានពីរលើផែនទីផ្ទាល់ និងមើលចម្ងាយ ដោយប្រើកូអរដោនេពិតប្រាកដពី OurAirports។",
  },
  "khmer-text-diff": {
    en: "Compare two Khmer texts and highlight what changed at the grapheme-cluster level, so stacked syllables stay intact.",
    km: "ប្រៀបធៀបអត្ថបទខ្មែរពីរ និងបន្លិចអ្វីដែលប្តូរប្រែនៅកម្រិតក្រុមអក្សរ ដើម្បីកុំឱ្យព្យាង្គពីរតួដាច់ពីគ្នា។",
  },
  "khmer-greeting-cards": {
    en: "Make an elegant Khmer greeting card from traditional well-wish templates — new year, wedding, condolence and more — and export it as a PNG.",
    km: "បង្កើតកាតជូនពរខ្មែរដ៏ស្រស់ស្អាតពីគំរូបុរាណ — ចូលឆ្នាំថ្មី អាពាហ៍ពិពាហ៍ រំលែកទុក្ខ និងច្រើនទៀត — រួចនាំចេញជា PNG។",
  },
  "khmer-bionic-reader": {
    en: "Bold the leading grapheme clusters of each Khmer word to skim stacked-syllable text faster — a Khmer-tuned bionic reader.",
    km: "ដិតក្រុមអក្សរនាំមុខនៃពាក្យខ្មែរនីមួយៗ ដើម្បីស្កេនអត្ថបទដែលមានព្យាង្គពីរតួគ្នាលឿនជាងមុន — ជាឧបករណ៍អានបែប bionic សម្រាប់ខ្មែរ។",
  },
  "magic-byte-checker": {
    en: "Detect a file's real type from its magic bytes (PNG, PDF, ZIP, DOCX, audio, video, fonts) — upload a file or paste hex, entirely in your browser.",
    km: "ស្វែងរកប្រភេទពិតប្រាកដរបស់ឯកសារពី magic bytes (PNG, PDF, ZIP, DOCX, សំឡេង, វីដេអូ, ពុម្ពអក្សរ) — ផ្ទុកឯកសារ ឬបិទភ្ជាប់ hex, ដំណើរការក្នុងកម្មវិធីរុករក។",
  },
  "water-bill-calculator": {
    en: "Estimate a water bill from monthly cubic-meter usage with editable tier rates — sample defaults you replace with your actual rates.",
    km: "ប៉ាន់ស្មានវិក្កយបត្រទឹកពីការប្រើប្រាស់ម៉ែត្រគូបប្រចាំខែ ដោយអត្រាកម្រិតដែលអាចកែបាន — អត្រាលំនាំដើមជាគំរូ សូមជំនួសដោយអត្រាពិតរបស់អ្នក។",
  },
  "nssf-payroll-calculator": {
    en: "Estimate NSSF contributions (employee + employer) with editable percentages — sample defaults you replace with the current official rates.",
    km: "ប៉ាន់ស្មានការរួមចំណែក NSSF (បុគ្គលិក + និយោជក) ដោយភាគរយដែលអាចកែបាន — តម្លៃលំនាំដើមជាគំរូ សូមជំនួសដោយអត្រាផ្លូវការ។",
  },
  "insurance-premium-estimator": {
    en: "Estimate a monthly insurance premium from tier, age band and members — sample default rates you replace with your real quote.",
    km: "ប៉ាន់ស្មានបុព្វលាភប្រចាំខែពីកម្រិត ក្រុមអាយុ និងចំនួនអ្នកធានា — អត្រាលំនាំដើមជាគំរូ សូមជំនួសដោយតម្លៃពិតរបស់អ្នក។",
  },
  "ride-fare-estimator": {
    en: "Estimate tuk-tuk or ride-hailing fares from distance or two points — sample rates you set to your own observed fares.",
    km: "ប៉ាន់ស្មានថ្លៃទុកទុក ឬរថយន្តកិច្ចសន្យាពីចម្ងាយ ឬពីរចំណុច — អត្រាគំរូដែលអ្នកកំណត់តាមថ្លៃពិតដែលអ្នកបានសង្កេត។",
  },
  "document-expiry-reminder": {
    en: "Check how long a passport, visa, or document stays valid, with a warning for the 6-month-before-expiry travel rule.",
    km: "ពិនិត្យរយៈពេលនៃលិខិតឆ្លងដែន ទិដ្ឋាការ ឬឯកសារនៅមានសុពលភាព ជាមួយក្រុមអាសន្នសម្រាប់ច្បាប់ ៦ ខែមុនផុតកំណត់។",
  },
  "emergency-hotlines": {
    en: "Quick bilingual reference for Cambodia emergency numbers, utility companies (EDC, PPWSA), telecom support, and government hotlines.",
    km: "ឯកសារយោងរហ័សជាពីរភាសាសម្រាប់លេខបន្ទាន់ ក្រុមហ៊ុនឧបករណ៍ប្រើប្រាស់ (EDC, PPWSA) សេវាទូរគមនាគមន៍ និងលេខរដ្ឋាភិបាល។",
  },
  "school-year-planner": {
    en: "Plan a Cambodian school year into two semesters with a mid-year break from a configurable start date.",
    km: "រៀបចំផែនការឆ្នាំសិក្សាកម្ពុជាជាពីរឆមាស ជាមួយការឈប់សម្រាកពាក់កណ្តាលឆ្នាំ ពីកាលបរិច្ឆេទចាប់ផ្តើមដែលអាចកំណត់បាន។",
  },
  "clipboard-manager": {
    en: "Capture, search, split, and merge your clipboard history entirely in this browser — with Khmer text support, pinning, and one-click re-copy.",
    km: "ចាប់យក ស្វែងរក បំបែក និងបញ្ចូលប្រវត្តិក្ដារចម្លងទាំងស្រុងក្នុងកម្មវិធីរុករក — ជាមួយការគាំទ្រអក្សរខ្មែរ ការខ្ទាស់ និងការចម្លងឡើងវិញមួយចុច។",
  },
  "screenshot-ocr": {
    en: "Read Khmer text from an image with a choice of accurate, in-browser OCR engines (KhmerOCR CRNN or Kiri OCR transformer) — region boxes and confidence, no upload.",
    km: "អានអក្សរខ្មែរពីរូបភាពជាមួយជម្រើសម៉ាស៊ីនអានអក្សរត្រឹមត្រូវក្នុងកម្មវិធីរុករក (KhmerOCR CRNN ឬ Kiri OCR transformer) — ជាមួយប្រអប់តំបន់ និងភាពជឿជាក់ គ្មានការបញ្ចូលឡើយ។",
  },
  "object-counter": {
    en: "Upload an image and count objects on-device — people, animals, vehicles, plants, furniture, food and more — using a YOLOS detection model in your browser.",
    km: "ផ្ទុករូបភាព រួចរាប់វត្ថុនៅលើឧបករណ៍ — មនុស្ស សត្វ យានយន្ត រុក្ខជាតិ គ្រឿងសង្ហារឹម អាហារ... ដោយប្រើម៉ូដេល YOLOS ក្នុងកម្មវិធីរុករក។",
  },
  "lsb-steganography": {
    en: "Hide a secret message inside an image's pixels (LSB steganography) or read one back — invisible to the eye and fully offline.",
    km: "លាក់សារសម្ងាត់ក្នុងភីកសែលរូបភាព (LSB steganography) ឬអានវាមកវិញ — មើលមិនឃើញ និងដំណើរការក្រៅបណ្តាញទាំងស្រុង។",
  },
  "audio-visualizer-player": {
    en: "Play an audio track with a live animated visualizer — spectrum bars, waveform, or radial — drawn in real time with the Web Audio API.",
    km: "ចាក់សំឡេងជាមួយរូបភាពចលនាផ្ទាល់ — របារស្ពែកទ្រុម រលកសំឡេង ឬរ៉ាឌីល — គូរតាមពេលជាក់ស្តែងដោយ Web Audio API។",
  },
  "video-to-audio": {
    en: "Extract the audio track from a video file and download it as a WAV — entirely in your browser, no upload.",
    km: "ទាញយកសំឡេងពីឯកសារវីដេអូ ហើយនាំចេញជា WAV — ដំណើរការទាំងស្រុងក្នុងកម្មវិធីរុករក គ្មានការបញ្ចូលឡើយ។",
  },
  "video-merger": {
    en: "Combine multiple video files into a single video — re-encoded client-side with MediaRecorder, no upload.",
    km: "បញ្ចូលឯកសារវីដេអូជាច្រើនទៅជាវីដេអូតែមួយ — ដោយប្រើ MediaRecorder ក្នុងកម្មវិធីរុករក គ្មានការបញ្ចូលឡើយ។",
  },
  "subtitle-player": {
    en: "Play a video with .srt subtitles synced to playback — paste SRT text or load a file and read the active cue in real time.",
    km: "ចាក់វីដេអូជាមួយអក្សររត់ពីក្រោម .srt ដែលស្របតាមពេលចាក់ — បិទភ្ជាប់អត្ថបទ SRT ឬផ្ទុកឯកសារ រួចអានអត្ថបទបច្ចុប្បន្នតាមពេលវេលា។",
  },
  "video-frame-batch": {
    en: "Extract a frame every N seconds from a video and download all the frames as a ZIP — entirely in your browser.",
    km: "ទាញយករូបភាពមួយសន្លឹករៀងរាល់ N វិនាទីពីវីដេអូ ហើយនាំចេញទាំងអស់ជា ZIP — ដំណើរការទាំងស្រុងក្នុងកម្មវិធីរុករក។",
  },
  "khmer-practice-sheets": {
    en: "Generate ruled Khmer handwriting practice worksheets with a solid example and faint tracing cells for each letter or word.",
    km: "បង្កើតសន្លឹកអនុវត្តសរសេរអក្សរខ្មែរ — ឧទាហរណ៍ច្បាស់មួយ និងក្រឡាធំៗសម្រាប់ហ្វឹកហាត់។",
  },
  "certificate-generator": {
    en: "Batch-generate decorated certificates with correctly shaped Khmer names — one page per recipient.",
    km: "បង្កើតលិខិតសម្គាល់ជាបាច់ ជាមួយឈ្មោះខ្មែរដែលបង្ហាញត្រឹមត្រូវ — មួយទំព័រក្នុងមួយឈ្មោះ។",
  },
  "envelope-printer": {
    en: "Print Khmer addresses onto DL/C6 envelopes or A4 label sheets, batch-ready and correctly shaped.",
    km: "បោះពុម្ពអាសយដ្ឋានខ្មែរលើសំបុត្រ DL/C6 ឬស្លាក A4 — រួចរាល់ជាបាច់។",
  },
  "event-ticket-sheet": {
    en: "Generate numbered event tickets with tear lines and optional QR codes on print-ready A4 sheets.",
    km: "បង្កើតសំបុត្រលេខរៀង ជាមួយបន្ទាត់បោះ និងកូដ QR បើចង់បាន — ទម្រង់ A4។",
  },
  "yaml-formatter": {
    en: "Validate and pretty-print YAML configuration files with clear error locations, or minify them to JSON.",
    km: "ផ្ទៀងផ្ទាត់ និងរៀបចំទម្រង់ YAML ឱ្យស្អាត ជាមួយទីតាំងកំហុសច្បាស់លាស់ ឬបង្រួមជា JSON។",
  },
  "xml-formatter": {
    en: "Validate and pretty-print XML with two-space indentation, plus a minify mode and element statistics.",
    km: "ផ្ទៀងផ្ទាត់ និងរៀបចំទម្រង់ XML ដោយចូលបន្ទាត់ ២ ដក រួមទាំងរបៀបបង្រួម និងស្ថិតិធាតុ។",
  },
  "code-to-image": {
    en: "Turn a code snippet into a styled image with a theme, line numbers, and title bar, ready to share as PNG.",
    km: "បម្លែងកូដទៅជារូបភាពស្អាត ជាមួយផ្ទាំងពណ៌ លេខបន្ទាត់ និងចំណងជើង រួចរាល់សម្រាប់ចែករំលែកជា PNG។",
  },
  "websocket-tester": {
    en: "Connect to any ws:// or wss:// server, send text or JSON messages, and inspect the live message log.",
    km: "ភ្ជាប់ទៅម៉ាស៊ីនមេ ws:// ឬ wss:// ណាមួយ ផ្ញើសារជាអត្ថបទ ឬ JSON ហើយមើលកំណត់ហេតុសារផ្ទាល់។",
  },
  "punycode-converter": {
    en: "Convert internationalized domain names to and from punycode (xn--) using RFC 3492.",
    km: "បម្លែងឈ្មោះដូមេនអន្តរជាតិ ទៅ និងពី punycode (xn--) តាម RFC 3492។",
  },
  "mac-vendor-lookup": {
    en: "Normalize and validate a MAC address, then look up its vendor from a labeled sample OUI list.",
    km: "កែទម្រង់ និងផ្ទៀងផ្ទាត់អាសយដ្ឋាន MAC រួចស្វែងរកម្ចាស់របស់វាពីបញ្ជី OUI គំរូដែលមានស្លាក។",
  },
  "hash-identifier": {
    en: "Identify the likely algorithm of a hash string by its pattern, length, and encoding.",
    km: "កំណត់ក្បួនដែលទំនងរបស់ hash ពីលំនាំ ប្រវែង និងការអ៊ិនកូដរបស់វា។",
  },
  "email-header-analyzer": {
    en: "Paste raw email headers to trace the Received path, extract IPs, and review SPF, DKIM, and DMARC results.",
    km: "បិទភ្ជាប់បឋមកថាអ៊ីមែល ដើម្បីតាមដានផ្លូវ Received ស្រង់ IP និងពិនិត្យលទ្ធផល SPF, DKIM និង DMARC។",
  },
  "totp-authenticator": {
    en: "Generate time-based (TOTP) and counter-based (HOTP) one-time codes from a base32 secret and verify codes you enter.",
    km: "បង្កើតលេខកូដតែម្តងតាមពេល (TOTP) និងតាមលេខរាប់ (HOTP) ពី secret ប្រភេទ base32 និងផ្ទៀងផ្ទាត់លេខកូដដែលអ្នកបញ្ចូល។",
  },
  "aes-encryption": {
    en: "Encrypt and decrypt text with AES-GCM using a passphrase derived through PBKDF2, entirely in your browser.",
    km: "អ៊ិនគ្រីប និងឌិគ្រីបអត្ថបទជាមួយ AES-GCM ដោយប្រើពាក្យសម្ងាត់ដែលបង្កើតតាម PBKDF2 ទាំងស្រុងក្នុងកម្មវិធីរុករក។",
  },
  "rsa-key-generator": {
    en: "Generate RSA key pairs (2048 or 4096-bit) and export them as PEM, with strength notes and privacy warnings.",
    km: "បង្កើតសោ RSA (2048 ឬ 4096 ប៊ីត) និងនាំចេញជា PEM ជាមួយកំណត់ត្រាកម្លាំង និងការព្រមានឯកជនភាព។",
  },
  "base58-codec": {
    en: "Encode and decode Base58 (Bitcoin alphabet) with optional Base58Check checksum verification.",
    km: "អ៊ិនកូដ និងឌិកូដ Base58 (អក្ខរក្រម Bitcoin) ជាមួយការផ្ទៀងផ្ទាត់ checksum Base58Check ជាជម្រើស។",
  },
  "certificate-viewer": {
    en: "Paste a PEM certificate to read its subject, issuer, validity dates, and SANs, and see its expiry status.",
    km: "បិទភ្ជាប់វិញ្ញាបនបត្រ PEM ដើម្បីអានម្ចាស់ អ្នកចេញ កាលបរិច្ឆេទសុពលភាព និង SAN ព្រមទាំងស្ថានភាពផុតកំណត់។",
  },
  "pwned-check": {
    en: "Check whether a password appears in known data breaches using the Have I Been Pwned range API, without sending the full password.",
    km: "ពិនិត្យថាតើពាក្យសម្ងាត់លេចឡើងក្នុងការលេចធ្លាយទិន្នន័យដែលគេស្គាល់ ដោយប្រើ API របស់ Have I Been Pwned ដោយមិនផ្ញើពាក្យសម្ងាត់ទាំងមូល។",
  },
  "bitwise-calculator": {
    en: "Perform bitwise AND, OR, XOR, NOT, and shifts on 32-bit integers with decimal, hex, and binary views.",
    km: "គណនា AND, OR, XOR, NOT និងការប្តូរប៊ីតលើចំនួនគត់ ៣២ ប៊ីត ជាមួយទិដ្ឋភាពគោលដប់ គោលដប់ប្រាំមួយ និងគោលពីរ។",
  },
  "odds-converter": {
    en: "Convert between decimal, fractional, American odds and implied probability, and compute payouts for a stake.",
    km: "បម្លែងរវាង odds គោលដប់ ប្រភាគ អាមេរិក និងប្រូបាប៊ីលីតេបង្កប់ ព្រមទាំងគណនាការសងសម្រាប់ទឹកប្រាក់ភ្នាល់។",
  },
  "linear-regression": {
    en: "Fit a straight line to pasted X,Y data and read slope, intercept, R², correlation, and predictions.",
    km: "សមទិន្នន័យ X,Y ទៅនឹងបន្ទាត់ត្រង់ ហើយអានជម្រាល ចំណុចប្រសព្វ R² ការជាប់ទាក់ទង និងការព្យាករណ៍។",
  },
  "zscore-calculator": {
    en: "Compute z-scores, cumulative probability, and percentiles for a normal distribution, or invert a probability to a z.",
    km: "គណនា z-score ប្រូបាប៊ីលីតេបង្គរ និងភាគរយសម្រាប់ការចែកចាយធម្មតា ឬបម្លែងប្រូបាប៊ីលីតេទៅជា z។",
  },
  "sequence-solver": {
    en: "Find the nth term and sum of arithmetic and geometric sequences, or detect the type from given terms.",
    km: "រកតួទី n និងផលបូកនៃលំដាប់នព្វន្ត និងធរណីមាត្រ ឬកំណត់ប្រភេទពីតួដែលបានផ្តល់។",
  },
  "language-detector": {
    en: "Detect the likely language and script of a text using character and stopword heuristics (approximate results).",
    km: "កំណត់ភាសា និងអក្សរដែលទំនងនៃអត្ថបទ ដោយប្រើ heuristics លើតួអក្សរ និងពាក្យ (លទ្ធផលប្រហាក់ប្រហែល)។",
  },
  "ngram-finder": {
    en: "Count N-grams (1–5 words) in pasted text with frequency, sorting, and CSV export.",
    km: "រាប់ N-gram (១–៥ ពាក្យ) ក្នុងអត្ថបទដែលបិទភ្ជាប់ ជាមួយប្រេកង់ ការតម្រៀប និងការនាំចេញ CSV។",
  },
  "ipa-phonetics": {
    en: "Get approximate English pronunciations in IPA from a sample word list with rule-based fallback.",
    km: "ទទួលបានការបញ្ចេញសំឡេងអង់គ្លេសប្រហាក់ប្រហែលជា IPA ពីបញ្ជីពាក្យគំរូ ជាមួយការជំនួសតាមវិធាន។",
  },
  "unicode-text-generator": {
    en: "Transform text into zalgo, fullwidth, small caps, bold, strikethrough, or superscript Unicode styles.",
    km: "បំលែងអត្ថបទទៅជារចនាប័ទ្ម Unicode ដូចជា zalgo អក្សរពេញទទឹង អក្សរតូច ដិត កាត់បន្ទាត់ ឬអក្សរលើ។",
  },
  "glassmorphism-generator": {
    en: "Create a frosted-glass panel with adjustable blur, opacity, border, and shadow, and copy the CSS.",
    km: "បង្កើតផ្ទាំងកញ្ចក់ស្រអែម ដោយលៃតម្រូវ blur ភាពថ្លា ស៊ុម និងស្រមោល រួចចម្លង CSS។",
  },
  "neumorphism-generator": {
    en: "Design soft UI controls with inset shadows and copy the generated CSS.",
    km: "រចនាប៊ូតុង soft UI ជាមួយស្រមោលខាងក្នុង រួចចម្លង CSS ដែលបង្កើត។",
  },
  "text-shadow-generator": {
    en: "Stack multiple text-shadow layers on live preview text and copy the CSS.",
    km: "ដាក់ស្រទាប់ text-shadow ជាច្រើនលើអត្ថបទមើលផ្ទាល់ រួចចម្លង CSS។",
  },
  "css-filter-generator": {
    en: "Apply CSS filter effects such as grayscale, sepia, and hue-rotate to an image and copy the CSS.",
    km: "អនុវត្តបែបផែន CSS filter ដូចជា grayscale, sepia, hue-rotate លើរូបភាព រួចចម្លង CSS។",
  },
  "font-pair-finder": {
    en: "Browse curated Google Font pairings for headings and body text with live preview.",
    km: "រកមើលគូ Google Font ដែលបានជ្រើសរើសសម្រាប់ចំណងជើង និងអត្ថបទ ជាមួយការមើលផ្ទាល់។",
  },
  "css-grid-playground": {
    en: "Experiment with CSS Grid columns, rows, gaps, and alignment and copy the layout CSS.",
    km: "សាកល្បង CSS Grid ជាមួយជួរឈរ ជួរដេក គម្លាត និងការតម្រឹម រួចចម្លង CSS ប្លង់។",
  },
  "svg-path-inspector": {
    en: "Break an SVG path's d attribute into commands with stats and a live preview.",
    km: "បំបែកលក្ខណៈ d របស់ SVG path ទៅជាពាក្យបញ្ជា ជាមួយស្ថិតិ និងការមើលផ្ទាល់។",
  },
  "svg-pattern-generator": {
    en: "Generate SVG patterns like dots, stripes, grids, and checkerboards with copyable code.",
    km: "បង្កើត SVG pattern ដូចជា ចំនុច ឆ្នូត ក្រឡាចត្រង្គ និង checkerboard ជាមួយកូដសម្រាប់ចម្លង។",
  },
  "graph-visualizer": {
    en: "Visualize nodes and edges as an interactive force-directed graph with drag and hover.",
    km: "បង្ហាញថ្នាំង និងបន្ទាត់តភ្ជាប់ជាក្រាហ្វអន្តរកម្ម ដោយអាចអូស និងដាក់កណ្តុរ។",
  },
  "resume-builder": {
    en: "Fill in your details and print a clean A4 resume directly from your browser.",
    km: "បំពេញព័ត៌មានរបស់អ្នក ហើយបោះពុម្ព CV ទំហំ A4 ស្អាតដោយផ្ទាល់ពីកម្មវិធីរុករក។",
  },
  "concrete-calculator": {
    en: "Estimate concrete volume and nominal cement, sand, and gravel for slabs, footings, and columns.",
    km: "ប៉ាន់ស្មានមាឌបេតុង និងស៊ីម៉ង់ត៍ ខ្សាច់ ក្រួសតាមសមាមាត្រស្តង់ដារ សម្រាប់កម្រាល គ្រឹះ និងសសរ។",
  },
  "rebar-calculator": {
    en: "Convert rebar diameter to weight per meter and estimate quantities for slabs and beams.",
    km: "បម្លែងអង្កត់ផ្ចិតដែកទៅជាទម្ងន់ក្នុងមួយម៉ែត្រ និងប៉ាន់ស្មានបរិមាណសម្រាប់កម្រាល និងធ្នឹម។",
  },
  "tile-calculator": {
    en: "Calculate how many floor or wall tiles and boxes you need with wastage included.",
    km: "គណនាចំនួនក្បឿង និងប្រអប់ដែលអ្នកត្រូវការសម្រាប់កម្រាល ឬជញ្ជាំង រាប់ទាំងការខូចខាត។",
  },
  "solar-calculator": {
    en: "Size a solar system from daily energy use: panels, battery bank, and inverter.",
    km: "គណនាទំហំប្រព័ន្ធពន្លឺព្រះអាទិត្យពីការប្រើប្រាស់ថាមពលប្រចាំថ្ងៃ៖ បន្ទះ ថ្ម និងអាំងវឺរទ័រ។",
  },
  "ac-btu-calculator": {
    en: "Estimate the air-conditioning capacity (BTU/kW) a room needs from its size, occupants, and sun exposure.",
    km: "ប៉ាន់ស្មានសមត្ថភាពម៉ាស៊ីនត្រជាក់ (BTU/kW) ដែលបន្ទប់ត្រូវការ ពីទំហំ ចំនួនមនុស្ស និងការប៉ះពន្លឺព្រះអាទិត្យ។",
  },
  "generator-sizing": {
    en: "Add your appliances to find the generator size needed for running and starting loads.",
    km: "បន្ថែមឧបករណ៍របស់អ្នក ដើម្បីរកទំហំម៉ាស៊ីនភ្លើងសម្រាប់បន្ទុកធម្មតា និងបន្ទុកពេលបើក។",
  },
  "gold-price-calculator": {
    en: "Convert gold weight between chi, gram, and troy ounce and value it at the rate you enter.",
    km: "បម្លែងទម្ងន់មាសរវាងជី ក្រាម និង troy ounce ហើយគណនាតម្លៃតាមអត្រាដែលអ្នកបញ្ចូល។",
  },
  "sitemap-generator": {
    en: "Generate a valid sitemap.xml from your base URL and page list, with optional lastmod, frequency, and priority.",
    km: "បង្កើត sitemap.xml ត្រឹមត្រូវពី URL មូលដ្ឋាន និងបញ្ជីទំព័ររបស់អ្នក ជាមួយ lastmod, frequency និង priority ជាជម្រើស។",
  },
  "robots-txt-generator": {
    en: "Build a robots.txt file with user-agent rules, allow/disallow lines, crawl-delay, and sitemap links.",
    km: "បង្កើតឯកសារ robots.txt ជាមួយវិធាន user-agent, allow/disallow, crawl-delay និងតំណ sitemap។",
  },
  "rss-generator": {
    en: "Create a valid RSS 2.0 feed from feed metadata and your list of items, ready to copy or download.",
    km: "បង្កើត RSS 2.0 feed ត្រឹមត្រូវពីព័ត៌មាន feed និងបញ្ជីអត្ថបទរបស់អ្នក រួចរាល់សម្រាប់ចម្លង ឬទាញយក។",
  },
  "khmer-proverbs": {
    en: "Browse a curated collection of well-known Khmer proverbs with Khmer meanings and English translations.",
    km: "រកមើលបណ្តុំសុភាសិតខ្មែរដ៏ល្បីដែលបានជ្រើសរើស ជាមួយអត្ថន័យខ្មែរ និងការបកប្រែអង់គ្លេស។",
  },
  "khmer-rhyming-dictionary": {
    en: "Find words that rhyme with any Khmer word, grouped by final-sound patterns from a large offline dictionary.",
    km: "ស្វែងរកពាក្យដែលស្លោកជាមួយពាក្យខ្មែរណាមួយ ដោយដាក់ជាក្រុមតាមលំនាំសំឡេងចុង ពីវចនានុក្រមក្រៅបណ្តាញធំ។",
  },
  "khmer-poem-generator": {
    en: "Generate sample Khmer kâp verses from themed word banks with rhyme schemes and syllable counts.",
    km: "បង្កើតកាព្យខ្មែរគំរូពីធនាគារពាក្យតាមប្រធានបទ ជាមួយរបៀបស្លោក និងចំនួនព្យាង្គ។",
  },
  "heart-rate-zones": {
    en: "Calculate your maximum and target heart-rate zones using the 220-age and Karvonen formulas.",
    km: "គណនាអត្រាបេះដូងអតិបរមា និងតំបន់គោលដៅរបស់អ្នក ដោយប្រើរូបមន្ត 220−អាយុ និង Karvonen។",
  },
  "git-cheatsheet": {
    en: "A copyable reference of common Git commands: setup, daily workflow, branches, undo, and remotes.",
    km: "សន្លឹកយោង Git ដែលអាចចម្លងបាន៖ ការដំឡើង ការងារប្រចាំថ្ងៃ សាខា ការមិនធ្វើវិញ និង remotes។",
  },
  "html-css-cheatsheet": {
    en: "A practical HTML5 and CSS reference with tags, attributes, selectors, flexbox, grid, and examples.",
    km: "ឯកសារយោង HTML5 និង CSS អនុវត្តជាក់ស្តែង ជាមួយ tags, attributes, selectors, flexbox, grid និងឧទាហរណ៍។",
  },
  "sql-cheatsheet": {
    en: "A reference of core SQL: SELECT, JOINs, grouping, aggregates, CRUD, and table creation with examples.",
    km: "ឯកសារយោង SQL មូលដ្ឋាន៖ SELECT, JOIN, grouping, aggregates, CRUD និងការបង្កើតតារាង ជាមួយឧទាហរណ៍។",
  },
  "linux-cheatsheet": {
    en: "A quick reference of essential Linux commands for files, permissions, processes, networks, and text.",
    km: "ឯកសារយោងរហ័សនៃពាក្យបញ្ជា Linux សំខាន់ៗ សម្រាប់ឯកសារ ការអនុញ្ញាត ដំណើរការ បណ្តាញ និងអត្ថបទ។",
  },
  "country-dialing-codes": {
    en: "Look up international country calling codes and example phone formats for 80 countries.",
    km: "ស្វែងរកលេខកូដទូរស័ព្ទអន្តរជាតិ និងទម្រង់លេខទូរស័ព្ទឧទាហរណ៍សម្រាប់ ៨០ ប្រទេស។",
  },
  "currency-codes": {
    en: "Browse a reference table of ISO 4217 currency codes, numbers, names, and symbols.",
    km: "រកមើលតារាងយោង ISO 4217 នៃលេខកូដរូបិយប័ណ្ណ លេខ ឈ្មោះ និងនិមិត្តសញ្ញា។",
  },
  "food-calorie-reference": {
    en: "Check approximate calorie values for common foods and Cambodian dishes (reference values, verify with labels).",
    km: "ពិនិត្យតម្លៃកាឡូរីប្រហាក់ប្រហែលសម្រាប់អាហារទូទៅ និងម្ហូបខ្មែរ (តម្លៃយោង សូមផ្ទៀងផ្ទាត់ជាមួយស្លាកផលិតផល)។",
  },
  "recipe-resizer": {
    en: "Scale any recipe to a different number of servings and copy the adjusted ingredient list.",
    km: "កែទំហំរូបមន្តណាមួយទៅចំនួនមនុស្សផ្សេង ហើយចម្លងបញ្ជីគ្រឿងផ្សំដែលបានកែ។",
  },
  "coffee-ratio": {
    en: "Find the right coffee-to-water ratio for pour-over, French press, espresso, and more.",
    km: "រកសមាមាត្រកាហ្វេទឹកត្រឹមត្រូវសម្រាប់ pour-over, French press, espresso និងច្រើនទៀត។",
  },
  "image-collage": {
    en: "Combine several photos into a grid collage with adjustable spacing and export it as PNG.",
    km: "ផ្សំរូបថតជាច្រើនទៅជា collage ជាក្រឡាចត្រង្គ ជាមួយគម្លាតអាចកែបាន ហើយនាំចេញជា PNG។",
  },
  "image-vectorizer": {
    en: "Trace a photo or drawing into a simplified SVG outline right in your browser.",
    km: "តាមដានរូបថត ឬគំនូរទៅជា SVG គ្រោងសាមញ្ញ ដោយផ្ទាល់ក្នុងកម្មវិធីរុករករបស់អ្នក។",
  },
  "placeholder-image": {
    en: "Create custom SVG placeholder images with your own size, text, and colors.",
    km: "បង្កើតរូបភាព placeholder SVG ផ្ទាល់ខ្លួន ជាមួយទំហំ អត្ថបទ និងពណ៌របស់អ្នក។",
  },
  "gif-splitter": {
    en: "Split a GIF into its frames, remove frames, and change playback speed, then re-encode it.",
    km: "បំបែក GIF ជាស៊ុម ដកស៊ុមចេញ ប្តូរល្បឿនលេង រួចអ៊ិនកូដវិញ។",
  },
  "barcode-reader": {
    en: "Decode EAN-13, UPC-A, and EAN-8 barcodes from an image with the built-in decoder or the native API.",
    km: "អានលេខកូដ EAN-13, UPC-A និង EAN-8 ពីរូបភាព ជាមួយ decoder ភ្ជាប់មក ឬ API ដើម។",
  },
  "image-histogram": {
    en: "Analyze the red, green, blue, and luminance distribution of a photo with a histogram.",
    km: "វិភាគការចែកចាយក្រហម បៃតង ខៀវ និងពន្លឺរបស់រូបថត ជាមួយអ៊ីស្តូក្រាម។",
  },
  "pixel-art": {
    en: "Turn an image into pixel art with color quantization, or draw on a blank pixel grid.",
    km: "បំលែងរូបភាពទៅជាសិល្បៈ pixel ជាមួយការកាត់បន្ថយពណ៌ ឬគូរលើក្រឡាចត្រង្គ pixel ទទេ។",
  },
  "audio-merger": {
    en: "Combine multiple audio files into one WAV, or convert a single file to WAV, entirely in your browser.",
    km: "បញ្ចូលឯកសារសំឡេងច្រើនទៅជា WAV មួយ ឬបម្លែងឯកសារតែមួយទៅជា WAV ទាំងស្រុងក្នុងកម្មវិធីរុករក។",
  },
  "tempo-changer": {
    en: "Play audio at a different tempo and pitch with speed and detune controls.",
    km: "ចាក់សំឡេងតាមចង្វាក់ និងកម្រិតផ្សេង ជាមួយការគ្រប់គ្រងល្បឿន និង detune។",
  },
  "noise-generator": {
    en: "Generate white, pink, or brown noise for sleep or focus and download it as WAV.",
    km: "បង្កើតសំឡេង white, pink ឬ brown noise សម្រាប់គេង ឬផ្តោតអារម្មណ៍ ហើយទាញយកជា WAV។",
  },
  "virtual-piano": {
    en: "Play a two-octave virtual piano with your mouse or keyboard, and hear common chords.",
    km: "លេងព្យាណូនិម្មិតពីរ octave ដោយកណ្តុរ ឬក្តារចុច ហើយស្តាប់ chord ទូទៅ។",
  },
  "video-compressor": {
    en: "Re-encode a video at a lower resolution and bitrate in your browser and download it as WebM.",
    km: "អ៊ិនកូដវីដេអូវិញនៅកម្រិតភាពច្បាស់ និង bitrate ទាបក្នុងកម្មវិធីរុករក ហើយទាញយកជា WebM។",
  },
  "subtitle-editor": {
    en: "Edit SRT and VTT subtitles: fix timings and text, shift by an offset, and export either format.",
    km: "កែសម្រួលអក្សររត់ SRT និង VTT៖ កែពេលវេលា និងអត្ថបទ ប្តូរដោយ offset ហើយនាំចេញទម្រង់ណាមួយ។",
  },
  "period-tracker": {
    en: "Track your cycle and estimate future periods, ovulation, and the fertile window (estimates, not medical advice).",
    km: "តាមដានវដ្តរបស់អ្នក និងប៉ាន់ស្មានរដូវបន្ទាប់ ថ្ងៃបញ្ចេញពង និងរយៈពេលមានកូន (ការប៉ាន់ស្មាន មិនមែនជាដំបូន្មានវេជ្ជសាស្ត្រ)។",
  },
  "fasting-timer": {
    en: "Run an intermittent-fasting countdown with presets like 16:8 and 18:6, with a saved history.",
    km: "ដំណើរការកម្មវិធីរាប់ម៉ោងតមអាហារ ជាមួយ presets ដូចជា 16:8 និង 18:6 ជាមួយប្រវត្តិរក្សាទុក។",
  },
  "sudoku": {
    en: "Play generated Sudoku puzzles with three difficulties, hints, notes, and a solver.",
    km: "លេងល្បែងស៊ូដូគូដែលបង្កើតដោយស្វ័យប្រវត្តិ កម្រិត ៣ ជាមួយជំនួយ កំណត់ត្រា និងអ្នកដោះស្រាយ។",
  },
  "trivia-quiz": {
    en: "Test your general knowledge with 50 curated multiple-choice questions, including Cambodia culture.",
    km: "សាកល្បងចំណេះទូទៅរបស់អ្នក ជាមួយសំណួរជ្រើសរើស ៥០ ដែលបានជ្រើសរើស រួមទាំងវប្បធម៌កម្ពុជា។",
  },
  "bingo-generator": {
    en: "Generate classic 1–75 Bingo cards with a free center and print a sheet of cards.",
    km: "បង្កើតកាតប៊ីងហ្គូ 1–75 បុរាណ ជាមួយកណ្តាលទំនេរ ហើយបោះពុម្ពសន្លឹកកាត។",
  },
  "cambodia-geography-quiz": {
    en: "Quiz yourself on Cambodian provinces, capitals, and famous landmarks with explanations.",
    km: "សាកល្បងចំណេះដឹងអំពីខេត្ត រាជធានី និងទីតាំងល្បីរបស់កម្ពុជា ជាមួយការពន្យល់។",
  },
  "stereo-channel-test": {
    en: "Check left/right speaker balance with a 440 Hz tone or noise from the left, right, both, or a sweeping channel.",
    km: "ពិនិត្យតុល្យភាពសំឡេងឆ្វេង/ស្តាំ ជាមួយសំឡេង 440 Hz ឬសម្លេងរំខាន ចេញពីឆ្វេង ស្តាំ ទាំងពីរ ឬរំកិលឆ្លាស់។",
  },
  "css-animation-generator": {
    en: "Build a CSS keyframe animation visually — property, easing, duration, iteration — and copy the code.",
    km: "បង្កើត CSS animation បែប keyframes ដោយមើលឃើញ — លក្ខណៈសម្បត្តិ easing រយៈពេល ចំនួនវគ្គ — រួចចម្លងកូដ។",
  },
  "keyboard-event-viewer": {
    en: "Press any key and read its key, code, keyCode, modifiers, and location — handy for shortcuts and Khmer keyboards.",
    km: "ចុចគ្រាប់ចុចណាមួយ ហើយអាន key, code, keyCode, គ្រាប់ចុចរួម និងទីតាំង — ងាយស្រួលសម្រាប់ផ្លូវកាត់ និងក្ដារចុចខ្មែរ។",
  },
  "sample-size-calculator": {
    en: "Work out how many people to survey using Cochran's formula with an optional finite-population correction.",
    km: "គណនាចំនួនមនុស្សដែលត្រូវស្ទង់មតិ ដោយរូបមន្ត Cochran ជាមួយការកែតម្រូវចំនួនប្រជាជន (ជម្រើស)។",
  },
  "margin-markup-calculator": {
    en: "Convert between cost, price, margin %, and markup %, and price from a target margin.",
    km: "បម្លែងរវាងតម្លៃធ្វើ តម្លៃលក់ កំរិតចំណេញ % និង markup % ព្រមទាំងកំណត់តម្លៃលក់ពីកំរិតចំណេញគោលដៅ។",
  },
  "device-info": {
    en: "See what this browser and device expose: screen, CPU, memory, network, battery, timezone, and storage.",
    km: "មើលអ្វីដែលកម្មវិធីរុករក និងឧបករណ៍បង្ហាញ៖ អេក្រង់ CPU អង្គចងចាំ បណ្តាញ ថ្ម តំបន់ពេលវេលា និងកន្លែងផ្ទុក។",
  },
  "download-time-calculator": {
    en: "Estimate how long a download takes at your link speed, distinguishing MB, MiB, Mbit/s, and MB/s.",
    km: "ប៉ាន់ស្មានពេលទាញយកឯកសារតាមល្បឿនបណ្តាញ ដោយបែងចែក MB, MiB, Mbit/s និង MB/s។",
  },
  "ipv6-subnet-calculator": {
    en: "Expand or compress an IPv6 address, identify its scope, and compute the exact subnet first/last address and size.",
    km: "ពង្រីក ឬបង្រួមអាសយដ្ឋាន IPv6 កំណត់ប្រភេទរបស់វា និងគណនាអាសយដ្ឋានដើម/ចុង និងទំហំ subnet ពិតប្រាកដ។",
  },
  "depreciation-calculator": {
    en: "Build a year-by-year depreciation schedule: straight-line, declining balance, double declining, or sum-of-years digits.",
    km: "បង្កើតតារាងការធ្លាក់តម្លៃសម្បត្តិរយៈពេលឆ្នាំម្ដងៗ៖ ត្រង់ៗ តុល្យភាពធ្លាក់ចុះ ធ្លាក់ចុះពីរដង ឬផលបូកលេខឆ្នាំ។",
  },
  "meeting-cost-calculator": {
    en: "See what a meeting really costs from attendees × average hourly rate × time, with a live ticking mode.",
    km: "មើលចំណាយពិតរបស់ការប្រជុំ ពីអ្នកចូលរួម × អត្រាម៉ោងមធ្យម × ពេលវេលា ជាមួយរបៀបមើលផ្ទាល់។",
  },
  "npv-irr-calculator": {
    en: "Analyze cash flows with net present value, internal rate of return, and simple payback from a pasted list.",
    km: "វិភាគចរន្តសាច់ប្រាក់៖ តម្លៃបច្ចុប្បន្នសុទ្ធ (NPV) អត្រាត្រឡប់មូលធនផ្ទៃក្នុង (IRR) និងរយៈពេលសងសរុប ពីបញ្ជីចរន្តសាច់ប្រាក់។",
  },
  "volumetric-weight-calculator": {
    en: "Calculate chargeable shipping weight as the greater of actual and volumetric weight (L×W×H ÷ divisor).",
    km: "គណនាទម្ងន់គិតថ្លៃសម្រាប់ការដឹកជញ្ជូន៖ យកទម្ងន់ធំជាងគេ រវាងទម្ងន់ពិត និងទម្ងន់តាមទំហំ (បណ្តោយ×ទទឹង×កម្ពស់ ÷ កត្តា)។",
  },
  "dilution-calculator": {
    en: "Solve C₁V₁ = C₂V₂ for any missing value and compute molarity from mass, molar mass, and volume.",
    km: "ដោះស្រាយ C₁V₁ = C₂V₂ សម្រាប់តួដែលបាត់ និងគណនា molarity ពីម៉ាស ម៉ាសម៉ូលារ និងកម្រិតទឹក។",
  },
  "dna-translator": {
    en: "Clean a DNA/RNA sequence, transcribe to mRNA, get the reverse complement, GC content, and all six reading frames.",
    km: "សម្អាតលំដាប់ DNA/RNA បម្លែងទៅ mRNA គណនា reverse complement ខ្លឹមសារ GC និងបកប្រែស៊ុមអានទាំង ៦។",
  },
  "half-life-calculator": {
    en: "Compute the amount left after a given time, the decay constant λ, and the mean lifetime from a half-life.",
    km: "គណនាបរិមាណសល់ក្រោយពេលកំណត់ ស្ថិរភាពថេរខ្ទេច (λ) និងអាយុកាលមធ្យម ពីរយៈពេលពាក់កណ្តាល។",
  },
  "khmer-musical-instruments": {
    en: "Browse a curated reference of traditional Khmer musical instruments with Khmer and English names and descriptions.",
    km: "រកមើលឯកសារយោងឧបករណ៍ភ្លេងប្រពៃណីខ្មែរ ជាមួយឈ្មោះ និងការពណ៌នាជាភាសាខ្មែរ និងអង់គ្លេស។",
  },
  "khmer-dances-festivals": {
    en: "Discover well-known Khmer classical and folk dances and festivals with timings and descriptions.",
    km: "ស្វែងយល់អំពីរបាំបុរាណ និងប្រពៃណី និងពិធីបុណ្យខ្មែរល្បីៗ ជាមួយពេលវេលា និងការពណ៌នា។",
  },
  "khmer-dish-glossary": {
    en: "Look up well-known Khmer dishes by Khmer or English name with short descriptions.",
    km: "ស្វែងរកម្ហូបខ្មែរល្បីៗ តាមឈ្មោះខ្មែរ ឬអង់គ្លេស ជាមួយការពណ៌នាខ្លីៗ។",
  },
  "khmer-birthday-personality": {
    en: "Find the traditional Khmer personality traits and color for the weekday you were born on (for fun, not scientific).",
    km: "ស្វែងរកលក្ខណៈបុគ្គលតាមប្រពៃណីខ្មែរ និងពណ៌សម្រាប់ថ្ងៃសប្តាហ៍ដែលអ្នកកើត (សម្រាប់កំសាន្ត មិនមែនវិទ្យាសាស្ត្រ)។",
  },
  "khmer-lunar-calendar": {
    en: "View a month grid with the Khmer lunar day for every date, including waxing/waning and the lunar month.",
    km: "មើលប្រតិទិនខែ ជាមួយថ្ងៃចន្ទគតិខ្មែរសម្រាប់រាល់កាលបរិច្ឆេទ រាប់ទាំងកើត/រោច និងខែចន្ទគតិ។",
  },
  "khmer-new-year-countdown": {
    en: "Live countdown to the next Khmer New Year (Moha Songkran, around mid-April) with the zodiac animal.",
    km: "រាប់ថយក្រោយផ្ទាល់ទៅចូលឆ្នាំខ្មែរបន្ទាប់ (មហាសង្រ្កាន្ត ប្រហែលពាក់កណ្តាលខែមេសា) ជាមួយឆ្នាំសត្វ។",
  },
  "semver-calculator": {
    en: "Validate, compare, and increment semantic versions (semver.org 2.0.0) with suggested next releases.",
    km: "ផ្ទៀងផ្ទាត់ ប្រៀបធៀប និងបន្ថែមលេខកំណែ semantic version (semver.org 2.0.0) ជាមួយការស្នើកំណែបន្ទាប់។",
  },
  "env-validator": {
    en: "Validate .env files line by line: syntax, duplicates, quoting, and empty or invalid keys.",
    km: "ផ្ទៀងផ្ទាត់ឯកសារ .env បន្ទាត់ម្តងៗ៖ វេយ្យាករណ៍ ការស្ទួន ការដាក់សញ្ញាសម្រង់ និងគ្រាប់ចុចទទេ ឬមិនត្រឹមត្រូវ។",
  },
  "jsonpath-tester": {
    en: "Evaluate JSONPath expressions against your JSON and see the matched results with counts.",
    km: "វាយតម្លៃ JSONPath expressions ទល់នឹង JSON របស់អ្នក ហើយមើលលទ្ធផលដែលត្រូវ ជាមួយចំនួន។",
  },
  "pwa-manifest-generator": {
    en: "Build a valid manifest.json for your progressive web app with icons, colors, and display settings.",
    km: "បង្កើត manifest.json ត្រឹមត្រូវសម្រាប់កម្មវិធី PWA របស់អ្នក ជាមួយរូបតំណាង ពណ៌ និងការកំណត់បង្ហាញ។",
  },
  "conventional-commit-generator": {
    en: "Write conventional commit messages with type, scope, breaking changes, body, and footer.",
    km: "សរសេរសារប្រគល់ conventional commit ជាមួយប្រភេទ scope ការផ្លាស់ប្តូរបំបែក body និង footer។",
  },
  "cookie-parser": {
    en: "Parse Cookie and Set-Cookie headers into readable tables and build Cookie headers, per RFC 6265.",
    km: "វិភាគបឋមកថា Cookie និង Set-Cookie ទៅជាតារាងងាយអាន និងបង្កើតបឋមកថា Cookie តាម RFC 6265។",
  },
  "avatar-identicon-generator": {
    en: "Generate initials avatars and deterministic identicons as SVG or PNG for profiles and apps.",
    km: "បង្កើត avatar អក្សរផ្តើម និង identicon ថេរជា SVG ឬ PNG សម្រាប់ប្រវត្តិរូប និងកម្មវិធី។",
  },
  "loading-spinner-generator": {
    en: "Pick a spinner style, colors, and speed and copy the CSS or SVG loader for your site.",
    km: "ជ្រើសរើសរចនាប័ទ្ម spinner ពណ៌ និងល្បឿន រួចចម្លង CSS ឬ SVG loader សម្រាប់គេហទំព័ររបស់អ្នក។",
  },
  "skeleton-loader-generator": {
    en: "Compose a skeleton loading screen from lines, avatars, and blocks and copy the shimmer CSS.",
    km: "រៀបចំអេក្រង់ skeleton loading ពីបន្ទាត់ avatar និងប្លុក រួចចម្លង CSS shimmer។",
  },
  "css-transform-generator": {
    en: "Build CSS transforms with translate, rotate, scale, skew, and perspective and copy the code.",
    km: "បង្កើត CSS transforms ជាមួយ translate, rotate, scale, skew និង perspective រួចចម្លងកូដ។",
  },
  "image-compare-slider": {
    en: "Drag a divider to compare two images side by side, perfect for before/after shots.",
    km: "អូសបន្ទាត់បំបែក ដើម្បីប្រៀបធៀបរូបភាពពីរ ល្អសម្រាប់រូបមុន/ក្រោយ។",
  },
  "webcam-photo-booth": {
    en: "Take webcam photos with mirror and filter options and download them as PNG.",
    km: "ថតរូបតាមកាមេរ៉ាជាមួយជម្រើសកញ្ចក់ឆ្លុះ និងតម្រង រួចទាញយកជា PNG។",
  },
  "duplicate-image-checker": {
    en: "Upload images and find visually similar or duplicate ones using perceptual hashes.",
    km: "ផ្ទុករូបភាព ហើយរករូបស្រដៀងគ្នា ឬស្ទួន ដោយប្រើ perceptual hash។",
  },
  "beat-maker": {
    en: "Program a 16-step drum beat with kick, snare, hi-hat, clap, and bass and play it live.",
    km: "រៀបចំចង្វាក់ស្គរ ១៦ ជំហាន ជាមួយ kick, snare, hi-hat, clap និង bass ហើយលេងផ្ទាល់។",
  },
  "instrument-tuner": {
    en: "Tune your instrument with your microphone: detect the pitch and see the nearest note and cents.",
    km: "លៃសំឡេងឧបករណ៍របស់អ្នកជាមួយមីក្រូហ្វូន៖ រកប្រេកង់ ហើយមើលសម្លេងជិតបំផុត និង cents។",
  },
  "sound-effect-generator": {
    en: "Generate sweep, siren, chirp, laser, ring, and alarm sounds and download them as WAV.",
    km: "បង្កើតសំឡេង sweep, siren, chirp, laser, ring និង alarm ហើយទាញយកជា WAV។",
  },
  "video-speed-changer": {
    en: "Re-encode a video at 0.25x–4x speed in your browser and download the WebM.",
    km: "អ៊ិនកូដវីដេអូវិញក្នុងល្បឿន ០.២៥x–៤x ក្នុងកម្មវិធីរុករក ហើយទាញយកជា WebM។",
  },
  "video-green-screen": {
    en: "Remove a green screen from a video and compose it over a background, then export WebM.",
    km: "ដកផ្ទៃបៃតងចេញពីវីដេអូ ហើយផ្សំលើផ្ទៃខាងក្រោយ រួចនាំចេញជា WebM។",
  },
  "video-watermark": {
    en: "Add a text watermark to a video with position, opacity, and color, then export WebM.",
    km: "ដាក់សញ្ញាទឹកអត្ថបទលើវីដេអូ ជាមួយទីតាំង ភាពថ្លា និងពណ៌ រួចនាំចេញជា WebM។",
  },
  "sig-figs-calculator": {
    en: "Count significant figures, round to a chosen precision, and see each digit explained.",
    km: "រាប់ខ្ទង់សំខាន់ បង្គត់ទៅភាពជាក់លាក់ដែលជ្រើស ហើយមើលការពន្យល់រាល់ខ្ទង់។",
  },
  "modular-arithmetic": {
    en: "Add, subtract, multiply, and exponentiate modulo m, find inverses, and solve congruences step by step.",
    km: "បូក ដក គុណ និងស្វ័យគុណម៉ូឌុល m រក inverse និងដោះស្រាយ congruence មួយជំហានម្តង។",
  },
  "quartile-outlier-analyzer": {
    en: "Compute quartiles and IQR, and flag outliers in your data with Tukey's fence rule.",
    km: "គណនា quartile និង IQR ហើយសម្គាល់ outlier ក្នុងទិន្នន័យរបស់អ្នក តាមវិធាន Tukey fence។",
  },
  "break-even-calculator": {
    en: "Find the break-even units and revenue from fixed costs, variable cost, and price.",
    km: "រកចំនួនឯកតា និងចំណូលចំណុចដាច់ ពីតម្លៃថេរ តម្លៃប្រែប្រួល និងតម្លៃលក់។",
  },
  "cooking-converter": {
    en: "Convert cooking measures between cups, spoons, ounces, and grams for common ingredients.",
    km: "បម្លែងឯកតាចម្អិនអាហារ រវាងពែង ស្លាបព្រា អោនស៍ និងក្រាម សម្រាប់គ្រឿងផ្សំទូទៅ។",
  },
  "calories-burned": {
    en: "Estimate calories burned by activity, weight, and duration using a MET reference table.",
    km: "ប៉ាន់ស្មានកាឡូរីដុតតាមសកម្មភាព ទម្ងន់ និងរយៈពេល ដោយប្រើតារាង MET យោង។",
  },
  "blood-pressure-log": {
    en: "Log your blood pressure readings with summaries and general category references (not medical advice).",
    km: "កត់ត្រាសម្ពាធឈាមរបស់អ្នក ជាមួយសេចក្តីសង្ខេប និងការប្រៀបធៀបទូទៅ (មិនមែនជាដំបូន្មានវេជ្ជសាស្ត្រ)។",
  },
  "hiit-timer": {
    en: "Run HIIT intervals with work/rest presets like Tabata and a phase-change beep.",
    km: "ដំណើរការ HIIT interval ជាមួយ presets ដូចជា Tabata និងសំឡេងរោទិ៍ពេលប្តូរដំណាក់កាល។",
  },
  "minesweeper": {
    en: "Play classic Minesweeper with beginner, intermediate, and expert boards.",
    km: "លេងល្បែង Minesweeper បុរាណ ជាមួយក្តារកម្រិតដំបូង មធ្យម និងជំនាញ។",
  },
  "game-2048": {
    en: "Play 2048: slide tiles to merge them into 2048, with keyboard and touch controls.",
    km: "លេង ២០៤៨៖ រំកិលក្បឿងដើម្បីផ្សំឲ្យបាន ២០៤៨ ជាមួយការគ្រប់គ្រងក្តារចុច និងប៉ះ។",
  },
  "snake": {
    en: "Play the classic Snake arcade game with growing length and increasing speed.",
    km: "លេងល្បែងពស់បុរាណ ដែលពស់កាន់តែវែង និងលឿនជាងមុន។",
  },
  "connect-four": {
    en: "Play Connect Four against a friend or a simple AI on a 7×6 board.",
    km: "លេងល្បែងភ្ជាប់បួន ជាមួយមិត្ត ឬ AI សាមញ្ញ លើក្តារ ៧×៦។",
  },
  "mad-libs": {
    en: "Fill in words to build a funny story with Mad Libs templates in English and Khmer.",
    km: "បំពេញពាក្យដើម្បីបង្កើតរឿងកំប្លែង ជាមួយគំរូ Mad Libs ជាភាសាអង់គ្លេស និងខ្មែរ។",
  },
  "solstice-calculator": {
    en: "Estimate the equinox and solstice dates for any year with day-length comparisons.",
    km: "ប៉ាន់ស្មានកាលបរិច្ឆេទ equinox និង solstice សម្រាប់ឆ្នាំណាមួយ ជាមួយការប្រៀបធៀបប្រវែងថ្ងៃ។",
  },
  "serial-date-converter": {
    en: "Convert dates to and from Excel serial numbers and Julian Day numbers, including MJD.",
    km: "បម្លែងកាលបរិច្ឆេទ ទៅ និងពីលេខស៊េរី Excel និងលេខ Julian Day រួមទាំង MJD។",
  },
  "ouk-chatrang": {
    en: "Play Ouk Chatrang (Cambodian Chess) against an AI opponent or a friend, with a 3D board, full Cambodian rules, and Khmer piece labels.",
    km: "លេងអុកចត្រង្គទល់នឹងកុំព្យូទ័រ ឬមិត្ត ជាមួយក្តារ 3D ក្បួនខ្មែរពេញលេញ និងឈ្មោះកូនជាភាសាខ្មែរ។",
  },
};

export function toolDescription(tool: ToolDef) {
  const blurb = TOOL_BLURBS[tool.id];
  if (blurb) return `${blurb.en} ${blurb.km}`;

  const category = CATEGORY_META[tool.category];
  const khmerTitle = tool.khmerTitle ?? tool.title;
  return `Free ${tool.title} ${category.label.toLowerCase()} tool. ${khmerTitle} គឺជាឧបករណ៍${category.khmer}ឥតគិតថ្លៃសម្រាប់ប្រើក្នុងកម្មវិធីរុករករបស់អ្នក។`;
}

export function toolJsonLd(tool: ToolDef) {
  const category = CATEGORY_META[tool.category];
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.title,
    alternateName: tool.khmerTitle,
    description: toolDescription(tool),
    url: toolUrl(tool.id),
    applicationCategory: "UtilitiesApplication",
    applicationSubCategory: category.label,
    operatingSystem: "Web",
    browserRequirements: "Requires a modern web browser",
    inLanguage: ["en", "km"],
    isAccessibleForFree: true,
    featureList: tool.keywords.slice(0, 10),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}

/** Truthful per-tool FAQ (free, browser-only, bilingual UI). */
export function toolFaqLd(tool: ToolDef) {
  const what = toolWhatItDoes(tool);
  const how = toolHowToUse(tool);
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What does ${tool.title} do?`,
        acceptedAnswer: { "@type": "Answer", text: what.en },
      },
      {
        "@type": "Question",
        name: `How do I use ${tool.title}?`,
        acceptedAnswer: { "@type": "Answer", text: how.en.join(" ") },
      },
      {
        "@type": "Question",
        name: `Is ${tool.title} free to use?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Yes. ${tool.title} on 123 Toolbox is free and runs directly in your browser — no account or payment required.`,
        },
      },
      {
        "@type": "Question",
        name: `Do I need to install anything to use ${tool.title}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: "No installation is required. It runs in a modern web browser and processes your input locally on your device.",
        },
      },
      {
        "@type": "Question",
        name: `Is ${tool.title} available in Khmer?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. The 123 Toolbox interface supports English, Khmer, and a bilingual English–Khmer mode.",
        },
      },
    ],
  };
}

/** "What does this tool do?" — bilingual description. */
export function toolWhatItDoes(tool: ToolDef): { en: string; km: string } {
  const blurb = TOOL_BLURBS[tool.id];
  if (blurb) return { en: blurb.en, km: blurb.km };
  const category = CATEGORY_META[tool.category];
  const khmerTitle = tool.khmerTitle ?? tool.title;
  return {
    en: `${tool.title} is a free ${category.label.toLowerCase()} tool that runs directly in your browser.`,
    km: `${khmerTitle} គឺជាឧបករណ៍${category.khmer}ឥតគិតថ្លៃ ដែលដំណើរការដោយផ្ទាល់ក្នុងកម្មវិធីរុករករបស់អ្នក។`,
  };
}

/** "How do I use this tool?" — specific steps when known, otherwise generic. */
export function toolHowToUse(tool: ToolDef): { en: string[]; km: string[] } {
  const specific = HOWTO_TOOLS[tool.id];
  if (specific) {
    return {
      en: specific,
      km: specific,
    };
  }
  return {
    en: [
      "Open the tool.",
      "Enter or paste your input.",
      "View the result instantly.",
      "Copy or download the output if needed.",
    ],
    km: [
      "បើកឧបករណ៍។",
      "បញ្ចូល ឬបិទភ្ជាប់ទិន្នន័យរបស់អ្នក។",
      "មើលលទ្ធផលភ្លាមៗ។",
      "ចម្លង ឬទាញយកលទ្ធផលបើចាំបាច់។",
    ],
  };
}

/** Curated tools that get HowTo structured data (their steps are well-defined). */
const HOWTO_TOOLS: Record<string, string[]> = {
  "administrative-hierarchy": ["Type a province, district, commune, or village name (English, Khmer, or code)", "Pick the matching result to fill the full address path", "Or browse level by level with the four dropdowns", "Copy the selected path and administrative codes"],
  "khmer-sorter": ["Paste or type your Khmer text", "Choose to sort lines or words", "Copy the sorted output"],
  "khmer-text-stats": ["Paste or type your Khmer text", "Read the word, character, consonant, vowel, and digit counts"],
  "json-diff": ["Paste JSON document A", "Paste JSON document B", "Review the added, removed, and changed paths"],
  "excel-column-converter": ["Enter a column letter (e.g. AA) or number (e.g. 27)", "Read the converted value instantly"],
  "text-compressor": ["Paste your text", "Choose gzip or deflate", "Copy the compressed base64 output and compare sizes"],
  "pixelate-image": ["Upload or drop an image", "Adjust the pixel block size", "Download the pixelated PNG"],
  "chord-progression-generator": ["Pick a key and scale", "Choose a common progression", "Press Play to hear the chords or copy the note names"],
  "audio-file-size-calculator": ["Enter bitrate, duration, and channels", "Read the estimated file size for the chosen format"],
  "frame-rate-converter": ["Pick the source and target frame rates", "Enter the clip duration", "Read the speed change and new duration"],
  "video-file-size-calculator": ["Choose a resolution", "Enter bitrate and duration", "Read the estimated file size"],
  "work-hours-calculator": ["Enter start time, end time, and break for each shift", "Set the overtime threshold if needed", "Read total, regular, and overtime hours"],
  "business-days-calculator": ["Pick count-between or add-days mode", "Enter the dates or number of days", "Read the weekday result"],
  "day-of-year-calculator": ["Pick a date", "Read the day-of-year, week number, and days remaining", "Or enter a day number to find the date"],
  "quadratic-equation-solver": ["Enter a, b, and c", "Read the discriminant and roots with steps"],
  "angle-converter": ["Enter an angle in any unit", "Read the degrees, radians, gradians, and turns instantly"],
  "sleep-cycle-calculator": ["Choose wake-up or bedtime mode", "Enter your target time", "Read the recommended times for 4-6 cycles"],
  "step-distance-calculator": ["Enter steps and your height or stride length", "Read the distance in km/m and estimated calories"],
  "ingredient-substitution-guide": ["Search an ingredient", "Read the substitute and ratio"],
  "salary-calculator": ["Select a tax table", "Enter the gross monthly salary", "Read the net pay and bracket breakdown"],
  "late-fee-calculator": ["Enter principal, annual rate, and days late", "Read the late fee and total due"],
  "morse-code-translator": ["Type text or paste Morse", "Read the live translation in the other direction", "Copy the result"],
  "word-search-generator": ["Enter up to 12 words", "Pick a grid size and generate", "Print or copy the grid, with the solution list"],
  "khmer-address-parser": ["Paste or type a free-text address (Khmer or English)", "Click Parse", "Copy the structured fields or open it on Google Maps"],
  "khmer-keyboard-layout": ["Click keys to type Khmer characters", "Toggle Shift for the shifted layer", "Or paste a character to find its key"],
  "khmer-loanword-dictionary": ["Search a Khmer word or origin language", "Read its origin, meaning, and example"],
  "khmer-word-frequency": ["Paste Khmer text", "Read total, unique, and top-20 word frequencies"],
  "khmer-pronunciation-guide": ["Click a consonant or vowel", "Read its approximate sound and an example word"],
  "khmer-time-in-words": ["Enter any 24-hour time or switch to 12-hour AM/PM", "Read the Khmer numeral phrase and the fully-spelled word phrase", "Or enable Live clock to follow the current time"],
  "khmer-uposatha-days": ["Pick a starting date or month", "Optionally set an end date for a range", "Read the 4 uposatha types with lunar day names, weekday names, and Gregorian dates"],
  "khmer-baby-name-finder": ["Filter by gender or leave it on Any", "Search by name or meaning keyword", "Tap the star to add favourites and copy any name"],
  "khmer-poem-metre-checker": ["Paste your Khmer poem (កាព្យ), one verse per line", "Review the syllable count, ending pattern key, and rhyme group per line", "Check for mismatch highlights on consecutive lines"],
  "khmer-typing-test": ["Choose a passage and click into the typing box", "Type the sample exactly — the timer starts on your first keystroke", "When you finish read your CPM, accuracy, and error count; Reset to try again"],
  "anagram-solver": ["Enter your letters", "Optionally set min/max length or a wildcard pattern with underscores", "Browse the grouped results and click any word to copy it"],
  "secret-santa-draw": ["Enter participant names one per line (2–25)", "Click Draw next to reveal one private pair at a time until everyone is matched", "Use Reshuffle to start over, or copy the full result as CSV"],
  "name-compatibility": ["Enter two names and an optional relationship tag", "Read the compatibility score and verdict", "Click Shake dice to reroll with a new random seed"],
  "flashcard-quiz": ["Enter Question | Answer lines (one card per line)", "Click Start quiz and flip each card when ready to reveal the answer", "Mark I knew it to master the card, or Not yet to retry it later"],
  "pdf-merge": ["Open the PDF Merge tool", "Select or drag in two or more PDF files", "Choose the page order, then click Merge", "Download the combined PDF"],
  "qr-generator": ["Choose a content type (URL, Wi-Fi, contact, and more) and fill the fields", "Or upload an existing QR image / paste from clipboard in the Scan & redesign card to auto-populate everything", "Pick a style, color, size, badge, and optional logo", "Download the QR code as PNG or SVG"],
  "base64": ["Enter or paste your text", "Choose Encode or Decode", "Copy or download the result"],
  "json-formatter": ["Paste your JSON", "Click Format (or Minify)", "Copy the formatted output"],
  "uuid": ["Open the UUID Generator", "Choose how many UUIDs you need", "Copy the generated identifiers"],
  "hash": ["Enter your text", "Select an algorithm (MD5, SHA-1, SHA-256…)", "Copy the resulting hash"],
  "digit-converter": ["Enter Khmer or Arabic numerals", "Choose the conversion direction", "Copy the converted number"],
  "url-encode": ["Paste a URL or string", "Choose Encode or Decode", "Copy the result"],
  "case-converter": ["Paste your text", "Choose a case mode (UPPER, lower, Title, Sentence)", "Copy the converted text"],
  "word-counter": ["Paste your text", "View the live word, character, and line counts"],
  "social-post-generator": ["Pick the platform preset (X, Facebook, Telegram, or Instagram)", "Enter your handle, headline, subline, and hashtags", "Style the text and background colors, and add a logo if you want", "Download the post as a PNG"],
  "math-symbols": ["Open the Math Symbol Dictionary", "Search by name, meaning, or LaTeX, or filter by category", "Click the copy button on any symbol to copy it (or its LaTeX)"],
  "formula-solver": ["Choose a formula", "Select which variable to solve for", "Enter the known values", "Read the solved result"],
  "permutation-combination": ["Enter n (total items)", "Enter r (chosen items)", "Read the permutations, combinations, and factorial"],
  "complex-number": ["Choose an operation (add, subtract, multiply, divide)", "Enter the real and imaginary parts of both numbers", "Read the result, modulus, argument, and conjugate"],
  "geometry-calculator": ["Choose a 2D or 3D shape", "Enter the shape's dimensions", "Read the area/volume and perimeter/surface area"],
  "exponent-logarithm": ["Choose what to solve for (base, exponent, or result)", "Enter the two known values", "Read the result, then use the log section for logₐ(x)"],
  "trig-values": ["View the table of exact values for common angles", "Enter any angle and choose degrees or radians", "Read the sine, cosine, and tangent"],
  "electronics-calculators": ["Pick the section you need (resistor color code, LED resistor, voltage divider, or Ohm's law)", "Enter the values you know", "Read the calculated result"],
  "one-rep-max": ["Enter the weight you lifted", "Enter how many reps you completed", "Read the estimated 1RM and the percentage table"],
  "matrix-operations": ["Choose a matrix size (2×2 or 3×3)", "Enter the values for matrix A (and B)", "Pick an operation", "Read the result matrix or determinant"],
  "vector-calculator": ["Choose 2D or 3D", "Enter the components of vectors A and B", "Read the dot/cross products, magnitudes, angle, and projection"],
  "image-palette-extractor": ["Upload or drop an image", "Choose how many colors to extract", "Copy the hex codes of the dominant colors"],
  "barcode-generator": ["Choose a barcode type", "Enter the value", "Download the barcode as SVG"],
  "inflation-calculator": ["Enter an amount and start/end years", "Enter an annual inflation rate", "Read the equivalent value and total inflation"],
  "svg-to-png": ["Paste or upload SVG markup", "Set the output width and height", "Download the rendered PNG"],
  "deepseek-rate-desk": ["Pick a model (v4-flash or v4-pro)", "Choose auto, off-peak, or peak", "Set tokens, cache hit rate, and request count", "Read the estimated cost"],
  "excel-password-remover": ["Upload an .xlsx or .xlsm file", "Review the detected protection (sheets and workbook)", "Click Remove protection & download", "Open the downloaded, unprotected copy"],
  "webcam-mic-test": ["Choose your camera and microphone", "Click Start test and allow permissions", "Check the live preview, resolution, and mic level meter"],
  "screen-recorder": ["Optionally enable microphone narration", "Click Start recording and choose a screen or tab", "Stop when finished", "Preview and download the WebM video"],
  "screen-color-picker": ["Click Pick a color from screen", "Hover any pixel and click to capture it", "Copy the hex, RGB, or HSL value"],
  "periodic-table": ["Click any element to see its details", "Type a chemical formula like H2SO4", "Read the molar mass and per-element breakdown"],
  "word-cloud": ["Paste your text", "Shuffle the layout if you like", "Download the cloud as PNG"],
  "braille-translator": ["Choose Text → Braille or Braille → Text", "Enter your text", "Copy the converted output"],
  "script-analyzer": ["Paste suspicious text, a URL, or a username", "Review the script breakdown and homoglyph alerts", "Copy the cleaned text with invisible characters stripped"],
  "dns-lookup": ["Enter a domain name", "Choose a record type (A, MX, TXT…)", "Click Look up", "Read the live records with their TTLs"],
  "whats-my-ip": ["Open the tool", "Your public IP appears automatically", "Copy it or review the ISP and location details"],
  "http-request-tester": ["Pick a method and enter the URL", "Add headers and a body if needed", "Send the request", "Review status, timing, and response body"],
  "hmac-generator": ["Choose an algorithm", "Enter the message and secret key", "Copy the HMAC in hex or base64"],
  "text-to-speech": ["Type or paste text", "Choose a voice and adjust rate, pitch, volume", "Click Speak"],
  "images-to-gif": ["Add images in play order", "Set frame delay, width, and quality", "Generate and download the GIF"],
  "meme-generator": ["Upload an image", "Type top and bottom captions", "Adjust font size if needed", "Download as PNG"],
  "file-checksum": ["Drop or browse for a file", "Copy the SHA-256 (or other) hash", "Paste an expected checksum to verify the match"],
  "speed-test": ["Click Start speed test", "Wait through ping, download, and upload phases", "Read your ping, jitter, and Mbps results"],
  "qr-batch": ["Paste one entry per line (text | file-name)", "Choose error-correction level", "Download the ZIP of SVG QR codes"],
  "curl-converter": ["Paste a curl command", "Choose the target language or library", "Copy the generated code"],
  "markdown-toc": ["Paste your Markdown", "Set the maximum heading depth", "Copy the generated table of contents"],
  "voice-dictation": ["Choose your language", "Click Start dictating and allow microphone access", "Speak — text appears as you talk"],
  "savings-goal": ["Enter your goal and current savings", "Choose time-to-goal or deadline mode", "Read months needed or required monthly deposit"],
  "meta-tag-generator": ["Fill in title, description, and URLs", "Review the generated snippet", "Paste it into your page's <head>"],
  "pregnancy-due-date": ["Enter the first day of the last period", "Adjust cycle length if it differs from 28 days", "Read the due date, current week, and trimester dates"],
  "debt-settle-up": ["Add each person and what they paid", "Review total and fair share", "Follow the minimal transfers to settle up"],
  "khmer-studio": ["Pick a tab: Poster, Crossword / Word search, Exam sheet, or Flashcards", "Type your Khmer text or paste a word/question list (or load a word bank)", "Adjust font, weight, palette, and format", "Download the print-ready PDF (answer keys included for puzzles and exams)"],
  "khmer-practice-sheets": ["Type the letters or words to practice (one per line)", "Choose a font and how many tracing cells", "Preview and download the worksheet PDF"],
  "certificate-generator": ["Enter organisation, award line, and date", "Paste recipient names (one per line)", "Pick a font and border color", "Download one PDF with a page per recipient"],
  "envelope-printer": ["Paste addresses separated by blank lines", "Choose DL, C6, or A4 label format", "Optionally add a sender block", "Download and print"],
  "event-ticket-sheet": ["Enter event title, date, venue, and price", "Set start number and quantity", "Add a QR link prefix if needed", "Download the numbered ticket sheets"],
  "khmer-lyrics": ["Pick Sample or paste your khlyrics JSON", "Search by title, artist, or lyric", "Select a song to read its lyrics", "Copy the lyrics to use elsewhere"],
  "site-forensics": ["Enter a domain or URL", "Click Inspect", "Review DNS, HTTP, WHOIS, IP, and Wayback sections", "Check the source note about live data"],
  "flight-route-planner": ["Type an origin IATA code or city name", "Pick the airport from the suggestions", "Do the same for the destination", "Read the route distance and estimated cruise time"],
  "map-poster-generator": ["Choose a Cambodian location", "Pick a basemap and theme", "Adjust zoom and title", "Export and download the PNG poster"],
  "route-on-map": ["Enter an origin airport code", "Enter a destination airport code", "Review the route drawn on the map", "Read the great-circle distance"],
  "khmer-text-diff": ["Paste the original Khmer text", "Paste the changed Khmer text", "Choose grapheme or word granularity", "Read the highlighted differences"],
  "khmer-greeting-cards": ["Pick an occasion and theme", "Edit the Khmer and English message", "Add your name", "Preview and download the card"],
  "clipboard-manager": ["Copy text, or paste from your clipboard", "Browse the captured history", "Pin, search, and clear items", "Click Copy to reuse any entry"],
  "screenshot-ocr": ["Upload or paste a screenshot", "Pick Khmer or English", "Click Extract text", "Copy the recognized text"],
  "lsb-steganography": ["Upload an image", "Choose Hide or Read mode", "Enter a message and hide it, or read one back", "Download the encoded PNG"],
  "audio-visualizer-player": ["Choose an audio file", "Pick a visualizer mode (bars, wave, radial)", "Adjust the color", "Play to see the live visualization"],
  "video-to-audio": ["Choose a video file", "Click Extract audio", "Review the detected duration", "Download the WAV file"],
  "video-merger": ["Select two or more video files", "Reorder or remove clips as needed", "Click Merge videos", "Download the combined WebM"],
  "subtitle-player": ["Choose a video file", "Paste SRT text or load a .srt file", "Play the video", "Read the active caption synced to playback"],
  "video-frame-batch": ["Choose a video file", "Set the frame interval in seconds", "Click Extract frames", "Download all frames as a ZIP"],
  "khmer-bionic-reader": ["Paste Khmer text", "Pick an intensity level", "Read the bolded preview", "Copy the HTML output if needed"],
  "magic-byte-checker": ["Upload a file or paste hex bytes", "Review the detected type", "Check the byte preview", "Use the result to rename/identify the file"],
  "water-bill-calculator": ["Enter your monthly cubic-meter usage", "Adjust or verify the tier rates if needed", "Read the estimated bill in KHR and USD", "Confirm against your PPWSA bill"],
  "nssf-payroll-calculator": ["Enter base salary and headcount", "Set the salary ceiling and exchange rate", "Review the editable contribution rates", "Read the employee, employer and total shares"],
  "insurance-premium-estimator": ["Pick a coverage tier", "Choose the age band", "Set the number of members", "Read the estimated monthly and yearly premium"],
  "ride-fare-estimator": ["Choose a vehicle type", "Enter km or two map points", "Read the estimated fare in KHR and USD", "Allow for surge and real road distance"],
  "document-expiry-reminder": ["Enter the document expiry date", "Set the travel-rule window", "Read days and months remaining", "Renew before it hits the rule window"],
  "emergency-hotlines": ["Search or filter by category", "Find the number you need", "Tap the number to call", "Keep emergency lines 117/118/119/911 saved"],
  "school-year-planner": ["Set the first-semester start", "Set semester and break lengths", "Read the two-semester timeline", "Verify against your school calendar"],
  "object-counter": ["Upload an image", "Click Count objects", "Review the detected boxes on the image", "Read the total and per-category counts"],
  "yaml-formatter": ["Paste your YAML", "Choose Format, Validate, or Minify", "Fix any reported error at the given line", "Copy the formatted output"],
  "xml-formatter": ["Paste your XML", "Choose Format, Minify, or Validate", "Fix any reported error at the given line", "Copy the formatted output"],
  "code-to-image": ["Paste or type your code", "Pick a theme and toggle line numbers", "Adjust the title bar text", "Download the image as PNG"],
  "websocket-tester": ["Enter a ws:// or wss:// URL", "Click Connect", "Type a message and Send (text or JSON)", "Review the timestamped log, then Disconnect"],
  "punycode-converter": ["Enter a unicode domain or an xn-- punycode label", "Choose Encode or Decode", "Copy the converted domain"],
  "mac-vendor-lookup": ["Paste a MAC address in any common format", "Check the detected OUI", "Read the vendor from the sample list or follow the IEEE link for the full registry"],
  "hash-identifier": ["Paste the hash string", "Review the candidate algorithms and confidence", "Use the matching algorithm in the Hash tool if needed"],
  "email-header-analyzer": ["Open the raw email headers from your mail client", "Paste them into the tool", "Review the From/To/Received chain and SPF/DKIM/DMARC results"],
  "totp-authenticator": ["Paste a base32 secret (from a setup key or QR content)", "Read the current 6-digit code and countdown", "Enter a code to verify it", "Switch to HOTP counter mode if needed"],
  "aes-encryption": ["Enter a passphrase and text", "Click Encrypt to get the base64 output", "Paste the output and the same passphrase, then Decrypt to recover the text"],
  "rsa-key-generator": ["Choose a key size (2048 or 4096)", "Click Generate", "Copy the public and private PEM keys", "Store the private key securely — it never leaves your device"],
  "base58-codec": ["Enter text or hex, or paste a Base58 string", "Choose Encode or Decode", "Toggle Base58Check to verify a checksum"],
  "certificate-viewer": ["Paste a PEM certificate", "Review subject, issuer, validity, and SANs", "Check the expiry status (valid, expiring, expired)"],
  "pwned-check": ["Type or paste a password", "Click Check", "Review the result (found count or not found)", "Only the first 5 hash characters are sent, never the password"],
  "bitwise-calculator": ["Enter two integers (decimal or 0x hex)", "Choose an operation (AND, OR, XOR, NOT, shift)", "Read the result in decimal, hex, and binary"],
  "odds-converter": ["Enter any one odds format", "Read the converted decimal, fractional, American, and implied probability", "Optionally enter a stake to see payout"],
  "linear-regression": ["Paste X,Y pairs (CSV or x,y lines)", "Read slope, intercept, R², and correlation", "Enter an x to predict y"],
  "zscore-calculator": ["Enter value, mean, and standard deviation", "Read the z-score, probability, and percentile", "Switch to probability → z to invert"],
  "sequence-solver": ["Choose arithmetic or geometric", "Enter the first term and common difference/ratio", "Set n to read the nth term and the sum"],
  "language-detector": ["Paste your text", "Read the detected script and likely language", "Treat the result as an approximation"],
  "ngram-finder": ["Paste your text", "Choose the N size and options (ignore case, skip stopwords)", "Review the frequency list or copy it as CSV"],
  "ipa-phonetics": ["Type or paste an English word", "Read its approximate IPA transcription", "Check the sample dictionary note for coverage limits"],
  "unicode-text-generator": ["Type your text", "Pick a style (zalgo, fullwidth, small caps, bold, strikethrough)", "Copy the transformed result"],
  "glassmorphism-generator": ["Adjust blur, opacity, border, radius, and shadow", "Watch the live glass preview", "Copy the generated CSS"],
  "neumorphism-generator": ["Adjust distance, blur, color, and radius", "Watch the soft UI preview", "Copy the generated CSS"],
  "text-shadow-generator": ["Add or remove shadow layers", "Set offset, blur, and color per layer", "Copy the CSS text-shadow"],
  "css-filter-generator": ["Adjust the filter sliders (grayscale, sepia, brightness…)", "Watch the live image preview", "Copy the filter CSS"],
  "font-pair-finder": ["Browse the curated heading/body pairings", "Edit the sample text", "Use the pairing with its Google Fonts links"],
  "css-grid-playground": ["Set columns, rows, gap, and alignment", "Watch the live grid preview", "Copy the generated CSS"],
  "svg-path-inspector": ["Paste an SVG path d attribute", "Review the parsed commands and stats", "Check the live path preview"],
  "svg-pattern-generator": ["Pick a pattern type (dots, stripes, grid…)", "Set colors, sizes, and spacing", "Copy the SVG code"],
  "graph-visualizer": ["Paste edges (one per line, like A-B) or edit the sample graph", "Review the force-directed layout", "Drag nodes or hover for details"],
  "resume-builder": ["Fill in your details and entries", "Review the A4 preview", "Print (or print to PDF) from your browser"],
  "concrete-calculator": ["Choose the shape (slab, column, beam, footing)", "Enter the dimensions and mix ratio", "Read the volume and the cement/sand/gravel estimate"],
  "rebar-calculator": ["Pick a rebar diameter", "Enter length and quantity", "Read the weight, plus slab/beam quantity estimates"],
  "tile-calculator": ["Enter the floor or wall area", "Pick a tile size and joint width", "Set wastage % and tiles per box", "Read tiles and boxes needed"],
  "solar-calculator": ["Enter your daily energy use in kWh", "Adjust panel wattage, system voltage, and battery depth-of-discharge", "Read panels, battery bank, and inverter size"],
  "ac-btu-calculator": ["Enter room dimensions, occupants, and sun exposure", "Adjust electronics wattage if needed", "Read the recommended BTU/kW and capacity"],
  "generator-sizing": ["Add each appliance with its running watts", "Flag motor loads for the surge factor", "Read total running and starting loads and the recommended generator size"],
  "gold-price-calculator": ["Enter the current gold rate (user-supplied)", "Choose the weight unit (chi, gram, troy ounce)", "Pick the purity and read the value in KHR and USD"],
  "sitemap-generator": ["Enter your base URL", "Add one page path per line (optionally with lastmod/frequency/priority)", "Copy or download the generated sitemap.xml"],
  "robots-txt-generator": ["Add user-agent groups with Allow/Disallow rules", "Optionally set Crawl-delay and a Sitemap URL", "Copy or download the robots.txt"],
  "rss-generator": ["Fill in feed metadata (title, link, description)", "Add your items (title, link, description, optional date)", "Copy or download the RSS 2.0 XML"],
  "khmer-proverbs": ["Browse or search the curated proverbs", "Use the shuffle to get a proverb of the day", "Read the Khmer meaning and English translation"],
  "khmer-rhyming-dictionary": ["Type a Khmer word to search", "Click a word to open its rhyme family", "Read the rhyming partners with definitions"],
  "khmer-poem-generator": ["Pick a theme and stanza count", "Choose a rhyme scheme", "Click Generate and review the sample verses"],
  "heart-rate-zones": ["Enter your age", "Optionally add your resting heart rate", "Read your max HR and Z1–Z5 target zones"],
  "git-cheatsheet": ["Browse the grouped commands", "Click copy on any command", "Paste it into your terminal"],
  "html-css-cheatsheet": ["Browse the HTML5 and CSS reference groups", "Click copy on any snippet", "Paste it into your code"],
  "sql-cheatsheet": ["Browse the SQL reference groups", "Click copy on any query", "Paste it into your SQL editor"],
  "linux-cheatsheet": ["Browse the command groups", "Click copy on any command", "Paste it into your terminal"],
  "country-dialing-codes": ["Search by country, code, or ISO2", "Find the calling code and example format", "Copy the code"],
  "currency-codes": ["Search by code, number, or name", "Read the ISO 4217 details and symbol", "Copy the code"],
  "food-calorie-reference": ["Search or filter by food category", "Review the approximate kcal values", "Always verify with the product label"],
  "recipe-resizer": ["Add your ingredients with amounts and units", "Set the original and target servings", "Read the scaled amounts and copy the recipe"],
  "coffee-ratio": ["Pick a brew method preset", "Enter coffee grams or water ml", "Read the other amount and servings"],
  "image-collage": ["Upload multiple images", "Choose grid rows/columns, gap, and background", "Download the combined PNG"],
  "image-vectorizer": ["Upload an image", "Adjust threshold and simplify tolerance", "Copy or download the SVG outline"],
  "placeholder-image": ["Set width, height, text, and colors", "Preview the SVG placeholder", "Copy the SVG or download it"],
  "gif-splitter": ["Upload a GIF", "Review the extracted frames and adjust speed", "Remove unwanted frames if needed", "Re-encode and download the GIF"],
  "barcode-reader": ["Upload a barcode image (EAN/UPC)", "Read the decoded value and checksum result", "Check the browser-support note for the native API"],
  "image-histogram": ["Upload an image", "Toggle R/G/B/luminance channels", "Read the channel statistics"],
  "pixel-art": ["Upload an image and choose the grid size", "Enable color quantization if you like", "Preview and export the PNG, or draw on a blank grid"],
  "audio-merger": ["Add audio files in order", "Reorder them if needed", "Click Merge and download the WAV"],
  "tempo-changer": ["Load an audio file", "Adjust the tempo and pitch sliders", "Play to hear the effect"],
  "noise-generator": ["Pick white, pink, or brown noise", "Set duration and volume", "Play, or download the WAV"],
  "virtual-piano": ["Click the keys or use your computer keyboard", "Hold for sustain", "Play a chord from the dictionary"],
  "video-compressor": ["Load a video", "Set scale and bitrate", "Start the re-encode and download the WebM"],
  "subtitle-editor": ["Load or paste SRT/VTT subtitles", "Edit cue timings and text", "Apply a global offset if needed", "Export as SRT or VTT"],
  "period-tracker": ["Set your cycle and period lengths", "Enter your last period start date", "Read the predicted periods, ovulation, and fertile window"],
  "fasting-timer": ["Pick a fasting preset or set a custom window", "Start the timer", "Pause or reset as needed, and review the history"],
  "sudoku": ["Choose a difficulty and start a new game", "Tap a cell and enter a number (or use notes)", "Use Check, Hint, or Solve as needed"],
  "trivia-quiz": ["Start the quiz", "Pick an answer for each question", "Read your score and the result"],
  "bingo-generator": ["Choose how many cards you need", "Generate the cards", "Print the sheet of cards"],
  "cambodia-geography-quiz": ["Start the quiz", "Answer the province, capital, and landmark questions", "Read the explanations for each answer"],
  "stereo-channel-test": ["Pick a signal type (tone or noise)", "Choose left, right, both, or sweep", "Adjust the volume and check which speaker plays"],
  "css-animation-generator": ["Choose a property and from/to values", "Set easing, duration, delay, and iteration", "Copy the generated keyframe CSS"],
  "keyboard-event-viewer": ["Click the box to focus it", "Press any key and watch the event details", "Clear the log when done"],
  "sample-size-calculator": ["Pick a confidence level", "Enter the margin of error and expected proportion", "Optionally add the population size", "Read the required sample size and achieved margin"],
  "margin-markup-calculator": ["Choose a mode (from price, from margin, or from cost)", "Enter the two known values", "Read margin, markup, and implied price"],
  "device-info": ["Open the tool", "Review the read-only device and browser details", "Click Refresh to re-read values"],
  "download-time-calculator": ["Enter the file size and its unit", "Enter the link speed and its unit", "Read the estimated time and transfer rate"],
  "ipv6-subnet-calculator": ["Enter an IPv6 address, optionally with /prefix", "Read the type, expanded/compressed forms", "Review the subnet first/last address and size"],
  "depreciation-calculator": ["Enter asset cost, salvage value, and life", "Pick a depreciation method", "Read the year-by-year schedule"],
  "meeting-cost-calculator": ["Enter attendees, average hourly rate, and minutes", "Read the total, per-person, and per-minute cost", "Start live mode to watch it tick"],
  "npv-irr-calculator": ["Paste a cash-flow list (one value per line)", "Enter a discount rate", "Read NPV, IRR, and simple payback"],
  "volumetric-weight-calculator": ["Enter length, width, height, and actual weight", "Pick a divisor (default 5000) or custom", "Read the volumetric and chargeable weight"],
  "dilution-calculator": ["Choose which variable to solve for", "Enter the other three values", "Read the solved value and the molarity section"],
  "dna-translator": ["Paste a DNA or RNA sequence", "Pick a reading frame", "Read transcription, reverse complement, GC content, and translation"],
  "half-life-calculator": ["Enter the initial amount and half-life", "Enter the elapsed time", "Read the remaining amount, λ, and mean lifetime"],
  "khmer-musical-instruments": ["Browse or search the instruments", "Filter by strings, percussion, or wind", "Read the Khmer and English names and descriptions"],
  "khmer-dances-festivals": ["Browse or search the dances and festivals", "Filter by type", "Read the timing and description"],
  "khmer-dish-glossary": ["Search by Khmer or English name", "Read the short description", "Use it when ordering or translating a menu"],
  "khmer-birthday-personality": ["Enter your birth date", "Read your Khmer weekday", "Review the traditional personality traits and color"],
  "khmer-lunar-calendar": ["Pick a month with the picker or arrows", "Read the lunar day under each date", "Check the lunar month and zodiac year"],
  "khmer-new-year-countdown": ["Open the tool", "Read the live countdown to the next Khmer New Year", "See the current zodiac animal and the mid-April note"],
  "semver-calculator": ["Enter a version to validate and inspect", "Optionally enter a second version to compare", "Click an increment button to suggest the next version"],
  "env-validator": ["Paste your .env content", "Review the per-line issues and summary", "Fix duplicates, quoting, or invalid keys"],
  "jsonpath-tester": ["Paste your JSON", "Type a JSONPath expression like $.items[*].id", "Read the matched results and count"],
  "pwa-manifest-generator": ["Fill in name, start_url, and other fields", "Add icons with sizes and purpose", "Copy or download the manifest.json"],
  "conventional-commit-generator": ["Pick a type and optional scope", "Write the description and optional body", "Copy the generated commit message"],
  "cookie-parser": ["Paste Cookie or Set-Cookie headers", "Review the parsed attributes table", "Or build a Cookie header from name/value pairs"],
  "avatar-identicon-generator": ["Enter a name for an initials avatar, or any string for an identicon", "Pick colors, shape, and size", "Copy the SVG or download the PNG"],
  "loading-spinner-generator": ["Pick a spinner style", "Set color, size, and speed", "Copy the CSS or SVG code"],
  "skeleton-loader-generator": ["Toggle avatar, lines, card, and button blocks", "Set the shimmer colors and duration", "Copy the generated CSS"],
  "css-transform-generator": ["Adjust the transform sliders", "Set perspective and transform-origin", "Copy the CSS"],
  "image-compare-slider": ["Upload a before and after image", "Drag the divider to compare", "Swap sides if needed"],
  "webcam-photo-booth": ["Allow camera access", "Toggle mirror and effects", "Capture photos and download them as PNG"],
  "duplicate-image-checker": ["Upload multiple images", "Adjust the similarity threshold", "Review the grouped similar or duplicate images"],
  "beat-maker": ["Pick a preset or program your own steps", "Set the BPM", "Press Play and adjust while it loops"],
  "instrument-tuner": ["Allow microphone access", "Play a note on your instrument", "Read the nearest note and cents, and adjust tuning"],
  "sound-effect-generator": ["Pick an effect type", "Adjust frequencies and duration", "Play it or download the WAV"],
  "video-speed-changer": ["Load a video", "Choose a speed (0.25x–4x)", "Re-encode and download the WebM"],
  "video-green-screen": ["Load a video with a green screen", "Optionally load a background image", "Adjust the key tolerance", "Preview and export the WebM"],
  "video-watermark": ["Load a video", "Type the watermark text and set style", "Preview and export the WebM"],
  "sig-figs-calculator": ["Enter a number", "Read the significant-figure count and explanation", "Optionally round to a chosen number of sig figs"],
  "modular-arithmetic": ["Pick an operation", "Enter the values and modulus", "Read the result with steps"],
  "quartile-outlier-analyzer": ["Paste a list of numbers", "Read the quartiles and IQR", "Review the flagged outliers"],
  "break-even-calculator": ["Enter fixed costs, variable cost per unit, and price", "Read the break-even units and revenue", "Optionally enter a target volume for profit"],
  "cooking-converter": ["Choose an ingredient or plain volume mode", "Enter an amount and unit", "Read the converted amount"],
  "calories-burned": ["Pick an activity", "Enter your weight and duration", "Read the estimated calories burned"],
  "blood-pressure-log": ["Add a reading with systolic, diastolic, and pulse", "Review the summary and category badge", "Delete or clear entries as needed"],
  "hiit-timer": ["Pick a preset like Tabata or set custom intervals", "Start the timer", "Follow the work/rest phases and rounds"],
  "minesweeper": ["Pick a difficulty", "Left-click to reveal, right-click to flag", "Clear the board without hitting a mine"],
  "game-2048": ["Use arrow keys or swipe to slide tiles", "Merge equal tiles", "Reach 2048 (or undo a move if needed)"],
  "snake": ["Use arrow keys, WASD, or the on-screen pad", "Eat the food and avoid the walls and yourself", "Beat your best score"],
  "connect-four": ["Pick two-player or vs AI", "Click a column to drop a disc", "Connect four in a row, column, or diagonal"],
  "mad-libs": ["Pick a story template", "Fill in each word type", "Read the funny completed story"],
  "solstice-calculator": ["Enter a year", "Read the equinox and solstice dates", "Compare day lengths by season"],
  "serial-date-converter": ["Enter a date, Excel serial, or Julian Day number", "Read the converted values", "Copy the result"],
  "ouk-chatrang": ["Click a piece to select it — valid moves light up on the board", "Click a highlighted square to move", "Use Hint for a suggested move, or Undo to take a move back", "Open Settings to change difficulty, board theme, or switch to 2D view"],
};

/** HowTo structured data for tools with well-defined, truthful steps. */
export function toolHowToLd(tool: ToolDef) {
  const steps = HOWTO_TOOLS[tool.id];
  if (!steps) return null;
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to use ${tool.title}`,
    description: toolDescription(tool),
    url: toolUrl(tool.id),
    inLanguage: ["en", "km"],
    totalTime: "PT1M",
    step: steps.map((text, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: text,
    })),
  };
}

/** Breadcrumb for a tool page: Home → Category → Tool. */
export function toolBreadcrumbLd(tool: ToolDef) {
  const category = CATEGORY_META[tool.category];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "123 Toolbox", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: category.label, item: BASE_URL },
      { "@type": "ListItem", position: 3, name: tool.title, item: toolUrl(tool.id) },
    ],
  };
}

/** Site-wide Organization + WebSite schema (with search action). */
export function siteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "123 Toolbox",
        url: BASE_URL,
        logo: `${BASE_URL}/icon.svg`,
        sameAs: ["https://github.com/im4tta/tools123"],
      },
      {
        "@type": "WebSite",
        name: "123 Toolbox",
        url: BASE_URL,
        inLanguage: ["en", "km"],
        publisher: { "@id": `${BASE_URL}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${BASE_URL}/?q={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Is 123 Toolbox free to use?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Every tool on 123 Toolbox is free and runs directly in your browser — no account or payment required.",
            },
          },
          {
            "@type": "Question",
            name: "Are my files uploaded to a server?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. Files and text are processed locally in your browser and are not uploaded by 123 Toolbox, except for a few tools that clearly depend on an external resource.",
            },
          },
          {
            "@type": "Question",
            name: "What kinds of tools are available?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "123 Toolbox includes hundreds of tools for PDFs, images, developers, designers, Khmer language, geospatial data, security, math, and everyday work.",
            },
          },
          {
            "@type": "Question",
            name: "Which languages does 123 Toolbox support?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The interface supports English, Khmer, and a bilingual English–Khmer mode.",
            },
          },
        ],
      },
    ],
  };
}
