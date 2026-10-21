import { randomUUID } from "node:crypto"
import type { IStorageProvider, StoredFile, UploadInput } from "@/lib/core/interfaces/IStorageProvider"
import { getFirebaseBucket, getFirebaseBucketName } from "@/lib/firebase/admin"
import { InternalError } from "@/lib/core/errors/AppError"
import { FileUploadValidator } from "@/lib/core/validation/FileUploadValidator"

/**
 * Firebase Cloud Storage implementation of `IStorageProvider` (polymorphism).
 * Uses the Admin SDK so server-side uploads bypass Storage security rules.
 */
export class FirebaseStorageProvider implements IStorageProvider {
  readonly name = "firebase"

  async upload(input: UploadInput, folder = "uploads"): Promise<StoredFile> {
    const extension =
      FileUploadValidator.extensionFor(input.contentType) ||
      this.safeExtension(input.filename)
    const objectPath = `${folder}/${randomUUID()}${extension}`

    // Admin SDK uploads are not given a download token automatically. Minting one
    // makes the object readable through its URL without making the bucket public.
    const token = randomUUID()

    try {
      await getFirebaseBucket().file(objectPath).save(input.data, {
        contentType: input.contentType,
        resumable: false,
        metadata: { metadata: { firebaseStorageDownloadTokens: token } },
      })
    } catch (error) {
      throw new InternalError(
        `Storage upload failed: ${error instanceof Error ? error.message : "unknown error"}`,
        { cause: error }
      )
    }

    return {
      path: objectPath,
      publicUrl: this.buildDownloadUrl(objectPath, token),
      size: input.size,
      contentType: input.contentType,
    }
  }

  async remove(path: string): Promise<void> {
    try {
      await getFirebaseBucket().file(path).delete({ ignoreNotFound: true })
    } catch {
      // Best-effort: a missing or already-deleted file is not an error.
    }
  }

  /**
   * Token-less URL. `upload()` returns a tokenised URL which is what callers
   * persist, so this only resolves if the object/bucket is publicly readable.
   */
  getPublicUrl(path: string): string {
    return this.buildDownloadUrl(path)
  }

  private buildDownloadUrl(path: string, token?: string): string {
    const base = `https://firebasestorage.googleapis.com/v0/b/${getFirebaseBucketName()}/o/${encodeURIComponent(path)}?alt=media`
    return token ? `${base}&token=${token}` : base
  }

  private safeExtension(filename: string): string {
    const match = /\.[a-z0-9]+$/i.exec(filename)
    const ext = match?.[0]?.toLowerCase() ?? ""
    return [".jpg", ".jpeg", ".png", ".webp"].includes(ext) ? ext : ".bin"
  }
}
