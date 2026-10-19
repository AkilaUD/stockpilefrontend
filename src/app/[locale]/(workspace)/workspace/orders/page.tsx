import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DeskPageHeader } from "@/components/ui/desk-register";
import { RoleGate } from "@/components/workspace/role-gate";
import { BuyerOrdersList } from "@/components/workspace/buyer-orders-list";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "workspace.orders" });
  return { title: t("title") };
}

export default async function WorkspaceOrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("workspace.orders");

  return (
    <div className="shell-workspace py-8">
      <DeskPageHeader title={t("title")} lede={t("lede")} />
      <div>
        <RoleGate allowedRoles={["buyer", "buyerAdmin"]}>
          <BuyerOrdersList />
        </RoleGate>
      </div>
    </div>
  );
}
