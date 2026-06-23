<script setup lang="ts">
withDefaults(defineProps<{
  /**
   * `icon` — компактно у темы (кто видит детали скрытого мероприятия).
   * `badge` — текстовый бейдж в шапке слайдовера.
   */
  variant?: 'icon' | 'badge'
}>(), {
  variant: 'icon',
})
</script>

<template>
  <UTooltip
    v-if="variant === 'icon'"
    text="Скрытое мероприятие"
  >
    <span
      class="inline-flex shrink-0 items-center justify-center rounded-sm text-dimmed transition-colors hover:text-muted"
      role="img"
      aria-label="Скрытое мероприятие"
      tabindex="0"
      @click.stop
    >
      <UIcon
        name="i-lucide-eye-off"
        class="size-4"
        aria-hidden="true"
      />
    </span>
  </UTooltip>
  <UBadge
    v-else
    color="neutral"
    variant="subtle"
    size="sm"
    icon="i-lucide-eye-off"
    label="Скрыто"
    class="shrink-0"
  />
</template>
