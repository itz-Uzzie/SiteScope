import type { AuditResult, CheckResult } from "./types";

const checks: CheckResult[] = [
  { id: "https", category: "technical", title: "HTTPS", status: "pass", severity: "high", score: 1, weight: 3, message: "Page is served securely over HTTPS.", recommendation: "Keep HTTPS enabled." },
  { id: "robots-txt", category: "technical", title: "Robots.txt", status: "pass", severity: "medium", score: 1, weight: 2, message: "A robots.txt file is available.", recommendation: "Review crawl rules when adding sections." },
  { id: "sitemap", category: "technical", title: "XML sitemap", status: "warning", severity: "medium", score: 0.5, weight: 2, message: "No sitemap was found.", recommendation: "Publish an XML sitemap." },
  { id: "broken-links", category: "technical", title: "Link health", status: "warning", severity: "medium", score: 0.96, weight: 2, message: "1 of 30 checked links could not be reached.", recommendation: "Update or remove links that lead to missing pages. Only up to 30 links are checked to keep results fast.", details: { issues: [{ url: "https://example.com/old-guide", status: "404", foundOn: "https://example.com", internal: true }], checked: 30, skipped: 4 } },
  { id: "title", category: "onpage", title: "Page title", status: "pass", severity: "high", score: 1, weight: 3, message: "Title is 48 characters long.", recommendation: "Keep the title descriptive." },
  { id: "meta-description", category: "onpage", title: "Meta description", status: "warning", severity: "high", score: 0.5, weight: 3, message: "Description is 184 characters long.", recommendation: "Trim to 70–160 characters." },
  { id: "h1", category: "onpage", title: "Main heading", status: "pass", severity: "high", score: 1, weight: 3, message: "Exactly one H1 heading was found.", recommendation: "Keep one clear main heading." },
  { id: "heading-structure", category: "onpage", title: "Heading structure", status: "warning", severity: "medium", score: 0.5, weight: 2, message: "Heading levels are skipped.", recommendation: "Keep heading levels in order." },
  { id: "response-time", category: "performance", title: "Response time", status: "pass", severity: "medium", score: 1, weight: 2, message: "The HTML response took 420 ms.", recommendation: "Keep server response time low." },
  { id: "compression", category: "performance", title: "Response compression", status: "pass", severity: "low", score: 1, weight: 1, message: "The response uses br compression.", recommendation: "Keep compression enabled." },
  { id: "image-alt", category: "accessibility", title: "Image alternative text", status: "warning", severity: "high", score: 0.5, weight: 3, message: "2 images don't have ALT text.", recommendation: "Add useful alt text to informative images." },
  { id: "html-lang", category: "accessibility", title: "Page language", status: "pass", severity: "low", score: 1, weight: 1, message: "The page language is set to en.", recommendation: "Keep the language accurate." },
  { id: "link-text", category: "accessibility", title: "Link names", status: "pass", severity: "low", score: 1, weight: 1, message: "Links have descriptive text.", recommendation: "Keep link text descriptive." },
];

export const demoAudit: AuditResult = {
  url: "https://example.com", requestedUrl: "https://example.com", auditedAt: "2026-10-06T12:00:00.000Z", durationMs: 1820,
  overallScore: 82, categoryScores: { technical: 86, onpage: 78, performance: 92, accessibility: 71 }, checks,
  summary: { pass: 8, warning: 5, fail: 0 },
  charts: {
    headingCounts: { h1: 1, h2: 5, h3: 3, h4: 1, h5: 0, h6: 0 },
    performance: { ttfbMs: 315, htmlSizeKb: 68, scriptCount: 8, stylesheetCount: 2, imageCount: 12, totalLinks: 34 },
    links: { ok: 24, broken: 1, redirected: 3, skipped: 6 },
  },
};
