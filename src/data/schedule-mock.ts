import { CalendarDate, getLocalTimeZone, today, type DateValue } from '@internationalized/date'
import { figmaScheduleAssets } from '../config/figma-mcp-assets'

export type ScheduleAccent = 'rose' | 'blue' | 'amber' | 'violet' | 'emerald'

export interface ScheduleParticipant {
  name: string
  avatarSrc: string
  card: {
    line1: string
    line2: string
    email: string
    phone: string
    address: string
  }
}

/** Доп. поля карточки «Мероприятие» ([макет Figma](https://www.figma.com/design/VjiKOtsaItQENOVyBKEmH0/%D0%90%D0%A1%D0%A0-%D0%A0%D0%95%D0%94%D0%98%D0%97%D0%90%D0%99%D0%9D?node-id=2212-10562)). */
export interface ScheduleRowDetail {
  date?: string
  timeField?: string
  sorting?: string
  completed?: boolean
  allDay?: boolean
  /** Дата и время создания записи (строка под заголовком у создателя). */
  createdAt?: string
  /** @deprecated Используйте `createdAt`. */
  headerDateTime?: string
  /** Кто создал мероприятие (карточка в слайдовере как у участника). */
  organizer?: ScheduleParticipant
}

export interface ScheduleRow {
  /** Server event id when loaded from API */
  id?: string
  time: string
  placeLabel: string
  placeAddress: string
  topic: string
  participants: ScheduleParticipant[]
  attachmentsLabel: string
  attachmentFiles: { name: string; size: string }[]
  /** Скрыто из списка (как в Telegram): в таблице без просмотра, правка через меню «Редактировать». */
  hidden?: boolean
  /** Поля детального просмотра (слайдовер); не заданы — берутся из строки и блока. */
  detail?: ScheduleRowDetail
}

/** Место одной строкой: населённый пункт и адрес через запятую. */
export function formatSchedulePlace(row: Pick<ScheduleRow, 'placeLabel' | 'placeAddress'>): string {
  return [row.placeLabel.trim(), row.placeAddress.trim()].filter(Boolean).join(', ')
}

/** Slug в URL — только заместители (без «общий»). */
export const scheduleSubstituteSlugs = [
  'marcenkovskiy',
  'markova',
  'sidorov',
  'zhuravskaya',
  'nigmatullin'
] as const

export type ScheduleSubstituteSlug = (typeof scheduleSubstituteSlugs)[number]

export type ScheduleTitleValue = 'general' | ScheduleSubstituteSlug

export function isScheduleSubstituteSlug(s: string): s is ScheduleSubstituteSlug {
  return (scheduleSubstituteSlugs as readonly string[]).includes(s)
}

export function parseScheduleSlugFromPath(path: string): ScheduleTitleValue {
  const clean = path.replace(/\/$/, '')
  const last = clean.split('/').pop() ?? ''
  if (isScheduleSubstituteSlug(last))
    return last
  return 'general'
}

export interface ScheduleUserGroup {
  name: string
  avatarSrc: string
  accent: ScheduleAccent
  substituteKey: ScheduleSubstituteSlug
  rows: ScheduleRow[]
}

export interface ScheduleDateBlock {
  id: string
  title: string
  defaultOpen: boolean
  groups: ScheduleUserGroup[]
}

const files2 = [
  { name: 'Повестка.docx', size: '128Кб' },
  { name: 'Список участников.pdf', size: '340Кб' }
] as const

const files3 = [
  { name: 'Презентация.pptx', size: '890Кб' },
  { name: 'Договор_скан.pdf', size: '1,1Мб' },
  { name: 'Фото_площадка.jpg', size: '640Кб' }
] as const

const files4 = [
  { name: 'Документ.docx', size: '512Кб' },
  { name: 'Презентация.pptx', size: '1,2Мб' },
  { name: 'Скан.pdf', size: '256Кб' },
  { name: 'Фото.jpg', size: '89Кб' }
] as const

const p = (name: string, src: string, card: ScheduleParticipant['card']): ScheduleParticipant => ({
  name,
  avatarSrc: src,
  card
})

