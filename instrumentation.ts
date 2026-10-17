/**
 * Next.js instrumentation hook — runs once when the server boots.
 *
 * Warms the Prisma connection pool so the very first user request doesn't
 * pay the Supabase pooler handshake (~1–2s). Node runtime only.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { prisma } = await import("@/lib/db/prisma")
      await prisma.$connect()
      await prisma.$queryRaw`SELECT 1`
    } catch {
      // Non-fatal: the app still connects lazily on first query.
    }
  }
}
