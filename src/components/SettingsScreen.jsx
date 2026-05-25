import { useHabit } from '../context/HabitContext'
import { getDisplayName } from '../lib/personal'
import { tickLocalNotifications, subscribeWebPush, unsubscribeWebPush } from '../lib/notifications'

export function SettingsScreen() {
  const { state, patchSettings, setDark, markPermissionAsked, setPushSubscriptionJson, clientId } =
    useHabit()
  const { settings } = state
  const vapid = import.meta.env.VITE_VAPID_PUBLIC_KEY

  async function enableNotifications() {
    if (!('Notification' in window)) return
    const perm = await Notification.requestPermission()
    markPermissionAsked()
    patchSettings({ notificationsEnabled: perm === 'granted' })
  }

  async function handlePushToggle(next) {
    if (!next) {
      await unsubscribeWebPush()
      setPushSubscriptionJson(null)
      return
    }
    if (!vapid) {
      window.alert(
        'Set VITE_VAPID_PUBLIC_KEY in .env to enable Web Push subscription (you still need a push server to deliver messages).',
      )
      return
    }
    try {
      const json = await subscribeWebPush(vapid)
      setPushSubscriptionJson(json)
    } catch (e) {
      console.error(e)
      window.alert('Could not subscribe to push. Use HTTPS and a valid VAPID public key.')
    }
  }

  return (
    <div className="page-enter safe-pt space-y-4 px-4 pb-6 safe-pb">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-violet-500">Settings</p>
        <h1 className="text-2xl font-bold tracking-tight">Make it yours</h1>
      </header>

      <section className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-transparent p-4 shadow-sm dark:border-violet-500/30">
        <h2 className="text-sm font-semibold">Your profile</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Personal assistant and journal use this name. Data stays on your private profile only.
        </p>
        <label className="mt-3 block text-sm">
          <span className="text-zinc-500">Display name</span>
          <input
            className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            value={settings.displayName ?? ''}
            placeholder="Sanj"
            onChange={(e) => patchSettings({ displayName: e.target.value })}
          />
        </label>
        <p className="mt-3 text-[11px] text-zinc-500">
          Signed in as <span className="font-semibold text-zinc-700 dark:text-zinc-200">{getDisplayName(settings)}</span>
          {clientId && (
            <>
              {' '}
              · workspace <span className="font-mono">{clientId.slice(0, 8)}…</span>
            </>
          )}
        </p>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <h2 className="text-sm font-semibold">Appearance</h2>
        <label className="mt-3 flex items-center justify-between gap-3 text-sm">
          <span>Dark mode</span>
          <input
            type="checkbox"
            className="h-5 w-5 accent-violet-600"
            checked={settings.darkMode}
            onChange={(e) => setDark(e.target.checked)}
          />
        </label>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <h2 className="text-sm font-semibold">Daily targets</h2>
        <div className="mt-3 space-y-3 text-sm">
          <label className="flex items-center justify-between gap-3">
            <span>DSA problems / day</span>
            <input
              type="number"
              min={1}
              className="w-20 rounded-lg border border-zinc-300 bg-transparent px-2 py-1 text-right dark:border-zinc-700"
              value={settings.dsaTarget}
              onChange={(e) =>
                patchSettings({ dsaTarget: Math.max(1, parseInt(e.target.value || '1', 10)) })
              }
            />
          </label>
          <label className="flex items-center justify-between gap-3">
            <span>Applications / day</span>
            <input
              type="number"
              min={1}
              className="w-20 rounded-lg border border-zinc-300 bg-transparent px-2 py-1 text-right dark:border-zinc-700"
              value={settings.appsTarget}
              onChange={(e) =>
                patchSettings({ appsTarget: Math.max(1, parseInt(e.target.value || '1', 10)) })
              }
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <h2 className="text-sm font-semibold">Reminders (local time)</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Uses the Notifications API on a 60s check while the app is open or briefly in the
          background. Install the PWA for the best experience.
        </p>
        <div className="mt-3 space-y-3 text-sm">
          {[
            ['reminderDsa', 'DSA reminder'],
            ['reminderApps', 'Applications reminder'],
            ['reminderStudy', 'Study reminder'],
            ['reminderDailyNudge', 'Daily nudge (incomplete)'],
            ['reminderStreakRisk', 'Streak risk warning'],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center justify-between gap-3">
              <span>{label}</span>
              <input
                type="time"
                className="rounded-lg border border-zinc-300 bg-transparent px-2 py-1 dark:border-zinc-700"
                value={settings[key]}
                onChange={(e) => patchSettings({ [key]: e.target.value })}
              />
            </label>
          ))}
          <label className="flex items-center justify-between gap-3">
            <span>Motivational copy on streak nights</span>
            <input
              type="checkbox"
              className="h-5 w-5 accent-violet-600"
              checked={settings.motivationalPush}
              onChange={(e) => patchSettings({ motivationalPush: e.target.checked })}
            />
          </label>
        </div>
        <button
          type="button"
          className="mt-4 w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white"
          onClick={enableNotifications}
        >
          {typeof Notification !== 'undefined' && Notification.permission === 'granted'
            ? 'Notifications allowed'
            : 'Allow notifications'}
        </button>
        <label className="mt-3 flex items-center justify-between gap-3 text-sm">
          <span>Enable scheduled nudges</span>
          <input
            type="checkbox"
            className="h-5 w-5 accent-violet-600"
            checked={settings.notificationsEnabled}
            onChange={(e) => patchSettings({ notificationsEnabled: e.target.checked })}
          />
        </label>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <h2 className="text-sm font-semibold">Web Push (optional)</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Subscribe with a VAPID public key. Delivering pushes still requires a server that uses
          your private key — this client stores the subscription JSON locally for testing.
        </p>
        <label className="mt-3 flex items-center justify-between gap-3 text-sm">
          <span>Push subscription</span>
          <input
            type="checkbox"
            className="h-5 w-5 accent-violet-600"
            checked={Boolean(state.pushSubscriptionJson)}
            onChange={(e) => handlePushToggle(e.target.checked)}
          />
        </label>
        {state.pushSubscriptionJson && (
          <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-zinc-950 p-2 text-[10px] text-zinc-300">
            {state.pushSubscriptionJson.slice(0, 240)}…
          </pre>
        )}
      </section>
    </div>
  )
}
