const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

export function isApiEnabled(): boolean {
  return Boolean(baseUrl)
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('crm_auth_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  if (!baseUrl)
    throw new Error('VITE_API_BASE_URL is not configured')

  const headers: HeadersInit = {
    Accept: 'application/json',
    ...authHeaders(),
    ...(init.headers as Record<string, string> | undefined)
  }

  if (init.body && !(init.body instanceof FormData))
    (headers as Record<string, string>)['Content-Type'] = 'application/json'

  const res = await fetch(`${baseUrl}${path}`, { ...init, headers })
  if (!res.ok) {
    let body: unknown
    try {
      body = await res.json()
    }
    catch {
      body = await res.text()
    }
    throw new ApiError(`API ${res.status}`, res.status, body)
  }
  if (res.status === 204)
    return undefined as T
  return res.json() as Promise<T>
}

export function setAuthToken(token: string | null) {
  if (token)
    localStorage.setItem('crm_auth_token', token)
  else
    localStorage.removeItem('crm_auth_token')
}

export function getAuthToken(): string | null {
  return localStorage.getItem('crm_auth_token')
}
