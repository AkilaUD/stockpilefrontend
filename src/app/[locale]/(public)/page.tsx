import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import {
  getCatalogueSummary,
  getCategoryTree,
  getProductListing,
  getSupplierDirectory,
} from "@/lib/api/catalogue-server";
import { HeroBanner } from "@/components/home/hero-banner";
import { StatsBand } from "@/components/home/stats-band";
import { MostSearched } from "@/components/home/most-searched";
import { ProductGridSection } from "@/components/home/product-grid-section";
import { NewestSuppliers } from "@/components/home/newest-suppliers-section";
import { BecomeSupplierBand } from "@/components/home/become-supplier-band";

/**
 * Home — the public landing, reconstructed against the original
 * Stockpile.lk section order (reference reconstruction Phase 2 §4.4):
 *
 *   1. hero banner      (original "how it works" graphic → /how-it-works)
 *   2. stats band       (dark count band — honest live figures)
 *   3. most searched    (6 original tiles → real category routes)
 *   4. featured products (newest first sweep, page 1)
 *   5. newest suppliers  (directory registration order)
 *   6. become a supplier (signal-yellow band)
 *   7. newest products   (newest sweep, page 2 — real "more recent" list)
 *
 * Server-rendered from live reads only: category tree, newest listings,
 * supplier directory, catalogue summary. No section renders invented
 * numbers or dead CTAs (§0.6): the reference RFQ/call counters have no
 * endpoint here, so the stats band shows Products · Suppliers ·
 * Departments · Districts instead (dependency documented in stats-band).
 *
 * Streaming: the hero and the static bands are data-free and render with the
 * first flush; every data-driven section below them fetches in its own
 * Suspense boundary. A slow read shows that section's skeleton; a read that
 * FAILS (e.g. the public-read rate limiter answering 429 under a burst) omits
 * just that section — the shell, hero and every other section still render,
 * so the page never white-screens on a busy/limited origin. (Before this,
 * the whole home body sat behind one Promise.all of five catalogue reads, and
 * a failed read reached the route error boundary — see reconstruction notes.)
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

/**
 * Reads one home section's data. A failed read (network/5xx after the server
 * retry, or a 4xx such as the public-read rate limiter's 429) resolves to
 * `null` so the owning section is omitted rather than thrown: the shell, hero
 * and sibling sections still stream, and the failure is left in the server log
 * instead of becoming a blank error page.
 */
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

/** Decorative load placeholder for a home section (same shell as loading.tsx). */
function HomeSectionSkeleton() {
  return (
    <div className="shell-public pb-[30px]" aria-hidden="true">
      <div className="px-5 py-[5px]">
        <div className="h-8 w-64 rounded bg-surface-recessed" />
      </div>
      <div className="home-product-grid mt-[5px] gap-x-[30px] gap-y-8 px-5">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="aspect-square bg-surface-recessed" />
            <div className="h-4 w-3/4 rounded bg-surface-recessed" />
            <div className="h-4 w-1/2 rounded bg-surface-recessed" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Stats band — own read of catalogue summary + category tree. */
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

/** A titled product sweep (featured = newest page 1, newest = newest page 2). */
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

/** Newest suppliers — own read of the directory, head of the list. */
async function NewestSuppliersSection() {
  const directory = await safeRead(() => getSupplierDirectory());
  if (!directory) return null;
  return <NewestSuppliers suppliers={directory.items} limit={6} />;
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  return (
    <>
      <HeroBanner
        headline={t("hero.headline")}
        alt={t("hero.bannerAlt")}
        cta={t("hero.bannerCta")}
      />

      <Suspense fallback={<HomeSectionSkeleton />}>
        <StatsBandSection locale={locale} />
      </Suspense>

      <MostSearched />

      <Suspense fallback={<HomeSectionSkeleton />}>
        <ProductSweepSection
          locale={locale}
          title={t("featured.title")}
          viewAllLabel={t("featured.viewAll")}
          page={1}
        />
      </Suspense>

      <Suspense fallback={<HomeSectionSkeleton />}>
        <NewestSuppliersSection />
      </Suspense>

      <BecomeSupplierBand
        title={t("becomeSupplier.title")}
        lede={t("becomeSupplier.lede")}
        cta={t("becomeSupplier.cta")}
        pricingCta={t("becomeSupplier.pricingCta")}
      />

      <Suspense fallback={<HomeSectionSkeleton />}>
        <ProductSweepSection
          locale={locale}
          title={t("newestProducts.title")}
          viewAllLabel={t("newestProducts.viewAll")}
          page={2}
        />
      </Suspense>
    </>
  );
}