<script setup lang="ts">
import { computed } from 'vue'
import type { ScheduleParticipant } from '../../types/schedule'
import { formatParticipantShortName } from '../../utils/schedule'
import PersonAvatar from '../PersonAvatar.vue'

const props = defineProps<{
  participant: ScheduleParticipant
  /** `header` — шапка слайдовера; `field` — форма; `table` — ячейка графика; `log` — журнал. */
  variant?: 'header' | 'field' | 'table' | 'log'
  /** Создатель в шапке (a11y). */
  isCreator?: boolean
  /** Без карточки и клика (режим только просмотра). */
  disabled?: boolean
  /** Кнопка удаления справа на бейдже (форма). */
  removable?: boolean
}>()

const emit = defineEmits<{
  remove: []
}>()

const displayName = computed(() =>
  props.variant === 'table' || props.variant === 'log' || props.variant === 'header'
    ? formatParticipantShortName(props.participant.name)
    : props.participant.name,
)

const avatarSize = computed(() => {
  if (props.variant === 'table')
    return 'xs' as const
  if (props.variant === 'log')
    return '2xs' as const
  return 'xs' as const
})

const cardLine1 = computed(() => props.participant.card.line1?.trim() ?? '')
const cardLine2 = computed(() => props.participant.card.line2?.trim() ?? '')
const cardEmail = computed(() => props.participant.card.email?.trim() ?? '')
const cardPhone = computed(() => props.participant.card.phone?.trim() ?? '')
const cardAddress = computed(() => props.participant.card.address?.trim() ?? '')
</script>

<template>
  <div
    v-if="disabled"
    :class="[
      'inline-flex cursor-not-allowed items-center text-default/85',
      variant === 'header'
        ? 'gap-1 rounded-md px-2 py-1 text-xs font-medium text-default'
        : variant === 'table'
          ? 'gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-default'
          : 'gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-default'
    ]"
    aria-disabled="true"
  >
    <PersonAvatar :name="participant.name" :size="avatarSize" />
    <span>{{ displayName }}</span>
  </div>
  <div
    v-else-if="removable && variant === 'field'"
    class="inline-flex max-w-full items-stretch overflow-hidden rounded-md ring ring-inset ring-accented bg-elevated"
  >
    <UPopover
      mode="click"
      :content="{ side: 'bottom', sideOffset: 8, collisionPadding: 12 }"
    >
      <UButton
        color="neutral"
        variant="soft"
        size="xs"
        class="min-w-0 gap-1.5 rounded-none rounded-s-md px-2.5 py-1.5 pe-1.5"
        @click.stop
      >
        <PersonAvatar :name="participant.name" size="xs" />
        <span class="truncate text-xs font-medium">{{ participant.name }}</span>
      </UButton>
      <template #content>
        <div class="flex w-60 flex-col gap-2 rounded-md border border-default bg-default p-2">
          <div class="flex justify-center">
            <PersonAvatar :name="participant.name" size="hero" />
          </div>
          <div v-if="cardLine1 || cardLine2" class="text-center text-base font-medium text-default">
            <p v-if="cardLine1">{{ cardLine1 }}</p>
            <p v-if="cardLine2">{{ cardLine2 }}</p>
          </div>
          <div v-if="cardEmail" class="flex items-center gap-1.5 text-sm text-muted">
            <UIcon name="i-lucide-mail" class="size-5 shrink-0" />
            {{ cardEmail }}
          </div>
          <div v-if="cardPhone" class="flex items-center gap-1.5 text-sm text-muted">
            <UIcon name="i-lucide-phone" class="size-5 shrink-0" />
            {{ cardPhone }}
          </div>
          <div v-if="cardAddress" class="flex items-center gap-1.5 text-sm text-muted">
            <UIcon name="i-lucide-map-pin" class="size-5 shrink-0" />
            {{ cardAddress }}
          </div>
        </div>
      </template>
    </UPopover>
    <UButton
      color="neutral"
      variant="soft"
      size="xs"
      square
      icon="i-lucide-x"
      class="shrink-0 rounded-none rounded-e-md border-s border-default"
      aria-label="Удалить участника"
      @click.stop="emit('remove')"
    />
  </div>
  <UPopover
    v-else
    mode="click"
    :content="{ side: 'bottom', sideOffset: 8, collisionPadding: 12 }"
  >
    <UButton
      color="neutral"
      :variant="variant === 'table' || variant === 'log' ? 'ghost' : 'soft'"
      size="xs"
      :aria-label="isCreator ? 'Создатель мероприятия. Открыть карточку контакта' : undefined"
      :class="variant === 'header'
        ? 'gap-1 rounded-md px-2 py-1 text-xs font-medium text-default'
        : variant === 'log'
          ? 'gap-1 rounded-md px-2 py-0.5'
          : 'gap-1.5 rounded-md px-2.5 py-1.5'"
      @click.stop
    >
      <PersonAvatar :name="participant.name" :size="avatarSize" />
      <span
        :class="variant === 'header'
          ? ''
          : variant === 'table'
            ? 'text-sm font-medium'
            : variant === 'log'
              ? 'text-xs font-medium'
              : 'text-xs font-medium'"
      >{{ displayName }}</span>
    </UButton>
    <template #content>
      <div class="flex w-60 flex-col gap-2 rounded-md border border-default bg-default p-2">
        <div class="flex justify-center">
          <PersonAvatar :name="participant.name" size="hero" />
        </div>
        <div v-if="cardLine1 || cardLine2" class="text-center text-base font-medium text-default">
          <p v-if="cardLine1">{{ cardLine1 }}</p>
          <p v-if="cardLine2">{{ cardLine2 }}</p>
        </div>
        <div v-if="cardEmail" class="flex items-center gap-1.5 text-sm text-muted">
          <UIcon name="i-lucide-mail" class="size-5 shrink-0" />
          {{ cardEmail }}
        </div>
        <div v-if="cardPhone" class="flex items-center gap-1.5 text-sm text-muted">
          <UIcon name="i-lucide-phone" class="size-5 shrink-0" />
          {{ cardPhone }}
        </div>
        <div v-if="cardAddress" class="flex items-center gap-1.5 text-sm text-muted">
          <UIcon name="i-lucide-map-pin" class="size-5 shrink-0" />
          {{ cardAddress }}
        </div>
      </div>
    </template>
  </UPopover>
</template>
