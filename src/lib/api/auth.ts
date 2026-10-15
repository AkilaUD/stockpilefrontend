import { apiFetch } from "./client";

/**
 * Typed Phase-1 endpoint surface (1.49 boundary).
 *
 * Every shape below mirrors a record that exists in the backend:
 * `Stockpile.Contracts.Authentication.AuthResponses` /
 * `Stockpile.Application.Authentication.AuthenticationContracts`, and every path
 * is in the api.md §2.1 endpoint inventory — X2: no invented surface. Register,
 * login, refresh, logout, antiforgery and the reset/verify flows are what the
 * 1.51 auth screens consume; health (1.24/1.31) is the anonymous probe used in
 * verification and uptime checks.
 *
 * Camel case is the wire casing; optional members are omitted, never null
 * (api.md §1.4).
 */

export interface RegisterRequestBody {
  email: string;
  password: string;
  /**
   * The resumable registration draft this submit came from, when the visitor
   * used one (business-flows §2, api.md §2.1). Completing the registration
   * retires the draft; a dead token never blocks the signup.
   */
  draftToken?: string;
}

/**
 * Supplier self-registration (api.md §2.1 `POST /auth/register/supplier`) —
 * mirrors `Stockpile.Application.Suppliers.RegisterSupplierRequest`. `categories`
 * are catalogue department slugs; the taxonomy is the authority on which exist.
 */
export interface RegisterSupplierRequestBody {
  email: string;
  password: string;
  contactFirstName: string;
  contactLastName: string;
  phone: string;
  companyName: string;
  registrationNumber?: string;
  website?: string;
  categories: string[];
  /** The resumable draft to continue from, when one exists (business-flows §3). */
  draftToken?: string;
}

/**
 * A resumable registration draft (business-flows §2/§3, api.md §2.1) — mirrors
 * `Stockpile.Contracts.Authentication.RegistrationDraftState`. `prefill`
 * members are absent when the visitor never typed them, and NEVER include a
 * password: a draft is prefill, not a credential.
 */
export interface RegistrationDraftPrefill {
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  companyName?: string | null;
  registrationNumber?: string | null;
  website?: string | null;
  categories: string[];
}

export interface RegistrationDraftStateResponse {
  draftToken: string;
  kind: string;
  expiresAtUtc: string;
  prefill: RegistrationDraftPrefill;
}

/** One autosave: absent `draftToken` starts a draft, a live one updates it. */
export interface SaveRegistrationDraftBody {
  kind: "buyer" | "supplier";
  draftToken?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  companyName?: string;
  registrationNumber?: string;
  website?: string;
  categories?: string[];
}

/** Buyer wizard step 2 — professional profile (business-flows §2, api.md §2.2). */
export interface ProfileDraft {
  role?: string;
  procurementLocations?: string[];
  projectInterests?: string[];
}

export interface ProfileResponse {
  role?: string | null;
  procurementLocations: string[];
  projectInterests: string[];
}

/** Buyer wizard step 4a — UI/locale preferences (api.md §2.2). */
export interface PreferencesDraft {
  locale?: string;
  quoteNotificationPrefs?: boolean;
}

export interface PreferencesResponse {
  locale: string;
  quoteNotificationPrefs: boolean;
}

/** Buyer wizard step 4b — per-channel notification preferences (api.md §2.2). */
export interface NotificationPreferencesDraft {
  email?: boolean;
  sms?: boolean;
  whatsApp?: boolean;
}

export interface NotificationPreferencesResponse {
  email: boolean;
  sms: boolean;
  whatsApp: boolean;
}

export interface LoginRequestBody {
  email: string;
  password: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetComplete {
  email: string;
  token: string;
  newPassword: string;
}

export interface EmailVerifyRequest {
  token: string;
}

export interface OrganizationMembershipResponse {
  organizationId: string;
  name: string;
  role: string;
}

export interface AuthSessionResponse {
  publicId: string;
  email: string;
  firstName: string;
  lastName: string;
  preferredLocale: string;
  emailConfirmed: boolean;
  status: string;
  roles: string[];
  permissions: string[];
  orgMemberships: OrganizationMembershipResponse[];
}

export interface RegisterResponse {
  status: string;
  requestToken: string;
}

export interface LoginResponse {
  requestToken: string;
  user: AuthSessionResponse;
}

export interface AntiforgeryTokenResponse {
  requestToken: string;
}

export interface PasswordResetRequestedResponse {
  status: string;
  requestToken: string;
}

export interface PasswordResetCompleteResponse {
  status: string;
}

export interface EmailVerifyResponse {
  status: string;
}

/** One active server-side session (domain-model §2.5) in `GET /auth/sessions`. */
export interface ActiveSessionResponse {
  id: string;
  isCurrent: boolean;
  issuedAt: string;
  expiresAt: string;
  lastSeenAt: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/** The session directory: active sessions, newest activity first, current marked (api.md §2.1). */
export interface SessionsListResponse {
  items: ActiveSessionResponse[];
  currentSessionId: string;
}

export interface HealthResponse {
  status: string;
  uptimeSeconds: number;
}

const AUTH_PATH = "/api/v1/auth";

/** The signed-in user's own surfaces (`/me/*`) — api.md §2.2. */
const ME_PATH = "/api/v1/me";

export const authApi = {
  /** Prime the double-submit token before the first anonymous write (§1.10). */
  antiforgery: () => apiFetch<AntiforgeryTokenResponse>(`${AUTH_PATH}/antiforgery`),
  register: (body: RegisterRequestBody, csrfToken: string) =>
    apiFetch<RegisterResponse>(`${AUTH_PATH}/register`, {
      method: "POST",
      body: JSON.stringify(body),
    }, { csrfToken }),
  /** Supplier self-registration — same anonymous, rate-limited shape as buyer register. */
  registerSupplier: (body: RegisterSupplierRequestBody, csrfToken: string) =>
    apiFetch<RegisterResponse>(`${AUTH_PATH}/register/supplier`, {
      method: "POST",
      body: JSON.stringify(body),
    }, { csrfToken }),
  /**
   * Autosaves the NON-SECRET prefill of a staged registration (business-flows
   * §2/§3, api.md §2.1) and returns the draft state, including the
   * `draftToken` that addresses it. A dead token answers 404 and the caller
   * simply starts clean.
   */
  saveRegistrationDraft: (body: SaveRegistrationDraftBody, csrfToken: string) =>
    apiFetch<RegistrationDraftStateResponse>(`${AUTH_PATH}/registration-drafts`, {
      method: "POST",
      body: JSON.stringify(body),
    }, { csrfToken }),
  /** Hands back a stored draft's prefill; unknown, expired or retired tokens all 404. */
  resumeRegistrationDraft: (draftToken: string, csrfToken: string) =>
    apiFetch<RegistrationDraftStateResponse>(`${AUTH_PATH}/registration-drafts/resume`, {
      method: "POST",
      body: JSON.stringify({ draftToken }),
    }, { csrfToken }),

  // ---- Buyer wizard steps 2 / 4a / 4b (api.md §2.2) ---------------------------

  /** Gets the caller's professional profile (wizard step 2 read). */
  getProfile: () => apiFetch<ProfileResponse>(`${ME_PATH}/profile`),

  /** Updates the caller's professional profile (wizard step 2 submit). */
  updateProfile: (body: ProfileDraft, csrfToken: string) =>
    apiFetch<ProfileResponse>(`${ME_PATH}/profile`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }, { csrfToken }),

