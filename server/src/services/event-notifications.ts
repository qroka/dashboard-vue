import type { EventLogChange } from './event-activity-meta.js'
import type { EventRecord } from '../types/events.js'
import type { NotificationMeta } from '../types/notifications.js'
import { createNotification } from '../repositories/notifications.js'
import { findUserIdsByExternalIds } from '../repositories/users.js'
import { queueNotificationEmail } from './notification-mail.js'

function eventWhenLabel(event: EventRecord): string {
  const time = event.allDay ? 'весь день' : event.time
  return `${event.eventDate}, ${time}`
}

function eventMeta(event: EventRecord, changes?: EventLogChange[]): NotificationMeta {
  return {
    eventTopic: event.topic,
    eventDate: event.eventDate,
    eventTime: event.time,
    allDay: event.allDay,
    changes: changes?.map(c => ({
      label: c.label,
      before: c.before,
      after: c.after,
    })),
  }
}

function formatChangesBody(changes: EventLogChange[]): string {
  if (!changes.length)
    return ''
  return changes
    .map(c => `${c.label}: ${c.before} → ${c.after}`)
    .join('\n')
}

function notifyExternalUsers(
  externalIds: number[],
  options: {
    excludeExternalUserId?: number | null
    type: 'event.added' | 'event.removed' | 'event.cancelled' | 'event.updated' | 'event.reminder'
    title: string
    body: string
    event: EventRecord
    changes?: EventLogChange[]
    eventId?: number | null
  },
): number {
  const userIds = findUserIdsByExternalIds(externalIds)
  let notified = 0

  for (const externalId of externalIds) {
    if (options.excludeExternalUserId != null && externalId === options.excludeExternalUserId)
      continue

    const userId = userIds.get(externalId)
    if (!userId)
      continue

    const eventId = options.eventId !== undefined
      ? options.eventId
      : options.event.id

    const notification = createNotification({
      userId,
      type: options.type,
      title: options.title,
      body: options.body,
      eventId,
      meta: eventMeta(options.event, options.changes),
    })
    queueNotificationEmail(notification, options.event)
    notified++
  }

  return notified
}

export function notifyParticipantsAdded(
  event: EventRecord,
  addedExternalIds: number[],
): void {
  if (!addedExternalIds.length)
    return

  const when = eventWhenLabel(event)
  notifyExternalUsers(addedExternalIds, {
    type: 'event.added',
    title: 'Вас включили в мероприятие',
    body: `«${event.topic}»\n${when}`,
    event,
  })
}

export function notifyParticipantsRemoved(
  event: EventRecord,
  removedExternalIds: number[],
): void {
  if (!removedExternalIds.length)
    return

  const when = eventWhenLabel(event)
  notifyExternalUsers(removedExternalIds, {
    type: 'event.removed',
    title: 'Вас исключили из мероприятия',
    body: `«${event.topic}»\n${when}`,
    event,
  })
}

export function collectEventCancelRecipients(event: EventRecord): number[] {
  return [
    ...new Set([
      ...event.participantIds,
      ...(event.creatorExternalId ? [event.creatorExternalId] : []),
    ]),
  ]
}

export function notifyEventCancelled(
  event: EventRecord,
  participantExternalIds: number[],
): number {
  if (!participantExternalIds.length)
    return 0

  const when = eventWhenLabel(event)
  return notifyExternalUsers(participantExternalIds, {
    type: 'event.cancelled',
    title: 'Мероприятие отменено',
    body: `«${event.topic}»\n${when}`,
    event,
    // Событие удаляется — не привязываем уведомление к event_id (FK + ON DELETE SET NULL).
    eventId: null,
  })
}

export function notifyEventUpdated(
  event: EventRecord,
  changes: EventLogChange[],
  participantExternalIds: number[],
): void {
  if (!participantExternalIds.length || !changes.length)
    return

  const when = eventWhenLabel(event)
  const changesBody = formatChangesBody(changes)
  notifyExternalUsers(participantExternalIds, {
    type: 'event.updated',
    title: 'Изменения в мероприятии',
    body: `«${event.topic}»\n${when}\n\n${changesBody}`,
    event,
    changes,
  })
}

export function notifyEventReminder(
  event: EventRecord,
  participantExternalIds: number[],
): void {
  if (!participantExternalIds.length)
    return

  const when = eventWhenLabel(event)
  notifyExternalUsers(participantExternalIds, {
    type: 'event.reminder',
    title: 'Скоро начало мероприятия',
    body: `Через 5 минут: «${event.topic}»\n${when}`,
    event,
  })
}

export function diffParticipantIds(before: number[], after: number[]): {
  added: number[]
  removed: number[]
} {
  const beforeSet = new Set(before)
  const afterSet = new Set(after)
  return {
    added: after.filter(id => !beforeSet.has(id)),
    removed: before.filter(id => !afterSet.has(id)),
  }
}
