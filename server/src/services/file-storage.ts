import { createReadStream, createWriteStream, existsSync } from 'node:fs'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import { dirname, extname, isAbsolute, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { fileTypeFromBuffer } from 'file-type'
import type { Env } from '../config/env.js'

const serverRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/rtf',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.presentation',
])

const ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.txt',
  '.csv',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.rtf',
  '.odt',
  '.ods',
  '.odp',
])

const TEXT_EXTENSIONS = new Set(['.txt', '.csv'])

const OFFICE_ZIP_EXTENSIONS = new Set(['.docx', '.xlsx', '.pptx', '.odt', '.ods', '.odp'])

const SNIFF_HEAD_BYTES = 4100

export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UploadValidationError'
  }
}

export class UploadTooLargeError extends Error {
  code = 'FST_REQ_FILE_TOO_LARGE'

  constructor(message = 'File too large') {
    super(message)
    this.name = 'UploadTooLargeError'
  }
}

export function resolveUploadDir(env: Env): string {
  return resolve(serverRoot, env.UPLOAD_DIR)
}

export async function ensureUploadDir(env: Env): Promise<string> {
  const dir = resolveUploadDir(env)
  await mkdir(dir, { recursive: true })
  return dir
}

export function formatFileSizeLabel(bytes: number): string {
  if (bytes < 1024)
    return `${bytes} Б`
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(1)} КБ`
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
}

function sanitizeBaseName(name: string): string {
  const base = name.replace(/[/\\?%*:|"<>]/g, '_').trim() || 'file'
  return base.slice(0, 180)
}

export function buildStorageKey(eventId: number, originalName: string): string {
  const ext = extname(originalName).slice(0, 16)
  const base = sanitizeBaseName(originalName.replace(extname(originalName), '') || 'file')
  return `${eventId}/${randomUUID()}_${base}${ext}`
}

export function assertAllowedUpload(mimeType: string, originalName: string): void {
  const ext = extname(originalName).toLowerCase()
  const mime = mimeType.split(';')[0]?.trim().toLowerCase() ?? ''

  if (mime && ALLOWED_MIME_TYPES.has(mime))
    return

  if (ext && ALLOWED_EXTENSIONS.has(ext))
    return

  throw new UploadValidationError(
    'Недопустимый тип файла. Разрешены PDF, изображения, текст и документы Office.',
  )
}

function assertPlainTextContent(head: Buffer): void {
  if (head.includes(0)) {
    throw new UploadValidationError('Недопустимый тип файла')
  }

  const prefix = head.subarray(0, 256).toString('utf8').trimStart().toLowerCase()
  if (
    prefix.startsWith('<!doctype html')
    || prefix.startsWith('<html')
    || prefix.startsWith('<script')
    || prefix.startsWith('<?xml')
  ) {
    throw new UploadValidationError('Недопустимый тип файла')
  }
}

function isDetectedTypeAllowed(
  detectedMime: string,
  detectedExt: string | undefined,
  declaredExt: string,
): boolean {
  if (!ALLOWED_MIME_TYPES.has(detectedMime))
    return false

  if (detectedMime === 'application/zip' && OFFICE_ZIP_EXTENSIONS.has(declaredExt))
    return true

  if (!declaredExt)
    return true

  const normalizedDetectedExt = detectedExt ? `.${detectedExt}` : ''
  if (normalizedDetectedExt && normalizedDetectedExt !== declaredExt) {
    const compatible = (
      (declaredExt === '.jpg' && normalizedDetectedExt === '.jpeg')
      || (declaredExt === '.jpeg' && normalizedDetectedExt === '.jpg')
    )
    if (!compatible)
      return false
  }

  return ALLOWED_EXTENSIONS.has(declaredExt)
}

export async function assertAllowedUploadContent(
  head: Buffer,
  mimeType: string,
  originalName: string,
): Promise<void> {
  assertAllowedUpload(mimeType, originalName)

  const ext = extname(originalName).toLowerCase()
  if (!head.length) {
    throw new UploadValidationError('Пустой файл')
  }

  const detected = await fileTypeFromBuffer(head)
  if (detected) {
    if (!isDetectedTypeAllowed(detected.mime, detected.ext, ext)) {
      throw new UploadValidationError(
        'Содержимое файла не соответствует заявленному типу.',
      )
    }
    return
  }

  if (ext === '.rtf') {
    const prefix = head.subarray(0, 8).toString('ascii')
    if (!prefix.startsWith('{\\rtf'))
      throw new UploadValidationError('Содержимое файла не соответствует заявленному типу.')
    return
  }

  if (TEXT_EXTENSIONS.has(ext)) {
    assertPlainTextContent(head)
    return
  }

  throw new UploadValidationError(
    'Не удалось проверить тип файла. Загрузите PDF, изображение или документ Office.',
  )
}

export function assertSafeStoragePath(env: Env, storageKey: string): string {
  const root = resolveUploadDir(env)
  const fullPath = resolve(root, storageKey)
  const rel = relative(root, fullPath)
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new UploadValidationError('Invalid storage path')
  }
  return fullPath
}

export function resolveStoredPath(env: Env, storageKey: string): string {
  return assertSafeStoragePath(env, storageKey)
}

export async function saveUploadedFile(
  env: Env,
  storageKey: string,
  buffer: Buffer,
): Promise<void> {
  const fullPath = assertSafeStoragePath(env, storageKey)
  await mkdir(dirname(fullPath), { recursive: true })
  await writeFile(fullPath, buffer)
}

export async function saveUploadedFileStream(
  env: Env,
  storageKey: string,
  stream: NodeJS.ReadableStream,
  maxBytes: number,
): Promise<{ sizeBytes: number, head: Buffer }> {
  const fullPath = assertSafeStoragePath(env, storageKey)
  await mkdir(dirname(fullPath), { recursive: true })

  let sizeBytes = 0
  let head = Buffer.alloc(0)

  const limiter = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      sizeBytes += chunk.length
      if (sizeBytes > maxBytes) {
        callback(new UploadTooLargeError())
        return
      }
      if (head.length < SNIFF_HEAD_BYTES) {
        head = Buffer.concat([head, chunk]).subarray(0, SNIFF_HEAD_BYTES)
      }
      callback(null, chunk)
    },
  })

  try {
    await pipeline(stream, limiter, createWriteStream(fullPath))
  } catch (error) {
    await unlink(fullPath).catch(() => undefined)
    throw error
  }

  if (!sizeBytes)
    throw new UploadValidationError('Пустой файл')

  return { sizeBytes, head }
}

export async function deleteStoredFile(env: Env, storageKey: string | null): Promise<void> {
  if (!storageKey)
    return
  const fullPath = assertSafeStoragePath(env, storageKey)
  if (existsSync(fullPath))
    await unlink(fullPath).catch(() => undefined)
}

export function openStoredFile(env: Env, storageKey: string) {
  const fullPath = assertSafeStoragePath(env, storageKey)
  if (!existsSync(fullPath))
    return null
  return createReadStream(fullPath)
}

/** Безопасный Content-Type для отдачи вложений (без SVG и HTML). */
export function safeAttachmentContentType(mimeType: string): string {
  const mime = mimeType.split(';')[0]?.trim().toLowerCase() ?? ''
  if (ALLOWED_MIME_TYPES.has(mime))
    return mime
  return 'application/octet-stream'
}
