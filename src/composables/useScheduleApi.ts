import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date'
import type { ScheduleDateBlock, ScheduleRow, ScheduleTitleValue } from '../data/schedule-mock'
import { SCHEDULE_VISIBLE_DAYS } from '../data/schedule-mock'
import { apiFetch, isApiEnabled } from '../api/client'

function scheduleRange(): { from: string, to: string } {
  const tz = getLocalTimeZone()
  const start = today(tz)
  const end = start.add({ days: SCHEDULE_VISIBLE_DAYS - 1 })
  const fmt = (d: CalendarDate) =>
    `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
  return { from: fmt(start), to: fmt(end) }
}

export async function fetchScheduleBlocks(
  scope: ScheduleTitleValue,
  search?: string,
  participantKeys?: string[]
): Promise<ScheduleDateBlock[]> {
  const { from, to } = scheduleRange()
  const params = new URLSearchParams({ from, to })
  if (scope !== 'general')
    params.set('substitute', scope)
  else
    params.set('substitute', 'general')
  if (search?.trim())
    params.set('search', search.trim())
  if (participantKeys?.length)
    params.set('participant_keys', participantKeys.join(','))

  const res = await apiFetch<{ blocks: ScheduleDateBlock[] }>(`/schedule?${params}`)
  return res.blocks
}

export async function createScheduleEvent(payload: Record<string, unknown>): Promise<ScheduleRow & { id: string }> {
  return apiFetch('/events', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function updateScheduleEvent(id: string, payload: Record<string, unknown>): Promise<ScheduleRow> {
  return apiFetch(`/events/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  })
}

export async function deleteScheduleEvent(id: string): Promise<void> {
  await apiFetch(`/events/${id}`, { method: 'DELETE' })
}

export async function setScheduleEventHidden(id: string, hidden: boolean): Promise<ScheduleRow> {
  return apiFetch(`/events/${id}/hidden`, {
    method: 'PATCH',
    body: JSON.stringify({ hidden })
  })
}

export { isApiEnabled }
