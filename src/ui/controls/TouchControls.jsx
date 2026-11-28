import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, CircleParking } from 'lucide-react'
import '../menus/experience.css'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { shouldShowTouchControls } from '@/game/input/inputMode'

// Pointer capture guarantees release when a finger leaves its control.
export function TouchControls() {
  const show = useSettingsStore(s => s.showTouchControls)
  const [pointers, setPointers] = useState({ coarse:false, fine:false })
  useEffect(() => {
    const coarse = window.matchMedia('(any-pointer: coarse)'), fine = window.matchMedia('(any-pointer: fine)')
    const update = () => setPointers({ coarse:coarse.matches, fine:fine.matches })
    update(); coarse.addEventListener('change', update); fine.addEventListener('change', update)
    return () => { coarse.removeEventListener('change', update); fine.removeEventListener('change', update) }
  }, [])
  const held = useRef(new Map())
  const send = (type, code) => window.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }))
  const release = pointerId => {
    const code = held.current.get(pointerId)
    if (!code) return
    held.current.delete(pointerId)
    if (![...held.current.values()].includes(code)) send('keyup', code)
  }
  useEffect(() => {
    const keys = held.current
    const reset = () => { for (const code of new Set(keys.values())) window.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true })); keys.clear() }
    window.addEventListener('blur', reset)
    return () => { window.removeEventListener('blur', reset); reset() }
  }, [])
  const control = (code, label, Icon) => <button key={code} type="button" aria-label={label} title={label} onPointerDown={event => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    held.current.set(event.pointerId, code); send('keydown', code)
  }} onPointerUp={event => release(event.pointerId)} onPointerCancel={event => release(event.pointerId)} onLostPointerCapture={event => release(event.pointerId)}><Icon aria-hidden="true" size={22} /></button>
  return <div className={`drive-touch ${shouldShowTouchControls({...pointers, requested:show}) ? 'is-requested' : ''}`} aria-label="Touch driving controls"><div className="drive-touch-group">{control('KeyA', 'Steer left', ArrowLeft)}{control('KeyD', 'Steer right', ArrowRight)}</div><div className="drive-touch-group">{control('Space', 'Handbrake', CircleParking)}{control('KeyS', 'Brake and reverse', ArrowDown)}{control('KeyW', 'Accelerate', ArrowUp)}</div></div>
}
