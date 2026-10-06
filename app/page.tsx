import { BarChart3, Gauge, Search, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import UrlForm from "@/components/UrlForm";

const features = [
  { icon: ShieldCheck, title: "Technical health", description: "HTTPS, crawlability, metadata, and structured data." },
  { icon: BarChart3, title: "Content signals", description: "Titles, headings, links, and accessible images." },
  { icon: Gauge, title: "Performance", description: "Fast, lightweight checks with optional PageSpeed data." },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden px-5 pb-14 pt-7 sm:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebApplication", name: "SiteScope", applicationCategory: "BusinessApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: "A free website SEO audit tool with clear recommendations." }) }} />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/70 via-slate-50 to-transparent dark:from-emerald-950/40 dark:via-slate-950 dark:to-transparent" />
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="grid size-9 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm"><Search size={18} /></span>
          <span>Site<span className="text-emerald-600">Scope</span></span>
        </Link>
        <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">Free website SEO audit</span>
      </header>

      <section className="mx-auto flex max-w-4xl flex-col items-center pb-14 pt-20 text-center sm:pt-28">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3.5 py-1.5 text-xs font-medium text-emerald-800 shadow-sm dark:border-emerald-900 dark:bg-slate-900/80 dark:text-emerald-300">
          <Sparkles size={14} /> Clear answers for a healthier website
        </div>
        <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-slate-950 sm:text-6xl dark:text-white">
          See what’s helping <span className="text-emerald-600">your site rank.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
          Get a practical SEO health check in seconds. Find technical issues, improve your content, and learn what to fix next.
        </p>

        <UrlForm />
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">No account needed · Results include clear, actionable recommendations</p>
        <Link href="/results?demo=1" className="mt-4 text-xs font-medium text-emerald-700 underline decoration-emerald-300 underline-offset-4 hover:text-emerald-800 dark:text-emerald-300">Explore a demo audit</Link>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-3" aria-label="Audit features">
        {features.map(({ icon: Icon, title, description }) => (
          <article key={title} className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <span className="mb-4 grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><Icon size={19} /></span>
            <h2 className="font-semibold text-slate-900 dark:text-white">{title}</h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-400">{description}</p>
          </article>
        ))}
      </section>

      <footer className="mx-auto mt-14 max-w-5xl border-t border-slate-200/80 pt-5 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        Only audit sites you own or have permission to test. <span className="mx-2">·</span> Built with Next.js
      </footer>
    </main>
  );
}
