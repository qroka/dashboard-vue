<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
await router.replace({ path: '/schedule' })
</script>

<template>
  <div class="min-h-dvh bg-default" aria-hidden="true" />
</template>
