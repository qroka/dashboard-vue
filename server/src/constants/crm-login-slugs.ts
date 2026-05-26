import {
  isScheduleSubstituteSlug,
  type ScheduleSubstituteSlug,
} from './schedule-slugs.js'

export const CRM_LOGIN_TO_SUBSTITUTE_SLUG: Record<string, ScheduleSubstituteSlug> = {
  yap: 'marcenkovskiy',
  muv: 'markova',
  SPA: 'sidorov',
  JOR: 'zhuravskaya',
  nme: 'nigmatullin',
}

export function substituteSlugFromCrmLogin(login: string): ScheduleSubstituteSlug | null {
  const key = login.trim()
  const direct = CRM_LOGIN_TO_SUBSTITUTE_SLUG[key]
  if (direct)
    return direct
  const lower = CRM_LOGIN_TO_SUBSTITUTE_SLUG[key.toLowerCase()]
  if (lower)
    return lower
  return null
}

export const DEPUTY_ID_TO_SUBSTITUTE_SLUG: Record<number, ScheduleSubstituteSlug> = {
  3: 'markova',
  20: 'nigmatullin',
  200: 'sidorov',
  220: 'marcenkovskiy',
  341: 'zhuravskaya',
}

export const SCHEDULE_DEPUTY_OPTIONS: { id: number, name: string, slug: ScheduleSubstituteSlug }[] = [
  { id: 220, name: 'Марценковский Р.Ф.', slug: 'marcenkovskiy' },
  { id: 3, name: 'Маркова Ю.В.', slug: 'markova' },
  { id: 200, name: 'Сидоров П.А.', slug: 'sidorov' },
  { id: 341, name: 'Журавская О.Р.', slug: 'zhuravskaya' },
  { id: 20, name: 'Нигматуллин М.Э.', slug: 'nigmatullin' },
]

export function substituteSlugFromDeputyId(deputyId: number): ScheduleSubstituteSlug | null {
  const slug = DEPUTY_ID_TO_SUBSTITUTE_SLUG[deputyId]
  return slug && isScheduleSubstituteSlug(slug) ? slug : null
}

export function substituteSlugFromCrmUser(input: {
  login: string
  scheduleRole?: number
  uIsZam?: number
  uZamId?: number
}): ScheduleSubstituteSlug | null {
  const role = Number(input.scheduleRole ?? 0)

  if (role === 4 && input.uZamId) {
    return substituteSlugFromDeputyId(input.uZamId)
  }

  const fromLogin = substituteSlugFromCrmLogin(input.login)
  if (fromLogin)
    return fromLogin

  if ((role === 3 || input.uIsZam === 1) && input.uZamId) {
    const fromDeputy = substituteSlugFromDeputyId(input.uZamId)
    if (fromDeputy)
      return fromDeputy
  }

  if (input.uIsZam === 1 && input.uZamId) {
    return substituteSlugFromDeputyId(input.uZamId)
  }

  return null
}
