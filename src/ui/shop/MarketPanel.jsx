import { useEffect, useRef, useState } from 'react'
import { PRODUCTS, restoreCart, updateCart } from './catalog'
import './market.css'

const KEY = 'wayfound-demo-cart-v1'
const ICONS = { tea: '☕', snack: '🥨', mango: '🥭', water: '💧' }
function loadCart() {
  try { return restoreCart(JSON.parse(localStorage.getItem(KEY) || '{}')) } catch { return {} }
}
export function MarketPanel({ onClose }) {
  const [cart, setCart] = useState(loadCart), [error, setError] = useState('')
  const panel = useRef(null), closeButton = useRef(null)
  useEffect(() => { const previous = document.activeElement; closeButton.current?.focus(); return () => previous?.focus?.() }, [])
  const change = (id, amount) => {
    const next = updateCart(cart, id, amount)
    setCart(next)
    try { localStorage.setItem(KEY, JSON.stringify(next)); setError('') } catch { setError('Cart could not be saved on this device.') }
  }
  return <div className="market-overlay" role="dialog" aria-modal="true" aria-labelledby="market-title" ref={panel} onPointerDown={event => { if (event.target === event.currentTarget) onClose() }} onKeyDown={event => {
    event.stopPropagation()
    if (event.key === 'Escape') { event.preventDefault(); onClose() }
    if (event.key === 'Tab') {
      const controls = [...panel.current.querySelectorAll('button:not(:disabled)')]
      if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1).focus() }
      else if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0].focus() }
    }
  }}>
    <div className="market-sheet">
      <header><div><h2 id="market-title">Desert Market</h2><p>A fictional roadside shop</p></div><button ref={closeButton} onClick={onClose} aria-label="Close shop">Close</button></header>
      <p className="market-note">Browse a demo catalogue and save a list on this device. Nothing can be purchased or delivered yet.</p>
      <ul>{PRODUCTS.map(product => <li key={product.id}><span className="market-icon" aria-hidden="true">{ICONS[product.id]}</span><div className="market-item"><strong>{product.name}</strong><small>{product.detail}</small></div><div className="market-quantity"><button onClick={() => change(product.id,-1)} disabled={!cart[product.id]} aria-label={`Remove one ${product.name}`}>−</button><span aria-label={`${cart[product.id] || 0} in list`}>{cart[product.id] || 0}</span><button onClick={() => change(product.id,1)} disabled={(cart[product.id] || 0) >= 20} aria-label={`Add one ${product.name}`}>+</button></div></li>)}</ul>
      <footer><span>{Object.values(cart).reduce((sum, n) => sum + n, 0)} items on your list</span></footer>
      {error && <p role="status">{error}</p>}
    </div>
  </div>
}
