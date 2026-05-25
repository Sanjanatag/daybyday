import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { useHabit } from '../context/HabitContext'
import { addDaysYMD, getDayOfYear, listLastNDaysYMD } from '../lib/dates'
import { quoteForDay } from '../lib/quotes'
import { dayCompletionRatio, sumAppsInclusive } from '../lib/habitLogic'
import { useStudyTimer } from '../hooks/useStudyTimer'
import { PersonalAssistantCard } from './PersonalAssistantCard'
import { getDisplayName } from '../lib/personal'

function formatHMS(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function ProgressBar({ value, max }) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
      <div
        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function Heatmap({ daily, settings }) {
  const days = useMemo(() => listLastNDaysYMD(35), [])
  const weeks = useMemo(() => {
    const cols = 7
    const rows = Math.ceil(days.length / cols)
    const grid = []
    for (let r = 0; r < rows; r++) {
      const row = []
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c
        row.push(days[idx] || null)
      }
      grid.push(row)
    }
    return grid
  }, [days])

  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Last 5 weeks
      </p>
      <div className="flex gap-1">
        {weeks.map((row, ri) => (
          <div key={ri} className="flex flex-col gap-1">
            {row.map((ymd) => {
              if (!ymd) return <div key={`e-${ri}`} className="h-3 w-3" />
              const ratio = dayCompletionRatio(daily[ymd], settings)
              const level =
                ratio <= 0 ? 0 : ratio < 0.34 ? 1 : ratio < 0.67 ? 2 : ratio < 1 ? 3 : 4
              const bg = [
                'bg-zinc-200 dark:bg-zinc-800',
                'bg-violet-300/50 dark:bg-violet-900/50',
                'bg-violet-400/70 dark:bg-violet-700/60',
                'bg-violet-500/80 dark:bg-violet-500/50',
                'bg-gradient-to-br from-amber-400 to-orange-500',
              ][level]
              return (
                <div
                  key={ymd}
                  title={`${ymd}: ${Math.round(ratio * 100)}%`}
                  className={`h-3 w-3 rounded-sm ${bg}`}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export function HomeScreen() {
  const { state, today, todayRow, allComplete, updateToday, dismissStreakBreak } = useHabit()
  const { daily, settings, streak, showStreakBrokenOverlay } = state
  const prevComplete = useRef(allComplete)
  const [emojiBurst, setEmojiBurst] = useState(false)

  const onFlushSessionSeconds = useCallback(
    (sec) => {
      updateToday({ studySeconds: todayRow.studySeconds + sec })
    },
    [updateToday, todayRow.studySeconds],
  )

  const timer = useStudyTimer({ onFlushSessionSeconds })

  const studyDisplay = todayRow.studySeconds + timer.sessionSeconds
  const studyGoal = settings.studyGoalSeconds

  useEffect(() => {
    if (!prevComplete.current && allComplete) {
      confetti({
        particleCount: 140,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#8b5cf6', '#d946ef', '#f97316', '#facc15'],
      })
      setEmojiBurst(true)
      window.setTimeout(() => setEmojiBurst(false), 2200)
    }
    prevComplete.current = allComplete
  }, [allComplete])

  const quote = quoteForDay(getDayOfYear())

  const dsaDone = todayRow.dsa >= settings.dsaTarget
  const appsDone = todayRow.apps >= settings.appsTarget
  const studyDone = todayRow.studySeconds >= studyGoal

  const weekStart = addDaysYMD(today, -6)
  const monthStart = addDaysYMD(today, -29)
  const appsWeek = sumAppsInclusive(daily, weekStart, today)
  const appsMonth = sumAppsInclusive(daily, monthStart, today)

  return (
    <div className="page-enter safe-pt space-y-5 px-4 pb-6 safe-pb">
      {emojiBurst && (
        <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
          {['🎯', '⚡', '🚀', '✨', '💜', '🎉', '🔥', '⭐'].map((emo, i) => (
            <span
              key={emo + i}
              className="absolute animate-[confetti-rise_0.8s_ease-out_both] text-3xl"
              style={{
                left: `${8 + i * 11}%`,
                top: `${18 + (i % 3) * 8}%`,
                animationDelay: `${i * 0.06}s`,
              }}
            >
              {emo}
            </span>
          ))}
        </div>
      )}
      {showStreakBrokenOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 animate-streak-shake">
          <div className="max-w-sm rounded-2xl border border-zinc-700 bg-zinc-900 p-6 text-center shadow-2xl">
            <p className="text-5xl">💔</p>
            <h2 className="mt-3 text-xl font-bold text-white">Streak broken</h2>
            <p className="mt-2 text-sm text-zinc-300">
              A missed day resets the flame. Your progress is still saved — start a new streak today.
            </p>
            <button
              type="button"
              className="mt-5 w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white active:scale-[0.98]"
              onClick={dismissStreakBreak}
            >
              I am ready
            </button>
          </div>
        </div>
      )}

      <PersonalAssistantCard variant="home" />

      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-violet-500">
            {getDisplayName(settings)}&apos;s today
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Daily grind</h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{quote}</p>
        </div>
        <div className="flex flex-col items-center rounded-2xl border border-orange-500/30 bg-gradient-to-b from-orange-500/15 to-transparent px-4 py-3">
          <span
            className={`text-3xl ${streak >= 7 ? 'animate-flame' : ''}`}
            aria-hidden
          >
            🔥
          </span>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-300">Streak</p>
          <p className="text-2xl font-black text-white">{streak}</p>
          <p className="text-[10px] text-zinc-400">days</p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-violet-500/15 px-3 py-1 font-semibold text-violet-700 dark:text-violet-200">
          {allComplete ? 'Daily goal complete' : 'Complete all three to extend streak'}
        </span>
        <span className="rounded-full bg-zinc-200 px-3 py-1 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          {state.xp} XP
        </span>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">DSA</h2>
          {dsaDone ? (
            <span className="text-lg" aria-label="Complete">
              ✅
            </span>
          ) : (
            <span className="text-xs text-zinc-500">Target {settings.dsaTarget}</span>
          )}
        </div>
        <p className="mt-1 text-xs text-zinc-500">Problems solved today</p>
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            className="h-11 w-11 rounded-xl border border-zinc-300 text-lg font-bold dark:border-zinc-700"
            onClick={() =>
              updateToday({ dsa: Math.max(0, todayRow.dsa - 1) })
            }
            aria-label="Decrease DSA count"
          >
            −
          </button>
          <input
            className="h-11 w-20 rounded-xl border border-zinc-300 bg-transparent text-center text-lg font-semibold dark:border-zinc-700"
            type="number"
            inputMode="numeric"
            min={0}
            value={todayRow.dsa}
            onChange={(e) =>
              updateToday({ dsa: Math.max(0, parseInt(e.target.value || '0', 10)) })
            }
          />
          <button
            type="button"
            className="h-11 w-11 rounded-xl border border-zinc-300 text-lg font-bold dark:border-zinc-700"
            onClick={() => updateToday({ dsa: todayRow.dsa + 1 })}
            aria-label="Increase DSA count"
          >
            +
          </button>
        </div>
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs text-zinc-500">
            <span>Progress</span>
            <span>
              {Math.min(todayRow.dsa, settings.dsaTarget)} / {settings.dsaTarget} done
            </span>
          </div>
          <ProgressBar value={todayRow.dsa} max={settings.dsaTarget} />
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Job applications</h2>
          {appsDone ? (
            <span className="text-lg" aria-label="Complete">
              ✅
            </span>
          ) : (
            <span className="text-xs text-zinc-500">Target {settings.appsTarget}</span>
          )}
        </div>
        <p className="mt-1 text-xs text-zinc-500">Applications sent today</p>
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            className="h-11 w-11 rounded-xl border border-zinc-300 text-lg font-bold dark:border-zinc-700"
            onClick={() => updateToday({ apps: Math.max(0, todayRow.apps - 1) })}
            aria-label="Decrease applications count"
          >
            −
          </button>
          <input
            className="h-11 w-20 rounded-xl border border-zinc-300 bg-transparent text-center text-lg font-semibold dark:border-zinc-700"
            type="number"
            inputMode="numeric"
            min={0}
            value={todayRow.apps}
            onChange={(e) =>
              updateToday({ apps: Math.max(0, parseInt(e.target.value || '0', 10)) })
            }
          />
          <button
            type="button"
            className="h-11 w-11 rounded-xl border border-zinc-300 text-lg font-bold dark:border-zinc-700"
            onClick={() => updateToday({ apps: todayRow.apps + 1 })}
            aria-label="Increase applications count"
          >
            +
          </button>
        </div>
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs text-zinc-500">
            <span>Progress</span>
            <span>
              {Math.min(todayRow.apps, settings.appsTarget)} / {settings.appsTarget} done
            </span>
          </div>
          <ProgressBar value={todayRow.apps} max={settings.appsTarget} />
        </div>
        <p className="mt-3 text-[11px] text-zinc-500">
          Rolling totals · Week: <span className="font-semibold text-zinc-800 dark:text-zinc-100">{appsWeek}</span>{' '}
          · Month: <span className="font-semibold text-zinc-800 dark:text-zinc-100">{appsMonth}</span>
        </p>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Study session</h2>
          {studyDone ? (
            <span className="text-lg" aria-label="Complete">
              ✅
            </span>
          ) : (
            <span className="text-xs text-zinc-500">Goal 2h</span>
          )}
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          Today logged: <span className="font-semibold text-zinc-800 dark:text-zinc-100">{formatHMS(studyDisplay)}</span>{' '}
          · Goal {formatHMS(studyGoal)}
        </p>
        <p className="mt-3 text-center font-mono text-3xl font-bold tracking-tight text-violet-600 dark:text-violet-300">
          {formatHMS(timer.sessionSeconds)}
        </p>
        <p className="text-center text-xs text-zinc-500">Session timer (adds to today when paused)</p>
        <div className="mt-4 flex gap-2">
          {!timer.running ? (
            <button
              type="button"
              className="flex-1 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white active:scale-[0.99]"
              onClick={timer.start}
            >
              Start
            </button>
          ) : (
            <button
              type="button"
              className="flex-1 rounded-xl bg-amber-500 py-3 text-sm font-semibold text-black active:scale-[0.99]"
              onClick={timer.pause}
            >
              Pause & save
            </button>
          )}
          <button
            type="button"
            className="rounded-xl border border-zinc-300 px-4 py-3 text-sm font-semibold dark:border-zinc-700"
            onClick={timer.reset}
          >
            Reset
          </button>
        </div>
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs text-zinc-500">
            <span>Progress toward 2h</span>
            <span>
              {formatHMS(Math.min(studyDisplay, studyGoal))} / {formatHMS(studyGoal)}
            </span>
          </div>
          <ProgressBar value={Math.min(studyDisplay, studyGoal)} max={studyGoal} />
        </div>
      </section>

      <Heatmap daily={daily} settings={settings} />
    </div>
  )
}
