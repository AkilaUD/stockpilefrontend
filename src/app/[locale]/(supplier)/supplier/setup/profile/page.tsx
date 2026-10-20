import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/workspace/permission-gate";
import { ROUTE_PERMISSIONS } from "@/lib/auth/routes";
import { SupplierProfileForm } from "@/components/supplier/supplier-profile-form";
import { SupplierSetupShell } from "@/components/supplier/supplier-setup-shell";

/** Supplier setup steps 2–3 — the contact person and the business identity (business-flows §3.3, api.md §2.9). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.supplierSetup.profile" });
  return { title: t("title") };
}

export default async function SupplierSetupProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth.supplierSetup.profile");

  return (
    <div className="shell-workspace py-10">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <h1 className="type-title-lg text-ink">{t("title")}</h1>
          <p className="mt-2 type-body text-ink-muted">{t("description")}</p>
        </header>
        <PermissionGate allowedPermissions={ROUTE_PERMISSIONS.supplierSetup}><SupplierSetupShell current="profile" />
        <SupplierProfileForm /></PermissionGate>
      </div>
    </div>
  );
}
