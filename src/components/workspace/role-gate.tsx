"use client";

/*
 * RoleGate — client-side admission check for the role-scoped private groups
 * (`/(supplier)`, `/(admin)`).
 *
 * The proxy guard (1.52) admits any signed-in visitor to these groups — the
 * edge only checks that a session cookie exists (the encrypted ticket cannot
 * be read in the proxy). The AUTHORITY for who may see what is the API: roles
 * ride in `GET /auth/session`, which only a client can read for THIS browser
 * (SessionProvider). So role admission necessarily happens here, client-side,
 * against the server's own session claim — a UX layer, never the security
 * boundary (every resource the group could reach is authorized in the
 * backend; a buyer hitting `/admin/users/:id/unlock` directly still gets 403,
 * security-test-matrix §41).
 *
 * While the provider has not decided (loading) or reports signed out (a
 * post-logout-all state inside an already-rendered group), nothing renders:
 * the shell's content just stays empty rather than flash the wrong copy.
 */

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useSession } from "@/components/providers/session-provider";
import { EmptyState } from "@/components/ui/empty-state";

export function RoleGate({
  allowedRoles,
  children,
}: {
  /** Any-of role codes the session must carry (seeded role codes — appsettings Seed.Roles). */
  allowedRoles: readonly string[];
  children: ReactNode;
}) {
  const { status, user } = useSession();
  const t = useTranslations("workspace");

  if (status === "loading" || status === "signedOut" || !user) return null;
  if (!user.roles.some((role) => allowedRoles.includes(role))) {
    return (
      <EmptyState
        title={t("accessDeniedTitle")}
        description={t("accessDeniedBody")}
        headingLevel="h2"
      />
    );
  }
  return <>{children}</>;
}