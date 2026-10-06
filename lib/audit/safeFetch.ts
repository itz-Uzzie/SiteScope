import { validatePublicUrl } from "./ssrf";

const REDIRECTS = new Set([301, 302, 303, 307, 308]);

export async function safeFetch(
  input: string,
  options: { timeoutMs?: number; maxBytes?: number; method?: "GET" | "HEAD"; headers?: HeadersInit; readBody?: boolean } = {},
): Promise<{ response: Response; url: string; body: string }> {
  const timeoutMs = options.timeoutMs ?? 5_000;
  const maxBytes = options.maxBytes ?? 512_000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let current = input;

  try {
    for (let hop = 0; hop <= 5; hop += 1) {
      const safeUrl = await validatePublicUrl(current);
      const response = await fetch(safeUrl, {
        method: options.method ?? "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: { "user-agent": "SEOAuditBot/1.0 (+portfolio project)", ...Object.fromEntries(new Headers(options.headers).entries()) },
      });
      if (REDIRECTS.has(response.status)) {
        const location = response.headers.get("location");
        await response.body?.cancel();
        if (!location) return { response, url: safeUrl.toString(), body: "" };
        if (hop === 5) throw new Error("Too many redirects");
        current = new URL(location, safeUrl).toString();
        continue;
      }
      if (options.method === "HEAD" || options.readBody === false || !response.body) {
        await response.body?.cancel();
        return { response, url: response.url || safeUrl.toString(), body: "" };
      }
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > maxBytes) {
          await reader.cancel();
          throw new Error("Response exceeded size limit");
        }
        chunks.push(value);
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      return { response, url: response.url || safeUrl.toString(), body: new TextDecoder().decode(bytes) };
    }
    throw new Error("Too many redirects");
  } catch (error) {
    if (controller.signal.aborted) throw new Error("Request timed out");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
