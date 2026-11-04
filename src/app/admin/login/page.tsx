import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/landing/logo";
import { LoginForm } from "@/components/admin/login-form";
import { isAdmin } from "@/lib/session";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  const [{ next }, authed] = await Promise.all([searchParams, isAdmin()]);
  if (authed) redirect("/admin");
  const nextPath = typeof next === "string" && next.startsWith("/admin") ? next : "/admin";

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-20 shrink-0 items-center px-5 sm:px-8">
        <Logo />
      </header>
      <main className="flex flex-1 items-center justify-center px-5 pb-20">
        <div className="w-full max-w-sm rounded-[32px] bg-card p-8">
          <p className="text-[13px] text-white/50">Upforward admin</p>
          <h1 className="headline mt-2 text-[32px]">Sign in</h1>
          <p className="mt-2 text-[14px] text-white/50">Enter the admin password to open the applicant inbox.</p>
          <div className="mt-6">
            <LoginForm next={nextPath} />
          </div>
        </div>
      </main>
    </div>
  );
}
