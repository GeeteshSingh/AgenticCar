import { AppShell } from '@/app/AppShell'
import { useEffect } from 'react'
import { useGameStore } from '@/stores/useGameStore'
import { mountHeartbeat, sendCounter, sessionId } from '@/game/liveStatsClient'

// Entry component. Delegates all composition to AppShell, which routes
// between the main menu and the 3D game session.
export default function App() {
  useEffect(() => { document.getElementById('boot-screen')?.remove() }, [])
  useEffect(() => {
    const id = sessionId()
    const stopHeartbeat = mountHeartbeat()
    let lastRun = useGameStore.getState().runId
    const unsubscribe = useGameStore.subscribe(state => {
      if (state.runId !== lastRun) { lastRun = state.runId; void sendCounter('/api/start', id) }
    })
    return () => { unsubscribe(); stopHeartbeat() }
  }, [])
  return <AppShell />
}
