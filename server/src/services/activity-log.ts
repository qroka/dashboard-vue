import type { FastifyBaseLogger, FastifyRequest } from 'fastify'
import { getDb } from '../db/sqlite.js'
import type { Env } from '../config/env.js'

export type ActivityLogLevel = 'info' | 'success' | 'warning' | 'error'
export type ActivityLogCategory =
  | 'auth'
  | 'event'
  | 'attachment'
  | 'participant'
  | 'system'

export interface LogActivityInput {
  level: ActivityLogLevel
  category: ActivityLogCategory
  action: string
  message: string
  userId?: number | null
  userLogin?: string | null
  userName?: string | null
  entityType?: string | null
  entityId?: number | null
  ipAddress?: string | null
  clientHostname?: string | null
  meta?: Record<string, unknown> | null
}

export function getRequestClientHostname(request: FastifyRequest): string | undefined {
  const headers = request.headers
  const candidates = [
    headers['x-client-hostname'],
    headers['x-computer-name'],
    headers['x-workstation-name'],
    headers['x-machine-name'],
  ]
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim())
      return value.trim()
  }
  return undefined
}

export function getRequestLogClient(request: FastifyRequest): {
  ipAddress?: string
  clientHostname?: string
} {
  return {
    ipAddress: getRequestIp(request),
    clientHostname: getRequestClientHostname(request),
  }
}

export function getRequestIp(request: FastifyRequest): string | undefined {
  const forwarded = request.headers['x-forwarded-for']
  if (typeof forwarded === 'string') {
    const first = forwarded.split(',')[0]?.trim()
    return first || undefined
  }
  if (Array.isArray(forwarded)) {
    const first = forwarded[0]?.split(',')[0]?.trim()
    return first || undefined
  }
  return request.ip
}

export function logActivity(
  _env: Env,
  input: LogActivityInput,
  logger?: FastifyBaseLogger,
): void {
  try {
    getDb()
      .prepare(
        `INSERT INTO activity_logs (
          level, category, action, message,
          user_id, user_login, user_name,
          entity_type, entity_id, ip_address, client_hostname, meta_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        input.level,
        input.category,
        input.action,
        input.message,
        input.userId ?? null,
        input.userLogin ?? null,
        input.userName ?? null,
        input.entityType ?? null,
        input.entityId ?? null,
        input.ipAddress ?? null,
        input.clientHostname ?? null,
        input.meta ? JSON.stringify(input.meta) : null,
      )
  } catch (error) {
    logger?.warn({ err: error, action: input.action }, 'activity log write failed')
  }
}
