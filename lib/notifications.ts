import { Prisma } from '@prisma/client'
import { prisma } from './prisma'

export async function createNotification(
  userId: string,
  title: string,
  message: string | null = null,
  link: string | null = null,
  metadata: Prisma.JsonValue | null = null
) {
  return prisma.notification.create({
    data: {
      userId,
      title,
      message,
      link,
      metadata,
      read: false,
    },
  })
}

export async function createNotifications(
  userIds: string[],
  title: string,
  message: string | null = null,
  link: string | null = null,
  metadata: Prisma.JsonValue | null = null
) {
  if (userIds.length === 0) return null
  return prisma.notification.createMany({
    data: userIds.map(userId => ({
      userId,
      title,
      message,
      link,
      metadata,
      read: false,
    })),
  })
}
