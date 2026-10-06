import { load } from "cheerio";
import { accessibilityChecks } from "./checks/accessibility";
import { linkChecks } from "./checks/links";
import { onpageChecks } from "./checks/onpage";
import { performanceChecks } from "./checks/performance";
import { technicalChecks } from "./checks/technical";
import { fetchPage, PageFetchError } from "./fetchPage";
import { overallScore, scoreChecks, summarize } from "./scoring";
import type { AuditResult, Category, CheckResult } from "./types";

const groupFailure = (category: Category, id: string, title: string): CheckResult => ({
  id, category, title, status: "warning", severity: "low", score: 0.5, weight: 1,
  message: "Could not run this check.", recommendation: "Try the audit again later.",
});

export async function runAudit(input: string): Promise<AuditResult> {
  const start = performance.now();
  const page = await fetchPage(input);
  const $ = load(page.html);
  const psiPromise: Promise<{ pageSpeed?: NonNullable<AuditResult["pageSpeed"]> }> = process.env.PSI_API_KEY ? pageSpeedResult(page.finalUrl) : Promise.resolve({});
  const groups = await Promise.allSettled([
    Promise.resolve().then(() => technicalChecks($, page)),
    Promise.resolve().then(() => onpageChecks($, page)),
    Promise.resolve().then(() => accessibilityChecks($, page)),
    Promise.resolve().then(() => performanceChecks($, page)),
    Promise.resolve().then(() => linkChecks($, page.finalUrl)),
  ]);

  const checks: CheckResult[] = [];
  let headingCounts = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
  let metrics = { ttfbMs: page.ttfbMs, htmlSizeKb: Math.round(page.sizeBytes / 1024), scriptCount: 0, stylesheetCount: 0, imageCount: 0, totalLinks: 0 };
  let linkSummary = { ok: 0, broken: 0, redirected: 0, skipped: 0 };
  const tech = groups[0];
  if (tech.status === "fulfilled") checks.push(...tech.value); else checks.push(groupFailure("technical", "technical-checks", "Technical checks"));
  const onpage = groups[1];
  if (onpage.status === "fulfilled") { checks.push(...onpage.value.checks); headingCounts = onpage.value.headingCounts; }
  else checks.push(groupFailure("onpage", "onpage-checks", "On-page checks"));
  const accessibility = groups[2];
  if (accessibility.status === "fulfilled") checks.push(...accessibility.value); else checks.push(groupFailure("accessibility", "accessibility-checks", "Accessibility checks"));
  const performanceGroup = groups[3];
  if (performanceGroup.status === "fulfilled") { checks.push(...performanceGroup.value.checks); metrics = performanceGroup.value.metrics; }
  else checks.push(groupFailure("performance", "performance-checks", "Performance checks"));
  const links = groups[4];
  if (links.status === "fulfilled") { checks.push(links.value.check); linkSummary = links.value.summary; }
  else checks.push(groupFailure("technical", "broken-links", "Link health"));

  const categoryScores = scoreChecks(checks);
  const psi = await psiPromise;
  if (psi.pageSpeed) {
    categoryScores.performance = Math.round(categoryScores.performance * 0.5 + psi.pageSpeed.performanceScore * 0.5);
  }
  return {
    url: page.finalUrl,
    requestedUrl: page.requestedUrl,
    auditedAt: new Date().toISOString(),
    durationMs: Math.round(performance.now() - start),
    overallScore: overallScore(categoryScores),
    categoryScores,
    checks,
    summary: summarize(checks),
    charts: { headingCounts, performance: metrics, links: { ok: linkSummary.ok, broken: linkSummary.broken, redirected: linkSummary.redirected, skipped: linkSummary.skipped } },
    ...psi,
  };
}

async function pageSpeedResult(url: string): Promise<{ pageSpeed?: NonNullable<AuditResult["pageSpeed"]> }> {
  const key = process.env.PSI_API_KEY;
  if (!key) return {};
  try {
    const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
    endpoint.searchParams.set("url", url);
    endpoint.searchParams.set("strategy", "mobile");
    endpoint.searchParams.set("category", "performance");
    endpoint.searchParams.set("key", key);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const response = await fetch(endpoint, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) return {};
    const data: unknown = await response.json();
    if (!data || typeof data !== "object" || !("lighthouseResult" in data)) return {};
    const lighthouse = (data as { lighthouseResult: { categories?: { performance?: { score?: number } }; audits?: Record<string, { numericValue?: number }> } }).lighthouseResult;
    const score = lighthouse.categories?.performance?.score;
    if (typeof score !== "number") return {};
    const audits = lighthouse.audits ?? {};
    return { pageSpeed: { performanceScore: Math.round(score * 100), lcpMs: audits["largest-contentful-paint"]?.numericValue, clsValue: audits["cumulative-layout-shift"]?.numericValue, tbtMs: audits["total-blocking-time"]?.numericValue, fcpMs: audits["first-contentful-paint"]?.numericValue, source: "psi" as const } };
  } catch { return {}; }
}

export { PageFetchError };
