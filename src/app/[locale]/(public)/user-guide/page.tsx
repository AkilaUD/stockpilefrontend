import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { UserGuideShell, type GuideNavEntry } from "@/components/pages/user-guide-shell";

/**
 * /user-guide — "Learn How To Use Stockpile" (reference reconstruction §4.4 /
 * PARITY.md gap C). The reference's guide index is its title, its
 * congratulations lede and the contents column; the body is empty, so this page
 * renders exactly that. Copy is the reference's own.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.userGuide" });
  return { title: t("title"), description: t("lede") };
}

export default async function UserGuidePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "pages.userGuide" });
  const nav = t.raw("nav") as GuideNavEntry[];

  return (
    <UserGuideShell
      title={t("title")}
      lede={t("lede")}
      nav={nav}
      navLabel={t("navLabel")}
      current="/user-guide"
      prevLabel={t("prevTopic")}
      nextLabel={t("nextTopic")}
      topicNavLabel={t("topicNavLabel")}
    />
  );
}
