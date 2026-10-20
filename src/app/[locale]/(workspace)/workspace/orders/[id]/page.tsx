import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/workspace/permission-gate";
import { ROUTE_PERMISSIONS } from "@/lib/auth/routes";
import { OrderDetailView } from "@/components/workspace/order-detail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "workspace.orders" });
  return { title: t("detailTitle") };
}

export default async function WorkspaceOrderDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return (
    <div className="shell-workspace py-10">
      <PermissionGate allowedPermissions={ROUTE_PERMISSIONS.workspaceOrders}>
        <OrderDetailView orderId={id} backHref="/workspace/orders" />
      </PermissionGate>
    </div>
  );
}
