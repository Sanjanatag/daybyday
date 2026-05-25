import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import { evaluateNewBadges } from '../lib/badges'
import {
  computeEffectiveStreak,
  isAllComplete,
  latestPerfectDay,
  longestStreakEver,
  consecutivePerfectCountFrom,
} from '../lib/habitLogic'
import { calendarDaysBetween, getTodayYMD } from '../lib/dates'
import { fetchProfile, saveProfile } from '../lib/api'
import { getClientId } from '../lib/clientId'
import {
  createInitialState,
  emptyDaily,
  hasLocalPersistedData,
  loadPersisted,
  mergeRemoteProfile,
  savePersisted,
  toPersistedSnapshot,
} from '../lib/storage'

function xpDeltaForDay(prev, next, settings) {
  const prevAll = isAllComplete(prev, settings)
  const nextAll = isAllComplete(next, settings)
  let x = 0
  const pD = prev.dsa >= settings.dsaTarget
  const nD = next.dsa >= settings.dsaTarget
  if (!pD && nD) x += 20
  const pA = prev.apps >= settings.appsTarget
  const nA = next.apps >= settings.appsTarget
  if (!pA && nA) x += 20
  const pS = prev.studySeconds >= settings.studyGoalSeconds
  const nS = next.studySeconds >= settings.studyGoalSeconds
  if (!pS && nS) x += 25
  if (!prevAll && nextAll) x += 35
  const prevOver = Math.max(0, prev.dsa - settings.dsaTarget)
  const nextOver = Math.max(0, next.dsa - settings.dsaTarget)
  x += Math.min(30, Math.max(0, nextOver - prevOver) * 2)
  return x
}

function streakBreakToken(daily, settings, today) {
  const latest = latestPerfectDay(daily, settings, today)
  if (!latest) return null
  const gap = calendarDaysBetween(latest, today)
  if (gap < 2) return null
  const lost = consecutivePerfectCountFrom(daily, settings, latest)
  if (lost <= 0) return null
  return `${latest}|${today}|${lost}`
}

function enrichState(base) {
  const today = getTodayYMD()
  const settings = base.settings
  const streak = computeEffectiveStreak(base.daily, settings, today)
  const longest = Math.max(
    base.longestStreak,
    longestStreakEver(base.daily, settings, today),
    streak,
  )
  const token = streakBreakToken(base.daily, settings, today)
  return {
    ...base,
    streak,
    longestStreak: longest,
    tab: base.tab || 'home',
    showStreakBrokenOverlay: Boolean(
      token && token !== base.dismissedStreakBreakToken,
    ),
    streakBreakToken: token,
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'hydrate':
      return enrichState({ ...state, ...action.payload })
    case 'setTab':
      return { ...state, tab: action.tab }
    case 'patchSettings': {
      const settings = { ...state.settings, ...action.patch }
      const next = { ...state, settings }
      const today = getTodayYMD()
      const streak = computeEffectiveStreak(next.daily, settings, today)
      const longest = Math.max(
        next.longestStreak,
        longestStreakEver(next.daily, settings, today),
        streak,
      )
      return { ...next, streak, longestStreak: longest }
    }
    case 'setDark':
      return { ...state, settings: { ...state.settings, darkMode: action.value } }
    case 'updateToday': {
      const today = getTodayYMD()
      const prev = state.daily[today] || emptyDaily()
      const nextDay = { ...prev, ...action.patch }
      const daily = { ...state.daily, [today]: nextDay }
      const settings = state.settings
      const xpAdd = xpDeltaForDay(prev, nextDay, settings)
      const dDsa = nextDay.dsa - prev.dsa
      const dApps = nextDay.apps - prev.apps
      const dStudy = nextDay.studySeconds - prev.studySeconds
      const streak = computeEffectiveStreak(daily, settings, today)
      const longest = Math.max(
        state.longestStreak,
        longestStreakEver(daily, settings, today),
        streak,
      )
      const token = streakBreakToken(daily, settings, today)
      const showStreakBrokenOverlay = Boolean(
        token && token !== state.dismissedStreakBreakToken,
      )
      const badges = evaluateNewBadges(
        {
          streak,
          xp: state.xp + xpAdd,
          lifetimeDsa: state.lifetimeDsa + dDsa,
          lifetimeApps: state.lifetimeApps + dApps,
        },
        state.badges,
      )
      return {
        ...state,
        daily,
        xp: state.xp + xpAdd,
        lifetimeDsa: state.lifetimeDsa + dDsa,
        lifetimeApps: state.lifetimeApps + dApps,
        lifetimeStudySeconds: state.lifetimeStudySeconds + dStudy,
        streak,
        longestStreak: longest,
        badges,
        showStreakBrokenOverlay,
        streakBreakToken: token ?? state.streakBreakToken,
      }
    }
    case 'dismissStreakBreak':
      return {
        ...state,
        showStreakBrokenOverlay: false,
        dismissedStreakBreakToken: state.streakBreakToken || state.dismissedStreakBreakToken,
      }
    case 'addRoadmap': {
      const id = `rm-${Date.now()}`
      const roadmaps = [
        ...state.roadmaps,
        { id, title: action.title.trim() || 'New roadmap', milestones: [] },
      ]
      return { ...state, roadmaps }
    }
    case 'deleteRoadmap':
      return {
        ...state,
        roadmaps: state.roadmaps.filter((r) => r.id !== action.id),
      }
    case 'addMilestone': {
      const mid = `ms-${Date.now()}`
      const roadmaps = state.roadmaps.map((r) =>
        r.id !== action.roadmapId
          ? r
          : {
              ...r,
              milestones: [
                ...r.milestones,
                {
                  id: mid,
                  title: action.title.trim() || 'Milestone',
                  description: action.description?.trim() || '',
                  dueDate: action.dueDate || '',
                  status: 'not_started',
                },
              ],
            },
      )
      return { ...state, roadmaps }
    }
    case 'setMilestoneStatus': {
      const roadmaps = state.roadmaps.map((r) =>
        r.id !== action.roadmapId
          ? r
          : {
              ...r,
              milestones: r.milestones.map((m) =>
                m.id !== action.milestoneId ? m : { ...m, status: action.status },
              ),
            },
      )
      return { ...state, roadmaps }
    }
    case 'setMilestoneField': {
      const roadmaps = state.roadmaps.map((r) =>
        r.id !== action.roadmapId
          ? r
          : {
              ...r,
              milestones: r.milestones.map((m) =>
                m.id !== action.milestoneId ? m : { ...m, ...action.patch },
              ),
            },
      )
      return { ...state, roadmaps }
    }
    case 'setPermissionAsked':
      return { ...state, permissionAsked: true }
    case 'setPushSubscriptionJson':
      return { ...state, pushSubscriptionJson: action.json }
    default:
      return state
  }
}

