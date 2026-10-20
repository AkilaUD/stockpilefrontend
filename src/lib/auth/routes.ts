import { Permissions } from "./permissions";
import { PLATFORM_PERMISSIONS } from "./personas";

/**
 * Route × permission map — single source for private-route admission.
 * Used by page-level `PermissionGate`s; documented in docs/role-permissions.md.
 * The API remains the security boundary for every entry.
 */
export const ROUTE_PERMISSIONS = {
  workspaceQuotes: [Permissions.QuoteReadBuyer],
  workspaceOrders: [Permissions.OrderReadOwn],
  workspaceComparison: [Permissions.QuoteReadBuyer],
  wizard: [Permissions.RfqCreate, Permissions.RfqReadOwn, Permissions.OrganizationMemberManage],
  supplierHome: [Permissions.QuoteReadSupplier, Permissions.SupplierUpdateOwn, Permissions.OrderFulfill],
  supplierLeads: [Permissions.QuoteReadSupplier, Permissions.RfqMatchDecline],
  supplierLeadQuote: [Permissions.QuoteSubmit],
  supplierQuotes: [Permissions.QuoteReadSupplier],
  supplierOrders: [Permissions.OrderFulfill],
  supplierSetup: [Permissions.SupplierUpdateOwn],
  adminShell: PLATFORM_PERMISSIONS,
} as const;
