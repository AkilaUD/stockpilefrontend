import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleGate } from "@/components/workspace/role-gate";

/**
 * Administration home — implementation-plan 1.52. Resolves to `/admin`.
 *
 * Phase 1 ships no administration surface; the page behind the `/(admin)`
 * guard is one honest empty state so the group is real, guarded and
 * navigable, with no invented tooling behind it (rule X2). Access is
 * role-aware: only a session carrying the seeded `platformAdministrator`
 * role sees the group's own state — any other signed-in visitor gets the
 * access-denied state (the backend enforces the same on every admin
 * endpoint, e.g. `admin.users.unlock` 403s for a buyer).
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
        <RoleGate allowedRoles={["platformAdministrator"]}>
          <div className="rounded-md border border-line bg-surface-panel">
            <EmptyState
              title={t("adminEmptyTitle")}
              description={t("adminEmptyBody")}
              headingLevel="h2"
            />
          </div>
        </RoleGate>
      </div>
    </div>
  );
}