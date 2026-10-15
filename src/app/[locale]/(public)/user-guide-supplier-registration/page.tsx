import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { UserGuideShell, type GuideNavEntry } from "@/components/pages/user-guide-shell";
import { ProseSections, type ProseSection } from "@/components/pages/prose-sections";

/**
 * /user-guide-supplier-registration — the reference's Supplier Registration
 * guide (reference reconstruction §4.4 / PARITY.md gap C). Copy is the
 * reference's own, transcribed into `pages.guideSupplierRegistration`.
 */
const CURRENT = "/user-guide-supplier-registration";
const NAMESPACE = "pages.guideSupplierRegistration";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: NAMESPACE });
  return { title: t("title"), description: t("lede") };
}

export default async function SupplierRegistrationGuidePage({
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
    >
      <ProseSections sections={t.raw("sections") as ProseSection[]} />
    </UserGuideShell>
  );
}
