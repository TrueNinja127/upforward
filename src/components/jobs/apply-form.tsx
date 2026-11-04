"use client";

import { useActionState, useId } from "react";
import { Loader2Icon } from "lucide-react";
import { submitApplication, type ApplyState } from "@/app/jobs/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, Fieldset } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

const initial: ApplyState = {};

export type ApplyFormJob = { slug: string; title: string };

/** Site-sized controls: the shadcn defaults are compact, the apply card wants comfortable touch targets. */
const control = "h-12 rounded-xl bg-black px-4 text-[15px] md:text-[15px] dark:bg-black";

export function ApplyForm({ role, jobs }: { role: string; jobs: ApplyFormJob[] }) {
  const [state, action, pending] = useActionState(submitApplication, initial);
  const id = useId();
  const errs = state.fieldErrors ?? {};
  const v = state.values;

  return (
    <form action={action} noValidate>
      {/* Honeypot: hidden from people, filled by bots. */}
      <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden>
        <label htmlFor={`${id}-website`}>Website</label>
        <input id={`${id}-website`} type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <FieldGroup className="gap-4">
        <Field data-invalid={!!errs.role}>
          <FieldLabel htmlFor={`${id}-role`}>Role</FieldLabel>
          <NativeSelect id={`${id}-role`} name="role" defaultValue={role} aria-invalid={!!errs.role} className={control}>
            {jobs.map((j) => (
              <NativeSelectOption key={j.slug} value={j.slug}>
                {j.title}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldError>{errs.role}</FieldError>
        </Field>

        <Field data-invalid={!!errs.name}>
          <FieldLabel htmlFor={`${id}-name`}>Full name</FieldLabel>
          <Input
            id={`${id}-name`}
            name="name"
            type="text"
            autoComplete="name"
            required
            defaultValue={v?.name}
            placeholder="Jane Smith"
            aria-invalid={!!errs.name}
            className={control}
          />
          <FieldError>{errs.name}</FieldError>
        </Field>

        <Field data-invalid={!!errs.email}>
          <FieldLabel htmlFor={`${id}-email`}>Email</FieldLabel>
          <Input
            id={`${id}-email`}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            defaultValue={v?.email}
            placeholder="jane@example.com"
            aria-invalid={!!errs.email}
            className={control}
          />
          <FieldError>{errs.email}</FieldError>
        </Field>

        <Field data-invalid={!!errs.phone}>
          <FieldLabel htmlFor={`${id}-phone`}>Phone number</FieldLabel>
          <Input
            id={`${id}-phone`}
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            required
            defaultValue={v?.phone}
            placeholder="(555) 123-4567"
            aria-invalid={!!errs.phone}
            className={control}
          />
          <FieldError>{errs.phone}</FieldError>
        </Field>

        <Field data-invalid={!!errs.location}>
          <div className="flex items-baseline justify-between">
            <FieldLabel htmlFor={`${id}-location`}>Location</FieldLabel>
            <FieldDescription className="text-xs">City and state</FieldDescription>
          </div>
          <Input
            id={`${id}-location`}
            name="location"
            type="text"
            autoComplete="address-level2"
            required
            defaultValue={v?.location}
            placeholder="Austin, TX"
            aria-invalid={!!errs.location}
            className={control}
          />
          <FieldError>{errs.location}</FieldError>
        </Field>

        <Fieldset className="mt-1">
          <FieldLegend className="text-muted-foreground">Please confirm</FieldLegend>
          <ConfirmField id={`${id}-citizen`} name="citizen" label="I am a US citizen" error={errs.citizen} />
          <ConfirmField id={`${id}-laptop`} name="laptop" label="I have my own laptop or MacBook" error={errs.laptop} />
          <ConfirmField id={`${id}-remote`} name="remote" label="I can provide remote access for development" error={errs.remote} />
        </Fieldset>

        {state.error && (
          <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {state.error}
          </p>
        )}

        <Button type="submit" size="lg" disabled={pending} className="mt-1 h-14 w-full rounded-full text-[16px] font-medium">
          {pending ? (
            <>
              <Loader2Icon className="animate-spin" /> Sending…
            </>
          ) : (
            "Apply now"
          )}
        </Button>
        <FieldDescription className="text-center text-xs leading-relaxed">
          After you apply you&apos;ll be taken straight to a private chat with our team. By applying you agree to our{" "}
          <a href="/privacy" className="underline underline-offset-2 hover:text-foreground">
            privacy policy
          </a>
          .
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}

function ConfirmField({ id, name, label, error }: { id: string; name: string; label: string; error?: string }) {
  return (
    <Field data-invalid={!!error} className="gap-1.5">
      <FieldLabel
        htmlFor={id}
        className="w-full cursor-pointer rounded-xl bg-black px-4 py-3.5 text-[14px] font-normal text-foreground transition-colors hover:bg-black/70 has-[[data-checked]]:ring-1 has-[[data-checked]]:ring-ring/40"
      >
        <Checkbox id={id} name={name} aria-invalid={!!error} className="size-[18px] rounded-[5px]" />
        {label}
      </FieldLabel>
      <FieldError className="px-1">{error}</FieldError>
    </Field>
  );
}
