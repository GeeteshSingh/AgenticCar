import { useGameStore } from '@/stores/useGameStore'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Engaging scoreboard with live stats to keep players invested
export function Scoreboard() {
  const score = useGameStore((s) => s.score)
  const multiplier = useGameStore((s) => s.multiplier)
  const overtakes = useGameStore((s) => s.overtakes)
  const nearMisses = useGameStore((s) => s.nearMisses)
  const distanceMeters = useGameStore((s) => s.distanceMeters)
  const topSpeed = useGameStore((s) => s.topSpeed)
  const collisions = useGameStore((s) => s.collisions)

  const multColor =
    multiplier >= 3 ? 'bg-red-500/80 text-white' :
    multiplier >= 2 ? 'bg-amber-500/80 text-black' :
    multiplier > 1 ? 'bg-cyan-500/80 text-black' :
    'bg-slate-700 text-slate-300'

  return (
    <Card className="absolute top-4 right-4 w-64 bg-slate-900/80 border-slate-700 backdrop-blur-sm pointer-events-auto z-20">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 pb-2">
          <h3 className="text-sm font-bold text-cyan-300 tracking-wider">SCOREBOARD</h3>
          <Badge className={` ${multColor}`}>×{multiplier.toFixed(1)}</Badge>
        </div>

        {/* Main Score */}
        <div className="text-center">
          <div className="text-4xl font-black text-cyan-300 tabular-nums leading-none drop-shadow">
            {Math.round(score).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 tracking-widest mt-1">TOTAL SCORE</div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-slate-800/50 rounded-lg p-2">
            <div className="text-xl font-bold text-emerald-300 tabular-nums">{overtakes}</div>
            <div className="text-xs text-slate-500 tracking-wider">OVERTAKES</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-2">
            <div className="text-xl font-bold text-amber-300 tabular-nums">{nearMisses}</div>
            <div className="text-xs text-slate-500 tracking-wider">NEAR MISSES</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-2">
            <div className="text-xl font-bold text-cyan-300 tabular-nums">
              {(distanceMeters / 1000).toFixed(2)}
            </div>
            <div className="text-xs text-slate-500 tracking-wider">KM</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-2">
            <div className="text-xl font-bold text-red-300 tabular-nums">{collisions}</div>
            <div className="text-xs text-slate-500 tracking-wider">COLLISIONS</div>
          </div>
        </div>

        {/* Top Speed */}
        <div className="border-t border-slate-700 pt-2">
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-slate-500 tracking-widest">TOP SPEED</span>
            <span className="text-lg font-bold text-white tabular-nums">
              {Math.round(topSpeed)} km/h
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default Scoreboard
