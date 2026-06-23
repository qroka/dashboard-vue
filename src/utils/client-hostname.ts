const STORAGE_KEY = 'grafic.client.hostname'

export function getClientHostname(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY)?.trim() || null
  } catch {
    return null
  }
}

export function setClientHostname(value: string | null): void {
  try {
    const trimmed = value?.trim()
    if (trimmed)
      sessionStorage.setItem(STORAGE_KEY, trimmed)
    else
      sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // sessionStorage недоступен
  }
}

/** Сохранить имя ПК из ?hostname= или ?computer= в URL (корпоративный ярлык). */
export function captureClientHostnameFromUrl(): void {
  if (typeof window === 'undefined')
    return
  const params = new URLSearchParams(window.location.search)
  const fromUrl = params.get('hostname') ?? params.get('computer')
  if (fromUrl?.trim())
    setClientHostname(fromUrl)
}
