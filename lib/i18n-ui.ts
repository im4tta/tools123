// Central English → Khmer dictionary for shared tool UI text.
//
// Entries are tuples rather than an object literal so that repeated English
// keys across tool categories can never break the build, and so the first
// entry always wins. Lookups are whitespace-normalised and case-sensitive
// first, then case-insensitive, so a label written as "Max width (px)" or
// "Max Width (px)" both resolve.

type Entry = [string, string];

const LABELS: Entry[] = [
  // --- Audio & media ---
  ["Fade in", "បើកសំឡេងបន្តិចម្តងៗ"], ["Fade out", "បញ្ចប់សំឡេងបន្តិចម្តងៗ"], ["Gain", "កម្រិតសំឡេង"], ["File info", "ព័ត៌មានឯកសារ"],
  ["Frame rate", "អត្រាហ្វ្រេម"], ["Export quality", "គុណភាពនាំចេញ"], ["Resolution", "គុណភាពបង្ហាញ"],
  // --- Geometry & size ---
  ["Width", "ទទឹង"], ["Height", "កម្ពស់"], ["Ratio", "សមាមាត្រ"], ["Scale to new width", "ប្តូរទំហំតាមទទឹងថ្មី"], ["Resulting height", "កម្ពស់លទ្ធផល"],
  ["Width (px)", "ទទឹង (px)"], ["Max width (px)", "ទទឹងធំបំផុត (px)"], ["Output width (px)", "ទទឹងលទ្ធផល (px)"], ["Size (px)", "ទំហំ (px)"],
  ["Known dimension (px, mm, etc.)", "ទំហំដែលដឹងស្រាប់ (px, mm ជាដើម)"],
  ["If this is the shorter side → longer side", "ប្រសិនបើនេះជាជ្រុងខ្លី → ជ្រុងវែង"],
  ["If this is the longer side → shorter side", "ប្រសិនបើនេះជាជ្រុងវែង → ជ្រុងខ្លី"],
  // --- Position & alignment ---
  ["Top-left", "ខាងលើឆ្វេង"], ["Top-right", "ខាងលើស្តាំ"], ["Bottom-right", "ខាងក្រោមស្តាំ"], ["Bottom-left", "ខាងក្រោមឆ្វេង"],
  ["X offset", "គម្លាតតាមអក្ស X"], ["Y offset", "គម្លាតតាមអក្ស Y"], ["Alignment", "ការតម្រឹម"], ["Position", "ទីតាំង"],
  ["Snap to corner", "ដាក់ទៅជ្រុង"], ["Mark size", "ទំហំសញ្ញា"],
  // --- Colour & style ---
  ["Blur", "ភាពព្រិល"], ["Spread", "ការរាលដាល"], ["Color", "ពណ៌"], ["Hex color", "ពណ៌ជាកូដ Hex"], ["Nearest match", "ពណ៌ជិតបំផុត"],
  ["Base color", "ពណ៌មូលដ្ឋាន"], ["Foreground", "ពណ៌អក្សរ"], ["Background", "ផ្ទៃខាងក្រោយ"], ["Contrast ratio", "សមាមាត្រផ្ទុយពណ៌"],
  ["Color 1", "ពណ៌ទី ១"], ["Color 2", "ពណ៌ទី ២"], ["Angle (deg)", "មុំ (ដឺក្រេ)"], ["Angle", "មុំ"], ["Text color", "ពណ៌អក្សរ"],
  ["Foreground color", "ពណ៌អក្សរ"], ["Background color", "ពណ៌ផ្ទៃខាងក្រោយ"],
  ["Background — start", "ផ្ទៃខាងក្រោយ — ចាប់ផ្តើម"], ["Background — end", "ផ្ទៃខាងក្រោយ — បញ្ចប់"],
  ["Brightness", "ពន្លឺ"], ["Contrast", "ភាពផ្ទុយពណ៌"], ["Saturation", "ភាពរស់នៃពណ៌"], ["Grayscale", "ពណ៌ប្រផេះ"], ["Sepia", "ពណ៌ត្នោតចាស់"],
  ["Opacity", "ភាពថ្លា"], ["Style", "រចនាបថ"], ["Tone", "សំនៀង"],
  // --- CSS & web ---
  ["Min size (px)", "ទំហំតូចបំផុត (px)"], ["Max size (px)", "ទំហំធំបំផុត (px)"],
  ["Min viewport (px)", "ទំហំអេក្រង់តូចបំផុត (px)"], ["Max viewport (px)", "ទំហំអេក្រង់ធំបំផុត (px)"],
  ["Pixels", "ភីកសែល"], ["Root font size (px)", "ទំហំអក្សរគោល (px)"], ["Points (pt)", "ចំណុច (pt)"],
  ["HTML to paste into <head>", "កូដ HTML សម្រាប់ដាក់ក្នុង <head>"], ["CSS custom properties", "អថេរផ្ទាល់ខ្លួន CSS"],
  ["VectorDrawable XML", "កូដ XML របស់ VectorDrawable"], ["Source HTML", "កូដ HTML ដើម"],
  ["Eyebrow / site name", "ចំណងជើងរង / ឈ្មោះគេហទំព័រ"], ["Title", "ចំណងជើង"], ["Subtitle", "ចំណងជើងរង"],
  ["Logo (optional)", "រូបសញ្ញា (ជម្រើស)"], ["Center logo (optional)", "រូបសញ្ញាកណ្តាល (ជម្រើស)"],
  ["Base (px)", "មូលដ្ឋាន (px)"], ["Steps", "ជំហាន"], ["Font size", "ទំហំអក្សរ"],
  // --- Generic input & output ---
  ["Preview", "មើលជាមុន"], ["Result", "លទ្ធផល"], ["Input", "ទិន្នន័យបញ្ចូល"], ["Output", "លទ្ធផល"],
  ["Input text", "អត្ថបទបញ្ចូល"], ["Input JSON", "ទិន្នន័យ JSON បញ្ចូល"], ["CSV input", "ទិន្នន័យ CSV បញ្ចូល"],
  ["Original", "ដើម"], ["Modified", "បានកែប្រែ"], ["Text", "អត្ថបទ"], ["Value", "តម្លៃ"], ["Count", "ចំនួន"], ["Unit", "ឯកតា"],
  ["Mode", "របៀប"], ["Format", "ទម្រង់"], ["Output format", "ទម្រង់លទ្ធផល"], ["Export format", "ទម្រង់នាំចេញ"],
  ["Quality", "គុណភាព"], ["Indent", "ការចូលបន្ទាត់"], ["Summary", "សេចក្តីសង្ខេប"], ["Error", "កំហុស"],
  ["Category", "ប្រភេទ"], ["Search", "ស្វែងរក"], ["Filter", "ត្រង"], ["Direction", "ទិសដៅបម្លែង"], ["Strategy", "វិធីសាស្ត្រ"],
  ["Description", "ការពិពណ៌នា"], ["Content", "ខ្លឹមសារ"], ["Content type", "ប្រភេទខ្លឹមសារ"], ["Status", "ស្ថានភាព"],
  ["Normalized", "បានសម្អាត"], ["Normalized output", "លទ្ធផលដែលបានសម្អាត"], ["Converted", "បានបម្លែង"], ["Formatted", "បានរៀបចំទម្រង់"],
  ["Verdict", "លទ្ធផលវិនិច្ឆ័យ"], ["Total", "សរុប"], ["Breakdown", "ការបែងចែក"], ["Range", "ចន្លោះ"],
  // --- Developer tools ---
  ["Cron expression", "កន្សោម Cron"], ["Repository", "ឃ្លាំងកូដ"], ["Branch (optional)", "សាខា (ជម្រើស)"],
  ["Token", "ថូខិន"], ["Header", "ក្បាល (Header)"], ["Payload", "ខ្លឹមសារ (Payload)"], ["Payload (JSON)", "ខ្លឹមសារ (JSON)"],
  ["Pattern", "លំនាំ"], ["Flags", "ទង់សម្គាល់ (Flags)"], ["Test text", "អត្ថបទសាកល្បង"],
  ["Unix timestamp (seconds)", "ត្រាពេលវេលា Unix (វិនាទី)"], ["Timestamp (seconds)", "ត្រាពេលវេលា (វិនាទី)"],
  ["Local time", "ពេលវេលាមូលដ្ឋាន"], ["How many", "ចំនួនប៉ុន្មាន"],
  // --- Geospatial ---
  ["Point A", "ចំណុច A"], ["Point B", "ចំណុច B"], ["Bearing", "ទិសដៅ"], ["Bearing (°)", "ទិសដៅ (°)"],
  ["Center latitude", "រយៈទទឹងចំណុចកណ្តាល"], ["Center longitude", "រយៈបណ្តោយចំណុចកណ្តាល"], ["Radius (km)", "កាំ (គ.ម)"],
  ["Messy input (one per line)", "ទិន្នន័យមិនរៀបរយ (មួយធាតុក្នុងមួយជួរ)"], ["Cleaned", "បានសម្អាត"],
  ["Start latitude", "រយៈទទឹងចាប់ផ្តើម"], ["Start longitude", "រយៈបណ្តោយចាប់ផ្តើម"], ["Distance (m)", "ចម្ងាយ (ម៉ែត្រ)"],
  ["Destination", "គោលដៅ"], ["Latitude (decimal)", "រយៈទទឹង (ទសភាគ)"], ["Longitude (decimal)", "រយៈបណ្តោយ (ទសភាគ)"],
  ["Latitude", "រយៈទទឹង"], ["Longitude", "រយៈបណ្តោយ"], ["Distance", "ចម្ងាយ"], ["Midpoint", "ចំណុចកណ្តាល"],
  ["Rise (elevation change, m)", "កម្ពស់ឡើង (ម៉ែត្រ)"], ["Run (horizontal distance, m)", "ចម្ងាយផ្តេក (ម៉ែត្រ)"], ["Grade", "កម្រិតជម្រាល"],
  ["Geohash to decode", "Geohash ដែលត្រូវឌិកូដ"], ["Decoded center", "ចំណុចកណ្តាលដែលបានឌិកូដ"],
  ["Scale — 1 : ___", "មាត្រដ្ឋាន — ១ ៖ ___"], ["Distance on map (cm)", "ចម្ងាយលើផែនទី (ស.ម)"], ["Ground distance", "ចម្ងាយពិតលើដី"],
  ["Vertices (lat,lng per line)", "កំពូល (រយៈទទឹង,រយៈបណ្តោយ ក្នុងមួយជួរ)"], ["Solve for", "រកតម្លៃ"],
  ["Speed", "ល្បឿន"], ["Hours", "ម៉ោង"], ["Minutes", "នាទី"],
  // --- Images ---
  ["Model quality", "គុណភាពម៉ូដែល"], ["Crop aspect", "សមាមាត្រកាត់រូប"], ["Embedded metadata", "ទិន្នន័យមេតាដែលភ្ជាប់មក"],
  ["Scale factor", "កត្តាពង្រីក"], ["Sharpening", "ភាពច្បាស់"], ["Watermark text", "អត្ថបទ Watermark"],
  ["PDF render scale", "មាត្រដ្ឋានបង្ហាញ PDF"], ["Image output format", "ទម្រង់រូបភាពលទ្ធផល"], ["Image resize", "ការប្តូរទំហំរូបភាព"],
  ["Compare original and compressed", "ប្រៀបធៀបរូបដើម និងរូបបានបង្រួម"], ["Page size", "ទំហំទំព័រ"], ["Margin (pt)", "រឹម (pt)"],
];

