import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

/*
 * /login — 1.51. The page is thin by design: the frame (AuthShell) and the
 * strings come from the server, the form itself is the client component that
 * owns submit + session (LoginForm). 1.52 moves these pages into the (auth)
 * route group with the SSR auth-proxy guard; the component files stay put.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("loginTitle") };
}

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  return (
    <AuthShell title={t("loginTitle")} subtitle={t("loginSubtitle")} audience="buyer">
      <LoginForm />
    </AuthShell>
  );
}