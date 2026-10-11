"use client";

/*
 * Why this file is a client component: TanStack Query keeps its cache and
 * observers in React context, which only exists on the client (the provider
 * API is a client-side store by design). It wraps children with no props of
 * its own, so every Server Component below it keeps its own rendering.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { isRetryable } from "@/lib/api";

/**
 * Retry only what the backend says to retry (1.49, docs/api.md §1.4): the
 * envelope's own `retryable` flag — set for INTERNAL_ERROR and RATE_LIMITED
 * only (§1.20 registry) — or a network-level failure that never produced a
 * response. Everything else (a 401, a business rejection, a timeout whose
 * action may still be running server-side) surfaces immediately.
 */
const RETRY_LIMIT = 2;

function retryPolicy(failureCount: number, error: unknown): boolean {
  return failureCount < RETRY_LIMIT && isRetryable(error);
}

/**
 * Short stale time: catalogue and quotation data churns within a session, but
 * refetching identical data mid-session is pure cost. The budgets in
 * docs/design-system §11 assume React Query lives in workspace routes, not
 * the anonymous catalogue — queries mounted here opt into their own cache
 * lifetimes.
 */
const STALE_TIME_MS = 30_000;

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: STALE_TIME_MS,
            retry: retryPolicy,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: retryPolicy,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}