const KHMER_LABELS: Entry[] = [
  ["Province / Capital", "រាជធានី / ខេត្ត"], ["District", "ក្រុង / ស្រុក / ខណ្ឌ"], ["Commune / Sangkat", "ឃុំ / សង្កាត់"], ["Village", "ភូមិ"],
  ["Administrative code", "លេខកូដរដ្ឋបាល"], ["Gregorian year", "ឆ្នាំគ្រិស្តសករាជ"], ["Buddhist Era", "ពុទ្ធសករាជ"],
  ["Gregorian date", "កាលបរិច្ឆេទគ្រិស្តសករាជ"], ["Full Khmer date", "កាលបរិច្ឆេទខ្មែរពេញលេញ"],
  ["One item per line", "មួយធាតុក្នុងមួយជួរ"], ["Plain .sort() order (for comparison)", "លំដាប់ .sort() ធម្មតា (សម្រាប់ប្រៀបធៀប)"],
  ["Khmer consonants", "ព្យញ្ជនៈខ្មែរ"], ["Sample Khmer text", "អត្ថបទខ្មែរគំរូ"], ["Khmer text", "អត្ថបទខ្មែរ"],
  ["Text with ZWSP inserted (copy into your content)", "អត្ថបទដែលបានបញ្ចូល ZWSP (ចម្លងទៅប្រើ)"],
  ["Boundary preview (| = inserted ZWSP)", "មើលព្រំដែនពាក្យ (| = ZWSP ដែលបានបញ្ចូល)"], ["With ZWSP (copy this)", "មាន ZWSP (ចម្លងនេះ)"],
  ["Khmer formatted", "ទម្រង់ខ្មែរ"], ["Mixed text", "អត្ថបទលាយ"], ["Khmer digits → Arabic", "លេខខ្មែរ → លេខអារ៉ាប់"],
  ["Arabic digits → Khmer", "លេខអារ៉ាប់ → លេខខ្មែរ"], ["Plate prefix or institution", "បុព្វបទស្លាកលេខ ឬឈ្មោះស្ថាប័ន"],
  ["Plate prefix", "បុព្វបទស្លាកលេខ"], ["Plate value", "លេខស្លាក"], ["ID value", "លេខអត្តសញ្ញាណ"],
  ["Generated text", "អត្ថបទដែលបានបង្កើត"], ["Khmer lunar day (approximate)", "ថ្ងៃចន្ទគតិខ្មែរ (ប្រហាក់ប្រហែល)"],
  ["English", "អង់គ្លេស"], ["Institution category", "ប្រភេទស្ថាប័ន"], ["Gender", "ភេទ"], ["Plain list", "បញ្ជីធម្មតា"],
  ["Task", "កិច្ចការ"], ["Number", "លេខ"], ["Numbers", "លេខ"], ["Ordinals", "លេខលំដាប់"], ["Raw number", "លេខដើម"],
  ["Local", "ក្នុងស្រុក"], ["International", "អន្តរជាតិ"], ["Postal code or place", "លេខកូដប្រៃសណីយ៍ ឬឈ្មោះទីកន្លែង"],
  ["Register", "កម្រិតភាសា"], ["Person", "បុគ្គល"], ["Region", "តំបន់"], ["Amount", "ចំនួនទឹកប្រាក់"],
  ["Arabic numerals", "លេខអារ៉ាប់"], ["Khmer numerals", "លេខខ្មែរ"], ["Amount (KHR)", "ចំនួន (រៀល)"],
  ["Rate (KHR per USD)", "អត្រា (រៀល ក្នុង ១ ដុល្លារ)"], ["Approximate romanization", "អក្សរឡាតាំងប្រហាក់ប្រហែល"],
  ["Khmer title", "ចំណងជើងខ្មែរ"], ["Word separator", "សញ្ញាបំបែកពាក្យ"],
  ["Mixed slug (keeps existing Latin words as-is)", "Slug លាយ (រក្សាពាក្យឡាតាំងដើម)"], ["NFC normalized", "បានសម្អាតជាទម្រង់ NFC"],
  ["Khmer number words", "ពាក្យលេខខ្មែរ"], ["Year", "ឆ្នាំ"], ["Zodiac animal", "ឆ្នាំសត្វ"],
  ["Character total", "ផលបូកតួអក្សរ"], ["Reduced number", "លេខក្រោយបូកបង្រួម"],
  ["Life-path number", "លេខខ្សែជីវិត"], ["Traditional interpretation", "ការបកស្រាយតាមបែបប្រពៃណី"],
];

