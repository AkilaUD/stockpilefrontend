import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSupplierDetail, getSupplierProducts } from "@/lib/api/catalogue-server";
import type { SupplierDetailResponse, PagedProductResponse } from "@/lib/api/catalogue";
import { ApiClientError } from "@/lib/api/envelope";
import { ProductCard } from "@/components/catalogue/product-card";
import { Pagination } from "@/components/catalogue/pagination";
import { StatusPill } from "@/components/ui/status-pill";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { safeExternalHref } from "@/lib/url/safe-external-href";

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const detail = await getSupplierDetail(slug);
    return { title: detail.name, description: detail.story ?? undefined };
  } catch {
    return { title: "Supplier" };
  }
}

const STOCK_STATES = ["InStock", "OutOfStock", "EnquireForAvailability"] as const;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SupplierPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;

  const view = firstParam(sp.view);
  const pageValue = firstParam(sp.page);
  const page = Math.max(1, Number.parseInt(pageValue ?? "1", 10) || 1);

  let detail: SupplierDetailResponse;
  try {
    detail = await getSupplierDetail(slug);
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) notFound();
    throw error;
  }

  const t = await getTranslations({ locale, namespace: "catalogue.supplier" });
  const tCat = await getTranslations({ locale, namespace: "catalogue" });
  const tProduct = await getTranslations({ locale, namespace: "catalogue.product" });
  const tPager = await getTranslations({ locale, namespace: "catalogue.pagination" });

  const stockLabel = (state: string): string =>
    (STOCK_STATES as readonly string[]).includes(state) ? tCat(`stock.${state}`) : state;
  const websiteHref = safeExternalHref(detail.website);

  // `?view=products` swaps the microsite for this supplier's full catalogue —
  // same page route, still SSR, served from the dedicated endpoint.
  const showAll = view === "products";
  let products: PagedProductResponse | null = null;
  if (showAll) {
    products = await getSupplierProducts(slug, page);
  }

  return (
    <div className="shell-public py-8 md:py-12">
      <nav aria-label="breadcrumb" className="type-meta">
        <Link href="/suppliers" className="text-ink-muted transition-colors duration-instant ease-standard hover:text-ink">
          {t("title")}
        </Link>
        <span aria-hidden="true" className="mx-2 text-ink-faint">/</span>
        <span className="text-ink">{detail.name}</span>
      </nav>

      {!showAll ? (
        <>
          <header className="mt-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="page-title">{detail.name}</h1>
              {(detail.district || detail.location) && (
                <p className="mt-2 type-body text-ink-muted">
                  {[detail.district, detail.location].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
            <StatusPill tone={detail.verified ? "success" : "neutral"}>
              {detail.verified ? t("verified") : t("unverified")}
            </StatusPill>
          </header>

          {(detail.story || detail.categories.length > 0 || detail.contactPerson || detail.phone || detail.email || detail.website) && (
            <div className="mt-8 grid gap-8 md:grid-cols-2">
              {detail.story && (
                <section>
                  <h2 className="block-title">{t("story")}</h2>
                  <p className="mt-3 type-body text-ink">{detail.story}</p>
                </section>
              )}

              {detail.categories.length > 0 && (
                <section>
                  <h2 className="block-title">{t("specialties")}</h2>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {detail.categories.map((name) => (
                      <li key={name} className="type-meta rounded-full border border-line px-3 py-1.5 text-ink-muted">
                        {name}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {(detail.contactPerson || detail.phone || detail.email || detail.website) && (
                <section>
                  <h2 className="block-title">{t("contact")}</h2>
                  <dl className="mt-3 space-y-2">
                    {detail.contactPerson && (
                      <div>
                        <dt className="sr-only">{t("contact")}</dt>
                        <dd className="type-body text-ink">{detail.contactPerson}</dd>
                      </div>
                    )}
                    {detail.phone && (
                      <div className="flex justify-between gap-4">
                        <dt className="type-body text-ink-muted">{t("phone")}</dt>
                        <dd className="type-body text-ink">
                          <a href={`tel:${detail.phone.replace(/\s+/g, "")}`} className="transition-colors duration-instant ease-standard hover:text-ink-accent">
                            {detail.phone}
                          </a>
                        </dd>
                      </div>
                    )}
                    {detail.email && (
                      <div className="flex justify-between gap-4">
                        <dt className="type-body text-ink-muted">{t("email")}</dt>
                        <dd className="type-body text-ink">
                          <a href={`mailto:${detail.email}`} className="transition-colors duration-instant ease-standard hover:text-ink-accent">
                            {detail.email}
                          </a>
                        </dd>
                      </div>
                    )}
                    {websiteHref && (
                      <div className="flex justify-between gap-4">
                        <dt className="type-body text-ink-muted">{t("website")}</dt>
                        <dd className="type-body text-ink">
                          <a
                            href={websiteHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="transition-colors duration-instant ease-standard hover:text-ink-accent"
                          >
                            {websiteHref.replace(/^https?:\/\//, "")}
                          </a>
                        </dd>
                      </div>
                    )}
                  </dl>
                </section>
              )}
            </div>
          )}

          {detail.productCount != null && (
            <p className="mt-8 type-body-sm text-ink-muted">{t("products", { count: detail.productCount })}</p>
          )}

          {detail.featuredProducts && detail.featuredProducts.length > 0 && (
            <section className="mt-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="type-title-md text-ink">{t("featured")}</h2>
                <ButtonLink href={`/suppliers/${detail.slug}?view=products`} variant="secondary" size="sm">
                  {t("allProducts")}
                </ButtonLink>
              </div>
              <Reveal className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
                {detail.featuredProducts.map((item) => (
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
            </section>
          )}
        </>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <p className="type-body text-ink-muted" aria-live="polite">
              {t("products", { count: products?.totalItems ?? 0 })}
            </p>
          </div>

          {products && products.items.length > 0 ? (
            <Reveal className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
              {products.items.map((item) => (
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
            <p className="mt-6 type-body text-ink-muted">{t("products", { count: 0 })}</p>
          )}

          {products && (
            <div className="mt-10">
              <Pagination
                page={products.page}
                pageSize={products.pageSize}
                total={products.totalItems}
                basePath={`/suppliers/${detail.slug}`}
                params={{ view: "products" }}
                labels={{
                  previous: tPager("previous"),
                  next: tPager("next"),
                  pageAria: (p) => tPager("pageAria", { page: p }),
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}