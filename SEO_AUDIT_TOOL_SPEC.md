# Website SEO Audit Tool — Build Spec (for Codex)

> Read this whole file first. Then build the project step by step following the **Build Order** at the bottom. After each phase, run the app, fix errors, and commit before moving on.

## 1. Goal

A free, deployable web app where a user enters a URL (e.g. `https://example.com`) and receives:

1. An overall **SEO score (0–100)**
2. **Category scores**: Technical SEO, On-page SEO, Performance, Accessibility
3. A list of **recommendations** (warnings, errors, passes)
4. An **AI explanation** in simple language
5. **Charts and visualizations** of the results

This is a portfolio project with low traffic. Everything must run on **free tiers only** (hosting, AI, APIs). No paid services, no credit card required.

## 2. Tech Stack (all free)

| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js 14+ (App Router) + TypeScript** | Frontend + serverless API in one repo |
| Styling | **Tailwind CSS** (+ optional shadcn/ui) | Fast, clean UI |
| Charts | **Recharts** | Simple React charts |
| HTML parsing | **cheerio** | Server-side DOM parsing |
| Validation | **zod** | Input/output validation |
| Hosting | **Vercel Hobby (free)** | One-click Next.js deploy |
| AI | **Google Gemini API free tier** (`gemini-2.5-flash` or current free flash model) via `@google/generative-ai`, with Groq free tier as an optional alternative | Free key, no card |
| Page speed (optional) | **Google PageSpeed Insights API** (free key) | Real Lighthouse data |
| Rate limiting | In-memory limiter (default); optional **Upstash Redis free tier** | Protect free quotas |

**Why a backend is required:** browsers block cross-origin fetches (CORS), so the audit must run server-side in a Next.js Route Handler. The browser only calls our own `/api/audit`.

**Constraint:** Vercel Hobby serverless functions have a limited execution time. Keep the whole audit under ~10 seconds by using timeouts, concurrency limits, and caps (see section 5). Set `export const maxDuration = 30;` in the route and keep the real work well below that.

## 3. Project Structure

```
seo-audit-tool/
├─ app/
│  ├─ page.tsx                  # Landing page + URL form
│  ├─ results/page.tsx          # (optional) results view, or render on same page
│  ├─ api/
│  │  ├─ audit/route.ts         # POST: runs the audit, returns JSON
│  │  └─ explain/route.ts       # POST: AI explanation of audit results
│  ├─ layout.tsx
│  └─ globals.css
├─ components/
│  ├─ UrlForm.tsx
│  ├─ ScoreGauge.tsx            # big radial 0–100 gauge
│  ├─ CategoryCards.tsx         # 4 category scores with progress bars
│  ├─ Charts/
│  │  ├─ CategoryBarChart.tsx
│  │  ├─ StatusDonut.tsx        # pass / warning / fail
│  │  ├─ SeverityBarChart.tsx
│  │  ├─ HeadingStructureChart.tsx
│  │  └─ PerformanceChart.tsx
│  ├─ Recommendations.tsx       # grouped list with icons + filters
│  ├─ AiExplanation.tsx
│  ├─ LoadingState.tsx          # step-by-step progress UI
│  └─ ErrorState.tsx
├─ lib/
│  ├─ audit/
│  │  ├─ index.ts               # orchestrates all checks
│  │  ├─ fetchPage.ts           # safe fetch w/ timeout, redirects, size cap
│  │  ├─ ssrf.ts                # URL validation / private IP blocking
│  │  ├─ scoring.ts             # score calculation
│  │  ├─ types.ts               # shared types
│  │  └─ checks/
│  │     ├─ technical.ts        # https, robots, sitemap, canonical, status, redirects
│  │     ├─ onpage.ts           # title, description, headings, OG, content
│  │     ├─ performance.ts      # TTFB, size, compression, scripts, PSI
│  │     ├─ accessibility.ts    # alt text, lang, labels, link text
│  │     └─ links.ts            # broken link checker
│  ├─ ai/
│  │  ├─ explain.ts             # provider abstraction (Gemini / Groq / fallback)
│  │  └─ fallback.ts            # rule-based explanations when no AI key
│  ├─ rateLimit.ts
│  └─ utils.ts
├─ .env.example
├─ README.md
└─ package.json
```

