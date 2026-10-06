import type { AuditResult, Category, CheckResult } from "./types";

const CATEGORIES: Category[] = ["technical", "onpage", "performance", "accessibility"];
const CATEGORY_WEIGHTS: Record<Category, number> = { technical: 0.3, onpage: 0.3, performance: 0.2, accessibility: 0.2 };

export function scoreChecks(checks: CheckResult[]): Record<Category, number> {
  return Object.fromEntries(CATEGORIES.map((category) => {
    const selected = checks.filter((check) => check.category === category);
    const totalWeight = selected.reduce((sum, item) => sum + item.weight, 0);
    const score = totalWeight ? Math.round(selected.reduce((sum, item) => sum + item.score * item.weight, 0) / totalWeight * 100) : 0;
    return [category, score];
  })) as Record<Category, number>;
}

export function overallScore(categoryScores: Record<Category, number>): number {
  return Math.round(CATEGORIES.reduce((sum, category) => sum + categoryScores[category] * CATEGORY_WEIGHTS[category], 0));
}

export function summarize(checks: CheckResult[]): AuditResult["summary"] {
  return checks.reduce((summary, check) => { summary[check.status] += 1; return summary; }, { pass: 0, warning: 0, fail: 0 });
}