const pool = {
  kk: p('Константинов К.К.', figmaScheduleAssets.avatar, {
    line1: 'Константинов Константин',
    line2: 'Константинович',
    email: 'konstantinovkk@admsr.ru',
    phone: '52-52-52 (вн. 9999)',
    address: 'Энгельса 10, кб. 300'
  }),
  ii: p('Иванова И.И.', figmaScheduleAssets.avatar, {
    line1: 'Иванова Инна',
    line2: 'Игоревна',
    email: 'ivanovaii@admsr.ru',
    phone: '52-52-53 (вн. 1201)',
    address: 'пр. Строителей 22, каб. 401'
  }),
  pp: p('Петров П.П.', figmaScheduleAssets.avatar, {
    line1: 'Петров Пётр',
    line2: 'Павлович',
    email: 'petrovpp@admsr.ru',
    phone: '52-52-54 (вн. 2108)',
    address: 'ул. Тельмана 115, каб. 18'
  }),
  ss: p('Смирнова С.С.', figmaScheduleAssets.avatar, {
    line1: 'Смирнова Светлана',
    line2: 'Сергеевна',
    email: 'smirnovass@admsr.ru',
    phone: '52-52-55 (вн. 3402)',
    address: 'ул. Ленина 21, каб. 505'
  }),
  rf: p('Марценковский Р.Ф.', figmaScheduleAssets.avatarMarcenkovskiy, {
    line1: 'Марценковский Роман',
    line2: 'Фёдорович',
    email: 'marcenkovskiy_rf@admsr.ru',
    phone: '52-52-56 (вн. 101)',
    address: 'пл. Пионеров 2, каб. 701'
  }),
  yv: p('Маркова Ю.В.', figmaScheduleAssets.avatarMarkova, {
    line1: 'Маркова Юлия',
    line2: 'Владимировна',
    email: 'markovayv@admsr.ru',
    phone: '52-52-57 (вн. 4500)',
    address: 'ул. Кирова 7, каб. 12'
  }),
  pa: p('Сидоров П.А.', figmaScheduleAssets.avatarSidorov, {
    line1: 'Сидоров Павел',
    line2: 'Александрович',
    email: 'sidorovpa@admsr.ru',
    phone: '52-52-58 (вн. 8801)',
    address: 'ул. Пушкина 24, каб. 3'
  }),
  or: p('Журавская О.Р.', figmaScheduleAssets.avatarZhuravskaya, {
    line1: 'Журавская Ольга',
    line2: 'Романовна',
    email: 'zhuravskayaor@admsr.ru',
    phone: '52-52-59 (вн. 2200)',
    address: 'ул. Московская 60, корп. Б, каб. 415'
  }),
  me: p('Нигматуллин М.Э.', figmaScheduleAssets.avatarNigmatullin, {
    line1: 'Нигматуллин Марат',
    line2: 'Эдуардович',
    email: 'nigmatullinme@admsr.ru',
    phone: '52-52-60 (вн. 3107)',
    address: 'ул. Спортивная 8, блок А, каб. 102'
  })
}

function row(r: ScheduleRow): ScheduleRow {
  return r
}

export const scheduleTitleOptions = [
  {
    label: 'Общий график',
    icon: 'i-lucide-file-text' as const,
    value: 'general' as const
  },
  {
    label: 'Марценковский Р.Ф.',
    avatar: { src: figmaScheduleAssets.avatarMarcenkovskiy },
    value: 'marcenkovskiy' as const
  },
  {
    label: 'Маркова Ю.В.',
    avatar: { src: figmaScheduleAssets.avatarMarkova },
    value: 'markova' as const
  },
  {
    label: 'Сидоров П.А.',
    avatar: { src: figmaScheduleAssets.avatarSidorov },
    value: 'sidorov' as const
  },
  {
    label: 'Журавская О.Р.',
    avatar: { src: figmaScheduleAssets.avatarZhuravskaya },
    value: 'zhuravskaya' as const
  },
  {
    label: 'Нигматуллин М.Э.',
    avatar: { src: figmaScheduleAssets.avatarNigmatullin },
    value: 'nigmatullin' as const
  }
] as const

/** Заголовок в шапке графика: общий / персональный (род. падеж). */
export function scheduleNavbarHeading(slug: ScheduleTitleValue): string {
  if (slug === 'general')
    return 'График заместителей общий'
  const bySlug: Record<ScheduleSubstituteSlug, string> = {
    marcenkovskiy: 'График Марценковского Р.Ф.',
    markova: 'График Марковой Ю.В.',
    sidorov: 'График Сидорова П.А.',
    zhuravskaya: 'График Журавской О.Р.',
    nigmatullin: 'График Нигматуллина М.Э.'
  }
  return bySlug[slug]
}

