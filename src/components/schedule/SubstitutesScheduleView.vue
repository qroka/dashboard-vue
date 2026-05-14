<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useHead } from '@unhead/vue'
import { useRoute, useRouter } from 'vue-router'
import type { DropdownMenuItem } from '@nuxt/ui'
import {
  filterScheduleBySubstitute,
  formatSchedulePlace,
  parseScheduleDayBlockTitle,
  parseScheduleSlugFromPath,
  scheduleDateBlocks as initialScheduleDateBlocks,
  scheduleNavbarAvatar,
  scheduleNavbarHeading,
  schedulePathForSlug,
  scheduleTitleOptions,
  type ScheduleDateBlock,
  type ScheduleRow,
  type ScheduleTitleValue,
  type ScheduleUserGroup
} from '../../data/schedule-mock'
import ScheduleEventSlideover from './ScheduleEventSlideover.vue'
import ScheduleParticipantPopoverChip from './ScheduleParticipantPopoverChip.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const view = ref<'list' | 'board'>('list')

const scheduleBlocks = ref<ScheduleDateBlock[]>(
  JSON.parse(JSON.stringify(initialScheduleDateBlocks)) as ScheduleDateBlock[]
)

const scope = computed<ScheduleTitleValue>(() => parseScheduleSlugFromPath(route.path))

const isScheduleGeneralView = computed(() => scope.value === 'general')

const scheduleGridTemplate = computed(() =>
  isScheduleGeneralView.value
    ? '77px 256px 1fr 1fr 140px'
    : '77px 256px 1fr 1fr 140px 52px')

const visibleBlocks = computed(() =>
  filterScheduleBySubstitute(scheduleBlocks.value, scope.value))

/** «Сегодня 12.05.2026» одним куском (tabular-nums), день недели отдельно. */
const dayBlockHeadings = computed(() => {
  const out = new Map<string, { dayAndDate: string; weekday: string }>()
  for (const b of visibleBlocks.value) {
    const p = parseScheduleDayBlockTitle(b.title)
    if (p)
      out.set(b.id, { dayAndDate: `${p.relativeDay} ${p.date}`, weekday: p.weekday })
  }
  return out
})

const pageTitle = computed(() =>
  scope.value === 'general'
    ? 'График заместителей — общий'
    : scheduleNavbarHeading(scope.value))

useHead({
  title: pageTitle
})

const titleMenuItems = computed<DropdownMenuItem[][]>(() => [
  scheduleTitleOptions.map(opt => ({
    label: opt.label,
    description: 'description' in opt
      ? (opt as { description?: string }).description
      : undefined,
    icon: 'icon' in opt ? opt.icon : undefined,
    avatar: 'avatar' in opt ? opt.avatar : undefined,
    onSelect() {
      void router.push(schedulePathForSlug(opt.value))
    }
  }))
])

const headerTitle = computed(() => scheduleNavbarHeading(scope.value))

const navbarAvatar = computed(() => scheduleNavbarAvatar(scope.value))

const viewTabs = [
  { label: 'Сетка', value: 'list', icon: 'i-lucide-table-properties' },
  { label: 'Доска', value: 'board', icon: 'i-lucide-calendar-fold' }
]

const eventDetailOpen = ref(false)
const eventSlideoverEditable = ref(false)
const eventSelection = ref<{
  block: ScheduleDateBlock
  group: ScheduleUserGroup
  row: ScheduleRow
} | null>(null)

function openEventDetail(
  block: ScheduleDateBlock,
  group: ScheduleUserGroup,
  row: ScheduleRow,
  editable = false
) {
  eventSlideoverEditable.value = editable
  eventSelection.value = { block, group, row }
  eventDetailOpen.value = true
}

watch(eventDetailOpen, (isOpen) => {
  if (!isOpen) {
    eventSelection.value = null
    eventSlideoverEditable.value = false
  }
})

function onEventSlideoverSaved() {
  toast.add({
    title: 'Изменения сохранены',
    description: 'Данные мероприятия обновлены.',
    color: 'success'
  })
}

function onScheduleRowActivate(block: ScheduleDateBlock, group: ScheduleUserGroup, row: ScheduleRow) {
  if (row.hidden)
    return
  openEventDetail(block, group, row, false)
}

function attachmentMenu(row: ScheduleRow): DropdownMenuItem[][] {
  return [row.attachmentFiles.map(f => ({
    label: f.name,
    description: f.size,
    icon: 'i-lucide-file'
  }))]
}

