import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  getCatalogueSummary,
  getCategoryTree,
  getProductListing,
  getSupplierDirectory,
} from "@/lib/api/catalogue-server";
import { ProcurementCommandStrip } from "@/components/home/procurement-command-strip";
import { ProcurementEntryTrio } from "@/components/home/procurement-entry-trio";
import { EditorialSectionHead } from "@/components/home/editorial-section-head";
import { DepartmentRail } from "@/components/home/department-rail";
import { ProcurementPulse } from "@/components/home/procurement-pulse";
import { SupplierStoryStrip } from "@/components/home/supplier-story-strip";
import { WorkflowDiagram } from "@/components/home/workflow-diagram";
import { FieldProof } from "@/components/home/field-proof";
import { FinalRfqEntry } from "@/components/home/final-rfq-entry";
import { MaterialStripLazy } from "@/components/home/material-strip-lazy";
import { Reveal } from "@/components/motion/reveal";

/**
 * Home — the public landing in our own design language (§8.1–§8.3, §6.1
 * motifs), not the clone's layout.
 *
 * Server-rendered from live reads only: category tree, newest listings,
 * supplier directory, catalogue summary. Sections with no backing endpoint
 * (quote comparison, guides, case studies) are omitted rather than faked —
 * the field-proof section renders what the directory really says instead of
 * invented projects (§0.6 backend-authoritative).
 *
 * Motion budget (§7.1, §11): entrances below the fold go through <Reveal>
 * (`motion/react-mini`, tree-shaken); the hero is CSS keyframes (first
 * paint); GSAP lives ONLY inside the dynamically imported MaterialStrip
 * below — never in first-load, never in a workspace chunk.
 */

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return {
    title: t("headline"),
    description: t("lede"),
  };
}

