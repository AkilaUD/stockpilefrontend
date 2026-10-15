import { apiFetch } from "./client";

/**
 * The signed-in supplier's own onboarding surface (api.md §2.9,
 * business-flows §3.3 stages 2–5). A supplier account is created by one atomic
 * `POST /auth/register/supplier`; this module is what makes every stage after
 * the account resumable and editable — the contact/business profile, the
 * district service areas and the category coverage.
 *
 * Shapes mirror `Stockpile.Application.Suppliers.SupplierSelfContracts` exactly:
 * camel case on the wire, optional members omitted rather than null (api.md
 * §1.4). Writes answer the caller's whole new state, so the wizard never needs
 * a second round trip to refresh itself.
 *
 * Plain module (no `"use client"`): client components import it.
 */

/** Stage 2/3 contact rows published on the public supplier profile. */
export interface SupplierSelfProfile {
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
}

/** One category the supplier is on record as covering (stage 5). */
export interface SupplierSelfCategory {
  slug: string;
  name: string;
  /** `SpecialtyLevel` — `Primary`, `Secondary` or `Occasional`. */
  specialtyLevel: string;
  quotable: boolean;
}

/** One district the supplier serves (stage 4). */
export interface SupplierSelfServiceArea {
  districtCode: string;
  isDefault: boolean;
  radiusKm: number | null;
}

/** The caller's supplier as the setup/edit surface sees it (`GET /suppliers/me`). */
export interface SupplierSelf {
  supplierId: string;
  slug: string;
  displayName: string;
  /** `SupplierStatus` — `Draft`, `PendingVerification`, `Active`, `Suspended`, `Closed`. */
  status: string;
  /** `VerificationState` — `Unverified`, `Pending`, `Verified`, `Rejected`. */
  verificationState: string;
  companyName: string;
  registrationNumber: string | null;
  website: string | null;
  profile: SupplierSelfProfile;
  categories: SupplierSelfCategory[];
  serviceAreas: SupplierSelfServiceArea[];
}

/**
 * Partial merge of stages 2–3: an **omitted** member is left untouched and a
 * blank string clears it. The backend holds the same contract, so a step never
 * has to read a value back before writing the one it changed.
 */
export interface SupplierProfileDraft {
  companyName?: string;
  registrationNumber?: string;
  website?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
}

/** Stage 4 replace: the full set of district codes the supplier serves. */
export interface SupplierServiceAreasDraft {
  districts: string[];
  defaultDistrict?: string;
}

const SUPPLIER_SELF_PATH = "/api/v1/suppliers/me";

/** A category slug is a materialized path (`building-materials/timber`), so every segment is encoded. */
function categoryPath(slug: string): string {
  return `${SUPPLIER_SELF_PATH}/categories/${slug.split("/").map(encodeURIComponent).join("/")}`;
}

export const supplierSelfApi = {
  /** The whole onboarding state. Answers 404 when the caller has no supplier. */
  get: () => apiFetch<SupplierSelf>(SUPPLIER_SELF_PATH),

  /** Stages 2–3 — merge the person/business profile (rate-limited `supplier.profile.write`). */
  updateProfile: (body: SupplierProfileDraft, csrfToken: string) =>
    apiFetch<SupplierSelf>(
      `${SUPPLIER_SELF_PATH}/profile`,
      { method: "PATCH", body: JSON.stringify(body) },
      { csrfToken },
    ),

  /** Stage 5 — add coverage. Idempotent: re-adding is a no-op, never a duplicate row. */
  addCategory: (slug: string, csrfToken: string) =>
    apiFetch<SupplierSelf>(
      `${SUPPLIER_SELF_PATH}/categories`,
      { method: "POST", body: JSON.stringify({ slug }) },
      { csrfToken },
    ),

  /** Stage 5 — remove coverage. 404s when the supplier did not cover the category. */
  removeCategory: (slug: string, csrfToken: string) =>
    apiFetch<SupplierSelf>(categoryPath(slug), { method: "DELETE" }, { csrfToken }),

  /** Stage 4 — replace the whole district set (the backend validates the codes). */
  setServiceAreas: (body: SupplierServiceAreasDraft, csrfToken: string) =>
    apiFetch<SupplierSelf>(
      `${SUPPLIER_SELF_PATH}/service-areas`,
      { method: "PUT", body: JSON.stringify(body) },
      { csrfToken },
    ),
};
