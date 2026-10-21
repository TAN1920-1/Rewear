/**
 * Storage provider abstraction.
 *
 * OOP pillars:
 *  - Abstraction : callers depend only on `IStorageProvider`, never on
 *                  Firebase or the filesystem.
 *  - Polymorphism: `FirebaseStorageProvider` and `LocalStorageProvider` are
 *                  interchangeable at runtime (selected via `getStorageProvider`).
 */

export interface UploadInput {
  /** Raw file bytes. */
  data: Buffer
  /** Original file name (used to derive an extension). */
  filename: string
  /** Validated MIME type, e.g. `image/png`. */
  contentType: string
  /** Declared size in bytes. */
  size: number
}

export interface StoredFile {
  /** Provider-relative object path (stored in the DB). */
  path: string
  /** Fully-qualified, publicly readable URL. */
  publicUrl: string
  size: number
  contentType: string
}

export interface IStorageProvider {
  /** Human-readable provider name (for logs / diagnostics). */
  readonly name: string
  /** Persist a file and return its coordinates. */
  upload(input: UploadInput, folder?: string): Promise<StoredFile>
  /** Remove a previously stored file (best-effort). */
  remove(path: string): Promise<void>
  /** Resolve a stored path to a public URL. */
  getPublicUrl(path: string): string
}
