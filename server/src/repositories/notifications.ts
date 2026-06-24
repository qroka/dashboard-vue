import { getDb } from '../db/sqlite.js'
import { sqliteDatetimeToIso } from '../utils/sqlite-datetime.js'
import type {
  NotificationMeta,
  NotificationRow,
  NotificationType,
} from '../types/notifications.js'

function parseMeta(json: string | null): NotificationMeta | null {
  if (!json)
    return null
  try {
    return JSON.parse(json) as NotificationMeta
  } catch {
    return null
  }
}

function mapRow(row: {
  id: number
  user_id: number
  type: string
  title: string
  body: string
  event_id: number | null
  meta_json: string | null
  read_at: string | null
  created_at: string
}): NotificationRow {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as NotificationType,
    title: row.title,
    body: row.body,
    eventId: row.event_id,
    meta: parseMeta(row.meta_json),
    readAt: sqliteDatetimeToIso(row.read_at),
    createdAt: sqliteDatetimeToIso(row.created_at) ?? row.created_at,
  }
}

export interface CreateNotificationInput {
  userId: number
  type: NotificationType
  title: string
  body: string
  eventId?: number | null
  meta?: NotificationMeta | null
}

export function createNotification(input: CreateNotificationInput): NotificationRow {
  const result = getDb()
    .prepare(
      `INSERT INTO notifications (user_id, type, title, body, event_id, meta_json)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.userId,
      input.type,
      input.title,
      input.body,
      input.eventId ?? null,
      input.meta ? JSON.stringify(input.meta) : null,
    )

  return getNotificationById(Number(result.lastInsertRowid))!
}

export function getNotificationById(id: number): NotificationRow | null {
  const row = getDb()
    .prepare('SELECT * FROM notifications WHERE id = ?')
    .get(id) as Parameters<typeof mapRow>[0] | undefined
  return row ? mapRow(row) : null
}

export function listNotificationsForUser(
  userId: number,
  options?: { limit?: number; offset?: number; unreadOnly?: boolean },
): { total: number; items: NotificationRow[] } {
  const clauses = ['user_id = ?']
  const params: unknown[] = [userId]

  if (options?.unreadOnly) {
    clauses.push('read_at IS NULL')
  }

  const where = `WHERE ${clauses.join(' AND ')}`
  const db = getDb()

  const total = (
    db.prepare(`SELECT COUNT(*) AS c FROM notifications ${where}`).get(...params) as { c: number }
  ).c

  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100)
  const offset = Math.max(options?.offset ?? 0, 0)

  const rows = db
    .prepare(
      `SELECT * FROM notifications ${where}
       ORDER BY datetime(created_at) DESC, id DESC
       LIMIT ? OFFSET ?`,
    )
    .all(...params, limit, offset) as Parameters<typeof mapRow>[0][]

  return { total, items: rows.map(mapRow) }
}

export function countUnreadNotifications(userId: number): number {
  return (
    getDb()
      .prepare('SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND read_at IS NULL')
      .get(userId) as { c: number }
  ).c
}

export function markNotificationRead(id: number, userId: number): boolean {
  const result = getDb()
    .prepare(
      `UPDATE notifications SET read_at = datetime('now')
       WHERE id = ? AND user_id = ? AND read_at IS NULL`,
    )
    .run(id, userId)
  return result.changes > 0
}

export function markAllNotificationsRead(userId: number): number {
  const result = getDb()
    .prepare(
      `UPDATE notifications SET read_at = datetime('now')
       WHERE user_id = ? AND read_at IS NULL`,
    )
    .run(userId)
  return result.changes
}

export function wasReminderSent(eventId: number, externalUserId: number): boolean {
  const row = getDb()
    .prepare(
      `SELECT 1 FROM event_reminder_sent
       WHERE event_id = ? AND external_user_id = ?`,
    )
    .get(eventId, externalUserId)
  return Boolean(row)
}

export function markReminderSent(eventId: number, externalUserId: number): void {
  getDb()
    .prepare(
      `INSERT OR IGNORE INTO event_reminder_sent (event_id, external_user_id)
       VALUES (?, ?)`,
    )
    .run(eventId, externalUserId)
}
