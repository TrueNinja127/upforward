"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2Icon, MailCheckIcon } from "lucide-react";
import { requestChatLink, type SignInState } from "@/app/chat/actions";
import { pillButton } from "@/components/landing/pill-button";

export function ChatSignInForm() {
  const [state, action, pending] = useActionState(requestChatLink, {} as SignInState);

  if (state.sent) {
    return (
      <div className="rounded-[28px] bg-card p-6 text-left sm:p-8">
        <span className="flex size-12 items-center justify-center rounded-full bg-white text-black">
          <MailCheckIcon className="size-5" />
        </span>
        <h2 className="headline mt-5 text-[26px]">Check your inbox</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-white/60">
          We sent a sign-in link to <span className="text-white">{state.email}</span>. Open it on any device to jump
          back into your chat. The link works for 15 minutes.
        </p>
        <p className="mt-4 text-[13px] text-white/40">No email after a minute? Check your spam folder, then try again.</p>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="rounded-[28px] bg-card p-6 text-left sm:p-8">
      <label htmlFor="chat-email" className="text-[13px] text-white/50">
        Email you applied with
      </label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          id="chat-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          defaultValue={state.email}
          placeholder="jane@example.com"
          aria-invalid={!!state.error}
          className="h-13 flex-1 rounded-full bg-black px-5 text-[15px] outline-none placeholder:text-white/30 focus:ring-2 focus:ring-white/30"
        />
        <button type="submit" disabled={pending} className={pillButton({ className: "h-13 px-7 font-medium disabled:opacity-60" })}>
          {pending ? <Loader2Icon className="size-4 animate-spin" /> : "Send link"}
        </button>
      </div>
      {state.error && (
        <p role="alert" className="mt-3 text-[13px] leading-relaxed text-red-300">
          {state.error}
        </p>
      )}
      <p className="mt-4 text-[13px] leading-relaxed text-white/40">
        We&apos;ll email you a secure one-time link. Haven&apos;t applied yet?{" "}
        <Link href="/#jobs" className="text-white/70 underline underline-offset-2 hover:text-white">
          See open roles
        </Link>
        .
      </p>
    </form>
  );
}
