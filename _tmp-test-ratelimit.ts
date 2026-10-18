
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function testRateLimitUpsert() {
  const key = "test-key-" + Date.now()
  const windowMs = 60000
  const now = Date.now()
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs)
  const expiresAt = new Date(windowStart.getTime() + windowMs)

  try {
    console.log("Attempting upsert on RateLimitEntry...")
    const entry = await prisma.rateLimitEntry.upsert({
      where: { key_windowStart: { key, windowStart } },
      create: { key, windowStart, count: 1, expiresAt },
      update: { count: { increment: 1 } },
    })
    console.log("Upsert successful:", entry)
  } catch (err) {
    console.error("Upsert failed:", err)
  } finally {
    await prisma.$disconnect()
  }
}

testRateLimitUpsert()
