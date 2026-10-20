"use client";

/*
 * Why this file is a client component (§15 rule 3): submit, department
 * selection and the antiforgery hand-off are interactivity.
 *
 * Supplier self-registration (business-flows §3.3, api.md §2.1
 * POST /auth/register/supplier). One submit creates the account AND — in one
 * transactional write on the server — the supplier company, the caller's
 * membership and the company's department coverage. Sign-in works immediately;
 * email verification (the same panel the buyer flow lands on) gates nothing
 * here but is surfaced the same way.
 *
 * Hand-rolled state, not react-hook-form: this page sits on a PUBLIC route
 * budget (design-system §11) — see lib/validation/auth.ts. The department
 * options arrive as server-rendered props, so the client fetches no taxonomy.
 */

import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useSession } from "@/components/providers/session-provider";
import { PasswordStrength } from "./password-strength";
import { Button } from "@/components/ui/button";
import { FormField, fieldControlClassName } from "@/components/ui/form-field";
import { ApiClientError, authApi, resolveErrorCopy } from "@/lib/api";
import {
  fieldErrorsToRecord,
  type FieldFailures,
  type SupplierRegisterValues,
  validateSupplierRegistration,
} from "@/lib/validation/auth";
import { clearDraftHandle, readDraftHandle, writeDraftHandle } from "@/lib/registration/draft-storage";

/** One selectable department, server-supplied from the live category tree. */
export interface DepartmentOption {
  slug: string;
  name: string;
}

const EMPTY: SupplierRegisterValues = {
  email: "",
  password: "",
  contactFirstName: "",
  contactLastName: "",
  phone: "",
  companyName: "",
  registrationNumber: "",
  website: "",
  categories: [],
};

