/** Извлекает SSO-токен из hash (#sso=...) или query (?sso=). */
export function consumeSsoTokenFromUrl(): string | null {
  const hash = window.location.hash.replace(/^#/, '')
  if (hash) {
    const params = new URLSearchParams(hash)
    const fromHash = params.get('sso')
    if (fromHash)
      return fromHash
  }
  const fromQuery = new URLSearchParams(window.location.search).get('sso')
  return fromQuery
}

export function stripSsoFromUrl(): void {
  const url = new URL(window.location.href)
  url.hash = ''
  url.searchParams.delete('sso')
  url.searchParams.delete('embed')
  window.history.replaceState({}, '', `${url.pathname}${url.search}`)
}
