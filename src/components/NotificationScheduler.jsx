import { useCallback, useEffect, useRef } from 'react'
import { useHabit } from '../context/HabitContext'
import { getTodayYMD } from '../lib/dates'
import { emptyDaily } from '../lib/storage'
import { tickLocalNotifications } from '../lib/notifications'

export function NotificationScheduler() {
  const { state, patchSettings, markPermissionAsked } = useHabit()
  const stateRef = useRef(state)
  stateRef.current = state
  const patchRef = useRef(patchSettings)
  patchRef.current = patchSettings

  const showNotif = useCallback((title, body, tag) => {
    if (typeof Notification === 'undefined') return
    try {
      new Notification(title, { body, tag })
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (state.permissionAsked) return
    const id = window.setTimeout(async () => {
      if (!('Notification' in window)) {
        markPermissionAsked()
        return
      }
      await Notification.requestPermission()
      markPermissionAsked()
    }, 1500)
    return () => clearTimeout(id)
  }, [state.permissionAsked, markPermissionAsked])

  useEffect(() => {
    const tick = () => {
      const s = stateRef.current
      const todayYMD = getTodayYMD()
      tickLocalNotifications({
        settings: s.settings,
        todayYMD,
        todayRow: s.daily[todayYMD] || emptyDaily(),
        streak: s.streak,
        markDedupe: (key) => {
          const cur = stateRef.current
          patchRef.current({
            notificationDedupe: {
              ...cur.settings.notificationDedupe,
              [`${todayYMD}:${key}`]: true,
            },
          })
        },
        show: showNotif,
      })
    }
    tick()
    const id = window.setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [showNotif])

  return null
}
