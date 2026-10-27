import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { AccountStatus } from "./account-status";
import { LocaleToggle } from "./locale-toggle";
import { WorkspaceNav } from "./workspace-nav";

/**
 * Operational masthead for the private route groups — `/(workspace)`,
 * `/(supplier)`, `/(admin)` (implementation-plan 1.52, design-system §1.1
 * "operational" register).
 *
 * Deliberately NOT `SiteHeader`: design-system §13 F12 forbids the public and
 * workspace trees sharing a layout component, and the registers differ — the
 * editorial masthead is tall (h-16/h-20, dark #202020) while this one is dense
 * (`h-12`) on the light neutral field with the wider `shell-workspace` gutter,
 * and it carries no public
 * navigation. What it reuses are the two session/language controls, neither of
 * which is chrome: `LocaleToggle` (WCAG 3.1.1 — every page stays switchable)
 * and `AccountStatus` (the signed-in account menu). The ink mark on this
 * light panel is §14's documented light-ground variant.
 *
 * The proxy guard (1.52) turns signed-out visitors away at the edge, so the
 * signed-out links `AccountStatus` renders are only ever a pre-hydration
 * flash inside these groups.
 */
export async function WorkspaceHeader() {
  return (
    <header className="sticky top-0 z-header border-b-2 border-b-brand-primary bg-surface-panel shadow-elev-sm">
      <div className="shell-workspace flex h-14 items-center gap-3">
        <Link href="/workspace" className="flex shrink-0 items-center">
          <Image
            src="/brand/stockpile-logo-ink.png"
            alt="Stockpile.lk"
            width={300}
            height={73}
            priority
            className="h-6 w-auto"
          />
        </Link>

        <WorkspaceNav />
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <LocaleToggle />
          <AccountStatus />
        </div>
      </div>
    </header>
  );
}