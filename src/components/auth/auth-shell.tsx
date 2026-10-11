import type { ReactNode } from "react";

/**
 * AuthShell — the shared frame for the sign-in / register / reset / verify
 * screens (1.51).
 *
 * Editorial register (§1.1): neutral ground, a display title, a muted
 * subtitle, and the form on a `surface-panel` card with the `--elev-sm` box —
 * the quietest elevation tier (§4.2), because identity screens should not
 * compete with their own field for attention.
 *
 * A Server Component on purpose (§15 rule 3): it only arranges the strings
 * the page hands it; every screen's interactivity lives in the client form.
 *
 * Landmark contract (phase-gate line 169 sweep): the `(auth)` layout already
 * renders the route group's single `<main id="main-content">` — the same
 * contract every route-group layout documents. This component arranges
 * *inside* that landmark, so it must not contribute a second `<main>` (the
 * duplicate id/landmark shipped until tests/e2e/responsive.spec.ts caught it
 * in strict mode on /login).
 */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className="flex flex-1 items-start justify-center px-6 py-12 md:py-16"
    >
      <div className="w-full max-w-md">
        <h1 className="type-display-lg">{title}</h1>
        {subtitle && <p className="type-body text-ink-muted mt-3">{subtitle}</p>}
        <div className="mt-8 rounded-md border border-line bg-surface-panel shadow-elev-sm">
          <div className="p-6 md:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}