function accentBorderClass(accent: ScheduleUserGroup['accent']) {
  const map: Record<ScheduleUserGroup['accent'], string> = {
    rose: 'border-b border-[#e7000b]',
    blue: 'border-b border-[#155dfc]',
    violet: 'border-b border-[#7c3aed]',
    amber: 'border-b border-[#d97706]',
    emerald: 'border-b border-[#059669]'
  }
  return map[accent]
}

function accentSurfaceClass(accent: ScheduleUserGroup['accent']) {
  const map: Record<ScheduleUserGroup['accent'], string> = {
    rose: 'bg-[rgba(251,44,54,0.04)]',
    blue: 'bg-[rgba(43,127,255,0.04)]',
    violet: 'bg-[rgba(124,58,237,0.04)]',
    amber: 'bg-[rgba(217,119,6,0.04)]',
    emerald: 'bg-[rgba(5,150,105,0.04)]'
  }
  return map[accent]
}

const deleteModalOpen = ref(false)
const deletePending = ref<{
  block: ScheduleDateBlock
  group: ScheduleUserGroup
  row: ScheduleRow
} | null>(null)

const deleteModalDescription = computed(() => {
  const p = deletePending.value
  if (!p)
    return 'Это действие нельзя отменить.'
  const t = p.row.topic
  const short = t.length > 120 ? `${t.slice(0, 120)}…` : t
  return `Событие «${short}» будет удалено без возможности восстановления.`
})

function rowContextMenuItems(
  block: ScheduleDateBlock,
  group: ScheduleUserGroup,
  row: ScheduleRow
): DropdownMenuItem[][] {
  return [[
    {
      label: 'Редактировать',
      icon: 'i-lucide-pencil',
      onSelect() {
        onEditEvent(block, group, row)
      }
    },
    {
      label: 'Удалить',
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect() {
        onRequestDelete(block, group, row)
      }
    }
  ]]
}

function onEditEvent(block: ScheduleDateBlock, group: ScheduleUserGroup, row: ScheduleRow) {
  openEventDetail(block, group, row, true)
}

function onRequestDelete(block: ScheduleDateBlock, group: ScheduleUserGroup, row: ScheduleRow) {
  deletePending.value = { block, group, row }
  deleteModalOpen.value = true
}

function removeScheduleRow(blockId: string, substituteKey: string, row: ScheduleRow) {
  const block = scheduleBlocks.value.find(b => b.id === blockId)
  if (!block)
    return
  const group = block.groups.find(g => g.substituteKey === substituteKey && g.rows.includes(row))
  if (!group)
    return
  const idx = group.rows.indexOf(row)
  if (idx !== -1)
    group.rows.splice(idx, 1)
  if (!group.rows.length) {
    const gi = block.groups.indexOf(group)
    if (gi !== -1)
      block.groups.splice(gi, 1)
  }
}

function confirmDeleteEvent() {
  const p = deletePending.value
  if (!p)
    return
  const { block, group, row } = p
  if (eventSelection.value?.row === row)
    eventDetailOpen.value = false
  removeScheduleRow(block.id, group.substituteKey, row)
  deleteModalOpen.value = false
  deletePending.value = null
  toast.add({
    title: 'Мероприятие удалено',
    description: row.topic.length > 100 ? `${row.topic.slice(0, 100)}…` : row.topic,
    color: 'success'
  })
}

function cancelDeleteEvent() {
  deleteModalOpen.value = false
  deletePending.value = null
}
</script>