/** Аватар для шапки персонального графика (как в меню выбора). */
export function scheduleNavbarAvatar(
  slug: ScheduleTitleValue
): { src: string } | undefined {
  if (slug === 'general')
    return undefined
  const opt = scheduleTitleOptions.find(o => o.value === slug)
  return opt && 'avatar' in opt ? opt.avatar : undefined
}

export function filterScheduleBySubstitute(
  blocks: ScheduleDateBlock[],
  slug: ScheduleTitleValue
): ScheduleDateBlock[] {
  if (slug === 'general')
    return blocks
  return blocks.map(b => ({
    ...b,
    groups: b.groups.filter(g => g.substituteKey === slug)
  }))
}

export function findSubstituteGroup(
  block: ScheduleDateBlock,
  slug: ScheduleSubstituteSlug
): ScheduleUserGroup | undefined {
  return block.groups.find(g => g.substituteKey === slug)
}

const substituteAccentBySlug: Record<ScheduleSubstituteSlug, ScheduleAccent> = {
  marcenkovskiy: 'violet',
  markova: 'rose',
  sidorov: 'blue',
  zhuravskaya: 'amber',
  nigmatullin: 'emerald'
}

/** Группа заместителя в дне (создаётся при первом мероприятии на пустой день). */
export function ensureSubstituteGroup(
  block: ScheduleDateBlock,
  slug: ScheduleSubstituteSlug
): ScheduleUserGroup {
  const existing = findSubstituteGroup(block, slug)
  if (existing)
    return existing
  const opt = scheduleTitleOptions.find(o => o.value === slug)
  const group: ScheduleUserGroup = {
    name: opt?.label ?? slug,
    avatarSrc: opt && 'avatar' in opt ? opt.avatar.src : figmaScheduleAssets.avatar,
    accent: substituteAccentBySlug[slug],
    substituteKey: slug,
    rows: []
  }
  block.groups.push(group)
  return group
}

export function buildScheduleDayBlockSelectOptions(blocks: ScheduleDateBlock[]) {
  return blocks.map((block) => {
    const parts = parseScheduleDayBlockTitle(block.title)
    return {
      label: parts ? `${parts.relativeDay} ${parts.date}` : block.title,
      value: block.id
    }
  })
}

/** «ДД.ММ.ГГГГ» или «ДД.ММ.ГГГГ, ЧЧ:ММ» — момент создания записи. */
export function formatScheduleCreatedAtNow(allDay = false): string {
  const now = new Date()
  const dateStr = formatScheduleDateString(
    new CalendarDate(now.getFullYear(), now.getMonth() + 1, now.getDate())
  )
  if (allDay)
    return dateStr
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${dateStr}, ${hours}:${minutes}`
}

/** Заполняет `detail.createdAt`, если ещё нет (дата создания ≠ дата проведения). */
export function ensureScheduleRowDetailMeta(row: ScheduleRow, eventDateStr: string): void {
  const eventDate = parseScheduleDateString(eventDateStr)
  const allDay = row.detail?.allDay ?? false

  if (!row.detail) {
    row.detail = {
      date: eventDateStr,
      allDay
    }
  }
  else {
    row.detail.date = eventDateStr
    row.detail.allDay = allDay
  }

  if (row.detail.createdAt || row.detail.headerDateTime)
    return

  if (row.detail.sorting) {
    row.detail.createdAt = row.detail.sorting
    return
  }

  const createdDate = eventDate
    ? eventDate.subtract({ days: 1 })
    : today(getLocalTimeZone())

  if (allDay) {
    row.detail.createdAt = formatScheduleDateString(createdDate)
    return
  }

  const time = row.time.trim().match(/^\d{1,2}:\d{2}$/) ? row.time.trim() : '09:00'
  row.detail.createdAt = `${formatScheduleDateString(createdDate)}, ${time}`
}

/** Подпись под заголовком «Мероприятие» (дата создания, не проведения). */
export function getScheduleRowCreatedAt(row: ScheduleRow): string {
  const detail = row.detail
  if (!detail)
    return ''
  return detail.createdAt ?? detail.headerDateTime ?? detail.sorting ?? ''
}

/** Пустая строка для формы «Новое мероприятие». */
export function createEmptyScheduleRow(blockDate?: string): ScheduleRow {
  const date = blockDate ?? ''
  return {
    time: '09:00',
    placeLabel: '',
    placeAddress: '',
    topic: '',
    participants: [],
    attachmentsLabel: 'Нет файлов',
    attachmentFiles: [],
    hidden: false,
    detail: {
      date,
      allDay: false
    }
  }
}

/** Уникальный ключ участника (для фильтра и выбора). */
export function scheduleParticipantKey(participant: ScheduleParticipant): string {
  return participant.name
}

export function formatAttachmentFileSize(bytes: number): string {
  if (bytes < 1024)
    return `${bytes} Б`
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(1)} КБ`
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
}

