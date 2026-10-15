import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { InternalError } from "@/lib/core/errors/AppError"

/**
 * Server-only Supabase client authenticated with the SERVICE ROLE key.
 *
 * Encapsulation: the privileged client is created once and never exported
 * raw to the browser. The service-role key bypasses Row Level Security, so
 * this module must only ever be imported from server code.
 */
let cachedAdminClient: SupabaseClient | null = null

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  return Boolean(url && key && !url.includes("[PROJECT-REF]") && !key.startsWith("replace-with"))
}

export function createSupabaseAdminClient(): SupabaseClient {
  if (cachedAdminClient) return cachedAdminClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!isSupabaseConfigured() || !url || !serviceRoleKey) {
    throw new InternalError(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    )
  }

  cachedAdminClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cachedAdminClient
}
