import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getSupplierDetail, getSupplierProducts } from "@/lib/api/catalogue-server";
import type { SupplierDetailResponse, PagedProductResponse } from "@/lib/api/catalogue";
import { ApiClientError } from "@/lib/api/envelope";
import { ProductCard } from "@/components/catalogue/product-card";
import { Pagination } from "@/components/catalogue/pagination";
import { CatalogueShell } from "@/components/catalogue/catalogue-shell";
import { StatusPill } from "@/components/ui/status-pill";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { safeExternalHref } from "@/lib/url/safe-external-href";
import { imageUrl } from "@/lib/media-url";
import { BadgeCheck, Globe, Mail, Phone } from "lucide-react";

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
  const logo = imageUrl(detail.logo?.srcset);

  const showAll = view === "products";
  let products: PagedProductResponse | null = null;
  if (showAll) {
    products = await getSupplierProducts(slug, page);
  }

  const crumbs = showAll
    ? [
        { label: t("title"), href: "/suppliers" },
        { label: detail.name, href: `/suppliers/${detail.slug}` },
        { label: t("allProducts") },
      ]
    : [{ label: t("title"), href: "/suppliers" }, { label: detail.name }];

  const headerAside = !showAll ? (
    <div className="flex flex-wrap items-start gap-4">
      {logo && (
        <span className="relative size-20 shrink-0 overflow-hidden rounded-sm border border-line bg-surface-recessed sm:size-24">
          {/* eslint-disable-next-line @next/next/no-img-element -- catalogue media via rewrite */}
          <img
            src={logo}
            alt={detail.logo?.alt ?? detail.name}
            loading="eager"
            decoding="async"
            className="h-full w-full object-contain p-2"
          />
        </span>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <StatusPill tone={detail.verified ? "success" : "neutral"}>
          {detail.verified ? (
            <span className="inline-flex items-center gap-1">
              <BadgeCheck className="size-3.5" aria-hidden />
              {t("verified")}
            </span>
          ) : (
            t("unverified")
          )}
        </StatusPill>
        {(detail.district || detail.location) && (
          <p className="type-body text-ink-muted">{[detail.district, detail.location].filter(Boolean).join(" · ")}</p>
        )}
      </div>
    </div>
  ) : undefined;

  return (
    <CatalogueShell crumbs={crumbs} title={detail.name} aside={headerAside}>
      {!showAll ? (
        <>
          {(detail.story || detail.categories.length > 0 || detail.contactPerson || detail.phone || detail.email || detail.website) && (
            <div className="grid gap-8 lg:grid-cols-2">
              {detail.story && (
                <section className="rounded-sm border border-line bg-surface-panel p-5 md:p-6">
                  <h2 className="font-display text-lg font-bold tracking-tight text-ink">{t("story")}</h2>
                  <p className="mt-3 type-body leading-relaxed text-ink">{detail.story}</p>
                </section>
              )}

              {detail.categories.length > 0 && (
                <section className="rounded-sm border border-line bg-surface-panel p-5 md:p-6">
                  <h2 className="font-display text-lg font-bold tracking-tight text-ink">{t("specialties")}</h2>
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
                <section className="rounded-sm border border-line bg-surface-panel p-5 md:p-6 lg:col-span-2">
                  <h2 className="font-display text-lg font-bold tracking-tight text-ink">{t("contact")}</h2>
                  <dl className="mt-4 space-y-3">
                    {detail.contactPerson && (
                      <div>
                        <dt className="sr-only">{t("contact")}</dt>
                        <dd className="type-body text-ink">{detail.contactPerson}</dd>
                      </div>
                    )}
                    {detail.phone && (
                      <div className="flex items-center justify-between gap-4">
                        <dt className="flex shrink-0 items-center gap-2 type-body-sm text-ink-muted">
                          <Phone className="size-4 shrink-0" aria-hidden />
                          {t("phone")}
                        </dt>
                        <dd className="min-w-0 break-all type-body text-right text-ink">
                          <a href={`tel:${detail.phone.replace(/\s+/g, "")}`} className="transition-colors duration-instant ease-standard hover:text-ink-accent">
                            {detail.phone}
                          </a>
                        </dd>
                      </div>
                    )}
                    {detail.email && (
                      <div className="flex items-center justify-between gap-4">
                        <dt className="flex shrink-0 items-center gap-2 type-body-sm text-ink-muted">
                          <Mail className="size-4 shrink-0" aria-hidden />
                          {t("email")}
                        </dt>
                        <dd className="min-w-0 truncate type-body text-right text-ink" title={detail.email}>
                          <a href={`mailto:${detail.email}`} className="transition-colors duration-instant ease-standard hover:text-ink-accent">
                            {detail.email}
                          </a>
                        </dd>
                      </div>
                    )}
                    {websiteHref && (
                      <div className="flex items-center justify-between gap-4">
                        <dt className="flex shrink-0 items-center gap-2 type-body-sm text-ink-muted">
                          <Globe className="size-4 shrink-0" aria-hidden />
                          {t("website")}
                        </dt>
                        <dd className="min-w-0 truncate type-body text-right text-ink" title={websiteHref}>
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
            <section className="mt-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="font-display text-xl font-bold tracking-tight text-ink">{t("featured")}</h2>
                <ButtonLink href={`/suppliers/${detail.slug}?view=products`} variant="secondary" size="sm">
                  {t("allProducts")}
                </ButtonLink>
              </div>
              <Reveal className="catalogue-grid mt-6 gap-3 md:gap-4">
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
          <p className="type-body text-ink-muted" aria-live="polite">
            {t("products", { count: products?.totalItems ?? 0 })}
          </p>

          {products && products.items.length > 0 ? (
            <Reveal className="catalogue-grid mt-6 gap-3 md:gap-4">
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
    </CatalogueShell>
  );
}
