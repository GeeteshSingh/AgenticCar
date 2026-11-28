import { brand } from '@/config/brand'
import { useEffect, useState } from 'react'
import { useGameStore, GAME_STATES } from '@/stores/useGameStore'
import { GameCanvas } from '@/game/GameCanvas'
import { MainMenu } from '@/ui/menus/MainMenu'
import { GameHUD } from '@/ui/hud/GameHUD'
import { PauseMenu } from '@/ui/pause/PauseMenu'
import { ResultsScreen } from '@/ui/results/ResultsScreen'
import { TouchControls } from '@/ui/controls/TouchControls'
import { CollisionFlash } from '@/ui/effects/CollisionFlash'

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

  if (phase === GAME_STATES.PLAYING || phase === GAME_STATES.PAUSED || phase === GAME_STATES.RESULTS) return children

  return (
    <div className="h-screen w-screen bg-slate-950 flex items-center justify-center">
      <div className="text-cyan-400 text-xl font-mono tracking-widest">
        {phase === GAME_STATES.LOADING && brand.tagline}
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
  const [canvasFocused, setCanvasFocused] = useState(false)

  useEffect(() => {
    const pauseOnHide = () => { if (document.hidden) useGameStore.getState().pause() }
    document.addEventListener('visibilitychange', pauseOnHide)
    return () => document.removeEventListener('visibilitychange', pauseOnHide)
  }, [])
  useEffect(() => {
    const update = () => setCanvasFocused(document.activeElement instanceof HTMLCanvasElement)
    document.addEventListener('focusin', update); document.addEventListener('focusout', update)
    const blur = () => setCanvasFocused(false)
    window.addEventListener('blur', blur)
    return () => { document.removeEventListener('focusin', update); document.removeEventListener('focusout', update); window.removeEventListener('blur', blur) }
  }, [])

  return (
    <div className="h-screen w-screen relative overflow-hidden">
      <GameCanvas />
      {phase !== GAME_STATES.RESULTS && <CollisionFlash />}
      {phase === GAME_STATES.PLAYING && <TouchControls />}
      {phase === GAME_STATES.PLAYING && !canvasFocused && <button className="click-to-play" onClick={() => document.querySelector('canvas[aria-label="Driving view"]')?.focus()}>Click to play</button>}
      {(phase === GAME_STATES.PLAYING || phase === GAME_STATES.PAUSED) && <GameHUD />}
      {phase === GAME_STATES.PAUSED && <PauseMenu />}
      {phase === GAME_STATES.RESULTS && <ResultsScreen />}
    </div>
  )
}

// Routes between menu and the in-session 3D scene based on store phase.
export function GameRouter() {
  const phase = useGameStore((s) => s.phase)

  if (phase === GAME_STATES.MENU) {
    return <MainMenu />
  }

  const runId = useGameStore.getState().runId
  // A fresh run mounts a fresh simulation; pausing preserves the same session.
  return <LoadingGate key={runId}>{<Session />}</LoadingGate>
}

export default GameRouter
