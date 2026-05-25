import { useMemo, useState } from 'react'
import { useHabit } from '../context/HabitContext'
import { buildHistoryEntries, filterHistoryEntries } from '../lib/history'
import { formatRecordDate, formatStudyShort, getDisplayName } from '../lib/personal'
import { PersonalAssistantCard } from './PersonalAssistantCard'

const FILTERS = [
  { id: 'all', label: 'All days' },
  { id: 'perfect', label: 'Perfect' },
  { id: 'partial', label: 'Logged' },
  { id: 'missed', label: 'No log' },
]

function statusBadge(entry) {
  if (entry.complete) return { text: 'Perfect', className: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' }
  if (entry.hasActivity) {
    return {
      text: `${Math.round(entry.ratio * 100)}%`,
      className: 'bg-amber-500/20 text-amber-800 dark:text-amber-200',
    }
  }
  return { text: 'No log', className: 'bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400' }
}

export function JournalScreen() {
  const { state, today } = useHabit()
  const { daily, settings } = state
  const name = getDisplayName(settings)
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)

  const allEntries = useMemo(
    () => buildHistoryEntries(daily, settings, today),
    [daily, settings, today],
  )

  const entries = useMemo(
    () => filterHistoryEntries(allEntries, filter),
    [allEntries, filter],
  )

  const summary = useMemo(() => {
    const perfect = allEntries.filter((e) => e.complete).length
    const active = allEntries.filter((e) => e.hasActivity).length
    const missed = allEntries.filter((e) => !e.hasActivity).length
    return {
      tracked: allEntries.length,
      active,
      perfect,
      missed,
      dsa: state.lifetimeDsa,
      studyH: (state.lifetimeStudySeconds / 3600).toFixed(1),
    }
  }, [allEntries, state.lifetimeDsa, state.lifetimeStudySeconds])

  const rangeLabel = useMemo(() => {
    if (allEntries.length === 0) return ''
    const oldest = allEntries[allEntries.length - 1].ymd
    return `${oldest} → ${today}`
  }, [allEntries, today])

  return (
    <div className="page-enter safe-pt space-y-4 px-4 pb-6 safe-pb">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-violet-500">Journal</p>
        <h1 className="text-2xl font-bold tracking-tight">{name}&apos;s records</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Every day on the calendar — logged or not.
        </p>
        {rangeLabel && (
          <p className="mt-1 font-mono text-[11px] text-zinc-500">{rangeLabel}</p>
        )}
      </header>

      <PersonalAssistantCard variant="journal" />

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ['Days tracked', summary.tracked],
          ['Days logged', summary.active],
          ['Perfect', summary.perfect],
          ['No log', summary.missed],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/80"
          >
            <p className="text-[10px] text-zinc-500">{label}</p>
            <p className="text-lg font-bold text-violet-600 dark:text-violet-300">{value}</p>
          </div>
        ))}
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
              filter === f.id
                ? 'bg-violet-600 text-white'
                : 'bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {entries.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
          No days match this filter.
        </p>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => {
            const open = expanded === entry.ymd
            const label = formatRecordDate(entry.ymd, today)
            const badge = statusBadge(entry)
            return (
              <li key={entry.ymd}>
                <button
                  type="button"
                  onClick={() => setExpanded(open ? null : entry.ymd)}
                  className={`w-full rounded-2xl border p-4 text-left shadow-sm transition active:scale-[0.99] ${
                    entry.hasActivity
                      ? 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/80'
                      : 'border-zinc-200/80 bg-zinc-50 dark:border-zinc-800/60 dark:bg-zinc-950/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`font-semibold ${!entry.hasActivity ? 'text-zinc-500 dark:text-zinc-400' : ''}`}>
                        {label}
                      </p>
                      <p className="text-[11px] text-zinc-500">{entry.ymd}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${badge.className}`}
                    >
                      {badge.text}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                    <span className={entry.dsaHit ? 'font-semibold text-violet-600 dark:text-violet-300' : ''}>
                      DSA {entry.row.dsa}/{settings.dsaTarget}
                    </span>
                    <span>·</span>
                    <span className={entry.appsHit ? 'font-semibold text-violet-600 dark:text-violet-300' : ''}>
                      Apps {entry.row.apps}/{settings.appsTarget}
                    </span>
                    <span>·</span>
                    <span className={entry.studyHit ? 'font-semibold text-violet-600 dark:text-violet-300' : ''}>
                      Study {formatStudyShort(entry.row.studySeconds)}
                    </span>
                  </div>
                  {open && (
                    <div className="mt-3 border-t border-zinc-100 pt-3 text-sm dark:border-zinc-800">
                      {!entry.hasActivity ? (
                        <p className="text-zinc-500">
                          {entry.ymd === today
                            ? `${name}, nothing logged yet today — your assistant is ready when you are.`
                            : `${name}, no activity was saved this day.`}
                        </p>
                      ) : (
                        <>
                          <p>
                            <span className="text-zinc-500">DSA problems:</span> {entry.row.dsa}
                            {entry.dsaHit ? ' ✓' : ''}
                          </p>
                          <p className="mt-1">
                            <span className="text-zinc-500">Applications:</span> {entry.row.apps}
                            {entry.appsHit ? ' ✓' : ''}
                          </p>
                          <p className="mt-1">
                            <span className="text-zinc-500">Study logged:</span>{' '}
                            {formatStudyShort(entry.row.studySeconds)}
                            {entry.studyHit ? ' ✓' : ''}
                          </p>
                          <p className="mt-2 text-[11px] text-zinc-500">
                            {entry.complete
                              ? 'Full perfect day — streak fuel.'
                              : 'Partial day — some tasks still open.'}
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