const scheduleAttachmentDisplaySize = new WeakMap<File, string>()

const SCHEDULE_ATTACHMENT_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  txt: 'text/plain',
  html: 'text/html',
  htm: 'text/html',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip: 'application/zip',
  rar: 'application/vnd.rar',
  '7z': 'application/x-7z-compressed',
  mp4: 'video/mp4',
  mp3: 'audio/mpeg',
  wav: 'audio/wav'
}

export function mimeFromScheduleFileName(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  return SCHEDULE_ATTACHMENT_MIME[ext] ?? 'application/octet-stream'
}

/** Метаданные вложения → File для отображения в UFileUpload. */
export function scheduleAttachmentToFile(meta: { name: string, size: string }): File {
  const file = new File([], meta.name, {
    type: mimeFromScheduleFileName(meta.name),
    lastModified: Date.now()
  })
  scheduleAttachmentDisplaySize.set(file, meta.size)
  return file
}

export function scheduleFilesFromAttachments(
  items: { name: string, size: string }[]
): File[] {
  return items.map(scheduleAttachmentToFile)
}

/** Подпись размера в списке файлов (демо или реальная загрузка). */
export function scheduleFileDisplaySize(file: File): string {
  const saved = scheduleAttachmentDisplaySize.get(file)
  if (saved)
    return saved
  return formatAttachmentFileSize(file.size)
}

export function scheduleAttachmentsFromFiles(files: File[]): { name: string, size: string }[] {
  return files.map(file => ({
    name: file.name,
    size: scheduleFileDisplaySize(file)
  }))
}

function triggerFileDownload(file: File) {
  const url = URL.createObjectURL(file)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = file.name
  anchor.click()
  URL.revokeObjectURL(url)
}

export function downloadScheduleAttachment(meta: { name: string, size: string }) {
  triggerFileDownload(scheduleAttachmentToFile(meta))
}

export function downloadScheduleFile(file: File) {
  triggerFileDownload(file)
}

export function previewScheduleFile(file: File) {
  const url = URL.createObjectURL(file)
  window.open(url, '_blank', 'noopener,noreferrer')
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export function previewScheduleAttachment(meta: { name: string, size: string }) {
  previewScheduleFile(scheduleAttachmentToFile(meta))
}

export function formatAttachmentsLabel(count: number): string {
  if (count === 0)
    return 'Нет файлов'
  const mod100 = count % 100
  const mod10 = count % 10
  if (mod100 > 10 && mod100 < 20)
    return `${count} файлов`
  if (mod10 === 1)
    return `${count} файл`
  if (mod10 >= 2 && mod10 <= 4)
    return `${count} файла`
  return `${count} файлов`
}

/** Все уникальные участники из блоков графика, отсортированные по ФИО. */
export function collectScheduleParticipants(blocks: ScheduleDateBlock[]): ScheduleParticipant[] {
  const byKey = new Map<string, ScheduleParticipant>()
  for (const block of blocks) {
    for (const group of block.groups) {
      for (const row of group.rows) {
        for (const participant of row.participants)
          byKey.set(scheduleParticipantKey(participant), participant)
        const organizer = row.detail?.organizer
        if (organizer)
          byKey.set(scheduleParticipantKey(organizer), organizer)
      }
    }
  }
  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name, 'ru'))
}

export function scheduleRowMatchesFilters(
  row: ScheduleRow,
  query: string,
  participantKeys: string[]
): boolean {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length) {
    const haystack = [
      row.topic,
      row.placeLabel,
      row.placeAddress,
      formatSchedulePlace(row),
      formatScheduleRowTime(row),
      row.time,
      row.attachmentsLabel,
      ...row.attachmentFiles.map(f => f.name),
      ...row.participants.map(p => p.name),
      row.detail?.organizer?.name
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    if (!terms.every(term => haystack.includes(term)))
      return false
  }

  if (participantKeys.length > 0) {
    const rowParticipantKeys = new Set(
      row.participants.map(scheduleParticipantKey)
    )
    if (row.detail?.organizer)
      rowParticipantKeys.add(scheduleParticipantKey(row.detail.organizer))
    if (!participantKeys.some(key => rowParticipantKeys.has(key)))
      return false
  }

  return true
}

