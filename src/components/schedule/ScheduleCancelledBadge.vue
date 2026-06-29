<script setup lang="ts">
withDefaults(defineProps<{
  /** `table` — колонка времени в списке; `board` — карточка на доске. */
  variant?: 'table' | 'board'
}>(), {
  variant: 'table',
})
</script>

<template>
  <UBadge
    color="error"
    variant="subtle"
    :size="variant === 'board' ? 'sm' : 'md'"
    icon="i-lucide-calendar-x"
    label="ОТМЕНЕНО"
    class="w-fit shrink-0 whitespace-nowrap"
    @click.stop
  />
</template>
