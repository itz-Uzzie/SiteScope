import { isIP } from "node:net";
import { lookup } from "node:dns/promises";

export class UnsafeUrlError extends Error {
  constructor(message = "That address isn't allowed") {
    super(message);
    this.name = "UnsafeUrlError";
  }
}

export function normalizeAuditUrl(input: string): string {
  const trimmed = input.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function isPrivateIpv4(address: string): boolean {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b] = octets;
  return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 0 || b === 88 || b === 168)) ||
    (a === 198 && (b === 18 || b === 19 || b === 51)) ||
    (a === 203 && b === 0 && octets[2] === 113) || a >= 224;
}

function isPrivateIpv6(address: string): boolean {
  const value = address.toLowerCase().split("%", 1)[0];
  if (value === "::" || value === "::1") return true;
  // IPv4-mapped addresses are checked using the embedded IPv4 value.
  if (value.startsWith("::ffff:")) return true;
  // Unique-local (fc00::/7), link-local (fe80::/10), and multicast (ff00::/8).
  return /^(?:fc|fd)[0-9a-f]{2}:/i.test(value) || /^fe[89ab][0-9a-f]:/i.test(value) || /^ff[0-9a-f]{2}:/i.test(value) || /^2001:db8:/i.test(value);
}

function assertPublicAddress(address: string): void {
  const version = isIP(address);
  if (version === 4 && isPrivateIpv4(address)) throw new UnsafeUrlError();
  if (version === 6 && isPrivateIpv6(address)) throw new UnsafeUrlError();
  if (version === 0) throw new UnsafeUrlError();
}

/** Validate URL syntax and resolve every DNS answer before making an outbound request. */
export async function validatePublicUrl(input: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(normalizeAuditUrl(input));
  } catch {
    throw new UnsafeUrlError("Invalid URL");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") throw new UnsafeUrlError();
  if (url.username || url.password) throw new UnsafeUrlError();
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!hostname || hostname === "localhost" || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    throw new UnsafeUrlError();
  }

  const ipVersion = isIP(hostname);
  if (ipVersion) {
    assertPublicAddress(hostname);
    return url;
  }

  let addresses: { address: string; family: number }[];
  try {
    addresses = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new UnsafeUrlError("Could not resolve that website");
  }
  if (addresses.length === 0) throw new UnsafeUrlError("Could not resolve that website");
  for (const entry of addresses) assertPublicAddress(entry.address);
  return url;
}
