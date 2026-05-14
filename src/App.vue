<script setup lang="ts">
import { ref, watchEffect, nextTick } from 'vue'
import { useHead } from '@unhead/vue'
import { useColorMode } from '@vueuse/core'

const colorMode = useColorMode()

/** Совпадает с `bg-default` у `body` (Nuxt UI), для `<meta name="theme-color">`. */
const themeColor = ref('#ffffff')

watchEffect(async () => {
  void colorMode.value
  await nextTick()
  if (typeof document === 'undefined')
    return
  const bg = getComputedStyle(document.body).backgroundColor
  if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent')
    themeColor.value = bg
})

useHead(() => ({
  meta: [
    { name: 'theme-color', content: themeColor.value }
  ]
}))
</script>

<template>
  <Suspense>
    <UApp class="min-h-dvh bg-default">
      <RouterView />
    </UApp>
  </Suspense>
</template>
