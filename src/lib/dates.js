/** Local calendar YYYY-MM-DD */
export function getTodayYMD() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseYMD(ymd) {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0, 0)
}

/** Whole calendar days from earlierYMD to laterYMD (non-negative). */
export function calendarDaysBetween(earlierYMD, laterYMD) {
  if (!earlierYMD || !laterYMD) return 0
  const a = parseYMD(earlierYMD).getTime()
  const b = parseYMD(laterYMD).getTime()
  return Math.max(0, Math.round((b - a) / 86400000))
}

export function addDaysYMD(ymd, deltaDays) {
  const t = parseYMD(ymd)
  t.setDate(t.getDate() + deltaDays)
  const y = t.getFullYear()
  const m = String(t.getMonth() + 1).padStart(2, '0')
  const d = String(t.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function listLastNDaysYMD(n) {
  const out = []
  const today = getTodayYMD()
  for (let i = n - 1; i >= 0; i--) {
    out.push(addDaysYMD(today, -i))
  }
  return out
}

/** Minutes since local midnight for "HH:mm" string */
export function timeStringToMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10))
  if (Number.isNaN(h) || Number.isNaN(m)) return 0
  return h * 60 + m
}

export function getNowMinutes() {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

/** Day-of-year 0..365 for rotating quotes */
export function getDayOfYear() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now - start
  return Math.floor(diff / 86400000)
}
