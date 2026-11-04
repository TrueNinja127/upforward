import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { supabasePublicEnv } from "./env";

let client: SupabaseClient<Database> | undefined;

/**
 * Service-role client. Bypasses Row Level Security, so it must only ever be
 * used on the server, after the caller has been authenticated and authorised.
 */
export function supabaseAdmin(): SupabaseClient<Database> {
  if (client) return client;
  const { url } = supabasePublicEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
  if (!serviceKey) {
    throw new Error("Supabase is not configured. Set SUPABASE_SERVICE_ROLE_KEY (see .env.example).");
  }
  client = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}
