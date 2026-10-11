import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailPanel } from "@/components/auth/verify-email-panel";

/*
 * /verify-email — 1.51 (task 1.38). Two shapes, one route:
 *   - ?token=…  the link from the verification email → verify and report;
 *   - ?email=…  the post-register landing → "check your inbox" pending panel
 *               (resend offered only when signed in — api.md §2.1).
 * The panel owns the client-side outcome machine; this page only reads the
 * search params and frames the strings.
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
  return { title: t("verifyTitle") };
}

export default async function VerifyEmailPage({
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

  return (
    <AuthShell title={t("verifyTitle")} subtitle={t("verifySubtitle")}>
      <VerifyEmailPanel email={first(email)} token={first(token)} />
    </AuthShell>
  );
}