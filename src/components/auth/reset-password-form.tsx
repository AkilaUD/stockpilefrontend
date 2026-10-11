"use client";

/*
 * Why this file is a client component (§15 rule 3): submit, password-confirm
 * matching, the success state swap — interactivity.
 *
 * Step 2 of the reset flow (task 1.37, threat-model A5/A6): the single-use
 * token from the email link plus the new password. Completion rotates the
 * security stamp and revokes every session; an invalid, expired, re-used or
 * cross-account token answers ONE identical 400 INVALID_RESET_TOKEN, which
 * this screen shows as the §47 banner (never customised per reason — that
 * would turn the endpoint into an oracle).
 *
 * The email arrives in the link for prefill; the token is required for the
 * submit. A link without its token renders the same INVALID_RESET_TOKEN
 * state — an email link that cannot work.
 *
 * Hand-rolled state, not react-hook-form: PUBLIC route budget
 * (design-system §11). See lib/validation/auth.ts.
 */

import { useId, useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSession } from "@/components/providers/session-provider";
import { PasswordStrength } from "./password-strength";
import { Button, ButtonLink } from "@/components/ui/button";
import { FormField, fieldControlClassName } from "@/components/ui/form-field";
import { ApiClientError, authApi, resolveErrorCopy } from "@/lib/api";
import {
  fieldErrorsToRecord,
  type FieldFailures,
  type ResetValues,
  validateReset,
} from "@/lib/validation/auth";

export function ResetPasswordForm({ email, token }: { email: string; token: string }) {
  const { csrfToken } = useSession();
  const tValidation = useTranslations("auth.validation");
  const tAuth = useTranslations("auth");
  const tErrors = useTranslations("errors");
  const tLabels = useTranslations("common.labels");
  const tActions = useTranslations("common.actions");
  const tA11y = useTranslations("a11y");
  const emailId = useId();
  const passwordId = useId();
  const confirmId = useId();

  const [values, setValues] = useState<ResetValues>({
    email,
    token,
    newPassword: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldFailures>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const setField = (field: keyof ResetValues) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setValues((previous) => ({ ...previous, [field]: value }));
    setFieldErrors((previous) => (previous[field] ? { ...previous, [field]: undefined } : previous));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const failures = validateReset(values, tValidation);
    setFieldErrors(failures);
    if (Object.values(failures).some(Boolean)) return;

    setBanner(null);
    setSubmitting(true);
    try {
      await authApi.passwordResetComplete(
        { email: values.email, token: values.token, newPassword: values.newPassword },
        await csrfToken(),
      );
      setDone(true);
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

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <p className="type-body">{tAuth("resetSuccessBody")}</p>
        <div>
          <ButtonLink href="/login">{tActions("signIn")}</ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <form noValidate aria-busy={submitting} onSubmit={onSubmit} className="flex flex-col gap-5">
      {banner && (
        <p role="alert" className="type-meta rounded-sm border border-danger/30 bg-danger/5 p-3 text-danger">
          {banner}
        </p>
      )}

      <div className="flex flex-col gap-5">
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
          label={tLabels("newPassword")}
          required
          requiredText={tA11y("requiredField")}
          error={fieldErrors.newPassword}
        >
          {(control) => (
            <input
              {...control}
              type="password"
              autoComplete="new-password"
              value={values.newPassword}
              onChange={setField("newPassword")}
              disabled={submitting}
              className={fieldControlClassName}
            />
          )}
        </FormField>

        <PasswordStrength password={values.newPassword} />

        <FormField
          id={confirmId}
          label={tLabels("confirmPassword")}
          required
          requiredText={tA11y("requiredField")}
          error={fieldErrors.confirmPassword}
        >
          {(control) => (
            <input
              {...control}
              type="password"
              autoComplete="new-password"
              value={values.confirmPassword}
              onChange={setField("confirmPassword")}
              disabled={submitting}
              className={fieldControlClassName}
            />
          )}
        </FormField>
      </div>

      <div className="flex flex-col gap-3">
        <Button type="submit" fullWidth disabled={submitting}>
          {tActions("submit")}
        </Button>
        <p className="type-meta text-center text-ink-muted">
          <Link href="/login" className="text-ink underline underline-offset-2 hover:text-ink-strong">
            {tAuth("backToSignIn")}
          </Link>
        </p>
      </div>
    </form>
  );
}