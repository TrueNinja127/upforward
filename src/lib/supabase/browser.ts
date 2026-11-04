"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { supabasePublicEnv } from "./env";

let client: SupabaseClient<Database> | undefined;

/**
 * Anonymous browser client. It is used only for Realtime (broadcast + presence);
 * every table is locked down by RLS, so it cannot read or write data.
 */
export function supabaseBrowser(): SupabaseClient<Database> {
  if (client) return client;
  const { url, anonKey } = supabasePublicEnv();
  client = createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}
