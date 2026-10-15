import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(input: Date | string | number, opts: Intl.DateTimeFormatOptions = {}) {
  const d = typeof input === "string" || typeof input === "number" ? new Date(input) : input
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...opts,
  })
}

export function formatDateTime(input: Date | string | number) {
  const d = typeof input === "string" || typeof input === "number" ? new Date(input) : input
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount)
}

export function pad(n: number, len = 6) {
  return String(n).padStart(len, "0")
}

export function generateDonationId(seq: number, year = new Date().getFullYear()) {
  return `DON-${year}-${pad(seq, 6)}`
}

export function generateBatchId(prefix = "BATCH", seq: number, year = new Date().getFullYear()) {
  return `${prefix}-${year}-${pad(seq, 5)}`
}

export function generateBeneficiaryGroupId(seq: number) {
  return `BEN-GROUP-${pad(seq, 3)}`
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}
