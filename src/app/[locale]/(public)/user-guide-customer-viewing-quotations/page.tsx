import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { UserGuideShell, type GuideNavEntry } from "@/components/pages/user-guide-shell";

/**
 * /user-guide-customer-viewing-quotations — the reference's "Customer - Viewing
 * Quotations" guide (reference reconstruction §4.4 / PARITY.md gap C).
 *
 * Like its sibling page, the reference publishes a walkthrough video and a
 * one-paragraph summary; this build has no video asset, so it renders the
 * summary (the reference's own words).
 */
const CURRENT = "/user-guide-customer-viewing-quotations";
const NAMESPACE = "pages.guideCustomerViewingQuotations";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: NAMESPACE });
  return { title: t("title"), description: t("lede") };
}

export default async function CustomerViewingQuotationsGuidePage({
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
