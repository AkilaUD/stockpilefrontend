import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { EmptyState } from "@/components/ui/empty-state";
import { PermissionGate } from "@/components/workspace/permission-gate";
import { ROUTE_PERMISSIONS } from "@/lib/auth/routes";
import { AdminModules } from "@/components/workspace/admin-modules";

/**
 * Administration home — implementation-plan 1.52. Resolves to `/admin`.
 *
 * Phase 1 ships no administration surface; the page behind the `/(admin)`
 * guard is one honest empty state so the group is real, guarded and
 * navigable, with no invented tooling behind it (rule X2). Access is
 * permission-aware: any platform permission admits to the shell, and
 * `AdminModules` shows only the clusters the session actually holds —
 * any other signed-in visitor gets the access-denied state (the backend
 * enforces the same on every admin endpoint, e.g. `admin.users.unlock`
 * 403s for a buyer).
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "workspace" });
  return { title: t("adminTitle") };
}

export default async function AdminHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("workspace");

  return (
    <div className="shell-workspace py-10">
      <h1 className="type-title-lg text-ink">{t("adminTitle")}</h1>
      <div className="mt-8">
        <PermissionGate allowedPermissions={ROUTE_PERMISSIONS.adminShell}>
          <div className="rounded-md border border-line bg-surface-panel">
            <EmptyState
              title={t("adminEmptyTitle")}
              description={t("adminEmptyBody")}
              headingLevel="h2"
            />
          </div>
          <AdminModules />
        </PermissionGate>
      </div>
    </div>
  );
}