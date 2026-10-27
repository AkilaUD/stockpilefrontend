import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Check, FileText, Phone } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { InfoPage } from "@/components/pages/info-page";
import { ButtonLink } from "@/components/ui/button";
import { getSubscriptionPlans } from "@/lib/api/subscriptions-server";
import { formatMoney } from "@/lib/money";
import type { Plan } from "@/lib/api/subscriptions";

/**
 * /pricing — live plans from GET /subscriptions/plans when the API answers;
 * otherwise the static reference copy. Checkout is manual/invoice or file-sink
 * (supplier desk subscribe), not a fake card form.
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

function entitlementLabel(plan: Plan, key: string): string | null {
  const row = plan.entitlements.find((e) => e.key === key);
  if (!row) return null;
  if (row.unlimited) return `${key}: unlimited`;
  if (row.limit != null) return `${key}: ${row.limit}`;
  if (row.value) return `${key}: ${row.value}`;
  return key;
}

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "pages.pricing" });
  const staticTiers = t.raw("tiers") as Array<{ name: string; price: string; features: string[] }>;

  let plans: Plan[] = [];
  try {
    plans = (await getSubscriptionPlans()).filter((p) => p.isActive);
  } catch {
    plans = [];
  }

  const useLive = plans.length > 0;

  return (
    <InfoPage breadcrumb={t("title")} title={t("title")} lede={t("lede")}>
      <div className="measure-editorial space-y-3">
        <p className="type-body text-ink-muted">{t("sublede")}</p>
        {useLive && (
          <p className="inline-flex items-start gap-2 rounded-md border border-line bg-surface-recessed/50 px-3 py-2 type-body-sm text-ink-muted">
            <FileText className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden />
            {t("liveHint")}
          </p>
        )}
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {useLive
          ? plans
              .filter((p) => !p.isSalesAssisted)
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((plan) => {
                const features = plan.entitlements
                  .map((e) => entitlementLabel(plan, e.key))
                  .filter((v): v is string => Boolean(v));
                const price =
                  plan.priceAmount != null
                    ? formatMoney({
                        amount: plan.priceAmount,
                        currency: plan.currency,
                        locale,
                        fractionDigits: 0,
                      })
                    : t("contactPrice");
                return (
                  <article
                    key={plan.id}
                    className="flex flex-col rounded-md border border-line bg-surface-panel p-6"
                  >
                    <h2 className="font-display text-lg font-bold text-ink">{plan.name}</h2>
                    <p className="mt-3 flex items-baseline gap-1">
                      <span className="font-display text-3xl font-extrabold tracking-tight text-ink">
                        {price}
                      </span>
                      {plan.priceAmount != null && (
                        <span className="type-body-sm text-ink-muted">{t("perMonth")}</span>
                      )}
                    </p>
                    <ul className="mt-5 flex-1 space-y-2 border-t border-line pt-5">
                      {features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 type-body-sm text-ink-muted"
                        >
                          <Check
                            className="mt-0.5 size-4 shrink-0 text-brand-secondary"
                            aria-hidden
                          />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-5 type-body-sm text-ink-muted">{t("manualBilling")}</p>
                    <ButtonLink href="/supplier-register" size="md" className="mt-4 w-full">
                      {t("subscribeCta")}
                    </ButtonLink>
                  </article>
                );
              })
          : staticTiers.map((tier) => (
              <article
                key={tier.name}
                className="flex flex-col rounded-md border border-line bg-surface-panel p-6"
              >
                <h2 className="font-display text-lg font-bold text-ink">{tier.name}</h2>
                <p className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-3xl font-extrabold tracking-tight text-ink">
                    {tier.price}
                  </span>
                  <span className="type-body-sm text-ink-muted">{t("perMonth")}</span>
                </p>
                <ul className="mt-5 flex-1 space-y-2 border-t border-line pt-5">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 type-body-sm text-ink-muted"
                    >
                      <Check
                        className="mt-0.5 size-4 shrink-0 text-brand-secondary"
                        aria-hidden
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
      </div>

      <section className="mt-6 rounded-md border border-dashed border-line-strong bg-surface-panel p-6">
        <h2 className="font-display text-lg font-bold text-ink">{t("customName")}</h2>
        <p className="mt-2 max-w-2xl type-body-sm text-ink-muted">{t("customBody")}</p>
        <p className="mt-4 type-body-sm text-ink">
          <a
            href="tel:0114222555"
            className="inline-flex items-center gap-2 font-semibold text-ink-accent hover:text-ink"
          >
            <Phone className="size-4 shrink-0" aria-hidden />
            0114-222-555
          </a>
        </p>
        <p className="mt-3 type-body-sm text-ink-muted">{t("manualBilling")}</p>
      </section>

      <p className="mt-8 type-body-sm text-ink-muted">
        <Link href="/how-it-works-for-suppliers" className="text-ink-accent hover:text-ink">
          {t("learnMore")}
        </Link>
      </p>
    </InfoPage>
  );
}
