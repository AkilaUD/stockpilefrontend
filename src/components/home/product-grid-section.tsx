import { Link } from "@/i18n/navigation";
import { ProductCard } from "@/components/catalogue/product-card";
import type { ProductListItem } from "@/lib/api/catalogue";

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
    <section className="shell-public border-b border-line py-12 md:py-16">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
          <Link
            href={viewAllHref}
            className="transition-opacity duration-instant ease-standard hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {title}
          </Link>
        </h2>
        <Link
          href={viewAllHref}
          className="type-body-sm font-semibold whitespace-nowrap text-ink underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {viewAllLabel}
        </Link>
      </div>
      <ul className="home-product-grid mt-8 gap-x-6 gap-y-8">
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
