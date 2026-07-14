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
  const speedKmh = useGameStore((s) => s.speedKmh)
  const overtakes = useGameStore((s) => s.overtakes)
  const nearMisses = useGameStore((s) => s.nearMisses)
  const collisions = useGameStore((s) => s.collisions)
  const mode = useGameStore((s) => s.mode)
  const startRun = useGameStore((s) => s.startRun)
  const returnToMenu = useGameStore((s) => s.returnToMenu)

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
    <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-black text-red-400 mb-2">RUN OVER</h1>
        <p className="text-slate-400">{mode === 'mission' ? 'Mission ended' : 'Vehicle destroyed'}</p>
      </div>

      <Card className="w-full max-w-sm bg-slate-900/90 border-slate-700">
        <CardHeader>
          <CardTitle className="text-cyan-400 text-2xl text-center">Results</CardTitle>
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