<template>
  <UDashboardPanel
    id="substitutes-schedule"
    :ui="{
      root: 'flex min-h-0 min-w-0 flex-1 flex-col',
      body: 'flex min-h-0 flex-1 flex-col overflow-hidden px-6 sm:px-6 pt-6 sm:pt-6 pb-0 sm:pb-0'
    }"
  >
    <template #header>
      <UDashboardNavbar :ui="{ right: 'gap-3' }">
        <template #leading>
          <div class="flex min-w-0 items-center gap-1.5">
            <UDashboardSidebarCollapse/>
            <UDropdownMenu
              :items="titleMenuItems"
              :content="{ align: 'end', collisionPadding: 12 }"
            >
              <UButton
                color="neutral"
                variant="ghost"
                size="xl"
                class="h-auto max-w-full gap-2 px-1.5 font-semibold text-highlighted"
              >
                <UAvatar
                  v-if="navbarAvatar"
                  v-bind="navbarAvatar"
                  size="xs"
                  class="shrink-0"
                />
                <span class="min-w-0 truncate">{{ headerTitle }}</span>
                <UIcon name="i-lucide-chevron-down" class="size-6 shrink-0 text-dimmed" />
              </UButton>
            </UDropdownMenu>
          </div>
        </template>

        <template #right>
          <UTabs
            v-model="view"
            :items="viewTabs"
            :content="false"
            size="sm"
            color="neutral"
            class="w-full max-w-[calc(100vw-12rem)] sm:max-w-md"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex min-h-0 min-w-0 flex-1 flex-col">
        <div
          v-if="view === 'board'"
          class="text-muted flex min-h-48 shrink-0 items-center justify-center rounded-lg border border-dashed border-default text-sm"
        >
          Режим «Доска» — заглушка (в макете активен «Список»).
        </div>

        <div
          v-else
          class="min-h-0 min-w-0 flex-1 overflow-auto rounded-t-lg border border-default bg-default"
        >
          <div :class="isScheduleGeneralView ? 'min-w-[1100px]' : 'min-w-[1160px]'">
            <div
              class="sticky top-0 z-20 grid rounded-t-lg border-b border-default bg-default text-sm font-medium text-default"
              :style="{ gridTemplateColumns: scheduleGridTemplate }"
            >
            <div class="border-default flex h-12 items-center border-r px-1.5 py-3.5">
              <span class="rounded-md px-2.5 py-1.5">Время</span>
            </div>
            <div class="border-default flex h-12 items-center border-r px-1.5 py-3.5">
              <span class="rounded-md px-2.5 py-1.5">Место</span>
            </div>
            <div class="border-default flex h-12 items-center border-r px-1.5 py-3.5">
              <span class="rounded-md px-2.5 py-1.5">Тема</span>
            </div>
            <div class="border-default flex h-12 items-center border-r px-1.5 py-3.5">
              <span class="rounded-md px-2.5 py-1.5">Участники</span>
            </div>
            <div class="border-default flex h-12 items-center border-r px-1.5 py-3.5">
              <span class="rounded-md px-2.5 py-1.5">Приложения</span>
            </div>
            <div
              v-if="!isScheduleGeneralView"
              class="border-default flex h-12 items-center justify-center px-1"
              aria-hidden="true"
            />
          </div>

          <UCollapsible
            v-for="block in visibleBlocks"
            :key="block.id"
            :default-open="block.defaultOpen"
          >
            <template #default="{ open }">
              <UButton
                color="neutral"
                variant="ghost"
                class="sticky top-12 z-10 flex w-full items-center justify-start gap-3 rounded-none border-b border-accented bg-default px-4 py-4 text-highlighted hover:bg-elevated"
              >
                <UIcon
                  :name="open ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
                  class="size-6 text-dimmed"             
                />
                <span
                  v-if="dayBlockHeadings.has(block.id)"
                  class="inline-flex flex-wrap items-baseline gap-x-1.5 text-base font-semibold text-highlighted"
                >
                  <span class="tabular-nums">{{ dayBlockHeadings.get(block.id)!.dayAndDate }}</span>
                  <span>{{ dayBlockHeadings.get(block.id)!.weekday }}</span>
                </span>
                <span v-else class="text-base font-semibold text-highlighted">{{ block.title }}</span>
              </UButton>
            </template>

            <template #content>
              <div v-if="!block.groups.length" class="text-muted px-4 py-3 text-sm border-b border-default">
                Нет событий
              </div>

              <div
                v-for="(group, gi) in block.groups"
                :key="`${block.id}-${gi}`"
                :class="isScheduleGeneralView ? accentBorderClass(group.accent) : 'border-b border-default'"
              >
                <div
                  v-if="isScheduleGeneralView"
                  :class="[
                    'flex items-center gap-3 border-b border-default px-4 py-2',
                    accentSurfaceClass(group.accent)
                  ]"
                >
                  <UButton color="neutral" variant="ghost" class="gap-2 rounded-md px-3 py-2">
                    <UAvatar :src="group.avatarSrc" size="sm" />
                    <span class="text-base font-medium text-default">{{ group.name }}</span>
                  </UButton>
                </div>

                <template v-for="(row, ri) in group.rows" :key="`${block.id}-${gi}-${ri}`">
                  <div
                    v-if="!row.hidden"
                    :class="[
                      'grid cursor-pointer border-b border-default transition-colors hover:bg-elevated/40',
                      isScheduleGeneralView && accentSurfaceClass(group.accent)
                    ]"
                    :style="{ gridTemplateColumns: scheduleGridTemplate }"
                    role="button"
                    tabindex="0"
                    @click="onScheduleRowActivate(block, group, row)"
                    @keydown.enter.prevent="onScheduleRowActivate(block, group, row)"
                    @keydown.space.prevent="onScheduleRowActivate(block, group, row)"
                  >
                    <div class="flex min-h-[100px] flex-col justify-center border-r border-default p-4 text-sm text-default">
                      {{ row.time }}
                    </div>
                    <div class="flex min-h-[100px] items-center border-r border-default p-4 text-sm leading-5 text-default">
                      <span class="min-w-0 whitespace-normal wrap-break-word">{{ formatSchedulePlace(row) }}</span>
                    </div>
                    <div class="flex min-h-[100px] flex-col justify-center border-r border-default p-4 text-sm leading-5 text-default">
                      {{ row.topic }}
                    </div>
                    <div
                      class="flex min-h-[100px] flex-wrap content-center items-center gap-3 border-r border-default p-4"
                      @click.stop
                    >
                      <ScheduleParticipantPopoverChip
                        v-for="(participant, pi) in row.participants"
                        :key="pi"
                        variant="table"
                        :participant="participant"
                      />
                    </div>
                    <div
                      class="flex min-h-[100px] min-w-0 items-center justify-end border-r border-default p-4"
                      @click.stop
                    >
                      <UDropdownMenu
                        :items="attachmentMenu(row)"
                        :content="{ align: 'end', collisionPadding: 12 }"
                      >
                        <UButton
                          color="neutral"
                          variant="outline"
                          size="md"
                        >
                          {{ row.attachmentsLabel }}
                          <UIcon name="i-lucide-chevron-down" class="size-4" />
                        </UButton>
                      </UDropdownMenu>
                    </div>
                    <div
                      v-if="!isScheduleGeneralView"
                      class="flex min-h-[100px] items-center justify-center border-default p-1"
                      @click.stop
                    >
                      <UDropdownMenu
                        :items="rowContextMenuItems(block, group, row)"
                        :content="{ align: 'end', collisionPadding: 12 }"
                      >
                        <UButton
                          color="neutral"
                          variant="ghost"
                          square
                          size="sm"
                          icon="i-lucide-ellipsis-vertical"
                          aria-label="Действия с мероприятием"
                        />
                      </UDropdownMenu>
                    </div>
                  </div>

                  <div
                    v-else
                    :class="[
                      'grid border-b border-default',
                      isScheduleGeneralView
                        ? accentSurfaceClass(group.accent)
                        : 'bg-elevated/25'
                    ]"
                    :style="{ gridTemplateColumns: scheduleGridTemplate }"
                  >
                    <div
                      class="flex min-h-[100px] flex-col justify-center border-r border-default p-4 text-sm text-default select-none"
                    >
                      {{ row.time }}
                    </div>
                    <div
                      class="flex min-h-[100px] flex-wrap items-center gap-2 border-r border-default px-4 py-2 text-sm text-muted select-none"
                      :style="isScheduleGeneralView ? { gridColumn: '2 / -1' } : { gridColumn: '2 / 6' }"
                    >
                      <UIcon name="i-lucide-eye-off" class="size-4 shrink-0 text-dimmed" aria-hidden="true" />
                      <span class="shrink-0 text-sm text-dimmed">Просмотр недоступен</span>
                    </div>
                    <div
                      v-if="!isScheduleGeneralView"
                      class="flex min-h-[100px] items-center justify-center border-default p-1"
                      style="grid-column: 6 / 7"
                      @click.stop
                    >
                      <UDropdownMenu
                        :items="rowContextMenuItems(block, group, row)"
                        :content="{ align: 'end', collisionPadding: 12 }"
                      >
                        <UButton
                          color="neutral"
                          variant="ghost"
                          square
                          size="sm"
                          icon="i-lucide-ellipsis-vertical"
                          aria-label="Действия с мероприятием"
                        />
                      </UDropdownMenu>
                    </div>
                  </div>
                </template>
              </div>
            </template>
          </UCollapsible>
          </div>
        </div>
      </div>

      <ScheduleEventSlideover
        v-model:open="eventDetailOpen"
        :selection="eventSelection"
        :editable="eventSlideoverEditable"
        @saved="onEventSlideoverSaved"
      />

      <UModal
        v-model:open="deleteModalOpen"
        title="Удалить мероприятие?"
        :description="deleteModalDescription"
      >
        <template #body>
          <div class="flex justify-end gap-2">
            <UButton
              label="Отмена"
              color="neutral"
              variant="subtle"
              @click="cancelDeleteEvent"
            />
            <UButton
              label="Удалить"
              color="error"
              variant="solid"
              @click="confirmDeleteEvent"
            />
          </div>
        </template>
      </UModal>
    </template>

  </UDashboardPanel>
</template>
