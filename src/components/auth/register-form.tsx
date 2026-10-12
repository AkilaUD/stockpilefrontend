"use client";

/*
 * Why this file is a client component (§15 rule 3): submit, strength-meter
 * reaction to typing, session token hand-off — interactivity.
 *
 * Email is the username. Signup creates an active buyer account without
 * proving mailbox ownership; users sign in after the account is created.
 *
 * Hand-rolled state, not react-hook-form: PUBLIC route budget
 * (design-system §11) — the library stack costs ~100 KB gzip for five
 * fields. See lib/validation/auth.ts.
 */

import { useId, useState, type ChangeEvent, type FormEvent } from "react";
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
  validateRegister,
} from "@/lib/validation/auth";

interface RegisterValues {
  email: string;
  password: string;
}

export function RegisterForm() {
  const { csrfToken, storeMintedToken } = useSession();
  const router = useRouter();
  const tValidation = useTranslations("auth.validation");
  const tAuth = useTranslations("auth");
  const tErrors = useTranslations("errors");
  const tLabels = useTranslations("common.labels");
  const tActions = useTranslations("common.actions");
  const tA11y = useTranslations("a11y");
  const emailId = useId();
  const passwordId = useId();

  const [values, setValues] = useState<RegisterValues>({
    email: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldFailures>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const setField = (field: keyof RegisterValues) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setValues((previous) => ({ ...previous, [field]: value }));
    setFieldErrors((previous) => (previous[field] ? { ...previous, [field]: undefined } : previous));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const failures = validateRegister(values, tValidation);
    setFieldErrors(failures);
    if (Object.values(failures).some(Boolean)) return;

    setBanner(null);
    setSubmitting(true);
    try {
      const response = await authApi.register(values, await csrfToken());
      storeMintedToken(response.requestToken);
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
      </div>

      <div className="flex flex-col gap-3">
        <Button type="submit" fullWidth disabled={submitting}>
          {tActions("register")}
        </Button>
      </div>

      <p className="type-body-sm border-t border-line pt-4 text-ink-muted">
        {tAuth("haveAccount")}{" "}
        <Link href="/login" className="font-medium text-ink underline underline-offset-2 hover:text-ink-strong">
          {tActions("signIn")}
        </Link>
      </p>
    </form>
  );
}