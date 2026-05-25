import { useCallback, useEffect, useRef, useState } from 'react'
import { getTodayYMD } from '../lib/dates'
import { loadTimerDraft, saveTimerDraft } from '../lib/storage'

/**
 * Session stopwatch: tracks seconds in the current run; flushes to parent on pause.
 */
export function useStudyTimer({ onFlushSessionSeconds }) {
  const [running, setRunning] = useState(false)
  const [pausedBank, setPausedBank] = useState(0)
  const startedAtRef = useRef(null)
  const [, setPulse] = useState(0)

  useEffect(() => {
    const draft = loadTimerDraft()
    if (!draft) return
    let bank = draft.pausedBank || 0
    if (draft.running && draft.startedAt) {
      bank += Math.max(0, Math.floor((Date.now() - draft.startedAt) / 1000))
    }
    setPausedBank(bank)
    setRunning(Boolean(draft.running))
    startedAtRef.current = draft.running ? Date.now() : null
  }, [])

  useEffect(() => {
    saveTimerDraft({
      date: getTodayYMD(),
      running,
      startedAt: running ? startedAtRef.current : null,
      pausedBank,
    })
  }, [running, pausedBank])

  useEffect(() => {
    if (!running) return
    startedAtRef.current = Date.now()
    const id = setInterval(() => setPulse((x) => x + 1), 1000)
    return () => clearInterval(id)
  }, [running])

  const sessionSeconds =
    pausedBank +
    (running && startedAtRef.current
      ? Math.floor((Date.now() - startedAtRef.current) / 1000)
      : 0)

  const start = useCallback(() => {
    setRunning(true)
    startedAtRef.current = Date.now()
  }, [])

  const pause = useCallback(() => {
    if (!running) return
    const extra =
      startedAtRef.current != null
        ? Math.floor((Date.now() - startedAtRef.current) / 1000)
        : 0
    const total = pausedBank + extra
    setRunning(false)
    startedAtRef.current = null
    setPausedBank(0)
    if (total > 0) onFlushSessionSeconds(total)
  }, [running, pausedBank, onFlushSessionSeconds])

  const reset = useCallback(() => {
    setRunning(false)
    setPausedBank(0)
    startedAtRef.current = null
    saveTimerDraft(null)
  }, [])

  return {
    running,
    start,
    pause,
    reset,
    sessionSeconds,
  }
}
