import { useGameStore } from '@/stores/useGameStore'
import { SpeedDisplay } from '@/ui/hud/SpeedDisplay'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// DOM HUD overlay. Rendered above the R3F canvas while PLAYING or PAUSED.
// Kept minimal for Phase 2: speed, distance, camera mode. Non-blocking
// (pointer-events none) so it never covers road visibility.
export function GameHUD() {
  const distanceMeters = useGameStore((s) => s.distanceMeters)
  const cameraMode = useGameStore((s) => s.cameraMode)

  return (
    <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <Card className="bg-slate-900/70 border-slate-700 backdrop-blur-sm pointer-events-auto">
          <CardContent className="py-3 px-4">
            <SpeedDisplay />
          </CardContent>
        </Card>

        <Card className="bg-slate-900/70 border-slate-700 backdrop-blur-sm pointer-events-auto">
          <CardContent className="py-3 px-4 text-right">
            <div className="text-2xl font-bold text-emerald-300 tabular-nums leading-none">
              {(distanceMeters / 1000).toFixed(2)}
              <span className="text-sm text-slate-400 ml-1">km</span>
            </div>
            <div className="text-xs text-slate-500 tracking-widest mt-1">DISTANCE</div>
          </CardContent>
        </Card>

        <Badge variant="secondary" className="bg-slate-800/80 text-cyan-300 border border-slate-600">
          {cameraMode === 'chase' ? 'CHASE (C)' : 'HOOD (C)'}
        </Badge>
      </div>

      <div className="self-center text-xs text-slate-500 bg-slate-900/60 px-3 py-1 rounded-full backdrop-blur-sm pointer-events-none">
        W/A/S/D or Arrows to drive · Space handbrake · C camera · Esc pause
      </div>
    </div>
  )
}

export default GameHUD
