import { addDaysYMD, calendarDaysBetween, getTodayYMD } from './dates'
import { emptyDaily } from './storage'

export function isAllComplete(dayData, settings) {
  const d = dayData || emptyDaily()
  const dsaOk = d.dsa >= settings.dsaTarget
  const appsOk = d.apps >= settings.appsTarget
  const studyOk = d.studySeconds >= settings.studyGoalSeconds
  return dsaOk && appsOk && studyOk
}

export function latestPerfectDay(daily, settings, beforeOrOnYMD) {
  for (let i = 0; i < 400; i++) {
    const d = addDaysYMD(beforeOrOnYMD, -i)
    const row = daily[d] || emptyDaily()
    if (isAllComplete(row, settings)) return d
  }
  return null
}

export function consecutivePerfectCountFrom(daily, settings, endYMD) {
  let n = 0
  for (let d = endYMD; ; d = addDaysYMD(d, -1)) {
    const row = daily[d] || emptyDaily()
    if (!isAllComplete(row, settings)) break
    n++
    if (n > 4000) break
  }
  return n
}

/** Streak shown in UI: consecutive perfect days ending at `latest`, unless gap to today >= 2. */
export function computeEffectiveStreak(daily, settings, todayYMD = getTodayYMD()) {
  const latest = latestPerfectDay(daily, settings, todayYMD)
  if (!latest) return 0
  const gap = calendarDaysBetween(latest, todayYMD)
  if (gap >= 2) return 0
  return consecutivePerfectCountFrom(daily, settings, latest)
}

export function dayCompletionRatio(dayData, settings) {
  const d = dayData || emptyDaily()
  let score = 0
  if (d.dsa >= settings.dsaTarget) score++
  if (d.apps >= settings.appsTarget) score++
  if (d.studySeconds >= settings.studyGoalSeconds) score++
  return score / 3
}

/** Sum apps from startYMD to endYMD inclusive — walk by day count */
export function sumAppsInclusive(daily, startYMD, endYMD) {
  if (calendarDaysBetween(startYMD, endYMD) < 0) return 0
  let total = 0
  let d = startYMD
  for (;;) {
    const row = daily[d]
    if (row) total += row.apps || 0
    if (d === endYMD) break
    d = addDaysYMD(d, 1)
    if (calendarDaysBetween(startYMD, d) > 400) break
  }
  return total
}

export function sumDsaInclusive(daily, startYMD, endYMD) {
  if (calendarDaysBetween(startYMD, endYMD) < 0) return 0
  let total = 0
  let d = startYMD
  for (;;) {
    const row = daily[d]
    if (row) total += row.dsa || 0
    if (d === endYMD) break
    d = addDaysYMD(d, 1)
  }
  return total
}

export function sumStudySecondsInclusive(daily, startYMD, endYMD) {
  if (calendarDaysBetween(startYMD, endYMD) < 0) return 0
  let total = 0
  let d = startYMD
  for (;;) {
    const row = daily[d]
    if (row) total += row.studySeconds || 0
    if (d === endYMD) break
    d = addDaysYMD(d, 1)
  }
  return total
}

export function longestStreakEver(daily, settings, todayYMD) {
  let best = 0
  let run = 0
  for (let i = 399; i >= 0; i--) {
    const d = addDaysYMD(todayYMD, -i)
    const row = daily[d] || emptyDaily()
    if (isAllComplete(row, settings)) {
      run++
      best = Math.max(best, run)
    } else {
      run = 0
    }
  }
  return best
}
