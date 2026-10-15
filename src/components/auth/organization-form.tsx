"use client";

/*
 * Buyer wizard step 3 — the organisation, its address and optional team
 * invitations (business-flows §2, api.md §2.1 `POST /organizations`).
 *
 * Two honest states, decided from the session the caller already holds:
 *   - a caller who is already an accepted member of an organisation has nothing
 *     to create here — `POST /organizations` would mint a SECOND organisation —
 *     so the step says so and moves on;
 *   - everyone else fills the form, which posts ONE atomic create (company +
 *     address + invites, or nothing at all on failure).
 *
 * The address province is derived from the chosen district rather than entered:
 * the seeded reference data makes province a function of district, and the
 * backend re-validates the pairing either way.
 */

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { FormField, fieldControlClassName } from "@/components/ui/form-field";
import { organizationsApi, resolveErrorCopy } from "@/lib/api";
import type { CreateOrganizationRequest, OrganizationMemberDraft } from "@/lib/api";
import { DISTRICTS, DEFAULT_COUNTRY_CODE, provinceOfDistrict } from "@/lib/geography";
import { fieldErrorsToRecord } from "@/lib/validation/auth";

interface AddressValues {
  line1: string;
  line2: string;
  city: string;
  district: string;
  postalCode: string;
}

const EMPTY_ADDRESS: AddressValues = { line1: "", line2: "", city: "", district: "", postalCode: "" };

/** The first field error committed under one of the given paths (list entries arrive as `members[0].email`). */
function firstError(errors: Record<string, string>, paths: readonly string[]): string | undefined {
  for (const [key, message] of Object.entries(errors)) {
    if (paths.some((path) => key === path || key.startsWith(path))) return message;
  }
  return undefined;
}