## 4. Data Model

```ts
// lib/audit/types.ts
export type Status = "pass" | "warning" | "fail";
export type Category = "technical" | "onpage" | "performance" | "accessibility";
export type Severity = "high" | "medium" | "low";

export interface CheckResult {
  id: string;                 // e.g. "meta-description"
  category: Category;
  title: string;              // "Meta description"
  status: Status;
  severity: Severity;         // impact if not passing
  score: number;              // 0..1 for this check (partial credit allowed)
  weight: number;             // relative weight inside its category
  message: string;            // human message, e.g. "Missing meta description on /products"
  recommendation?: string;    // how to fix
  details?: Record<string, unknown>; // raw data for charts/debugging
}

export interface AuditResult {
  url: string;                // final URL after redirects
  requestedUrl: string;
  auditedAt: string;          // ISO date
  durationMs: number;
  overallScore: number;       // 0..100 integer
  categoryScores: Record<Category, number>; // 0..100 integer each
  checks: CheckResult[];
  summary: { pass: number; warning: number; fail: number };
  charts: {
    headingCounts: { h1: number; h2: number; h3: number; h4: number; h5: number; h6: number };
    performance: { ttfbMs: number; htmlSizeKb: number; scriptCount: number; stylesheetCount: number; imageCount: number; totalLinks: number };
    links: { ok: number; broken: number; redirected: number; skipped: number };
  };
  pageSpeed?: { performanceScore: number; lcpMs?: number; clsValue?: number; tbtMs?: number; fcpMs?: number; source: "psi" };
}
```

## 5. Audit Checks

All checks must be fault tolerant: if one check throws, mark it as `warning` with message "Could not run this check" and continue. Never let a single failure crash the audit.

### 5.1 Fetching the page (`fetchPage.ts`)
- Normalize input: if no protocol, prepend `https://`. Trim whitespace.
- Use `fetch` with `redirect: "follow"`, `AbortController` timeout of **8s**, a custom User-Agent such as `SEOAuditBot/1.0 (+portfolio project)`.
- Measure **TTFB / total response time** with `performance.now()`.
- Cap body size at **2 MB** (stream and abort if exceeded).
- Record: final URL, status code, redirect chain count, response headers (`content-encoding`, `cache-control`, `content-type`, `x-robots-tag`), HTML string.
- If response is not HTML or status >= 400, return a clear error to the UI.

### 5.2 Technical SEO (`technical.ts`)
| Check id | Logic | Pass / Warn / Fail |
|---|---|---|
| `https` | Final URL uses `https:` | pass if https; fail if http |
| `http-redirect` | Request `http://` version; does it redirect to https? | pass if yes; warning if not |
| `status-code` | Final status 200 | pass 200; warning for 3xx chain >2; fail 4xx/5xx |
| `canonical` | `<link rel="canonical">` exists, is absolute, matches (or sensibly relates to) page URL | pass present+valid; warning present but different/relative; fail missing (use warning if page is clearly the homepage) |
| `robots-txt` | Fetch `/robots.txt` (timeout 5s). Exists, status 200, plain text. Parse for `Sitemap:` lines and detect `Disallow: /` for `User-agent: *` | pass exists; warning missing; fail if site-wide disallow |
| `sitemap` | Look at `Sitemap:` from robots.txt, else try `/sitemap.xml`. Verify it returns XML with `<urlset>` or `<sitemapindex>`. Count URLs if possible | pass found; warning missing |
| `meta-robots` | `<meta name="robots">` and `X-Robots-Tag` header; flag `noindex` | fail if noindex; pass otherwise |
| `viewport` | `<meta name="viewport">` present | pass / fail |
| `structured-data` | Count `<script type="application/ld+json">` blocks, ensure valid JSON | pass if ≥1 valid; warning if none; warning if invalid JSON |
| `lang-hreflang` | (bonus) report `hreflang` links if present | info only, pass |

