import { getTodayYMD } from './dates'

export const STORAGE_KEY = 'streak-habits-v1'
export const TIMER_STORAGE_KEY = 'streak-habits-timer-v1'

export function emptyDaily() {
  return { dsa: 0, apps: 0, studySeconds: 0 }
}

export function defaultSettings() {
  return {
    displayName: 'Sanj',
    darkMode: true,
    dsaTarget: 3,
    appsTarget: 5,
    studyGoalSeconds: 2 * 3600,
    reminderDsa: '09:00',
    reminderApps: '12:00',
    reminderStudy: '19:00',
    reminderDailyNudge: '20:00',
    reminderStreakRisk: '21:00',
    notificationsEnabled: false,
    motivationalPush: true,
    notificationDedupe: {},
  }
}

export function createInitialState() {
  return {
    version: 1,
    streak: 0,
    longestStreak: 0,
    xp: 0,
    badges: [],
    lifetimeDsa: 0,
    lifetimeApps: 0,
    lifetimeStudySeconds: 0,
    daily: {},
    roadmaps: [],
    settings: defaultSettings(),
    permissionAsked: false,
    tab: 'home',
    showStreakBrokenOverlay: false,
    pushSubscriptionJson: null,
    dismissedStreakBreakToken: null,
  }
}

export function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createInitialState()
    const parsed = JSON.parse(raw)
    return mergeInitial(parsed)
  } catch {
    return createInitialState()
  }
}

function mergeInitial(parsed) {
  const base = createInitialState()
  return {
    ...base,
    ...parsed,
    settings: { ...defaultSettings(), ...parsed.settings },
    daily: parsed.daily && typeof parsed.daily === 'object' ? parsed.daily : {},
    roadmaps: Array.isArray(parsed.roadmaps) ? parsed.roadmaps : [],
    badges: Array.isArray(parsed.badges) ? parsed.badges : [],
    dismissedStreakBreakToken: parsed.dismissedStreakBreakToken ?? null,
  }
}

export function toPersistedSnapshot(state) {
  return {
    version: state.version,
    streak: state.streak,
    longestStreak: state.longestStreak,
    xp: state.xp,
    badges: state.badges,
    lifetimeDsa: state.lifetimeDsa,
    lifetimeApps: state.lifetimeApps,
    lifetimeStudySeconds: state.lifetimeStudySeconds,
    daily: state.daily,
    roadmaps: state.roadmaps,
    settings: state.settings,
    permissionAsked: state.permissionAsked,
    pushSubscriptionJson: state.pushSubscriptionJson,
    dismissedStreakBreakToken: state.dismissedStreakBreakToken,
  }
}

export function savePersisted(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersistedSnapshot(state)))
}

export function hasLocalPersistedData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    const parsed = JSON.parse(raw)
    if (parsed.xp > 0 || parsed.lifetimeDsa > 0 || parsed.lifetimeApps > 0) return true
    if (parsed.daily && Object.keys(parsed.daily).length > 0) return true
    if (parsed.roadmaps?.length > 0) return true
    return false
  } catch {
    return false
  }
}

/** Merge API / legacy payload into full app state shape. */
export function mergeRemoteProfile(remote) {
  return mergeInitial(remote)
}

export function loadTimerDraft() {
  try {
    const raw = localStorage.getItem(TIMER_STORAGE_KEY)
    if (!raw) return null
    const t = JSON.parse(raw)
    if (t.date !== getTodayYMD()) return null
    return t
  } catch {
    return null
  }
}

export function saveTimerDraft(draft) {
  if (!draft) {
    localStorage.removeItem(TIMER_STORAGE_KEY)
    return
  }
  localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(draft))
}
