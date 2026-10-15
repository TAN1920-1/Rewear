import {
  Package,
  Plus,
  AlertTriangle,
  AlertCircle,
  Search,
} from "lucide-react"
import { requireRole } from "@/lib/auth/guards"
import { prisma } from "@/lib/db/prisma"
import { UserRole, InventoryStatus } from "@/lib/enums"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const inventoryStatusColors: Record<string, string> = {
  IN_STOCK: "bg-emerald-100 text-emerald-700 border-emerald-200",
  LOW_STOCK: "bg-amber-100 text-amber-700 border-amber-200",
  OUT_OF_STOCK: "bg-rose-100 text-rose-700 border-rose-200",
  RESERVED: "bg-blue-100 text-blue-700 border-blue-200",
}

export default async function AdminInventoryPage() {
  const user = await requireRole(UserRole.NGO_ADMIN, UserRole.NGO_STAFF)
  const ngoId = user.ngoId!

  const [inventoryItems, counts] = await Promise.all([
    prisma.inventoryItem.findMany({
      where: { ngoId },
      orderBy: [{ status: "asc" }, { availableQty: "asc" }],
      include: { category: { select: { name: true, defaultReorderThreshold: true } } },
      take: 200,
    }),
    {
      total: prisma.inventoryItem.count({ where: { ngoId } }),
      inStock: prisma.inventoryItem.count({
        where: { ngoId, status: InventoryStatus.IN_STOCK },
      }),
      lowStock: prisma.inventoryItem.count({
        where: { ngoId, status: InventoryStatus.LOW_STOCK },
      }),
      outOfStock: prisma.inventoryItem.count({
        where: { ngoId, status: InventoryStatus.OUT_OF_STOCK },
      }),
    },
  ])

  const totalAvailableQty = inventoryItems.reduce((sum, i) => sum + i.availableQty, 0)
  const totalReservedQty = inventoryItems.reduce((sum, i) => sum + i.reservedQty, 0)
  const totalDistributedQty = inventoryItems.reduce((sum, i) => sum + i.distributedQty, 0)

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border-white/50 bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-yellow-500/15 p-6 shadow-lg backdrop-blur-xl sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-400/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-orange-400/30 blur-3xl" />
        <div className="relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Inventory Management
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Track clothing stock, levels, and locations.
              </p>
            </div>
          </div>
          <Button className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass border-white/50">
          <CardContent className="p-5">
            <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-slate-500 to-slate-600 mb-3" />
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Total SKUs
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {counts.total}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {totalAvailableQty.toLocaleString()} units available
            </p>
          </CardContent>
        </Card>
        <Card className="glass border-white/50">
          <CardContent className="p-5">
            <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 mb-3" />
            <p className="text-xs uppercase tracking-wider text-slate-500">
              In Stock
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {counts.inStock}
            </p>
            <p className="mt-1 text-xs text-emerald-600">Healthy levels</p>
          </CardContent>
        </Card>
        <Card className="glass border-white/50">
          <CardContent className="p-5">
            <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 mb-3" />
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Low Stock
              </p>
            </div>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {counts.lowStock}
            </p>
            <p className="mt-1 text-xs text-amber-600">Needs restock soon</p>
          </CardContent>
        </Card>
        <Card className="glass border-white/50">
          <CardContent className="p-5">
            <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 mb-3" />
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600" />
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Out of Stock
              </p>
            </div>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {counts.outOfStock}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {totalReservedQty} reserved · {totalDistributedQty} distributed
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass border-white/50 shadow-lg">
        <CardHeader className="flex flex-col gap-4 space-y-0 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">
              Inventory Items
            </CardTitle>
            <p className="text-xs text-slate-500">
              {inventoryItems.length} items · sorted by priority
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search inventory..."
                className="pl-9 w-64 bg-white/70 border-white/50"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-white/40">
                  <TableHead className="font-semibold text-slate-700">
                    Item Name
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Category
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Size
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Condition
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">
                    Available
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">
                    Reserved
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">
                    Distributed
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-12 text-center text-slate-500"
                    >
                      No inventory items yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  inventoryItems.map((item) => {
                    const needsReorder =
                      item.status === InventoryStatus.LOW_STOCK ||
                      item.status === InventoryStatus.OUT_OF_STOCK
                    return (
                      <TableRow
                        key={item.id}
                        className={`border-white/40 hover:bg-white/50 ${
                          needsReorder ? "bg-amber-50/40" : ""
                        }`}
                      >
                        <TableCell className="font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-slate-400">
                              #{item.id}
                            </span>
                            <span>
                              {item.batchId ?? `BATCH-${item.id}`}
                            </span>
                            {needsReorder && (
                              <Badge
                                variant="outline"
                                className="border-amber-300 bg-amber-50 text-amber-700 text-[10px] py-0"
                              >
                                Reorder
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-700">
                          {item.category.name}
                        </TableCell>
                        <TableCell className="text-slate-700">
                          {item.size ?? <span className="text-slate-400">—</span>}
                        </TableCell>
                        <TableCell className="text-slate-700">
                          {item.condition.replace("_", " ")}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-slate-900">
                          {item.availableQty}
                        </TableCell>
                        <TableCell className="text-right text-slate-600">
                          {item.reservedQty}
                        </TableCell>
                        <TableCell className="text-right text-slate-600">
                          {item.distributedQty}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`border ${inventoryStatusColors[item.status] ?? ""}`}
                          >
                            {item.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
