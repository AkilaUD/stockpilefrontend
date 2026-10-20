import { describe, expect, it } from "vitest";
import { ALL_PERMISSIONS, Permissions, hasAnyPermission, hasPermission } from "./permissions";
import { derivePersonas } from "./personas";
import { ROUTE_PERMISSIONS } from "./routes";

/** Fixture permission sets mirroring appsettings Seed:Roles grants. */
export const FIXTURES = {
  buyer: ["rfq.create", "rfq.read.own", "rfq.submit", "rfq.cancel", "quote.read.buyer", "order.create", "order.read.own", "review.create"],
  buyerAdmin: ["rfq.create", "rfq.read.own", "rfq.submit", "rfq.cancel", "rfq.close", "rfq.award", "quote.read.buyer", "quote.accept", "quote.decline", "quote.requestRevision", "order.create", "order.read.own", "order.cancel", "order.dispute", "review.create", "organization.member.manage"],
  supplierOwner: ["product.create", "product.update.own", "product.publish", "quote.submit", "quote.revise", "quote.read.supplier", "quote.withdraw", "rfq.match.decline", "subscription.manage", "supplier.update.own", "order.fulfill", "order.dispute"],
  supplierUser: ["product.create", "product.update.own", "quote.submit", "quote.revise", "quote.read.supplier", "quote.withdraw", "rfq.match.decline", "order.fulfill"],
  platformAdministrator: ["audit.read", "security.read", "admin.users.unlock", "supplier.verify", "supplier.suspend", "supplier.read.internal", "product.moderate", "content.publish", "content.moderate", "review.moderate", "rfq.read.any", "rfq.match.moderate"],
  securityAuditor: ["audit.read", "security.read"],
  financeOperator: ["subscription.bill", "subscription.manage"],
} as const;

describe("permissions catalog", () => {
  it("mirrors the 41 backend codes, unique", () => {
    expect(ALL_PERMISSIONS).toHaveLength(41);
    expect(new Set(ALL_PERMISSIONS).size).toBe(41);
    expect(Permissions.QuoteRequestRevision).toBe("quote.requestRevision");
  });
  it("hasPermission / hasAnyPermission work on holders and raw lists", () => {
    expect(hasPermission({ permissions: FIXTURES.buyer }, "rfq.create")).toBe(true);
    expect(hasPermission(FIXTURES.buyer, "quote.accept")).toBe(false);
    expect(hasAnyPermission(null, ["rfq.create"])).toBe(false);
    expect(hasAnyPermission(FIXTURES.supplierOwner, ["supplier.update.own"])).toBe(true);
  });
});

describe("derivePersonas", () => {
  it("buyer: buyer desk only; buyer lacks quote.accept, buyerAdmin has it", () => {
    expect(derivePersonas(FIXTURES.buyer)).toEqual({ canAccessBuyerDesk: true, canAccessSupplierDesk: false, canAccessAdminShell: false });
    expect(hasPermission(FIXTURES.buyer, Permissions.QuoteAccept)).toBe(false);
    expect(hasPermission(FIXTURES.buyerAdmin, Permissions.QuoteAccept)).toBe(true);
  });
  it("supplier: supplier desk only (subscription.manage alone is not platform)", () => {
    expect(derivePersonas(FIXTURES.supplierOwner)).toEqual({ canAccessBuyerDesk: false, canAccessSupplierDesk: true, canAccessAdminShell: false });
    expect(derivePersonas(FIXTURES.supplierUser).canAccessSupplierDesk).toBe(true);
  });
  it("platform roles: admin shell, incl. securityAuditor and financeOperator", () => {
    expect(derivePersonas(FIXTURES.platformAdministrator).canAccessAdminShell).toBe(true);
    expect(derivePersonas(FIXTURES.securityAuditor)).toEqual({ canAccessBuyerDesk: false, canAccessSupplierDesk: false, canAccessAdminShell: true });
    expect(derivePersonas(FIXTURES.financeOperator).canAccessAdminShell).toBe(true);
  });
  it("empty session accesses nothing; route map references real codes", () => {
    expect(derivePersonas([])).toEqual({ canAccessBuyerDesk: false, canAccessSupplierDesk: false, canAccessAdminShell: false });
    for (const codes of Object.values(ROUTE_PERMISSIONS)) {
      for (const c of codes) expect(ALL_PERMISSIONS).toContain(c);
    }
  });
});
