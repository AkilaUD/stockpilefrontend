/**
 * Canonical permission codes — mirror of
 * `backend/src/Stockpile.Contracts/Permissions/Permissions.cs`.
 * Codes are stable and never renamed once seeded. Frontend checks are UX
 * only; the API (`PermissionAuthorizationHandler`) is the authority.
 * Parity is verified by `scripts/check-permissions-parity.mjs`.
 */
export const Permissions = {
  RfqCreate: "rfq.create",
  RfqReadOwn: "rfq.read.own",
  RfqReadAny: "rfq.read.any",
  RfqSubmit: "rfq.submit",
  RfqCancel: "rfq.cancel",
  RfqClose: "rfq.close",
  RfqAward: "rfq.award",
  RfqMatch: "rfq.match",
  RfqMatchDecline: "rfq.match.decline",
  RfqMatchModerate: "rfq.match.moderate",
  QuoteSubmit: "quote.submit",
  QuoteRevise: "quote.revise",
  QuoteReadSupplier: "quote.read.supplier",
  QuoteReadBuyer: "quote.read.buyer",
  QuoteAccept: "quote.accept",
  QuoteDecline: "quote.decline",
  QuoteRequestRevision: "quote.requestRevision",
  QuoteWithdraw: "quote.withdraw",
  OrderCreate: "order.create",
  OrderReadOwn: "order.read.own",
  OrderFulfill: "order.fulfill",
  OrderCancel: "order.cancel",
  OrderDispute: "order.dispute",
  ProductCreate: "product.create",
  ProductUpdateOwn: "product.update.own",
  ProductPublish: "product.publish",
  ProductModerate: "product.moderate",
  SupplierVerify: "supplier.verify",
  SupplierSuspend: "supplier.suspend",
  SupplierReadInternal: "supplier.read.internal",
  SupplierUpdateOwn: "supplier.update.own",
  SubscriptionManage: "subscription.manage",
  SubscriptionBill: "subscription.bill",
  ContentPublish: "content.publish",
  ContentModerate: "content.moderate",
  ReviewCreate: "review.create",
  ReviewModerate: "review.moderate",
  AuditRead: "audit.read",
  SecurityRead: "security.read",
  AdminUsersUnlock: "admin.users.unlock",
  OrganizationMemberManage: "organization.member.manage",
} as const;

export type PermissionCode = (typeof Permissions)[keyof typeof Permissions];

export const ALL_PERMISSIONS: readonly PermissionCode[] = Object.values(Permissions);

/** Minimal shape needed for checks — the session user or a raw code list. */
export type PermissionHolder =
  | { permissions: readonly string[] }
  | readonly string[]
  | null
  | undefined;

function codesOf(holder: PermissionHolder): readonly string[] {
  if (!holder) return [];
  if (Array.isArray(holder)) return holder;
  return (holder as { permissions: readonly string[] }).permissions;
}

export function hasPermission(holder: PermissionHolder, code: string): boolean {
  return codesOf(holder).includes(code);
}

export function hasAnyPermission(holder: PermissionHolder, codes: readonly string[]): boolean {
  const owned = codesOf(holder);
  return codes.some((c) => owned.includes(c));
}

export function hasAllPermissions(holder: PermissionHolder, codes: readonly string[]): boolean {
  const owned = codesOf(holder);
  return codes.every((c) => owned.includes(c));
}
