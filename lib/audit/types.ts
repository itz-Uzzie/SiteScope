export type Status = "pass" | "warning" | "fail";
export type Category = "technical" | "onpage" | "performance" | "accessibility";
export type Severity = "high" | "medium" | "low";

export interface CheckResult {
  id: string;
  category: Category;
  title: string;
  status: Status;
  severity: Severity;
  score: number;
  weight: number;
  message: string;
  recommendation?: string;
  details?: Record<string, unknown>;
}

export interface AuditResult {
  url: string;
  requestedUrl: string;
  auditedAt: string;
  durationMs: number;
  overallScore: number;
  categoryScores: Record<Category, number>;
  checks: CheckResult[];
  summary: { pass: number; warning: number; fail: number };
  charts: {
    headingCounts: { h1: number; h2: number; h3: number; h4: number; h5: number; h6: number };
    performance: { ttfbMs: number; htmlSizeKb: number; scriptCount: number; stylesheetCount: number; imageCount: number; totalLinks: number };
    links: { ok: number; broken: number; redirected: number; skipped: number };
  };
  pageSpeed?: { performanceScore: number; lcpMs?: number; clsValue?: number; tbtMs?: number; fcpMs?: number; source: "psi" };
}

export interface PageData {
  requestedUrl: string;
  finalUrl: string;
  html: string;
  statusCode: number;
  redirectCount: number;
  headers: {
    contentEncoding: string | null;
    cacheControl: string | null;
    contentType: string | null;
    xRobotsTag: string | null;
    etag: string | null;
  };
  ttfbMs: number;
  totalMs: number;
  sizeBytes: number;
}

export interface AuditCharts {
  headingCounts: AuditResult["charts"]["headingCounts"];
  performance: AuditResult["charts"]["performance"];
  links: AuditResult["charts"]["links"];
}
