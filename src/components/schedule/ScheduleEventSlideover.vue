<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import {
  parseDateFromScheduleBlockTitle,
  formatSchedulePlace,
  type ScheduleDateBlock,
  type ScheduleParticipant,
  type ScheduleRow,
  type ScheduleUserGroup
} from '../../data/schedule-mock'
import ScheduleParticipantPopoverChip from './ScheduleParticipantPopoverChip.vue'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  selection: {
    block: ScheduleDateBlock
    group: ScheduleUserGroup
    row: ScheduleRow
  } | null
  /** Режим редактирования: поля активны, внизу «Отмена» / «Сохранить». */
  editable?: boolean
}>()

const emit = defineEmits<{
  saved: []
}>()

const editable = computed(() => Boolean(props.editable))

const d = computed(() => props.selection?.row.detail)
const blockDate = computed(() =>
  props.selection ? parseDateFromScheduleBlockTitle(props.selection.block.title) : undefined)

const draft = reactive({
  date: '',
  time: '',
  sorting: '',
  completed: false,
  allDay: false,
  hidden: false,
  placeLabel: '',
  placeAddress: '',
  topic: ''
})

function syncDraftFromSelection() {
  const s = props.selection
  if (!s) {
    return
  }
  const r = s.row
  const bd = parseDateFromScheduleBlockTitle(s.block.title)
  draft.time = r.time
  draft.placeLabel = r.placeLabel
  draft.placeAddress = r.placeAddress
  draft.topic = r.topic
  draft.date = r.detail?.date ?? bd ?? ''
  draft.sorting = r.detail?.sorting ?? (r.detail?.date ?? bd ?? '')
  draft.completed = r.detail?.completed ?? false
  draft.allDay = r.detail?.allDay ?? false
  draft.hidden = r.hidden ?? false
}

watch(
  () => props.selection,
  (s) => {
    if (s)
      syncDraftFromSelection()
  },
  { immediate: true }
)

const headerDateTime = computed(
  () => d.value?.headerDateTime ?? [blockDate.value, props.selection?.row.time].filter(Boolean).join(', ')
)
const organizerParticipant = computed((): ScheduleParticipant | null => {
  if (!props.selection)
    return null
  if (d.value?.organizer)
    return d.value.organizer
  return props.selection.row.participants[0] ?? null
})

function applyDraftToRow() {
  const s = props.selection
  if (!s)
    return
  const r = s.row
  r.time = draft.time
  r.placeLabel = draft.placeLabel
  r.placeAddress = draft.placeAddress
  r.topic = draft.topic
  if (!r.detail)
    r.detail = {}
  r.detail.date = draft.date
  r.detail.sorting = draft.sorting
  r.detail.completed = draft.completed
  r.detail.allDay = draft.allDay
  r.hidden = draft.hidden
}

function onSave() {
  applyDraftToRow()
  emit('saved')
  open.value = false
}

function onCancelEdit() {
  syncDraftFromSelection()
  open.value = false
}
</script>

<template>
  <USlideover
    v-model:open="open"
    :close="false"
    :ui="{
      content: 'w-full max-w-[min(100vw,620px)] sm:max-w-[620px]',
      overlay: 'backdrop-blur-[5px] bg-elevated/40',
      body: 'flex min-h-0 flex-1 flex-col overflow-y-auto p-0',
      footer: 'border-t border-default bg-default shrink-0'
    }"
  >
    <template v-if="selection" #header>
      <div class="flex w-full items-start justify-between gap-4">
        <div class="flex min-w-0 flex-1 flex-col gap-1">
          <p class="text-base font-semibold text-highlighted" role="heading" :aria-level="2">
            {{ editable ? 'Редактирование мероприятия' : 'Мероприятие' }}
          </p>
          <div class="flex flex-wrap items-center gap-2 text-sm text-muted">
            <span>{{ headerDateTime }}</span>
            <ScheduleParticipantPopoverChip
              v-if="organizerParticipant"
              variant="header"
              is-creator
              :participant="organizerParticipant"
            />
          </div>
        </div>
        <UButton
          color="neutral"
          variant="ghost"
          square
          icon="i-lucide-x"
          class="shrink-0"
          :aria-label="editable ? 'Закрыть без сохранения' : 'Закрыть'"
          @click="editable ? onCancelEdit() : (open = false)"
        />
      </div>
    </template>

    <template v-if="selection" #body>
      <div class="flex flex-col gap-3">
        <div class="flex w-full flex-col gap-3 sm:flex-row sm:items-start sm:gap-3">
          <UFormField label="Дата" class="w-full shrink-0 sm:w-64">
            <UInput
              v-model="draft.date"
              :disabled="!editable"
              variant="outline"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Время" class="min-w-0 flex-1">
            <UInput
              v-model="draft.time"
              :disabled="!editable"
              variant="outline"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField label="Сортировка">
          <UInput
            v-model="draft.sorting"
            :disabled="!editable"
            variant="outline"
            class="w-full"
          />
        </UFormField>

        <div class="flex flex-wrap items-start gap-6">
          <UCheckbox v-model="draft.completed" :disabled="!editable" label="Выполнено" />
          <UCheckbox v-model="draft.allDay" :disabled="!editable" label="Весь день" />
          <UCheckbox
            v-model="draft.hidden"
            :disabled="!editable"
            label="Скрыть"
          />
        </div>

        <template v-if="editable">
          <UFormField label="Населённый пункт">
            <UInput
              v-model="draft.placeLabel"
              variant="outline"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Адрес">
            <UInput
              v-model="draft.placeAddress"
              variant="outline"
              class="w-full"
            />
          </UFormField>
        </template>
        <UFormField v-else label="Место">
          <UInput
            :model-value="formatSchedulePlace(selection.row)"
            disabled
            variant="outline"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Тема">
          <UTextarea
            v-model="draft.topic"
            :disabled="!editable"
            variant="outline"
            :rows="4"
            autoresize
            class="w-full"
          />
        </UFormField>

        <UFormField label="Участники">
          <div
            class="flex w-full flex-wrap gap-2 rounded-md border border-default px-3 py-2"
          >
            <ScheduleParticipantPopoverChip
              v-for="(participant, pi) in selection.row.participants"
              :key="pi"
              variant="field"
              :participant="participant"
            />
          </div>
        </UFormField>

        <UFormField label="Приложения">
          <div class="flex flex-col gap-2">
            <div
              v-for="(file, fi) in selection.row.attachmentFiles"
              :key="fi"
              class="flex w-full items-center gap-1.5 rounded-md border border-default px-2.5 py-1.5"
            >
              <div class="flex shrink-0 items-center rounded-full bg-elevated p-2">
                <UIcon name="i-lucide-file" class="size-4 text-muted" />
              </div>
              <div class="min-w-0 flex flex-col text-sm leading-5">
                <span class="truncate text-default">{{ file.name }}</span>
                <span class="text-muted">{{ file.size }}</span>
              </div>
            </div>
          </div>
        </UFormField>
      </div>
    </template>

    <template v-if="selection && editable" #footer>
      <div class="flex w-full gap-2 ">
        <UButton
          label="Отмена"
          color="neutral"
          variant="subtle"
          class="w-full justify-center"
          size="lg"
          @click="onCancelEdit"
        />
        <UButton
          label="Сохранить"
          color="primary"
          class="w-full justify-center"
          size="lg"
          @click="onSave"
        />
      </div>
    </template>
  </USlideover>
</template>
