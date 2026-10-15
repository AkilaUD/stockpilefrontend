import { Link } from "@/i18n/navigation";
import { formatMoney } from "@/lib/money";
import type { ProductListItem } from "@/lib/api/catalogue";
import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import { cx, type ClassValue } from "@/lib/cx";
import type { ReactNode } from "react";

/**
 * ProductCard — the catalogue listing cell (products, search, category and
 * supplier pages all render the same cell, api.md §2.5 item shape).
 *
 * Backend-authoritative rendering: price visibility follows the wire state —
 * only a `Public` price with an amount is formatted with formatMoney (§15.7);
 * every other state renders the caller's `priceOnRequest` label. Copy arrives
 * as props (the card is a Server Component and never owns English of its own,
 * §15.6); colour beside the stock label is never the sole carrier (§10).
 */

interface ProductCardProps {
  item: ProductListItem;
  /** BCP-47 tag for money/number formatting (matches the active locale). */
  locale: string;
  /** "Price on request" in the active locale. */
  priceOnRequest: ReactNode;
  /** "Min. order {quantity}" label, or null when the card hides it. */
  minOrderLabel?: ReactNode;
  /** Stock state label in the active locale (duplicated next to the tone). */
  stockLabel: (state: string) => ReactNode;
  className?: ClassValue;
}

/** The URL behind a `"… 1x"` srcset string, or the string itself. */
function imageUrl(srcset: string | null | undefined): string | null {
  if (!srcset || srcset.trim() === "") return null;
  return srcset.trim().split(/\s+/)[0] ?? null;
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
    <article className={cx("group flex h-full flex-col", className)}>
      {src && (
        <Link href={`/products/${item.slug}`} className="mb-[10px] block" aria-label={item.name}>
          {/* Reference cell (measured 2026-10-14): a SQUARE 163×163 image,
              no border, no radius — the theme draws the product photograph
              itself, so the skin adds nothing around it. */}
          <div className="relative aspect-square overflow-hidden bg-surface-recessed">
            {/* Raw <img>: the src is the same-origin catalogue media endpoint
             * (behind the next.config rewrite), so the Next image optimizer
             * would have to re-fetch it through a rewrite; the backend's own
             * srcset is already the single immutable URL, no optimisation. */}
            {/* eslint-disable-next-line @next/next/no-img-element -- deliberate: same-origin rewrite, no optimizer re-fetch. */}
            <img
              src={src}
              alt={item.image?.alt ?? item.name}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </Link>
      )}

      <div className="flex flex-col gap-1">
        {/* Reference title `.product-item-link`: 14px/400, `#8f8b9c` on white.
            That grey is 3.5:1 — below AA for body copy — so the title uses the
            AA muted ink (#6b7280, 4.6:1) at the reference's size instead. */}
        <Link
          href={`/products/${item.slug}`}
          className="text-sm leading-[19.25px] font-normal break-words text-ink-muted transition-colors duration-instant ease-standard hover:text-ink"
        >
          {item.name}
        </Link>
        <Link
          href={`/suppliers/${item.supplier.slug}`}
          className="text-sm text-ink-muted transition-colors duration-instant ease-standard hover:text-ink"
        >
          {item.supplier.name}
        </Link>

        <div className="mt-1 flex flex-wrap items-start justify-between gap-2">
          {pricePublic ? (
            <p className="text-sm font-semibold text-ink tabular">
              {formatMoney({ amount: price.amount as number, currency: price.currency, locale })}
            </p>
          ) : (
            <p className="text-sm text-ink-muted">{priceOnRequest}</p>
          )}
          <StatusPill tone={STOCK_TONES[item.stockState] ?? "neutral"}>{stockLabel(item.stockState)}</StatusPill>
        </div>

        {minOrderLabel && <p className="type-meta text-ink-muted">{minOrderLabel}</p>}
      </div>
    </article>
  );
}