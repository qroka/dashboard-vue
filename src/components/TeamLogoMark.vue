<script setup lang="ts">
import { BRAND_LOGO_PATH_D, BRAND_LOGO_VIEW_BOX } from '../constants/brand-logo'
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    :viewBox="BRAND_LOGO_VIEW_BOX"
    fill="none"
    class="block h-5 w-auto max-h-5 max-w-28 shrink-0 text-primary"
    aria-hidden="true"
  >
    <path
      fill="currentColor"
      :d="BRAND_LOGO_PATH_D"
    />
  </svg>
</template>
