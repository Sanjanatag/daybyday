import { addDaysYMD } from './dates'
import { emptyDaily } from './storage'
import { isAllComplete, dayCompletionRatio } from './habitLogic'

export function dayHasActivity(row) {
  if (!row) return false
  return (row.dsa || 0) > 0 || (row.apps || 0) > 0 || (row.studySeconds || 0) > 0
}

function entryForDay(ymd, daily, settings) {
  const row = daily[ymd] || emptyDaily()
  const hasActivity = dayHasActivity(row)
  const complete = isAllComplete(row, settings)
  const ratio = dayCompletionRatio(row, settings)
  return {
    ymd,
    row,
    hasActivity,
    complete,
    ratio,
    dsaHit: row.dsa >= settings.dsaTarget,
    appsHit: row.apps >= settings.appsTarget,
    studyHit: row.studySeconds >= settings.studyGoalSeconds,
  }
}

/**
 * Every calendar day from your first saved day through today (newest first).
 * Days with no log show zeros — so you can see missed days too.
 */
export function buildHistoryEntries(daily, settings, todayYMD) {
  const keys = Object.keys(daily || {})
  let startYMD = todayYMD
  if (keys.length > 0) {
    startYMD = keys.reduce((min, k) => (k < min ? k : min))
  } else {
    startYMD = addDaysYMD(todayYMD, -29)
  }

  const entries = []
  for (let d = todayYMD; ; d = addDaysYMD(d, -1)) {
    entries.push(entryForDay(d, daily, settings))
    if (d === startYMD) break
    if (entries.length > 500) break
  }
  return entries
}

export function filterHistoryEntries(entries, filter) {
  if (filter === 'perfect') return entries.filter((e) => e.complete)
  if (filter === 'partial') return entries.filter((e) => e.hasActivity && !e.complete)
  if (filter === 'missed') return entries.filter((e) => !e.hasActivity)
  return entries
}
