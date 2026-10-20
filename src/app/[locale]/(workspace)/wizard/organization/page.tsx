import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { WizardShell } from "@/components/auth/wizard-shell";
import { PermissionGate } from "@/components/workspace/permission-gate";
import { ROUTE_PERMISSIONS } from "@/lib/auth/routes";
import { OrganizationForm } from "@/components/auth/organization-form";

/**
 * Buyer wizard step 3 — the organisation (business-flows §2, api.md §2.1
 * `POST /organizations`). Guarded by the `(workspace)` group's proxy rule like
 * every other wizard step; the form itself decides between "create" and "you
 * already belong to one" from the session it already holds.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.wizard.organization" });
  return { title: t("title") };
}

export default async function OrganizationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth.wizard.organization");

  return (
    <div className="shell-workspace py-10">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <h1 className="type-title-lg text-ink">{t("title")}</h1>
          <p className="type-body text-ink-muted mt-2">{t("description")}</p>
        </header>
        <WizardShell current="organization" />
        <PermissionGate allowedPermissions={ROUTE_PERMISSIONS.wizard}><OrganizationForm /></PermissionGate>
      </div>
    </div>
  );
}
