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
  /** Строка под заголовком «Мероприятие», напр. «12.05.2026, 17:00». */
  headerDateTime?: string
  /** Кто создал мероприятие (карточка в слайдовере как у участника). */
  organizer?: ScheduleParticipant
}

export interface ScheduleRow {
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

/** Части заголовка дня: «Сегодня» | «Завтра» …, дата, день недели — для единого `font-semibold`. */
export interface ScheduleDayBlockTitleParts {
  relativeDay: string
  date: string
  weekday: string
}

export function parseScheduleDayBlockTitle(title: string): ScheduleDayBlockTitleParts | null {
  const m = title.match(/^(Сегодня|Завтра|Послезавтра)\s+(\d{2}\.\d{2}\.\d{4})\s+(.+)$/)
  if (!m)
    return null
  return { relativeDay: m[1], date: m[2], weekday: m[3] }
}

export const scheduleDateBlocks: ScheduleDateBlock[] = [
  {
    id: 'today',
    title: 'Сегодня 12.05.2025 Вторник',
    defaultOpen: true,
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
    id: 'tomorrow',
    title: 'Завтра 13.05.2025 Среда',
    defaultOpen: true,
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
    id: 'after',
    title: 'Послезавтра 14.05.2025 Четверг',
    defaultOpen: true,
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
