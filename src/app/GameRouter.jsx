import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore, GAME_STATES } from '@/stores/useGameStore'
import { GameCanvas } from '@/game/GameCanvas'
import { MainMenu } from '@/ui/menus/MainMenu'
import { GameHUD } from '@/ui/hud/GameHUD'
import { PauseMenu } from '@/ui/pause/PauseMenu'
import { ResultsScreen } from '@/ui/results/ResultsScreen'
import { CollisionFlash } from '@/ui/effects/CollisionFlash'

// Polished loading screen (Phase 8). Subtle restrained motion only.
function LoadingScreen() {
  return (
    <div className="absolute inset-0 z-30 bg-slate-950 flex flex-col items-center justify-center gap-6">
      <motion.div
        className="h-1.5 w-48 rounded-full bg-slate-800 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="h-full bg-cyan-400"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 0.55, ease: 'easeInOut' }}
        />
      </motion.div>
      <motion.span
        className="text-cyan-400 text-lg font-mono tracking-[0.4em]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        LOADING
      </motion.span>
    </div>
  )
}

// Big 3-2-1-GO countdown overlay (Phase 8). Prevents early movement because the
// simulation only advances once phase becomes 'playing'.
function CountdownOverlay() {
  const [n, setN] = useState(3)
  useEffect(() => {
    if (n <= 0) return
    const t = setTimeout(() => setN((v) => v - 1), 700)
    return () => clearTimeout(t)
  }, [n])
  const label = n > 0 ? String(n) : 'GO'
  return (
    <div className="absolute inset-0 z-30 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={label}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`text-8xl font-black ${n > 0 ? 'text-cyan-300' : 'text-emerald-400'}`}
        >
          {label}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// Drives the transition from loading -> countdown -> playing once inside a
// session. The 3D scene mounts immediately (under the overlays) so the highway
// is already visible behind the countdown.
function LoadingGate({ children }) {
  const phase = useGameStore((s) => s.phase)
  const beginCountdown = useGameStore((s) => s.beginCountdown)
  const beginPlaying = useGameStore((s) => s.beginPlaying)

  useEffect(() => {
    const t1 = setTimeout(() => beginCountdown(), 600)
    const t2 = setTimeout(() => beginPlaying(), 2700)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [beginCountdown, beginPlaying])

  return (
    <>
      {children}
      <AnimatePresence>
        {phase === GAME_STATES.LOADING && <LoadingScreen key="load" />}
        {phase === GAME_STATES.COUNTDOWN && <CountdownOverlay key="cd" />}
      </AnimatePresence>
    </>
  )
}

// In-session root: keeps the R3F canvas mounted while overlaying DOM HUD and
// pause menu based on phase. The canvas mounts once and is not remounted on
// pause so the simulation state persists.
function Session() {
  const phase = useGameStore((s) => s.phase)

  return (
    <div className="h-screen w-screen relative overflow-hidden">
      <GameCanvas />
      <CollisionFlash />
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
    return <ResultsScreen />
  }

  // LOADING, COUNTDOWN, PLAYING, PAUSED all mount the canvas + overlays.
  return <LoadingGate>{<Session />}</LoadingGate>
}

export default GameRouter
