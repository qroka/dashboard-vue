import type { Env } from '../config/env.js'
import type { NotificationMeta, NotificationRow, NotificationType } from '../types/notifications.js'
import { formatNameAndPatronymic } from '../utils/format-person-name.js'

function appBaseUrl(env: Env): string {
  return env.CORS_ORIGIN.replace(/\/$/, '')
}

function formatEventTime(meta: NotificationMeta | null): string {
  if (!meta)
    return '—'
  if (meta.allDay)
    return 'весь день'
  return meta.eventTime?.trim() || '—'
}

function emailIntro(type: NotificationType): string {
  switch (type) {
    case 'event.added':
      return 'Вас пригласили на мероприятие в графике заместителей.'
    case 'event.removed':
      return 'Вы исключены из списка участников мероприятия.'
    case 'event.cancelled':
      return 'Мероприятие, в котором вы участвовали, отменено.'
    case 'event.restored':
      return 'Ранее отменённое мероприятие снова актуально.'
    case 'event.updated':
      return 'В мероприятии, в котором вы участвуете, произошли изменения.'
    case 'event.reminder':
      return 'Напоминаем: через 5 минут начнётся мероприятие.'
    default:
      return 'Уведомление о мероприятии в графике заместителей.'
  }
}

export function buildNotificationEmailSubject(notification: NotificationRow): string {
  const byType: Record<NotificationType, string> = {
    'event.added': 'Приглашение на мероприятие',
    'event.removed': 'Исключение из мероприятия',
    'event.cancelled': 'Мероприятие отменено',
    'event.restored': 'Мероприятие восстановлено',
    'event.updated': 'Изменения в мероприятии',
    'event.reminder': 'Скоро начало мероприятия',
  }

  return byType[notification.type] ?? notification.title
}

export function buildNotificationEmailText(
  env: Env,
  notification: NotificationRow,
  options: {
    recipientName?: string | null
    substituteSlug?: string | null
  },
): string {
  const meta = notification.meta
  const name = options.recipientName?.trim()
    ? formatNameAndPatronymic(options.recipientName)
    : ''
  const lines = [
    name ? `Здравствуйте, ${name}!` : 'Здравствуйте!',
    '',
    emailIntro(notification.type),
    '',
  ]

  if (meta?.eventTopic?.trim()) {
    lines.push(`Тема: «${meta.eventTopic.trim()}»`)
  }
  if (meta?.eventDate?.trim()) {
    lines.push(`Дата: ${meta.eventDate.trim()}`)
    lines.push(`Время: ${formatEventTime(meta)}`)
  }

  if (notification.type === 'event.updated' && meta?.changes?.length) {
    lines.push('')
    lines.push('Изменения:')
    for (const change of meta.changes) {
      lines.push(`  • ${change.label}: ${change.before} → ${change.after}`)
    }
  }

  const slug = options.substituteSlug?.trim()
  if (slug) {
    lines.push('')
    lines.push(`Открыть график: ${appBaseUrl(env)}/${slug}`)
  }

  lines.push(
    '',
    '---',
    'График заместителей',
    appBaseUrl(env),
    '',
    'По вопросам работы в системе обращайтесь в отдел по информатизации: 52-91-19 (1492/1493)',
    '',
  )

  return lines.join('\r\n')
}
