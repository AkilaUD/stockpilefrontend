import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FeatureListItem } from "@/components/pages/feature-list-item";
import { InfoPage } from "@/components/pages/info-page";
import { ButtonLink } from "@/components/ui/button";

/**
 * /how-it-works-for-buyers — "STOCKPILE FOR BUYERS" (reference reconstruction
 * §4.4 / PARITY.md gap C). The path is the reference's own route; the page is
 * the buyer-side twin of /how-it-works-for-suppliers and reuses that page's
 * shape (3-step path, feature list, CTA band).
 *
 * Copy is the reference's own, transcribed into `pages.howItWorksForBuyers`. The
 * reference's "FEATURED SUPPLIERS" logo strip has no logo asset in this build,
 * so the section points at the real supplier directory (/suppliers) instead of
 * rendering invented logos — the same treatment the supplier page gives its
 * "OUR PARTNERED BUYERS" strip. Register → /register, the real buyer
 * registration flow.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.howItWorksForBuyers" });
  return { title: t("eyebrow"), description: t("title") };
}

export default async function HowItWorksForBuyersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "pages.howItWorksForBuyers" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const steps = t.raw("steps") as Array<{ label: string; body: string }>;
  const features = t.raw("features") as Array<{ title: string; body: string }>;

  return (
    <InfoPage breadcrumb={t("eyebrow")} title={t("title")} overline={t("eyebrow")}>
      <ol className="mt-10 grid gap-4 md:grid-cols-3">
        {steps.map((step) => (
          <li key={step.label} className="rounded-md border border-line bg-surface-panel p-6">
            <h2 className="font-display text-lg font-bold text-ink">{step.label}</h2>
            <p className="mt-2 type-body-sm text-ink-muted">{step.body}</p>
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

      <section className="mt-12">
        <h2 className="block-title">{t("partnersEyebrow")}</h2>
        <p className="mt-3">
          <Link
            href="/suppliers"
            className="type-body-sm font-semibold text-ink-accent underline decoration-from-font underline-offset-2 transition-colors duration-instant ease-standard hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {tNav("ourSuppliers")}
          </Link>
        </p>
      </section>

      <section className="mt-12 border-y border-ink bg-brand-primary p-6 text-ink-on-signal md:p-8">
        <h2 className="font-display text-xl font-extrabold tracking-tight md:text-2xl">
          {t("ctaTitle")}
        </h2>
        <p className="mt-2 type-body font-medium">{t("ctaBody")}</p>
        <div className="mt-6">
          <ButtonLink
            href="/register"
            size="lg"
            className="border-ink! bg-ink! text-ink-inverse! hover:bg-ink-soft!"
          >
            {t("registerCta")}
          </ButtonLink>
        </div>
      </section>
    </InfoPage>
  );
}
