"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { AlertCircle, ArrowLeft, ArrowRight, Check, CircleHelp, Download, ExternalLink, LoaderCircle, Moon, Printer, RefreshCw, Sparkles, Sun, X } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AuditResult, Category, CheckResult, Status } from "@/lib/audit/types";
import { demoAudit } from "@/lib/audit/demo";

const COLORS = { pass: "#10b981", warning: "#f59e0b", fail: "#ef4444", blue: "#3b82f6", slate: "#94a3b8" };
const CATEGORY_LABELS: Record<Category, string> = { technical: "Technical SEO", onpage: "On-page SEO", performance: "Performance", accessibility: "Accessibility" };
const statusOrder: Record<Status, number> = { fail: 0, warning: 1, pass: 2 };

function scoreName(score: number) { return score >= 90 ? "Excellent" : score >= 70 ? "Good" : score >= 50 ? "Needs work" : "Poor"; }
function scoreColor(score: number) { return score >= 90 ? COLORS.pass : score >= 70 ? "#84cc16" : score >= 50 ? COLORS.warning : COLORS.fail; }
function asString(value: unknown) { return typeof value === "string" ? value : ""; }
function formatTimestamp(value: string) { return `${new Date(value).toISOString().replace("T", " ").slice(0, 16)} UTC`; }
function checkIcon(status: Status) { return status === "pass" ? <Check size={15} /> : status === "warning" ? <CircleHelp size={15} /> : <X size={15} />; }

function LoadingScreen({ url }: { url: string }) {
  const steps = ["Fetching page…", "Checking technical SEO…", "Analyzing content…", "Testing a sample of links…", "Calculating your score…"];
  const [step, setStep] = useState(0);
  useEffect(() => { const id = setInterval(() => setStep((value) => Math.min(value + 1, steps.length - 1)), 1300); return () => clearInterval(id); }, [steps.length]);
  return <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-5 text-center"><span className="grid size-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><LoaderCircle size={26} className="animate-spin" /></span><h1 className="mt-6 text-2xl font-semibold">Checking your website</h1><p className="mt-2 max-w-lg break-all text-sm text-slate-500">{url}</p><ol aria-live="polite" className="mt-8 space-y-3 text-left">{steps.map((label, index) => <li key={label} className={`flex items-center gap-3 text-sm ${index <= step ? "text-emerald-700 dark:text-emerald-300" : "text-slate-400"}`}>{index < step ? <Check size={16} /> : index === step ? <LoaderCircle size={16} className="animate-spin" /> : <span className="size-4 rounded-full border border-current" />}{label}</li>)}</ol></main>;
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) { return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h2><div className="h-56">{children}</div></section>; }

