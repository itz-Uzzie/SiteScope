import type { CheerioAPI } from "cheerio";
import type { CheckResult, PageData } from "../types";

const make = (id: string, title: string, status: CheckResult["status"], message: string, recommendation: string, weight = 1): CheckResult => ({
  id, title, category: "accessibility", status, severity: weight === 3 ? "high" : weight === 2 ? "medium" : "low", score: status === "pass" ? 1 : status === "warning" ? 0.5 : 0, weight, message, recommendation,
});

export function accessibilityChecks($: CheerioAPI, page: PageData): CheckResult[] {
  const images = $("img").toArray();
  const missingAlt = images.filter((node) => $(node).attr("alt") === undefined).length;
  const emptyAlt = images.filter((node) => $(node).attr("alt") === "").length;
  const result: CheckResult[] = [];
  result.push({ ...make("image-alt", "Image alternative text", missingAlt ? "fail" : "pass", missingAlt ? `${missingAlt} images don't have ALT text.` : `All ${images.length} images have an ALT attribute.`, "Write concise alt text for informative images and use empty alt text only for decorative images.", 3), details: { missingAlt, emptyAlt, imageCount: images.length } });

  const lang = $("html").attr("lang");
  result.push(make("html-lang", "Page language", lang ? "pass" : "fail", lang ? `The page language is set to ${lang}.` : "The HTML element has no language attribute.", "Set the html lang attribute to the primary language of the page."));

  const formInputs = $("input,select,textarea").toArray().filter((node) => !["hidden", "submit", "button", "reset", "image"].includes(($(node).attr("type") ?? "").toLowerCase()));
  const unlabeled = formInputs.filter((node) => {
    const el = $(node); const id = el.attr("id");
    const explicitLabel = Boolean(id && $("label").toArray().some((label) => $(label).attr("for") === id));
    return !el.attr("aria-label") && !el.attr("aria-labelledby") && !el.closest("label").length && !explicitLabel;
  }).length;
  result.push(make("form-labels", "Form labels", unlabeled ? "fail" : "pass", unlabeled ? `${unlabeled} form field(s) have no accessible label.` : "All form fields have an accessible label.", "Add a visible label or an aria-label to every form field."));

  const genericLinks = $("a[href]").toArray().filter((node) => {
    const text = $(node).text().replace(/\s+/g, " ").trim().toLowerCase();
    return !text || ["click here", "read more", "here", "more"].includes(text);
  }).length;
  result.push(make("link-text", "Link names", genericLinks ? "warning" : "pass", genericLinks ? `${genericLinks} links have empty or generic text.` : "Links have descriptive text.", "Use link text that explains where each link goes."));

  const unnamedButtons = $("button").toArray().filter((node) => !$(node).text().trim() && !$(node).attr("aria-label") && !$(node).attr("aria-labelledby")).length;
  result.push(make("button-names", "Button names", unnamedButtons ? "fail" : "pass", unnamedButtons ? `${unnamedButtons} buttons have no accessible name.` : "Buttons have accessible names.", "Give every button visible text or an aria-label."));

  const landmarks = [$("main").length > 0 || $(`[role='main']`).length > 0, $("nav").length > 0 || $(`[role='navigation']`).length > 0, $("header,footer").length > 0 || $(`[role='banner'],[role='contentinfo']`).length > 0];
  const present = landmarks.filter(Boolean).length;
  result.push(make("landmarks", "Page landmarks", present === 3 ? "pass" : "warning", `${present} of 3 key landmark types are present.`, "Use main, nav, and header/footer landmarks to make page regions easier to navigate."));

  const hasTitle = Boolean($("title").text().trim());
  result.push(make("document-title", "Document title", hasTitle ? "pass" : "fail", hasTitle ? "The document has a title." : "The document has no title.", "Add a short, descriptive title to the page."));

  const viewport = $("meta[name='viewport']").attr("content") ?? "";
  const zoomAllowed = !/user-scalable\s*=\s*no|max(?:imum)?-scale\s*=\s*1(?:\.0)?(?:\D|$)/i.test(viewport);
  result.push(make("zoom-allowed", "Zoom support", zoomAllowed ? "pass" : "fail", zoomAllowed ? "The viewport allows users to zoom." : "The viewport settings may prevent users from zooming.", "Remove user-scalable=no and maximum-scale=1 restrictions."));
  void page;
  return result;
}
