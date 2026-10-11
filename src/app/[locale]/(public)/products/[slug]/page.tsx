import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getProductDetail } from "@/lib/api/catalogue-server";
import type { ProductDetailResponse } from "@/lib/api/catalogue";
import { ApiClientError } from "@/lib/api/envelope";
import { formatMoney } from "@/lib/money";
import { ProductCard } from "@/components/catalogue/product-card";
import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import { Reveal } from "@/components/motion/reveal";

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

function imageUrl(srcset: string | null | undefined): string | null {
  if (!srcset || srcset.trim() === "") return null;
  return srcset.trim().split(/\s+/)[0] ?? null;
}

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

  const src = imageUrl(detail.media[0]?.srcset);
  const price = detail.price;
  const pricePublic = price?.state === "Public" && price.amount != null;
  const taxLabel = price?.taxState && price.taxState !== "Unknown" ? price.taxState : null;

  const stockLabel = (state: string): string =>
    (STOCK_STATES as readonly string[]).includes(state) ? tCat(`stock.${state}`) : state;

  const related = detail.relatedProducts ?? [];

  return (
    <div className="shell-public py-8 md:py-12">
      <nav aria-label="breadcrumb" className="type-meta">
        <Link href="/products" className="text-ink-muted transition-colors duration-instant ease-standard hover:text-ink">
          {tListing("title")}
        </Link>
        <span aria-hidden="true" className="mx-2 text-ink-faint">/</span>
        <Link href={`/suppliers/${detail.supplier.slug}`} className="text-ink-muted transition-colors duration-instant ease-standard hover:text-ink">
          {detail.supplier.name}
        </Link>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_24rem] lg:gap-12">
        <section>
          {src ? (
            <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-line bg-surface-recessed">
              {/* eslint-disable-next-line @next/next/no-img-element -- deliberate: same-origin media rewrite, no optimizer re-fetch. */}
              <img
                src={src}
                alt={detail.media[0]?.alt ?? detail.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-[4/3] rounded-md border border-line bg-surface-recessed" aria-hidden="true" />
          )}
        </section>

        <aside className="flex flex-col gap-6">
          <div>
            <p className="type-label text-ink-accent">{detail.sku}</p>
            <h1 className="mt-2 type-display-md text-ink">{detail.name}</h1>
          </div>

          <div className="flex items-start justify-between gap-4">
            {pricePublic ? (
              <p className="type-title-lg text-ink tabular">
                {formatMoney({ amount: price.amount as number, currency: price.currency, locale })}
                {taxLabel && (
                  <span className="type-meta text-ink-muted"> {taxLabel}</span>
                )}
              </p>
            ) : (
              <p className="type-title-md text-ink-muted">{t("priceOnRequest")}</p>
            )}
            <StatusPill tone={STOCK_TONES[detail.stock?.state ?? ""] ?? "neutral"}>
              {stockLabel(detail.stock?.state ?? "")}
            </StatusPill>
          </div>

          <dl className="space-y-3 border-t border-line pt-5">
            {detail.brand && (
              <div className="flex justify-between gap-4">
                <dt className="type-body text-ink-muted">{t("brand")}</dt>
                <dd className="type-body text-ink">{detail.brand.name}</dd>
              </div>
            )}
            {detail.origin?.countryOfOrigin && (
              <div className="flex justify-between gap-4">
                <dt className="type-body text-ink-muted">{t("countryOfOrigin")}</dt>
                <dd className="type-body text-ink">{detail.origin.countryOfOrigin.name}</dd>
              </div>
            )}
            {detail.origin?.countryOfManufacture && (
              <div className="flex justify-between gap-4">
                <dt className="type-body text-ink-muted">{t("countryOfManufacture")}</dt>
                <dd className="type-body text-ink">{detail.origin.countryOfManufacture.name}</dd>
              </div>
            )}
            {detail.minOrderQuantity != null && (
              <div className="flex justify-between gap-4">
                <dt className="type-body text-ink-muted">{t("minOrderLabel")}</dt>
                <dd className="type-body text-ink tabular">{formatQuantity(detail.minOrderQuantity, locale)}</dd>
              </div>
            )}
            {detail.leadTimeDays != null && (
              <div className="flex justify-between gap-4">
                <dt className="type-body text-ink-muted">{t("leadTimeLabel")}</dt>
                <dd className="type-body text-ink">{t("leadTime", { days: detail.leadTimeDays })}</dd>
              </div>
            )}
          </dl>

          <div className="rounded-md border border-line bg-surface-panel p-5">
            <p className="type-title-sm text-ink">{detail.supplier.name}</p>
            <p className="mt-1 type-body-sm text-ink-muted">
              {detail.supplier.verifiedAt
                ? tCat("supplier.verifiedAt", { date: formatDate(detail.supplier.verifiedAt, locale) })
                : t("unverified")}
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
        <section className="mt-12 max-w-prose">
          <h2 className="type-title-md text-ink">{t("about")}</h2>
          {detail.summary && <p className="mt-3 type-body text-ink">{detail.summary}</p>}
          {detail.description && <p className="mt-3 type-body text-ink">{detail.description}</p>}
        </section>
      )}

      {detail.specifications && detail.specifications.sections.length > 0 && (
        <section className="mt-12">
          <h2 className="type-title-md text-ink">{t("specifications")}</h2>
          <div className="mt-4 grid gap-8 md:grid-cols-2">
            {detail.specifications.sections.map((section) => (
              <div key={section.label}>
                <h3 className="type-label text-ink-accent">{section.label}</h3>
                <dl className="mt-3 divide-y divide-line border-y border-line">
                  {section.attributes.map((row) => (
                    <div key={row.code} className="flex justify-between gap-6 py-2.5">
                      <dt className="type-body-sm text-ink-muted">{row.label}</dt>
                      <dd className="type-body-sm text-ink">
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
        <section className="mt-12 max-w-2xl">
          <h2 className="type-title-md text-ink">{t("priceHistory")}</h2>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {detail.priceHistory.map((entry) => (
              <li key={entry.at} className="flex items-center justify-between gap-6 py-2.5">
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
        <section className="mt-12">
          <h2 className="type-title-md text-ink">{t("related")}</h2>
          <Reveal className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
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
    </div>
  );
}