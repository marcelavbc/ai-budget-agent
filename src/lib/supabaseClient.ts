import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

let cached:
  | ReturnType<typeof createClient<Database>>
  | null = null;

function resolveSupabaseEnv() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    "";

  return { url, anonKey };
}

export function getSupabaseClient() {
  if (cached) return cached;

  const { url, anonKey } = resolveSupabaseEnv();
  if (!url) {
    throw new Error(
      "supabaseUrl is required. Set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) in the environment."
    );
  }
  if (!anonKey) {
    throw new Error(
      "supabaseAnonKey is required. Set NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_ANON_KEY) in the environment."
    );
  }

  cached = createClient<Database>(url, anonKey);
  return cached;
}
