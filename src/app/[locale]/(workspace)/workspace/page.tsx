import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { WorkspaceAccount } from "@/components/workspace/workspace-account";
import { WorkspaceSecurity } from "@/components/workspace/workspace-security";

/**
 * Buyer workspace home — implementation-plan 1.52, design-system §8.5.
 * Resolves to `/workspace` (see the group layout for why the group nests a
 * literal `workspace` segment).
 *
 * Three sections, each honest about what the Phase-1 backend provides:
 *   - "Buying activity" — RFQs, orders and projects have no backend surface
 *     yet (Phase 2, docs/implementation-plan.md), so this stays the real
 *     empty state, NOT a dashboard of invented KPIs (§8.5, rule X2).
 *   - Account — the signed-in user's own profile from `GET /auth/session`
 *     (identity, roles, verification) plus the resend-verification action
 *     (task 1.38).
 *   - Security — the authenticated surfaces tax 1.36 shipped but nothing
 *     consumed: change password, the session directory, per-device revoke
 *     and sign-out-everywhere.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "workspace" });
  return { title: t("title") };
}

export default async function WorkspaceHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("workspace");

  return (
    <div className="shell-workspace py-10">
      <h1 className="type-title-lg text-ink">{t("title")}</h1>

      <section aria-labelledby="workspace-setup" className="mt-8 rounded-md border border-line bg-surface-panel p-5">
        <h2 id="workspace-setup" className="type-title-md text-ink">
          {t("setupTitle")}
        </h2>
        <p className="mt-2 type-body text-ink-muted">{t("setupBody")}</p>
        <div className="mt-4">
          <ButtonLink href="/wizard/profile">{t("setupCta")}</ButtonLink>
        </div>
      </section>

      <section
        aria-labelledby="workspace-buying-activity"
        className="mt-8 rounded-md border border-line bg-surface-panel p-5"
      >
        <h2 id="workspace-buying-activity" className="type-title-md text-ink">
          {t("buyingTitle")}
        </h2>
        <p className="mt-2 type-body text-ink-muted">{t("buyingBody")}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <ButtonLink href="/workspace/quotes">{t("quotesCta")}</ButtonLink>
          <ButtonLink href="/workspace/orders" variant="secondary">
            {t("ordersCta")}
          </ButtonLink>
        </div>
      </section>

      <section className="mt-8 rounded-md border border-line bg-surface-panel">
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyBody")}
          headingLevel="h2"
        />
      </section>

      <section aria-labelledby="workspace-account" className="mt-12">
        <h2 id="workspace-account" className="type-title-md text-ink">
          {t("accountTitle")}
        </h2>
        <div className="mt-4">
          <WorkspaceAccount />
        </div>
      </section>

      <section aria-labelledby="workspace-security" className="mt-12">
        <h2 id="workspace-security" className="type-title-md text-ink">
          {t("securityTitle")}
        </h2>
        <div className="mt-4">
          <WorkspaceSecurity />
        </div>
      </section>
    </div>
  );
}