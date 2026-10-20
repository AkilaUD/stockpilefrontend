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
import { LedgerCover, type FolioStats } from "@/components/home/ledger-cover";
import { MaterialsListBuilder, type BuilderOption } from "@/components/home/materials-list-builder";
import {
  ClosingEntry,
  DepartmentIndex,
  FieldNotes,
  LedgerSectionHead,
  ProductRegister,
  SupplierDesk,
  WorkflowStates,
} from "@/components/home/ledger-sections";
import { HomeFaq } from "@/components/home/home-faq";
import { HomeGsap } from "@/components/home/home-gsap";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Material Ledger home — the opened order book.
 *
 * Cover (folio + live sheet) → the visitor's own materials list → numbered
 * materials index → current register → document-state workflow with a
 * labelled example returns sheet → supplier desk → field-notes annex → FAQ →
 * open closing entry. All counts, entries and suppliers are live catalogue
 * reads; the only figures that are not live are inside the stamped EXAMPLE
 * returns sheet. No invented metrics or testimonials.
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

function LedgerSkeleton() {
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
  const data = await safeRead(() =>
    Promise.all([getCatalogueSummary(), getCategoryTree(), getProductListing({ sort: "newest", page: 1, pageSize: 6 })]),
  );
  let stats: FolioStats | null = null;
  let sheetItems: Awaited<ReturnType<typeof getProductListing>>["items"] = [];
  if (data) {
    const [summary, tree, listing] = data;
    stats = {
      products: summary.products,
      suppliers: summary.suppliers,
      departments: tree.filter((node) => node.isRoot).length,
      categories: summary.categories,
    };
    sheetItems = listing.items;
  }
  return <LedgerCover locale={locale} stats={stats} sheetItems={sheetItems} />;
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

async function IndexSection({ locale }: { locale: string }) {
  const tree = await safeRead(() => getCategoryTree());
  if (!tree) return null;
  const departments = sortDepartments(tree).slice(0, 12);
  return <DepartmentIndex locale={locale} departments={departments} />;
}

async function RegisterSection({ locale }: { locale: string }) {
  const listing = await safeRead(() => getProductListing({ sort: "newest", page: 1, pageSize: 10 }));
  if (!listing || listing.items.length === 0) return null;
  return <ProductRegister locale={locale} items={listing.items} />;
}

async function SupplierDeskSection({ locale }: { locale: string }) {
  const directory = await safeRead(() => getSupplierDirectory());
  if (!directory || directory.items.length === 0) return null;
  return <SupplierDesk locale={locale} suppliers={directory.items.slice(0, 6)} />;
}

async function AnnexSection({ locale }: { locale: string }) {
  const page = await safeRead(() => getArticles({ page: 1, pageSize: 5, locale }));
  if (!page || page.items.length === 0) return null;
  return <FieldNotes locale={locale} articles={page.items} />;
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
    { supplier: "A", unitPrice: "Rs 4,850", leadDays: 3, total: "Rs 485,000" },
    { supplier: "B", unitPrice: "Rs 4,620", leadDays: 5, total: "Rs 462,000" },
    { supplier: "C", unitPrice: "Rs 4,790", leadDays: 2, total: "Rs 479,000" },
  ].map((row) => ({
    supplier: `${t("benefits.example.supplier")} ${row.supplier}`,
    unitPrice: row.unitPrice,
    leadTime: t("benefits.example.days", { count: row.leadDays }),
    total: row.total,
  }));

  const faqItems = [0, 1, 2, 3, 4, 5].map((index) => ({
    question: t(`faq.items.${index}.q`),
    answer: t(`faq.items.${index}.a`),
  }));

  return (
    <>
      <HomeGsap />

      <Suspense fallback={<LedgerSkeleton />}>
        <CoverSection locale={locale} />
      </Suspense>

      <section className="shell-public py-10 sm:py-12">
        <Suspense fallback={<LedgerSkeleton />}>
          <BuilderSection />
        </Suspense>
      </section>

      <section className="shell-public py-10 sm:py-12">
        <Suspense fallback={<LedgerSkeleton />}>
          <IndexSection locale={locale} />
        </Suspense>
      </section>

      <section className="shell-public py-10 sm:py-12">
        <Suspense fallback={<LedgerSkeleton />}>
          <RegisterSection locale={locale} />
        </Suspense>
      </section>

      <section className="shell-public py-10 sm:py-12">
        <LedgerSectionHead folio={t("workflow.folio")} title={t("workflow.title")} lede={t("workflow.lede")} />
        <WorkflowStates
          locale={locale}
          steps={steps}
          example={{
            title: t("benefits.example.title"),
            note: t("benefits.example.note"),
            item: t("benefits.example.item"),
            supplierHeader: t("benefits.example.supplier"),
            unitPriceHeader: t("benefits.example.unitPrice"),
            leadTimeHeader: t("benefits.example.leadTime"),
            totalHeader: t("benefits.example.total"),
            rows: exampleRows,
          }}
        />
      </section>

      <section className="shell-public py-10 sm:py-12">
        <Suspense fallback={<LedgerSkeleton />}>
          <SupplierDeskSection locale={locale} />
        </Suspense>
      </section>

      <section className="shell-public py-10 sm:py-12">
        <Suspense fallback={<LedgerSkeleton />}>
          <AnnexSection locale={locale} />
        </Suspense>
      </section>

      <HomeFaq title={t("faq.title")} items={faqItems} helpLabel={t("faq.helpLabel")} />

      <section className="shell-public pb-14">
        <ClosingEntry locale={locale} />
      </section>
    </>
  );
}
