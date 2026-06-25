import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  assertAllowedUpload,
  assertAllowedUploadContent,
  UploadValidationError,
} from './file-storage.js'

describe('assertAllowedUpload', () => {
  it('rejects svg by extension', () => {
    assert.throws(
      () => assertAllowedUpload('image/svg+xml', 'icon.svg'),
      UploadValidationError,
    )
  })

  it('allows pdf', () => {
    assert.doesNotThrow(() => assertAllowedUpload('application/pdf', 'doc.pdf'))
  })
})

describe('assertAllowedUploadContent', () => {
  it('rejects html disguised as pdf', async () => {
    const head = Buffer.from('<!DOCTYPE html><html><body>x</body></html>', 'utf8')
    await assert.rejects(
      () => assertAllowedUploadContent(head, 'application/pdf', 'evil.pdf'),
      UploadValidationError,
    )
  })

  it('accepts real pdf magic bytes', async () => {
    const head = Buffer.from('%PDF-1.4\n%âãÏÓ', 'binary')
    await assert.doesNotReject(
      () => assertAllowedUploadContent(head, 'application/pdf', 'doc.pdf'),
    )
  })
})
