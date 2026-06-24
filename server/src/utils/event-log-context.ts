import type { EventRecord } from '../types/events.js'
import type { CrmParticipantsService } from '../services/crm-participants.js'
import type { EventLogContext } from '../services/event-activity-meta.js'
import { findLocalUsersByExternalIds } from '../repositories/users.js'
import { localUserToCrmParticipant } from './resolve-event-participants.js'

export async function resolveEventLogContext(
  event: EventRecord,
  crm: CrmParticipantsService,
): Promise<EventLogContext> {
  const ids = [...new Set(event.participantIds)]
  if (!ids.length)
    return { participantNames: [] }

  try {
    const people = await crm.getByIds(ids)
    const byId = new Map(
      people.map(p => [p.id, p.name.trim() || p.login.trim() || `ID ${p.id}`]),
    )
    const missingIds = ids.filter(id => !byId.has(id))
    const localByExternalId = findLocalUsersByExternalIds(missingIds)

    return {
      participantNames: event.participantIds.map((id) => {
        const fromCrm = byId.get(id)
        if (fromCrm)
          return fromCrm
        const local = localByExternalId.get(id)
        if (local)
          return local.name.trim() || local.login.trim() || `ID ${id}`
        return `ID ${id}`
      }),
    }
  } catch {
    const localByExternalId = findLocalUsersByExternalIds(ids)
    return {
      participantNames: event.participantIds.map((id) => {
        const local = localByExternalId.get(id)
        if (local)
          return localUserToCrmParticipant(local).name
        return `ID ${id}`
      }),
    }
  }
}
