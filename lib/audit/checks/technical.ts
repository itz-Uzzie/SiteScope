import type { CheerioAPI } from "cheerio";
import type { CheckResult, PageData } from "../types";
import { safeFetch } from "../safeFetch";

const check = (id: string, title: string, status: CheckResult["status"], message: string, recommendation: string, weight = 1): CheckResult => ({
  id, title, category: "technical", status, severity: weight === 3 ? "high" : weight === 2 ? "medium" : "low", score: status === "pass" ? 1 : status === "warning" ? 0.5 : 0, weight, message, recommendation,
});

export async function technicalChecks($: CheerioAPI, page: PageData): Promise<CheckResult[]> {
  const checks: CheckResult[] = [];
  const url = new URL(page.finalUrl);
  checks.push(check("https", "HTTPS", url.protocol === "https:" ? "pass" : "fail", url.protocol === "https:" ? "Page is served securely over HTTPS." : "The final page URL uses HTTP, not HTTPS.", "Enable HTTPS and redirect HTTP traffic to the secure URL.", 3));
  try {
    const httpUrl = new URL(page.finalUrl);
    httpUrl.protocol = "http:";
    const redirect = await safeFetch(httpUrl.toString(), { timeoutMs: 4_000, maxBytes: 1_024, method: "HEAD" });
    const redirectsToHttps = redirect.url.startsWith("https:");
    checks.push(check("http-redirect", "HTTP to HTTPS redirect", redirectsToHttps ? "pass" : "warning", redirectsToHttps ? "The HTTP version redirects to HTTPS." : "The HTTP version does not redirect to HTTPS.", "Redirect all HTTP requests to the HTTPS version."));
  } catch {
    checks.push(check("http-redirect", "HTTP to HTTPS redirect", "warning", "Could not confirm the HTTP to HTTPS redirect.", "Check that all HTTP requests redirect to the secure page."));
  }
  checks.push(check("status-code", "HTTP status", page.statusCode === 200 ? "pass" : "fail", `The page returned HTTP ${page.statusCode}.`, "Make sure the canonical page responds with HTTP 200.", 3));
  checks.push(check("redirects", "Redirect chain", page.redirectCount > 2 ? "warning" : "pass", page.redirectCount > 2 ? `The page passed through ${page.redirectCount} redirects.` : `The page used ${page.redirectCount} redirects.`, "Reduce unnecessary redirects to reach the final page faster."));

  const canonical = $("link[rel~='canonical']").first().attr("href");
  let canonicalStatus: CheckResult["status"] = "fail";
  let canonicalMessage = "No canonical URL was found.";
  if (canonical) {
    try {
      const resolved = new URL(canonical, page.finalUrl);
      canonicalStatus = resolved.origin === url.origin && resolved.pathname === url.pathname ? "pass" : "warning";
      canonicalMessage = canonicalStatus === "pass" ? "A canonical URL points to this page." : `Canonical URL points to ${resolved.toString()}.`;
    } catch { canonicalStatus = "warning"; canonicalMessage = "The canonical URL is not valid."; }
  } else if (url.pathname === "/") canonicalStatus = "warning";
  checks.push(check("canonical", "Canonical URL", canonicalStatus, canonicalMessage, "Add an absolute canonical link that points to the preferred version of this page.", 2));

  const robotsMeta = $("meta[name='robots' i]").attr("content") ?? "";
  const noindex = /noindex/i.test(robotsMeta) || /noindex/i.test(page.headers.xRobotsTag ?? "");
  checks.push(check("meta-robots", "Indexing directive", noindex ? "fail" : "pass", noindex ? "A robots directive tells search engines not to index this page." : "No noindex directive was found.", "Remove noindex if this page should appear in search results.", 3));
  const viewport = $("meta[name='viewport']").attr("content");
  checks.push(check("viewport", "Mobile viewport", viewport ? "pass" : "fail", viewport ? "A mobile viewport is configured." : "No viewport meta tag was found.", "Add a viewport meta tag so the page fits mobile screens.", 2));

  const jsonLd = $("script[type='application/ld+json']").toArray();
  const validJsonLd = jsonLd.filter((node) => { try { JSON.parse($(node).text()); return true; } catch { return false; } }).length;
  checks.push(check("structured-data", "Structured data", validJsonLd > 0 ? "pass" : jsonLd.length ? "warning" : "warning", jsonLd.length ? `${validJsonLd} of ${jsonLd.length} structured-data blocks contain valid JSON.` : "No structured-data blocks were found.", "Add valid JSON-LD that describes the page when appropriate."));

  const robotsUrl = new URL("/robots.txt", page.finalUrl).toString();
  let robotsText = "";
  let robotsStatus = "warning" as CheckResult["status"];
  try {
    const result = await safeFetch(robotsUrl, { timeoutMs: 5_000, maxBytes: 100_000 });
    robotsText = result.body;
    const disallowAll = /^User-agent:\s*\*\s*\r?\n(?:[^\n]*\n)*?Disallow:\s*\/\s*$/im.test(robotsText);
    robotsStatus = result.response.ok ? disallowAll ? "fail" : "pass" : "warning";
    checks.push(check("robots-txt", "Robots.txt", robotsStatus, disallowAll ? "Robots.txt blocks all crawlers from the site." : result.response.ok ? "A robots.txt file is available." : `Robots.txt returned HTTP ${result.response.status}.`, "Review robots.txt rules so important pages can be crawled.", 2));
  } catch {
    checks.push(check("robots-txt", "Robots.txt", "warning", "Could not retrieve robots.txt.", "Make sure /robots.txt is available and includes crawl guidance.", 2));
  }

  const sitemapUrls = [...robotsText.matchAll(/^Sitemap:\s*(\S+)/gim)].map((match) => match[1]).filter((value): value is string => Boolean(value));
  if (sitemapUrls.length === 0) sitemapUrls.push(new URL("/sitemap.xml", page.finalUrl).toString());
  let sitemapStatus: CheckResult["status"] = "warning";
  let sitemapMessage = "No sitemap was found.";
  for (const sitemapUrl of sitemapUrls.slice(0, 3)) {
    try {
      const result = await safeFetch(sitemapUrl, { timeoutMs: 5_000, maxBytes: 500_000 });
      if (result.response.ok && /<(urlset|sitemapindex)(\s|>)/i.test(result.body)) {
        sitemapStatus = "pass"; sitemapMessage = "An XML sitemap is available."; break;
      }
    } catch { /* Sitemap is optional; continue with the next advertised location. */ }
  }
  checks.push(check("sitemap", "XML sitemap", sitemapStatus, sitemapMessage, "Publish an XML sitemap and reference it in robots.txt.", 2));
  const hreflangs = $("link[rel='alternate'][hreflang]").length;
  checks.push(check("lang-hreflang", "Language alternatives", "pass", hreflangs ? `${hreflangs} hreflang alternate link(s) found.` : "No hreflang links were found.", "Add hreflang links when the site has localized page versions."));
  return checks;
}
