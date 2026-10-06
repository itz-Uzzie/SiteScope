import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BookOpen, CheckCircle2, Gauge, Globe2, Link2, Search, ShieldCheck, Tags } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "SEO Learning Hub: On-Page, Off-Page, Speed & Indexing | SiteScope",
  description: "A practical SEO guide covering on-page and off-page SEO, website speed, Search Console URL inspection, sitemaps, breadcrumbs, JSON-LD, and meta tags.",
  alternates: { canonical: "/learn" },
  openGraph: { title: "SEO Learning Hub | SiteScope", description: "Practical guides for on-page and off-page SEO, performance, indexing, sitemaps, JSON-LD, and meta tags.", type: "article" },
  twitter: { card: "summary", title: "SEO Learning Hub | SiteScope", description: "Practical SEO guides for building search visibility and a better website." },
};

const contents = [
  ["rank", "How search visibility grows"],
  ["on-page", "On-page SEO"],
  ["off-page", "Off-page SEO"],
  ["performance", "Improve performance"],
  ["inspection", "URL inspection and indexing"],
  ["sitemaps", "Sitemaps and robots.txt"],
  ["breadcrumbs", "Breadcrumbs and JSON-LD"],
  ["meta-tags", "Meta tags explained"],
  ["plan", "A practical 30-day plan"],
];

const linkClass = "font-medium text-emerald-800 underline decoration-emerald-300 underline-offset-4 hover:text-emerald-950 dark:text-emerald-300 dark:decoration-emerald-800 dark:hover:text-emerald-200";

function SectionHeading({ icon: Icon, eyebrow, title }: { icon: typeof Search; eyebrow: string; title: string }) {
  return <div className="mb-5"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300"><Icon size={14} />{eyebrow}</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl dark:text-white">{title}</h2></div>;
}

function Checklist({ items }: { items: string[] }) {
  return <ul className="mt-4 space-y-3">{items.map((item) => <li key={item} className="flex gap-2.5 text-sm leading-6 text-slate-700 dark:text-slate-300"><CheckCircle2 className="mt-1 shrink-0 text-emerald-600 dark:text-emerald-400" size={16} />{item}</li>)}</ul>;
}

function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3><div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{children}</div></article>;
}