const MATH_LABELS: Entry[] = [
  ["Decimal", "គោលដប់"], ["Binary", "គោលពីរ"], ["Octal", "គោលប្រាំបី"], ["Hexadecimal", "គោលដប់ប្រាំមួយ"], ["Decimal value", "តម្លៃគោលដប់"],
  ["Bill amount", "ចំនួនវិក្កយបត្រ"], ["Tip %", "ភាគរយប្រាក់ធីប"], ["Number of people", "ចំនួនមនុស្ស"],
  ["Principal", "ប្រាក់ដើម"], ["Annual rate (%)", "អត្រាប្រចាំឆ្នាំ (%)"], ["Years", "ចំនួនឆ្នាំ"],
  ["Compounding frequency", "ភាពញឹកញាប់នៃការគិតការប្រាក់"], ["Contribution per period", "ការបញ្ចូលបន្ថែមក្នុងមួយវគ្គ"],
  ["Year-end balances", "សមតុល្យចុងឆ្នាំ"], ["Count (max 500)", "ចំនួន (អតិបរមា ៥០០)"], ["Sequence", "លំដាប់"],
  ["Display mode", "របៀបបង្ហាញ"], ["Matrix", "ម៉ាទ្រីស"], ["Determinant", "ដេតេមីណង់"], ["Prime factorization", "ការបំបែកកត្តាបឋម"],
  ["Discriminant", "ឌីស្គ្រីមីណង់"], ["Roots", "ឬស"], ["Min", "តូចបំផុត"], ["Max", "ធំបំផុត"], ["Simplified ratio", "សមាមាត្រសម្រួល"],
  ["Roman numeral", "លេខរ៉ូម៉ាំង"], ["Roman", "រ៉ូម៉ាំង"], ["Celsius (°C)", "សែលស្យុស (°C)"], ["Fahrenheit (°F)", "ហ្វារិនហៃ (°F)"],
  ["Kelvin (K)", "កែលវិន (K)"], ["Leg A", "ជ្រុង A"], ["Leg B", "ជ្រុង B"], ["Hypotenuse (C)", "អ៊ីប៉ូតេនុស (C)"],
  ["Angle opposite A / opposite B", "មុំទល់មុខ A / ទល់មុខ B"], ["From", "ពី"], ["To", "ទៅ"],
  // --- Math symbols & formulas ---
  ["Search symbols", "ស្វែងរកសញ្ញា"], ["All", "ទាំងអស់"], ["Arithmetic", "នព្វន្ត"], ["Comparison", "ការប្រៀបធៀប"], ["Algebra", "ពីជគណិត"],
  ["Calculus", "កាល់គូល"], ["Sets & Logic", "សំណុំ និងតក្កវិជ្ជា"], ["Greek", "អក្សរក្រិក"], ["Constants", "ថេរ"],
  ["Formula", "រូបមន្ត"], ["Area of a rectangle", "ផ្ទៃក្រឡាចតុកោណកែង"], ["Area of a triangle", "ផ្ទៃក្រឡាត្រីកោណ"], ["Area of a circle", "ផ្ទៃក្រឡារង្វង់"],
  ["Circumference of a circle", "បរិមាត្ររង្វង់"], ["Speed / distance / time", "ល្បឿន / ចម្ងាយ / ពេលវេលា"], ["Density", "ដង់ស៊ីតេ"], ["Ohm's law", "ច្បាប់អូម"],
  ["Force (Newton's 2nd law)", "កម្លាំង (ច្បាប់ទី២ ញូតុន)"], ["Percentage", "ភាគរយ"], ["Pythagorean theorem", "ទ្រឹស្តីបទពីតាហ្គោរ"], ["Simple interest", "ការប្រាក់សាមញ្ញ"],
  ["Volume of a sphere", "មាឌស៊្វែរ"], ["Volume of a cylinder", "មាឌស៊ីឡាំង"], ["Volume of a cone", "មាឌកោណ"],
  ["Area (m²)", "ផ្ទៃក្រឡា (ម²)"], ["Length (m)", "ប្រវែង (ម)"], ["Width (m)", "ទទឹង (ម)"], ["Base (m)", "គ្រឹះ (ម)"], ["Height (m)", "កម្ពស់ (ម)"], ["Radius (m)", "កាំ (ម)"],
  ["Circumference (m)", "បរិមាត្រ (ម)"], ["Speed (m/s)", "ល្បឿន (ម/វ)"], ["Distance (m)", "ចម្ងាយ (ម)"], ["Time (s)", "ពេលវេលា (វ)"], ["Density (kg/m³)", "ដង់ស៊ីតេ (គ.ក្រ/ម³)"],
  ["Mass (kg)", "ម៉ាស (គ.ក្រ)"], ["Volume (m³)", "មាឌ (ម³)"], ["Voltage (V)", "តង់ស្យុង (V)"], ["Current (A)", "ចរន្ត (A)"], ["Resistance (Ω)", "កម្លាំងទប់ (Ω)"],
  ["Force (N)", "កម្លាំង (N)"], ["Acceleration (m/s²)", "ល្បឿនប្រែប្រួល (ម/វ²)"], ["Percent (%)", "ភាគរយ (%)"], ["Part", "ចំណែក"], ["Whole", "ចំនួនសរុប"],
  ["Leg a (m)", "ជ្រុង a (ម)"], ["Leg b (m)", "ជ្រុង b (ម)"], ["Hypotenuse c (m)", "អ៊ីប៉ូតេនុស c (ម)"], ["Interest", "ការប្រាក់"], ["Rate (%)", "អត្រា (%)"], ["Time (years)", "ពេលវេលា (ឆ្នាំ)"],
  // --- Permutation & combination ---
  ["n (total items)", "n (ចំនួនធាតុសរុប)"], ["r (chosen items)", "r (ចំនួនធាតុដែលជ្រើសរើស)"],
  ["Permutations  P(n,r) = n! / (n−r)!", "ការរៀបលំដាប់  P(n,r) = n! / (n−r)!"], ["Combinations  C(n,r) = n! / (r!(n−r)!)", "ការបន្សំ  C(n,r) = n! / (r!(n−r)!)"],
  ["Factorial  n!", "ហ្វាក់តូរីយែល  n!"],
  // --- Complex numbers ---
  ["Operation", "ប្រតិបត្តិការ"], ["Addition (a + b)", "ការបូក (a + b)"], ["Subtraction (a − b)", "ការដក (a − b)"], ["Multiplication (a × b)", "ការគុណ (a × b)"], ["Division (a ÷ b)", "ការចែក (a ÷ b)"],
  ["z₁ real part (a)", "ផ្នែកពិត z₁ (a)"], ["z₁ imaginary part (b)", "ផ្នែកនិម្មិត z₁ (b)"], ["z₂ real part (c)", "ផ្នែកពិត z₂ (c)"], ["z₂ imaginary part (d)", "ផ្នែកនិម្មិត z₂ (d)"],
  ["Modulus |z|", "ម៉ូឌុល |z|"], ["Argument (rad)", "អាគុយម៉ង់ (រ៉ាដ្យង់)"], ["Argument (°)", "អាគុយម៉ង់ (°)"], ["Conjugate", "កុងជូហ្គេត"],
  // --- Geometry ---
  ["Shape", "រាង"], ["2D shapes", "រាង 2D"], ["3D shapes", "រាង 3D"], ["Circle", "រង្វង់"], ["Rectangle", "ចតុកោណកែង"], ["Triangle", "ត្រីកោណ"],
  ["Sphere", "ស៊្វែរ"], ["Cube", "គូប"], ["Cylinder", "ស៊ីឡាំង"], ["Cone", "កោណ"], ["Rectangular prism", "ព្រីសចតុកោណ"],
  ["Radius (r)", "កាំ (r)"], ["Length (l)", "ប្រវែង (l)"], ["Width (w)", "ទទឹង (w)"], ["Base (b)", "គ្រឹះ (b)"], ["Height (h)", "កម្ពស់ (h)"], ["Side (a)", "ជ្រុង (a)"],
  ["Area", "ផ្ទៃក្រឡា"], ["Circumference", "បរិមាត្រ"], ["Perimeter", "បរិមាត្រ"], ["Volume", "មាឌ"], ["Surface area", "ផ្ទៃប្រអប់"],
  // --- Exponent & logarithm ---
  ["Result (c)", "លទ្ធផល (c)"], ["Base (a)", "គ្រឹះ (a)"], ["Exponent (b)", "ស្វ័យគុណ (b)"], ["Argument (x)", "អាគុយម៉ង់ (x)"], ["logₐ(x)", "logₐ(x)"],
  // --- Trig ---
  ["Degrees (°)", "ដឺក្រេ (°)"], ["Radians", "រ៉ាដ្យង់"],
  // --- Electronics ---
  ["Band 1", "ខ្សែទី ១"], ["Band 2", "ខ្សែទី ២"], ["Multiplier", "មេគុណគុណ"], ["Tolerance", "ភាពអត់ឱន"], ["Resistance", "រេស៊ីស្ទ័រ"],
  ["Resistance (e.g. 4700, 4.7k, 1M)", "រេស៊ីស្ទ័រ (ឧ. 4700, 4.7k, 1M)"],
  ["Supply voltage (V)", "តង់ស្យុងផ្គត់ផ្គង់ (V)"], ["LED forward voltage (V)", "តង់ស្យុង LED (V)"], ["LED current (mA)", "ចរន្ត LED (mA)"],
  ["Calculated resistor", "រេស៊ីស្ទ័រដែលបានគណនា"], ["Nearest standard (E24)", "តម្លៃស្តង់ដារជិតបំផុត (E24)"], ["Power dissipated", "ថាមពលបាត់បង់"],
  ["Input voltage (V)", "តង់ស្យុងបញ្ចូល (V)"], ["R1 (Ω)", "R1 (Ω)"], ["R2 (Ω)", "R2 (Ω)"], ["Output voltage", "តង់ស្យុងលទ្ធផល"],
  ["Current", "ចរន្ត"], ["Power (W)", "ថាមពល (W)"],
  ["Black", "ខ្មៅ"], ["Brown", "ត្នោត"], ["Red", "ក្រហម"], ["Orange", "ទឹកក្រូច"], ["Yellow", "លឿង"], ["Green", "បៃតង"],
  ["Blue", "ខៀវ"], ["Violet", "ស្វាយ"], ["Grey", "ប្រផេះ"], ["White", "ស"], ["Gold", "មាស"], ["Silver", "ប្រាក់"],
  // --- Fitness (1RM) ---
  ["Weight lifted", "ទម្ងន់ដែលលើក"], ["Reps", "ចំនួនដង"], ["Average 1RM", "មធ្យម 1RM"], ["Weight", "ទម្ងន់"],
  // --- Matrix ---
  ["Matrix size", "ទំហំម៉ាទ្រីស"], ["Matrix A", "ម៉ាទ្រីស A"], ["Matrix B", "ម៉ាទ្រីស B"],
  ["Add (A + B)", "បូក (A + B)"], ["Subtract (A − B)", "ដក (A − B)"], ["Multiply (A × B)", "គុណ (A × B)"],
  ["Transpose (Aᵀ)", "ប្តូរជួរឈរ (Aᵀ)"], ["Determinant (det A)", "ដេតេមីណង់ (det A)"], ["Inverse (A⁻¹)", "អ៊ីនវ៉េស (A⁻¹)"],
  ["2×2", "2×2"], ["3×3", "3×3"],
  // --- Phone network ---
  ["Operator", "ប្រតិបត្តិករ"], ["Type", "ប្រភេទ"], ["Max price ($)", "តម្លៃអតិបរមា ($)"], ["Weekly", "ប្រចាំសប្តាហ៍"],
  // --- Vector / palette / barcode / inflation / svg ---
  ["Dimension", "វិមាត្រ"], ["Vector A", "វ៉ិចទ័រ A"], ["Vector B", "វ៉ិចទ័រ B"],
  ["Magnitude |A|", "ម៉ាហ្គីនីទុយត |A|"], ["Magnitude |B|", "ម៉ាហ្គីនីទុយត |B|"], ["Dot product (A·B)", "គុណចំណុច (A·B)"],
  ["Cross product (A×B)", "គុណវ៉ិចទ័រ (A×B)"], ["Angle between (°)", "មុំរវាង (°)"], ["Projection of A onto B", "ការព្យាករ A លើ B"],
  ["A + B", "A + B"], ["A − B", "A − B"],
  ["Number of colors", "ចំនួនពណ៌"], ["Barcode type", "ប្រភេទបារកូដ"],
  ["Amount", "ចំនួនទឹកប្រាក់"], ["Start year", "ឆ្នាំចាប់ផ្តើម"], ["End year", "ឆ្នាំបញ្ចប់"],
  ["Annual inflation rate (%)", "អត្រាអតិផរណាប្រចាំឆ្នាំ (%)"], ["Equivalent value", "តម្លៃសមមូល"], ["Total inflation over period", "អតិផរណាសរុបក្នុងរយៈពេល"],
  ["SVG markup", "កូដ SVG"],
];

