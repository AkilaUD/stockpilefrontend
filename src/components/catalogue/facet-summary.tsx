import type { Facet } from "@/lib/api/catalogue";

/**
 * FacetSummary — the assortment profile a listing carries (api.md §2.5).
 *
 * The backend computes facets truthfully over the current filter state, but
 * the read surface accepts no dynamic attribute filters today (CatalogueController
 * pins category/q/sort/brand/country/verification/stock), so this panel renders
 * the profile as information — labels and live counts — and nothing that looks
 * like a control. A checkbox that only looked clickable would be fake
 * functionality (spec §0.6); this communicates what the assortment contains
 * without pretending to filter it. All five facet types render generically
 * (§3.4: no hard-coded UI per attribute).
 *
 * Server Component: a definition list, text only.
 */

interface FacetSummaryProps {
  facets: Facet[];
  /** Locale for number formatting (range min/max, counts in the list). */
  locale: string;
  /** "Assortment profile" heading in the active locale. */
  title: string;
}

function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value);
}

function renderValue(facet: Facet, locale: string): string {
  switch (facet.type) {
    case "range": {
      if (!facet.range) return "";
      const unit = facet.range.unit ? ` ${facet.range.unit}` : "";
      return `${formatNumber(facet.range.min, locale)} – ${formatNumber(facet.range.max, locale)}${unit}`;
    }
    case "boolean":
      return facet.count != null ? `${formatNumber(facet.count, locale)}` : "";
    case "hierarchy":
    case "enum":
    case "multi":
    default: {
      const options = facet.options ?? [];
      if (facet.type === "multi") {
        return options.map((option) => `${option.label} (${formatNumber(option.count, locale)})`).join(" · ");
      }
      return options.map((option) => `${option.label}`).join(" · ");
    }
  }
}

export function FacetSummary({ facets, locale, title }: FacetSummaryProps) {
  if (facets.length === 0) return null;

  return (
    <section className="rounded-md border border-line bg-surface-panel p-5">
      <h2 className="block-title">{title}</h2>
      <dl className="mt-4 space-y-3">
        {facets.map((facet) => (
          <div key={facet.key}>
            <dt className="type-meta font-semibold text-ink">{facet.label}</dt>
            <dd className="type-body-sm mt-0.5 text-ink-muted">{renderValue(facet, locale)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}