/** «Фамилия Имя Отчество» → «Имя Отчество» для обращения в письмах. */
export function formatNameAndPatronymic(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 3)
    return `${parts[1]} ${parts[2]}`
  if (parts.length === 2)
    return parts[1]!
  return parts[0] ?? ''
}
