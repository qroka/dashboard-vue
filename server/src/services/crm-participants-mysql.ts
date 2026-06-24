import type { Env } from '../config/env.js'
import type { CrmParticipant } from '../types/crm.js'

type MysqlPool = import('mysql2/promise').Pool

let pool: MysqlPool | null = null

function canUseMysql(env: Env): boolean {
  return !env.CRM_MOCK && Boolean(env.CRM_DB_HOST && env.CRM_DB_USER && env.CRM_DB_NAME)
}

async function getPool(env: Env): Promise<MysqlPool> {
  if (pool)
    return pool
  const mysql = await import('mysql2/promise')
  pool = mysql.createPool({
    host: env.CRM_DB_HOST,
    port: env.CRM_DB_PORT,
    user: env.CRM_DB_USER,
    password: env.CRM_DB_PASSWORD,
    database: env.CRM_DB_NAME,
    waitForConnections: true,
    connectionLimit: 4,
    charset: 'utf8mb4',
  })
  return pool
}

interface ParticipantRow {
  u_id: number
  u_login: string
  u_fio: string
  u_email: string
}

function mapRow(row: ParticipantRow): CrmParticipant {
  const name = row.u_fio?.trim() || row.u_login
  const parts = name.split(/\s+/).filter(Boolean)
  const line1 = parts.length > 1 ? parts.slice(0, -1).join(' ') : name
  const line2 = parts.length > 1 ? parts[parts.length - 1]! : ''

  return {
    id: row.u_id,
    login: row.u_login,
    name,
    email: row.u_email?.trim() || undefined,
    line1,
    line2,
  }
}

export function participantsMysqlEnabled(env: Env): boolean {
  return canUseMysql(env)
}

export async function listParticipantsFromMysql(
  env: Env,
  search?: string,
): Promise<CrmParticipant[]> {
  const db = await getPool(env)
  let sql = `
    SELECT u_id, u_login, u_fio, u_email
    FROM user
    WHERE u_active = 1
  `
  const params: string[] = []
  if (search?.trim()) {
    sql += ` AND (u_fio LIKE ? OR u_login LIKE ? OR u_email LIKE ?)`
    const q = `%${search.trim()}%`
    params.push(q, q, q)
  }
  sql += ' ORDER BY u_fio LIMIT 500'

  const [rows] = await db.query(sql, params)
  return (rows as ParticipantRow[]).map(mapRow)
}

export async function getParticipantsByIdsFromMysql(
  env: Env,
  ids: number[],
): Promise<CrmParticipant[]> {
  if (!ids.length)
    return []
  const db = await getPool(env)
  const placeholders = ids.map(() => '?').join(',')
  const sql = `
    SELECT u_id, u_login, u_fio, u_email
    FROM user
    WHERE u_id IN (${placeholders})
  `
  const [rows] = await db.query(sql, ids)
  return (rows as ParticipantRow[]).map(mapRow)
}
