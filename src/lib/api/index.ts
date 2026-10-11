/**
 * Typed API boundary (implementation-plan 1.49) — the only route from browser
 * code to the Stockpile.lk backend.
 *
 *   envelope.ts — §1.4 wire shapes, ApiClientError/ApiTimeoutError, isRetryable
 *   client.ts  — apiFetch<T>: typed transport, timeout, antiforgery echo
 *   errors.ts  — resolveErrorCopy: every failure becomes §47 copy
 *   auth.ts    — typed Phase-1 endpoints (register, login, session, refresh,
 *                logout, resets, verification) + health probes
 *
 * Everything here is a plain module (no hooks, no "use client"): client
 * components import it; nothing in the server bundle pulls it in.
 */
export * from "./envelope";
export * from "./client";
export * from "./errors";
export * from "./auth";