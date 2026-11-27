import { INDIAN_ROUTES } from '@/game/config/environmentConfig'
import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ArrowRight, Wind, Route, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useGameStore } from '@/stores/useGameStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { MenuBackdrop } from '@/ui/menus/MenuBackdrop'
import './experience.css'

const environments = Object.entries(INDIAN_ROUTES).map(([id, route]) => [id, route.name])
const modes = [
  { id: 'relaxed', title: 'Free Drive', icon: Wind, description: 'Take the long way. Explore without traffic damage or objectives.' },
  { id: 'endless', title: 'Endless', icon: Route, description: 'Navigate traffic, build a score, and see how far you can go.' },
  { id: 'mission', title: 'Mission', icon: Trophy, description: 'Complete five driving objectives while keeping your car intact.' },
]

export function MainMenu() {
  const startRun = useGameStore(s => s.startRun)
  const quality = useSettingsStore(s => s.quality)
  const environment = useSettingsStore(s => s.environment)
  const setSetting = useSettingsStore(s => s.setSetting)
  const [mode, setMode] = useState('relaxed')
  const [about, setAbout] = useState(false)
  return <main className="drive-menu">
    <div className="drive-menu-scene" aria-hidden="true">
      <Canvas shadows={quality === 'high'} dpr={quality === 'low' ? 1 : [1, 1.5]} camera={{ position: [0, 4, 13], fov: 60 }} gl={{ antialias: true }}>
        <color attach="background" args={['#7db8f0']} /><fog attach="fog" args={['#bcd4ec', 230, 680]} /><MenuBackdrop />
      </Canvas>
    </div>
    <div className="drive-menu-shade" />
    <div className="drive-menu-content">
      <header className="drive-menu-header"><span>AgenticCar</span><button className="drive-text-button" onClick={() => setAbout(!about)} aria-expanded={about}>About</button></header>
      <section className="drive-menu-intro" aria-labelledby="drive-title">
        <h1 id="drive-title">A little further.<br />A little slower.</h1>
        <p>An open road and a moment to yourself. Explore India-inspired routes, tune the radio, and find your own pace.</p>
      </section>
      <section className="drive-menu-setup" aria-label="Set up your drive">
        <fieldset><legend>Your Indian route</legend><div className="drive-environments">{environments.map(([id, label]) => <button key={id} aria-pressed={environment === id} onClick={() => setSetting('environment', id)}>{label}</button>)}</div><p className="drive-route-description">{INDIAN_ROUTES[environment]?.region} — {INDIAN_ROUTES[environment]?.description}</p></fieldset>
        <fieldset><legend>Your drive</legend><div className="drive-modes">{modes.map(({id, title, icon: Icon, description}) => <button key={id} aria-pressed={mode === id} onClick={() => setMode(id)}><Icon size={18} aria-hidden="true" /><span><strong>{title}</strong><small>{description}</small></span></button>)}</div></fieldset>
        <Button className="drive-start" onClick={() => startRun(mode)}>Start {modes.find(m => m.id === mode).title.toLowerCase()}<ArrowRight aria-hidden="true" /></Button>
        <p className="drive-menu-hint">WASD or arrows to drive · C camera · Esc pause</p>
      </section>
      {about && <section className="drive-about" aria-label="About AgenticCar"><h2>Made for the road</h2><p>AgenticCar is an endless driving game built with React and Three.js. Routes are original procedural interpretations of Indian regions, not geographic replicas. Landscapes are generated in the browser; live radio comes from Radio Browser. Open Settings to adjust your drive, graphics, and sound.</p></section>}
      <footer className="drive-menu-footer"><span>Highway Objective</span><span>Choose a view. Enjoy the journey.</span></footer>
    </div>
  </main>
}
export default MainMenu
