import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { RoleGate } from "@/components/workspace/role-gate";
import { SupplierQuoteForm } from "@/components/supplier/supplier-quote-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "supplier.quotes" });
  return { title: t("title") };
}

export default async function SupplierLeadQuotePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return (
    <div className="shell-workspace py-10">
      <RoleGate allowedRoles={["supplierOwner", "supplierUser"]}>
        <SupplierQuoteForm leadId={id} />
      </RoleGate>
    </div>
  );
}
