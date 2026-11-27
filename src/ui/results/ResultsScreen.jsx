import { brand } from '@/config/brand'
import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useGameStore } from '@/stores/useGameStore'

// Results screen shown when integrity reaches zero (endless) or a mission
// ends. Displays full run stats from the store. Restart begins a fresh run of
// the same mode; return-to-menu clears gameplay state.
export function ResultsScreen() {
  const score = useGameStore((s) => s.score)
  const distanceMeters = useGameStore((s) => s.distanceMeters)
  const survivalTime = useGameStore((s) => s.survivalTime)
  const speedKmh = useGameStore((s) => s.topSpeed)
  const overtakes = useGameStore((s) => s.overtakes)
  const nearMisses = useGameStore((s) => s.nearMisses)
  const collisions = useGameStore((s) => s.collisions)
  const mode = useGameStore((s) => s.mode)
  const resultReason = useGameStore(s => s.resultReason)
  const missionComplete = useGameStore((s) => s.missionComplete)
  const startRun = useGameStore((s) => s.startRun)
  const returnToMenu = useGameStore((s) => s.returnToMenu)

  const dialog = useRef()
  useEffect(() => {
    const node = dialog.current
    const trapFocus = event => {
      if (event.key !== 'Tab') return
      const buttons = [...node.querySelectorAll('button')]
      const first = buttons[0], last = buttons.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    node.addEventListener('keydown', trapFocus)
    return () => node.removeEventListener('keydown', trapFocus)
  }, [])

  const stats = [
    ['Score', Math.round(score).toLocaleString()],
    ['Distance', `${(distanceMeters / 1000).toFixed(2)} km`],
    ['Survival', `${Math.floor(survivalTime)} s`],
    ['Top Speed', `${Math.round(speedKmh)} km/h`],
    ['Overtakes', Math.round(overtakes)],
    ['Near Misses', Math.round(nearMisses)],
    ['Collisions', Math.round(collisions)],
  ]

  return (
    <div ref={dialog} role="dialog" aria-modal="true" aria-label="Run results" className="absolute inset-0 z-30 overflow-y-auto bg-slate-950/55 backdrop-blur-sm flex flex-col items-center p-4 py-6 sm:py-10">
      <div className="text-center mb-5 shrink-0">
        <h1
          className={`text-5xl font-black mb-2 ${
            missionComplete ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          {missionComplete ? 'MISSION COMPLETE' : 'RUN OVER'}
        </h1>
        <p className="text-slate-400">
          {resultReason || (missionComplete
            ? 'All objectives finished'
            : mode === 'mission'
              ? 'Mission ended'
              : 'Vehicle destroyed')}
        </p>
      </div>

      <Card className="w-full max-w-sm shrink-0 bg-slate-900/65 border-slate-500/60">
        <CardHeader>
          <CardTitle className="text-cyan-400 text-2xl text-center">{brand.name} · Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {stats.map(([label, value]) => (
            <div key={label} className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-slate-400">{label}</span>
              <span className="text-lg font-semibold text-slate-100 tabular-nums">{value}</span>
            </div>
          ))}
          <div className="pt-3 space-y-2">
            <Button
              autoFocus
              onClick={() => startRun(mode || 'endless')}
              className="w-full h-12 bg-cyan-600 hover:bg-cyan-500"
            >
              Restart
            </Button>
            <Button
              onClick={returnToMenu}
              variant="outline"
              className="w-full h-12 border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Return to Menu
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ResultsScreen
