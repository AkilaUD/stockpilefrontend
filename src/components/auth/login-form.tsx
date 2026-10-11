"use client";

/*
 * Why this file is a client component (§15 rule 3): it submits credentials
 * and reacts to the session (fields, banners, navigation) — interactivity.
 *
 * Validation split, and why each half exists:
 *   - client (validateLogin): the UX layer — same messages the server would
 *     send, before the round trip; mirrors AuthenticationValidators.cs
 *     exactly (1.51);
 *   - server: the 422 VALIDATION_FAILED envelope's fieldErrors are mapped
 *     back onto the fields (fieldErrorsToRecord) so the wire stays the
 *     authority. Everything that is NOT a field failure renders as the §47
 *     banner — INVALID_CREDENTIALS, ACCOUNT_LOCKED, RATE_LIMITED with the
 *     live Retry-After, network, timeout.
 *
 * `noValidate` is deliberate: our validator owns the messages, and the
 * browser's native bubbles would both bypass them and block submission.
 *
 * Hand-rolled state, not react-hook-form: this page is on a PUBLIC route
 * (200 KB gzip first load, design-system §11) and the library stack costs
 * ~100 KB for two fields — see lib/validation/auth.ts.
 */

import { useId, useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { FormField, fieldControlClassName } from "@/components/ui/form-field";
import { ApiClientError, resolveErrorCopy } from "@/lib/api";
import {
  fieldErrorsToRecord,
  type FieldFailures,
  type LoginValues,
  validateLogin,
} from "@/lib/validation/auth";

export function LoginForm() {
  const { login } = useSession();
  const router = useRouter();
  const tValidation = useTranslations("auth.validation");
  const tAuth = useTranslations("auth");
  const tErrors = useTranslations("errors");
  const tLabels = useTranslations("common.labels");
  const tActions = useTranslations("common.actions");
  const tA11y = useTranslations("a11y");
  const emailId = useId();
  const passwordId = useId();

  const [values, setValues] = useState<LoginValues>({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<FieldFailures>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const setField = (field: keyof LoginValues) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setValues((previous) => ({ ...previous, [field]: value }));
    setFieldErrors((previous) => (previous[field] ? { ...previous, [field]: undefined } : previous));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const failures = validateLogin(values, tValidation);
    setFieldErrors(failures);
    if (Object.values(failures).some(Boolean)) return;

    setBanner(null);
    setSubmitting(true);
    try {
      await login(values);
      router.replace("/");
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
              autoComplete="current-password"
              value={values.password}
              onChange={setField("password")}
              disabled={submitting}
              className={fieldControlClassName}
            />
          )}
        </FormField>
      </div>

      <div className="flex flex-col gap-3">
        <Button type="submit" fullWidth disabled={submitting}>
          {tActions("signIn")}
        </Button>
        <p className="type-meta text-ink-muted">
          <Link href="/forgot-password" className="text-ink underline underline-offset-2 hover:text-ink-strong">
            {tAuth("forgotLink")}
          </Link>
        </p>
      </div>

      <p className="type-body-sm border-t border-line pt-4 text-ink-muted">
        {tAuth("noAccount")}{" "}
        <Link href="/register" className="font-medium text-ink underline underline-offset-2 hover:text-ink-strong">
          {tActions("register")}
        </Link>
      </p>
    </form>
  );
}