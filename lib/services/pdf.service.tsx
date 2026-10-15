import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  renderToBuffer,
} from "@react-pdf/renderer"
import type { NGO, Donation, DonationItem, User, ClothingCategory } from "@prisma/client"

export interface ReceiptData {
  donation: Donation & {
    items: (DonationItem & { category: ClothingCategory | null })[]
  }
  ngo: NGO
  donor: Pick<User, "id" | "name" | "email" | "phone"> | null
  receiptNo: string
  generatedAt: Date
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    color: "#0f172a",
    fontSize: 11,
    lineHeight: 1.45,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: "1px solid #e2e8f0",
  },
  ngoBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: "#d1fae5",
    alignItems: "center",
    justifyContent: "center",
  },
  accentBar: {
    width: 42,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10b981",
    marginTop: 6,
  },
  ngoName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#065f46",
  },
  ngoTagline: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 2,
  },
  ngoMeta: {
    fontSize: 9.5,
    color: "#475569",
    marginTop: 8,
    gap: 2,
  },
  receiptMeta: {
    textAlign: "right",
    gap: 3,
  },
  receiptLabel: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f766e",
  },
  receiptNo: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginTop: 4,
  },
  metaLine: {
    fontSize: 9.5,
    color: "#64748b",
  },
  sectionTitle: {
    fontSize: 10.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#0f766e",
    marginBottom: 10,
    marginTop: 4,
  },
  card: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    border: "1px solid #e2e8f0",
  },
  twoCol: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 14,
  },
  col50: {
    width: "50%",
  },
  label: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: "#94a3b8",
    marginBottom: 3,
  },
  value: {
    fontSize: 11,
    color: "#0f172a",
  },
  valueBold: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  table: {
    width: "100%",
    marginTop: 4,
  },
  tableHeadRow: {
    flexDirection: "row",
    backgroundColor: "#10b981",
    color: "#ffffff",
    borderRadius: 8,
    overflow: "hidden",
  },
  tableHeadCell: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableBodyRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableCell: {
    fontSize: 10.5,
    color: "#334155",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    gap: 16,
  },
  totalLabel: {
    fontSize: 11,
    color: "#475569",
    textAlign: "right",
    width: 180,
  },
  totalValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#0f766e",
    textAlign: "right",
    width: 120,
  },
  footer: {
    marginTop: 32,
    paddingTop: 16,
    borderTop: "1px solid #e2e8f0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  thanks: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#065f46",
  },
  thanksSub: {
    fontSize: 10,
    color: "#475569",
    marginTop: 3,
  },
  sigBox: {
    textAlign: "right",
    gap: 4,
  },
  sigLine: {
    width: 160,
    borderTop: "1px solid #94a3b8",
    paddingTop: 6,
    marginLeft: "auto",
  },
  sigText: {
    fontSize: 10,
    color: "#475569",
  },
})

