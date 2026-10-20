import { Permissions, hasAnyPermission, type PermissionHolder } from "./permissions";

/**
 * Persona derivation — coarse navigation desks derived ONLY from the
 * session permission union (identity roles + accepted org memberships,
 * resolved server-side). Never derive from raw role codes: an org-only
 * buyerAdmin has no identity role but does have buyer permissions.
 */

/** Platform-only permissions (granted exclusively to Platform-scope roles). */
export const PLATFORM_PERMISSIONS: readonly string[] = [
  Permissions.AuditRead,
  Permissions.SecurityRead,
  Permissions.AdminUsersUnlock,
  Permissions.SupplierVerify,
  Permissions.SupplierSuspend,
  Permissions.SupplierReadInternal,
  Permissions.ProductModerate,
  Permissions.ContentPublish,
  Permissions.ContentModerate,
  Permissions.ReviewModerate,
  Permissions.RfqReadAny,
  Permissions.RfqMatch,
  Permissions.RfqMatchModerate,
  Permissions.SubscriptionBill,
];

export const BUYER_DESK_PERMISSIONS: readonly string[] = [
  Permissions.RfqReadOwn,
  Permissions.QuoteReadBuyer,
  Permissions.OrderReadOwn,
];

export const SUPPLIER_DESK_PERMISSIONS: readonly string[] = [
  Permissions.QuoteReadSupplier,
  Permissions.SupplierUpdateOwn,
  Permissions.OrderFulfill,
];

export interface Personas {
  canAccessBuyerDesk: boolean;
  canAccessSupplierDesk: boolean;
  canAccessAdminShell: boolean;
}

export function derivePersonas(holder: PermissionHolder): Personas {
  return {
    canAccessBuyerDesk: hasAnyPermission(holder, BUYER_DESK_PERMISSIONS),
    canAccessSupplierDesk: hasAnyPermission(holder, SUPPLIER_DESK_PERMISSIONS),
    canAccessAdminShell: hasAnyPermission(holder, PLATFORM_PERMISSIONS),
  };
}

export const canAccessBuyerDesk = (h: PermissionHolder) => derivePersonas(h).canAccessBuyerDesk;
export const canAccessSupplierDesk = (h: PermissionHolder) => derivePersonas(h).canAccessSupplierDesk;
export const canAccessAdminShell = (h: PermissionHolder) => derivePersonas(h).canAccessAdminShell;