function imageUrl(srcset: string | null | undefined): string | null {
  if (!srcset || srcset.trim() === "") return null;
  return srcset.trim().split(/\s+/)[0] ?? null;
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const tCat = await getTranslations({ locale, namespace: "catalogue" });

  const [tree, newest, directory, summary] = await Promise.all([
    getCategoryTree(),
    getProductListing({ sort: "newest", page: 1, pageSize: 8 }),
    getSupplierDirectory(),
    getCatalogueSummary(),
  ]);

  const departments = tree.filter((node) => node.isRoot);
  const featured = newest.items;
  const suppliers = [...directory.items].sort((a, b) => Number(b.verified) - Number(a.verified));
  const districts = [...new Set(directory.items.map((s) => s.district).filter((d): d is string => !!d))].sort();
  const verifiedCount = directory.items.filter((s) => s.verified).length;

  const formatCount = (n: number): string => n.toLocaleString(locale);
  const priceOnRequest = tCat("listing.priceOnRequest");

  const heroMaterial = featured.find((item) => imageUrl(item.image?.srcset));
  const materialSrc = imageUrl(heroMaterial?.image?.srcset);

  return (
    <>
      <ProcurementCommandStrip
        eyebrow={t("eyebrow")}
        headline={t("headline")}
        lede={t("lede")}
        ctaLabel={t("hero.cta")}
        ctaHref="/register"
        searchLabel={t("hero.searchLabel")}
        searchSubmit={t("hero.searchSubmit")}
        searchExamples={t.raw("hero.examples") as string[]}
        intentLabel={t("hero.intentLabel")}
        intents={[
          { label: t("hero.intentProducts"), href: "/products" },
          { label: t("hero.intentSuppliers"), href: "/suppliers" },
          { label: t("hero.intentCategories"), href: "/products" },
        ]}
        material={{
          src: materialSrc,
          alt: heroMaterial?.image?.alt ?? heroMaterial?.name ?? "",
          sku: heroMaterial?.sku ?? "",
          category: heroMaterial?.category.name ?? "",
          href: heroMaterial ? `/products/${heroMaterial.slug}` : "/products",
          figureLabel: t("hero.materialFigure"),
        }}
        signal={[
          { label: t("hero.signalProducts"), value: formatCount(summary.products) },
          { label: t("hero.signalSuppliers"), value: formatCount(summary.suppliers) },
          { label: t("hero.signalDepartments"), value: formatCount(departments.length) },
        ]}
      />

      <div className="shell-public py-12 md:py-16">
        <Reveal>
          <ProcurementEntryTrio
            entries={[
              {
                step: t("trio.knowStep"),
                title: t("trio.knowTitle"),
                body: t("trio.knowBody"),
                href: "/search",
                linkLabel: t("trio.knowLink"),
              },
              {
                step: t("trio.browseStep"),
                title: t("trio.browseTitle"),
                body: t("trio.browseBody"),
                href: "/products",
                linkLabel: t("trio.browseLink"),
              },
              {
                step: t("trio.suppliersStep"),
                title: t("trio.suppliersTitle"),
                body: t("trio.suppliersBody"),
                href: "/suppliers",
                linkLabel: t("trio.suppliersLink"),
              },
            ]}
          />
        </Reveal>
      </div>

      <section className="shell-public py-12 md:py-16">
        <Reveal>
          <EditorialSectionHead
            eyebrow={t("departments.eyebrow")}
            title={t("departments.title")}
            lede={t("departments.lede")}
            align="left"
          />
          <div className="mt-8">
            <DepartmentRail departments={departments.map((d) => ({ slug: d.slug, name: d.name }))} />
          </div>
        </Reveal>
      </section>

      <Reveal>
        <ProcurementPulse
          metrics={[
            { label: t("pulse.products"), value: formatCount(summary.products) },
            { label: t("pulse.suppliers"), value: formatCount(summary.suppliers) },
            { label: t("pulse.departments"), value: formatCount(departments.length) },
            { label: t("pulse.districts"), value: formatCount(districts.length) },
          ]}
          note={t("pulse.note")}
        />
      </Reveal>

      <section className="shell-public pt-12 md:pt-16">
        <Reveal>
          <EditorialSectionHead
            eyebrow={t("strip.eyebrow")}
            title={t("strip.title")}
            lede={t("strip.lede")}
            align="right"
            linkHref="/products?sort=newest"
            linkLabel={t("strip.viewAll")}
          />
        </Reveal>
      </section>
      <Reveal>
        <MaterialStripLazy items={featured} locale={locale} priceOnRequest={priceOnRequest} />
      </Reveal>

      <section className="shell-public py-12 md:py-16">
        <Reveal>
          <EditorialSectionHead
            eyebrow={t("suppliers.eyebrow")}
            title={t("suppliers.title")}
            lede={t("suppliers.lede")}
            align="left"
            linkHref="/suppliers"
            linkLabel={t("suppliers.viewAll")}
          />
          <div className="mt-8">
            <SupplierStoryStrip
              suppliers={suppliers.slice(0, 6).map((s) => ({
                slug: s.slug,
                name: s.name,
                district: s.district,
                productCount: s.productCount,
                verified: s.verified,
                verifiedLabel: t("suppliers.verified"),
                unverifiedLabel: t("suppliers.unverified"),
                productsLabel: t("suppliers.products"),
              }))}
            />
          </div>
        </Reveal>
      </section>

      <section className="shell-public py-12 md:py-16">
        <Reveal>
          <EditorialSectionHead
            eyebrow={t("workflow.eyebrow")}
            title={t("workflow.title")}
            lede={t("workflow.lede")}
            align="right"
          />
          <div className="mt-10">
            <WorkflowDiagram
              steps={[
                { title: t("workflow.step1Title"), body: t("workflow.step1Body") },
                { title: t("workflow.step2Title"), body: t("workflow.step2Body") },
                { title: t("workflow.step3Title"), body: t("workflow.step3Body") },
                { title: t("workflow.step4Title"), body: t("workflow.step4Body") },
              ]}
            />
          </div>
        </Reveal>
      </section>

      <section className="shell-public py-12 md:py-16">
        <Reveal>
          <EditorialSectionHead
            eyebrow={t("field.eyebrow")}
            title={t("field.title")}
            lede={t("field.lede")}
            align="left"
          />
          <div className="mt-8">
            <FieldProof
              title={t("field.title")}
              districtsLabel={t("field.districtsLabel")}
              districts={districts}
              verifiedLabel={t("field.verifiedLabel")}
              verifiedValue={`${formatCount(verifiedCount)} / ${formatCount(directory.totalItems)}`}
              departmentsLabel={t("field.departmentsLabel")}
              departmentsValue={formatCount(departments.length)}
            />
          </div>
        </Reveal>
      </section>

      <Reveal>
        <FinalRfqEntry
          title={t("final.title")}
          lede={t("final.lede")}
          primaryLabel={t("final.primary")}
          primaryHref="/register"
          secondaryLabel={t("final.secondary")}
          secondaryHref="/suppliers"
        />
      </Reveal>
    </>
  );
}
