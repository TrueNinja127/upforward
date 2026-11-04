import "server-only";
import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { JobRow } from "@/lib/supabase/types";

/*
 * Open roles come from the shared database and are managed in the admin panel.
 * Pages that call these export `revalidate`, so the public site picks up
 * changes within a minute without a redeploy. Failures (for example a build
 * without database credentials) degrade to "no open roles" instead of crashing.
 */

const SELECT = "*";

function normalise(row: JobRow): JobRow {
  return {
    ...row,
    responsibilities: Array.isArray(row.responsibilities) ? row.responsibilities.filter((v) => typeof v === "string") : [],
    skills: Array.isArray(row.skills) ? row.skills.filter((v) => typeof v === "string") : [],
  };
}

/** Open roles in display order. Cached per request. */
export const listOpenJobs = cache(async (): Promise<JobRow[]> => {
  try {
    const { data, error } = await supabaseAdmin()
      .from("jobs")
      .select(SELECT)
      .eq("is_open", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data.map(normalise);
  } catch (err) {
    console.error("[jobs] could not load open roles", err);
    return [];
  }
});

/** One open role by URL slug, or null when it does not exist or is closed. */
export const getOpenJob = cache(async (slug: string): Promise<JobRow | null> => {
  if (!/^[a-z0-9-]{1,60}$/.test(slug)) return null;
  try {
    const { data, error } = await supabaseAdmin().from("jobs").select(SELECT).eq("slug", slug).eq("is_open", true).maybeSingle();
    if (error) throw error;
    return data ? normalise(data) : null;
  } catch (err) {
    console.error("[jobs] could not load role", slug, err);
    return null;
  }
});

/** Any role (open or closed) by id – used for applicants whose role has since closed. */
export const getJobById = cache(async (id: string): Promise<JobRow | null> => {
  const { data, error } = await supabaseAdmin().from("jobs").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? normalise(data) : null;
});
