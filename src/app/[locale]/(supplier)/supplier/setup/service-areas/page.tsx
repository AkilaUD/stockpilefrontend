import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SupplierServiceAreasForm } from "@/components/supplier/supplier-service-areas-form";
import { SupplierSetupShell } from "@/components/supplier/supplier-setup-shell";

/** Supplier setup stage 4 — the districts the supplier serves (business-flows §3.3, api.md §2.9). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.supplierSetup.serviceAreas" });
  return { title: t("title") };
}

export default async function SupplierSetupServiceAreasPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth.supplierSetup.serviceAreas");

  return (
    <div className="shell-workspace py-10">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <h1 className="type-title-lg text-ink">{t("title")}</h1>
          <p className="mt-2 type-body text-ink-muted">{t("description")}</p>
        </header>
        <SupplierSetupShell current="service-areas" />
        <SupplierServiceAreasForm />
      </div>
    </div>
  );
}
