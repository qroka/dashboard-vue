import bcrypt from 'bcryptjs'
import { getDb } from '../db/sqlite.js'
import {
  SCHEDULE_SUBSTITUTE_SLUGS,
  type ScheduleSubstituteSlug,
} from '../constants/schedule-slugs.js'
import type { LocalUser, PublicUserProfile, UserAccessProfile } from '../types/auth.js'
import { roleLabel } from '../services/event-permissions.js'

interface UserRow {
  id: number
  login: string
  password_hash: string
  name: string
  email: string | null
  role: LocalUser['role']
  external_user_id: number | null
  substitute_slug: string | null
}

function mapUser(row: Omit<UserRow, 'password_hash'>): LocalUser {
  return {
    id: row.id,
    login: row.login,
    name: row.name,
    email: row.email,
    role: row.role,
    externalUserId: row.external_user_id,
    substituteSlug: row.substitute_slug,
  }
}

function listModeratedSubstituteSlugs(moderatorUserId: number): string[] {
  const rows = getDb()
    .prepare(
      `SELECT u.substitute_slug AS slug
       FROM moderator_assignments m
       INNER JOIN users u ON u.id = m.manager_user_id
       WHERE m.moderator_user_id = ?
         AND u.substitute_slug IS NOT NULL`,
    )
    .all(moderatorUserId) as { slug: string }[]

  return rows
    .map(r => r.slug)
    .filter((slug): slug is ScheduleSubstituteSlug =>
      (SCHEDULE_SUBSTITUTE_SLUGS as readonly string[]).includes(slug),
    )
}

function editableSubstituteSlugsFor(user: LocalUser): string[] {
  if (user.role === 'admin')
    return [...SCHEDULE_SUBSTITUTE_SLUGS]
  if ((user.role === 'manager' || user.role === 'assistant') && user.substituteSlug)
    return [user.substituteSlug]
  if (user.role === 'moderator')
    return listModeratedSubstituteSlugs(user.id)
  return []
}

export async function verifyCredentials(
  login: string,
  password: string,
): Promise<LocalUser | null> {
  const row = getDb()
    .prepare(
      `SELECT id, login, password_hash, name, email, role,
              external_user_id, substitute_slug
       FROM users WHERE login = ? COLLATE NOCASE`,
    )
    .get(login) as UserRow | undefined

  if (!row)
    return null

  const valid = await bcrypt.compare(password, row.password_hash)
  if (!valid)
    return null

  return mapUser(row)
}

export function findUserById(id: number): LocalUser | null {
  const row = getDb()
    .prepare(
      `SELECT id, login, name, email, role, external_user_id, substitute_slug
       FROM users WHERE id = ?`,
    )
    .get(id) as Omit<UserRow, 'password_hash'> | undefined

  return row ? mapUser(row) : null
}

export function findLocalUsersByExternalIds(externalIds: number[]): Map<number, LocalUser> {
  const unique = [...new Set(externalIds.filter(id => Number.isInteger(id) && id > 0))]
  if (!unique.length)
    return new Map()

  const placeholders = unique.map(() => '?').join(', ')
  const rows = getDb()
    .prepare(
      `SELECT id, login, name, email, role, external_user_id, substitute_slug
       FROM users WHERE external_user_id IN (${placeholders})`,
    )
    .all(...unique) as Omit<UserRow, 'password_hash'>[]

  return new Map(
    rows
      .filter(row => row.external_user_id != null)
      .map(row => [row.external_user_id!, mapUser(row)]),
  )
}

export function findUserIdsByExternalIds(externalIds: number[]): Map<number, number> {
  const unique = [...new Set(externalIds.filter(id => Number.isInteger(id) && id > 0))]
  if (!unique.length)
    return new Map()

  const placeholders = unique.map(() => '?').join(', ')
  const rows = getDb()
    .prepare(
      `SELECT id, external_user_id FROM users
       WHERE external_user_id IN (${placeholders})`,
    )
    .all(...unique) as { id: number, external_user_id: number }[]

  return new Map(rows.map(row => [row.external_user_id, row.id]))
}

export function findUserAccessById(id: number): UserAccessProfile | null {
  const user = findUserById(id)
  if (!user)
    return null
  return {
    ...user,
    editableSubstituteSlugs: editableSubstituteSlugsFor(user),
  }
}

export function toPublicUserProfile(profile: UserAccessProfile): PublicUserProfile {
  return {
    id: profile.id,
    login: profile.login,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    roleLabel: roleLabel(profile.role),
    externalUserId: profile.externalUserId,
    substituteSlug: profile.substituteSlug,
    editableSubstituteSlugs: profile.editableSubstituteSlugs,
  }
}

export interface UpsertCrmLocalUserInput {
  externalUserId: number
  login: string
  name: string
  email: string | null
  role: LocalUser['role']
  substituteSlug: string | null
}

/** Создать или обновить локального пользователя по данным CRM (SSO / crm-bridge). */
export function upsertUserFromCrm(input: UpsertCrmLocalUserInput): LocalUser {
  const db = getDb()
  const existing = db
    .prepare(
      `SELECT id, login, name, email, role, external_user_id, substitute_slug
       FROM users WHERE external_user_id = ? OR login = ? COLLATE NOCASE`,
    )
    .get(input.externalUserId, input.login) as Omit<UserRow, 'password_hash'> | undefined

  if (existing) {
    db.prepare(
      `UPDATE users
       SET login = ?, name = ?, email = ?, role = ?,
           external_user_id = ?, substitute_slug = ?
       WHERE id = ?`,
    ).run(
      input.login,
      input.name,
      input.email,
      input.role,
      input.externalUserId,
      input.substituteSlug,
      existing.id,
    )
    return findUserById(existing.id)!
  }

  const randomPass = bcrypt.hashSync(`crm-sso-${input.externalUserId}-${Date.now()}`, 10)
  const result = db
    .prepare(
      `INSERT INTO users (login, password_hash, name, email, role, external_user_id, substitute_slug)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.login,
      randomPass,
      input.name,
      input.email,
      input.role,
      input.externalUserId,
      input.substituteSlug,
    )

  return findUserById(Number(result.lastInsertRowid))!
}
