import { FlagIcon, LaptopIcon, ScreenShareIcon, type LucideIcon } from "lucide-react";
import type { ApplicationStatus, JobRow } from "@/lib/supabase/types";

/*
 * Client-safe job helpers. The roles themselves live in the shared database and
 * are managed from the admin panel (admin.upforward.org → Jobs); see
 * `@/lib/jobs-db` for the server-side queries.
 */

export type Job = JobRow;

/** Requirements every applicant confirms on the form (the three checkboxes). */
export const requirements: { title: string; detail: string; icon: LucideIcon }[] = [
  {
    title: "US citizen",
    detail: "You must be a United States citizen currently living in the US.",
    icon: FlagIcon,
  },
  {
    title: "Own laptop or MacBook",
    detail: "A reliable personal laptop or MacBook with a stable internet connection.",
    icon: LaptopIcon,
  },
  {
    title: "Remote access for development",
    detail:
      "You are comfortable providing remote access to your machine so our engineering team can set up and run development tooling.",
    icon: ScreenShareIcon,
  },
];

/** Short tags shown on job cards and pages (empty values are skipped). */
export function jobTags(job: Pick<Job, "location" | "employment_type" | "schedule" | "compensation_headline">): string[] {
  return [job.location, job.employment_type, job.schedule, job.compensation_headline].filter(Boolean);
}

/** Compensation headline shared by every open role, or null when roles differ. */
export function sharedCompensation(jobs: Pick<Job, "compensation_headline">[]): string | null {
  const first = jobs[0]?.compensation_headline;
  if (!first) return null;
  return jobs.every((j) => j.compensation_headline === first) ? first : null;
}

export const applicationStatusLabel: Record<ApplicationStatus, string> = {
  new: "New",
  in_review: "In review",
  interview: "Interview",
  hired: "Hired",
  declined: "Declined",
};
