import type {
  ActivityLogCategory,
  ActivityLogEntry,
  ActivityLogEventChange,
  ActivityLogEventField,
  ActivityLogLevel,
  ActivityLogMeta,
  ActivityLogScope,
} from '../types/logs'
import type { ScheduleParticipant } from '../types/schedule'

export const BUSINESS_LOG_CATEGORIES: ActivityLogCategory[] = [
  'auth',
  'event',
  'attachment',
]

export const SYSTEM_LOG_CATEGORIES: ActivityLogCategory[] = [
  'system',
  'participant',
]

export function activityLogScopeLabel(scope: ActivityLogScope): string {
  return scope === 'business' ? 'Бизнес' : 'Системные'
}

const LEVEL_LABELS: Record<ActivityLogLevel, string> = {
  info: 'Инфо',
  success: 'Успех',
  warning: 'Предупреждение',
  error: 'Ошибка',
}

const CATEGORY_LABELS: Record<ActivityLogCategory, string> = {
  auth: 'Вход',
  event: 'Мероприятия',
  attachment: 'Файлы',
  participant: 'Участники',
  system: 'Система',
}

export function activityLogLevelLabel(level: ActivityLogLevel): string {
  return LEVEL_LABELS[level]
}

export function activityLogCategoryLabel(category: ActivityLogCategory): string {
  return CATEGORY_LABELS[category]
}

function isEventField(value: unknown): value is ActivityLogEventField {
  if (!value || typeof value !== 'object')
    return false
  const row = value as ActivityLogEventField
  return typeof row.key === 'string'
    && typeof row.label === 'string'
    && typeof row.value === 'string'
}

function isEventChange(value: unknown): value is ActivityLogEventChange {
  if (!value || typeof value !== 'object')
    return false
  const row = value as ActivityLogEventChange
  return typeof row.key === 'string'
    && typeof row.label === 'string'
    && typeof row.before === 'string'
    && typeof row.after === 'string'
}

export function parseActivityLogMeta(meta: unknown): ActivityLogMeta | null {
  if (!meta || typeof meta !== 'object')
    return null
  const raw = meta as ActivityLogMeta
  const fields = Array.isArray(raw.fields)
    ? raw.fields.filter(isEventField)
    : undefined
  const changes = Array.isArray(raw.changes)
    ? raw.changes.filter(isEventChange)
    : undefined
  const files = Array.isArray(raw.files)
    ? raw.files.filter((f): f is string => typeof f === 'string' && f.trim().length > 0)
    : undefined
  if (!fields?.length && !changes?.length && !files?.length)
    return null
  return {
    kind: raw.kind,
    fields,
    changes,
    files,
  }
}

export function activityLogHasEventDetails(entry: ActivityLogEntry): boolean {
  const meta = parseActivityLogMeta(entry.meta)
  return Boolean(meta?.fields?.length || meta?.changes?.length)
}

export function isActivityLogSystemActor(
  entry: Pick<ActivityLogEntry, 'userLogin' | 'userName'>,
): boolean {
  return !entry.userName?.trim() && !entry.userLogin?.trim()
}

export function findLogActorParticipant(
  entry: Pick<ActivityLogEntry, 'userLogin' | 'userName'>,
  participants: ScheduleParticipant[],
): ScheduleParticipant | null {
  const login = entry.userLogin?.trim().toLowerCase()
  if (login) {
    const byLogin = participants.find(p => p.login?.toLowerCase() === login)
    if (byLogin)
      return byLogin
  }

  const name = entry.userName?.trim().toLowerCase()
  if (name) {
    const byName = participants.find(p => p.name.trim().toLowerCase() === name)
    if (byName)
      return byName
  }

  return null
}

export function buildFallbackLogActorParticipant(
  entry: Pick<ActivityLogEntry, 'userLogin' | 'userName'>,
): ScheduleParticipant | null {
  const displayName = entry.userName?.trim() || entry.userLogin?.trim()
  if (!displayName)
    return null

  const parts = displayName.split(/\s+/)
  return {
    name: displayName,
    avatarSrc: '',
    login: entry.userLogin?.trim() || undefined,
    card: {
      line1: parts.length > 1 ? parts.slice(0, -1).join(' ') : displayName,
      line2: parts.length > 1 ? parts[parts.length - 1]! : '',
      email: entry.userLogin?.trim() ?? '',
      phone: '',
      address: '',
    },
  }
}

export function resolveLogActorParticipant(
  entry: Pick<ActivityLogEntry, 'userLogin' | 'userName'>,
  participants: ScheduleParticipant[],
): ScheduleParticipant | null {
  if (isActivityLogSystemActor(entry))
    return null
  return findLogActorParticipant(entry, participants)
    ?? buildFallbackLogActorParticipant(entry)
}

export function formatActivityLogTimestamp(value: string): string {
  const trimmed = value.trim()
  const normalized = /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(trimmed)
    ? trimmed.replace(' ', 'T')
    : trimmed
  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.getTime()))
    return trimmed
  return parsed.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function activityLogSortTime(entry: ActivityLogEntry): number {
  const normalized = entry.createdAt.includes(' ')
    ? entry.createdAt.replace(' ', 'T')
    : entry.createdAt
  const t = new Date(normalized).getTime()
  return Number.isNaN(t) ? 0 : t
}

export function filterActivityLogs(
  entries: ActivityLogEntry[],
  options: {
    query: string
    level: ActivityLogLevel | 'all'
    category: ActivityLogCategory | 'all'
  },
): ActivityLogEntry[] {
  const terms = options.query.trim().toLowerCase().split(/\s+/).filter(Boolean)

  return entries
    .filter((entry) => {
      if (options.level !== 'all' && entry.level !== options.level)
        return false
      if (options.category !== 'all' && entry.category !== options.category)
        return false
      if (!terms.length)
        return true
      const haystack = [
        entry.message,
        entry.action,
        entry.userLogin,
        entry.userName,
        activityLogLevelLabel(entry.level),
        activityLogCategoryLabel(entry.category),
        entry.entityType,
        entry.entityId != null ? String(entry.entityId) : '',
        entry.ipAddress,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return terms.every(term => haystack.includes(term))
    })
    .sort((a, b) => activityLogSortTime(b) - activityLogSortTime(a))
}
