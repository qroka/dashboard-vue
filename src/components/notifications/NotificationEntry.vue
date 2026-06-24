<script setup lang="ts">
import { computed } from 'vue'
import type { AppNotification, NotificationType } from '../../types/notifications'
import { formatActivityLogTimestamp } from '../../utils/logs'

const props = defineProps<{
  notification: AppNotification
}>()

const emit = defineEmits<{
  open: [notification: AppNotification]
}>()

const icon = computed(() => {
  const map: Record<NotificationType, string> = {
    'event.added': 'i-lucide-user-plus',
    'event.removed': 'i-lucide-user-minus',
    'event.cancelled': 'i-lucide-calendar-x',
    'event.updated': 'i-lucide-pencil-line',
    'event.reminder': 'i-lucide-bell-ring',
  }
  return map[props.notification.type]
})

const isUnread = computed(() => !props.notification.readAt)
</script>

<template>
  <button
    type="button"
    class="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-elevated/60"
    :class="isUnread ? 'bg-primary/5' : ''"
    @click="emit('open', notification)"
  >
    <div
      class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-elevated ring-1 ring-default"
      :class="isUnread ? 'text-primary' : 'text-muted'"
    >
      <UIcon :name="icon" class="size-4" />
    </div>
    <div class="min-w-0 flex-1">
      <div class="flex items-start justify-between gap-2">
        <p class="text-sm font-medium text-highlighted">
          {{ notification.title }}
        </p>
        <span
          v-if="isUnread"
          class="mt-1 size-2 shrink-0 rounded-full bg-primary"
          aria-hidden="true"
        />
      </div>
      <p class="mt-1 whitespace-pre-line text-xs leading-relaxed text-muted">
        {{ notification.body }}
      </p>
      <p class="mt-1.5 text-[11px] text-dimmed tabular-nums">
        {{ formatActivityLogTimestamp(notification.createdAt) }}
      </p>
    </div>
  </button>
</template>
