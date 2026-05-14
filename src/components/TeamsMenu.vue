<script setup lang="ts">
import { ref, computed } from 'vue'
import type { DropdownMenuItem } from '@nuxt/ui'
import TeamLogoMark from './TeamLogoMark.vue'

defineProps<{
  collapsed?: boolean
}>()

const teams = ref([
  {
    label: 'CRM | График',
    slot: 'team' as const
  }
])

const selectedTeam = ref(teams.value[0])

const items = computed<DropdownMenuItem[][]>(() => [
  teams.value.map(team => ({
    label: team.label,
    slot: team.slot,
    onSelect() {
      selectedTeam.value = team
    }
  }))
])
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-40' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <template #team-leading>
      <TeamLogoMark />
    </template>

    <UButton
      :label="collapsed ? undefined : selectedTeam?.label"
      :trailing-icon="collapsed ? undefined : 'i-lucide-chevrons-up-down'"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :class="[!collapsed && 'py-2']"
      :ui="{
        trailingIcon: 'text-dimmed'
      }"
    >
      <template #leading>
        <TeamLogoMark />
      </template>
    </UButton>
  </UDropdownMenu>
</template>
