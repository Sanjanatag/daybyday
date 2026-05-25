import { getNowMinutes, timeStringToMinutes } from './dates'
import { emptyDaily } from './storage'
import { isAllComplete } from './habitLogic'

const MOTIVATIONAL = [
  (s) => `You're on a ${s}-day streak — don't stop now!`,
  () => 'Tiny progress beats zero progress. Open the app and log one win.',
  () => 'Your streak is warming up. Finish strong before midnight.',
  (s) => `${s} days of showing up. That is rare. Keep going.`,
]

function pickMotivational(streak) {
  const i = Math.abs(streak * 13 + new Date().getDate()) % MOTIVATIONAL.length
  const fn = MOTIVATIONAL[i]
  return fn(streak)
}

function shouldFireReminder(key, minuteNow, targetMinutes, dedupe, todayYMD) {
  const dk = `${todayYMD}:${key}`
  if (dedupe[dk]) return false
  if (minuteNow < targetMinutes || minuteNow > targetMinutes + 2) return false
  return true
}

export function tickLocalNotifications({
  settings,
  todayYMD,
  todayRow,
  streak,
  markDedupe,
  show,
}) {
  if (!settings.notificationsEnabled) return
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return
  }

  const minuteNow = getNowMinutes()
  const dedupe = settings.notificationDedupe || {}
  const allDone = isAllComplete(todayRow || emptyDaily(), settings)

  const tryShow = (key, title, body, minutes) => {
    if (!shouldFireReminder(key, minuteNow, minutes, dedupe, todayYMD)) return
    show(title, body, key)
    markDedupe(key)
  }

  tryShow(
    'dsa',
    'DSA time',
    'Log a few problems toward your daily target.',
    timeStringToMinutes(settings.reminderDsa),
  )
  tryShow(
    'apps',
    'Applications',
    'Send a batch of applications today.',
    timeStringToMinutes(settings.reminderApps),
  )
  tryShow(
    'study',
    'Study session',
    'Start your 2-hour study block — pause anytime.',
    timeStringToMinutes(settings.reminderStudy),
  )

  if (!allDone) {
    tryShow(
      'nudge',
      'Have you done your tasks?',
      'Check in and keep your momentum.',
      timeStringToMinutes(settings.reminderDailyNudge),
    )
  }

  if (!allDone && streak > 0) {
    const riskMin = timeStringToMinutes(settings.reminderStreakRisk)
    let body = 'Finish your daily goals before midnight.'
    if (settings.motivationalPush && streak >= 3) {
      body = `${pickMotivational(streak)} — ${body}`
    }
    tryShow('risk', "🔥 Don't break your streak!", body, riskMin)
  }
}

export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export async function subscribeWebPush(vapidPublicKey) {
  if (!('serviceWorker' in navigator)) throw new Error('Service workers not supported')
  const reg = await navigator.serviceWorker.ready
  const key = urlBase64ToUint8Array(vapidPublicKey)
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: key,
  })
  return JSON.stringify(sub.toJSON())
}

export async function unsubscribeWebPush() {
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (sub) await sub.unsubscribe()
}
