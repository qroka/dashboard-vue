import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { collectEmailAddresses } from './parse-emails.js'

describe('collectEmailAddresses', () => {
  it('parses comma-separated u_email from CRM', () => {
    assert.deepEqual(
      collectEmailAddresses('yankovayn@admsr.ru, depim@admsr.ru'),
      ['yankovayn@admsr.ru', 'depim@admsr.ru'],
    )
  })

  it('merges multiple CRM fields and deduplicates', () => {
    assert.deepEqual(
      collectEmailAddresses([
        'yankovayn@admsr.ru',
        'markovauv@admsr.ru, razvitie@admsr.ru, velichkoem@admsr.ru',
        'razvitie@admsr.ru, velichkoem@admsr.ru',
      ]),
      [
        'yankovayn@admsr.ru',
        'markovauv@admsr.ru',
        'razvitie@admsr.ru',
        'velichkoem@admsr.ru',
      ],
    )
  })

  it('parses semicolon-separated addresses', () => {
    assert.deepEqual(
      collectEmailAddresses('tironsm@admsr.ru;sov@admsr.ru'),
      ['tironsm@admsr.ru', 'sov@admsr.ru'],
    )
  })
})