const NET_SEC_LABELS: Entry[] = [
  ["IPv4 address", "អាសយដ្ឋាន IPv4"], ["IPv6 address", "អាសយដ្ឋាន IPv6"], ["MAC address", "អាសយដ្ឋាន MAC"],
  ["Class", "ថ្នាក់"], ["Scope", "វិសាលភាព"], ["Expanded", "ទម្រង់ពេញ"], ["Compressed", "ទម្រង់បង្រួម"], ["Addresses", "អាសយដ្ឋាន"],
  ["Query parameters", "ប៉ារ៉ាម៉ែត្រ Query"], ["User-Agent string", "ខ្សែអក្សរ User-Agent"], ["Browser", "កម្មវិធីរុករក"],
  ["Operating system", "ប្រព័ន្ធប្រតិបត្តិការ"], ["Device", "ឧបករណ៍"],
  ["Network name (SSID)", "ឈ្មោះបណ្តាញ (SSID)"], ["Security", "សុវត្ថិភាព"], ["Password", "ពាក្យសម្ងាត់"],
  ["Full name", "ឈ្មោះពេញ"], ["Organization", "អង្គភាព"], ["Phone", "ទូរសព្ទ"], ["Email", "អ៊ីមែល"],
  ["Subject", "ប្រធានបទ"], ["Body", "ខ្លឹមសារសារ"], ["To (phone number)", "ផ្ញើទៅ (លេខទូរសព្ទ)"], ["Message", "សារ"],
  ["Phone number", "លេខទូរសព្ទ"], ["Error correction", "កម្រិតកែកំហុស"], ["Decoded content", "ខ្លឹមសារដែលបានឌិកូដ"],
  ["Card number", "លេខប័ណ្ណ"], ["Visible digits", "ចំនួនខ្ទង់ដែលបង្ហាញ"], ["Mask character", "តួអក្សរបិទបាំង"], ["Masked", "បានបិទបាំង"],
  ["Secret", "សោសម្ងាត់"], ["Signed JWT", "JWT ដែលបានចុះហត្ថលេខា"], ["Word count", "ចំនួនពាក្យ"], ["Passphrases", "ឃ្លាសម្ងាត់"],
  ["Length", "ប្រវែង"], ["Byte length", "ប្រវែងជាបៃ"], ["Encoding", "ការអ៊ិនកូដ"], ["Digits", "ចំនួនខ្ទង់"], ["Shift", "ការរំកិល"],
  ["Name", "ឈ្មោះ"], ["Key", "សោ"], ["Phrase", "ឃ្លា"],
];

