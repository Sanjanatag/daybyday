import { useEffect, useMemo, useState } from 'react'
import { useHabit } from '../context/HabitContext'

function statusLabel(s) {
  if (s === 'done') return 'Done'
  if (s === 'in_progress') return 'In progress'
  return 'Not started'
}

function statusColor(s) {
  if (s === 'done') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  if (s === 'in_progress') return 'bg-amber-500/20 text-amber-200 border-amber-500/40'
  return 'bg-zinc-800 text-zinc-300 border-zinc-700'
}

export function RoadmapScreen() {
  const { state, addRoadmap, deleteRoadmap, addMilestone, setMilestoneStatus } = useHabit()
  const [title, setTitle] = useState('')
  const [activeId, setActiveId] = useState(() => state.roadmaps[0]?.id || '')
  const active = useMemo(
    () => state.roadmaps.find((r) => r.id === activeId) || state.roadmaps[0],
    [state.roadmaps, activeId],
  )

  const [mTitle, setMTitle] = useState('')
  const [mDesc, setMDesc] = useState('')
  const [mDue, setMDue] = useState('')

  useEffect(() => {
    if (!state.roadmaps.some((r) => r.id === activeId)) {
      setActiveId(state.roadmaps[0]?.id || '')
    }
  }, [state.roadmaps, activeId])

  const pct = useMemo(() => {
    if (!active || !active.milestones.length) return 0
    const done = active.milestones.filter((m) => m.status === 'done').length
    return Math.round((done / active.milestones.length) * 100)
  }, [active])

  return (
    <div className="page-enter safe-pt space-y-4 px-4 pb-6 safe-pb">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-violet-500">Roadmap</p>
        <h1 className="text-2xl font-bold tracking-tight">Study path</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Milestones, deadlines, and a clear vertical trail of wins.
        </p>
      </header>

      <div className="flex gap-2">
        <input
          className="min-w-0 flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="New roadmap title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button
          type="button"
          className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white"
          onClick={() => {
            addRoadmap(title || 'My roadmap')
            setTitle('')
          }}
        >
          Add
        </button>
      </div>

      {state.roadmaps.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {state.roadmaps.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setActiveId(r.id)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold ${
                active?.id === r.id
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100'
              }`}
            >
              {r.title}
            </button>
          ))}
        </div>
      )}

      {active && (
        <>
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">{active.title}</h2>
                <p className="mt-1 text-sm text-zinc-500">Overall completion</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-violet-600 dark:text-violet-300">{pct}%</p>
              </div>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            <button
              type="button"
              className="mt-3 text-xs font-semibold text-red-500"
              onClick={() => deleteRoadmap(active.id)}
            >
              Delete roadmap
            </button>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
            <h3 className="text-sm font-semibold">Add milestone</h3>
            <input
              className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              placeholder="Title"
              value={mTitle}
              onChange={(e) => setMTitle(e.target.value)}
            />
            <textarea
              className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              placeholder="Description (optional)"
              rows={2}
              value={mDesc}
              onChange={(e) => setMDesc(e.target.value)}
            />
            <input
              className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              type="date"
              value={mDue}
              onChange={(e) => setMDue(e.target.value)}
            />
            <button
              type="button"
              className="mt-3 w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
              onClick={() => {
                addMilestone({
                  roadmapId: active.id,
                  title: mTitle,
                  description: mDesc,
                  dueDate: mDue,
                })
                setMTitle('')
                setMDesc('')
                setMDue('')
              }}
            >
              Save milestone
            </button>
          </div>

          <div className="relative pl-6">
            <div className="absolute bottom-2 left-[11px] top-2 w-px bg-gradient-to-b from-violet-500/60 via-fuchsia-500/40 to-transparent" />
            <ul className="space-y-4">
              {active.milestones.map((m, idx) => (
                <li key={m.id} className="relative">
                  <span
                    className={`absolute -left-6 top-3 flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-bold ${
                      m.status === 'done'
                        ? 'border-emerald-400 bg-emerald-500 text-white'
                        : m.status === 'in_progress'
                          ? 'border-amber-400 bg-amber-500 text-black'
                          : 'border-zinc-400 bg-zinc-900 text-zinc-200'
                    }`}
                  >
                    {m.status === 'done' ? '✓' : idx + 1}
                  </span>
                  <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-transform dark:border-zinc-800 dark:bg-zinc-900/80 active:scale-[0.99]">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{m.title}</p>
                        {m.description && (
                          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{m.description}</p>
                        )}
                        {m.dueDate && (
                          <p className="mt-2 text-xs text-zinc-500">Due {m.dueDate}</p>
                        )}
                      </div>
                      <span
                        className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase ${statusColor(m.status)}`}
                      >
                        {statusLabel(m.status)}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {m.status !== 'not_started' && (
                        <button
                          type="button"
                          className="rounded-lg border border-zinc-300 px-3 py-1 text-xs font-semibold dark:border-zinc-700"
                          onClick={() =>
                            setMilestoneStatus({
                              roadmapId: active.id,
                              milestoneId: m.id,
                              status: 'not_started',
                            })
                          }
                        >
                          Reset
                        </button>
                      )}
                      {m.status !== 'in_progress' && m.status !== 'done' && (
                        <button
                          type="button"
                          className="rounded-lg bg-amber-500/90 px-3 py-1 text-xs font-semibold text-black"
                          onClick={() =>
                            setMilestoneStatus({
                              roadmapId: active.id,
                              milestoneId: m.id,
                              status: 'in_progress',
                            })
                          }
                        >
                          Start
                        </button>
                      )}
                      {m.status !== 'done' && (
                        <button
                          type="button"
                          className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white"
                          onClick={() =>
                            setMilestoneStatus({
                              roadmapId: active.id,
                              milestoneId: m.id,
                              status: 'done',
                            })
                          }
                        >
                          Mark done
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {state.roadmaps.length === 0 && (
        <p className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
          Create your first roadmap to see the vertical path here.
        </p>
      )}
    </div>
  )
}
