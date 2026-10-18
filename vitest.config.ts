import { defineConfig } from "vitest/config"
import { fileURLToPath } from "node:url"

/**
 * Vitest configuration for the REWEAR regression suite.
 *
 * Tests run in a plain Node environment and mock every boundary (Prisma, the
 * session, the mail provider, rate limiting), so they never touch a real
 * database, send real email, or require network access.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globals: true,
  },
})
