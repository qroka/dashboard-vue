<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ActivityLogEntry } from '../../types/logs'
import type { ScheduleParticipant } from '../../types/schedule'
import {
  activityLogCategoryLabel,
  activityLogHasEventDetails,
  activityLogLevelLabel,
  formatActivityLogTimestamp,
  isActivityLogSystemActor,
  parseActivityLogMeta,
} from '../../utils/logs'
import ScheduleParticipantPopoverChip from '../schedule/ScheduleParticipantPopoverChip.vue'

const props = defineProps<{
  entry: ActivityLogEntry
  actorParticipant?: ScheduleParticipant | null
}>()

const emit = defineEmits<{
  openEvent: [eventId: number]
}>()

const expanded = ref(false)

const meta = computed(() => parseActivityLogMeta(props.entry.meta))

const levelColor = computed(() => {
  const map = {
    info: 'primary',
    success: 'success',
    warning: 'warning',
    error: 'error',
  } as const
  return map[props.entry.level]
})

const categoryIcon = computed(() => {
  const map = {
    auth: 'i-lucide-log-in',
    event: 'i-lucide-calendar-range',
    attachment: 'i-lucide-paperclip',
    participant: 'i-lucide-users',
    system: 'i-lucide-server',
  } as const
  return map[props.entry.category]
})

const isSystemActor = computed(() => isActivityLogSystemActor(props.entry))

const isEventEntity = computed(() =>
  props.entry.entityType === 'event' && props.entry.entityId != null,
)

const hasDetails = computed(() => activityLogHasEventDetails(props.entry)
  || Boolean(meta.value?.files?.length)
  || props.entry.entityId != null)

function toggleExpanded() {
  if (hasDetails.value)
    expanded.value = !expanded.value
}

function openEvent() {
  if (props.entry.entityId != null)
    emit('openEvent', props.entry.entityId)
}
</script>

<template>
  <UCard
    variant="subtle"
    class="shrink-0 overflow-hidden transition-colors hover:ring-primary/20"
  >
    <div class="flex w-full items-start gap-3 px-4 py-3">
      <div
        class="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-elevated ring ring-default"
      >
        <UIcon :name="categoryIcon" class="size-4 text-muted" />
      </div>

      <div class="min-w-0 flex-1 space-y-1.5">
        <div class="flex flex-wrap items-center gap-2">
          <UBadge
            :color="levelColor"
            variant="subtle"
            size="sm"
            :label="activityLogLevelLabel(entry.level)"
          />
          <UBadge
            color="neutral"
            variant="outline"
            size="sm"
            :label="activityLogCategoryLabel(entry.category)"
          />
          <span class="text-xs text-dimmed tabular-nums">
            {{ formatActivityLogTimestamp(entry.createdAt) }}
          </span>
        </div>

        <button
          type="button"
          class="-mx-1 w-full rounded-md px-1 py-0.5 text-left transition-colors hover:bg-elevated/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"
          :class="hasDetails ? 'cursor-pointer' : 'cursor-default'"
          :aria-expanded="hasDetails ? expanded : undefined"
          @click="toggleExpanded"
        >
          <p class="text-sm font-medium leading-snug text-highlighted">
            {{ entry.message }}
          </p>
        </button>

        <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted">
          <span class="inline-flex items-center gap-1">
            <UIcon name="i-lucide-user" class="size-3.5 shrink-0" />
            <ScheduleParticipantPopoverChip
              v-if="actorParticipant"
              variant="table"
              :participant="actorParticipant"
              @click.stop
            />
            <span v-else-if="isSystemActor">Система</span>
            <span v-else>
              {{ entry.userName?.trim() || entry.userLogin?.trim() }}
            </span>
          </span>
          <span v-if="entry.ipAddress" class="inline-flex items-center gap-1 tabular-nums">
            <UIcon name="i-lucide-globe" class="size-3.5 shrink-0" />
            {{ entry.ipAddress }}
          </span>
          <span v-if="entry.entityId != null" class="inline-flex items-center gap-1">
            <UIcon name="i-lucide-hash" class="size-3.5 shrink-0" />
            <UButton
              v-if="isEventEntity"
              variant="link"
              color="primary"
              size="xs"
              class="h-auto p-0 font-normal"
              :label="`${entry.entityType} #${entry.entityId}`"
              @click.stop="openEvent"
            />
            <span v-else>
              {{ entry.entityType ?? 'запись' }} #{{ entry.entityId }}
            </span>
          </span>
        </div>
      </div>

      <UButton
        v-if="hasDetails"
        color="neutral"
        variant="ghost"
        square
        size="xs"
        class="mt-1 shrink-0"
        :icon="expanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
        :aria-label="expanded ? 'Свернуть детали' : 'Развернуть детали'"
        @click="toggleExpanded"
      />
    </div>

    <div
      v-if="expanded && hasDetails"
      class="border-t border-default bg-elevated/30 px-4 py-3"
    >
      <div v-if="meta?.fields?.length" class="mb-3 space-y-2">
        <p class="text-xs font-medium tracking-wide text-dimmed uppercase">
          Данные
        </p>
        <dl class="grid gap-2 sm:grid-cols-2">
          <div
            v-for="field in meta.fields"
            :key="field.key"
            class="rounded-md border border-default bg-default px-3 py-2"
          >
            <dt class="text-xs text-dimmed">
              {{ field.label }}
            </dt>
            <dd class="mt-0.5 text-sm text-default">
              {{ field.value }}
            </dd>
          </div>
        </dl>
      </div>

      <div v-if="meta?.changes?.length" class="mb-3 space-y-2">
        <p class="text-xs font-medium tracking-wide text-dimmed uppercase">
          Изменения
        </p>
        <ul class="space-y-2">
          <li
            v-for="change in meta.changes"
            :key="change.key"
            class="rounded-md border border-default bg-default px-3 py-2 text-sm"
          >
            <p class="text-xs text-dimmed">
              {{ change.label }}
            </p>
            <p class="mt-1 text-muted line-through">
              {{ change.before || '—' }}
            </p>
            <p class="mt-0.5 font-medium text-default">
              {{ change.after || '—' }}
            </p>
          </li>
        </ul>
      </div>

      <div v-if="meta?.files?.length" class="space-y-2">
        <p class="text-xs font-medium tracking-wide text-dimmed uppercase">
          Файлы
        </p>
        <ul class="flex flex-wrap gap-2">
          <li
            v-for="file in meta.files"
            :key="file"
          >
            <UBadge
              color="neutral"
              variant="subtle"
              size="sm"
              icon="i-lucide-file"
              :label="file"
            />
          </li>
        </ul>
      </div>
    </div>
  </UCard>
</template>
