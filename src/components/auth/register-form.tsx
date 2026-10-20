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
  validateRegister,
} from "@/lib/validation/auth";
import { clearDraftHandle, readDraftHandle, writeDraftHandle } from "@/lib/registration/draft-storage";

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

  /*
   * Resumable registration (business-flows §2, api.md §2.1). The buyer flow
   * collects only an email and a password; the email is autosaved to a server
   * draft so an abandoned signup comes back with the username already filled —
   * the password is never sent anywhere but the register call itself.
   */
  const draftTokenRef = useRef<string | null>(null);
  const resumeStartedRef = useRef(false);
  const resumeSettledRef = useRef(false);
  const completedRef = useRef(false);

  useEffect(() => {
    if (resumeStartedRef.current) return; // once per mount, StrictMode-safe
    resumeStartedRef.current = true;

    const handle = readDraftHandle("buyer");
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
        // A username already typed wins over the restored one.
        setValues((previous) => ({
          ...previous,
          email: previous.email !== "" ? previous.email : state.prefill.email ?? previous.email,
        }));
      } catch {
        // Unknown, expired or already retired: forget the handle, start clean.
        if (!cancelled) clearDraftHandle("buyer");
      } finally {
        if (!cancelled) resumeSettledRef.current = true;
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one resume per mount; csrfToken is a stable input to that single run.
  }, []);

  // Autosave 1.5 s after the last keystroke, best-effort: a failed save must
  // never disrupt the form the visitor is filling.
  useEffect(() => {
    if (!resumeSettledRef.current || submitting || completedRef.current) return;

    const email = values.email.trim();
    if (email === "" && draftTokenRef.current === null) return; // nothing to remember yet

    const timer = setTimeout(() => {
      void (async () => {
        try {
          const state = await authApi.saveRegistrationDraft(
            { kind: "buyer", draftToken: draftTokenRef.current ?? undefined, email: email || undefined },
            await csrfToken(),
          );
          if (completedRef.current) return;
          draftTokenRef.current = state.draftToken;
          writeDraftHandle("buyer", { draftToken: state.draftToken, expiresAt: state.expiresAtUtc });
        } catch {
          /* best-effort autosave */
        }
      })();
    }, 1500);

    return () => clearTimeout(timer);
  }, [submitting, csrfToken, values.email]);

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
      const response = await authApi.register(
        { ...values, draftToken: draftTokenRef.current ?? undefined },
        await csrfToken(),
      );
      // The server retires the draft with the account (business-flows §2); the
      // browser forgets its handle with it. Email confirmation is not required
      // to sign in or use the account today (the backend confirms the address
      // at creation; outbox email delivery is not running in production), so
      // the post-register landing is the sign-in page — no inbox detour.
      completedRef.current = true;
      clearDraftHandle("buyer");
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
      <p className="type-meta text-ink-muted">
        {tAuth("audienceSupplierHint")}{" "}
        <Link
          href="/supplier-register"
          className="font-medium text-ink underline underline-offset-2 hover:text-ink-strong"
        >
          {tActions("registerAsSupplier")}
        </Link>
      </p>
    </form>
  );
}