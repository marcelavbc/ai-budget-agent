import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/core/types/supabase";

let cached:
  | ReturnType<typeof createClient<Database>>
  | null = null;

function resolveSupabaseEnv() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    "";

  return { url, serviceRoleKey, anonKey };
}

export function getSupabaseClient() {
  if (cached) return cached;

  const { url, serviceRoleKey, anonKey } = resolveSupabaseEnv();
  if (!url) {
    throw new Error(
      "supabaseUrl is required. Set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) in the environment."
    );
  }

  const key = serviceRoleKey || anonKey;
  if (!key) {
    throw new Error(
      "supabaseKey is required. Set SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_ANON_KEY) in the environment."
    );
  }

  cached = createClient<Database>(
    url,
    key,
    serviceRoleKey
      ? { auth: { persistSession: false, autoRefreshToken: false } }
      : undefined
  );
  return cached;
}
