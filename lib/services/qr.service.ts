import QRCode from "qrcode"

export async function generateQRDataURL(text: string, size = 256): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: size,
      margin: 2,
      color: {
        dark: "#0f766e",
        light: "#ffffff",
      },
    })
  } catch (e) {
    console.error("QR generate error", e)
    return ""
  }
}

export async function generateQRSVG(text: string, size = 256): Promise<string> {
  try {
    return await QRCode.toString(text, {
      type: "svg",
      width: size,
      margin: 2,
      color: {
        dark: "#0f766e",
        light: "#ffffff",
      },
    })
  } catch (e) {
    console.error("QR SVG generate error", e)
    return ""
  }
}

export function buildDonationTrackingUrl(donationId: string, siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "") {
  // If siteUrl is empty, return a relative path which works for in-app links
  if (!siteUrl) return `/track?don=${encodeURIComponent(donationId)}`
  return `${siteUrl.replace(/\/$/, "")}/track?don=${encodeURIComponent(donationId)}`
}

export function buildInventoryBatchUrl(batchId: string, siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "") {
  if (!siteUrl) return `/admin/inventory?batch=${encodeURIComponent(batchId)}`
  return `${siteUrl.replace(/\/$/, "")}/admin/inventory?batch=${encodeURIComponent(batchId)}`
}
