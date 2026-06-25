/**
 * user.u_prem9 — как u_prem1…8: 0/1/2 базовые уровни + 3 зам + 4 помощник.
 * 0 по умолчанию у всех (исполнитель), доступ в график есть у любого пользователя CRM.
 */
export const CRM_SCHEDULE_ROLE_EXECUTOR = 0
export const CRM_SCHEDULE_ROLE_VIEWER = 1
export const CRM_SCHEDULE_ROLE_ADMIN = 2
export const CRM_SCHEDULE_ROLE_DEPUTY = 3
export const CRM_SCHEDULE_ROLE_ASSISTANT = 4

export const CRM_SCHEDULE_ROLE_LEVELS = [
  { value: CRM_SCHEDULE_ROLE_EXECUTOR, label: 'Исполнитель' },
  { value: CRM_SCHEDULE_ROLE_VIEWER, label: 'Руководитель' },
  { value: CRM_SCHEDULE_ROLE_ADMIN, label: 'Администратор' },
  { value: CRM_SCHEDULE_ROLE_DEPUTY, label: 'Заместитель' },
  { value: CRM_SCHEDULE_ROLE_ASSISTANT, label: 'Помощник заместителя' },
] as const

export function scheduleRoleLabel(value: number): string {
  return CRM_SCHEDULE_ROLE_LEVELS.find(l => l.value === value)?.label ?? String(value)
}

const KNOWN_SCHEDULE_ROLES = new Set<number>([
  CRM_SCHEDULE_ROLE_EXECUTOR,
  CRM_SCHEDULE_ROLE_VIEWER,
  CRM_SCHEDULE_ROLE_ADMIN,
  CRM_SCHEDULE_ROLE_DEPUTY,
  CRM_SCHEDULE_ROLE_ASSISTANT,
])

/** Доступ к графику: только известные значения u_prem9 (0–4). */
export function hasScheduleAccess(scheduleRole?: number | string): boolean {
  const role = Number(scheduleRole ?? CRM_SCHEDULE_ROLE_EXECUTOR)
  if (!Number.isFinite(role))
    return false
  return KNOWN_SCHEDULE_ROLES.has(role)
}
