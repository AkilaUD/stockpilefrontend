/**
 * Sri Lankan reference geography — the district and province codes the backend
 * seeds (`backend/src/Stockpile.Api/Persistence/DbSeeder.cs`). Address drafts
 * carry these slugs, never free text (domain-model §2.4), and the backend
 * re-checks existence plus the district↔province pairing authoritatively, so
 * this list only feeds the picker — it is convenience, never the source of
 * truth. Phase 1 exposes no reference-geography endpoint (api.md §2 has no such
 * route), so the codes are transcribed here rather than fetched; keep them in
 * step with the seeder.
 */

export interface Province {
  code: string;
  name: string;
}

export interface District {
  code: string;
  name: string;
  provinceCode: string;
}

/** The nine provinces, in the seeder's order. */
export const PROVINCES: readonly Province[] = [
  { code: "western", name: "Western" },
  { code: "central", name: "Central" },
  { code: "southern", name: "Southern" },
  { code: "northern", name: "Northern" },
  { code: "eastern", name: "Eastern" },
  { code: "north-western", name: "North Western" },
  { code: "north-central", name: "North Central" },
  { code: "uva", name: "Uva" },
  { code: "sabaragamuwa", name: "Sabaragamuwa" },
];

/** The twenty-five districts, in the seeder's order. */
export const DISTRICTS: readonly District[] = [
  { code: "colombo", name: "Colombo", provinceCode: "western" },
  { code: "gampaha", name: "Gampaha", provinceCode: "western" },
  { code: "kalutara", name: "Kalutara", provinceCode: "western" },
  { code: "kandy", name: "Kandy", provinceCode: "central" },
  { code: "matale", name: "Matale", provinceCode: "central" },
  { code: "nuwara-eliya", name: "Nuwara Eliya", provinceCode: "central" },
  { code: "galle", name: "Galle", provinceCode: "southern" },
  { code: "matara", name: "Matara", provinceCode: "southern" },
  { code: "hambantota", name: "Hambantota", provinceCode: "southern" },
  { code: "jaffna", name: "Jaffna", provinceCode: "northern" },
  { code: "kilinochchi", name: "Kilinochchi", provinceCode: "northern" },
  { code: "mannar", name: "Mannar", provinceCode: "northern" },
  { code: "mullaitivu", name: "Mullaitivu", provinceCode: "northern" },
  { code: "vavuniya", name: "Vavuniya", provinceCode: "northern" },
  { code: "batticaloa", name: "Batticaloa", provinceCode: "eastern" },
  { code: "ampara", name: "Ampara", provinceCode: "eastern" },
  { code: "trincomalee", name: "Trincomalee", provinceCode: "eastern" },
  { code: "kurunegala", name: "Kurunegala", provinceCode: "north-western" },
  { code: "puttalam", name: "Puttalam", provinceCode: "north-western" },
  { code: "anuradhapura", name: "Anuradhapura", provinceCode: "north-central" },
  { code: "polonnaruwa", name: "Polonnaruwa", provinceCode: "north-central" },
  { code: "badulla", name: "Badulla", provinceCode: "uva" },
  { code: "monaragala", name: "Monaragala", provinceCode: "uva" },
  { code: "ratnapura", name: "Ratnapura", provinceCode: "sabaragamuwa" },
  { code: "kegalle", name: "Kegalle", provinceCode: "sabaragamuwa" },
];

/** The only country Phase 1 seeds (an ISO 3166-1 alpha-2 code). */
export const DEFAULT_COUNTRY_CODE = "LK";

/** The districts of one province code — the second select of the address form. */
export function districtsOfProvince(provinceCode: string): readonly District[] {
  return DISTRICTS.filter((district) => district.provinceCode === provinceCode);
}

/** The province that owns a district code, if it is a known district. */
export function provinceOfDistrict(districtCode: string): Province | undefined {
  const district = DISTRICTS.find((candidate) => candidate.code === districtCode);
  return district ? PROVINCES.find((province) => province.code === district.provinceCode) : undefined;
}
