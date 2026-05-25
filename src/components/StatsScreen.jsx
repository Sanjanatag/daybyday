import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useHabit } from '../context/HabitContext'
import { addDaysYMD, getTodayYMD } from '../lib/dates'
import { sumAppsInclusive, sumDsaInclusive, sumStudySecondsInclusive } from '../lib/habitLogic'
import { BADGE_DEFS } from '../lib/badges'

export function StatsScreen() {
  const { state } = useHabit()
  const { daily, streak, longestStreak, lifetimeDsa, lifetimeApps, lifetimeStudySeconds } = state
  const today = getTodayYMD()

  const ranges = useMemo(() => {
    const weekStart = addDaysYMD(today, -6)
    const monthStart = addDaysYMD(today, -29)
    return {
      weekDsa: sumDsaInclusive(daily, weekStart, today),
      monthDsa: sumDsaInclusive(daily, monthStart, today),
      weekApps: sumAppsInclusive(daily, weekStart, today),
      monthApps: sumAppsInclusive(daily, monthStart, today),
      weekStudy: sumStudySecondsInclusive(daily, weekStart, today),
      monthStudy: sumStudySecondsInclusive(daily, monthStart, today),
    }
  }, [daily, today])

  const chartData = useMemo(() => {
    const out = []
    for (let i = 13; i >= 0; i--) {
      const d = addDaysYMD(today, -i)
      const row = daily[d] || { dsa: 0, apps: 0, studySeconds: 0 }
      out.push({
        day: d.slice(5),
        dsa: row.dsa,
        apps: row.apps,
        studyMin: Math.round((row.studySeconds || 0) / 60),
      })
    }
    return out
  }, [daily, today])

  const studyHoursLife = (lifetimeStudySeconds / 3600).toFixed(1)

  return (
    <div className="page-enter safe-pt space-y-4 px-4 pb-6 safe-pb">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-violet-500">Stats</p>
        <h1 className="text-2xl font-bold tracking-tight">Momentum</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Streaks, totals, and the last 14 days of activity.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
          <p className="text-xs text-zinc-500">Current streak</p>
          <p className="mt-1 text-3xl font-black text-orange-400">{streak}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
          <p className="text-xs text-zinc-500">Longest streak</p>
          <p className="mt-1 text-3xl font-black text-violet-500">{longestStreak}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <h2 className="text-sm font-semibold">DSA problems</h2>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[11px] text-zinc-500">All time</p>
            <p className="text-xl font-bold">{lifetimeDsa}</p>
          </div>
          <div>
            <p className="text-[11px] text-zinc-500">This week</p>
            <p className="text-xl font-bold">{ranges.weekDsa}</p>
          </div>
          <div>
            <p className="text-[11px] text-zinc-500">This month</p>
            <p className="text-xl font-bold">{ranges.monthDsa}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <h2 className="text-sm font-semibold">Applications</h2>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[11px] text-zinc-500">All time</p>
            <p className="text-xl font-bold">{lifetimeApps}</p>
          </div>
          <div>
            <p className="text-[11px] text-zinc-500">This week</p>
            <p className="text-xl font-bold">{ranges.weekApps}</p>
          </div>
          <div>
            <p className="text-[11px] text-zinc-500">This month</p>
            <p className="text-xl font-bold">{ranges.monthApps}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <h2 className="text-sm font-semibold">Study time</h2>
        <p className="mt-2 text-3xl font-black text-fuchsia-500">{studyHoursLife}h</p>
        <p className="text-xs text-zinc-500">Total hours logged (lifetime)</p>
        <p className="mt-2 text-xs text-zinc-500">
          This week: {(ranges.weekStudy / 3600).toFixed(1)}h · This month:{' '}
          {(ranges.monthStudy / 3600).toFixed(1)}h
        </p>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <h2 className="text-sm font-semibold">Last 14 days</h2>
        <div className="mt-4 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" opacity={0.35} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#a1a1aa' }} />
              <YAxis tick={{ fontSize: 10, fill: '#a1a1aa' }} />
              <Tooltip
                contentStyle={{
                  background: '#18181b',
                  border: '1px solid #3f3f46',
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="dsa" name="DSA" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="apps" name="Apps" fill="#d946ef" radius={[4, 4, 0, 0]} />
              <Bar dataKey="studyMin" name="Study (min)" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <h2 className="text-sm font-semibold">Badges</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {BADGE_DEFS.map((b) => {
            const unlocked = state.badges.includes(b.id)
            return (
              <div
                key={b.id}
                className={`rounded-xl border p-3 text-sm ${
                  unlocked
                    ? 'border-violet-500/60 bg-violet-500/10'
                    : 'border-zinc-200 opacity-60 dark:border-zinc-800'
                }`}
              >
                <p className="text-lg">{b.icon}</p>
                <p className="font-semibold">{b.label}</p>
                <p className="text-[11px] text-zinc-500">{b.desc}</p>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
