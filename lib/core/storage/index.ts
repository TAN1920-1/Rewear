import type { IStorageProvider } from "@/lib/core/interfaces/IStorageProvider"
import { FirebaseStorageProvider } from "@/lib/core/providers/FirebaseStorageProvider"
import { LocalStorageProvider } from "@/lib/core/providers/LocalStorageProvider"
import { isFirebaseConfigured } from "@/lib/firebase/admin"

/**
 * Storage provider factory (polymorphism at the seam).
 * Prefers Firebase Cloud Storage when configured; otherwise falls back to the
 * local filesystem so development works with zero cloud dependencies.
 */
let cached: IStorageProvider | null = null

export function getStorageProvider(): IStorageProvider {
  if (cached) return cached
  cached = isFirebaseConfigured()
    ? new FirebaseStorageProvider()
    : new LocalStorageProvider()
  return cached
}

export type StorageProviderKind = "firebase" | "local"

export function getStorageProviderKind(): StorageProviderKind {
  return isFirebaseConfigured() ? "firebase" : "local"
}
