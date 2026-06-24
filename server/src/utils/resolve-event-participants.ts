import type { LocalUser } from '../types/auth.js'
import type { CrmParticipant } from '../types/crm.js'

export function localUserToCrmParticipant(user: LocalUser): CrmParticipant {
  const name = user.name.trim() || user.login
  const parts = name.split(/\s+/).filter(Boolean)

  return {
    id: user.externalUserId!,
    login: user.login,
    name,
    email: user.email ?? undefined,
    line1: parts.length > 1 ? parts.slice(0, -1).join(' ') : name,
    line2: parts.length > 1 ? parts[parts.length - 1]! : '',
  }
}

function resolveCrmParticipant(
  externalId: number,
  crmById: Map<number, CrmParticipant>,
  localByExternalId: Map<number, LocalUser>,
): CrmParticipant | null {
  const fromCrm = crmById.get(externalId)
  if (fromCrm)
    return fromCrm

  const local = localByExternalId.get(externalId)
  if (local?.externalUserId != null)
    return localUserToCrmParticipant(local)

  return null
}

export function resolveEventParticipants(
  participantIds: number[],
  crmById: Map<number, CrmParticipant>,
  localByExternalId: Map<number, LocalUser>,
): CrmParticipant[] {
  const seen = new Set<number>()
  const participants: CrmParticipant[] = []

  for (const externalId of participantIds) {
    if (seen.has(externalId))
      continue
    seen.add(externalId)

    const participant = resolveCrmParticipant(externalId, crmById, localByExternalId)
    if (participant)
      participants.push(participant)
  }

  return participants
}

export function resolveEventCreator(
  creatorExternalId: number | null | undefined,
  crmById: Map<number, CrmParticipant>,
  localByExternalId: Map<number, LocalUser>,
): CrmParticipant | null {
  if (!creatorExternalId)
    return null

  return resolveCrmParticipant(creatorExternalId, crmById, localByExternalId)
}
