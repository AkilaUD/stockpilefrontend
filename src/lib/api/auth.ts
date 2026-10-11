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
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
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

export interface HealthResponse {
  status: string;
  uptimeSeconds: number;
}

const AUTH_PATH = "/api/v1/auth";

export const authApi = {
  /** Prime the double-submit token before the first anonymous write (§1.10). */
  antiforgery: () => apiFetch<AntiforgeryTokenResponse>(`${AUTH_PATH}/antiforgery`),
  register: (body: RegisterRequestBody, csrfToken: string) =>
    apiFetch<RegisterResponse>(`${AUTH_PATH}/register`, {
      method: "POST",
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