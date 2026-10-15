"use client";

/*
 * Workspace — Security card (tasks 1.36/1.40/1.43 surface, implementation-plan
 * 1.52). Two authenticated surfaces the SPA ships but nothing consumed until
 * now:
 *
 *   1. Change password — POST /auth/password/change. Succeeds for THIS device
 *      only: every other session is revoked server-side (api.md §2.1), so a
 *      success refetches the session directory to prove it.
 *   2. Active sessions — GET /auth/sessions, with per-row revoke
 *      (DELETE /auth/sessions/{id}) and sign-out-everywhere
 *      (POST /auth/logout-all, which also clears THIS device's ticket — hence
 *      the full reload back to the public site).
 *
 * The mount-time directory fetch is deduped (StrictMode double-effect) exactly
 * like the verify panel's token POST. Busy rows are disabled; every write
 * answers with its saved result or the §47 copy for the failure.
 */

import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { FormField, fieldControlClassName } from "@/components/ui/form-field";
import { PasswordStrength } from "@/components/auth/password-strength";
import {
  ApiClientError,
  authApi,
  resolveErrorCopy,
  type SessionsListResponse,
} from "@/lib/api";
import {
  fieldErrorsToRecord,
  type FieldFailures,
  type PasswordChangeValues,
  validatePasswordChange,
} from "@/lib/validation/auth";

