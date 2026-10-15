import { randomUUID } from "node:crypto"
import { mkdir, writeFile, unlink } from "node:fs/promises"
import { join, dirname } from "node:path"
import type { IStorageProvider, StoredFile, UploadInput } from "@/lib/core/interfaces/IStorageProvider"
import { FileUploadValidator } from "@/lib/core/validation/FileUploadValidator"

/**
 * Filesystem implementation of `IStorageProvider` (polymorphism).
 * Intended as a zero-config development fallback when Supabase Storage
 * credentials are not present. Not durable, and not suitable for serverless.
 */
export class LocalStorageProvider implements IStorageProvider {
  readonly name = "local"

  constructor(private readonly rootDir: string = join(process.cwd(), "public", "uploads")) {}

  async upload(input: UploadInput, folder = "uploads"): Promise<StoredFile> {
    const extension =
      FileUploadValidator.extensionFor(input.contentType) ||
      ".bin"
    const relativePath = `${folder}/${randomUUID()}${extension}`
    const absolutePath = join(this.rootDir, relativePath)

    await mkdir(dirname(absolutePath), { recursive: true })
    await writeFile(absolutePath, input.data)

    return {
      path: relativePath,
      publicUrl: this.getPublicUrl(relativePath),
      size: input.size,
      contentType: input.contentType,
    }
  }

  async remove(path: string): Promise<void> {
    try {
      await unlink(join(this.rootDir, path))
    } catch {
      // Best-effort: a missing file is not an error.
    }
  }

  getPublicUrl(path: string): string {
    return `/uploads/${path}`
  }
}