function ReceiptDocument({ data }: { data: ReceiptData }) {
  const { donation, ngo, donor, receiptNo, generatedAt } = data

  const accent = ngo.receiptColor ?? "#10b981"

  const totalItems = donation.items.reduce(
    (sum, it) => sum + it.quantity,
    0
  )

  return (
    <Document
      author={ngo.name}
      title={`Donation Receipt ${donation.donationId}`}
      subject="Thank you for your donation"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.ngoBlock}>
            <View
              style={{
                ...styles.logoBox,
                backgroundColor: `${accent}22`,
              }}
            >
              {ngo.logoUrl ? (
                // eslint-disable-next-line jsx-a11y/alt-text
                <Image
                  src={ngo.logoUrl}
                  style={{ width: 44, height: 44, borderRadius: 10 }}
                />
              ) : (
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: accent,
                  }}
                >
                  {ngo.name.slice(0, 1).toUpperCase()}
                </Text>
              )}
            </View>
            <View>
              <Text style={styles.ngoName}>{ngo.name}</Text>
              {ngo.tagline && <Text style={styles.ngoTagline}>{ngo.tagline}</Text>}
              <View
                style={{
                  ...styles.accentBar,
                  backgroundColor: accent,
                }}
              />
            </View>
          </View>
          <View style={styles.receiptMeta}>
            <Text style={styles.receiptLabel}>DONATION RECEIPT</Text>
            <Text style={styles.receiptNo}>{receiptNo}</Text>
            <Text style={styles.metaLine}>
              Issued: {generatedAt.toLocaleDateString()}
            </Text>
            <Text style={styles.metaLine}>Donation: {donation.donationId}</Text>
          </View>
        </View>

        <View style={{ ...styles.ngoMeta, marginBottom: 16 }}>
          {ngo.address && <Text>{ngo.address}</Text>}
          <Text>
            {[ngo.email, ngo.phone, ngo.website].filter(Boolean).join("  \u00B7  ")}
          </Text>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.col50}>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Donor Information</Text>
              <Text style={styles.label}>Full Name</Text>
              <Text style={styles.valueBold}>{donor?.name ?? donation.donorName}</Text>
              <Text style={{ ...styles.label, marginTop: 8 }}>Email</Text>
              <Text style={styles.value}>{donor?.email ?? donation.donorEmail}</Text>
              {(donor?.phone ?? donation.donorPhone) && (
                <>
                  <Text style={{ ...styles.label, marginTop: 8 }}>Phone</Text>
                  <Text style={styles.value}>
                    {donor?.phone ?? donation.donorPhone}
                  </Text>
                </>
              )}
            </View>
          </View>
          <View style={styles.col50}>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Donation Summary</Text>
              <Text style={styles.label}>Tracking ID</Text>
              <Text style={styles.valueBold}>{donation.donationId}</Text>
              <Text style={{ ...styles.label, marginTop: 8 }}>Submitted</Text>
              <Text style={styles.value}>
                {new Date(donation.createdAt).toLocaleDateString()}
              </Text>
              <Text style={{ ...styles.label, marginTop: 8 }}>Current Status</Text>
              <Text
                style={{
                  ...styles.valueBold,
                  color: accent,
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                }}
              >
                {donation.currentStatus.replace(/_/g, " ")}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Donated Items</Text>
          <View style={styles.table}>
            <View style={styles.tableHeadRow}>
              <Text style={{ ...styles.tableHeadCell, width: "10%" }}>#</Text>
              <Text style={{ ...styles.tableHeadCell, width: "42%" }}>
                Category
              </Text>
              <Text style={{ ...styles.tableHeadCell, width: "18%" }}>
                Size
              </Text>
              <Text style={{ ...styles.tableHeadCell, width: "15%" }}>
                Cond.
              </Text>
              <Text style={{ ...styles.tableHeadCell, width: "15%", textAlign: "right" }}>
                Qty
              </Text>
            </View>
            {donation.items.map((it, i) => (
              <View key={it.id} style={styles.tableBodyRow}>
                <Text style={{ ...styles.tableCell, width: "10%" }}>{i + 1}</Text>
                <Text style={{ ...styles.tableCell, width: "42%", fontWeight: "bold" }}>
                  {it.category?.name ?? `Category #${it.categoryId}`}
                </Text>
                <Text style={{ ...styles.tableCell, width: "18%" }}>
                  {it.size ?? "\u2014"}
                </Text>
                <Text style={{ ...styles.tableCell, width: "15%" }}>
                  {(it.condition ?? "").replace(/_/g, " ").toLowerCase()}
                </Text>
                <Text
                  style={{
                    ...styles.tableCell,
                    width: "15%",
                    textAlign: "right",
                    fontFamily: "Helvetica-Bold",
                  }}
                >
                  {it.quantity}
                </Text>
              </View>
            ))}
            {donation.items.length === 0 && (
              <View style={styles.tableBodyRow}>
                <Text style={{ ...styles.tableCell, width: "100%", color: "#94a3b8" }}>
                  No itemized details for this donation.
                </Text>
              </View>
            )}
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalLabel}>Total Items Donated</Text>
            <Text style={styles.totalValue}>{totalItems} items</Text>
          </View>
        </View>

        {donation.notes && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Donor Notes</Text>
            <Text style={styles.value}>{donation.notes}</Text>
          </View>
        )}

        {donation.pickupAddress && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Pickup Address</Text>
            <Text style={styles.value}>{donation.pickupAddress}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <View>
            <Text style={styles.thanks}>Thank you for your generosity!</Text>
            <Text style={styles.thanksSub}>
              Every item helps someone in need rebuild and thrive.
            </Text>
            <Text style={{ ...styles.thanksSub, marginTop: 6 }}>
              This receipt was generated automatically. No signature required.
            </Text>
          </View>
          <View style={styles.sigBox}>
            <View style={styles.sigLine} />
            <Text style={styles.sigText}>
              On behalf of {ngo.name}
            </Text>
            <Text
              style={{
                ...styles.sigText,
                color: accent,
                fontFamily: "Helvetica-Bold",
              }}
            >
              &mdash; REWEAR Platform
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}

export async function generateDonationReceiptPDF(data: ReceiptData): Promise<Buffer> {
  const buffer = await renderToBuffer(<ReceiptDocument data={data} />)
  return Buffer.from(buffer)
}

export function buildReceiptNumber(
  donationId: string,
  seq: number
): string {
  const yyyy = new Date().getFullYear()
  return `RCP-${yyyy}-${String(seq).padStart(6, "0")} / ${donationId}`
}
