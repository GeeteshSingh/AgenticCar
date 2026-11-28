import { ChunkBoundary } from '@/ui/common/ChunkBoundary'
import { lazy, Suspense } from 'react'
const MarketPanel = lazy(() => import('@/ui/shop/MarketPanel').then(module => ({ default: module.MarketPanel })))
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
  const nearbyPlace = useGameStore(s => s.nearbyPlace)
  const score = useGameStore(s => s.score)
  const mode = useGameStore(s => s.mode)
  const camera = useGameStore(s => s.cameraMode)
  const pause = useGameStore(s => s.pause)
  const environment = useSettingsStore(s => s.environment)
  const vehicle = useSettingsStore(s=>s.vehicle)
  const [shortcuts, setShortcuts] = useState(false)
  const [controlsOpen, setControlsOpen] = useState(false)
  const [shopOpen, setShopOpen] = useState(false)
  const relaxed = mode === 'relaxed' || environment === 'thar_test'
  return <div className="drive-hud" aria-label="Driving instruments">
    <div className="drive-hud-context"><span className="drive-hud-route">{routeName(environment)}</span><button className="drive-hud-mobile-toggle" aria-expanded={controlsOpen} onClick={() => setControlsOpen(!controlsOpen)}>Controls</button><div className={`drive-hud-actions ${controlsOpen ? 'is-open' : ''}`}><span className="drive-hud-menu-route">{routeName(environment)}</span><span>{playerVehicle(vehicle).name}<span className="keyboard-hint"> · 1–9</span></span><button className="drive-hud-pause" onClick={() => {useGameStore.getState().toggleCameraMode(); useSettingsStore.getState().setSetting('camera', useGameStore.getState().cameraMode)}}>View: {camera}<span className="keyboard-hint"> · C</span></button><button className="drive-hud-pause" aria-expanded={shortcuts} onClick={() => setShortcuts(!shortcuts)}>Vehicles<span className="keyboard-hint"> · 1–9</span></button><button className="drive-hud-pause" onClick={requestHorn}>Horn<span className="keyboard-hint"> · H</span></button><button className="drive-hud-pause" onClick={() => {useSettingsStore.getState().setSetting('engineVolume', .5); requestAudioStart()}}>Enable sound</button><button className="drive-hud-pause mobile-pause" onClick={pause}>Pause</button><button className="drive-hud-mobile-settings" onClick={() => {setControlsOpen(false); window.dispatchEvent(new Event('wayfound-open-settings'))}}>Settings</button></div></div>
    {shortcuts && <div className="vehicle-shortcuts" aria-label="Switch vehicle">{PLAYER_VEHICLES.slice(0, 9).map((v, i) => <button key={v.name} aria-pressed={vehicle === i} onClick={() => {useSettingsStore.getState().setSetting('vehicle', i); setShortcuts(false)}}><kbd>{i + 1}</kbd> {v.name}</button>)}</div>}
    {nearbyPlace && <div className="drive-hud-objective" role="status">{nearbyPlace} {nearbyPlace.startsWith('Desert Market') && <button className="drive-hud-pause" onClick={() => { pause(); setShopOpen(true) }}>Enter shop</button>}</div>}
    {shopOpen && <ChunkBoundary onClose={() => { setShopOpen(false); useGameStore.getState().resume() }}><Suspense fallback={<div role="status" className="fixed inset-0 z-50 grid place-items-center bg-slate-950 text-white">Opening shop…</div>}><MarketPanel onClose={() => { setShopOpen(false); useGameStore.getState().resume() }} /></Suspense></ChunkBoundary>}
    {!relaxed && <div className="drive-hud-objective"><ObjectiveDisplay /></div>}
    <div className="drive-hud-dashboard">
      <div className="drive-hud-speed" aria-label={`${Math.round(Math.abs(speed))} kilometers per hour`}>{Math.round(Math.abs(speed))}<small>km/h{speed < 0 ? ' · R' : ''}</small></div>
      <div className="drive-hud-stat">{(distance / 1000).toFixed(2)}<small>kilometers</small></div>
      {!relaxed && <><div className="drive-hud-stat">{Math.round(integrity)}%<small>integrity</small></div><div className="drive-hud-stat">{Math.round(score).toLocaleString()}<small>score</small></div></>}
    </div>
  </div>
}
export default GameHUD