function formatDateTime(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function userAgentSummary(userAgent: string | null | undefined): string {
  if (!userAgent) return "";
  const trimmed = userAgent.trim();
  return trimmed.length > 48 ? `${trimmed.slice(0, 48)}…` : trimmed;
}

export function WorkspaceSecurity() {
  const { status, csrfToken } = useSession();
  const t = useTranslations("workspace");
  const tAuth = useTranslations("auth");
  const tValidation = useTranslations("auth.validation");
  const tLabels = useTranslations("common.labels");
  const tA11y = useTranslations("a11y");
  const tActions = useTranslations("common.actions");
  const tErrors = useTranslations("errors");
  const locale = useLocale();

  // ---- session directory ---------------------------------------------------
  const [sessions, setSessions] = useState<SessionsListResponse | null>(null);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [signOutAllBusy, setSignOutAllBusy] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const loadStarted = useRef(false);

  useEffect(() => {
    if (loadStarted.current) return;
    loadStarted.current = true;
    void authApi
      .sessions()
      .then((data) => {
        setSessions(data);
        setSessionsError(null);
      })
      .catch((error: unknown) => setSessionsError(resolveErrorCopy(tErrors, error)))
      .finally(() => setSessionsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loaded exactly once (StrictMode-safe).
  }, []);

  const reloadSessions = async () => {
    try {
      const data = await authApi.sessions();
      setSessions(data);
      setSessionsError(null);
    } catch (error) {
      setSessionsError(resolveErrorCopy(tErrors, error));
    }
  };

  // ---- change password -----------------------------------------------------
  const currentId = useId();
  const newPasswordId = useId();
  const confirmId = useId();
  const [values, setValues] = useState<PasswordChangeValues>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldFailures>({});
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const setField = (field: keyof PasswordChangeValues) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setValues((previous) => ({ ...previous, [field]: value }));
    setFieldErrors((previous) => (previous[field] ? { ...previous, [field]: undefined } : previous));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const failures = validatePasswordChange(values, tValidation);
    setFieldErrors(failures);
    if (Object.values(failures).some(Boolean)) return;

    setPasswordError(null);
    setSubmitting(true);
    try {
      await authApi.passwordChange(
        { currentPassword: values.currentPassword, newPassword: values.newPassword },
        await csrfToken(),
      );
      setPasswordChanged(true);
      setValues({ currentPassword: "", newPassword: "", confirmPassword: "" });
      // Success revoked every OTHER session — prove it by refreshing the list.
      await reloadSessions();
    } catch (error) {
      if (error instanceof ApiClientError && error.envelope?.code === "VALIDATION_FAILED") {
        const server = fieldErrorsToRecord(error.envelope.fieldErrors, tValidation);
        setFieldErrors((previous) => ({ ...previous, ...server }));
        if (Object.keys(server).length === 0) setPasswordError(resolveErrorCopy(tErrors, error));
      } else {
        setPasswordError(resolveErrorCopy(tErrors, error));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const revoke = async (sessionId: string, isCurrent: boolean): Promise<void> => {
    setRevokingId(sessionId);
    setSavedMessage(null);
    try {
      await authApi.revokeSession(sessionId, await csrfToken());
      if (isCurrent) {
        // Revoking the current device clears this ticket — the truthful view
        // is the signed-out public site, so load it fresh.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- deliberate: only a full reload discards the signed-in provider state this navigation skips.
        window.location.assign("/");
        return;
      }
      setSavedMessage(t("sessionRevoked"));
      await reloadSessions();
    } catch (error) {
      setSessionsError(resolveErrorCopy(tErrors, error));
    } finally {
      setRevokingId(null);
    }
  };

  const signOutEverywhere = async (): Promise<void> => {
    setSignOutAllBusy(true);
    setSavedMessage(null);
    try {
      await authApi.logoutAll(await csrfToken());
      // logout-all revokes THIS device too (its ticket and refresh cookie are
      // cleared server-side) — go to the signed-out public site for real.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- deliberate: only a full reload discards the signed-in provider state this navigation skips.
      window.location.assign("/");
    } catch (error) {
      setSessionsError(resolveErrorCopy(tErrors, error));
      setSignOutAllBusy(false);
    }
  };

  if (status !== "signedIn") return null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section aria-labelledby="workspace-change-password" className="rounded-md border border-line bg-surface-panel p-5 md:p-6">
        <h3 id="workspace-change-password" className="type-title-sm text-ink">
          {t("changePasswordTitle")}
        </h3>
        <p className="mt-1 type-body-sm text-ink-muted">{t("changePasswordHint")}</p>

        <form noValidate aria-busy={submitting} onSubmit={onSubmit} className="mt-5 flex flex-col gap-5">
          {passwordChanged && (
            <div role="status" className="rounded-sm border border-success/40 bg-success/10 p-3">
              <p className="type-title-sm text-ink">{t("passwordChangedTitle")}</p>
              <p className="mt-1 type-body-sm text-ink-muted">{t("passwordChangedBody")}</p>
            </div>
          )}
          {passwordError && (
            <p role="alert" className="type-meta rounded-sm border border-danger/30 bg-danger/5 p-3 text-danger">
              {passwordError}
            </p>
          )}

          <FormField
            id={currentId}
            label={tLabels("currentPassword")}
            required
            requiredText={tA11y("requiredField")}
            error={fieldErrors.currentPassword}
          >
            {(control) => (
              <input
                {...control}
                type="password"
                autoComplete="current-password"
                value={values.currentPassword}
                onChange={setField("currentPassword")}
                disabled={submitting}
                className={fieldControlClassName}
              />
            )}
          </FormField>

          <FormField
            id={newPasswordId}
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

          <div>
            <Button type="submit" disabled={submitting}>
              {tActions("save")}
            </Button>
          </div>
        </form>
      </section>

      <section aria-labelledby="workspace-sessions" className="rounded-md border border-line bg-surface-panel p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 id="workspace-sessions" className="type-title-sm text-ink">
            {tAuth("reviewSessions")}
          </h3>
          <Button type="button" variant="secondary" size="sm" disabled={signOutAllBusy} onClick={() => void signOutEverywhere()}>
            {tAuth("signOutEverywhere")}
          </Button>
        </div>
        <p className="mt-1 type-body-sm text-ink-muted">{t("sessionsHint")}</p>

        {savedMessage && (
          <p role="status" className="mt-4 type-meta rounded-sm border border-success/40 bg-success/10 p-3 text-ink">
            {savedMessage}
          </p>
        )}
        {sessionsError && (
          <p role="alert" className="mt-4 type-meta rounded-sm border border-danger/30 bg-danger/5 p-3 text-danger">
            {sessionsError}
          </p>
        )}

        {sessionsLoading ? (
          <p className="mt-4 type-body-sm text-ink-muted" aria-live="polite">
            {tA11y("loading")}
          </p>
        ) : sessions?.items.length ? (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {sessions.items.map((session) => (
              <li key={session.id} className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {session.isCurrent && (
                      <span className="type-meta rounded-sm bg-brand-primary px-1.5 py-0.5 font-semibold text-ink-on-signal">
                        {t("currentSession")}
                      </span>
                    )}
                    <span className="min-w-0 truncate type-body-sm text-ink" title={session.userAgent ?? undefined}>
                      {userAgentSummary(session.userAgent) || t("sessionUnknownDevice")}
                    </span>
                  </div>
                  <p className="mt-1 type-meta text-ink-muted">
                    {t("sessionIssued", { date: formatDateTime(session.issuedAt, locale) })}
                    {" · "}
                    {t("sessionLastSeen", { date: formatDateTime(session.lastSeenAt, locale) })}
                    {session.ipAddress ? ` · ${session.ipAddress}` : ""}
                  </p>
                </div>
                {!session.isCurrent && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={revokingId === session.id || signOutAllBusy}
                    onClick={() => void revoke(session.id, false)}
                  >
                    {revokingId === session.id ? tActions("working") : t("revokeSession")}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 type-body-sm text-ink-muted">{t("sessionsEmpty")}</p>
        )}
      </section>
    </div>
  );
}