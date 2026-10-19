import { cx, type ClassValue } from "@/lib/cx";

/*
 * Skeleton — loading placeholder block. Decorative only (aria-hidden).
 * Prefer section-level skeletons over page-wide blank states.
 */

interface SkeletonProps {
  className?: ClassValue;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cx("animate-pulse rounded-sm bg-surface-recessed", className)}
    />
  );
}
