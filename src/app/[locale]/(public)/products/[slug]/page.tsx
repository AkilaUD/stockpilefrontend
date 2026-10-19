import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ButtonLink } from "@/components/ui/button";
import { getProductDetail } from "@/lib/api/catalogue-server";
import type { ProductDetailResponse } from "@/lib/api/catalogue";
import { ApiClientError } from "@/lib/api/envelope";
import { formatMoney } from "@/lib/money";
import { ProductCard } from "@/components/catalogue/product-card";
import { ProductGallery } from "@/components/catalogue/product-gallery";
import { CatalogueShell } from "@/components/catalogue/catalogue-shell";
import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import { Reveal } from "@/components/motion/reveal";
import { BadgeCheck, FileText, Truck } from "lucide-react";

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const detail = await getProductDetail(slug);
    return { title: detail.name, description: detail.summary ?? detail.name };
  } catch {
    return { title: "Product" };
  }
}

const STOCK_TONES: Record<string, StatusTone> = {
  InStock: "success",
  OutOfStock: "neutral",
  EnquireForAvailability: "warning",
};

const STOCK_STATES = ["InStock", "OutOfStock", "EnquireForAvailability"] as const;

function formatDate(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "numeric" }).format(new Date(value));
}

function formatQuantity(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  let detail: ProductDetailResponse;
  try {
    detail = await getProductDetail(slug);
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) notFound();
    throw error;
  }

  const t = await getTranslations({ locale, namespace: "catalogue.product" });
  const tCat = await getTranslations({ locale, namespace: "catalogue" });
  const tListing = await getTranslations({ locale, namespace: "catalogue.listing" });
  const tActions = await getTranslations({ locale, namespace: "common.actions" });
  const tPager = await getTranslations({ locale, namespace: "catalogue.pagination" });

  const price = detail.price;
  const pricePublic = price?.state === "Public" && price.amount != null;
  const taxLabel = price?.taxState && price.taxState !== "Unknown" ? price.taxState : null;
  const priceReason = !pricePublic && detail.visibility?.reason ? detail.visibility.reason : null;

  const stockLabel = (state: string): string =>
    (STOCK_STATES as readonly string[]).includes(state) ? tCat(`stock.${state}`) : state;

  const related = detail.relatedProducts ?? [];

  const crumbs = [
    { label: tListing("title"), href: "/products" },
    { label: detail.supplier.name, href: `/suppliers/${detail.supplier.slug}` },
    { label: detail.name },
  ];

  return (
    <CatalogueShell crumbs={crumbs} title={detail.name}>
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <section className="lg:col-span-7">
          <ProductGallery
            media={detail.media}
            productName={detail.name}
            previousLabel={tPager("previous")}
            nextLabel={tPager("next")}
          />
        </section>

        <aside className="flex flex-col gap-6 lg:col-span-5">
          <div>
            <p className="type-meta tabular text-ink-muted">{t("sku", { sku: detail.sku })}</p>
          </div>

          <div className="rounded-sm border border-line bg-surface-panel p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                {pricePublic ? (
                  <p className="font-display text-3xl font-extrabold tracking-tight text-ink tabular">
                    {formatMoney({ amount: price.amount as number, currency: price.currency, locale })}
                    {taxLabel && <span className="type-meta font-body font-normal text-ink-muted"> {taxLabel}</span>}
                  </p>
                ) : (
                  <p className="font-display text-2xl font-bold tracking-tight text-ink-muted">{t("priceOnRequest")}</p>
                )}
                {priceReason && (
                  <p className="mt-2 type-body-sm text-ink-muted">{priceReason}</p>
                )}
              </div>
              <StatusPill tone={STOCK_TONES[detail.stock?.state ?? ""] ?? "neutral"}>
                {stockLabel(detail.stock?.state ?? "")}
              </StatusPill>
            </div>

            {detail.canAddToRfq && (
              <div className="mt-6 border-t border-line pt-5">
                <ButtonLink href="/rfq" fullWidth>
                  {tActions("requestQuote")}
                </ButtonLink>
                <p className="mt-2 type-meta text-ink-muted">{t("requestQuoteHint")}</p>
              </div>
            )}
          </div>

          <dl className="space-y-3 rounded-sm border border-line bg-surface-panel p-5 md:p-6">
            {detail.brand && (
              <div className="flex justify-between gap-4">
                <dt className="type-body-sm text-ink-muted">{t("brand")}</dt>
                <dd className="type-body-sm text-ink">{detail.brand.name}</dd>
              </div>
            )}
            {detail.origin?.countryOfOrigin && (
              <div className="flex justify-between gap-4">
                <dt className="type-body-sm text-ink-muted">{t("countryOfOrigin")}</dt>
                <dd className="type-body-sm text-ink">{detail.origin.countryOfOrigin.name}</dd>
              </div>
            )}
            {detail.origin?.countryOfManufacture && (
              <div className="flex justify-between gap-4">
                <dt className="type-body-sm text-ink-muted">{t("countryOfManufacture")}</dt>
                <dd className="type-body-sm text-ink">{detail.origin.countryOfManufacture.name}</dd>
              </div>
            )}
            {detail.minOrderQuantity != null && (
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 type-body-sm text-ink-muted">
                  <FileText className="size-4 shrink-0" aria-hidden />
                  {t("minOrderLabel")}
                </dt>
                <dd className="type-body-sm text-ink tabular">{formatQuantity(detail.minOrderQuantity, locale)}</dd>
              </div>
            )}
            {detail.leadTimeDays != null && (
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 type-body-sm text-ink-muted">
                  <Truck className="size-4 shrink-0" aria-hidden />
                  {t("leadTimeLabel")}
                </dt>
                <dd className="type-body-sm text-ink">{t("leadTime", { days: detail.leadTimeDays })}</dd>
              </div>
            )}
          </dl>

          <div className="rounded-sm border border-line bg-surface-panel p-5 md:p-6">
            <p className="font-display text-lg font-bold tracking-tight text-ink">{detail.supplier.name}</p>
            <p className="mt-1 flex items-center gap-1.5 type-body-sm text-ink-muted">
              {detail.supplier.verifiedAt ? (
                <>
                  <BadgeCheck className="size-4 shrink-0 text-ink" aria-hidden />
                  {tCat("supplier.verifiedAt", { date: formatDate(detail.supplier.verifiedAt, locale) })}
                </>
              ) : (
                t("unverified")
              )}
            </p>
            <Link
              href={`/suppliers/${detail.supplier.slug}`}
              className="mt-3 inline-block type-body font-medium text-ink transition-colors duration-instant ease-standard hover:text-ink-accent"
            >
              {tCat("supplier.viewSupplier")}
            </Link>
          </div>
        </aside>
      </div>

      {(detail.summary || detail.description) && (
        <section className="mt-14 max-w-prose">
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink">{t("about")}</h2>
          {detail.summary && <p className="mt-4 type-body leading-relaxed text-ink">{detail.summary}</p>}
          {detail.description && <p className="mt-4 type-body leading-relaxed text-ink">{detail.description}</p>}
        </section>
      )}

      {detail.specifications && detail.specifications.sections.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink">{t("specifications")}</h2>
          <div className="mt-6 grid gap-8 md:grid-cols-2">
            {detail.specifications.sections.map((section) => (
              <div key={section.label} className="rounded-sm border border-line bg-surface-panel p-5">
                <h3 className="type-label font-semibold tracking-wide text-ink">{section.label}</h3>
                <dl className="mt-4 divide-y divide-line">
                  {section.attributes.map((row) => (
                    <div key={row.code} className="flex justify-between gap-6 py-2.5">
                      <dt className="type-body-sm text-ink-muted">{row.label}</dt>
                      <dd className="type-body-sm text-right text-ink tabular">
                        {row.value}
                        {row.unit ? ` ${row.unit}` : ""}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </section>
      )}

      {detail.priceHistory && detail.priceHistory.length > 0 && (
        <section className="mt-14 max-w-2xl">
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink">{t("priceHistory")}</h2>
          <ul className="mt-4 divide-y divide-line rounded-sm border border-line bg-surface-panel">
            {detail.priceHistory.map((entry) => (
              <li key={entry.at} className="flex items-center justify-between gap-6 px-5 py-3">
                <span className="type-body-sm text-ink-muted">{t("onDate", { date: formatDate(entry.at, locale) })}</span>
                <span className="type-body-sm text-ink tabular">
                  {formatMoney({ amount: entry.amount, currency: detail.price?.currency ?? "LKR", locale })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink">{t("related")}</h2>
          <Reveal className="catalogue-grid mt-6 gap-3 md:gap-4">
            {related.map((item) => (
              <ProductCard
                key={item.publicId}
                item={item}
                locale={locale}
                priceOnRequest={t("priceOnRequest")}
                minOrderLabel={
                  item.minOrderQuantity != null ? t("minOrder", { quantity: item.minOrderQuantity }) : undefined
                }
                stockLabel={stockLabel}
              />
            ))}
          </Reveal>
        </section>
      )}
    </CatalogueShell>
  );
}