export default function AuditDashboard({ initialUrl, demoMode }: { initialUrl: string; demoMode: boolean }) {
  const [audit, setAudit] = useState<AuditResult | null>(demoMode ? demoAudit : null);
  const [loading, setLoading] = useState(!demoMode);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | Category>("all");
  const [explanation, setExplanation] = useState("");
  const [explainSource, setExplainSource] = useState<"gemini" | "groq" | "fallback" | "">("");
  const [explaining, setExplaining] = useState(false);
  const [dark, setDark] = useState(false);

  const run = useCallback(async () => {
    if (demoMode) { setAudit(demoAudit); setLoading(false); return; }
    if (!initialUrl) { setError("Enter a website address to start an audit."); setLoading(false); return; }
    setLoading(true); setError(""); setAudit(null); setExplanation(""); setExplainSource("");
    try {
      const response = await fetch("/api/audit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url: initialUrl }) });
      const body: unknown = await response.json();
      if (!response.ok) {
        const message = body && typeof body === "object" && "error" in body ? asString(body.error) : "The audit could not be completed.";
        throw new Error(message || "The audit could not be completed.");
      }
      setAudit(body as AuditResult);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The audit could not be completed."); }
    finally { setLoading(false); }
  }, [demoMode, initialUrl]);

  useEffect(() => { const timer = window.setTimeout(() => { void run(); }, 0); return () => window.clearTimeout(timer); }, [run]);
  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);

  const filtered = useMemo(() => audit?.checks.filter((item) => (filter === "all" || item.status === filter) && (categoryFilter === "all" || item.category === categoryFilter)).sort((a, b) => statusOrder[a.status] - statusOrder[b.status] || ["high", "medium", "low"].indexOf(a.severity) - ["high", "medium", "low"].indexOf(b.severity)) ?? [], [audit, filter, categoryFilter]);

  const explain = async () => {
    if (!audit) return;
    setExplaining(true);
    try {
      const response = await fetch("/api/explain", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ audit }) });
      const result: unknown = await response.json();
      if (!response.ok || !result || typeof result !== "object") throw new Error("Could not generate the explanation.");
      setExplanation(asString("explanation" in result ? result.explanation : ""));
      setExplainSource(result && "source" in result && ["gemini", "groq", "fallback"].includes(asString(result.source)) ? result.source as "gemini" | "groq" | "fallback" : "fallback");
    } catch (reason) { setExplanation(reason instanceof Error ? reason.message : "Could not generate the explanation."); }
    finally { setExplaining(false); }
  };

  const exportJson = () => {
    if (!audit) return;
    const file = new Blob([JSON.stringify(audit, null, 2)], { type: "application/json" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(file); link.download = "sitescope-audit.json"; link.click(); URL.revokeObjectURL(link.href);
  };

  if (loading) return <LoadingScreen url={initialUrl} />;
  if (error || !audit) return <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-5 text-center"><span className="grid size-14 place-items-center rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"><AlertCircle size={26} /></span><h1 className="mt-5 text-2xl font-semibold">We couldn’t finish this audit</h1><p role="alert" className="mt-2 text-slate-600 dark:text-slate-300">{error || "No audit results are available."}</p><div className="mt-6 flex gap-3"><Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium"><ArrowLeft size={16} /> Back</Link><button onClick={() => void run()} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white"><RefreshCw size={15} /> Try again</button></div></main>;

  const severityData = (["high", "medium", "low"] as const).map((severity) => ({ name: severity, count: audit.checks.filter((item) => item.status !== "pass" && item.severity === severity).length }));
  const statusData = (["pass", "warning", "fail"] as const).map((status) => ({ name: status, value: audit.summary[status], color: COLORS[status] }));
  const categoryData = (Object.keys(CATEGORY_LABELS) as Category[]).map((key) => ({ name: CATEGORY_LABELS[key], score: audit.categoryScores[key] }));
  const performanceData = [{ name: "TTFB (ms)", value: audit.charts.performance.ttfbMs }, { name: "HTML (KB)", value: audit.charts.performance.htmlSizeKb }, { name: "Scripts", value: audit.charts.performance.scriptCount }, { name: "Images", value: audit.charts.performance.imageCount }];
  const linkData = [{ name: "OK", value: audit.charts.links.ok, color: COLORS.pass }, { name: "Redirected", value: audit.charts.links.redirected, color: COLORS.blue }, { name: "Broken", value: audit.charts.links.broken, color: COLORS.fail }, { name: "Skipped", value: audit.charts.links.skipped, color: COLORS.slate }].filter((item) => item.value > 0);
  const brokenIssues = audit.checks.find((check) => check.id === "broken-links")?.details?.issues;
  const brokenLinks = Array.isArray(brokenIssues) ? brokenIssues.filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object") : [];
  const color = scoreColor(audit.overallScore);

  return <main className="min-h-screen px-4 pb-14 pt-5 sm:px-7">
    <header className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800 print:hidden">
      <Link href="/" className="flex items-center gap-2 font-semibold"><Image src="/Logo/icon-48x48.png" alt="" width={32} height={32} className="size-8 object-contain" />Site<span className="-ml-2 text-emerald-600">Scope</span></Link>
      <div className="flex flex-wrap items-center gap-2"><Link href="/learn" className="rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 hover:text-emerald-700 dark:text-slate-300">SEO guide</Link><button onClick={() => setDark((value) => !value)} aria-label="Toggle dark mode" className="rounded-lg border border-slate-200 p-2 dark:border-slate-700">{dark ? <Sun size={16} /> : <Moon size={16} />}</button><button onClick={() => void run()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium dark:border-slate-700"><RefreshCw size={15} /> Re-run</button><button onClick={exportJson} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium dark:border-slate-700"><Download size={15} /> Export JSON</button><button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium dark:border-slate-700"><Printer size={15} /> Print / PDF</button></div>
    </header>

    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-center justify-between gap-4 py-6"><div><Link href="/" className="mb-3 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-700 print:hidden"><ArrowLeft size={13} /> New audit</Link><h1 className="max-w-3xl break-all text-xl font-semibold tracking-tight sm:text-2xl">SEO audit: <a href={audit.url} target="_blank" rel="noreferrer" className="text-emerald-700 dark:text-emerald-400">{audit.url}<ExternalLink className="ml-1 inline" size={15} /></a></h1><p className="mt-1 text-sm text-slate-500">Audited {formatTimestamp(audit.auditedAt)} · {audit.durationMs} ms{demoMode ? " · Demo results" : ""}</p></div><Link href="/?demo=1" className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:border-emerald-400 dark:border-slate-700 dark:text-slate-300 print:hidden">View demo <ArrowRight className="ml-1 inline" size={14} /></Link></div>

      <section className="grid gap-5 lg:grid-cols-[0.85fr_1.5fr]">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="relative h-52 w-full max-w-xs"><ResponsiveContainer width="100%" height="100%"><RadialBarChart innerRadius="75%" outerRadius="100%" data={[{ value: audit.overallScore, fill: color }]} startAngle={90} endAngle={-270} barSize={17}><RadialBar background={{ fill: "#e2e8f0" }} dataKey="value" cornerRadius={12} /></RadialBarChart></ResponsiveContainer><div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-5xl font-semibold tracking-tight" style={{ color }}>{audit.overallScore}</span><span className="text-sm text-slate-500">out of 100</span></div></div>
          <span className="-mt-2 rounded-full px-3 py-1 text-sm font-semibold" style={{ color, backgroundColor: `${color}18` }}>{scoreName(audit.overallScore)}</span><p className="mt-3 text-center text-sm text-slate-500">{audit.summary.pass} passed · {audit.summary.warning} warnings · {audit.summary.fail} failed</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{(Object.keys(CATEGORY_LABELS) as Category[]).map((key) => <article key={key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between gap-3"><h2 className="text-sm font-medium text-slate-600 dark:text-slate-300">{CATEGORY_LABELS[key]}</h2><span className="text-xl font-semibold" style={{ color: scoreColor(audit.categoryScores[key]) }}>{audit.categoryScores[key]}<span className="text-xs">%</span></span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full transition-all" style={{ width: `${audit.categoryScores[key]}%`, backgroundColor: scoreColor(audit.categoryScores[key]) }} /></div></article>)}</div>
      </section>

      {audit.pageSpeed && <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Google PageSpeed Insights</h2><p className="mt-1 text-xs text-slate-500">Mobile Lighthouse measurements</p></div><span className="text-2xl font-semibold" style={{ color: scoreColor(audit.pageSpeed.performanceScore) }}>{audit.pageSpeed.performanceScore}<span className="text-sm">/100</span></span></div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric label="Largest contentful paint" value={audit.pageSpeed.lcpMs} suffix="ms" /><Metric label="Cumulative layout shift" value={audit.pageSpeed.clsValue} /><Metric label="Blocking time" value={audit.pageSpeed.tbtMs} suffix="ms" /><Metric label="First contentful paint" value={audit.pageSpeed.fcpMs} suffix="ms" /></div></section>}

      <section aria-label="Audit charts" className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ChartCard title="Scores by category"><ResponsiveContainer><BarChart data={categoryData} layout="vertical" margin={{ left: 16, right: 24 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} /><YAxis type="category" dataKey="name" width={105} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="score" name="Score" radius={[0, 7, 7, 0]}>{categoryData.map((entry) => <Cell key={entry.name} fill={scoreColor(entry.score)} />)}</Bar></BarChart></ResponsiveContainer></ChartCard>
        <ChartCard title="Check results"><ResponsiveContainer><PieChart><Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={4}>{statusData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie><Tooltip /><Legend verticalAlign="bottom" height={28} /></PieChart></ResponsiveContainer></ChartCard>
        <ChartCard title="Issues by severity"><ResponsiveContainer><BarChart data={severityData} margin={{ top: 6, right: 12, left: -16, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="count" name="Issues" radius={[6, 6, 0, 0]}>{severityData.map((entry, index) => <Cell key={entry.name} fill={[COLORS.fail, COLORS.warning, COLORS.blue][index]} />)}</Bar></BarChart></ResponsiveContainer></ChartCard>
        <ChartCard title="Heading structure"><ResponsiveContainer><BarChart data={Object.entries(audit.charts.headingCounts).map(([name, count]) => ({ name: name.toUpperCase(), count }))} margin={{ top: 6, right: 12, left: -16, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="count" name="Headings" fill={COLORS.blue} radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard>
        <ChartCard title="Performance indicators"><ResponsiveContainer><BarChart data={performanceData} layout="vertical" margin={{ left: 12, right: 14 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tick={{ fontSize: 11 }} /><YAxis type="category" dataKey="name" width={78} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="value" name="Value" fill={COLORS.blue} radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer></ChartCard>
        <ChartCard title="Sampled link health"><ResponsiveContainer><PieChart><Pie data={linkData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={4}>{linkData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie><Tooltip /><Legend verticalAlign="bottom" height={28} /></PieChart></ResponsiveContainer></ChartCard>
      </section>

      <section className="mt-8"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-semibold">Recommendations</h2><p className="mt-1 text-sm text-slate-500">Specific checks, ordered by impact. Expand an item to see what to do.</p></div><div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter recommendations"><label htmlFor="category-filter" className="sr-only">Filter category</label><select id="category-filter" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as "all" | Category)} className="mr-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900">{["all", ...Object.keys(CATEGORY_LABELS)].map((value) => <option key={value} value={value}>{value === "all" ? "All categories" : CATEGORY_LABELS[value as Category]}</option>)}</select>{(["all", "fail", "warning", "pass"] as const).map((value) => <button key={value} onClick={() => setFilter(value)} className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize ${filter === value ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"}`}>{value}{value === "all" ? ` (${audit.checks.length})` : ` (${audit.summary[value]})`}</button>)}</div></div>
      <div className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">{filtered.map((item) => <Recommendation key={item.id} item={item} />)}{filtered.length === 0 && <p className="p-6 text-sm text-slate-500">No checks match this filter.</p>}</div>
      </section>

      {brokenLinks.length > 0 && <section className="mt-8"><h2 className="text-xl font-semibold">Broken links</h2><p className="mt-1 text-sm text-slate-500">Checked up to 30 links to keep results fast.</p><div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800"><tr><th className="px-4 py-3">URL</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Found on</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{brokenLinks.map((entry, index) => <tr key={`${asString(entry.url)}-${index}`}><td className="max-w-sm truncate px-4 py-3 text-rose-700 dark:text-rose-300">{asString(entry.url)}</td><td className="px-4 py-3">{String(entry.status ?? "unreachable")}</td><td className="max-w-sm truncate px-4 py-3">{asString(entry.foundOn)}</td></tr>)}</tbody></table></div></section>}

      <section className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 dark:border-emerald-900 dark:bg-emerald-950/30"><div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-300"><Sparkles size={19} /></span><div><h2 className="font-semibold">Explain my SEO results</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Get a short plain-language summary of the most important fixes.</p></div></div>{!explanation && <button onClick={() => void explain()} disabled={explaining} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60">{explaining ? <><LoaderCircle size={16} className="animate-spin" /> Thinking…</> : "Explain my SEO problems"}</button>}</div>{explanation && <div aria-live="polite" className="mt-5 whitespace-pre-line rounded-xl border border-emerald-100 bg-white p-4 text-sm leading-7 dark:border-emerald-900 dark:bg-slate-900">{explanation}{explainSource === "fallback" && <p className="mt-3 text-xs text-slate-500">Generated by rule-based fallback</p>}</div>}</section>
      <footer className="mt-10 border-t border-slate-200 pt-5 text-center text-xs text-slate-500 dark:border-slate-800">Only audit sites you own or have permission to test. <span className="mx-2">·</span> Built with Next.js</footer>
    </div>
  </main>;
}

function Recommendation({ item }: { item: CheckResult }) {
  return <details className="group p-4 sm:p-5"><summary className="flex cursor-pointer list-none items-start gap-3"><span className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full ${item.status === "pass" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : item.status === "warning" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"}`}>{checkIcon(item.status)}</span><span className="min-w-0 flex-1"><span className="block font-medium text-slate-900 dark:text-white">{item.message}</span><span className="mt-1 block text-xs text-slate-500">{CATEGORY_LABELS[item.category]} <span className="mx-1">·</span> {item.title}</span></span><span className="flex shrink-0 items-center gap-2"><span className="hidden rounded-full bg-slate-100 px-2 py-1 text-[10px] uppercase text-slate-600 sm:inline-flex dark:bg-slate-800 dark:text-slate-300">{item.severity}</span><span className="text-xs text-slate-400 transition group-open:rotate-90">›</span></span></summary><p className="ml-10 mt-3 border-l-2 border-slate-100 pl-3 text-sm leading-6 text-slate-600 dark:border-slate-800 dark:text-slate-300"><strong className="text-slate-800 dark:text-slate-100">How to fix: </strong>{item.recommendation || "Review this page and make the recommended improvement."}</p></details>;
}

function Metric({ label, value, suffix }: { label: string; value?: number; suffix?: string }) {
  return <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-lg font-semibold">{value === undefined ? "—" : `${Number(value.toFixed(2))}${suffix ? ` ${suffix}` : ""}`}</p></div>;
}
