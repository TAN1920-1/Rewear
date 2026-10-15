import { prisma } from "@/lib/db/prisma"

export interface CreateNotificationData {
  userId: number
  title: string
  message: string
  relatedType?: string
  relatedId?: number
}

export async function createNotification(data: CreateNotificationData) {
  return prisma.notification.create({ data })
}

export async function createNotificationsBulk(items: CreateNotificationData[]) {
  if (items.length === 0) return { count: 0 }
  return prisma.notification.createMany({ data: items })
}

export async function listNotificationsForUser(
  userId: number,
  params: { read?: boolean; page?: number; pageSize?: number } = {}
) {
  const { read, page = 1, pageSize = 20 } = params
  const where: any = { userId }
  if (typeof read === "boolean") where.read = read

  const [items, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, read: false } }),
  ])

  return {
    items,
    total,
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize),
    unreadCount,
  }
}

export async function markAsRead(userId: number, id: number) {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { read: true, readAt: new Date() },
  })
}

export async function markAllAsRead(userId: number) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true, readAt: new Date() },
  })
}

export async function getUnreadCount(userId: number) {
  return prisma.notification.count({ where: { userId, read: false } })
}
