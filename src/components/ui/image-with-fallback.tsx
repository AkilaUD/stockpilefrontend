"use client";

import { useState } from "react";
import { Package } from "lucide-react";
import { cx, type ClassValue } from "@/lib/cx";

/** Image with a consistent branded fallback when the source is missing/fails. */
export function ImageWithFallback({
  src,
  alt,
  className,
  imgClassName,
  loading = "lazy",
}: {
  src?: string | null;
  alt: string;
  className?: ClassValue;
  imgClassName?: ClassValue;
  loading?: "lazy" | "eager";
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={cx("flex items-center justify-center bg-surface-recessed", className)} aria-hidden="true">
        <Package className="size-8 text-ink-faint" />
      </div>
    );
  }
  return (
    <div className={cx("overflow-hidden bg-surface-recessed", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- catalogue media URLs are API-driven */}
      <img src={src} alt={alt} loading={loading} decoding="async" onError={() => setFailed(true)} className={cx("h-full w-full object-cover", imgClassName)} />
    </div>
  );
}
