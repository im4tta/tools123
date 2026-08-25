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
  "pdf-merge": ["Open the PDF Merge tool", "Select or drag in two or more PDF files", "Choose the page order, then click Merge", "Download the combined PDF"],
  "qr-generator": ["Choose a content type (URL, Wi-Fi, contact, and more)", "Fill in the required fields", "Pick a style and size", "Download the QR code as PNG or SVG"],
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
