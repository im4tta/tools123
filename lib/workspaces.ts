export interface WorkspaceProfile {
  id: string;
  recentCalculations: string[];
  favoriteToolIds: string[];
  preferredUnits: Record<string, string>;
  shortcuts: string[];
}

export const WORKSPACES = [
  { id: "finance", label: "Finance", khmer: "ហិរញ្ញវត្ថុ", keywords: ["percentage-calculator", "riel-usd", "business-calculators"] },
  { id: "engineering", label: "Engineering", khmer: "វិស្វកម្ម", keywords: ["unit-converter", "universal-math-workspace", "haversine"] },
  { id: "construction", label: "Construction", khmer: "សំណង់", keywords: ["business-calculators", "calculation-notebook", "unit-converter", "bid-timeline-calculator"] },
  { id: "education", label: "Education", khmer: "ការអប់រំ", keywords: ["percentage-calculator", "universal-math-workspace", "khmer-lexicon", "terminology-translator"] },
  { id: "travel", label: "Travel", khmer: "ទេសចរណ៍", keywords: ["cambodia-weather", "riel-usd", "distance-converter"] },
  { id: "health", label: "Health", khmer: "សុខភាព", keywords: ["age-calculator", "universal-math-workspace"] },
] as const;

export const DEFAULT_WORKSPACE_PROFILES: WorkspaceProfile[] = WORKSPACES.map((workspace) => ({
  id: workspace.id,
  recentCalculations: [],
  favoriteToolIds: [],
  preferredUnits: {},
  shortcuts: [...workspace.keywords],
}));
