export const BADGE_DEFS = [
  { id: 'streak-3', label: '3-Day Spark', desc: 'Hit a 3-day perfect streak', icon: '✨' },
  { id: 'streak-7', label: 'Week Warrior', desc: '7-day streak', icon: '🔥' },
  { id: 'streak-30', label: 'Monthly Legend', desc: '30-day streak', icon: '👑' },
  { id: 'xp-500', label: 'XP Collector', desc: 'Earn 500 total XP', icon: '⭐' },
  { id: 'xp-2000', label: 'XP Master', desc: 'Earn 2000 total XP', icon: '🌟' },
  { id: 'dsa-100', label: 'Problem Grinder', desc: '100 lifetime DSA problems logged', icon: '🧩' },
  { id: 'apps-50', label: 'Application Machine', desc: '50 applications sent (lifetime)', icon: '📨' },
]

export function evaluateNewBadges(state, prevBadges) {
  const set = new Set(prevBadges)
  const next = [...prevBadges]
  const { streak, xp, lifetimeDsa, lifetimeApps } = state

  const checks = [
    ['streak-3', streak >= 3],
    ['streak-7', streak >= 7],
    ['streak-30', streak >= 30],
    ['xp-500', xp >= 500],
    ['xp-2000', xp >= 2000],
    ['dsa-100', lifetimeDsa >= 100],
    ['apps-50', lifetimeApps >= 50],
  ]

  for (const [id, ok] of checks) {
    if (ok && !set.has(id)) {
      next.push(id)
      set.add(id)
    }
  }
  return next
}
