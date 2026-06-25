/** Извлекает SSO-токен только из hash (#sso=...); query (?sso=) не используется — токен не попадает в логи сервера. */
export function consumeSsoTokenFromUrl(): string | null {
  const hash = window.location.hash.replace(/^#/, '')
  if (!hash)
    return null

  const params = new URLSearchParams(hash)
  return params.get('sso')
}

export function stripSsoFromUrl(): void {
  const url = new URL(window.location.href)
  url.hash = ''
  url.searchParams.delete('sso')
  url.searchParams.delete('embed')
  window.history.replaceState({}, '', `${url.pathname}${url.search}`)
}
