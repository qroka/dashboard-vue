<script setup lang="ts">
import {
  downloadScheduleAttachment,
  previewScheduleAttachment,
  type ScheduleRow
} from '../../data/schedule-mock'

defineProps<{
  files: ScheduleRow['attachmentFiles']
}>()
</script>

<template>
  <ul v-if="files.length" class="flex flex-col gap-2">
    <li
      v-for="(file, index) in files"
      :key="`${file.name}-${index}`"
      class="flex items-center gap-2 rounded-md border border-default px-2.5 py-2"
    >
      <div class="flex shrink-0 items-center rounded-full bg-elevated p-2">
        <UIcon name="i-lucide-file" class="size-4 text-muted" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium text-default">
          {{ file.name }}
        </p>
        <p class="text-xs text-muted">
          {{ file.size }}
        </p>
      </div>
      <div class="flex shrink-0 items-center gap-1">
        <UButton
          color="neutral"
          variant="ghost"
          square
          size="sm"
          icon="i-lucide-eye"
          aria-label="Просмотреть файл"
          @click="previewScheduleAttachment(file)"
        />
        <UButton
          color="neutral"
          variant="ghost"
          square
          size="sm"
          icon="i-lucide-download"
          aria-label="Скачать файл"
          @click="downloadScheduleAttachment(file)"
        />
      </div>
    </li>
  </ul>
  <p v-else class="text-sm text-muted">
    Файлов нет
  </p>
</template>
