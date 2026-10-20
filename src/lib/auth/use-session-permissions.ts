"use client";

import { useSession } from "@/components/providers/session-provider";
import { hasAllPermissions, hasAnyPermission, hasPermission } from "./permissions";
import { derivePersonas, type Personas } from "./personas";

export interface SessionPermissions extends Personas {
  status: ReturnType<typeof useSession>["status"];
  permissions: readonly string[];
  roles: readonly string[];
  has: (code: string) => boolean;
  hasAny: (codes: readonly string[]) => boolean;
  hasAll: (codes: readonly string[]) => boolean;
}

/** Thin permission/persona facade over SessionProvider — the one hook UI should use. */
export function useSessionPermissions(): SessionPermissions {
  const { status, user } = useSession();
  const permissions = user?.permissions ?? [];
  return {
    status,
    permissions,
    roles: user?.roles ?? [],
    ...derivePersonas(permissions),
    has: (code) => hasPermission(permissions, code),
    hasAny: (codes) => hasAnyPermission(permissions, codes),
    hasAll: (codes) => hasAllPermissions(permissions, codes),
  };
}
