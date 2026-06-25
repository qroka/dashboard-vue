import type { Env } from '../config/env.js'

/** В production с реальным CRM локальный login только для break-glass учёток. */
export function isCrmAuthRequired(env: Env): boolean {
  return env.NODE_ENV === 'production' && !env.CRM_MOCK && Boolean(env.CRM_LOOKUP_URL)
}

export function breakGlassLogins(env: Env): Set<string> {
  const raw = env.LOCAL_AUTH_LOGINS?.trim() || env.SEED_USER_LOGIN
  return new Set(
    raw
      .split(',')
      .map(login => login.trim().toLowerCase())
      .filter(Boolean),
  )
}

export function canUseLocalAuth(env: Env, login: string): boolean {
  if (!isCrmAuthRequired(env))
    return true
  return breakGlassLogins(env).has(login.trim().toLowerCase())
}
