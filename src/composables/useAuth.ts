import { computed, ref } from 'vue'
import { apiFetch, clearLegacyAuthToken } from '../api/client'
import type { ApiLoginResponse, ApiUser } from '../api/types'

const user = ref<ApiUser | null>(null)
const ready = ref(false)

export function useAuth() {
  const isAuthenticated = computed(() => Boolean(user.value))
  const canViewLogs = computed(() => user.value?.role === 'admin')

  async function fetchMe(): Promise<ApiUser | null> {
    try {
      const res = await apiFetch<{ success: boolean, user?: ApiUser }>('/api/auth/me')
      user.value = res.user ?? null
      if (res.user)
        clearLegacyAuthToken()
      return user.value
    } catch {
      user.value = null
      return null
    } finally {
      ready.value = true
    }
  }

  async function login(loginName: string, password: string): Promise<void> {
    const body = JSON.stringify({ login: loginName, password })
    const endpoints = ['/api/auth/crm-bridge', '/api/auth/login'] as const
    let lastError = 'Ошибка входа'

    for (const path of endpoints) {
      try {
        const res = await apiFetch<ApiLoginResponse>(path, {
          method: 'POST',
          body,
        })
        if (res.success && res.user) {
          clearLegacyAuthToken()
          user.value = res.user
          ready.value = true
          return
        }
        lastError = res.error ?? lastError
      } catch (e) {
        lastError = e instanceof Error ? e.message : lastError
      }
    }

    throw new Error(lastError)
  }

  /** Вход по одноразовому токену из CRM (schedule.php → #sso=...). */
  async function loginWithCrmSso(ssoToken: string): Promise<void> {
    const res = await apiFetch<ApiLoginResponse>('/api/auth/crm-sso', {
      method: 'POST',
      body: JSON.stringify({ token: ssoToken }),
    })
    if (!res.success || !res.user)
      throw new Error(res.error ?? 'Не удалось войти через CRM')
    clearLegacyAuthToken()
    user.value = res.user
    ready.value = true
  }

  async function logout(): Promise<void> {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // cookie могла уже истечь
    }
    clearLegacyAuthToken()
    user.value = null
    ready.value = true
  }

  return {
    user,
    ready,
    isAuthenticated,
    canViewLogs,
    fetchMe,
    login,
    loginWithCrmSso,
    logout,
  }
}
