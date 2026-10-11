"use client";

/*
 * Why this file is a client component (§15 rule 3): the verify POST runs on
 * mount and the panel reacts to its outcome — interactivity.
 *
 * Two distinct jobs (api.md §2.1, task 1.38):
 *   - with a `?token=`: verify it. The endpoint is anonymous — the one-time
 *     token ITSELF identifies the account (A11) — and an unknown, used or
 *     expired token answers ONE identical 400 INVALID_VERIFICATION_TOKEN
 *     (no enumeration), shown verbatim as the keyed §47 copy.
 *   - without a token (the post-register landing, `?email=`): the pending
 *     panel. Resending is authenticated — it is the account owner's own
 *     state — so the resend action is offered only while signed in.
 *
 * The mount-time POST is deduped so React StrictMode's double-invoked effect
 * cannot consume a single-use token twice.
 */

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, ButtonLink } from "@/components/ui/button";
import { useSession } from "@/components/providers/session-provider";
import { ApiClientError, authApi, resolveErrorCopy } from "@/lib/api";

type VerifyState =
  | { kind: "verifying" }
  | { kind: "verified" }
  | { kind: "alreadyVerified" }
  | { kind: "invalid" }
  | { kind: "transport"; message: string };

export function VerifyEmailPanel({ email, token }: { email: string; token: string }) {
  const { csrfToken, status: sessionStatus } = useSession();
  const tAuth = useTranslations("auth");
  const tErrors = useTranslations("errors");
  const tActions = useTranslations("common.actions");
  const [state, setState] = useState<VerifyState>({ kind: "verifying" });
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const startedRef = useRef(false);

  const flashError = (error: unknown) => {
    if (error instanceof ApiClientError && error.envelope?.code === "INVALID_VERIFICATION_TOKEN") {
      setState({ kind: "invalid" });
    } else {
      setState({ kind: "transport", message: resolveErrorCopy(tErrors, error) });
    }
  };

  const runVerify = async (): Promise<void> => {
    try {
      const response = await authApi.verifyEmail({ token }, await csrfToken());
      setState(response.status === "already_verified" ? { kind: "alreadyVerified" } : { kind: "verified" });
    } catch (error) {
      flashError(error);
    }
  };

  useEffect(() => {
    if (token.length === 0 || startedRef.current) return;
    startedRef.current = true;
    void runVerify();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a second run would consume the single-use token; the effect must fire once.
  }, [token]);

  /* Pending panel: no token in the link — the post-register landing. */
  if (token.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <p className="type-body">
          {email.length > 0 ? tAuth("verifyPending", { email }) : tAuth("verifyPendingGeneric")}
        </p>
        {sessionStatus === "signedIn" && (
          <>
            {resendState === "sent" ? (
              <p role="status" className="type-meta text-ink-muted">
                {tAuth("resendSent", { email })}
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  disabled={resendState === "sending"}
                  onClick={() => {
                    setResendState("sending");
                    setResendMessage(null);
                    void (async () => {
                      try {
                        await authApi.resendVerification(await csrfToken());
                        setResendState("sent");
                      } catch (error) {
                        setResendState("failed");
                        setResendMessage(resolveErrorCopy(tErrors, error));
                      }
                    })();
                  }}
                >
                  {tAuth("verifyResend")}
                </Button>
                {resendState === "failed" && resendMessage && (
                  <p role="alert" className="type-meta rounded-sm border border-danger/30 bg-danger/5 p-3 text-danger">
                    {resendMessage}
                  </p>
                )}
              </div>
            )}
          </>
        )}
        <div>
          <ButtonLink href="/login" variant="ghost">
            {tAuth("backToSignIn")}
          </ButtonLink>
        </div>
      </div>
    );
  }

  if (state.kind === "verifying") {
    return null;
  }

  if (state.kind === "verified") {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="type-title-sm">{tAuth("verifiedTitle")}</h2>
        <p className="type-body">{tAuth("verifiedBody")}</p>
        <div>
          <ButtonLink href="/login">{tActions("signIn")}</ButtonLink>
        </div>
      </div>
    );
  }

  if (state.kind === "alreadyVerified") {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="type-title-sm">{tAuth("alreadyVerifiedTitle")}</h2>
        <p className="type-body">{tAuth("alreadyVerifiedBody")}</p>
        <div>
          <ButtonLink href="/login">{tActions("signIn")}</ButtonLink>
        </div>
      </div>
    );
  }

  if (state.kind === "invalid") {
    return (
      <div className="flex flex-col gap-4">
        <p className="type-body">{tErrors("INVALID_VERIFICATION_TOKEN")}</p>
        <div>
          <ButtonLink href="/login">{tActions("signIn")}</ButtonLink>
        </div>
      </div>
    );
  }

  /* Transport failure — the token was never judged. Retry safely re-runs the
   * same POST: nothing reached the server on the failed attempt. */
  return (
    <div className="flex flex-col gap-4">
      <p role="alert" className="type-meta rounded-sm border border-danger/30 bg-danger/5 p-3 text-danger">
        {state.message}
      </p>
      <div>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setState({ kind: "verifying" });
            void runVerify();
          }}
        >
          {tActions("retry")}
        </Button>
      </div>
    </div>
  );
}