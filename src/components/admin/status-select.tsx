"use client";

import { useState, useTransition } from "react";
import { Loader2Icon } from "lucide-react";
import { adminSetStatus } from "@/app/admin/actions";
import { applicationStatusLabel } from "@/lib/jobs";
import type { ApplicationStatus } from "@/lib/supabase/types";

export function StatusSelect({ applicationId, status }: { applicationId: string; status: ApplicationStatus }) {
  const [value, setValue] = useState<ApplicationStatus>(status);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-col items-end gap-1">
      <label className="flex items-center gap-2 text-[13px] text-white/50">
        Status
        <span className="relative">
          <select
            value={value}
            disabled={pending}
            onChange={(e) => {
              const next = e.target.value as ApplicationStatus;
              const prev = value;
              setValue(next);
              setError(null);
              start(async () => {
                const res = await adminSetStatus(applicationId, next);
                if (res.error) {
                  setValue(prev);
                  setError(res.error);
                }
              });
            }}
            className="h-9 appearance-none rounded-full bg-black pr-9 pl-4 text-[13px] font-medium text-white outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-60"
          >
            {(Object.keys(applicationStatusLabel) as ApplicationStatus[]).map((s) => (
              <option key={s} value={s} className="bg-black">
                {applicationStatusLabel[s]}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-white/50">
            {pending ? <Loader2Icon className="size-3.5 animate-spin" /> : "▾"}
          </span>
        </span>
      </label>
      {error && (
        <p role="alert" className="text-[12px] text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
