import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PermissionGate } from "@/components/workspace/permission-gate";
import { ROUTE_PERMISSIONS } from "@/lib/auth/routes";

/**
 * Supplier-desk home — implementation-plan 1.52, design-system §8.6.
 * Resolves to `/supplier`.
 *
 * Phase 1 ships no supplier data surface (buying leads arrive in Phase 2), so
 * this is one honest empty state behind the same proxy guard as the buyer
 * workspace. Never a fake quota meter or a "welcome back" (§8.6). The group
 * is supplier-scoped: only a session carrying a supplier role sees the desk's
 * own state; other signed-in visitors get the access-denied state.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "workspace" });
  return { title: t("supplierTitle") };
}

export default async function SupplierDeskPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("workspace");

  return (
    <div className="shell-workspace py-10">
      <h1 className="type-title-lg text-ink">{t("supplierTitle")}</h1>

      <PermissionGate allowedPermissions={ROUTE_PERMISSIONS.supplierSetup}>
        <section
          aria-labelledby="supplier-setup"
          className="mt-8 rounded-md border border-line bg-surface-panel p-5"
        >
          <h2 id="supplier-setup" className="type-title-md text-ink">
            {t("supplierSetupTitle")}
          </h2>
          <p className="mt-2 type-body text-ink-muted">{t("supplierSetupBody")}</p>
          <div className="mt-4">
            <ButtonLink href="/supplier/setup/profile">{t("supplierSetupCta")}</ButtonLink>
          </div>
        </section>
      </PermissionGate>

      <PermissionGate allowedPermissions={ROUTE_PERMISSIONS.supplierHome}>
        <section
          aria-labelledby="supplier-leads"
          className="mt-8 rounded-md border border-line bg-surface-panel p-5"
        >
          <h2 id="supplier-leads" className="type-title-md text-ink">
            {t("supplierLeadsTitle")}
          </h2>
          <p className="mt-2 type-body text-ink-muted">{t("supplierLeadsBody")}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <ButtonLink href="/supplier/leads">{t("supplierLeadsCta")}</ButtonLink>
            <ButtonLink href="/supplier/quotes" variant="secondary">
              {t("supplierQuotesCta")}
            </ButtonLink>
            <ButtonLink href="/supplier/orders" variant="secondary">
              {t("supplierOrdersCta")}
            </ButtonLink>
          </div>
        </section>
      </PermissionGate>

      <div className="mt-8">
        <PermissionGate allowedPermissions={ROUTE_PERMISSIONS.supplierHome}>
          <div className="rounded-md border border-line bg-surface-panel">
            <EmptyState
              title={t("supplierEmptyTitle")}
              description={t("supplierEmptyBody")}
              headingLevel="h2"
            />
          </div>
        </PermissionGate>
      </div>
    </div>
  );
}