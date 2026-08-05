export interface ToolRecommendation {
  id: string;
  reason: string;
  reasonKm?: string;
}

const RECOMMENDATIONS: Record<string, ToolRecommendation[]> = {
  "percentage-calculator": [
    { id: "ratio-simplifier", reason: "Simplify the resulting ratio" },
    { id: "universal-math-workspace", reason: "Continue with related calculations" },
  ],
  "universal-math-workspace": [
    { id: "percentage-calculator", reason: "Explore percentage breakdowns" },
    { id: "unit-converter", reason: "Convert compatible units" },
  ],
  "cambodia-fuel-prices": [{ id: "riel-usd", reason: "Convert fuel costs to another currency" }],
  "riel-usd": [{ id: "cambodia-fuel-prices", reason: "Check current local fuel prices" }],
  "cambodia-weather": [{ id: "cambodia-environment", reason: "View weather, UV, and air quality together" }],
};

export function recommendationsFor(toolId: string): ToolRecommendation[] {
  return RECOMMENDATIONS[toolId] ?? [];
}
