"use client";

import { useActionState } from "react";
import { Loader2Icon } from "lucide-react";
import { adminLogin, type LoginState } from "@/app/admin/actions";
import { pillButton } from "@/components/landing/pill-button";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(adminLogin, {} as LoginState);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="next" value={next} />
      <label htmlFor="admin-password" className="text-[13px] text-white/50">
        Password
      </label>
      <input
        id="admin-password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        autoFocus
        className="h-13 w-full rounded-[18px] bg-black px-4 text-[15px] outline-none focus:ring-2 focus:ring-white/30"
      />
      {state.error && (
        <p role="alert" className="text-[13px] text-red-300">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className={pillButton({ className: "mt-2 h-13 w-full font-medium disabled:opacity-60" })}>
        {pending ? <Loader2Icon className="size-4 animate-spin" /> : "Sign in"}
      </button>
    </form>
  );
}
