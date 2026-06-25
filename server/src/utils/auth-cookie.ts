import type { FastifyReply } from 'fastify'
import type { Env } from '../config/env.js'

export const AUTH_COOKIE_NAME = 'crm_auth'

function jwtCookieMaxAge(expiresIn: string | number): number {
  if (typeof expiresIn === 'number')
    return expiresIn

  const match = /^(\d+)(ms|s|m|h|d)$/i.exec(expiresIn.trim())
  if (!match)
    return 8 * 60 * 60

  const n = Number(match[1])
  const unit = match[2].toLowerCase()
  const multipliers: Record<string, number> = {
    ms: 0.001,
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  }
  return Math.floor(n * (multipliers[unit] ?? 3600))
}

export function setAuthCookie(reply: FastifyReply, token: string, env: Env): void {
  reply.setCookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: jwtCookieMaxAge(env.JWT_EXPIRES_IN),
  })
}

export function clearAuthCookie(reply: FastifyReply, env: Env): void {
  reply.clearCookie(AUTH_COOKIE_NAME, {
    path: '/',
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
  })
}
