import { setRequestLocale } from "next-intl/server";
import { WorkspaceHeader } from "@/components/layout/workspace-header";

/**
 * Supplier-desk shell — the `/(supplier)` route group (implementation-plan
 * 1.52, design-system §8.6).
 *
 * The supplier area is its own group per §54 so its guard, robots and future
 * chrome can differ from the buyer workspace. Phase 1 ships no supplier
 * endpoints and no supplier routes beyond this shell's home page (`/supplier`,
 * resolved from `(supplier)/supplier/` — see the workspace layout's comment
 * for why the group nests a literal segment), so the shell is the same minimal
 * operational one (`WorkspaceHeader`, dense, low chrome); the §8.6 desk lands
 * with its Phase-2 task.
 *
 * Contract with the root layout: exactly one `<main id="main-content">`.
 */
export default async function SupplierLayout({
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