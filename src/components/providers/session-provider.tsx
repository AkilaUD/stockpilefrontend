"use client";

/*
 * Why this file is a client component: the session is decided by cookies the
 * server set on this browser (`.Stockpile.Auth` / `.Stockpile.Refresh`),
 * so only a client can read it — `GET /auth/session` answers 200 here and 401
 * for the next browser. The same is true of the antiforgery token, whose
 * newest mint always lives in a response body (§1.10).
 *
 * What this provider owns, and why it is ONE place:
 *   1. the current session (loading / signedOut / signedIn + the user);
 *   2. the newest antiforgery `requestToken` — minted on first need, replaced
 *      whenever a response mints a fresher one (login/refresh/register each do,
 *      §1.10: "re-prime after identity changes");
 *   3. the safe order of the two: register/login mint a token FOR THE NEW
 *      principal, so the happy path is antiforgery() → POST → keep the
 *      response's token. An ANTIFORGERY_FAILED answers stays visible to the
 *      caller — re-priming is a decision the guard/screen makes, not a retry
 *      the provider hides.
 *   4. one refresh attempt when `/auth/session` answers 401 (absolute session
 *      may still have a valid refresh cookie).
 *
 * The retry policy of the transport (isRetryable, 1.49) deliberately does NOT
 * apply to these writes: they are user-initiated, single-shot, and a retried
 * login is never what a buyer wants.
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { authApi, type AuthSessionResponse, type LoginRequestBody } from "@/lib/api";
import { ApiClientError } from "@/lib/api/envelope";

export type SessionStatus = "loading" | "signedOut" | "signedIn";

interface SessionContextValue {
  status: SessionStatus;
  user: AuthSessionResponse | null;
  /**
   * The newest antiforgery token the SPA holds, priming on first call. Every
   * unsafe verb needs one (X-CSRF-TOKEN, 1.49 live finding — the body token,
   * never the cookie's value).
   */
  csrfToken: () => Promise<string>;
  /**
   * Record a token minted by a response that is NOT session-changing —
   * register and reset-request (§1.10: "echo the newest token"). The next
   * unsafe verb would otherwise carry a stale token against a rotated cookie
   * and answer ANTIFORGERY_FAILED.
   */
  storeMintedToken: (token: string) => void;
  /** POST /auth/login; on success stores the user AND the response's fresh token. */
  login: (body: LoginRequestBody) => Promise<AuthSessionResponse>;
  /** POST /auth/logout. Clears local state ONLY after the server confirms — an offline logout that only looked successful would be a fake. */
  logout: () => Promise<void>;
  /** POST /auth/refresh — rotates the refresh cookie and re-signs the session. */
  refresh: () => Promise<AuthSessionResponse>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiClientError && error.status === 401;
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [user, setUser] = useState<AuthSessionResponse | null>(null);
  const tokenRef = useRef<string | null>(null);
  const primingRef = useRef<Promise<string> | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      /* Prime the token and learn the session in parallel; neither depends on
       * the other (the anon token is fine while we read /session). */
      try {
        const { requestToken } = await authApi.antiforgery();
        if (!cancelled) tokenRef.current = requestToken;
      } catch {
        /* A failed prime is not fatal here — csrfToken() re-primes lazily. */
      }

      try {
        const session = await authApi.session();
        if (cancelled) return;
        setUser(session);
        setStatus("signedIn");
        return;
      } catch (sessionError) {
        if (cancelled) return;

        /* Absolute session cookie may have expired while the refresh cookie is
         * still valid — try one refresh before treating the browser as signed out. */
        if (isUnauthorized(sessionError) && tokenRef.current) {
          try {
            const response = await authApi.refresh(tokenRef.current);
            if (cancelled) return;
            tokenRef.current = response.requestToken;
            setUser(response.user);
            setStatus("signedIn");
            return;
          } catch {
            /* Refresh failed — fall through to signedOut. */
          }
        }

        if (!cancelled) setStatus("signedOut");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const csrfToken = useCallback(async (): Promise<string> => {
    if (tokenRef.current) return tokenRef.current;
    if (!primingRef.current) {
      primingRef.current = authApi.antiforgery().then(({ requestToken }) => {
        tokenRef.current = requestToken;
        return requestToken;
      });
    }
    try {
      return await primingRef.current;
    } finally {
      primingRef.current = null;
    }
  }, []);

  const storeMintedToken = useCallback((token: string): void => {
    tokenRef.current = token;
  }, []);

  const login = useCallback(
    async (body: LoginRequestBody): Promise<AuthSessionResponse> => {
      const token = await csrfToken();
      const response = await authApi.login(body, token);
      tokenRef.current = response.requestToken; // §1.10: newest token wins
      setUser(response.user);
      setStatus("signedIn");
      return response.user;
    },
    [csrfToken],
  );

  const logout = useCallback(async (): Promise<void> => {
    await authApi.logout(await csrfToken());
    tokenRef.current = null;
    setUser(null);
    setStatus("signedOut");
  }, [csrfToken]);

  const refresh = useCallback(async (): Promise<AuthSessionResponse> => {
    const response = await authApi.refresh(await csrfToken());
    tokenRef.current = response.requestToken;
    setUser(response.user);
    setStatus("signedIn");
    return response.user;
  }, [csrfToken]);

  return (
    <SessionContext.Provider
      value={{ status, user, csrfToken, storeMintedToken, login, logout, refresh }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (value === null) {
    throw new Error("useSession must be used within <SessionProvider>");
  }
  return value;
}
