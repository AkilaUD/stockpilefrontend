/**
 * First URL from a catalogue/content `srcset` string (`"/api/v1/catalog/media/x 1x"`).
 * Same-origin rewrite; callers use a raw `<img>` (no Next optimizer re-fetch).
 */
export function imageUrl(srcset: string | null | undefined): string | null {
  if (!srcset || srcset.trim() === "") return null;
  return srcset.trim().split(/\s+/)[0] ?? null;
}