const TEXT_TIME_LABELS: Entry[] = [
  ["Acronym", "ពាក្យកាត់"], ["Phrase A", "ឃ្លា A"], ["Phrase B", "ឃ្លា B"], ["Sorted letters (A / B)", "អក្សរដែលបានតម្រៀប (A / B)"],
  ["Find", "ស្វែងរក"], ["Replace with", "ជំនួសដោយ"], ["Zero-pad width", "ចំនួនខ្ទង់បំពេញសូន្យ"], ["Numbered text", "អត្ថបទមានលេខរៀង"],
  ["Lines", "បន្ទាត់"], ["Sort by", "តម្រៀបតាម"], ["Order", "លំដាប់"], ["Sorted", "បានតម្រៀប"],
  ["Topic / subject", "ប្រធានបទ"], ["Sentences", "ចំនួនប្រយោគ"], ["Draft paragraph", "កថាខណ្ឌព្រាង"],
  ["Delimited text", "អត្ថបទមានសញ្ញាបំបែក"], ["Delimiter", "សញ្ញាបំបែក"], ["Separator", "សញ្ញាបំបែក"],
  ["Column # (1-based)", "លេខជួរឈរ (ចាប់ពី ១)"], ["Extracted column", "ជួរឈរដែលបានដកស្រង់"], ["Reversed", "បានបញ្ច្រាស"],
  ["Max length", "ប្រវែងអតិបរមា"], ["Suffix", "បច្ច័យ"], ["Prefix", "បុព្វបទ"], ["Title Case", "អក្សរធំតាមចំណងជើង"],
  ["Currency name", "ឈ្មោះរូបិយប័ណ្ណ"], ["In words", "ជាពាក្យ"], ["Year / tag", "ឆ្នាំ / ស្លាក"], ["Start at", "ចាប់ផ្តើមពី"],
  ["Zero-pad digits", "បំពេញលេខសូន្យ"], ["Generated numbers", "លេខដែលបានបង្កើត"], ["Delete entry", "លុបធាតុ"], ["Remove line", "លុបបន្ទាត់"],
  ["Date of birth", "ថ្ងៃកំណើត"], ["Age", "អាយុ"], ["Total days lived", "ចំនួនថ្ងៃរស់នៅសរុប"], ["Month", "ខែ"], ["Date", "កាលបរិច្ឆេទ"],
  ["Target date & time", "កាលបរិច្ឆេទ និងពេលគោលដៅ"], ["Time remaining", "ពេលវេលានៅសល់"],
  ["Start date", "កាលបរិច្ឆេទចាប់ផ្តើម"], ["End date", "កាលបរិច្ឆេទបញ្ចប់"],
  ["Difference (days)", "គម្លាត (ថ្ងៃ)"], ["Difference (weeks)", "គម្លាត (សប្តាហ៍)"], ["Difference (years)", "គម្លាត (ឆ្នាំ)"],
  ["Phase", "ដំណាក់កាល"], ["Illumination", "កម្រិតបំភ្លឺ"], ["Work minutes", "នាទីធ្វើការ"], ["Break minutes", "នាទីសម្រាក"],
  ["Date & time", "កាលបរិច្ឆេទ និងពេលវេលា"], ["Relative", "ធៀបនឹងពេលបច្ចុប្បន្ន"], ["Start time", "ពេលចាប់ផ្តើម"], ["End time", "ពេលបញ្ចប់"],
  ["Unpaid break (minutes)", "ពេលសម្រាកគ្មានប្រាក់ (នាទី)"], ["Laps", "ជុំ"], ["ISO week", "សប្តាហ៍ ISO"], ["Business days", "ថ្ងៃធ្វើការ"],
];

