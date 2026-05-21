import { computed, ref } from 'vue'
import { apiFetch, getAuthToken, isApiEnabled, setAuthToken } from '../api/client'

export interface AuthUser {
  u_id: number
  u_login: string
  u_fio: string | null
  u_email: string | null
  u_prem3: string | null
}

const user = ref<AuthUser | null>(null)
const loading = ref(false)
const initialized = ref(false)

export function useAuth() {
  const isAuthenticated = computed(() => Boolean(user.value))
  const canViewLogs = computed(() => {
    const u = user.value
    if (!u)
      return false
    return u.u_prem3 === '2'
  })

  async function fetchMe() {
    if (!isApiEnabled()) {
      initialized.value = true
      return
    }
    if (!getAuthToken()) {
      user.value = null
      initialized.value = true
      return
    }
    loading.value = true
    try {
      const res = await apiFetch<{ user: AuthUser }>('/auth/me')
      user.value = res.user
    }
    catch {
      setAuthToken(null)
      user.value = null
    }
    finally {
      loading.value = false
      initialized.value = true
    }
  }

  async function login(login: string, password: string) {
    const res = await apiFetch<{ token: string, user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login, password })
    })
    setAuthToken(res.token)
    user.value = res.user
    return res.user
  }

  function logout() {
    setAuthToken(null)
    user.value = null
  }

  return {
    user,
    loading,
    initialized,
    isAuthenticated,
    canViewLogs,
    fetchMe,
    login,
    logout
  }
}
