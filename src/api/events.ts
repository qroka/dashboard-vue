import { apiFetch } from './client'
import type { ApiEvent } from './types'

export async function fetchEventById(id: number): Promise<ApiEvent> {
  const res = await apiFetch<{
    success: boolean
    event?: ApiEvent
    error?: string
  }>(`/api/events/${id}`)

  if (!res.success || !res.event)
    throw new Error(res.error ?? 'Мероприятие не найдено')

  return res.event
}
