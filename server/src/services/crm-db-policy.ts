export class CrmDbWriteDisabledError extends Error {
  constructor(message = 'Запись в CRM MySQL отключена. Используйте CRM API или включите CRM_DB_WRITABLE=true для выделенного write-пользователя.') {
    super(message)
    this.name = 'CrmDbWriteDisabledError'
  }
}
