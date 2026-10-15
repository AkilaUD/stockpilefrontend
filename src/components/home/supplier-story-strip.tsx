import { Link } from "@/i18n/navigation";

/*
 * SupplierStoryStrip — verified suppliers, dossier-register style (§6.1).
 *
 * Real directory data only: name, district, live product count, verification
 * state as TEXT plus shape (never colour alone, §10). Sorted
 * verified-first by the page. Each row is a link to the supplier microsite.
 * Server Component.
 */

interface StorySupplier {
  slug: string;
  name: string;
  district?: string | null;
  productCount?: number | null;
  verified: boolean;
  verifiedLabel: string;
  unverifiedLabel: string;
  productsLabel: string;
}

export function SupplierStoryStrip({ suppliers }: { suppliers: StorySupplier[] }) {
  return (
    <ul className="divide-y divide-line border-y border-line">
      {suppliers.map((supplier) => (
        <li key={supplier.slug}>
          <Link
            href={`/suppliers/${supplier.slug}`}
            className="group grid gap-1 py-4 transition-colors duration-instant ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:grid-cols-12 sm:items-baseline sm:gap-4"
          >
            <span className="type-title-sm text-ink group-hover:text-ink-accent sm:col-span-5">
              {supplier.name}
            </span>
            <span className="type-body text-ink-muted sm:col-span-3">
              {supplier.district ?? "—"}
            </span>
            <span className="type-meta font-mono text-ink-muted sm:col-span-2">
              {supplier.productCount ?? 0} {supplier.productsLabel}
            </span>
            {/* The status cell is 2/12 of the row, and a Sinhala verification
                phrase is one long word (e.g. "සත්‍යාපනය බලාපොරොත්තුවෙන්") that is
                wider than that at 768px. Left alone it pushes the document
                sideways; `break-words` keeps it inside the cell. */}
            <span className="min-w-0 break-words sm:col-span-2 sm:text-right">
              {supplier.verified ? (
                <span className="inline-flex items-center gap-1.5 type-meta font-medium text-ink">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5 text-success" aria-hidden="true">
                    <path d="M3 8l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {supplier.verifiedLabel}
                </span>
              ) : (
                <span className="type-meta text-ink-muted">{supplier.unverifiedLabel}</span>
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
