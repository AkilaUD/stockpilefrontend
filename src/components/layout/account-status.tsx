"use client";

/*
 * Why this file is a client component (§15 rule 3): whether a session exists
 * is decided by cookies on THIS browser, so only the client can answer it —
 * the server-side header cannot know (a Server Component cannot read the
 * encrypted session cookie). The honest shape of that reality:
 *
 *   - during "loading" and when signed out, the same two links the header
 *     used to render server-side (Sign in / Create account);
 *   - once the provider reports signedIn, the account menu (AccountMenu) with
 *     the user's name and Sign out.
 *
 * The flip is visible for a signed-in visitor (briefly: links → name), which
 * is the cost of a client-decided session and is not free to hide — an SSR
 * guess would lie to one of the two audiences.
 *
 * Radix's dropdown is lazy-loaded via `next/dynamic` (AccountMenu) — signed
 * out visitors, the majority on public routes, never pay for it
 * (design-system §11: those first loads stay ≤ 200 KB gzip).
 *
 * Sign-out clears local state only after the POST /auth/logout confirms
 * (provider contract) — and a failed sign-out is shown, not swallowed.
 */

import dynamic from "next/dynamic";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "@/components/providers/session-provider";
import { ButtonLink } from "@/components/ui/button";
import { resolveErrorCopy } from "@/lib/api";

const AccountMenu = dynamic(
  () => import("@/components/auth/account-menu").then((module) => ({ default: module.AccountMenu })),
  { ssr: false },
);

export function AccountStatus() {
  const { status, user, logout } = useSession();
  const tActions = useTranslations("common.actions");
  const tErrors = useTranslations("errors");
  const [signOutBusy, setSignOutBusy] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  if (status !== "signedIn" || !user) {
    return (
      <>
        <ButtonLink href="/login" variant="ghost" size="sm">
          {tActions("signIn")}
        </ButtonLink>
        <ButtonLink
          href="/register"
          variant="secondary"
          size="sm"
          className="max-sm:hidden"
        >
          {tActions("register")}
        </ButtonLink>
      </>
    );
  }

  const fullName = `${user.firstName} ${user.lastName}`.trim() || user.email;

  return (
    <>
      <AccountMenu
        fullName={fullName}
        signOutBusy={signOutBusy}
        onSignOut={() => {
          setSignOutBusy(true);
          setSignOutError(null);
          logout().catch((error: unknown) => {
            setSignOutBusy(false);
            setSignOutError(resolveErrorCopy(tErrors, error));
          });
        }}
      />
      {signOutError && (
        <span role="alert" className="type-meta max-w-64 truncate text-danger">
          {signOutError}
        </span>
      )}
    </>
  );
}