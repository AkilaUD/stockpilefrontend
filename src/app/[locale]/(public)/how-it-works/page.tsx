import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { InfoPage } from "@/components/pages/info-page";
import { ButtonLink } from "@/components/ui/button";

/**
 * /how-it-works — reference reconstruction §4.4 (copy faithful to the
 * original page: intro lede + two audience cards). CTA mapping: the reference's
 * buyers card links to its buyers guide and the suppliers card to its supplier
 * guide — both now real routes here (/how-it-works-for-buyers,
 * /how-it-works-for-suppliers).
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.howItWorks" });
  return { title: t("title"), description: t("lede") };
}

export default async function HowItWorksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "pages.howItWorks" });

  return (
    <InfoPage breadcrumb={t("title")} title={t("title")} lede={t("lede")}>
      <div className="grid gap-4 md:grid-cols-2">
        <article className="flex flex-col rounded-md border border-line bg-surface-panel p-6 md:p-8">
          <h2 className="font-display text-xl font-bold text-ink">{t("buyersTitle")}</h2>
          <p className="mt-3 flex-1 type-body text-ink-muted">{t("buyersBody")}</p>
          <ButtonLink href="/how-it-works-for-buyers" size="lg" className="mt-6 w-fit">
            {t("buyersCta")}
          </ButtonLink>
        </article>

        <article className="flex flex-col rounded-md border border-line bg-surface-panel p-6 md:p-8">
          <h2 className="font-display text-xl font-bold text-ink">{t("suppliersTitle")}</h2>
          <p className="mt-3 flex-1 type-body text-ink-muted">{t("suppliersBody")}</p>
          <ButtonLink
            href="/how-it-works-for-suppliers"
            size="lg"
            className="mt-6 w-fit border-ink! bg-ink! text-ink-inverse! hover:bg-ink-soft!"
          >
            {t("suppliersCta")}
          </ButtonLink>
        </article>
      </div>
    </InfoPage>
  );
}
