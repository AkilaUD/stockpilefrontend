import { Link } from "@/i18n/navigation";

/**
 * Pagination — pager for the catalogue listings (api.md §2.3 offset paging,
 * exact totals). Server Component: plain locale-aware links, no state.
 *
 * hrefs are built by folding `page` into the caller's query params, so every
 * sort/filter choice stays on the next page. The current page renders as
 * text (a link to it would be a link to the same URL); neighbours up to a
 * window of five pages render as links, with `…` bridges out of range.
 */

export interface PaginationProps {
  /** 1-based current page. */
  page: number;
  /** Results per page (used with `total` to derive the last page). */
  pageSize: number;
  /** Exact item total from the wire (never faked by the client). */
  total: number;
  /** Listing route base, locale-prefixed by next-intl like every Link. */
  basePath: string;
  /** Query params to preserve on every page link (sort, filters…). */
  params?: Record<string, string | undefined>;
  /** "Previous"/"Next" aria labels via the active locale. */
  labels: { previous: string; next: string; pageAria: (page: number) => string };
}

const WINDOW = 2;

function hrefFor(basePath: string, params: Record<string, string | undefined> | undefined, page: number): string {
  const merged: Record<string, string> = {};
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== "") merged[key] = value;
  }
  if (page > 1) merged.page = String(page);
  const query = new URLSearchParams(merged).toString();
  return `${basePath}${query ? `?${query}` : ""}`;
}

export function Pagination({ page, pageSize, total, basePath, params, labels }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const pages: Array<number | "gap"> = [];
  for (let p = 1; p <= totalPages; p++) {
    const near = p <= 1 + WINDOW || p >= totalPages - WINDOW || Math.abs(p - page) <= WINDOW;
    if (near) {
      pages.push(p);
      continue;
    }
    if (pages[pages.length - 1] !== "gap") pages.push("gap");
  }

  return (
    <nav aria-label="pagination" className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-8">
      <div>
        {page > 1 && (
          <Link
            href={hrefFor(basePath, params, page - 1)}
            className="type-body font-medium text-ink transition-colors duration-instant ease-standard hover:text-ink-accent"
            aria-label={labels.previous}
          >
            {labels.previous}
          </Link>
        )}
      </div>

      <ol className="flex flex-wrap items-center gap-1">
        {pages.map((entry, index) =>
          entry === "gap" ? (
            <li key={`gap-${index}`} aria-hidden="true" className="type-body px-1 text-ink-muted">
              …
            </li>
          ) : (
            <li key={entry}>
              {entry === page ? (
                <span
                  aria-current="page"
                  aria-label={labels.pageAria(entry)}
                  className="type-meta inline-flex h-9 min-w-9 items-center justify-center rounded-md bg-brand-primary px-2 text-ink-on-signal tabular"
                >
                  {entry}
                </span>
              ) : (
                <Link
                  href={hrefFor(basePath, params, entry)}
                  aria-label={labels.pageAria(entry)}
                  className="type-meta inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-ink transition-colors duration-instant ease-standard hover:bg-surface-recessed hover:text-ink-accent tabular"
                >
                  {entry}
                </Link>
              )}
            </li>
          ),
        )}
      </ol>

      <div>
        {page < totalPages && (
          <Link
            href={hrefFor(basePath, params, page + 1)}
            className="type-body font-medium text-ink transition-colors duration-instant ease-standard hover:text-ink-accent"
            aria-label={labels.next}
          >
            {labels.next}
          </Link>
        )}
      </div>
    </nav>
  );
}