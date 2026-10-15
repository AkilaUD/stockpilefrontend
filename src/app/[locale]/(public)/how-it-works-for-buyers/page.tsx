import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { InfoPage } from "@/components/pages/info-page";

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
            <p className="mt-2 font-body text-sm leading-relaxed text-ink-muted">{step.body}</p>
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

      <section className="mt-12">
        <h2 className="font-display text-base font-bold uppercase tracking-wide text-ink">
          {t("partnersEyebrow")}
        </h2>
        <p className="mt-3">
          <Link
            href="/suppliers"
            className="font-body text-sm font-semibold text-ink-accent underline decoration-from-font underline-offset-2 transition-colors duration-instant ease-standard hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {tNav("ourSuppliers")}
          </Link>
        </p>
      </section>

      <section className="mt-12 rounded-md bg-brand-primary p-6 text-ink md:p-8">
        <h2 className="font-display text-xl font-extrabold tracking-tight md:text-2xl">
          {t("ctaTitle")}
        </h2>
        <p className="mt-2 font-body font-medium">{t("ctaBody")}</p>
        <div className="mt-6">
          <Link
            href="/register"
            className="inline-flex h-12 items-center justify-center rounded-md bg-ink px-7 font-body text-sm font-semibold text-white transition-colors duration-instant ease-standard hover:bg-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {t("registerCta")}
          </Link>
        </div>
      </section>
    </InfoPage>
  );
}
