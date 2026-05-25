/** Display name for this personal workspace (stored in settings). */
export function getDisplayName(settings) {
  const name = settings?.displayName?.trim()
  return name || 'Sanj'
}

export function assistantGreeting(name, hour = new Date().getHours()) {
  const n = name || 'Sanj'
  if (hour < 12) return `Good morning, ${n}`
  if (hour < 17) return `Good afternoon, ${n}`
  if (hour < 21) return `Good evening, ${n}`
  return `Hey ${n} — still grinding?`
}

export function assistantNudge(name, allComplete, streak) {
  const n = name || 'Sanj'
  if (allComplete) {
    return `${n}, you crushed today. Rest up — tomorrow we stack another win.`
  }
  if (streak > 0) {
    return `${n}, your ${streak}-day streak is on the line. Finish today's trio when you can.`
  }
  return `${n}, I'm tracking your DSA, apps, and study. Log a win whenever you're ready.`
}

export function formatRecordDate(ymd, todayYMD) {
  if (ymd === todayYMD) return 'Today'
  const d = new Date(ymd + 'T12:00:00')
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const ymdYesterday = yesterday.toISOString().slice(0, 10)
  if (ymd === ymdYesterday) return 'Yesterday'
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  })
}

export function formatStudyShort(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m`
  return `${seconds}s`
}
