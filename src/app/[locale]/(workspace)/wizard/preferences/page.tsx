import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { WizardShell } from "@/components/auth/wizard-shell";
import { PermissionGate } from "@/components/workspace/permission-gate";
import { ROUTE_PERMISSIONS } from "@/lib/auth/routes";
import { PreferencesForm } from "@/components/auth/preferences-form";

/** Buyer wizard step 4a — UI/locale preferences (business-flows §2, api.md §2.2). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.wizard.preferences" });
  return { title: t("title") };
}

export default async function PreferencesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth.wizard.preferences");

  return (
    <div className="shell-workspace py-10">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <h1 className="type-title-lg text-ink">{t("title")}</h1>
          <p className="type-body text-ink-muted mt-2">{t("description")}</p>
        </header>
        <WizardShell current="preferences" />
        <PermissionGate allowedPermissions={ROUTE_PERMISSIONS.wizard}><PreferencesForm /></PermissionGate>
      </div>
    </div>
  );
}
