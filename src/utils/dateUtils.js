export function formatDate(dateStr, withYear = false) {
  if (!dateStr) return ''

  const hasOffset = /[Z]$/.test(dateStr.trim()) || /[+-]\d{2}:\d{2}$/.test(dateStr.trim())
  const normalized = dateStr.replace(' ', 'T') + (hasOffset ? '' : 'Z')

  const d = new Date(normalized)
  if (isNaN(d.getTime())) return ''

  return d.toLocaleString('ru-RU', {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
    hour: '2-digit',
    minute: '2-digit',
  })
}
