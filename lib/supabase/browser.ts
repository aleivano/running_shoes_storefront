"use client";

import { createBrowserClient } from "@supabase/ssr";
import { assertSupabaseConfig } from "@/lib/supabase/config";

export function createClient() {
  const { supabaseUrl, supabaseAnonKey } = assertSupabaseConfig();

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
