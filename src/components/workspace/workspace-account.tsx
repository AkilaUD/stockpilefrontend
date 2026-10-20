"use client";

/*
 * Workspace — Account card (implementation-plan 1.52 surfaces the signed-in
 * user's own state, tasks 1.36/1.38).
 *
 * Everything rendered here is the live `GET /auth/session` payload the SPA
 * already holds (SessionProvider): profile identity, verification state, and
 * the resolved roles. No invented surface — if the provider reports signed
 * out (a pre-hydration flash inside the guarded group), nothing renders.
 *
 * The one write is resend-verification (task 1.38): offered ONLY when the
 * session reports the email unconfirmed — the same authenticated endpoint the
 * verify-email panel uses.
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { authApi, resolveErrorCopy } from "@/lib/api";

export function WorkspaceAccount() {
  const { status, user, csrfToken } = useSession();
  const t = useTranslations("workspace");
  const tAuth = useTranslations("auth");
  const tLabels = useTranslations("common.labels");
  const tErrors = useTranslations("errors");
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [resendError, setResendError] = useState<string | null>(null);

  if (status !== "signedIn" || !user) return null;

  const displayName = `${user.firstName} ${user.lastName}`.trim() || user.email;
  const roleLabels = (t.raw("roleLabels") ?? {}) as Record<string, string>;
  const roles = user.roles.map((role) => roleLabels[role] ?? role);

  return (
    <div className="rounded-md border border-line bg-surface-panel p-5 md:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <p className="min-w-0 truncate font-display text-lg font-bold text-ink">{displayName}</p>
        <StatusPill tone={user.emailConfirmed ? "success" : "warning"}>
          {user.emailConfirmed ? t("verified") : t("unverified")}
        </StatusPill>
      </div>

      <dl className="mt-5 space-y-3">
        <div className="flex justify-between gap-6">
          <dt className="shrink-0 type-body-sm text-ink-muted">{tLabels("email")}</dt>
          <dd className="min-w-0 truncate text-right type-body-sm text-ink">{user.email}</dd>
        </div>
        <div className="flex justify-between gap-6">
          <dt className="shrink-0 type-body-sm text-ink-muted">{t("rolesTitle")}</dt>
          <dd className="flex flex-wrap justify-end gap-1.5">
            {roles.length > 0 ? roles.map((role) => (
              <span key={role} className="type-meta rounded-sm bg-surface-recessed px-2 py-0.5 text-ink-muted">
                {role}
              </span>
            )) : <span className="type-body-sm text-ink-muted">—</span>}
          </dd>
        </div>
        {user.orgMemberships.length > 0 && (
          <div className="flex justify-between gap-6">
            <dt className="shrink-0 type-body-sm text-ink-muted">{t("orgMembershipsTitle")}</dt>
            <dd className="flex flex-wrap justify-end gap-1.5">
              {user.orgMemberships.map((m) => (
                <span key={m.organizationId} className="type-meta rounded-sm bg-surface-recessed px-2 py-0.5 text-ink-muted">
                  {m.name}: {roleLabels[m.role] ?? m.role}
                </span>
              ))}
            </dd>
          </div>
        )}
      </dl>

      {!user.emailConfirmed && (
        <div className="mt-5 border-t border-line pt-4">
          <p className="type-body-sm text-ink-muted">{t("unverifiedHint")}</p>
          {resendState === "sent" ? (
            <p role="status" className="mt-3 type-body-sm text-ink-strong">
              {tAuth("resendSent", { email: user.email })}
            </p>
          ) : (
            <div className="mt-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={resendState === "sending"}
                onClick={() => {
                  setResendState("sending");
                  setResendError(null);
                  void (async () => {
                    try {
                      await authApi.resendVerification(await csrfToken());
                      setResendState("sent");
                    } catch (error) {
                      setResendState("failed");
                      setResendError(resolveErrorCopy(tErrors, error));
                    }
                  })();
                }}
              >
                {tAuth("verifyResend")}
              </Button>
              {resendState === "failed" && resendError && (
                <p role="alert" className="mt-3 type-meta rounded-sm border border-danger/30 bg-danger/5 p-3 text-danger">
                  {resendError}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}