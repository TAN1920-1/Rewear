/**
 * CSP / reporting-endpoint sink.
 *
 * Browsers POST violation reports here (see the `Content-Security-Policy`
 * `report-uri` + `Reporting-Endpoints` headers in `next.config.mjs`). We only
 * acknowledge them — detailed payloads are never written to logs in production
 * so that no environment or user data leaks.
 */
export const runtime = "nodejs"

export async function POST() {
  return new Response(null, { status: 204 })
}

export async function GET() {
  return new Response(null, { status: 204 })
}
