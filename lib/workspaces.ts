export interface WorkspaceProfile {
  id: string;
  recentCalculations: string[];
  favoriteToolIds: string[];
  preferredUnits: Record<string, string>;
  shortcuts: string[];
}

// Each workspace's `keywords` are the tool IDs shown when that workspace is
// active (the homepage filters the grid to exactly these). Keep them accurate
// to the workspace's theme and to real tool IDs in lib/tools.tsx.
export const WORKSPACES = [
  { id: "finance", label: "Finance", khmer: "ហិរញ្ញវត្ថុ", keywords: ["percentage-calculator", "riel-usd", "business-calculators", "vat-calculator", "currency-to-words", "loan-amortization", "payslip-generator", "salary-calculator", "nssf-payroll-calculator", "cambodia-tax", "invoice-generator", "npv-irr-calculator", "break-even-calculator", "gold-price-calculator", "inflation-calculator", "late-fee-calculator"] },
  { id: "engineering", label: "Engineering", khmer: "វិស្វកម្ម", keywords: ["unit-converter", "universal-math-workspace", "haversine", "angle-converter", "base-converter", "bitwise-calculator", "speed-distance-time"] },
  { id: "construction", label: "Construction", khmer: "សំណង់", keywords: ["business-calculators", "calculation-notebook", "unit-converter", "bid-timeline-calculator", "concrete-calculator", "rebar-calculator", "tile-calculator", "solar-calculator", "generator-sizing"] },
  { id: "education", label: "Education", khmer: "ការអប់រំ", keywords: ["percentage-calculator", "universal-math-workspace", "quadratic-solver", "khmer-lexicon", "terminology-translator", "pangram-generator", "coeng-tada-corrector", "khmer-punctuation-restorer", "khmer-practice-sheets", "khmer-glyph-picker", "number-spellout", "khmer-cloze-generator", "khmer-word-search"] },
  { id: "travel", label: "Travel", khmer: "ទេសចរណ៍", keywords: ["cambodia-weather", "riel-usd", "unit-converter", "airport-lookup", "flight-route-planner", "timezone-converter", "world-clock", "plus-code-converter", "speed-distance-time"] },
  { id: "health", label: "Health", khmer: "សុខភាព", keywords: ["age-calculator", "bmi-calculator", "bmr-calculator", "body-fat-calculator", "blood-pressure-log"] },
] as const;

export const DEFAULT_WORKSPACE_PROFILES: WorkspaceProfile[] = WORKSPACES.map((workspace) => ({
  id: workspace.id,
  recentCalculations: [],
  favoriteToolIds: [],
  preferredUnits: {},
  shortcuts: [...workspace.keywords],
}));
