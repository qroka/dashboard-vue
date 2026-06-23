import type { EventRecord } from '../types/events.js'
import type { CrmParticipant } from '../types/crm.js'
import type { UserAccessProfile } from '../types/auth.js'
import { shouldRedactHiddenEvent } from '../services/event-permissions.js'

export type EnrichedEvent = EventRecord & {
  participants?: CrmParticipant[]
  creator?: CrmParticipant | null
  viewRestricted?: boolean
}

export function applyEventVisibilityForProfile(
  event: EnrichedEvent,
  profile: UserAccessProfile,
): EnrichedEvent {
  if (!shouldRedactHiddenEvent(profile, event))
    return event

  const detail = {
    ...(event.detail ?? {}),
    viewRestricted: true,
  }

  return {
    ...event,
    topic: '',
    placeLabel: '',
    placeAddress: '',
    attachmentsLabel: 'Нет файлов',
    attachments: [],
    participants: [],
    creator: null,
    detail,
    viewRestricted: true,
  }
}
