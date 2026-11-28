import { useEffect, useState } from 'react'
import { ROAD_POSITIONS, ROAD_END, mapPlayer, mapPoint } from '@/game/world/roadGrid'
import { FREE_ROAM_PLACES } from '@/game/world/freeRoamMotion'

export function RoadMap({ onClose }) {
  const [player, setPlayer] = useState(() => ({ ...mapPlayer }))
  useEffect(() => {
    const timer = setInterval(() => setPlayer({ ...mapPlayer }), 150)
    const key = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); onClose() } }
    window.addEventListener('keydown', key, true)
    return () => { clearInterval(timer); window.removeEventListener('keydown', key, true) }
  }, [onClose])
  const p = mapPoint(player.x, player.z)
  return <div className="road-map-overlay" onPointerDown={e => { if (e.target === e.currentTarget) onClose() }}>
    <section className="road-map-panel" role="dialog" aria-label="Road map"><header><strong>Road map</strong><button onClick={onClose}>Close</button></header>
      <svg viewBox="0 0 1000 1000" role="img" aria-label="Road grid, stops and your location">
        <rect width="1000" height="1000" fill="#263e35" />
        {ROAD_POSITIONS.map(n => { const a=mapPoint(n,-ROAD_END), b=mapPoint(n,ROAD_END), c=mapPoint(-ROAD_END,n), d=mapPoint(ROAD_END,n); return <g key={n} stroke="#d4cfb7" strokeWidth="12"><line x1={a.x} y1={a.y} x2={b.x} y2={b.y}/><line x1={c.x} y1={c.y} x2={d.x} y2={d.y}/></g> })}
        {FREE_ROAM_PLACES.map(stop => { const q=mapPoint(stop.x,stop.z); return <g key={stop.name}><circle cx={q.x} cy={q.y} r="12" fill="#eab765"/><text x={q.x+16} y={q.y-12} fontSize="25" fill="white">{stop.name}</text></g> })}
        <path d="M 0 -20 L 12 14 L 0 8 L -12 14 Z" transform={`translate(${p.x} ${p.y}) rotate(${player.heading*180/Math.PI})`} fill="#83dcff" />
      </svg>
    </section>
  </div>
}
