import type { CheerioAPI } from "cheerio";
import type { CheckResult, PageData } from "../types";

const check = (id: string, title: string, status: CheckResult["status"], message: string, recommendation: string, weight = 1, score?: number): CheckResult => ({
  id, title, category: "onpage", status, severity: weight === 3 ? "high" : weight === 2 ? "medium" : "low", score: score ?? (status === "pass" ? 1 : status === "warning" ? 0.5 : 0), weight, message, recommendation,
});

export function onpageChecks($: CheerioAPI, page: PageData) {
  const result: CheckResult[] = [];
  const pagePath = new URL(page.finalUrl).pathname || "/";
  const title = $("title").first().text().trim();
  const titleStatus = !title ? "fail" : title.length < 30 || title.length > 60 ? "warning" : "pass";
  result.push(check("title", "Page title", titleStatus, title ? `Title is ${title.length} characters long.` : `Missing page title on ${pagePath}.`, "Write a unique, descriptive title between 30 and 60 characters.", 3));

  const description = $("meta[name='description' i]").attr("content")?.trim() ?? "";
  const descriptionStatus = !description ? "fail" : description.length < 70 || description.length > 160 ? "warning" : "pass";
  result.push(check("meta-description", "Meta description", descriptionStatus, description ? `Description is ${description.length} characters long.` : `Missing meta description on ${pagePath}.`, "Add a useful summary between 70 and 160 characters.", 3));

  const h1s = $("h1").toArray();
  const h1Status = h1s.length === 1 ? "pass" : h1s.length === 0 ? "fail" : "warning";
  result.push(check("h1", "Main heading", h1Status, h1s.length === 1 ? "Exactly one H1 heading was found." : h1s.length ? `Found ${h1s.length} H1 headings.` : "No H1 heading was found.", "Use one clear H1 heading to describe the page.", 3));

  const headingCounts = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
  $("h1,h2,h3,h4,h5,h6").each((_, node) => { const key = node.tagName.toLowerCase() as keyof typeof headingCounts; headingCounts[key] += 1; });
  let prior = 0; let skipped = false; let empty = 0; let firstHeadingLevel = 0;
  $("h1,h2,h3,h4,h5,h6").each((_, node) => {
    const level = Number(node.tagName.slice(1));
    if (!firstHeadingLevel) firstHeadingLevel = level;
    if (prior && level > prior + 1) skipped = true;
    if (!$(node).text().trim()) empty += 1;
    prior = level;
  });
  const headingIssues = [skipped ? "heading levels are skipped" : "", empty ? `${empty} headings are empty` : "", firstHeadingLevel > 1 ? "the first heading is not an H1" : ""].filter(Boolean);
  result.push({ ...check("heading-structure", "Heading structure", headingIssues.length ? "warning" : "pass", headingIssues.length ? headingIssues.join("; ") + "." : "Heading levels follow a clear outline.", "Keep heading levels in order and give every heading meaningful text.", 2), details: { headingCounts } });

  const og = ["og:title", "og:description", "og:image"].map((name) => Boolean($(`meta[property='${name}']`).attr("content"))).filter(Boolean).length;
  result.push(check("open-graph", "Open Graph sharing tags", og === 3 ? "pass" : og ? "warning" : "fail", `${og} of 3 key Open Graph tags are present.`, "Add og:title, og:description, and og:image for better link previews.", 1, og / 3));
  const twitter = Boolean($("meta[name='twitter:card']").attr("content"));
  result.push(check("twitter-card", "Social card", twitter ? "pass" : "warning", twitter ? "A Twitter card is configured." : "No Twitter card tag was found.", "Add a twitter:card meta tag for social previews."));

  const bodyText = $("body").clone();
  bodyText.find("script,style,noscript,svg,template,[hidden],[aria-hidden='true']").remove();
  const text = bodyText.text().replace(/\s+/g, " ").trim();
  const wordCount = text ? text.split(" ").length : 0;
  result.push({ ...check("word-count", "Visible text", wordCount >= 300 ? "pass" : "warning", `About ${wordCount} visible words were found.`, "Add helpful, original content where the page needs more detail."), details: { wordCount } });

  const host = new URL(page.finalUrl).hostname;
  const internal = $("a[href]").toArray().filter((node) => {
    try { return new URL($(node).attr("href") ?? "", page.finalUrl).hostname === host; } catch { return false; }
  }).length;
  result.push(check("internal-links", "Internal links", internal > 0 ? "pass" : "warning", internal ? `${internal} internal links were found.` : "No internal links were found.", "Link related pages together to help visitors and crawlers discover them."));

  const currentUrl = new URL(page.finalUrl);
  const excessiveParams = currentUrl.searchParams.size > 4;
  const urlClean = currentUrl.toString().length < 100 && !currentUrl.pathname.includes("_") && !excessiveParams;
  result.push(check("url-quality", "URL readability", urlClean ? "pass" : "warning", urlClean ? "The page URL is concise and readable." : "The page URL is long or uses several parameters/underscores.", "Prefer short, descriptive URLs with hyphens between words."));
  const favicon = Boolean($("link[rel~='icon']").attr("href"));
  result.push(check("favicon", "Favicon", favicon ? "pass" : "warning", favicon ? "A favicon link was found." : "No favicon link was found.", "Add a favicon so the site is recognizable in browser tabs."));

  return { checks: result, headingCounts, wordCount };
}