/** Ссылка на строку графика с группой-заместителем (для отображения). */
export interface ScheduleDayEntry {
  group: ScheduleUserGroup
  row: ScheduleRow
}

/** Минуты с полуночи из строки «ЧЧ:ММ». */
export function parseScheduleRowTimeMinutes(time: string): number {
  const m = time.trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!m)
    return 0
  return Number(m[1]) * 60 + Number(m[2])
}

export const SCHEDULE_ALL_DAY_LABEL = 'Весь день'

export function isScheduleRowAllDay(row: ScheduleRow): boolean {
  return Boolean(row.detail?.allDay)
}

/** Время в списке/доске: «Весь день» или «ЧЧ:ММ». */
export function formatScheduleRowTime(row: ScheduleRow): string {
  return isScheduleRowAllDay(row) ? SCHEDULE_ALL_DAY_LABEL : row.time
}

/** Сортировка: мероприятия на весь день — в начале дня. */
export function scheduleRowSortMinutes(row: ScheduleRow): number {
  if (isScheduleRowAllDay(row))
    return -1
  return parseScheduleRowTimeMinutes(row.time)
}

/** Все мероприятия дня, отсортированные по времени (не по руководителю). */
export function collectBlockEntriesSortedByTime(block: ScheduleDateBlock): ScheduleDayEntry[] {
  const entries: ScheduleDayEntry[] = block.groups.flatMap(group =>
    group.rows.map(row => ({ group, row }))
  )
  return entries.sort(
    (a, b) => scheduleRowSortMinutes(a.row) - scheduleRowSortMinutes(b.row)
  )
}

/** Фильтр строк внутри дней; пустые группы дня убираются, дни без событий остаются. */
export function filterScheduleBlocks(
  blocks: ScheduleDateBlock[],
  query: string,
  participantKeys: string[]
): ScheduleDateBlock[] {
  return blocks.map(block => ({
    ...block,
    groups: block.groups
      .map(group => ({
        ...group,
        rows: group.rows.filter(row =>
          scheduleRowMatchesFilters(row, query, participantKeys)
        )
      }))
      .filter(group => group.rows.length > 0)
  }))
}

export function schedulePathForSlug(slug: ScheduleTitleValue): string {
  if (slug === 'general')
    return '/schedule'
  return `/schedule/${slug}`
}

/** Первая дата вида ДД.ММ.ГГГГ из заголовка дня, напр. «Сегодня 12.05.2025 Вторник». */
export function parseDateFromScheduleBlockTitle(title: string): string | undefined {
  const m = title.match(/(\d{2}\.\d{2}\.\d{4})/)
  return m?.[1]
}

/** Строка ДД.ММ.ГГГГ → CalendarDate. */
export function parseScheduleDateString(value: string): CalendarDate | undefined {
  const m = value.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
  if (!m)
    return undefined
  return new CalendarDate(Number(m[3]), Number(m[2]), Number(m[1]))
}

/** CalendarDate → строка ДД.ММ.ГГГГ. */
export function formatScheduleDateString(date: CalendarDate | DateValue): string {
  const d = date instanceof CalendarDate ? date : new CalendarDate(date.year, date.month, date.day)
  const day = String(d.day).padStart(2, '0')
  const month = String(d.month).padStart(2, '0')
  return `${day}.${month}.${d.year}`
}

/** Id блока дня по дате ДД.ММ.ГГГГ. */
export function findScheduleBlockIdByDate(
  blocks: ScheduleDateBlock[],
  dateStr: string
): string | undefined {
  for (const block of blocks) {
    if (parseDateFromScheduleBlockTitle(block.title) === dateStr)
      return block.id
  }
  return undefined
}

/** Части заголовка дня: «Сегодня» | «Завтра» …, дата, день недели — для единого `font-semibold`. */
export interface ScheduleDayBlockTitleParts {
  relativeDay: string
  date: string
  weekday: string
}

