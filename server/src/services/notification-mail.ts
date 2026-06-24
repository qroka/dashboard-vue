import type { FastifyBaseLogger } from 'fastify'
import type { Env } from '../config/env.js'
import { findUserById } from '../repositories/users.js'
import type { NotificationRow } from '../types/notifications.js'
import type { EventRecord } from '../types/events.js'
import { buildMailConfig, sendPlainTextMail } from './mail.js'
import {
  buildNotificationEmailSubject,
  buildNotificationEmailText,
} from './notification-email-body.js'
import { resolveNotificationEmails } from './resolve-notification-emails.js'

let mailEnv: Env | null = null
let mailLogger: Pick<FastifyBaseLogger, 'warn' | 'info'> | undefined

export function initNotificationMail(
  env: Env,
  logger?: Pick<FastifyBaseLogger, 'warn' | 'info'>,
): void {
  mailEnv = env
  mailLogger = logger

  const mailConfig = buildMailConfig(env)
  logger?.info({
    mailEnabled: env.MAIL_ENABLED,
    mailTransport: mailConfig.transport,
    crmMailPath: env.CRM_MAIL_PATH,
    sendmailPath: mailConfig.sendmailPath,
    blacklistCount: env.MAIL_BLACKLIST.split(/[,;]/).filter(s => s.trim()).length,
  }, 'notification mail configured')

  if (env.MAIL_ENABLED && mailConfig.transport === 'sendmail' && !mailConfig.sendmailPath) {
    logger?.warn(
      'MAIL_TRANSPORT=sendmail, но sendmail не найден. Установите postfix или переключите MAIL_TRANSPORT=crm',
    )
  }
}

export async function deliverNotificationEmail(
  env: Env,
  notification: NotificationRow,
  event?: Pick<EventRecord, 'id' | 'substituteSlug'> | null,
): Promise<number> {
  const config = buildMailConfig(env)
  if (!config.enabled)
    return 0

  const user = findUserById(notification.userId)
  if (!user) {
    mailLogger?.warn({ userId: notification.userId }, 'notification email skipped: user not found')
    return 0
  }

  const emails = await resolveNotificationEmails(env, user)
  if (!emails.length) {
    mailLogger?.warn({
      userId: user.id,
      login: user.login,
      externalUserId: user.externalUserId,
      localEmail: user.email,
    }, 'notification email skipped: no recipient addresses')
    return 0
  }

  const subject = buildNotificationEmailSubject(notification)
  const text = buildNotificationEmailText(env, notification, {
    recipientName: user.name,
    substituteSlug: event?.substituteSlug ?? null,
  })
  let sent = 0

  for (const email of emails) {
    const ok = await sendPlainTextMail(env, config, email, subject, text, mailLogger)
    if (ok)
      sent++
  }

  return sent
}

export function queueNotificationEmail(
  notification: NotificationRow,
  event?: Pick<EventRecord, 'id' | 'substituteSlug'> | null,
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