const HINTS: Entry[] = [
  ["owner/name", "owner/name"], ["1–50", "១–៥០"], ["1–20", "១–២០"], ["3–8", "៣–៨"],
  ["View source / inspect on any page and paste the relevant markup", "សូមមើលកូដដើមរបស់ទំព័រ ហើយបិទភ្ជាប់កូដដែលពាក់ព័ន្ធ"],
  ["fp16 is a good balance of speed and accuracy", "fp16 មានតុល្យភាពល្អរវាងល្បឿន និងភាពត្រឹមត្រូវ"],
  ["or drag on the image below", "ឬអូសនៅលើរូបភាពខាងក្រោម"],
  ["2 / 4 / 6 / 8 digits", "២ / ៤ / ៦ / ៨ ខ្ទង់"],
  ["e.g. -1234.56", "ឧទាហរណ៍៖ -1234.56"],
  ["comma or newline separated", "បំបែកដោយសញ្ញាក្បៀស ឬបន្ទាត់ថ្មី"],
  ["Added each compounding period", "បន្ថែមរាល់វគ្គគិតការប្រាក់"],
  ["Standard LaTeX math syntax", "វាក្យសម្ព័ន្ធគណិត LaTeX ស្តង់ដារ"],
  ["rows on separate lines", "ជួរដេកនីមួយៗនៅលើបន្ទាត់ដោយឡែក"],
  ["Accepts full or already-compressed form", "អាចបញ្ចូលទម្រង់ពេញ ឬទម្រង់បង្រួមរួច"],
  ["fills the {topic} placeholder", "បំពេញក្នុងកន្លែង {topic}"],
];