export function SupplierRegisterForm({ departments }: { departments: DepartmentOption[] }) {
  const { csrfToken, storeMintedToken } = useSession();
  const router = useRouter();
  const tValidation = useTranslations("auth.validation");
  const tAuth = useTranslations("auth");
  const tErrors = useTranslations("errors");
  const tLabels = useTranslations("common.labels");
  const tActions = useTranslations("common.actions");
  const tA11y = useTranslations("a11y");
  const companyId = useId();
  const registrationId = useId();
  const websiteId = useId();
  const firstNameId = useId();
  const lastNameId = useId();
  const phoneId = useId();
  const emailId = useId();
  const passwordId = useId();

  const [values, setValues] = useState<SupplierRegisterValues>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<FieldFailures>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /*
   * Resumable registration (business-flows §3 "one resumable draft", api.md
   * §2.1). The draft lives on the SERVER; this browser holds only the token
   * that addresses it. A saved token brings the half-filled form back — never
   * the password, which is never sent to a draft in the first place.
   */
  const draftTokenRef = useRef<string | null>(null);
  const resumeStartedRef = useRef(false);
  const resumeSettledRef = useRef(false);
  const completedRef = useRef(false);

  useEffect(() => {
    // Once per mount, even under StrictMode's double-invoke: a second resume
    // would race the first and could clobber what the visitor is typing.
    if (resumeStartedRef.current) return;
    resumeStartedRef.current = true;

    const handle = readDraftHandle("supplier");
    if (!handle) {
      resumeSettledRef.current = true; // nothing to bring back — autosave may start
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const state = await authApi.resumeRegistrationDraft(handle.draftToken, await csrfToken());
        if (cancelled) return;
        draftTokenRef.current = state.draftToken;
        const known = new Set(departments.map((department) => department.slug));
        // A value the visitor has already typed wins over the restored one: the
        // round trip is fast, but it must never overwrite live typing.
        const restore = (typed: string, saved: string | null | undefined): string =>
          typed !== "" ? typed : saved ?? typed;
        setValues((previous) => ({
          ...previous,
          email: restore(previous.email, state.prefill.email),
          contactFirstName: restore(previous.contactFirstName, state.prefill.firstName),
          contactLastName: restore(previous.contactLastName, state.prefill.lastName),
          phone: restore(previous.phone, state.prefill.phone),
          companyName: restore(previous.companyName, state.prefill.companyName),
          registrationNumber: restore(previous.registrationNumber, state.prefill.registrationNumber),
          website: restore(previous.website, state.prefill.website),
          // The live taxonomy is the authority: a slug that no longer exists is
          // simply not ticked.
          categories:
            previous.categories.length > 0
              ? previous.categories
              : state.prefill.categories.filter((slug) => known.has(slug)),
        }));
      } catch {
        // Unknown, expired or already retired: forget the handle, start clean.
        if (!cancelled) clearDraftHandle("supplier");
      } finally {
        if (!cancelled) resumeSettledRef.current = true;
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one resume per mount; csrfToken and departments are stable inputs to that single run.
  }, []);

  // Autosave 1.5 s after the last keystroke, best-effort throughout: a failed
  // save must never disrupt the form the visitor is filling.
  useEffect(() => {
    if (!resumeSettledRef.current || submitting || completedRef.current) return;

    const hasContent =
      values.companyName.trim() !== "" ||
      values.registrationNumber.trim() !== "" ||
      values.website.trim() !== "" ||
      values.contactFirstName.trim() !== "" ||
      values.contactLastName.trim() !== "" ||
      values.phone.trim() !== "" ||
      values.email.trim() !== "" ||
      values.categories.length > 0;

    // Nothing typed and no draft to keep alive: minting an empty row on every
    // page view would be noise, not a convenience.
    if (!hasContent && draftTokenRef.current === null) return;

    const timer = setTimeout(() => {
      void (async () => {
        try {
          const state = await authApi.saveRegistrationDraft(
            {
              kind: "supplier",
              draftToken: draftTokenRef.current ?? undefined,
              email: values.email.trim() || undefined,
              firstName: values.contactFirstName.trim() || undefined,
              lastName: values.contactLastName.trim() || undefined,
              phone: values.phone.trim() || undefined,
              companyName: values.companyName.trim() || undefined,
              registrationNumber: values.registrationNumber.trim() || undefined,
              website: values.website.trim() || undefined,
              categories: values.categories,
            },
            await csrfToken(),
          );
          if (completedRef.current) return;
          draftTokenRef.current = state.draftToken;
          writeDraftHandle("supplier", { draftToken: state.draftToken, expiresAt: state.expiresAtUtc });
        } catch {
          /* best-effort autosave */
        }
      })();
    }, 1500);

    return () => clearTimeout(timer);
  }, [
    submitting,
    csrfToken,
    values.companyName,
    values.registrationNumber,
    values.website,
    values.contactFirstName,
    values.contactLastName,
    values.phone,
    values.email,
    values.categories,
  ]);

  const setField =
    (field: keyof SupplierRegisterValues) => (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setValues((previous) => ({ ...previous, [field]: value }));
      setFieldErrors((previous) => (previous[field] ? { ...previous, [field]: undefined } : previous));
    };

  const toggleDepartment = (slug: string, checked: boolean): void => {
    setValues((previous) => ({
      ...previous,
      categories: checked
        ? [...previous.categories, slug]
        : previous.categories.filter((existing) => existing !== slug),
    }));
    setFieldErrors((previous) => (previous.categories ? { ...previous, categories: undefined } : previous));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const failures = validateSupplierRegistration(values, tValidation);
    setFieldErrors(failures);
    if (Object.values(failures).some(Boolean)) return;

    setBanner(null);
    setSubmitting(true);
    try {
      const response = await authApi.registerSupplier(
        {
          email: values.email,
          password: values.password,
          contactFirstName: values.contactFirstName,
          contactLastName: values.contactLastName,
          phone: values.phone,
          companyName: values.companyName,
          registrationNumber: values.registrationNumber.trim() || undefined,
          website: values.website.trim() || undefined,
          categories: values.categories,
          draftToken: draftTokenRef.current ?? undefined,
        },
        await csrfToken(),
      );
      // The server retires the draft with the account (business-flows §3); the
      // browser forgets its handle with it.
      completedRef.current = true;
      clearDraftHandle("supplier");
      storeMintedToken(response.requestToken);
      // Same landing as buyer registration: straight to sign-in — email
      // confirmation is not required to use the account today.
      router.replace("/login");
    } catch (error) {
      if (error instanceof ApiClientError && error.envelope?.code === "VALIDATION_FAILED") {
        const server = fieldErrorsToRecord(error.envelope.fieldErrors, tValidation);
        setFieldErrors((previous) => ({ ...previous, ...server }));
        if (Object.keys(server).length === 0) setBanner(resolveErrorCopy(tErrors, error));
      } else {
        setBanner(resolveErrorCopy(tErrors, error));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form noValidate aria-busy={submitting} onSubmit={onSubmit} className="flex flex-col gap-5">
      {banner && (
        <p role="alert" className="type-meta rounded-sm border border-danger/30 bg-danger/5 p-3 text-danger">
          {banner}
        </p>
      )}

      <div className="flex flex-col gap-5">
        <FormField
          id={companyId}
          label={tLabels("companyName")}
          required
          requiredText={tA11y("requiredField")}
          error={fieldErrors.companyName}
        >
          {(control) => (
            <input
              {...control}
              type="text"
              autoComplete="organization"
              value={values.companyName}
              onChange={setField("companyName")}
              disabled={submitting}
              className={fieldControlClassName}
            />
          )}
        </FormField>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id={registrationId} label={tLabels("registrationNumber")} error={fieldErrors.registrationNumber}>
            {(control) => (
              <input
                {...control}
                type="text"
                value={values.registrationNumber}
                onChange={setField("registrationNumber")}
                disabled={submitting}
                className={fieldControlClassName}
              />
            )}
          </FormField>

          <FormField id={websiteId} label={tLabels("website")} error={fieldErrors.website}>
            {(control) => (
              <input
                {...control}
                type="url"
                autoComplete="url"
                value={values.website}
                onChange={setField("website")}
                disabled={submitting}
                className={fieldControlClassName}
              />
            )}
          </FormField>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            id={firstNameId}
            label={tLabels("firstName")}
            required
            requiredText={tA11y("requiredField")}
            error={fieldErrors.contactFirstName}
          >
            {(control) => (
              <input
                {...control}
                type="text"
                autoComplete="given-name"
                value={values.contactFirstName}
                onChange={setField("contactFirstName")}
                disabled={submitting}
                className={fieldControlClassName}
              />
            )}
          </FormField>

          <FormField
            id={lastNameId}
            label={tLabels("lastName")}
            required
            requiredText={tA11y("requiredField")}
            error={fieldErrors.contactLastName}
          >
            {(control) => (
              <input
                {...control}
                type="text"
                autoComplete="family-name"
                value={values.contactLastName}
                onChange={setField("contactLastName")}
                disabled={submitting}
                className={fieldControlClassName}
              />
            )}
          </FormField>
        </div>

        <FormField
          id={phoneId}
          label={tLabels("phone")}
          required
          requiredText={tA11y("requiredField")}
          hint={tAuth("phoneHint")}
          error={fieldErrors.phone}
        >
          {(control) => (
            <input
              {...control}
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={values.phone}
              onChange={setField("phone")}
              disabled={submitting}
              className={fieldControlClassName}
            />
          )}
        </FormField>

        <FormField
          id={emailId}
          label={tLabels("email")}
          required
          requiredText={tA11y("requiredField")}
          error={fieldErrors.email}
        >
          {(control) => (
            <input
              {...control}
              type="email"
              autoComplete="email"
              inputMode="email"
              value={values.email}
              onChange={setField("email")}
              disabled={submitting}
              className={fieldControlClassName}
            />
          )}
        </FormField>

        <FormField
          id={passwordId}
          label={tLabels("password")}
          required
          requiredText={tA11y("requiredField")}
          error={fieldErrors.password}
        >
          {(control) => (
            <input
              {...control}
              type="password"
              autoComplete="new-password"
              value={values.password}
              onChange={setField("password")}
              disabled={submitting}
              className={fieldControlClassName}
            />
          )}
        </FormField>

        <PasswordStrength password={values.password} />

        <fieldset
          aria-invalid={fieldErrors.categories ? true : undefined}
          aria-describedby={fieldErrors.categories ? `${companyId}-departments-error` : undefined}
          className="flex flex-col gap-2 border-t border-line pt-4"
        >
          <legend className="type-label text-ink-muted">
            {tAuth("supplierDepartmentsLegend")}
            <span aria-hidden="true" className="text-danger">
              {" *"}
            </span>
          </legend>
          <p className="type-meta text-ink-muted">{tAuth("supplierDepartmentsHint")}</p>
          <div className="mt-1 grid gap-2 sm:grid-cols-2">
            {departments.map((department) => (
              <label key={department.slug} className="type-body-sm flex items-center gap-2 text-ink">
                <input
                  type="checkbox"
                  checked={values.categories.includes(department.slug)}
                  onChange={(event) => toggleDepartment(department.slug, event.target.checked)}
                  disabled={submitting}
                  className="size-4 shrink-0 rounded-sm border border-line-strong accent-brand-primary"
                />
                {department.name}
              </label>
            ))}
          </div>
          {fieldErrors.categories && (
            <p id={`${companyId}-departments-error`} className="type-meta text-danger">
              {fieldErrors.categories}
            </p>
          )}
        </fieldset>
      </div>

      <div className="flex flex-col gap-3">
        <Button type="submit" fullWidth disabled={submitting}>
          {tActions("registerAsSupplier")}
        </Button>
      </div>

      <p className="type-body-sm border-t border-line pt-4 text-ink-muted">
        {tAuth("supplierHaveAccount")}{" "}
        <Link href="/supplier-login" className="font-medium text-ink underline underline-offset-2 hover:text-ink-strong">
          {tAuth("supplierLoginTitle")}
        </Link>
      </p>
    </form>
  );
}
