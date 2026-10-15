import { apiFetch } from "./client";

/**
 * Typed organisation surface (api.md §2.1 `/organizations`). The wizard's step 3
 * posts the whole organisation — company, addresses and optional team
 * invitations — in one atomic create; the shapes mirror
 * `Stockpile.Contracts.Organizations.OrganizationContracts` and
 * `Stockpile.Application.Organizations.OrganizationContracts`. Camel case is the
 * wire casing; optional members are omitted, never null (api.md §1.4).
 */

/**
 * One postal address to create. `district` / `province` are reference codes
 * (`frontend/src/lib/geography.ts`); the backend re-validates them and their
 * pairing, answering 422 `invalid_reference` / `district_province_mismatch`.
 */
export interface AddressDraft {
  line1: string;
  line2?: string;
  city: string;
  district: string;
  province: string;
  postalCode?: string;
  countryCode: string;
  latitude?: number;
  longitude?: number;
  isDefaultBilling: boolean;
  isDefaultDelivery: boolean;
}

/** One team member to invite: an existing account's email and an organisation-scope role code. */
export interface OrganizationMemberDraft {
  email: string;
  roleId: string;
}

/** The company identity fields of the new organisation. */
export interface OrganizationCompanyDraft {
  name: string;
  registrationNumber?: string;
  taxId?: string;
  website?: string;
}

/** The `POST /organizations` body (wizard step 3). `addresses` / `members` are omitted when empty. */
export interface CreateOrganizationRequest {
  company: OrganizationCompanyDraft;
  addresses?: AddressDraft[];
  members?: OrganizationMemberDraft[];
}

/** The address shape the write side returns (api.md §2.1 example) — optional fields come back as null. */
export interface AddressResponse {
  id: string;
  line1: string;
  line2: string | null;
  city: string;
  district: string;
  province: string;
  postalCode: string | null;
  countryCode: string;
  latitude: number | null;
  longitude: number | null;
  isDefaultBilling: boolean;
  isDefaultDelivery: boolean;
}

export interface OrganizationMemberResponse {
  userId: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string | null;
}

export interface OrganizationResponse {
  id: string;
  name: string;
  type: string;
  status: string;
  registrationNumber: string | null;
  taxId: string | null;
  website: string | null;
  addresses: AddressResponse[];
  members: OrganizationMemberResponse[];
}

const ORGANIZATIONS_PATH = "/api/v1/organizations";

/** The organisation-scope role codes the seeder ships (`Seed:Roles`) that a team member may hold. */
export const ORGANIZATION_MEMBER_ROLES = ["buyer", "buyerAdmin"] as const;

export type OrganizationMemberRole = (typeof ORGANIZATION_MEMBER_ROLES)[number];

export const organizationsApi = {
  /** Wizard step 3 — one atomic create (rate-limited `organization.create`). */
  create: (body: CreateOrganizationRequest, csrfToken: string) =>
    apiFetch<OrganizationResponse>(ORGANIZATIONS_PATH, {
      method: "POST",
      body: JSON.stringify(body),
    }, { csrfToken }),
};
