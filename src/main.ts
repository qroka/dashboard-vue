import './assets/css/main.css'

import { createApp } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import { routes, handleHotUpdate } from 'vue-router/auto-routes'
import { setupLayouts } from 'virtual:generated-layouts'
import { createHead } from '@unhead/vue/client'
import ui from '@nuxt/ui/vue-plugin'

import App from './App.vue'
import { isApiEnabled } from './api/client'
import { useAuth } from './composables/useAuth'

const app = createApp(App)

const head = createHead()
const router = createRouter({
  routes: setupLayouts(routes as RouteRecordRaw[]),
  history: createWebHistory()
})

router.beforeEach(async (to) => {
  if (!isApiEnabled() || to.path === '/login' || to.meta?.public)
    return true

  const { fetchMe, isAuthenticated, initialized } = useAuth()
  if (!initialized.value)
    await fetchMe()

  if (!isAuthenticated.value)
    return { path: '/login', query: { redirect: to.fullPath } }

  if (to.path.startsWith('/logs')) {
    const { canViewLogs } = useAuth()
    if (!canViewLogs.value)
      return { path: '/schedule' }
  }

  return true
})

app.use(head)
app.use(router)
app.use(ui)

app.mount('#app')

// This will update routes at runtime without reloading the page
if (import.meta.hot) {
  handleHotUpdate(router)
}