export function OrganizationForm() {
  const t = useTranslations("auth.organization");
  const tErrors = useTranslations("errors");
  const tValidation = useTranslations("auth.validation");
  const tA11y = useTranslations("a11y");
  const { csrfToken, status, user } = useSession();
  const router = useRouter();

  const [companyName, setCompanyName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [taxId, setTaxId] = useState("");
  const [website, setWebsite] = useState("");
  const [addressEnabled, setAddressEnabled] = useState(true);
  const [address, setAddress] = useState<AddressValues>(EMPTY_ADDRESS);
  const [members, setMembers] = useState<OrganizationMemberDraft[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const existingMemberships = user?.orgMemberships ?? [];

  /**
   * The step cannot know which of its two states applies until the session has
   * resolved — membership is what decides. Before then, submitting would mint a
   * SECOND organisation for a buyer who already has one, which is the exact
   * thing this step exists to prevent, so the create form stays inert while the
   * session is still in flight.
   */
  const locked = submitting || status === "loading";

  if (existingMemberships.length > 0) {
    const organisation = existingMemberships[0];
    return (
      <div className="flex flex-col gap-4">
        <p className="type-body text-ink-muted">{t("alreadySetUp", { name: organisation.name })}</p>
        <div>
          <Button type="button" onClick={() => router.push("/wizard/preferences")}>
            {t("continue")}
          </Button>
        </div>
      </div>
    );
  }

  const addMember = () => setMembers((previous) => [...previous, { email: "", roleId: "buyer" }]);
  const removeMember = (index: number) => setMembers((previous) => previous.filter((_, i) => i !== index));
  const setMember = (index: number, patch: Partial<OrganizationMemberDraft>) =>
    setMembers((previous) => previous.map((member, i) => (i === index ? { ...member, ...patch } : member)));

  const clientFailures = (): Record<string, string> => {
    const failures: Record<string, string> = {};
    if (companyName.trim().length === 0) failures["company.name"] = tValidation("companyRequired");
    if (addressEnabled) {
      if (address.line1.trim().length === 0) failures["addresses[0].line1"] = t("line1Required");
      if (address.city.trim().length === 0) failures["addresses[0].city"] = t("cityRequired");
      if (address.district.length === 0) failures["addresses[0].district"] = t("districtRequired");
    }
    members.forEach((member, index) => {
      if (member.email.trim().length === 0) failures[`members[${index}].email`] = tValidation("emailRequired");
    });
    return failures;
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setBanner(null);

    const failures = clientFailures();
    setFieldErrors(failures);
    if (Object.keys(failures).length > 0) return;

    const province = provinceOfDistrict(address.district);
    const body: CreateOrganizationRequest = {
      company: {
        name: companyName.trim(),
        ...(registrationNumber.trim() ? { registrationNumber: registrationNumber.trim() } : {}),
        ...(taxId.trim() ? { taxId: taxId.trim() } : {}),
        ...(website.trim() ? { website: website.trim() } : {}),
      },
      ...(addressEnabled && province
        ? {
            addresses: [
              {
                line1: address.line1.trim(),
                ...(address.line2.trim() ? { line2: address.line2.trim() } : {}),
                city: address.city.trim(),
                district: address.district,
                province: province.code,
                ...(address.postalCode.trim() ? { postalCode: address.postalCode.trim() } : {}),
                countryCode: DEFAULT_COUNTRY_CODE,
                isDefaultBilling: true,
                isDefaultDelivery: true,
              },
            ],
          }
        : {}),
      ...(members.length > 0
        ? { members: members.map((member) => ({ email: member.email.trim(), roleId: member.roleId })) }
        : {}),
    };

    setSubmitting(true);
    try {
      await organizationsApi.create(body, await csrfToken());
      router.push("/wizard/preferences");
    } catch (error) {
      setBanner(resolveErrorCopy(tErrors, error));
      if (error instanceof Error && "envelope" in error) {
        const envelope = (error as { envelope?: { fieldErrors?: Parameters<typeof fieldErrorsToRecord>[0] } }).envelope;
        setFieldErrors(fieldErrorsToRecord(envelope?.fieldErrors, tValidation));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const text = (set: (next: string) => void) => (event: ChangeEvent<HTMLInputElement>) =>
    set(event.target.value);

  return (
    <form noValidate aria-busy={locked} onSubmit={onSubmit} className="flex flex-col gap-6">
      {banner && (
        <p role="alert" className="type-meta rounded-sm border border-danger/30 bg-danger/5 p-3 text-danger">
          {banner}
        </p>
      )}

      <FormField id="org-name" label={t("companyNameLabel")} required requiredText={tA11y("requiredField")} error={firstError(fieldErrors, ["company.name"])}>
        {(control) => (
          <input
            {...control}
            type="text"
            autoComplete="organization"
            value={companyName}
            onChange={text(setCompanyName)}
            disabled={locked}
            className={fieldControlClassName}
          />
        )}
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="org-registration" label={t("registrationNumberLabel")} error={firstError(fieldErrors, ["company.registrationNumber"])}>
          {(control) => (
            <input
              {...control}
              type="text"
              value={registrationNumber}
              onChange={text(setRegistrationNumber)}
              disabled={locked}
              className={fieldControlClassName}
            />
          )}
        </FormField>

        <FormField id="org-taxid" label={t("taxIdLabel")} error={firstError(fieldErrors, ["company.taxId"])}>
          {(control) => (
            <input
              {...control}
              type="text"
              value={taxId}
              onChange={text(setTaxId)}
              disabled={locked}
              className={fieldControlClassName}
            />
          )}
        </FormField>
      </div>

      <FormField id="org-website" label={t("websiteLabel")} hint={t("websiteHint")} error={firstError(fieldErrors, ["company.website"])}>
        {(control) => (
          <input
            {...control}
            type="url"
            inputMode="url"
            value={website}
            onChange={text(setWebsite)}
            disabled={locked}
            className={fieldControlClassName}
          />
        )}
      </FormField>

      <fieldset className="flex flex-col gap-5 rounded-sm border border-line p-4">
        <legend className="type-label px-1 text-ink-muted">{t("addressLegend")}</legend>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="org-address-enabled"
            className="h-4 w-4"
            checked={addressEnabled}
            onChange={(event) => setAddressEnabled(event.target.checked)}
            disabled={locked}
          />
          <label htmlFor="org-address-enabled" className="type-body cursor-pointer">
            {t("addressToggle")}
          </label>
        </div>

        {addressEnabled && (
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="org-line1" label={t("line1Label")} required requiredText={tA11y("requiredField")} error={firstError(fieldErrors, ["addresses[0].line1"])} className="sm:col-span-2">
              {(control) => (
                <input
                  {...control}
                  type="text"
                  autoComplete="address-line1"
                  value={address.line1}
                  onChange={text((next) => setAddress((previous) => ({ ...previous, line1: next })))}
                  disabled={locked}
                  className={fieldControlClassName}
                />
              )}
            </FormField>

            <FormField id="org-line2" label={t("line2Label")} className="sm:col-span-2">
              {(control) => (
                <input
                  {...control}
                  type="text"
                  autoComplete="address-line2"
                  value={address.line2}
                  onChange={text((next) => setAddress((previous) => ({ ...previous, line2: next })))}
                  disabled={locked}
                  className={fieldControlClassName}
                />
              )}
            </FormField>

            <FormField id="org-city" label={t("cityLabel")} required requiredText={tA11y("requiredField")} error={firstError(fieldErrors, ["addresses[0].city"])}>
              {(control) => (
                <input
                  {...control}
                  type="text"
                  autoComplete="address-level2"
                  value={address.city}
                  onChange={text((next) => setAddress((previous) => ({ ...previous, city: next })))}
                  disabled={locked}
                  className={fieldControlClassName}
                />
              )}
            </FormField>

            <FormField id="org-postal" label={t("postalCodeLabel")} error={firstError(fieldErrors, ["addresses[0].postalCode"])}>
              {(control) => (
                <input
                  {...control}
                  type="text"
                  autoComplete="postal-code"
                  value={address.postalCode}
                  onChange={text((next) => setAddress((previous) => ({ ...previous, postalCode: next })))}
                  disabled={locked}
                  className={fieldControlClassName}
                />
              )}
            </FormField>

            <FormField id="org-district" label={t("districtLabel")} required requiredText={tA11y("requiredField")} error={firstError(fieldErrors, ["addresses[0].district"])}>
              {(control) => (
                <select
                  {...control}
                  className={fieldControlClassName}
                  value={address.district}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                    setAddress((previous) => ({ ...previous, district: event.target.value }))
                  }
                  disabled={locked}
                >
                  <option value="">{t("districtPlaceholder")}</option>
                  {DISTRICTS.map((district) => (
                    <option key={district.code} value={district.code}>
                      {district.name}
                    </option>
                  ))}
                </select>
              )}
            </FormField>
          </div>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-4 rounded-sm border border-line p-4">
        <legend className="type-label px-1 text-ink-muted">{t("membersLegend")}</legend>
        <p className="type-body-sm text-ink-muted">{t("membersHint")}</p>

        {members.map((member, index) => (
          <div key={index} className="flex flex-wrap items-end gap-3">
            <FormField id={`member-email-${index}`} label={t("memberEmailLabel")} error={firstError(fieldErrors, [`members[${index}].email`])} className="min-w-[16rem] flex-1">
              {(control) => (
                <input
                  {...control}
                  type="email"
                  inputMode="email"
                  value={member.email}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setMember(index, { email: event.target.value })}
                  disabled={locked}
                  className={fieldControlClassName}
                />
              )}
            </FormField>

            <FormField id={`member-role-${index}`} label={t("memberRoleLabel")} error={firstError(fieldErrors, [`members[${index}].roleId`])}>
              {(control) => (
                <select
                  {...control}
                  className={fieldControlClassName}
                  value={member.roleId}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) => setMember(index, { roleId: event.target.value })}
                  disabled={locked}
                >
                  <option value="buyer">{t("role.buyer")}</option>
                  <option value="buyerAdmin">{t("role.buyerAdmin")}</option>
                </select>
              )}
            </FormField>

            <Button type="button" variant="secondary" onClick={() => removeMember(index)} disabled={locked}>
              {t("removeMember")}
            </Button>
          </div>
        ))}

        <div>
          {/* `label-wrap` (globals.css) is unlayered on purpose: the shared
              button chain says `whitespace-nowrap`, and the Sinhala label is
              long enough that a nowrap button becomes a min-content floor wider
              than a 360px viewport. */}
          <Button type="button" variant="secondary" className="label-wrap" onClick={addMember} disabled={locked}>
            {t("addMember")}
          </Button>
        </div>
      </fieldset>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={locked}>
          {submitting ? t("saving") : t("continue")}
        </Button>
      </div>
    </form>
  );
}
