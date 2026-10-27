import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getProductListing } from "@/lib/api/catalogue-server";
import type { SortKey } from "@/lib/api/catalogue";
import { SORT_KEYS } from "@/lib/api/catalogue";
import { ProductCard } from "@/components/catalogue/product-card";
import { Pagination } from "@/components/catalogue/pagination";
import { FacetSummary } from "@/components/catalogue/facet-summary";
import { CatalogueShell } from "@/components/catalogue/catalogue-shell";
import { Reveal } from "@/components/motion/reveal";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { cx } from "@/lib/cx";

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "catalogue.listing" });
  return { title: t("title"), description: t("lede") };
}

const STOCK_STATES = ["InStock", "OutOfStock", "EnquireForAvailability"] as const;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "catalogue.listing" });
  const tCat = await getTranslations({ locale, namespace: "catalogue" });
  const tProduct = await getTranslations({ locale, namespace: "catalogue.product" });
  const tSort = await getTranslations({ locale, namespace: "catalogue.sort" });
  const tFacets = await getTranslations({ locale, namespace: "catalogue.facets" });
  const tPager = await getTranslations({ locale, namespace: "catalogue.pagination" });

  const sortRaw = firstParam(sp.sort);
  const sort: SortKey = (SORT_KEYS as readonly string[]).includes(sortRaw ?? "")
    ? (sortRaw as SortKey)
    : "relevance";
  const page = Math.max(1, Number.parseInt(firstParam(sp.page) ?? "1", 10) || 1);
  const category = firstParam(sp.category);
  const q = firstParam(sp.q)?.trim() || undefined;
  const verifiedOnly = firstParam(sp.verifiedOnly) === "true";
  const inStockOnly = firstParam(sp.inStockOnly) === "true";

  const data = await getProductListing({ category, q, sort, verifiedOnly, inStockOnly, page });

  const baseParams: Record<string, string | undefined> = {
    category,
    q,
    sort: sort === "relevance" ? undefined : sort,
    verifiedOnly: verifiedOnly ? "true" : undefined,
    inStockOnly: inStockOnly ? "true" : undefined,
  };

  const hrefWith = (patch: Record<string, string | undefined>): string => {
    const merged: Record<string, string> = {};
    for (const [key, value] of Object.entries({ ...baseParams, ...patch })) {
      if (value !== undefined && value !== "") merged[key] = value;
    }
    const query = new URLSearchParams(merged).toString();
    return `/products${query ? `?${query}` : ""}`;
  };

  const stockLabel = (state: string): string =>
    (STOCK_STATES as readonly string[]).includes(state) ? tCat(`stock.${state}`) : state;

  const totalPages = Math.max(1, Math.ceil(data.totalItems / data.pageSize));

  const filtersActive = Boolean(category || q || verifiedOnly || inStockOnly);
  const toolbar = (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <p className="type-body text-ink-muted" aria-live="polite">
        {t("count", { count: data.totalItems })}
        {filtersActive && (
          <>
            {" · "}
            <Link href="/products" className="font-medium text-ink underline underline-offset-4 hover:text-ink-accent">
              {t("clearFilters")}
            </Link>
          </>
        )}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <div className="flex flex-wrap items-center gap-1" aria-label={t("sortLabel")}>
          {SORT_KEYS.map((key) => (
            <Link
              key={key}
              href={hrefWith({ sort: key === "relevance" ? undefined : key })}
              aria-current={sort === key ? "true" : undefined}
              className={cx(
                "type-meta rounded-sm px-2.5 py-1.5 transition-colors duration-instant ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                sort === key ? "bg-brand-primary/15 font-semibold text-ink" : "text-ink-muted hover:text-ink",
              )}
            >
              {tSort(key)}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={hrefWith({ verifiedOnly: verifiedOnly ? undefined : "true" })}
            aria-pressed={verifiedOnly}
            className={cx(
              "type-meta rounded-full border px-3 py-1.5 transition-colors duration-instant ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
              verifiedOnly
                ? "border-ink-strong bg-surface-recessed text-ink"
                : "border-line text-ink-muted hover:border-line-strong hover:text-ink",
            )}
          >
            {t("verifiedOnly")}
          </Link>
          <Link
            href={hrefWith({ inStockOnly: inStockOnly ? undefined : "true" })}
            aria-pressed={inStockOnly}
            className={cx(
              "type-meta rounded-full border px-3 py-1.5 transition-colors duration-instant ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
              inStockOnly
                ? "border-ink-strong bg-surface-recessed text-ink"
                : "border-line text-ink-muted hover:border-line-strong hover:text-ink",
            )}
          >
            {t("inStockOnly")}
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <CatalogueShell
      title={t("title")}
      lede={
        <>
          {t("lede")}
          {q && (
            <span className="mt-2 block type-body-sm text-ink-muted">{t("searchEcho", { query: q })}</span>
          )}
        </>
      }
      toolbar={toolbar}
    >
      {data.items.length === 0 ? (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyBody")}
          headingLevel="h2"
          action={
            <ButtonLink href="/products" variant="secondary" size="md">
              {t("clearFilters")}
            </ButtonLink>
          }
        />
      ) : (
        <Reveal className="catalogue-grid gap-3 md:gap-4">
          {data.items.map((item) => (
            <ProductCard
              key={item.publicId}
              item={item}
              locale={locale}
              priceOnRequest={tProduct("priceOnRequest")}
              minOrderLabel={
                item.minOrderQuantity != null ? tProduct("minOrder", { quantity: item.minOrderQuantity }) : undefined
              }
              stockLabel={stockLabel}
            />
          ))}
        </Reveal>
      )}

      {data.facets && data.facets.length > 0 && (
        <div className="mt-12">
          <FacetSummary facets={data.facets} locale={locale} title={tFacets("title")} />
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-10">
          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.totalItems}
            basePath="/products"
            params={baseParams}
            labels={{
              previous: tPager("previous"),
              next: tPager("next"),
              pageAria: (p) => tPager("pageAria", { page: p }),
            }}
          />
        </div>
      )}
    </CatalogueShell>
  );
}
