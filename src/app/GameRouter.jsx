import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useGameStore, GAME_STATES } from '@/stores/useGameStore'
import { GameCanvas } from '@/game/GameCanvas'
import { MainMenu } from '@/ui/menus/MainMenu'
import { GameHUD } from '@/ui/hud/GameHUD'
import { PauseMenu } from '@/ui/pause/PauseMenu'

// Drives the transition from loading -> countdown -> playing once inside a
// session. Phase 1 keeps the loading/countdown lightweight (timed state
// changes) and mounts the empty 3D scene. Full countdown UI arrives in Phase 8.
function LoadingGate({ children }) {
  const phase = useGameStore((s) => s.phase)
  const beginCountdown = useGameStore((s) => s.beginCountdown)
  const beginPlaying = useGameStore((s) => s.beginPlaying)

  // Run the load -> countdown -> play sequence exactly once on mount.
  // Phases intentionally excluded from deps: if the effect re-ran on each
  // phase change, the cleanup would cancel the pending beginPlaying timer.
  useEffect(() => {
    const t1 = setTimeout(() => beginCountdown(), 600)
    const t2 = setTimeout(() => beginPlaying(), 1200)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [beginCountdown, beginPlaying])

  if (phase === GAME_STATES.PLAYING || phase === GAME_STATES.PAUSED) return children

  return (
    <div className="h-screen w-screen bg-slate-950 flex items-center justify-center">
      <div className="text-cyan-400 text-xl font-mono tracking-widest">
        {phase === GAME_STATES.LOADING && 'LOADING…'}
        {phase === GAME_STATES.COUNTDOWN && 'GET READY'}
      </div>
    </div>
  )
}

// In-session root: keeps the R3F canvas mounted while overlaying DOM HUD and
// pause menu based on phase. The canvas mounts once and is not remounted on
// pause so the simulation state persists.
function Session() {
  const phase = useGameStore((s) => s.phase)

  return (
    <div className="h-screen w-screen relative">
      <GameCanvas />
      {(phase === GAME_STATES.PLAYING || phase === GAME_STATES.PAUSED) && <GameHUD />}
      {phase === GAME_STATES.PAUSED && <PauseMenu />}
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

  // LOADING, COUNTDOWN, PLAYING, PAUSED all mount the canvas + overlays.
  return <LoadingGate>{<Session />}</LoadingGate>
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
