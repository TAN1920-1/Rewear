import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/db/prisma"

/**
 * NGO header summary (name + logo), cached for 5 minutes.
 *
 * Rendered by the admin shell on every navigation, so hitting Postgres each
 * time adds a full round-trip. NGO identity changes almost never; a future
 * settings save can bust it with `revalidateTag("ngo:<id>")`.
 */
export function getNgoSummary(ngoId: number) {
  return unstable_cache(
    async () =>
      prisma.nGO.findUnique({
        where: { id: ngoId },
        select: { id: true, name: true, logoUrl: true },
      }),
    ["ngo-summary", String(ngoId)],
    { revalidate: 300, tags: [`ngo:${ngoId}`] }
  )()
}
