import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { InfoPage } from "@/components/pages/info-page";
import { ProseSections, type ProseSection } from "@/components/pages/prose-sections";

/**
 * /return-policy — the reference's Return Policy (reference reconstruction §4.4
 * / PARITY.md gap C). Copy is the reference's own; its closing note points at
 * the real supplier directory (/suppliers), which is where the reference asks
 * readers to look for a supplier's own policy.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.returnPolicy" });
  return { title: t("title"), description: t("lede") };
}

export default async function ReturnPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "pages.returnPolicy" });

  return (
    <InfoPage breadcrumb={t("title")} title={t("title")} lede={t("lede")}>
      <ProseSections sections={t.raw("sections") as ProseSection[]} />
      <p className="measure-editorial mt-8 type-body leading-relaxed text-ink-muted">
        {t("footer")}
      </p>
    </InfoPage>
  );
}
