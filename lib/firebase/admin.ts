import { cert, getApps, initializeApp, type App } from "firebase-admin/app"
import { getStorage, type Storage } from "firebase-admin/storage"
import { InternalError } from "@/lib/core/errors/AppError"

/**
 * Server-only Firebase Admin initialisation.
 *
 * Credentials come from a service-account key. On Vercel the private key has to
 * be pasted into a single env var, so escaped newlines (`\n`) are restored here.
 * `FIREBASE_STORAGE_BUCKET` is the bucket *name* (e.g. `my-app.firebasestorage.app`),
 * not a `gs://` URL.
 */
export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY &&
      process.env.FIREBASE_STORAGE_BUCKET
  )
}

let cachedApp: App | null = null

function getFirebaseApp(): App {
  if (cachedApp) return cachedApp

  if (!isFirebaseConfigured()) {
    throw new InternalError(
      "Firebase is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY and FIREBASE_STORAGE_BUCKET."
    )
  }

  // Reuse an existing app so Next.js dev hot-reloads don't re-initialise.
  cachedApp =
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    })

  return cachedApp
}

export function getFirebaseStorage(): Storage {
  return getStorage(getFirebaseApp())
}

export function getFirebaseBucket(): ReturnType<Storage["bucket"]> {
  return getFirebaseStorage().bucket()
}

export function getFirebaseBucketName(): string {
  return process.env.FIREBASE_STORAGE_BUCKET ?? ""
}