### 5.3 On-page SEO (`onpage.ts`)
| Check id | Logic |
|---|---|
| `title` | Exists; ideal length **30–60 chars**. Missing = fail; <30 or >60 = warning |
| `meta-description` | Exists; ideal **70–160 chars**. Missing = fail; outside range = warning. Message should include the page path, e.g. `Missing meta description on /products` |
| `h1` | Exactly one `<h1>`. None = fail; multiple = warning |
| `heading-structure` | Build heading outline. Warn on skipped levels (e.g. h1 → h3), empty headings, h1 not first heading. Store counts of h1–h6 for chart |
| `open-graph` | `og:title`, `og:description`, `og:image` present; partial credit by how many exist |
| `twitter-card` | `twitter:card` present (low severity) |
| `word-count` | Visible text word count. <300 = warning (thin content) |
| `internal-links` | At least a few internal links present; warn if 0 |
| `url-quality` | URL length <100 chars, no excessive params/underscores (low severity) |
| `favicon` | `<link rel="icon">` exists (low severity) |

### 5.4 Performance indicators (`performance.ts`)
Own lightweight measurements (always run):
| Check id | Logic |
|---|---|
| `response-time` | TTFB/total response time: <600ms pass, 600–1500ms warning, >1500ms fail |
| `html-size` | HTML size: <100KB pass, 100–500KB warning, >500KB fail |
| `compression` | `content-encoding` is `gzip`, `br`, or `zstd` → pass; else warning |
| `caching-headers` | `cache-control` or `etag` present → pass; else warning (low severity) |
| `script-count` | Count `<script src>`: <15 pass, 15–30 warning, >30 fail |
| `render-blocking` | Count `<script src>` in `<head>` without `async`/`defer`, and blocking stylesheets. >0 scripts = warning |
| `image-optimization` | Count images missing `width`/`height` (layout shift risk) and missing `loading="lazy"` below the fold (approximate: all except first 2). Warn if many |
| `modern-image-formats` | Share of images using webp/avif (by extension) — info/warning |

**Optional Google PageSpeed Insights** (only if `PSI_API_KEY` is set):
- Call `https://www.googleapis.com/pagespeedonline/v5/runPaginatedTest`? **No** — use `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=...&strategy=mobile&category=performance&key=...`
- Timeout 20s. Extract `lighthouseResult.categories.performance.score`, LCP, CLS, TBT, FCP.
- If PSI succeeds, blend: `performanceCategoryScore = 0.5 * ownScore + 0.5 * psiScore*100`. If PSI fails or is not configured, use own score only and do not show an error.
- Because PSI can be slow, run it **in parallel** with other checks via `Promise.allSettled`.

### 5.5 Accessibility (`accessibility.ts`)
| Check id | Logic |
|---|---|
| `image-alt` | Count `<img>` without `alt` attribute. Missing = fail. Message: `12 images don't have ALT text`. Empty `alt=""` is allowed (decorative) — count separately |
| `html-lang` | `<html lang="...">` present |
| `form-labels` | Inputs (not hidden/submit/button) have `<label for>`, wrapping label, `aria-label`, or `aria-labelledby` |
| `link-text` | Flag links with empty text or generic text ("click here", "read more", "here") |
| `button-names` | Buttons have accessible text or aria-label |
| `landmarks` | Presence of `<main>`, `<nav>`, `<header>`/`<footer>` (or ARIA roles) |
| `document-title` | `<title>` exists (shared with on-page, but counted here for a11y) |
| `zoom-allowed` | Viewport does not disable zoom (`user-scalable=no` or `maximum-scale=1`) |

