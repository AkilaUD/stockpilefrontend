import { cx, type ClassValue } from "@/lib/cx";
import type { ReactNode } from "react";

/*
 * ErrorState — design-system.md §6.8, bound by §47: error copy is always
 * context-aware with a next action, never "Something went wrong." The copy
 * itself is the caller's (centralised mapping lands with the API client,
 * task 1.49 — `errors.*` in the message files); what this component enforces
 * is the shape that makes §47 legible:
 *
 *   - `message` is required. There is no default failure text to fall back
 *     on, so an error state cannot be rendered without saying what happened.
 *   - `action` is where the next step goes — a retry Button, a link, a
 *     "reload" — optional only because §47's copy can itself carry the next
 *     step ("...reload the page and try again").
 *
 * §10: `aria-live` is polite by default and `assertive` only for BLOCKING
 * errors — hence `role` is a prop with `status` as the default, and a caller
 * rendering a page-killing failure escalates it to `alert`.
 *
 * The danger colour is carried by the left rule, not the paragraph: text
 * stays `ink` (≈16:1 everywhere, and `--danger` does not re-role on dark
 * surfaces per §4.3's list), the rule carries the tone, and the message
 * carries the meaning. Colour is never the only signal (§10).
 *
 * Server Component: no state, no listeners — the live region announces what
 * is present when it mounts, which is exactly the behaviour wanted here.
 */

type HeadingLevel = "h2" | "h3" | "h4";

interface ErrorStateProps {
  /** §47 copy: what happened, in context. Required by construction. */
  message: ReactNode;
  /** Short heading in the caller's voice. Omit when the message is self-standing. */
  title?: ReactNode;
  /** The next action — a Button, a link. §47 wants every error to have one. */
  action?: ReactNode;
  /** `status` (polite) for recoverable failures; `alert` only when blocking (§10). */
  role?: "status" | "alert";
  headingLevel?: HeadingLevel;
  className?: ClassValue;
}

export function ErrorState({
  message,
  title,
  action,
  role = "status",
  headingLevel: Heading = "h3",
  className,
}: ErrorStateProps) {
  return (
    <div
      role={role}
      className={cx("flex flex-col items-start gap-1.5 border-l-2 border-danger py-1 pl-4", className)}
    >
      {title && <Heading className="type-title-sm text-ink">{title}</Heading>}
      <p className="type-body-sm text-ink">{message}</p>
      {action && <div className="mt-1.5">{action}</div>}
    </div>
  );
}
