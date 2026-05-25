import { HabitProvider, useDocumentTheme, useHabit } from './context/HabitContext'
import { HomeScreen } from './components/HomeScreen'
import { RoadmapScreen } from './components/RoadmapScreen'
import { StatsScreen } from './components/StatsScreen'
import { SettingsScreen } from './components/SettingsScreen'
import { JournalScreen } from './components/JournalScreen'
import { NotificationScheduler } from './components/NotificationScheduler'

function TabButton({ id, label, icon, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-semibold transition ${
        active
          ? 'text-violet-600 dark:text-violet-300'
          : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100'
      }`}
    >
      <span className="text-lg leading-none">{icon}</span>
      {label}
    </button>
  )
}

function Shell() {
  const { state, setTab, isReady, syncError, isSaving } = useHabit()
  useDocumentTheme(state.settings.darkMode)

  if (!isReady) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 bg-zinc-50 dark:bg-[#0f0818]">
        <p className="text-4xl animate-flame" aria-hidden>
          🔥
        </p>
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Loading your habits…</p>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-zinc-50 pb-24 dark:bg-[#0f0818]">
      <NotificationScheduler />
      {(syncError || isSaving) && (
        <div
          className={`px-4 py-2 text-center text-xs font-medium ${
            syncError
              ? 'bg-amber-500/15 text-amber-800 dark:text-amber-200'
              : 'bg-violet-500/10 text-violet-700 dark:text-violet-200'
          }`}
        >
          {syncError || 'Saving to cloud…'}
        </div>
      )}
      <main className="mx-auto max-w-lg">
        {state.tab === 'home' && <HomeScreen />}
        {state.tab === 'journal' && <JournalScreen />}
        {state.tab === 'roadmap' && <RoadmapScreen />}
        {state.tab === 'stats' && <StatsScreen />}
        {state.tab === 'settings' && <SettingsScreen />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200/80 bg-white/95 px-2 pt-1 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/95">
        <div className="mx-auto flex max-w-lg items-stretch justify-between gap-1 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
          <TabButton
            id="home"
            label="Home"
            icon="🏠"
            active={state.tab === 'home'}
            onSelect={setTab}
          />
          <TabButton
            id="journal"
            label="Journal"
            icon="📔"
            active={state.tab === 'journal'}
            onSelect={setTab}
          />
          <TabButton
            id="roadmap"
            label="Map"
            icon="🗺️"
            active={state.tab === 'roadmap'}
            onSelect={setTab}
          />
          <TabButton
            id="stats"
            label="Stats"
            icon="📊"
            active={state.tab === 'stats'}
            onSelect={setTab}
          />
          <TabButton
            id="settings"
            label="Set"
            icon="⚙️"
            active={state.tab === 'settings'}
            onSelect={setTab}
          />
        </div>
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <HabitProvider>
      <Shell />
    </HabitProvider>
  )
}
