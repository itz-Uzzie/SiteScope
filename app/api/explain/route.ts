import { NextResponse } from "next/server";
import { z } from "zod";
import { explainAudit } from "@/lib/ai/explain";
import { clientIp, rateLimit } from "@/lib/rateLimit";

const checkSchema = z.object({
  id: z.string().max(100), category: z.enum(["technical", "onpage", "performance", "accessibility"]), title: z.string().max(200),
  status: z.enum(["pass", "warning", "fail"]), severity: z.enum(["high", "medium", "low"]), score: z.number().min(0).max(1), weight: z.number().min(0).max(10),
  message: z.string().max(500), recommendation: z.string().max(500).optional(),
});
const schema = z.object({ audit: z.object({ url: z.string().max(2048), overallScore: z.number().int().min(0).max(100), categoryScores: z.object({ technical: z.number(), onpage: z.number(), performance: z.number(), accessibility: z.number() }), checks: z.array(checkSchema).max(300) }) });

export async function POST(request: Request) {
  const limit = rateLimit(`explain:${clientIp(request)}`);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests, try again later" }, { status: 429, headers: { "retry-after": String(limit.retryAfterSeconds) } });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid audit data" }, { status: 400 });
  const result = await explainAudit(parsed.data.audit);
  return NextResponse.json(result);
}
