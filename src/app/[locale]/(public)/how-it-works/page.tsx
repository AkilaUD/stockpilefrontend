import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { InfoPage } from "@/components/pages/info-page";

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
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <article className="flex flex-col rounded-md border border-line bg-surface-panel p-6 md:p-8">
          <h2 className="font-display text-xl font-bold text-ink">{t("buyersTitle")}</h2>
          <p className="mt-3 flex-1 font-body leading-relaxed text-ink-muted">{t("buyersBody")}</p>
          <Link
            href="/how-it-works-for-buyers"
            className="mt-6 inline-flex h-12 w-fit items-center justify-center rounded-md bg-brand-primary px-7 font-body text-sm font-semibold text-ink transition-colors duration-instant ease-standard hover:bg-brand-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {t("buyersCta")}
          </Link>
        </article>

        <article className="flex flex-col rounded-md border border-line bg-surface-panel p-6 md:p-8">
          <h2 className="font-display text-xl font-bold text-ink">{t("suppliersTitle")}</h2>
          <p className="mt-3 flex-1 font-body leading-relaxed text-ink-muted">
            {t("suppliersBody")}
          </p>
          <Link
            href="/how-it-works-for-suppliers"
            className="mt-6 inline-flex h-12 w-fit items-center justify-center rounded-md bg-ink px-7 font-body text-sm font-semibold text-white transition-colors duration-instant ease-standard hover:bg-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {t("suppliersCta")}
          </Link>
        </article>
      </div>
    </InfoPage>
  );
}