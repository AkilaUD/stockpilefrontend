import { ArrowDown, ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { ProductListItem } from "@/lib/api/catalogue";
import { formatMoney } from "@/lib/money";
import { LedgerSheet, LedgerRow } from "@/components/ui/desk-register";
import { Stamp } from "@/components/ui/status-pill";
import { buttonClassName } from "@/components/ui/button";
import { HeroSearch } from "./hero-search";
import { AddToListButton } from "./add-to-list-button";

export interface FolioStats {
  products: number;
  suppliers: number;
  departments: number;
  categories: number;
}

const STOCK_TONES = { InStock: "success", OutOfStock: "danger", EnquireForAvailability: "warning" } as const;

function stockTone(state: string): "success" | "danger" | "warning" | "neutral" {
  return (STOCK_TONES as Record<string, "success" | "danger" | "warning">)[state] ?? "neutral";
}

/**
 * The opened order book. Left: the cover page — folio №, what this book does,
 * search, one buyer action. Right: a live sheet already filled with the newest
 * catalogue entries, each addable to the visitor's own list below.
 *
 * Side-nav contract (≥1200px): the header's department panel hangs over the
 * left 300px of this section, so the book reserves that rail structurally
 * (`min-[1200px]:pl-[calc(300px+2rem)]`) — never a z-index fight. Below
 * 1200px the book is full-width.
 */
export async function LedgerCover({
  locale,
  stats,
  sheetItems,
}: {
  locale: string;
  stats: FolioStats | null;
  sheetItems: ProductListItem[];
}) {
  const t = await getTranslations({ locale, namespace: "home" });
  const tCat = await getTranslations({ locale, namespace: "catalogue" });
  const tProduct = await getTranslations({ locale, namespace: "catalogue.product" });

  const folioStats = stats
    ? [
        { label: t("stats.products"), value: stats.products },
        { label: t("stats.suppliers"), value: stats.suppliers },
        { label: t("stats.departments"), value: stats.departments },
        { label: t("stats.categories"), value: stats.categories },
      ]
    : [];

  return (
    <section className="border-b border-line bg-surface-page" data-hero>
      <div className="shell-public pt-8 pb-10 sm:pt-10">
        <div className="min-[1200px]:pl-[calc(300px+2rem)]">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-10">
            {/* Cover page */}
            <div className="relative overflow-hidden" data-ledger-line>
              <span
                aria-hidden
                data-ghost
                className="type-ledger-data pointer-events-none absolute -top-8 right-0 text-[9rem] leading-none font-semibold text-ink/[0.05] select-none"
              >
                001
              </span>
              <p data-hero-reveal className="type-folio flex flex-wrap items-center gap-x-3 text-ink-muted">
                <span>{t("ledger.folio")}</span>
                <span aria-hidden className="h-px flex-1 bg-line-strong" />
                <span>{t("ledger.folioOpen")}</span>
              </p>
              <h1 data-hero-reveal className="type-display-lg mt-5 font-display text-ink">{t("ledger.headline")}</h1>
              <p data-hero-reveal className="type-body mt-4 max-w-[52ch] text-ink-muted">{t("ledger.lede")}</p>

              <div data-hero-reveal className="mt-6">
                <HeroSearch />
                <p className="type-meta mt-2">{t("ledger.searchHint")}</p>
              </div>

              <div data-hero-reveal className="mt-6 flex flex-wrap items-center gap-3">
                <a href="#materials-list" className={buttonClassName({ variant: "primary", size: "lg" })}>
                  {t("ledger.startList")}
                  <ArrowDown className="size-4" aria-hidden />
                </a>
                <Link
                  href="/products"
                  className="type-body-sm inline-flex items-center gap-1.5 font-semibold text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-ink"
                >
                  {t("ledger.browse")}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>

              {folioStats.length > 0 ? (
                <dl data-hero-reveal className="mt-8 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
                  {folioStats.map((stat) => (
                    <div key={stat.label} className="bg-surface-elevated px-3 py-2.5">
                      <dd
                        className="type-ledger-data font-semibold text-ink"
                        data-count-up={stat.value}
                      >
                        {stat.value.toLocaleString(locale)}
                      </dd>
                      <dt className="type-meta mt-0.5">{stat.label}</dt>
                    </div>
                  ))}
                </dl>
              ) : null}
              <p className="type-meta mt-2">{t("ledger.folioNote")}</p>
            </div>

            {/* Live sheet */}
            <LedgerSheet
              folio={t("ledger.sheetFolio")}
              title={t("ledger.sheetTitle")}
              meta={t("ledger.sheetMeta", { count: sheetItems.length })}
              className="self-start"
            >
              {sheetItems.length === 0 ? (
                <p className="type-body-sm px-5 py-6 text-ink-muted">{t("ledger.sheetEmpty")}</p>
              ) : (
                sheetItems.map((item, index) => (
                  <div key={item.publicId} data-ledger-line data-sheet-row>
                    <LedgerRow
                      entryNo={String(index + 1).padStart(3, "0")}
                      stamp={
                        <Stamp tone={stockTone(item.stockState)}>
                          {tCat.has(`stock.${item.stockState}`) ? tCat(`stock.${item.stockState}`) : item.stockState}
                        </Stamp>
                      }
                      action={<AddToListButton product={item} compact />}
                    >
                      <Link
                        href={`/products/${item.slug}`}
                        className="type-body-sm font-semibold text-ink underline-offset-2 hover:underline"
                      >
                        {item.name}
                      </Link>
                      <p className="type-ledger-data mt-1 break-words text-ink-muted">
                        {item.sku} · {item.supplier.name}
                        {item.supplier.district ? ` · ${item.supplier.district}` : ""}
                      </p>
                      <p className="type-ledger-data mt-1 text-ink">
                        {item.price?.state === "Public" && typeof item.price.amount === "number"
                          ? formatMoney({ amount: item.price.amount, currency: item.price.currency, locale })
                          : tProduct("priceOnRequest")}
                        {item.price?.unitName ? (
                          <span className="text-ink-muted"> / {item.price.unitName}</span>
                        ) : null}
                      </p>
                    </LedgerRow>
                  </div>
                ))
              )}
              <p className="type-meta border-t border-line px-5 py-3">{t("ledger.sheetNote")}</p>
            </LedgerSheet>
          </div>
        </div>
      </div>

      {/* Current register ribbon — real SKUs and prices, straight from the sheet. */}
      {sheetItems.length > 0 ? (
        <div className="border-t border-line bg-surface-elevated">
          <div className="shell-public flex items-stretch gap-0">
            <span className="type-folio z-10 flex shrink-0 items-center border-r border-line bg-surface-elevated py-2.5 pr-4 text-ink-muted">
              {t("ledger.ribbonLabel")}
            </span>
            <div className="relative flex-1 overflow-hidden">
              <div data-ribbon-track className="flex w-max">
                {[false, true].map((duplicate) => (
                  <ul key={String(duplicate)} aria-hidden={duplicate || undefined} className="flex shrink-0 items-center">
                    {sheetItems.map((item) => (
                      <li key={item.publicId} className="type-entry-no shrink-0 border-r border-line px-4 py-2.5 whitespace-nowrap text-ink">
                        {item.sku}
                        <span className="text-ink-muted">
                          {" — "}
                          {item.price?.state === "Public" && typeof item.price.amount === "number"
                            ? formatMoney({ amount: item.price.amount, currency: item.price.currency, locale })
                            : tProduct("priceOnRequest")}
                        </span>
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
