/** user.u_prem9 — как остальные графики CRM: 0 = исполнитель по умолчанию. */
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
