import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getProductListing } from "@/lib/api/catalogue-server";
import { ProductCard } from "@/components/catalogue/product-card";
import { Pagination } from "@/components/catalogue/pagination";
import { Reveal } from "@/components/motion/reveal";
import { EmptyState } from "@/components/ui/empty-state";
import { InfoPage } from "@/components/pages/info-page";

/**
 * /newest-products — the reference's Newest Products catalogue page (reference
 * reconstruction §4.4 / PARITY.md gap C).
 *
 * Unlike the editorial pages, this route is a real listing on the reference too:
 * it is the catalogue sorted newest-first. So it is rendered from this build's
 * own catalogue (`getProductListing({ sort: "newest" })`) rather than from
 * captured copy — the products shown are ours, which is the honest equivalent of
 * the reference's own newest-first grid. The heading copy ("Newest Products" /
 * "See the latest products added by our suppliers on Stockpile.") is the
 * reference's.
 */
const STOCK_STATES = ["InStock", "OutOfStock", "EnquireForAvailability"] as const;

/** First value of a possibly-repeated search param (Next may hand us arrays). */
function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.newestProducts" });
  return { title: t("title"), description: t("lede") };
}

export default async function NewestProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "pages.newestProducts" });
  const tListing = await getTranslations({ locale, namespace: "catalogue.listing" });
  const tCat = await getTranslations({ locale, namespace: "catalogue" });
  const tProduct = await getTranslations({ locale, namespace: "catalogue.product" });
  const tPager = await getTranslations({ locale, namespace: "catalogue.pagination" });

  const page = Math.max(1, Number.parseInt(firstParam(sp.page) ?? "1", 10) || 1);
  const data = await getProductListing({ sort: "newest", page });
  const totalPages = Math.max(1, Math.ceil(data.totalItems / data.pageSize));

  const stockLabel = (state: string): string =>
    (STOCK_STATES as readonly string[]).includes(state) ? tCat(`stock.${state}`) : state;

  return (
    <InfoPage breadcrumb={t("title")} title={t("title")} lede={t("lede")}>
      {data.items.length === 0 ? (
        <EmptyState
          title={tListing("emptyTitle")}
          description={tListing("emptyBody")}
          headingLevel="h2"
        />
      ) : (
        <Reveal className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
          {data.items.map((item) => (
            <ProductCard
              key={item.publicId}
              item={item}
              locale={locale}
              priceOnRequest={tProduct("priceOnRequest")}
              minOrderLabel={
                item.minOrderQuantity != null
                  ? tProduct("minOrder", { quantity: item.minOrderQuantity })
                  : undefined
              }
              stockLabel={stockLabel}
            />
          ))}
        </Reveal>
      )}

      {totalPages > 1 && (
        <div className="mt-10">
          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.totalItems}
            basePath="/newest-products"
            params={{}}
            labels={{
              previous: tPager("previous"),
              next: tPager("next"),
              pageAria: (p) => tPager("pageAria", { page: p }),
            }}
          />
        </div>
      )}
    </InfoPage>
  );
}
