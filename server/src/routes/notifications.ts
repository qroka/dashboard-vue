import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import {
  countUnreadNotifications,
  listNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
} from '../repositories/notifications.js'
import { syncUserFromDb } from '../utils/auth-user.js'

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  unreadOnly: z.coerce.boolean().optional(),
})

export const notificationsRoutes: FastifyPluginAsync = async app => {
  app.get(
    '/notifications',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = syncUserFromDb(request)
      if (!user) {
        return reply.status(401).send({ success: false, error: 'Unauthorized' })
      }

      const parsed = listQuerySchema.safeParse(request.query)
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid query',
          details: parsed.error.flatten(),
        })
      }

      const { total, items } = listNotificationsForUser(user.userId, parsed.data)
      const unread = countUnreadNotifications(user.userId)

      return {
        success: true,
        total,
        unread,
        items,
      }
    },
  )

  app.post(
    '/notifications/read-all',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = syncUserFromDb(request)
      if (!user) {
        return reply.status(401).send({ success: false, error: 'Unauthorized' })
      }

      const updated = markAllNotificationsRead(user.userId)
      return { success: true, updated }
    },
  )

  app.post(
    '/notifications/:id/read',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = syncUserFromDb(request)
      if (!user) {
        return reply.status(401).send({ success: false, error: 'Unauthorized' })
      }

      const id = Number((request.params as { id: string }).id)
      if (!Number.isFinite(id)) {
        return reply.status(400).send({ success: false, error: 'Invalid id' })
      }

      const ok = markNotificationRead(id, user.userId)
      if (!ok) {
        return reply.status(404).send({ success: false, error: 'Notification not found' })
      }

      return { success: true }
    },
  )
}