  /** Gets the caller's UI/locale preferences (wizard step 4a read). */
  getPreferences: () => apiFetch<PreferencesResponse>(`${ME_PATH}/preferences`),

  /** Updates the caller's UI/locale preferences (wizard step 4a submit). */
  updatePreferences: (body: PreferencesDraft, csrfToken: string) =>
    apiFetch<PreferencesResponse>(`${ME_PATH}/preferences`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }, { csrfToken }),

  /** Gets the caller's per-channel notification preferences (wizard step 4b read). */
  getNotificationPreferences: () => apiFetch<NotificationPreferencesResponse>(`${ME_PATH}/notification-preferences`),

  /** Updates the caller's per-channel notification preferences (wizard step 4b submit). */
  updateNotificationPreferences: (body: NotificationPreferencesDraft, csrfToken: string) =>
    apiFetch<NotificationPreferencesResponse>(`${ME_PATH}/notification-preferences`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }, { csrfToken }),

  login: (body: LoginRequestBody, csrfToken: string) =>
    apiFetch<LoginResponse>(`${AUTH_PATH}/login`, {
      method: "POST",
      body: JSON.stringify(body),
    }, { csrfToken }),
  /**
   * Rotates the refresh cookie and re-signs the session — login-shaped (1.40).
   * Callers bring the newest token they hold; if it is stale the call answers
   * ANTIFORGERY_FAILED and the SPA re-primes via antiforgery().
   */
  refresh: (csrfToken: string) =>
    apiFetch<LoginResponse>(`${AUTH_PATH}/refresh`, { method: "POST" }, { csrfToken }),
  session: () => apiFetch<AuthSessionResponse>(`${AUTH_PATH}/session`),
  logout: (csrfToken: string) =>
    apiFetch<void>(`${AUTH_PATH}/logout`, { method: "POST" }, { csrfToken }),
  logoutAll: (csrfToken: string) =>
    apiFetch<void>(`${AUTH_PATH}/logout-all`, { method: "POST" }, { csrfToken }),
  /** Active sessions, newest activity first, current marked (task 1.36, domain-model §2.5). */
  sessions: () => apiFetch<SessionsListResponse>(`${AUTH_PATH}/sessions`),
  /** Revoke one remote session; the current session's own row answers the same 404 shape as any other id (BOLA §1.6). */
  revokeSession: (sessionId: string, csrfToken: string) =>
    apiFetch<void>(`${AUTH_PATH}/sessions/${sessionId}`, { method: "DELETE" }, { csrfToken }),
  passwordResetRequest: (body: PasswordResetRequest, csrfToken: string) =>
    apiFetch<PasswordResetRequestedResponse>(`${AUTH_PATH}/password/reset-request`, {
      method: "POST",
      body: JSON.stringify(body),
    }, { csrfToken }),
  passwordResetComplete: (body: PasswordResetComplete, csrfToken: string) =>
    apiFetch<PasswordResetCompleteResponse>(`${AUTH_PATH}/password/reset`, {
      method: "POST",
      body: JSON.stringify(body),
    }, { csrfToken }),
  passwordChange: (body: { currentPassword: string; newPassword: string }, csrfToken: string) =>
    apiFetch<void>(`${AUTH_PATH}/password/change`, { method: "POST", body: JSON.stringify(body) }, { csrfToken }),
  verifyEmail: (body: EmailVerifyRequest, csrfToken: string) =>
    apiFetch<EmailVerifyResponse>(`${AUTH_PATH}/email/verify`, { method: "POST", body: JSON.stringify(body) }, { csrfToken }),
  resendVerification: (csrfToken: string) =>
    apiFetch<EmailVerifyResponse>(`${AUTH_PATH}/email/verify/resend`, { method: "POST" }, { csrfToken }),
};

export const healthApi = {
  live: () => apiFetch<HealthResponse>("/api/v1/health/live"),
  ready: () => apiFetch<HealthResponse>("/api/v1/health/ready"),
};