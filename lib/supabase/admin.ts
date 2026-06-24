import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { assertSupabaseAdminConfig } from "@/lib/supabase/config";

export function createAdminClient() {
  const { supabaseUrl, supabaseServiceRoleKey } = assertSupabaseAdminConfig();

  return createSupabaseClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
