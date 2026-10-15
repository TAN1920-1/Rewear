import { ValidationError, PayloadTooLargeError, UnsupportedMediaTypeError } from "@/lib/core/errors/AppError"

export interface FileUploadPolicy {
  maxBytes: number
  /** Declared MIME types accepted. */
  allowedTypes: readonly string[]
  /** Neutralised extensions for the stored object. */
  allowedExtensions: readonly string[]
}

/** Shared policy for clothing photos / NGO logos. */
export const IMAGE_UPLOAD_POLICY: FileUploadPolicy = {
  maxBytes: 5 * 1024 * 1024, // 5 MB
  allowedTypes: ["image/jpeg", "image/png", "image/webp"],
  allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"],
}

export interface UploadCandidate {
  contentType: string
  size: number
  data: Buffer
  filename: string
}

/**
 * Validates an upload against a policy.
 *
 * Encapsulation: the validation rules live in one place; callers only get a
 * pass/fail plus a canonical, safe extension. Magic-byte sniffing defends
 * against spoofed `Content-Type` headers (never trust client metadata).
 */
export class FileUploadValidator {
  constructor(private readonly policy: FileUploadPolicy) {}

  /** Throws a typed `AppError` when the candidate is unacceptable. */
  validate(candidate: UploadCandidate): { extension: string; mime: string } {
    if (candidate.size <= 0 || candidate.data.length === 0) {
      throw new ValidationError("The uploaded file is empty.")
    }
    if (candidate.size > this.policy.maxBytes) {
      throw new PayloadTooLargeError(
        `File exceeds the ${Math.round(this.policy.maxBytes / (1024 * 1024))} MB limit.`
      )
    }
    if (!this.policy.allowedTypes.includes(candidate.contentType)) {
      throw new UnsupportedMediaTypeError(
        `Unsupported file type "${candidate.contentType}". Allowed: ${this.policy.allowedTypes.join(", ")}.`
      )
    }

    const sniffed = FileUploadValidator.sniffImageMime(candidate.data)
    if (!sniffed || sniffed !== candidate.contentType) {
      throw new UnsupportedMediaTypeError(
        "File content does not match its declared image type."
      )
    }

    return { extension: FileUploadValidator.extensionFor(sniffed), mime: sniffed }
  }

  /** Detect the real image type from magic bytes (never trust the header). */
  static sniffImageMime(data: Buffer): string | null {
    if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
      return "image/jpeg"
    }
    if (
      data.length >= 8 &&
      data[0] === 0x89 &&
      data[1] === 0x50 &&
      data[2] === 0x4e &&
      data[3] === 0x47 &&
      data[4] === 0x0d &&
      data[5] === 0x0a &&
      data[6] === 0x1a &&
      data[7] === 0x0a
    ) {
      return "image/png"
    }
    if (
      data.length >= 12 &&
      data.toString("ascii", 0, 4) === "RIFF" &&
      data.toString("ascii", 8, 12) === "WEBP"
    ) {
      return "image/webp"
    }
    return null
  }

  static extensionFor(mime: string): string {
    switch (mime) {
      case "image/jpeg":
        return ".jpg"
      case "image/png":
        return ".png"
      case "image/webp":
        return ".webp"
      default:
        return ""
    }
  }
}
