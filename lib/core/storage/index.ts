import type { IStorageProvider } from "@/lib/core/interfaces/IStorageProvider"
import { SupabaseStorageProvider } from "@/lib/core/providers/SupabaseStorageProvider"
import { LocalStorageProvider } from "@/lib/core/providers/LocalStorageProvider"
import { isSupabaseConfigured } from "@/lib/supabase/admin"

/**
 * Storage provider factory (polymorphism at the seam).
 * Prefers Supabase Storage when configured; otherwise falls back to the
 * local filesystem so development works with zero cloud dependencies.
 */
let cached: IStorageProvider | null = null

export function getStorageProvider(): IStorageProvider {
  if (cached) return cached
  cached = isSupabaseConfigured()
    ? new SupabaseStorageProvider()
    : new LocalStorageProvider()
  return cached
}

export type StorageProviderKind = "supabase" | "local"

export function getStorageProviderKind(): StorageProviderKind {
  return isSupabaseConfigured() ? "supabase" : "local"
}
