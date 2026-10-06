import type { CheerioAPI } from "cheerio";
import type { CheckResult } from "../types";
import { safeFetch } from "../safeFetch";

export interface LinkIssue { url: string; status: string; foundOn: string; internal: boolean }
export interface LinkSummary { ok: number; broken: number; redirected: number; skipped: number; issues: LinkIssue[] }

async function pool<T, R>(items: T[], limit: number, work: (item: T) => Promise<R>): Promise<R[]> {
  const output = new Array<R>(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = next++;
      if (index >= items.length) return;
      output[index] = await work(items[index] as T);
    }
  }));
  return output;
}

export async function linkChecks($: CheerioAPI, pageUrl: string): Promise<{ check: CheckResult; summary: LinkSummary }> {
  const page = new URL(pageUrl);
  const collected = new Map<string, { url: string; foundOn: string; internal: boolean }>();
  let skipped = 0;
  $("a[href]").each((_, node) => {
    const href = $(node).attr("href")?.trim() ?? "";
    if (!href || href.startsWith("#") || /^(mailto:|tel:|javascript:)/i.test(href)) { skipped += 1; return; }
    if (href.length > 2_048) { skipped += 1; return; }
    try {
      const url = new URL(href, pageUrl);
      if (!/^https?:$/.test(url.protocol)) { skipped += 1; return; }
      url.hash = "";
      const key = url.toString();
      if (!collected.has(key)) collected.set(key, { url: key, foundOn: pageUrl, internal: url.hostname === page.hostname });
    } catch { skipped += 1; }
  });
  const links = [...collected.values()].sort((a, b) => Number(b.internal) - Number(a.internal)).slice(0, 30);
  skipped += Math.max(0, collected.size - links.length);
  const results = await pool(links, 6, async (link) => {
    try {
      let result = await safeFetch(link.url, { method: "HEAD", timeoutMs: 5_000, maxBytes: 1_024 });
      if ([403, 405, 501].includes(result.response.status)) {
        result = await safeFetch(link.url, { method: "GET", timeoutMs: 5_000, maxBytes: 1_024, readBody: false, headers: { range: "bytes=0-0" } });
      }
      const code = result.response.status;
      return { link, code, landedUrl: result.url, ok: result.response.ok };
    } catch {
      return { link, code: 0, landedUrl: link.url, ok: false };
    }
  });

  const broken = results.filter((entry) => !entry.ok || entry.code >= 400);
  const redirected = results.filter((entry) => entry.ok && entry.landedUrl !== entry.link.url);
  const ok = results.length - broken.length - redirected.length;
  const summary: LinkSummary = {
    ok, broken: broken.length, redirected: redirected.length, skipped,
    issues: broken.map(({ link, code }) => ({ url: link.url, status: code ? String(code) : "unreachable", foundOn: link.foundOn, internal: link.internal })),
  };
  const brokenInternal = broken.some((entry) => entry.link.internal);
  const ratio = results.length ? broken.length / results.length : 0;
  const status: CheckResult["status"] = brokenInternal ? "fail" : broken.length ? "warning" : "pass";
  const check: CheckResult = {
    id: "broken-links", category: "technical", title: "Link health", status,
    severity: "medium", score: 1 - ratio, weight: 2,
    message: broken.length ? `${broken.length} of ${results.length} checked links could not be reached.` : `All ${results.length} checked links responded successfully.`,
    recommendation: "Update or remove links that lead to missing pages. Only up to 30 links are checked to keep results fast.",
    details: { issues: summary.issues, checked: results.length, skipped },
  };
  return { check, summary };
}
