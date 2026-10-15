import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { UserGuideShell, type GuideNavEntry } from "@/components/pages/user-guide-shell";
import { ProseSections, type ProseSection } from "@/components/pages/prose-sections";

/**
 * /user-guide-glossary — the reference's Glossary (reference reconstruction
 * §4.4 / PARITY.md gap C).
 *
 * The reference publishes the same term list on this page and on
 * /conversion-tables: both render the glossary body, changing only the h1 and
 * the first group heading. That duplication is the reference's own (a CMS
 * artefact — see tests/ref-content/en-*.txt), so this page and
 * /conversion-tables share `pages.guideGlossary.sections` rather than each
 * carrying a private copy.
 */
const CURRENT = "/user-guide-glossary";
const NAMESPACE = "pages.guideGlossary";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: NAMESPACE });
  return { title: t("title") };
}

export default async function GlossaryGuidePage({
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
