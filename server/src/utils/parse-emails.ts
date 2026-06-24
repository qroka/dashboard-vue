const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Разбирает u_email / users.email (может содержать несколько адресов через запятую). */
export function parseEmailAddresses(raw: string | null | undefined): string[] {
  if (!raw?.trim())
    return []

  const seen = new Set<string>()
  const result: string[] = []

  for (const part of raw.split(/[,;]/)) {
    const email = part.trim().toLowerCase()
    if (!email || !EMAIL_RE.test(email) || seen.has(email))
      continue
    seen.add(email)
    result.push(email)
  }

  return result
}
