import { Button } from '@/components/ui/button'
import { useGameStore } from '@/stores/useGameStore'
import '../menus/experience.css'

export function PauseMenu() {
  const resume = useGameStore(s => s.resume)
  const restart = useGameStore(s => s.startRun)
  const mode = useGameStore(s => s.mode)
  const menu = useGameStore(s => s.returnToMenu)
  return <section className="drive-pause" aria-labelledby="pause-title">
    <div className="drive-pause-content"><h1 id="pause-title">Take a breath.</h1><p>Your drive is paused. Continue whenever you’re ready.</p>
      <div className="drive-pause-actions"><Button className="drive-start" onClick={resume}>Resume driving</Button><Button variant="outline" onClick={() => restart(mode || 'relaxed')}>Restart drive</Button><Button variant="ghost" onClick={menu}>Return to main menu</Button></div>
      <p className="drive-pause-note">Settings and Radio remain available in the corners of the screen. Your radio keeps playing while you pause.</p>
    </div>
  </section>
}
export default PauseMenu
