"use client";

import { useTranslations } from "next-intl";
import { StatusPill } from "@/components/ui/status-pill";
import { Permissions } from "@/lib/auth/permissions";
import { useSessionPermissions } from "@/lib/auth/use-session-permissions";

/**
 * Phase D admin modules — each card is visible only with its permission
 * cluster. No module has a built backend UI surface yet, so every card is
 * honestly marked Planned (see docs/role-permissions.md for the backlog map).
 */
const MODULES = [
  { key: "security", permissions: [Permissions.AuditRead, Permissions.SecurityRead, Permissions.AdminUsersUnlock] },
  { key: "suppliers", permissions: [Permissions.SupplierVerify, Permissions.SupplierReadInternal] },
  { key: "catalogue", permissions: [Permissions.ProductModerate] },
  { key: "rfqOps", permissions: [Permissions.RfqReadAny, Permissions.RfqMatch, Permissions.RfqMatchModerate] },
  { key: "billing", permissions: [Permissions.SubscriptionBill] },
  { key: "content", permissions: [Permissions.ContentPublish, Permissions.ContentModerate, Permissions.ReviewModerate] },
] as const;

export function AdminModules() {
  const t = useTranslations("workspace");
  const { hasAny } = useSessionPermissions();
  const visible = MODULES.filter((m) => hasAny(m.permissions));
  if (visible.length === 0) return null;
  return (
    <section aria-labelledby="admin-modules" className="mt-8">
      <h2 id="admin-modules" className="type-title-md text-ink">{t("adminModulesTitle")}</h2>
      <p className="mt-2 type-body text-ink-muted">{t("adminModulesBody")}</p>
      <ul className="mt-4 grid gap-3 md:grid-cols-2">
        {visible.map((m) => (
          <li key={m.key} className="rounded-md border border-line bg-surface-panel p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="type-title-sm text-ink">{t(`adminModules.${m.key}.title`)}</p>
              <StatusPill tone="neutral">{t("adminModulePlanned")}</StatusPill>
            </div>
            <p className="mt-2 type-body-sm text-ink-muted">{t(`adminModules.${m.key}.body`)}</p>
            <p className="mt-2 type-meta text-ink-faint">{t(`adminModules.${m.key}.permissions`)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
