import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import './results.css'
import { useGameStore } from '@/stores/useGameStore'

// Results screen shown when integrity reaches zero (endless) or a mission
// ends. Displays full run stats from the store. Restart begins a fresh run of
// the same mode; return-to-menu clears gameplay state.
export function ResultsScreen() {
  const roadFinds = useGameStore(s => s.roadFinds)
  const score = useGameStore((s) => s.score)
  const distanceMeters = useGameStore((s) => s.distanceMeters)
  const survivalTime = useGameStore((s) => s.survivalTime)
  const speedKmh = useGameStore((s) => s.topSpeed)
  const overtakes = useGameStore((s) => s.overtakes)
  const nearMisses = useGameStore((s) => s.nearMisses)
  const collisions = useGameStore((s) => s.collisions)
  const mode = useGameStore((s) => s.mode)
  const resultReason = useGameStore(s => s.resultReason)
  const missionComplete = useGameStore((s) => s.missionComplete)
  const startRun = useGameStore((s) => s.startRun)
  const returnToMenu = useGameStore((s) => s.returnToMenu)

  const dialog = useRef()
  useEffect(() => {
    const node = dialog.current
    const trapFocus = event => {
      if (event.key !== 'Tab') return
      const buttons = [...node.querySelectorAll('button')]
      const first = buttons[0], last = buttons.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    node.addEventListener('keydown', trapFocus)
    return () => node.removeEventListener('keydown', trapFocus)
  }, [])

  const metrics = [
    ['Score', Math.round(score).toLocaleString()],
    ['Time', `${Math.floor(survivalTime)} sec`],
    ['Top speed', `${Math.round(speedKmh)} km/h`],
    ['Overtakes', Math.round(overtakes)],
    ['Near misses', Math.round(nearMisses)],
    ['Collisions', Math.round(collisions)],
  ]

  return <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="results-title" className="results-overlay">
    <div className="results-sheet">
      <header className="results-header">
        <div><p className="results-status">{missionComplete ? 'MISSION COMPLETE' : 'DRIVE ENDED'}</p>
          <h1 id="results-title">{(distanceMeters / 1000).toFixed(2)} <span>km</span></h1>
          <p className="results-reason">{resultReason || (missionComplete ? 'All objectives finished' : mode === 'mission' ? 'Mission ended' : 'Vehicle destroyed')}</p>
        </div>
        <div className="results-actions">
          <Button autoFocus onClick={() => startRun(mode || 'endless')}>Drive again</Button>
          <Button variant="outline" onClick={returnToMenu}>Main menu</Button>
        </div>
      </header>
      <dl className="results-metrics">{metrics.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      <section className="results-finds" aria-labelledby="finds-title">
        <div className="results-finds-heading"><div><h2 id="finds-title">Road Finds</h2><p>Fictional sponsored signs from your drive</p></div><span>{roadFinds.length} {roadFinds.length === 1 ? 'find' : 'finds'}</span></div>
        {roadFinds.length ? <ol>{roadFinds.map(find => <li key={find.id}><span className="results-distance">{(find.distance / 1000).toFixed(2)} km</span><div><strong>{find.name}</strong><p>{find.tagline}</p></div></li>)}</ol> : <p className="results-empty">No signs recorded on this drive.</p>}
      </section>
    </div>
  </div>
}

export default ResultsScreen
