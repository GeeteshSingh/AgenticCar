import { useGameStore } from '@/stores/useGameStore'
import { Progress } from '@/components/ui/progress'

// Vehicle integrity bar. Reads throttled store value (0..100). Color shifts
// from cyan (healthy) toward red (critical).
export function IntegrityDisplay() {
  const integrity = useGameStore((s) => s.integrity)
  const pct = Math.max(0, Math.min(100, integrity))
  const color = pct > 60 ? 'bg-cyan-400' : pct > 30 ? 'bg-amber-400' : 'bg-red-500'

  return (
    <div className="w-40">
      <div className="flex justify-between text-xs text-slate-400 tracking-widest mb-1">
        <span>INTEGRITY</span>
        <span className="tabular-nums">{Math.round(pct)}%</span>
      </div>
      <Progress value={pct} className="h-2 [&>div]:" />
      <div className="mt-1 h-1.5 w-full rounded bg-slate-800 overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default IntegrityDisplay
