import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { InfoPage } from "@/components/pages/info-page";

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
      <p className="max-w-3xl font-body leading-relaxed text-ink-muted">{t("intro")}</p>

      <ol className="mt-10 grid gap-4 md:grid-cols-3">
        {cards.map((card, index) => (
          <li key={card.title} className="rounded-md border border-line bg-surface-panel p-6">
            <p className="font-display text-2xl font-extrabold text-brand-secondary">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h2 className="mt-2 font-display text-lg font-bold text-ink">{card.title}</h2>
            <p className="mt-2 font-body text-sm leading-relaxed text-ink-muted">{card.body}</p>
          </li>
        ))}
      </ol>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">
          {t("moreTitle")}
        </h2>
        <ul className="mt-6 grid gap-x-8 gap-y-5 md:grid-cols-2">
          {features.map((feature) => (
            <li key={feature.title} className="flex gap-4">
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="mt-1 size-4 shrink-0 text-brand-secondary"
              >
                <circle cx="8" cy="8" r="6.5" />
                <path d="m5.5 8 2 2 3-3.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div>
                <h3 className="font-display text-base font-bold text-ink">{feature.title}</h3>
                <p className="mt-1 font-body text-sm leading-relaxed text-ink-muted">
                  {feature.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 rounded-md bg-brand-primary p-6 text-ink md:p-8">
        <h2 className="font-display text-xl font-extrabold tracking-tight md:text-2xl">
          {t("ctaTitle")}
        </h2>
        <p className="mt-2 font-body font-medium">{t("ctaBody")}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/supplier-register"
            className="inline-flex h-12 items-center justify-center rounded-md bg-ink px-7 font-body text-sm font-semibold text-white transition-colors duration-instant ease-standard hover:bg-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {t("registerCta")}
          </Link>
          <Link
            href="/pricing"
            className="inline-flex h-12 items-center justify-center rounded-md border-2 border-ink px-7 font-body text-sm font-semibold text-ink transition-colors duration-instant ease-standard hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {t("pricingCta")}
          </Link>
        </div>
      </section>
    </InfoPage>
  );
}
