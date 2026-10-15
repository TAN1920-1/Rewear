import { NextResponse, type NextRequest } from "next/server"
import { auth } from "@/lib/auth/auth"
import { AuthError, ValidationError, toAppError } from "@/lib/core/errors/AppError"
import { enforceRateLimit } from "@/lib/core/rate-limit"
import { getStorageProvider } from "@/lib/core/storage"
import { FileUploadValidator, IMAGE_UPLOAD_POLICY } from "@/lib/core/validation/FileUploadValidator"

// Node runtime: the Supabase admin SDK and fs-based fallback both need it.
export const runtime = "nodejs"

const validator = new FileUploadValidator(IMAGE_UPLOAD_POLICY)
const MAX_UPLOADS_PER_MINUTE = 20

/**
 * Authenticated image upload endpoint.
 *
 * Security: requires a session, is rate-limited per user, validates size,
 * declared type AND real content (magic bytes) before persisting. The file
 * is written via the injected `IStorageProvider`, so the storage backend is
 * swappable without touching this route.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) throw new AuthError()

    await enforceRateLimit(`upload:${session.user.id}`, MAX_UPLOADS_PER_MINUTE, 60_000)

    const form = await request.formData()
    const file = form.get("file")
    if (!(file instanceof File)) {
      throw new ValidationError("No file was provided in the 'file' field.")
    }

    const folder =
      String(form.get("folder") ?? "uploads")
        .replace(/[^a-zA-Z0-9/_-]/g, "")
        .slice(0, 64) || "uploads"

    const data = Buffer.from(await file.arrayBuffer())
    validator.validate({
      contentType: file.type,
      size: file.size,
      data,
      filename: file.name,
    })

    const stored = await getStorageProvider().upload(
      { data, filename: file.name, contentType: file.type, size: file.size },
      folder
    )

    return NextResponse.json({ ok: true, file: stored }, { status: 201 })
  } catch (error) {
    const appError = toAppError(error)
    return NextResponse.json(appError.toJSON(), { status: appError.statusCode })
  }
}