### 5.6 Broken links (`links.ts`)
- Collect all `<a href>`; resolve relative to final URL; skip `mailto:`, `tel:`, `javascript:`, `#` anchors.
- Dedupe. **Cap at 30 links** (prefer internal links first, then external).
- Check with `HEAD` (fallback to `GET` with `Range: bytes=0-0` if HEAD returns 405/403/501). **Timeout 5s each, concurrency 6** (write a small concurrency pool, no extra dependency required).
- Classify: `ok` (2xx), `redirected` (3xx final), `broken` (4xx/5xx/timeout/DNS error).
- Every link goes through the SSRF validation (section 6).
- Report the list of broken links (url + status + where found) in `details`.
- Scoring: `1 - brokenRatio`; any broken internal link makes status `fail`, only broken external makes `warning`.
- Note in the UI: "Checked up to 30 links to keep results fast."

## 6. Security (IMPORTANT — this app fetches arbitrary URLs)

Implement `lib/audit/ssrf.ts` and use it on **every** outbound request (page, robots, sitemap, each link, redirects):

1. Allow only `http:` and `https:` protocols.
2. Reject `localhost`, `*.local`, `*.internal`, and credentials in URL (`user:pass@`).
3. Resolve DNS (`dns.promises.lookup` with `all: true`) and **reject private/reserved IP ranges**: `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16` (cloud metadata), `0.0.0.0/8`, `100.64.0.0/10`, IPv6 `::1`, `fc00::/7`, `fe80::/10`, and IPv4-mapped IPv6.
4. Handle redirects **manually** (`redirect: "manual"`, max 5 hops) and re-validate each hop, so a public URL cannot redirect to an internal one.
5. Enforce timeouts and max response size everywhere.
6. Use `export const runtime = "nodejs"` for the audit route (needs `dns`).
7. Validate request body with zod (`url` string, max 2048 chars).
8. **Rate limit** `/api/audit` and `/api/explain`: e.g. 5 audits per IP per 10 minutes (in-memory `Map`; mention in README that serverless instances don't share memory and Upstash is the upgrade path).
9. Never expose stack traces or secrets to the client. API keys only in server env vars (never `NEXT_PUBLIC_`).
10. Add a small footer note: "Only audit sites you own or have permission to test."

## 7. Scoring (`scoring.ts`)

Each check has `score` in `0..1` (pass = 1, warning ≈ 0.5, fail = 0, with partial credit where natural, e.g. 2/3 OG tags = 0.66) and a `weight`.

```
categoryScore = round( sum(check.score * check.weight) / sum(check.weight) * 100 )
overallScore  = round( technical*0.30 + onpage*0.30 + performance*0.20 + accessibility*0.20 )
```

Default weights (adjust inside each check file, keep as constants at top for easy tuning):
- Critical (https, title, meta-description, h1, noindex, status-code, image-alt): **3**
- Important (canonical, robots, sitemap, heading-structure, response-time, viewport, broken-links): **2**
- Nice-to-have (everything else): **1**

Score label colors: 90–100 green "Excellent", 70–89 yellow-green "Good", 50–69 orange "Needs work", <50 red "Poor".

## 8. AI Explanation

### 8.1 Endpoint `POST /api/explain`
- Input: the `AuditResult` (or a trimmed version: url, scores, and only non-passing checks with their messages).
- **Trim the payload** before sending to the model (max ~30 issues) to save free-tier tokens.
- Output: `{ explanation: string, source: "gemini" | "groq" | "fallback" }`.

### 8.2 Provider abstraction (`lib/ai/explain.ts`)
1. If `GEMINI_API_KEY` exists → call Gemini.
2. Else if `GROQ_API_KEY` exists → call Groq (OpenAI-compatible endpoint, model like `llama-3.1-8b-instant`).
3. On any error, rate limit, or missing keys → use `fallback.ts`, a **rule-based explainer** with a plain-language template per check id (e.g. `image-alt` → "Your website has {n} images without ALT text. ALT text helps search engines understand images and also improves accessibility."). The app must work fully with no AI key.

### 8.3 Prompt (use as system/instruction text)
```
You are a friendly SEO coach explaining a website audit to a non-technical business owner.
Rules:
- Use simple language, no jargon. If you must use a term, explain it in a few words.
- Start with one sentence summarizing overall health.
- Then explain the top 3–5 most important problems, most impactful first.
- For each: what it is, why it matters, and one concrete fix.
- End with one encouraging next step.
- Max 250 words. Use short paragraphs or a short bullet list. Do not invent problems that are not in the data.
```
User message = JSON of the trimmed audit.

### 8.4 UI
- "Explain my SEO problems in simple language" button (don't auto-call; saves quota).
- Show a typing/loading skeleton, then the text in a card with an "AI" badge. Show a small "Generated by rule-based fallback" note when `source === "fallback"`.
- Cache the explanation in component state so re-clicking doesn't re-call the API.

## 9. UI / UX Requirements

**Style:** modern, clean, responsive (mobile first), dark/light mode toggle (Tailwind `dark:` classes), rounded cards, subtle shadows, smooth transitions.

### Landing / form
- Hero: product name, one-line tagline, large URL input + "Analyze" button.
- Client-side URL validation with friendly errors; auto-add `https://`.
- A few "Try an example" buttons that fill the input.
- Short feature row (what is checked).

### Loading state
Show animated step list while waiting (purely cosmetic, timed): "Fetching page… Checking technical SEO… Analyzing content… Testing links… Calculating score…". Disable the button while loading.

### Results dashboard (in this order)
1. **Header bar**: audited URL, timestamp, duration, "Re-run" and "Export JSON" / "Print / Save as PDF" buttons (use `window.print()` with a print stylesheet; no paid PDF service).
2. **Overall score**: large radial gauge (Recharts `RadialBarChart`) with the number `87/100` and label (Excellent/Good/…), colored by score.
3. **Category cards** (4): Technical SEO, On-page SEO, Performance, Accessibility — each with percentage, colored progress bar, and icon.
4. **Charts grid**:
   - **Category bar chart** (scores per category)
   - **Status donut** (pass / warning / fail counts)
   - **Issues by severity** bar chart (high/medium/low among non-passing checks)
   - **Heading structure** bar chart (h1–h6 counts)
   - **Performance metrics** chart (TTFB, HTML size, scripts, etc. — a horizontal bar chart or small stat tiles with threshold coloring)
   - **Link health** donut (ok / redirected / broken / skipped)
5. **Recommendations**: grouped by category with tabs or filter chips (All / Fail / Warning / Pass). Each item shows icon (`⚠` warning, `✗` fail, `✓` pass), message, severity badge, and expandable "How to fix" text. Sort: fail → warning → pass, then by severity.
   Example items:
   - ⚠ Missing meta description on /products
   - ⚠ 12 images don't have ALT text
   - ✓ Sitemap detected
   - ✓ HTTPS enabled
6. **Broken links table** (if any): URL, status, found on.
7. **AI explanation card** with the button described above.
8. Footer: disclaimer, GitHub link placeholder, "Built with Next.js".

### States
- Empty, loading, error (unreachable site, blocked URL, timeout, non-HTML, rate limited — each with a clear human message), and success.
- Accessible: semantic HTML, labels, focus rings, `aria-live` for loading/errors, sufficient color contrast (don't rely on color alone — always pair with icons/text).

## 10. API Contracts

### `POST /api/audit`
Request: `{ "url": "https://example.com" }`
Success `200`: `AuditResult`
Errors: `400 { error: "Invalid URL" }`, `422 { error: "That address isn't allowed" }`, `429 { error: "Too many requests, try again later" }`, `502 { error: "Could not reach the website" }`, `504 { error: "The website took too long to respond" }`

### `POST /api/explain`
Request: `{ "audit": <AuditResult or trimmed> }`
Success `200`: `{ "explanation": string, "source": "gemini" | "groq" | "fallback" }`

## 11. Environment Variables (`.env.example`)

```
# Optional — AI explanations (app works without them using rule-based fallback)
GEMINI_API_KEY=
GROQ_API_KEY=

# Optional — real Lighthouse performance data from Google PageSpeed Insights
PSI_API_KEY=

# Optional — shared rate limiting across serverless instances
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

## 12. Deployment (free)

1. Push to GitHub.
2. Import the repo in **Vercel** (Hobby plan) → framework auto-detected.
3. Add env vars in Vercel project settings.
4. Deploy. Optionally add a free `*.vercel.app` URL to the portfolio.
5. Get free keys: Gemini → Google AI Studio; PSI → Google Cloud Console (enable PageSpeed Insights API); Groq → console.groq.com.

Write these steps in the project `README.md`, plus screenshots placeholders, a feature list, an architecture diagram (Mermaid), and a "Limitations" section (30-link cap, JS-rendered pages are not executed, serverless time limits, in-memory rate limit).

## 13. Known Limitations (document honestly in README)

- Pages rendered only by client-side JavaScript (SPAs) will appear mostly empty because we fetch raw HTML, not a rendered DOM. Show a warning when the HTML body has very little text but many scripts.
- Only a sample of links is checked.
- Own performance metrics are indicators, not true Core Web Vitals; PSI gives real data when configured.
- Some sites block bots; report this clearly (403/429 from target) instead of a generic error.

## 14. Quality Requirements

- TypeScript strict mode, no `any` in lib code.
- ESLint + Prettier configured.
- **Unit tests (Vitest)** for: scoring math, SSRF validator (private IP cases), title/meta length rules, heading-structure analysis, URL normalization, alt-text counting. Use static HTML fixtures (good page, bad page).
- A `fixtures/` folder with 2–3 sample HTML files to test checks without network.
- Add a **"Demo mode"** (`?demo=1` or a button) that loads a bundled sample `AuditResult` JSON so the dashboard can be shown in the portfolio even if rate limits are hit or the API is down.
- Keep components small and typed; extract constants for thresholds.

## 15. Build Order (follow in sequence)

1. **Scaffold**: `npx create-next-app@latest` (TypeScript, Tailwind, App Router, ESLint). Install `cheerio zod recharts lucide-react`; dev: `vitest`.
2. **Types + SSRF + fetchPage** with tests.
3. **Checks**: technical → on-page → accessibility → performance → links. Test each against fixtures.
4. **Scoring + orchestrator** (`lib/audit/index.ts`) using `Promise.allSettled`; wire `/api/audit` with zod + rate limit.
5. **Frontend**: form, loading state, score gauge, category cards, recommendations list.
6. **Charts** (all six listed above), responsive grid, dark mode.
7. **AI**: fallback explainer first, then Gemini/Groq provider, `/api/explain`, UI card.
8. **Optional PSI integration**.
9. **Polish**: error states, demo mode, print stylesheet, export JSON, accessibility pass, SEO/meta tags for the tool's own site (eat your own dog food — the tool should score well on itself).
10. **README + deploy** to Vercel.

## 16. Definition of Done

- [ ] Entering a public URL returns a full dashboard in under ~10–15 seconds.
- [ ] Overall score and 4 category scores shown with gauge, cards, and at least 5 charts.
- [ ] Recommendations list shows warnings/failures/passes with fix guidance.
- [ ] AI explanation works with a key, and degrades to rule-based text without one.
- [ ] Private/internal URLs (`localhost`, `127.0.0.1`, `169.254.169.254`, etc.) are rejected.
- [ ] Rate limiting active; no secrets exposed to the client.
- [ ] Unit tests pass (`npm test`), `npm run build` succeeds, no lint errors.
- [ ] Deployed on Vercel free tier with README and demo mode.
- [ ] Running the tool on its own deployed URL scores 90+.
