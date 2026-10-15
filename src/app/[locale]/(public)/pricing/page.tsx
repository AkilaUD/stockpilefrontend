import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { InfoPage } from "@/components/pages/info-page";

/**
 * /pricing — reference reconstruction §4.4; copy faithful to the original
 * (including its typos "Socialmedia Ads", "Whatspp Notifications" —
 * preserved verbatim). Tier plan selection and payment are not wired in this
 * build (no pricing/checkout endpoints), so each tier card is informational
 * and the actions are the original's own published call route (0114-222-555),
 * the Learn More → how-it-works, and Register → /register (documented
 * dependency: plan subscription).
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.pricing" });
  return { title: t("title"), description: t("lede") };
}

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "pages.pricing" });
  const tiers = t.raw("tiers") as Array<{ name: string; price: string; features: string[] }>;

  return (
    <InfoPage breadcrumb={t("title")} title={t("title")}>
      <div className="max-w-3xl">
        <p className="font-display text-xl font-bold tracking-tight text-ink md:text-2xl">
          {t("lede")}
        </p>
        <p className="mt-3 font-body leading-relaxed text-ink-muted">{t("sublede")}</p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {tiers.map((tier) => (
          <article
            key={tier.name}
            className="flex flex-col rounded-md border border-line bg-surface-panel p-6"
          >
            <h2 className="font-display text-lg font-bold text-ink">{tier.name}</h2>
            <p className="mt-3 flex items-baseline gap-1">
              <span className="font-display text-3xl font-extrabold tracking-tight text-ink">
                {tier.price}
              </span>
              <span className="font-body text-sm text-ink-muted">{t("perMonth")}</span>
            </p>
            <ul className="mt-5 flex-1 space-y-2 border-t border-line pt-5">
              {tier.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 font-body text-sm text-ink-muted"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="mt-0.5 size-3.5 shrink-0 text-brand-secondary"
                  >
                    <path d="m3 8 3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <section className="mt-6 rounded-md border border-dashed border-line-strong bg-surface-panel p-6">
        <h2 className="font-display text-lg font-bold text-ink">{t("customName")}</h2>
        <p className="mt-2 max-w-2xl font-body text-sm leading-relaxed text-ink-muted">
          {t("customBody")}
        </p>
        <p className="mt-3 font-body text-sm font-semibold text-ink">
          <a
            href={`mailto:${t("customEmail")}?subject=Customized%20Plan`}
            className="text-ink-accent transition-colors duration-instant ease-standard hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {t("customEmail")}
          </a>
          {" · "}
          <a
            href="tel:+94114222555"
            className="text-ink-accent transition-colors duration-instant ease-standard hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {t("customPhone")}
          </a>
        </p>
      </section>

      <section className="mt-12 rounded-md bg-brand-primary p-6 text-ink md:p-8">
        <h2 className="font-display text-xl font-extrabold tracking-tight md:text-2xl">
          {t("callCta")}
        </h2>
        <p className="mt-3 font-body font-medium">
          <Link
            href="/how-it-works"
            className="underline decoration-ink/50 underline-offset-2 transition-colors duration-instant ease-standard hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {t("learnMore")}
          </Link>
        </p>
        <Link
          href="/supplier-register"
          className="mt-5 inline-flex h-12 items-center justify-center rounded-md bg-ink px-7 font-body text-sm font-semibold text-white transition-colors duration-instant ease-standard hover:bg-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {t("registerCta")}
        </Link>
      </section>
    </InfoPage>
  );
}