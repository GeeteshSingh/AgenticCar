import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useGameStore, GAME_STATES } from '@/stores/useGameStore'
import { GameCanvas } from '@/game/GameCanvas'
import { MainMenu } from '@/ui/menus/MainMenu'

// Drives the transition from loading -> countdown -> playing once inside a
// session. Phase 1 keeps the loading/countdown lightweight (timed state
// changes) and mounts the empty 3D scene. Full countdown UI arrives in Phase 8.
function LoadingGate({ children }) {
  const phase = useGameStore((s) => s.phase)
  const beginCountdown = useGameStore((s) => s.beginCountdown)
  const beginPlaying = useGameStore((s) => s.beginPlaying)

  useEffect(() => {
    if (phase !== GAME_STATES.LOADING) return
    const t1 = setTimeout(() => beginCountdown(), 600)
    const t2 = setTimeout(() => beginPlaying(), 1200)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [phase, beginCountdown, beginPlaying])

  if (phase === GAME_STATES.PLAYING) return children

  return (
    <div className="h-screen w-screen bg-slate-950 flex items-center justify-center">
      <div className="text-cyan-400 text-xl font-mono tracking-widest">
        {phase === GAME_STATES.LOADING && 'LOADING…'}
        {phase === GAME_STATES.COUNTDOWN && 'GET READY'}
      </div>
    </div>
  )
}

// Routes between menu and the in-session 3D scene based on store phase.
export function GameRouter() {
  const phase = useGameStore((s) => s.phase)
  const returnToMenu = useGameStore((s) => s.returnToMenu)

  if (phase === GAME_STATES.MENU) {
    return <MainMenu />
  }

  if (phase === GAME_STATES.RESULTS) {
    return <ResultsPlaceholder onMenu={returnToMenu} />
  }

  // LOADING, COUNTDOWN, PLAYING, PAUSED all render the 3D canvas.
  return <LoadingGate>{<GameCanvas />}</LoadingGate>
}

function ResultsPlaceholder({ onMenu }) {
  return (
    <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-black text-red-400">RUN COMPLETE</h1>
      <Button onClick={onMenu} className="bg-cyan-600 hover:bg-cyan-500">
        Return to Menu
      </Button>
    </div>
  )
}

export default GameRouter
