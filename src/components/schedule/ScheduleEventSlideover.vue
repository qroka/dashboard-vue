<script setup lang="ts">
import { CalendarDate } from '@internationalized/date'
import { computed, reactive, ref, watch } from 'vue'
import {
  findScheduleBlockIdByDate,
  formatAttachmentsLabel,
  formatScheduleCreatedAtNow,
  formatSchedulePlace,
  ensureScheduleRowDetailMeta,
  getScheduleRowCreatedAt,
  previewScheduleFile,
  scheduleAttachmentsFromFiles,
  scheduleFileDisplaySize,
  scheduleFilesFromAttachments,
  parseDateFromScheduleBlockTitle,
  parseScheduleDateString,
  scheduleParticipantKey,
  type ScheduleDateBlock,
  type ScheduleParticipant,
  type ScheduleRow,
  type ScheduleUserGroup
} from '../../data/schedule-mock'
import ScheduleAttachmentList from './ScheduleAttachmentList.vue'
import ScheduleDatePicker from './ScheduleDatePicker.vue'
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
  /** Создание нового мероприятия (только персональный график заместителя). */
  isCreate?: boolean
  /** Блоки дней графика для выбора даты при создании. */
  createDayBlocks?: ScheduleDateBlock[]
  /** Список участников для выбора в форме. */
  availableParticipants?: ScheduleParticipant[]
}>()

const createDayBlockId = defineModel<string>('createDayBlockId')

const toast = useToast()

const emit = defineEmits<{
  saved: []
}>()

const editable = computed(() => Boolean(props.editable || props.isCreate))
const isCreate = computed(() => Boolean(props.isCreate))

const d = computed(() => props.selection?.row.detail)

const draft = reactive({
  date: '',
  time: '',
  allDay: false,
  hidden: false,
  address: '',
  topic: ''
})

const selectedParticipantKeys = ref<string[]>([])
const attachmentFiles = ref<File[]>([])

function removeAttachmentAt(index: number) {
  attachmentFiles.value = attachmentFiles.value.filter((_, i) => i !== index)
}

const participantsByKey = computed(() => {
  const map = new Map<string, ScheduleParticipant>()
  for (const participant of props.availableParticipants ?? [])
    map.set(scheduleParticipantKey(participant), participant)
  return map
})

const participantSelectItems = computed(() =>
  (props.availableParticipants ?? []).map(participant => ({
    label: participant.name,
    value: scheduleParticipantKey(participant),
    avatar: { src: participant.avatarSrc, alt: participant.name }
  }))
)

const selectedParticipants = computed(() =>
  selectedParticipantKeys.value
    .map(key => participantsByKey.value.get(key))
    .filter((p): p is ScheduleParticipant => Boolean(p))
)

function removeParticipant(participant: ScheduleParticipant) {
  const key = scheduleParticipantKey(participant)
  selectedParticipantKeys.value = selectedParticipantKeys.value.filter(k => k !== key)
}

function syncDraftFromSelection() {
  const s = props.selection
  if (!s) {
    return
  }
  const r = s.row
  const bd = parseDateFromScheduleBlockTitle(s.block.title)
  if (bd)
    ensureScheduleRowDetailMeta(r, bd)
  draft.time = r.time
  draft.address = formatSchedulePlace(r)
  draft.topic = r.topic
  draft.date = r.detail?.date ?? bd ?? ''
  draft.allDay = r.detail?.allDay ?? false
  draft.hidden = r.hidden ?? false
  selectedParticipantKeys.value = r.participants.map(scheduleParticipantKey)
  attachmentFiles.value = scheduleFilesFromAttachments(r.attachmentFiles)
}

watch(
  () => props.selection,
  (s) => {
    if (s)
      syncDraftFromSelection()
  },
  { immediate: true }
)

const createAvailableDates = computed(() =>
  (props.createDayBlocks ?? [])
    .map(b => parseDateFromScheduleBlockTitle(b.title))
    .filter((d): d is string => Boolean(d))
)

const createCalendarRange = computed((): {
  min: CalendarDate | undefined
  max: CalendarDate | undefined
} => {
  if (!isCreate.value)
    return { min: undefined, max: undefined }
  const parsed = createAvailableDates.value
    .map(parseScheduleDateString)
    .filter((d): d is CalendarDate => Boolean(d))
    .sort((a, b) => a.compare(b))
  if (!parsed.length)
    return { min: undefined, max: undefined }
  return { min: parsed[0], max: parsed[parsed.length - 1] }
})

watch(
  () => draft.allDay,
  (allDay) => {
    if (allDay)
      draft.time = ''
  }
)

watch(
  () => draft.date,
  (dateStr) => {
    if (!isCreate.value || !dateStr || !props.createDayBlocks?.length)
      return
    const blockId = findScheduleBlockIdByDate(props.createDayBlocks, dateStr)
    if (blockId && createDayBlockId.value !== blockId)
      createDayBlockId.value = blockId
  }
)

