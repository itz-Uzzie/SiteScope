import { NextResponse } from "next/server";
import { z } from "zod";
import { runAudit, PageFetchError } from "@/lib/audit";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { UnsafeUrlError } from "@/lib/audit/ssrf";

export const runtime = "nodejs";
export const maxDuration = 30;

const schema = z.object({ url: z.string().trim().min(1).max(2048) });

export async function POST(request: Request) {
  const limit = rateLimit(`audit:${clientIp(request)}`);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests, try again later" }, { status: 429, headers: { "retry-after": String(limit.retryAfterSeconds) } });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid URL" }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  try {
    const result = await runAudit(parsed.data.url);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof UnsafeUrlError) return NextResponse.json({ error: error.message }, { status: error.message === "Invalid URL" ? 400 : 422 });
    if (error instanceof PageFetchError) {
      const status = error.kind === "timeout" ? 504 : 502;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: "Could not complete the website audit" }, { status: 502 });
  }
}
