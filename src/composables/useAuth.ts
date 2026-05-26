import { computed, ref } from 'vue'
import { apiFetch, getAuthToken, setAuthToken } from '../api/client'
import type { ApiLoginResponse, ApiUser } from '../api/types'

const user = ref<ApiUser | null>(null)
const ready = ref(false)

export function useAuth() {
  const isAuthenticated = computed(() => Boolean(getAuthToken() && user.value))
  const canViewLogs = computed(() => user.value?.role === 'admin')

  async function fetchMe(): Promise<ApiUser | null> {
    if (!getAuthToken()) {
      user.value = null
      ready.value = true
      return null
    }
    try {
      const res = await apiFetch<{ success: boolean, user?: ApiUser }>('/api/auth/me')
      user.value = res.user ?? null
      if (!res.user)
        setAuthToken(null)
      return user.value
    } catch {
      setAuthToken(null)
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
        if (res.success && res.token && res.user) {
          setAuthToken(res.token)
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
    if (!res.success || !res.token || !res.user)
      throw new Error(res.error ?? 'Не удалось войти через CRM')
    setAuthToken(res.token)
    user.value = res.user
    ready.value = true
  }

  function logout(): void {
    setAuthToken(null)
    user.value = null
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
