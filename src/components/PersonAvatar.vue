<script setup lang="ts">
import { computed } from 'vue'
import { formatParticipantInitials } from '../utils/schedule'

const props = withDefaults(defineProps<{
  name: string
  size?: '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '3xl' | 'hero'
  title?: string
}>(), {
  size: 'xs',
})

const avatarSize = computed(() => (props.size === 'hero' ? undefined : props.size))

const sizeClass = computed(() => {
  if (props.size === 'hero')
    return 'size-[86px] text-2xl'
  if (props.size === '2xs')
    return 'size-5 text-[9px]'
  return ''
})
</script>

<template>
  <UAvatar
    :text="formatParticipantInitials(name)"
    :alt="name"
    :title="title ?? name"
    :size="avatarSize"
    :class="['shrink-0', sizeClass]"
  />
</template>