export function parseScheduleDayBlockTitle(title: string): ScheduleDayBlockTitleParts | null {
  const relative = title.match(/^(Сегодня|Завтра|Послезавтра)\s+(\d{2}\.\d{2}\.\d{4})\s+(.+)$/)
  if (relative)
    return { relativeDay: relative[1], date: relative[2], weekday: relative[3] }
  const plain = title.match(/^(\d{2}\.\d{2}\.\d{4})\s+(.+)$/)
  if (plain)
    return { relativeDay: plain[1], date: plain[1], weekday: plain[2] }
  return null
}

/** Сколько дней подряд показывать в графике (первый — всегда сегодня). */
export const SCHEDULE_VISIBLE_DAYS = 7

const WEEKDAY_NAMES_RU = [
  'Воскресенье',
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота'
] as const

function weekdayNameRu(date: CalendarDate): string {
  const jsDay = new Date(date.year, date.month - 1, date.day).getDay()
  return WEEKDAY_NAMES_RU[jsDay]!
}

/** Заголовок блока дня: «Сегодня 18.05.2026 Вторник» или «21.05.2026 Четверг». */
export function buildScheduleDayBlockTitle(date: CalendarDate, dayOffset: number): string {
  const dateStr = formatScheduleDateString(date)
  const weekday = weekdayNameRu(date)
  if (dayOffset === 0)
    return `Сегодня ${dateStr} ${weekday}`
  if (dayOffset === 1)
    return `Завтра ${dateStr} ${weekday}`
  if (dayOffset === 2)
    return `Послезавтра ${dateStr} ${weekday}`
  return `${dateStr} ${weekday}`
}

/** Подпись в шапке колонки/секции списка. */
export function buildScheduleDayBlockHeading(title: string): {
  dayAndDate: string
  weekday: string
} | null {
  const parts = parseScheduleDayBlockTitle(title)
  if (!parts)
    return null
  const isRelative = parts.relativeDay === 'Сегодня'
    || parts.relativeDay === 'Завтра'
    || parts.relativeDay === 'Послезавтра'
  return {
    dayAndDate: isRelative ? `${parts.relativeDay} ${parts.date}` : parts.date,
    weekday: parts.weekday
  }
}

function remapGroupsToDate(groups: ScheduleUserGroup[], dateStr: string): ScheduleUserGroup[] {
  return groups.map(group => ({
    ...group,
    rows: group.rows.map((row) => {
      const next = structuredClone(row)
      ensureScheduleRowDetailMeta(next, dateStr)
      return next
    })
  }))
}

/** Блоки графика: каждый день подряд, первый — сегодня. */
export function createScheduleDateBlocks(
  referenceDate: CalendarDate = today(getLocalTimeZone())
): ScheduleDateBlock[] {
  const blocks: ScheduleDateBlock[] = []
  for (let offset = 0; offset < SCHEDULE_VISIBLE_DAYS; offset++) {
    const date = referenceDate.add({ days: offset })
    const dateStr = formatScheduleDateString(date)
    const seed = scheduleDaySeedBlocks[offset]
    const groups = seed
      ? remapGroupsToDate(structuredClone(seed.groups), dateStr)
      : []
    blocks.push({
      id: `day-${offset}`,
      title: buildScheduleDayBlockTitle(date, offset),
      defaultOpen: offset <= 2,
      groups
    })
  }
  return blocks
}

