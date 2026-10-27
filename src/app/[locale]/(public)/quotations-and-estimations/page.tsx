import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { InfoPage } from "@/components/pages/info-page";
import { ButtonLink, buttonClassName } from "@/components/ui/button";

/**
 * /quotations-and-estimations — "Quotations & Estimations" (reference
 * reconstruction §4.4). The path is the reference's own route (its top-bar
 * "Get Quotes" target); our former `/quotations` now redirects here
 * (next.config redirects()).
 *
 * Copy faithful to the original page. The reference's CTA was an RFQ
 * submission form; that endpoint exists now (api.md §2.6), so the primary CTA
 * is a real link to `/rfq` and the email path the reference publishes stays as
 * the alternative. The documented dependency of the original build — a public
 * RFQ intake — is closed.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.quotations" });
  return { title: t("title"), description: t("lede") };
}

export default async function QuotationsAndEstimationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "pages.quotations" });
  const steps = t.raw("steps") as Array<{ label: string; title: string; body: string }>;
  const rfqMailto = `mailto:${t("email")}?subject=${encodeURIComponent("RFQ Request")}`;

  return (
    <InfoPage breadcrumb={t("title")} title={t("title")}>
      <div className="measure-editorial">
        <p className="font-display text-xl font-bold tracking-tight text-ink md:text-2xl">
          {t("subtitle")}
        </p>
        <p className="mt-3 type-body text-ink-muted">{t("lede")}</p>
      </div>

      <ol className="mt-10 grid gap-4 md:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title} className="rounded-lg border border-line bg-surface-panel p-6 shadow-elev-sm">
            <p className="type-label font-semibold text-ink-accent">
              {index + 1}. {step.label}
            </p>
            <h2 className="mt-2 font-display text-lg font-bold text-ink">{step.title}</h2>
            <p className="mt-2 type-body-sm text-ink-muted">{step.body}</p>
          </li>
        ))}
      </ol>

      <div className="mt-10 rounded-lg border border-line bg-surface-panel p-6 shadow-elev-sm md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <ButtonLink
            href="/rfq"
            size="lg"
            className="border-ink! bg-ink! text-ink-inverse! hover:bg-ink-soft!"
          >
            {t("onlineCta")}
          </ButtonLink>
          <span className="type-label text-center text-ink-muted">{t("orLabel")}</span>
          <a href={rfqMailto} className={buttonClassName({ variant: "secondary", size: "lg" })}>
            {t("uploadCta")}
          </a>
        </div>
        <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-line pt-6 sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <dt className="sr-only">{t("freeAlways")}</dt>
            <dd className="flex items-baseline gap-2">
              <span className="inline-flex items-center rounded-sm bg-brand-primary px-2 py-0.5 type-micro font-bold text-ink-on-signal">
                {t("freeBadge")}
              </span>
              <span className="type-body-sm font-medium text-ink">{t("freeAlways")}</span>
            </dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="type-body-sm text-ink-muted">{t("categoriesLabel")}</dt>
            <dd className="font-display text-lg font-bold text-ink">{t("categoriesValue")}</dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="type-body-sm text-ink-muted">{t("suppliersLabel")}</dt>
            <dd className="font-display text-lg font-bold text-ink">{t("suppliersValue")}</dd>
          </div>
        </dl>
      </div>
    </InfoPage>
  );
}
