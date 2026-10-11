import { setRequestLocale } from "next-intl/server";
import { WorkspaceHeader } from "@/components/layout/workspace-header";

/**
 * Buyer workspace shell — the `/(workspace)` tree (implementation-plan 1.52,
 * design-system §8.5 "no 4-card KPI page", §13 F12).
 *
 * The workspace is a *separate* route group with its own chrome — no shared
 * layout file with `/(public)` (F12). The proxy guard admits only signed-in
 * visitors here (1.52), and security-test-matrix Z1 marks the group's URLs
 * `noindex, nofollow` at the edge.
 *
 * Why the group's page lives in a `(workspace)/workspace/` subfolder (idem
 * `(supplier)/supplier/`, `(admin)/admin/`): parallel route groups at one
 * level cannot both own the root path — `(public)/page.tsx` already resolves
 * to `/` — so a group whose home must sit under `/workspace/**` (Z1) needs a
 * literal `workspace` segment in the group to produce it. `(workspace)/` is
 * the shell; `(workspace)/workspace/` is the URL.
 *
 * Contract with the root layout: exactly one `<main id="main-content">` per
 * group. The operational register is dense and low-chrome, so nothing extra
 * is added here until a Phase-2 task actually specifies it.
 */
export default async function WorkspaceLayout({
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