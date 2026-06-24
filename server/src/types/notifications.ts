export type NotificationType =
  | 'event.added'
  | 'event.removed'
  | 'event.cancelled'
  | 'event.updated'
  | 'event.reminder'

export interface NotificationChangeMeta {
  label: string
  before: string
  after: string
}

export interface NotificationMeta {
  eventTopic?: string
  eventDate?: string
  eventTime?: string
  allDay?: boolean
  changes?: NotificationChangeMeta[]
}

export interface NotificationRow {
  id: number
  userId: number
  type: NotificationType
  title: string
  body: string
  eventId: number | null
  meta: NotificationMeta | null
  readAt: string | null
  createdAt: string
}
