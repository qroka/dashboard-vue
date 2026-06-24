import type { FastifyBaseLogger } from 'fastify'
import type { Env } from '../config/env.js'
import { findUserById } from '../repositories/users.js'
import type { NotificationRow } from '../types/notifications.js'
import type { EventRecord } from '../types/events.js'
import { parseEmailAddresses } from '../utils/parse-emails.js'
import { buildMailConfig, sendPlainTextMail } from './mail.js'

let mailEnv: Env | null = null
let mailLogger: Pick<FastifyBaseLogger, 'warn' | 'info'> | undefined

export function initNotificationMail(
  env: Env,
  logger?: Pick<FastifyBaseLogger, 'warn' | 'info'>,
): void {
  mailEnv = env
  mailLogger = logger
}

function appBaseUrl(env: Env): string {
  return env.CORS_ORIGIN.replace(/\/$/, '')
}

function buildNotificationEmailText(
  env: Env,
  notification: NotificationRow,
  event?: Pick<EventRecord, 'substituteSlug'> | null,
): string {
  const lines = [notification.body]

  if (event?.substituteSlug) {
    lines.push('')
    lines.push(`График: ${appBaseUrl(env)}/${event.substituteSlug}`)
  }

  lines.push('')
  lines.push(appBaseUrl(env))

  return lines.join('\r\n')
}

export async function deliverNotificationEmail(
  env: Env,
  notification: NotificationRow,
  event?: Pick<EventRecord, 'substituteSlug'> | null,
): Promise<number> {
  const user = findUserById(notification.userId)
  if (!user)
    return 0

  const emails = parseEmailAddresses(user.email)
  if (!emails.length)
    return 0

  const config = buildMailConfig(env)
  if (!config.enabled)
    return 0

  const subject = notification.title
  const text = buildNotificationEmailText(env, notification, event)
  let sent = 0

  for (const email of emails) {
    const ok = await sendPlainTextMail(config, email, subject, text, mailLogger)
    if (ok)
      sent++
  }

  return sent
}

export function queueNotificationEmail(
  notification: NotificationRow,
  event?: Pick<EventRecord, 'substituteSlug'> | null,
): void {
  if (!mailEnv?.MAIL_ENABLED)
    return

  void deliverNotificationEmail(mailEnv, notification, event)
    .then((count) => {
      if (count > 0) {
        mailLogger?.info(
          { notificationId: notification.id, userId: notification.userId, count },
          'notification email sent',
        )
      }
    })
    .catch((err) => {
      mailLogger?.warn(
        { err, notificationId: notification.id },
        'notification email failed',
      )
    })
}
