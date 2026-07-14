import { useGameStore } from '@/stores/useGameStore'
import { Badge } from '@/components/ui/badge'

// Top-left score with live multiplier. Multiplier color reflects its tier.
export function ScoreDisplay() {
  const score = useGameStore((s) => s.score)
  const multiplier = useGameStore((s) => s.multiplier)

  const multColor =
    multiplier >= 3 ? 'bg-red-500/80 text-white' :
    multiplier >= 2 ? 'bg-amber-500/80 text-black' :
    multiplier > 1 ? 'bg-cyan-500/80 text-black' :
    'bg-slate-700 text-slate-300'

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="text-3xl font-black text-cyan-300 tabular-nums leading-none drop-shadow">
        {Math.round(score).toLocaleString()}
      </div>
      <div className="text-xs text-slate-500 tracking-widest">SCORE</div>
      <Badge className={`mt-1 ${multColor}`}>×{multiplier.toFixed(1)}</Badge>
    </div>
  )
}

export default ScoreDisplay
