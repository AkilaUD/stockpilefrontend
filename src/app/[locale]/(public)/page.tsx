import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import {
  getCatalogueSummary,
  getCategoryTree,
  getProductListing,
  getSupplierDirectory,
} from "@/lib/api/catalogue-server";
import { getArticles } from "@/lib/api/content-server";
import { HeroBanner } from "@/components/home/hero-banner";
import { HeroSearch } from "@/components/home/hero-search";
import { StatsBand } from "@/components/home/stats-band";
import { MostSearched } from "@/components/home/most-searched";
import { ProductGridSection } from "@/components/home/product-grid-section";
import { NewestSuppliers } from "@/components/home/newest-suppliers-section";
import { BecomeSupplierBand } from "@/components/home/become-supplier-band";
import { NewsBand } from "@/components/home/news-band";
import { ProcurementWorkflow } from "@/components/home/procurement-workflow";
import { HomeGsap } from "@/components/home/home-gsap";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Material Atlas home — live catalogue reads only.
 * Trust band = catalog/summary (+ department count from tree roots).
 * No invented RFQ/call counters.
 */

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

const STOCK_STATES = ["InStock", "OutOfStock", "EnquireForAvailability"] as const;

async function safeRead<T>(read: () => Promise<T>): Promise<T | null> {
  try {
    return await read();
  } catch (error) {
    console.error("[home] catalogue read failed; omitting section:", error);
    return null;
  }
}

function formatCount(locale: string, n: number): string {
  return n.toLocaleString(locale);
}

function HomeSectionSkeleton() {
  return (
    <div className="shell-public py-10" aria-hidden="true">
      <Skeleton className="h-8 w-64" />
      <div className="home-product-grid mt-6 gap-x-6 gap-y-8">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

async function StatsBandSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home" });
  const data = await safeRead(() => Promise.all([getCategoryTree(), getCatalogueSummary()]));
  if (!data) return null;
  const [tree, summary] = data;
  const departments = tree.filter((node) => node.isRoot);

  const stats = [
    { label: t("stats.products"), value: formatCount(locale, summary.products) },
    { label: t("stats.suppliers"), value: formatCount(locale, summary.suppliers) },
    { label: t("stats.departments"), value: formatCount(locale, departments.length) },
    { label: t("stats.categories"), value: formatCount(locale, summary.categories) },
  ];

  return <StatsBand stats={stats} />;
}

async function ProductSweepSection({
  locale,
  title,
  viewAllLabel,
  page,
}: {
  locale: string;
  title: string;
  viewAllLabel: string;
  page: 1 | 2;
}) {
  const tCat = await getTranslations({ locale, namespace: "catalogue" });
  const tProduct = await getTranslations({ locale, namespace: "catalogue.product" });

  const priceOnRequest = tProduct("priceOnRequest");
  const stockLabel = (state: string): string =>
    (STOCK_STATES as readonly string[]).includes(state) ? tCat(`stock.${state}`) : state;

  const listing = await safeRead(() => getProductListing({ sort: "newest", page, pageSize: 8 }));
  if (!listing) return null;

  return (
    <ProductGridSection
      title={title}
      items={listing.items}
      locale={locale}
      priceOnRequest={priceOnRequest}
      stockLabel={stockLabel}
      viewAllHref="/products?sort=newest"
      viewAllLabel={viewAllLabel}
    />
  );
}

async function NewestSuppliersSection() {
  const directory = await safeRead(() => getSupplierDirectory());
  if (!directory) return null;
  return <NewestSuppliers suppliers={directory.items} limit={6} />;
}

async function HomeNewsBandSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home" });
  const page = await safeRead(() => getArticles({ page: 1, pageSize: 6, locale }));
  if (!page || page.items.length === 0) return null;
  return (
    <NewsBand
      title={t("news.title")}
      viewAllLabel={t("news.viewAll")}
      articles={page.items}
      locale={locale}
    />
  );
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  const workflowSteps = [0, 1, 2, 3, 4].map((index) => ({
    label: t(`workflow.steps.${index}.label`),
    title: t(`workflow.steps.${index}.title`),
    body: t(`workflow.steps.${index}.body`),
  }));

  return (
    <>
      <HomeGsap />
      <HeroBanner
        headline={t("hero.headline")}
        lede={t("hero.lede")}
        alt={t("hero.bannerAlt")}
        cta={t("hero.bannerCta")}
        rfqCta={t("hero.rfqCta")}
        supplierCta={t("hero.supplierCta")}
        searchSlot={<HeroSearch />}
      />

      <Suspense fallback={<HomeSectionSkeleton />}>
        <StatsBandSection locale={locale} />
      </Suspense>

      <div data-home-reveal>
        <MostSearched />
      </div>

      <Suspense fallback={<HomeSectionSkeleton />}>
        <div data-home-reveal>
          <ProductSweepSection
            locale={locale}
            title={t("featured.title")}
            viewAllLabel={t("featured.viewAll")}
            page={1}
          />
        </div>
      </Suspense>

      <ProcurementWorkflow
        title={t("workflow.title")}
        lede={t("workflow.lede")}
        steps={workflowSteps}
        ctaLabel={t("workflow.cta")}
        ctaHref="/rfq"
      />

      <Suspense fallback={<HomeSectionSkeleton />}>
        <div data-home-reveal>
          <NewestSuppliersSection />
        </div>
      </Suspense>

      <BecomeSupplierBand
        title={t("becomeSupplier.title")}
        lede={t("becomeSupplier.lede")}
        cta={t("becomeSupplier.cta")}
        pricingCta={t("becomeSupplier.pricingCta")}
      />

      <Suspense fallback={<HomeSectionSkeleton />}>
        <div data-home-reveal>
          <ProductSweepSection
            locale={locale}
            title={t("newestProducts.title")}
            viewAllLabel={t("newestProducts.viewAll")}
            page={2}
          />
        </div>
      </Suspense>

      <Suspense fallback={<HomeSectionSkeleton />}>
        <div data-home-reveal>
          <HomeNewsBandSection locale={locale} />
        </div>
      </Suspense>
    </>
  );
}
