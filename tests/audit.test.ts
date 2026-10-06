import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { load } from "cheerio";
import { onpageChecks } from "../lib/audit/checks/onpage";
import { accessibilityChecks } from "../lib/audit/checks/accessibility";
import { overallScore, scoreChecks } from "../lib/audit/scoring";
import { normalizeAuditUrl, validatePublicUrl, UnsafeUrlError } from "../lib/audit/ssrf";
import type { PageData } from "../lib/audit/types";

const page: PageData = {
  requestedUrl: "https://example.com/gardening", finalUrl: "https://example.com/gardening", html: "", statusCode: 200, redirectCount: 0,
  headers: { contentEncoding: "br", cacheControl: "max-age=60", contentType: "text/html", xRobotsTag: null, etag: null },
  ttfbMs: 200, totalMs: 300, sizeBytes: 1000,
};
const fixture = async (name: string) => load(await readFile(fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url)), "utf8"));

describe("score calculations", () => {
  it("weights checks within each category and categories overall", () => {
    const scores = scoreChecks([
      { id: "a", category: "technical", title: "A", status: "pass", severity: "high", score: 1, weight: 3, message: "" },
      { id: "b", category: "technical", title: "B", status: "fail", severity: "low", score: 0, weight: 1, message: "" },
      { id: "c", category: "onpage", title: "C", status: "pass", severity: "low", score: 1, weight: 1, message: "" },
    ]);
    expect(scores.technical).toBe(75);
    expect(scores.onpage).toBe(100);
    expect(overallScore({ technical: 100, onpage: 80, performance: 60, accessibility: 40 })).toBe(74);
  });
});

describe("URL safety", () => {
  it("normalizes whitespace and missing protocols", () => {
    expect(normalizeAuditUrl(" example.com/path ")).toBe("https://example.com/path");
    expect(normalizeAuditUrl("http://example.com")).toBe("http://example.com");
  });

  it.each(["http://127.0.0.1", "http://10.0.0.8", "http://172.16.2.1", "http://192.168.1.2", "http://169.254.169.254", "http://[::1]", "http://[fd00::1]", "http://[fe80::1]", "http://localhost", "http://router.local", "http://name.internal", "http://user:pass@example.com"]) ("rejects unsafe address %s", async (url) => {
    await expect(validatePublicUrl(url)).rejects.toBeInstanceOf(UnsafeUrlError);
  });
});

describe("HTML check rules", () => {
  it("recognizes good title, description, and heading outline", async () => {
    const $ = await fixture("good-page.html");
    const checks = onpageChecks($, page);
    expect(checks.checks.find((check) => check.id === "title")?.status).toBe("pass");
    expect(checks.checks.find((check) => check.id === "meta-description")?.status).toBe("pass");
    expect(checks.checks.find((check) => check.id === "heading-structure")?.status).toBe("pass");
    expect(checks.headingCounts).toEqual({ h1: 1, h2: 2, h3: 0, h4: 0, h5: 0, h6: 0 });
  });

  it("flags short metadata, skipped levels, and multiple H1s", async () => {
    const $ = await fixture("bad-page.html");
    const checks = onpageChecks($, { ...page, finalUrl: "https://example.com/bad" });
    expect(checks.checks.find((check) => check.id === "title")?.status).toBe("warning");
    expect(checks.checks.find((check) => check.id === "meta-description")?.status).toBe("warning");
    expect(checks.checks.find((check) => check.id === "heading-structure")?.status).toBe("warning");
    expect(checks.checks.find((check) => check.id === "h1")?.status).toBe("warning");
  });

  it("counts missing and empty image alt attributes separately", async () => {
    const $ = load('<html lang="en"><body><img src="a"><img src="b" alt=""><img src="c" alt="Garden"></body></html>');
    const check = accessibilityChecks($, page).find((item) => item.id === "image-alt");
    expect(check?.details).toMatchObject({ missingAlt: 1, emptyAlt: 1, imageCount: 3 });
    expect(check?.status).toBe("fail");
  });
});
