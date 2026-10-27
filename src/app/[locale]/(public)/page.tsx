import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import {
  getCatalogueSummary,
  getCategoryTree,
  getProductListing,
  getSupplierDirectory,
  getUnits,
} from "@/lib/api/catalogue-server";
import { getArticles } from "@/lib/api/content-server";
import { sortDepartments } from "@/lib/navigation/navigation";
import { HomeHero, type HeroStats } from "@/components/home/home-hero";
import { HomeProcurementRibbon } from "@/components/home/home-procurement-ribbon";
import { HomeDepartmentMosaic } from "@/components/home/home-department-mosaic";
import { MaterialsListBuilder, type BuilderOption } from "@/components/home/materials-list-builder";
import {
  ArticlesSection,
  ClosingCta,
  NewestProducts,
  SupplierSection,
} from "@/components/home/home-sections";
import { HomeWorkflowScroll } from "@/components/home/home-workflow-scroll";
import { HomeFaq } from "@/components/home/home-faq";
import { LazyHomeMotion } from "@/components/home/lazy-home-motion";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Maximal-impact Modern Construction Procurement home.
 *
 * Full-bleed hero → procurement ribbon → department mosaic → materials list
 * → newest products → workflow scroll peak (labelled EXAMPLE comparison) →
 * suppliers → articles → FAQ → closing CTA. Live catalogue data only;
 * example comparison stays labelled. No invented metrics.
 */

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

async function safeRead<T>(read: () => Promise<T>): Promise<T | null> {
  try {
    return await read();
  } catch (error) {
    console.error("[home] catalogue read failed; omitting section:", error);
    return null;
  }
}

function SectionSkeleton() {
  return (
    <div className="shell-public py-10" aria-hidden="true">
      <Skeleton className="h-6 w-56" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}

async function CoverSection({ locale }: { locale: string }) {
  const data = await safeRead(() => Promise.all([getCatalogueSummary(), getCategoryTree()]));
  let stats: HeroStats | null = null;
  if (data) {
    const [summary, tree] = data;
    stats = {
      products: summary.products,
      suppliers: summary.suppliers,
      departments: tree.filter((node) => node.isRoot).length,
      categories: summary.categories,
    };
  }
  return <HomeHero locale={locale} stats={stats} />;
}

async function BuilderSection() {
  const data = await safeRead(() => Promise.all([getCategoryTree(), getUnits()]));
  let departments: BuilderOption[] = [];
  let units: BuilderOption[] = [];
  if (data) {
    const [tree, unitRows] = data;
    departments = sortDepartments(tree).map((node) => ({ value: node.slug, label: node.name }));
    units = unitRows.map((unit) => ({ value: unit.code, label: unit.name }));
  }
  return <MaterialsListBuilder departments={departments} units={units} />;
}

async function MosaicSection({ locale }: { locale: string }) {
  const tree = await safeRead(() => getCategoryTree());
  if (!tree) return null;
  const departments = sortDepartments(tree).slice(0, 8);
  return <HomeDepartmentMosaic locale={locale} departments={departments} />;
}

async function RegisterSection({ locale }: { locale: string }) {
  const listing = await safeRead(() => getProductListing({ sort: "newest", page: 1, pageSize: 10 }));
  if (!listing || listing.items.length === 0) return null;
  return <NewestProducts locale={locale} items={listing.items} />;
}

async function SupplierDeskSection({ locale }: { locale: string }) {
  const directory = await safeRead(() => getSupplierDirectory());
  if (!directory || directory.items.length === 0) return null;
  return <SupplierSection locale={locale} suppliers={directory.items.slice(0, 6)} />;
}

async function AnnexSection({ locale }: { locale: string }) {
  const page = await safeRead(() => getArticles({ page: 1, pageSize: 3, locale }));
  if (!page || page.items.length === 0) return null;
  return <ArticlesSection locale={locale} articles={page.items} />;
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  const steps = [0, 1, 2, 3, 4].map((index) => ({
    state: t(`workflow.states.${index}`),
    title: t(`workflow.steps.${index}.title`),
    body: t(`workflow.steps.${index}.body`),
  }));

  const exampleRows = [
    { supplier: "A", unitPrice: "Rs 4,850", leadDays: 3, total: "Rs 485,000", lowest: false },
    { supplier: "B", unitPrice: "Rs 4,620", leadDays: 5, total: "Rs 462,000", lowest: true },
    { supplier: "C", unitPrice: "Rs 4,790", leadDays: 2, total: "Rs 479,000", lowest: false },
  ].map((row) => ({
    supplier: `${t("benefits.example.supplier")} ${row.supplier}`,
    unitPrice: row.unitPrice,
    leadTime: t("benefits.example.days", { count: row.leadDays }),
    total: row.total,
    lowest: row.lowest,
  }));

  const faqItems = [0, 1, 2, 3, 4, 5].map((index) => ({
    question: t(`faq.items.${index}.q`),
    answer: t(`faq.items.${index}.a`),
  }));

  return (
    <>
      <LazyHomeMotion />

      <Suspense fallback={<SectionSkeleton />}>
        <CoverSection locale={locale} />
      </Suspense>

      <HomeProcurementRibbon locale={locale} />

      <section className="shell-public py-10 sm:py-12">
        <Suspense fallback={<SectionSkeleton />}>
          <MosaicSection locale={locale} />
        </Suspense>
      </section>

      <section className="shell-public py-10 sm:py-12">
        <Suspense fallback={<SectionSkeleton />}>
          <BuilderSection />
        </Suspense>
      </section>

      <section className="shell-public py-10 sm:py-12">
        <Suspense fallback={<SectionSkeleton />}>
          <RegisterSection locale={locale} />
        </Suspense>
      </section>

      <section className="shell-public py-10 sm:py-14">
        <HomeWorkflowScroll
          eyebrow={t("workflow.title")}
          title={t("benefits.title")}
          lede={t("workflow.lede")}
          steps={steps}
          example={{
            stamp: t("workflow.exampleStamp"),
            title: t("benefits.example.title"),
            note: t("benefits.example.note"),
            item: t("benefits.example.item"),
            supplierHeader: t("benefits.example.supplier"),
            unitPriceHeader: t("benefits.example.unitPrice"),
            leadTimeHeader: t("benefits.example.leadTime"),
            totalHeader: t("benefits.example.total"),
            rows: exampleRows,
          }}
          processImageAlt={t("workflow.processPlateCaption")}
          deskImageAlt={t("workflow.plateAlt")}
        />
      </section>

      <section className="shell-public py-10 sm:py-12">
        <Suspense fallback={<SectionSkeleton />}>
          <SupplierDeskSection locale={locale} />
        </Suspense>
      </section>

      <section className="shell-public py-10 sm:py-12">
        <Suspense fallback={<SectionSkeleton />}>
          <AnnexSection locale={locale} />
        </Suspense>
      </section>

      <HomeFaq title={t("faq.title")} items={faqItems} helpLabel={t("faq.helpLabel")} />

      <section className="shell-public pb-14">
        <ClosingCta locale={locale} />
      </section>
    </>
  );
}
