"use client";

/*
 * Why this file is a client component (§15 rule 3): submit + the pending→sent
 * state swap are interactivity.
 *
 * Step 1 of the reset flow only (task 1.37, threat-model T1.5). The endpoint
 * answers 202 for known and unknown accounts alike (A4 — the response must
 * not leak whether an account exists), so the screen swaps to the same "if an
 * account exists…" panel for every email; it never confirms nor denies.
 * The response also mints a requestToken (the email carries the reset token;
 * the SPA carries the antiforgery claim forward — §1.10).
 *
 * Hand-rolled state, not react-hook-form: PUBLIC route budget
 * (design-system §11). See lib/validation/auth.ts.
 */

import { useId, useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { FormField, fieldControlClassName } from "@/components/ui/form-field";
import { ApiClientError, authApi, resolveErrorCopy } from "@/lib/api";
import {
  fieldErrorsToRecord,
  type FieldFailures,
  type ForgotValues,
  validateForgot,
} from "@/lib/validation/auth";

export function ForgotPasswordForm() {
  const { csrfToken, storeMintedToken } = useSession();
  const tValidation = useTranslations("auth.validation");
  const tAuth = useTranslations("auth");
  const tErrors = useTranslations("errors");
  const tLabels = useTranslations("common.labels");
  const tA11y = useTranslations("a11y");
  const emailId = useId();

  const [values, setValues] = useState<ForgotValues>({ email: "" });
  const [fieldErrors, setFieldErrors] = useState<FieldFailures>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const setEmail = (event: ChangeEvent<HTMLInputElement>) => {
    setValues({ email: event.target.value });
    setFieldErrors((previous) => (previous.email ? { ...previous, email: undefined } : previous));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const failures = validateForgot(values, tValidation);
    setFieldErrors(failures);
    if (Object.values(failures).some(Boolean)) return;

    setBanner(null);
    setSubmitting(true);
    try {
      const response = await authApi.passwordResetRequest(values, await csrfToken());
      storeMintedToken(response.requestToken);
      setSent(true);
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

  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <p className="type-body">{tAuth("resetSent")}</p>
        <div>
          <Link
            href="/login"
            className="font-medium text-ink underline underline-offset-2 hover:text-ink-strong"
          >
            {tAuth("backToSignIn")}
          </Link>
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
            onChange={setEmail}
            disabled={submitting}
            className={fieldControlClassName}
          />
        )}
      </FormField>

      <div className="flex flex-col gap-3">
        <Button type="submit" fullWidth disabled={submitting}>
          {tAuth("sendResetLink")}
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