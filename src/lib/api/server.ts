import { ApiClientError } from "./envelope";
import { API_ORIGIN } from "./origin";

/**
 * Shared server-render read transport for the public surface.
 *
 * Browser-facing code cannot use this module: it reads `API_ORIGIN` and fetches
 * the .NET origin directly, because during SSR there is no running browser to
 * hit the `next.config` rewrite. Server Components import the readers built on
 * it (`catalogue-server.ts`, `content-server.ts`); nothing here may be imported
 * from a `"use client"` module, or `API_ORIGIN` (and the absolute origin) would
 * leak into the client bundle.
 *
 * `cache: "no-store"` matches the browser transport's policy (client.ts):
 * everything this surface serves is live platform state — exact totals, fresh
 * audience policy, newly published articles — never snapshot data.
 */

/**
 * SSR read budget. Undici's defaults (300s headers timeout) are far past any
 * render horizon; an origin that has not answered in this long is treated as
 * unavailable and retried once (see `serverGet`).
 */
export const SERVER_READ_TIMEOUT_MS = 10_000;

/** Total attempts per SSR read: the original plus one fresh-connection retry. */
export const MAX_SERVER_READ_ATTEMPTS = 2;

export async function serverGet<T>(path: string): Promise<T> {
  // SSR reads share Node's global fetch dispatcher, and its keep-alive pool
  // can hand a render a half-dead socket after an aborted response (the
  // "destination stream closed early" burst in the e2e runs surfaced exactly
  // this: a render's first fetch silently stalled past any render budget
  // while undici's default headers timeout sat at 300s). Two countermeasures,
  // both on the honest side of the wire (no caching, no mocking):
  //  1. AbortSignal.timeout bounds the read so a wedged socket fails fast.
  //  2. One retry re-issues on a fresh connection — the failure is almost
  //     always a dead pooled socket, and a new connection succeeds in ms.
  // 4xx/404 rethrow immediately (semantic statuses like notFound()); network
  // errors, timeouts and 5xx are the retryable class.
  let attempts = 0;
  for (;;) {
    attempts += 1;
    try {
      const response = await fetch(`${API_ORIGIN}${path}`, {
        cache: "no-store",
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(SERVER_READ_TIMEOUT_MS),
      });

      if (!response.ok) {
        // The envelope is already rendered into friendly copy by the backend for
        // browsers; SSR cares about status semantics (404 → notFound()), so the
        // envelope body is not needed here.
        throw new ApiClientError(response.status, null, null);
      }

      if (response.status === 204) return undefined as T;
      return (await response.json()) as T;
    } catch (error) {
      const retryable = error instanceof ApiClientError ? error.status >= 500 : true;
      if (attempts >= MAX_SERVER_READ_ATTEMPTS || !retryable) throw error;
    }
  }
}

/** Builds a query string from defined, non-empty values only. */
export function queryString(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const entries = Object.entries(params).filter(
    (entry): entry is [string, string | number | boolean] =>
      entry[1] !== undefined && entry[1] !== null && entry[1] !== "",
  );
  if (entries.length === 0) return "";
  return `?${entries.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`).join("&")}`;
}
