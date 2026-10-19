import { CircleCheck } from "lucide-react";

/** Feature row with Lucide check — how-it-works buyer/supplier pages. */
export function FeatureListItem({ title, body }: { title: string; body: string }) {
  return (
    <li className="flex gap-4">
      <CircleCheck
        aria-hidden
        className="mt-0.5 size-4 shrink-0 text-brand-secondary"
        strokeWidth={1.5}
      />
      <div>
        <h3 className="font-display text-base font-bold text-ink">{title}</h3>
        <p className="mt-1 type-body-sm text-ink-muted">{body}</p>
      </div>
    </li>
  );
}
