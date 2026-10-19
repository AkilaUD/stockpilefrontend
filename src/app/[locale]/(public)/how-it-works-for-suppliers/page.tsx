import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { FeatureListItem } from "@/components/pages/feature-list-item";
import { InfoPage } from "@/components/pages/info-page";
import { ButtonLink } from "@/components/ui/button";

/**
 * /how-it-works-for-suppliers — "Stockpile For Suppliers" (reference
 * reconstruction §4.4). The path is the reference's own route (its footer's
 * "Supplier Benefits" target); our former `/supplier-benefits` now redirects
 * here (next.config redirects()).
 *
 * Copy faithful to the original page: 3-step path, "What else?" features, CTA
 * band. The original "OUR PARTNERED BUYERS" logo strip has no data source in
 * this build, so it is omitted (documented dependency) rather than rendered
 * with invented logos. Supplier onboarding has no endpoint, so Register →
 * /supplier-register and See Pricing → /pricing — the real pages that exist.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.supplierBenefits" });
  return { title: t("title"), description: t("lede") };
}

export default async function HowItWorksForSuppliersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "pages.supplierBenefits" });
  const cards = t.raw("cards") as Array<{ title: string; body: string }>;
  const features = t.raw("features") as Array<{ title: string; body: string }>;

  return (
    <InfoPage breadcrumb={t("title")} title={t("title")} overline={t("eyebrow")} lede={t("lede")}>
      <p className="measure-editorial type-body text-ink-muted">{t("intro")}</p>

      <ol className="mt-10 grid gap-4 md:grid-cols-3">
        {cards.map((card, index) => (
          <li key={card.title} className="rounded-md border border-line bg-surface-panel p-6">
            <p className="font-display text-2xl font-extrabold text-brand-secondary">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h2 className="mt-2 font-display text-lg font-bold text-ink">{card.title}</h2>
            <p className="mt-2 type-body-sm text-ink-muted">{card.body}</p>
          </li>
        ))}
      </ol>

      <section className="mt-12">
        <h2 className="type-display-md font-extrabold text-ink">{t("moreTitle")}</h2>
        <ul className="mt-6 grid gap-x-8 gap-y-5 md:grid-cols-2">
          {features.map((feature) => (
            <FeatureListItem key={feature.title} title={feature.title} body={feature.body} />
          ))}
        </ul>
      </section>

      <section className="mt-12 border-y border-ink bg-brand-primary p-6 text-ink-on-signal md:p-8">
        <h2 className="font-display text-xl font-extrabold tracking-tight md:text-2xl">
          {t("ctaTitle")}
        </h2>
        <p className="mt-2 type-body font-medium">{t("ctaBody")}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <ButtonLink
            href="/supplier-register"
            size="lg"
            className="border-ink! bg-ink! text-ink-inverse! hover:bg-ink-soft!"
          >
            {t("registerCta")}
          </ButtonLink>
          <ButtonLink href="/pricing" variant="secondary" size="lg" className="border-ink! bg-transparent!">
            {t("pricingCta")}
          </ButtonLink>
        </div>
      </section>
    </InfoPage>
  );
}
