import { requestHorn, requestAudioStart } from '@/game/audio/drivingMix'
import { useState } from 'react'
import { PLAYER_VEHICLES, playerVehicle } from '@/game/config/playerVehicles'
import { routeName } from '@/game/config/environmentConfig'
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
  const vehicle = useSettingsStore(s=>s.vehicle)
  const [shortcuts, setShortcuts] = useState(false)
  const relaxed = mode === 'relaxed'
  return <div className="drive-hud" aria-label="Driving instruments">
    <div className="drive-hud-context"><span>{routeName(environment)}</span><span>{playerVehicle(vehicle).name} · 1–9</span><button className="drive-hud-pause" onClick={() => {useGameStore.getState().toggleCameraMode(); useSettingsStore.getState().setSetting('camera', useGameStore.getState().cameraMode)}}>View: {camera} · C</button><button className="drive-hud-pause" aria-expanded={shortcuts} onClick={() => setShortcuts(!shortcuts)}>Vehicles · 1–9</button><button className="drive-hud-pause" onClick={requestHorn}>Horn · H</button><button className="drive-hud-pause" onClick={() => {useSettingsStore.getState().setSetting('engineVolume', .5); requestAudioStart()}}>Enable sound</button><button className="drive-hud-pause" onClick={pause}>Pause</button></div>
    {shortcuts && <div className="vehicle-shortcuts" aria-label="Switch vehicle">{PLAYER_VEHICLES.map((v, i) => <button key={v.name} aria-pressed={vehicle === i} onClick={() => {useSettingsStore.getState().setSetting('vehicle', i); setShortcuts(false)}}><kbd>{i + 1}</kbd> {v.name}</button>)}</div>}
    {!relaxed && <div className="drive-hud-objective"><ObjectiveDisplay /></div>}
    <div className="drive-hud-dashboard">
      <div className="drive-hud-speed" aria-label={`${Math.round(Math.abs(speed))} kilometers per hour`}>{Math.round(Math.abs(speed))}<small>km/h{speed < 0 ? ' · R' : ''}</small></div>
      <div className="drive-hud-stat">{(distance / 1000).toFixed(2)}<small>kilometers</small></div>
      {!relaxed && <><div className="drive-hud-stat">{Math.round(integrity)}%<small>integrity</small></div><div className="drive-hud-stat">{Math.round(score).toLocaleString()}<small>score</small></div></>}
    </div>
  </div>
}
export default GameHUD
