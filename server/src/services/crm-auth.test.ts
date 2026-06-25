import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { describe, it } from 'node:test'
import {
  CRM_SCHEDULE_ROLE_EXECUTOR,
  CRM_SCHEDULE_ROLE_ADMIN,
  hasScheduleAccess,
} from '../constants/crm-schedule-access.js'
import {
  SSO_MAX_AGE_SEC,
  verifyCrmSsoToken,
} from '../services/crm-auth.js'

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function signSsoPayload(payload: Record<string, unknown>, secret: string): string {
  const payloadB64 = b64url(Buffer.from(JSON.stringify(payload), 'utf8'))
  const sig = b64url(createHmac('sha256', secret).update(payloadB64).digest())
  return `${payloadB64}.${sig}`
}

describe('hasScheduleAccess', () => {
  it('allows known u_prem9 values 0–4', () => {
    assert.equal(hasScheduleAccess(CRM_SCHEDULE_ROLE_EXECUTOR), true)
    assert.equal(hasScheduleAccess(CRM_SCHEDULE_ROLE_ADMIN), true)
  })

  it('rejects unknown schedule roles', () => {
    assert.equal(hasScheduleAccess(99), false)
    assert.equal(hasScheduleAccess(-1), false)
  })
})

describe('verifyCrmSsoToken', () => {
  const secret = 'test-sso-secret-key-32chars!!'
  const now = Math.floor(Date.now() / 1000)

  it('accepts valid token within TTL', () => {
    const token = signSsoPayload({
      uid: 1,
      login: 'user',
      fio: 'User',
      exp: now + 30,
      u_prem9: CRM_SCHEDULE_ROLE_EXECUTOR,
    }, secret)

    const payload = verifyCrmSsoToken(token, secret)
    assert.ok(payload)
    assert.equal(payload?.login, 'user')
  })

  it('rejects tampered signature', () => {
    const token = signSsoPayload({
      uid: 1,
      login: 'user',
      fio: 'User',
      exp: now + 30,
    }, secret)

    const [payloadB64] = token.split('.')
    const bad = `${payloadB64}.invalid-signature`
    assert.equal(verifyCrmSsoToken(bad, secret), null)
  })

  it('rejects expired token', () => {
    const token = signSsoPayload({
      uid: 1,
      login: 'user',
      fio: 'User',
      exp: now - 10,
    }, secret)

    assert.equal(verifyCrmSsoToken(token, secret), null)
  })

  it('rejects token older than SSO_MAX_AGE_SEC', () => {
    const token = signSsoPayload({
      uid: 1,
      login: 'user',
      fio: 'User',
      exp: now + 300,
      iat: now - SSO_MAX_AGE_SEC - 1,
    }, secret)

    assert.equal(verifyCrmSsoToken(token, secret), null)
  })

  it('rejects unknown u_prem9', () => {
    const token = signSsoPayload({
      uid: 1,
      login: 'user',
      fio: 'User',
      exp: now + 30,
      u_prem9: 99,
    }, secret)

    assert.equal(verifyCrmSsoToken(token, secret), null)
  })
})
