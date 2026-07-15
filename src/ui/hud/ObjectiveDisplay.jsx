import { useGameStore } from '@/stores/useGameStore'

// Active objective panel. For mission mode shows the current sequential stage
// with progress; for endless mode shows the rotating optional challenge.
// Reads the throttled objective snapshot from the store.
export function ObjectiveDisplay() {
  const objective = useGameStore((s) => s.activeObjective)
  const mode = useGameStore((s) => s.mode)
  const completedCount = useGameStore((s) => s.objectiveCompleted)
  const totalCount = useGameStore((s) => s.objectiveTotal)

  if (!objective) return null

  const pct = Math.round((objective.progress || 0) * 100)
  const isEndless = mode === 'endless'

  return (
    <div className="bg-slate-900/70 border border-slate-700 backdrop-blur-sm rounded-lg px-3 py-2 pointer-events-auto w-56">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-widest text-cyan-400">
          {isEndless ? 'Challenge' : `Objective ${completedCount + 1}/${totalCount}`}
        </span>
        {objective.optional && (
          <span className="text-[10px] text-amber-400">optional</span>
        )}
      </div>
      <div className="text-sm font-semibold text-slate-100 leading-tight">
        {objective.title}
      </div>
      <div className="text-[11px] text-slate-400 mt-0.5">{objective.description}</div>
      <div className="mt-2 h-1.5 w-full rounded bg-slate-800 overflow-hidden">
        <div
          className={`h-full ${isEndless ? 'bg-amber-400' : 'bg-cyan-400'} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-500">
        <span>+{objective.reward} pts</span>
        <span className="tabular-nums">{pct}%</span>
      </div>
    </div>
  )
}

export default ObjectiveDisplay
