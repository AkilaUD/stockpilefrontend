import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { getSearchResults, CATALOGUE_PAGE_SIZE } from "@/lib/api/catalogue-server";
import { categoryHref } from "@/lib/navigation/navigation";
import { ProductCard } from "@/components/catalogue/product-card";
import { Pagination } from "@/components/catalogue/pagination";
import { FacetSummary } from "@/components/catalogue/facet-summary";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";

/**
 * Catalogue search — SSR twin of the command-search overlay (api.md §2.3
 * `/catalog/search`). Every hit ships from the server with a real status;
 * the zero-result state renders the backend's own `zeroResultBridge.message`
 * verbatim (its copy, its truth) alongside the suggested category.
 *
 * `suggestions` are the backend's alternation strings, each a live link into
 * this same route. Facets are the read-only profile (the read API accepts no
 * attribute filters — FacetSummary never pretends otherwise).
 */
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

  const inputClasses =
    "h-11 w-full rounded-md border border-line bg-surface-panel px-3 font-body text-base text-ink outline-none placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";
  const submitClasses =
    "h-11 shrink-0 rounded-md bg-brand-primary px-4 font-body text-sm font-semibold text-ink-on-signal transition-colors duration-instant ease-standard hover:bg-brand-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

  // GET form — the page is the server, no client state involved.
  const searchForm = (
    <form action={getPathname({ href: "/search", locale })} method="get" role="search" className="flex w-full max-w-md items-center gap-2">
      <input type="search" name="q" defaultValue={q} placeholder={t("prompt")} aria-label={t("prompt")} className={inputClasses} />
      <button type="submit" className={submitClasses}>
        {tActions("search")}
      </button>
    </form>
  );

  if (q === "") {
    return (
      <div className="shell-public py-8 md:py-12">
        <EmptyState title={t("prompt")} headingLevel="h2" action={searchForm} />
      </div>
    );
  }

  const data = await getSearchResults({ q, page });
  const totalPages = Math.max(1, Math.ceil(data.total / CATALOGUE_PAGE_SIZE));
  // The backend serves empty items past the last page; the pager must not say
  // "page 98 of 97".
  const shownPage = Math.min(page, totalPages);

  return (
    <div className="shell-public py-8 md:py-12">
      <header className="max-w-3xl">
        <h1 className="page-title">{t("resultsFor", { query: data.query })}</h1>
        <p className="mt-3 type-body text-ink-muted" aria-live="polite">
          {t("count", { count: data.total })}
        </p>
        <div className="mt-6">{searchForm}</div>
      </header>

      {data.items.length > 0 ? (
        <Reveal className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
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
        <div className="mt-10">
          <EmptyState title={t("emptyTitle", { query: q })} description={t("emptyBody")} headingLevel="h2" />
          {data.zeroResultBridge?.message && (
            <div className="mx-auto mt-6 max-w-md rounded-md border border-line bg-surface-panel p-5 text-center">
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
        <section className="mt-10">
          <h2 className="block-title">{t("suggestions")}</h2>
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
        <div className="mt-10">
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
    </div>
  );
}