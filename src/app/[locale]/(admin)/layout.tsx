import { setRequestLocale } from "next-intl/server";
import { WorkspaceHeader } from "@/components/layout/workspace-header";

/**
 * Administration shell — the `/(admin)` route group (implementation-plan
 * 1.52).
 *
 * Its own group per §54 so admin gets a stricter guard, its own robots policy
 * and eventually admin-specific chrome. Phase 1 ships no administration
 * surface beyond this shell's home page (`/admin`, resolved from
 * `(admin)/admin/`); platform administration lands with its own later phase.
 *
 * Contract with the root layout: exactly one `<main id="main-content">`.
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <WorkspaceHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
    </>
  );
}