/** Демо-данные мероприятий по смещению от «сегодня» (0…2). */
const scheduleDaySeedBlocks: Pick<ScheduleDateBlock, 'groups'>[] = [
  {
    groups: [
      {
        name: 'Марценковский Р.Ф.',
        avatarSrc: figmaScheduleAssets.avatarMarcenkovskiy,
        accent: 'violet',
        substituteKey: 'marcenkovskiy',
        rows: [
          row({
            time: '09:30',
            placeLabel: 'г. Энгельс',
            placeAddress: 'Администрация ЭМР, пл. Пионеров, д. 2, зал заседаний',
            topic: 'Оперативное совещание: подготовка к выпускному в школах района',
            participants: [pool.rf, pool.kk, pool.ii],
            attachmentsLabel: '3 файла',
            attachmentFiles: [...files3]
          }),
          row({
            time: '15:00',
            placeLabel: 'г.п. Белый Яр',
            placeAddress: 'Дом культуры «Родник», ул. Школьная, д. 12',
            topic: 'Встреча с активом ТОС «Белоярский» по благоустройству общественных территорий',
            participants: [pool.rf, pool.pp, pool.ss],
            attachmentsLabel: '2 файла',
            attachmentFiles: [...files2]
          })
        ]
      },
      {
        name: 'Маркова Ю.В.',
        avatarSrc: figmaScheduleAssets.avatarMarkova,
        accent: 'rose',
        substituteKey: 'markova',
        rows: [
          row({
            time: '13:00',
            placeLabel: 'г.п. Белый Яр',
            placeAddress: 'МБОУ "Белоярская СОШ № 3", ул. Кугаевской, д. 5',
            topic:
              'Районная игра – квиз «Имею право?!» (для обучающихся 8–11 классов общеобразовательных организаций)',
            participants: [pool.kk, pool.ii, pool.pp, pool.ss],
            attachmentsLabel: '4 файла',
            attachmentFiles: [...files4],
            detail: {
              date: '13.05.2026',
              timeField: '13:00',
              sorting: '13.05.2026',
              completed: false,
              allDay: false,
              createdAt: '12.05.2026, 17:00',
              headerDateTime: '12.05.2026, 17:00',
              organizer: pool.pp
            }
          }),
          row({
            time: '16:30',
            placeLabel: 'г. Энгельс',
            placeAddress: 'ЦРТДЮ, ул. Тельмана, д. 140, каб. методиста',
            topic: 'Планёрка с руководителями кружков внеурочной деятельности (II полугодие)',
            participants: [pool.yv, pool.or],
            attachmentsLabel: '2 файла',
            attachmentFiles: [...files2],
            hidden: true
          })
        ]
      },
      {
        name: 'Сидоров П.А.',
        avatarSrc: figmaScheduleAssets.avatarSidorov,
        accent: 'blue',
        substituteKey: 'sidorov',
        rows: [
          row({
            time: '10:00',
            placeLabel: 'п. Придорожный',
            placeAddress: 'ФАП, ул. Центральная, д. 3 (мобильный комплекс)',
            topic: 'Выездной приём граждан по вопросам оказания медицинской помощи в сельской местности',
            participants: [pool.pa, pool.kk],
            attachmentsLabel: '2 файла',
            attachmentFiles: [...files2]
          })
        ]
      },
      {
        name: 'Журавская О.Р.',
        avatarSrc: figmaScheduleAssets.avatarZhuravskaya,
        accent: 'amber',
        substituteKey: 'zhuravskaya',
        rows: [
          row({
            time: '11:15',
            placeLabel: 'г. Энгельс',
            placeAddress: 'Министерство образования СО, ул. Ленина, д. 15, переговорная № 4',
            topic: 'Согласование графика аттестации педагогических работников на 2025–2026 уч. год',
            participants: [pool.or, pool.yv, pool.me],
            attachmentsLabel: '3 файла',
            attachmentFiles: [...files3]
          }),
          row({
            time: '14:45',
            placeLabel: 'г.п. Белый Яр',
            placeAddress: 'МБОУ «Белоярская СОШ № 1», актовый зал',
            topic: 'Семинар для завучей: цифровая отчётность и работа с ГИС «Образование»',
            participants: [pool.or, pool.ii],
            attachmentsLabel: '1 файл',
            attachmentFiles: [{ name: 'Инструкция.pdf', size: '420Кб' }]
          })
        ]
      },
      {
        name: 'Нигматуллин М.Э.',
        avatarSrc: figmaScheduleAssets.avatarNigmatullin,
        accent: 'emerald',
        substituteKey: 'nigmatullin',
        rows: [
          row({
            time: '12:00',
            placeLabel: 'г. Энгельс',
            placeAddress: 'Спорткомплекс «Олимпийский», ул. Спортивная, д. 8',
            topic: 'Координационный совет по ремонту спортивных залов школ и детских садов',
            participants: [pool.me, pool.pa, pool.rf],
            attachmentsLabel: '2 файла',
            attachmentFiles: [...files2]
          })
        ]
      }
    ]
  },
  {
    groups: [
      {
        name: 'Марценковский Р.Ф.',
        avatarSrc: figmaScheduleAssets.avatarMarcenkovskiy,
        accent: 'violet',
        substituteKey: 'marcenkovskiy',
        rows: [
          row({
            time: '08:45',
            placeLabel: 'г. Энгельс',
            placeAddress: 'Здание правительства СО (выездной блок), ул. Московская, д. 60',
            topic: 'Совещание с подрядчиками по срокам капитального ремонта объектов соцсферы',
            participants: [pool.rf, pool.kk],
            attachmentsLabel: '5 файлов',
            attachmentFiles: [
              { name: 'График_ремонт.xlsx', size: '96Кб' },
              { name: 'Смета.pdf', size: '2,4Мб' },
              { name: 'Фото_объект.zip', size: '8,1Мб' },
              { name: 'Договор.docx', size: '312Кб' },
              { name: 'Акт.pdf', size: '144Кб' }
            ],
            hidden: true
          })
        ]
      },
      {
        name: 'Маркова Ю.В.',
        avatarSrc: figmaScheduleAssets.avatarMarkova,
        accent: 'rose',
        substituteKey: 'markova',
        rows: [
          row({
            time: '13:30',
            placeLabel: 'г.п. Белый Яр',
            placeAddress: 'Детская школа искусств, ул. Мира, д. 7',
            topic: 'Просмотр отчётного концерта творческих коллективов перед районным фестивалем',
            participants: [pool.yv, pool.ss, pool.pp],
            attachmentsLabel: '2 файла',
            attachmentFiles: [...files2]
          })
        ]
      },
      {
        name: 'Журавская О.Р.',
        avatarSrc: figmaScheduleAssets.avatarZhuravskaya,
        accent: 'amber',
        substituteKey: 'zhuravskaya',
        rows: [
          row({
            time: '17:00',
            placeLabel: 'г. Энгельс',
            placeAddress: 'Институт развития образования, ауд. 201',
            topic: 'Круглый стол «Профильные классы и профориентация в малых населённых пунктах»',
            participants: [pool.or, pool.yv, pool.ii, pool.kk],
            attachmentsLabel: '3 файла',
            attachmentFiles: [...files3]
          })
        ]
      }
    ]
  },
  {
    groups: [
      {
        name: 'Сидоров П.А.',
        avatarSrc: figmaScheduleAssets.avatarSidorov,
        accent: 'blue',
        substituteKey: 'sidorov',
        rows: [
          row({
            time: '09:00',
            placeLabel: 'г. Энгельс',
            placeAddress: 'Поликлиника № 3, ул. Пушкина, д. 24, конференц-зал',
            topic: 'Комиссия по доступной среде: обсуждение заявок на оборудование пандусами школ',
            participants: [pool.pa, pool.me],
            attachmentsLabel: '2 файла',
            attachmentFiles: [...files2]
          }),
          row({
            time: '14:20',
            placeLabel: 'г.п. Белый Яр',
            placeAddress: 'Администрация ГП, ул. Советская, д. 1, каб. 12',
            topic: 'Приём граждан по личному графику (запись через Госуслуги)',
            participants: [pool.pa],
            attachmentsLabel: '1 файл',
            attachmentFiles: [{ name: 'Запись_на_приём.xlsx', size: '64Кб' }]
          })
        ]
      },
      {
        name: 'Нигматуллин М.Э.',
        avatarSrc: figmaScheduleAssets.avatarNigmatullin,
        accent: 'emerald',
        substituteKey: 'nigmatullin',
        rows: [
          row({
            time: '11:30',
            placeLabel: 'г. Энгельс',
            placeAddress: 'Стадион «Луч», проход через КПП № 2',
            topic: 'Инспекция готовности полей для детско-юношеских соревнований «Весна–2025»',
            participants: [pool.me, pool.rf],
            attachmentsLabel: '2 файла',
            attachmentFiles: [...files2]
          })
        ]
      },
      {
        name: 'Марценковский Р.Ф.',
        avatarSrc: figmaScheduleAssets.avatarMarcenkovskiy,
        accent: 'violet',
        substituteKey: 'marcenkovskiy',
        rows: [
          row({
            time: '16:00',
            placeLabel: 'г. Энгельс',
            placeAddress: 'МФЦ, ул. Тельмана, д. 140, зона «Социальное развитие»',
            topic: 'Презентация пилотного проекта «Единый социальный проездной» для сельских жителей',
            participants: [pool.rf, pool.or, pool.pa],
            attachmentsLabel: '4 файла',
            attachmentFiles: [...files4]
          })
        ]
      }
    ]
  }
]

export const scheduleDateBlocks = createScheduleDateBlocks()
