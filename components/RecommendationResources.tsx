import type { CheckResult } from "@/lib/audit/types";

type Resource = { label: string; url: string; purpose: string; why: string };

const resources: Record<string, Resource> = {
  title: {
    label: "Meta Tag Generator",
    url: "https://www.toolsnap.tools/seo-tools/meta-tag-generator",
    purpose: "Draft a page title and related metadata.",
    why: "A descriptive title helps people and search engines identify the page topic; it can influence how the page is presented in search results.",
  },
  "meta-description": {
    label: "Meta Tag Generator",
    url: "https://www.toolsnap.tools/seo-tools/meta-tag-generator",
    purpose: "Draft a concise title and meta description.",
    why: "A meta description may be used as the search snippet, helping people decide whether the result matches their needs. Search engines can choose other page text instead.",
  },
  "structured-data": {
    label: "Schema Markup Generator",
    url: "https://www.toolsnap.tools/seo-tools/schema-markup-generator",
    purpose: "Create structured data for content that qualifies.",
    why: "Schema markup describes page entities and relationships in a machine-readable format. It can make a page eligible for supported rich results, but does not guarantee display or higher rankings.",
  },
  "open-graph": {
    label: "Open Graph Generator",
    url: "https://www.toolsnap.tools/seo-tools/open-graph-generator",
    purpose: "Prepare Open Graph title, description, and image tags.",
    why: "These tags control how a page is previewed when shared on many social and messaging platforms. They mainly improve sharing presentation, rather than directly changing search rankings.",
  },
  sitemap: {
    label: "Sitemap Generator",
    url: "https://www.toolsnap.tools/seo-tools/sitemap-generator",
    purpose: "Build an XML list of your preferred, indexable URLs.",
    why: "A sitemap helps search engines discover important URLs, especially on large or new sites. It is a discovery hint; it does not guarantee crawling, indexing, or rankings.",
  },
  "image-optimization": {
    label: "Image Compressor",
    url: "https://www.toolsnap.tools/image-tools/image-compressor",
    purpose: "Compress image files before publishing them.",
    why: "Smaller images can transfer faster and reduce page weight, which can improve loading experience. Keep enough quality and use suitable dimensions and formats.",
  },
  "modern-image-formats": {
    label: "Image Compressor",
    url: "https://www.toolsnap.tools/image-tools/image-compressor",
    purpose: "Compress images and prepare lighter image files.",
    why: "Efficient image delivery can reduce bytes transferred and support faster loading. Choose a format supported by your site and preserve visual quality.",
  },
};

export default function RecommendationResources({ item, slowLargestContentfulPaint = false }: { item: CheckResult; slowLargestContentfulPaint?: boolean }) {
  const resource = resources[item.id];
  const imageAdvice = item.id === "image-optimization" || item.id === "modern-image-formats";
  const showImageAdvice = imageAdvice && (item.status !== "pass" || slowLargestContentfulPaint);
  if (!resource || (item.status === "pass" && !showImageAdvice)) return null;

  return <aside className="ml-10 mt-4 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 dark:border-emerald-900/70 dark:bg-emerald-950/20">
    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Why this matters</p>
    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{resource.why}</p>
    {imageAdvice && <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">This audit checks image loading hints and formats; it does not download each image or measure its individual transfer time. A slow Largest Contentful Paint can also be caused by server response, render-blocking resources, or other page content.</p>}
    <a href={resource.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex text-sm font-medium text-emerald-800 underline decoration-emerald-300 underline-offset-4 hover:text-emerald-950 dark:text-emerald-300 dark:hover:text-emerald-200">{resource.label}: {resource.purpose}</a>
  </aside>;
}
