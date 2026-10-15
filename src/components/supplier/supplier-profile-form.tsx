"use client";

/*
 * Supplier setup steps 2–3 — the contact person and the business identity
 * (business-flows §3.3, api.md §2.9). The caller is signed in (the setup lives
 * in the guarded (supplier) group). The component reads the stored supplier on
 * mount and PATCHes on submit, so the step is resumable: leaving and returning
 * re-reads what the backend holds.
 *
 * Hand-rolled state, no react-hook-form: the forms are tiny and the workspace
 * budget is the small one (design-system §11). The server is the enforcement
 * boundary; `fieldErrorsToRecord` lands a 422 envelope's field errors back on
 * the inputs.
 *
 * The company name is the one member of the merge that may never be blank: the
 * backend answers 422 `companyName` for it, and this form refuses the same
 * value before the round trip rather than letting the request be the validator.
 */

import { useEffect, useId, useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { FormField, fieldControlClassName } from "@/components/ui/form-field";
import {
  errorEnvelopeCode,
  resolveErrorCopy,
  supplierSelfApi,
  type SupplierProfileDraft,
} from "@/lib/api";
import { fieldErrorsToRecord } from "@/lib/validation/auth";
import { SupplierSetupMissing } from "./supplier-setup-missing";

interface ProfileValues {
  companyName: string;
  registrationNumber: string;
  website: string;
  contactPerson: string;
  phone: string;
  email: string;
}

const EMPTY: ProfileValues = {
  companyName: "",
  registrationNumber: "",
  website: "",
  contactPerson: "",
  phone: "",
  email: "",
};

export function SupplierProfileForm() {
  const t = useTranslations("auth.supplierSetup.profile");
  const tErrors = useTranslations("errors");
  const tValidation = useTranslations("auth.validation");
  const tA11y = useTranslations("a11y");
  const { csrfToken, status } = useSession();
  const router = useRouter();

  const [values, setValues] = useState<ProfileValues>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [readSettled, setReadSettled] = useState(false);
  const [missing, setMissing] = useState(false);

  const companyId = useId();
  const registrationId = useId();
  const websiteId = useId();
  const contactId = useId();
  const phoneId = useId();
  const emailId = useId();

  useEffect(() => {
    if (status !== "signedIn") return;
    let cancelled = false;
    void (async () => {
      try {
        const self = await supplierSelfApi.get();
        if (cancelled) return;
        setValues({
          companyName: self.companyName ?? "",
          registrationNumber: self.registrationNumber ?? "",
          website: self.website ?? "",
          contactPerson: self.profile.contactPerson ?? "",
          phone: self.profile.phone ?? "",
          email: self.profile.email ?? "",
        });
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

  const update =
    (key: keyof ProfileValues) =>
    (event: ChangeEvent<HTMLInputElement>): void => {
      const { value } = event.target;
      setValues((previous) => ({ ...previous, [key]: value }));
    };

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setBanner(null);
    setFieldErrors({});

    if (values.companyName.trim().length === 0) {
      setFieldErrors({ companyName: tValidation("companyRequired") });
      return;
    }

    setSubmitting(true);
    try {
      const draft: SupplierProfileDraft = {
        companyName: values.companyName.trim(),
        registrationNumber: values.registrationNumber.trim(),
        website: values.website.trim(),
        contactPerson: values.contactPerson.trim(),
        phone: values.phone.trim(),
        email: values.email.trim(),
      };
      await supplierSelfApi.updateProfile(draft, await csrfToken());
      router.push("/supplier/setup/service-areas");
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
    <form onSubmit={onSubmit} noValidate aria-busy={locked} className="space-y-5">
      {banner !== null && (
        <p role="alert" className="rounded-md border border-line bg-surface-panel p-3 type-body-sm text-ink">
          {banner}
        </p>
      )}

      <FormField id={companyId} label={t("companyName")} error={fieldErrors.companyName} required requiredText={tA11y("requiredField")}>
        {(control) => (
          <input
            {...control}
            type="text"
            name="companyName"
            autoComplete="organization"
            className={fieldControlClassName}
            value={values.companyName}
            onChange={update("companyName")}
            disabled={locked}
          />
        )}
      </FormField>

      <FormField id={registrationId} label={t("registrationNumber")} hint={t("registrationHint")} error={fieldErrors.registrationNumber}>
        {(control) => (
          <input
            {...control}
            type="text"
            name="registrationNumber"
            className={fieldControlClassName}
            value={values.registrationNumber}
            onChange={update("registrationNumber")}
            disabled={locked}
          />
        )}
      </FormField>

      <FormField id={websiteId} label={t("website")} hint={t("websiteHint")} error={fieldErrors.website}>
        {(control) => (
          <input
            {...control}
            type="url"
            name="website"
            autoComplete="url"
            className={fieldControlClassName}
            value={values.website}
            onChange={update("website")}
            disabled={locked}
          />
        )}
      </FormField>

      <FormField id={contactId} label={t("contactPerson")} error={fieldErrors.contactPerson}>
        {(control) => (
          <input
            {...control}
            type="text"
            name="contactPerson"
            autoComplete="name"
            className={fieldControlClassName}
            value={values.contactPerson}
            onChange={update("contactPerson")}
            disabled={locked}
          />
        )}
      </FormField>

      <FormField id={phoneId} label={t("phone")} error={fieldErrors.phone}>
        {(control) => (
          <input
            {...control}
            type="tel"
            name="phone"
            autoComplete="tel"
            className={fieldControlClassName}
            value={values.phone}
            onChange={update("phone")}
            disabled={locked}
          />
        )}
      </FormField>

      <FormField id={emailId} label={t("email")} error={fieldErrors.email}>
        {(control) => (
          <input
            {...control}
            type="email"
            name="email"
            autoComplete="email"
            className={fieldControlClassName}
            value={values.email}
            onChange={update("email")}
            disabled={locked}
          />
        )}
      </FormField>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Button type="submit" disabled={locked}>
          {submitting ? t("saving") : t("continue")}
        </Button>
      </div>
    </form>
  );
}