export default function LearnPage() {
  return <main className="min-h-screen px-4 pb-16 pt-5 sm:px-7">
    <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
      <Link href="/" className="flex items-center gap-2 font-semibold"><Image src="/Logo/icon-48x48.png" alt="" width={32} height={32} className="size-8 object-contain" />Site<span className="-ml-2 text-emerald-600">Scope</span></Link>
      <div className="flex items-center gap-2"><ThemeToggle /><Link href="/" className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-800"><Search size={15} /> Run an audit</Link></div>
    </header>

    <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "SEO Guide", href: "/learn" }]} />
    <div className="mx-auto max-w-6xl">
      <div className="pt-7 sm:pt-10"><div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300"><BookOpen size={17} /> SiteScope Learning Hub</div><h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl dark:text-white">SEO that helps people find and use your site</h1><p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">A practical guide to improving pages, earning trust, speeding up your site, and helping search engines discover the right URLs. Use it as a checklist—not as a promise of a particular ranking.</p></div>

      <div className="mt-9 grid items-start gap-7 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="top-5 rounded-2xl border border-slate-200 bg-white p-4 lg:sticky dark:border-slate-800 dark:bg-slate-900"><h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">On this page</h2><nav aria-label="Learning hub sections" className="mt-3 space-y-1">{contents.map(([id, label]) => <a key={id} href={`#${id}`} className="block rounded-lg px-2.5 py-2 text-sm text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 dark:text-slate-300 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300">{label}</a>)}</nav><div className="mt-4 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500 dark:border-slate-800">Start by auditing a page, then work through the relevant sections below.</div></aside>

        <div className="min-w-0 space-y-8">
          <section id="rank" className="scroll-mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 sm:p-7 dark:border-emerald-900 dark:bg-emerald-950/25">
            <SectionHeading icon={Globe2} eyebrow="The big picture" title="How does a website rank?" />
            <p className="text-sm leading-7 text-slate-700 dark:text-slate-300">Search visibility is a process, not a switch. A search engine needs to discover a URL, crawl it, decide it can be indexed, understand what it covers, and choose whether it is a useful result for a particular search. Your job is to make each step straightforward and publish the best answer for the people you want to reach.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3"><InfoCard title="1. Discover">Use a clear site structure, crawlable links, and a sitemap to help search engines find important pages.</InfoCard><InfoCard title="2. Understand">Use descriptive page content, useful headings, internal links, and accurate metadata.</InfoCard><InfoCard title="3. Earn preference">Satisfy the search intent, deliver a reliable experience, and build a real reputation over time.</InfoCard></div>
            <p className="mt-4 text-xs leading-5 text-slate-500">Indexing and structured data do not guarantee rankings or rich-result display. Search systems make those decisions, and changes can take time to show up. See Google’s <a className={linkClass} href="https://developers.google.com/search/docs/fundamentals/seo-starter-guide" target="_blank" rel="noreferrer">SEO Starter Guide</a>.</p>
          </section>

          <section id="on-page" className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 dark:border-slate-800 dark:bg-slate-900">
            <SectionHeading icon={Tags} eyebrow="Page-level work" title="On-page SEO: make each page clear and useful" />
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">On-page SEO is the work you do on the page itself. First decide what the visitor needs and what one page should answer. Then make the topic and page structure easy to understand for both people and search engines.</p>
            <Checklist items={[
              "Choose one primary search intent for the page. Review the actual results for that query and make sure your format matches what searchers need.",
              "Write a distinct title that accurately names the page. Put the important subject in natural language; avoid repeating keywords to manipulate rankings.",
              "Use one clear main heading, then organize sections with descriptive H2 and H3 headings. Headings should describe the content that follows.",
              "Cover the topic with original, helpful details, examples, and next steps. Remove filler and answer likely follow-up questions.",
              "Link to useful related pages on your own site with anchor text that explains the destination. Give every important page at least one crawlable internal link.",
              "Add descriptive alt text to informative images; use an empty alt attribute for purely decorative images. Use short, readable URLs and a consistent canonical URL.",
              "Write a concise meta description that summarizes the page and gives people a reason to click. Search engines may choose a different snippet.",
            ]} />
            <div className="mt-5 grid gap-3 sm:grid-cols-2"><InfoCard title="Practical length checks">SiteScope uses title and description length ranges as editing hints, not strict search-engine limits. Google can truncate title links to fit a device and may form snippets from page text instead of your description.</InfoCard><InfoCard title="Avoid keyword stuffing">Use the phrases people use when they are genuinely relevant. A page should read naturally and answer the question fully, rather than repeat a phrase at an arbitrary density.</InfoCard></div>
            <p className="mt-4 text-xs leading-5 text-slate-500">Google explains how it generates <a className={linkClass} href="https://developers.google.com/search/docs/appearance/title-link" target="_blank" rel="noreferrer">title links</a> and <a className={linkClass} href="https://developers.google.com/search/docs/appearance/snippet" target="_blank" rel="noreferrer">search snippets</a>.</p>
          </section>

          <section id="off-page" className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 dark:border-slate-800 dark:bg-slate-900">
            <SectionHeading icon={Link2} eyebrow="Reputation beyond your pages" title="Off-page SEO: earn trust and useful references" />
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">Off-page SEO includes signals and awareness that happen away from your website. A strong approach gives people a good reason to mention, cite, recommend, or visit you. It is not a contest to collect the largest number of links.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2"><InfoCard title="Publish something worth citing">Create original research, useful explainers, tools, templates, or local resources that genuinely help your audience. Share them with relevant journalists, organizations, and communities.</InfoCard><InfoCard title="Build relevant relationships">Contribute expertise to reputable publications, partners, professional groups, and local organizations. Ask for a link only when it helps their audience.</InfoCard><InfoCard title="Strengthen local trust">Keep your business name, address, and phone details consistent. Maintain your business profile, choose accurate categories, and ask real customers for honest reviews.</InfoCard><InfoCard title="Avoid manipulative link schemes">Do not buy links for ranking credit, use automated link networks, or trade irrelevant links at scale. Focus on useful mentions and a good customer experience.</InfoCard></div>
            <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">Then check referring pages and brand mentions periodically. A few relevant references can be more valuable than a large pile of unrelated links. Google’s guide to <a className={linkClass} href="https://developers.google.com/search/docs/crawling-indexing/links-crawlable" target="_blank" rel="noreferrer">crawlable links</a> also explains how clear link text helps people and crawlers navigate.</p>
          </section>

          <section id="performance" className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 dark:border-slate-800 dark:bg-slate-900">
            <SectionHeading icon={Gauge} eyebrow="Speed and user experience" title="How to improve website performance" />
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">Start with real user data where possible, then use a lab run to find the cause. Core Web Vitals describe loading, responsiveness, and visual stability. Google’s current “good” targets are LCP within 2.5 seconds, INP at or below 200 milliseconds, and CLS at or below 0.1 for at least 75% of visits.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3"><InfoCard title="LCP · loading">Prioritize the main visible content. Resize and compress the hero image, serve modern formats, avoid lazy-loading the main above-the-fold image, and improve server response time.</InfoCard><InfoCard title="INP · interaction">Reduce long JavaScript tasks, third-party scripts, and expensive event handlers. Break up work so the browser can respond promptly to taps and typing.</InfoCard><InfoCard title="CLS · stability">Set image and video dimensions, reserve space for ads and embeds, and avoid inserting content above what a person is already reading.</InfoCard></div>
            <Checklist items={[
              "Measure mobile and desktop separately. Compare field data over time instead of chasing a single lab score.",
              "Compress images, serve the right dimensions, and lazy-load images below the initial viewport.",
              "Remove unused scripts and styles; defer work that is not needed for the first screen.",
              "Enable text compression, cache static assets, and use a CDN when it makes sense for your audience.",
              "Re-test after each change and watch for trade-offs such as blurry images or delayed interactions.",
            ]} />
            <div className="mt-5 flex flex-wrap gap-3 text-sm"><a className={linkClass} href="https://pagespeed.web.dev/" target="_blank" rel="noreferrer">Run PageSpeed Insights <ArrowUpRight className="inline" size={14} /></a><a className={linkClass} href="https://web.dev/articles/vitals" target="_blank" rel="noreferrer">Understand Core Web Vitals <ArrowUpRight className="inline" size={14} /></a></div>
          </section>

          <section id="inspection" className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 dark:border-slate-800 dark:bg-slate-900">
            <SectionHeading icon={Search} eyebrow="Check a specific page" title="Use URL Inspection to diagnose indexing" />
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">Google Search Console’s URL Inspection tool shows what Google knows about a URL in your verified property. It is the right place to check Google’s indexed version and run a live test after you make a fix.</p>
            <ol className="mt-4 list-inside list-decimal space-y-3 text-sm leading-6 text-slate-700 dark:text-slate-300"><li>Verify the correct site property in Search Console and paste the full canonical URL into the inspection bar.</li><li>Read the indexed result first: check the last crawl, indexing decision, user-declared canonical, and Google-selected canonical.</li><li>After changes, run “Test live URL.” Check that the page loads for Google, is not blocked by robots.txt, has no unintended noindex, and renders the important content.</li><li>If the live test is healthy, request indexing for a small number of important updated URLs. For many pages, submit a sitemap instead.</li><li>Recheck later. A request is not a guarantee of indexing or rankings; crawling and processing can take time.</li></ol>
            <p className="mt-4 text-xs leading-5 text-slate-500">Inspection is limited to properties you have access to, and live tests do not reveal every reason a URL may be absent. See Google’s <a className={linkClass} href="https://support.google.com/webmasters/answer/9012289" target="_blank" rel="noreferrer">URL Inspection help</a> and <a className={linkClass} href="https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl" target="_blank" rel="noreferrer">recrawl guidance</a>.</p>
          </section>

          <section id="sitemaps" className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 dark:border-slate-800 dark:bg-slate-900">
            <SectionHeading icon={ShieldCheck} eyebrow="Crawling basics" title="Sitemaps and robots.txt do different jobs" />
            <div className="grid gap-3 sm:grid-cols-2"><InfoCard title="XML sitemap = discovery hint">List the absolute, preferred URLs you want discovered. Keep out redirects, error pages, and URLs you do not want indexed. Put it at the site root when possible and submit it in Search Console.</InfoCard><InfoCard title="robots.txt = crawl instructions">This file tells compliant crawlers which paths they may request. It does not remove a URL from search results by itself. Do not block a page that Google needs to fetch to see its noindex directive.</InfoCard></div>
            <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-emerald-200"><code>{`# https://example.com/robots.txt\nUser-agent: *\nDisallow: /private/\nSitemap: https://example.com/sitemap.xml`}</code></pre>
            <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">Use canonical absolute URLs in a sitemap and keep the sitemap aligned with your canonical tags. A sitemap helps discovery; it does not force crawling, indexing, or ranking. Google’s documented limit is 50,000 URLs or 50 MB uncompressed per sitemap.</p>
            <p className="mt-3 text-xs"><a className={linkClass} href="https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap" target="_blank" rel="noreferrer">Google’s sitemap guide <ArrowUpRight className="inline" size={13} /></a></p>
          </section>

          <section id="breadcrumbs" className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 dark:border-slate-800 dark:bg-slate-900">
            <SectionHeading icon={Link2} eyebrow="Navigation and structured data" title="Breadcrumbs and JSON-LD" />
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-300"><strong>Breadcrumbs</strong> show where a page sits in your site hierarchy, for example Home › Guides › SEO basics. They help visitors move to a parent section and give search engines context about the page. Use real links and labels that match your site structure.</p>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300"><strong>JSON-LD</strong> is a way to express structured data in a small JSON script. A <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">BreadcrumbList</code> can describe the same breadcrumb trail for machines. Keep the markup accurate and consistent with visible page content; validate it before publishing.</p>
            <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-emerald-200"><code>{`<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "BreadcrumbList",\n  "itemListElement": [\n    {\n      "@type": "ListItem",\n      "position": 1,\n      "name": "Home",\n      "item": "https://example.com/"\n    },\n    {\n      "@type": "ListItem",\n      "position": 2,\n      "name": "Guides",\n      "item": "https://example.com/guides/"\n    },\n    {\n      "@type": "ListItem",\n      "position": 3,\n      "name": "SEO basics"\n    }\n  ]\n}\n</script>`}</code></pre>
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">Structured data helps search engines interpret page details and may make a page eligible for supported search features. Correct JSON-LD does not guarantee a rich result and should not describe content that visitors cannot see.</div>
            <p className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs"><a className={linkClass} href="https://developers.google.com/search/docs/appearance/structured-data/breadcrumb" target="_blank" rel="noreferrer">Breadcrumb structured data guide <ArrowUpRight className="inline" size={13} /></a><a className={linkClass} href="https://search.google.com/test/rich-results" target="_blank" rel="noreferrer">Rich Results Test <ArrowUpRight className="inline" size={13} /></a></p>
          </section>

          <section id="meta-tags" className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 dark:border-slate-800 dark:bg-slate-900">
            <SectionHeading icon={Tags} eyebrow="What the head tags mean" title="Meta tags and other SEO page signals" />
            <div className="space-y-3"><InfoCard title="Title element">The page’s main title signal. Write a concise, distinctive title that matches the visible page. Search engines can use other prominent headings when generating the result title.</InfoCard><InfoCard title="Meta description">A short summary that may be used as a search-result snippet. Make it specific and useful, but expect search engines to sometimes select text from the page instead.</InfoCard><InfoCard title="Canonical link">Names the preferred URL when equivalent or duplicate versions exist. Use an absolute URL and make internal links and sitemaps agree with it.</InfoCard><InfoCard title="Robots meta and X-Robots-Tag">Control whether a page may be indexed. A noindex directive only works when the crawler can access the page and read it.</InfoCard><InfoCard title="Open Graph and Twitter/X cards">Control previews when a page is shared socially. Add an accurate title, description, and image; these tags are mainly for sharing previews rather than a shortcut to higher rankings.</InfoCard><InfoCard title="Viewport and language">A viewport declaration supports mobile layouts. The HTML lang attribute identifies the page’s primary language for assistive technologies and language processing.</InfoCard></div>
            <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-emerald-200"><code>{`<title>Home garden guide | Example</title>\n<meta name="description" content="Plan and grow a healthy home garden with practical seasonal advice.">\n<link rel="canonical" href="https://example.com/guides/home-garden/">\n<meta property="og:title" content="Home garden guide">\n<meta property="og:description" content="Practical advice for a healthy garden.">\n<meta property="og:image" content="https://example.com/images/garden.jpg">\n<meta name="robots" content="index,follow">\n<meta name="viewport" content="width=device-width, initial-scale=1">`}</code></pre>
            <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">There is no need to fill every possible tag. Add tags that serve a real purpose, keep them truthful, and make sure they agree with the page and its canonical URL. A meta-tag utility can help draft values; always review and test the output before publishing.</p>
          </section>

          <section id="plan" className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 dark:border-slate-800 dark:bg-slate-900">
            <SectionHeading icon={CheckCircle2} eyebrow="Make progress steadily" title="A practical 30-day SEO plan" />
            <div className="grid gap-3 sm:grid-cols-2"><InfoCard title="Week 1 · establish the baseline">Verify Search Console, submit the sitemap, inspect key URLs, and note current impressions, clicks, and conversions.</InfoCard><InfoCard title="Week 2 · improve important pages">Choose a few pages with real business value. Improve intent match, content usefulness, titles, headings, metadata, and internal links.</InfoCard><InfoCard title="Week 3 · fix technical friction">Prioritize mobile usability, broken links, slow templates, oversized images, crawl blocks, and confusing canonical or redirect behavior.</InfoCard><InfoCard title="Week 4 · earn attention and review">Publish one genuinely helpful resource, share it with relevant people, request honest feedback, and compare Search Console data over time.</InfoCard></div>
            <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">Prioritize changes by impact and effort. Measure the page again after each round, and do not interpret a short-term ranking movement as proof that a single edit caused it.</p>
          </section>

          <section className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 sm:p-7 dark:border-emerald-900 dark:bg-emerald-950/25"><h2 className="text-xl font-semibold">Useful next steps</h2><div className="mt-4 grid gap-3 sm:grid-cols-3"><a href="https://www.toolsnap.tools/" target="_blank" rel="noopener noreferrer" className="group rounded-xl border border-white bg-white p-4 shadow-sm hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900"><span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Tool directory</span><span className="mt-2 block font-semibold text-slate-900 dark:text-white">Explore Toolsnap.tools <ArrowUpRight className="inline" size={15} /></span><span className="mt-1 block text-sm leading-5 text-slate-600 dark:text-slate-400">Browse the Toolsnap site for online utilities that may help with your web workflow.</span></a><a href="https://search.google.com/search-console" target="_blank" rel="noreferrer" className="rounded-xl border border-white bg-white p-4 shadow-sm hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900"><span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Indexing</span><span className="mt-2 block font-semibold text-slate-900 dark:text-white">Open Search Console <ArrowUpRight className="inline" size={15} /></span><span className="mt-1 block text-sm leading-5 text-slate-600 dark:text-slate-400">Inspect owned URLs, submit sitemaps, and monitor search performance.</span></a><Link href="/" className="rounded-xl border border-white bg-white p-4 shadow-sm hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900"><span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Start here</span><span className="mt-2 block font-semibold text-slate-900 dark:text-white">Run a SiteScope audit <ArrowUpRight className="inline" size={15} /></span><span className="mt-1 block text-sm leading-5 text-slate-600 dark:text-slate-400">Get a baseline for the technical and on-page checks covered in this guide.</span></Link></div></section>
        </div>
      </div>

      <footer className="mx-auto mt-12 max-w-6xl border-t border-slate-200 pt-5 text-center text-xs text-slate-500 dark:border-slate-800">SEO guidance is educational; no checklist can guarantee rankings. Only audit sites you own or have permission to test.</footer>
    </div>
  </main>;
}