const PLACEHOLDERS: Entry[] = [
  ["Search English or Khmer...", "ស្វែងរកជាភាសាអង់គ្លេស ឬខ្មែរ…"],
  ["English or Khmer term…", "ពាក្យជាភាសាអង់គ្លេស ឬខ្មែរ…"],
  ["Search English, French, or Khmer...", "ស្វែងរកជាភាសាអង់គ្លេស បារាំង ឬខ្មែរ…"],
  ["Project name, author, keyword…", "ឈ្មោះគម្រោង អ្នកបង្កើត ឬពាក្យគន្លឹះ…"],
  ["Model name, author, keyword…", "ឈ្មោះម៉ូដែល អ្នកបង្កើត ឬពាក្យគន្លឹះ…"],
  ["km, latin, or note…", "ខ្មែរ ឡាតាំង ឬកំណត់ចំណាំ…"],
  ["Province or capital name…", "ឈ្មោះរាជធានី ឬខេត្ត…"],
  ["Search by name or usage…", "ស្វែងរកតាមឈ្មោះ ឬការប្រើប្រាស់…"],
  ["Coffee, rent, taxi…", "កាហ្វេ ថ្លៃជួល តាក់ស៊ី…"],
  ["e.g. mail, mx, ipv6", "ឧទាហរណ៍៖ mail, mx, ipv6"],
  ["e.g. 404 or not found", "ឧទាហរណ៍៖ 404 ឬ not found"],
  ["e.g. png or application/json", "ឧទាហរណ៍៖ png ឬ application/json"],
  ["e.g. the Q3 budget review", "ឧទាហរណ៍៖ ការពិនិត្យថវិកាត្រីមាសទី ៣"],
  ["-90 to 90", "-៩០ ដល់ ៩០"], ["-180 to 180", "-១៨០ ដល់ ១៨០"],
];

