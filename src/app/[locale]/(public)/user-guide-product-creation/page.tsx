import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { UserGuideShell, type GuideNavEntry } from "@/components/pages/user-guide-shell";
import { ProseSections, type ProseSection } from "@/components/pages/prose-sections";

/**
 * /user-guide-product-creation — the reference's Product Creation guide
 * (reference reconstruction §4.4 / PARITY.md gap C). The reference documents the
 * supplier's Add Product form field by field; the copy is transcribed verbatim
 * into `pages.guideProductCreation`, field labels included, so the page reads as
 * a checklist against the real form.
 */
const CURRENT = "/user-guide-product-creation";
const NAMESPACE = "pages.guideProductCreation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: NAMESPACE });
  return { title: t("title") };
}

export default async function ProductCreationGuidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: NAMESPACE });
  const tGuide = await getTranslations({ locale, namespace: "pages.userGuide" });

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
      <ProseSections sections={t.raw("sections") as ProseSection[]} />
    </UserGuideShell>
  );
}
