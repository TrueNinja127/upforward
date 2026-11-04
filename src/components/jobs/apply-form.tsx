"use client";

import { useActionState, useId } from "react";
import { Loader2Icon } from "lucide-react";
import { submitApplication, type ApplyState } from "@/app/jobs/actions";
import { pillButton } from "@/components/landing/pill-button";
import { jobs } from "@/lib/jobs";
import type { JobRole } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const initial: ApplyState = {};

export function ApplyForm({ role }: { role: JobRole }) {
  const [state, action, pending] = useActionState(submitApplication, initial);
  const id = useId();
  const errs = state.fieldErrors ?? {};
  const v = state.values;

  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      {/* Honeypot: hidden from people, filled by bots. */}
      <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden>
        <label htmlFor={`${id}-website`}>Website</label>
        <input id={`${id}-website`} type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <Field id={`${id}-role`} label="Role" error={errs.role}>
        <select
          id={`${id}-role`}
          name="role"
          defaultValue={role}
          className={inputClass(!!errs.role)}
          aria-invalid={!!errs.role}
        >
          {jobs.map((j) => (
            <option key={j.slug} value={j.slug} className="bg-black">
              {j.title}
            </option>
          ))}
        </select>
      </Field>

      <Field id={`${id}-name`} label="Full name" error={errs.name}>
        <input
          id={`${id}-name`}
          name="name"
          type="text"
          autoComplete="name"
          required
          defaultValue={v?.name}
          placeholder="Jane Smith"
          className={inputClass(!!errs.name)}
          aria-invalid={!!errs.name}
        />
      </Field>

      <Field id={`${id}-email`} label="Email" error={errs.email}>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          defaultValue={v?.email}
          placeholder="jane@example.com"
          className={inputClass(!!errs.email)}
          aria-invalid={!!errs.email}
        />
      </Field>

      <Field id={`${id}-phone`} label="Phone number" error={errs.phone}>
        <input
          id={`${id}-phone`}
          name="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          required
          defaultValue={v?.phone}
          placeholder="(555) 123-4567"
          className={inputClass(!!errs.phone)}
          aria-invalid={!!errs.phone}
        />
      </Field>

      <Field id={`${id}-location`} label="Location" hint="City and state" error={errs.location}>
        <input
          id={`${id}-location`}
          name="location"
          type="text"
          autoComplete="address-level2"
          required
          defaultValue={v?.location}
          placeholder="Austin, TX"
          className={inputClass(!!errs.location)}
          aria-invalid={!!errs.location}
        />
      </Field>

      <fieldset className="mt-2 flex flex-col gap-2.5">
        <legend className="mb-1 text-[13px] text-white/50">Please confirm</legend>
        <Check name="citizen" label="I am a US citizen" error={errs.citizen} />
        <Check name="laptop" label="I have my own laptop or MacBook" error={errs.laptop} />
        <Check name="remote" label="I can provide remote access for development" error={errs.remote} />
      </fieldset>

      {state.error && (
        <p role="alert" className="rounded-[18px] bg-red-500/10 px-4 py-3 text-[14px] text-red-200">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={pillButton({ className: "mt-2 h-14 w-full font-medium disabled:opacity-60" })}>
        {pending ? (
          <>
            <Loader2Icon className="size-4 animate-spin" /> Sending…
          </>
        ) : (
          "Apply now"
        )}
      </button>
      <p className="text-center text-[12px] leading-relaxed text-white/40">
        After you apply you&apos;ll be taken straight to a private chat with our team. By applying you agree to our{" "}
        <a href="/privacy" className="underline underline-offset-2 hover:text-white">
          privacy policy
        </a>
        .
      </p>
    </form>
  );
}

function inputClass(invalid: boolean) {
  return cn(
    "h-13 w-full rounded-[18px] bg-black px-4 text-[15px] outline-none transition-shadow placeholder:text-white/30 focus:ring-2 focus:ring-white/30",
    invalid && "ring-2 ring-red-400/70"
  );
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between text-[13px] text-white/50">
        {label}
        {hint && <span className="text-white/30">{hint}</span>}
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-1.5 text-[13px] text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

function Check({ name, label, error }: { name: string; label: string; error?: string }) {
  return (
    <div>
      <label className="flex cursor-pointer items-center gap-3 rounded-[18px] bg-black px-4 py-3 text-[14px]">
        <input type="checkbox" name={name} className="size-4 shrink-0 cursor-pointer accent-white" aria-invalid={!!error} />
        {label}
      </label>
      {error && (
        <p role="alert" className="mt-1.5 px-1 text-[13px] text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
