import { Link } from "@/i18n/navigation";
import { formatMoney } from "@/lib/money";
import type { ProductListItem } from "@/lib/api/catalogue";
import { imageUrl } from "@/lib/media-url";
import { categoryHref } from "@/lib/navigation/navigation";
import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import { cx, type ClassValue } from "@/lib/cx";
import type { ReactNode } from "react";

/**
 * ProductCard — dense B2B listing cell (products, search, category, supplier).
 * Price visibility follows wire state; stock tone is never the sole carrier.
 */

interface ProductCardProps {
  item: ProductListItem;
  locale: string;
  priceOnRequest: ReactNode;
  minOrderLabel?: ReactNode;
  stockLabel: (state: string) => ReactNode;
  className?: ClassValue;
}

const STOCK_TONES: Record<string, StatusTone> = {
  InStock: "success",
  OutOfStock: "neutral",
  EnquireForAvailability: "warning",
};

export function ProductCard({ item, locale, priceOnRequest, minOrderLabel, stockLabel, className }: ProductCardProps) {
  const src = imageUrl(item.image?.srcset);
  const price = item.price;
  const pricePublic = price?.state === "Public" && price.amount != null;

  return (
    <article
      className={cx(
        "group flex h-full flex-col overflow-hidden rounded-sm border border-line bg-surface-panel transition-colors duration-instant ease-standard hover:border-line-strong",
        className,
      )}
    >
      <Link href={`/products/${item.slug}`} className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus" aria-label={item.name}>
        {src ? (
          <div className="relative aspect-square overflow-hidden border-b border-line bg-surface-recessed">
            {/* eslint-disable-next-line @next/next/no-img-element -- same-origin rewrite */}
            <img
              src={src}
              alt={item.image?.alt ?? item.name}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-instant ease-standard group-hover:scale-[1.02]"
            />
          </div>
        ) : (
          <div className="aspect-square border-b border-line bg-surface-recessed" aria-hidden="true" />
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3 md:p-3.5">
        <p className="type-meta tabular text-ink-faint">{item.sku}</p>

        <Link
          href={`/products/${item.slug}`}
          className="type-body-sm font-medium leading-snug text-ink line-clamp-2 transition-colors duration-instant ease-standard hover:text-ink-accent"
        >
          {item.name}
        </Link>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 type-meta">
          <Link
            href={`/suppliers/${item.supplier.slug}`}
            className="text-ink-muted transition-colors duration-instant ease-standard hover:text-ink"
          >
            {item.supplier.name}
          </Link>
          {item.category?.slug && (
            <>
              <span className="text-ink-faint" aria-hidden>
                ·
              </span>
              <Link
                href={categoryHref(item.category.slug)}
                className="text-ink-muted transition-colors duration-instant ease-standard hover:text-ink"
              >
                {item.category.name}
              </Link>
            </>
          )}
        </div>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-1">
          {pricePublic ? (
            <p className="font-display text-base font-bold tracking-tight text-ink tabular">
              {formatMoney({ amount: price.amount as number, currency: price.currency, locale })}
            </p>
          ) : (
            <p className="type-body-sm font-medium text-ink-muted">{priceOnRequest}</p>
          )}
          <StatusPill tone={STOCK_TONES[item.stockState] ?? "neutral"}>{stockLabel(item.stockState)}</StatusPill>
        </div>

        {minOrderLabel && <p className="type-meta text-ink-muted">{minOrderLabel}</p>}
      </div>
    </article>
  );
}
