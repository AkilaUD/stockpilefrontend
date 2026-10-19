/**
 * Allowlist http(s) absolute URLs for use in `href` attributes.
 * Rejects javascript:, data:, and relative schemes that could become XSS vectors
 * if untrusted content reaches the renderer.
 */
export function safeExternalHref(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;

  try {
    const uri = new URL(trimmed);
    if (uri.protocol === "http:" || uri.protocol === "https:") {
      return uri.href;
    }
  } catch {
    return null;
  }

  return null;
}
