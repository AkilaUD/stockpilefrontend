import { Link } from "@/i18n/navigation";
import { ProductCard } from "@/components/catalogue/product-card";
import type { ProductListItem } from "@/lib/api/catalogue";

/*
 * ProductGridSection — a titled product grid for the home page (reference
 * reconstruction Phase 2 §4.4 — the "Featured Products" and "Newest Products"
 * sweeps). Same cell as the catalogue pages (ProductCard), same backend
 * shapes; the two sweeps on the home page are honest slices of the same live
 * "newest" sort (the API has no featured flag).
 */
interface ProductGridSectionProps {
  title: string;
  items: ProductListItem[];
  locale: string;
  priceOnRequest: React.ReactNode;
  stockLabel: (state: string) => React.ReactNode;
  viewAllHref: string;
  viewAllLabel: string;
}

export function ProductGridSection({
  title,
  items,
  locale,
  priceOnRequest,
  stockLabel,
  viewAllHref,
  viewAllLabel,
}: ProductGridSectionProps) {
  if (items.length === 0) return null;

  return (
    <section className="shell-public pb-[30px]">
      {/* Reference `.top-title` (measured 2026-10-14): `padding:5px 20px`, the
          heading as a 24px/500 inline link (line-height 32px) on the left and
          the "View All" link as 16px/400 on the right; sections sit 30px
          apart. */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-[5px]">
        <h2 className="font-body text-2xl leading-8 font-medium text-ink">
          <Link
            href={viewAllHref}
            className="transition-opacity duration-instant ease-standard hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {title}
          </Link>
        </h2>
        <Link
          href={viewAllHref}
          className="text-base font-normal whitespace-nowrap text-ink transition-opacity duration-instant ease-standard hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {viewAllLabel} →
        </Link>
      </div>
      {/* Six across from 1200px at the reference's own 30px gutters (its
          images measure 163.33px in the 1130px band). The ladder lives in the
          `home-product-grid` utility — see globals.css for why. */}
      <ul className="home-product-grid mt-[5px] gap-x-[30px] gap-y-8 px-5">
        {items.map((item) => (
          <li key={item.publicId}>
            <ProductCard
              item={item}
              locale={locale}
              priceOnRequest={priceOnRequest}
              stockLabel={stockLabel}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}