import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/button";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

/*
 * /reset-password — 1.51, reset step 2 (task 1.37, A5/A6). The link in the
 * email carries the single-use token; completion rotates the security stamp
 * and revokes every other session. A link WITHOUT its token cannot work, so
 * that state says so and points back to step 1 — it is not silently
 * redirecting or pretending.
 */

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("resetTitle") };
}

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { token, email } = await searchParams;
  const t = await getTranslations("auth");
  const tErrors = await getTranslations("errors");

  return (
    <AuthShell title={t("resetTitle")} subtitle={t("resetSubtitle")}>
      {token ? (
        <ResetPasswordForm email={first(email)} token={first(token)} />
      ) : (
        <div className="flex flex-col gap-4">
          <p className="type-body">{tErrors("INVALID_RESET_TOKEN")}</p>
          <div>
            <ButtonLink href="/forgot-password">{t("sendResetLink")}</ButtonLink>
          </div>
        </div>
      )}
    </AuthShell>
  );
}