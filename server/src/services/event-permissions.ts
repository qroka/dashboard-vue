import type { EventRecord } from '../types/events.js'
import type { UserAccessProfile, UserRole } from '../types/auth.js'
import { isScheduleSubstituteSlug } from '../constants/schedule-slugs.js'

/** Участник или организатор мероприятия (CRM u_id). */
export function isEventParticipant(
  profile: UserAccessProfile,
  event: Pick<EventRecord, 'participantIds' | 'organizerExternalId'>,
): boolean {
  if (profile.externalUserId == null)
    return false
  const id = profile.externalUserId
  if (event.participantIds.includes(id))
    return true
  return event.organizerExternalId === id
}

export function canViewEvent(
  profile: UserAccessProfile,
  event: Pick<EventRecord, 'hidden' | 'participantIds' | 'organizerExternalId' | 'substituteSlug'>,
): boolean {
  if (profile.role === 'admin')
    return true
  // Редактор графика видит свои скрытые мероприятия (в т.ч. только что скрыл)
  if (canEditSubstituteSlug(profile, event.substituteSlug))
    return true
  // Исполнитель (u_prem9=0, role user): скрытые не убираем из API — в UI пометка «Скрыто»
  if (profile.role === 'user')
    return true
  if (!event.hidden)
    return true
  return isEventParticipant(profile, event)
}

export function canEditSubstituteSlug(
  profile: UserAccessProfile,
  substituteSlug: string,
): boolean {
  if (profile.role === 'admin')
    return isScheduleSubstituteSlug(substituteSlug)
  if (profile.role === 'user')
    return false
  return profile.editableSubstituteSlugs.includes(substituteSlug)
}

export function canEditEvent(
  profile: UserAccessProfile,
  event: Pick<EventRecord, 'substituteSlug'>,
): boolean {
  return canEditSubstituteSlug(profile, event.substituteSlug)
}

export function filterEventsForProfile(
  profile: UserAccessProfile,
  events: EventRecord[],
): EventRecord[] {
  return events.filter(event => canViewEvent(profile, event))
}

export function roleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    admin: 'Администратор',
    manager: 'Заместитель',
    assistant: 'Помощник заместителя',
    moderator: 'Модератор',
    user: 'Исполнитель',
  }
  return labels[role]
}