/** Дата создания записи (не дата проведения мероприятия). */
const headerCreatedAt = computed(() => {
  if (isCreate.value)
    return formatScheduleCreatedAtNow(draft.allDay)
  const s = props.selection
  if (!s)
    return ''
  return getScheduleRowCreatedAt(s.row)
})
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
  r.time = draft.allDay ? '' : draft.time
  r.placeLabel = ''
  r.placeAddress = draft.address.trim()
  r.topic = draft.topic
  r.participants = [...selectedParticipants.value]
  if (!r.detail)
    r.detail = {}
  r.detail.date = draft.date
  r.detail.allDay = draft.allDay
  if (!r.detail.createdAt) {
    const eventDate = draft.date || parseDateFromScheduleBlockTitle(s.block.title) || ''
    if (isCreate.value)
      r.detail.createdAt = formatScheduleCreatedAtNow(draft.allDay)
    else
      ensureScheduleRowDetailMeta(r, eventDate)
  }
  r.hidden = draft.hidden
  r.attachmentFiles = scheduleAttachmentsFromFiles(attachmentFiles.value)
  r.attachmentsLabel = formatAttachmentsLabel(r.attachmentFiles.length)
}

function onSave() {
  if (!draft.topic.trim()) {
    toast.add({
      title: 'Укажите тему мероприятия',
      color: 'warning'
    })
    return
  }
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
            {{
              isCreate
                ? 'Новое мероприятие'
                : editable
                  ? 'Редактирование мероприятия'
                  : 'Мероприятие'
            }}
          </p>
          <div class="flex flex-wrap items-center gap-2 text-sm text-muted">
            <span v-if="headerCreatedAt">{{ headerCreatedAt }}</span>
            <ScheduleParticipantPopoverChip
              v-if="organizerParticipant && !isCreate"
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
          <UFormField :label="isCreate ? 'День' : 'Дата'" class="w-full shrink-0 sm:w-64">
            <ScheduleDatePicker
              v-model="draft.date"
              :disabled="!editable"
              :available-dates="isCreate ? createAvailableDates : undefined"
              :min-value="isCreate ? createCalendarRange.min : undefined"
              :max-value="isCreate ? createCalendarRange.max : undefined"
            />
          </UFormField>
          <UFormField v-if="!draft.allDay" label="Время" class="min-w-0 flex-1">
            <UInput
              v-model="draft.time"
              :disabled="!editable"
              variant="outline"
              class="w-full"
            />
          </UFormField>
        </div>

        <div class="flex flex-col gap-3">
          <USwitch
            v-model="draft.allDay"
            :disabled="!editable"
            label="Весь день"
          />
          <USwitch
            v-model="draft.hidden"
            :disabled="!editable"
            label="Скрыть"
          />
        </div>

        <UFormField label="Адрес">
          <UInput
            v-model="draft.address"
            :disabled="!editable"
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
          <USelectMenu
            v-if="editable"
            v-model="selectedParticipantKeys"
            :items="participantSelectItems"
            value-key="value"
            multiple
            placeholder="Выберите участников"
            icon="i-lucide-users"
            :search-input="{ placeholder: 'Найти участника…' }"
            class="w-full"
            :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
          />
          <div
            class="flex w-full flex-wrap gap-2 rounded-md border border-default px-3 py-2"
            :class="{ 'mt-2': editable }"
          >
            <ScheduleParticipantPopoverChip
              v-for="participant in editable ? selectedParticipants : selection.row.participants"
              :key="scheduleParticipantKey(participant)"
              variant="field"
              :participant="participant"
              :removable="editable"
              @remove="removeParticipant(participant)"
            />
            <span
              v-if="(editable ? selectedParticipants : selection.row.participants).length === 0"
              class="text-sm text-muted"
            >
              Участников пока нет
            </span>
          </div>
        </UFormField>

        <UFormField label="Приложения">
          <ScheduleAttachmentList
            v-if="!editable"
            :files="selection.row.attachmentFiles"
          />
          <UFileUpload
            v-else
            v-model="attachmentFiles"
            multiple
            layout="list"
            position="outside"
            :interactive="false"
            :file-delete="false"
            :file-image="false"
            icon="i-lucide-paperclip"
            label="Перетащите файлы сюда"
            description="Документы любого формата"
            class="w-full min-h-32"
          >
            <template #actions="{ open: openFileDialog }">
              <UButton
                label="Выбрать файлы"
                icon="i-lucide-upload"
                color="neutral"
                variant="outline"
                @click="openFileDialog()"
              />
            </template>

            <template #file-size="{ file }">
              {{ scheduleFileDisplaySize(file) }}
            </template>

            <template #file-trailing="{ file, index }">
              <div class="flex items-center gap-0.5">
                <UButton
                  color="neutral"
                  variant="link"
                  size="xs"
                  icon="i-lucide-eye"
                  class="px-1"
                  aria-label="Просмотреть файл"
                  @click.stop.prevent="previewScheduleFile(file)"
                />
                <UButton
                  color="neutral"
                  variant="link"
                  size="xs"
                  icon="i-lucide-x"
                  class="px-1"
                  aria-label="Удалить файл"
                  @click.stop.prevent="removeAttachmentAt(index)"
                />
              </div>
            </template>

            <template #files-bottom="{ removeFile, files }">
              <UButton
                v-if="files?.length"
                label="Удалить все файлы"
                color="neutral"
                variant="outline"
                class="mt-2 w-full justify-center"
                @click="removeFile()"
              />
            </template>
          </UFileUpload>
        </UFormField>
      </div>
    </template>

    <template v-if="selection && (editable || isCreate)" #footer>
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
          :label="isCreate ? 'Создать' : 'Сохранить'"
          color="primary"
          class="w-full justify-center"
          size="lg"
          @click="onSave"
        />
      </div>
    </template>
  </USlideover>
</template>
