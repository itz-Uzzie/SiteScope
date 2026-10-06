import type { AuditResult, CheckResult } from "../audit/types";

const templates: Record<string, (check: CheckResult) => string> = {
  "image-alt": (check) => `${check.message} Alt text helps screen readers and gives search engines useful context about images. ${check.recommendation}`,
  "meta-description": (check) => `${check.message} A short search-result summary can help people decide whether to visit. ${check.recommendation}`,
  title: (check) => `${check.message} The page title tells people and search engines what the page is about. ${check.recommendation}`,
  h1: (check) => `${check.message} A clear main heading helps visitors understand the page quickly. ${check.recommendation}`,
  "broken-links": (check) => `${check.message} Broken links frustrate visitors and make it harder to explore your site. ${check.recommendation}`,
  "response-time": (check) => `${check.message} Faster pages are easier to use, especially on mobile connections. ${check.recommendation}`,
};

export function explainWithRules(audit: Pick<AuditResult, "overallScore" | "checks">): string {
  const label = audit.overallScore >= 90 ? "excellent shape" : audit.overallScore >= 70 ? "in good shape" : audit.overallScore >= 50 ? "has a few areas to improve" : "needs some attention";
  const issues = audit.checks.filter((check) => check.status !== "pass").sort((a, b) => (a.status === "fail" ? 0 : 1) - (b.status === "fail" ? 0 : 1) || b.weight - a.weight).slice(0, 5);
  const lines = issues.map((check) => `• ${templates[check.id]?.(check) ?? `${check.message} ${check.recommendation ?? "Review this item and make an appropriate improvement."}`}`);
  if (!lines.length) return `Your website is in excellent shape, with an overall score of ${audit.overallScore}/100. Keep publishing useful content and check the site regularly for changes.`;
  return `Your website is ${label} with an overall score of ${audit.overallScore}/100.\n\n${lines.join("\n\n")}\n\nStart with the first high-impact fix, then run another audit to see how the score changes.`;
}