const Ctx = createContext(null)

export function HabitProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState)
  const [isReady, setIsReady] = useState(false)
  const [syncError, setSyncError] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const clientIdRef = useRef(null)
  const hydratedRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const clientId = getClientId()
      clientIdRef.current = clientId

      try {
        let remote = await fetchProfile(clientId)

        if (!remote && hasLocalPersistedData()) {
          const local = mergeRemoteProfile(loadPersisted())
          const snapshot = toPersistedSnapshot(local)
          remote = await saveProfile(clientId, snapshot)
        }

        if (cancelled) return

        const merged = remote
          ? mergeRemoteProfile(remote)
          : mergeRemoteProfile(createInitialState())

        dispatch({ type: 'hydrate', payload: merged })
        savePersisted(merged)
        setSyncError(null)
      } catch (err) {
        console.error(err)
        if (!cancelled) {
          const fallback = enrichState(mergeRemoteProfile(loadPersisted()))
          dispatch({ type: 'hydrate', payload: fallback })
          setSyncError(
            'Could not reach the server. Showing cached data — changes will sync when the API is back.',
          )
        }
      } finally {
        if (!cancelled) {
          hydratedRef.current = true
          setIsReady(true)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const saveTimer = useRef(null)
  useEffect(() => {
    if (!hydratedRef.current || !clientIdRef.current) return

    savePersisted(state)

    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const clientId = clientIdRef.current
      if (!clientId) return
      setIsSaving(true)
      try {
        await saveProfile(clientId, toPersistedSnapshot(state))
        setSyncError(null)
      } catch (err) {
        console.error(err)
        setSyncError('Failed to save to cloud. Data is cached locally — will retry on next change.')
      } finally {
        setIsSaving(false)
      }
    }, 400)

    return () => clearTimeout(saveTimer.current)
  }, [state])

  const today = getTodayYMD()
  const todayRow = state.daily[today] || emptyDaily()
  const allComplete = isAllComplete(todayRow, state.settings)

  const value = useMemo(
    () => ({
      state,
      dispatch,
      today,
      todayRow,
      allComplete,
      isReady,
      syncError,
      isSaving,
      clientId: clientIdRef.current,
      setTab: (tab) => dispatch({ type: 'setTab', tab }),
      patchSettings: (patch) => dispatch({ type: 'patchSettings', patch }),
      setDark: (value) => dispatch({ type: 'setDark', value }),
      updateToday: (patch) => dispatch({ type: 'updateToday', patch }),
      dismissStreakBreak: () => dispatch({ type: 'dismissStreakBreak' }),
      addRoadmap: (title) => dispatch({ type: 'addRoadmap', title }),
      deleteRoadmap: (id) => dispatch({ type: 'deleteRoadmap', id }),
      addMilestone: (payload) => dispatch({ type: 'addMilestone', ...payload }),
      setMilestoneStatus: (payload) =>
        dispatch({ type: 'setMilestoneStatus', ...payload }),
      setMilestoneField: (payload) =>
        dispatch({ type: 'setMilestoneField', ...payload }),
      markPermissionAsked: () => dispatch({ type: 'setPermissionAsked' }),
      setPushSubscriptionJson: (json) =>
        dispatch({ type: 'setPushSubscriptionJson', json }),
    }),
    [state, today, todayRow, allComplete, isReady, syncError, isSaving],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useHabit() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useHabit requires HabitProvider')
  return v
}

export function useDocumentTheme(dark) {
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
  }, [dark])
}
