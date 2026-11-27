import { useGameStore } from '@/stores/useGameStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { ObjectiveDisplay } from '@/ui/hud/ObjectiveDisplay'
import '../menus/experience.css'

export function GameHUD() {
  const speed = useGameStore(s => s.speedKmh)
  const distance = useGameStore(s => s.distanceMeters)
  const integrity = useGameStore(s => s.integrity)
  const score = useGameStore(s => s.score)
  const mode = useGameStore(s => s.mode)
  const camera = useGameStore(s => s.cameraMode)
  const pause = useGameStore(s => s.pause)
  const environment = useSettingsStore(s => s.environment)
  const relaxed = mode === 'relaxed'
  return <div className="drive-hud" aria-label="Driving instruments">
    <div className="drive-hud-context"><span>{environment}</span><span>{camera} view</span><button className="drive-hud-pause" onClick={pause}>Pause</button></div>
    {!relaxed && <div className="drive-hud-objective"><ObjectiveDisplay /></div>}
    <div className="drive-hud-dashboard">
      <div className="drive-hud-speed" aria-label={`${Math.round(Math.abs(speed))} kilometers per hour`}>{Math.round(Math.abs(speed))}<small>km/h{speed < 0 ? ' · R' : ''}</small></div>
      <div className="drive-hud-stat">{(distance / 1000).toFixed(2)}<small>kilometers</small></div>
      {!relaxed && <><div className="drive-hud-stat">{Math.round(integrity)}%<small>integrity</small></div><div className="drive-hud-stat">{Math.round(score).toLocaleString()}<small>score</small></div></>}
    </div>
  </div>
}
export default GameHUD
