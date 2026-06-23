<script setup lang="ts">
withDefaults(defineProps<{
  /**
   * `icon` — компактная иконка у темы (доска).
   * `table` — бейдж с текстом в таблице.
   * `badge` — короткий бейдж в шапке слайдовера.
   */
  variant?: 'icon' | 'table' | 'badge'
}>(), {
  variant: 'icon',
})
</script>

<template>
  <UTooltip
    v-if="variant === 'icon'"
    text="Скрытое мероприятие — не отображается для всех пользователей"
  >
    <span
      class="inline-flex shrink-0 items-center justify-center rounded-md bg-primary/10 p-0.5 text-primary ring ring-inset ring-primary/20 transition-colors hover:bg-primary/15"
      role="img"
      aria-label="Скрытое мероприятие"
      tabindex="0"
      @click.stop
    >
      <UIcon
        name="i-lucide-eye-off"
        class="size-3.5"
        aria-hidden="true"
      />
    </span>
  </UTooltip>
  <UBadge
    v-else-if="variant === 'table'"
    color="primary"
    variant="subtle"
    size="md"
    icon="i-lucide-eye-off"
    label="Скрытое мероприятие"
    class="w-fit shrink-0 self-start whitespace-nowrap"
    @click.stop
  />
  <UBadge
    v-else
    color="primary"
    variant="subtle"
    size="sm"
    icon="i-lucide-eye-off"
    label="Скрыто"
    class="shrink-0"
  />
</template>
