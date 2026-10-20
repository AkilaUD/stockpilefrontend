"use client";

/*
 * PermissionGate — client-side admission check for private routes.
 * UX layer only: the API authorizes every resource (403 on direct calls).
 * While loading nothing privileged renders; signed-out renders nothing
 * (proxy already redirected, this covers post-logout states).
 */
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { useSessionPermissions } from "@/lib/auth/use-session-permissions";

export function PermissionGate({
  allowedPermissions,
  children,
  fallback,
}: {
  /** Any-of permission codes admitted to this surface. */
  allowedPermissions: readonly string[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { status, hasAny } = useSessionPermissions();
  const t = useTranslations("workspace");
  if (status === "loading") {
    return (
      <p className="type-body text-ink-muted" role="status" aria-live="polite">
        {t("loading")}
      </p>
    );
  }
  if (status === "signedOut") return null;
  if (!hasAny(allowedPermissions)) {
    if (fallback !== undefined) return <>{fallback}</>;
    return (
      <EmptyState title={t("accessDeniedTitle")} description={t("accessDeniedBody")} headingLevel="h2" />
    );
  }
  return <>{children}</>;
}

/** Inline capability check for actions (buttons/forms). Renders nothing without the permission. */
export function Can({
  permission,
  permissions,
  children,
  fallback = null,
}: {
  permission?: string;
  /** Any-of alternative to `permission`. */
  permissions?: readonly string[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { status, has, hasAny } = useSessionPermissions();
  if (status !== "signedIn") return <>{fallback}</>;
  const ok = permission ? has(permission) : permissions ? hasAny(permissions) : false;
  return <>{ok ? children : fallback}</>;
}
