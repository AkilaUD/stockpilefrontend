import Image from "next/image";
import { ArrowRight, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { ProductListItem, SupplierDirectoryItem } from "@/lib/api/catalogue";
import type { ArticleSummary } from "@/lib/api/content";
import { ProductCard } from "@/components/catalogue/product-card";
import { SectionHeader } from "@/components/ui/page-header";
import { buttonClassName } from "@/components/ui/button";
import { cx } from "@/lib/cx";

export async function NewestProducts({ locale, items }: { locale: string; items: ProductListItem[] }) {
  const t = await getTranslations({ locale, namespace: "home" });
  const tCat = await getTranslations({ locale, namespace: "catalogue" });
  const tProduct = await getTranslations({ locale, namespace: "catalogue.product" });
  const stockLabel = (state: string) => (tCat.has(`stock.${state}`) ? tCat(`stock.${state}`) : state);
  return (
    <div data-home-reveal>
      <SectionHeader
        title={t("newestProducts.title")}
        actions={
          <Link
            href="/products?sort=newest"
            className="type-body-sm inline-flex items-center gap-1 font-semibold text-ink hover:underline"
          >
            {t("newestProducts.viewAll")} <ArrowRight className="size-4" aria-hidden />
          </Link>
        }
      />
      <ul className="home-product-grid mt-7 gap-3">
        {items.slice(0, 10).map((item) => (
          <li key={item.publicId}>
            <ProductCard
              item={item}
              locale={locale}
              priceOnRequest={tProduct("priceOnRequest")}
              stockLabel={stockLabel}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function SupplierSection({
  locale,
  suppliers,
}: {
  locale: string;
  suppliers: SupplierDirectoryItem[];
}) {
  const t = await getTranslations({ locale, namespace: "home" });
  return (
    <div data-home-reveal>
      <SectionHeader
        title={t("newestSuppliers.title")}
        lede={t("supplierDesk.meta", { count: suppliers.length })}
        actions={
          <Link
            href="/suppliers"
            className="type-body-sm inline-flex items-center gap-1 font-semibold text-ink hover:underline"
          >
            {t("newestSuppliers.viewAll")} <ArrowRight className="size-4" aria-hidden />
          </Link>
        }
      />
      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <ul className="grid gap-3 sm:grid-cols-2">
          {suppliers.map((supplier) => (
            <li key={supplier.publicId} className="rounded-lg border border-line bg-surface-panel p-4 transition hover:shadow-elev-md">
              <p className="flex flex-wrap items-center gap-2">
                <span className="type-title-sm text-ink">{supplier.name}</span>
                {supplier.verified ? (
                  <span className="type-meta inline-flex items-center gap-1 font-medium text-ink">
                    <CheckCircle2 className="size-3.5" aria-hidden />
                    {t("supplierDesk.verified")}
                  </span>
                ) : null}
              </p>
              <p className="type-meta mt-1">
                {[
                  supplier.district || supplier.location || t("supplierDesk.locationPending"),
                  typeof supplier.productCount === "number"
                    ? t("supplierDesk.products", { count: supplier.productCount })
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <Link
                href={`/suppliers/${supplier.slug}`}
                className="type-body-sm mt-3 inline-flex items-center gap-1 font-semibold text-ink hover:underline"
              >
                {t("supplierDesk.profile")} <ArrowUpRight className="size-3.5" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
        <div className="self-start">
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg">
            <Image
              src="/home/home-supplier-yard.jpg"
              alt={t("supplierDesk.plateAlt")}
              fill
              sizes="(min-width: 1024px) 35vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="mt-4 rounded-lg border border-line bg-surface-panel p-5">
            <h3 className="type-title-md text-ink">{t("supplierDesk.tabTitle")}</h3>
            <p className="type-body-sm mt-2 text-ink-muted">{t("supplierDesk.tabBody")}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/supplier-register" className={buttonClassName({ variant: "primary", size: "md" })}>
                {t("supplierDesk.tabCta")}
              </Link>
              <Link href="/pricing" className={buttonClassName({ variant: "secondary", size: "md" })}>
                {t("supplierDesk.pricingCta")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function ArticlesSection({
  locale,
  articles,
}: {
  locale: string;
  articles: ArticleSummary[];
}) {
  const t = await getTranslations({ locale, namespace: "home" });
  return (
    <div data-home-reveal>
      <SectionHeader
        title={t("news.title")}
        actions={
          <Link
            href="/news"
            className="type-body-sm inline-flex items-center gap-1 font-semibold text-ink hover:underline"
          >
            {t("news.viewAll")} <ArrowRight className="size-4" aria-hidden />
          </Link>
        }
      />
      <ul className="mt-7 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <li key={article.publicId}>
            <Link
              href={`/news/post/${encodeURIComponent(article.slug)}`}
              className="group flex h-full flex-col rounded-lg border border-line bg-surface-panel p-4 transition hover:border-line-strong hover:shadow-elev-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <span className="type-meta">
                {article.kind}
                {article.publishedAt
                  ? ` · ${new Date(article.publishedAt).toLocaleDateString(locale, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}`
                  : ""}
              </span>
              <span className="type-title-sm mt-2 text-ink group-hover:underline">{article.title}</span>
              {article.excerpt ? (
                <span className="type-body-sm mt-2 line-clamp-3 text-ink-muted">{article.excerpt}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function ClosingCta({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home" });
  return (
    <section
      className="rounded-lg bg-brand-primary px-5 py-10 text-ink-on-signal sm:px-10 sm:py-12"
      data-home-reveal
    >
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-[48ch]">
          <h2 className="type-display-md text-ink-on-signal">{t("finalCta.title")}</h2>
          <p className="type-body mt-2 text-ink-on-signal/80">{t("finalCta.lede")}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href="#materials-list"
            className={cx(
              buttonClassName({ variant: "secondary", size: "lg" }),
              "border-ink bg-surface-elevated text-ink hover:bg-surface-panel",
            )}
          >
            {t("ledger.startList")}
          </a>
          <Link
            href="/products"
            className="type-body inline-flex items-center gap-2 px-4 py-2.5 font-semibold text-ink-on-signal underline-offset-4 hover:underline"
          >
            {t("finalCta.browseCta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
