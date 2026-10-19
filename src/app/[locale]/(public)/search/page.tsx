import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { getSearchResults, CATALOGUE_PAGE_SIZE } from "@/lib/api/catalogue-server";
import { categoryHref } from "@/lib/navigation/navigation";
import { ProductCard } from "@/components/catalogue/product-card";
import { Pagination } from "@/components/catalogue/pagination";
import { FacetSummary } from "@/components/catalogue/facet-summary";
import { CatalogueShell } from "@/components/catalogue/catalogue-shell";
import { CatalogueSearchForm } from "@/components/catalogue/catalogue-search-form";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "catalogue.search" });
  return { title: t("prompt") };
}

const STOCK_STATES = ["InStock", "OutOfStock", "EnquireForAvailability"] as const;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;

  const q = firstParam(sp.q)?.trim() ?? "";
  const page = Math.max(1, Number.parseInt(firstParam(sp.page) ?? "1", 10) || 1);

  const t = await getTranslations({ locale, namespace: "catalogue.search" });
  const tCat = await getTranslations({ locale, namespace: "catalogue" });
  const tProduct = await getTranslations({ locale, namespace: "catalogue.product" });
  const tFacets = await getTranslations({ locale, namespace: "catalogue.facets" });
  const tPager = await getTranslations({ locale, namespace: "catalogue.pagination" });
  const tActions = await getTranslations({ locale, namespace: "common.actions" });

  const stockLabel = (state: string): string =>
    (STOCK_STATES as readonly string[]).includes(state) ? tCat(`stock.${state}`) : state;

  const searchAction = getPathname({ href: "/search", locale });
  const searchForm = (
    <CatalogueSearchForm
      action={searchAction}
      defaultValue={q}
      placeholder={t("prompt")}
      submitLabel={tActions("search")}
    />
  );

  if (q === "") {
    return (
      <CatalogueShell title={t("prompt")} lede={undefined}>
        <EmptyState title={t("prompt")} headingLevel="h2" action={searchForm} />
      </CatalogueShell>
    );
  }

  const data = await getSearchResults({ q, page });
  const totalPages = Math.max(1, Math.ceil(data.total / CATALOGUE_PAGE_SIZE));
  const shownPage = Math.min(page, totalPages);

  return (
    <CatalogueShell
      title={t("resultsFor", { query: data.query })}
      aside={
        <>
          <p className="type-body text-ink-muted" aria-live="polite">
            {t("count", { count: data.total })}
          </p>
          {searchForm}
        </>
      }
    >
      {data.items.length > 0 ? (
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
      ) : (
        <div>
          <EmptyState title={t("emptyTitle", { query: q })} description={t("emptyBody")} headingLevel="h2" />
          {data.zeroResultBridge?.message && (
            <div className="mx-auto mt-6 max-w-md rounded-sm border border-line bg-surface-panel p-5 text-center">
              <p className="type-body-sm text-ink-muted">{data.zeroResultBridge.message}</p>
              {data.zeroResultBridge.categorySuggestion && (
                <div className="mt-4">
                  <ButtonLink
                    href={categoryHref(data.zeroResultBridge.categorySuggestion.slug)}
                    variant="secondary"
                    size="sm"
                  >
                    {t("suggestedCategory", { name: data.zeroResultBridge.categorySuggestion.name })}
                  </ButtonLink>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {data.suggestions.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-lg font-bold tracking-tight text-ink">{t("suggestions")}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {data.suggestions.map((suggestion) => (
              <li key={suggestion}>
                <Link
                  href={`/search?q=${encodeURIComponent(suggestion)}`}
                  className="type-meta inline-block rounded-full border border-line px-3 py-1.5 text-ink-muted transition-colors duration-instant ease-standard hover:border-line-strong hover:text-ink"
                >
                  {suggestion}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.facets && data.facets.length > 0 && (
        <div className="mt-12">
          <FacetSummary facets={data.facets} locale={locale} title={tFacets("title")} />
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-10">
          <Pagination
            page={shownPage}
            pageSize={CATALOGUE_PAGE_SIZE}
            total={data.total}
            basePath="/search"
            params={{ q }}
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
