/**
 * Formats an article's publication date the way the reference's news surface
 * prints it ("December 10, 2023" on the English store view).
 *
 * The API sends `publishedAt` as an ISO value with no offset — it is an
 * editorial date, not an instant — so the date part is pinned to UTC before
 * formatting. Reading it as local time would let the render's own timezone
 * move the day, which would make the same article show two different dates.
 */
export function formatPublishedDate(value: string | null, locale: string): string | null {
  if (!value) return null;

  const parsed = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}
