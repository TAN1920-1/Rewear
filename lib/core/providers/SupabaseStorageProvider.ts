import { randomUUID } from "node:crypto"
import type { IStorageProvider, StoredFile, UploadInput } from "@/lib/core/interfaces/IStorageProvider"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { InternalError } from "@/lib/core/errors/AppError"
import { FileUploadValidator } from "@/lib/core/validation/FileUploadValidator"

/**
 * Supabase Storage implementation of `IStorageProvider` (polymorphism).
 * Uses the service-role client so server-side uploads bypass RLS.
 */
export class SupabaseStorageProvider implements IStorageProvider {
  readonly name = "supabase"

  constructor(private readonly bucket: string = process.env.STORAGE_BUCKET ?? "rewear") {}

  async upload(input: UploadInput, folder = "uploads"): Promise<StoredFile> {
    const supabase = createSupabaseAdminClient()
    const extension =
      FileUploadValidator.extensionFor(input.contentType) ||
      this.safeExtension(input.filename)
    const objectPath = `${folder}/${randomUUID()}${extension}`

    const { error } = await supabase.storage
      .from(this.bucket)
      .upload(objectPath, input.data, {
        contentType: input.contentType,
        upsert: false,
      })

    if (error) {
      throw new InternalError(`Storage upload failed: ${error.message}`, { cause: error })
    }

    return {
      path: objectPath,
      publicUrl: this.getPublicUrl(objectPath),
      size: input.size,
      contentType: input.contentType,
    }
  }

  async remove(path: string): Promise<void> {
    const supabase = createSupabaseAdminClient()
    await supabase.storage.from(this.bucket).remove([path])
  }

  getPublicUrl(path: string): string {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? ""
    return `${base}/storage/v1/object/public/${this.bucket}/${path}`
  }

  private safeExtension(filename: string): string {
    const match = /\.[a-z0-9]+$/i.exec(filename)
    const ext = match?.[0]?.toLowerCase() ?? ""
    return [".jpg", ".jpeg", ".png", ".webp"].includes(ext) ? ext : ".bin"
  }
}
