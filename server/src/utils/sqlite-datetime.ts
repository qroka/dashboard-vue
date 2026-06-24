/** SQLite datetime('now') → ISO UTC для единообразного отображения на клиенте. */
export function sqliteDatetimeToIso(value: string | null | undefined): string | null {
  if (!value)
    return null

  const trimmed = value.trim()
  if (!trimmed)
    return null

  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed))
    return trimmed.endsWith('Z') ? trimmed : `${trimmed}Z`

  const normalized = trimmed.replace(' ', 'T')
  const parsed = new Date(`${normalized}Z`)
  if (Number.isNaN(parsed.getTime()))
    return trimmed

  return parsed.toISOString()
}
