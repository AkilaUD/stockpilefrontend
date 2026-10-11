import { cx, type ClassValue } from "@/lib/cx";
import type { ReactNode } from "react";

/*
 * EmptyState — design-system.md §6.8; §15 rule 9 makes empty states
 * first-class props, and §48 copy ("no generic messages, every empty state
 * has an action") is the caller's to supply — this component takes text as
 * props, never English of its own (§15 rule 6).
 *
 * It renders no border, no shadow and no illustration on purpose: §4.2 keeps
 * elevation for transient surfaces and §0.7 hides empty sections rather than
 * dressing them. When a whole route is empty the right move is usually to
 * render nothing at all; this exists for the case where the container itself
 * (a panel, a table, a column) is meaningful and its contents are not yet.
 *
 * `headingLevel` is a prop because the component cannot know where in the
 * document outline it lands, and §10 requires heading order to stay correct —
 * a hardcoded `h3` would be right on one page and a skip on the next.
 *
 * Server Component: text and layout only.
 */

type HeadingLevel = "h2" | "h3" | "h4";

interface EmptyStateProps {
  /** The container's state, in the caller's voice — e.g. `t("common.states.emptyTitle")`. */
  title: ReactNode;
  /** One sentence of context. Omit it rather than pad it. */
  description?: ReactNode;
  /** The way out — a Button/ButtonLink. First-class, not an afterthought (§15.9). */
  action?: ReactNode;
  /** Position in the outline. Defaults to `h3` — inside a panel below a page `h2`. */
  headingLevel?: HeadingLevel;
  className?: ClassValue;
}

export function EmptyState({
  title,
  description,
  action,
  headingLevel: Heading = "h3",
  className,
}: EmptyStateProps) {
  return (
    <div className={cx("flex flex-col items-center gap-2 py-10 text-center", className)}>
      <Heading className="type-title-sm text-ink">{title}</Heading>
      {description && <p className="type-body-sm max-w-prose text-ink-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
