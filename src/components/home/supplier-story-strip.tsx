import { Link } from "@/i18n/navigation";
import { imageUrl } from "@/lib/media-url";

/*
 * SupplierStoryStrip — verified suppliers with optional seeded logos (§6.1).
 * Real directory data only: name, district, product count, verification,
 * logo srcset when the catalogue seeder linked MediaAsset.
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
  logoSrcset?: string | null;
  logoAlt?: string | null;
}

export function SupplierStoryStrip({ suppliers }: { suppliers: StorySupplier[] }) {
  const withLogos = suppliers.some((s) => imageUrl(s.logoSrcset));

  if (withLogos) {
    return (
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {suppliers.map((supplier) => {
          const src = imageUrl(supplier.logoSrcset);
          return (
            <li key={supplier.slug}>
              <Link
                href={`/suppliers/${supplier.slug}`}
                className="group flex flex-col items-center gap-2 rounded-sm border border-line bg-surface-panel p-3 transition-colors duration-instant ease-standard hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                <span className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-surface-recessed">
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element -- catalogue media via rewrite
                    <img
                      src={src}
                      alt={supplier.logoAlt ?? supplier.name}
                      loading="lazy"
                      decoding="async"
                      className="max-h-full max-w-full object-contain p-2"
                    />
                  ) : (
                    <span className="type-meta px-2 text-center text-ink-muted">{supplier.name}</span>
                  )}
                </span>
                <span className="type-meta line-clamp-2 text-center text-ink group-hover:text-ink-accent">
                  {supplier.name}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

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
