import { useGameStore } from '@/stores/useGameStore'

// Shows current speed (km/h) from the throttled store stat, written by the
// render loop. The value is NOT updated every frame — only ~10x/sec.
export function SpeedDisplay() {
  const speedKmh = useGameStore((s) => s.speedKmh)
  return (
    <div className="text-right">
      <div className="text-4xl font-bold text-cyan-300 tabular-nums leading-none">
        {Math.round(speedKmh)}
        <span className="text-base text-slate-400 ml-1">km/h</span>
      </div>
      <div className="text-xs text-slate-500 tracking-widest mt-1">SPEED</div>
    </div>
  )
}

export default SpeedDisplay
