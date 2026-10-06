"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

const examples = ["example.com", "stripe.com", "vercel.com"];

export default function UrlForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = value.trim();
    const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
      const url = new URL(normalized);
      if (!/^https?:$/.test(url.protocol) || !url.hostname.includes(".") || url.username || url.password) throw new Error("invalid");
      setError("");
      router.push(`/results?url=${encodeURIComponent(url.toString())}`);
    } catch {
      setError("Enter a valid website address, such as example.com.");
    }
  };

  return <>
    <form onSubmit={submit} className="mt-9 flex w-full max-w-2xl flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/5 sm:flex-row dark:border-slate-800 dark:bg-slate-900">
      <label htmlFor="url" className="sr-only">Website URL to audit</label>
      <input id="url" name="url" type="text" inputMode="url" autoComplete="url" placeholder="https://yourwebsite.com" value={value} onChange={(event) => { setValue(event.target.value); setError(""); }} aria-invalid={Boolean(error)} aria-describedby={error ? "url-error" : undefined} className="min-w-0 flex-1 rounded-xl bg-transparent px-4 py-3.5 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/30 dark:text-white" />
      <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 font-medium text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/30">
        Analyze website <ArrowRight size={17} />
      </button>
    </form>
    <p className={`mt-2 min-h-5 text-xs ${error ? "text-rose-700 dark:text-rose-300" : "text-slate-500 dark:text-slate-400"}`} id={error ? "url-error" : undefined} aria-live="polite">{error}</p>
    <div className="mt-3 grid w-full max-w-2xl grid-cols-2 gap-2 sm:grid-cols-3" aria-label="Try an example website">
      {examples.map((example) => <button key={example} type="button" onClick={() => { setValue(example); setError(""); }} className="rounded-lg border border-slate-200/80 bg-white/60 px-3 py-2 text-xs text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:text-emerald-300">Try {example}</button>)}
    </div>
  </>;
}
