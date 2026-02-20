/**
 * JUSP — Supabase (REST) config placeholder
 *
 * This project uses Supabase REST in lib/ordersRepo.ts to avoid requiring
 * @supabase/supabase-js on the client.
 *
 * Keep this file so imports like "@/lib/supabaseClient" are available later
 * if you decide to install @supabase/supabase-js.
 */

export function getSupabaseEnv() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  return { url, anonKey };
}
