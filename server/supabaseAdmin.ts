import { createClient } from "@supabase/supabase-js";

export const createSupabaseAdminClient = () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    "";

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured",
    );
  }

  return createClient(supabaseUrl, supabaseServiceKey);
};
