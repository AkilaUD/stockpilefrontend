"use client";

/*
 * Supplier setup stage 4 — the districts the supplier serves (business-flows
 * §3.3, api.md §2.9). Reads the stored set on mount and REPLACES it with a
 * single `PUT` on submit: the district set is not appended to, it is declared.
 *
 * The picker is the transcribed reference geography (`lib/geography.ts`) and the
 * backend re-checks every code authoritatively, so this list is convenience —
 * never the source of truth. The default district can only be one of the chosen
 * districts, because the control offers nothing else; that removes the one
 * mismatch the backend would have to answer 422 for.
 */

import { useEffect, useId, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { errorEnvelopeCode, resolveErrorCopy, supplierSelfApi } from "@/lib/api";
import { DISTRICTS, PROVINCES, districtsOfProvince } from "@/lib/geography";
import { fieldErrorsToRecord } from "@/lib/validation/auth";
import { SupplierSetupMissing } from "./supplier-setup-missing";

/** district code → reference name, for the default-district control's options. */
const DISTRICT_NAMES = new Map(DISTRICTS.map((district) => [district.code, district.name]));

export function SupplierServiceAreasForm() {
  const t = useTranslations("auth.supplierSetup.serviceAreas");
  const tErrors = useTranslations("errors");
  const tValidation = useTranslations("auth.validation");
  const { csrfToken, status } = useSession();
  const router = useRouter();

  const [selected, setSelected] = useState<string[]>([]);
  const [defaultDistrict, setDefaultDistrict] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [readSettled, setReadSettled] = useState(false);
  const [missing, setMissing] = useState(false);

  const defaultId = useId();

  useEffect(() => {
    if (status !== "signedIn") return;
    let cancelled = false;
    void (async () => {
      try {
        const self = await supplierSelfApi.get();
        if (cancelled) return;
        setSelected(self.serviceAreas.map((area) => area.districtCode));
        setDefaultDistrict(self.serviceAreas.find((area) => area.isDefault)?.districtCode ?? "");
      } catch (error) {
        if (cancelled) return;
        if (errorEnvelopeCode(error) === "RESOURCE_NOT_FOUND") setMissing(true);
      } finally {
        if (!cancelled) setReadSettled(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  const locked = submitting || status === "loading" || (status === "signedIn" && !readSettled);

  const toggle = (code: string): void => {
    setSelected((previous) => {
      if (previous.includes(code)) {
        if (defaultDistrict === code) setDefaultDistrict("");
        return previous.filter((candidate) => candidate !== code);
      }
      return [...previous, code];
    });
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setBanner(null);
    setFieldErrors({});

    setSubmitting(true);
    try {
      await supplierSelfApi.setServiceAreas(
        {
          districts: selected,
          ...(defaultDistrict.length > 0 ? { defaultDistrict } : {}),
        },
        await csrfToken(),
      );
      router.push("/supplier/setup/categories");
    } catch (error) {
      if (errorEnvelopeCode(error) === "RESOURCE_NOT_FOUND") {
        setMissing(true);
        return;
      }
      setBanner(resolveErrorCopy(tErrors, error));
      if (error instanceof Error && "envelope" in error) {
        const envelope = (
          error as { envelope?: { fieldErrors?: Parameters<typeof fieldErrorsToRecord>[0] } }
        ).envelope;
        setFieldErrors(fieldErrorsToRecord(envelope?.fieldErrors, tValidation));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (missing) return <SupplierSetupMissing />;

  return (
    <form onSubmit={onSubmit} noValidate aria-busy={locked} className="space-y-6">
      {banner !== null && (
        <p role="alert" className="rounded-md border border-line bg-surface-panel p-3 type-body-sm text-ink">
          {banner}
        </p>
      )}

      <p className="type-body-sm text-ink-muted">{t("hint")}</p>

      <fieldset className="space-y-5" disabled={locked}>
        <legend className="type-label text-ink">{t("districtsLabel")}</legend>
        {PROVINCES.map((province) => (
          <div key={province.code}>
            <p className="mb-2 type-meta font-semibold text-ink-muted">
              {province.name}
            </p>
            <ul className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
              {districtsOfProvince(province.code).map((district) => {
                const checked = selected.includes(district.code);
                return (
                  <li key={district.code}>
                    <label className="flex items-center gap-2 type-body-sm text-ink">
                      <input
                        type="checkbox"
                        name="districts"
                        value={district.code}
                        checked={checked}
                        onChange={() => toggle(district.code)}
                        disabled={locked}
                      />
                      {district.name}
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        {fieldErrors.districts !== undefined && (
          <p role="alert" className="type-body-sm text-signal-critical">
            {fieldErrors.districts}
          </p>
        )}
      </fieldset>

      <div className="space-y-2">
        <label htmlFor={defaultId} className="type-label text-ink">
          {t("defaultLabel")}
        </label>
        <select
          id={defaultId}
          name="defaultDistrict"
          className="w-full rounded-md border border-line bg-surface-raised px-3 py-2 type-body text-ink"
          value={defaultDistrict}
          onChange={(event) => setDefaultDistrict(event.target.value)}
          disabled={locked}
        >
          <option value="">{t("defaultNone")}</option>
          {selected.map((code) => (
            <option key={code} value={code}>
              {DISTRICT_NAMES.get(code) ?? code}
            </option>
          ))}
        </select>
        <p className="type-body-sm text-ink-muted">{t("defaultHint")}</p>
        {fieldErrors.defaultDistrict !== undefined && (
          <p role="alert" className="type-body-sm text-signal-critical">
            {fieldErrors.defaultDistrict}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={locked}>
          {submitting ? t("saving") : t("continue")}
        </Button>
      </div>
    </form>
  );
}
