import { createHash } from 'node:crypto'
import { getDb } from '../db/sqlite.js'

function hashSsoToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function purgeExpiredSsoTokens(nowSec: number): void {
  getDb()
    .prepare('DELETE FROM sso_used_tokens WHERE expires_at <= ?')
    .run(nowSec)
}

/** Возвращает false, если токен уже был использован (replay). */
export function consumeSsoTokenOnce(token: string, expiresAtSec: number): boolean {
  const nowSec = Math.floor(Date.now() / 1000)
  purgeExpiredSsoTokens(nowSec)

  const tokenHash = hashSsoToken(token)
  const existing = getDb()
    .prepare('SELECT 1 AS ok FROM sso_used_tokens WHERE token_hash = ?')
    .get(tokenHash) as { ok: 1 } | undefined

  if (existing)
    return false

  getDb()
    .prepare('INSERT INTO sso_used_tokens (token_hash, expires_at) VALUES (?, ?)')
    .run(tokenHash, expiresAtSec)

  return true
}
