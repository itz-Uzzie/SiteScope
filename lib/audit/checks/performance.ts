import type { CheerioAPI } from "cheerio";
import type { CheckResult, PageData } from "../types";

const make = (id: string, title: string, status: CheckResult["status"], message: string, recommendation: string, weight = 1): CheckResult => ({
  id, title, category: "performance", status, severity: weight === 2 ? "medium" : "low", score: status === "pass" ? 1 : status === "warning" ? 0.5 : 0, weight, message, recommendation,
});

export function performanceChecks($: CheerioAPI, page: PageData) {
  const checks: CheckResult[] = [];
  const responseTime = page.totalMs;
  checks.push(make("response-time", "Response time", responseTime < 600 ? "pass" : responseTime <= 1500 ? "warning" : "fail", `The HTML response took ${responseTime} ms.`, "Reduce server response time through caching and backend optimization.", 2));
  const htmlSizeKb = Math.round(page.sizeBytes / 1024);
  checks.push(make("html-size", "HTML size", page.sizeBytes < 100_000 ? "pass" : page.sizeBytes <= 500_000 ? "warning" : "fail", `The HTML document is about ${htmlSizeKb} KB.`, "Remove unused markup and defer large page content where practical."));
  const encoding = page.headers.contentEncoding?.toLowerCase() ?? "";
  checks.push(make("compression", "Response compression", /^(gzip|br|zstd)$/.test(encoding) ? "pass" : "warning", encoding ? `The response uses ${encoding} compression.` : "No compressed response encoding was detected.", "Enable Brotli or gzip compression for HTML responses."));
  const caching = Boolean(page.headers.cacheControl || page.headers.etag);
  checks.push(make("caching-headers", "Caching headers", caching ? "pass" : "warning", caching ? "Cache-related response headers are present." : "No cache-control or ETag header was found.", "Set caching headers that match how often the page changes."));

  const scripts = $("script[src]").toArray();
  checks.push(make("script-count", "External scripts", scripts.length < 15 ? "pass" : scripts.length <= 30 ? "warning" : "fail", `${scripts.length} external scripts were found.`, "Remove unused scripts and load non-critical scripts later."));
  const blockingScripts = $("head script[src]").toArray().filter((node) => !$(node).attr("async") && !$(node).attr("defer")).length;
  const blockingStyles = $("head link[rel~='stylesheet']").length;
  checks.push({ ...make("render-blocking", "Render-blocking resources", blockingScripts ? "warning" : "pass", `${blockingScripts} scripts block rendering; ${blockingStyles} stylesheets load in the head.`, "Defer non-critical scripts and keep above-the-fold styles small."), details: { blockingScripts, blockingStyles } });

  const images = $("img").toArray();
  const missingDimensions = images.filter((node) => !$(node).attr("width") || !$(node).attr("height")).length;
  const missingLazy = images.slice(2).filter((node) => $(node).attr("loading") !== "lazy").length;
  const imageIssues = missingDimensions + missingLazy;
  checks.push({ ...make("image-optimization", "Image loading hints", imageIssues > 5 ? "warning" : "pass", `${missingDimensions} images lack dimensions; ${missingLazy} later images are not marked lazy.`, "Set image width and height to reduce layout shifts; lazy-load images below the first screen."), details: { missingDimensions, missingLazy, imageCount: images.length } });

  const modern = images.filter((node) => /\.(?:webp|avif)(?:[?#]|$)/i.test($(node).attr("src") ?? "")).length;
  const formatStatus = images.length === 0 || modern / images.length >= 0.5 ? "pass" : "warning";
  checks.push({ ...make("modern-image-formats", "Modern image formats", formatStatus, images.length ? `${modern} of ${images.length} images use WebP or AVIF by URL extension.` : "No images were found.", "Consider WebP or AVIF for photos and complex illustrations."), details: { modernImages: modern, imageCount: images.length } });

  return { checks, metrics: { ttfbMs: page.ttfbMs, htmlSizeKb, scriptCount: scripts.length, stylesheetCount: $("link[rel~='stylesheet']").length, imageCount: images.length, totalLinks: $("a[href]").length } };
}
