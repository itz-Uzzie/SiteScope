import type { AuditResult } from "../audit/types";
import { explainWithRules } from "./fallback";

export interface ExplanationInput { url: string; overallScore: number; categoryScores: AuditResult["categoryScores"]; checks: AuditResult["checks"] }
export interface Explanation { explanation: string; source: "gemini" | "groq" | "fallback" }

const instruction = "You are a friendly SEO coach explaining a website audit to a non-technical business owner. Use simple language and no jargon. Start with one sentence summarizing overall health. Explain the 3–5 most important problems, most impactful first; say what each is, why it matters, and one concrete fix. End with one encouraging next step. Use at most 250 words. Do not invent problems not in the data.";

function trimAudit(audit: ExplanationInput) {
  return { url: audit.url, overallScore: audit.overallScore, categoryScores: audit.categoryScores, issues: audit.checks.filter((item) => item.status !== "pass").slice(0, 30).map(({ id, category, title, status, severity, message, recommendation }) => ({ id, category, title, status, severity, message, recommendation })) };
}

async function requestJson(url: string, headers: HeadersInit, body: unknown): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal: controller.signal });
    if (!response.ok) throw new Error("AI provider request failed");
    const value: unknown = await response.json();
    if (!value || typeof value !== "object") throw new Error("Invalid AI response");
    return value as Record<string, unknown>;
  } finally { clearTimeout(timer); }
}

export async function explainAudit(audit: ExplanationInput): Promise<Explanation> {
  const data = trimAudit(audit);
  try {
    if (process.env.GEMINI_API_KEY) {
      const response = await requestJson(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, { "content-type": "application/json" }, {
        systemInstruction: { parts: [{ text: instruction }] }, contents: [{ role: "user", parts: [{ text: JSON.stringify(data) }] }], generationConfig: { maxOutputTokens: 500, temperature: 0.4 },
      });
      const candidates = response.candidates as { content?: { parts?: { text?: string }[] } }[] | undefined;
      const text = candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
      if (text) return { explanation: text, source: "gemini" };
    } else if (process.env.GROQ_API_KEY) {
      const response = await requestJson("https://api.groq.com/openai/v1/chat/completions", { "content-type": "application/json", authorization: `Bearer ${process.env.GROQ_API_KEY}` }, {
        model: "llama-3.1-8b-instant", temperature: 0.4, max_tokens: 500,
        messages: [{ role: "system", content: instruction }, { role: "user", content: JSON.stringify(data) }],
      });
      const choices = response.choices as { message?: { content?: string } }[] | undefined;
      const text = choices?.[0]?.message?.content?.trim();
      if (text) return { explanation: text, source: "groq" };
    }
  } catch { /* Provider outages, quota errors, or malformed output fall back safely. */ }
  return { explanation: explainWithRules(audit), source: "fallback" };
}
