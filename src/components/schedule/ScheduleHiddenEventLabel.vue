<script setup lang="ts">
withDefaults(defineProps<{
  size?: 'sm' | 'md'
}>(), {
  size: 'md',
})
</script>

<template>
  <div
    class="flex items-center gap-2 text-muted"
    :class="size === 'sm' ? 'text-xs' : 'text-sm'"
  >
    <UIcon
      name="i-lucide-eye-off"
      class="shrink-0 text-dimmed"
      :class="size === 'sm' ? 'size-4' : 'size-5'"
      aria-hidden="true"
    />
    <span class="font-medium">Данное мероприятие скрыто</span>
  </div>
</template>
