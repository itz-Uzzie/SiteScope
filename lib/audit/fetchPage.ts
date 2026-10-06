import type { PageData } from "./types";
import { validatePublicUrl } from "./ssrf";

export class PageFetchError extends Error {
  constructor(message: string, public readonly kind: "timeout" | "unreachable" | "non-html" | "too-large" | "http") {
    super(message);
    this.name = "PageFetchError";
  }
}

const USER_AGENT = "SEOAuditBot/1.0 (+portfolio project)";
const REDIRECT_CODES = new Set([301, 302, 303, 307, 308]);

export async function fetchPage(input: string): Promise<PageData> {
  const start = performance.now();
  let currentUrl = (await validatePublicUrl(input)).toString();
  let redirectCount = 0;
  let response: Response | undefined;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    while (true) {
      const safeUrl = await validatePublicUrl(currentUrl);
      try {
        response = await fetch(safeUrl, {
          redirect: "manual",
          signal: controller.signal,
          headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml" },
        });
      } catch {
        if (controller.signal.aborted) throw new PageFetchError("The website took too long to respond", "timeout");
        throw new PageFetchError("Could not reach the website", "unreachable");
      }

      if (REDIRECT_CODES.has(response.status)) {
        const location = response.headers.get("location");
        await response.body?.cancel();
        if (!location) break;
        if (redirectCount >= 5) throw new PageFetchError("The website redirected too many times", "http");
        currentUrl = new URL(location, safeUrl).toString();
        redirectCount += 1;
        continue;
      }
      break;
    }

    if (!response) throw new PageFetchError("Could not reach the website", "unreachable");
    const ttfbMs = Math.round(performance.now() - start);
    const contentType = response.headers.get("content-type");
    if (!contentType?.toLowerCase().includes("text/html") && !contentType?.toLowerCase().includes("application/xhtml+xml")) {
      await response.body?.cancel();
      throw new PageFetchError("This address did not return an HTML page", "non-html");
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw new PageFetchError(`The website returned HTTP ${response.status}`, "http");
    }

    const reader = response.body?.getReader();
    if (!reader) throw new PageFetchError("Could not read the website response", "unreachable");
    const chunks: Uint8Array[] = [];
    let sizeBytes = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        sizeBytes += value.byteLength;
        if (sizeBytes > 2 * 1024 * 1024) {
          await reader.cancel();
          throw new PageFetchError("The page is larger than the 2 MB audit limit", "too-large");
        }
        chunks.push(value);
      }
    } catch (error) {
      if (error instanceof PageFetchError) throw error;
      if (controller.signal.aborted) throw new PageFetchError("The website took too long to respond", "timeout");
      throw new PageFetchError("Could not read the website response", "unreachable");
    }
    const bytes = new Uint8Array(sizeBytes);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }

    return {
      requestedUrl: input,
      finalUrl: response.url || currentUrl,
      html: new TextDecoder().decode(bytes),
      statusCode: response.status,
      redirectCount,
      headers: {
        contentEncoding: response.headers.get("content-encoding"),
        cacheControl: response.headers.get("cache-control"),
        contentType,
        xRobotsTag: response.headers.get("x-robots-tag"),
        etag: response.headers.get("etag"),
      },
      ttfbMs,
      totalMs: Math.round(performance.now() - start),
      sizeBytes,
    };
  } finally {
    clearTimeout(timeout);
  }
}
