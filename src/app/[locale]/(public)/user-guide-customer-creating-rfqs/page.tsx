import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { UserGuideShell, type GuideNavEntry } from "@/components/pages/user-guide-shell";

/**
 * /user-guide-customer-creating-rfqs — the reference's "Customer - Creating an
 * RFQ" guide (reference reconstruction §4.4 / PARITY.md gap C).
 *
 * The reference page is a walkthrough video with a one-paragraph summary; this
 * build has no video asset, so the summary (the reference's own words) is what
 * the page renders.
 */
const CURRENT = "/user-guide-customer-creating-rfqs";
const NAMESPACE = "pages.guideCustomerCreatingRfqs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: NAMESPACE });
  return { title: t("title"), description: t("lede") };
}

export default async function CustomerCreatingRfqsGuidePage({
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
      lede={t("lede")}
      nav={tGuide.raw("nav") as GuideNavEntry[]}
      navLabel={tGuide("navLabel")}
      current={CURRENT}
      prevLabel={tGuide("prevTopic")}
      nextLabel={tGuide("nextTopic")}
      topicNavLabel={tGuide("topicNavLabel")}
    />
  );
}
