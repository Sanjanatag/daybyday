import { useHabit } from '../context/HabitContext'
import {
  assistantGreeting,
  assistantNudge,
  getDisplayName,
} from '../lib/personal'

export function PersonalAssistantCard({ variant = 'home' }) {
  const { state, today, allComplete } = useHabit()
  const name = getDisplayName(state.settings)
  const greeting = assistantGreeting(name)
  const nudge = assistantNudge(name, allComplete, state.streak)

  return (
    <section className="rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-600/15 via-fuchsia-600/10 to-transparent p-4 shadow-sm dark:border-violet-500/30 dark:from-violet-900/40">
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-lg shadow-lg shadow-violet-600/30"
          aria-hidden
        >
          🤖
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-300">
            {name}&apos;s assistant
          </p>
          <h2 className="text-lg font-bold tracking-tight">{greeting}</h2>
          <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{nudge}</p>
          {variant === 'journal' && (
            <p className="mt-2 text-[11px] text-zinc-500">
              Private workspace · only your records · synced to your cloud profile
            </p>
          )}
          {variant === 'home' && (
            <p className="mt-2 text-[11px] font-medium text-violet-700/80 dark:text-violet-200/80">
              Today · {today} · {state.xp} XP earned
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
