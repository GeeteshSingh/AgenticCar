import { PLAYER_VEHICLES } from '@/game/config/playerVehicles'
import { INDIAN_ROUTES } from '@/game/config/environmentConfig'
import { useEffect, useState } from 'react'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useGameStore } from '@/stores/useGameStore'
export function SettingsPanel() {
  const [open, setOpen] = useState(false)
  useEffect(() => { const show = () => { useGameStore.getState().pause(); setOpen(true) }; window.addEventListener('wayfound-open-settings', show); return () => window.removeEventListener('wayfound-open-settings', show) }, [])
  const settings = useSettingsStore()
  const phase = useGameStore(s => s.phase)
  const close = () => { setOpen(false); document.querySelector('canvas')?.focus() }
  function toggle() { if (open) close(); else { useGameStore.getState().pause(); setOpen(true) } }
  return <div className={`fixed right-4 top-4 z-40 ${['playing', 'paused'].includes(phase) ? 'settings-driving' : ''}`}>
    <button className="utility-button" onClick={toggle} aria-expanded={open}>Settings</button>
    {open && <section onKeyDown={e=>{e.stopPropagation();if(e.key==='Escape')close()}} className="utility-panel" aria-label="Driving settings">
      <div className="flex justify-between items-center"><h2 className="text-xl font-semibold">Your drive</h2><button onClick={close} aria-label="Close settings">✕</button></div>
      {settings.audioError && <p role="status">{settings.audioError}</p>}
      {settings.persistenceError && <p role="status">{settings.persistenceError}</p>}
      <p className="text-sm text-slate-400">Preferences save on this device. Resume driving when ready.</p>
      {Object.entries({environment:['countryside','forest','desert','coast','kashmir','thar_test'],time:['day','sunset','night','sunrise'],weather:['clear','fog','rain'],quality:['low','medium','high'],camera:['chase','hood','interior']}).map(([key, options])=><label key={key} className="grid grid-cols-2 items-center gap-4 capitalize">{key}<select value={settings[key]} onChange={e=>{settings.setSetting(key,e.target.value);if(key==='camera')useGameStore.setState({cameraMode:e.target.value})}}>{options.map(v=><option key={v} value={v}>{key === 'environment' ? INDIAN_ROUTES[v].name : v}</option>)}</select></label>)}
      <label>Vehicle (keys 1–9)<select aria-label="Vehicle" value={settings.vehicle} onChange={e=>settings.setSetting('vehicle', Number(e.target.value))}>{PLAYER_VEHICLES.slice(0, 9).map((v,i)=><option key={v.name} value={i}>{i+1}. {v.name}</option>)}{settings.vehicle === 9 && <option value={9}>Cheat supercar</option>}</select></label>
      <label>Steering sensitivity <input aria-label="Steering sensitivity" type="range" min="0.4" max="2" step="0.1" value={settings.sensitivity} onChange={e=>settings.setSetting('sensitivity',+e.target.value)}/></label>
      <label>Driving sound volume <input aria-label="Driving sound volume" type="range" min="0" max="1" step=".01" value={settings.engineVolume} onChange={e=>settings.setSetting('engineVolume',+e.target.value)}/></label>
      <label className="flex gap-3"><input type="checkbox" checked={settings.cruise} onChange={e=>settings.setSetting('cruise',e.target.checked)}/> Cruise assist</label>
      <label className="flex gap-3"><input type="checkbox" checked={settings.cycle} onChange={e=>settings.setSetting('cycle',e.target.checked)}/> Automatic day/night cycle</label>
      <p className="text-xs text-slate-400">W / ↑ accelerate · S / ↓ brake/reverse · A/D or ←/→ steer · Space handbrake · C camera · H horn · P radio · Esc pause</p>
    </section>}
  </div>
}
