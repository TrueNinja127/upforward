import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/landing/logo";
import { pillButton } from "@/components/landing/pill-button";
import { getApplicantContext } from "@/lib/chat/dal";
import { checkLoginToken } from "@/lib/chat/tokens";
import { completeChatSignIn } from "../actions";

export const metadata: Metadata = {
  title: "Open your chat",
  robots: { index: false, follow: false },
};

/*
 * The link from the email lands here. We validate the token but only consume it
 * when the visitor presses the button, so email security scanners that pre-fetch
 * links cannot burn a single-use token.
 */
export default async function VerifyPage({ searchParams }: PageProps<"/chat/verify">) {
  const { token } = await searchParams;
  const raw = typeof token === "string" ? token : undefined;

  const [check, existing] = await Promise.all([checkLoginToken(raw), getApplicantContext()]);

  // Already signed in as the same applicant on this device: skip the extra click.
  if (check.ok && existing && existing.application.id === check.application.id) redirect("/chat");

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-20 shrink-0 items-center px-5 sm:px-8">
        <Logo />
      </header>
      <main className="flex flex-1 items-center justify-center px-5 pb-20">
        <div className="w-full max-w-md rounded-[32px] bg-card p-8 text-center">
          {check.ok ? (
            <>
              <p className="text-[13px] text-white/50">Welcome back</p>
              <h1 className="headline mt-2 text-[32px]">Hi {check.application.name.split(/\s+/)[0]}.</h1>
              <p className="mt-3 text-[15px] leading-relaxed text-white/60">
                Press the button to open your chat with the Upforward team on this device.
              </p>
              <form action={completeChatSignIn} className="mt-6">
                <input type="hidden" name="token" value={raw} />
                <button type="submit" className={pillButton({ className: "h-13 w-full font-medium" })}>
                  Open my chat
                </button>
              </form>
            </>
          ) : (
            <>
              <p className="text-[13px] text-white/50">Sign-in link</p>
              <h1 className="headline mt-2 text-[32px]">
                {check.reason === "expired" ? "This link has expired." : check.reason === "used" ? "This link was already used." : "This link isn't valid."}
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-white/60">
                Request a fresh link with the email you applied with and we&apos;ll send a new one right away.
              </p>
              <Link href="/chat" className={pillButton({ className: "mt-6 h-13 w-full font-medium" })}>
                Get a new link
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