const OPTIONS: Entry[] = [
  ["Left", "ឆ្វេង"], ["Center", "កណ្តាល"], ["2 spaces", "២ ចន្លោះ"], ["4 spaces", "៤ ចន្លោះ"], ["Minified", "បង្រួមតូច"],
  ["Paragraphs", "កថាខណ្ឌ"], ["Sentences", "ប្រយោគ"], ["Plain text", "អត្ថបទធម្មតា"], ["Markdown-ish", "បែប Markdown"],
  ["Escape (raw → literal)", "Escape (ដើម → អក្សរតាមព្យញ្ជនៈ)"], ["Unescape (literal → raw)", "Unescape (អក្សរតាមព្យញ្ជនៈ → ដើម)"],
  ["Time", "ពេលវេលា"], ["Distance", "ចម្ងាយ"], ["Speed", "ល្បឿន"], ["km", "គ.ម"], ["miles", "ម៉ាយល៍"], ["km/h", "គ.ម/ម៉ោង"], ["mph", "ម៉ាយល៍/ម៉ោង"],
  ["Balanced (recommended)", "មានតុល្យភាព (ណែនាំ)"], ["Highest quality (slower, larger download)", "គុណភាពខ្ពស់បំផុត (យឺត និងទាញយកធំ)"],
  ["Fastest (lower quality)", "លឿនបំផុត (គុណភាពទាប)"], ["Free", "សេរី"], ["Square 1:1", "ការ៉េ ១:១"],
  ["JPEG", "JPEG"], ["WebP", "WebP"], ["PNG (lossless)", "PNG (គ្មានបាត់បង់គុណភាព)"], ["PNG", "PNG"],
  ["Bottom right", "ខាងក្រោមស្តាំ"], ["Bottom left", "ខាងក្រោមឆ្វេង"], ["Top right", "ខាងលើស្តាំ"], ["Top left", "ខាងលើឆ្វេង"],
  ["Tiled diagonal", "ដាក់ជាឆ្នូតទ្រេត"], ["Custom (drag)", "កំណត់ដោយខ្លួនឯង (អូស)"],
  ["A → Z", "ក → អ"], ["Z → A", "អ → ក"],
  ["overflow-wrap: anywhere (recommended)", "overflow-wrap: anywhere (ណែនាំ)"], ["word-break: break-all", "word-break: break-all"],
  ["Insert zero-width spaces (ZWSP)", "បញ្ចូលចន្លោះគ្មានទទឹង (ZWSP)"],
  ["Any", "ទាំងអស់"], ["Male", "ប្រុស"], ["Female", "ស្រី"], ["Hyphen (-)", "សញ្ញាដក (-)"], ["Underscore (_)", "សញ្ញាបន្ទាត់ក្រោម (_)"],
  ["Annually", "ប្រចាំឆ្នាំ"], ["Semi-annually", "ប្រចាំឆមាស"], ["Quarterly", "ប្រចាំត្រីមាស"], ["Monthly", "ប្រចាំខែ"], ["Daily", "ប្រចាំថ្ងៃ"],
  ["Block (centered, larger)", "ប្លុក (កណ្តាល និងធំ)"], ["Inline", "ក្នុងបន្ទាត់"],
  ["A% of B", "A ភាគរយនៃ B"], ["A is what % of B", "A ស្មើនឹងប៉ុន្មានភាគរយនៃ B"], ["% change from A to B", "ភាគរយប្រែប្រួលពី A ទៅ B"],
  ["Encode", "អ៊ិនកូដ"], ["Decode", "ឌិកូដ"], ["Encrypt", "អ៊ិនគ្រីប"], ["Decrypt", "ឌិគ្រីប"],
  ["Colon (00:1A:2B:3C:4D:5E)", "សញ្ញាចុចពីរ (00:1A:2B:3C:4D:5E)"], ["Hyphen (00-1A-2B-3C-4D-5E)", "សញ្ញាដក (00-1A-2B-3C-4D-5E)"],
  ["Cisco dot (001A.2B3C.4D5E)", "ទម្រង់ចុច Cisco (001A.2B3C.4D5E)"], ["Plain (001A2B3C4D5E)", "ធម្មតា (001A2B3C4D5E)"],
  ["169.254.0.0/16 (link-local)", "169.254.0.0/16 (link-local)"],
  ["Cheque style (…and 45/100)", "បែបមូលប្បទានប័ត្រ (…និង 45/100)"], ["Prose (…and 45 cents)", "បែបអត្ថបទ (…និង ៤៥ សេន)"],
  ["Keep original", "រក្សាដើម"], ["WebP (smallest)", "WebP (តូចបំផុត)"], ["No resize", "មិនប្តូរទំហំ"],
  ["Max 1920px", "អតិបរមា 1920px"], ["Max 1280px", "អតិបរមា 1280px"], ["Max 1024px", "អតិបរមា 1024px"], ["Max 800px", "អតិបរមា 800px"],
  ["Fit each image", "សម្រួលតាមរូបភាពនីមួយៗ"], ["A4", "A4"], ["US Letter", "US Letter"],
  ["Diagonal, centered", "ទ្រេត និងកណ្តាល"], ["Horizontal, centered", "ផ្តេក និងកណ្តាល"], ["Bottom right corner", "ជ្រុងខាងក្រោមស្តាំ"],
  ["URL / Plain text", "URL / អត្ថបទធម្មតា"], ["Wi-Fi network", "បណ្តាញ Wi-Fi"], ["Contact card (vCard)", "កាតទំនាក់ទំនង (vCard)"],
  ["Email", "អ៊ីមែល"], ["SMS", "សារ SMS"], ["Phone number", "លេខទូរសព្ទ"],
  ["WPA / WPA2", "WPA / WPA2"], ["WEP", "WEP"], ["Open (no password)", "បើកចំហ (គ្មានពាក្យសម្ងាត់)"],
  ["Low (7%)", "ទាប (៧%)"], ["Medium (15%)", "មធ្យម (១៥%)"], ["Quartile (25%)", "មួយភាគបួន (២៥%)"], ["High (30%)", "ខ្ពស់ (៣០%)"],
  ["• dot", "• ចុច"], ["* asterisk", "* ផ្កាយ"], ["X letter", "អក្សរ X"], ["Period (.)", "សញ្ញាចុច (.)"], ["Space", "ចន្លោះ"], ["None", "គ្មាន"],
  ["Hex", "Hex"], ["Base64", "Base64"],
  ["Alphabetical", "តាមអក្ខរក្រម"], ["Numeric", "តាមលេខ"], ["Length", "តាមប្រវែង"], ["Ascending", "តាមលំដាប់ឡើង"], ["Descending", "តាមលំដាប់ចុះ"],
  ["Formal", "ផ្លូវការ"], ["Friendly", "រាក់ទាក់"], ["Direct / concise", "ត្រង់ និងខ្លី"],
  ["Characters", "តួអក្សរ"], ["Words", "ពាក្យ"], ["Lines", "បន្ទាត់"],
  ["Text → Binary", "អត្ថបទ → គោលពីរ"], ["Binary → Text", "គោលពីរ → អត្ថបទ"], ["Text → Morse", "អត្ថបទ → កូដ Morse"], ["Morse → Text", "កូដ Morse → អត្ថបទ"],
  ["Trim each line", "កាត់ចន្លោះចុងបន្ទាត់"], ["Collapse extra spaces", "បង្រួមចន្លោះលើស"], ["Remove blank lines", "លុបបន្ទាត់ទំនេរ"],
  ["High", "ខ្ពស់"], ["Medium", "មធ្យម"], ["Low (smaller file)", "ទាប (ឯកសារតូច)"],
];

const BUTTONS: Entry[] = [
  ["Generate", "បង្កើត"], ["Copy", "ចម្លង"], ["Download", "ទាញយក"], ["Download PNG", "ទាញយក PNG"], ["Reset", "កំណត់ឡើងវិញ"],
  ["Clear", "សម្អាត"], ["Add", "បន្ថែម"], ["Apply", "អនុវត្ត"], ["Convert", "បម្លែង"], ["Calculate", "គណនា"], ["Start", "ចាប់ផ្តើម"],
  ["Stop", "បញ្ឈប់"], ["Pause", "ផ្អាក"], ["Resume", "បន្ត"], ["Undo", "មិនធ្វើវិញ"], ["Export CSV", "នាំចេញ CSV"],
  ["Remove background", "លុបផ្ទៃខាងក្រោយ"], ["Resize & Compress", "ប្តូរទំហំ និងបង្រួម"], ["Upscale", "ពង្រីក"],
  ["Apply & Export", "អនុវត្ត និងនាំចេញ"], ["Remove mark", "លុបសញ្ញា"], ["Processing…", "កំពុងដំណើរការ…"],
  ["Loading…", "កំពុងផ្ទុក…"], ["Select…", "សូមជ្រើសរើស…"],
];

const ENTRIES: Entry[] = [
  ...LABELS, ...KHMER_LABELS, ...MATH_LABELS, ...NET_SEC_LABELS, ...TEXT_TIME_LABELS,
  ...HINTS, ...PLACEHOLDERS, ...OPTIONS, ...BUTTONS,
];

const EXACT = new Map<string, string>();
const LOWER = new Map<string, string>();
for (const [en, km] of ENTRIES) {
  if (!EXACT.has(en)) EXACT.set(en, km);
  const lower = en.toLowerCase();
  if (!LOWER.has(lower)) LOWER.set(lower, km);
}

/** Khmer form of a shared UI string, or undefined when untranslated. */
export function uiKm(value: string): string | undefined {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (!trimmed) return undefined;
  return EXACT.get(trimmed) ?? LOWER.get(trimmed.toLowerCase());
}
