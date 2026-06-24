import { apiFetch } from './client'
import type { AppNotification } from '../types/notifications'

export interface NotificationsResponse {
  success: boolean
  total: number
  unread: number
  items: AppNotification[]
}

export async function fetchNotifications(params?: {
  limit?: number
  offset?: number
  unreadOnly?: boolean
}): Promise<NotificationsResponse> {
  const search = new URLSearchParams()
  if (params?.limit != null)
    search.set('limit', String(params.limit))
  if (params?.offset != null)
    search.set('offset', String(params.offset))
  if (params?.unreadOnly)
    search.set('unreadOnly', 'true')

  const query = search.toString()
  return apiFetch<NotificationsResponse>(`/api/notifications${query ? `?${query}` : ''}`)
}

export async function markNotificationRead(id: number): Promise<void> {
  await apiFetch<{ success: boolean }>(`/api/notifications/${id}/read`, {
    method: 'POST',
  })
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiFetch<{ success: boolean }>('/api/notifications/read-all', {
    method: 'POST',
  })
}
