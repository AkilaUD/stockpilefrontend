"use client";

/*
 * Public-route error boundary (Next 16.3: `retry`, not `reset`, in 16.x).
 *
 * Everything the visitor actually needs is message-driven (§47): the generic
 * "could not complete" copy plus Try again — the boundary's own failure mode
 * is temporary, so retry re-renders the segment rather than dead-ending.
 *
 * The error object is logged client-side once (Next 16 serializes a generic
 * message + `digest` in production; the digest is how the visitor's report
 * matches server logs).
 */

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function PublicError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const t = useTranslations("errors");
  const tActions = useTranslations("common.actions");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="shell-public flex min-h-[50vh] items-center justify-center py-16">
      <div className="max-w-md text-center">
        <h1 className="type-title-md text-ink">{t("unexpectedNoReference")}</h1>
        <div className="mt-6">
          <Button onClick={retry}>{tActions("retry")}</Button>
        </div>
      </div>
    </div>
  );
}