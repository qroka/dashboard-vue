<script setup lang="ts">
import { ref } from 'vue'
import { useStorage } from '@vueuse/core'
import type { NavigationMenuItem } from '@nuxt/ui'
import { schedulePathForSlug, scheduleTitleOptions } from '../data/schedule-mock'

const toast = useToast()

const open = ref(false)

const scheduleNavChildren = scheduleTitleOptions.map(opt => ({
  label: opt.label,
  to: schedulePathForSlug(opt.value),
  exact: opt.value === 'general',
  icon: 'icon' in opt ? opt.icon : undefined,
  avatar: 'avatar' in opt ? opt.avatar : undefined,
  onSelect: () => {
    open.value = false
  }
})) satisfies NavigationMenuItem[]

const links = [[{
  slot: 'schedule-nav',
  label: 'График заместителей',
  icon: 'i-lucide-calendar-range',
  to: '/schedule',
  defaultOpen: true,
  type: 'trigger',
  children: scheduleNavChildren
}], [{
  label: 'Обратная связь',
  icon: 'i-lucide-message-circle',
  to: 'https://github.com/nuxt-ui-templates/dashboard-vue',
  target: '_blank',
  onSelect: () => {
    open.value = false
  }
}]] satisfies NavigationMenuItem[][]

const cookie = useStorage('cookie-consent', 'pending')
if (cookie.value !== 'accepted') {
  toast.add({
    title: 'We use first-party cookies to enhance your experience on our website.',
    duration: 0,
    close: false,
    actions: [{
      label: 'Accept',
      color: 'neutral',
      variant: 'outline',
      onClick: () => {
        cookie.value = 'accepted'
      }
    }, {
      label: 'Opt out',
      color: 'neutral',
      variant: 'ghost'
    }]
  })
}
</script>

<template>
  <UDashboardGroup unit="rem" storage="local">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-default"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <TeamsMenu :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          :popover="{ content: { side: 'right', align: 'start', alignOffset: 2 } }"
        >
          <template #schedule-nav-content="{ item, ui }">
            <ul data-slot="childList" :class="ui.childList()">
              <li data-slot="childLabel" :class="ui.childLabel()">
                {{ item.label }}
              </li>
              <li
                v-for="(childItem, childIndex) in item.children || []"
                :key="childIndex"
                data-slot="childItem"
                :class="ui.childItem()"
              >
                <RouterLink
                  v-if="childItem.to"
                  v-slot="{ href, navigate, isActive, isExactActive }"
                  :to="childItem.to"
                  :exact="Boolean(childItem.exact)"
                  custom
                >
                  <a
                    :href="href"
                    data-slot="childLink"
                    :class="ui.childLink({
                      active: childItem.exact ? isExactActive : isActive
                    })"
                    @click="(e) => {
                      navigate(e)
                      childItem.onSelect?.()
                    }"
                  >
                    <UAvatar
                      v-if="childItem.avatar"
                      v-bind="childItem.avatar"
                      size="2xs"
                      data-slot="linkLeadingAvatar"
                      :class="ui.linkLeadingAvatar({
                        active: childItem.exact ? isExactActive : isActive
                      })"
                    />
                    <UIcon
                      v-else-if="childItem.icon"
                      :name="childItem.icon"
                      data-slot="childLinkIcon"
                      :class="ui.childLinkIcon({
                        active: childItem.exact ? isExactActive : isActive
                      })"
                    />
                    <span
                      data-slot="childLinkLabel"
                      :class="ui.childLinkLabel({
                        active: childItem.exact ? isExactActive : isActive
                      })"
                    >
                      {{ childItem.label }}
                    </span>
                  </a>
                </RouterLink>
              </li>
            </ul>
          </template>
        </UNavigationMenu>

        <UNavigationMenu
          v-if="links[1].length"
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <RouterView />

    <NotificationsSlideover />
  </UDashboardGroup>
</template>
