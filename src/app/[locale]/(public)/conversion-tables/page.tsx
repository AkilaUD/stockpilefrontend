import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { UserGuideShell, type GuideNavEntry } from "@/components/pages/user-guide-shell";
import { ProseSections, type ProseSection } from "@/components/pages/prose-sections";

/**
 * /conversion-tables — the reference's "Conversions" page (reference
 * reconstruction §4.4 / PARITY.md gap C).
 *
 * On the reference, this route and /user-guide-glossary serve the same term
 * body; only the h1 ("Conversions" vs "Glossary") and the first group heading
 * ("GAUGE TO THICKNESS" vs "CUTTING/GRINDING WHEELS") differ. Reproducing the
 * reference's own copy means reproducing that duplication, so the shared body is
 * read from `pages.guideGlossary.sections` and only the two headings come from
 * `pages.conversionTables` — no second copy to drift.
 */
const CURRENT = "/conversion-tables";
const NAMESPACE = "pages.conversionTables";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: NAMESPACE });
  return { title: t("title") };
}

export default async function ConversionTablesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: NAMESPACE });
  const tGlossary = await getTranslations({ locale, namespace: "pages.guideGlossary" });
  const tGuide = await getTranslations({ locale, namespace: "pages.userGuide" });

  /* The reference's first group heading differs on this route only. */
  const sections = (tGlossary.raw("sections") as ProseSection[]).map((section, index) =>
    index === 0 ? { ...section, title: t("firstSectionTitle") } : section,
  );

  return (
    <UserGuideShell
      title={t("title")}
      nav={tGuide.raw("nav") as GuideNavEntry[]}
      navLabel={tGuide("navLabel")}
      current={CURRENT}
      prevLabel={tGuide("prevTopic")}
      nextLabel={tGuide("nextTopic")}
      topicNavLabel={tGuide("topicNavLabel")}
    >
      <ProseSections sections={sections} />
    </UserGuideShell>
  );
}
