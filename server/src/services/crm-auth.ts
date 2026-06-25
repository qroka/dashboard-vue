import { createHmac, timingSafeEqual as cryptoTimingSafeEqual } from 'node:crypto'
import type { Env } from '../config/env.js'
import { substituteSlugFromCrmUser } from '../constants/crm-login-slugs.js'
import {
  CRM_SCHEDULE_ROLE_ADMIN,
  CRM_SCHEDULE_ROLE_ASSISTANT,
  CRM_SCHEDULE_ROLE_DEPUTY,
  CRM_SCHEDULE_ROLE_EXECUTOR,
  CRM_SCHEDULE_ROLE_VIEWER,
} from '../constants/crm-schedule-access.js'
import type { UserRole } from '../types/auth.js'

export interface CrmLookupUser {
  id: number
  login: string
  password: string
  fio: string
  email?: string
  status?: boolean
  u_prem1?: number | string
  u_prem9?: number | string
  u_is_zam?: number
  u_zam_id?: number | null
}

export interface CrmSsoPayload {
  exp: number
  uid: number
  login: string
  fio: string
  email?: string
  u_prem1?: number | string
  u_prem9?: number | string
  u_is_zam?: number
  u_zam_id?: number
  /** Время выпуска (unix sec); при отсутствии проверяется exp − now ≤ 60 с. */
  iat?: number
  /** Уникальный id токена (опционально; replay блокируется по hash всего токена). */
  jti?: string
}

/** Максимальный срок жизни SSO-токена с момента выпуска (сек). */
export const SSO_MAX_AGE_SEC = 60

export function mapCrmUserToRole(user: {
  u_prem1?: number | string
  u_prem9?: number | string
  login: string
  u_is_zam?: number
  u_zam_id?: number | null
}): UserRole {
  const scheduleRole = Number(user.u_prem9 ?? 0)

  if (scheduleRole === CRM_SCHEDULE_ROLE_ADMIN)
    return 'admin'
  if (scheduleRole === CRM_SCHEDULE_ROLE_DEPUTY)
    return 'manager'
  if (scheduleRole === CRM_SCHEDULE_ROLE_ASSISTANT)
    return 'assistant'
  if (scheduleRole === CRM_SCHEDULE_ROLE_EXECUTOR || scheduleRole === CRM_SCHEDULE_ROLE_VIEWER)
    return 'user'

  const slug = substituteSlugFromCrmUser({
    login: user.login,
    scheduleRole,
    uIsZam: user.u_is_zam,
    uZamId: user.u_zam_id ?? undefined,
  })
  if (slug)
    return 'manager'

  return 'user'
}

export function crmUserHasScheduleAccess(_user: {
  u_prem9?: number | string
  u_prem1?: number | string
  login: string
  u_is_zam?: number
  u_zam_id?: number | null
}): boolean {
  return true
}

export function mapCrmUserToLocalFields(
  user: CrmLookupUser | CrmSsoPayload,
): {
  externalUserId: number
  login: string
  name: string
  email: string | null
  role: UserRole
  substituteSlug: string | null
} {
  const login = user.login.trim()
  const scheduleRole = Number('u_prem9' in user ? (user.u_prem9 ?? 0) : 0)
  const role = mapCrmUserToRole({
    u_prem1: user.u_prem1,
    u_prem9: user.u_prem9,
    login,
    u_is_zam: user.u_is_zam,
    u_zam_id: user.u_zam_id ?? null,
  })
  const uZamId = user.u_zam_id != null ? user.u_zam_id : undefined
  const substituteSlug = (role === 'manager' || role === 'assistant')
    ? substituteSlugFromCrmUser({
        login,
        scheduleRole,
        uIsZam: user.u_is_zam,
        uZamId,
      })
    : null

  const externalUserId = 'uid' in user ? user.uid : user.id

  return {
    externalUserId,
    login,
    name: user.fio?.trim() || login,
    email: user.email?.trim() || null,
    role,
    substituteSlug,
  }
}

export function verifyCrmSsoToken(token: string, secret: string): CrmSsoPayload | null {
  const parts = token.split('.')
  if (parts.length !== 2)
    return null

  const [payloadB64, sigB64] = parts
  const expected = b64url(
    hmacSha256(payloadB64, secret),
  )
  if (!timingSafeEqualString(sigB64, expected))
    return null

  try {
    const json = Buffer.from(payloadB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    const payload = JSON.parse(json) as CrmSsoPayload
    const now = Math.floor(Date.now() / 1000)
    if (!payload.exp || payload.exp < now)
      return null
    if (!payload.uid || !payload.login)
      return null
    if (isSsoTokenTooOld(payload, now))
      return null
    return payload
  } catch {
    return null
  }
}

function isSsoTokenTooOld(payload: CrmSsoPayload, nowSec: number): boolean {
  if (payload.iat != null)
    return nowSec - payload.iat > SSO_MAX_AGE_SEC
  return payload.exp - nowSec > SSO_MAX_AGE_SEC
}

function hmacSha256(data: string, secret: string): Buffer {
  return createHmac('sha256', secret).update(data).digest()
}

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function timingSafeEqualString(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length)
    return false
  return cryptoTimingSafeEqual(ba, bb)
}

export async function fetchCrmLookupUser(
  env: Env,
  login: string,
  password: string,
): Promise<CrmLookupUser | null> {
  const url = env.CRM_LOOKUP_URL
  if (!url)
    return null

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Sync-Secret': env.CRM_SYNC_SECRET,
  }
  if (env.CRM_HOST_HEADER)
    headers.Host = env.CRM_HOST_HEADER

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ login, password }),
    signal: AbortSignal.timeout(env.CRM_TIMEOUT_MS),
  })

  if (!response.ok)
    return null

  const data = (await response.json()) as {
    success?: boolean
    user?: CrmLookupUser & { id?: number }
  }
  if (!data.success || !data.user)
    return null

  return {
    id: data.user.id,
    login: data.user.login,
    password: data.user.password,
    fio: data.user.fio,
    email: data.user.email,
    u_prem1: data.user.u_prem1,
    u_prem9: data.user.u_prem9,
    u_is_zam: data.user.u_is_zam,
    u_zam_id: data.user.u_zam_id,
  }
}
